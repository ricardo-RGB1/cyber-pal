import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm } from "./meeting-form";
import { MeetingGetOne } from "@/modules/meetings/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: MeetingGetOne;
}



/**
 * Dialog component for updating an existing meeting.
 * Renders a responsive dialog with a meeting form pre-populated with initial values.
 */
export const UpdateMeetingDialog = ({ open, onOpenChange, initialValues }: Props) => {

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Update Meeting"
      description="Edit the meeting details"
    >
      <MeetingForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
