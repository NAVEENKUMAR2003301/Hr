import { useState } from "react";
import Modal from "../../components/Modal";
import { getErrorMessage } from "../../lib/utils";

// A plain, freely-editable textarea rather than a rich-text/PDF editor — HR can
// rewrite any section before it's emailed; the backend just wraps whatever text
// comes through in the same styled HTML shell used for the fixed templates.
export default function EditLetterModal({ title, defaultText, onSend, isSending, onClose }) {
  const [text, setText] = useState(defaultText);
  const [error, setError] = useState(null);

  async function handleSend() {
    setError(null);
    try {
      await onSend(text);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send"));
    }
  }

  return (
    <Modal title={title} onClose={onClose} maxWidthClassName="max-w-2xl">
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Edit the letter below before sending — it's emailed exactly as written here.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !text.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
