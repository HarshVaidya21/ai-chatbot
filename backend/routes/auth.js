const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;


        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();


        res.json("Success");


    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});



router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;


        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "User doesn't exists" });
        }


        if (!(await bcrypt.compare(password, existingUser.password))) {
            return res.status(400).json({ message: "Invalid password" });
        }



        const accessToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        const refreshToken = jwt.sign({ userId: existingUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })

        existingUser.refreshToken = refreshToken;

        await existingUser.save();


        res.json({ accessToken, refreshToken });


        const check = await User.findById(existingUser._id);




    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;



        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" })
        }


        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);



        const existingUser = await User.findById(decoded.userId);



        if (!existingUser || existingUser.refreshToken !== refreshToken) {
            console.log("Mismatch! DB has:", existingUser?.refreshToken, "| Received:", refreshToken);
            return res.status(403).json({ message: "Invalid refresh token" });
        }


        const newAccessToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '15m' });


        res.json({ accessToken: newAccessToken });

    } catch (err) {


        return res.status(403).json({ message: "Invalid or expired refresh token" });
    };
});

router.get('/test-protected', authMiddleware, (req, res) => {
    res.json({ message: `You are authenticated as user ${req.userId}` });
});

module.exports = router;