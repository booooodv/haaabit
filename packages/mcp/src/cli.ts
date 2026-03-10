#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { bootstrapPersonalApiToken } from "./bootstrap/token.js";
import { formatBootstrapError, formatStartupError, parseBootstrapConfig, parseConfig } from "./config/env.js";
import { createServer } from "./server/create-server.js";

export type CliMode = "server" | "bootstrap-token";

type CliDependencies = {
  env: NodeJS.ProcessEnv;
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  connectServer: (argv: string[], env: NodeJS.ProcessEnv) => Promise<void>;
  bootstrapToken: (argv: string[], env: NodeJS.ProcessEnv, stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream) => Promise<void>;
};

const BOOTSTRAP_COMMAND = "bootstrap-token";

export function resolveCliMode(argv: string[]): CliMode {
  return argv[0] === BOOTSTRAP_COMMAND ? BOOTSTRAP_COMMAND : "server";
}

export async function runCli(argv: string[], deps: CliDependencies) {
  const mode = resolveCliMode(argv);

  if (mode === BOOTSTRAP_COMMAND) {
    await deps.bootstrapToken(argv.slice(1), deps.env, deps.stdin, deps.stdout);
    return;
  }

  await deps.connectServer(argv, deps.env);
}

async function connectServer(argv: string[], env: NodeJS.ProcessEnv) {
  const config = parseConfig({
    env,
    argv,
  });
  const server = createServer(config);
  const transport = new StdioServerTransport();

  await server.server.connect(transport);
  await waitForStdioShutdown(process.stdin);
}

async function waitForStdioShutdown(stdin: NodeJS.ReadStream) {
  stdin.resume();

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      stdin.off("end", handleEnd);
      stdin.off("close", handleClose);
      stdin.off("error", handleError);
    };
    const handleEnd = () => {
      cleanup();
      resolve();
    };
    const handleClose = () => {
      cleanup();
      resolve();
    };
    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    stdin.once("end", handleEnd);
    stdin.once("close", handleClose);
    stdin.once("error", handleError);
  });
}

async function runBootstrapTokenCommand(
  argv: string[],
  env: NodeJS.ProcessEnv,
  stdin: NodeJS.ReadStream,
  stdout: NodeJS.WriteStream,
) {
  const config = parseBootstrapConfig({
    env,
    argv,
  });
  const password = config.password ?? await promptForPassword(stdin, stdout);
  const result = await bootstrapPersonalApiToken({
    apiUrl: config.apiUrl,
    email: config.email,
    password,
    force: config.force,
  });

  stdout.write(`${result.token}\n`);
}

async function promptForPassword(stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream) {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error(
      "Missing bootstrap password. Provide --password, HAAABIT_BOOTSTRAP_PASSWORD, or run interactively to enter it.",
    );
  }

  const rl = createInterface({
    input: stdin,
    output: stdout,
    terminal: true,
  });

  try {
    const password = await rl.question("Haaabit account password: ");

    if (!password) {
      throw new Error("Bootstrap password cannot be empty.");
    }

    return password;
  } finally {
    rl.close();
  }
}

function normalizeExecutionPath(target: string) {
  try {
    const realpath = realpathSync.native ?? realpathSync;
    return realpath(target);
  } catch {
    return target;
  }
}

export async function main() {
  const args = process.argv.slice(2);

  await runCli(args, {
    env: process.env,
    stdin: process.stdin,
    stdout: process.stdout,
    connectServer,
    bootstrapToken: runBootstrapTokenCommand,
  });
}

export function isDirectExecution(
  importMetaUrl = import.meta.url,
  argv: string[] = process.argv,
  resolvePath: (target: string) => string = normalizeExecutionPath,
) {
  const entrypoint = argv[1];

  if (!entrypoint) {
    return false;
  }

  const modulePath = resolvePath(fileURLToPath(importMetaUrl));
  const entrypointPath = resolvePath(entrypoint);

  return modulePath === entrypointPath;
}

if (isDirectExecution()) {
  main().catch((error) => {
    if (resolveCliMode(process.argv.slice(2)) === BOOTSTRAP_COMMAND) {
      formatBootstrapError(error, {
        env: process.env,
      });
      process.exitCode = 1;
      return;
    }

    formatStartupError(error, process.env);
    process.exitCode = 1;
  });
}
