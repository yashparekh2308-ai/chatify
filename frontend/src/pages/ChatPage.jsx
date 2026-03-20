import { useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import GroupsList from "../components/GroupsList";
import StatusList from "../components/StatusList";
import CallHistoryList from "../components/CallHistoryList";
import ChatContainer from "../components/ChatContainer";
import CallOverlay from "../components/CallOverlay";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedChat, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="relative w-full max-w-6xl h-[800px]">
      <BorderAnimatedContainer>
        {/* LEFT SIDE (Contact List / Tabs) */}
        {/* On mobile: Hidden if a chat is selected. On desktop: Always visible */}
        <div className={`w-full md:w-80 bg-slate-800/50 backdrop-blur-sm flex col transition-all duration-300 ${selectedChat ? 'hidden md:flex flex-col' : 'flex flex-col'}`}>
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="px-4 pb-2 pt-1 border-b border-slate-700/50">
            <div className="relative relative-group">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? (
              <ChatsList searchQuery={searchQuery} />
            ) : activeTab === "contacts" ? (
              <ContactList searchQuery={searchQuery} />
            ) : activeTab === "calls" ? (
              <CallHistoryList searchQuery={searchQuery} />
            ) : activeTab === "status" ? (
              <StatusList />
            ) : (
              <GroupsList searchQuery={searchQuery} />
            )}
          </div>
        </div>

        {/* RIGHT SIDE (Chat Window) */}
        {/* On mobile: Hidden if NO chat is selected. On desktop: Always visible */}
        <div className={`flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm transition-all duration-300 w-full ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          {selectedChat ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>

        <CallOverlay />
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;
