import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized - No token provided" });

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid token" });

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    // jwt.verify throws for expired/malformed/invalid tokens — treat those as auth failures.
    if (
      error?.name === "TokenExpiredError" ||
      error?.name === "JsonWebTokenError" ||
      error?.name === "NotBeforeError"
    ) {
      return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
    }

    console.log("Error in protectRoute middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  } catch (error) {
    console.log("Error in requireAdmin middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const protectAdminRoute = async (req, res, next) => {
  try {
    const token = req.cookies.admin_jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized - No admin token provided" });

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid admin token" });

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ message: "Forbidden - Admin access required" });

    req.user = user;
    next();
  } catch (error) {
    if (
      error?.name === "TokenExpiredError" ||
      error?.name === "JsonWebTokenError" ||
      error?.name === "NotBeforeError"
    ) {
      return res.status(401).json({ message: "Unauthorized - Invalid or expired admin token" });
    }
    console.log("Error in protectAdminRoute middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
