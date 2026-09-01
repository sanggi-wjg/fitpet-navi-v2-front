import { ArrowUp } from 'lucide-react'

const SUGGESTIONS = [
  '예외 조건에 빠진 엣지케이스를 추가해줘',
  '세부사항의 값을 항목 — 값 형태로 정리해줘',
  '알림톡 문구를 실제 정책에 맞게 다듬어줘',
]

/**
 * Navi 패널 — 범위 2(제안 파이프라인) 연결 전.
 * 흐름: Navi 첫 인사 → 추천 프롬프트 칩 → 입력. 제안은 문서의 해당 섹션 위에 단어 diff 로 나타난다.
 */
export function NaviPanel() {
  return (
    <aside className="border-hairline bg-surface-soft sticky top-14 flex h-[calc(100vh-56px)] w-[400px] shrink-0 flex-col border-l">
      <div className="border-hairline flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <span className="bg-primary size-2 rounded-full" aria-hidden />
        <span className="text-ink text-[14px] font-medium">Navi</span>
        <span className="text-muted text-[12px]">요구사항 코칭</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="bg-canvas text-body max-w-[320px] rounded-lg px-3.5 py-2.5 text-[14px] leading-[1.6]">
          문서를 고치고 싶은 내용을 말해주세요. 저는 직접 수정하지 않고 변경안을 만들어 보여드려요.
          수락하면 그때 문서에 반영돼요.
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-4 pt-2 pb-4">
        <div className="flex flex-wrap gap-1.5" aria-label="추천 요청">
          {SUGGESTIONS.map((text) => (
            <span
              key={text}
              className="border-hairline bg-canvas text-muted-soft inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-medium"
            >
              {text}
            </span>
          ))}
        </div>
        <div className="border-hairline bg-canvas flex items-end gap-2 rounded-lg border py-2.5 pr-2.5 pl-3.5">
          <span className="text-muted-soft flex-1 py-1 text-[14px] leading-[1.45]">
            Navi 연결 준비 중 — 제안 API(범위 2)와 함께 열립니다
          </span>
          <span className="bg-surface-card text-muted-soft inline-flex size-7 shrink-0 items-center justify-center rounded-full">
            <ArrowUp className="size-3.5" strokeWidth={2} />
          </span>
        </div>
      </div>
    </aside>
  )
}
