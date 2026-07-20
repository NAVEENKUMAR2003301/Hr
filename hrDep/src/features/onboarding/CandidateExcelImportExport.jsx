import { getErrorMessage } from "../../lib/utils";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";

// Mirrors hrDep/src/features/employees/ExcelImportExport.jsx — same pattern, but for
// bulk-adding candidates to onboarding instead of updating existing employees.
// Export also doubles as the downloadable template (header row only, if no
// candidates exist yet) so HR knows the exact column names the import expects.
export default function CandidateExcelImportExport() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const res = await api.get("/employees/candidates/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidates-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      const res = await api.post("/employees/candidates/import", formData);
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
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
          {exporting ? "Downloading…" : "Download template / export"}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {importing ? "Uploading…" : "Upload Excel sheet"}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm space-y-1">
          <p className="text-slate-700 dark:text-slate-300">
            Added <strong>{result.created}</strong> candidate{result.created === 1 ? "" : "s"}
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
                  Row {e.row} ({e.name}): {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
