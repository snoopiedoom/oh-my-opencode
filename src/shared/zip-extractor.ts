import { spawn, spawnSync } from "child_process"
import { release } from "os"
import * as path from "path"
import type { ChildProcess } from "child_process"

const WINDOWS_BUILD_WITH_TAR = 17134

function getWindowsBuildNumber(): number | null {
  if (process.platform !== "win32") return null

  const parts = release().split(".")
  if (parts.length >= 3) {
    const build = parseInt(parts[2], 10)
    if (!isNaN(build)) return build
  }
  return null
}

function isPwshAvailable(): boolean {
  if (process.platform !== "win32") return false
  const result = spawnSync("where", ["pwsh"])
  return result.status === 0
}

function escapePowerShellPath(path: string): string {
  return path.replace(/'/g, "''")
}

type WindowsZipExtractor = "tar" | "pwsh" | "powershell"

function getWindowsZipExtractor(): WindowsZipExtractor {
  const buildNumber = getWindowsBuildNumber()

  if (buildNumber !== null && buildNumber >= WINDOWS_BUILD_WITH_TAR) {
    return "tar"
  }

  if (isPwshAvailable()) {
    return "pwsh"
  }

  return "powershell"
}

export async function extractZip(archivePath: string, destDir: string): Promise<void> {
  let proc: ChildProcess

  if (process.platform === "win32") {
    const extractor = getWindowsZipExtractor()

    switch (extractor) {
      case "tar":
        proc = spawn("tar", ["-xf", archivePath, "-C", destDir], {
          stdio: ["ignore", "pipe", "pipe"],
        })
        break
      case "pwsh":
        proc = spawn("pwsh", ["-Command", `Expand-Archive -Path '${escapePowerShellPath(archivePath)}' -DestinationPath '${escapePowerShellPath(destDir)}' -Force`], {
          stdio: ["ignore", "pipe", "pipe"],
        })
        break
      case "powershell":
      default:
        proc = spawn("powershell", ["-Command", `Expand-Archive -Path '${escapePowerShellPath(archivePath)}' -DestinationPath '${escapePowerShellPath(destDir)}' -Force`], {
          stdio: ["ignore", "pipe", "pipe"],
        })
        break
    }
  } else {
    proc = spawn("unzip", ["-o", archivePath, "-d", destDir], {
      stdio: ["ignore", "pipe", "pipe"],
    })
  }

  const exitCode = await new Promise<number>((resolve) => {
    proc.on("close", (code) => resolve(code ?? 1))
  })

  if (exitCode !== 0) {
    let stderr = ""
    proc.stderr?.on("data", (data) => { stderr += data })
    await new Promise<void>((resolve) => {
      proc.stderr?.on("end", resolve) || resolve()
    })
    throw new Error(`zip extraction failed (exit ${exitCode}): ${stderr}`)
  }
}
