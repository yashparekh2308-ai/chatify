import { useState } from "react";
import AdminStats from "../components/AdminStats";
import AdminUserList from "../components/AdminUserList";
import AdminGroupsList from "../components/AdminGroupsList";
import AdminCallsList from "../components/AdminCallsList";
import AdminStatusesList from "../components/AdminStatusesList";
import AdminTabs from "../components/AdminTabs";
import { ShieldAlert } from "lucide-react";

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col pt-8">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
          <ShieldAlert className="size-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Platform overview and management</p>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8">
        <AdminStats />
        <AdminTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "users" ? (
          <AdminUserList />
        ) : activeTab === "groups" ? (
          <AdminGroupsList />
        ) : activeTab === "calls" ? (
          <AdminCallsList />
        ) : (
          <AdminStatusesList />
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
