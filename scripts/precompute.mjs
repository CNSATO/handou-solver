// scripts/precompute.mjs
// 用 pinyin 库为每个成语生成 {声, 韵, 调} 三元组
// 输出: idioms_pinyin.json
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pinyinPkg from 'pinyin'
const pinyin = pinyinPkg.default || pinyinPkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const idiomsText = fs.readFileSync(path.join(root, 'idioms_full.txt'), 'utf8')
const idioms = idiomsText.split('\n').map(s => s.trim()).filter(Boolean)
const polyphones = JSON.parse(fs.readFileSync(path.join(root, 'polyphones.json'), 'utf8'))

// 与 antfu/handle 一致
const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'w', 'y', 'zh', 'ch', 'sh', 'z', 'c', 's']
const FINALS = ['a', 'ai', 'an', 'ang', 'ao', 'e', 'ei', 'en', 'eng', 'er', 'i', 'ia', 'ian', 'iang', 'iao', 'ie', 'in', 'ing', 'io', 'iong', 'iu', 'o', 'ong', 'ou', 'u', 'ua', 'uai', 'uan', 'uang', 'ui', 'un', 'uo', 'v', 'van', 've', 'vn']

// 拆一个带声调的拼音音节,返回 { i, f, t }
// 规则与 antfu/handle 一致:
// 1) 取出末尾数字声调
// 2) 只在 j/q/x/y 后 u→v 转换(如 xue→xve, yu→yv);shuang/uang 保持不变
// 3) 从 INITIALS 里挑最长匹配作为声母,余下为韵母
function split(syllable) {
  if (!syllable) return { i: '', f: '', t: 0 }
  const toneMatch = syllable.match(/[1-5]/)
  const t = toneMatch ? +toneMatch[0] : 0
  let base = syllable.replace(/[1-5]/g, '').toLowerCase().trim()
  // u→v(只在 j/q/x/y 后)
  base = base.replace(/^([jqxy])u([a-z]*)$/, '$1v$2')
  // 声母优先匹配(从长到短)
  let i = ''
  for (const ini of [...INITIALS].sort((a, b) => b.length - a.length)) {
    if (base.startsWith(ini)) { i = ini; break }
  }
  let f = base.slice(i.length)
  return { i, f, t }
}

const out = {}
let missingCount = 0
// antfu/handle: idioms.txt 与 polyphones.json 互不包含,合并为一个答案库
const allWords = new Set([...idioms, ...Object.keys(polyphones)])
for (const word of allWords) {
  let parts
  if (polyphones[word]) {
    parts = polyphones[word].split(/\s+/).map(split)
  } else {
    const py = pinyin(word, { style: pinyin.STYLE_TONE2 })
    parts = py.map(arr => split(arr[0]))
  }
  if (parts.length !== 4 || parts.some(p => !p.i && !p.f)) {
    missingCount++
    if (missingCount < 10) console.warn('异常:', word, '→', JSON.stringify(parts))
    continue
  }
  out[word] = parts
}

const outPath = path.join(root, 'idioms_pinyin.json')
fs.writeFileSync(outPath, JSON.stringify(out))
console.log(`写入 ${Object.keys(out).length} 个成语到 ${outPath}`)
if (missingCount) console.log(`跳过 ${missingCount} 个异常成语`)
