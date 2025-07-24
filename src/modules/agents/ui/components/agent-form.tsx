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



interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
  // The initialValues is optional because we want to be able to create a new agent or edit an existing one - they are grabbed from the API endpoint (modules/agents/types.ts) NOT from the database (schema.ts)
}


  // This is the type of the data that is passed to the form - it is the same as the schema but with the default values set
type AgentFormData = z.infer<typeof agentsInsertSchema>;

export const AgentForm = ({ onSuccess, onCancel, initialValues }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();


  // This is the mutation to create an agent 
  const createAgent = useMutation(
    trpc.agents.createAgent.mutationOptions({
      onSuccess: async () => { 
        await queryClient.invalidateQueries(
          trpc.agents.getAllAgents.queryOptions()
        ); // This is to invalidate the cache of the agents LIST so that the new agent is displayed immediately 

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.agents.getOneAgent.queryOptions({ id: initialValues.id })
          );
        } // This is to invalidate the cache of the agent DETAILS so that the new agent is displayed immediately 

        onSuccess?.(); // This is to call the onSuccess callback if it is provided 
      },
      onError: (error) => {
        toast.error(error.message);

        // TODO: Check if error code is 'FORBIDDEN' and if so, redirect to /upgrade
      },
    })
  );

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
    },
  });

  // If the initialValues has an id (a truthy value), then we are editing an existing agent
  const isEdit = !!initialValues?.id; 
  const isPending = createAgent.isPending;

  const onSubmit = (values: AgentFormData) => {
    if (isEdit) {
      console.log("TODO: Update agent");
    } else {
      createAgent.mutate(values);
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
