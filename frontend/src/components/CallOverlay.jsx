import { useEffect, useRef, useState } from "react";
import { PhoneCallIcon, PhoneOffIcon, VideoIcon, VideoOffIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function CallOverlay() {
  const {
    callState,
    localStream,
    remoteStream,
    endCall,
    acceptIncomingCall,
    incomingOffer,
    toggleVideo,
    toggleAudio,
  } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState.status]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState.status]);

  if (callState.status === "idle") return null;

  const isOutgoing = callState.status === "calling";
  const isRinging = callState.status === "ringing";
  const isInCall = callState.status === "in-call";
  const isVideoCall = callState.type === "video";

  const handleToggleMic = () => {
    toggleAudio();
    setIsMicMuted((prev) => !prev);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoOff((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-xl transition-all duration-300">
      
      {/* Remote Video Background (if Video Call & in-call) */}
      {isInCall && isVideoCall && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* Main Caller Card Wrapper */}
      <div className={`relative z-10 flex flex-col items-center justify-center w-full max-w-[90%] sm:max-w-lg px-6 py-8 sm:p-8 rounded-3xl ${isInCall && isVideoCall ? 'bg-black/50 backdrop-blur-md border border-white/20 mt-auto mb-8 sm:mb-10 mx-auto' : 'bg-slate-800/80 border border-slate-700/50 shadow-2xl mx-auto'}`}>
        
        {/* Avatar & Info (Hidden when video is active and running, unless it's just audio) */}
        {!(isInCall && isVideoCall) && (
          <div className="flex flex-col items-center space-y-4 mb-4 sm:mb-8">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-cyan-500/50 ring-offset-4 ring-offset-slate-900 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                <img
                  src={callState.peerProfilePic || "/avatar.png"}
                  alt="caller avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Pulsing effect for Outgoing/Ringing */}
              {(isOutgoing || isRinging) && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-75"></div>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium tracking-widest text-cyan-400 uppercase mb-2">
                {isVideoCall ? "Video Call" : "Audio Call"}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate max-w-[250px] sm:max-w-[300px]">
                {callState.peerName || "Unknown"}
              </h2>
              <p className="text-slate-400 mt-1 sm:mt-2 text-base sm:text-lg animate-pulse">
                {isOutgoing && "Calling..."}
                {isRinging && "Incoming call..."}
                {isInCall && "00:00"}
              </p>
            </div>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        {isVideoCall && (isInCall || isOutgoing) && (
          <div className={`overflow-hidden rounded-xl border border-slate-600 shadow-xl bg-slate-800 transition-all duration-300 ${isInCall ? 'absolute bottom-24 right-4 w-24 h-36 sm:bottom-32 sm:right-8 sm:w-40 sm:h-56 z-20' : 'w-40 h-56 sm:w-48 sm:h-64 mx-auto mb-6'}`}>
             <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
            />
             {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden">
                   <img src="/avatar.png" alt="You" className="w-full h-full object-cover opacity-50"/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Elements (always needed for audio tracks) */}
        {!isVideoCall && (
           <>
            <audio ref={localVideoRef} autoPlay muted />
            <audio ref={remoteVideoRef} autoPlay />
           </>
        )}
        

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {isRinging && (
             <button
              type="button"
              className="group flex flex-col items-center gap-2"
              onClick={() =>
                acceptIncomingCall(incomingOffer, {
                  _id: callState.peerId,
                  fullName: callState.peerName,
                })
              }
             >
               <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all group-hover:scale-110 group-active:scale-95">
                  {isVideoCall ? <VideoIcon className="w-8 h-8 text-white" /> : <PhoneCallIcon className="w-8 h-8 text-white" />}
               </div>
               <span className="text-xs font-semibold text-slate-300 group-hover:text-emerald-400">Accept</span>
             </button>
          )}

          {/* In Call / Outgoing Controls */}
          {(isInCall || isOutgoing) && (
             <>
                <button
                 type="button"
                 onClick={handleToggleMic}
                 className={`flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 active:scale-95 ${isMicMuted ? 'bg-slate-700 text-red-400 border border-red-500/50' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}
                >
                  {isMicMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                </button>

                {isVideoCall && (
                  <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 active:scale-95 ${isVideoOff ? 'bg-slate-700 text-red-400 border border-red-500/50' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}
                 >
                   {isVideoOff ? <VideoOffIcon className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                 </button>
                )}
             </>
          )}

          <button
            type="button"
            className="group flex flex-col items-center gap-2"
            onClick={endCall}
          >
             <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all group-hover:scale-110 group-active:scale-95">
                <PhoneOffIcon className="w-8 h-8 text-white" />
             </div>
             <span className="text-xs font-semibold text-slate-300 group-hover:text-red-400">
               {isRinging ? "Decline" : "End Call"}
             </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CallOverlay;

