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

const Call = ({ socket, user, otherUser, type = "video", onEnd }) => {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);

  const [state, setState] = useState(null); // calling | incoming | connected
  const [caller, setCaller] = useState(null);
  const [timer, setTimer] = useState(0);

  const iceConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // ================= SOCKET EVENTS =================
  useEffect(() => {
    socket.on("incoming-call", ({ from }) => {
      setCaller(from);
      setState("incoming");
    });

    socket.on("call-accepted", () => {
      createOffer(); // ONLY CALLER DOES THIS
    });

    socket.on("webrtc-offer", async ({ offer }) => {
      await createAnswer(offer);
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      await pcRef.current.setRemoteDescription(answer);
    });

    socket.on("webrtc-ice", ({ candidate }) => {
      if (candidate && pcRef.current)
        pcRef.current.addIceCandidate(candidate);
    });

    socket.on("call-ended", cleanup);

    return () => socket.removeAllListeners();
  }, []);

  // ================= CORE WEBRTC =================
  const createPeer = async () => {
    pcRef.current = new RTCPeerConnection(iceConfig);

    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    streamRef.current.getTracks().forEach((t) =>
      pcRef.current.addTrack(t, streamRef.current)
    );

    pcRef.current.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
    };

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc-ice", {
          to: otherUser._id,
          candidate: e.candidate,
        });
      }
    };

    if (localRef.current) localRef.current.srcObject = streamRef.current;
  };

  const createOffer = async () => {
    await createPeer();
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.emit("webrtc-offer", { to: otherUser._id, offer });
    setState("connected");
  };

  const createAnswer = async (offer) => {
    await createPeer();
    await pcRef.current.setRemoteDescription(offer);
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    socket.emit("webrtc-answer", { to: caller._id, answer });
    setState("connected");
  };

  // ================= USER ACTIONS =================
  const startCall = () => {
    setState("calling");
    socket.emit("call-user", { to: otherUser._id, from: user });
  };

  const acceptCall = () => {
    socket.emit("accept-call", { to: caller._id });
  };

  const endCall = () => {
    socket.emit("end-call", { to: otherUser?._id || caller?._id });
    cleanup();
  };

  const cleanup = () => {
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current = null;
    setState(null);
    setCaller(null);
    setTimer(0);
    onEnd?.();
  };

  // ================= TIMER =================
  useEffect(() => {
    if (state !== "connected") return;
    const i = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [state]);

  const formatTime = () =>
    `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(
      timer % 60
    ).padStart(2, "0")}`;

 return (
  <div className="call-ui">
    {state === "connected" && (
      <>
        {type === "video" && (
          <>
            <video ref={remoteRef} autoPlay playsInline />
            <video ref={localRef} autoPlay muted playsInline className="pip" />
          </>
        )}
        <div>{formatTime()}</div>
        <button onClick={endCall}>End</button>
      </>
    )}

    {state === "calling" && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 3000,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "30px 40px",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <h3>Calling...</h3>
          <button
            onClick={endCall}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#dc3545",
              color: "white",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )}

    {state === "incoming" && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 3000,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "30px 40px",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <h3>Incoming Call</h3>
          <div
            style={{
              marginTop: "15px",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={acceptCall}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#198754",
                color: "white",
                cursor: "pointer",
              }}
            >
              Accept
            </button>
            <button
              onClick={endCall}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#dc3545",
                color: "white",
                cursor: "pointer",
              }}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    )}

    {!state && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 3000,
        }}
      >
        <button
          onClick={startCall}
          style={{
            padding: "15px 25px",
            fontSize: "18px",
            borderRadius: "10px",
            backgroundColor: type === "video" ? "#0d6efd" : "#198754",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Start {type === "video" ? "Video" : "Audio"} Call
        </button>
      </div>
    )}
  </div>
);
}

export default Call;