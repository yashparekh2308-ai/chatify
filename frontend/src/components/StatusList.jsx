import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

function StatusList() {
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);
   const [activeStatus, setActiveStatus] = useState(null);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/status");
      setFeed(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load status feed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const createStatus = async () => {
    if (!text.trim() && !image) return toast.error("Text or image is required");
    try {
      await axiosInstance.post("/status", { text: text.trim(), image });
      setIsCreateOpen(false);
      setText("");
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadFeed();
      toast.success("Status posted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to post status");
    }
  };

  const openStatus = async (s) => {
    try {
      await axiosInstance.post(`/status/${s._id}/view`);
      setFeed((prev) => prev.map((x) => (x._id === s._id ? { ...x, viewed: true } : x)));
    } catch {
      // ignore
    }

    // open in-app viewer modal
    setActiveStatus(s);
  };

  if (isLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      <div className="flex justify-end mb-2">
        <button
          className="btn btn-sm bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/20"
          onClick={() => setIsCreateOpen(true)}
          type="button"
        >
          Add status
        </button>
      </div>

      {isCreateOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-slate-900 border border-slate-700/60">
            <h3 className="font-semibold text-slate-200 text-lg">New status</h3>

            <div className="mt-4 space-y-3">
              <textarea
                className="textarea w-full bg-slate-800/60 border border-slate-700/60 text-slate-100"
                placeholder="Type a status..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="file-input file-input-sm w-full bg-slate-800/60 border border-slate-700/60 text-slate-100"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => setImage(reader.result);
                  reader.readAsDataURL(file);
                }}
              />
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost text-slate-300"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={createStatus}
              >
                Post
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)} />
        </div>
      )}

      {feed.length === 0 ? (
        <div className="text-slate-400 text-sm text-center py-8">No statuses yet.</div>
      ) : (
        <div className="space-y-2">
          {feed.map((s) => (
            <button
              type="button"
              key={s._id}
              onClick={() => openStatus(s)}
              className="w-full text-left bg-cyan-500/10 p-4 rounded-lg hover:bg-cyan-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`avatar ${s.viewed ? "" : "online"}`}>
                  <div className="size-12 rounded-full">
                    <img src={s.user?.profilePic || "/avatar.png"} alt={s.user?.fullName || "User"} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="text-slate-200 font-medium truncate">{s.user?.fullName}</h4>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(s.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">
                    {s.image ? "📷 Photo status" : s.text || "Status"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeStatus && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl bg-slate-900 border border-slate-700/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar">
                <div className="size-10 rounded-full">
                  <img
                    src={activeStatus.user?.profilePic || "/avatar.png"}
                    alt={activeStatus.user?.fullName || "User"}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 font-medium truncate">
                  {activeStatus.user?.fullName || "User"}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(activeStatus.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {activeStatus.image && (
              <div className="mb-4">
                <img
                  src={activeStatus.image}
                  alt="Status"
                  className="w-full max-h-[60vh] object-contain rounded-lg border border-slate-800"
                />
              </div>
            )}

            {activeStatus.text && (
              <p className="text-slate-200 whitespace-pre-wrap">{activeStatus.text}</p>
            )}

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost text-slate-300"
                onClick={() => setActiveStatus(null)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setActiveStatus(null)} />
        </div>
      )}
    </>
  );
}

export default StatusList;

