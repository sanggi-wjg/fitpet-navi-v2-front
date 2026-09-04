/**
 * 제안 diff — 현재 섹션 본문과 제안 본문을 프론트에서 비교한다 (DESIGN.md D.2 `section-proposal`).
 * 줄 단위 LCS 로 hunk 를 잡고, 바뀐 줄끼리 짝지어 어절 단위 LCS 로 나눈다.
 * 백엔드의 unified diff 문자열은 쓰지 않는다 — 목록 응답에 제안 본문(`tool_input.new_content`)이 있어
 * 리로드 후에도 같은 방식으로 미리보기를 만들 수 있기 때문이다.
 */

export type DiffOp = 'equal' | 'delete' | 'insert'

export interface DiffPart {
  op: DiffOp
  text: string
}

export interface DiffLine {
  type: 'equal' | 'insert' | 'delete' | 'changed'
  /** changed 는 parts 만 쓴다 */
  text: string
  parts: DiffPart[]
}

/** 이 이상이면 O(n·m) 표를 만들지 않고 통째로 삭제+추가로 본다 */
const MAX_CELLS = 4_000_000
/** 짝지은 두 줄의 공통 글자 비율이 이보다 낮으면 어절 diff 대신 줄 삭제·추가로 보인다 */
const MIN_SIMILARITY = 0.3

interface Edit<T> {
  op: DiffOp
  item: T
}

/** LCS 편집 스크립트 (삭제·추가 순서는 hunk 안에서 삭제 먼저) */
export function editScript<T>(a: T[], b: T[]): Edit<T>[] {
  const n = a.length
  const m = b.length
  if (n === 0 || m === 0 || n * m > MAX_CELLS) {
    return [
      ...a.map((item): Edit<T> => ({ op: 'delete', item })),
      ...b.map((item): Edit<T> => ({ op: 'insert', item })),
    ]
  }
  // table[i][j] = a[i:] 와 b[j:] 의 LCS 길이 — 1차원으로 편다
  const width = m + 1
  const table = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j]
          ? table[(i + 1) * width + j + 1] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
    }
  }
  const edits: Edit<T>[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      edits.push({ op: 'equal', item: a[i] })
      i++
      j++
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      edits.push({ op: 'delete', item: a[i] })
      i++
    } else {
      edits.push({ op: 'insert', item: b[j] })
      j++
    }
  }
  while (i < n) edits.push({ op: 'delete', item: a[i++] })
  while (j < m) edits.push({ op: 'insert', item: b[j++] })
  return edits
}

/** 어절과 공백을 모두 토큰으로 — 공백 보존 */
function tokenize(line: string): string[] {
  return line.split(/(\s+)/).filter((token) => token.length > 0)
}

/** 같은 op 가 이어지면 한 런으로 합친다 */
function mergeRuns(edits: Edit<string>[]): DiffPart[] {
  const parts: DiffPart[] = []
  for (const edit of edits) {
    const last = parts[parts.length - 1]
    if (last && last.op === edit.op) last.text += edit.item
    else parts.push({ op: edit.op, text: edit.item })
  }
  return parts
}

/** 한 줄 안의 어절 단위 diff */
export function wordDiff(before: string, after: string): DiffPart[] {
  return mergeRuns(editScript(tokenize(before), tokenize(after)))
}

function similarity(parts: DiffPart[], before: string, after: string): number {
  const longest = Math.max(before.length, after.length)
  if (longest === 0) return 1
  const shared = parts
    .filter((part) => part.op === 'equal')
    .reduce((sum, part) => sum + part.text.trim().length, 0)
  return shared / longest
}

/** 빈 본문은 0줄, 후행 개행 하나는 줄로 세지 않는다 (백엔드 unified_diff 와 같은 기준) */
function splitLines(text: string): string[] {
  if (text.length === 0) return []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** 연속된 삭제·추가 묶음을 짝지어 changed 줄로, 남는 줄은 삭제·추가 줄로 */
function flushHunk(deletes: string[], inserts: string[], out: DiffLine[]) {
  const pairs = Math.min(deletes.length, inserts.length)
  for (let k = 0; k < pairs; k++) {
    const parts = wordDiff(deletes[k], inserts[k])
    if (parts.every((part) => part.op === 'equal')) {
      // MAX_CELLS 폴백에서 같은 줄이 짝지어진 경우 — 변경으로 세지 않는다
      out.push({ type: 'equal', text: deletes[k], parts: [] })
    } else if (similarity(parts, deletes[k], inserts[k]) >= MIN_SIMILARITY) {
      out.push({ type: 'changed', text: '', parts })
    } else {
      out.push({ type: 'delete', text: deletes[k], parts: [] })
      out.push({ type: 'insert', text: inserts[k], parts: [] })
    }
  }
  for (const line of deletes.slice(pairs)) out.push({ type: 'delete', text: line, parts: [] })
  for (const line of inserts.slice(pairs)) out.push({ type: 'insert', text: line, parts: [] })
}

/** 섹션 본문 → 제안 본문. 같으면 equal 줄만 돌아온다. */
export function lineDiff(before: string, after: string): DiffLine[] {
  const out: DiffLine[] = []
  let deletes: string[] = []
  let inserts: string[] = []
  for (const edit of editScript(splitLines(before), splitLines(after))) {
    if (edit.op === 'equal') {
      flushHunk(deletes, inserts, out)
      deletes = []
      inserts = []
      out.push({ type: 'equal', text: edit.item, parts: [] })
    } else if (edit.op === 'delete') {
      deletes.push(edit.item)
    } else {
      inserts.push(edit.item)
    }
  }
  flushHunk(deletes, inserts, out)
  return out
}
