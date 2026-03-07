import { z } from "zod";
import type { FastifyInstance } from "fastify";

import { API_DOCS_PATH, API_SPEC_PATH } from "../auth/api-token";
import { habitApiRouteDefinitions } from "../modules/habits/habit.routes";
import { statsApiRouteDefinitions } from "../modules/stats/stats.routes";
import { todayApiRouteDefinitions } from "../modules/today/today.routes";

type HttpMethod = "GET" | "POST" | "PATCH";

type ExampleDefinition = {
  summary: string;
  value: unknown;
};

type SchemaDefinition = {
  description: string;
  schema: z.ZodType;
  examples?: Record<string, ExampleDefinition>;
};

export type PublicApiRouteDefinition = {
  method: HttpMethod;
  path: string;
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  security?: Array<Record<string, string[]>>;
  request?: {
    params?: z.ZodType;
    query?: z.ZodType;
    body?: z.ZodType;
    bodyExamples?: Record<string, ExampleDefinition>;
  };
  responses: Record<number, SchemaDefinition>;
};

const publicApiRouteDefinitions: PublicApiRouteDefinition[] = [
  ...habitApiRouteDefinitions,
  ...todayApiRouteDefinitions,
  ...statsApiRouteDefinitions,
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function routePathToOpenApi(path: string) {
  return path.replaceAll(/:([a-zA-Z0-9_]+)/g, "{$1}");
}

function toExamples(examples?: Record<string, ExampleDefinition>) {
  if (!examples) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(examples).map(([name, example]) => [
      name,
      {
        summary: example.summary,
        value: example.value,
      },
    ]),
  );
}

function objectEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>);
}

function toJsonSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema);
}

function toParameters(schema: z.ZodType | undefined, location: "path" | "query") {
  if (!schema) {
    return [];
  }

  const jsonSchema = toJsonSchema(schema);
  const required = new Set(
    Array.isArray((jsonSchema as { required?: string[] }).required)
      ? ((jsonSchema as { required?: string[] }).required ?? [])
      : [],
  );

  return objectEntries((jsonSchema as { properties?: Record<string, unknown> }).properties).map(([name, value]) => ({
    name,
    in: location,
    required: location === "path" ? true : required.has(name),
    schema: value,
  }));
}

function buildOpenApiDocument() {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of publicApiRouteDefinitions) {
    const openApiPath = routePathToOpenApi(route.path);
    const operation = {
      operationId: route.operationId,
      summary: route.summary,
      description: route.description,
      tags: route.tags,
      security: route.security,
      parameters: [
        ...toParameters(route.request?.params, "path"),
        ...toParameters(route.request?.query, "query"),
      ],
      requestBody: route.request?.body
        ? {
            required: true,
            content: {
              "application/json": {
                schema: toJsonSchema(route.request.body),
                examples: toExamples(route.request.bodyExamples),
              },
            },
          }
        : undefined,
      responses: Object.fromEntries(
        Object.entries(route.responses).map(([statusCode, response]) => [
          statusCode,
          {
            description: response.description,
            content: {
              "application/json": {
                schema: toJsonSchema(response.schema),
                examples: toExamples(response.examples),
              },
            },
          },
        ]),
      ),
    };

    paths[openApiPath] ??= {};
    paths[openApiPath][route.method.toLowerCase()] = operation;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Haaabit API",
      version: "1.0.0",
      description: "Bearer-authenticated REST API for habits, today's workflow, and overview stats.",
    },
    servers: [
      {
        url: "/",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API token",
          description: "Use the personal API token generated from the signed-in API Access page.",
        },
      },
    },
    paths,
  };
}

function renderRequestExamples(route: PublicApiRouteDefinition) {
  if (!route.request?.bodyExamples) {
    return "";
  }

  return Object.values(route.request.bodyExamples)
    .map(
      (example) => `
        <div class="example-block">
          <h4>Request Example: ${escapeHtml(example.summary)}</h4>
          <pre>${escapeHtml(JSON.stringify(example.value, null, 2))}</pre>
        </div>
      `,
    )
    .join("");
}

function renderResponseExamples(route: PublicApiRouteDefinition) {
  return Object.entries(route.responses)
    .map(([statusCode, response]) => {
      const examples = response.examples
        ? Object.values(response.examples)
            .map(
              (example) => `
                <div class="example-block">
                  <h4>${statusCode} Example: ${escapeHtml(example.summary)}</h4>
                  <pre>${escapeHtml(JSON.stringify(example.value, null, 2))}</pre>
                </div>
              `,
            )
            .join("")
        : "";

      return `
        <section class="response-block">
          <p><strong>${statusCode}</strong> ${escapeHtml(response.description)}</p>
          ${examples}
        </section>
      `;
    })
    .join("");
}

function renderDocsPage() {
  const operations = publicApiRouteDefinitions
    .map(
      (route) => `
        <details class="operation">
          <summary>
            <span class="method">${escapeHtml(route.method)}</span>
            <code>${escapeHtml(route.path)}</code>
            <span class="summary-text">${escapeHtml(route.summary)}</span>
          </summary>
          <div class="operation-body">
            <p>${escapeHtml(route.description)}</p>
            <p><strong>Operation ID:</strong> ${escapeHtml(route.operationId)}</p>
            ${renderRequestExamples(route)}
            ${renderResponseExamples(route)}
          </div>
        </details>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Haaabit API Docs</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
      }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f7f1e7 0%, #efe6d8 100%);
        color: #2f241a;
      }
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 3rem 1.5rem 4rem;
      }
      .hero {
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(84, 58, 31, 0.12);
        border-radius: 2rem;
        padding: 2rem;
        box-shadow: 0 24px 80px rgba(56, 38, 17, 0.08);
      }
      .hero p, .operation-body p {
        line-height: 1.6;
      }
      .meta-links {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 1rem;
      }
      .meta-links a {
        color: #173d35;
        font-weight: 700;
      }
      .operation {
        margin-top: 1rem;
        border: 1px solid rgba(84, 58, 31, 0.12);
        border-radius: 1.25rem;
        background: rgba(255, 255, 255, 0.78);
        overflow: hidden;
      }
      .operation summary {
        cursor: pointer;
        list-style: none;
        padding: 1rem 1.25rem;
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .operation summary::-webkit-details-marker {
        display: none;
      }
      .operation-body {
        padding: 0 1.25rem 1.25rem;
      }
      .method {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 3.75rem;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        background: #173d35;
        color: #f8f3eb;
        font-family: ui-monospace, monospace;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .summary-text {
        color: #5a4d40;
      }
      pre, code {
        font-family: ui-monospace, "SFMono-Regular", monospace;
      }
      pre {
        margin: 0.4rem 0 0;
        padding: 1rem;
        border-radius: 1rem;
        overflow-x: auto;
        background: #1d1f21;
        color: #f2efe9;
      }
      .example-block + .example-block, .response-block + .response-block {
        margin-top: 1rem;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p style="margin:0; letter-spacing:0.08em; text-transform:uppercase; color:#756858; font-size:0.8rem;">OpenAPI + Interactive Reference</p>
        <h1 style="margin:0.4rem 0 0; font-size:2.4rem;">Haaabit API</h1>
        <p>Authorization: Bearer <code>&lt;personal-token&gt;</code></p>
        <p>This reference is generated from the same route metadata that powers the bearer-authenticated habits, today, and stats runtime.</p>
        <div class="meta-links">
          <a href="${API_SPEC_PATH}">${API_SPEC_PATH}</a>
        </div>
      </section>
      <section style="margin-top:1.5rem;">
        ${operations}
      </section>
    </main>
  </body>
</html>`;
}

export async function registerOpenApi(app: FastifyInstance) {
  app.get(API_SPEC_PATH, async () => buildOpenApiDocument());
  app.get(API_DOCS_PATH, async (_, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderDocsPage();
  });
}
