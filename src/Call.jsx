/*
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
  const [incomingSignal, setIncomingSignal] = useState(null);
  const [incomingFrom, setIncomingFrom] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  // ---------------- Media Initialization ----------------
  const initMedia = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia not supported in this browser");
        return null;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      setStream(mediaStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
      return mediaStream;
    } catch (err) {
      console.error("Failed to get media:", err);
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
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioEnabled(track.enabled);
  };

  const toggleVideo = () => {
    if (!stream || type !== "video") return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoEnabled(track.enabled);
  };

  // ---------------- Outgoing Call ----------------
  useEffect(() => {
    if (!socket || !user?._id || !selectedUser?._id || callStatus !== "calling" || peerRef.current) return;

    const startCall = async () => {
      const mediaStream = await initMedia();
      if (!mediaStream) {
        cleanup();
        return;
      }

      const peer = new SimplePeer({ initiator: true, trickle: false, stream: mediaStream });
      peerRef.current = peer;

      peer.on("signal", (signal) => {
        if (socket && selectedUser?._id && user?._id) {
          socket.emit("callUser", {
            to: selectedUser._id,
            from: user._id,
            signalData: signal,
            callType: type,
          });
        }
      });

      peer.on("stream", (remote) => setRemoteStream(remote));

      socket.once("callAccepted", ({ signalData }) => {
        if (peerRef.current) peerRef.current.signal(signalData);
        setCallStatus("inCall");
        setCallStartTime(Date.now());
      });

      socket.once("callRejected", cleanup);
      socket.once("callEnded", cleanup);
    };

    startCall();
  }, [socket, callStatus, user, selectedUser]);

  // ---------------- Incoming Call ----------------
  const handleIncomingCall = async ({ from, signalData, callType }) => {
    if (peerRef.current) return; // Already in a call
    setIncomingSignal(signalData);
    setIncomingFrom(from);
    setCallStatus("incoming");
  };

  useEffect(() => {
    if (!socket) return;
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callEnded", cleanup);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callEnded", cleanup);
    };
  }, [socket]);

  const acceptCall = async () => {
    if (!incomingSignal || !incomingFrom) return;

    const mediaStream = stream || (await initMedia());
    if (!mediaStream) {
      cleanup();
      return;
    }

    const peer = new SimplePeer({ initiator: false, trickle: false, stream: mediaStream });
    peerRef.current = peer;

    peer.on("signal", (answerSignal) => {
      if (socket && incomingFrom) {
        socket.emit("acceptCall", { to: incomingFrom, signalData: answerSignal });
        setCallStatus("inCall");
        setCallStartTime(Date.now());
      }
    });

    peer.on("stream", (remote) => setRemoteStream(remote));
    peer.signal(incomingSignal);

    setIncomingSignal(null);
    setIncomingFrom(null);
  };

  const rejectCall = () => {
    if (incomingFrom && socket) {
      socket.emit("rejectCall", { to: incomingFrom });
    }
    cleanup();
  };

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
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <p style={{ color: "#fff", textAlign: "center", paddingTop: "50%" }}>
                Waiting...
              </p>
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
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          )}
        </div>

    
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          {callStatus !== "incoming" && (
            <>
              <button onClick={toggleAudio}>{audioEnabled ? "Mute" : "Unmute"}</button>
              {type === "video" && (
                <button onClick={toggleVideo}>{videoEnabled ? "Video Off" : "Video On"}</button>
              )}
              <button onClick={endCall} style={{ background: "red", color: "#fff" }}>
                End Call
              </button>
            </>
          )}
          {callStatus === "incoming" && (
            <>
              <button onClick={acceptCall} style={{ background: "green", color: "#fff" }}>
                Accept
              </button>
              <button onClick={rejectCall} style={{ background: "red", color: "#fff" }}>
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
*/



import React, { useEffect, useRef, useState } from "react";

const Call = ({ socket, user, selectedUser, type = "video", onClose }) => {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const remoteOfferRef = useRef(null);

  const [incoming, setIncoming] = useState(false);
  const [caller, setCaller] = useState(null);

  const iceConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    socket.on("incomingCall", ({ from, offer }) => {
      setIncoming(true);
      setCaller(from);
      remoteOfferRef.current = offer;
    });

    socket.on("callAnswered", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("iceCandidate", ({ candidate }) => {
      if (peerRef.current && candidate) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("callEnded", cleanup);
    socket.on("callRejected", cleanup);

    return () => {
      socket.off("incomingCall");
      socket.off("callAnswered");
      socket.off("iceCandidate");
      socket.off("callEnded");
      socket.off("callRejected");
    };
  }, [socket]);

  const createPeer = async (isCaller) => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    localRef.current.srcObject = streamRef.current;

    const peer = new RTCPeerConnection(iceConfig);
    peerRef.current = peer;

    streamRef.current.getTracks().forEach((track) =>
      peer.addTrack(track, streamRef.current)
    );

    peer.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("iceCandidate", {
          to: isCaller ? selectedUser._id : caller,
          candidate: e.candidate,
        });
      }
    };

    if (isCaller) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("callUser", {
        to: selectedUser._id,
        from: user._id,
        offer,
      });
    } else {
      await peer.setRemoteDescription(
        new RTCSessionDescription(remoteOfferRef.current)
      );

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: caller,
        answer,
      });

      setIncoming(false);
    }
  };

  const startCall = async () => {
    await createPeer(true);
  };

  const acceptCall = async () => {
    await createPeer(false);
  };

  const cleanup = () => {
    peerRef.current?.close();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onClose();
  };

  const endCall = () => {
    socket.emit("endCall", {
      to: selectedUser?._id || caller,
    });
    cleanup();
  };

  const rejectCall = () => {
    socket.emit("rejectCall", { to: caller });
    cleanup();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {type === "video" ? (
        <>
          <video ref={remoteRef} autoPlay playsInline style={{ width: "80%" }} />
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "200px",
              position: "absolute",
              bottom: 20,
              right: 20,
            }}
          />
        </>
      ) : (
        <>
          <audio ref={remoteRef} autoPlay />
          <audio ref={localRef} autoPlay muted />
        </>
      )}

      {!incoming && (
        <button onClick={startCall} className="btn btn-success mt-3">
          Start Call
        </button>
      )}

      {incoming && (
        <div className="d-flex gap-3 mt-3">
          <button onClick={acceptCall} className="btn btn-success">
            Accept
          </button>
          <button onClick={rejectCall} className="btn btn-danger">
            Reject
          </button>
        </div>
      )}

      <button onClick={endCall} className="btn btn-danger mt-3">
        End Call
      </button>
    </div>
  );
};

export default Call;
