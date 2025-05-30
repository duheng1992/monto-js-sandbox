import express from "express";
import morgan from "morgan";
import path from "path";
import config from "./config.js";

const app = express();

const { port, host } = config;

// 打印请求日志
app.use(morgan("dev"));

// 设置支持跨域请求头
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Allow", "GET, POST, OPTIONS");

  // TODO: 添加 CSP 头部 , 此处可以动态计算内联脚本的 SHA-256 hash，并添加到 script-src 中
  res.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';");
  // 添加 Referrer-Policy 头部
  res.header("Referrer-Policy", "no-referrer");
  // 其他安全头部
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "SAMEORIGIN");
  res.header("X-XSS-Protection", "1; mode=block");

  next();
});

// TODO: 动态处理 runScript.html
// app.get('/runScript.html', (req, res) => {
//   const filePath = path.join(process.cwd(), 'iframePublic', 'runScript.html');
//   fs.readFile(filePath, 'utf8', (err, html) => {
//     if (err) {
//       res.status(500).send('File not found');
//       return;
//     }
//     // 提取所有内联脚本内容
//     const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
//     let match;
//     const hashes = [];
//     while ((match = scriptRegex.exec(html)) !== null) {
//       const scriptContent = match[1];
//       const hash = crypto.createHash('sha256').update(scriptContent).digest('base64');
//       hashes.push(`'sha256-${hash}'`);
//     }
//     // 生成 CSP
//     const csp = `default-src 'self'; script-src 'self' ${hashes.join(' ')}; object-src 'none';`;
//     res.setHeader('Content-Security-Policy', csp);
//     res.setHeader('Referrer-Policy', 'no-referrer');
//     res.setHeader('X-Content-Type-Options', 'nosniff');
//     res.setHeader('X-Frame-Options', 'SAMEORIGIN');
//     res.setHeader('X-XSS-Protection', '1; mode=block');
//     res.send(html);
//   });
// });


app.use(
  express.static(path.join("iframePublic"), {
    etag: true,
    lastModified: true,
  })
);

// 启动 Node 服务
app.listen(port.iframe, host);
console.log(`iframe server start at http://${host}:${port.iframe}/`);
