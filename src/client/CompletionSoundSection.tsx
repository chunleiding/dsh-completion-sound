/**
 * Completion Sound settings section registered into the `settings.section`
 * slot: a whole page owning every completion-cue preference. The basic rows
 * (sound switch + chime preview, desktop notification, volume) come first,
 * then the long-task group — duration first, then the special-music switch,
 * then the file/directory path with its preview. Chrome follows the General
 * section vocabulary: title + caption on the left, capsule controls on the
 * right (booleans use the same Menu capsule as PermissionRow), and the
 * preview/test actions use the shared Button primitive.
 */
import { useState } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  MAX_ASK_REPEAT_MINUTES, MAX_LONG_TASK_MINUTES, MIN_LONG_TASK_MINUTES,
} from '../settings.ts'
import type { createCompletionSoundSectionStore } from './settings-store.ts'
import type { NotificationOutcome } from './notify.ts'
import css from './CompletionSoundSection.module.css'

/** Injected business face: the preference writes and preview actions. */
export interface CompletionSoundSectionInjected {
  /** Toggle the master sound switch. */
  setEnabled: (value: boolean) => void
  /** Toggle the desktop-notification switch (requests permission when enabling). */
  setNotify: (value: boolean) => void
  /** Set the playback gain (0..1). */
  setVolume: (value: number) => void
  /** Set the long-task threshold (minutes). */
  setLongTaskMinutes: (value: number) => void
  /** Toggle the special long-task music switch. */
  setSpecial: (value: boolean) => void
  /** Set the special-cue file/directory path ('' = bundled). */
  setSpecialPath: (value: string) => void
  /** Toggle the answer-needed alert (attention chime + notification). */
  setAskAlert: (value: boolean) => void
  /** Set the answer-needed re-alert interval in minutes (0 = alert once). */
  setAskRepeatMinutes: (value: number) => void
  /** Set the answer-needed audio file/directory ('' = synthesized cue). */
  setAskPath: (value: string) => void
  /** Preview the short chime at the given gain. */
  previewChime: (volume: number) => void
  /** Preview the answer-needed cue at the given gain and selection. */
  previewAsk: (volume: number, askPath: string) => void
  /** Preview the special cue at the given gain (mounts a stop overlay). */
  previewSpecial: (volume: number, specialPath: string) => void
  /** Fire a sample desktop notification, resolving to the permission outcome. */
  testNotify: () => Promise<NotificationOutcome>
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type CompletionSoundSectionComponentProps =
  PropsRuntime<'settings.section'> & PropsStore<ReturnType<typeof createCompletionSoundSectionStore>>
  & PropsLocale<'settings.completion-sound'> & CompletionSoundSectionInjected

/** Test-notification state shown in the caption line, including the in-flight state. */
type NotifyTestState = NotificationOutcome | 'pending'

/** Locale key for each test-notification state. */
type NotifyHintKey =
  | 'completion-sound.notifyGranted'
  | 'completion-sound.notifyDenied'
  | 'completion-sound.notifyUnsupported'
  | 'completion-sound.notifyPending'

/** Map a test-notification state to its hint copy (denied/default share one). */
function notifyHintKey(outcome: NotifyTestState): NotifyHintKey {
  if (outcome === 'granted') return 'completion-sound.notifyGranted'
  if (outcome === 'unsupported') return 'completion-sound.notifyUnsupported'
  if (outcome === 'pending') return 'completion-sound.notifyPending'
  return 'completion-sound.notifyDenied'
}

/**
 * A boolean capsule selector in the General-section row vocabulary: the
 * PermissionRow/Feishu settings control, backed by the shared Menu primitive.
 */
function BooleanCapsule({ value, onLabel, offLabel, disabled = false, onSelect }: {
  value: boolean
  onLabel: string
  offLabel: string
  disabled?: boolean
  onSelect: (value: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Menu
      open={open}
      onClose={() => { setOpen(false) }}
      items={[
        { id: 'on', label: onLabel },
        { id: 'off', label: offLabel },
      ]}
      selectedId={value ? 'on' : 'off'}
      onSelect={(id) => {
        setOpen(false)
        onSelect(id === 'on')
      }}
      align="end"
      portal
      anchor={(
        <button
          type="button"
          className={css.selector}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => { setOpen(current => !current) }}
        >
          {value ? onLabel : offLabel}
          <IconChevronDownOutline14 className={css.chevron} />
        </button>
      )}
    />
  )
}

/**
 * Render the Completion Sound settings section.
 * @param props - composed slot props.
 * @returns the section, or null while the shell has not injected yet.
 */
export function CompletionSoundSection(props: CompletionSoundSectionComponentProps) {
  const {
    t, useStore, setEnabled, setNotify, setVolume, setLongTaskMinutes,
    setSpecial, setSpecialPath, setAskAlert, setAskRepeatMinutes, setAskPath,
    previewChime, previewAsk, previewSpecial, testNotify,
  } = props
  if (t === undefined || useStore === undefined) return null

  const enabled = useStore(s => s.enabled)
  const notify = useStore(s => s.notify)
  const volume = useStore(s => s.volume)
  const longTaskMinutes = useStore(s => s.longTaskMinutes)
  const special = useStore(s => s.special)
  const specialPath = useStore(s => s.specialPath)
  const askAlert = useStore(s => s.askAlert)
  const askRepeatMinutes = useStore(s => s.askRepeatMinutes)
  const askPath = useStore(s => s.askPath)
  const percent = Math.round(volume * 100)

  const [notifyOutcome, setNotifyOutcome] = useState<NotifyTestState | null>(null)
  const notifyPending = notifyOutcome === 'pending'

  // Draft buffers: number/path inputs commit on blur/Enter so keystrokes do not
  // spam durable writes, while the preview action flushes a pending path first.
  const [minutesDraft, setMinutesDraft] = useState<string | null>(null)
  const [pathDraft, setPathDraft] = useState<string | null>(null)
  const [askRepeatDraft, setAskRepeatDraft] = useState<string | null>(null)
  const [askPathDraft, setAskPathDraft] = useState<string | null>(null)

  const commitMinutes = (): void => {
    if (minutesDraft === null) return
    const parsed = Number(minutesDraft)
    setMinutesDraft(null)
    if (Number.isFinite(parsed)) {
      setLongTaskMinutes(Math.min(MAX_LONG_TASK_MINUTES, Math.max(MIN_LONG_TASK_MINUTES, Math.round(parsed))))
    }
  }

  const commitPath = (): string => {
    if (pathDraft === null) return specialPath
    const value = pathDraft
    setPathDraft(null)
    setSpecialPath(value)
    return value
  }

  const commitAskRepeat = (): void => {
    if (askRepeatDraft === null) return
    const parsed = Number(askRepeatDraft)
    setAskRepeatDraft(null)
    if (Number.isFinite(parsed)) {
      setAskRepeatMinutes(Math.min(MAX_ASK_REPEAT_MINUTES, Math.max(0, Math.round(parsed))))
    }
  }

  const commitAskPath = (): string => {
    if (askPathDraft === null) return askPath
    const value = askPathDraft
    setAskPathDraft(null)
    setAskPath(value)
    return value
  }

  return (
    <div className={css.section}>
      <h2 className={css.pageTitle}>{t('completion-sound.title')}</h2>
      <p className={css.intro}>{t('completion-sound.subtitle')}</p>

      <div className={css.rows}>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.enabled')}</div>
            <div className={css.desc}>{t('completion-sound.enabledDesc')}</div>
          </div>
          <div className={css.actions}>
            <Button variant="outline" size="sm" disabled={!enabled} onClick={() => { previewChime(volume) }}>
              {t('completion-sound.test')}
            </Button>
            <BooleanCapsule
              value={enabled}
              onLabel={t('completion-sound.on')}
              offLabel={t('completion-sound.off')}
              onSelect={setEnabled}
            />
          </div>
        </div>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.notify')}</div>
            <div className={css.desc} role={notifyOutcome === null ? undefined : 'status'}>
              {notifyOutcome === null ? t('completion-sound.notifyDesc') : t(notifyHintKey(notifyOutcome))}
            </div>
          </div>
          <div className={css.actions}>
            <Button
              variant="outline"
              size="sm"
              disabled={notifyPending}
              onClick={() => {
                // Report the in-flight state immediately: a hanging permission
                // prompt must never make the button look like a silent no-op.
                setNotifyOutcome('pending')
                void testNotify().then(setNotifyOutcome, () => { setNotifyOutcome('denied') })
              }}
            >
              {t('completion-sound.testNotify')}
            </Button>
            <BooleanCapsule
              value={notify}
              onLabel={t('completion-sound.on')}
              offLabel={t('completion-sound.off')}
              onSelect={setNotify}
            />
          </div>
        </div>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.volume')}</div>
            <div className={css.desc}>{t('completion-sound.volumeDesc')}</div>
          </div>
          <div className={css.volumeControls}>
            <label className={css.volumeLine}>
              <input
                className={css.volumeSlider}
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                aria-label={t('completion-sound.volume')}
                onChange={e => { setVolume(Number(e.target.value)) }}
              />
              <span className={css.volumeValue}>{percent}%</span>
            </label>
          </div>
        </div>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.askAlert')}</div>
            <div className={css.desc}>{t('completion-sound.askAlertDesc')}</div>
          </div>
          <div className={css.actions}>
            <Button variant="outline" size="sm" disabled={!askAlert} onClick={() => { previewAsk(volume, commitAskPath()) }}>
              {t('completion-sound.testAsk')}
            </Button>
            <BooleanCapsule
              value={askAlert}
              onLabel={t('completion-sound.on')}
              offLabel={t('completion-sound.off')}
              onSelect={setAskAlert}
            />
          </div>
        </div>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.askRepeat')}</div>
            <div className={css.desc}>{t('completion-sound.askRepeatDesc')}</div>
          </div>
          <label className={css.fieldLine}>
            <input
              className={`${css.fieldInput} ${css.numberInput}`}
              type="number"
              min={0}
              max={MAX_ASK_REPEAT_MINUTES}
              step={1}
              value={askRepeatDraft ?? String(askRepeatMinutes)}
              disabled={!askAlert}
              aria-label={t('completion-sound.askRepeat')}
              onChange={e => { setAskRepeatDraft(e.target.value) }}
              onBlur={commitAskRepeat}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            />
            <span className={css.fieldUnit}>{t('completion-sound.minutesUnit')}</span>
          </label>
        </div>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.askPath')}</div>
            <div className={css.desc}>{t('completion-sound.askPathDesc')}</div>
          </div>
          <input
            className={`${css.fieldInput} ${css.pathInput}`}
            type="text"
            value={askPathDraft ?? askPath}
            disabled={!askAlert}
            placeholder={t('completion-sound.askPathPlaceholder')}
            aria-label={t('completion-sound.askPath')}
            onChange={e => { setAskPathDraft(e.target.value) }}
            onBlur={() => { commitAskPath() }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
          />
        </div>
      </div>

      <h4 className={css.groupTitle}>{t('completion-sound.longTaskGroup')}</h4>
      <div className={css.rows}>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.longTaskMinutes')}</div>
            <div className={css.desc}>{t('completion-sound.longTaskMinutesDesc')}</div>
          </div>
          <label className={css.fieldLine}>
            <input
              className={`${css.fieldInput} ${css.numberInput}`}
              type="number"
              min={MIN_LONG_TASK_MINUTES}
              max={MAX_LONG_TASK_MINUTES}
              step={1}
              value={minutesDraft ?? String(longTaskMinutes)}
              aria-label={t('completion-sound.longTaskMinutes')}
              onChange={e => { setMinutesDraft(e.target.value) }}
              onBlur={commitMinutes}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            />
            <span className={css.fieldUnit}>{t('completion-sound.minutesUnit')}</span>
          </label>
        </div>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.special')}</div>
            <div className={css.desc}>{t('completion-sound.specialDesc')}</div>
          </div>
          <BooleanCapsule
            value={special}
            onLabel={t('completion-sound.on')}
            offLabel={t('completion-sound.off')}
            onSelect={setSpecial}
          />
        </div>
        <div className={css.row}>
          <div className={css.rowText}>
            <div className={css.title}>{t('completion-sound.specialPath')}</div>
            <div className={css.desc}>{t('completion-sound.specialPathDesc')}</div>
          </div>
          <div className={css.actions}>
            <Button
              variant="outline"
              size="sm"
              disabled={!special}
              onClick={() => { previewSpecial(volume, commitPath()) }}
            >
              {t('completion-sound.testSpecial')}
            </Button>
            <input
              className={`${css.fieldInput} ${css.pathInput}`}
              type="text"
              value={pathDraft ?? specialPath}
              disabled={!special}
              placeholder={t('completion-sound.specialPathPlaceholder')}
              aria-label={t('completion-sound.specialPath')}
              onChange={e => { setPathDraft(e.target.value) }}
              onBlur={() => { commitPath() }}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}