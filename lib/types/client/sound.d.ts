/**
 * Prime the audio context on the first user gesture so a later completion
 * cue (which carries no gesture of its own) is allowed to play.
 */
export declare function unlockAudio(): void;
/**
 * Play the completion chime (E5 → A5, gentle attack and exponential decay).
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 */
export declare function playCompletionChime(volume: number): Promise<void>;
/**
 * Play the answer-needed cue (a card is waiting for the user).
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 */
export declare function playAttentionChime(volume: number): Promise<void>;
/**
 * Play the special long-task cue, resolving `specialPath` ('' = bundled
 * sample) through the host.
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 * @param specialPath - the durable `specialPath` setting selecting the cue source.
 * @returns true when playback actually started, false when skipped/stopped/failed.
 */
export declare function playSpecialSound(volume: number, specialPath: string): Promise<boolean>;
/** Stop the special long-task cue immediately (no-op when it is not playing). */
export declare function stopSpecialSound(): void;
/**
 * Play the answer-needed file cue, resolving `askPath` through the host. An
 * empty or unusable selection 404s here, which the caller reads as "fall back
 * to the synthesized cue".
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 * @param askPath - the durable `askPath` setting selecting the cue source.
 * @returns true when playback actually started, false when skipped/stopped/failed.
 */
export declare function playAskSound(volume: number, askPath: string): Promise<boolean>;
/**
 * Stop the answer-needed cue immediately. Called the moment the card is
 * answered, so a long nag never outlives the question it was asking.
 */
export declare function stopAskSound(): void;
//# sourceMappingURL=sound.d.ts.map