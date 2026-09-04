import { describe, expect, it } from 'vitest'
import { editScript, lineDiff, wordDiff } from '@/lib/diff'

describe('editScript', () => {
  it('LCS 를 지키고 hunk 안에서는 삭제가 먼저다', () => {
    expect(editScript(['a', 'b', 'c'], ['a', 'x', 'c'])).toEqual([
      { op: 'equal', item: 'a' },
      { op: 'delete', item: 'b' },
      { op: 'insert', item: 'x' },
      { op: 'equal', item: 'c' },
    ])
  })
  it('한쪽이 비면 통째로 삭제·추가', () => {
    expect(editScript([], ['a'])).toEqual([{ op: 'insert', item: 'a' }])
    expect(editScript(['a'], [])).toEqual([{ op: 'delete', item: 'a' }])
  })
})

describe('wordDiff', () => {
  it('어절 단위로 나누고 공백은 보존한다', () => {
    expect(wordDiff('- 마케팅 동의 유저', '- 마케팅 미동의 유저')).toEqual([
      { op: 'equal', text: '- 마케팅 ' },
      { op: 'delete', text: '동의' },
      { op: 'insert', text: '미동의' },
      { op: 'equal', text: ' 유저' },
    ])
  })
})

describe('lineDiff', () => {
  it('같은 본문은 equal 줄만 (후행 개행 차이 무시)', () => {
    const diff = lineDiff('- a\n- b\n', '- a\n- b')
    expect(diff.map((line) => line.type)).toEqual(['equal', 'equal'])
  })

  it('바뀐 줄은 짝지어 changed 로, 새 줄은 insert 로', () => {
    const diff = lineDiff(
      '- 휴면 계정 제외\n- 마케팅 동의 유저\n',
      '- 휴면 계정 제외\n- 마케팅 미동의 유저\n- 탈퇴 계정 제외\n',
    )
    expect(diff).toEqual([
      { type: 'equal', text: '- 휴면 계정 제외', parts: [] },
      {
        type: 'changed',
        text: '',
        parts: [
          { op: 'equal', text: '- 마케팅 ' },
          { op: 'delete', text: '동의' },
          { op: 'insert', text: '미동의' },
          { op: 'equal', text: ' 유저' },
        ],
      },
      { type: 'insert', text: '- 탈퇴 계정 제외', parts: [] },
    ])
  })

  it('전혀 다른 줄끼리는 짝짓지 않고 삭제·추가 줄로 보인다', () => {
    const diff = lineDiff('가나다라마바사\n', '1234567890\n')
    expect(diff.map((line) => line.type)).toEqual(['delete', 'insert'])
  })

  it('CRLF 도 줄로 나눈다', () => {
    expect(lineDiff('a\r\nb\r\n', 'a\nb\n').every((line) => line.type === 'equal')).toBe(true)
  })
})

describe('lineDiff — 빈 본문', () => {
  it('빈 본문 → 내용은 추가 줄만, 내용 → 빈 본문은 삭제 줄만', () => {
    expect(lineDiff('', '- abc\n')).toEqual([{ type: 'insert', text: '- abc', parts: [] }])
    expect(lineDiff('- abc\n', '')).toEqual([{ type: 'delete', text: '- abc', parts: [] }])
    expect(lineDiff('', '')).toEqual([])
  })
})
