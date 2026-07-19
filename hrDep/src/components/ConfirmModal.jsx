import Modal from "./Modal";

export default function ConfirmModal({ title = "Are you sure?", message, confirmLabel = "Delete", onConfirm, onCancel, pending }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
