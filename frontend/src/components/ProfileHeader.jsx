import { useState, useRef } from "react";
import { BellIcon, LogOutIcon, VolumeOffIcon, Volume2Icon, BanIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import BlockedUsersModal from "./BlockedUsersModal";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound, notifications, setActiveTab } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="p-6 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="avatar online">
            <button
              className="size-14 rounded-full overflow-hidden relative group"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="User image"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div>
            <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
              {authUser.fullName}
            </h3>

            <p className="text-slate-400 text-xs">Online</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4 items-center">
          {/* NOTIFICATIONS */}
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm text-slate-400 hover:text-slate-200 relative"
            >
              <BellIcon className="size-5" />
              {notifications.length > 0 && (
                <span className="badge badge-xs badge-primary absolute -top-1 -right-1">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </div>
            <div className="dropdown-content z-[2] mt-2 w-72 bg-slate-900 border border-slate-700/60 rounded-xl shadow-lg max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/60">
                <span className="text-xs font-semibold text-slate-300">Notifications</span>
                <button
                  type="button"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  onClick={() => setActiveTab("chats")}
                >
                  View chats
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-xs text-slate-500 text-center">
                  No notifications yet.
                </div>
              ) : (
                <ul className="menu menu-sm p-0">
                  {notifications.map((n) => (
                    <li key={n.id} className="px-2 py-1.5">
                      <div className="text-xs text-slate-300 truncate">{n.title}</div>
                      {n.preview && (
                        <div className="text-[11px] text-slate-500 truncate">{n.preview}</div>
                      )}
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* BLOCKED USERS BTN */}
          <button
            className="btn btn-ghost btn-sm text-slate-400 hover:text-slate-200"
            title="Blocked Users"
            onClick={() => document.getElementById("blocked_users_modal").showModal()}
          >
            <BanIcon className="size-5" />
          </button>

          {/* LOGOUT BTN */}
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={logout}
          >
            <LogOutIcon className="size-5" />
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => {
              // play click sound before toggling
              mouseClickSound.currentTime = 0; // reset to start
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>
        </div>
      </div>
      <BlockedUsersModal />
    </div>
  );
}
export default ProfileHeader;
