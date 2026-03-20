import { useEffect } from "react";
import { useAdminStore } from "../store/useAdminStore";

function AdminCallsList() {
  const { calls, fetchAllCalls, isLoadingCalls } = useAdminStore();

  useEffect(() => {
    fetchAllCalls();
  }, [fetchAllCalls]);

  if (isLoadingCalls) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Call Logs</h3>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Call Logs</h3>
        <span className="bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium">
          {calls.length} Total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700/50 text-slate-400 text-sm uppercase">
              <th className="py-4 px-6 font-semibold">Caller</th>
              <th className="py-4 px-6 font-semibold">Receiver</th>
              <th className="py-4 px-6 font-semibold">Type</th>
              <th className="py-4 px-6 font-semibold">Status</th>
              <th className="py-4 px-6 font-semibold">Duration</th>
              <th className="py-4 px-6 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="py-4 px-6 text-slate-200">{c.callerId?.fullName || "Unknown"}</td>
                <td className="py-4 px-6 text-slate-200">{c.receiverId?.fullName || "Unknown"}</td>
                <td className="py-4 px-6 text-slate-300">{c.type}</td>
                <td className="py-4 px-6 text-slate-300">{c.status}</td>
                <td className="py-4 px-6 text-slate-300">{c.duration || 0}s</td>
                <td className="py-4 px-6 text-slate-400">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {calls.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  No calls found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminCallsList;

