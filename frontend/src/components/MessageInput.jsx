import { useEffect, useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, CornerDownLeftIcon, MicIcon, SquareIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const { sendMessage, isSoundEnabled, selectedChat, replyTo, setReplyTo } = useChatStore();
  const { socket } = useAuthStore();

  // debounce typing indicator
  const typingTimeoutRef = useRef(null);

  const emitTyping = (isTyping) => {
    if (!socket || !selectedChat || selectedChat.type !== "dm") return;
    socket.emit("typing", { receiverId: selectedChat._id, isTyping });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioPreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({
      text: text.trim(),
      image: imagePreview,
      audio: audioPreview,
    });
    emitTyping(false);
    setText("");
    setImagePreview(null);
    setAudioPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioPreview(reader.result);
        };
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioPreview(null);
  };

  return (
    <div className="p-4 border-t border-slate-700/50">
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {audioPreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center bg-slate-800 p-2 rounded-lg border border-slate-700 relative w-fit">
          <audio controls src={audioPreview} className="h-10 outline-none" />
          <button
            onClick={removeAudio}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 hover:bg-slate-600"
            type="button"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {isRecording && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center justify-between bg-slate-800/80 border border-red-500/50 p-3 rounded-lg animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
            <span className="text-red-400 text-sm font-medium">Recording audio...</span>
          </div>
          <button
            onClick={stopRecording}
            className="text-slate-300 hover:text-white"
            type="button"
          >
            <SquareIcon className="w-5 h-5 fill-red-500 text-red-500" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex flex-col gap-2">
        {replyTo && (
          <div className="flex items-center justify-between bg-slate-800/70 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <CornerDownLeftIcon className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold">Replying to:</span>
              <span className="truncate max-w-[200px] opacity-80">
                {replyTo.text || "Media message"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex space-x-4">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();

            // send typing true immediately
            emitTyping(true);

            // clear previous timeout and schedule typing false
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
          }}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4"
          placeholder="Type your message..."
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${
            imagePreview ? "text-cyan-500" : ""
          }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${
              audioPreview ? "text-cyan-500" : ""
            }`}
          >
            <MicIcon className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="bg-red-500/20 text-red-500 rounded-lg px-4 transition-colors hover:bg-red-500/30"
          >
            <SquareIcon className="w-5 h-5 fill-current" />
          </button>
        )}

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview && !audioPreview}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
        </div>
      </form>
    </div>
  );
}
export default MessageInput;
