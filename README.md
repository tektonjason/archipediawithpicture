<div align="center">
  <img width="120" height="120" src="/public/icon/archipediaicon.webp" alt="Archipedia Logo" />
  <h1>Archipedia</h1>
  <p><strong>Architecture Learning Planet</strong></p>
  <p>
    A lightweight architecture learning platform for beginners<br>
    轻量且面向初学者的建筑学习平台
  </p>
</div>

---

## 📖 Introduction / 简介

**English**  
Archipedia is a lightweight architecture learning platform designed for beginners. By combining traditional architectural knowledge, design methodologies, toolchains, and AI assistance, it helps you avoid detours, bridge information gaps, and streamline your learning journey. Think of it as your "Architecture Learning Planet."

**中文**  
Archipedia 是一个轻量且面向初学者的建筑学习平台。它把传统建筑知识、设计方法、工具链与 AI 辅助结合起来，致力于帮你少走弯路、跨越信息差，是你的专属“建筑学习星球”。

---

## ✨ Key Features / 主要功能

### 🏛️ Encyclopedia (建筑百科)
- **English:** A structured collection of Ancient Chinese, Ancient Western, and Modern architectural knowledge. Features global search, grid/list view toggles, and local bookmarks/history.
- **中文:** 结构化收录中国古代、西方古代与现代建筑知识，支持全局搜索、网格/列表视图切换、本地收藏与浏览历史记录。

### 🤖 AI Assistant (AI 导师)
- **English:** Integrated multi-model access with architecture-specific prompts. Helps answer academic questions, create study plans, interpret theories, and critique designs.
- **中文:** 集成多模型入口 + 建筑学专用 Prompt，能够回答学术问题、制定学习计划、解读晦涩理论以及提供作业批改说明。

### 🧩 Essentials (建筑干货)
- **English:** Includes design methodology maps, FAQs, and an "Interactive Universe" for career guidance.
- **中文:** 包含设计方法图谱、常见问答（Q&A）与职业导览（Interactive Universe），全方位辅助学习与职业规划。

### 🧰 Resources (资源库)
- **English:** Curated links for essential tools, software, and assets (Maps/Weather data, Rendering engines, 3D assets, Color schemes, etc.).
- **中文:** 精选建筑师必备的工具、软件与素材链接（涵盖地图/气象、渲染、素材、配色等领域）。

### 📚 Readings (建筑读物)
- **English:** A digital library with reading guides. Includes internal verification for compliant access to restricted educational resources.
- **中文:** 数字图书馆与导读系统，内置校内核验机制，确保受限教学资源的合规访问（合规为先）。

### 🏆 Competitions (竞赛合集)
- **English:** A compilation of competition information with one-click redirection to official search queries.
- **中文:** 整理各类竞赛资讯，并提供一键跳转查询入口，方便获取最新赛事信息。

---

## 🛠️ Tech Stack / 技术栈

- **Frontend (前端):** Angular 19 (Control Flow, Signals)
- **Styling (样式):** Tailwind CSS
- **Storage (存储):** LocalStorage (Local data persistence, no registration required / 本地化数据，减少注册门槛)
- **Design (设计):** Responsive, Desktop/Mobile adaptive, Collapsible sidebar (响应式，桌面/移动适配，侧边栏可折叠)

---

## 🚀 Quick Start / 快速开始

```bash
# 1. Clone the repository / 克隆仓库
git clone <repo_url>

# 2. Enter the directory / 进入目录
cd archipedia

# 3. Install dependencies / 安装依赖
npm install

# 4. Run the application / 运行应用
npm run dev
# or / 或
npm start
```

---

## 🔒 Privacy & Compliance / 隐私与合规

- **Local Data:** User favorites and browsing history are stored **only** on your local device.
- **Copyright:** For copyrighted readings, we prioritize providing bibliographies, reading guides, and legal access paths. We do not distribute unauthorized content directly.

- **本地数据:** 用户收藏、浏览历史等信息仅存于本地设备，不上传服务器。
- **版权合规:** 对于受版权保护的读物，优先提供书目、导读与合法访问路径，避免直接分发未授权内容。

---

## 📝 Content Management / 内容管理指南

This project is designed for easy extensibility. Most content can be added by modifying specific array lists in the code.  
本项目设计了便捷的扩展性，大部分内容可以通过修改代码中的数组列表直接添加。

### 1. Encyclopedia (建筑百科)
- **File / 文件**: [`src/services/data.service.ts`](src/services/data.service.ts)
- **Method / 位置**: `seedArchipediaData()`
- **Add Entries / 添加条目**: Scroll to the bottom of the desired category list (e.g., "China Ancient Architecture") and add a new array entry following the commented example.  
  找到对应分类列表（如“中国古代建筑”）的末尾，按照注释示例添加新的数组条目。
- **Add Category / 新增分类**: Simply use a new category name in your data entry. The tab will appear automatically.  
  直接在数据条目中使用新的分类名称，标签栏会自动显示该分类。
- **Tab Order / 分类顺序**: Edit `categoryOrder` in [`src/components/encyclopedia/encyclopedia.component.ts`](src/components/encyclopedia/encyclopedia.component.ts) to change tab order.  
  编辑 `encyclopedia.component.ts` 中的 `categoryOrder` 数组来调整标签顺序。
- **Images / 图片配置**: Configure new category image paths in `categoryImageConfig` in `data.service.ts`.  
  在 `data.service.ts` 的 `categoryImageConfig` 中配置新分类的图片路径规则。

### 2. Resources, Readings & Competitions (资源、读物与竞赛)
- **File / 文件**: [`src/services/data.service.ts`](src/services/data.service.ts)
- **Resources / 资源库**: Locate `getSeedResources()` and add to the list end.  
  找到 `getSeedResources()` 方法，在列表末尾添加对象。
- **Readings / 建筑读物**: Locate `seedReadingsData()` and add to the list end.  
  找到 `seedReadingsData()` 方法，在列表末尾添加对象。
- **Competitions / 竞赛**: Locate `seedCompetitionsData()` and add to the list end.  
  找到 `seedCompetitionsData()` 方法，在列表末尾添加对象。

### 3. Essentials (建筑干货)
- **Design Methodology / 设计方法**:  
  Edit `methodologyColumns` in [`src/components/essentials/methodology.component.ts`](src/components/essentials/methodology.component.ts).  
  编辑 `methodology.component.ts` 中的 `methodologyColumns` 数组。
- **Career Universe / 职业导览**:  
  Edit `rawCareers` in [`src/components/essentials/career.component.ts`](src/components/essentials/career.component.ts). (Ensure new careers match keywords in `determineCategory` for correct coloring).  
  编辑 `career.component.ts` 中的 `rawCareers` 数组。（确保新职业能被 `determineCategory` 中的关键词识别，以获得正确的颜色分类）。
- **Q&A / 问答**:  
  Edit `qaItems` in [`src/components/essentials/qna.component.ts`](src/components/essentials/qna.component.ts).  
  编辑 `qna.component.ts` 中的 `qaItems` 数组。

---

## 🤝 Contributing / 参与贡献

**English**  
Suggestions via Issues, PR submissions, and content/resource contributions are welcome. Please refer to the CONTRIBUTING document (if available) for code style, branching, and commit guidelines.

**中文**  
欢迎通过 Issues 提建议、提交 PR 或贡献内容与资源。代码风格、分支与提交规范请参考仓库中的 CONTRIBUTING 文档（若存在）。

---

## 👨‍💻 About the Author / 关于作者

**English**  
I am **Zeng Ruokuan**, an undergraduate architecture student (Class of 2021) at **Ningxia University**. The motivation behind developing Archipedia was to consolidate the paths I've taken, the pitfalls I've encountered, and the useful resources I've found, to help architecture beginners get started faster and prevent information gaps from hindering their growth.

**中文**  
我是 **曾若宽**，**宁夏大学** 2021 级建筑学本科生。开发 Archipedia 的初衷是把我自己走过的一些路径、遇到的坑与有用资源沉淀下来，帮助建筑初学者更快上手，不让信息差成为成长的阻碍。

---

<div align="center">
  <p>Made with ❤️ for Architecture Students</p>
</div>
