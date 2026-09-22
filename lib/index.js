import { spawn } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import z from "@deepseek-ai/schemastery";
//#region lib/types/settings.js
/**
* Completion-sound preferences stored in the Host user-settings document.
* Schema-free on purpose: the schema (which needs schemastery) lives in the
* node half, so the browser bundle never inlines it. This module carries only
* the namespace identity, the field names, and the shared section type.
*/
/** Settings namespace owned by the completion-sound plugin. */
const COMPLETION_SOUND_SETTINGS_NAMESPACE = "completion-sound";
/** Field carrying the master sound switch. */
const COMPLETION_SOUND_ENABLED_FIELD = "enabled";
/** Field carrying the desktop-notification switch. */
const COMPLETION_SOUND_NOTIFY_FIELD = "notify";
/** Field carrying the playback gain (0..1). */
const COMPLETION_SOUND_VOLUME_FIELD = "volume";
/** Field carrying the long-task threshold in minutes. */
const COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD = "longTaskMinutes";
/** Field carrying the special long-task music switch. */
const COMPLETION_SOUND_SPECIAL_FIELD = "special";
/** Field carrying the user-selected special-cue file/directory path ('' = bundled). */
const COMPLETION_SOUND_SPECIAL_PATH_FIELD = "specialPath";
/** Field carrying the answer-needed alert switch. */
const COMPLETION_SOUND_ASK_ALERT_FIELD = "askAlert";
/** Default playback gain (0..1) when the user-settings document has no override. */
const DEFAULT_VOLUME = .5;
/** Default long-task threshold (minutes). */
const DEFAULT_LONG_TASK_MINUTES = 10;
/** Minimum long-task threshold (minutes). */
const MIN_LONG_TASK_MINUTES = 1;
/** Maximum long-task threshold (minutes) — seven days. */
const MAX_LONG_TASK_MINUTES = 10080;
/** Web route the node half serves the bundled long-task ("guan-yu") cue under. */
const GUAN_YU_SOUND_URL = "/completion-sound/guan-yu.wav";
/**
* Web route the node half serves the special long-task cue under. The resolver
* reads the `specialPath` setting at request time: empty selects the bundled
* sample, a file serves itself, and a directory serves one random audio file.
*/
const SPECIAL_SOUND_URL = "/completion-sound/special";
/**
* Web route the node half serves the Host-side OS-notification fallback under.
* The browser Notification API is the primary channel; this POST route lets the
* client ask the local process to raise an OS notification (osascript on macOS,
* notify-send on Linux) when the browser channel is missing or blocked.
*/
const COMPLETION_SOUND_NOTIFY_URL = "/completion-sound/notify";
//#endregion
//#region lib/types/index.js
/**
* Host registration for the browser completion-sound preferences, the bundled
* long-task cue asset, and the user-selected special-cue resolver. The special
* route reads the durable `specialPath` setting at request time: empty serves
* the bundled "guan-yu" sample, a file serves itself, and a directory serves
* one random audio file found within it (bounded recursive scan). An unusable
* selection falls back to the bundled sample so a completion never loses its
* cue.
*/
/** Durable completion-sound schema; also the wire envelope the browser scope validates against. */
const CompletionSoundSettingsSchema = z.object({
	[COMPLETION_SOUND_ENABLED_FIELD]: z.boolean().default(true),
	[COMPLETION_SOUND_NOTIFY_FIELD]: z.boolean().default(false),
	[COMPLETION_SOUND_VOLUME_FIELD]: z.number().min(0).max(1).default(DEFAULT_VOLUME),
	[COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD]: z.number().min(1).max(MAX_LONG_TASK_MINUTES).default(10),
	[COMPLETION_SOUND_SPECIAL_FIELD]: z.boolean().default(true),
	[COMPLETION_SOUND_SPECIAL_PATH_FIELD]: z.string().default(""),
	[COMPLETION_SOUND_ASK_ALERT_FIELD]: z.boolean().default(true)
});
/**
* Absolute path of the bundled long-task cue. Both the source (`src/`) and the
* built (`lib/`) node half sit one level under the package root, so the single
* `../assets` hop resolves identically from either location.
*/
const GUAN_YU_ASSET_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../assets/guan-yu.wav");
/** Lazily loaded asset bytes; a failed read leaves it null so the next request retries. */
let guanYuBuffer = null;
/** Content types for the audio extensions the special-cue resolver accepts. */
const AUDIO_CONTENT_TYPES = {
	".aac": "audio/aac",
	".flac": "audio/flac",
	".m4a": "audio/mp4",
	".mp3": "audio/mpeg",
	".oga": "audio/ogg",
	".ogg": "audio/ogg",
	".opus": "audio/ogg",
	".wav": "audio/wav",
	".webm": "audio/webm"
};
/** Upper bound on audio files a directory scan collects (one pass, breadth by depth). */
const SPECIAL_AUDIO_SCAN_CAP = 512;
/** Content type for an audio path, or undefined when its extension is not audio. */
function audioContentType(path) {
	return AUDIO_CONTENT_TYPES[extname(path).toLowerCase()];
}
/** Write one byte body with its audio content type (405 non-GET/HEAD, 404 unreadable handled by callers). */
function serveBody(req, res, body, contentType, random) {
	res.writeHead(200, {
		"content-type": contentType,
		"content-length": String(body.byteLength),
		"cache-control": "no-cache",
		...random ? { "x-dsh-completion-sound-random": "1" } : {}
	});
	if (req.method === "HEAD") res.end();
	else res.end(body);
}
/** Serve the bundled long-task cue as an audio/wav response (405 non-GET/HEAD, 404 unreadable). */
const serveGuanYu = async (req, res) => {
	if (req.method !== "GET" && req.method !== "HEAD") {
		res.writeHead(405);
		res.end();
		return;
	}
	try {
		const body = guanYuBuffer ?? await readFile(GUAN_YU_ASSET_PATH);
		guanYuBuffer = body;
		serveBody(req, res, body, "audio/wav", false);
	} catch {
		res.writeHead(404);
		res.end();
	}
};
/** Bounded recursive walk collecting audio files under a directory. */
async function collectAudioFiles(dir) {
	const found = [];
	const stack = [dir];
	while (stack.length > 0 && found.length < SPECIAL_AUDIO_SCAN_CAP) {
		const current = stack.pop();
		let entries;
		try {
			entries = await readdir(current, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (found.length >= SPECIAL_AUDIO_SCAN_CAP) break;
			if (entry.isDirectory()) stack.push(join(current, entry.name));
			else if (entry.isFile() && audioContentType(entry.name) !== void 0) found.push(join(current, entry.name));
		}
	}
	return found;
}
/**
* Resolve the user-selected special cue to concrete bytes: empty selects the
* bundled sample, a file serves itself, a directory serves one random audio
* file within it. Any unusable selection (missing path, no audio files,
* non-audio file) falls back to the bundled sample.
*/
async function resolveSpecialCue(specialPath) {
	if (specialPath !== "") try {
		const target = resolve(specialPath);
		const info = await stat(target);
		if (info.isFile()) {
			const contentType = audioContentType(target);
			if (contentType !== void 0) return {
				body: await readFile(target),
				contentType,
				random: false
			};
		} else if (info.isDirectory()) {
			const files = await collectAudioFiles(target);
			if (files.length > 0) {
				const picked = files[Math.floor(Math.random() * files.length)];
				return {
					body: await readFile(picked),
					contentType: audioContentType(picked) ?? "audio/wav",
					random: true
				};
			}
		}
	} catch {}
	const body = guanYuBuffer ?? await readFile(GUAN_YU_ASSET_PATH);
	guanYuBuffer = body;
	return {
		body,
		contentType: "audio/wav",
		random: false
	};
}
/**
* Raise an OS notification from the local host process. The browser
* Notification API is the primary channel; this fallback covers platforms
* where that channel is missing or blocked — macOS Safari, Linux desktops
* without a notification daemon, non-secure contexts. Uses the platform's
* built-in notifier when present: `osascript` on macOS, `notify-send` on
* Linux. Resolves ok:false when no notifier exists for the platform.
*/
function sendSystemNotification(title, body) {
	return new Promise((resolve) => {
		const platform = process.platform;
		let command;
		let args;
		if (platform === "darwin") {
			command = "osascript";
			args = ["-e", `display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)}`];
		} else if (platform === "linux") {
			command = "notify-send";
			args = [
				"-a",
				"DSH",
				title,
				body
			];
		} else {
			resolve({
				ok: false,
				platform
			});
			return;
		}
		let child;
		try {
			child = spawn(command, args, { stdio: "ignore" });
		} catch {
			resolve({
				ok: false,
				platform
			});
			return;
		}
		let settled = false;
		child.once("error", () => {
			if (!settled) {
				settled = true;
				resolve({
					ok: false,
					platform
				});
			}
		});
		child.once("exit", (code) => {
			if (!settled) {
				settled = true;
				resolve({
					ok: code === 0,
					platform
				});
			}
		});
	});
}
/** Read a best-effort JSON {title, body} body from a POST request. */
async function readNotifyBody(req) {
	const chunks = [];
	try {
		for await (const chunk of req) chunks.push(chunk);
		const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
		return {
			title: typeof parsed.title === "string" ? parsed.title : "DSH",
			body: typeof parsed.body === "string" ? parsed.body : ""
		};
	} catch {
		return {
			title: "DSH",
			body: ""
		};
	}
}
/** Serve the OS-notification fallback: POST {title, body} raises an OS notification. */
const serveNotify = async (req, res) => {
	if (req.method !== "POST") {
		res.writeHead(405);
		res.end();
		return;
	}
	const { title, body } = await readNotifyBody(req);
	const result = await sendSystemNotification(title, body);
	res.writeHead(200, { "content-type": "application/json" });
	res.end(JSON.stringify(result));
};
/**
* Register the durable completion-sound section when a settings provider
* exists, and serve the bundled cue plus the special-cue resolver when the web
* server exists.
* @param ctx - Host context.
*/
function apply(ctx) {
	let settings = null;
	ctx.inject(["settings"], (settingsCtx) => {
		settings = settingsCtx.settings.register(COMPLETION_SOUND_SETTINGS_NAMESPACE, CompletionSoundSettingsSchema);
	});
	ctx.inject(["webServer"], (webCtx) => {
		webCtx.effect(() => webCtx.webServer.register({
			kind: "exact",
			path: GUAN_YU_SOUND_URL,
			handler: serveGuanYu
		}), "ui-completion-sound: long-task cue asset route");
		const serveSpecial = async (req, res) => {
			if (req.method !== "GET" && req.method !== "HEAD") {
				res.writeHead(405);
				res.end();
				return;
			}
			try {
				const { body, contentType, random } = await resolveSpecialCue(settings?.get()["specialPath"] ?? "");
				serveBody(req, res, body, contentType, random);
			} catch {
				res.writeHead(404);
				res.end();
			}
		};
		webCtx.effect(() => webCtx.webServer.register({
			kind: "exact",
			path: SPECIAL_SOUND_URL,
			handler: serveSpecial
		}), "ui-completion-sound: special-cue resolver route");
		webCtx.effect(() => webCtx.webServer.register({
			kind: "exact",
			path: COMPLETION_SOUND_NOTIFY_URL,
			handler: serveNotify
		}), "ui-completion-sound: system-notification route");
	});
}
//#endregion
export { COMPLETION_SOUND_ASK_ALERT_FIELD, COMPLETION_SOUND_ENABLED_FIELD, COMPLETION_SOUND_LONG_TASK_MINUTES_FIELD, COMPLETION_SOUND_NOTIFY_FIELD, COMPLETION_SOUND_NOTIFY_URL, COMPLETION_SOUND_SETTINGS_NAMESPACE, COMPLETION_SOUND_SPECIAL_FIELD, COMPLETION_SOUND_SPECIAL_PATH_FIELD, COMPLETION_SOUND_VOLUME_FIELD, DEFAULT_LONG_TASK_MINUTES, DEFAULT_VOLUME, GUAN_YU_SOUND_URL, MAX_LONG_TASK_MINUTES, MIN_LONG_TASK_MINUTES, SPECIAL_SOUND_URL, apply };
