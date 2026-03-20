import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { CornerDownLeftIcon, SmilePlusIcon, CheckIcon, CheckCheckIcon } from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function ChatContainer() {
  const {
    selectedChat,
    getMessagesForSelectedChat,
    fetchMoreMessages,
    hasMoreMessages,
    messages,
    isMessagesLoading,
    setReplyTo,
    reactToMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);

  useEffect(() => {
    getMessagesForSelectedChat();
  }, [selectedChat, getMessagesForSelectedChat]);

  useEffect(() => {
    if (messageEndRef.current && prevScrollHeight === 0) {
      // initial load, scroll to bottom
      messageEndRef.current.scrollIntoView({ behavior: "instant" });
    } else if (scrollContainerRef.current && prevScrollHeight > 0) {
      // pagination load, maintain relative scroll position
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
    }
  }, [messages, prevScrollHeight]);

  const handleScroll = (e) => {
    const container = e.target;
    if (container.scrollTop === 0 && hasMoreMessages && !isMessagesLoading) {
      setPrevScrollHeight(container.scrollHeight);
      fetchMoreMessages();
    }
  };

  const handleScrollToMessage = (messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-cyan-900/40", "transition-colors", "duration-1000", "rounded-lg");
      setTimeout(() => {
        el.classList.remove("bg-cyan-900/40");
      }, 2000);
    }
  };

  return (
    <>
      <ChatHeader />
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 px-6 overflow-y-auto py-8"
      >
        {isMessagesLoading && messages.length > 0 && (
          <div className="flex justify-center my-4">
            <span className="loading loading-spinner text-cyan-500"></span>
          </div>
        )}
        
        {messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6 pb-2">
            {messages.map((msg) => (
              <div
                key={msg._id}
                id={`message-${msg._id}`}
                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              >
                <div
                  className={`chat-bubble relative group ${
                    msg.senderId === authUser._id
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  <div className="absolute -top-3 right-2 hidden group-hover:flex gap-1">
                    <button
                      type="button"
                      onClick={() => setReplyTo(msg)}
                      className="btn btn-xs bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:bg-slate-900"
                      title="Reply"
                    >
                      <CornerDownLeftIcon className="w-3 h-3" />
                    </button>

                    <div className="dropdown dropdown-end">
                      <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-xs bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:bg-slate-900"
                        title="React"
                      >
                        <SmilePlusIcon className="w-3 h-3" />
                      </div>
                      <div
                        tabIndex={0}
                        className="dropdown-content z-[1] bg-slate-900 border border-slate-700/60 rounded-full px-2 py-1 flex gap-1"
                      >
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center"
                            onClick={() => reactToMessage(msg._id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {msg.replyTo && (
                    <div 
                      className="mb-2 border-l-2 border-cyan-400/70 pl-3 text-xs text-slate-300/80 cursor-pointer hover:bg-slate-700/30 p-1 -ml-1 rounded transition-colors"
                      onClick={() => handleScrollToMessage(msg.replyTo._id)}
                    >
                      <p className="font-semibold truncate max-w-[220px]">
                        Replying to: {msg.replyTo.text || (msg.replyTo.image ? "Image" : "Voice Note")}
                      </p>
                    </div>
                  )}
                  {msg.image ? (
                    <img
                      src={msg.image}
                      alt="Shared content"
                      className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setPreviewMessage(msg)}
                    />
                  ) : msg.audio ? (
                    <div className="mt-2 text-slate-200">
                      <audio controls src={msg.audio} className="h-10 outline-none max-w-[220px] rounded-full custom-audio" />
                    </div>
                  ) : (
                    <div 
                      className={`cursor-pointer group-hover:bg-black/10 rounded px-1 transition-colors ${msg.senderId === authUser._id ? "hover:bg-cyan-700/50" : "hover:bg-slate-700/50"}`}
                      onClick={() => setPreviewMessage(msg)}
                    >
                      {msg.text && <p className="mt-2 text-[15px] leading-relaxed break-words">{msg.text}</p>}
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-75 flex items-center justify-end gap-1">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.senderId === authUser._id && (
                      <span className="ml-1">
                        {msg.seen ? (
                          <CheckCheckIcon className="w-4 h-4 text-blue-400" />
                        ) : (
                          <CheckIcon className="w-4 h-4 text-slate-300" />
                        )}
                      </span>
                    )}
                  </p>
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="absolute -bottom-4 right-2 flex gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full text-xs border border-slate-700/60">
                      {msg.reactions.map((r) => (
                        <span key={r.userId + r.emoji}>{r.emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* 👇 scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder
            name={selectedChat?.type === "group" ? selectedChat.name : selectedChat?.fullName}
          />
        )}
      </div>

      <MessageInput />

      {previewMessage && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl bg-slate-900 border border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-400">
                Sent{" "}
                {new Date(previewMessage.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-slate-300"
                onClick={() => setPreviewMessage(null)}
              >
                Close
              </button>
            </div>

            <div className="mb-4">
              {previewMessage.image ? (
                <img
                  src={previewMessage.image}
                  alt="Full preview"
                  className="w-full max-h-[70vh] object-contain rounded-lg border border-slate-800 shadow-xl"
                />
              ) : (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <p className="text-lg text-slate-200 whitespace-pre-wrap">{previewMessage.text}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-4">
              {previewMessage.image ? (
                <a
                  href={previewMessage.image}
                  download
                  className="btn btn-sm bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700"
                >
                  Download
                </a>
              ) : (
                <div /> // Placeholder to keep delete buttons on the right
              )}

              {previewMessage.senderId === authUser._id ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                    onClick={async () => {
                      await useChatStore.getState().deleteMessage(previewMessage._id, false);
                      setPreviewMessage(null);
                    }}
                  >
                    Delete for me
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm bg-red-600/90 text-white hover:bg-red-600"
                    onClick={async () => {
                      if (window.confirm("Delete this message for everyone?")) {
                        await useChatStore.getState().deleteMessage(previewMessage._id, true);
                        setPreviewMessage(null);
                      }
                    }}
                  >
                    Delete for everyone
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={async () => {
                    await useChatStore.getState().deleteMessage(previewMessage._id, false);
                    setPreviewMessage(null);
                  }}
                >
                  Delete for me
                </button>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPreviewMessage(null)} />
        </div>
      )}
    </>
  );
}

export default ChatContainer;
