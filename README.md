# dsh-completion-sound

A DSH (DeepSeek Harness) completion-sound bundle: plays a chime when an agent turn finishes; plays the special "Guan Yu's Song" music and shows a click-to-stop modal when a long task (≥ 10 minutes by default) finishes; optionally fires a desktop notification (browser notification first, with an automatic fallback to a system notification).

> Package: `@jensentsts/dsh-completion-sound` · Version: `0.1.0` · License: MIT

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
│       ├── index.ts             # Client half: settings binding + completion watch + page registration
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
- **Client half** (`src/client/index.ts`): binds settings, watches turn-completion events, and registers the `settings.section` (id `completion-sound`) dedicated page.

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

## Dependencies

- **dependencies**: runtime value dependencies (`@deepseek-ai/dsh-settings`, `@deepseek-ai/schemastery`, `react`, `react-dom`)
- **peerDependencies**: services provided by the host DSH profile (`@deepseek-ai/cordis`, `dsh-api-remotes`, `dsh-client-*`, `dsh-invariants`), aligned to `0.1.0-rc.6`
- **devDependencies**: type-check and build tooling (TypeScript, tsdown, tsx, lightningcss)

## System notification dependencies

The system-notification fallback requires `notify-send` on Linux (`libnotify-bin`, present on most desktop distros) and the built-in `osascript` on macOS. Browser notifications are used when available, so the fallback is not hit there.

## License

MIT — see [LICENSE](LICENSE).
