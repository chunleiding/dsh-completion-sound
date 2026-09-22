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
// Type-only: the ctx.settingsScope Context merge. Cross-plugin collaboration
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
// pendingInteractions source is the roster of cards waiting on the user.
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import {
  COMPLETION_SOUND_SETTINGS_NAMESPACE, DEFAULT_LONG_TASK_MINUTES,
  type CompletionSoundSettings,
} from '../settings.ts'
import type { CompletionSoundSectionInjected } from './CompletionSoundSection.tsx'
import { CompletionSoundSection } from './CompletionSoundSection.tsx'
import { createCompletionSoundSectionStore } from './settings-store.ts'
import { en, zh, NS, type CompletionSoundKey } from './locales.ts'
import { notifyCompletion, requestNotificationPermission, testNotification } from './notify.ts'
import {
  playAttentionChime, playCompletionChime, playSpecialSound, stopSpecialSound, unlockAudio,
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

/** Required services: sessions (completion watch) plus settings/slots/locale for the section. */
export const inject = ['sessions', 'slots', 'locale', 'connection', 'remote', 'settingsScope']

/** Defaults applied until the Host settings section resolves. */
const DEFAULT_SETTINGS: CompletionSoundSettings = Object.freeze({
  enabled: true,
  notify: false,
  volume: 0.5,
  longTaskMinutes: DEFAULT_LONG_TASK_MINUTES,
  special: true,
  specialPath: '',
  askAlert: true,
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
  const scope = ctx.settingsScope.bind<CompletionSoundSettings>({ namespace: COMPLETION_SOUND_SETTINGS_NAMESPACE })

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
    const value = scope.getSnapshot().value
    if (value === undefined) return
    revision += 1
    // Spread over the defaults rather than replacing wholesale: a Host half that
    // predates a newer field (browser refreshed, host not restarted) hands back
    // an object missing it, and a bare replace would turn that field's
    // `undefined` into a silently dead switch.
    settings = { ...DEFAULT_SETTINGS, ...value }
    publish()
  }
  ctx.effect(() => scope.subscribe(adopt), 'ui-completion-sound: settings scope adoption')

  // Optimistic write: reflect locally + in the section store immediately, then
  // persist in the background. A failed persist is reconciled by `adopt`.
  const write = <K extends keyof CompletionSoundSettings>(field: K, value: CompletionSoundSettings[K]): void => {
    settings = { ...settings, [field]: value }
    revision += 1
    publish()
    void scope.set(field, value)
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
  // The Session pending-interaction source is the roster of exactly those cards
  // (one effective entry per session), so diff it by request key: a session
  // appearing, or one whose key changed, is a fresh card. Seeded from the
  // current snapshot so a card already on screen across a page or plugin
  // reload does not cue twice. Read through an optional inject: a profile
  // without the Session UI keeps the completion cue and only loses this one.
  ctx.inject(['uiSession'], (sessionCtx) => {
    // Session id → the request key last observed for it.
    let seen = new Map<string, string>()
    const prime = (): Map<string, string> => {
      const next = new Map<string, string>()
      for (const [id, interaction] of sessionCtx.uiSession.pendingInteractions.getSnapshot()) {
        next.set(id, interaction.key)
      }
      return next
    }
    seen = prime()
    sessionCtx.effect(() => sessionCtx.uiSession.pendingInteractions.subscribe(() => {
      const previous = seen
      seen = prime()
      const list = ctx.sessions.list.getSnapshot()
      const arrivals: { title: string, approving: boolean }[] = []
      for (const [id, interaction] of sessionCtx.uiSession.pendingInteractions.getSnapshot()) {
        if (previous.get(id) === interaction.key) continue
        arrivals.push({ title: list.byId[id]?.displayTitle ?? id, approving: interaction.kind === 'approval' })
      }
      if (arrivals.length === 0 || !settings.askAlert) return
      // Same leader election as the completion cue: one alert per card, not one
      // per open DSH page.
      if (!coordinator.isLeader()) return
      void playAttentionChime(settings.volume)
      const title = arrivals.map(a => a.title).join(', ')
      void notifyCompletion(t(arrivals.some(a => a.approving)
        ? 'completion-sound.askedApproval'
        : 'completion-sound.asked'), title)
    }), 'ui-completion-sound: answer-needed watch')
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
      previewChime: (volume) => { void playCompletionChime(volume) },
      previewAsk: (volume) => { void playAttentionChime(volume) },
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
