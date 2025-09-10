import { AgentGetOne } from "@/modules/agents/types";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
  // The initialValues is optional because we want to be able to create a new agent or edit an existing one - they are grabbed from the API endpoint (modules/agents/types.ts) NOT from the database (schema.ts)
}

// This is the type of the data that is passed to the form - it is the same as the schema but with the default values set
type AgentFormData = z.infer<typeof agentsInsertSchema>;

/**
 * AgentForm Component
 *
 * A reusable form component for creating and editing AI agents. This component handles
 * both creation of new agents and editing of existing agents based on whether initial
 * values are provided.
 *
 * Features:
 * - Dual-mode operation: create new agents or edit existing ones
 * - Real-time avatar preview based on agent name
 * - Form validation using Zod schema
 * - Optimistic UI updates with cache invalidation
 * - Error handling with toast notifications
 * - Loading states during mutations
 *
 * The component uses tRPC mutations to interact with the backend and automatically
 * invalidates relevant queries to keep the UI in sync. For new agents, it also
 * invalidates the premium usage cache to update free tier limits.
 *
 * @param onSuccess - Optional callback fired after successful creation/update
 * @param onCancel - Optional callback for cancel button (if provided, shows cancel button)
 * @param initialValues - Optional agent data for editing mode (presence determines create vs edit)
 *
 * @example
 * ```tsx
 * // Creating a new agent
 * <AgentForm
 *   onSuccess={() => navigate('/agents')}
 *   onCancel={() => setShowForm(false)}
 * />
 *
 * // Editing existing agent
 * <AgentForm
 *   initialValues={existingAgent}
 *   onSuccess={() => setEditMode(false)}
 * />
 * ```
 */
export const AgentForm = ({ onSuccess, onCancel, initialValues }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  
  /**
   * Mutation for updating existing agents.
   * 
   * On Success:
   * - Invalidates agents list cache for immediate UI updates
   * - Invalidates agent details cache if editing existing agent
   * - Calls onSuccess callback
   * 
   * On Error:
   * - Displays error message via toast
   */
  const updateAgent = useMutation(
    trpc.agents.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getAllAgents.queryOptions({})
        );

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.agents.getOneAgent.queryOptions({ id: initialValues.id })
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
   * Mutation for creating new agents.
   * 
   * On Success:
   * - Invalidates agents list cache for immediate UI updates
   * - Invalidates premium usage cache to update free tier counts
   * - Calls onSuccess callback
   * 
   * On Error:
   * - Displays error message via toast
   * - Redirects to upgrade page if FORBIDDEN (premium limit reached)
   */
  const createAgent = useMutation(
    trpc.agents.createAgent.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getAllAgents.queryOptions({})
        );
        await queryClient.invalidateQueries(
          trpc.premium.getFreeUsage.queryOptions()
        );

        onSuccess?.();
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
   * Form configuration using react-hook-form with Zod validation.
   * Default values are populated from initialValues when editing.
   */
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
    },
  });

  // If the initialValues has an id (a truthy value), then we are editing an existing agent
  const isEdit = !!initialValues?.id;

  // This is to check if the agent is being created or updated
  const isPending = createAgent.isPending || updateAgent.isPending;

  const onSubmit = (values: AgentFormData) => {
    if (isEdit) {
      updateAgent.mutate({
        // This is to update an existing agent when the form is submitted
        ...values,
        id: initialValues.id,
      });
    } else {
      createAgent.mutate(values); // This is to create a new agent when the form is submitted
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GeneratedAvatar
          seed={form.watch("name")}
          variant="botttsNeutral"
          className="border size-16"
        />
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Math tutor" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="instructions"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="You are a helpful math tutor. Explain concepts clearly and provide step-by-step solutions."
                />
              </FormControl>
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
  );
};
