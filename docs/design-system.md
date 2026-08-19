# ARCHIPEDIA Design System

本规范用于约束 ARCHIPEDIA 的界面视觉、动效和交互细节。它在保留现有中文内容、暗色知识库气质和建筑资料密度的基础上，吸收 `emilkowalski/skills` 中对设计工程、动画判断和 Apple 式流畅反馈的原则，转化为本应用可执行的实现标准。

## 设计目标

- **克制而高级**：界面服务于阅读、检索、下载和学习，不用装饰性动效抢走注意力。
- **快速可感知**：常用操作必须在按下时立即反馈，弹窗、面板、提示在 300ms 内完成主要运动。
- **材料有层级**：侧边栏、顶部栏、弹窗、卡片使用暗色玻璃与半透明边界表达层级，避免厚重实心块堆叠。
- **中英文同构**：英文只替换文字内容，不改变中文的信息结构、动效和页面节奏；英文文案应自然、准确、短而美观。

## Motion Tokens

全局令牌定义在 `src/styles.css` 与 `tailwind.config.cjs`：

| Token | Value | 用途 |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | 进入、退出、点击反馈、普通 UI 运动 |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | 屏幕内位置转换、可逆运动 |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | 抽屉、侧栏、较大面板 |
| `--duration-press` | `120ms` | 按压反馈 |
| `--duration-fast` | `160ms` | 小按钮、颜色、图标反馈 |
| `--duration-ui` | `220ms` | 卡片、筛选项、轻量面板 |
| `--duration-modal` | `260ms` | 弹窗与大浮层 |

## Visual Tokens

- 表面从 `--surface-canvas`、`--surface-base`、`--surface-raised` 到 `--surface-overlay` 逐级变亮；禁止在同一区域嵌套多个同级卡片。
- 文字使用 `--text-primary`、`--text-secondary`、`--text-muted` 三层；正文不使用纯灰色堆出过多中间层级。
- 强调色使用 `--accent-blue` 与 `--accent-blue-strong`，主要用于焦点、选中、链接和低频提示，不把整屏染成单一蓝色。
- 间距优先使用 `--space-1/2/3/4/6/8`；图标按钮与常用触控控件不得低于 `--touch-target`（40px）。

## 动效判断

- 高频操作只保留微反馈：hover、列表切换、收藏、复制等不做大位移动画。
- 偶发操作可使用标准动效：弹窗、详情页图片预览、分享菜单、搜索展开。
- 首次引导可保留“惊喜预算”：资源服务入口的彗星描边属于低频提示，可以更有表现力。
- 不使用 `ease-in` 作为 UI 动效曲线；它会让响应开始时显得迟缓。
- 不使用 `transition-all`；明确写出 `transform`、`opacity`、`background-color`、`border-color`、`box-shadow` 等实际属性。
- 入口动效不得从 `scale(0)` 开始；弹窗从 `scale(0.96)` 到 `1`，tooltip 从 `scale(0.96)` 到 `1`。
- hover 位移只在 `@media (hover: hover) and (pointer: fine)` 中启用，避免移动端 tap 触发假 hover。

## 组件标准

### Buttons

- 所有可点击控件需要按下反馈：`scale(0.97)`，时长 `120ms`。
- 主按钮用于确定、打开、下载；次按钮用于取消、复制、辅助操作；图标按钮保持 40px 基准触控区域。
- `focus-visible` 使用蓝色弱光环，不用默认 outline。

### Cards

- 卡片圆角保持 8px 或项目既有 `rounded-card`。
- 卡片 hover 只做轻微背景、边界和阴影变化；图片最多放大到 `1.03` 左右。
- 大列表卡片禁止强位移和长动画，防止滚动时产生漂浮感。

### Modals

- 弹窗使用居中 `transform-origin: center`，进入 `260ms`，退出更短 `180ms`。
- 背景用暗色遮罩加轻微 blur，弹窗本体使用更厚的暗色玻璃材质。
- 内容很多的详情页优先保证滚动、二维码、底部按钮完整可见，再考虑视觉装饰。
- 弹窗面板统一使用 `appModalA11y`，通过 `(modalClose)` 响应 Escape；Tab 焦点不得离开最上层弹窗，关闭后恢复到原触发控件。
- 进入使用 `animate.enter="ui-modal-enter"`，退出使用 `animate.leave="ui-modal-leave"`，确保退出动画结束后再移除 DOM。

### Tooltips

- tooltip 从触发元素方向轻微位移进入，初始 `scale(0.96)`。
- 首次 hover 有完整动效，相邻 tooltip 可加速显示，避免工具栏使用时显得迟钝。
- 移动端不显示 hover tooltip；键盘 focus 仍可显示。
- 首次指针悬停延迟 350ms，相邻提示可立即出现；必须设置 `role="tooltip"`、唯一 ID，并由触发控件通过 `aria-describedby` 关联。

### Empty States

- 空状态只说明当前结果与下一步，不重复解释页面用途。
- 使用 64px 内的简单图标容器、短标题和一条辅助文字；只有明确可恢复时才显示操作按钮。

## Bilingual Layout

- 中文使用严格断行和自然换行，不修改现有文案；英文允许单词级换行，但按钮、标签和筛选项优先保持单行。
- 英文标题应优先改写为准确短语，不逐字直译；卡片标题最多两行，元信息和按钮使用紧凑动词。
- 语言切换只能改变文本和语言相关资源，不改变页面结构、中文模式视觉、百科标题打字节奏或业务数据。

## Accessibility

- `prefers-reduced-motion: reduce` 下保留颜色、透明度等低刺激反馈，去除大位移和持续运动。
- 交互状态必须兼顾键盘：hover 不能是唯一反馈，`focus-visible` 必须清晰。
- 英文模式下优先使用短句，避免撑破卡片或造成弹窗标题换行失控。

## Implementation Checklist

- 新增 UI 时优先使用 `.ui-btn`、`.ui-icon-btn`、`.ui-card`、`.ui-card-hover`、`.ui-modal-*`。
- 动画时间不超过 300ms，除非是首开提示、宣传式展示或明确的解释性动画。
- 只动画 `transform` 与 `opacity`；颜色、边框、阴影可作为辅助过渡。
- hover 动画必须用媒体查询包裹。
- 新增英文文案时使用 `LocaleService` 或现有数据翻译路径，不直接把英文写死到中文页面结构之外。
