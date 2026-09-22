/**
 * Completion Sound section slot store: a mirror of the plugin's optimistic
 * local settings snapshot. The plugin's apply-world publisher is the only
 * writer (guarded by a monotonic revision so a stale adoption can't regress
 * the section); the section component reads via props.useStore.
 */
import { type EngineStoreHandle } from '@deepseek-ai/dsh-client-store';
import { type CompletionSoundSettings } from '../settings.ts';
/** Store state mirrored from the optimistic settings snapshot. */
export interface CompletionSoundSectionState {
    /** Master sound switch. */
    enabled: boolean;
    /** Desktop-notification switch. */
    notify: boolean;
    /** Playback gain, 0..1. */
    volume: number;
    /** Long-task threshold in minutes. */
    longTaskMinutes: number;
    /** Play the special long-task music instead of the chime. */
    special: boolean;
    /** User-selected special-cue file/directory path ('' = bundled). */
    specialPath: string;
    /** Raise the answer-needed alert (attention chime + desktop notification). */
    askAlert: boolean;
    /** Re-alert every this many minutes while a card stays unanswered; 0 = once. */
    askRepeatMinutes: number;
    /** Answer-needed audio file/directory ('' = synthesized cue). */
    askPath: string;
    /** A value has been published (defaults or adopted durable section). */
    ready: boolean;
    /** Monotonic guard: drops stale publishes and duplicate adoptions. */
    revision: number;
}
/** Declared action shape giving the exported factory a stable return type. */
type CompletionSoundSectionActions = {
    sync: (draft: CompletionSoundSectionState, settings: CompletionSoundSettings, revision: number) => void;
};
/**
 * Declares the Completion Sound section state and write surface.
 * @returns the store handle.
 */
export declare function createCompletionSoundSectionStore(): EngineStoreHandle<CompletionSoundSectionState, CompletionSoundSectionActions>;
export {};
//# sourceMappingURL=settings-store.d.ts.map