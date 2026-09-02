// PostToolUse(Edit|Write): 편집된 파일에 prettier --write 적용 후 eslint 검사.
// eslint 오류가 있으면 exit 2 로 Claude 에게 즉시 피드백한다 (커밋 시점이 아니라 편집 시점에 잡기).
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, relative } from 'node:path'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input?.cwd ?? process.cwd()
const filePath = input?.tool_input?.file_path
if (!filePath || !existsSync(filePath)) process.exit(0)

const rel = relative(projectDir, resolve(filePath)).replaceAll('\\', '/')
// 프로젝트 밖·생성물·도구 디렉터리는 건드리지 않는다
if (rel.startsWith('..') || /^(src\/api|node_modules|dist|coverage|\.claude|\.git)(\/|$)/.test(rel))
  process.exit(0)

const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd: projectDir, encoding: 'utf8', timeout: 45_000 })

// 1) prettier — .prettierignore 를 존중하며 자동 포맷 (pre-commit 의 lint-staged 와 동일 규칙)
if (/\.(ts|tsx|js|mjs|cjs|json|css|md|html)$/.test(rel)) {
  run('npx', ['prettier', '--write', '--ignore-unknown', '--log-level', 'warn', rel])
}

// 2) eslint — ts/tsx 만, 리포트 전용 (자동 수정은 prettier 까지만)
if (/\.(ts|tsx)$/.test(rel)) {
  const eslint = run('npx', ['eslint', '--max-warnings', '0', rel])
  // 실행 환경 문제(ENOENT·타임아웃 등)는 lint 오류가 아니므로 차단하지 않는다
  if (eslint.error || eslint.status === null) process.exit(0)
  if (eslint.status !== 0) {
    console.error(`eslint 실패: ${rel}\n${eslint.stdout || eslint.stderr || ''}`.trim())
    process.exit(2)
  }
}

process.exit(0)
