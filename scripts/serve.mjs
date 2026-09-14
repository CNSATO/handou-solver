import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const ROOT = process.cwd()
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.txt': 'text/plain; charset=utf-8' }
const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0]
  if (p === '/') p = '/index.html'
  const full = path.join(ROOT, p)
  if (!full.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found: ' + p); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' })
    res.end(data)
  })
})
server.listen(4477, () => console.log('http://localhost:4477'))
