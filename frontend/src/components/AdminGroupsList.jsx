import { useEffect } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { Trash2 } from "lucide-react";

function AdminGroupsList() {
  const { groups, fetchAllGroups, isLoadingGroups, deleteGroup } = useAdminStore();

  useEffect(() => {
    fetchAllGroups();
  }, [fetchAllGroups]);

  if (isLoadingGroups) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Manage Groups</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Manage Groups</h3>
        <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
          {groups.length} Total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700/50 text-slate-400 text-sm uppercase">
              <th className="py-4 px-6 font-semibold">Group</th>
              <th className="py-4 px-6 font-semibold">Members</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr
                key={g._id}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={g.groupPic || "/avatar.png"}
                      alt={g.name}
                      className="size-10 rounded-full object-cover border border-slate-600"
                    />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{g.name}</p>
                      <p className="text-slate-400 text-sm truncate">{g._id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-300">{g.members?.length || 0}</td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this group and all its messages?")) deleteGroup(g._id);
                    }}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                    title="Delete Group"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </td>
              </tr>
            ))}

            {groups.length === 0 && (
              <tr>
                <td colSpan="3" className="py-8 text-center text-slate-400">
                  No groups found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminGroupsList;

