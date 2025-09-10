
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { meetingsInsertSchema } from "../../schemas";
import { MeetingGetOne } from "../../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; 
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { useState } from "react";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";
import { useRouter } from "next/navigation";



interface Props {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void; // this is a callback function that is called when the cancel button is clicked 
  initialValues?: MeetingGetOne;  
  // The initialValues is optional because we want to be able to create a new agent or edit an existing one - they are grabbed from the API endpoint (modules/agents/types.ts) NOT from the database (schema.ts)
}


  // This is the type of the data that is passed to the form - it is the same as the schema but with the default values set
type MeetingFormData = z.infer<typeof meetingsInsertSchema>;



/**
 * MeetingForm Component
 * 
 * A comprehensive form component for creating and editing meetings in the system.
 * This component handles both new meeting creation and existing meeting updates
 * through a unified interface with agent selection capabilities.
 * 
 * Features:
 * - Create new meetings or edit existing ones based on initialValues
 * - Agent selection through searchable dropdown with avatar display
 * - Integration with premium usage tracking for free tier limits
 * - Real-time agent search with debounced queries
 * - Inline agent creation through modal dialog
 * - Optimistic UI updates with cache invalidation
 * - Form validation using Zod schema
 * 
 * @param onSuccess - Callback function called with meeting ID upon successful submission
 * @param onCancel - Optional callback for cancel button (shows button only if provided)
 * @param initialValues - Optional meeting data for editing mode (triggers edit vs create)
 * 
 * @example
 * ```tsx
 * // Creating a new meeting
 * <MeetingForm 
 *   onSuccess={(id) => router.push(`/meetings/${id}`)}
 *   onCancel={() => setDialogOpen(false)}
 * />
 * 
 * // Editing existing meeting
 * <MeetingForm
 *   initialValues={meeting}
 *   onSuccess={() => toast.success("Meeting updated")}
 * />
 * ```
 * 
 * @remarks
 * - Form automatically detects edit mode when initialValues.id is present
 * - Agent search is optimized with pagination (100 items max)
 * - Cache invalidation ensures UI consistency across meeting lists and details
 * - Premium usage cache is updated on successful meeting creation
 * - Error handling includes premium limit enforcement (TODO: redirect to upgrade)
 */
export const MeetingForm = ({ onSuccess, onCancel, initialValues }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");

  /**
   * Query to fetch agents for the command select dropdown.
   * Uses search functionality to filter agents based on user input
   * for a better search experience than a standard dropdown.
   */
  const agents = useQuery(
    trpc.agents.getAllAgents.queryOptions({ 
      pageSize: 100,
      search: agentSearch, 
    })
  );

  /**
   * Mutation for creating new meetings.
   * 
   * On Success:
   * - Invalidates meeting list cache for immediate UI updates
   * - Invalidates premium usage cache to update free tier counts
   * - Calls onSuccess callback with new meeting ID
   * 
   * On Error:
   * - Displays error message via toast
   * - TODO: Check for FORBIDDEN error and redirect to upgrade page
   */
  const createMeeting = useMutation(
    trpc.meetings.createMeeting.mutationOptions({
      onSuccess: async (data) => { 
        await queryClient.invalidateQueries( 
          trpc.meetings.getAllMeetings.queryOptions({})
        );

        await queryClient.invalidateQueries(
          trpc.premium.getFreeUsage.queryOptions()
        );

        onSuccess?.(data.id);
      },
      onError: (error) => {
        toast.error(error.message);

        if (error.data?.code === "FORBIDDEN") {
          router.push("/upgrade");
        }
      },
    })
  );


  /**
   * Mutation for updating existing meetings.
   * 
   * On Success:
   * - Invalidates meeting list cache for immediate UI updates
   * - Invalidates specific meeting cache to refresh detail views
   * - Calls onSuccess callback
   * 
   * On Error:
   * - Displays error message via toast
   */
  const updateMeeting = useMutation(
    trpc.meetings.update.mutationOptions({
      onSuccess: async () => { 
        await queryClient.invalidateQueries(
          trpc.meetings.getAllMeetings.queryOptions({})
        );

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.meetings.getOneMeeting.queryOptions({ id: initialValues.id })
          );
        } 

        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  /**
   * Form configuration using react-hook-form with Zod validation.
   * Default values are populated from initialValues when editing.
   */
  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      agentId: initialValues?.agentId ?? "",
    },
  });

  // Determine if we're in edit mode based on presence of ID
  const isEdit = !!initialValues?.id; 

  // Track pending state across both mutations
  const isPending = createMeeting.isPending || updateMeeting.isPending; 

  /**
   * Form submission handler that routes to appropriate mutation
   * based on edit mode state.
   */
  const onSubmit = (values: MeetingFormData) => {
    if (isEdit) { 
      updateMeeting.mutate({
        ...values,
        id: initialValues.id,
      }); 
    } else {
      createMeeting.mutate(values);
    }
  };

  return (
    <>
      <NewAgentDialog
        open={openNewAgentDialog}
        onOpenChange={setOpenNewAgentDialog}
      />
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Math consultation" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="agentId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent</FormLabel>
              <FormControl>
                <CommandSelect  
                  options={(agents.data?.items ?? []).map((agent) => ({
                    id: agent.id,
                    value: agent.id,
                    children: (
                      <div className="flex items-center gap-x-2">
                        <GeneratedAvatar 
                          seed={agent.name}
                          variant="botttsNeutral"
                          className="size-6 border"
                        />
                        <span>{agent.name}</span>
                      </div>
                    )
                  }))}
                  onSelect={field.onChange}
                  value={field.value}
                  placeholder="Search for an agent"   
                  onSearch={setAgentSearch}
                />
              </FormControl>
              <FormDescription> 
                Not seeing the agent you want? {""}
                <button
                  type="button"
                  onClick={() => setOpenNewAgentDialog(true)}
                  className="text-blue-500 hover:underline"
                >
                  Create a new agent
                </button>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={() => onCancel()}
            >
              Cancel
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
};
