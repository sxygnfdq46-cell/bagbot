// server.js — BagBot 2.0 Standalone Server

const path = require("path");
const { createServer } = require("http");
const { parse } = require("url");

// Path to Next.js standalone server
const nextServer = require("./.next/standalone/server.js");

// Serve static files from .next/static
const staticPath = path.join(__dirname, ".next", "static");

// Create basic HTTP server
const server = createServer((req, res) => {
  try {
    const parsedUrl = parse(req.url, true);

    // Handle _next/static files manually
    if (parsedUrl.pathname.startsWith("/_next/static")) {
      nextServer.handleRequest(req, res);
      return;
    }

    // Everything else is handled by Next.js router
    nextServer.handleRequest(req, res);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.statusCode = 500;
    res.end("Internal server error");
  }
});

// Start Server
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 BagBot Frontend running on port ${PORT}`);
});
