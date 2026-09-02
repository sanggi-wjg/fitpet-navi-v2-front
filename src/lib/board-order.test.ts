import { describe, expect, it } from 'vitest'
import {
  columnOrders,
  findColumn,
  mergeVisibleOrder,
  moveActive,
  sameOrder,
  type ColumnOrders,
} from '@/lib/board-order'
import type { Task } from '@/types/task'

const orders: ColumnOrders = { backlog: [1, 2, 3], todo: [4, 5], in_progress: [], done: [6] }

describe('moveActive', () => {
  it('같은 컬럼에서는 대상 카드 자리로 옮긴다 (arrayMove 와 동일)', () => {
    expect(moveActive(orders, 1, { kind: 'task', id: 3, below: false }).backlog).toEqual([2, 3, 1])
    expect(moveActive(orders, 3, { kind: 'task', id: 1, below: true }).backlog).toEqual([3, 1, 2])
  })

  it('다른 컬럼의 카드 위에 놓으면 그 카드 앞, 아래쪽이면 뒤에 넣는다', () => {
    const above = moveActive(orders, 1, { kind: 'task', id: 5, below: false })
    expect(above.backlog).toEqual([2, 3])
    expect(above.todo).toEqual([4, 1, 5])
    const below = moveActive(orders, 1, { kind: 'task', id: 5, below: true })
    expect(below.todo).toEqual([4, 5, 1])
  })

  it('컬럼 빈 영역에 놓으면 끝에 붙인다', () => {
    const next = moveActive(orders, 1, { kind: 'column', status: 'in_progress' })
    expect(next.backlog).toEqual([2, 3])
    expect(next.in_progress).toEqual([1])
    expect(moveActive(orders, 1, { kind: 'column', status: 'backlog' }).backlog).toEqual([2, 3, 1])
  })

  it('바뀐 것이 없으면 같은 참조를 돌려준다', () => {
    expect(moveActive(orders, 1, { kind: 'task', id: 1, below: false })).toBe(orders)
    expect(moveActive(orders, 3, { kind: 'column', status: 'backlog' })).toBe(orders)
    expect(moveActive(orders, 99, { kind: 'column', status: 'todo' })).toBe(orders)
    expect(orders.backlog).toEqual([1, 2, 3])
  })
})

describe('mergeVisibleOrder', () => {
  it('숨은 카드가 없으면 보이는 순서 그대로', () => {
    expect(mergeVisibleOrder([1, 2, 3], [3, 1, 2])).toEqual([3, 1, 2])
  })

  it('숨은 카드는 원래 바로 앞에 있던 보이는 카드를 따라간다', () => {
    // 2, 4 가 숨음. 2 는 1 뒤, 4 는 3 뒤
    expect(mergeVisibleOrder([1, 2, 3, 4], [3, 1])).toEqual([3, 4, 1, 2])
  })

  it('앞에 보이는 카드가 없던 숨은 카드는 맨 앞에 둔다', () => {
    expect(mergeVisibleOrder([1, 2, 3], [3, 2])).toEqual([1, 3, 2])
  })

  it('같은 앵커 뒤의 숨은 카드들은 원래 순서를 지킨다', () => {
    expect(mergeVisibleOrder([1, 2, 3, 4], [4, 1])).toEqual([4, 1, 2, 3])
  })

  it('다른 컬럼에서 온 카드(전체 목록에 없음)는 보이는 위치 그대로 들어간다', () => {
    expect(mergeVisibleOrder([1, 2], [1, 9, 2])).toEqual([1, 9, 2])
    expect(mergeVisibleOrder([1, 5, 2], [2, 9, 1])).toEqual([2, 9, 1, 5])
  })
})

describe('columnOrders · findColumn · sameOrder', () => {
  const task = (id: number, status: Task['status']) => ({ id, status }) as Task
  it('정렬된 목록을 컬럼별 id 로 나눈다', () => {
    const result = columnOrders([task(1, 'todo'), task(2, 'backlog'), task(3, 'todo')])
    expect(result).toEqual({ backlog: [2], todo: [1, 3], in_progress: [], done: [] })
    expect(findColumn(result, 3)).toBe('todo')
    expect(findColumn(result, 9)).toBeNull()
  })
  it('sameOrder 는 길이와 순서를 모두 본다', () => {
    expect(sameOrder([1, 2], [1, 2])).toBe(true)
    expect(sameOrder([1, 2], [2, 1])).toBe(false)
    expect(sameOrder([1], [1, 2])).toBe(false)
  })
})
