import { describe, expect, it, vi } from "vitest";

import { createServer } from "../../src/server/create-server";

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function getRegisteredTool(name: string, fetchImpl: typeof fetch) {
  const server = createServer({
    apiUrl: "https://habit.example.com/api",
    apiToken: "secret-token",
    timeoutMs: 2500,
    fetch: fetchImpl,
  });
  const tool = server.listRegisteredTools().find((entry) => entry.name === name);

  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  return tool;
}

describe("habits write tools", () => {
  it("calls POST /habits and returns the saved habit with concise created-shape text", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          item: {
            id: "habit_1",
            userId: "user_1",
            name: "Read",
            kind: "quantity",
            description: null,
            category: "learning",
            targetValue: 30,
            unit: "pages",
            startDate: "2026-03-01",
            isActive: true,
            frequencyType: "daily",
            frequencyCount: null,
            weekdays: [],
            createdAt: "2026-03-01T08:00:00.000Z",
            updatedAt: "2026-03-01T08:00:00.000Z",
          },
        },
        201,
      ),
    );
    const tool = getRegisteredTool("habits_add", fetchImpl);

    const result = await tool.handler({
      name: "Read",
      kind: "quantity",
      targetValue: 30,
      unit: "pages",
      category: "learning",
      frequency: {
        type: "daily",
      },
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        authorization: "Bearer secret-token",
        "content-type": "application/json",
      },
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toEqual({
      name: "Read",
      kind: "quantity",
      targetValue: 30,
      unit: "pages",
      category: "learning",
      frequency: {
        type: "daily",
      },
    });
    expect(result).toMatchObject({
      structuredContent: {
        item: {
          id: "habit_1",
          name: "Read",
          targetValue: 30,
        },
      },
      content: [
        {
          type: "text",
          text: expect.stringContaining("Created Read"),
        },
      ],
    });
    expect(JSON.stringify(result)).toContain("30");
    expect(JSON.stringify(result)).toContain("pages");
  });

  it("exposes habitId in habits_edit input and calls PATCH /habits/:habitId with change-focused text", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        item: {
          id: "habit_1",
          userId: "user_1",
          name: "Deep Work PM",
          kind: "quantity",
          description: "Evening focus block",
          category: "focus",
          targetValue: 5,
          unit: "blocks",
          startDate: "2026-03-01",
          isActive: true,
          frequencyType: "daily",
          frequencyCount: null,
          weekdays: [],
          createdAt: "2026-03-01T08:00:00.000Z",
          updatedAt: "2026-03-05T08:00:00.000Z",
        },
      }),
    );
    const tool = getRegisteredTool("habits_edit", fetchImpl);
    const editInputSchema = tool.inputSchema as {
      safeParse: (value: unknown) => {
        success: boolean;
      };
    };

    expect(editInputSchema.safeParse({ name: "No id" }).success).toBe(false);
    expect(
      editInputSchema.safeParse({
        habitId: "habit_1",
        name: "Deep Work PM",
      }).success,
    ).toBe(true);

    const result = await tool.handler({
      habitId: "habit_1",
      name: "Deep Work PM",
      targetValue: 5,
      category: "focus",
      description: "Evening focus block",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits/habit_1");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "PATCH",
      headers: {
        authorization: "Bearer secret-token",
        "content-type": "application/json",
      },
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toEqual({
      name: "Deep Work PM",
      targetValue: 5,
      category: "focus",
      description: "Evening focus block",
    });
    expect(result).toMatchObject({
      structuredContent: {
        item: {
          id: "habit_1",
          name: "Deep Work PM",
          targetValue: 5,
          category: "focus",
        },
      },
      content: [
        {
          type: "text",
          text: expect.stringContaining("Updated Deep Work PM"),
        },
      ],
    });
    expect(JSON.stringify(result)).toContain("target");
    expect(JSON.stringify(result)).toContain("category");
    expect(JSON.stringify(result)).toContain("description");
  });

  it("archives a habit and explains that archived habits are read-only", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        item: {
          id: "habit_1",
          userId: "user_1",
          name: "Read",
          kind: "quantity",
          description: null,
          category: "learning",
          targetValue: 30,
          unit: "pages",
          startDate: "2026-03-01",
          isActive: false,
          frequencyType: "daily",
          frequencyCount: null,
          weekdays: [],
          createdAt: "2026-03-01T08:00:00.000Z",
          updatedAt: "2026-03-05T08:00:00.000Z",
        },
      }),
    );
    const tool = getRegisteredTool("habits_archive", fetchImpl);

    const result = await tool.handler({
      habitId: "habit_1",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits/habit_1/archive");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        authorization: "Bearer secret-token",
      },
    });
    expect(result).toMatchObject({
      structuredContent: {
        item: {
          id: "habit_1",
          isActive: false,
        },
      },
      content: [
        {
          type: "text",
          text: expect.stringContaining("read-only"),
        },
      ],
    });
  });

  it("restores a habit and explains that it can be used again", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        item: {
          id: "habit_1",
          userId: "user_1",
          name: "Read",
          kind: "quantity",
          description: null,
          category: "learning",
          targetValue: 30,
          unit: "pages",
          startDate: "2026-03-01",
          isActive: true,
          frequencyType: "daily",
          frequencyCount: null,
          weekdays: [],
          createdAt: "2026-03-01T08:00:00.000Z",
          updatedAt: "2026-03-05T08:00:00.000Z",
        },
      }),
    );
    const tool = getRegisteredTool("habits_restore", fetchImpl);

    const result = await tool.handler({
      habitId: "habit_1",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits/habit_1/restore");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        authorization: "Bearer secret-token",
      },
    });
    expect(result).toMatchObject({
      structuredContent: {
        item: {
          id: "habit_1",
          isActive: true,
        },
      },
      content: [
        {
          type: "text",
          text: expect.stringContaining("usable again"),
        },
      ],
    });
  });
});
