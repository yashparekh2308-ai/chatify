import express from "express";
import { protectAdminRoute } from "../middleware/auth.middleware.js";
import { 
  getAllUsers, 
  getDashboardStats, 
  deleteUser, 
  adminLogin, 
  adminMe,
  adminLogout,
  toggleUserBan, 
  getAllGroups, 
  deleteGroup,
  getAllCalls,
  getAllStatuses,
  deleteStatus
} from "../controllers/admin.controller.js";

const router = express.Router();

// Publicly accessible admin login
router.post("/auth/login", adminLogin);
router.get("/auth/me", protectAdminRoute, adminMe);
router.post("/auth/logout", protectAdminRoute, adminLogout);

// Protected admin routes
router.use(protectAdminRoute);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.post("/users/toggle-ban/:id", toggleUserBan);
router.delete("/users/:id", deleteUser);

router.get("/groups", getAllGroups);
router.delete("/groups/:id", deleteGroup);

router.get("/calls", getAllCalls);

router.get("/statuses", getAllStatuses);
router.delete("/statuses/:id", deleteStatus);

export default router;
