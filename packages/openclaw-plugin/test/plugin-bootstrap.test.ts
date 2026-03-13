import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import defaultRegister, { activate, activateHaaabitOpenClawPlugin, EXPECTED_TOOL_NAMES, register } from "../src/index";

const packageRoot = new URL("../", import.meta.url);

describe("activateHaaabitOpenClawPlugin", () => {
  it("registers the planned Haaabit tool catalog through the native plugin API", () => {
    const registerTool = vi.fn();
    const result = activateHaaabitOpenClawPlugin(
      {
        registerTool,
      },
      {
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api",
          HAAABIT_API_TOKEN: "secret-token",
        },
      },
    );

    expect(result.registeredTools).toEqual(EXPECTED_TOOL_NAMES);
    expect(registerTool.mock.calls.map(([name]) => name)).toEqual(EXPECTED_TOOL_NAMES);
  });

  it("exports OpenClaw-compatible register and activate entrypoints", () => {
    const registerTool = vi.fn();

    const registration = register(
      {
        registerTool,
      },
      {
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api",
          HAAABIT_API_TOKEN: "secret-token",
        },
      },
    );

    expect(defaultRegister).toBe(register);
    expect(activate).not.toBe(register);
    expect(registration.registeredTools).toEqual(EXPECTED_TOOL_NAMES);
    expect(registerTool.mock.calls.map(([name]) => name)).toEqual(EXPECTED_TOOL_NAMES);
  });

  it("fails before registration when required env vars are missing", () => {
    const registerTool = vi.fn();

    expect(() =>
      activateHaaabitOpenClawPlugin(
        {
          registerTool,
        },
        {
          env: {
            HAAABIT_API_URL: "https://habit.example.com/api",
          },
        },
      ),
    ).toThrowError(/HAAABIT_API_TOKEN/);
    expect(registerTool).not.toHaveBeenCalled();
  });

  it("keeps the bootstrap native instead of booting MCP under the hood", async () => {
    const source = await readFile(new URL("src/index.ts", packageRoot), "utf8");

    expect(source).not.toContain("@modelcontextprotocol/sdk");
    expect(source).not.toContain("@haaabit/mcp");
    expect(source).not.toContain("mcporter");
    expect(source).not.toContain("child_process");
  });
});
