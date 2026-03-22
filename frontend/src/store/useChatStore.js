import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  groups: [],
  groupInvites: [],
  messages: [],
  messagePage: 1,
  hasMoreMessages: true,
  activeTab: "chats",
  selectedChat: null, // { type: "dm" | "group", ... }
  typingFromUserIds: [],
  replyTo: null,
  isUsersLoading: false,
  isAccepting: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  mutedChatKeys: JSON.parse(localStorage.getItem("mutedChatKeys") || "[]"),
  notifications: [],
  blockedUsers: [],
  callState: {
    status: "idle", // "idle" | "calling" | "ringing" | "in-call"
    peerId: null,
    peerName: "",
    peerProfilePic: "",
    type: "audio", // "audio" | "video"
  },
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  iceCandidateQueue: [], // Queue for ICE candidates received before remote description is set
  incomingOffer: null,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  toggleMuteChat: (chat) => {
    if (!chat) return;
    const key = `${chat.type}:${chat._id}`;
    const current = get().mutedChatKeys || [];
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    localStorage.setItem("mutedChatKeys", JSON.stringify(next));
    set({ mutedChatKeys: next });
  },

  isChatMuted: (chat) => {
    if (!chat) return false;
    const key = `${chat.type}:${chat._id}`;
    return (get().mutedChatKeys || []).includes(key);
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedChat: (selectedChat) => set({ selectedChat, replyTo: null, messagePage: 1, hasMoreMessages: true, messages: [] }),
  setTypingFromUserIds: (ids) => set({ typingFromUserIds: ids }),
  setReplyTo: (message) => set({ replyTo: message }),

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/react/${messageId}`, { emoji });
      const updated = res.data;
      set({
        messages: get().messages.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to react");
    }
  },

  removeReactionFromMessage: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/messages/react/${messageId}`);
      const updated = res.data;
      set({
        messages: get().messages.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove reaction");
    }
  },

  deleteMessage: async (messageId, deleteForEveryone = false) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
      set({
        messages: get().messages.filter((m) => m._id !== messageId),
      });
      toast.success(deleteForEveryone ? "Message deleted for everyone" : "Message deleted for me");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  clearChat: async (chatId) => {
    try {
      await axiosInstance.delete(`/messages/clear/${chatId}`);
      if (get().selectedChat?._id === chatId) {
        set({ messages: [] });
      }
      get().getMyChatPartners();
      toast.success("Chat cleared");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear chat");
    }
  },

  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/users/block/${userId}`);
      // clear active DM if it's the blocked user
      if (get().selectedChat?.type === "dm" && get().selectedChat._id === userId) {
        set({ selectedChat: null, messages: [], replyTo: null });
      }
      await Promise.all([get().getAllContacts(), get().getMyChatPartners(), get().getBlockedUsers()]);
      toast.success("User blocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.post(`/users/unblock/${userId}`);
      await Promise.all([get().getAllContacts(), get().getMyChatPartners(), get().getBlockedUsers()]);
      toast.success("User unblocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    }
  },

  getBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/users/blocked");
      set({ blockedUsers: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load blocked users");
    }
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  callHistory: [],
  getCallHistory: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/calls/history");
      set({ callHistory: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load calls");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyGroups: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/conversations");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroupInvites: async () => {
    try {
      const res = await axiosInstance.get("/conversations/invites");
      set({ groupInvites: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load group invites");
    }
  },

  createGroup: async ({ name, memberIds, groupPic }) => {
    try {
      const res = await axiosInstance.post("/conversations/group", { name, memberIds, groupPic });
      await get().getMyGroups();
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      return null;
    }
  },

  sendGroupInvite: async ({ conversationId, toUserId }) => {
    try {
      await axiosInstance.post(`/conversations/${conversationId}/invite`, { toUserId });
      toast.success("Invitation sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send invite");
    }
  },

  acceptGroupInvite: async (inviteId) => {
    try {
      await axiosInstance.post(`/conversations/invites/${inviteId}/respond`, {
        action: "accept",
      });
      set({
        groupInvites: get().groupInvites.filter((i) => i._id !== inviteId),
      });
      await get().getMyGroups();
      toast.success("Joined group");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept invite");
    }
  },

  declineGroupInvite: async (inviteId) => {
    try {
      await axiosInstance.post(`/conversations/invites/${inviteId}/respond`, {
        action: "decline",
      });
      set({
        groupInvites: get().groupInvites.filter((i) => i._id !== inviteId),
      });
      toast.success("Invite declined");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decline invite");
    }
  },

  getMessagesForSelectedChat: async () => {
    set({ isMessagesLoading: true, messagePage: 1, hasMoreMessages: true });
    try {
      const { selectedChat } = get();
      if (!selectedChat) return set({ isMessagesLoading: false });

      // Group endpoints don't have pagination configured yet in the backend, but DM does
      const res =
        selectedChat.type === "group"
          ? await axiosInstance.get(`/conversations/${selectedChat._id}/messages`)
          : await axiosInstance.get(`/messages/${selectedChat._id}?page=1&limit=50`);
          
      set({ 
        messages: res.data,
        hasMoreMessages: res.data.length === 50, // if we got 50, there might be more
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  fetchMoreMessages: async () => {
    const { selectedChat, messagePage, hasMoreMessages, isMessagesLoading, messages } = get();
    if (!selectedChat || selectedChat.type === "group" || !hasMoreMessages || isMessagesLoading) return;

    const nextPage = messagePage + 1;
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${selectedChat._id}?page=${nextPage}&limit=50`);
      
      const newMessages = res.data;
      
      set({
        messages: [...newMessages, ...messages], // Prepend older messages
        messagePage: nextPage,
        hasMoreMessages: newMessages.length === 50,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load older messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedChat, messages, replyTo } = get();
    const { authUser } = useAuthStore.getState();
    if (!selectedChat) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedChat.type === "dm" ? selectedChat._id : null,
      conversationId: selectedChat.type === "group" ? selectedChat._id : null,
      text: messageData.text,
      image: messageData.image,
      audio: messageData.audio,
      createdAt: new Date().toISOString(),
      isOptimistic: true, // flag to identify optimistic messages (optional)
      replyTo,
    };
    // immidetaly update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res =
        selectedChat.type === "group"
          ? await axiosInstance.post(`/conversations/${selectedChat._id}/messages`, {
              ...messageData,
              replyTo: replyTo?._id || null,
            })
          : await axiosInstance.post(`/messages/send/${selectedChat._id}`, {
              ...messageData,
              replyTo: replyTo?._id || null,
            });
      set({ messages: messages.concat(res.data), replyTo: null });
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  // --- 1:1 audio/video call (DM only) ---
  startCall: async (type = "audio") => {
    const { selectedChat, callState } = get();
    if (!selectedChat || selectedChat.type !== "dm") {
      toast.error("Select a direct chat to start a call");
      return;
    }
    if (callState.status !== "idle") {
      toast.error("Already in a call");
      return;
    }

    set({
      callState: {
        status: "calling",
        peerId: selectedChat._id,
        peerName: selectedChat.fullName,
        peerProfilePic: selectedChat.profilePic || "/avatar.png",
        type,
      },
    });

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      const constraints = { audio: true, video: type === "video" };
      let localStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        toast.error("Unable to access camera/microphone");
        get().endCall();
        return;
      }

      if (get().callState.status !== "calling") {
        localStream.getTracks().forEach((t) => t.stop());
        pc.close();
        return;
      }

      set({ peerConnection: pc, localStream, iceCandidateQueue: [] });

      pc.ontrack = (event) => {
        const stream = get().remoteStream || new MediaStream();
        stream.addTrack(event.track);
        set({ remoteStream: new MediaStream(stream.getTracks()) });
      };

      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      const socket = useAuthStore.getState().socket;
      if (!socket) {
        toast.error("Not connected");
        return;
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            toUserId: selectedChat._id,
            candidate: event.candidate,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:offer", {
        toUserId: selectedChat._id,
        offer: { type: offer.type, sdp: offer.sdp, callType: type },
      });

    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Unable to start call. Ensure microphone/camera permissions are granted.");
      get().endCall();
    }
  },

  endCall: () => {
    const { peerConnection, localStream, remoteStream, callState } = get();
    const socket = useAuthStore.getState().socket;

    if (callState.peerId && socket) {
      socket.emit("call:hangup", { toUserId: callState.peerId });
    }

    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.close();
    }
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());

    set({
      isAccepting: false,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      iceCandidateQueue: [],
      callState: { status: "idle", peerId: null, peerName: "", peerProfilePic: "", type: "audio" },
    });
  },

  acceptIncomingCall: async (offer, fromUser) => {
    if (get().callState.status !== "ringing" || get().isAccepting) return;
    set({ isAccepting: true });

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      const callType = offer.callType || "audio";
      const constraints = { audio: true, video: callType === "video" };
      
      let localStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        toast.error("Unable to access camera/microphone");
        get().endCall();
        return;
      }

      if (get().callState.status !== "ringing") {
        localStream.getTracks().forEach((t) => t.stop());
        pc.close();
        return;
      }

      set({ peerConnection: pc, localStream });

      pc.ontrack = (event) => {
        const stream = get().remoteStream || new MediaStream();
        stream.addTrack(event.track);
        set({ remoteStream: new MediaStream(stream.getTracks()) });
      };

      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      const socket = useAuthStore.getState().socket;
      if (!socket) {
        toast.error("Not connected");
        return;
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            toUserId: fromUser._id,
            candidate: event.candidate,
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription({ type: offer.type, sdp: offer.sdp }));
      
      // Process queued ICE candidates
      const queue = get().iceCandidateQueue;
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ICE candidate:", e);
        }
      }
      set({ iceCandidateQueue: [] });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", {
        toUserId: fromUser._id,
        answer: { type: answer.type, sdp: answer.sdp },
      });

      set({
        callState: { ...get().callState, status: "in-call", type: callType },
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Unable to accept call. Ensure permissions are granted.");
      get().endCall(); // Clean up if it fails
    } finally {
      set({ isAccepting: false });
    }
  },

  toggleVideo: () => {
    const { localStream } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  },

  toggleAudio: () => {
    const { localStream } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedChat, isSoundEnabled, notifications } = get();

      let shouldAppend = false;
      if (selectedChat?.type === "group") {
        shouldAppend =
          Boolean(newMessage.conversationId) && newMessage.conversationId === selectedChat._id;
      } else if (selectedChat?.type === "dm") {
        const chatUserId = selectedChat._id;
        shouldAppend =
          newMessage.senderId === chatUserId || newMessage.receiverId === chatUserId;
      }

      if (shouldAppend) {
        const currentMessages = get().messages;
        set({ messages: [...currentMessages, newMessage] });

        if (isSoundEnabled && !get().isChatMuted(selectedChat)) {
          const notificationSound = new Audio("/sounds/notification.mp3");
          notificationSound.currentTime = 0; // reset to start
          notificationSound.play().catch((e) => console.log("Audio play failed:", e));
        }
      } else {
        // show toast + add to notifications for background messages unless muted
        const dmKey = newMessage.senderId ? `dm:${newMessage.senderId}` : "";
        const groupKey = newMessage.conversationId ? `group:${newMessage.conversationId}` : "";
        const muted =
          (dmKey && (get().mutedChatKeys || []).includes(dmKey)) ||
          (groupKey && (get().mutedChatKeys || []).includes(groupKey));
        if (!muted) {
          toast("New message");
          const title = newMessage.conversationId
            ? "New group message"
            : "New message";
          set({
            notifications: [
              {
                id: `${Date.now()}-${newMessage._id}`,
                title,
                preview: newMessage.text || (newMessage.image ? "📷 Photo" : ""),
                createdAt: newMessage.createdAt || new Date().toISOString(),
              },
              ...notifications,
            ].slice(0, 20),
          });
        }
      }

      // refresh chat list (for unread counts/last message) on any incoming message
      get().getMyChatPartners();
      get().getMyGroups();
    });

    socket.on("messagesSeen", ({ userId }) => {
      const { selectedChat, messages } = get();
      if (!selectedChat || selectedChat.type !== "dm" || selectedChat._id !== userId) return;

      const updatedMessages = messages.map((msg) =>
        msg.receiverId === userId && !msg.seen
          ? { ...msg, seen: true, seenAt: new Date().toISOString() }
          : msg
      );

      set({ messages: updatedMessages });
    });

    socket.on("userTyping", ({ userId, isTyping }) => {
      const { typingFromUserIds } = get();
      if (isTyping) {
        if (!typingFromUserIds.includes(userId)) {
          set({ typingFromUserIds: [...typingFromUserIds, userId] });
        }
      } else {
        set({
          typingFromUserIds: typingFromUserIds.filter((id) => id !== userId),
        });
      }
    });

    socket.on("messageReactionUpdated", (updatedMessage) => {
      set({
        messages: get().messages.map((m) =>
          m._id === updatedMessage._id ? { ...m, ...updatedMessage } : m
        ),
      });
    });

    socket.on("messageDeleted", ({ messageId, deleteForEveryone, deletedForUserId }) => {
      // If deleted for everyone, remove it.
      // If deleted for me only, only remove it if I am the one who requested it.
      const myId = useAuthStore.getState().authUser?._id;
      if (deleteForEveryone || deletedForUserId === myId) {
        set({
          messages: get().messages.filter((m) => m._id !== messageId),
        });
      }
    });

    socket.on("chatCleared", ({ chatId }) => {
      if (get().selectedChat?._id === chatId) {
        set({ messages: [] });
      }
      get().getMyChatPartners();
    });

    // ---- Call signaling ----
    socket.on("call:incoming", ({ fromUserId, offer }) => {
      try {
        const { chats, allContacts, callState } = get();
        if (callState.status !== "idle") {
          return; // ignore concurrent incoming caller, already in a call or ringing
        }
        
        // basic lookup: see if we have this user in chats or contacts
        const fromContact =
          chats.find((c) => c._id === fromUserId) || allContacts.find((c) => c._id === fromUserId);
        const peerName = fromContact?.fullName || "Unknown";
        const peerProfilePic = fromContact?.profilePic || "/avatar.png";
        
        set({
          callState: { status: "ringing", peerId: fromUserId, peerName, peerProfilePic, type: offer.callType || "audio" },
          incomingOffer: offer,
          iceCandidateQueue: [], // reset queue on new call
        });
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    });

    socket.on("call:answer", async ({ fromUserId, answer }) => {
      const { peerConnection, callState } = get();
      if (!peerConnection || callState.peerId !== fromUserId) return;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: answer.type, sdp: answer.sdp }));
        set({
          callState: { ...get().callState, status: "in-call" },
        });
        
        // flush queued candidates that might have arrived before answer
        const queue = get().iceCandidateQueue;
         for (const candidate of queue) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding queued ICE candidate after answer:", e);
          }
        }
        set({ iceCandidateQueue: [] });

      } catch (error) {
        console.error("Error applying answer:", error);
      }
    });

    socket.on("call:ice-candidate", async ({ fromUserId, candidate }) => {
      const { peerConnection, callState } = get();
      if (callState.peerId !== fromUserId) return;
      
      try {
        if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
           await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
           // Queue candidate if remote description is not yet set
           set((state) => ({ iceCandidateQueue: [...state.iceCandidateQueue, candidate] }));
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.on("call:hangup", ({ fromUserId }) => {
      const { callState } = get();
      if (callState.peerId !== fromUserId) return;
      get().endCall();
    });

    socket.on("call:offer:ack", ({ delivered, reason }) => {
      if (!delivered) {
        toast.error(`Incoming call not delivered (${reason || "unknown"}).`);
        get().endCall();
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesSeen");
    socket.off("userTyping");
    socket.off("messageReactionUpdated");
    socket.off("messageDeleted");
    socket.off("chatCleared");
    socket.off("call:incoming");
    socket.off("call:answer");
    socket.off("call:ice-candidate");
    socket.off("call:hangup");
    socket.off("call:offer:ack");
  },
}));
