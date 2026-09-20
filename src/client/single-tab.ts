/**
 * Cross-tab leader coordinator. DSH serves the same session in multiple open
 * web pages, and the completion cue is driven entirely client-side off the
 * shared session list — so every open tab independently detects a running →
 * idle transition and fires its own copy of the chime and the stop modal. That
 * makes a single completion buzz from every window and forces the user to
 * dismiss each modal separately.
 *
 * To restore "one cue per completion", the open tabs elect a single *leader*
 * tab; only the leader is allowed to play the cue and mount the modal. The
 * leader is re-elected whenever it closes (it clears its claim on `pagehide`)
 * or crashes without cleanup (its claim goes stale after a heartbeat TTL and a
 * follower takes over).
 *
 * Coordination is built on the `localStorage` `storage` event, which fires in
 * every *other* open tab whenever the key changes. It is a dependency-free,
 * one-hop broadcast — effectively the same delivery BroadcastChannel would
 * give, but without the extra API surface. All reads/writes are guarded so the
 * module degrades to "act as leader" when storage is unavailable (private
 * mode, embedded viewers), preserving the single-tab-on-the-current-page
 * behavior the rest of the plugin expects.
 */
const LEADER_KEY = 'dsh-completion-sound:leader'

/** How often the leader refreshes its claim (ms). */
const HEARTBEAT_MS = 2000

/** A leader is presumed dead after this long without a refresh (ms). */
const LEADER_TTL_MS = HEARTBEAT_MS * 2 + 500

/** Stable id for this tab for the lifetime of the page. */
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`

/** The claim record written by the current leader. */
interface LeaderRecord {
  /** Invariant: the tab that wrote the record. */
  tabId: string
  /** Epoch ms of the last refresh. */
  ts: number
  /** Whether the leader tab was visible when it last wrote. */
  visible: boolean
}

/** Whether the browser globals we need are present (false during SSR/build). */
function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/** Read and validate the current leader record, or null when absent/malformed. */
function readLeader(): LeaderRecord | null {
  if (!hasStorage()) return null
  try {
    const raw = localStorage.getItem(LEADER_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as Partial<LeaderRecord>
    if (
      typeof parsed.tabId !== 'string'
      || typeof parsed.ts !== 'number'
      || typeof parsed.visible !== 'boolean'
    ) return null
    return { tabId: parsed.tabId, ts: parsed.ts, visible: parsed.visible }
  } catch {
    return null
  }
}

/** Write our claim (refresh or takeover), stamping the current visibility. */
function writeLeader(visible: boolean): void {
  if (!hasStorage()) return
  try {
    localStorage.setItem(LEADER_KEY, JSON.stringify({ tabId: TAB_ID, ts: Date.now(), visible }))
  } catch {
    // Storage disabled: stay in "act as leader" mode so cues still play.
  }
}

/** Clear our claim (called when a leader tab is unloading). */
function clearLeader(): void {
  if (!hasStorage()) return
  try {
    localStorage.removeItem(LEADER_KEY)
  } catch {
    // Ignore: nothing actionable if storage is unavailable.
  }
}

/**
 * Coordinates a single leader among the browser tabs open on this origin.
 * `isLeader()` reflects the current decision; call `start()` once during
 * plugin setup and `stop()` on teardown.
 */
export class SingleTabCoordinator {
  /** Whether this tab currently holds leadership. Defaults to true until the first election. */
  private leading = true
  private beatTimer: ReturnType<typeof setInterval> | undefined
  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key === LEADER_KEY) this.elect()
  }
  private readonly onVisibility = (): void => {
    // Visibility changes don't fire storage events in other tabs, but they do
    // change which tab should own the cue (the visible one), so re-elect.
    this.elect()
  }
  private readonly onPageHide = (): void => {
    // Only the leader clearing its claim hands over cleanly; a follower has
    // nothing to remove. Removing on unload also covers a crashing leader.
    if (this.leading) clearLeader()
  }

  /**
   * Begin heartbeating and listening for other tabs' claims. The first
   * election runs immediately so `isLeader()` is settled before any cue.
   */
  start(): void {
    if (typeof window === 'undefined') return
    this.elect()
    this.beatTimer = setInterval(() => this.elect(), HEARTBEAT_MS)
    window.addEventListener('storage', this.onStorage)
    window.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('pagehide', this.onPageHide)
  }

  /** Stop heartbeating, detach listeners, and hand the claim to another tab if we held it. */
  stop(): void {
    if (typeof window === 'undefined') return
    if (this.beatTimer !== undefined) {
      clearInterval(this.beatTimer)
      this.beatTimer = undefined
    }
    window.removeEventListener('storage', this.onStorage)
    window.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('pagehide', this.onPageHide)
    if (this.leading) clearLeader()
  }

  /** Whether this tab is currently the elected leader and may fire cues. */
  isLeader(): boolean {
    return this.leading
  }

  /**
   * Re-run the election against the shared claim record.
   *
   * A tie between two tabs that both started without seeing a leader can end
   * with both demoting themselves (each saw the other's claim and yielded),
   * leaving zero leaders and silencing every cue. To prevent that, when both
   * tabs are equally eligible the lower `tabId` always wins — so the conflict
   * resolves to exactly one leader instead of a deadlock.
   */
  private elect(): void {
    const now = Date.now()
    const leader = readLeader()
    const alive = leader !== null && (now - leader.ts) <= LEADER_TTL_MS
    const iAmVisible = typeof document !== 'undefined' && document.visibilityState === 'visible'

    // No live claim: take leadership.
    if (!alive) {
      writeLeader(iAmVisible)
      this.leading = true
      return
    }
    // We already hold the claim: refresh it (and update our visibility).
    if (leader!.tabId === TAB_ID) {
      writeLeader(iAmVisible)
      this.leading = true
      return
    }
    // Another tab holds a live claim. A visible tab is always preferred over a
    // hidden one so the cue lands where the user is looking.
    const otherVisible = leader!.visible
    if (otherVisible === true && iAmVisible !== true) {
      this.leading = false
      return
    }
    if (otherVisible !== true && iAmVisible === true) {
      writeLeader(iAmVisible)
      this.leading = true
      return
    }
    // Same visibility on both: break the tie deterministically by tabId.
    if (leader!.tabId < TAB_ID) {
      this.leading = false
      return
    }
    writeLeader(iAmVisible)
    this.leading = true
  }
}
