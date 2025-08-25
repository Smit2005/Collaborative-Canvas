// backend/models/CanvasVersion.js

const mongoose = require('mongoose');

const canvasVersionSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    ref: 'Room'
  },
  // The username of the creator who saved this version
  creatorUsername: {
    type: String,
    required: true,
  },
  // --- ADD THIS LINE ---
  versionName: {
    type: String,
    required: true,
    default: 'Untitled Version'
  },
  history: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CanvasVersion', canvasVersionSchema);