import http from "node:http";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";

const root = process.cwd();
const port = Number(process.env.SPG_LOCAL_PORT || 4177);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8"
};

http.createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relativePath = requestPath === "/" ? "sPg Crafting List.html" : requestPath.replace(/^\/+/, "");
    const target = path.resolve(root, relativePath);
    const relativeTarget = path.relative(root, target);
    if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const metadata = await stat(target);
    if (!metadata.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    const body = await readFile(target);
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream"
    });
    response.end(body);
  } catch (error) {
    response.writeHead(error && error.code === "ENOENT" ? 404 : 500).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`sPg local test server: http://127.0.0.1:${port}/\n`);
});
