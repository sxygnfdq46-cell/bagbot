const path = require("path");
const express = require("express");
const next = require("next");

const app = next({ dev: false, dir: "." });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Serve static files (videos, images, css, fonts)
  server.use(express.static(path.join(__dirname, "public")));
  server.use(express.static(path.join(__dirname, ".next/static")));

  // Fix standalone static asset serving
  server.use(
    "/_next",
    express.static(path.join(__dirname, ".next/standalone/.next"))
  );

  // Fallback for all Next.js routes
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(10000, () => {
    console.log("Server running on port 10000");
  });
});
