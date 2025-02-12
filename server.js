const express = require('express');
const cors = require('cors');
const path = require('path');
const ollamaHandlers = require('./scripts/ollamaHandlers');

const app = express();
const port = 8981;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/generate', ollamaHandlers.generate);
app.post('/api/chat', ollamaHandlers.chat);
app.post('/api/create', ollamaHandlers.createModel);
app.get('/api/models', ollamaHandlers.getModels);
app.get('/api/tags', ollamaHandlers.getTags);
app.get('/api/models/:modelName', ollamaHandlers.getModelInfo);
app.post('/api/models/:modelName/copy', ollamaHandlers.copyModel);
app.delete('/api/models/:modelName', ollamaHandlers.deleteModel);
app.post('/api/models/:modelName/pull', ollamaHandlers.pullModel);
app.post('/api/models/:modelName/push', ollamaHandlers.pushModel);
app.post('/api/embeddings', ollamaHandlers.embeddings);
app.get('/api/running_models', ollamaHandlers.runningModels);
app.get('/api/version', ollamaHandlers.version);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
