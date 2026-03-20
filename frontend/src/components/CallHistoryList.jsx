import { useEffect } from "react";
import { PhoneIcon, PhoneIncomingIcon, PhoneMissedIcon, PhoneOutgoingIcon, VideoIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatDistanceToNow } from "date-fns";

function CallHistoryList() {
  const { callHistory, getCallHistory, startCall, setSelectedChat, isUsersLoading } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getCallHistory();
  }, [getCallHistory]);

  const handleCallAgain = (peerUser, type) => {
    // We select the chat context artificially to start the call
    setSelectedChat({
      _id: peerUser._id,
      fullName: peerUser.fullName,
      profilePic: peerUser.profilePic,
      type: "dm",
    });
    // Let state settle, then trigger call
    setTimeout(() => startCall(type), 100);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? `${m}m ` : ""}${s}s`;
  };

  if (isUsersLoading && callHistory.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 items-center p-3 animate-pulse">
            <div className="w-12 h-12 bg-slate-700/50 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700/50 w-24 rounded" />
              <div className="h-3 bg-slate-700/50 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (callHistory.length === 0) {
    return (
      <div className="text-center text-slate-400 p-6 pt-10">
        <PhoneIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No recent calls</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {callHistory.map((call) => {
        const isOutgoing = call.callerId._id === authUser._id;
        const peer = isOutgoing ? call.receiverId : call.callerId;
        
        let Icon = PhoneIcon;
        let iconColor = "text-slate-400";
        if (call.status === "missed" && !isOutgoing) {
          Icon = PhoneMissedIcon;
          iconColor = "text-red-500";
        } else if (call.status === "rejected" && !isOutgoing) {
          Icon = PhoneMissedIcon;
          iconColor = "text-red-500";
        } else if (isOutgoing) {
          Icon = PhoneOutgoingIcon;
          iconColor = call.status === "completed" ? "text-emerald-500" : "text-yellow-500";
        } else {
          Icon = PhoneIncomingIcon;
          iconColor = "text-emerald-500";
        }

        return (
          <div
            key={call._id}
            className="flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-xl transition-colors group border border-transparent hover:border-slate-700/50"
          >
            <div className="relative">
              <img
                src={peer.profilePic || "/avatar.png"}
                alt={peer.fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className={`absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full ${iconColor}`}>
                 <Icon className="w-3 h-3" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`font-medium truncate ${call.status === "missed" && !isOutgoing ? "text-red-400" : "text-slate-200"}`}>
                {peer.fullName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                {call.type === "video" ? <VideoIcon className="w-3 h-3" /> : <PhoneIcon className="w-3 h-3" />}
                <span>{formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}</span>
                {call.status === "completed" && <span className="opacity-50">• {formatDuration(call.duration)}</span>}
              </div>
            </div>

            <button
              onClick={() => handleCallAgain(peer, call.type)}
              className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              title={`Return ${call.type} call`}
            >
              {call.type === "video" ? <VideoIcon className="w-5 h-5" /> : <PhoneIcon className="w-5 h-5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default CallHistoryList;
