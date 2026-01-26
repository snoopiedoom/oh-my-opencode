// ULTIMATE TEST PLUGIN - Minimal safe version for testing ultrawork mode
// Does nothing except verify plugin loads

import type { Plugin } from "@opencode-ai/plugin"

export const OhMyOpenCodePlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  // === STEP 1: LOG PLUGIN LOADING ===
  await client.app.log({
    service: "ulw-test-minimal",
    level: "info",
    message: "Plugin loaded successfully - verifying OpenCode is not frozen",
    extra: {
      timestamp: new Date().toISOString(),
      pluginFile: "ulw-test.ts"
    }
  });

  // === STEP 2: RETURN EMPTY HOOKS ===
  // DO NOT do anything that could cause issues
  return {};
};
