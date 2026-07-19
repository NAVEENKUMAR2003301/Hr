import { getErrorMessage } from "../../lib/utils";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";

export default function ExcelImportExport() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const res = await api.get("/employees/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employees-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err, "Export failed"));
    } finally {
      setExporting(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/employees/import", formData);
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (err) {
      setError(getErrorMessage(err, "Import failed"));
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "Export to Excel"}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import from Excel"}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm space-y-1">
          <p className="text-slate-700 dark:text-slate-300">
            Created <strong>{result.created}</strong>, updated <strong>{result.updated}</strong>
            {result.errors.length > 0 && (
              <>
                , <strong className="text-red-600">{result.errors.length} row(s) failed</strong>
              </>
            )}
            .
          </p>
          {result.errors.length > 0 && (
            <ul className="text-xs text-red-600 space-y-0.5">
              {result.errors.map((e, i) => (
                <li key={i}>
                  Row {e.row} ({e.employeeCode}): {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
