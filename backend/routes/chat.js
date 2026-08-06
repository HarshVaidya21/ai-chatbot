const express = require('express');
const Groq = require('groq-sdk');
const { ChromaClient } = require('chromadb');
const { pipeline } = require('@xenova/transformers');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { getEmbedding } = require('../utils/embedder');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chroma = new ChromaClient({ path: "http://localhost:8000" });

// same NoEmbedding class — Chroma needs this when opening existing collections too
class NoEmbedding {
  async generate(texts) { return []; }
}





router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    // Step 1: Set SSE headers (same as before)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Step 2: Convert user's question to an embedding
    const questionEmbedding = await getEmbedding(message);

    // Step 3: Query Chroma for top 3 most relevant chunks
    let contextText = '';
    try {
      const collection = await chroma.getCollection({
        name: `user_${req.userId}`,
        embeddingFunction: new NoEmbedding(),
      });

      const results = await collection.query({
        queryEmbeddings: [questionEmbedding],
        nResults: 3,
      });

      // results.documents[0] is an array of the top 3 chunk texts
      contextText = results.documents[0].join('\n\n');
      console.log("Retrieved context length:", contextText.length);

    } catch (err) {
      // if user hasn't uploaded any document yet, just chat normally
      console.log("No collection found for user, chatting without context");
    }

    // Step 4: Build the prompt — inject context if we have it
    const messages = contextText
      ? [
          {
            role: 'system',
            content: `You are a helpful assistant. Answer the user's question based on the following context from their uploaded document. If the answer isn't in the context, say so honestly.\n\nContext:\n${contextText}`
          },
          { role: 'user', content: message }
        ]
      : [
          { role: 'user', content: message }
        ];

    // Step 5: Stream response from Groq (same as before)
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;