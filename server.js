const express = require('express');
const { createServer: createViteServer } = require('vite');
const path = require('path');

async function startServer() {
  const app = express();
  const vite = await createViteServer({
    server: { middlewareMode: 'html' },
    root: process.cwd(),
  });

  // Use Vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static files from /public if needed
  app.use(express.static(path.resolve(__dirname, 'public')));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express + Vite server running at http://localhost:${port}`);
  });
}

startServer();
