import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import defaultRegister, { activate, activateHaaabitOpenClawPlugin, EXPECTED_TOOL_NAMES, register } from "../src/index";
import openClawDefaultRegister, {
  activate as activateOpenClawEntry,
  register as registerOpenClawEntry,
} from "../src/openclaw";

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

  it("loads through the OpenClaw wrapper entry and flattens nested env sources", () => {
    const registerTool = vi.fn();

    const registration = registerOpenClawEntry(
      {
        registerTool,
        config: {
          env: {
            HAAABIT_API_URL: "https://api-config.example.com/api",
            HAAABIT_API_TOKEN: "api-config-token",
          },
        },
      },
      {
        config: {
          env: {
            HAAABIT_API_TOKEN: "options-config-token",
          },
        },
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api/",
          HAAABIT_API_TOKEN: {
            value: "secret-token",
          },
        },
      },
    );

    expect(openClawDefaultRegister).toBe(registerOpenClawEntry);
    expect(activateOpenClawEntry).not.toBe(registerOpenClawEntry);
    expect(registration.config).toEqual({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 10_000,
    });
    expect(registration.registeredTools).toEqual(EXPECTED_TOOL_NAMES);
    expect(registerTool.mock.calls.map(([name]) => name)).toEqual(EXPECTED_TOOL_NAMES);
  });

  it("starts successfully when options.env is a plain string map", () => {
    const registerTool = vi.fn();

    const result = registerOpenClawEntry(
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

    expect(result.config).toEqual({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 10_000,
    });
    expect(result.registeredTools).toEqual(EXPECTED_TOOL_NAMES);
  });

  it("starts successfully when api.config.env uses { value } wrappers", () => {
    const registerTool = vi.fn();

    const result = registerOpenClawEntry(
      {
        registerTool,
        config: {
          env: {
            HAAABIT_API_URL: {
              value: "https://habit.example.com/api/",
            },
            HAAABIT_API_TOKEN: {
              value: "secret-token",
            },
          },
        },
      },
      {},
    );

    expect(result.config).toEqual({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 10_000,
    });
    expect(registerTool.mock.calls.find(([name]) => name === "habits_edit")?.[1]).toMatchObject({
      inputSchema: expect.objectContaining({
        type: "object",
      }),
    });
  });

  it("starts successfully when api.config.env uses env reference objects resolved from process.env", () => {
    const registerTool = vi.fn();
    const previousApiUrl = process.env.HAAABIT_API_URL;
    const previousApiToken = process.env.HAAABIT_API_TOKEN;

    process.env.HAAABIT_API_URL = "https://habit.example.com/api/";
    process.env.HAAABIT_API_TOKEN = "secret-token";

    try {
      const result = registerOpenClawEntry(
        {
          registerTool,
          config: {
            env: {
              HAAABIT_API_URL: {
                source: "env",
                id: "HAAABIT_API_URL",
                provider: "default",
              },
              HAAABIT_API_TOKEN: {
                source: "env",
                key: "HAAABIT_API_TOKEN",
                provider: "default",
              },
            },
          },
        },
        {},
      );

      expect(result.config).toEqual({
        apiUrl: "https://habit.example.com/api",
        apiToken: "secret-token",
        timeoutMs: 10_000,
      });
      expect(registerTool.mock.calls.map(([name]) => name)).toEqual(EXPECTED_TOOL_NAMES);
    } finally {
      resetProcessEnv("HAAABIT_API_URL", previousApiUrl);
      resetProcessEnv("HAAABIT_API_TOKEN", previousApiToken);
    }
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
    const openClawSource = await readFile(new URL("src/openclaw.ts", packageRoot), "utf8");

    expect(source).not.toContain("@modelcontextprotocol/sdk");
    expect(source).not.toContain("@haaabit/mcp");
    expect(source).not.toContain("mcporter");
    expect(source).not.toContain("child_process");
    expect(openClawSource).not.toContain("@modelcontextprotocol/sdk");
    expect(openClawSource).not.toContain("@haaabit/mcp");
    expect(openClawSource).not.toContain("mcporter");
    expect(openClawSource).not.toContain("child_process");
  });
});

function resetProcessEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
