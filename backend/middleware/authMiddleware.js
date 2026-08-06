const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // 1. Get the Authorization header
  const authHeader = req.headers['authorization'];

  // 2. If there's no header at all, reject
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 3. Header looks like "Bearer eyJhbGciOi..." — split on the space, take the second part
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Malformed token" });
  }

  try {
    // 4. Verify it — same jwt.verify pattern you already know
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach the userId to req, so any route using this middleware can access it
    req.userId = decoded.userId;

    // 6. Let the request continue to the actual route
    next();

  } catch (err) {
    // jwt.verify throws if expired or tampered with
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;