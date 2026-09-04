/**
 * 섹션 본문 마크다운 유틸. 정본은 백엔드 `task_sections` 행이며, 이 모듈은 마커 검사와 편집 본문 검증만 맡는다.
 * - 코드 펜스(``` / ~~~) 안의 `## ` 는 헤딩이 아니다 (알림톡 템플릿 코드블록).
 * - 예제 마커: `(예: …)`. 정의는 `MARKER_RE` 하나뿐이며 개수(`countMarkers`)와 하이라이트(`splitMarkers`)가 같은 규칙을 쓴다.
 */

/**
 * 한 마커 = `(예:` 부터 **같은 줄의** 닫는 괄호(없으면 줄 끝)까지.
 * 안쪽에서 새 `(예:` 가 시작되면 그 앞에서 끊어, 중첩된 마커도 각각 하나로 센다 (spec: `(예:` 문자열 검색).
 */
export const MARKER_RE = /\(예:(?:(?!\(예:)[^)\n])*\)?/g

const HEADING_RE = /^## (.+?)\s*$/
const FENCE_RE = /^\s*(```|~~~)/

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
  /** 섹션 표시 이름 */
  section: string
  text: string
}

/** 섹션 전체의 마커 위치 — 게이트의 `markerCount` 합과 같은 범위 */
export function collectMarkers(
  sections: ReadonlyArray<{ name: string; body: string }>,
): MarkerLocation[] {
  return sections.flatMap(({ name, body }) =>
    splitMarkers(body)
      .filter((run) => run.marker)
      .map((run) => ({ section: name, text: run.text })),
  )
}
