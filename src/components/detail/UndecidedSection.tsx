/**
 * 미결정 사항 (spec 범위 3). 분석 API 가 아직 없어 빈 상태만 렌더한다.
 * 백엔드에 분석·미결정 필드가 생기면 답변 입력 행(DESIGN.md D.2 `undecided-item-answering`)을 붙인다.
 */
export function UndecidedSection() {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-ink text-[16px] leading-[1.4] font-medium">미결정 사항</h2>
      <div className="bg-surface-soft flex flex-col gap-1 rounded-lg p-5">
        <div className="text-ink text-[14px] font-medium">아직 분석을 실행하지 않았습니다</div>
        <div className="text-muted text-[13px]">
          분석을 실행하면 개발 전에 결정해야 할 항목이 여기에 추출됩니다. 예제 텍스트를 실제 값으로
          바꾼 뒤 실행하는 편이 정확합니다.
        </div>
      </div>
    </section>
  )
}
