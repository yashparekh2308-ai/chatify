import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/User.js";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // update last seen on connect (helps show "online" instantly in UI)
  User.updateOne({ _id: userId }, { $set: { lastSeenAt: new Date() } }).catch(() => {});

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // typing indicator: notify the other user in a 1:1 chat
  socket.on("typing", ({ receiverId, isTyping }) => {
    if (!receiverId) return;
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        userId,
        isTyping: Boolean(isTyping),
      });
    }
  });

  // 1:1 audio call signaling
  socket.on("call:offer", ({ toUserId, offer }) => {
    const targetSocketId = userSocketMap[toUserId];
    
    // Store active call data on the socket to compute duration
    socket.activeCall = {
      startTime: Date.now(),
      toUserId,
      type: offer.callType || "audio",
      status: "missed" // default to missed until answered
    };

    if (targetSocketId) {
      io.to(targetSocketId).emit("call:incoming", {
        fromUserId: userId,
        offer,
      });
    }
  });

  socket.on("call:answer", ({ toUserId, answer }) => {
    const targetSocketId = userSocketMap[toUserId];
    
    // The person matching the offer has answered
    if (socket.activeCall) {
      socket.activeCall.status = "completed";
    }
    // Also update the caller's socket if we can find it
    const callerSocket = Array.from(io.sockets.sockets.values()).find(s => s.userId === toUserId);
    if(callerSocket && callerSocket.activeCall) {
      callerSocket.activeCall.status = "completed";
      callerSocket.activeCall.startTime = Date.now(); // reset start time to actual connection
    }

    if (targetSocketId) {
      io.to(targetSocketId).emit("call:answer", {
        fromUserId: userId,
        answer,
      });
    }
  });

  socket.on("call:ice-candidate", ({ toUserId, candidate }) => {
    const targetSocketId = userSocketMap[toUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:ice-candidate", {
        fromUserId: userId,
        candidate,
      });
    }
  });

  const handleCallEnd = async (currentSocket, toUserIdParam) => {
    const callData = currentSocket.activeCall;
    if (!callData) return;

    try {
      const durationInSeconds = callData.status === "completed" 
        ? Math.floor((Date.now() - callData.startTime) / 1000) 
        : 0;
        
      const CallHistory = (await import("../models/CallHistory.js")).default;
      
      await CallHistory.create({
        callerId: currentSocket.userId,
        receiverId: callData.toUserId,
        type: callData.type,
        status: callData.status,
        duration: durationInSeconds
      });
    } catch (error) {
      console.error("Error saving call history:", error);
    }
    currentSocket.activeCall = null;

    if (toUserIdParam) {
      const targetSocketId = userSocketMap[toUserIdParam];
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:hangup", {
          fromUserId: currentSocket.userId,
        });
      }
    }
  };

  socket.on("call:hangup", ({ toUserId }) => {
    // If the caller hangs up
    if (socket.activeCall) {
       handleCallEnd(socket, toUserId);
    } else {
       // If the receiver hangs up (declines or ends)
       const callerSocket = Array.from(io.sockets.sockets.values()).find(s => s.userId === toUserId);
       if(callerSocket && callerSocket.activeCall) {
         if (callerSocket.activeCall.status === "missed") {
           callerSocket.activeCall.status = "rejected";
         }
         handleCallEnd(callerSocket, userId); // notify caller
       }
    }
    
    const targetSocketId = userSocketMap[toUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:hangup", {
        fromUserId: userId,
      });
    }
  });

  // with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    
    if (socket.activeCall) {
      handleCallEnd(socket);
    }

    delete userSocketMap[userId];
    User.updateOne({ _id: userId }, { $set: { lastSeenAt: new Date() } }).catch(() => {});
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
