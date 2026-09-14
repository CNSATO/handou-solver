// scripts/build.mjs
// 把 app.js (UI, 保持可读) + solver-core.js (核心算法, 混淆) + idioms_pinyin.json
// 打包成可发布的版本。
//
// 关键设计:核心算法的混淆 JS 单独输出到 .js 文件,HTML 里只引用 <script src>。
// 这样 HTML 解析器不会去处理 JS 源码,避免 obfuscator 注入特殊字符串破坏 HTML。
//
// 输出文件:
//   - index.html              (开发版,引用外部文件)
//   - dist/
//     ├── index.html          (发布版,词库内嵌 + <script src> 引用核心)
//     └── solver-core.min.js  (混淆的核心算法)
//   - handou-solver.html      (单文件版,词库 + base64 编码的 JS 全部内嵌)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JavaScriptObfuscator from 'javascript-obfuscator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const template = fs.readFileSync(path.join(root, 'src', 'template.html'), 'utf8')
const appJs = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8')
const coreJs = fs.readFileSync(path.join(root, 'src', 'solver-core.js'), 'utf8')
const data = fs.readFileSync(path.join(root, 'idioms_pinyin.json'), 'utf8')

// 1. 混淆核心算法(先去 export,再混淆)
console.log('混淆 solver-core.js ...')
const coreJsNoExport = coreJs.replace(/^export\s+/gm, '')

const coreObfRaw = JavaScriptObfuscator.obfuscate(coreJsNoExport, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.7,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'mangled',
  renameGlobals: false,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.7,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
}).getObfuscatedCode()

console.log(`  原始 ${(coreJs.length / 1024).toFixed(1)} KB → 混淆后 ${(coreObfRaw.length / 1024).toFixed(1)} KB`)

// 2. 输出独立 .js 文件(发布版用)
const coreMinJs = `(function(){${coreObfRaw}\nreturn { INITIALS, FINALS, splitSyllable, joinSyllable, passes };\n})();`

// 3. 处理 app.js(去掉 import 块,改为从 window.__CORE__ 取)
const appClean = appJs.replace(/^import\s+.*$/gm, '').replace(/^export\s+.*$/gm, '')

// 4. 开发版(引用外部文件)
const devScript = `<script src="src/solver-core.js"></script>\n<script type="module" src="src/app.js"></script>`

// 5. 发布版(词库内嵌 + 核心算法 base64 编码内嵌,单文件可部署到 GitHub Pages)
const coreBase64 = Buffer.from(coreMinJs, 'utf8').toString('base64')
const releaseScript = `<script>window.__CORE_B64__="${coreBase64}";</script>\n<script>window.__CORE__=eval(atob(window.__CORE_B64__));\n</script>\n<script>\n${appClean}\n</script>`
const inlineData = `<script>window.__INLINE_DATA__ = ${data};</script>`

// 6. standalone 单文件版(同 release,只是文件名不同)
const standaloneScript = releaseScript

// 应用模板
function fill(tmpl, script, dataTag) {
  return tmpl
    .replace('{{SCRIPT}}', script)
    .replace('{{INLINE_DATA}}', dataTag)
}

// 写文件
fs.mkdirSync(path.join(root, 'dist'), { recursive: true })

fs.writeFileSync(path.join(root, 'index.html'), fill(template, devScript, ''))
fs.writeFileSync(path.join(root, 'dist', 'index.html'), fill(template, releaseScript, inlineData))
// 也保留单独的 .min.js(让 devTools 能看到文件结构,方便调试)
fs.writeFileSync(path.join(root, 'dist', 'solver-core.min.js'), coreMinJs)
fs.writeFileSync(path.join(root, 'handou-solver.html'), fill(template, standaloneScript, inlineData))

console.log('生成 index.html (开发版,引用外部 src/)')
console.log('生成 dist/index.html (发布版,词库 + base64 核心算法内嵌,单文件)')
console.log('生成 dist/solver-core.min.js (混淆核心算法,辅助文件)')
console.log('生成 handou-solver.html (standalone 单文件,给朋友用)')

const sizes = {
  'index.html (开发)': fs.statSync(path.join(root, 'index.html')).size,
  'dist/index.html (发布)': fs.statSync(path.join(root, 'dist', 'index.html')).size,
  'dist/solver-core.min.js (混淆)': fs.statSync(path.join(root, 'dist', 'solver-core.min.js')).size,
  'handou-solver.html (standalone)': fs.statSync(path.join(root, 'handou-solver.html')).size,
}
for (const [k, v] of Object.entries(sizes)) {
  console.log(`  ${k}: ${(v / 1024 / 1024).toFixed(2)} MB`)
}
