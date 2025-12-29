/*
import React, { useEffect, useRef, useState } from "react";

const Call = ({ socket, user, selectedUser, type = "video", onClose }) => {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const remoteOfferRef = useRef(null);

  const [incoming, setIncoming] = useState(false);
  const [caller, setCaller] = useState(null);
  const [calling, setCalling] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [timer, setTimer] = useState(0);

  const iceConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  // ---------------- Socket Events ----------------
  useEffect(() => {
    socket.on("incomingCall", ({ from, offer }) => {
      setIncoming(true);
      setCaller(from);
      remoteOfferRef.current = offer;
    });

    socket.on("callAnswered", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCalling(false);
        setCallStarted(true); // start timer
      }
    });

    socket.on("iceCandidate", ({ candidate }) => {
      if (peerRef.current && candidate) peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
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

  // ---------------- Timer ----------------
  useEffect(() => {
    let interval;
    if (callStarted) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    } else setTimer(0);
    return () => clearInterval(interval);
  }, [callStarted]);

  // ---------------- Peer Connection ----------------
  const createPeer = async (isCaller) => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localRef.current.srcObject = streamRef.current;

    const peer = new RTCPeerConnection(iceConfig);
    peerRef.current = peer;

    streamRef.current.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));

    peer.ontrack = (e) => (remoteRef.current.srcObject = e.streams[0]);
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
      socket.emit("callUser", { to: selectedUser._id, from: user._id, offer });
    } else {
      await peer.setRemoteDescription(new RTCSessionDescription(remoteOfferRef.current));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answerCall", { to: caller, answer });
      setIncoming(false);
      setCallStarted(true); // start timer
    }
  };

  const startCall = async () => {
    setCalling(true);
    await createPeer(true);
  };

  const acceptCall = async () => {
    await createPeer(false);
  };

  const cleanup = () => {
    peerRef.current?.close();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIncoming(false);
    setCalling(false);
    setCallStarted(false);
    onClose();
  };

  const endCall = () => {
    socket.emit("endCall", { to: selectedUser?._id || caller });
    cleanup();
  };

  const rejectCall = () => {
    socket.emit("rejectCall", { to: caller });
    cleanup();
  };

  const formatTimer = () => `${Math.floor(timer / 60).toString().padStart(2, "0")}:${(timer % 60).toString().padStart(2, "0")}`;

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
          <video ref={localRef} autoPlay muted playsInline style={{ width: "200px", position: "absolute", bottom: 20, right: 20 }} />
        </>
      ) : (
        <>
          <audio ref={remoteRef} autoPlay />
          <audio ref={localRef} autoPlay muted />
        </>
      )}

     
      {callStarted && (
        <div style={{ position: "absolute", top: 10, color: "white", fontSize: "1.2rem" }}>{formatTimer()}</div>
      )}

     
      {calling && !callStarted && (
        <div style={{ color: "white", fontSize: "1.2rem", marginBottom: 10 }}>
          Calling {selectedUser?.name || "User"}...
        </div>
      )}

     
      {incoming && !callStarted && (
        <div style={{ background: "#222", padding: 20, borderRadius: 10, color: "white", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h5>{caller?.name || "User"} is calling...</h5>
          <div className="d-flex gap-3 mt-3">
            <button onClick={acceptCall} className="btn btn-success">
              Accept
            </button>
            <button onClick={rejectCall} className="btn btn-danger">
              Reject
            </button>
          </div>
        </div>
      )}

     
      {!incoming && !calling && !callStarted && (
        <button onClick={startCall} className="btn btn-success mt-3">
          Start Call
        </button>
      )}
      {callStarted && (
        <button onClick={endCall} className="btn btn-danger mt-3">
          End Call
        </button>
      )}
    </div>
  );
};

export default Call;
*/


import React, { useEffect, useRef } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const Call = ({ socket, user, otherUser, type, onEnd, isCaller }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Use Refs for WebRTC objects to prevent state-closure issues
  const pc = useRef(null);
  const localStream = useRef(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        // 1. Setup PeerConnection instance
        pc.current = new RTCPeerConnection(ICE_SERVERS);

        // 2. Get local media
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: type === "video",
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }

        // 3. Add tracks to PeerConnection
        localStream.current.getTracks().forEach((track) => {
          pc.current.addTrack(track, localStream.current);
        });

        // 4. Handle incoming remote stream
        pc.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // 5. Send ICE candidates to the other user
        pc.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("webrtc-ice", { 
              to: otherUser._id, 
              candidate: event.candidate 
            });
          }
        };

        // 6. Signaling Handlers
        socket.on("webrtc-offer", async ({ offer, from }) => {
          if (from === otherUser._id) {
            await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            socket.emit("webrtc-answer", { to: from, answer });
          }
        });

        socket.on("webrtc-answer", async ({ answer, from }) => {
          if (from === otherUser._id) {
            await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on("webrtc-ice", async ({ candidate, from }) => {
          if (from === otherUser._id && candidate) {
            try {
              await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding received ICE candidate", err);
            }
          }
        });

        socket.on("call-ended", () => {
          cleanup();
          onEnd();
        });

        // 7. Start negotiation if Caller
        if (isCaller) {
          const offer = await pc.current.createOffer();
          await pc.current.setLocalDescription(offer);
          socket.emit("webrtc-offer", { to: otherUser._id, offer });
        }

      } catch (err) {
        console.error("Failed to init call", err);
        onEnd(); // Close UI if permissions fail
      }
    };

    initCall();

    return () => cleanup();
  }, [socket, otherUser._id, isCaller, type]);

  const cleanup = () => {
    socket.off("webrtc-offer");
    socket.off("webrtc-answer");
    socket.off("webrtc-ice");
    socket.off("call-ended");

    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
  };

  const handleEndCall = () => {
    socket.emit("end-call", { to: otherUser._id });
    cleanup();
    onEnd();
  };

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "240px",
          height: "180px",
          position: "absolute",
          bottom: "20px",
          right: "20px",
          border: "2px solid #fff",
          borderRadius: "12px",
          backgroundColor: "#222"
        }}
      />
      <div style={{ position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)" }}>
        <button onClick={handleEndCall} className="btn btn-danger btn-lg rounded-circle p-3">
          End Call
        </button>
      </div>
    </div>
  );
};

export default Call;