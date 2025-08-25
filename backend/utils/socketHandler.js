// backend/utils/socketHandler.js

const CanvasVersion = require('../models/CanvasVersion');
const Room = require('../models/Room');
const User = require('../models/User');


module.exports = (io) => {
  const users = {}; // socket.id -> { roomId, username }
  const roomUsers = {}; // roomId -> Set of usernames
  const roomOwners = {}; // roomId -> owner username
  const roomHistories = {}; // roomId -> [strokes] (Temporary, in-memory history)

  function getOwnerSocketId(roomId) {
    const ownerName = roomOwners[roomId];
    if (!ownerName) return null;
    for (const [sid, info] of Object.entries(users)) {
      if (info.roomId === roomId && info.username === ownerName) return sid;
    }
    return null;
  }

  function ensureRoomInit(roomId) {
    if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
    if (!roomHistories[roomId]) roomHistories[roomId] = [];
  }

  async function joinSocketToRoom(targetSocket, roomId, username) {
    ensureRoomInit(roomId);
    targetSocket.join(roomId);
    users[targetSocket.id] = { roomId, username };

    if (!roomOwners[roomId]) {
      roomOwners[roomId] = username;
      try {
        const room = await Room.findOne({ roomId });
        const user = await User.findOne({ username });
        if (room && user && !room.owner) {
          room.owner = user._id;
          room.members.push(user._id);
          await room.save();
        }
      } catch (err) {
        console.error("Error setting initial room owner:", err);
      }
    }

    roomUsers[roomId].add(username);
    console.log("Backend: Emitting user-list", { roomId, users: Array.from(roomUsers[roomId]) });
    io.to(roomId).emit("user-list", Array.from(roomUsers[roomId]));
    io.to(targetSocket.id).emit("update-history", roomHistories[roomId]);
    io.to(roomId).emit("room-owner", roomOwners[roomId]);
    io.to(targetSocket.id).emit("join-approved");
  }

  io.on("connection", (socket) => {
    socket.on("join-room", ({ roomId, username }) => {
      console.log("Backend: join-room event received", { roomId, username });
      joinSocketToRoom(socket, roomId, username);
    });

    socket.on("request-join", ({ roomId, username }) => {
      console.log("Backend: request-join event received", { roomId, username });
      ensureRoomInit(roomId);
      const ownerSid = getOwnerSocketId(roomId);
      if (!roomOwners[roomId] || !ownerSid) {
        joinSocketToRoom(socket, roomId, username);
        return;
      }
      const requestId = `${Date.now()}-${socket.id}`;
      io.to(ownerSid).emit("join-approval", { requestId, roomId, username, requesterSocketId: socket.id });
      io.to(socket.id).emit("join-pending", { requestId });
    });

    socket.on("join-approve", async ({ requestId, roomId, username, approved, requesterSocketId }) => {
      const approver = users[socket.id];
      if (!approver || approver.roomId !== roomId || roomOwners[roomId] !== approver.username) {
        return; 
      }
      
      const targetSocket = io.sockets.sockets.get(requesterSocketId);
      if (!targetSocket) return;

      if (approved) {
        try {
            const userToJoin = await User.findOne({ username: username });
            if (userToJoin) {
                await Room.updateOne(
                    { roomId: roomId },
                    { $addToSet: { members: userToJoin._id } } 
                );
            }
        } catch (err) {
            console.error("Failed to add user to room members:", err);
        }
        joinSocketToRoom(targetSocket, roomId, username);
      } else {
        io.to(requesterSocketId).emit("join-denied");
      }
    });
    
    socket.on("draw", (data) => {
      const roomId = users[socket.id]?.roomId;
      if (!roomId) return;
      if (!roomHistories[roomId]) roomHistories[roomId] = [];
      roomHistories[roomId].push(data);
      socket.to(roomId).emit("draw", data);
    });
    
    socket.on("update-history", (history) => {
      const roomId = users[socket.id]?.roomId;
      if (!roomId) return;
      roomHistories[roomId] = Array.isArray(history) ? history : [];
      socket.to(roomId).emit("update-history", roomHistories[roomId]);
    });
    
    socket.on("request-history", () => {
      const roomId = users[socket.id]?.roomId;
      if (!roomId) return;
      if (!roomHistories[roomId]) roomHistories[roomId] = [];
      io.to(socket.id).emit("update-history", roomHistories[roomId]);
    });

    socket.on('save-version', async ({ roomId, history, versionName }) => {
        if (!roomId || !history || !versionName) return;
        try {
            const creatorUsername = users[socket.id]?.username;
            const newVersion = new CanvasVersion({
                roomId,
                history,
                versionName,
                creatorUsername,
            });
            await newVersion.save();
            io.to(roomId).emit('history-updated');
            socket.emit('version-saved-success', { versionId: newVersion._id, createdAt: newVersion.createdAt, creatorUsername });
        } catch (err) {
            console.error('Error saving canvas version:', err);
            socket.emit('error', 'Failed to save version.');
        }
    });

    socket.on('load-version', async ({ versionId }) => {
        if (!versionId) return;
        try {
            const version = await CanvasVersion.findById(versionId);
            if (version) {
                roomHistories[version.roomId] = version.history;
                io.to(version.roomId).emit('update-history', version.history);
            }
        } catch (err) {
            console.error('Error loading canvas version:', err);
            socket.emit('error', 'Failed to load version.');
        }
    });
    
    // ✅ THIS IS THE FIX for the "Share to Room" feature
    socket.on("share-scrape-request", ({ roomId, content }) => {
        const user = users[socket.id];
        if (user && user.roomId === roomId) {
            // Broadcast the content to everyone in the room
            io.to(roomId).emit("scrape-shared", { 
                fromUser: user.username, 
                content: content 
            });
        }
    });

    socket.on("pdf-uploaded", ({ roomId, url }) => {
      console.log("PDF uploaded to room:", roomId, "URL:", url);
      // Send to ALL users in the room (including sender) so everyone gets the PDF
      io.in(roomId).emit("pdf-received", { url });
    });

    socket.on("clear-canvas", () => {
      const roomId = users[socket.id]?.roomId;
      if (!roomId) return;
      roomHistories[roomId] = [];
      io.to(roomId).emit("clear-canvas");
    });
    
    socket.on("disconnect", () => {
      const user = users[socket.id];
      if (user) {
        const { roomId, username } = user;
        if(roomUsers[roomId]) {
            roomUsers[roomId].delete(username);
            io.to(roomId).emit("user-list", Array.from(roomUsers[roomId]));
        }
        if (username === roomOwners[roomId]) {
          io.to(roomId).emit("room-closed");
          delete roomOwners[roomId];
        }
        delete users[socket.id];
      }
    });
  });
};