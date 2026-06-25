# Archipedia IIS 部署检查

## 服务器功能

在“服务器管理器 > 添加角色和功能 > Web 服务器 (IIS) > Web 服务器 > 性能”中安装：

- 静态内容压缩

安装后执行 `iisreset`，再将新的 `dist` 内容完整替换到网站物理目录。`web.config` 不包含 HTTPS 强制跳转，因此不会干扰当前证书配置。

## 缓存策略

- `/assets/` 下带哈希的 JS/CSS：缓存 1 年，`immutable`
- `/images/`、`/icon/` 等静态图片：缓存 30 天
- `index.html`、`sw.js`、`registerSW.js`、`manifest.webmanifest`：禁止长期缓存

## 发布后验证

在服务器或其他可访问网站的电脑上运行：

```powershell
curl.exe -I -H "Accept-Encoding: gzip" https://archipedia.top/
curl.exe -I -H "Accept-Encoding: gzip" https://archipedia.top/assets/实际生成的入口文件.js
curl.exe -I https://archipedia.top/index.html
curl.exe -I https://archipedia.top/sw.js
```

检查结果：

- JS/CSS 响应包含 `Content-Encoding: gzip`
- 哈希资源包含 `Cache-Control: public, max-age=31536000, immutable`
- `index.html` 与 Service Worker 文件不应长期缓存
- 每次发布应替换整个 `dist`，不要只替换 `index.html`
