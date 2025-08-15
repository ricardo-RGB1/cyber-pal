
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



interface Props {
  onSuccess?: (id: string) => void;
  onCancel?: () => void; // this is a callback function that is called when the cancel button is clicked 
  initialValues?: MeetingGetOne;  
  // The initialValues is optional because we want to be able to create a new agent or edit an existing one - they are grabbed from the API endpoint (modules/agents/types.ts) NOT from the database (schema.ts)
}


  // This is the type of the data that is passed to the form - it is the same as the schema but with the default values set
type MeetingFormData = z.infer<typeof meetingsInsertSchema>;



export const MeetingForm = ({ onSuccess, onCancel, initialValues }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false); // This is the state to open the command select dialog 
  const [agentSearch, setAgentSearch] = useState(""); // This is the search string for the agents 

  // Query to fetch agents for the command select dropdown
  // Uses search functionality to filter agents based on user input
  //  * This is basically a better search experience than using a dropdow Select because it allows you to search for agents by name *  
  const agents = useQuery(
    trpc.agents.getAllAgents.queryOptions({ 
      pageSize: 100,
      search: agentSearch, 
    })
  );


    // This is the mutation to create a meeting 
  const createMeeting = useMutation(
    trpc.meetings.createMeeting.mutationOptions({

      onSuccess: async (data) => { 
        await queryClient.invalidateQueries( 
          trpc.meetings.getAllMeetings.queryOptions({})
        ); // This is to invalidate the cache of the meetings LIST so that the new meeting is displayed immediately 

        if (initialValues?.id) {
          await queryClient.invalidateQueries( 
            trpc.meetings.getOneMeeting.queryOptions({ id: initialValues.id })
          );
        } // This is to invalidate the cache of the meeting DETAILS so that the new meeting is displayed immediately 

        onSuccess?.(data.id); // This is to call the onSuccess callback if it is provided 
      },
      onError: (error) => {
        toast.error(error.message);

        // TODO: Check if error code is 'FORBIDDEN' and if so, redirect to /upgrade
      },
    })
  );

// This is the mutation to update a meeting 
  const updateMeeting = useMutation(
    trpc.meetings.update.mutationOptions({
      onSuccess: async (data) => { 
        await queryClient.invalidateQueries(
          trpc.meetings.getAllMeetings.queryOptions({})
        ); // This is to invalidate the cache of the meetings LIST so that the new meeting is displayed immediately 

        // This is to invalidate the cache of the meeting DETAILS so that the new meeting is displayed immediately 
        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.meetings.getOneMeeting.queryOptions({ id: initialValues.id })
          );
        } 

       // TODO: Invalidate free tier usage 

        onSuccess?.(data.id); 
      },
      onError: (error) => {
        toast.error(error.message);

        // TODO: Check if error code is 'FORBIDDEN' and if so, redirect to /upgrade
      },
    })
  );

  // This is the form for the meeting  - the agentId is the id of the agent that is selected from the command select dropdown 
  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      agentId: initialValues?.agentId ?? "",
    },
  });

  // If the initialValues has an id (a truthy value), then we are editing an existing meeting
  const isEdit = !!initialValues?.id; 

  // This is to check if the meeting is being created or updated 
  const isPending = createMeeting.isPending || updateMeeting.isPending; 



  const onSubmit = (values: MeetingFormData) => {
    if (isEdit) { 
      updateMeeting.mutate({ // This is to update an existing meeting when the form is submitted 
        ...values,
        id: initialValues.id,
      }); 
    } else {
      createMeeting.mutate(values); // This is to create a new meeting when the form is submitted 
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
          {onCancel && ( // This is to show the cancel button if the onCancel prop is provided 
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
