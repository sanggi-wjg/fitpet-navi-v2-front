/**
 * 정본 마크다운 유틸.
 * - 섹션: `## 섹션명:` 헤딩 단위. 템플릿이 섹션 구성을 고정하므로 프론트는 섹션을 만들지도 지우지도 않는다.
 * - 코드 펜스(``` / ~~~) 안의 `## ` 는 헤딩이 아니다 (알림톡 템플릿 코드블록).
 * - 예제 마커: `(예: …)`. 정의는 `MARKER_RE` 하나뿐이며 개수(`countMarkers`)와 하이라이트(`splitMarkers`)가 같은 규칙을 쓴다.
 */

export const MARKER_TOKEN = '(예:'

/**
 * 한 마커 = `(예:` 부터 **같은 줄의** 닫는 괄호(없으면 줄 끝)까지.
 * 안쪽에서 새 `(예:` 가 시작되면 그 앞에서 끊어, 중첩된 마커도 각각 하나로 센다 (spec: `(예:` 문자열 검색).
 */
export const MARKER_RE = /\(예:(?:(?!\(예:)[^)\n])*\)?/g

const HEADING_RE = /^## (.+?)\s*$/
const FENCE_RE = /^\s*(```|~~~)/

export interface Section {
  /** 문서 안 순서. 편집·교체의 식별자 — 이름은 중복될 수 있으므로 쓰지 않는다 */
  index: number
  /** `index:name` — React key, 편집 상태 키 */
  key: string
  name: string
  body: string
}

export interface ParsedDocument {
  /** 첫 헤딩 앞 텍스트 (템플릿 문서라면 보통 비어 있다) */
  preamble: string
  sections: Section[]
}

export const PREAMBLE_KEY = 'preamble'

/** 줄 단위로 순회하며 코드 펜스 안팎을 알려준다 */
function* walkLines(markdown: string): Generator<{ line: string; inFence: boolean }> {
  let fence: string | null = null
  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const match = FENCE_RE.exec(line)
    if (match) {
      if (fence === null) fence = match[1]
      else if (match[1] === fence) fence = null
      yield { line, inFence: true }
      continue
    }
    yield { line, inFence: fence !== null }
  }
}

export function parseSections(markdown: string): ParsedDocument {
  const preamble: string[] = []
  const raw: Array<{ name: string; lines: string[] }> = []
  let current: { name: string; lines: string[] } | null = null

  for (const { line, inFence } of walkLines(markdown)) {
    const heading = inFence ? null : HEADING_RE.exec(line)
    if (heading) {
      current = { name: heading[1].trim(), lines: [] }
      raw.push(current)
    } else if (current) {
      current.lines.push(line)
    } else {
      preamble.push(line)
    }
  }

  return {
    preamble: preamble.join('\n').trim(),
    sections: raw.map((section, index) => ({
      index,
      key: `${index}:${section.name}`,
      name: section.name,
      body: section.lines.join('\n').trim(),
    })),
  }
}

export function serializeSections(doc: ParsedDocument): string {
  const parts: string[] = []
  if (doc.preamble) parts.push(doc.preamble)
  for (const section of doc.sections) parts.push(`## ${section.name}\n${section.body.trim()}`)
  return `${parts.join('\n\n')}\n`
}

export function getSection(markdown: string, name: string): Section | undefined {
  return parseSections(markdown).sections.find((section) => section.name === name)
}

/**
 * 섹션 전체 교체. `target` 은 섹션 인덱스(권장) 또는 이름(첫 일치).
 * 대상이 없으면 throw — 템플릿 밖 섹션은 만들지 않는다.
 */
export function replaceSection(markdown: string, target: number | string, body: string): string {
  const doc = parseSections(markdown)
  const index =
    typeof target === 'number'
      ? target
      : doc.sections.findIndex((section) => section.name === target)
  const section = doc.sections[index]
  if (!section) throw new Error(`섹션을 찾을 수 없습니다: ${target}`)
  doc.sections[index] = { ...section, body: body.trim() }
  return serializeSections(doc)
}

/** 첫 헤딩 앞 텍스트 교체 */
export function replacePreamble(markdown: string, body: string): string {
  const doc = parseSections(markdown)
  return serializeSections({ ...doc, preamble: body.trim() })
}

/**
 * 편집 본문에 새 섹션 헤딩(`## `)이 들어 있으면 그 줄을 돌려준다.
 * 섹션 구성은 템플릿이 고정하므로 저장 전에 차단한다. `###` 이하와 펜스 안은 허용.
 */
export function findForbiddenHeading(body: string): string | null {
  for (const { line, inFence } of walkLines(body)) {
    if (!inFence && HEADING_RE.test(line)) return line
  }
  return null
}

export interface TextRun {
  text: string
  marker: boolean
}

/** 문자열을 일반 텍스트 / 예제 마커 구간으로 나눈다 (하이라이트 렌더용) */
export function splitMarkers(text: string): TextRun[] {
  const runs: TextRun[] = []
  let last = 0
  for (const match of text.matchAll(MARKER_RE)) {
    const start = match.index ?? 0
    if (start > last) runs.push({ text: text.slice(last, start), marker: false })
    runs.push({ text: match[0], marker: true })
    last = start + match[0].length
  }
  if (last < text.length) runs.push({ text: text.slice(last), marker: false })
  return runs
}

/** 예제 마커 개수 — `splitMarkers` 와 같은 정의 */
export function countMarkers(text: string): number {
  return text.match(MARKER_RE)?.length ?? 0
}

export interface MarkerLocation {
  /** 표시용 섹션명. 헤딩 앞 텍스트는 '본문' */
  section: string
  text: string
}

/** 문서 전체(헤딩 앞 텍스트 포함)의 마커 위치 — 게이트의 `countMarkers(content)` 와 같은 범위 */
export function collectMarkers(markdown: string): MarkerLocation[] {
  const doc = parseSections(markdown)
  const blocks = [
    { section: '본문', body: doc.preamble },
    ...doc.sections.map((section) => ({
      section: sectionDisplayName(section.name),
      body: section.body,
    })),
  ]
  return blocks.flatMap(({ section, body }) =>
    splitMarkers(body)
      .filter((run) => run.marker)
      .map((run) => ({ section, text: run.text })),
  )
}

/** 백엔드 템플릿 헤딩은 `## 정책:` 처럼 콜론으로 끝난다. 표시할 때만 콜론을 뗀다. */
export function sectionDisplayName(name: string): string {
  return name.replace(/[:：]\s*$/, '')
}
