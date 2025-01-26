const express = require('express'); // Install with `npm install express`
const cors = require('cors'); // Install with `npm install cors`
// const fetch = require('node-fetch'); // Install with `npm install node-fetch`
const path = require('path'); // Core module, no installation needed

const app = express();
const port = 8981;

const ollamaUrl = "http://localhost:11434/api/"; // Base URL of the Ollama API

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors()); // Enable CORS for all origins
app.use(express.static(path.join(__dirname, 'public')));
// // Serve the HTML test page
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'test.html'));
// });

// Function to process the streaming response
async function processStream(reader, res) {
  const decoder = new TextDecoder();
  let resultText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    let result = decoder.decode(value, { stream: true });
    try {
      const resultJson = JSON.parse(result);
      const chunk = resultJson.message.content;
      resultText += chunk + " ";

      // Send each chunk to the client as a stream
      res.write(chunk);
    } catch (error) {
      console.error("Error parsing JSON chunk:", error, result);
    }
  }

  // End the streaming response
  res.end();
}

// API endpoint to send chat prompt
app.post('/api/chat', async (req, res) => {
  const { messages, model = "llama3.2:latest" } = req.body;
    console.log("Received request",messages,model)
  if (!messages) {
    return res.status(401).json({ error: "Prompt is required." });
  }

  try {

    const response = await fetch(ollamaUrl + "chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true, // Enable streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const reader = response.body.getReader();

    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    await processStream(reader, res);
  } catch (error) {
    console.error("Error communicating with the API:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
// API endpoint to model list
// API endpoint to fetch model list
app.get('/api/tags', async (req, res) => {
  try {
    const response = await fetch(ollamaUrl + "tags", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const tags = await response.json();
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Failed to fetch tags." });
  }
});


// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
