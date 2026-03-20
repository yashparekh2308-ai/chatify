import { useEffect, useMemo, useState } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { Trash2 } from "lucide-react";

function AdminStatusesList() {
  const { statuses, fetchAllStatuses, isLoadingStatuses, deleteStatus } = useAdminStore();
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchAllStatuses();
  }, [fetchAllStatuses]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return statuses;
    return statuses.filter((s) => {
      const name = s.userId?.fullName || "";
      const email = s.userId?.email || "";
      const text = s.text || "";
      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        text.toLowerCase().includes(query)
      );
    });
  }, [q, statuses]);

  if (isLoadingStatuses) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Statuses</h3>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-white">Statuses</h3>
          <span className="bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium">
            {filtered.length} Shown / {statuses.length} Total
          </span>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by user, email, or text…"
          className="input input-bordered bg-slate-900/40 border-slate-700 text-slate-200 w-full md:max-w-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700/50 text-slate-400 text-sm uppercase">
              <th className="py-4 px-6 font-semibold">User</th>
              <th className="py-4 px-6 font-semibold">Content</th>
              <th className="py-4 px-6 font-semibold">Expires</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.userId?.profilePic || "/avatar.png"}
                      alt={s.userId?.fullName || "User"}
                      className="size-10 rounded-full object-cover border border-slate-600"
                    />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{s.userId?.fullName || "Unknown"}</p>
                      <p className="text-slate-400 text-sm truncate">{s.userId?.email || ""}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-300">
                  <div className="flex items-center gap-3">
                    {s.image ? (
                      <a href={s.image} target="_blank" rel="noreferrer" className="shrink-0">
                        <img
                          src={s.image}
                          alt="Status"
                          className="size-12 rounded-lg object-cover border border-slate-700"
                        />
                      </a>
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate max-w-[520px]">{s.text || (s.image ? "Image status" : "(empty)")}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(s.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-300">
                  {s.expiresAt ? new Date(s.expiresAt).toLocaleString() : "—"}
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this status?")) deleteStatus(s._id);
                    }}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                    title="Delete Status"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">
                  No statuses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminStatusesList;

