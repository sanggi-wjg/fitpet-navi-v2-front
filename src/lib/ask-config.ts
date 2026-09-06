/**
 * 빈 상태의 예시 질문 — 카테고리 탭 하나에 문항 2~3개 (DESIGN.md D.4 `ask-suggestions`).
 * pill 클릭은 문장을 그대로 전송하고 카테고리명은 보내지 않으므로, 문장 혼자서 대상 레포를 고를 수 있게 쓴다.
 */
export interface AskSuggestionGroup {
  readonly category: string
  readonly questions: readonly string[]
}

export const ASK_SUGGESTION_GROUPS: readonly AskSuggestionGroup[] = [
  {
    category: '주문·결제',
    questions: [
      '주문 취소는 어떤 상태까지 가능한가요',
      '가상계좌 입금 기한이 지나면 주문은 어떻게 되나요',
      '구매 확정은 언제 자동으로 되나요',
    ],
  },
  {
    category: '적립금·쿠폰',
    questions: [
      '주문 시 사용할 수 있는 적립금 한도는 어떻게 정해지나요',
      '쿠폰과 적립금을 함께 쓰면 어떤 순서로 차감하나요',
      '적립금은 언제 소멸되나요',
    ],
  },
  {
    category: '배송·반품',
    questions: [
      '배송 완료 처리는 언제 자동으로 되나요',
      '반품 신청은 언제까지 가능한가요',
      '도서산간 추가 배송비는 어떤 기준으로 붙나요',
    ],
  },
  {
    category: '회원·등급',
    questions: ['회원 등급은 어떤 기준으로 언제 산정되나요', '탈퇴한 회원 정보는 언제 삭제되나요'],
  },
  {
    category: '알림·자동 작업',
    questions: [
      '리뷰 작성 알림톡은 누구에게 언제 가나요',
      '재입고 알림은 어떤 조건으로 발송되나요',
    ],
  },
  {
    category: '화면·노출',
    questions: [
      '주문 화면에서 적립금 입력란이 안 보이는 조건은 무엇인가요',
      '상품 리뷰는 어떤 순서로 노출되나요',
      '품절 상품은 상품 목록에서 빠지나요, 맨 뒤로 가나요',
    ],
  },
]
