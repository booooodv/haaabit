import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import { createNativeHandlers } from "../src/native-handlers";
import { EXPECTED_TOOL_NAMES } from "../src/tool-catalog";

const packageRoot = new URL("../", import.meta.url);

describe("shared native runtime", () => {
  it("creates native handlers for the full shipped Haaabit tool vocabulary", () => {
    const handlers = createNativeHandlers({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 2500,
    });

    expect(Object.keys(handlers).sort()).toEqual([...EXPECTED_TOOL_NAMES].sort());
  });

  it("keeps the shared runtime seam free of MCP result wrappers", async () => {
    const runtimeSource = await readFile(new URL("../mcp/src/tools/runtime.ts", packageRoot), "utf8");
    const errorPayloadSource = await readFile(new URL("../mcp/src/client/error-payload.ts", packageRoot), "utf8");

    expect(runtimeSource).not.toContain("@modelcontextprotocol/sdk");
    expect(runtimeSource).not.toContain("CallToolResult");
    expect(errorPayloadSource).not.toContain("@modelcontextprotocol/sdk");
    expect(errorPayloadSource).not.toContain("CallToolResult");
  });

  it("maps shared API errors into structured native error payloads", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "BAD_REQUEST",
          message: "Only quantified habits can use set-total",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );
    const handlers = createNativeHandlers(
      {
        apiUrl: "https://habit.example.com/api",
        apiToken: "secret-token",
        timeoutMs: 2500,
      },
      {
        fetch: fetchImpl,
      },
    );

    await expect(
      handlers.today_set_total?.({
        habitId: "habit_walk",
        total: 1,
        source: "ai",
      }),
    ).resolves.toMatchObject({
      ok: false,
      toolName: "today_set_total",
      error: {
        category: "wrong_kind",
        code: "BAD_REQUEST",
        hint: "Use today_complete for boolean habits.",
        resolution: "switch_tool",
        suggestedTool: "today_complete",
      },
    });
  });
});
