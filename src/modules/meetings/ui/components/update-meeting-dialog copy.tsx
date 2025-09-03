import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm } from "./meeting-form";
import { useRouter } from "next/navigation";
import { MeetingGetOne } from "@/modules/meetings/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: MeetingGetOne;
}


/**
 * Dialog component for updating a meeting.
 * Renders a responsive dialog with a meeting form and handles navigation after update.
 */
export const UpdateMeetingDialog = ({ open, onOpenChange }: Props) => {
  const router = useRouter();

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Update Meeting"
      description="Update the meeting with an agent"
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
