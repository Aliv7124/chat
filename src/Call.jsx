import { Buffer } from "buffer";
window.Buffer = Buffer;
if (typeof global === "undefined") window.global = window;
window.process = { env: {} };

import React, { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

const Call = ({ socket, user, selectedUser, type = "video", onClose }) => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("calling"); // calling | incoming | inCall
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(type === "video");
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState("00:00");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  // ---------------- Media ----------------
  const initMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      setStream(mediaStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
      return mediaStream;
    } catch (err) {
      console.error("Failed to get media:", err);
      cleanup();
      return null;
    }
  };

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ---------------- Call Timer ----------------
  useEffect(() => {
    let timer;
    if (callStatus === "inCall" && callStartTime) {
      timer = setInterval(() => {
        const diff = Date.now() - callStartTime;
        const minutes = String(Math.floor(diff / 60000)).padStart(2, "0");
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        setCallDuration(`${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus, callStartTime]);

  // ---------------- Cleanup ----------------
  const cleanup = () => {
    peerRef.current?.destroy();
    peerRef.current = null;
    stream?.getTracks().forEach((t) => t.stop());
    setRemoteStream(null);
    if (onClose) onClose();
  };

  const endCall = () => {
    if (socket && selectedUser?._id) {
      socket.emit("endCall", { to: selectedUser._id });
    }
    cleanup();
  };

  const toggleAudio = () => {
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setAudioEnabled(track.enabled);
  };

  const toggleVideo = () => {
    if (!stream || type !== "video") return;
    const track = stream.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setVideoEnabled(track.enabled);
  };

  // ---------------- Start Outgoing Call ----------------
  const startOutgoingCall = async () => {
    if (!socket || !user || !selectedUser || peerRef.current) return;

    const mediaStream = await initMedia();
    if (!mediaStream) return;

    const newPeer = new SimplePeer({ initiator: true, trickle: false, stream: mediaStream });
    peerRef.current = newPeer;

    newPeer.on("signal", (signalData) => {
      socket.emit("callUser", {
        to: selectedUser._id,
        from: user._id,
        signalData,
        callType: type,
      });
    });

    newPeer.on("stream", (remote) => setRemoteStream(remote));

    socket.on("callAccepted", ({ signalData }) => {
      newPeer.signal(signalData);
      setCallStatus("inCall");
      setCallStartTime(Date.now());
    });

    socket.on("callRejected", cleanup);
    socket.on("callEnded", cleanup);
  };

  useEffect(() => {
    if (callStatus === "calling") startOutgoingCall();

    return () => {
      socket?.off("callAccepted");
      socket?.off("callRejected");
      socket?.off("callEnded");
    };
  }, [socket, callStatus]);

  // ---------------- Handle Incoming Call ----------------
  const handleIncomingCall = async ({ from, signalData, callType }) => {
    if (!socket || !user || peerRef.current) return;

    const mediaStream = stream || (await initMedia());
    if (!mediaStream) return;

    setCallStatus("incoming");

    const answerPeer = new SimplePeer({ initiator: false, trickle: false, stream: mediaStream });
    peerRef.current = answerPeer;

    answerPeer.on("signal", (answerSignal) => {
      socket.emit("acceptCall", { to: from, signalData: answerSignal });
      setCallStatus("inCall");
      setCallStartTime(Date.now());
    });

    answerPeer.on("stream", (remote) => setRemoteStream(remote));
    answerPeer.signal(signalData);

    socket.on("endCall", cleanup);
  };

  useEffect(() => {
    socket?.on("incomingCall", handleIncomingCall);
    socket?.on("callEnded", cleanup);

    return () => {
      socket?.off("incomingCall", handleIncomingCall);
      socket?.off("callEnded", cleanup);
    };
  }, [socket, stream, user]);

  // ---------------- Render ----------------
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "600px",
          maxWidth: "90%",
          background: "#222",
          borderRadius: "12px",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#fff", fontWeight: "bold" }}>
            {callStatus === "incoming"
              ? "Incoming Call..."
              : callStatus === "calling"
              ? "Calling..."
              : `In Call: ${callDuration}`}
          </span>
          <button
            onClick={endCall}
            style={{
              background: "red",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              cursor: "pointer",
            }}
          >
            X
          </button>
        </div>

        {/* Video Streams */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div
            style={{
              flex: 1,
              background: "#000",
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%" }} />
            ) : (
              <p style={{ color: "#fff", textAlign: "center", paddingTop: "50%" }}>Waiting...</p>
            )}
          </div>

          {type === "video" && stream && (
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "8px",
                overflow: "hidden",
                border: "2px solid #fff",
              }}
            >
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%" }} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          {callStatus !== "incoming" && (
            <>
              <button onClick={toggleAudio}>{audioEnabled ? "Mute" : "Unmute"}</button>
              {type === "video" && <button onClick={toggleVideo}>{videoEnabled ? "Video Off" : "Video On"}</button>}
              <button onClick={endCall} style={{ background: "red", color: "#fff" }}>
                End Call
              </button>
            </>
          )}
          {callStatus === "incoming" && (
            <>
              <button onClick={() => setCallStatus("inCall")} style={{ background: "green", color: "#fff" }}>
                Accept
              </button>
              <button onClick={endCall} style={{ background: "red", color: "#fff" }}>
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Call;
