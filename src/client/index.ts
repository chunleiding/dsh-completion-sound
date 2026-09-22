/**
 * Completion-sound plugin, browser half: watches the sessions list mirror and
 * fires a completion cue (a WebAudio chime for short turns, the special
 * long-task music for turns that ran at least `longTaskMinutes`, and optionally
 * a desktop notification) whenever a session's `running` flag flips true →
 * false. When the special long-task music is enabled it mounts a dismissable
 * in-page modal whose click stops playback immediately. Also registers the
 * feature-owned Completion Sound page into the settings `settings.section`
 * slot — the feature owns its settings surface.
 */
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: the ctx.configForms Context merge. Cross-plugin collaboration
// goes through the service, never a value import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the renderer's Context merge (ctx.slots). The retired
// dsh-client-runtime used to re-export a merged `ClientContext` that carried
// this; the client context now composes from the owning packages directly.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the session controller's Context merge (ctx.sessions).
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
// Type-only: pulls the Session UI's Context merge (ctx.uiSession), whose
// sessionStatus source carries each session's pending interaction — the roster
// of cards waiting on the user. The branded Session id key type is derived off
// the interaction rather than imported from the Session package, so this bundle
// names no extra dependency.
import type { SessionPendingInteraction } from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import {
  COMPLETION_SOUND_SETTINGS_NAMESPACE, DEFAULT_ASK_REPEAT_MINUTES, DEFAULT_LONG_TASK_MINUTES,
  type CompletionSoundSettings,
} from '../settings.ts'
import type { CompletionSoundSectionInjected } from './CompletionSoundSection.tsx'
import { CompletionSoundSection } from './CompletionSoundSection.tsx'
import { createCompletionSoundSectionStore } from './settings-store.ts'
import { en, zh, NS, type CompletionSoundKey } from './locales.ts'
import { notifyCompletion, requestNotificationPermission, testNotification } from './notify.ts'
import {
  playAskSound, playAttentionChime, playCompletionChime, playSpecialSound,
  stopAskSound, stopSpecialSound, unlockAudio,
} from './sound.ts'
import { closeStopModal, showStopModal } from './stop-modal.tsx'
import { SingleTabCoordinator } from './single-tab.ts'

export type { CompletionSoundSectionComponentProps, CompletionSoundSectionInjected } from './CompletionSoundSection.tsx'
export type { CompletionSoundSectionState } from './settings-store.ts'
export type { CompletionSoundKey } from './locales.ts'
export type { CompletionSoundSettings } from '../settings.ts'

/** Namespace owning this feature's settings-section copy. */
export const SETTINGS_NS = NS

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Completion Sound settings section's copy. */
    'settings.completion-sound': CompletionSoundKey
  }
}

/** Required services: sessions (completion watch) plus config forms/slots/locale for the section. */
export const inject = ['sessions', 'slots', 'locale', 'configForms']

/** Defaults applied until the Host settings section resolves. */
const DEFAULT_SETTINGS: CompletionSoundSettings = Object.freeze({
  enabled: true,
  notify: false,
  volume: 0.5,
  longTaskMinutes: DEFAULT_LONG_TASK_MINUTES,
  special: true,
  specialPath: '',
  askAlert: true,
  askRepeatMinutes: DEFAULT_ASK_REPEAT_MINUTES,
  askPath: '',
})

/** Turn duration (ms) that earns the long-task cue instead of the short chime. */
function longTaskMs(settings: CompletionSoundSettings): number {
  return settings.longTaskMinutes * 60_000
}

/**
 * Client plugin body: register the section, prime audio on the first gesture,
 * watch the sessions list for running → idle transitions, and watch the Session
 * pending-interaction source for cards that need an answer.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  const form = ctx.configForms.get<CompletionSoundSettings>(COMPLETION_SOUND_SETTINGS_NAMESPACE)

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-completion-sound: settings section dictionaries')

  // Prime the audio context on the first gesture so a completion cue plays
  // even though the completion itself carries no user gesture.
  if (typeof window !== 'undefined') {
    ctx.effect(() => {
      window.addEventListener('pointerdown', unlockAudio)
      window.addEventListener('keydown', unlockAudio)
      return () => {
        window.removeEventListener('pointerdown', unlockAudio)
        window.removeEventListener('keydown', unlockAudio)
      }
    }, 'ui-completion-sound: audio unlock')
  }

  const t = ctx.locale.bind(NS)

  // Elect a single leader tab so a completion cue (and its stop modal) plays
  // exactly once even when DSH is open in several browser tabs/windows. Only
  // the leader reacts to the completion watch below; every other tab stays
  // silent. Without cross-tab storage (private mode, embedded viewers) the
  // coordinator defaults to "leader", so cues still play on the single page.
  const coordinator = new SingleTabCoordinator()
  ctx.effect(() => {
    coordinator.start()
    return () => coordinator.stop()
  }, 'ui-completion-sound: single-tab leader election')

  /**
   * Start the special long-task cue and mount a dismissable overlay whose click
   * stops playback immediately (window.alert can't: it blocks JS, so the cue
   * would keep playing). Volume ≤ 0 skips both sound and modal.
   */
  const playSpecialWithStop = (volume: number, specialPath: string): void => {
    if (volume <= 0) return
    showStopModal({
      title: t('completion-sound.modalTitle'),
      body: t('completion-sound.modalBody'),
      stopLabel: t('completion-sound.modalStop'),
      onStop: () => { stopSpecialSound() },
    })
    void playSpecialSound(volume, specialPath).then((started) => {
      if (!started) closeStopModal()
    })
  }

  // Optimistic local settings snapshot + monotonic revision guard. Writes reflect
  // in the section store synchronously (no round-trip) and persist in the
  // background; `adopt` reconciles the durable section and any external write.
  let settings: CompletionSoundSettings = { ...DEFAULT_SETTINGS }
  let revision = 0

  const store = createCompletionSoundSectionStore()
  let bound: BoundActions<typeof store> | undefined
  const publish = (): void => { bound?.sync(settings, revision) }

  // Adopt the durable section (initial load + external writes). Scope change
  // always wins: bump revision so the store's guard never drops it.
  const adopt = (): void => {
    const value = form.getSnapshot().value
    if (value === undefined) return
    revision += 1
    // Spread over the defaults rather than replacing wholesale: a Host half that
    // predates a newer field (browser refreshed, host not restarted) hands back
    // an object missing it, and a bare replace would turn that field's
    // `undefined` into a silently dead switch.
    settings = { ...DEFAULT_SETTINGS, ...value }
    publish()
  }
  ctx.effect(() => form.subscribe(adopt), 'ui-completion-sound: config form adoption')

  // Optimistic write: reflect locally + in the section store immediately, then
  // persist in the background. A failed persist is reconciled by `adopt`.
  const write = <K extends keyof CompletionSoundSettings>(field: K, value: CompletionSoundSettings[K]): void => {
    settings = { ...settings, [field]: value }
    revision += 1
    publish()
    // A refused or lost write is not an error the switch can act on: the next
    // `adopt` reconciles the row from the Host, so the rejection is swallowed
    // here rather than surfacing as an unhandled promise rejection.
    form.set(field, value).catch(() => {})
  }

  // Completion watch: diff each session's `running` flag across list snapshots,
  // timing each run so short turns get the chime and long tasks get the special
  // cue (when enabled). Session id → wall-clock ms the run started.
  const running = new Map<string, number>()
  ctx.effect(() => ctx.sessions.list.subscribe(() => {
    const snapshot = ctx.sessions.list.getSnapshot()
    const now = Date.now()
    const finished: { title: string, elapsedMs: number }[] = []
    const next = new Map<string, number>()
    for (const id of snapshot.ids) {
      const summary = snapshot.byId[id]
      const isRunning = summary?.running ?? false
      const startedAt = running.get(id)
      if (isRunning) {
        next.set(id, startedAt ?? now)
      } else if (startedAt !== undefined) {
        finished.push({ title: summary?.displayTitle ?? id, elapsedMs: now - startedAt })
      }
    }
    running.clear()
    for (const [id, startedAt] of next) running.set(id, startedAt)
    if (finished.length === 0) return
    // Only the elected leader tab actually plays the cue; the others observed
    // the same transition but must stay silent to avoid duplicate buzzes and
    // modals across open DSH pages for one completion.
    if (!coordinator.isLeader()) return
    const title = finished.map(f => f.title).join(', ')
    if (settings.enabled) {
      const longTask = finished.some(f => f.elapsedMs >= longTaskMs(settings))
      if (longTask && settings.special) playSpecialWithStop(settings.volume, settings.specialPath)
      else void playCompletionChime(settings.volume)
    }
    if (settings.notify) void notifyCompletion(t('completion-sound.notified'), title)
  }), 'ui-completion-sound: sessions completion watch')

  // Answer-needed watch: `ask_user_question`, a plan review, or an approval
  // prompt blocks the turn until the user answers, and the session stays
  // `running` the whole time — so the completion watch above is silent for it.
  // The Session UI's status source carries each session's highest-precedence
  // `pendingInteraction`, which is the roster of exactly those cards (one
  // effective entry per session), so this is the only place that can see them.
  // `awaiting` is the single record of what has been announced per
  // session — its request key, its kind, and its pending re-alert timer — so
  // announcing, repeating, and stopping all read one truth instead of racing a
  // second dedupe map. Read through an optional inject: a profile without the
  // Session UI keeps the completion cue and only loses this one.
  ctx.inject(['uiSession'], (sessionCtx) => {
    type PendingId = SessionPendingInteraction['sessionId']
    /** Per-session announcement state, keyed by Session id. */
    interface Awaiting {
      /** Request key last announced for this session. */
      key: string
      /** Whether the card was an approval (picks the notification copy). */
      approving: boolean
      /** Pending re-alert timer, or null when repeating is off or unanswered-quiet. */
      timer: ReturnType<typeof setTimeout> | null
    }
    const awaiting = new Map<PendingId, Awaiting>()

    /** The card one session is currently waiting on, if any. */
    const pendingOf = (id: PendingId): SessionPendingInteraction | undefined =>
      sessionCtx.uiSession.sessionStatus.getSnapshot().get(id)?.pendingInteraction

    /** Play the answer-needed cue: the selected file when usable, else the synthesized chime. */
    const playAskCue = (): void => {
      const volume = settings.volume
      if (settings.askPath === '') {
        void playAttentionChime(volume)
        return
      }
      // A long nag must not outlive the question: the slot is stopped on answer.
      // An empty or broken selection 404s through the ask route, so fall back to
      // the synthesized cue rather than lose the alert entirely.
      void playAskSound(volume, settings.askPath).then((started) => {
        if (!started) void playAttentionChime(volume)
      })
    }

    /** Raise one alert — cue plus notification — for the given waiting sessions. */
    const announce = (ids: PendingId[], repeated: boolean): void => {
      if (ids.length === 0 || !settings.askAlert) return
      // Same leader election as the completion cue: one alert per card, not one
      // per open DSH page.
      if (!coordinator.isLeader()) return
      const list = ctx.sessions.list.getSnapshot()
      const titles = ids.map(id => list.byId[id]?.displayTitle ?? id).join(', ')
      const approving = ids.some(id => awaiting.get(id)?.approving ?? false)
      const titleKey = approving
        ? (repeated ? 'completion-sound.askedApprovalAgain' : 'completion-sound.askedApproval')
        : (repeated ? 'completion-sound.askedAgain' : 'completion-sound.asked')
      playAskCue()
      void notifyCompletion(t(titleKey), titles)
    }

    /** (Re)arm the re-alert timer for one session, if repeating is switched on. */
    const armRepeat = (id: PendingId): void => {
      const entry = awaiting.get(id)
      if (entry === undefined) return
      if (entry.timer !== null) clearTimeout(entry.timer)
      entry.timer = null
      // Read the interval at arm time, so turning repeating off stops the loop at
      // the next firing without touching any already-open card.
      if (settings.askRepeatMinutes <= 0) return
      entry.timer = setTimeout(() => {
        entry.timer = null
        const interaction = pendingOf(id)
        // The card may have been answered, replaced, or handed to another tab in
        // the meantime; only a still-open card with the same key keeps nagging.
        if (interaction === undefined || interaction.key !== entry.key) return
        announce([id], true)
        armRepeat(id)
      }, settings.askRepeatMinutes * 60_000)
    }

    /** Drop one session's announcement entirely (answered, cancelled, or replaced). */
    const retire = (id: PendingId): void => {
      const entry = awaiting.get(id)
      if (entry === undefined) return
      if (entry.timer !== null) clearTimeout(entry.timer)
      awaiting.delete(id)
      // Silence a long nag once nothing is outstanding any more. Answering one of
      // several open cards leaves the others still asking, so the cue keeps going.
      if (awaiting.size === 0) stopAskSound()
    }

    const observe = (): void => {
      const snapshot = sessionCtx.uiSession.sessionStatus.getSnapshot()
      // Retire anything no longer outstanding, or superseded by a newer request,
      // before deciding what is new — so a replaced card stops its old nag and is
      // then announced afresh, rather than stacking a second timer on it.
      for (const [id, entry] of [...awaiting]) {
        const interaction = snapshot.get(id)?.pendingInteraction
        if (interaction === undefined || interaction.key !== entry.key) retire(id)
      }
      const arrivals: PendingId[] = []
      for (const [id, status] of snapshot) {
        const interaction = status.pendingInteraction
        // The status source also reports running/completion facts, so most rows
        // carry no card at all.
        if (interaction === undefined || awaiting.has(id)) continue
        awaiting.set(id, {
          key: interaction.key,
          approving: interaction.kind === 'approval',
          timer: null,
        })
        arrivals.push(id)
      }
      if (!settings.askAlert) {
        // Switching the alert off mid-wait must silence the loop, not leave timers
        // running to fire after the user opted out.
        for (const id of [...awaiting.keys()]) retire(id)
        return
      }
      announce(arrivals, false)
      for (const id of arrivals) armRepeat(id)
    }

    // A card already on screen when this page (or plugin) starts was announced by
    // whoever was alive when it appeared: record it so a reload never re-alerts.
    for (const [id, status] of sessionCtx.uiSession.sessionStatus.getSnapshot()) {
      const interaction = status.pendingInteraction
      if (interaction === undefined) continue
      awaiting.set(id, { key: interaction.key, approving: interaction.kind === 'approval', timer: null })
    }
    sessionCtx.effect(() => {
      const unsubscribe = sessionCtx.uiSession.sessionStatus.subscribe(observe)
      return () => {
        unsubscribe()
        for (const id of [...awaiting.keys()]) retire(id)
      }
    }, 'ui-completion-sound: answer-needed watch')
  })

  // Settings section. The injected face drives the store through the optimistic
  // `write`/`publish` path; the store is re-primed on registration so no local
  // change is lost between service construction and first render.
  const injected = (actions: BoundActions<typeof store>): CompletionSoundSectionInjected => {
    bound = actions
    publish()
    return {
      setEnabled: (value) => { write('enabled', value) },
      setNotify: (value) => {
        if (value) requestNotificationPermission()
        write('notify', value)
      },
      setVolume: (value) => { write('volume', value) },
      setLongTaskMinutes: (value) => { write('longTaskMinutes', value) },
      setSpecial: (value) => { write('special', value) },
      setSpecialPath: (value) => { write('specialPath', value) },
      setAskAlert: (value) => {
        if (value) requestNotificationPermission()
        write('askAlert', value)
      },
      setAskRepeatMinutes: (value) => { write('askRepeatMinutes', value) },
      setAskPath: (value) => { write('askPath', value) },
      previewChime: (volume) => { void playCompletionChime(volume) },
      previewAsk: (volume, askPath) => {
        if (askPath === '') { void playAttentionChime(volume); return }
        void playAskSound(volume, askPath).then((started) => {
          if (!started) void playAttentionChime(volume)
        })
      },
      previewSpecial: (volume, specialPath) => { playSpecialWithStop(volume, specialPath) },
      testNotify: () => testNotification(t('completion-sound.notified'), t('completion-sound.notifyTestBody')),
    }
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'completion-sound',
    order: 30,
    label: () => t('completion-sound.nav'),
    store,
    locale: NS,
    inject: injected,
  }, CompletionSoundSection))
}