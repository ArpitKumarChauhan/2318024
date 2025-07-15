// index.js (Backend Server File)
const express = require('express');
const bodyParser = require('body-parser'); // To parse JSON request bodies
const cors = require('cors'); // <--- NEW: For Cross-Origin Resource Sharing
const { Log } = require('G:/2318024/Logging Middleware/logger.js'); // Import the Log function from logger.js

const app = express();
const PORT = 3001; // The port your backend will listen on

// Middleware
app.use(bodyParser.json()); // Parses incoming request bodies with JSON payloads
app.use(express.json()); // Another way to parse JSON, often used alongside bodyParser
app.use(cors({
    origin: 'http://localhost:3000' // IMPORTANT: Replace 3001 with your actual frontend port
    // If your frontend runs on http://localhost:3000 (unlikely if backend is 3000), adjust this.
    // For wider testing, you can use origin: '*' but it's less secure for production.
})); // <--- NEW: Enable CORS. This allows your frontend (e.g., from localhost:3001) to connect.

// In-memory store for short URLs (for simplicity)
const urlStore = {};

// Helper to generate a random shortcode
function generateShortcode() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) { // Generate a 6-character shortcode
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Log initial backend startup
Log("backend", "info", "config", "Backend server starting up.");

// Route to shorten URL
app.post('/shorturls', (req, res) => {
    const { url, shortcode, validity } = req.body;

    if (!url) {
        Log("backend", "warn", "controller", "Shorten URL request received without a URL.");
        return res.status(400).json({ error: 'URL is required.' });
    }

    let generatedShortcode = shortcode;
    if (!generatedShortcode) {
        generatedShortcode = generateShortcode();
        while (urlStore[generatedShortcode]) { // Ensure shortcode is unique
            generatedShortcode = generateShortcode();
        }
    } else {
        if (urlStore[generatedShortcode]) {
            Log("backend", "warn", "controller", `Custom shortcode "${generatedShortcode}" already in use.`);
            return res.status(409).json({ error: 'Custom shortcode already exists.' }); // 409 Conflict
        }
    }

    const shortlink = `http://localhost:${PORT}/${generatedShortcode}`;
    const expirationTime = validity ? Date.now() + validity * 60 * 1000 : null; // validity in minutes

    urlStore[generatedShortcode] = {
        longUrl: url,
        expiration: expirationTime
    };

    Log("backend", "info", "service", `URL shortened: ${url} -> ${shortlink}`);
    res.status(201).json({ shortlink }); // 201 Created
});

// Route to redirect short URL
app.get('/:shortcode', (req, res) => {
    const { shortcode } = req.params;
    const entry = urlStore[shortcode];

    if (!entry) {
        Log("backend", "warn", "controller", `Attempt to access non-existent shortcode: ${shortcode}`);
        return res.status(404).send('Short URL not found.');
    }

    if (entry.expiration && Date.now() > entry.expiration) {
        delete urlStore[shortcode]; // Remove expired URL
        Log("backend", "info", "cache", `Expired shortcode "${shortcode}" removed.`);
        return res.status(410).send('Short URL has expired.'); // 410 Gone
    }

    Log("backend", "info", "controller", `Redirecting ${shortcode} to ${entry.longUrl}`);
    res.redirect(entry.longUrl);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server listening at http://localhost:${PORT}`);
    Log("backend", "info", "config", `Backend server running on port ${PORT}.`);
});