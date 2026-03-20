import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

function ChatsList({ searchQuery = "" }) {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedChat } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const filteredChats = chats.filter((chat) => 
    chat.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredChats.length === 0) return <NoChatsFound />;

  return (
    <>
      {filteredChats.map((chat) => (
        <div
          key={chat._id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() =>
            setSelectedChat({
              type: "dm",
              _id: chat._id,
              fullName: chat.fullName,
              profilePic: chat.profilePic,
              email: chat.email,
              lastSeenAt: chat.lastSeenAt,
            })
          }
        >
          <div className="flex items-center gap-3">
            <div className={`avatar ${onlineUsers.includes(chat._id) ? "online" : "offline"}`}>
              <div className="size-12 rounded-full">
                <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <h4 className="text-slate-200 font-medium truncate">{chat.fullName}</h4>
                {chat.lastMessageAt && (
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(chat.lastMessageAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center gap-2 mt-1">
                <p className="text-sm text-slate-400 truncate">
                  {chat.lastMessageImage
                    ? "📷 Photo"
                    : chat.lastMessageText || "No messages yet"}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="badge badge-sm badge-primary shrink-0">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ChatsList;
