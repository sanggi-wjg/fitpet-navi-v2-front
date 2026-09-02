import { BOARD_STATUSES } from '@/lib/task-config'
import type { BoardStatus, Task } from '@/types/task'

/** 컬럼별 카드 id 순서 — 드래그 중 로컬 상태로 들고 다니는 형태 */
export type ColumnOrders = Record<BoardStatus, number[]>

export function emptyOrders(): ColumnOrders {
  const orders = {} as ColumnOrders
  for (const status of BOARD_STATUSES) orders[status] = []
  return orders
}

/** 정렬된 태스크 목록 → 컬럼별 id 순서 */
export function columnOrders(tasks: Task[]): ColumnOrders {
  const orders = emptyOrders()
  for (const task of tasks) {
    if (task.status in orders) orders[task.status as BoardStatus].push(task.id)
  }
  return orders
}

export function findColumn(orders: ColumnOrders, id: number): BoardStatus | null {
  for (const status of BOARD_STATUSES) if (orders[status].includes(id)) return status
  return null
}

export type DropTarget =
  | { kind: 'task'; id: number; /** 포인터가 대상 카드 중앙 아래인지 */ below: boolean }
  | { kind: 'column'; status: BoardStatus }

/**
 * 드래그 중인 카드를 드롭 대상 위치로 옮긴 새 순서.
 * 같은 컬럼이면 대상 카드 자리로, 다른 컬럼이면 대상 카드 앞(아래쪽이면 뒤) 또는 컬럼 끝.
 * 바뀐 것이 없으면 같은 참조를 돌려준다.
 */
export function moveActive(
  orders: ColumnOrders,
  activeId: number,
  target: DropTarget,
): ColumnOrders {
  const from = findColumn(orders, activeId)
  if (!from) return orders

  if (target.kind === 'task') {
    if (target.id === activeId) return orders
    const to = findColumn(orders, target.id)
    if (!to) return orders
    const source = orders[from].filter((id) => id !== activeId)
    if (from === to) {
      const overIndex = orders[to].indexOf(target.id)
      const next = [...source]
      next.splice(overIndex, 0, activeId)
      return sameOrder(next, orders[to]) ? orders : { ...orders, [to]: next }
    }
    const overIndex = orders[to].indexOf(target.id) + (target.below ? 1 : 0)
    const dest = [...orders[to]]
    dest.splice(overIndex, 0, activeId)
    return { ...orders, [from]: source, [to]: dest }
  }

  if (target.status === from) {
    // 같은 컬럼의 빈 영역 → 끝으로
    const current = orders[from]
    if (current[current.length - 1] === activeId) return orders
    return { ...orders, [from]: [...current.filter((id) => id !== activeId), activeId] }
  }
  return {
    ...orders,
    [from]: orders[from].filter((id) => id !== activeId),
    [target.status]: [...orders[target.status], activeId],
  }
}

export function sameOrder(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}

/**
 * 검색·필터로 숨은 카드가 있을 때, 보이는 카드의 새 순서를 컬럼 전체 순서에 합친다.
 * 숨은 카드는 원래 바로 앞에 있던 보이는 카드 뒤(없으면 맨 앞)를 따라간다.
 * `visibleOrder` 에만 있는 id(다른 컬럼에서 온 카드)는 그 위치 그대로 들어간다.
 */
export function mergeVisibleOrder(
  fullIds: readonly number[],
  visibleOrder: readonly number[],
): number[] {
  const visible = new Set(visibleOrder)
  const merged = [...visibleOrder]
  /** 앵커(보이는 카드 id 또는 null=맨 앞)별로 이미 붙인 숨은 카드 수 */
  const attached = new Map<number | null, number>()

  fullIds.forEach((id, index) => {
    if (visible.has(id)) return
    let anchor: number | null = null
    for (let i = index - 1; i >= 0; i -= 1) {
      if (visible.has(fullIds[i])) {
        anchor = fullIds[i]
        break
      }
    }
    const count = attached.get(anchor) ?? 0
    const base = anchor === null ? 0 : merged.indexOf(anchor) + 1
    merged.splice(base + count, 0, id)
    attached.set(anchor, count + 1)
  })
  return merged
}
