import { JSX, useState } from "react"; 
import { Button } from "@/components/ui/button"; 
import { ResponsiveDialog } from "@/components/responsive-dialog";  



/**
 * useConfirm is a custom React hook that provides a reusable confirmation dialog.
 * 
 * This hook is useful when you want to ask the user to confirm an action (such as deleting an item)
 * and wait for their response before proceeding. It returns two things:
 * 
 *   1. A React component (ConfirmDialog) that you render somewhere in your component tree.
 *   2. A function (confirm) that, when called, opens the dialog and returns a Promise that resolves
 *      to true (if the user confirms) or false (if the user cancels).
 * 
 * Usage Example:
 * 
 *   const [ConfirmDialog, confirm] = useConfirm("Delete item", "Are you sure you want to delete this?");
 *   
 *   // In your component JSX:
 *   <ConfirmDialog />
 * 
 *   // When you want to ask for confirmation:
 *   const handleDelete = async () => {
 *     const confirmed = await confirm();
 *     if (confirmed) {
 *       // proceed with deletion
 *     }
 *   }
 * 
 * @param title - The title text to display in the confirmation dialog.
 * @param description - The description or message to display in the dialog.
 * @returns [ConfirmDialog, confirm] tuple:
 *   - ConfirmDialog: a React component to render the dialog UI.
 *   - confirm: a function that returns a Promise<boolean> resolving to true if confirmed, false if cancelled.
 */
export const useConfirm = (
    title: string, 
    description: string, 
): [() => JSX.Element, () => Promise<boolean>] => {

    // Holds the current pending confirmation promise, or null if no dialog is open
    const [promise, setPromise] = useState<{
        resolve: (value: boolean) => void; 
    } | null>(null);  

    /**
     * Call this function to open the confirmation dialog.
     * Returns a Promise that resolves to true (if user confirms) or false (if user cancels).
     */
    const confirm = () => {
        return new Promise<boolean>((resolve) => {
            setPromise({ resolve }); 
        }); 
    }; 

    /**
     * Closes the dialog and clears the pending promise.
     */
    const handleClose = () => {
        setPromise(null); 
    }

    /**
     * Called when the user clicks "Confirm".
     * Resolves the promise with true and closes the dialog.
     */
    const handleConfirm = () => {
        promise?.resolve(true); 
        handleClose(); 
    }

    /**
     * Called when the user clicks "Cancel".
     * Resolves the promise with false and closes the dialog.
     */
    const handleCancel = () => {
        promise?.resolve(false); 
        handleClose(); 
    }

    /**
     * The confirmation dialog component.
     * Render this in your component tree (usually once per page/component).
     */
    const ConfirmDialog = () => ( 
        <ResponsiveDialog
            open={promise !== null}
            onOpenChange={handleClose} 
            title={title} 
            description={description}
        > 
            <div className='pt-4 w-full flex flex-col-reverse gap-y-2 lg:flex-row gap-x-2 items-center justify-end'>
                <Button variant='outline' onClick={handleCancel} className='w-full lg:w-auto'>
                    Cancel
                </Button>
                <Button onClick={handleConfirm} className='w-full lg:w-auto'>
                    Confirm
                </Button>
            </div>
        </ResponsiveDialog>
    ); 

    // Return the dialog component and the confirm function
    return [ConfirmDialog, confirm]; 
}