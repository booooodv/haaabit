# Quick Task 4: 更新整体文档，说明机器人如何连接 MCP 与 Skill，并推送 GitHub

**Date:** 2026-03-10
**Status:** Complete

## Goal

把“机器人如何连接 Haaabit 的 MCP 与 Skill”整理成完整文档，而不只散落在 README 段落里；同时同步根 README / MCP README 的入口链接，并把本次文档更新推送到 GitHub。

## Tasks

### Task 1
- files: [docs/ai-agent-integration.md](/Users/finn/code/haaabit/docs/ai-agent-integration.md), [README.md](/Users/finn/code/haaabit/README.md)
- action: 新增一份统一的 AI agent 集成文档，解释 MCP 与 Skill 的区别、机器人类型的接法、推荐接入顺序、典型中英触发示例，再从根 README 加入口。
- verify: 文档能独立回答“机器人怎么连接 skills”，且根 README 能引导到这份文档。
- done: 项目根文档具备完整的 AI 接入说明，不再只靠零散段落。

### Task 2
- files: [packages/mcp/README.md](/Users/finn/code/haaabit/packages/mcp/README.md), [.agents/skills/haaabit-mcp/SKILL.md](/Users/finn/code/haaabit/.agents/skills/haaabit-mcp/SKILL.md)
- action: 在 MCP README 中补一个更明确的“Skill-aware agent”接法入口，并确保 Skill 文案与统一文档中的术语保持一致。
- verify: `packages/mcp/README.md` 中出现到统一文档的引用，Skill/MCP/README 对“先连 MCP，再加载 guidance，再启用 Skill”的描述一致。
- done: 包级文档和 Skill 文案与总文档完全对齐。

### Task 3
- files: [.planning/quick/4-ai-agent-docs-github/4-SUMMARY.md](/Users/finn/code/haaabit/.planning/quick/4-ai-agent-docs-github/4-SUMMARY.md), [.planning/STATE.md](/Users/finn/code/haaabit/.planning/STATE.md)
- action: 跑现有 README 相关验证，写入 quick artifacts 与 STATE.md，然后提交并 push 到 `origin/main`。
- verify: `pnpm --filter @haaabit/mcp test` 通过；Git 提交存在且 `git push origin main` 成功。
- done: 这次文档更新已被记录并推送到 GitHub。
