import { useEffect } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { Users, MessageSquare, PhoneCall, UsersRound, TimerIcon } from "lucide-react";

const AdminStats = () => {
  const { stats, fetchDashboardStats, isLoadingStats } = useAdminStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (isLoadingStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      <StatCard
        icon={Users}
        label="Total Users"
        value={stats?.totalUsers || 0}
        color="text-blue-500"
        bg="bg-blue-500/10"
      />
      <StatCard
        icon={MessageSquare}
        label="Total Messages"
        value={stats?.totalMessages || 0}
        color="text-primary"
        bg="bg-primary/10"
      />
      <StatCard
        icon={PhoneCall}
        label="Total Calls"
        value={stats?.totalCalls || 0}
        color="text-emerald-500"
        bg="bg-emerald-500/10"
      />
      <StatCard
        icon={UsersRound}
        label="Total Groups"
        value={stats?.totalGroups || 0}
        color="text-purple-400"
        bg="bg-purple-500/10"
      />
      <StatCard
        icon={TimerIcon}
        label="Total Statuses"
        value={stats?.totalStatuses || 0}
        color="text-cyan-400"
        bg="bg-cyan-500/10"
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, color, bg }) => {
  const Icon = icon;
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 transition-all hover:bg-slate-800">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-xl ${bg}`}>
          <Icon className={`size-8 ${color}`} />
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
