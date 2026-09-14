// scripts/test_solver.mjs
// 端到端测试:模拟 index.html 的 passes 算法,跑几个场景
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ALL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'idioms_pinyin.json'), 'utf8'))

const INITIALS = ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','w','y','zh','ch','sh','z','c','s']

function splitSyllable(syl) {
  if (!syl) return { i: '', f: '', t: 0 }
  const toneMatch = String(syl).match(/[1-5]/)
  const t = toneMatch ? +toneMatch[0] : 0
  let base = String(syl).replace(/[1-5]/g, '').toLowerCase().trim()
  base = base.replace(/^([jqxy])u([a-z]*)$/, '$1v$2')
  let i = ''
  for (const ini of [...INITIALS].sort((a, b) => b.length - a.length)) {
    if (base.startsWith(ini)) { i = ini; break }
  }
  const f = base.slice(i.length)
  return { i, f, t }
}

// state[i][pi] = { value, status }
function makeState(setup) {
  // setup = [[声/韵/调 values+status, ...], ...] for 4 cols
  const s = []
  for (let i = 0; i < 4; i++) {
    s.push([
      { value: setup[i][0]?.value ?? '', status: setup[i][0]?.status ?? 'none' },
      { value: setup[i][1]?.value ?? '', status: setup[i][1]?.status ?? 'none' },
      { value: setup[i][2]?.value ?? '', status: setup[i][2]?.status ?? 'none' },
    ])
  }
  return s
}

// 完全照搬 antfu testAnswer 思路,但适配"用户填了部分 part"的场景
// 关键:antfu 中,unmatched 池的构建基于 input(用户的输入)与 answer 的对比
// 如果用户在某格某 part 上没填(空),则该 part 默认 exact,不会污染 unmatched 池
// 实现:用 antfu 的 `!a._1` 短路,空 part 直接 exact,不查 unmatched
function passes(state, answer) {
  // 把用户填的 part 与空 part 组成 input
  const input = []
  for (let i = 0; i < 4; i++) {
    const cell = state[i]
    input.push({
      i: cell[0].value || '',   // 空就是空,不要用 answer 填
      f: cell[1].value || '',
      t: cell[2].value ? +cell[2].value : 0,
    })
  }
  // 收集 unmatched:基于 input vs answer
  const unmatched = { tone: [], parts: [] }
  for (let i = 0; i < 4; i++) {
    if (input[i].t !== answer[i].t) unmatched.tone.push(answer[i].t)
    if (input[i].i !== answer[i].i) unmatched.parts.push(answer[i].i)
    if (input[i].f !== answer[i].f) unmatched.parts.push(answer[i].f)
  }
  function pull(arr, v) {
    if (v === '' || v == null) return false
    const idx = arr.indexOf(v)
    if (idx >= 0) { arr.splice(idx, 1); return true }
    return false
  }
  // 对每个用户填了值 + 状态的格子,验证反馈是否匹配
  for (let i = 0; i < 4; i++) {
    for (let pi = 0; pi < 3; pi++) {
      const partName = ['i', 'f', 't'][pi]
      const userVal = pi === 2 ? (state[i][pi].value ? +state[i][pi].value : null) : state[i][pi].value
      const userSt = state[i][pi].status
      if (userSt === 'none') continue
      if (userVal == null || userVal === '' || (pi === 2 && !userVal)) continue

      // antfu:!a._1 → exact(空值视为 exact)
      // 我们这里 userVal 非空,所以走真实判定
      const aVal = answer[i][partName]
      let got
      if (aVal === userVal) {
        got = 'exact'
      } else {
        // input 不匹配,看 unmatched 池
        const arr = partName === 't' ? unmatched.tone : unmatched.parts
        if (pull(arr, userVal)) got = 'misplaced'
        else got = 'none'
      }
      if (userSt === 'green' && got !== 'exact') return false
      if (userSt === 'yellow' && got !== 'misplaced') return false
      if (userSt === 'gray' && got !== 'none') return false
    }
  }
  return true
}

function runScenario(name, stateSetup, mustInclude = [], mustExclude = []) {
  const state = makeState(stateSetup)
  const cands = Object.entries(ALL).filter(([_, p]) => passes(state, p))
  console.log(`\n[${name}] 候选数: ${cands.length.toLocaleString()}`)
  const candWords = new Set(cands.map(c => c[0]))
  let allGood = true
  for (const w of mustInclude) {
    if (candWords.has(w)) console.log(`  ✓ 包含必须: ${w}`)
    else { console.log(`  ✗ 缺少必须: ${w}`); allGood = false }
  }
  for (const w of mustExclude) {
    if (!candWords.has(w)) console.log(`  ✓ 排除正确: ${w}`)
    else { console.log(`  ✗ 错误包含: ${w}`); allGood = false }
  }
  if (cands.length <= 30) {
    console.log(`  全部候选: ${[...candWords].join(', ')}`)
  }
  return allGood
}

console.log(`总词库: ${Object.keys(ALL).length.toLocaleString()}`)

// 场景 1: 雪上加霜 → 惨淡经营(用户描述)
const s1 = [
  // 雪: x 灰, ve 灰, 3 绿
  [{ value: 'x', status: 'gray' }, { value: 've', status: 'gray' }, { value: '3', status: 'green' }],
  // 上: sh 灰, ang 灰, 4 绿
  [{ value: 'sh', status: 'gray' }, { value: 'ang', status: 'gray' }, { value: '4', status: 'green' }],
  // 加: j 绿, ia 灰, 1 绿
  [{ value: 'j', status: 'green' }, { value: 'ia', status: 'gray' }, { value: '1', status: 'green' }],
  // 霜: sh 灰, uang 灰, 1 灰(antfu 算法: 1 调被位置 2 的"加 jia1"消耗,unmatched.tone=[2] 里没 1)
  [{ value: 'sh', status: 'gray' }, { value: 'uang', status: 'gray' }, { value: '1', status: 'gray' }],
]
const r1 = runScenario('雪上加霜 → 惨淡经营', s1,
  ['惨淡经营'],                       // 必须包含(答案)
  ['雪上加霜', '雪中送炭', '一了百了']  // 猜过的词必须排除
)

// 场景 2: 全空 → 全部
const r2 = runScenario('空状态 → 全部', [[], [], [], []],
  ['惨淡经营', '一丁不识', '雪上加霜'],
  []
)

// 场景 3: 已知答案第 1 字是 c(惨) + 第 2 字是 d(淡) + 第 3 字是 j(经) → 只剩 1 个
const s3 = [
  [{ value: 'c', status: 'green' }, { value: 'an', status: 'green' }, { value: '3', status: 'green' }],
  [{ value: 'd', status: 'green' }, { value: 'an', status: 'green' }, { value: '4', status: 'green' }],
  [{ value: 'j', status: 'green' }, { value: 'ing', status: 'green' }, { value: '1', status: 'green' }],
  [], // 第 4 字没线索
]
const r3 = runScenario('全绿前 3 字 → 惨淡经营', s3,
  ['惨淡经营'],
  []
)

// 场景 4: 灰声母 zh → 任何位置无 zh
const s4 = [
  [{ value: 'zh', status: 'gray' }, , ],   // 第 1 字 声母 zh 灰
  [],
  [],
  [],
]
const r4 = runScenario('全局排除 zh 声母', s4,
  [],  // 不能有 zh
  []
)
const zhWords = ['一知半解', '正儿八经', '知人善任']
let r4ok = r4
for (const w of zhWords) {
  if (ALL[w]) {
    const state = makeState(s4)
    const passes4 = passes(state, ALL[w])
    if (passes4) { console.log(`  ✗ "${w}" 应被排除但通过了`); r4ok = false }
    else console.log(`  ✓ "${w}" 正确被排除`)
  }
}

console.log('\n==========')
console.log(`场景 1(主示例): ${r1 ? 'PASS' : 'FAIL'}`)
console.log(`场景 2(空状态): ${r2 ? 'PASS' : 'FAIL'}`)
console.log(`场景 3(全绿前 3 字): ${r3 ? 'PASS' : 'FAIL'}`)
console.log(`场景 4(全局排除 zh): ${r4ok ? 'PASS' : 'FAIL'}`)
