# Quick Task 3: 把 haaabit-mcp 的中英双触发词与示例落实到项目文档，并提交本次 Skill/文档更新

**Date:** 2026-03-10
**Status:** Complete

## Goal

把 `haaabit-mcp` 最近补上的中英双触发词能力从 Skill 本体同步到项目文档，让读 README 的人也知道这个 Skill 对中文请求可触发、适合哪些说法，并完成一次可追踪提交。

## Tasks

### Task 1
- files: [.agents/skills/haaabit-mcp/SKILL.md](/Users/finn/code/haaabit/.agents/skills/haaabit-mcp/SKILL.md), [.agents/skills/haaabit-mcp/agents/openai.yaml](/Users/finn/code/haaabit/.agents/skills/haaabit-mcp/agents/openai.yaml)
- action: 固化 `haaabit-mcp` 的中英双触发词、中文示例和默认 prompt，让 Skill 自身对中文提问具备更强命中信号，并保持 metadata 与正文一致。
- verify: `quick_validate.py` 通过，Skill 中能看到中英双语触发词与示例。
- done: Skill 本体成为双语触发入口，而不只是英文 workflow 说明。

### Task 2
- files: [README.md](/Users/finn/code/haaabit/README.md), [packages/mcp/README.md](/Users/finn/code/haaabit/packages/mcp/README.md)
- action: 在根 README 与 MCP README 中补充 `haaabit-mcp` 的双语触发说明和示例，明确 agent 可通过中文问法触发 today-first workflow。
- verify: 文档中出现 `$haaabit-mcp` 与中文请求示例，且表述与 Skill 当前触发词一致。
- done: 项目文档完整反映 Skill 的双语触发能力。
