import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type CompletionSoundKey } from './locales.ts';
export type { CompletionSoundSectionComponentProps, CompletionSoundSectionInjected } from './CompletionSoundSection.tsx';
export type { CompletionSoundSectionState } from './settings-store.ts';
export type { CompletionSoundKey } from './locales.ts';
export type { CompletionSoundSettings } from '../settings.ts';
/** Namespace owning this feature's settings-section copy. */
export declare const SETTINGS_NS = "settings.completion-sound";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The Completion Sound settings section's copy. */
        'settings.completion-sound': CompletionSoundKey;
    }
}
/** Required services: sessions (completion watch) plus settings/slots/locale for the section. */
export declare const inject: string[];
/**
 * Client plugin body: register the section, prime audio on the first gesture,
 * and watch the sessions list for running → idle transitions.
 * @param ctx - client cordis context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map