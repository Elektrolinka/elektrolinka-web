// Jednoduchý statický server pro náhled (bez závislostí). node server.js [root] [port]
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.resolve(process.argv[2] || '.'), port = +process.argv[3] || 8090;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  fs.readFile(f, (err, data) => {
    if (err) {
      // jako GitHub Pages: vlastní 404.html, pokud existuje
      const nf = path.join(root, '404.html');
      res.writeHead(404, { 'content-type': fs.existsSync(nf) ? types['.html'] : 'text/plain' });
      return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : '404');
    }
    const type = types[path.extname(f)] || 'application/octet-stream';
    // gzip jako na GitHub Pages, ať měření výkonu odpovídá ostrému provozu
    if (/text|javascript|json|svg|xml/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      res.writeHead(200, { 'content-type': type, 'content-encoding': 'gzip', 'cache-control': 'no-cache' });
      return res.end(zlib.gzipSync(data));
    }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
    res.end(data);
  });
}).listen(port, () => console.log(`http://localhost:${port}`));
