// scripts/build-standalone.mjs
// 把 idioms_pinyin.json 嵌入到 index.html,生成一个独立 HTML 文件
// 朋友双击就能用,无需 server / Node.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const data = fs.readFileSync(path.join(root, 'idioms_pinyin.json'), 'utf8')

// 检查 index.html 是否已经支持内嵌数据
if (!html.includes('window.__INLINE_DATA__')) {
  console.error('错误:index.html 未支持内嵌数据模式,请确认 init() 里有 window.__INLINE_DATA__ 判断。')
  process.exit(1)
}

// 把数据注入到 <head> 末尾
const inject = `<script>window.__INLINE_DATA__ = ${data};</script>`
const out = html.replace('</head>', `${inject}\n  </head>`)

const outPath = path.join(root, 'handou-solver.html')
fs.writeFileSync(outPath, out)

const sizeMB = (out.length / 1024 / 1024).toFixed(2)
console.log(`生成 ${outPath}`)
console.log(`大小 ${sizeMB} MB (${out.length.toLocaleString()} 字节)`)
console.log(`双击即可在浏览器中打开,无需 server / Node.js`)
