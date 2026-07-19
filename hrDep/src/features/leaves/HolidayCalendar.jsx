import { getErrorMessage } from "../../lib/utils";
import { useMemo, useState } from "react";
import { useHolidays, useCreateHoliday, useDeleteHoliday } from "../../api/useHolidays";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Builds "YYYY-MM-DD" from the date's LOCAL components — toISOString() converts to
// UTC first, which shifts the date back a day in any timezone ahead of UTC (e.g. IST,
// which this holiday list is for), misaligning holidays with their calendar cells.
function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Sat/Sun are the fixed 2-day week off — matches the company's official holiday sheet.
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export default function HolidayCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [error, setError] = useState(null);

  const { data: holidays } = useHolidays({ year });
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const holidayByDate = useMemo(() => {
    const map = new Map();
    holidays?.forEach((h) => map.set(h.date.slice(0, 10), h));
    return map;
  }, [holidays]);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function changeMonth(delta) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  async function handleAddHoliday(e) {
    e.preventDefault();
    setError(null);
    if (!newHoliday.date || !newHoliday.name.trim()) {
      setError("Date and name are required");
      return;
    }
    try {
      await createHoliday.mutateAsync(newHoliday);
      setNewHoliday({ date: "", name: "" });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add holiday"));
    }
  }

  const monthHolidays = holidays?.filter((h) => new Date(h.date).getMonth() === month) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeMonth(-1)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ←
          </button>
          <h2 className="font-semibold text-slate-900 dark:text-slate-50 w-40 text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" /> Week off
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-200 dark:bg-rose-500/30 inline-block" /> Official holiday
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const iso = toIsoDate(date);
            const holiday = holidayByDate.get(iso);
            const weekend = isWeekend(date);
            const isToday = iso === toIsoDate(today);

            return (
              <div
                key={i}
                className={`group relative min-h-16 rounded-lg border p-1.5 text-left text-xs ${
                  holiday
                    ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-500/10"
                    : weekend
                    ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60"
                    : "border-slate-100 dark:border-slate-800"
                } ${isToday ? "ring-2 ring-indigo-500" : ""}`}
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">{date.getDate()}</span>
                {weekend && !holiday && <p className="mt-1 text-[10px] text-slate-400">Week off</p>}
                {holiday && (
                  <>
                    <p className="mt-1 text-[10px] leading-tight text-rose-700 dark:text-rose-300">{holiday.name}</p>
                    <button
                      onClick={() => deleteHoliday.mutate(holiday.id)}
                      className="hidden group-hover:block absolute top-1 right-1 text-rose-400 hover:text-rose-600 text-[10px]"
                      title="Remove holiday"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Official holidays this month ({monthHolidays.length})
        </p>
        {monthHolidays.length === 0 && <p className="text-sm text-slate-400 mb-3">None marked yet.</p>}

        <form onSubmit={handleAddHoliday} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-slate-500">Date</label>
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className="block rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Holiday name</label>
            <input
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              placeholder="e.g. Diwali"
              className="block rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={createHoliday.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Add holiday
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
