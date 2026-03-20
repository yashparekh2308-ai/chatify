import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import callRoutes from "./routes/call.route.js";
import statusRoutes from "./routes/status.route.js";
import userRoutes from "./routes/user.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "5mb" })); // req.body
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/users", userRoutes);

// make ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
