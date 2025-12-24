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
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  const [state, setState] = useState(null); // calling | incoming | connected
  const [timer, setTimer] = useState(0);
  const [caller, setCaller] = useState(null);

  const iceConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    socket.on("incoming-call", ({ from, type }) => {
      setCaller(from);
      setState("incoming");
    });

    socket.on("call-accepted", async () => {
      setState("connected");
      startWebRTC(true);
    });

    socket.on("call-ended", cleanup);

    socket.on("webrtc-offer", async ({ offer }) => {
      await startWebRTC(false, offer);
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("webrtc-ice", async ({ candidate }) => {
      if (candidate) {
        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("call-ended");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice");
    };
  }, [socket]);

  useEffect(() => {
    let interval;
    if (state === "connected") {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  const startWebRTC = async (isCaller, remoteOffer = null) => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    if (localRef.current) localRef.current.srcObject = streamRef.current;

    peerRef.current = new RTCPeerConnection(iceConfig);

    streamRef.current.getTracks().forEach((track) =>
      peerRef.current.addTrack(track, streamRef.current)
    );

    peerRef.current.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
    };

    peerRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc-ice", {
          to: otherUser._id,
          candidate: e.candidate,
        });
      }
    };

    if (isCaller) {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("webrtc-offer", { to: otherUser._id, offer });
    } else {
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(remoteOffer)
      );
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: caller._id, answer });
      setState("connected");
    }
  };

  const startCall = () => {
    setState("calling");
    socket.emit("call-user", { to: otherUser._id, from: user, type });
  };

  const acceptCall = () => {
    socket.emit("accept-call", { to: caller._id });
  };

  const endCall = () => {
    socket.emit("end-call", { to: otherUser?._id || caller?._id });
    cleanup();
  };

  const cleanup = () => {
    peerRef.current?.close();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setTimer(0);
    setState(null);
    setCaller(null);
    onEnd && onEnd();
  };

  const formatTime = () =>
    `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(
      timer % 60
    ).padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      {state === "connected" && (
        <>
          {type === "video" && (
            <>
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                style={{ width: "85%" }}
              />
              <video
                ref={localRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: 180,
                  position: "absolute",
                  bottom: 20,
                  right: 20,
                  borderRadius: 10,
                }}
              />
            </>
          )}
          {type === "audio" && <audio ref={remoteRef} autoPlay />}
          <div style={{ position: "absolute", top: 15 }}>{formatTime()}</div>
          <button onClick={endCall} className="btn btn-danger mt-3">
            End Call
          </button>
        </>
      )}

      {state === "calling" && (
        <>
          <h4>Calling...</h4>
          <button onClick={endCall} className="btn btn-danger mt-3">
            Cancel
          </button>
        </>
      )}

      {state === "incoming" && (
        <div className="bg-dark p-4 rounded">
          <h4>Incoming Call</h4>
          <div className="d-flex gap-3 mt-3">
            <button onClick={acceptCall} className="btn btn-success">
              Accept
            </button>
            <button onClick={endCall} className="btn btn-danger">
              Reject
            </button>
          </div>
        </div>
      )}

      {!state && (
        <button onClick={startCall} className="btn btn-success">
          Start Call
        </button>
      )}
    </div>
  );
};

export default Call;
