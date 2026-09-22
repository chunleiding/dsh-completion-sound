/**
 * WebAudio completion cues: a soft two-note "done" ding synthesized in the
 * browser, plus the long-task ("special") sample served by the host. The
 * bundled "guan-yu" sample is decoded once and cached; a user-selected file is
 * cached per path (small LRU), while a directory selection is never cached —
 * the host serves one random audio file per request, which it marks with the
 * `x-dsh-completion-sound-random` header. A single shared AudioContext is
 * created lazily and resumed on demand so autoplay policy never blocks a cue
 * (the page has already seen a user gesture by the time a turn ends). The
 * special sample supports immediate stop so a user can silence it the moment
 * it starts.
 */
import { ASK_SOUND_URL, GUAN_YU_SOUND_URL, SPECIAL_SOUND_URL } from '../settings.ts'

let audioContext: AudioContext | null = null

/** Create (or return) the shared context, resuming it if it is suspended. */
function context(): AudioContext {
  if (audioContext === null) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch(() => {})
  }
  return audioContext
}

/**
 * Prime the audio context on the first user gesture so a later completion
 * cue (which carries no gesture of its own) is allowed to play.
 */
export function unlockAudio(): void {
  context()
}

/** One synthesized cue note: frequency in Hz and its start offset in seconds. */
type CueNote = readonly [frequency: number, offset: number]

/** The completion chime: a soft rising E5 → A5. */
const CHIME_NOTES: readonly CueNote[] = [[659.25, 0], [880, 0.15]]

/**
 * The answer-needed cue: three short rising notes (D5 → A5 → D6). Distinct
 * enough from the completion chime to read as "I need you", not "I am done".
 */
const ATTENTION_NOTES: readonly CueNote[] = [[587.33, 0], [880, 0.12], [1174.66, 0.24]]

/**
 * Schedule one sine cue: each note gets a fast attack and an exponential
 * decay. Audio trouble (autoplay denied, no output device) degrades silently —
 * a missing cue must never break the completion path.
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 * @param notes - the cue's notes, in play order.
 * @param decay - per-note decay in seconds.
 */
async function playCue(volume: number, notes: readonly CueNote[], decay = 0.4): Promise<void> {
  if (volume <= 0) return
  try {
    const ctx = context()
    if (ctx.state === 'suspended') await ctx.resume()
    const peak = Math.min(1, Math.max(0, volume))
    const start = ctx.currentTime
    for (const [frequency, offset] of notes) {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      const when = start + offset
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, when)
      gain.gain.exponentialRampToValueAtTime(peak, when + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, when + decay)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(when)
      oscillator.stop(when + decay + 0.05)
    }
  } catch {
    // Audio unavailable: degrade silently.
  }
}

/**
 * Play the completion chime (E5 → A5, gentle attack and exponential decay).
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 */
export function playCompletionChime(volume: number): Promise<void> {
  return playCue(volume, CHIME_NOTES)
}

/**
 * Play the answer-needed cue (a card is waiting for the user).
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 */
export function playAttentionChime(volume: number): Promise<void> {
  return playCue(volume, ATTENTION_NOTES, 0.3)
}

/** Decoded bundled sample, cached after the first successful load. */
let bundledBuffer: AudioBuffer | null = null

/** In-flight bundled decode, deduped so concurrent completions share one fetch/decode. */
let bundledLoadPromise: Promise<AudioBuffer> | null = null

/** Fetch and decode the bundled long-task sample once, retrying on failure. */
async function loadBundled(ctx: AudioContext): Promise<AudioBuffer> {
  if (bundledBuffer !== null) return bundledBuffer
  if (bundledLoadPromise === null) {
    bundledLoadPromise = (async () => {
      const response = await fetch(GUAN_YU_SOUND_URL)
      if (!response.ok) throw new Error(`completion-sound: bundled cue HTTP ${response.status}`)
      return await ctx.decodeAudioData(await response.arrayBuffer())
    })().then((buffer) => {
      bundledBuffer = buffer
      return buffer
    })
  }
  try {
    return await bundledLoadPromise
  } catch (error) {
    bundledLoadPromise = null
    throw error
  }
}

/** Decoded user-selected samples, keyed by the setting's `specialPath` (small LRU). */
const customBufferCache = new Map<string, AudioBuffer>()

/** Maximum entries retained in {@link customBufferCache}. */
const CUSTOM_CACHE_MAX = 4

/** Whether a response was a directory-random pick (the host never reuses it). */
function isRandomPick(response: Response): boolean {
  return response.headers.get('x-dsh-completion-sound-random') === '1'
}

/**
 * Fetch and decode a file cue for one selected path through `route`. Empty
 * selects the bundled sample (the long-task route only — the answer-needed
 * route 404s an empty or unusable selection so the caller keeps its
 * synthesized cue). A file is cached per path, while a directory selection (the
 * host's per-request random pick) is decoded fresh every time. The cache is
 * keyed by the raw selection, which both routes share, because a given file
 * holds the same bytes whichever route serves it.
 */
async function loadFileCue(ctx: AudioContext, path: string, route: string, bundledOnEmpty: boolean): Promise<AudioBuffer> {
  if (path === '' && bundledOnEmpty) return loadBundled(ctx)
  const cached = customBufferCache.get(path)
  if (cached !== undefined) return cached
  const response = await fetch(route)
  if (!response.ok) throw new Error(`completion-sound: cue HTTP ${response.status}`)
  const buffer = await ctx.decodeAudioData(await response.arrayBuffer())
  if (!isRandomPick(response)) {
    customBufferCache.set(path, buffer)
    if (customBufferCache.size > CUSTOM_CACHE_MAX) {
      const oldest = customBufferCache.keys().next().value as string | undefined
      if (oldest !== undefined) customBufferCache.delete(oldest)
    }
  }
  return buffer
}

/**
 * One independently stoppable file-cue playback slot. The long-task fanfare and
 * the answer-needed cue each own one: silencing the nag the moment the user
 * answers must never cut off an unrelated long-task celebration still playing
 * in the same page.
 */
interface CueSlot {
  /** Currently playing source, or null when the slot is idle. */
  source: AudioBufferSourceNode | null
  /** Bumped on stop so an in-flight load cannot start after its cue was cancelled. */
  epoch: number
}

/** The long-task cue slot. */
const specialSlot: CueSlot = { source: null, epoch: 0 }

/** The answer-needed file-cue slot. */
const askSlot: CueSlot = { source: null, epoch: 0 }

/** Stop one slot immediately (no-op when idle) and cancel any in-flight load. */
function stopSlot(slot: CueSlot): void {
  slot.epoch += 1
  if (slot.source !== null) {
    try {
      slot.source.stop()
    } catch {
      // Source already finished: the onended handler clears the slot.
    }
    slot.source = null
  }
}

/**
 * Play a file cue through one slot at the given gain.
 * @param slot - the playback slot owning (and stopping) this cue.
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 * @param path - the durable selection naming the cue source.
 * @param route - the host route resolving that selection to bytes.
 * @param bundledOnEmpty - whether an empty selection means the bundled sample.
 * @returns true when playback actually started, false when skipped/stopped/failed.
 */
async function playSlot(slot: CueSlot, volume: number, path: string, route: string, bundledOnEmpty: boolean): Promise<boolean> {
  if (volume <= 0) return false
  const epoch = slot.epoch
  try {
    const ctx = context()
    if (ctx.state === 'suspended') await ctx.resume()
    const buffer = await loadFileCue(ctx, path, route, bundledOnEmpty)
    if (epoch !== slot.epoch) return false
    if (slot.source !== null) {
      try { slot.source.stop() } catch { /* ignore */ }
    }
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    gain.gain.value = Math.min(1, Math.max(0, volume))
    source.buffer = buffer
    source.onended = () => {
      if (slot.source === source) slot.source = null
    }
    source.connect(gain)
    gain.connect(ctx.destination)
    slot.source = source
    source.start()
    return true
  } catch {
    // Asset missing, route 404, or audio unavailable: the caller decides the fallback.
    return false
  }
}

/**
 * Play the special long-task cue, resolving `specialPath` ('' = bundled
 * sample) through the host.
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 * @param specialPath - the durable `specialPath` setting selecting the cue source.
 * @returns true when playback actually started, false when skipped/stopped/failed.
 */
export function playSpecialSound(volume: number, specialPath: string): Promise<boolean> {
  return playSlot(specialSlot, volume, specialPath, SPECIAL_SOUND_URL, true)
}

/** Stop the special long-task cue immediately (no-op when it is not playing). */
export function stopSpecialSound(): void {
  stopSlot(specialSlot)
}

/**
 * Play the answer-needed file cue, resolving `askPath` through the host. An
 * empty or unusable selection 404s here, which the caller reads as "fall back
 * to the synthesized cue".
 * @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
 * @param askPath - the durable `askPath` setting selecting the cue source.
 * @returns true when playback actually started, false when skipped/stopped/failed.
 */
export function playAskSound(volume: number, askPath: string): Promise<boolean> {
  return playSlot(askSlot, volume, askPath, ASK_SOUND_URL, false)
}

/**
 * Stop the answer-needed cue immediately. Called the moment the card is
 * answered, so a long nag never outlives the question it was asking.
 */
export function stopAskSound(): void {
  stopSlot(askSlot)
}