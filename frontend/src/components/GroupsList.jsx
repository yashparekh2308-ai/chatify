import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import toast from "react-hot-toast";

function GroupsList({ searchQuery = "" }) {
  const {
    getMyGroups,
    groups,
    isUsersLoading,
    setSelectedChat,
    getAllContacts,
    allContacts,
    createGroup,
    groupInvites,
    getGroupInvites,
    sendGroupInvite,
    acceptGroupInvite,
    declineGroupInvite,
  } = useChatStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [groupPic, setGroupPic] = useState(null);
  const fileInputRef = useRef(null);
  const [inviteModalForGroup, setInviteModalForGroup] = useState(null);
  const [inviteToUserId, setInviteToUserId] = useState("");

  useEffect(() => {
    getMyGroups();
    getGroupInvites();
  }, [getMyGroups, getGroupInvites]);

  useEffect(() => {
    if (isModalOpen) getAllContacts();
  }, [isModalOpen, getAllContacts]);

  const toggleMember = (id) => {
    setSelectedMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return toast.error("Group name is required");
    if (selectedMemberIds.length < 2) return toast.error("Select at least 2 members");

    const created = await createGroup({
      name: groupName.trim(),
      memberIds: selectedMemberIds,
      groupPic,
    });

    if (!created) return;

    setIsModalOpen(false);
    setGroupName("");
    setSelectedMemberIds([]);
    setGroupPic(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setSelectedChat({
      type: "group",
      _id: created._id,
      name: created.name,
      groupPic: created.groupPic,
    });
  };

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      <div className="flex justify-end mb-2">
        <button
          className="btn btn-sm bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/20"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          Create group
        </button>
      </div>

      {/* Pending invitations for me */}
      {groupInvites.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-semibold text-slate-300">Group invitations</h4>
          {groupInvites.map((inv) => (
            <div
              key={inv._id}
              className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="avatar">
                  <div className="size-8 rounded-full">
                    <img src={inv.groupPic || "/avatar.png"} alt={inv.groupName} />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-slate-200 text-sm truncate">{inv.groupName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    Invited by {inv.fromUser?.fullName || "Someone"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  className="btn btn-xs bg-cyan-600 text-white hover:bg-cyan-700"
                  onClick={() => acceptGroupInvite(inv._id)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn btn-xs bg-slate-700 text-slate-200 hover:bg-slate-600"
                  onClick={() => declineGroupInvite(inv._id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-slate-900 border border-slate-700/60">
            <h3 className="font-semibold text-slate-200 text-lg">Create group</h3>

            <div className="mt-4 space-y-3">
              <input
                className="input w-full bg-slate-800/60 border border-slate-700/60 text-slate-100"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />

              <div>
                <label className="text-sm text-slate-300">Group photo (optional)</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="file-input file-input-sm w-full bg-slate-800/60 border border-slate-700/60 text-slate-100"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => setGroupPic(reader.result);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-300 mb-2">Select members</p>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {allContacts.map((c) => (
                    <label
                      key={c._id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 cursor-pointer hover:bg-slate-800/60"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedMemberIds.includes(c._id)}
                        onChange={() => toggleMember(c._id)}
                      />
                      <div className="avatar">
                        <div className="size-9 rounded-full">
                          <img src={c.profilePic || "/avatar.png"} alt={c.fullName} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-200 truncate">{c.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">{c.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost text-slate-300"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} />
        </div>
      )}

      {groups.length === 0 ? <NoChatsFound /> : null}

      {groups
        .filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((group) => (
        <div
          key={group._id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() =>
            setSelectedChat({
              type: "group",
              _id: group._id,
              name: group.name,
              groupPic: group.groupPic,
            })
          }
        >
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-12 rounded-full">
                <img src={group.groupPic || "/avatar.png"} alt={group.name} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <h4 className="text-slate-200 font-medium truncate">{group.name}</h4>
                {group.lastMessageAt && (
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(group.lastMessageAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center gap-2 mt-1">
                <p className="text-sm text-slate-400 truncate">
                  {group.lastMessageImage ? "📷 Photo" : group.lastMessageText || "No messages yet"}
                </p>
                {group.unreadCount > 0 && (
                  <span className="badge badge-sm badge-primary shrink-0">{group.unreadCount}</span>
                )}
                <button
                  type="button"
                  className="btn btn-xs bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInviteModalForGroup(group);
                    getAllContacts();
                  }}
                >
                  Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Invite user to existing group */}
      {inviteModalForGroup && (
        <div className="modal modal-open">
          <div className="modal-box bg-slate-900 border border-slate-700/60">
            <h3 className="font-semibold text-slate-200 text-lg">
              Invite user to {inviteModalForGroup.name}
            </h3>
            <div className="mt-4 space-y-3">
              <select
                className="select w-full bg-slate-800/60 border border-slate-700/60 text-slate-100"
                value={inviteToUserId}
                onChange={(e) => setInviteToUserId(e.target.value)}
              >
                <option value="">Select a user</option>
                {allContacts.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.fullName} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost text-slate-300"
                onClick={() => {
                  setInviteModalForGroup(null);
                  setInviteToUserId("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={async () => {
                  if (!inviteToUserId) {
                    toast.error("Select a user to invite");
                    return;
                  }
                  await sendGroupInvite({
                    conversationId: inviteModalForGroup._id,
                    toUserId: inviteToUserId,
                  });
                  setInviteModalForGroup(null);
                  setInviteToUserId("");
                }}
              >
                Send invite
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setInviteModalForGroup(null);
              setInviteToUserId("");
            }}
          />
        </div>
      )}
    </>
  );
}

export default GroupsList;

