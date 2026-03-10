import { describe, expect, it, vi } from "vitest";

import { createServer } from "../../src/server/create-server";
import { HAAABIT_WORKFLOW_PROMPT, HAAABIT_WORKFLOW_RESOURCE, WORKFLOW_GUIDE_TEXT } from "../../src/server/guidance";
import { toolInventory } from "../../src/tools/inventory";

describe("server discovery wiring", () => {
  it("registers the planned catalog and exposes real handlers for both read and write tools", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
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
        }),
        {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );
    const { listRegisteredTools } = createServer({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 2500,
      fetch: fetchImpl,
    });

    const registeredTools = listRegisteredTools();
    const habitsAdd = registeredTools.find((tool) => tool.name === "habits_add");

    expect(registeredTools.map((tool) => tool.name)).toEqual(toolInventory.map((tool) => tool.name));
    expect(habitsAdd?.outputSchema).toBeDefined();
    await expect(
      habitsAdd?.handler({
        name: "Read",
        kind: "quantity",
        targetValue: 30,
        unit: "pages",
        category: "learning",
        frequency: {
          type: "daily",
        },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        item: {
          id: "habit_1",
          name: "Read",
        },
      },
    });
  });

  it("registers prompt and resource guidance alongside the tool catalog", () => {
    const { listRegisteredPrompts, listRegisteredResources } = createServer({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 2500,
      fetch: vi.fn<typeof fetch>(),
    });

    expect(listRegisteredPrompts()).toEqual([HAAABIT_WORKFLOW_PROMPT]);
    expect(listRegisteredResources()).toEqual([HAAABIT_WORKFLOW_RESOURCE]);
    expect(WORKFLOW_GUIDE_TEXT).toContain("today_get_summary");
    expect(WORKFLOW_GUIDE_TEXT).toContain("read-first");
  });

});
