# Quick Task 2: 补齐 Haaabit MCP 的 AI 引导层：增强 tool descriptions、添加 haaabit-mcp Skill、补充 README AI 使用指引

**Date:** 2026-03-10
**Status:** Complete

## Goal

让通用 AI host 和支持 Skill 的 agent 都更容易正确使用 `@haaabit/mcp`：既能从 MCP 自描述中学会何时读写、按什么顺序调用，也能通过项目内置 Skill 获得更稳定的习惯助手工作流。

## Tasks

### Task 1
- files: [packages/mcp/src/tools/habits.ts](/Users/finn/code/haaabit/packages/mcp/src/tools/habits.ts), [packages/mcp/src/tools/today.ts](/Users/finn/code/haaabit/packages/mcp/src/tools/today.ts), [packages/mcp/src/tools/stats.ts](/Users/finn/code/haaabit/packages/mcp/src/tools/stats.ts), [packages/mcp/src/server/create-server.ts](/Users/finn/code/haaabit/packages/mcp/src/server/create-server.ts)
- action: 强化所有 MCP tools 的描述，明确触发语义、何时读/写、歧义处理与典型工作流；同时在 server 中注册一个 AI workflow prompt 和一个只读 workflow resource，让支持 prompts/resources 的 host 也能直接消费这层引导。
- verify: `pnpm --filter @haaabit/mcp test` 通过，且代码中能看到 prompt/resource 注册与更具操作性的 tool descriptions。
- done: MCP 服务器本身带有可发现的 AI 使用指引，不再只暴露薄工具表。

### Task 2
- files: [packages/mcp/src/server/guidance.ts](/Users/finn/code/haaabit/packages/mcp/src/server/guidance.ts), [packages/mcp/test/tools/discovery.test.ts](/Users/finn/code/haaabit/packages/mcp/test/tools/discovery.test.ts), [packages/mcp/test/docs/readme-smoke.test.ts](/Users/finn/code/haaabit/packages/mcp/test/docs/readme-smoke.test.ts)
- action: 把 AI workflow guidance 提炼成可复用模块，并用测试覆盖 discovery/readme 中的关键承诺，避免后续回退成只有工具注册、没有引导层的状态。
- verify: 新增/更新的测试能断言 guidance 文本与 README 文档中的 AI 指引段落存在。
- done: guidance 有单独模块和测试保护。

### Task 3
- files: [.agents/skills/haaabit-mcp/SKILL.md](/Users/finn/code/haaabit/.agents/skills/haaabit-mcp/SKILL.md), [.agents/skills/haaabit-mcp/agents/openai.yaml](/Users/finn/code/haaabit/.agents/skills/haaabit-mcp/agents/openai.yaml), [README.md](/Users/finn/code/haaabit/README.md), [packages/mcp/README.md](/Users/finn/code/haaabit/packages/mcp/README.md)
- action: 新增项目内置 `haaabit-mcp` Skill，写清 today-first、先读后写、歧义先澄清等规则；同时在根 README 和 MCP README 增加 AI host/agent 的推荐接入方式与 Skill 使用说明。
- verify: skill 通过 quick validate，README 出现 AI guidance/Skill 文档，且文案与工具/资源命名一致。
- done: 支持 Skill 的 agent 能直接加载项目级工作流，不支持 Skill 的 host 也能通过 README 和 MCP guidance 正确上手。
