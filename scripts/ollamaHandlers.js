const ollamaUrl = "http://localhost:11434/api/";

// Generic function to proxy requests to Ollama API
async function proxyToOllama(req, res, endpoint, method = 'POST') {
    try {
      const response = await fetch(ollamaUrl + endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: method === 'POST' ? JSON.stringify(req.body) : undefined,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // Check if the response is a stream
      const contentType = response.headers.get('Content-Type');
      let isStream = contentType && contentType.includes('application/json') && req.body?.stream;
      if(endpoint==='generate'){
        isStream = true;
      }
      res.setHeader('Content-Type', contentType || 'application/json');
  
      if (isStream && response.body) {
        res.setHeader('Transfer-Encoding', 'chunked'); // Enable streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          let chunk = decoder.decode(value, { stream: true });
  
          try {
            // const json = JSON.parse(chunk);
            // const output = json.message?.content || json.response || '';
            res.write(chunk);
          } catch (error) {
            console.error('Error parsing streaming JSON chunk:', error, chunk);
          }
        }
  
        res.end();
      } else {
        // If not a stream, send normal response
        const data = await response.text();
        res.send(data);
      }
    } catch (error) {
      console.error(`Error communicating with the Ollama API at /${endpoint}:`, error);
      res.status(500).json({ error: "Internal server error." });
    }
  }

// Export handlers for different endpoints
module.exports = {
  generate: (req, res) => proxyToOllama(req, res, 'generate'),
  chat: (req, res) => proxyToOllama(req, res, 'chat'),
  getTags: (req, res) => proxyToOllama(req, res, 'tags', 'GET'),
  createModel: (req, res) => proxyToOllama(req, res, 'create'),
  getModels: (req, res) => proxyToOllama(req, res, 'models', 'GET'),
  getModelInfo: (req, res) => proxyToOllama(req, res, `models/${req.params.modelName}`, 'GET'),
  copyModel: (req, res) => proxyToOllama(req, res, `models/${req.params.modelName}/copy`),
  deleteModel: (req, res) => proxyToOllama(req, res, `models/${req.params.modelName}`, 'DELETE'),
  pullModel: (req, res) => proxyToOllama(req, res, `models/${req.params.modelName}/pull`),
  pushModel: (req, res) => proxyToOllama(req, res, `models/${req.params.modelName}/push`),
  embeddings: (req, res) => proxyToOllama(req, res, 'embeddings'),
  runningModels: (req, res) => proxyToOllama(req, res, 'running_models', 'GET'),
  version: (req, res) => proxyToOllama(req, res, 'version', 'GET'),
};
