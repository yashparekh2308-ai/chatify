import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

function BlockedUsersModal() {
  const { blockedUsers, getBlockedUsers, unblockUser } = useChatStore();

  useEffect(() => {
    getBlockedUsers();
  }, [getBlockedUsers]);

  return (
    <dialog id="blocked_users_modal" className="modal">
      <div className="modal-box bg-slate-900 border border-slate-700/60 max-w-sm rounded-xl">
        <h3 className="font-bold text-lg text-slate-200 mb-4">Blocked Users</h3>
        
        {blockedUsers.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">You haven't blocked any users yet.</p>
        ) : (
          <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {blockedUsers.map((user) => (
              <li key={user._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="w-10 h-10 rounded-full bg-slate-800">
                      <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                    </div>
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{user.fullName}</span>
                </div>
                <button
                  onClick={() => unblockUser(user._id)}
                  className="btn btn-xs bg-slate-800 text-cyan-400 hover:bg-cyan-500 hover:text-white border-none transition-colors"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-action mt-6">
          <form method="dialog">
            <button className="btn btn-sm btn-ghost hover:bg-slate-800 text-slate-300">Close</button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

export default BlockedUsersModal;
