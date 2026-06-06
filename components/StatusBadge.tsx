import clsx from "clsx";

const MAP = {
  pending:   { label: "Pending",   cls: "bg-yellow-100 text-yellow-800" },
  approved:  { label: "Approved",  cls: "bg-green-100 text-green-800"   },
  modified:  { label: "Modified",  cls: "bg-blue-100 text-blue-800"     },
  rejected:  { label: "Rejected",  cls: "bg-red-100 text-red-800"       },
  running:   { label: "Running",   cls: "bg-purple-100 text-purple-800" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-800"   },
  failed:    { label: "Failed",    cls: "bg-red-100 text-red-800"       },
  cron:          { label: "Scheduled",   cls: "bg-gray-100 text-gray-700"    },
  manual:        { label: "Manual",      cls: "bg-blue-100 text-blue-800"    },
  "data-change": { label: "Data Change", cls: "bg-orange-100 text-orange-800"},
} as const;

type Status = keyof typeof MAP;

export default function StatusBadge({ status }: { status: string }) {
  const entry = MAP[status as Status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-semibold", entry.cls)}>
      {entry.label}
    </span>
  );
}
