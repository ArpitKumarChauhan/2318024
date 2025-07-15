// logger.js (Frontend Version)
const axios = require('axios'); // Note: You need to install axios in your frontend: npm install axios

const LOG_API_URL = "http://20.244.56.144/evaluation-service/logs";

// *** IMPORTANT: Replace this with your NEWLY GENERATED, FRESH access token ***
// This token should be the same as the one in your backend's logger.js
let currentAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJrdW1hcmNoYXVoYW5hcnBpdEBnbWFpbC5jb20iLCJleHAiOjE3NTI1NjMxNzYsImlhdCI6MTc1MjU2MjI3NiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImVkM2NkOWUzLTFjNmUtNGVjMi1hZjQwLTk3NDNkNjJjOWVlZSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImFycGl0IGt1bWFyIGNoYXVoYW4iLCJzdWIiOiIxOGU0YmQyYy01NDhiLTQwZmEtODM2MC1mM2Y5YTFiNjUxODcifSwiZW1haWwiOiJrdW1hcmNoYXVoYW5hcnBpdEBnbWFpbC5jb20iLCJuYW1lIjoiYXJwaXQga3VtYXIgY2hhdWhhbiIsInJvbGxObyI6IjIzMTgwMjQiLCJhY2Nlc3NDb2RlIjoiUUFoRFVyIiwiY2xpZW50SUQiOiIxOGU0YmQyYy01NDhiLTQwZmEtODM2MC1mM2Y5YTFiNjUxODciLCJjbGllbnRTZWNyZXQiOiJLak1EZnRNc0JKRFVBclFyIn0.aIAQgBmUQzYu1O9rZo3LCg-KFW8zVUSLygJnba8IRuA"; // Example: "eyJhbGciOiJIUzI1NiIsIn..."

// Allowed values for log messages
const validStacks = ["backend", "frontend"];
const validLevels = ["debug", "info", "warn", "error", "fatal"];

const validBackendPackages = [
    "cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service", // Backend only packages
    "auth", "config", "middleware", "utils", "component", "hook", "page", "state", "style" // Both backend & frontend packages
];
const validFrontendPackages = [
    "api", // Frontend only packages
    "auth", "config", "middleware", "utils", "component", "hook", "page", "state", "style" // Both backend & frontend packages
];

async function Log(stack, level, pkg, message) {
    // Check if inputs are valid
    if (!validStacks.includes(stack)) {
        console.error(`Log Error: Invalid 'stack' value provided: "${stack}".`);
        return;
    }
    if (!validLevels.includes(level)) {
        console.error(`Log Error: Invalid 'level' value provided: "${level}".`);
        return;
    }

    let isValidPackage = false;
    if (stack === "backend" && validBackendPackages.includes(pkg)) {
        isValidPackage = true;
    } else if (stack === "frontend" && validFrontendPackages.includes(pkg)) {
        isValidPackage = true;
    }

    if (!isValidPackage) {
        console.error(`Log Error: Invalid 'package' value "${pkg}" for stack "${stack}".`);
        return;
    }

    // Check if you have the access token
    if (!currentAccessToken || currentAccessToken === "YOUR_NEWLY_GENERATED_ACCESS_TOKEN_HERE") { // Make sure this condition accounts for your default string
        console.error("Log Error: Access token is not set or is default. Cannot send log.");
        return;
    }

    // Prepare the message for the server
    const requestBody = {
        stack: stack,
        level: level,
        package: pkg,
        message: message,
    };

    // Send the log message to Affordmed's server
    try {
        const response = await axios.post(LOG_API_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentAccessToken}` // Your token goes here
            },
            timeout: 5000 // Wait max 5 seconds for a response
        });

        if (response.status === 200) {
            console.log("Log sent successfully:", response.data); // Server replied OK
        } else {
            console.error(`Log API Error: Status ${response.status}. Response:`, response.data);
        }
    } catch (error) {
        // If there's any problem sending the log
        if (error.response) {
            console.error("Log API Request Failed:", error.response.status, error.response.data);
            if (error.response.status === 401) { // 401 means your token might be bad/expired
                console.error("Log Error: Access token might be expired or invalid. Please re-authenticate.");
            }
        } else if (error.request) {
            console.error("Log API No Response:", error.message); // No reply from server
        } else {
            console.error("Log API Request Setup Error:", error.message); // Problem before sending
        }
    }
}

module.exports = { Log }; // Make Log function usable by other files