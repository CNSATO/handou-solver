# 算法说明 · Algorithm

## 拼音拆分

每个汉字的拼音音节(如 `jing1`)被拆成 3 部分:

| 字段 | 含义 | 示例(`jing1`) |
|---|---|---|
| `i` | 声母 | `j` |
| `f` | 韵母(ü→v) | `ing` |
| `t` | 声调 0-5 | `1` |

### 拆分规则(与 antfu/handle 一致)

1. 取出末尾数字声调(0-5)
2. 只在 `j/q/x/y` 后 u→v 转换(如 `xue`→`xve`,`yu`→`yv`)
3. 从声母表(`b/p/m/f/d/t/n/l/g/k/h/j/q/x/r/w/y/zh/ch/sh/z/c/s`)里挑**最长匹配**作为声母,余下为韵母

```js
function splitSyllable(syl) {
  const t = syl.match(/[1-5]/) // 声调
  let base = syl.replace(/[1-5]/g, '').toLowerCase()
  base = base.replace(/^([jqxy])u/, '$1v')  // u→v
  let i = ''  // 声母
  for (const ini of [...INITIALS].sort((a,b) => b.length - a.length)) {
    if (base.startsWith(ini)) { i = ini; break }
  }
  const f = base.slice(i.length)  // 韵母
  return { i, f, t: +t?.[0] || 0 }
}
```

## 反馈判定(antfu testAnswer)

对每次猜测,游戏反馈是 4×3 = 12 个 part 的颜色。判定规则:

1. **构建 unmatched 池**:
   - `unmatched.parts` = 答案中所有非当前格子的声/韵部分
   - `unmatched.tone` = 答案中所有非当前格子的声调

2. **对每个 part**:
   - `aVal === userVal` → **绿 (exact)**
   - `unmatched` 池能找到一份 → **黄 (misplaced)**(从池中移除一份)
   - 否则 → **灰 (none)**

3. **特殊情况**:同一 part 在答案中出现多次时,FIFO 消耗 unmatched 池。

## 多回合累加

每个回合的反馈独立判定,**所有回合同时满足**才保留候选:

```js
function passes(answer, rounds) {
  for (const round of rounds) {
    if (!matchesSingleRound(answer, round)) return false
  }
  return true
}
```

## 一个有趣的反直觉

霜位 1 调在「雪上加霜 → 惨淡经营」里是**灰**而不是黄:
- 因为 1 调在答案的「经 jing1」位置
- 但 1 调被加位(经位)的 exact 绿消耗
- unmatched.tone 池里没剩 1
- 所以霜位 1 调显示灰

这符合 antfu/handle 实际游戏的行为。**第一直觉**是霜位 1 调应该黄(因为答案里其他位置有 1 调),但 antfu 的算法不是这样工作的。
