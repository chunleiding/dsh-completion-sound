/**
 * Host half: this entry's live configuration form, the bundled long-task cue
 * asset, and the user-selected special-cue resolver. The special route reads
 * the `specialPath` preference at request time: empty serves the bundled
 * "guan-yu" sample, a file serves itself, and a directory serves one random
 * audio file found within it (bounded recursive scan). An unusable selection
 * falls back to the bundled sample so a completion never loses its cue.
 */
import type { Context, Volatile } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export { COMPLETION_SOUND_ENABLED_FIELD, COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD, COMPLETION_SOUND_NOTIFY_FIELD, COMPLETION_SOUND_NOTIFY_URL, COMPLETION_SOUND_SETTINGS_NAMESPACE, COMPLETION_SOUND_ASK_ALERT_FIELD, COMPLETION_SOUND_SPECIAL_FIELD, COMPLETION_SOUND_SPECIAL_PATH_FIELD, COMPLETION_SOUND_VOLUME_FIELD, DEFAULT_LONG_TASK_MINUTES, DEFAULT_VOLUME, DEFAULT_ASK_REPEAT_MINUTES, GUAN_YU_SOUND_URL, MAX_ASK_REPEAT_MINUTES, MAX_LONG_TASK_MINUTES, MIN_ASK_REPEAT_MINUTES, MIN_LONG_TASK_MINUTES, SPECIAL_SOUND_URL, ASK_SOUND_URL, type CompletionSoundSettings, } from './settings.ts';
/**
 * The live preference references the loader hands `apply`. Each field is a
 * stable reference rather than a value: a settings write lands in the profile
 * patch and the reference keeps serving the new value, so the cue routes need
 * no reload to see it.
 */
export interface Config {
    /** Master switch: play any sound on turn completion. */
    enabled: Volatile<boolean>;
    /** Also raise a desktop notification when a turn finishes. */
    notify: Volatile<boolean>;
    /** Playback gain, 0 (silent) through 1 (full). */
    volume: Volatile<number>;
    /** Turns lasting at least this many minutes earn long-task handling. */
    longTaskMinutes: Volatile<number>;
    /** Play the special long-task music instead of the chime on long turns. */
    special: Volatile<boolean>;
    /** File or directory for the special music; '' selects the bundled sample. */
    specialPath: Volatile<string>;
    /** Alert when a card awaits an answer. */
    askAlert: Volatile<boolean>;
    /** Re-alert interval while a card stays unanswered; 0 disables repeating. */
    askRepeatMinutes: Volatile<number>;
    /** File or directory for the answer-needed cue; '' plays the synthesized chime. */
    askPath: Volatile<string>;
}
/**
 * This entry's configuration schema. Every field is `volatile`, which is what
 * makes it a user-editable settings form: the settings service projects the
 * volatile fields of each loader entry's Config into its page, keyed by the
 * entry id (`completion-sound`), and refuses writes to anything not marked.
 */
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    enabled: z<boolean, boolean, "volatile-defined">;
    notify: z<boolean, boolean, "volatile-defined">;
    volume: z<number, number, "volatile-defined">;
    longTaskMinutes: z<number, number, "volatile-defined">;
    special: z<boolean, boolean, "volatile-defined">;
    specialPath: z<string, string, "volatile-defined">;
    askAlert: z<boolean, boolean, "volatile-defined">;
    askRepeatMinutes: z<number, number, "volatile-defined">;
    askPath: z<string, string, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    enabled: z<boolean, boolean, "volatile-defined">;
    notify: z<boolean, boolean, "volatile-defined">;
    volume: z<number, number, "volatile-defined">;
    longTaskMinutes: z<number, number, "volatile-defined">;
    special: z<boolean, boolean, "volatile-defined">;
    specialPath: z<string, string, "volatile-defined">;
    askAlert: z<boolean, boolean, "volatile-defined">;
    askRepeatMinutes: z<number, number, "volatile-defined">;
    askPath: z<string, string, "volatile-defined">;
}>>, "plain">;
/**
 * Own this entry's page policy and serve the cue routes. The preferences ride
 * the entry Config, so there is nothing to register — the loader validates and
 * resolves them, and each `volatile` field stays live across a settings write.
 * @param ctx - Host context.
 * @param config - validated live completion-sound preferences.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map