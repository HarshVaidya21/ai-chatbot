const express = require('express');
const Groq = require('groq-sdk');
const { ChromaClient } = require('chromadb');
const authMiddleware = require('../middleware/authMiddleware');
const { getEmbedding } = require('../utils/embedder');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const rateLimiter = require('../middleware/rateLimiter');
const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chroma = new ChromaClient({ path: "http://localhost:8000" });

class NoEmbedding {
  async generate(texts) { return []; }
}



router.post('/chat', authMiddleware, rateLimiter, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const conversation = await Conversation.findById(conversationId);



    let newUserMessage = new Message({ conversationId, role: 'user', content: message });
    await newUserMessage.save();


    const messageCount = await Message.countDocuments({ conversationId });
    if (messageCount === 1) {

      const title = message.length > 40
        ? message.substring(0, 40) + '...'
        : message;

      await Conversation.findByIdAndUpdate(conversationId, { title });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const questionEmbedding = await getEmbedding(message);

    let contextText = '';
    try {
      const collection = await chroma.getCollection({
        name: `user_${req.userId}`,
        embeddingFunction: new NoEmbedding(),
      });

      const results = await collection.query({
        queryEmbeddings: [questionEmbedding],
        nResults: 3,
        include: ['documents', 'distances'],
      });


      const bestDistance = results.distances[0][0];
      if (bestDistance < 1.0) {
        contextText = results.documents[0].join('\n\n');
      }

    }
    catch (err) {

      console.log("No document found for user, chatting normally");
    }

    const messages = contextText
      ? [
        {
          role: 'system',
          content: `You are a helpful AI assistant, similar to ChatGPT. The user has uploaded a document. Use the following context to help answer their question if it's relevant. If the question isn't related to the document, just answer normally from your general knowledge — don't mention the document at all.\n\nContext:\n${contextText}`
        },
        { role: 'user', content: message }
      ]
      : [
        {
          role: 'system',
          content: `You are a helpful AI assistant, similar to ChatGPT. Answer the user's questions helpfully and conversationally.`
        },
        { role: 'user', content: message }
      ];


    const stream = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    let newAiMessage = new Message({ conversationId, role: 'assistant', content: fullResponse });
    await newAiMessage.save();

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;