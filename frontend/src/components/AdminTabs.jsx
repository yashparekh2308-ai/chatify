const TABS = [
  { id: "users", label: "Users" },
  { id: "groups", label: "Groups" },
  { id: "calls", label: "Calls" },
  { id: "statuses", label: "Statuses" },
];

function AdminTabs({ active, onChange }) {
  return (
    <div className="tabs tabs-boxed bg-slate-800/40 border border-slate-700/50 rounded-xl p-2 mb-6 w-fit">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`tab ${active === t.id ? "bg-purple-500/20 text-purple-300" : "text-slate-400"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default AdminTabs;

