import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { createStatus, getStatusFeed, markStatusViewed } from "../controllers/status.controller.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/", getStatusFeed);
router.post("/", createStatus);
router.post("/:id/view", markStatusViewed);

export default router;

