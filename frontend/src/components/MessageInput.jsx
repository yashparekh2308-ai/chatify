import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { 
  ImageIcon, 
  SendIcon, 
  XIcon, 
  CornerDownLeftIcon, 
  MicIcon, 
  SquareIcon, 
  PaperclipIcon, 
  FileTextIcon, 
  CameraIcon,
  VideoIcon
} from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);

  const [showCameraModal, setShowCameraModal] = useState(false);

  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const videoElementRef = useRef(null);
  const videoStreamRef = useRef(null);
  const canvasRef = useRef(null);

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
    if (!text.trim() && !imagePreview && !audioPreview && !videoPreview && !documentPreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({
      text: text.trim(),
      image: imagePreview,
      audio: audioPreview,
      video: videoPreview,
      document: documentPreview,
    });
    emitTyping(false);
    setText("");
    setImagePreview(null);
    setAudioPreview(null);
    setVideoPreview(null);
    setDocumentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
    
    // Close the dropdown if open (daisyUI trick: blur active element)
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video must be less than 50MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setVideoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select an image or video");
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Document must be less than 50MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentPreview({
        base64: reader.result,
        name: file.name,
        size: file.size,
        format: file.name.split('.').pop()
      });
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setImagePreview(null);
    setVideoPreview(null);
    setDocumentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
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

  // Camera Functions
  const openCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStreamRef.current = stream;
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera");
      setShowCameraModal(false);
    }
    if (document.activeElement) document.activeElement.blur();
  };

  const closeCamera = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const takePhoto = () => {
    if (videoElementRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      // Set canvas dimensions to match video
      canvasRef.current.width = videoElementRef.current.videoWidth;
      canvasRef.current.height = videoElementRef.current.videoHeight;
      context.drawImage(videoElementRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setImagePreview(dataUrl);
      closeCamera();
    }
  };

  // Cleanup camera stream if component unmounts
  useEffect(() => {
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="p-4 border-t border-slate-700/50">
      {/* MEDIA PREVIEWS */}
      {(imagePreview || videoPreview || documentPreview) && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="relative">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border border-slate-700"
              />
            )}
            {videoPreview && (
              <div className="w-24 h-24 rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden">
                <VideoIcon className="w-8 h-8 text-cyan-500 opacity-50 absolute" />
                <video src={videoPreview} className="w-full h-full object-cover opacity-80" />
              </div>
            )}
            {documentPreview && (
              <div className="w-48 h-16 rounded-lg border border-slate-700 bg-slate-900 flex items-center px-3 gap-3">
                <FileTextIcon className="w-8 h-8 text-purple-400 shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-slate-200 truncate">{documentPreview.name}</span>
                  <span className="text-xs text-slate-400">{(documentPreview.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            )}
            <button
              onClick={removeMedia}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 hover:bg-slate-600 shadow-lg"
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

      {/* INPUT FORM */}
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

        <div className="flex space-x-2 items-center">
          
          {/* ATTACHMENT DROPDOWN */}
          <div className="dropdown dropdown-top dropdown-end sm:dropdown-start">
            <button 
              type="button" 
              tabIndex={0} 
              className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg p-3 transition-colors ${
                (imagePreview || videoPreview || documentPreview) ? "text-cyan-500" : ""
              }`}
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            <ul tabIndex={0} className="dropdown-content z-[2] menu p-2 shadow-xl bg-slate-900 border border-slate-700 rounded-box w-52 mb-2">
              <li>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-200 hover:bg-slate-800">
                  <ImageIcon className="w-4 h-4 text-cyan-400" /> Photo/Video
                </button>
              </li>
              <li>
                <button type="button" onClick={() => documentInputRef.current?.click()} className="text-slate-200 hover:bg-slate-800">
                  <FileTextIcon className="w-4 h-4 text-purple-400" /> Document
                </button>
              </li>
              <li>
                <button type="button" onClick={openCamera} className="text-slate-200 hover:bg-slate-800">
                  <CameraIcon className="w-4 h-4 text-emerald-400" /> Camera
                </button>
              </li>
            </ul>
          </div>

          <input
            type="file"
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            ref={documentInputRef}
            onChange={handleDocumentChange}
            className="hidden"
          />

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
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2.5 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            placeholder="Type your message..."
          />

          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg p-3 transition-colors ${
                audioPreview ? "text-cyan-500" : ""
              }`}
            >
              <MicIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="bg-red-500/20 text-red-500 rounded-lg p-3 transition-colors hover:bg-red-500/30"
            >
              <SquareIcon className="w-5 h-5 fill-current" />
            </button>
          )}

          <button
            type="submit"
            disabled={!text.trim() && !imagePreview && !audioPreview && !videoPreview && !documentPreview}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2.5 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* CAMERA MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl max-w-2xl w-full p-4 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <CameraIcon className="w-5 h-5 text-cyan-400" /> Take Photo
              </h3>
              <button onClick={closeCamera} className="text-slate-400 hover:text-white bg-slate-800 rounded-full p-1">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 mb-6 flex items-center justify-center">
              <video 
                ref={videoElementRef} 
                autoPlay 
                playsInline 
                 className="w-full h-full object-contain"
              ></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>

            <button 
              onClick={takePhoto}
              className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 border-4 border-slate-800 shadow-[0_0_0_4px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105"
              title="Take Photo"
            ></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageInput;
