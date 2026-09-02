// PreToolUse(Edit|Write|NotebookEdit): src/api(orval 생성물) 직접 수정 차단 — CLAUDE.md 절대 규칙 1
import { readFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0) // 입력을 못 읽으면 차단하지 않는다
}

const target = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path ?? ''
if (!target) process.exit(0)

// 이 프로젝트 안의 src/api 만 차단한다 (다른 리포의 src/api 는 이 규칙의 대상이 아님)
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input?.cwd ?? process.cwd()
const rel = relative(projectDir, resolve(String(target))).replaceAll('\\', '/')

if (/^src\/api(\/|$)/.test(rel)) {
  console.error(
    [
      `차단: ${rel}`,
      'src/api 는 orval 생성물이라 직접 수정할 수 없습니다 (CLAUDE.md 절대 규칙 1).',
      'API 를 바꾸려면: 백엔드 스펙 수정 → npm run generate:api (백엔드 localhost:9000 실행 필요).',
      'DTO 는 src/lib/api-mapping.ts 에서 뷰 모델(src/types/task.ts)로 변환해서 사용합니다.',
    ].join('\n'),
  )
  process.exit(2)
}

process.exit(0)
