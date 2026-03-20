import { ArrowLeftIcon, BellOffIcon, BellIcon, MoreVerticalIcon, PhoneCallIcon, VideoIcon, XIcon, BanIcon, Trash2Icon, FolderMinusIcon, XCircleIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const {
    selectedChat,
    setSelectedChat,
    typingFromUserIds,
    blockUser,
    toggleMuteChat,
    isChatMuted,
    startCall,
    clearChat,
  } = useChatStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { onlineUsers } = useAuthStore();
  const isOnline = selectedChat?.type === "dm" && onlineUsers.includes(selectedChat._id);
  const isTyping = selectedChat?.type === "dm" && typingFromUserIds.includes(selectedChat._id);
  const muted = isChatMuted(selectedChat);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedChat(null);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscKey);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setSelectedChat]);

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this chat? This will remove all messages for you.")) {
      clearChat(selectedChat._id);
      setDropdownOpen(false);
    }
  };

  const handleDeleteChat = () => {
    if (window.confirm("Are you sure you want to delete this chat? This cannot be undone.")) {
      clearChat(selectedChat._id);
      setSelectedChat(null);
      setDropdownOpen(false);
    }
  };

  return (
    <div
      className="flex justify-between items-center bg-slate-800/50 border-b
   border-slate-700/50 max-h-[84px] px-4 md:px-6 flex-1"
    >
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Mobile Back Button */}
        <button 
          onClick={() => setSelectedChat(null)}
          className="md:hidden btn btn-sm btn-ghost p-1 mr-1"
        >
          <ArrowLeftIcon className="w-5 h-5 text-slate-400" />
        </button>

        <div className={`avatar ${selectedChat?.type === "dm" ? (isOnline ? "online" : "offline") : ""}`}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full">
            <img
              src={
                selectedChat?.type === "group"
                  ? selectedChat.groupPic || "/avatar.png"
                  : selectedChat?.profilePic || "/avatar.png"
              }
              alt={selectedChat?.type === "group" ? selectedChat.name : selectedChat?.fullName}
            />
          </div>
        </div>

        <div>
          <h3 className="text-slate-200 font-medium">
            {selectedChat?.type === "group" ? selectedChat.name : selectedChat?.fullName}
          </h3>
          <p className="text-slate-400 text-sm">
            {selectedChat?.type === "group"
              ? "Group"
              : isTyping
                ? <span className="text-cyan-400 italic">Typing...</span>
                : isOnline
                  ? "Online"
                  : selectedChat?.lastSeenAt
                    ? `Last seen ${new Date(selectedChat.lastSeenAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {selectedChat?.type === "dm" && (
          <>
            <button
              type="button"
              className="btn btn-sm bg-slate-700/50 text-slate-300 hover:text-white hover:bg-cyan-600 border-none transition-colors"
              title="Audio call"
              onClick={() => startCall("audio")}
            >
              <PhoneCallIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="btn btn-sm bg-slate-700/50 text-slate-300 hover:text-white hover:bg-cyan-600 border-none transition-colors"
              title="Video call"
              onClick={() => startCall("video")}
            >
              <VideoIcon className="w-4 h-4" />
            </button>
          </>
        )}
        {selectedChat && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn-sm bg-slate-800/50 border border-slate-700/50 text-slate-200 hover:bg-slate-800"
              title="More options"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <MoreVerticalIcon className="w-4 h-4" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-3 text-slate-200 text-sm transition-colors"
                  onClick={() => {
                    setSelectedChat(null);
                    setDropdownOpen(false);
                  }}
                >
                  <XCircleIcon className="w-4 h-4 text-slate-400" />
                  Close chat
                </button>

                <button
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-3 text-slate-200 text-sm transition-colors"
                  onClick={() => {
                    toggleMuteChat(selectedChat);
                    setDropdownOpen(false);
                  }}
                >
                  {muted ? <BellIcon className="w-4 h-4 text-slate-400" /> : <BellOffIcon className="w-4 h-4 text-slate-400" />}
                  {muted ? "Unmute notifications" : "Mute notifications"}
                </button>
                
                <div className="my-1 h-px bg-slate-800 w-full" />

                {selectedChat.type === "dm" && (
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-3 text-slate-200 text-sm transition-colors"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to block this user?")) {
                        blockUser(selectedChat._id);
                      }
                      setDropdownOpen(false);
                    }}
                  >
                    <BanIcon className="w-4 h-4 text-slate-400" />
                    Block
                  </button>
                )}

                <button
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-3 text-red-400 hover:text-red-300 text-sm transition-colors"
                  onClick={handleClearChat}
                >
                  <FolderMinusIcon className="w-4 h-4" />
                  Clear chat
                </button>

                <button
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-3 text-red-500 hover:text-red-400 text-sm transition-colors"
                  onClick={handleDeleteChat}
                >
                  <Trash2Icon className="w-4 h-4" />
                  Delete chat
                </button>

              </div>
            )}
          </div>
        )}

        <button onClick={() => setSelectedChat(null)} className="btn btn-sm btn-ghost">
          <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;
