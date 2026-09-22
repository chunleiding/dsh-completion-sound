import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createCompletionSoundSectionStore } from './settings-store.ts';
import type { NotificationOutcome } from './notify.ts';
/** Injected business face: the preference writes and preview actions. */
export interface CompletionSoundSectionInjected {
    /** Toggle the master sound switch. */
    setEnabled: (value: boolean) => void;
    /** Toggle the desktop-notification switch (requests permission when enabling). */
    setNotify: (value: boolean) => void;
    /** Set the playback gain (0..1). */
    setVolume: (value: number) => void;
    /** Set the long-task threshold (minutes). */
    setLongTaskMinutes: (value: number) => void;
    /** Toggle the special long-task music switch. */
    setSpecial: (value: boolean) => void;
    /** Set the special-cue file/directory path ('' = bundled). */
    setSpecialPath: (value: string) => void;
    /** Toggle the answer-needed alert (attention chime + notification). */
    setAskAlert: (value: boolean) => void;
    /** Preview the short chime at the given gain. */
    previewChime: (volume: number) => void;
    /** Preview the answer-needed alert chime at the given gain. */
    previewAsk: (volume: number) => void;
    /** Preview the special cue at the given gain (mounts a stop overlay). */
    previewSpecial: (volume: number, specialPath: string) => void;
    /** Fire a sample desktop notification, resolving to the permission outcome. */
    testNotify: () => Promise<NotificationOutcome>;
}
/** Full component props: runtime share + store share + locale seat + injected face. */
export type CompletionSoundSectionComponentProps = PropsRuntime<'settings.section'> & PropsStore<ReturnType<typeof createCompletionSoundSectionStore>> & PropsLocale<'settings.completion-sound'> & CompletionSoundSectionInjected;
/**
 * Render the Completion Sound settings section.
 * @param props - composed slot props.
 * @returns the section, or null while the shell has not injected yet.
 */
export declare function CompletionSoundSection(props: CompletionSoundSectionComponentProps): import("react").JSX.Element | null;
//# sourceMappingURL=CompletionSoundSection.d.ts.map