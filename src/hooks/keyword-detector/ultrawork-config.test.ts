  describe("keyword-detector ultrawork config-based activation", () => {
    let logCalls: Array<{ msg: string; data?: unknown }>
    let logSpy: ReturnType<typeof spyOn>
    let toastCalls: string[] = []

    function createMockPluginInput() {
      return {
        client: {
          tui: {
            showToast: async (opts: any) => {
              toastCalls.push(opts.body.title)
            },
          },
        },
      },
    } as any
  }
  }

  beforeEach(() => {
    setMainSession("test-main-session")
    logCalls = []
    logSpy = spyOn(sharedModule, "log").mockImplementation((msg: string, data?: unknown) => {
      logCalls.push({ msg, data })
    })
  })
  })

  afterEach(() => {
    logSpy?.mockRestore()
    setMainSession(undefined)
  })

  describe("config-only ultrawork activation", () => {
    test("should activate ultrawork when enabled in config", async () => {
      // #given
      const collector = new ContextCollector()
      const ultraworkConfig = { enabled: true }
      const hook = createKeywordDetectorHook(createMockPluginInput(), collector, ultraworkConfig)
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: "normal message" }],
      }

      // #when
      await hook["chat.message"]({ sessionID: "test" }, output)

      // #then
      expect(output.message.variant).toBe("max")
      expect(toastCalls).toContain("Ultrawork Mode Activated")
    })

    test("should NOT activate ultrawork when disabled in config", async () => {
      // #given
      const collector = new ContextCollector()
      const ultraworkConfig = { enabled: false }
      const hook = createKeywordDetectorHook(createMockPluginInput(), collector, ultraworkConfig)
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: "normal message" }],
      }

      // #when
      await hook["chat.message"]({ sessionID: "test" }, output)

      // #then
      expect(output.message.variant).toBeUndefined()
      expect(toastCalls).not.toContain("Ultrawork Mode Activated")
    })
  })

  describe("ultrawork config + keyword interactions", () => {
    test("keyword should override disabled config", async () => {
      // #given
      const collector = new ContextCollector()
      const ultraworkConfig = { enabled: false }
      const hook = createKeywordDetectorHook(createMockPluginInput(), collector, ultraworkConfig)
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: "ultrawork do this" }],
      }

      // #when
      await hook["chat.message"]({ sessionID: "test" }, output)

      // #then
      expect(output.message.variant).toBe("max")
      expect(toastCalls).toContain("Ultrawork Mode Activated")
    })

    test("enabled config + keyword should activate ultrawork", async () => {
      // #given
      const collector = new ContextCollector()
      const ultraworkConfig = { enabled: true }
      const hook = createKeywordDetectorHook(createMockPluginInput(), collector, ultraworkConfig)
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: "ultrawork do this" }],
      }

      // #when
      await hook["chat.message"]({ sessionID: "test" }, output)

      // #then
      expect(output.message.variant).toBe("max")
      expect(toastCalls).toContain("Ultrawork Mode Activated")
    })
  })
})
