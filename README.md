# 汉兜助手 · Handou Solver

> 回合制累加筛选 · 基于 [antfu/handle](https://github.com/antfu/handle) 词库
>
> **⭐ 如果觉得有用,欢迎 Star!** 你的 Star 是我继续迭代的最大动力。

一款帮你解答 [汉兜](https://handle.antfu.me) 汉字 Wordle 的工具 —— 输入每回合的反馈(灰/黄/绿),实时缩小候选集合。

## ✨ 在线体验

**[GitHub Pages](https://CNSATO.github.io/handou-solver/)**: `https://CNSATO.github.io/handou-solver/`

也可以:
- 直接双击 `dist/index.html`(已嵌入词库,无需 server)
- 下载 `handou-solver.html` 单文件版(3.1 MB)分享给朋友

## 🚀 快速开始

### 1. 玩汉兜

打开 [handle.antfu.me](https://handle.antfu.me),系统会给你一个 4 字成语作为答案。

### 2. 打开本工具

浏览器访问你的 GitHub Pages 链接(或者双击 `dist/index.html`)。

### 3. 录入回合

- 在"添加新回合"输入框填入你猜的成语(如「雪上加霜」),回车
- 工具自动拆好拼音(雪 xve3, 上 shang4, 加 jia1, 霜 shuang1)
- 点击 12 个色块循环 `无 → 灰 → 黄 → 绿`,标记你看到的汉兜反馈
- 候选列表**实时**缩小

### 4. 多回合累加

继续猜下一词,工具自动累加所有回合的线索。常见场景:

| 你看到的反馈 | 工具会标 | 含义 |
|---|---|---|
| 灰色 | 灰 | 答案中任何位置都没有这个声/韵/调 |
| 黄色 | 黄 | 答案中有,但不在这个位置 |
| 绿色 | 绿 | 答案的该位置就是这个声/韵/调 |

候选稳定收敛到 ~10 个以内时,基本可以确认答案。

### 5. 状态自动持久化

所有回合数据存到 `localStorage`,关闭浏览器再打开,回合还在。

## 📸 截图

![screenshot](screenshots/main.png)

## 🧠 工作原理

每个汉字的拼音被拆成 **声 / 韵 / 调** 三部分(ü→v,`jqxy` 后的 u 转 v)。完全照搬 antfu/handle 的 `testAnswer` 算法:

1. **unmatched 池**:答案中所有非当前格的声/韵/调
2. 对每个输入 part:
   - `aVal === userVal` → `exact`(绿)
   - `unmatched` 池里能找到 → `misplaced`(黄)
   - 否则 → `none`(灰)
3. 每个回合独立判定,累加到筛选器

详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 🛠 本地开发

```powershell
# 1. 安装依赖
npm install

# 2. 重新生成词库(可选,已有 idioms_pinyin.json)
node scripts\precompute.mjs

# 3. 开发模式(本地 server)
node scripts\serve.mjs
# 浏览器打开 http://localhost:4477/

# 4. 构建发布版
node scripts\build.mjs
# 输出:
#   index.html              - 开发版(引用外部文件)
#   dist/index.html         - 发布版(混淆 + 词库内嵌,适合 GitHub Pages)
#   handou-solver.html      - 单文件版(3.1 MB,直接发给朋友)
```

## 📁 项目结构

```
.
├── index.html                    # 开发版入口
├── dist/
│   └── index.html                # 发布版(GitHub Pages 入口)
├── handou-solver.html            # 单文件版(发给朋友)
├── src/
│   ├── template.html             # HTML 模板
│   ├── app.js                    # UI 代码(可读)
│   └── solver-core.js            # 核心算法(构建时混淆)
├── scripts/
│   ├── precompute.mjs            # 生成 idioms_pinyin.json
│   ├── build.mjs                 # 构建发布版 + 混淆
│   ├── build-standalone.mjs      # 旧:生成单文件版
│   ├── test_solver.mjs           # 端到端测试(4 个场景 PASS)
│   └── serve.mjs                 # 本地 server
├── data/
│   ├── idioms.txt                # antfu/handle 词库
│   ├── polyphones.json           # antfu/handle 多音字表
│   └── idioms_pinyin.json        # 预计算词库(29760 个成语)
├── docs/
│   ├── ARCHITECTURE.md           # 架构文档
│   └── ALGORITHM.md              # 算法说明
├── screenshots/                  # UI 截图
├── LICENSE                       # AGPL-3.0
└── README.md
```

## 🙏 致谢

- [antfu/handle](https://github.com/antfu/handle) — 词库与基础算法(MIT 协议)
- [antfu](https://antfu.me) — 创造了汉兜这个好玩的游戏
- [pinyin](https://github.com/liu11hao12/pinyin) — 拼音库(Node.js)

## 📄 License

[AGPL-3.0](LICENSE)
