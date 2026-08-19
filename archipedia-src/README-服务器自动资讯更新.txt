ARCHIPEDIA 服务器自动资讯更新脚本包

版本：2026.07.29

把整个 archipedia-src 文件夹复制到服务器：

  C:\Sites\archipedia-src

目标结构应为：

  C:\Sites\archipedia-src
    package.json
    server-scripts
      install-news-cache-task.ps1
      update-news-cache.ps1
    utils
      update-news-cache.mjs
    docs
      news-auto-update.md

第一次配置每日自动更新：

  1. 用管理员身份打开 PowerShell。
  2. 运行：

     cd C:\Sites\archipedia-src

     powershell -ExecutionPolicy Bypass -File .\server-scripts\install-news-cache-task.ps1 -SiteRoot "C:\Sites\archipedia" -ProjectRoot "C:\Sites\archipedia-src" -DailyTime "03:30"

如果服务器已经存在 ARCHIPEDIA Daily News Update 计划任务：

  - 只需把本文件夹复制到 C:\Sites，并选择覆盖同名文件。
  - 不需要重新运行 install-news-cache-task.ps1。
  - 原计划任务会继续使用相同路径，并自动采用最新版抓取策略。

手动测试更新：

  powershell -ExecutionPolicy Bypass -File C:\Sites\archipedia-src\server-scripts\update-news-cache.ps1 -SiteRoot "C:\Sites\archipedia" -ProjectRoot "C:\Sites\archipedia-src"

成功后会更新：

  C:\Sites\archipedia\news-cache.json

注意：

  - C:\Sites\archipedia 是网站 dist 文件所在目录。
  - C:\Sites\archipedia-src 是自动资讯更新脚本目录，不要作为 IIS 网站目录公开。
  - 服务器需要能运行 node 命令。可在 PowerShell 中输入 node -v 检查。
  - 之后如果只更新网站界面，替换 C:\Sites\archipedia 中的 dist 文件即可。
  - 本版本会优先展示封面可正常加载的来源，并把有方降为末位备用。
  - 更新会先生成并校验候选缓存，异常时不会覆盖线上已有的正常资讯。
  - 如果之后更新资讯抓取逻辑，需要同时替换 utils 和 server-scripts 中的对应文件。
