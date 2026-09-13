# Jasper · bilingual portfolio

已接入正式内容的本地静态网站，延续 Claude 的暖色编辑式视觉和 Linear 风格的项目组织。当前入口为 `portfolio/resume/index.html`；本目录的 `index.html` 是同源预览入口。两者在同一次生成中更新，运行时无需依赖、构建服务或网络 API。

## 内容与界面

- 默认英文；右上角 EN / 中文切换。`?lang=zh` 是显式中文入口。支持 `#profile`、`#internships`、`#work`，保留当前页面及折叠状态。
- Profile：左栏为姓名、定位、最终选定的 3D 肖像、肖像下方的「技能与工具」（四类全部条目）和联系入口；右栏为教育经历（每所院校完整课程列表，带课程数）与实习经历（岗位加三条精炼要点：定位 / 交付 / 成果，来自 `content/profile-brief.*.md`）。宽度 ≥1100px 且高度 ≥860px 时名片固定为一屏高（`height` = 视口 − 顶栏 − 32px）：字号、间距、肖像高度都按视口高度缩放（`dvh` 的 clamp），左栏由肖像行吸收剩余空间，右栏两块上下分布，因此 1440×900、1512×982、1728×1117、1920×1080 下均不滚动且两栏高度接近；更矮的窗口（如 1280×800）退回 `min-height` 自然滚动。教育经历为上下两张卡片、课程横排；实习经历为公司 + 岗位 + 日期一行，要点通栏。右栏另有 `app.js` 的 `fitProfile()`：测量两块内容与列高的差值，把右栏字号与间距按 `--fit`（1–1.22）放大，直到接近填满，避免两块之间出现大空洞；语言切换、窗口缩放、字体加载后都会重算。点击各部分“完整信息”打开全部课程、公司层面完整原文、技能原文或所有联系方式。
- Internship Projects：ByteDance 6 项、AVATR 3 项；完整摘要、角色、原文要点和技术信息。公司总述也可独立展开；“全部展开”控制九个项目。宽度 ≥1200px 时左侧有一条固定的「刻度轨」：长刻度 = 公司，短刻度 = 项目；圆点标记随滚动在轴上连续滑动，靠近标记的刻度会被拉长，当前刻度变陶土色并短暂弹出标题；悬停任意刻度显示标题，点击滚动到对应位置（点击后保持高亮，直到读者再次滚动）。由 `app.js` 在加载时生成，中英文标题随语言切换。
- Personal Work：六个项目全部正文、技术栈、日期与原有链接。未提供网址的项目不创建虚假链接。截图、照片、概念封面明确区分，真实视频不自动播放。

保留 Claude 的导航滑动指示、页面淡入、可中断的折叠动画、封面悬停、媒体浮层、键盘交互、焦点归还与 reduced-motion。新加入完整信息浮层、真实媒体切换和视频控件。长标题与全文自然换行，不截断正文。

## 修改与重新生成

正文只编辑：

- `content/site.zh.md`
- `content/site.en.md`
- `content/profile-brief.zh.md` / `content/profile-brief.en.md`：首页「实习经历」的精炼版（每段实习 3 条，中英逐条对应），只影响 Profile 右栏

页面结构编辑 `portfolio/resume/ui-demo/template.html`，不是生成后的 index.html。`@@…@@` 是编译器填充位置。

- `styles.css`：Claude 精修的共享视觉系统。
- `profile.css`：Claude 精修的名片基础布局。
- `content.css`：正式文案、肖像、封面、双语显示、阅读弹窗与响应式适配。
- `app.js`：界面翻译和交互控制；没有正文副本。
- `content-data.js`：生成的媒体索引和项目标题，勿手改。
- `tools/build_portfolio_content.py`：Markdown → 两个静态 HTML 入口与媒体数据。
- `tools/check_portfolio_html.py`：逐项核对 HTML 原文、标签结构、资源、翻译键和项目数量。

在 workspace 根目录运行：

```sh
python3 tools/check_site_content.py
python3 tools/build_portfolio_content.py
python3 tools/check_portfolio_html.py
node --check portfolio/resume/ui-demo/app.js
node --check portfolio/resume/ui-demo/content-data.js
```

`check_site_content.py` 同时验证之前确认的中文原文快照；如用户批准修改中文来源，需要同步维护配对内容及该快照。

不要使用旧 `tools/build_resume.py` 生成入口，它属于以前的简历版式。新编译器只安全复用其 Markdown 解析函数，不执行旧生成逻辑。

## 本地预览

直接打开 `portfolio/resume/index.html`，或在 workspace 根目录运行（服务根目录必须是 `portfolio/resume`，否则预览入口的 `../assets/` 取不到肖像和截图）：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory portfolio/resume
```

访问 <http://127.0.0.1:4173/index.html>（正式入口）或 <http://127.0.0.1:4173/ui-demo/>（预览入口）。

## 线上地址（GitHub Pages）

`portfolio/` 目录本身是 git 仓库（`github.com/Ddddd917/portfolio`，SSH 远程），推送 `main` 即发布：

- <https://ddddd917.github.io/portfolio/resume/> — 正式站点（中文入口加 `?lang=zh`）
- <https://ddddd917.github.io/portfolio/> — 根目录只是一个跳转页，自动转到上面的地址并保留 `?lang` 与 `#hash`；旧版作品集保留为 `portfolio-2026-05.html`

`assets/` 里是网页优化后的副本（JPEG ≤1600px、演示视频 960×540 约 2.7 MB、视频首帧海报），原始素材在 workspace 的 `design/media-originals/`，不进仓库。更新流程：改 Markdown 或模板 → `python3 tools/build_portfolio_content.py` → `python3 tools/check_portfolio_html.py` → 在 `portfolio/` 里 `git add resume && git commit && git push`。

## 素材

- `assets/portrait/jasper-selected.png`：用户最终附件的逐字节副本；原来的 v1–v6 不是本轮选片依据。
- 许 bobo：公开项目仓库中的原始猫照片、实际桌宠演示视频。
- 文档入库助手：工作区已有的看板、领域、分析三个截图。
- Resume Copilot：工作区已有的匹配结果、投递看板两个截图。
- 安悦童、ORION、知识地图：三张 AI 生成的概念封面；象牙白、陶土色、哑光材质和柔和阴影。封面不宣称是实际产品界面。保持完整构图。

详细来源见 `design/portfolio-assets.json`；三张概念图的原始最终 prompt 见 `design/cover-prompts.json`。

## 本轮验证范围

- 双语来源校验通过：4 节、10 个条目、9 个实习项目、6 个个人项目、77 条要点、192 个配对字段（含空值）。
- 两份 HTML 的 173 个非空字段均逐项还原 Markdown 原文；不以摘要替代全文。
- 两份 HTML 标签闭合、ID 唯一、本地文件路径和界面翻译键校验通过；JS 语法校验通过。
- 选定肖像的 SHA-256 与用户附件一致；媒体索引共 10 项，文件均存在。
- 本地预览返回 HTTP 200。此次未做浏览器截图或动态交互实测；正式长文下的视觉、窗口缩放和实机动效仍可在下一轮浏览器评审中细调。

Claude 在占位阶段的浏览器验证记录保留于 `design/archive/claude-ui-readme-before-content.md`，不能当作此次正文接入后的验证结果。旧 HTML、JS 与旧入口已备份到 `design/archive/`。
