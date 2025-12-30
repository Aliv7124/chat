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


import React, { useEffect, useRef, useState } from "react";

const ICE_SERVERS = { 
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }] 
};

const Call = ({ socket, user, otherUser, type, onEnd, isCaller }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);
  
  const [seconds, setSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // 1. Synchronized Timer (Starts only when isConnected is true)
  useEffect(() => {
    let interval = null;
    if (isConnected) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isConnected]);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const start = async () => {
      try {
        pc.current = new RTCPeerConnection(ICE_SERVERS);

        // 2. High-Quality Audio Constraints
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: type === "video",
          audio: {
            echoCancellation: true, // Prevents hearing yourself back
            noiseSuppression: true, // Filters background hums
            autoGainControl: true   // Normalizes volume
          },
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;

        localStream.current.getTracks().forEach((track) => {
          pc.current.addTrack(track, localStream.current);
        });

        // 3. THE SYNC POINT: Timer starts here for BOTH users
        pc.current.ontrack = (e) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
            setIsConnected(true); // HANDSHAKE COMPLETE
          }
        };

        pc.current.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("webrtc-ice", { to: otherUser._id, candidate: e.candidate });
          }
        };

        // 4. Signaling Listeners
        socket.on("webrtc-offer", async ({ offer }) => {
          if (!pc.current) return;
          await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          socket.emit("webrtc-answer", { to: otherUser._id, answer });
        });

        socket.on("webrtc-answer", async ({ answer }) => {
          if (pc.current) await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("webrtc-ice", async ({ candidate }) => {
          if (pc.current && candidate) await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        // 5. Handshake Initiation
        if (isCaller) {
          // A tiny delay ensures the callee's listeners are ready
          setTimeout(async () => {
            if (pc.current) {
              const offer = await pc.current.createOffer();
              await pc.current.setLocalDescription(offer);
              socket.emit("webrtc-offer", { to: otherUser._id, offer });
            }
          }, 1000);
        }

      } catch (err) {
        console.error("Connection failed:", err);
        onEnd();
      }
    };

    start();

    return () => {
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice");
      if (localStream.current) localStream.current.getTracks().forEach(t => t.stop());
      if (pc.current) pc.current.close();
    };
  }, [otherUser._id]);

  return (
    <div className="bg-black position-fixed top-0 start-0 w-100 vh-100 d-flex flex-column" style={{ zIndex: 10000 }}>
      {/* Header UI */}
      <div className="position-absolute top-0 w-100 p-4 text-center text-white" style={{ zIndex: 11 }}>
        <h5 className="mb-1">{otherUser.name || "User"}</h5>
        <div className={`badge rounded-pill px-3 py-2 ${isConnected ? "bg-success" : "bg-danger pulse-text"}`}>
          {isConnected ? formatTime(seconds) : "Connecting Audio/Video..."}
        </div>
      </div>

      <video ref={remoteVideoRef} autoPlay playsInline className="w-100 h-100 object-fit-cover" />
      
      <video 
        ref={localVideoRef} 
        autoPlay muted playsInline 
        className="position-absolute bottom-0 end-0 m-4 rounded-3 border border-2 border-white shadow-lg" 
        style={{ width: "150px", transform: "scaleX(-1)" }} // Mirrors your own view
      />

      {/* Hangup Button */}
      <div className="position-absolute bottom-0 w-100 mb-5 d-flex justify-content-center">
        <button 
          className="btn btn-danger btn-lg rounded-circle p-3" 
          onClick={() => { socket.emit("end-call", { to: otherUser._id }); onEnd(); }}
        >
          <span style={{ fontSize: "1.5rem" }}>🔚</span>
        </button>
      </div>

      <style>{`
        .pulse-text { animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Call;