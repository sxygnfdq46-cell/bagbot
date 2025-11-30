const path = require("path");
const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();
const port = process.env.PORT || 10000;

app.prepare()
  .then(() => {
    const server = express();

    // Serve static files (videos, images, css, fonts)
    server.use(express.static(path.join(__dirname, "public")));
    server.use(express.static(path.join(__dirname, ".next/static")));

    // Serve _next static files
    server.use("/_next/static", express.static(path.join(__dirname, ".next/static")));

    // Fallback for all Next.js routes - use middleware instead of route
    server.use((req, res) => {
      return handle(req, res);
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
  });
