import { Buffer } from "buffer"; 
window.Buffer = Buffer;
if (typeof global === "undefined") window.global = window;
window.process = { env: {} };

import React, { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

const Call = ({ socket, user, selectedUser, type = "video", onEndCall, onClose }) => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // idle | calling | ringing | inCall
  const [peer, setPeer] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(type === "video");
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState("00:00");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ---------------- Media Setup ----------------
  useEffect(() => {
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
        });
        setStream(mediaStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.error("Error accessing media:", err);
      }
    };
    getMedia();
  }, [type]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ---------------- Call Duration Timer ----------------
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

  // ---------------- Socket Listeners ----------------
  useEffect(() => {
    if (!socket) return;

    socket.on("call-made", ({ from, signal }) => {
      if (callStatus === "idle") {
        setCallStatus("ringing");

        const incomingPeer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream,
        });

        incomingPeer.on("signal", (answerSignal) => {
          socket.emit("make-answer", { to: from, signal: answerSignal });
        });

        incomingPeer.on("stream", (remoteStream) => {
          setRemoteStream(remoteStream);
          setCallStatus("inCall");
          setCallStartTime(Date.now());
        });

        incomingPeer.signal(signal);
        setPeer(incomingPeer);
      }
    });

    socket.on("answer-made", ({ signal }) => {
      peer?.signal(signal);
      setCallStatus("inCall");
      setCallStartTime(Date.now());
    });

    return () => {
      socket.off("call-made");
      socket.off("answer-made");
    };
  }, [socket, stream, peer, callStatus]);

  // ---------------- Call Functions ----------------
  const startCall = () => {
    if (!stream) return;

    const outgoingPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    outgoingPeer.on("signal", (signal) => {
      socket.emit("call-user", { to: selectedUser._id, signal });
    });

    outgoingPeer.on("stream", (remoteStream) => {
      setRemoteStream(remoteStream);
      setCallStatus("inCall");
      setCallStartTime(Date.now());
    });

    setPeer(outgoingPeer);
    setCallStatus("calling");
  };

  const endCall = () => {
    peer?.destroy();
    setPeer(null);
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setRemoteStream(null);
    setCallStatus("idle");
    setCallStartTime(null);
    setCallDuration("00:00");

    if (socket && selectedUser) socket.emit("endCall", { to: selectedUser._id });
    if (onEndCall) onEndCall();
    if (onClose) onClose();
  };

  const toggleAudio = () => {
    if (!stream) return;
    stream.getAudioTracks()[0].enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    if (!stream || type !== "video") return;
    stream.getVideoTracks()[0].enabled = !videoEnabled;
    setVideoEnabled(!videoEnabled);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        width: "600px", maxWidth: "90%", background: "#222", borderRadius: "12px",
        padding: "10px", display: "flex", flexDirection: "column", gap: "10px"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#fff", fontWeight: "bold" }}>
            {callStatus === "idle" && "Ready"}
            {callStatus === "calling" && "Calling..."}
            {callStatus === "ringing" && "Incoming Call"}
            {callStatus === "inCall" && `In Call: ${callDuration}`}
          </span>
          <button onClick={endCall} style={{
            background: "red", color: "#fff", border: "none", borderRadius: "50%",
            width: "30px", height: "30px", cursor: "pointer"
          }}>X</button>
        </div>

        {/* Video Section */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ flex: 1, background: "#000", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%" }} />
            ) : (
              <p style={{ color: "#fff", textAlign: "center", paddingTop: "50%" }}>
                {callStatus === "ringing" ? "Ringing..." : "Waiting..."}
              </p>
            )}
          </div>
          {type === "video" && stream && (
            <div style={{ width: "150px", height: "150px", borderRadius: "8px", overflow: "hidden", border: "2px solid #fff" }}>
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%" }} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          {callStatus === "idle" && <button onClick={startCall}>Call</button>}
          {callStatus === "inCall" && (
            <>
              <button onClick={toggleAudio}>{audioEnabled ? "Mute" : "Unmute"}</button>
              {type === "video" && <button onClick={toggleVideo}>{videoEnabled ? "Video Off" : "Video On"}</button>}
              <button onClick={endCall} style={{ background: "red", color: "#fff" }}>End Call</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Call;
