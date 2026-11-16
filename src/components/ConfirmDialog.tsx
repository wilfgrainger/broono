import { useImperativeHandle, useRef, type Ref } from 'react'

export interface ConfirmDialogHandle {
    open: () => void
}

interface ConfirmDialogProps {
    ref: Ref<ConfirmDialogHandle>
    title: string
    description: string
    confirmLabel: string
    cancelLabel?: string
    onConfirm: () => void
}

/**
 * Native modal confirmation for destructive actions. The browser supplies the
 * focus trap, Esc / back-gesture dismissal and focus return; focus starts on
 * the safe action, and only an explicit press of the confirm button confirms.
 */
export default function ConfirmDialog({ ref, title, description, confirmLabel, cancelLabel = 'Cancel', onConfirm }: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useImperativeHandle(ref, () => ({
        open: () => dialogRef.current?.showModal(),
    }), [])

    const handleClose = () => {
        const dialog = dialogRef.current
        if (!dialog) return

        // Esc and the back gesture close without a value, and browsers differ on
        // whether they clear the previous one, so reset it every time.
        const confirmed = dialog.returnValue === 'confirm'
        dialog.returnValue = ''
        if (confirmed) onConfirm()
    }

    return (
        <dialog ref={dialogRef} className="confirm-dialog" aria-label={title} onClose={handleClose}>
            <h2>{title}</h2>
            <p>{description}</p>
            <form method="dialog">
                <button value="cancel" autoFocus>{cancelLabel}</button>
                <button value="confirm">{confirmLabel}</button>
            </form>
        </dialog>
    )
}
