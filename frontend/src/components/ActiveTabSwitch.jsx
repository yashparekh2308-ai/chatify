import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="flex bg-slate-900/50 rounded-lg p-1 mx-2 my-2 overflow-x-auto scrollbar-hide">
      <button
        onClick={() => setActiveTab("chats")}
        className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
          activeTab === "chats" ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
        }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
          activeTab === "contacts" ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
        }`}
      >
        Contacts
      </button>

      <button
        onClick={() => setActiveTab("groups")}
        className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
          activeTab === "groups" ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
        }`}
      >
        Groups
      </button>

      <button
        onClick={() => setActiveTab("calls")}
        className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
          activeTab === "calls" ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
        }`}
      >
        Calls
      </button>

      <button
        onClick={() => setActiveTab("status")}
        className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
          activeTab === "status" ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
        }`}
      >
        Status
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
