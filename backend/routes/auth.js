const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // TODO 1: Check if a user with this email already exists
        // hint: use User.findOne({ email })
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // TODO 2: If user exists, return res.status(400).json({ message: "..." })

        // TODO 3: Hash the password using bcrypt
        // hint: bcrypt.hash(password, 10) — the "10" is called salt rounds, more rounds = more secure but slower
        const hashedPassword = await bcrypt.hash(password, 10);

        // TODO 4: Create a new User with the hashed password (not the plain one!) and save it to MongoDB
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        // TODO 5: Send back a success response — do NOT send the password back, even hashed
        res.json("Success");


    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// login route

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // TODO 1: Find the user by email (same as signup, but this time if NOT found, that's the error)
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "User doesn't exists" });
        }

        // TODO 2: Compare the plain password with the stored hash
        // hint: bcrypt.compare(plainPassword, hashedPasswordFromDB) — returns true/false, and yes it's async
        if (!(await bcrypt.compare(password, existingUser.password))) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // TODO 3: If password doesn't match, return res.status(400).json({ message: "..." })

        // TODO 4: Create a JWT
        // hint: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' })

        const accessToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        // TODO 1: Create access token (15m) — you already know this line
        // TODO 2: Create refresh token — same jwt.sign pattern, but expiresIn: '7d', and use a DIFFERENT secret: process.env.REFRESH_TOKEN_SECRET
        const refreshToken = jwt.sign({ userId: existingUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
        // TODO 3: Save the refresh token onto the user in DB — existingUser.refreshToken = refreshToken; await existingUser.save();
        existingUser.refreshToken = refreshToken;

        await existingUser.save();//saving the refresh token to the db

        // TODO 4: Send both back — res.json({ accessToken, refreshToken })
        res.json({ accessToken, refreshToken });


        const check = await User.findById(existingUser._id);
       
        // TODO 5: Send the token back to the frontend as JSON


    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        

        // TODO 1: If no refreshToken was sent at all, return res.status(401).json({ message: "No refresh token provided" })
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" })
        }

        // TODO 2: Verify the refresh token using jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        // store the result in a variable (this gives you back { userId, ... })
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);


        // TODO 3: Find the user in the DB using the userId from the decoded token
        // hint: User.findById(decoded.userId)
        const existingUser = await User.findById(decoded.userId);
        

        // TODO 4: Check that the user exists AND that user.refreshToken === the refreshToken sent in
        // if either fails, return res.status(403).json({ message: "Invalid refresh token" })
        if (!existingUser || existingUser.refreshToken !== refreshToken) {
            console.log("Mismatch! DB has:", existingUser?.refreshToken, "| Received:", refreshToken);
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // TODO 5: Create a NEW access token (same pattern as login, 15m expiry)
        const newAccessToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // TODO 6: Send it back — res.json({ accessToken: newAccessToken })
        res.json({ accessToken: newAccessToken });

    } catch (err) {
        // if jwt.verify fails (expired/invalid token), it throws — that lands here
        
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    };
});

router.get('/test-protected', authMiddleware, (req, res) => {
    res.json({ message: `You are authenticated as user ${req.userId}` });
});

module.exports = router;