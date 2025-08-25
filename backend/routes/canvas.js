const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { saveCanvas, loadCanvas, getCanvasVersions } = require("../controllers/canvasController"); // You will need to create this controller

// You likely have these routes already
router.post("/save", auth, saveCanvas);
router.get("/:roomId/load", auth, loadCanvas);

// --- ADD THIS NEW ROUTE ---
// @route   GET /api/canvas/:roomId/versions
// @desc    Get all saved versions for a specific room
// @access  Private
router.get("/:roomId/versions", auth, async (req, res) => {
    try {
        const CanvasVersion = require('../models/CanvasVersion');
        const versions = await CanvasVersion.find({ roomId: req.params.roomId })
                                            .sort({ createdAt: -1 }) // Show newest first
                                            .select('createdAt versionName creatorUsername');

        res.json(versions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   DELETE /api/canvas/versions/:versionId
// @desc    Delete a saved version (only by creator)
// @access  Private
router.delete('/versions/:versionId', auth, async (req, res) => {
    try {
        const CanvasVersion = require('../models/CanvasVersion');
        const version = await CanvasVersion.findById(req.params.versionId);
        if (!version) return res.status(404).json({ message: 'Version not found' });

        // Only the creator can delete
        if (version.creatorUsername !== req.user.username) {
            return res.status(403).json({ message: 'Forbidden: not the creator' });
        }

        await CanvasVersion.deleteOne({ _id: version._id });
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
