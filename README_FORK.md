# Ultrawork Mode Implementation

## Overview
Added persistent ultrawork mode configuration with quality settings for unlimited token usage scenarios.

## Changes Made

### 1. Config Schema (`src/config/schema.ts`)
- Added `UltraworkModeQualitySettingsSchema` with 8 quality settings
- Added `UltraworkModeConfigSchema` with `enabled` boolean
- Added `ultrawork_enabled` to `RalphLoopConfigSchema`

### 2. Keyword Detector (`src/hooks/keyword-detector/index.ts`)
- Checks `ultraworkModeConfig?.enabled ?? false` in addition to keyword detection
- Hook signature updated to accept `ultraworkModeConfig` parameter

### 3. Quality Settings Integration
- **Tool Output Truncator** (`src/hooks/tool-output-truncator.ts`):
  - Accepts `ultraworkQuality` options
  - Uses quality settings for token limits
- **Dynamic Truncator** (`src/shared/dynamic-truncator.ts`):
  - Added `applyHeadroomRule` and `headroomPercentage` options
- **Background Concurrency** (`src/features/background-agent/concurrency.ts`):
  - Ultrawork settings override default concurrency

### 4. Documentation
- Added "Ultrawork Mode" section to `docs/configurations.md`
- Generated JSON schema via `bun run build:schema`

## Config Options

### Ultrawork Mode
```json
{
  "ultrawork_mode": {
    "enabled": true,
    "quality": {
      "max_tool_output_tokens": 75000,
      "max_webfetch_tokens": 20000,
      "apply_headroom_rule": true,
      "headroom_percentage": 0.5,
      "max_lsp_results": 300,
      "max_ast_grep_matches": 750,
      "max_grep_matches": 750,
      "background_concurrency": 8,
      "thinking_budget_tokens": 64000,
      "disable_cost_preference": true
    }
  }
}
```

## Key Features
- **Always-on ultrawork**: No need to type "ultrawork" keyword
- **Configurable limits**: All token/output limits adjustable
- **Optimized defaults**: ~50-100% higher defaults for 100M token budget
- **Quality-first**: Uses best models regardless of cost when enabled

## Testing
Use `--directory` flag to test without breaking existing install:
```bash
cd /mnt/c/dev/oh-my-opencode
opencode --directory /tmp/test-project
```

Copy `example-zai-config.json` to your test project to use optimized defaults.
