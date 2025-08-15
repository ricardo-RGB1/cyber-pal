import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm } from "./meeting-form";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


/**
 * Dialog component for creating a new meeting.
 * Renders a responsive dialog with a meeting form and handles navigation after creation.
 */
export const NewMeetingDialog = ({ open, onOpenChange }: Props) => {
  const router = useRouter();

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New Meeting"
      description="Create a new meeting with an agent"
    >
      <MeetingForm
        onSuccess={(id) => {
          // Close dialog and navigate to the newly created meeting
          onOpenChange(false);
          router.push(`/meetings/${id}`);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};
