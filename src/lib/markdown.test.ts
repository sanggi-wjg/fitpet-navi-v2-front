import { describe, expect, it } from 'vitest'
import {
  collectMarkers,
  countMarkers,
  findForbiddenHeading,
  getSection,
  parseSections,
  replacePreamble,
  replaceSection,
  sectionDisplayName,
  serializeSections,
  splitMarkers,
} from '@/lib/markdown'

const doc = [
  '## 정책:',
  '- 생일인 유저에게 적립금 5,000원 발급',
  '',
  '## 세부사항:',
  '- (예: 발송 채널 — 알림톡)',
  '',
  '### 알림톡 템플릿',
  '```',
  '## 안내',
  '(예: [핏펫] 생일 축하드려요',
  '30일 안에 사용해 주세요.)',
  '```',
  '',
  '## 예외 조건:',
  '- (예: 이미 발급받은 유저 제외)',
  '',
].join('\n')

describe('parseSections', () => {
  it('## 헤딩 단위로 나누고 인덱스 기반 키를 붙인다', () => {
    const parsed = parseSections(doc)
    expect(parsed.preamble).toBe('')
    expect(parsed.sections.map((s) => s.name)).toEqual(['정책:', '세부사항:', '예외 조건:'])
    expect(parsed.sections.map((s) => s.key)).toEqual(['0:정책:', '1:세부사항:', '2:예외 조건:'])
  })

  it('코드 펜스 안의 ## 는 헤딩이 아니다', () => {
    const parsed = parseSections(doc)
    expect(parsed.sections).toHaveLength(3)
    expect(parsed.sections[1].body).toContain('## 안내')
    expect(parsed.sections[1].body.startsWith('- (예:')).toBe(true)
  })

  it('헤딩 앞 텍스트는 preamble 로 보존하고 왕복해도 같은 문서가 된다', () => {
    const withPreamble = `설명\n\n${doc}`
    const parsed = parseSections(withPreamble)
    expect(parsed.preamble).toBe('설명')
    expect(serializeSections(parsed)).toBe(withPreamble)
    expect(serializeSections(parseSections(doc))).toBe(doc)
  })

  it('같은 이름의 섹션이 둘이어도 키는 다르다', () => {
    const dup = parseSections('## A:\n- 1\n\n## A:\n- 2\n')
    expect(dup.sections.map((s) => s.key)).toEqual(['0:A:', '1:A:'])
  })
})

describe('replaceSection / replacePreamble', () => {
  it('인덱스로 대상 섹션만 교체한다 (이름이 중복돼도 정확한 섹션)', () => {
    const dup = '## A:\n- 1\n\n## A:\n- 2\n'
    const next = replaceSection(dup, 1, '- 둘째만')
    expect(parseSections(next).sections.map((s) => s.body)).toEqual(['- 1', '- 둘째만'])
  })

  it('이름으로도 교체할 수 있다 (첫 일치)', () => {
    const next = replaceSection(doc, '세부사항:', '- 실제 값')
    expect(getSection(next, '세부사항:')?.body).toBe('- 실제 값')
    expect(getSection(next, '예외 조건:')?.body).toContain('(예:')
  })

  it('없는 섹션은 만들지 않고 throw 한다', () => {
    expect(() => replaceSection(doc, '완료 조건:', '- x')).toThrow('섹션을 찾을 수 없습니다')
    expect(() => replaceSection(doc, 9, '- x')).toThrow('섹션을 찾을 수 없습니다')
  })

  it('preamble 만 교체한다', () => {
    const next = replacePreamble(`(예: 배경)\n\n${doc}`, '실제 배경')
    expect(parseSections(next).preamble).toBe('실제 배경')
    expect(parseSections(next).sections).toHaveLength(3)
  })
})

describe('findForbiddenHeading', () => {
  it('편집 본문의 새 ## 헤딩을 잡는다', () => {
    expect(findForbiddenHeading('- a\n## 정책:\n- b')).toBe('## 정책:')
  })
  it('### 소제목과 펜스 안 ## 는 허용한다', () => {
    expect(findForbiddenHeading('### 알림톡 템플릿\n```\n## 안내\n```')).toBeNull()
  })
})

describe('markers', () => {
  it('개수와 하이라이트가 같은 규칙을 쓴다', () => {
    for (const text of [
      doc,
      '(예: 상품명 (예: 사료))',
      '- 금액: (예: 5,000원\n- 대상: 실제 값',
      '없음',
    ]) {
      expect(countMarkers(text)).toBe(splitMarkers(text).filter((r) => r.marker).length)
    }
  })

  it('중첩 마커는 각각 센다 — 문자열 검색과 같다', () => {
    const text = '(예: 상품명 (예: 사료))'
    expect(countMarkers(text)).toBe(2)
    expect(
      splitMarkers(text)
        .filter((r) => r.marker)
        .map((r) => r.text),
    ).toEqual(['(예: 상품명 ', '(예: 사료)'])
  })

  it('닫는 괄호가 없으면 줄 끝까지만 — 다음 줄 실제 값은 건드리지 않는다', () => {
    expect(splitMarkers('- 금액: (예: 5,000원\n- 대상: 실제 값')).toEqual([
      { text: '- 금액: ', marker: false },
      { text: '(예: 5,000원', marker: true },
      { text: '\n- 대상: 실제 값', marker: false },
    ])
  })

  it('collectMarkers 는 preamble 을 포함해 게이트와 같은 범위를 본다', () => {
    const text = `(예: 배경)\n\n${doc}`
    const locations = collectMarkers(text)
    expect(locations).toHaveLength(countMarkers(text))
    expect(locations[0]).toEqual({ section: '본문', text: '(예: 배경)' })
    expect(locations.map((l) => l.section)).toEqual(['본문', '세부사항', '세부사항', '예외 조건'])
  })
})

describe('sectionDisplayName', () => {
  it('끝 콜론을 제거한다', () => {
    expect(sectionDisplayName('정책:')).toBe('정책')
    expect(sectionDisplayName('예외 조건')).toBe('예외 조건')
  })
})
