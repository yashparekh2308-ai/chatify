import { useEffect } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { format } from "date-fns";
import { BanIcon, ShieldIcon, Trash2, UserCheckIcon } from "lucide-react";

const AdminUserList = () => {
  const { users, fetchAllUsers, isLoadingUsers, deleteUser, toggleUserBan } = useAdminStore();

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleDelete = (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUser(userId);
    }
  };

  if (isLoadingUsers) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Manage Users</h3>
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
        <h3 className="text-xl font-bold text-white">Manage Users</h3>
        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
          {users.length} Total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700/50 text-slate-400 text-sm uppercase">
              <th className="py-4 px-6 font-semibold">User</th>
              <th className="py-4 px-6 font-semibold">Joined At</th>
              <th className="py-4 px-6 font-semibold">Role</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-10 rounded-full object-cover border border-slate-600"
                    />
                    <div>
                      <p className="text-white font-medium">{user.fullName}</p>
                      <p className="text-slate-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-300">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider ${
                      user.role === "admin"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-slate-600/30 text-slate-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  {user.role !== "admin" && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleUserBan(user._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isBanned
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                        }`}
                        title={user.isBanned ? "Unban User" : "Ban User"}
                      >
                        {user.isBanned ? <UserCheckIcon className="size-5" /> : <BanIcon className="size-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  )}
                  {user.role === "admin" && (
                    <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                      <ShieldIcon className="size-4 text-purple-400" />
                      Protected
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserList;
