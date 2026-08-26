require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');//GROQ
const documentRoutes = require('./routes/documents');
const conversationRoutes = require('./routes/conversations');

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));


app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);

app.use('/api/documents', (req, res, next) => {
  console.log("Incoming Content-Type:", req.headers['content-type']);
  next();
});

app.use('/api/documents', documentRoutes);

app.use(express.json({ limit: '10mb' }));
app.use('/api', conversationRoutes);

app.listen(5000, () => console.log('Server running on port 5000'));

// localStorage.clear()--just to clear tokens