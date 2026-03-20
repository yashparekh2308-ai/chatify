import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAdminStore = create((set, get) => ({
  adminUser: null,
  isCheckingAdmin: false,
  isLoggingIn: false,
  stats: null,
  users: [],
  groups: [],
  calls: [],
  statuses: [],
  isLoadingStats: false,
  isLoadingUsers: false,
  isLoadingGroups: false,
  isLoadingCalls: false,
  isLoadingStatuses: false,
  isDeletingUser: false,
  isDeletingGroup: false,
  isDeletingStatus: false,

  checkAdminAuth: async () => {
    set({ isCheckingAdmin: true });
    try {
      const res = await axiosInstance.get("/admin/auth/me");
      set({ adminUser: res.data });
    } catch {
      set({ adminUser: null });
    } finally {
      set({ isCheckingAdmin: false });
    }
  },

  adminLogin: async ({ email, password }) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/admin/auth/login", { email, password });
      set({ adminUser: res.data });
      toast.success("Admin login successful");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Admin login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  adminLogout: async () => {
    try {
      await axiosInstance.post("/admin/auth/logout");
    } finally {
      set({ adminUser: null });
    }
  },

  fetchDashboardStats: async () => {
    set({ isLoadingStats: true });
    try {
      const res = await axiosInstance.get("/admin/stats");
      set({ stats: res.data });
    } catch (error) {
      console.log("Error in fetchDashboardStats", error);
      toast.error(error.response?.data?.message || "Failed to load admin stats");
    } finally {
      set({ isLoadingStats: false });
    }
  },

  fetchAllUsers: async () => {
    set({ isLoadingUsers: true });
    try {
      const res = await axiosInstance.get("/admin/users");
      set({ users: res.data });
    } catch (error) {
      console.log("Error in fetchAllUsers", error);
      toast.error(error.response?.data?.message || "Failed to load users for admin");
    } finally {
      set({ isLoadingUsers: false });
    }
  },

  toggleUserBan: async (userId) => {
    try {
      const res = await axiosInstance.post(`/admin/users/toggle-ban/${userId}`);
      set({
        users: get().users.map((u) =>
          u._id === userId ? { ...u, isBanned: res.data.isBanned } : u
        ),
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle ban");
    }
  },

  deleteUser: async (userId) => {
    set({ isDeletingUser: true });
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      set({ users: get().users.filter((user) => user._id !== userId) });
      toast.success("User deleted successfully");
    } catch (error) {
      console.log("Error in deleteUser", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      set({ isDeletingUser: false });
    }
  },

  fetchAllGroups: async () => {
    set({ isLoadingGroups: true });
    try {
      const res = await axiosInstance.get("/admin/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isLoadingGroups: false });
    }
  },

  deleteGroup: async (groupId) => {
    set({ isDeletingGroup: true });
    try {
      await axiosInstance.delete(`/admin/groups/${groupId}`);
      set({ groups: get().groups.filter((g) => g._id !== groupId) });
      toast.success("Group deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
    } finally {
      set({ isDeletingGroup: false });
    }
  },

  fetchAllCalls: async () => {
    set({ isLoadingCalls: true });
    try {
      const res = await axiosInstance.get("/admin/calls");
      set({ calls: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load calls");
    } finally {
      set({ isLoadingCalls: false });
    }
  },

  fetchAllStatuses: async () => {
    set({ isLoadingStatuses: true });
    try {
      const res = await axiosInstance.get("/admin/statuses");
      set({ statuses: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load statuses");
    } finally {
      set({ isLoadingStatuses: false });
    }
  },

  deleteStatus: async (statusId) => {
    set({ isDeletingStatus: true });
    try {
      await axiosInstance.delete(`/admin/statuses/${statusId}`);
      set({ statuses: get().statuses.filter((s) => s._id !== statusId) });
      toast.success("Status deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete status");
    } finally {
      set({ isDeletingStatus: false });
    }
  },
}));
