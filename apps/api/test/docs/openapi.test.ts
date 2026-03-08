import { afterEach, describe, expect, it } from "vitest";

import { createTestContext, signUp, type TestContext } from "../helpers/app";

async function issueApiToken(context: TestContext, cookie: string) {
  const response = await context.app.inject({
    method: "POST",
    url: "/api/api-access/token/reset",
    headers: {
      cookie,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(`Unable to issue api token: ${response.statusCode}`);
  }

  return (response.json() as { token: string }).token;
}

describe("openapi docs", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("serves an openapi spec that documents bearer auth, habits, today, and stats routes", async () => {
    context = await createTestContext();
    const { cookie } = await signUp(context.app);
    await issueApiToken(context, cookie);

    const response = await context.app.inject({
      method: "GET",
      url: "/api/openapi.json",
    });

    expect(response.statusCode).toBe(200);

    const spec = response.json() as {
      openapi: string;
      paths: Record<string, Record<string, { security?: Array<Record<string, string[]>>; responses?: Record<string, unknown> }>>;
      components?: {
        securitySchemes?: Record<string, unknown>;
      };
    };

    expect(spec.openapi).toBe("3.1.0");
    expect(spec.components?.securitySchemes).toMatchObject({
      BearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    });
    expect(spec.paths["/api/habits"]?.get?.security).toEqual([{ BearerAuth: [] }]);
    expect(spec.paths["/api/today"]?.get?.security).toEqual([{ BearerAuth: [] }]);
    expect(spec.paths["/api/stats/overview"]?.get?.security).toEqual([{ BearerAuth: [] }]);
    expect(spec.paths["/api/habits"]?.post?.responses).toHaveProperty("400");
    expect(spec.paths["/api/today/set-total"]?.post?.responses).toHaveProperty("409");
  });

  it("serves an interactive docs page that points at the generated openapi json", async () => {
    context = await createTestContext();
    await signUp(context.app);

    const response = await context.app.inject({
      method: "GET",
      url: "/api/docs",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain('<html lang="en">');
    expect(response.body).toContain("Haaabit API");
    expect(response.body).toContain("This page follows your current app language.");
    expect(response.body).toContain("/api/openapi.json");
    expect(response.body).toContain("/api/habits");
  });

  it("serves chinese api docs chrome when locale cookie or browser language requests chinese", async () => {
    context = await createTestContext();
    const { cookie } = await signUp(context.app);

    const cookieResponse = await context.app.inject({
      method: "GET",
      url: "/api/docs",
      headers: {
        cookie: `${cookie}; haaabit-locale=zh-CN`,
      },
    });

    expect(cookieResponse.statusCode).toBe(200);
    expect(cookieResponse.body).toContain('<html lang="zh-CN">');
    expect(cookieResponse.body).toContain("OpenAPI + 交互式参考");
    expect(cookieResponse.body).toContain("当前页面会跟随你在应用中的语言。");
    expect(cookieResponse.body).toContain("Authorization: Bearer");
    expect(cookieResponse.body).toContain("/api/openapi.json");

    const headerResponse = await context.app.inject({
      method: "GET",
      url: "/api/docs",
      headers: {
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    expect(headerResponse.statusCode).toBe(200);
    expect(headerResponse.body).toContain('<html lang="zh-CN">');
    expect(headerResponse.body).toContain("当前页面会跟随你在应用中的语言。");
  });
});
