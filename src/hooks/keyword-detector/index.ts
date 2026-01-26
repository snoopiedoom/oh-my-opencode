import type { PluginInput } from "@opencode-ai/plugin"
import type { UltraworkModeConfig } from "../../config/schema"
import { detectKeywordsWithType, extractPromptText, removeCodeBlocks } from "./detector"
import { getUltraworkMessage } from "./constants"
import { log } from "../../shared"
import { isSystemDirective } from "../../shared/system-directive"
import { getMainSessionID, getSessionAgent, subagentSessions } from "../../features/claude-code-session-state"
import type { ContextCollector } from "../../features/context-injector"

export * from "./detector"
export * from "./constants"
export * from "./types"

export function createKeywordDetectorHook(
  ctx: PluginInput,
  collector?: ContextCollector,
  ultraworkModeConfig?: UltraworkModeConfig
) {
  return {
    "chat.message": async (
      input: {
        sessionID: string
        agent?: string
        model?: { providerID: string; modelID: string }
        messageID?: string
      },
      output: {
        message: Record<string, unknown>
        parts: Array<{ type: string; text?: string; [key: string]: unknown }>
      }
    ): Promise<void> => {
      const promptText = extractPromptText(output.parts)

      if (isSystemDirective(promptText)) {
        log(`[keyword-detector] Skipping system directive message`, { sessionID: input.sessionID })
          return
        }

      const currentAgent = getSessionAgent(input.sessionID) ?? input.agent
      let detectedKeywords = detectKeywordsWithType(removeCodeBlocks(promptText), currentAgent)

      const isUltraworkEnabledByConfig = ultraworkModeConfig?.enabled ?? false
      const mainSessionID = getMainSessionID()

      // Early return: no keywords AND config-based ultrawork not enabled
      if (detectedKeywords.length === 0 && !isUltraworkEnabledByConfig) {
        return
      }

      // Skip keyword detection for background task sessions to prevent mode injection
      // (e.g., [analyze-mode]) which incorrectly triggers Prometheus restrictions
      const isBackgroundTaskSession = subagentSessions.has(input.sessionID)
      if (isBackgroundTaskSession) {
        return
      }
 
      const isNonMainSession = mainSessionID && input.sessionID !== mainSessionID

      // If ultrawork is enabled by config but not detected in prompt, add it
      // Must happen BEFORE non-main session filtering to ensure it's added
      const hasUltraworkKeyword = detectedKeywords.some((k) => k.type === "ultrawork")
      const hasUltrawork = hasUltraworkKeyword || isUltraworkEnabledByConfig

      if (isUltraworkEnabledByConfig && !hasUltraworkKeyword) {
        detectedKeywords.push({
          type: "ultrawork",
          message: getUltraworkMessage(currentAgent),
        })
      }

      if (isNonMainSession) {
        detectedKeywords = detectedKeywords.filter((k) => k.type === "ultrawork")
        if (detectedKeywords.length === 0) {
          log(`[keyword-detector] Skipping non-ultrawork keywords in non-main session`, {
            sessionID: input.sessionID,
            mainSessionID,
          })
          return
        }
      }
      if (hasUltrawork) {
        log(`[keyword-detector] Ultrawork mode activated`, { sessionID: input.sessionID })

        if (output.message.variant === undefined) {
          output.message.variant = "max"
        }

        ctx.client.tui
          .showToast({
            body: {
              title: "Ultrawork Mode Activated",
              message: "Maximum precision engaged. All agents at your disposal.",
              variant: "success" as const,
              duration: 3000,
            },
          })
          .catch((err) =>
            log(`[keyword-detector] Failed to show toast`, { error: err, sessionID: input.sessionID })
          )
      }

      if (collector) {
        for (const keyword of detectedKeywords) {
          collector.register(input.sessionID, {
            id: `keyword-${keyword.type}`,
            source: "keyword-detector",
            content: keyword.message,
            priority: keyword.type === "ultrawork" ? "critical" : "high",
          })
        }
      }

      log(`[keyword-detector] Detected ${detectedKeywords.length} keywords`, {
        sessionID: input.sessionID,
        types: detectedKeywords.map((k) => k.type),
      })
    },
  }
}
