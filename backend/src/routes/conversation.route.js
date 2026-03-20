import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import {
  addGroupMembers,
  createGroupConversation,
  getConversationMessages,
  getMyConversations,
  removeGroupMember,
  sendConversationMessage,
  sendGroupInvite,
  getMyGroupInvites,
  respondToGroupInvite,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/", getMyConversations);
router.get("/invites", getMyGroupInvites);
router.post("/group", createGroupConversation);
router.get("/:id/messages", getConversationMessages);
router.post("/:id/messages", sendConversationMessage);
router.post("/:id/members", addGroupMembers);
router.delete("/:id/members/:memberId", removeGroupMember);
router.post("/:id/invite", sendGroupInvite);
router.post("/invites/:inviteId/respond", respondToGroupInvite);

export default router;

