// src/app.js
// 汉兜助手 - UI 入口
// 核心算法 (src/solver-core.js) 会在打包时被 javascript-obfuscator 混淆后注入

// ============================================================
// 拼音常量(从 solver-core 暴露;运行时由打包器注入)
// ============================================================
const INITIALS = window.__CORE__.INITIALS
const FINALS = window.__CORE__.FINALS
const splitSyllable = window.__CORE__.splitSyllable
const joinSyllable = window.__CORE__.joinSyllable
const passes = window.__CORE__.passes

// ============================================================
// 状态
// ============================================================
let ALL_IDIOMS = {}
let SORT_MODE = 'alpha'
let ROUNDS = []
const STORAGE_KEY = 'handou-solver-rounds-v1'

function saveRounds() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ROUNDS)) } catch {}
}
function loadRounds() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) ROUNDS = JSON.parse(s)
  } catch {}
}

const COMMON_CHARS = new Set('不一了是人在有这中大来上国个说们为子和你地出到时要就出会可也下而生过发后作里用道行年所')
function freqScore(word) {
  let s = 0
  for (const c of word) if (COMMON_CHARS.has(c)) s++
  return s
}

// ============================================================
// UI: 回合列表
// ============================================================
function renderRounds() {
  const list = document.getElementById('roundsList')
  const panel = document.getElementById('roundsPanel')
  const count = document.getElementById('roundsCount')
  if (ROUNDS.length === 0) {
    panel.style.display = 'none'
    return
  }
  panel.style.display = 'block'
  count.textContent = ROUNDS.length
  list.innerHTML = ''
  ROUNDS.forEach((round, idx) => {
    const card = document.createElement('div')
    card.className = 'round'
    const head = document.createElement('div')
    head.className = 'round-head'
    head.innerHTML = `
      <span class="round-num">#${idx + 1}</span>
      <span class="round-word">${round.word}<span class="pinyin">${round.parts.map(joinSyllable).join(' ')}</span></span>
      <div class="round-actions">
        <button class="icon-btn" data-act="up" data-i="${idx}" ${idx === 0 ? 'disabled style="opacity:0.3"' : ''}>↑</button>
        <button class="icon-btn" data-act="down" data-i="${idx}" ${idx === ROUNDS.length - 1 ? 'disabled style="opacity:0.3"' : ''}>↓</button>
        <button class="icon-btn danger" data-act="del" data-i="${idx}">删</button>
      </div>
    `
    card.appendChild(head)
    const body = document.createElement('div')
    body.className = 'round-body'
    const chars = Array.from(round.word)
    for (let i = 0; i < 4; i++) {
      const p = round.parts[i]
      const st = round.states[i]
      const charEl = document.createElement('div')
      charEl.className = 'char'
      charEl.innerHTML = `<div class="char-hanzi">${chars[i] || '?'}</div><div class="parts"></div>`
      const partsEl = charEl.querySelector('.parts')
      ;['i', 'f', 't'].forEach((partName, pi) => {
        const labelMap = { i: '声', f: '韵', t: '调' }
        const row = document.createElement('div')
        row.className = 'part'
        const dotSt = st[pi] === 'none' ? '' : `data-st="${st[pi]}"`
        row.innerHTML = `
          <span class="part-label">${labelMap[partName]}</span>
          <span class="part-val">${partName === 't' ? (p.t || '·') : (p[partName] || '·')}</span>
          <span class="st-dot" ${dotSt} data-r="${idx}" data-c="${i}" data-p="${pi}"></span>
        `
        partsEl.appendChild(row)
      })
      body.appendChild(charEl)
    }
    card.appendChild(body)
    list.appendChild(card)
  })
}

function attachRoundHandlers() {
  const list = document.getElementById('roundsList')
  if (list._h) list.removeEventListener('click', list._h)
  list._h = e => {
    const target = e.target.closest('[data-act], .st-dot')
    if (!target) return
    if (target.dataset.act) {
      const i = +target.dataset.i
      if (target.dataset.act === 'del') {
        ROUNDS.splice(i, 1)
        saveRounds(); renderRounds(); updateCandidates()
      } else if (target.dataset.act === 'up' && i > 0) {
        ;[ROUNDS[i - 1], ROUNDS[i]] = [ROUNDS[i], ROUNDS[i - 1]]
        saveRounds(); renderRounds(); updateCandidates()
      } else if (target.dataset.act === 'down' && i < ROUNDS.length - 1) {
        ;[ROUNDS[i + 1], ROUNDS[i]] = [ROUNDS[i], ROUNDS[i + 1]]
        saveRounds(); renderRounds(); updateCandidates()
      }
    } else if (target.classList.contains('st-dot')) {
      const r = +target.dataset.r
      const c = +target.dataset.c
      const p = +target.dataset.p
      const cur = ROUNDS[r].states[c][p]
      const order = ['none', 'gray', 'yellow', 'green']
      const next = order[(order.indexOf(cur) + 1) % order.length]
      ROUNDS[r].states[c][p] = next
      saveRounds()
      target.dataset.st = next || ''
      target.style.background = next === 'none' ? 'var(--surface)' : `var(--${next})`
      target.style.borderColor = next === 'none' ? 'var(--line)' : `var(--${next})`
      updateCandidates()
    }
  }
  list.addEventListener('click', list._h)
}

function updateCandidates() {
  const list = document.getElementById('candList')
  const cands = ROUNDS.length === 0
    ? []
    : Object.entries(ALL_IDIOMS).filter(([_, p]) => passes(p, ROUNDS))

  if (SORT_MODE === 'freq') {
    cands.sort((a, b) => freqScore(b[0]) - freqScore(a[0]))
  } else {
    cands.sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'))
  }

  list.innerHTML = ''
  if (ROUNDS.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'cand-empty'
    empty.textContent = '添加一个猜过的成语,工具会按你标的状态实时筛选候选。'
    list.appendChild(empty)
  } else if (cands.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'cand-empty'
    empty.textContent = '没有候选词。请检查你的线索设置。'
    list.appendChild(empty)
  } else {
    const frag = document.createDocumentFragment()
    const show = cands.slice(0, 500)
    show.forEach(([word, parts]) => {
      const div = document.createElement('div')
      div.className = 'cand-item'
      div.title = parts.map(joinSyllable).join(' ')
      div.textContent = word
      frag.appendChild(div)
    })
    list.appendChild(frag)
    if (cands.length > 500) {
      const more = document.createElement('div')
      more.className = 'cand-empty'
      more.textContent = `… 还有 ${cands.length - 500} 个候选`
      list.appendChild(more)
    }
  }

  const total = Object.keys(ALL_IDIOMS).length
  document.getElementById('candCount').innerHTML =
    ROUNDS.length === 0
      ? '—'
      : `${cands.length.toLocaleString()} <span class="pct">(${(cands.length / total * 100).toFixed(1)}%)</span>`
  document.getElementById('candCount2').textContent = ROUNDS.length === 0 ? '—' : `${cands.length.toLocaleString()} 个`
  document.getElementById('filterInfo').textContent = cands.length > 500 ? `显示前 500` : ''
}

// ============================================================
// 添加新回合
// ============================================================
function addRound(word) {
  word = word.trim()
  const errEl = document.getElementById('errMsg')
  errEl.style.display = 'none'
  const input = document.getElementById('newWord')
  input.classList.remove('error')

  if (!/^[\u4e00-\u9fa5]{4}$/.test(word)) {
    errEl.textContent = '请输入 4 个汉字的成语。'
    errEl.style.display = 'block'
    input.classList.add('error')
    return
  }
  const pinyin = ALL_IDIOMS[word]
  if (!pinyin) {
    errEl.textContent = `"${word}" 不在 antfu/handle 词库中。`
    errEl.style.display = 'block'
    input.classList.add('error')
    return
  }
  const round = {
    word,
    parts: pinyin,
    states: [[], [], [], []].map(() => ['none', 'none', 'none']),
  }
  ROUNDS.push(round)
  saveRounds()
  renderRounds()
  attachRoundHandlers()
  updateCandidates()
  input.value = ''
  input.focus()
}

// ============================================================
// 初始化
// ============================================================
async function init() {
  try {
    let data
    if (window.__INLINE_DATA__) {
      data = window.__INLINE_DATA__
    } else {
      const res = await fetch('idioms_pinyin.json')
      if (!res.ok) throw new Error('加载词库失败,请确保 idioms_pinyin.json 在同目录下')
      data = await res.json()
    }
    ALL_IDIOMS = data
    document.getElementById('totalCount').textContent = Object.keys(ALL_IDIOMS).length.toLocaleString()
  } catch (e) {
    document.getElementById('loading').innerHTML =
      `<div style="color:var(--red);font-size:14px;text-align:center;padding:24px;max-width:480px">
        <strong>加载失败</strong><br><br>${e.message}<br><br>
        请先运行 <code style="background:var(--bg);padding:2px 6px;border-radius:4px">node scripts/precompute.mjs</code>
        生成 <code style="background:var(--bg);padding:2px 6px;border-radius:4px">idioms_pinyin.json</code>
      </div>`
    return
  }

  document.getElementById('loading').style.display = 'none'
  document.getElementById('app').style.display = 'block'

  loadRounds()
  renderRounds()
  attachRoundHandlers()
  updateCandidates()

  document.getElementById('btnAdd').addEventListener('click', () => addRound(document.getElementById('newWord').value))
  document.getElementById('newWord').addEventListener('keydown', e => {
    if (e.key === 'Enter') addRound(e.target.value)
  })
  document.getElementById('btnClearAll').addEventListener('click', () => {
    if (ROUNDS.length === 0) return
    if (confirm('清空所有回合?')) {
      ROUNDS = []
      saveRounds()
      renderRounds()
      updateCandidates()
    }
  })
  document.getElementById('btnPickRandom').addEventListener('click', () => {
    if (ROUNDS.length === 0) {
      const all = Object.keys(ALL_IDIOMS)
      const w = all[Math.floor(Math.random() * all.length)]
      addRound(w)
    } else {
      const cands = Object.entries(ALL_IDIOMS).filter(([_, p]) => passes(p, ROUNDS))
      if (cands.length === 0) { alert('当前筛选下没有候选词。'); return }
      const [w] = cands[Math.floor(Math.random() * cands.length)]
      addRound(w)
    }
  })
  document.getElementById('btnSortAlpha').addEventListener('click', () => { SORT_MODE = 'alpha'; updateCandidates() })
  document.getElementById('btnSortFreq').addEventListener('click', () => { SORT_MODE = 'freq'; updateCandidates() })

  // 演示数据(首次打开)
  if (ROUNDS.length === 0 && !localStorage.getItem(STORAGE_KEY + '-seen')) {
    localStorage.setItem(STORAGE_KEY + '-seen', '1')
    addRound('雪上加霜')
    ROUNDS[0].states[0] = ['gray', 'gray', 'green']
    ROUNDS[0].states[1] = ['gray', 'gray', 'green']
    ROUNDS[0].states[2] = ['green', 'gray', 'green']
    ROUNDS[0].states[3] = ['gray', 'gray', 'gray']
    saveRounds()
    renderRounds()
    attachRoundHandlers()
    updateCandidates()
  }
}

init()
