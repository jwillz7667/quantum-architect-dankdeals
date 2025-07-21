import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(join(__dirname, '../dist')));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  try {
    const indexPath = join(__dirname, '../dist/index.html');
    const indexHtml = readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(indexHtml);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Server error');
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
  });
});
