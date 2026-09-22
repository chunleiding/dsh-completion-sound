/**
 * Host half: this entry's live configuration form, the bundled long-task cue
 * asset, and the user-selected special-cue resolver. The special route reads
 * the `specialPath` preference at request time: empty serves the bundled
 * "guan-yu" sample, a file serves itself, and a directory serves one random
 * audio file found within it (bounded recursive scan). An unusable selection
 * falls back to the bundled sample so a completion never loses its cue.
 */

import { spawn } from 'node:child_process'
import { readFile, readdir, stat } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
// Type-only: pulls the settings Context merge (ctx.settings) used to opt this
// entry out of the auto-generated configuration page.
import type {} from '@deepseek-ai/dsh-settings'
// Type-only: pulls the webServer Context merge (ctx.webServer).
import type {} from '@deepseek-ai/dsh-host-webserver'
import {
  COMPLETION_SOUND_ENABLED_FIELD, COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD,
  COMPLETION_SOUND_NOTIFY_FIELD, COMPLETION_SOUND_NOTIFY_URL,
  COMPLETION_SOUND_ASK_ALERT_FIELD, COMPLETION_SOUND_ASK_PATH_FIELD, COMPLETION_SOUND_ASK_REPEAT_FIELD,
  COMPLETION_SOUND_SPECIAL_FIELD, COMPLETION_SOUND_SPECIAL_PATH_FIELD, COMPLETION_SOUND_VOLUME_FIELD,
  DEFAULT_ASK_REPEAT_MINUTES, DEFAULT_LONG_TASK_MINUTES, DEFAULT_VOLUME,
  GUAN_YU_SOUND_URL, MAX_ASK_REPEAT_MINUTES, MAX_LONG_TASK_MINUTES,
  MIN_ASK_REPEAT_MINUTES, MIN_LONG_TASK_MINUTES, SPECIAL_SOUND_URL, ASK_SOUND_URL,
} from './settings.ts'

export {
  COMPLETION_SOUND_ENABLED_FIELD, COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD,
  COMPLETION_SOUND_NOTIFY_FIELD, COMPLETION_SOUND_NOTIFY_URL,
  COMPLETION_SOUND_SETTINGS_NAMESPACE,
  COMPLETION_SOUND_ASK_ALERT_FIELD, COMPLETION_SOUND_SPECIAL_FIELD,
  COMPLETION_SOUND_SPECIAL_PATH_FIELD, COMPLETION_SOUND_VOLUME_FIELD,
  DEFAULT_LONG_TASK_MINUTES, DEFAULT_VOLUME,
  DEFAULT_ASK_REPEAT_MINUTES, GUAN_YU_SOUND_URL, MAX_ASK_REPEAT_MINUTES, MAX_LONG_TASK_MINUTES,
  MIN_ASK_REPEAT_MINUTES, MIN_LONG_TASK_MINUTES, SPECIAL_SOUND_URL, ASK_SOUND_URL,
  type CompletionSoundSettings,
} from './settings.ts'

/**
 * The live preference references the loader hands `apply`. Each field is a
 * stable reference rather than a value: a settings write lands in the profile
 * patch and the reference keeps serving the new value, so the cue routes need
 * no reload to see it.
 */
export interface Config {
  /** Master switch: play any sound on turn completion. */
  enabled: Volatile<boolean>
  /** Also raise a desktop notification when a turn finishes. */
  notify: Volatile<boolean>
  /** Playback gain, 0 (silent) through 1 (full). */
  volume: Volatile<number>
  /** Turns lasting at least this many minutes earn long-task handling. */
  longTaskMinutes: Volatile<number>
  /** Play the special long-task music instead of the chime on long turns. */
  special: Volatile<boolean>
  /** File or directory for the special music; '' selects the bundled sample. */
  specialPath: Volatile<string>
  /** Alert when a card awaits an answer. */
  askAlert: Volatile<boolean>
  /** Re-alert interval while a card stays unanswered; 0 disables repeating. */
  askRepeatMinutes: Volatile<number>
  /** File or directory for the answer-needed cue; '' plays the synthesized chime. */
  askPath: Volatile<string>
}

/**
 * This entry's configuration schema. Every field is `volatile`, which is what
 * makes it a user-editable settings form: the settings service projects the
 * volatile fields of each loader entry's Config into its page, keyed by the
 * entry id (`completion-sound`), and refuses writes to anything not marked.
 */
export const Config = z.object({
  [COMPLETION_SOUND_ENABLED_FIELD]: z.boolean().default(true).volatile(),
  [COMPLETION_SOUND_NOTIFY_FIELD]: z.boolean().default(false).volatile(),
  [COMPLETION_SOUND_VOLUME_FIELD]: z.number().min(0).max(1).default(DEFAULT_VOLUME).volatile(),
  [COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD]: z.number()
    .min(MIN_LONG_TASK_MINUTES)
    .max(MAX_LONG_TASK_MINUTES)
    .default(DEFAULT_LONG_TASK_MINUTES)
    .volatile(),
  [COMPLETION_SOUND_SPECIAL_FIELD]: z.boolean().default(true).volatile(),
  [COMPLETION_SOUND_SPECIAL_PATH_FIELD]: z.string().default('').volatile(),
  [COMPLETION_SOUND_ASK_ALERT_FIELD]: z.boolean().default(true).volatile(),
  [COMPLETION_SOUND_ASK_REPEAT_FIELD]: z.number()
    .min(MIN_ASK_REPEAT_MINUTES)
    .max(MAX_ASK_REPEAT_MINUTES)
    .default(DEFAULT_ASK_REPEAT_MINUTES)
    .volatile(),
  [COMPLETION_SOUND_ASK_PATH_FIELD]: z.string().default('').volatile(),
})

/**
 * Absolute path of the bundled long-task cue. Both the source (`src/`) and the
 * built (`lib/`) node half sit one level under the package root, so the single
 * `../assets` hop resolves identically from either location.
 */
const GUAN_YU_ASSET_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/guan-yu.wav')

/** Lazily loaded asset bytes; a failed read leaves it null so the next request retries. */
let guanYuBuffer: Uint8Array | null = null

/** Content types for the audio extensions the special-cue resolver accepts. */
const AUDIO_CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.oga': 'audio/ogg',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
}

/** Upper bound on audio files a directory scan collects (one pass, breadth by depth). */
const SPECIAL_AUDIO_SCAN_CAP = 512

/** Content type for an audio path, or undefined when its extension is not audio. */
function audioContentType(path: string): string | undefined {
  return AUDIO_CONTENT_TYPES[extname(path).toLowerCase()]
}

/** Write one byte body with its audio content type (405 non-GET/HEAD, 404 unreadable handled by callers). */
function serveBody(req: IncomingMessage, res: ServerResponse, body: Uint8Array, contentType: string, random: boolean): void {
  res.writeHead(200, {
    'content-type': contentType,
    'content-length': String(body.byteLength),
    'cache-control': 'no-cache',
    ...random ? { 'x-dsh-completion-sound-random': '1' } : {},
  })
  if (req.method === 'HEAD') res.end()
  else res.end(body)
}

/** Serve the bundled long-task cue as an audio/wav response (405 non-GET/HEAD, 404 unreadable). */
const serveGuanYu = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    res.end()
    return
  }
  try {
    const { body, contentType } = await bundledCue()
    serveBody(req, res, body, contentType, false)
  } catch {
    // Asset missing from the published files: a loud 404 beats the silent SPA-fallback HTML page.
    res.writeHead(404)
    res.end()
  }
}

/** Bounded recursive walk collecting audio files under a directory. */
async function collectAudioFiles(dir: string): Promise<string[]> {
  const found: string[] = []
  const stack: string[] = [dir]
  while (stack.length > 0 && found.length < SPECIAL_AUDIO_SCAN_CAP) {
    const current = stack.pop()!
    let entries: Dirent[]
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      // Unreadable subtree: skip it rather than failing the whole selection.
      continue
    }
    for (const entry of entries) {
      if (found.length >= SPECIAL_AUDIO_SCAN_CAP) break
      if (entry.isDirectory()) stack.push(join(current, entry.name))
      else if (entry.isFile() && audioContentType(entry.name) !== undefined) found.push(join(current, entry.name))
    }
  }
  return found
}

/** One resolved audio cue: the bytes to serve plus how they were picked. */
interface ResolvedCue { body: Uint8Array, contentType: string, random: boolean }

/**
 * Resolve a user-selected cue to concrete bytes: a file serves itself, a
 * directory serves one random audio file within it. Returns null for an empty
 * or unusable selection (missing path, no audio files, non-audio file) and
 * leaves the caller to pick the fallback — the long-task route serves the
 * bundled sample, while the answer-needed route lets the browser fall back to
 * its own synthesized cue.
 */
async function resolveCueSelection(path: string): Promise<ResolvedCue | null> {
  if (path === '') return null
  try {
    const target = resolve(path)
    const info = await stat(target)
    if (info.isFile()) {
      const contentType = audioContentType(target)
      if (contentType !== undefined) return { body: await readFile(target), contentType, random: false }
      return null
    }
    if (info.isDirectory()) {
      const files = await collectAudioFiles(target)
      if (files.length > 0) {
        const picked = files[Math.floor(Math.random() * files.length)]!
        return { body: await readFile(picked), contentType: audioContentType(picked) ?? 'audio/wav', random: true }
      }
    }
  } catch {
    // Unreadable or missing selection: the caller's fallback decides.
  }
  return null
}

/** Read the bundled long-task cue, caching its bytes after the first success. */
async function bundledCue(): Promise<ResolvedCue> {
  const body = guanYuBuffer ?? await readFile(GUAN_YU_ASSET_PATH)
  guanYuBuffer = body
  return { body, contentType: 'audio/wav', random: false }
}

/** Result of a Host-side OS-notification attempt, reported back to the client. */
interface SystemNotificationResult {
  ok: boolean
  platform: string
}

/**
 * Raise an OS notification from the local host process. The browser
 * Notification API is the primary channel; this fallback covers platforms
 * where that channel is missing or blocked — macOS Safari, Linux desktops
 * without a notification daemon, non-secure contexts. Uses the platform's
 * built-in notifier when present: `osascript` on macOS, `notify-send` on
 * Linux. Resolves ok:false when no notifier exists for the platform.
 */
function sendSystemNotification(title: string, body: string): Promise<SystemNotificationResult> {
  return new Promise((resolve) => {
    const platform = process.platform
    let command: string
    let args: string[]
    if (platform === 'darwin') {
      command = 'osascript'
      const script = `display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)}`
      args = ['-e', script]
    } else if (platform === 'linux') {
      command = 'notify-send'
      args = ['-a', 'DSH', title, body]
    } else {
      resolve({ ok: false, platform })
      return
    }
    let child: ReturnType<typeof spawn>
    try {
      child = spawn(command, args, { stdio: 'ignore' })
    } catch {
      resolve({ ok: false, platform })
      return
    }
    let settled = false
    child.once('error', () => {
      if (!settled) { settled = true; resolve({ ok: false, platform }) }
    })
    child.once('exit', (code) => {
      if (!settled) { settled = true; resolve({ ok: code === 0, platform }) }
    })
  })
}

/** Read a best-effort JSON {title, body} body from a POST request. */
async function readNotifyBody(req: IncomingMessage): Promise<{ title: string, body: string }> {
  const chunks: Buffer[] = []
  try {
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { title?: unknown, body?: unknown }
    return {
      title: typeof parsed.title === 'string' ? parsed.title : 'DSH',
      body: typeof parsed.body === 'string' ? parsed.body : '',
    }
  } catch {
    return { title: 'DSH', body: '' }
  }
}

/** Serve the OS-notification fallback: POST {title, body} raises an OS notification. */
const serveNotify = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end()
    return
  }
  const { title, body } = await readNotifyBody(req)
  const result = await sendSystemNotification(title, body)
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify(result))
}

/**
 * Own this entry's page policy and serve the cue routes. The preferences ride
 * the entry Config, so there is nothing to register — the loader validates and
 * resolves them, and each `volatile` field stays live across a settings write.
 * @param ctx - Host context.
 * @param config - validated live completion-sound preferences.
 */
export function apply(ctx: Context, config: Config): void {
  // This bundle draws its own `settings.section` page, so opt out of the form
  // the settings service would otherwise generate from the same schema.
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber))
  })
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'exact', path: GUAN_YU_SOUND_URL, handler: serveGuanYu }),
      'ui-completion-sound: long-task cue asset route',
    )
    // One GET/HEAD resolver over a user-selected cue path. `bundledFallback`
    // decides what an empty or unusable selection means: the long-task cue falls
    // back to the bundled sample so a completion never loses its music, while
    // the answer-needed cue 404s so the browser plays its synthesized chime
    // instead of a triumphant fanfare that does not fit "answer me".
    const cueRoute = (select: (values: Config) => string, bundledFallback: boolean) => async (
      req: IncomingMessage,
      res: ServerResponse,
    ): Promise<void> => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405)
        res.end()
        return
      }
      try {
        const picked = await resolveCueSelection(select(config))
        if (picked !== null) {
          serveBody(req, res, picked.body, picked.contentType, picked.random)
          return
        }
        if (!bundledFallback) {
          res.writeHead(404)
          res.end()
          return
        }
        const fallback = await bundledCue()
        serveBody(req, res, fallback.body, fallback.contentType, false)
      } catch {
        res.writeHead(404)
        res.end()
      }
    }
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'exact', path: SPECIAL_SOUND_URL, handler: cueRoute(values => values.specialPath.get(), true) }),
      'ui-completion-sound: special-cue resolver route',
    )
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'exact', path: ASK_SOUND_URL, handler: cueRoute(values => values.askPath.get(), false) }),
      'ui-completion-sound: answer-needed cue route',
    )
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'exact', path: COMPLETION_SOUND_NOTIFY_URL, handler: serveNotify }),
      'ui-completion-sound: system-notification route',
    )
  })
}