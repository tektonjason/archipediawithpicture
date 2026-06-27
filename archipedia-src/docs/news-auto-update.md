# ARCHIPEDIA 资讯自动更新

网站上线后，如果只把 `dist` 文件复制到 IIS 站点目录，资讯不会自己变新。原因是浏览器端静态页面不能可靠跨域抓取 ArchDaily、Archeyes、Architectuul、有方等网站，必须由服务器定时生成同源的 `news-cache.json`。

当前方案不需要 AI，也不需要数据库：

1. 服务器每天运行一次 Node.js 抓取脚本。
2. 抓取脚本按来源适配不同网站结构。
3. 脚本把最新结果写入 IIS 网站根目录的 `news-cache.json`。
4. 用户打开百科主页时，前端只读取本站自己的 `/news-cache.json`。

脚本会优先使用 `xnx3/translate` 同款的 Edge 翻译通道为英文资讯生成 `titleZh` 和 `summaryZh` 字段；如果翻译接口临时不可用，会自动回退到内置建筑术语规则，保证资讯仍可显示。

## 本地命令

更新开发用缓存：

```powershell
npm run news:update
```

更新已构建目录：

```powershell
npm run build
npm run news:update:dist
```

生产构建会自动运行一次资讯更新：

```powershell
npm run build
```

## 服务器首次配置

假设：

- IIS 网站根目录是 `C:\Sites\archipedia`
- 项目源码目录是 `C:\Sites\archipedia-src`
- 服务器已安装 Node.js 20.19 或更高版本

把项目中的 `utils` 和 `server-scripts` 文件夹放到 `C:\Sites\archipedia-src`，然后用管理员 PowerShell 运行：

```powershell
cd C:\Sites\archipedia-src
powershell -ExecutionPolicy Bypass -File .\server-scripts\install-news-cache-task.ps1 -SiteRoot "C:\Sites\archipedia" -ProjectRoot "C:\Sites\archipedia-src" -DailyTime "03:30"
```

安装完成后会创建 Windows 计划任务：

```text
ARCHIPEDIA Daily News Update
```

## 手动测试一次

```powershell
powershell -ExecutionPolicy Bypass -File C:\Sites\archipedia-src\server-scripts\update-news-cache.ps1 -SiteRoot "C:\Sites\archipedia" -ProjectRoot "C:\Sites\archipedia-src"
```

然后检查：

```powershell
Get-Content C:\Sites\archipedia\news-cache.json -TotalCount 20
```

浏览器访问：

```text
https://archipedia.top/news-cache.json
```

如果能看到 JSON，百科主页就会读取这个最新资讯缓存。

## 日志位置

默认日志在：

```text
C:\Sites\archipedia-src\logs\news-update.log
```

如果某个来源当天访问失败，脚本会记录失败原因，并保留该来源的备用入口卡片，避免主页空白。

## 当前来源策略

- ArchDaily：优先读取 RSS/FeedBurner；失败时保留 ArchDaily 项目入口。
- Archeyes：读取官方 RSS，提取标题、链接、发布日期、封面图和摘要。
- Architectuul：通过页面文本代理读取首页链接，并按建筑相关关键词过滤。
- 有方：通过页面文本代理读取首页链接，并按中文建筑资讯关键词过滤。

这些策略不依赖 AI。后续如果某个网站改版，只需要调整 `utils/update-news-cache.mjs` 中对应来源的 adapter。
