import React, { useState } from 'react';
import './App.css';
import { Log } from './logger'; 

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [customShortcode, setCustomShortcode] = useState('');
  const [validity, setValidity] = useState(''); 
  const [shortUrlResult, setShortUrlResult] = useState('');
  const [error, setError] = useState('');

  const BACKEND_API_URL = 'http://localhost:3000'; 

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShortUrlResult('');
    setError('');

    Log("frontend", "info", "component", `Attempting to shorten URL: ${longUrl}`);

    if (!longUrl) {
      setError("URL cannot be empty.");
      Log("frontend", "warn", "hook", "Shorten attempt with empty URL.");
      return;
    }

    const requestBody = {
      url: longUrl,
    };

    if (validity) {
      const parsedValidity = parseInt(validity);
      if (isNaN(parsedValidity) || parsedValidity <= 0) {
        setError("Validity must be a positive number.");
        Log("frontend", "warn", "hook", `Invalid validity input: ${validity}`);
        return;
      }
      requestBody.validity = parsedValidity;
    }

    if (customShortcode) {
      requestBody.shortcode = customShortcode;
    }

    try {
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setShortUrlResult(data.shortlink);
        Log("frontend", "info", "api", `Short URL created: ${data.shortlink}`);
      } else {
        setError(data.error || 'Failed to shorten URL.');
        Log("frontend", "error", "api", `Backend error shortening URL: ${data.error || 'Unknown'}`);
      }
    } catch (err) {
      setError('Could not connect to the backend server. Please ensure it is running and CORS is configured.');
      Log("frontend", "fatal", "api", `Network error connecting to backend: ${err.message}`);
    }
  };

  return (
    <div className="App-container">
      <div className="App-card">
        <h1>URL Shortener</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="longUrl">Long URL</label>
            <input
              id="longUrl"
              type="text"
              value={longUrl}
              onChange={(e) => {
                setLongUrl(e.target.value);
                Log("frontend", "debug", "component", `Long URL input changed: ${e.target.value}`);
              }}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="customShortcode">Custom Shortcode (Optional)</label>
            <input
              id="customShortcode"
              type="text"
              value={customShortcode}
              onChange={(e) => {
                setCustomShortcode(e.target.value);
                Log("frontend", "debug", "component", `Custom shortcode input changed: ${e.target.value}`);
              }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="validity">Validity in Minutes (Optional, default 30)</label>
            <input
              id="validity"
              type="number"
              value={validity}
              onChange={(e) => {
                setValidity(e.target.value);
                Log("frontend", "debug", "component", `Validity input changed: ${e.target.value}`);
              }}
            />
          </div>
          <button type="submit" className="submitbtn">
            Shorten URL
          </button>
        </form>

        {shortUrlResult && (
          <div className="success">
            <h2>Short URL Created:</h2>
            <a href={shortUrlResult} target="_blank" rel="noopener noreferrer">
              {shortUrlResult}
            </a>
          </div>
        )}

        {error && (
          <div className="error">
            <p>Error: {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;