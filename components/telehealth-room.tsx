"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, ClipboardList, FileText, MessageCircle, Mic, MicOff, MonitorUp, PhoneOff, Send, ShieldAlert, Video } from "lucide-react";

export function TelehealthRoom({ appointmentId }: { appointmentId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [deviceMessage, setDeviceMessage] = useState("Your camera is off. Start a device check to preview your camera locally.");
  const [permissionError, setPermissionError] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([{ id: 1, mine: false, body: "Hello Maya, I can see your appointment notes here. What would you like to discuss today?" }, { id: 2, mine: true, body: "I’ve had a few questions about my recent checkup." }]);
  const [notes, setNotes] = useState("Patient questions and context\n\nDemo note only — do not enter real protected health information.");
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionReady, setPrescriptionReady] = useState(false);

  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); screenRef.current?.getTracks().forEach((track) => track.stop()); }, []);

  async function startCamera() {
    setPermissionError("");
    if (!navigator.mediaDevices?.getUserMedia) { setPermissionError("Camera access is not available in this browser or connection."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true); setMicOn(true); setDeviceMessage("Camera and microphone preview running on this device only.");
    } catch { setPermissionError("Camera or microphone permission was denied or unavailable. You can still explore this demo room."); setCameraOn(false); }
  }
  function toggleCamera() {
    if (!streamRef.current) { void startCamera(); return; }
    const next = !cameraOn;
    streamRef.current.getVideoTracks().forEach((track) => { track.enabled = next; });
    setCameraOn(next);
  }
  function toggleMic() {
    if (!streamRef.current) { void startCamera(); return; }
    const next = !micOn;
    streamRef.current.getAudioTracks().forEach((track) => { track.enabled = next; });
    setMicOn(next);
  }
  async function toggleShare() {
    if (sharing) { screenRef.current?.getTracks().forEach((track) => track.stop()); screenRef.current = null; setSharing(false); setDeviceMessage("Screen sharing stopped."); return; }
    if (!navigator.mediaDevices?.getDisplayMedia) { setPermissionError("Screen sharing is not available in this browser."); return; }
    try { screenRef.current = await navigator.mediaDevices.getDisplayMedia({ video: true }); setSharing(true); setDeviceMessage("Screen is being shared locally in this demo. No remote participant is connected."); screenRef.current.getVideoTracks()[0]?.addEventListener("ended", () => { setSharing(false); setDeviceMessage("Screen sharing stopped."); }); }
    catch { setPermissionError("Screen sharing permission was cancelled or unavailable."); }
  }
  function sendMessage(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!text.trim()) return; setMessages((current) => [...current, { id: Date.now(), mine: true, body: text.trim() }]); setText(""); }

  return (
    <div className="consult-room">
      <div className="container">
        <div className="consult-head"><div><span className="eyebrow">Carewell consultation</span><h1 style={{ marginTop: 6 }}>Your visit room</h1><p>Appointment {appointmentId} · 15-minute demo session</p></div><span className="demo-note"><ShieldAlert size={11} /> Demo room · not a live clinical session</span></div>
        <div className="consult-layout">
          <section className="video-area" aria-label="Video consultation preview">
            <div className="video-label"><span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><span className="pulse-dot" style={{ background: "#f0b84a" }} /> Local device check</span><span>00:00</span></div>
            <div className="remote-person"><div className="remote-avatar">AS</div><h2>Dr. Ava Shah</h2><p>Demo clinician · Remote video isn’t connected</p><div style={{ marginTop: 15, color: "#b6cad2", textAlign: "center", fontSize: 9, lineHeight: 1.6 }}>{deviceMessage}</div></div>
            <div className="local-video">{cameraOn ? <video ref={videoRef} autoPlay muted playsInline aria-label="Local camera preview" /> : <div className="local-fallback">Your preview</div>}</div>
            <div className="media-wrap"><div className="media-controls"><button className={`media-control ${!micOn ? "danger" : ""}`} type="button" onClick={toggleMic} aria-label={micOn ? "Mute audio" : "Unmute audio"}>{micOn ? <Mic size={17} /> : <MicOff size={17} />}<span>{micOn ? "Mute" : "Unmute"}</span></button><button className={`media-control ${!cameraOn ? "danger" : ""}`} type="button" onClick={toggleCamera} aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}>{cameraOn ? <Camera size={17} /> : <CameraOff size={17} />}<span>{cameraOn ? "Camera" : "Start video"}</span></button><button className={`media-control ${sharing ? "danger" : ""}`} type="button" onClick={toggleShare} aria-label={sharing ? "Stop screen share" : "Share screen"}><MonitorUp size={17} /><span>{sharing ? "Stop share" : "Share screen"}</span></button><button className="media-control danger" type="button" onClick={() => { streamRef.current?.getTracks().forEach((track) => track.stop()); screenRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; screenRef.current = null; setCameraOn(false); setMicOn(false); setSharing(false); setDeviceMessage("Local device preview stopped. This demo has no active remote call."); }} aria-label="Leave the room"><PhoneOff size={17} /><span>Leave</span></button></div></div>
          </section>
          <aside className="consult-sidebar">
            <section className="clinical-card"><h3><ClipboardList size={14} style={{ verticalAlign: "-3px", marginRight: 5, color: "#0b91c1" }} /> Clinical notes <span style={{ color: "#a1acb2", fontSize: 8, fontWeight: 500 }}>· demo only</span></h3><textarea value={notes} onChange={(event) => setNotes(event.target.value)} aria-label="Clinical notes" /><p style={{ margin: "7px 0 0", color: "#b2873a", fontSize: 8 }}>Do not enter real health or identifying information in this preview.</p></section>
            <section className="clinical-card"><h3><MessageCircle size={14} style={{ verticalAlign: "-3px", marginRight: 5, color: "#0b91c1" }} /> Visit chat <span style={{ color: "#a1acb2", fontSize: 8, fontWeight: 500 }}>· local demo</span></h3><div className="chat-messages" role="log" aria-label="Demo chat messages">{messages.map((message) => <div key={message.id} className={`chat-bubble ${message.mine ? "mine" : ""}`}>{message.body}</div>)}</div><form className="chat-form" onSubmit={sendMessage}><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a demo message…" aria-label="Chat message" /><button className="btn btn-primary btn-sm" aria-label="Send message" type="submit"><Send size={13} /></button></form></section>
            <section className="clinical-card"><h3><FileText size={14} style={{ verticalAlign: "-3px", marginRight: 5, color: "#0b91c1" }} /> E-prescription</h3>{prescriptionReady ? <div role="status" className="rx-row"><CheckCircle2 size={14} color="#078577" />Demo draft created for review. No prescription was issued.</div> : <p style={{ margin: "0 0 13px", color: "#81919b", fontSize: 9, lineHeight: 1.6 }}>A clinician can prepare a draft after the consultation. This preview does not issue prescriptions.</p>}<button className="btn btn-outline btn-sm" style={{ width: "100%" }} type="button" onClick={() => { setShowPrescription((value) => !value); setPrescriptionReady(true); }}><FileText size={13} />{showPrescription ? "Hide draft drawer" : "Open e-prescription drawer"}</button>{showPrescription && <div className="rx-row"><Video size={13} color="#0e97c4" /><span>Demo draft<br />Patient: Maya P. · Review required<br />Medication details are intentionally not prefilled.</span></div>}</section>
            {permissionError && <p role="alert" style={{ margin: 0, borderRadius: 11, padding: 11, color: "#a54e4e", background: "#fff0f0", fontSize: 9, lineHeight: 1.5 }}>{permissionError}</p>}
          </aside>
        </div>
        <p style={{ margin: "13px 2px 0", color: "#8e9da5", fontSize: 9 }}><Video size={11} style={{ verticalAlign: "-2px", marginRight: 5 }} />Video, chat and note controls are local preview interactions. A production room needs appointment-authenticated signaling, WebRTC/LiveKit, coturn and secure clinical-data storage.</p>
      </div>
    </div>
  );
}
