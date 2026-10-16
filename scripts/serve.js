// Development/test-only static server. Production needs only HTML/CSS/JS/lib files.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
http
  .createServer((req, res) => {
    let filename;
    try {
      filename = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (!filename.startsWith(root + path.sep) && filename !== root) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filename) && fs.statSync(filename).isDirectory())
      filename = path.join(filename, "index.html");
    fs.readFile(filename, (error, data) => {
      if (error) {
        res.writeHead(404).end("Not found");
        return;
      }
      res
        .writeHead(200, {
          "Content-Type":
            types[path.extname(filename)] || "application/octet-stream",
        })
        .end(data);
    });
  })
  .listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
    console.log("StatsApplets: http://127.0.0.1:" + (process.env.PORT || 4173)),
  );
