# dsh-completion-sound

A DSH (DeepSeek Harness) completion-sound bundle: plays a chime when an agent turn finishes; plays the special "Guan Yu's Song" music and shows a click-to-stop modal when a long task (≥ 10 minutes by default) finishes; optionally fires a desktop notification (browser notification first, with an automatic fallback to a system notification); and raises a separate "I need you" alert when a question / plan-review / approval card is waiting for your answer.

> Package: `@jensentsts/dsh-completion-sound` · Version: `0.4.0` · License: MIT

[English](README.md) | [中文](README.zh.md)

## Settings page

![Completion-sound settings page](img/settings.png)

## Installation

```bash
dsh plugin --profile web add github:jensentsts/dsh-completion-sound
```

Replace `web` with the profile you want to install into. Build artifacts (`lib/`) are committed, so installing from git needs **no** pnpm build authorization (pnpm ≥10 `allowBuilds`); it works right after `dsh plugin add`.

> Pin a commit so later pushes cannot silently change what runs:
> `dsh plugin --profile web add github:jensentsts/dsh-completion-sound#<sha>`

Uninstall:

```bash
dsh plugin --profile web remove @jensentsts/dsh-completion-sound
```

> ⚠️ Installing a plugin runs third-party code on your machine with your own permissions. Review the source before you install.

## Relationship to the built-in completion sound

The `dsh-web-app` bundle ships a built-in completion-sound row (`ui-completion-sound` → `@deepseek-ai/dsh-client-ui-completion-sound`). This bundle's `cordis.patch.yml` **disables that built-in row** and inserts its own row (id `completion-sound`), so when a web profile has both `dsh-web-app` and this plugin, this plugin takes over completion sounds and nothing plays twice. In a profile without `dsh-web-app`, the disable step is silently skipped and the insert still applies.

## Features

- **Completion chime**: a WebAudio-synthesized two-tone chime (E5 → A5) when a turn finishes
- **Answer-needed alert**: when an `ask_user_question`, plan-review, or approval card waits for you, a rising three-note cue (D5 → A5 → D6) plays and a notification is raised — its own switch, independent of the completion cues
- **Persistent nag**: while a card stays unanswered, keep alerting on the configured interval (0 alerts once); **answering it stops the cue instantly**, and switching the alert off mid-wait tears down the running loop
- **Custom nag audio**: point the answer-needed cue at your own audio file, or a directory (one random track per alert); empty or unusable falls back to the synthesized three-note cue, never to the long-task fanfare
- **Long-task special music**: plays special music and shows a modal when a long task finishes; click anywhere to stop
- **Custom special music**: point at a single audio file, or a directory (one random track is picked per play)
- **Bundled audio**: defaults to the bundled "Guan Yu's Song" (`assets/guan-yu.wav`, ~13.5 MB)
- **Configurable long-task threshold**: 1 minute ~ 10080 minutes (7 days)
- **Desktop notification**: optional, cross-platform — browser notification first, automatic fallback to a system notification (macOS `osascript` / Linux `notify-send`)
- **Single cue across tabs**: when DSH is open in several browser tabs/windows, the open tabs elect one leader tab so each completion chimes and shows its modal exactly once — no duplicate buzzes to dismiss separately
- **Dedicated settings page**: everything lives under "Settings → Completion sound"

## Settings

| Field | Description | Default | Range |
| --- | --- | --- | --- |
| `enabled` | completion-sound toggle | `true` | — |
| `notify` | desktop-notification toggle | `false` | — |
| `volume` | volume | `0.5` | 0–1 |
| `longTaskMinutes` | long-task threshold (minutes) | `10` | 1–10080 |
| `special` | play special music on long-task completion | `true` | — |
| `specialPath` | special-music file/directory path (empty = bundled Guan Yu's Song) | `""` | — |
| `askAlert` | alert when a card awaits your answer (chime + notification) | `true` | — |
| `askRepeatMinutes` | re-alert interval while unanswered (minutes, 0 = no repeat) | `3` | 0–1440 |
| `askPath` | answer-needed audio file/directory (empty = synthesized cue) | `""` | — |

## Special music semantics

`specialPath` decides what plays when a long task completes:

- **Empty string** → the bundled `assets/guan-yu.wav`
- **File path** → that file (content-type derived from the extension)
- **Directory path** → recursively scans audio files (`.aac` `.flac` `.m4a` `.mp3` `.oga` `.ogg` `.opus` `.wav` `.webm`, up to 512), picking one at random per play

> The special-music preview button sits to the left of the "music file or directory" input; it commits the path before previewing, so it always previews what is currently typed.

## Directory structure

```
completion-sound/
├── assets/
│   └── guan-yu.wav              # bundled "Guan Yu's Song" (~13.5 MB)
├── img/
│   └── settings.png             # settings-page screenshot
├── src/
│   ├── index.ts                 # Host half: settings schema + audio/notify routes
│   ├── settings.ts              # setting field constants and types
│   ├── invariant.ts             # internal assertions (invariant companion)
│   ├── css-modules.d.ts         # CSS Modules type declarations
│   └── client/
│       ├── index.ts             # Client half: settings binding + completion watch + answer-needed watch + page registration
│       ├── CompletionSoundSection.tsx  # dedicated settings-page component
│       ├── CompletionSoundSection.module.css
│       ├── settings-store.ts    # settings store (defineStore)
│       ├── sound.ts             # WebAudio synth / audio load & play / stop control
│       ├── notify.ts            # desktop notification (browser-first + system fallback)
│       ├── stop-modal.tsx       # click-to-stop modal
│       ├── stop-modal.module.css
│       └── locales.ts           # zh/en strings
├── lib/                         # build artifacts (committed; git install needs no build)
│   ├── index.js                 # Host half
│   ├── invariant.js
│   ├── client.js                # Client half (browser bundle)
│   └── types/**/*.d.ts          # type declarations
├── package.json
├── cordis.patch.yml             # bundle patch (disable built-in row + insert this plugin's row)
├── tsconfig.json
├── tsdown.config.ts
├── LICENSE
├── README.md
└── README.zh.md
```

## Architecture

This plugin is a **DSH bundle**: `package.json`'s `dsh.bundle.patch` points at `cordis.patch.yml`, and it also declares `dsh.client` (platform `web`) so the module loader serves the client half to the browser.

- **Host half** (`src/index.ts`): registers the settings schema and three routes:
  - `/completion-sound/guan-yu.wav` — bundled Guan Yu's Song (memory-cached, served as `audio/wav`)
  - `/completion-sound/special` — serves special music by `specialPath` (empty→bundled; file→served; directory→one random pick, with header `x-dsh-completion-sound-random: 1`)
  - `/completion-sound/notify` — POST system-notification fallback (macOS `osascript` / Linux `notify-send`) for when browser notifications are unavailable
  - `/completion-sound/ask` — serves the answer-needed cue by `askPath` (file→served; directory→one random pick); **404** when empty or unusable so the browser falls back to its synthesized cue
- **Client half** (`src/client/index.ts`): binds settings, watches turn-completion events, registers the `settings.section` (id `completion-sound`) dedicated page, and watches for cards waiting on you.
  - The answer-needed watch: `ctx.uiSession.pendingInteractions` is DSH's single registry of "cards waiting on the user" (the question,
plan-review and approval domains all publish into it), a snapshot source holding the one effective card per session. The plugin diffs both a
newly appearing session and a session whose card was replaced by a newer request key; the first read only records, so reloading the page
never re-alerts a card that was already open. It attaches via `ctx.inject(['uiSession'], …)`, so a profile without the Session UI degrades
quietly and completion sounds keep working.
  - Why a separate watch: while a card is open the turn is still `running`, so the completion watch never fires — "waiting for you" has to be picked up on its own.
  - One record per session (request key, whether it was an approval, and its next re-alert timer) is the single source of truth that announcing, repeating, and stopping all read: a card that is answered, cancelled, or replaced retires its own state first, so the loop can never outlive the question and one card can never stack two timers. The interval is read at arm time, so setting it to 0 or switching the alert off goes quiet before the next firing.
- **Two independent playback slots**: the answer-needed cue and the long-task fanfare each own one, so silencing the nag the instant you answer never cuts off a celebration still playing in the same page. `/completion-sound/ask` returns **404** for an empty or unusable selection (where `/special` falls back to the bundled sample), which is how the browser knows to keep its synthesized cue.

## Building

Build artifacts are committed; ordinary users don't need to build. Developers rebuild after editing `src/`:

```bash
pnpm install
pnpm run build      # tsc -p tsconfig.json && tsdown
pnpm run typecheck  # tsc -p tsconfig.json --noEmit
```

Artifacts (`lib/`, committed):

- `lib/index.js` — host half
- `lib/invariant.js` — invariant companion
- `lib/client.js` — client half (browser bundle)
- `lib/types/**/*.d.ts` — type declarations

`tsdown.config.ts` is self-contained (it inlines the platform module table, the CSS Modules inline plugin, and the `__ModuleLoader__` format); it depends on no monorepo preset.


### Making local edits take effect

Installed with `file:` (a local path), the plugin is **copied** into the profile, not symlinked, so refresh that copy after changing it:

```bash
pnpm run build                                   # rebuild lib/
cd ~/.dsh/profiles/<profile> && pnpm install --force   # refresh the profile's copy
```

Then **restart dsh and reload the browser page**: the Host half needs a restart to register a newly added setting field, and the Client half needs a page reload to re-fetch the bundle. (Reloading without a Host restart still works — a field the older Host doesn't serve falls back to its default.)

## Dependencies

- **dependencies**: runtime value dependencies (`@deepseek-ai/dsh-settings`, `@deepseek-ai/schemastery`, `react`, `react-dom`)
- **peerDependencies**: services provided by the host DSH profile (`@deepseek-ai/cordis`, `dsh-api-remotes`, `dsh-client-*`, `dsh-invariants`), aligned to `0.1.0-rc.6`
- **devDependencies**: type-check and build tooling (TypeScript, tsdown, tsx, lightningcss)

## System notification dependencies

The system-notification fallback requires `notify-send` on Linux (`libnotify-bin`, present on most desktop distros) and the built-in `osascript` on macOS. Browser notifications are used when available, so the fallback is not hit there.

## License

MIT — see [LICENSE](LICENSE).