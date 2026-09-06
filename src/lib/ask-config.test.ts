import { describe, expect, it } from 'vitest'
import { ASK_SUGGESTION_GROUPS } from '@/lib/ask-config'

/** DESIGN.md D.4 `ask-suggestions` 계약 — 카테고리 6개 · 문항 2~3개 · 중복 없음 */
describe('ASK_SUGGESTION_GROUPS', () => {
  it('카테고리 6개, 각 2~3문항이다', () => {
    expect(ASK_SUGGESTION_GROUPS).toHaveLength(6)
    for (const group of ASK_SUGGESTION_GROUPS) {
      expect(group.category).not.toBe('')
      expect(group.questions.length).toBeGreaterThanOrEqual(2)
      expect(group.questions.length).toBeLessThanOrEqual(3)
    }
  })

  it('카테고리명과 문항은 비어 있지 않고 겹치지 않는다', () => {
    const categories = ASK_SUGGESTION_GROUPS.map((group) => group.category)
    expect(new Set(categories).size).toBe(categories.length)

    const questions = ASK_SUGGESTION_GROUPS.flatMap((group) => group.questions)
    expect(questions.every((question) => question.trim() !== '')).toBe(true)
    expect(new Set(questions).size).toBe(questions.length)
  })
})
