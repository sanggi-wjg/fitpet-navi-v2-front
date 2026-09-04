import { describe, expect, it } from 'vitest'
import { collectMarkers, countMarkers, findForbiddenHeading, splitMarkers } from '@/lib/markdown'

const detailBody = [
  '- (예: 발송 채널 — 알림톡)',
  '',
  '### 알림톡 템플릿',
  '```',
  '## 안내',
  '(예: [핏펫] 생일 축하드려요',
  '30일 안에 사용해 주세요.)',
  '```',
].join('\n')

describe('findForbiddenHeading', () => {
  it('편집 본문의 새 ## 헤딩을 잡는다', () => {
    expect(findForbiddenHeading('- a\n## 정책\n- b')).toBe('## 정책')
  })
  it('### 소제목과 펜스 안 ## 는 허용한다', () => {
    expect(findForbiddenHeading(detailBody)).toBeNull()
  })
})

describe('markers', () => {
  it('개수와 하이라이트가 같은 규칙을 쓴다', () => {
    for (const text of [
      detailBody,
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

  it('collectMarkers 는 섹션 순서대로 훑고 게이트(countMarkers 합)와 같은 범위를 본다', () => {
    const sections = [
      { name: '정책', body: '- 생일인 유저에게 적립금 5,000원 발급' },
      { name: '세부사항', body: detailBody },
      { name: '예외 조건', body: '- (예: 이미 발급받은 유저 제외)' },
    ]
    const locations = collectMarkers(sections)
    expect(locations).toHaveLength(sections.reduce((sum, s) => sum + countMarkers(s.body), 0))
    expect(locations[0]).toEqual({ section: '세부사항', text: '(예: 발송 채널 — 알림톡)' })
    expect(locations.map((l) => l.section)).toEqual(['세부사항', '세부사항', '예외 조건'])
  })
})
