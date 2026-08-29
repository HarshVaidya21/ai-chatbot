const express = require('express');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const authMiddleware = require('../middleware/authMiddleware');
const { ChromaClient } = require('chromadb');
const { getEmbedding } = require('../utils/embedder');
const User = require('../models/User');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  }
});
const chroma = new ChromaClient({ path: "http://localhost:8000" });

class NoEmbedding {
  async generate(texts) { return []; }
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}

// Wrap multer so fileFilter/size errors return clean JSON instead of crashing
function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // e.g. file too large
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // e.g. our custom fileFilter rejection ("Only PDF files are allowed")
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}

router.post('/upload', authMiddleware, handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const MAX_DOCUMENTS = 4;
    const user = await User.findById(req.userId);

    if (user.documentsUploaded >= MAX_DOCUMENTS) {
      return res.status(429).json({
        message: `You've reached the limit of ${MAX_DOCUMENTS} documents. Delete a document to upload more.`
      });
    }

    // Step 1: Extract text
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    await parser.destroy();

    // Step 2: Chunk it
    const chunks = chunkText(result.text);
    console.log("Total chunks:", chunks.length);

    // Step 3: Get or create collection
    const collection = await chroma.getOrCreateCollection({
      name: `user_${req.userId}`,
      embeddingFunction: new NoEmbedding(),
    });

    // Step 4: Embed each chunk and collect
    const ids = [];
    const embeddings = [];
    const documents = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Embedding chunk ${i + 1} of ${chunks.length}...`);
      const embedding = await getEmbedding(chunks[i]);
      ids.push(`chunk_${i}`);
      embeddings.push(embedding);
      documents.push(chunks[i]);
    }

    // Step 5: Store everything in Chroma
    await collection.add({ ids, embeddings, documents });
    console.log("All chunks stored in Chroma successfully");

    // Increment document count after successful upload
    await User.findByIdAndUpdate(req.userId, {
      documentsUploaded: user.documentsUploaded + 1
    });

    res.json({ message: "Document uploaded and embedded", totalChunks: chunks.length });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;