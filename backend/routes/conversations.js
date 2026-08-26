const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Create a new conversation
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const newConversation = new Conversation({ userId: req.userId });
    await newConversation.save();
    res.json(newConversation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all conversations for the logged-in user (for sidebar)
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all messages for one specific conversation
router.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// its for sidebar title updation
router.patch('/conversations/:id/title', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true } 
    );
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;