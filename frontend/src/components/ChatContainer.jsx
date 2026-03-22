import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { CornerDownLeftIcon, SmilePlusIcon, CheckIcon, CheckCheckIcon, FileTextIcon, DownloadIcon, TrashIcon } from "lucide-react";

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
  const [messageToDelete, setMessageToDelete] = useState(null);
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

                    <button
                      type="button"
                      onClick={() => setMessageToDelete(msg)}
                      className="btn btn-xs bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:bg-red-900/80 hover:text-red-300 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-3 h-3" />
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
                        Replying to: {msg.replyTo.text || (msg.replyTo.image ? "Image" : msg.replyTo.video ? "Video" : msg.replyTo.document ? "Document" : "Voice Note")}
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
                  ) : msg.video ? (
                    <video
                      src={msg.video}
                      controls
                      className="rounded-lg max-h-64 object-cover cursor-pointer"
                    />
                  ) : msg.document ? (
                    <div 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-black/10 transition-colors ${msg.senderId === authUser._id ? "bg-cyan-700/50 border-cyan-500/30 text-white" : "bg-slate-700/50 border-slate-600 text-slate-200"}`}
                      onClick={() => setPreviewMessage(msg)}
                    >
                      <FileTextIcon className="w-8 h-8 text-cyan-300 shrink-0" />
                      <div className="flex flex-col truncate max-w-[180px]">
                        <span className="text-sm font-medium truncate">{msg.document.name}</span>
                        <span className="text-xs opacity-70">{(msg.document.size / 1024 / 1024).toFixed(2)} MB • {msg.document.format || 'DOC'}</span>
                      </div>
                    </div>
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

      {messageToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm bg-slate-900 border border-slate-700/60">
            <h3 className="font-bold text-lg text-slate-100 mb-2">Delete Message</h3>
            <p className="text-slate-300 mb-6 text-sm">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-ghost text-slate-300"
                onClick={() => setMessageToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                onClick={async () => {
                  await useChatStore.getState().deleteMessage(messageToDelete._id, false);
                  setMessageToDelete(null);
                }}
              >
                Delete for me
              </button>
              {messageToDelete.senderId === authUser._id && (
                <button
                  type="button"
                  className="btn btn-sm bg-red-600/90 text-white hover:bg-red-600 border-none"
                  onClick={async () => {
                    await useChatStore.getState().deleteMessage(messageToDelete._id, true);
                    setMessageToDelete(null);
                  }}
                >
                  Delete for everyone
                </button>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setMessageToDelete(null)} />
        </div>
      )}

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

            <div className="mb-4 flex flex-col items-center">
              {previewMessage.image ? (
                <img
                  src={previewMessage.image}
                  alt="Full preview"
                  className="w-auto max-h-[70vh] object-contain rounded-lg border border-slate-800 shadow-xl"
                />
              ) : previewMessage.document ? (
                <div className="bg-slate-800/80 p-8 rounded-xl border border-slate-700 w-full flex flex-col items-center gap-4">
                  <FileTextIcon className="w-16 h-16 text-cyan-500" />
                  <div className="text-center">
                    <p className="text-lg text-slate-200 font-medium mb-1">{previewMessage.document.name}</p>
                    <p className="text-sm text-slate-400">{(previewMessage.document.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full">
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
                  Download Image
                </a>
              ) : previewMessage.document ? (
                <a
                  href={previewMessage.document.url}
                  download={previewMessage.document.name}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-sm bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" /> Download Document
                </a>
              ) : null}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPreviewMessage(null)} />
        </div>
      )}
    </>
  );
}

export default ChatContainer;
