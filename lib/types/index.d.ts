/**
 * Host registration for the browser completion-sound preferences, the bundled
 * long-task cue asset, and the user-selected special-cue resolver. The special
 * route reads the durable `specialPath` setting at request time: empty serves
 * the bundled "guan-yu" sample, a file serves itself, and a directory serves
 * one random audio file found within it (bounded recursive scan). An unusable
 * selection falls back to the bundled sample so a completion never loses its
 * cue.
 */
import type { Context } from '@deepseek-ai/cordis';
export { COMPLETION_SOUND_ENABLED_FIELD, COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD, COMPLETION_SOUND_NOTIFY_FIELD, COMPLETION_SOUND_NOTIFY_URL, COMPLETION_SOUND_SETTINGS_NAMESPACE, COMPLETION_SOUND_ASK_ALERT_FIELD, COMPLETION_SOUND_SPECIAL_FIELD, COMPLETION_SOUND_SPECIAL_PATH_FIELD, COMPLETION_SOUND_VOLUME_FIELD, DEFAULT_LONG_TASK_MINUTES, DEFAULT_VOLUME, GUAN_YU_SOUND_URL, MAX_LONG_TASK_MINUTES, MIN_LONG_TASK_MINUTES, SPECIAL_SOUND_URL, type CompletionSoundSettings, } from './settings.ts';
/**
 * Register the durable completion-sound section when a settings provider
 * exists, and serve the bundled cue plus the special-cue resolver when the web
 * server exists.
 * @param ctx - Host context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map