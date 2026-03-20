import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { blockUser, getBlockedUsers, unblockUser } from "../controllers/user.controller.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/blocked", getBlockedUsers);
router.post("/block/:id", blockUser);
router.post("/unblock/:id", unblockUser);

export default router;

