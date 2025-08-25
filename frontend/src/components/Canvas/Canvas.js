import React, { useRef, useState, useEffect, useContext } from "react";
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import { AuthContext } from "../../context/AuthContext";
import useSocket from "../../hooks/useSocket";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api"; // your axios instance
import ToolboxPanel from "./ToolboxPanel";
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

const Canvas = ({ roomId }) => {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const pdfRef = useRef(null);
  const fileInputRef = useRef(null);
  const [toolboxOpen, setToolboxOpen] = useState(false);

  const toolsOutputRef = useRef(null);
  const { user } = useContext(AuthContext);
  const socket = useSocket(roomId, user?.username, true); // Changed back to true for approval-based joining
  
  // Debug logging
  console.log("Canvas component - user object:", user);
  console.log("Canvas component - username being passed to socket:", user?.username);
  const [penSize, setPenSize] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [color, setColor] = useState("#000000");
  const [mode, setMode] = useState("pen");
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [drawHistory, setDrawHistory] = useState([]);
  const [extraHeight, setExtraHeight] = useState(0);
  const [shapeStart, setShapeStart] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [redoStack, setRedoStack] = useState([]);
  const [toolOutput, setToolOutput] = useState("");
  const outputRef = useRef();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState("");
  const [latencyMs, setLatencyMs] = useState(null);
  const [lastSyncAt, setLastSyncAt] = useState(Date.now());
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [owner, setOwner] = useState("");
  const [pendingJoins, setPendingJoins] = useState([]);
  const [joinsOpen, setJoinsOpen] = useState(false);
  const [hoveringJoins, setHoveringJoins] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [savedVersions, setSavedVersions] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState(''); // Track selected file name

  // Add missing functions
  const handleMouseMove = (e) => {
    if (!drawing || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCoords(e);

    if (["pen", "eraser", "highlighter"].includes(mode)) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (mode === "highlighter") {
        ctx.strokeStyle = "rgba(255,255,0,0.3)";
        ctx.globalCompositeOperation = "multiply";
        ctx.lineWidth = penSize;
      } else if (mode === "eraser") {
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = eraserSize;
      } else {
        ctx.strokeStyle = color;
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = penSize;
      }

      // Use interpolated points
      const steps = Math.ceil(
        Math.hypot(x - lastPos.x, y - lastPos.y) / (ctx.lineWidth / 2)
      );
      const points = interpolatePoints(lastPos.x, lastPos.y, x, y, steps);

      points.forEach((point, i) => {
        if (i === 0) return;
        const prev = points[i - 1];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      });

      const stroke = {
        fromX: lastPos.x,
        fromY: lastPos.y,
        toX: x,
        toY: y,
        color: ctx.strokeStyle,
        mode,
        thickness: ctx.lineWidth,
      };

      console.log("Emitting draw stroke:", stroke, "socket:", !!socket, "roomId:", roomId);
      setDrawHistory((prev) => [...prev, stroke]);
      if (socket) {
        socket.emit("draw", stroke);
      } else {
        console.error("Socket not available for drawing");
      }
      setLastPos({ x, y });
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const resizeCanvas = () => {
    if (!scrollRef.current || !canvasRef.current) {
      console.log("resizeCanvas: Missing refs", { scrollRef: scrollRef.current, canvasRef: canvasRef.current });
      return;
    }
    const scroll = scrollRef.current;
    const canvas = canvasRef.current;
    console.log("Resizing canvas to:", scroll.scrollWidth, "x", scroll.scrollHeight);
    canvas.width = scroll.scrollWidth;
    canvas.height = scroll.scrollHeight;
    redrawHistory(drawHistory);
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current.scrollTop;
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top + scrollTop, // ✅ critical - include scroll offset
    };
  };

   const fetchHistoryVersions = async () => {
    if (!roomId) return;
    try {
      const res = await api.get(`/canvas/${roomId}/versions`);
      setSavedVersions(res.data);
    } catch (err) {
      console.error("Failed to fetch canvas versions:", err);
      alert("Could not load canvas history.");
    }
  };

  const handleSaveVersion = () => {
    if (!socket || drawHistory.length === 0) return;
    if (!versionName.trim()) {
        alert("Please enter a name for the version.");
        return;
    }
    socket.emit('save-version', { roomId, history: drawHistory, versionName });
  };

  const handleLoadVersion = (versionId) => {
    if (!socket || !versionId) return;
    if (confirm("This will replace the current canvas for everyone. Are you sure?")) {
        socket.emit('load-version', { versionId });
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!versionId) return;
    if (!confirm('Delete this version permanently?')) return;
    try {
      await api.delete(`/canvas/versions/${versionId}`);
      setSavedVersions((prev) => prev.filter((v) => v._id !== versionId));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete version');
    }
  };

  useEffect(() => {
    if (historyPanelOpen) {
        fetchHistoryVersions();
    }
  }, [historyPanelOpen]);

  const handleLeaveRoom = async () => {
    try {
      await api.post(`/rooms/${roomId}/leave`);
      navigate("/home"); // or "/rooms"
    } catch (err) {
      console.error("Error leaving room:", err);
      alert("Failed to leave room");
    }
  };

  const interpolatePoints = (x0, y0, x1, y1, steps = 10) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      points.push({ x, y });
    }
    return points;
  };
  const handleUndo = () => {
    if (drawHistory.length === 0) return;
    const newHistory = [...drawHistory];
    const undone = newHistory.pop();
    setDrawHistory(newHistory);
    setRedoStack((prev) => [...prev, undone]);
    redrawHistory(newHistory); // 🖌️ redraw canvas
    socket.emit("update-history", newHistory); // 🔄 sync
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const restored = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newHistory = [...drawHistory, restored];

    setDrawHistory(newHistory);
    setRedoStack(newRedoStack);
    redrawHistory(newHistory); // 🖌️ redraw canvas
    socket.emit("update-history", newHistory); // 🔄 sync
  };

  const drawStroke = (ctx, stroke) => {
    ctx.lineJoin = "round"; // Smooth joins
    ctx.lineCap = "round"; // Smooth ends
    ctx.lineWidth = stroke.thickness || 2;
    ctx.strokeStyle = stroke.color || "#000";
    ctx.globalCompositeOperation =
      stroke.mode === "eraser" ? "destination-out" : "source-over";

    if (stroke.type === "text") {
      ctx.fillStyle = stroke.color;
      ctx.font = "16px sans-serif";
      ctx.fillText(stroke.text, stroke.x, stroke.y);
    } else if (stroke.mode === "rect") {
      ctx.strokeRect(
        stroke.fromX,
        stroke.fromY,
        stroke.toX - stroke.fromX,
        stroke.toY - stroke.fromY
      );
    } else if (stroke.mode === "line") {
      ctx.beginPath();
      ctx.moveTo(stroke.fromX, stroke.fromY);
      ctx.lineTo(stroke.toX, stroke.toY);
      ctx.stroke();
    } else {
      // Pen, highlighter, eraser
      ctx.beginPath();
      ctx.moveTo(stroke.fromX, stroke.fromY);
      ctx.lineTo(stroke.toX, stroke.toY);
      ctx.stroke();

      // Optional: fill arc to fix gaps in thick fast lines
      ctx.beginPath();
      ctx.arc(stroke.toX, stroke.toY, ctx.lineWidth / 2, 0, 2 * Math.PI);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCoords(e);

    if (mode === "pen" || mode === "eraser" || mode === "highlighter") {
      // Start drawing
      setLastPos({ x, y });
      setDrawing(true);
    } else if (mode === "text") {
      const input = prompt("Enter text:");
      if (input) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.fillStyle = color;
        ctx.font = "16px sans-serif";
        ctx.fillText(input, x, y);
        const stroke = { type: "text", x, y, text: input, color, mode };
        setDrawHistory((prev) => [...prev, stroke]);
        socket.emit("draw", stroke);
      }
    } else if (mode === "rect" || mode === "line") {
      setDrawing(true);
      setShapeStart({ x, y });
    }
  };

  const startDrawing = (e) => {
    const { x, y } = getCoords(e);
    setLastPos({ x, y });
    setDrawing(true);
  };

  const handleMouseUp = (e) => {
    if (!drawing || !canvasRef.current) return;

    setDrawing(false); // ✅ always stop drawing

    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext("2d");

    if (mode === "pen" || mode === "eraser" || mode === "highlighter") {
      // nothing to do — drawing already handled in mouseMove
      return;
    }

    if (!shapeStart) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = penSize;
    ctx.globalCompositeOperation = "source-over";

    ctx.beginPath();
    if (mode === "rect") {
      ctx.strokeRect(
        shapeStart.x,
        shapeStart.y,
        x - shapeStart.x,
        y - shapeStart.y
      );
    } else if (mode === "line") {
      ctx.moveTo(shapeStart.x, shapeStart.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    const shape = {
      type: mode,
      fromX: shapeStart.x,
      fromY: shapeStart.y,
      toX: x,
      toY: y,
      color,
      mode,
      thickness: penSize,
    };

    setDrawHistory((prev) => [...prev, shape]);
    socket.emit("draw", shape);
    setShapeStart(null);
  };
  useEffect(() => {
    const stop = () => setDrawing(false);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  const redrawHistory = (history = []) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    history.forEach((stroke) => {
      drawStroke(ctx, stroke); // Your central drawing function
    });
  };

  const renderPDF = async (url) => {
    const loadingTask = getDocument(url);
    const pdf = await loadingTask.promise;
    setPdfDoc(pdf);
    setNumPages(pdf.numPages);

    const container = pdfRef.current;
    container.innerHTML = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const pageCanvas = document.createElement("canvas");
      const ctx = pageCanvas.getContext("2d");
      pageCanvas.width = viewport.width;
      pageCanvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;

      pageCanvas.style.display = "block";
      pageCanvas.style.margin = "20px auto";
      container.appendChild(pageCanvas);
    }

    // Spacer for infinite area
    const spacer = document.createElement("div");
    spacer.style.height = `${extraHeight + 1000}px`;
    container.appendChild(spacer);

    setTimeout(resizeCanvas, 300);
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Set the selected file name
    setSelectedFileName(file.name);

    try {
      // Clear canvas and previous work before uploading new file
      console.log("Clearing canvas before PDF upload...");
      
      // Clear canvas manually without emitting clear-canvas event
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawHistory([]);
      setRedoStack([]);
      if (pdfRef.current) {
        pdfRef.current.innerHTML = "";
      }
      setPdfDoc(null);
      setNumPages(0);
      setExtraHeight(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      resizeCanvas();
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/tools/upload-pdf", formData);
      const pdfUrl = res.data.url;

      // Broadcast via socket to others
      console.log("Broadcasting PDF upload to room:", roomId, "URL:", pdfUrl);
      socket.emit("pdf-uploaded", { roomId, url: pdfUrl });

      // Render locally
      renderPDF(pdfUrl);
      
      console.log("PDF uploaded and canvas cleared successfully");
    } catch (error) {
      console.error("PDF upload failed:", error);
      // If upload fails, restore the canvas state
      alert("Failed to upload PDF. Please try again.");
      setSelectedFileName(''); // Clear file name on error
    }
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDrawHistory([]);
    setRedoStack([]);
    if (pdfRef.current) {
      pdfRef.current.innerHTML = "";
    }
    setPdfDoc(null);
    setNumPages(0);
    setExtraHeight(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    setSelectedFileName(''); // Clear selected file name
    resizeCanvas();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    socket.emit("clear-canvas");
  };

  const saveAsPNG = () => {
    html2canvas(scrollRef.current).then((canvasImg) => {
      const link = document.createElement("a");
      link.href = canvasImg.toDataURL("image/png");
      link.download = `canvas-${roomId}.png`;
      link.click();
    });
  };

  const saveAsPDF = () => {
    html2canvas(scrollRef.current).then((canvasImg) => {
      const imgData = canvasImg.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvasImg.height * width) / canvasImg.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`canvas-${roomId}.pdf`);
    });
  };
  const handleChange = (e) => {
    const text = e.target.value;
    setToolOutput(text);
    socket.emit("tool-output", text);
  };
  const handleQuestionGenerate = async () => {
    const formData = new FormData();
    formData.append(
      "syllabus",
      new Blob(["Sample syllabus"], { type: "text/plain" })
    );
    formData.append(
      "pyqs",
      new Blob(["Sample previous questions"], { type: "text/plain" })
    );
    const res = await api.post("/questions", formData);
    setToolOutput(res.data.output || res.data);
    socket.emit("tool-output", res.data.output || res.data);
  };
  const handleSummarize = async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["Dummy PPTX"], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      })
    );
    const res = await api.post("/summarize", formData);
    setToolOutput(res.data.summary || res.data);
    socket.emit("tool-output", res.data.summary || res.data);
  };

  const handleScrape = async () => {
    const res = await api.post("/scrape", { url: "https://example.com" });
    setToolOutput(res.data.content || res.data);
    socket.emit("tool-output", res.data.content || res.data);
  };

  const saveOutputAsPDF = () => {
    html2canvas(outputRef.current).then((canvas) => {
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, width, height);
      pdf.save("tools-output.pdf");
    });
  };
  const expandCanvas = () => {
    setExtraHeight((prev) => {
      const newHeight = prev + 1000;
      const spacer = document.createElement("div");
      spacer.style.height = "1000px";
      pdfRef.current.appendChild(spacer);
      setTimeout(resizeCanvas, 100);
      return newHeight;
    });
  };

  const clearForms = () => {
    setVersionName('');
  };

  // 🧠 Socket handlers
  useEffect(() => {
    if (!socket || !canvasRef.current) {
      console.log("Socket handlers setup skipped:", { socket: !!socket, canvas: !!canvasRef.current });
      return;
    }
    
    console.log("Setting up socket handlers, socket:", socket, "canvas:", canvasRef.current, "roomId:", roomId);
    const ctx = canvasRef.current.getContext("2d");

    socket.on("draw", (stroke) => {
      console.log("Received draw stroke:", stroke);
      drawStroke(ctx, stroke);
      setDrawHistory((prev) => [...prev, stroke]);
      setLastSyncAt(Date.now());
    });

    socket.on("clear-canvas", () => {
      console.log("Canvas cleared by another user");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawHistory([]);
      setRedoStack([]);
      if (pdfRef.current) {
        pdfRef.current.innerHTML = "";
      }
      setPdfDoc(null);
      setNumPages(0);
      setExtraHeight(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      resizeCanvas();
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      setLastSyncAt(Date.now());
    });

    socket.on("update-history", (history) => {
      console.log("Received updated history:", history);
      setDrawHistory(history);
      setRedoStack([]);
      redrawHistory(history);
      setLastSyncAt(Date.now());
    });

    // In case history arrives before draw handlers for some reason
    socket.on("history", (history) => {
      console.log("Received history:", history);
      setDrawHistory(history);
      setRedoStack([]);
      redrawHistory(history);
      setLastSyncAt(Date.now());
    });

    socket.on('version-saved-success', () => {
        alert('Version saved successfully!');
        fetchHistoryVersions(); // refresh the list
        setVersionName(''); 
    });

    socket.on("user-list", (list) => {
      console.log("Received user-list:", list);
      setParticipants(Array.isArray(list) ? list : []);
    });
    socket.on("connect", () => {
      console.log("Socket connected successfully");
      setConnected(true);
      setTransport(socket?.io?.engine?.transport?.name || "");
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });
    socket.on("join-pending", () => {
      console.log("Waiting for room owner approval...");
      alert("Waiting for room owner approval…");
    });
    socket.on("join-approved", () => {
      console.log("Join approved by owner");
    });
    socket.on("join-denied", () => {
      alert("Join request denied by room owner.");
      navigate("/home");
    });
    socket.on("join-approval", (req) => {
      // Only owner receives this; req = { requestId, roomId, username, requesterSocketId }
      console.log("Received join approval request:", req);
      setPendingJoins((prev) => {
        const filtered = prev.filter((r) => r.requestId !== req.requestId);
        return [...filtered, req];
      });
    });

    // Try to measure latency using manager ping/pong
    const manager = socket.io;
    let pingStartedAt = 0;
    const onPing = () => { pingStartedAt = Date.now(); };
    const onPong = () => { if (pingStartedAt) setLatencyMs(Date.now() - pingStartedAt); };
    manager.on("ping", onPing);
    manager.on("pong", onPong);
    socket.on("pdf-uploaded", ({ buffer }) => {
      console.log("PDF received via buffer");
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      // Clear canvas before rendering new PDF
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawHistory([]);
      setRedoStack([]);
      if (pdfRef.current) {
        pdfRef.current.innerHTML = "";
      }
      setPdfDoc(null);
      setNumPages(0);
      setExtraHeight(0);
      renderPDF(url); // this MUST call full page render and resize canvas
    });
    socket.on("pdf-received", ({ url }) => {
      console.log("PDF received via URL:", url);
      // Clear canvas before rendering new PDF
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawHistory([]);
      setRedoStack([]);
      if (pdfRef.current) {
        pdfRef.current.innerHTML = "";
      }
      setPdfDoc(null);
      setNumPages(0);
      setExtraHeight(0);
      renderPDF(url);
    });
    
    socket.on("tool-output", (text) => {
      setToolOutput(text);
    });
    socket.on("room-owner", (ownerName) => setOwner(ownerName || ""));
    // Approval path removed; requests are direct shares now
    socket.on("scrape-shared", ({ fromUser, content }) => {
      // Show a non-intrusive banner and update tools panel output if open
      setToolOutput((prev) => (prev ? prev + "\n\n" : "") + content);
      console.log("Scraped content shared by", fromUser);
    });
    socket.on("scrape-share-denied", () => {
      alert("Owner denied the share request.");
    });
    socket.on("room-closed", () => {
      alert("Room owner left. Redirecting...");
      navigate("/home"); // or "/rooms" depending on your route
    });
    return () => {
      socket.off("draw");
      socket.off("clear-canvas");
      socket.off("pdf-uploaded");
      socket.off("pdf-received");
      socket.off("room-closed");
      socket.off("tool-output");
      socket.off("room-owner");
      socket.off("share-scrape-approval");
      socket.off("scrape-shared");
      socket.off("scrape-share-denied");
      socket.off("user-list");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("join-pending");
      socket.off('version-saved-success');
      socket.off("join-approved");
      socket.off("join-denied");
      socket.off("join-approval");
      manager.off("ping", onPing);
      manager.off("pong", onPong);
    };
  }, [socket]);

  // After listeners are attached, explicitly request history as a safety net
  useEffect(() => {
    if (!socket) return;
    // Small timeout to ensure the above listeners are attached
    const t = setTimeout(() => {
      console.log("Requesting history for room:", roomId);
      socket.emit("request-history");
    }, 50);
    return () => clearTimeout(t);
  }, [socket, roomId]);

  // 🧠 Initial canvas size
  useEffect(() => {
    console.log("Initial canvas size effect - refs:", { scrollRef: scrollRef.current, canvasRef: canvasRef.current });
    resizeCanvas();
  }, []);

  // Keyboard shortcuts: B=brush, E=eraser, U=undo, R=redo, L=line, T=rect, C=clear (with confirm)
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (["INPUT", "TEXTAREA"].includes(tag)) return;
      const key = e.key.toLowerCase();
      if (key === "b") setMode("pen");
      if (key === "e") setMode("eraser");
      if (key === "u") handleUndo();
      if (key === "r") handleRedo();
      if (key === "l") setMode("line");
      if (key === "t") setMode("rect");
      if (key === "c") {
        if (confirm("Clear canvas for everyone?")) clearCanvas();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawHistory, redoStack, mode]);

  const approveJoin = (r) => {
    if (!socket) return;
    console.log("Approving join request:", r);
    socket.emit("join-approve", { requestId: r.requestId, roomId, username: r.username, approved: true, requesterSocketId: r.requesterSocketId });
    setPendingJoins((prev) => prev.filter((x) => x.requestId !== r.requestId));
  };
  const denyJoin = (r) => {
    if (!socket) return;
    console.log("Denying join request:", r);
    socket.emit("join-approve", { requestId: r.requestId, roomId, username: r.username, approved: false, requesterSocketId: r.requesterSocketId });
    setPendingJoins((prev) => prev.filter((x) => x.requestId !== r.requestId));
  };

  const colorForName = (name = "?") => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 55%)`;
  };
  const initialsForName = (name = "?") => {
    const parts = String(name).split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="space-y">
      <div className="card sticky" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        {/* 🎨 Color Picker */}
        <label className="row">
          <span style={{ fontSize: 14 }}>🎨</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ appearance: "none", width: 28, height: 28, border: "none", borderRadius: "50%", cursor: "pointer" }}
          />
        </label>

        {/* ✏️ Pen Tool */}
        <div className="row">
          <button onClick={() => setMode("pen")} className="btn" style={{ background: mode === "pen" ? "#1f3b80" : undefined , color: mode === "pen" ? "white" : undefined }}>
            ✏️ Pen
          </button>
          {mode === "pen" && (
            <input
              type="range"
              min="1"
              max="20"
              value={penSize}
              onChange={(e) => setPenSize(+e.target.value)}
              style={{ width: 80 }}
            />
          )}
        </div>

        {/* 🖍️ Highlighter Tool */}
        <button onClick={() => setMode("highlighter")} className="btn" style={{ background: mode === "highlighter" ? "#665c1f" : undefined , color: mode === "highlighter" ? "white" : undefined}}>🖍️ Highlight</button>

        {/* 🧽 Eraser Tool */}
        <div className="row">
          <button onClick={() => setMode("eraser")} className="btn" style={{ background: mode === "eraser" ? "#4d1f1f" : undefined , color: mode === "eraser" ? "white" : undefined}}>🧼 Eraser</button>
          {mode === "eraser" && (
            <input
              type="range"
              min="10"
              max="100"
              value={eraserSize}
              onChange={(e) => setEraserSize(+e.target.value)}
              style={{ width: 80 }}
            />
          )}
          <button className="btn" onClick={() => setMode("text")}>🔤 Text</button>
          <button className="btn" onClick={() => setMode("rect")}>⬛ Rect</button>
          <button className="btn" onClick={() => setMode("line")}>📏 Line</button>
          <button className="btn" onClick={handleUndo} disabled={drawHistory.length === 0}>↩️ Undo</button>
          <button className="btn" onClick={handleRedo} disabled={redoStack.length === 0}>↪️ Redo</button>
        </div>

        {/* Other Actions */}
        <button className="btn" onClick={clearCanvas}>🧽 Clear</button>
        <button className="btn" onClick={saveAsPNG}>🖼️ PNG</button>
        <button className="btn" onClick={saveAsPDF}>📄 PDF</button>
        
        <div style={{ width: '100%', height: '30px', 'font-weight' : '700' }}>
          <p>Choose File to open in canvas Editor</p>
        </div>
        <input 
          ref={fileInputRef} 
          className="input" 
          type="file" 
          accept=".pdf" 
          onChange={handlePDFUpload}
          title={selectedFileName || "Choose PDF file"}
        />
        <button
          onClick={() =>
            setHistoryPanelOpen((prev) => {
              const next = !prev;
              if (next) {
                setToolboxOpen(false);
                setParticipantsOpen(false);
              }
              return next;
            })
          }
          className="btn"
        >
          📖 History
        </button>
        <button
          onClick={() =>
            setToolboxOpen((prev) => {
              const next = !prev;
              if (next) {
                setHistoryPanelOpen(false);
                setParticipantsOpen(false);
              }
              return next;
            })
          }
          className="btn"
          style={{ marginLeft: "8px" }}
        >
          🧰 Tools
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() =>
              setParticipantsOpen((prev) => {
                const next = !prev;
                if (next) {
                  setHistoryPanelOpen(false);
                  setToolboxOpen(false);
                }
                return next;
              })
            }
            className="btn participant-btn"
          >
            👥 Participants ({participants.length})
          </button>
          {participantsOpen && (
            <div className="popover">
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Participants</h3>
              <div className="space-y">
                {participants.length === 0 && <span className="muted">No other users</span>}
                {participants.map((name, index) => (
                  <div key={index} className="row" style={{ justifyContent: "space-between" }}>
                    <div className="row">
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: colorForName(name), color: "#000", display: "grid", placeItems: "center", fontWeight: 700 }}>
                        <span style={{ fontSize: 12 }}>{initialsForName(name)}</span>
                      </div>
                      <span>{name || 'Unknown User'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {pendingJoins.length > 0 && (
          <div style={{ position: "relative" }}
               onMouseEnter={() => setHoveringJoins(true)}
               onMouseLeave={() => setHoveringJoins(false)}>
            <button onClick={() => setJoinsOpen((p) => !p)} className="btn">🔔 Join requests ({pendingJoins.length})</button>
            {(joinsOpen || hoveringJoins) && (
              <div className="popover" style={{ minWidth: 300 }}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>Join requests</h3>
                <div className="space-y">
                  {pendingJoins.map((r) => (
                    <div key={r.requestId} className="row" style={{ justifyContent: "space-between" }}>
                      <div className="row"><span>{r.username}</span></div>
                      <div className="row">
                        <button className="btn btn-primary" onClick={() => approveJoin(r)}>Approve</button>
                        <button className="btn btn-danger" onClick={() => denyJoin(r)}>Deny</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <ToolboxPanel
          visible={toolboxOpen}
          onClose={() => setToolboxOpen(false)}
          socket={socket}
          roomId={roomId}
          initialOutput={toolOutput}
          isOwner={owner && String(owner) === String(user?.username)}
        />
      </div>

      {/* Inline popover replaces the previous block panel */}

      {/* Status line */}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <span className="chip">{connected ? "Connected" : "Disconnected"}</span>
          {transport && <span className="chip">Transport: {transport}</span>}
          <span className="chip ">Participants: {participants.length}</span>
          <span className="chip">Latency: {latencyMs != null ? `${latencyMs} ms` : "—"}</span>
        </div>
        <span className="muted" style={{ fontSize: 12 }}>Last sync {Math.max(0, Math.round((Date.now() - lastSyncAt) / 1000))}s ago</span>
      </div>

      {historyPanelOpen && (
            <div className="card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{marginTop: 0, marginBottom: 0}}>Canvas History</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="text"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder="Enter version name..."
                      className="input"
                      style={{ flexGrow: 1 }}
                    />
                    <button onClick={handleSaveVersion} className="btn btn-primary">Save Current Version</button>
                  </div>
                </div>
                <hr style={{margin: '15px 0'}} />
                <div className="space-y" style={{maxHeight: '200px', overflowY: 'auto'}}>
                    {savedVersions.length === 0 && <p className="muted">No saved versions yet.</p>}
                    {savedVersions.map(v => (
                        <div key={v._id} className="row" style={{ justifyContent: "space-between", alignItems: 'center' }}>
                            <div>
                                <span style={{fontWeight: 'bold'}}>{v.versionName}</span>
                                <br/>
                                <span className="muted" style={{fontSize: '12px'}}>
                                  Saved at: {new Date(v.createdAt).toLocaleString()} {v.creatorUsername ? `(by ${v.creatorUsername})` : ''}
                                </span>
                            </div>
                            <div className="row" style={{ gap: 8 }}>
                              <button className="btn" onClick={() => handleLoadVersion(v._id)}>Load</button>
                              {v.creatorUsername && user?.username === v.creatorUsername && (
                                <button className="btn btn-danger" onClick={() => handleDeleteVersion(v._id)}>Delete</button>
                              )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      {/* File Status Indicator */}
      {/* currentFile is not defined in this component, so this block is removed */}

      {/* Notifications */}
      {/* notifications is not defined in this component, so this block is removed */}

      <div ref={scrollRef} className="card" style={{ width: "100%", height: 500, overflowY: "scroll", position: "relative" }}>
        <div ref={pdfRef} />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={stopDrawing}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 10,
            pointerEvents: "auto",
          }}
        />
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="btn btn-primary" onClick={expandCanvas}>➕ Expand Canvas</button>
        <button className="btn btn-danger" onClick={handleLeaveRoom}>🚪 Leave Room</button>
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          onClick={() => {
            navigator.clipboard.writeText(roomId);
            alert(`Room ID copied: ${roomId}`);
          }}
          className="btn"
          title="Copy Room ID"
        >
          📋 Copy Room ID
        </button>
      </div>
    </div>
  );
};

export default Canvas;
