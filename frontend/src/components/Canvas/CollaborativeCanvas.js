import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Canvas from "./Canvas";
import api from "../../utils/api";

const CollaborativeCanvas = () => {
  const { id: roomId } = useParams();
  const [roomName, setRoomName] = useState("");
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchRoomName() {
      try {
        console.log("Fetching room data for ID:", roomId);
        // Try to fetch room data
        const res = await api.get(`/rooms/${roomId}`);
        console.log("Room API response:", res.data);
        if (isMounted) setRoomName(res.data?.name || roomId);
      } catch (err) {
        console.error("Error fetching room:", err);
        // Fallback: try to get room name from localStorage if available
        try {
          const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
          const room = rooms.find(r => r._id === roomId);
          if (room && room.name) {
            if (isMounted) setRoomName(room.name);
            return;
          }
        } catch (localErr) {
          console.error("Local storage fallback failed:", localErr);
        }
        if (isMounted) setRoomName(roomId);
      }
    }
    fetchRoomName();
    return () => { isMounted = false; };
  }, [roomId]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopying(true);
      setTimeout(() => setCopying(false), 1000);
    } catch (_) {
      // No-op
    }
  };

  return (
    <div className="container section">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>
          Room: {roomName}
          <button onClick={copyId} className="btn btn-primary" style={{ marginLeft: 8, padding: "2px 8px" }}>
            {copying ? "Copied!" : "Copy ID"}
          </button>
        </h2>
        <span className="chip">Live</span>
      </div>
      <Canvas roomId={roomId} />
    </div>
  );
};

export default CollaborativeCanvas;
