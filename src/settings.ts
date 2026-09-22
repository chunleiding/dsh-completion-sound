/**
 * Completion-sound preferences, carried by this plugin's profile entry Config.
 * Schema-free on purpose: the schema (which needs schemastery) lives in the
 * node half, so the browser bundle never inlines it. This module carries only
 * the entry identity, the field names, and the shared section type.
 */

/**
 * Settings namespace of the completion-sound preferences — the profile loader
 * entry id, which is what the settings forms key a namespace by and what the
 * browser half asks `ctx.configForms` for.
 */
export const COMPLETION_SOUND_SETTINGS_NAMESPACE = 'completion-sound'

/** Field carrying the master sound switch. */
export const COMPLETION_SOUND_ENABLED_FIELD = 'enabled'

/** Field carrying the desktop-notification switch. */
export const COMPLETION_SOUND_NOTIFY_FIELD = 'notify'

/** Field carrying the playback gain (0..1). */
export const COMPLETION_SOUND_VOLUME_FIELD = 'volume'

/** Field carrying the long-task threshold in minutes. */
export const COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD = 'longTaskMinutes'

/** Field carrying the special long-task music switch. */
export const COMPLETION_SOUND_SPECIAL_FIELD = 'special'

/** Field carrying the user-selected special-cue file/directory path ('' = bundled). */
export const COMPLETION_SOUND_SPECIAL_PATH_FIELD = 'specialPath'

/** Field carrying the answer-needed alert switch. */
export const COMPLETION_SOUND_ASK_ALERT_FIELD = 'askAlert'

/** Field carrying the repeat-interval for the answer-needed alert (0 = no repeat). */
export const COMPLETION_SOUND_ASK_REPEAT_FIELD = 'askRepeatMinutes'

/** Field carrying the optional answer-needed audio file/directory ('' = synthesized cue). */
export const COMPLETION_SOUND_ASK_PATH_FIELD = 'askPath'

/** Default playback gain (0..1) when the user-settings document has no override. */
export const DEFAULT_VOLUME = 0.5

/** Default long-task threshold (minutes). */
export const DEFAULT_LONG_TASK_MINUTES = 10

/** Minimum long-task threshold (minutes). */
export const MIN_LONG_TASK_MINUTES = 1

/** Maximum long-task threshold (minutes) — seven days. */
export const MAX_LONG_TASK_MINUTES = 10080

/** Minimum answer-needed repeat interval (minutes); 0 disables repeating entirely. */
export const MIN_ASK_REPEAT_MINUTES = 0

/** Maximum answer-needed repeat interval (minutes) — one day. */
export const MAX_ASK_REPEAT_MINUTES = 1440

/** Default answer-needed repeat interval (minutes) while a card stays unanswered. */
export const DEFAULT_ASK_REPEAT_MINUTES = 3

/** Web route the node half serves the bundled long-task ("guan-yu") cue under. */
export const GUAN_YU_SOUND_URL = '/completion-sound/guan-yu.wav'

/**
 * Web route the node half serves the special long-task cue under. The resolver
 * reads the `specialPath` setting at request time: empty selects the bundled
 * sample, a file serves itself, and a directory serves one random audio file.
 */
export const SPECIAL_SOUND_URL = '/completion-sound/special'

/**
 * Web route the node half serves the Host-side OS-notification fallback under.
 * The browser Notification API is the primary channel; this POST route lets the
 * client ask the local process to raise an OS notification (osascript on macOS,
 * notify-send on Linux) when the browser channel is missing or blocked.
 */
export const COMPLETION_SOUND_NOTIFY_URL = '/completion-sound/notify'

/**
 * Web route the node half serves the answer-needed cue under. Resolves the
 * `askPath` setting the same way the long-task route resolves `specialPath`,
 * except an unusable selection 404s instead of falling back to the bundled
 * sample: the browser then plays its own synthesized cue, which is the better
 * fallback for "answer me" than a triumphant long-task fanfare.
 */
export const ASK_SOUND_URL = '/completion-sound/ask'

/** Durable completion-sound section shared by the Host schema and the browser scope. */
export interface CompletionSoundSettings {
  /** Master switch: play any sound on turn completion. */
  enabled: boolean
  /** Also raise a desktop notification when a turn finishes. */
  notify: boolean
  /** Playback gain, 0 (silent) through 1 (full). */
  volume: number
  /** Turns lasting at least this many minutes earn long-task handling. */
  longTaskMinutes: number
  /** Play the special long-task music instead of the chime on long turns. */
  special: boolean
  /** File or directory path for the special music; '' selects the bundled sample. */
  specialPath: string
  /** Raise an alert (attention chime + desktop notification) when a card awaits an answer. */
  askAlert: boolean
  /** Re-alert every this many minutes while a card stays unanswered; 0 disables repeating. */
  askRepeatMinutes: number
  /** File or directory for the answer-needed cue; '' plays the synthesized three-note chime. */
  askPath: string
}