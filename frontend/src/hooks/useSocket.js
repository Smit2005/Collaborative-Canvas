import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const useSocket = (roomId, username, requireApproval = false) => {
  const socketRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [userColor] = useState(() => {
    const colors = ["#ff0000", "#00cc66", "#0066ff", "#ff6600", "#9900cc"];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  useEffect(() => {
    if (!roomId || !username) {
      console.log("useSocket: Missing roomId or username", { roomId, username });
      return;
    }

    // Don't recreate socket if it's already connected to the same room
    if (socketRef.current && socketRef.current.connected) {
      console.log("useSocket: Socket already connected, skipping recreation");
      return;
    }

    console.log("useSocket: Creating socket connection with", { roomId, username });

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("useSocket: Socket connected, emitting join event");
      if (requireApproval) {
        socket.emit("request-join", { roomId, username });
      } else {
        socket.emit("join-room", { roomId, username, color: userColor });
      }
      setReady(true);
    });
    socket.on("connect_error", () => {
      console.log("useSocket: Connection error");
      setReady(false);
    });

    return () => {
      console.log("useSocket: Cleaning up socket connection");
      socket.disconnect();
    };
  }, [roomId, username, requireApproval]); // Removed userColor from dependencies

  return ready ? socketRef.current : null;
};

export default useSocket;
