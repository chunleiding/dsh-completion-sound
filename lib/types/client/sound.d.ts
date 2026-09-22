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
 * Stop the special cue immediately (no-op when it is not playing). Also
 * cancels any in-flight load that would otherwise start after the stop.
 */
export declare function stopSpecialSound(): void;
/**
 * Play the special long-task cue at the given gain, resolving `specialPath`
 * ('' = bundled sample) through the host.
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 * @param specialPath - the durable `specialPath` setting selecting the cue source.
 * @returns true when playback actually started, false when skipped/stopped/failed.
 */
export declare function playSpecialSound(volume: number, specialPath: string): Promise<boolean>;
//# sourceMappingURL=sound.d.ts.map