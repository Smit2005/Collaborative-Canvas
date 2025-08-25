const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Room = require("../models/Room");
const {
  createRoom,
  joinRoom,
  leaveRoom,
} = require("../controllers/roomController");
router.get("/", auth, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Failed to list rooms" });
  }
});
router.get("/:id", auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch room" });
  }
});
router.post("/create", auth, createRoom);
router.post("/:id/join", auth, joinRoom);
router.post("/:id/leave", auth, leaveRoom);
module.exports = router;
