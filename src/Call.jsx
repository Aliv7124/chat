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
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // public STUN
    // TURN server optional for production
  ],
};

const Call = ({ socket, user, otherUser, type, onEnd }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    pcRef.current = new RTCPeerConnection(ICE_SERVERS);

    pcRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    const startLocalStream = async () => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      setStream(mediaStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
      mediaStream.getTracks().forEach((track) => pcRef.current.addTrack(track, mediaStream));
    };

    startLocalStream();

    socket.on("webrtc-offer", async ({ offer }) => {
      await pcRef.current.setRemoteDescription(offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: otherUser._id, answer });
      setCallAccepted(true);
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      await pcRef.current.setRemoteDescription(answer);
      setCallAccepted(true);
    });

    socket.on("webrtc-ice", async ({ candidate }) => {
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice");
    };
  }, []);

  // ICE candidates
  useEffect(() => {
    if (!pcRef.current) return;
    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice", { to: otherUser._id, candidate: event.candidate });
      }
    };
  }, [pcRef.current]);

  const callUser = async () => {
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.emit("webrtc-offer", { to: otherUser._id, offer });
  };

  const acceptCall = async () => {
    socket.emit("accept-call", { from: otherUser._id });
    setCallAccepted(true);
  };

  const rejectCall = () => {
    socket.emit("reject-call", { from: otherUser._id });
    onEnd();
  };

  const endCall = () => {
    socket.emit("end-call", { to: otherUser._id });
    onEnd();
  };

  return (
    <div
      className="position-relative d-flex justify-content-center align-items-center flex-column"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 10000,
      }}
    >
      <div className="d-flex gap-2">
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "200px" }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "400px" }} />
      </div>

      {!callAccepted && (
        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-success" onClick={acceptCall}>
            Accept
          </button>
          <button className="btn btn-danger" onClick={rejectCall}>
            Reject
          </button>
        </div>
      )}

      {callAccepted && (
        <button className="btn btn-danger mt-3" onClick={endCall}>
          End Call
        </button>
      )}

      {!callAccepted && type === "audio" && callUser()} {/* auto start caller */}
    </div>
  );
};

export default Call;
