import { Buffer } from "buffer";
import { globalThis as global } from "global";
window.Buffer = Buffer;

import React, { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

const Call = ({ socket, user, selectedUser, onEndCall }) => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callIncoming, setCallIncoming] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [peer, setPeer] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [calling, setCalling] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState("00:00");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ✅ Get local media stream
  useEffect(() => {
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.error("Error accessing camera/mic:", err);
      }
    };
    getMedia();
  }, []);

  // ✅ Listen for incoming calls (only if socket exists)
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ from, signalData }) => {
      if (from === selectedUser._id) {
        setCallIncoming(true);
        const p = new SimplePeer({ initiator: false, trickle: false, stream });
        p.on("signal", (signal) => {
          socket.emit("acceptCall", { to: from, signalData: signal });
        });
        p.on("stream", (remote) => setRemoteStream(remote));
        p.signal(signalData);
        setPeer(p);
      }
    };

    const handleCallAccepted = ({ signalData }) => {
      peer?.signal(signalData);
      setCallAccepted(true);
      setCalling(false);
      setCallStartTime(Date.now());
    };

    const handleCallRejected = () => {
      alert("Call rejected by user");
      cleanupCall();
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("callRejected", handleCallRejected);
    socket.on("callEnded", handleCallEnded);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callRejected", handleCallRejected);
      socket.off("callEnded", handleCallEnded);
    };
  }, [socket, peer, stream, selectedUser]);

  const callUser = () => {
    if (!selectedUser || !socket || !stream) return;
    setCalling(true);
    const p = new SimplePeer({ initiator: true, trickle: false, stream });
    setPeer(p);

    p.on("signal", (signalData) => {
      socket.emit("callUser", {
        to: selectedUser._id,
        from: user._id,
        signalData,
      });
    });

    p.on("stream", (remote) => setRemoteStream(remote));
  };

  const acceptCall = () => {
    setCallAccepted(true);
    setCallIncoming(false);
    setCallStartTime(Date.now());
  };

  const endCall = () => {
    if (socket) socket.emit("endCall", { to: selectedUser._id });
    cleanupCall();
  };

  const cleanupCall = () => {
    peer?.destroy();
    setPeer(null);
    setCallAccepted(false);
    setCallIncoming(false);
    setCalling(false);
    setRemoteStream(null);
    setCallStartTime(null);
    setCallDuration("00:00");
    if (onEndCall) onEndCall();
  };

  const toggleAudio = () => {
    if (!stream) return;
    stream.getAudioTracks()[0].enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    if (!stream) return;
    stream.getVideoTracks()[0].enabled = !videoEnabled;
    setVideoEnabled(!videoEnabled);
  };

  useEffect(() => {
    let timer;
    if (callAccepted && callStartTime) {
      timer = setInterval(() => {
        const diff = Date.now() - callStartTime;
        const minutes = String(Math.floor(diff / 60000)).padStart(2, "0");
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        setCallDuration(`${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callAccepted, callStartTime]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.9)",
        zIndex: 3000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", width: "80%", height: "70%" }}>
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", borderRadius: "10px" }}
            srcObject={remoteStream}
          />
        ) : callIncoming || calling ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "1.2rem",
              background: "#333",
              borderRadius: "10px",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {callIncoming ? (
              <p>Incoming Call from {selectedUser.name}</p>
            ) : (
              <p>Ringing...</p>
            )}
          </div>
        ) : null}

        {stream && (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "150px",
              height: "150px",
              position: "absolute",
              bottom: "10px",
              right: "10px",
              borderRadius: "50%",
              border: "2px solid #fff",
            }}
          />
        )}
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
        {callIncoming && !callAccepted && (
          <>
            <button className="btn btn-success" onClick={acceptCall}>
              Accept
            </button>
            <button className="btn btn-danger" onClick={endCall}>
              Reject
            </button>
          </>
        )}

        {!callIncoming && !callAccepted && !calling && (
          <button className="btn btn-primary" onClick={callUser}>
            Call
          </button>
        )}

        {callAccepted && (
          <>
            <button className="btn btn-warning" onClick={toggleAudio}>
              {audioEnabled ? "Mute" : "Unmute"}
            </button>
            <button className="btn btn-warning" onClick={toggleVideo}>
              {videoEnabled ? "Video Off" : "Video On"}
            </button>
            <span
              style={{
                color: "#fff",
                fontSize: "1rem",
                margin: "0 10px",
                alignSelf: "center",
              }}
            >
              {callDuration}
            </span>
            <button className="btn btn-danger" onClick={endCall}>
              End Call
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Call;
