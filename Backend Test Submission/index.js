const express = require('express');
const bodyParser = require('body-parser'); 
const cors = require('cors'); 
const { Log } = require('G:/2318024/Logging Middleware/logger.js'); 

const app = express();
const PORT = 3001; 

app.use(bodyParser.json()); 
app.use(express.json()); 
app.use(cors({
    origin: 'http://localhost:3000' 
})); 

const urlStore = {};

function generateShortcode() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) { // Generate a 6-character shortcode
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
Log("backend", "info", "config", "Backend server starting up.");

app.post('/shorturls', (req, res) => {
    const { url, shortcode, validity } = req.body;

    if (!url) {
        Log("backend", "warn", "controller", "Shorten URL request received without a URL.");
        return res.status(400).json({ error: 'URL is required.' });
    }

    let generatedShortcode = shortcode;
    if (!generatedShortcode) {
        generatedShortcode = generateShortcode();
        while (urlStore[generatedShortcode]) { 
            generatedShortcode = generateShortcode();
        }
    } else {
        if (urlStore[generatedShortcode]) {
            Log("backend", "warn", "controller", `Custom shortcode "${generatedShortcode}" already in use.`);
            return res.status(409).json({ error: 'Custom shortcode already exists.' }); 
        }
    }

    const shortlink = `http://localhost:${PORT}/${generatedShortcode}`;
    const expirationTime = validity ? Date.now() + validity * 60 * 1000 : null; 

    urlStore[generatedShortcode] = {
        longUrl: url,
        expiration: expirationTime
    };

    Log("backend", "info", "service", `URL shortened: ${url} -> ${shortlink}`);
    res.status(201).json({ shortlink }); 
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
        delete urlStore[shortcode]; 
        Log("backend", "info", "cache", `Expired shortcode "${shortcode}" removed.`);
        return res.status(410).send('Short URL has expired.'); 
    }

    Log("backend", "info", "controller", `Redirecting ${shortcode} to ${entry.longUrl}`);
    res.redirect(entry.longUrl);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server listening at http://localhost:${PORT}`);
    Log("backend", "info", "config", `Backend server running on port ${PORT}.`);
});
