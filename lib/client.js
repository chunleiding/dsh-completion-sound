window.__ModuleLoader__.load({
	id: "@jensentsts/dsh-completion-sound",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react_dom_client = require("react-dom/client");
		//#region src/settings.ts
		/**
		* Completion-sound preferences, carried by this plugin's profile entry Config.
		* Schema-free on purpose: the schema (which needs schemastery) lives in the
		* node half, so the browser bundle never inlines it. This module carries only
		* the entry identity, the field names, and the shared section type.
		*/
		/**
		* Settings namespace of the completion-sound preferences — the profile loader
		* entry id, which is what the settings forms key a namespace by and what the
		* browser half asks `ctx.configForms` for.
		*/
		const COMPLETION_SOUND_SETTINGS_NAMESPACE = "completion-sound";
		/** Maximum long-task threshold (minutes) — seven days. */
		const MAX_LONG_TASK_MINUTES = 10080;
		/** Maximum answer-needed repeat interval (minutes) — one day. */
		const MAX_ASK_REPEAT_MINUTES = 1440;
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
		/**
		* Web route the node half serves the answer-needed cue under. Resolves the
		* `askPath` setting the same way the long-task route resolves `specialPath`,
		* except an unusable selection 404s instead of falling back to the bundled
		* sample: the browser then plays its own synthesized cue, which is the better
		* fallback for "answer me" than a triumphant long-task fanfare.
		*/
		const ASK_SOUND_URL = "/completion-sound/ask";
		//#endregion
		//#region \0dsh-css:/Users/baoyu/Documents/dsh-completion-sound/src/client/CompletionSoundSection.module.css.mjs
		const css$1 = ".r8Jc5G_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.r8Jc5G_pageTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.r8Jc5G_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}.r8Jc5G_groupTitle{color:var(--dsw-alias-label-secondary);margin:8px 0 0;font-size:12px;font-weight:500;line-height:18px}.r8Jc5G_rows{flex-direction:column;display:flex}.r8Jc5G_row{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.r8Jc5G_row:last-child{border-bottom:none}.r8Jc5G_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.r8Jc5G_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.r8Jc5G_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}.r8Jc5G_actions{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px;display:flex}.r8Jc5G_selector{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;border:none;border-radius:18px;align-items:center;gap:12px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.r8Jc5G_selector:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.r8Jc5G_selector:disabled{cursor:default;opacity:.6}.r8Jc5G_chevron{color:var(--dsw-alias-label-tertiary);flex:none}.r8Jc5G_volumeControls{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px;display:flex}.r8Jc5G_volumeLine{align-items:center;gap:8px;display:inline-flex}.r8Jc5G_volumeSlider{width:128px;accent-color:var(--dsw-alias-brand-primary)}.r8Jc5G_volumeValue{text-align:right;font-variant-numeric:tabular-nums;min-width:40px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.r8Jc5G_fieldLine{align-items:center;gap:8px;display:inline-flex}.r8Jc5G_fieldInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);height:32px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 10px;font-size:14px;line-height:22px}.r8Jc5G_fieldInput:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.r8Jc5G_fieldInput:disabled{opacity:.6;cursor:not-allowed}.r8Jc5G_numberInput{font-variant-numeric:tabular-nums;width:96px}.r8Jc5G_pathInput{width:280px}.r8Jc5G_fieldUnit{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-size:12px;line-height:18px}";
		const tagId$1 = "@jensentsts/dsh-completion-sound/CompletionSoundSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@jensentsts/dsh-completion-sound";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var CompletionSoundSection_module_css_default = {
			"volumeValue": "r8Jc5G_volumeValue",
			"actions": "r8Jc5G_actions",
			"fieldLine": "r8Jc5G_fieldLine",
			"selector": "r8Jc5G_selector",
			"chevron": "r8Jc5G_chevron",
			"volumeControls": "r8Jc5G_volumeControls",
			"volumeLine": "r8Jc5G_volumeLine",
			"desc": "r8Jc5G_desc",
			"fieldInput": "r8Jc5G_fieldInput",
			"numberInput": "r8Jc5G_numberInput",
			"fieldUnit": "r8Jc5G_fieldUnit",
			"pageTitle": "r8Jc5G_pageTitle",
			"section": "r8Jc5G_section",
			"row": "r8Jc5G_row",
			"intro": "r8Jc5G_intro",
			"volumeSlider": "r8Jc5G_volumeSlider",
			"title": "r8Jc5G_title",
			"pathInput": "r8Jc5G_pathInput",
			"groupTitle": "r8Jc5G_groupTitle",
			"rowText": "r8Jc5G_rowText",
			"rows": "r8Jc5G_rows"
		};
		//#endregion
		//#region src/client/CompletionSoundSection.tsx
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
		/** Map a test-notification state to its hint copy (denied/default share one). */
		function notifyHintKey(outcome) {
			if (outcome === "granted") return "completion-sound.notifyGranted";
			if (outcome === "unsupported") return "completion-sound.notifyUnsupported";
			if (outcome === "pending") return "completion-sound.notifyPending";
			return "completion-sound.notifyDenied";
		}
		/**
		* A boolean capsule selector in the General-section row vocabulary: the
		* PermissionRow/Feishu settings control, backed by the shared Menu primitive.
		*/
		function BooleanCapsule({ value, onLabel, offLabel, disabled = false, onSelect }) {
			const [open, setOpen] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				onClose: () => {
					setOpen(false);
				},
				items: [{
					id: "on",
					label: onLabel
				}, {
					id: "off",
					label: offLabel
				}],
				selectedId: value ? "on" : "off",
				onSelect: (id) => {
					setOpen(false);
					onSelect(id === "on");
				},
				align: "end",
				portal: true,
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: CompletionSoundSection_module_css_default.selector,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					disabled,
					onClick: () => {
						setOpen((current) => !current);
					},
					children: [value ? onLabel : offLabel, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { className: CompletionSoundSection_module_css_default.chevron })]
				})
			});
		}
		/**
		* Render the Completion Sound settings section.
		* @param props - composed slot props.
		* @returns the section, or null while the shell has not injected yet.
		*/
		function CompletionSoundSection(props) {
			const { t, useStore, setEnabled, setNotify, setVolume, setLongTaskMinutes, setSpecial, setSpecialPath, setAskAlert, setAskRepeatMinutes, setAskPath, previewChime, previewAsk, previewSpecial, testNotify } = props;
			if (t === void 0 || useStore === void 0) return null;
			const enabled = useStore((s) => s.enabled);
			const notify = useStore((s) => s.notify);
			const volume = useStore((s) => s.volume);
			const longTaskMinutes = useStore((s) => s.longTaskMinutes);
			const special = useStore((s) => s.special);
			const specialPath = useStore((s) => s.specialPath);
			const askAlert = useStore((s) => s.askAlert);
			const askRepeatMinutes = useStore((s) => s.askRepeatMinutes);
			const askPath = useStore((s) => s.askPath);
			const percent = Math.round(volume * 100);
			const [notifyOutcome, setNotifyOutcome] = (0, react.useState)(null);
			const notifyPending = notifyOutcome === "pending";
			const [minutesDraft, setMinutesDraft] = (0, react.useState)(null);
			const [pathDraft, setPathDraft] = (0, react.useState)(null);
			const [askRepeatDraft, setAskRepeatDraft] = (0, react.useState)(null);
			const [askPathDraft, setAskPathDraft] = (0, react.useState)(null);
			const commitMinutes = () => {
				if (minutesDraft === null) return;
				const parsed = Number(minutesDraft);
				setMinutesDraft(null);
				if (Number.isFinite(parsed)) setLongTaskMinutes(Math.min(MAX_LONG_TASK_MINUTES, Math.max(1, Math.round(parsed))));
			};
			const commitPath = () => {
				if (pathDraft === null) return specialPath;
				const value = pathDraft;
				setPathDraft(null);
				setSpecialPath(value);
				return value;
			};
			const commitAskRepeat = () => {
				if (askRepeatDraft === null) return;
				const parsed = Number(askRepeatDraft);
				setAskRepeatDraft(null);
				if (Number.isFinite(parsed)) setAskRepeatMinutes(Math.min(MAX_ASK_REPEAT_MINUTES, Math.max(0, Math.round(parsed))));
			};
			const commitAskPath = () => {
				if (askPathDraft === null) return askPath;
				const value = askPathDraft;
				setAskPathDraft(null);
				setAskPath(value);
				return value;
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: CompletionSoundSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: CompletionSoundSection_module_css_default.pageTitle,
						children: t("completion-sound.title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: CompletionSoundSection_module_css_default.intro,
						children: t("completion-sound.subtitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: CompletionSoundSection_module_css_default.rows,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.enabled")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										children: t("completion-sound.enabledDesc")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.actions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: !enabled,
										onClick: () => {
											previewChime(volume);
										},
										children: t("completion-sound.test")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanCapsule, {
										value: enabled,
										onLabel: t("completion-sound.on"),
										offLabel: t("completion-sound.off"),
										onSelect: setEnabled
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.notify")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										role: notifyOutcome === null ? void 0 : "status",
										children: notifyOutcome === null ? t("completion-sound.notifyDesc") : t(notifyHintKey(notifyOutcome))
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.actions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: notifyPending,
										onClick: () => {
											setNotifyOutcome("pending");
											testNotify().then(setNotifyOutcome, () => {
												setNotifyOutcome("denied");
											});
										},
										children: t("completion-sound.testNotify")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanCapsule, {
										value: notify,
										onLabel: t("completion-sound.on"),
										offLabel: t("completion-sound.off"),
										onSelect: setNotify
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.volume")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										children: t("completion-sound.volumeDesc")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: CompletionSoundSection_module_css_default.volumeControls,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: CompletionSoundSection_module_css_default.volumeLine,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: CompletionSoundSection_module_css_default.volumeSlider,
											type: "range",
											min: 0,
											max: 1,
											step: .01,
											value: volume,
											"aria-label": t("completion-sound.volume"),
											onChange: (e) => {
												setVolume(Number(e.target.value));
											}
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: CompletionSoundSection_module_css_default.volumeValue,
											children: [percent, "%"]
										})]
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.askAlert")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										children: t("completion-sound.askAlertDesc")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.actions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: !askAlert,
										onClick: () => {
											previewAsk(volume, commitAskPath());
										},
										children: t("completion-sound.testAsk")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanCapsule, {
										value: askAlert,
										onLabel: t("completion-sound.on"),
										offLabel: t("completion-sound.off"),
										onSelect: setAskAlert
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.askRepeat")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										children: t("completion-sound.askRepeatDesc")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: CompletionSoundSection_module_css_default.fieldLine,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: `${CompletionSoundSection_module_css_default.fieldInput} ${CompletionSoundSection_module_css_default.numberInput}`,
										type: "number",
										min: 0,
										max: MAX_ASK_REPEAT_MINUTES,
										step: 1,
										value: askRepeatDraft ?? String(askRepeatMinutes),
										disabled: !askAlert,
										"aria-label": t("completion-sound.askRepeat"),
										onChange: (e) => {
											setAskRepeatDraft(e.target.value);
										},
										onBlur: commitAskRepeat,
										onKeyDown: (e) => {
											if (e.key === "Enter") e.currentTarget.blur();
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: CompletionSoundSection_module_css_default.fieldUnit,
										children: t("completion-sound.minutesUnit")
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.askPath")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										children: t("completion-sound.askPathDesc")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: `${CompletionSoundSection_module_css_default.fieldInput} ${CompletionSoundSection_module_css_default.pathInput}`,
									type: "text",
									value: askPathDraft ?? askPath,
									disabled: !askAlert,
									placeholder: t("completion-sound.askPathPlaceholder"),
									"aria-label": t("completion-sound.askPath"),
									onChange: (e) => {
										setAskPathDraft(e.target.value);
									},
									onBlur: () => {
										commitAskPath();
									},
									onKeyDown: (e) => {
										if (e.key === "Enter") e.currentTarget.blur();
									}
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
						className: CompletionSoundSection_module_css_default.groupTitle,
						children: t("completion-sound.longTaskGroup")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: CompletionSoundSection_module_css_default.rows,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.longTaskMinutes")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										children: t("completion-sound.longTaskMinutesDesc")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: CompletionSoundSection_module_css_default.fieldLine,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: `${CompletionSoundSection_module_css_default.fieldInput} ${CompletionSoundSection_module_css_default.numberInput}`,
										type: "number",
										min: 1,
										max: MAX_LONG_TASK_MINUTES,
										step: 1,
										value: minutesDraft ?? String(longTaskMinutes),
										"aria-label": t("completion-sound.longTaskMinutes"),
										onChange: (e) => {
											setMinutesDraft(e.target.value);
										},
										onBlur: commitMinutes,
										onKeyDown: (e) => {
											if (e.key === "Enter") e.currentTarget.blur();
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: CompletionSoundSection_module_css_default.fieldUnit,
										children: t("completion-sound.minutesUnit")
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.special")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										children: t("completion-sound.specialDesc")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanCapsule, {
									value: special,
									onLabel: t("completion-sound.on"),
									offLabel: t("completion-sound.off"),
									onSelect: setSpecial
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: CompletionSoundSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.rowText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.title,
										children: t("completion-sound.specialPath")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: CompletionSoundSection_module_css_default.desc,
										children: t("completion-sound.specialPathDesc")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: CompletionSoundSection_module_css_default.actions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: !special,
										onClick: () => {
											previewSpecial(volume, commitPath());
										},
										children: t("completion-sound.testSpecial")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: `${CompletionSoundSection_module_css_default.fieldInput} ${CompletionSoundSection_module_css_default.pathInput}`,
										type: "text",
										value: pathDraft ?? specialPath,
										disabled: !special,
										placeholder: t("completion-sound.specialPathPlaceholder"),
										"aria-label": t("completion-sound.specialPath"),
										onChange: (e) => {
											setPathDraft(e.target.value);
										},
										onBlur: () => {
											commitPath();
										},
										onKeyDown: (e) => {
											if (e.key === "Enter") e.currentTarget.blur();
										}
									})]
								})]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/settings-store.ts
		/**
		* Completion Sound section slot store: a mirror of the plugin's optimistic
		* local settings snapshot. The plugin's apply-world publisher is the only
		* writer (guarded by a monotonic revision so a stale adoption can't regress
		* the section); the section component reads via props.useStore.
		*/
		/**
		* Declares the Completion Sound section state and write surface.
		* @returns the store handle.
		*/
		function createCompletionSoundSectionStore() {
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: () => ({
					enabled: true,
					notify: false,
					volume: .5,
					longTaskMinutes: 10,
					special: true,
					specialPath: "",
					askAlert: true,
					askRepeatMinutes: 3,
					askPath: "",
					ready: false,
					revision: -1
				}),
				actions: { sync: (d, settings, revision) => {
					if (revision <= d.revision) return;
					d.enabled = settings.enabled;
					d.notify = settings.notify;
					d.volume = settings.volume;
					d.longTaskMinutes = settings.longTaskMinutes;
					d.special = settings.special;
					d.specialPath = settings.specialPath;
					d.askAlert = settings.askAlert;
					d.askRepeatMinutes = settings.askRepeatMinutes;
					d.askPath = settings.askPath;
					d.ready = true;
					d.revision = revision;
				} }
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* `settings.completion-sound` namespace dictionaries (the Completion Sound
		* section's copy plus the playback-stop modal).
		*/
		const NS = "settings.completion-sound";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"completion-sound.title": "完成提示音",
			"completion-sound.nav": "完成提示音",
			"completion-sound.subtitle": "回合结束时播放提示音；长任务可播放特殊音乐，并可弹出桌面通知；卡片等待回答时也可提醒",
			"completion-sound.on": "开",
			"completion-sound.off": "关",
			"completion-sound.enabled": "完成提示音",
			"completion-sound.enabledDesc": "回合完成后播放提示音",
			"completion-sound.notify": "桌面通知",
			"completion-sound.notifyDesc": "完成时发送桌面通知；优先使用浏览器通知，不可用时自动改用系统通知",
			"completion-sound.volume": "音量",
			"completion-sound.volumeDesc": "控制提示音与特殊音乐的播放响度",
			"completion-sound.test": "试听提示音",
			"completion-sound.testNotify": "测试通知",
			"completion-sound.askAlert": "等待回答时提醒",
			"completion-sound.askAlertDesc": "提问、计划确认或权限审批卡片等待你回答时播放提示音并弹出通知；独立于上面的完成提示音与桌面通知开关",
			"completion-sound.testAsk": "试听提醒音",
			"completion-sound.asked": "等待你的回答",
			"completion-sound.askedApproval": "等待你的确认",
			"completion-sound.askedAgain": "仍在等待你的回答",
			"completion-sound.askedApprovalAgain": "仍在等待你的确认",
			"completion-sound.askRepeat": "重复提醒间隔",
			"completion-sound.askRepeatDesc": "卡片一直没被回答时，每隔该分钟数再提醒一次；填 0 表示只提醒一次",
			"completion-sound.askPath": "提醒音频（文件或目录）",
			"completion-sound.askPathDesc": "留空使用内置的三音提醒；可填音频文件，或填目录（每次随机播放其中一首）；路径无效时自动回退到三音提醒",
			"completion-sound.askPathPlaceholder": "例如 D:\\Music\\notify.mp3",
			"completion-sound.notified": "任务完成",
			"completion-sound.notifyTestBody": "这是一条测试通知",
			"completion-sound.notifyGranted": "已发送桌面通知",
			"completion-sound.notifyPending": "正在等待通知权限…",
			"completion-sound.notifyDenied": "浏览器通知被阻止且系统通知发送失败，请在浏览器或系统设置里允许通知",
			"completion-sound.notifyUnsupported": "当前环境浏览器与系统通知均不可用",
			"completion-sound.longTaskGroup": "长任务",
			"completion-sound.longTaskMinutes": "长任务时长",
			"completion-sound.longTaskMinutesDesc": "回合时长达到该分钟数即视为长任务",
			"completion-sound.minutesUnit": "分钟",
			"completion-sound.special": "长任务完成时特殊音乐",
			"completion-sound.specialDesc": "开启后，长任务完成时播放指定的音乐；关闭时与普通回合一样播放提示音",
			"completion-sound.specialPath": "音乐文件或目录",
			"completion-sound.specialPathDesc": "留空使用内置「关羽之歌」；可填写音频文件路径或目录路径，目录中将随机播放其中一首音频；路径无效时回退到内置音乐",
			"completion-sound.specialPathPlaceholder": "例如 D:\\Music\\victory.mp3",
			"completion-sound.testSpecial": "试听",
			"completion-sound.modalTitle": "任务完成",
			"completion-sound.modalBody": "特殊音乐播放中，点击任意处停止",
			"completion-sound.modalStop": "停止播放"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"completion-sound.title": "Completion sound",
			"completion-sound.nav": "Completion sound",
			"completion-sound.subtitle": "Play a cue when a turn completes; long turns can play special music and raise a desktop notification; cards awaiting an answer can alert too",
			"completion-sound.on": "On",
			"completion-sound.off": "Off",
			"completion-sound.enabled": "Completion sound",
			"completion-sound.enabledDesc": "Play a cue when a turn completes",
			"completion-sound.notify": "Desktop notification",
			"completion-sound.notifyDesc": "Send a desktop notification when a turn completes; prefers the browser notification and falls back to the OS notifier",
			"completion-sound.volume": "Volume",
			"completion-sound.volumeDesc": "Playback loudness for the chime and the special music",
			"completion-sound.test": "Preview chime",
			"completion-sound.testNotify": "Test notification",
			"completion-sound.askAlert": "Alert when an answer is needed",
			"completion-sound.askAlertDesc": "Play a chime and raise a notification when a question, plan-review, or approval card waits for you; independent of the completion switches above",
			"completion-sound.testAsk": "Preview alert chime",
			"completion-sound.asked": "Waiting for your answer",
			"completion-sound.askedApproval": "Waiting for your approval",
			"completion-sound.askedAgain": "Still waiting for your answer",
			"completion-sound.askedApprovalAgain": "Still waiting for your approval",
			"completion-sound.askRepeat": "Repeat interval",
			"completion-sound.askRepeatDesc": "While a card stays unanswered, alert again every this many minutes; 0 alerts only once",
			"completion-sound.askPath": "Alert audio (file or directory)",
			"completion-sound.askPathDesc": "Leave empty for the built-in three-note cue; set an audio file, or a directory to play one random track from it; falls back to the synthesized cue when unusable",
			"completion-sound.askPathPlaceholder": "e.g. D:\\Music\\notify.mp3",
			"completion-sound.notified": "Task completed",
			"completion-sound.notifyTestBody": "This is a test notification",
			"completion-sound.notifyGranted": "Desktop notification sent",
			"completion-sound.notifyPending": "Waiting for notification permission…",
			"completion-sound.notifyDenied": "Browser notifications blocked and the OS notifier failed — allow notifications in browser/OS settings",
			"completion-sound.notifyUnsupported": "Neither browser nor OS notifications are available here",
			"completion-sound.longTaskGroup": "Long tasks",
			"completion-sound.longTaskMinutes": "Long task duration",
			"completion-sound.longTaskMinutesDesc": "Turns lasting at least this many minutes count as long tasks",
			"completion-sound.minutesUnit": "min",
			"completion-sound.special": "Special music on long-task completion",
			"completion-sound.specialDesc": "When on, long tasks play the selected music; when off, they play the normal chime like any other turn",
			"completion-sound.specialPath": "Music file or directory",
			"completion-sound.specialPathDesc": "Leave empty to use the bundled \"Guan Yu\" cue; set an audio file, or a directory to play one random audio file from it; falls back to the bundled cue when unusable",
			"completion-sound.specialPathPlaceholder": "e.g. D:\\Music\\victory.mp3",
			"completion-sound.testSpecial": "Preview",
			"completion-sound.modalTitle": "Task completed",
			"completion-sound.modalBody": "Special music playing — click anywhere to stop",
			"completion-sound.modalStop": "Stop"
		};
		//#endregion
		//#region src/client/notify.ts
		/**
		* Desktop notification support for completion cues. The browser Notification
		* API is the primary channel — it carries the richest UX and is the only path
		* that can ask the user for permission. When that channel is missing or
		* blocked, completion cues fall back to a Host-side OS notifier (osascript on
		* macOS, notify-send on Linux) so notifications still land on platforms where
		* the browser path is unreliable: Safari, Linux desktops without a
		* notification daemon, non-secure contexts.
		*/
		/**
		* Some embedded browsers expose `Notification` but never settle the permission
		* prompt. The row still has to report a result instead of spinning forever.
		*/
		const PERMISSION_REQUEST_TIMEOUT_MS = 1e4;
		/** Whether the browser Notification API is present at all. */
		function browserNotificationsAvailable() {
			return typeof Notification !== "undefined";
		}
		/** Read the current browser permission, or 'unsupported' when absent. */
		function getNotificationPermission() {
			if (!browserNotificationsAvailable()) return "unsupported";
			return Notification.permission;
		}
		/**
		* Send one completion notification. The constructor can throw in restricted
		* embeddings even when `permission` reads 'granted'; a missing cue must never
		* break the completion path or the test-notification promise chain.
		*/
		function sendNotification(title, body) {
			try {
				new Notification(title, {
					tag: "dsh-completion",
					body
				});
				return true;
			} catch {
				return false;
			}
		}
		/**
		* Fire a Host-side OS notification through the completion-sound notify route.
		* Resolves true when the Host reported a successful notifier launch. The route
		* 404s while the Host half is absent (e.g. not yet restarted after an update),
		* which the caller reads as unsupported.
		*/
		async function sendSystemNotification(title, body) {
			try {
				const res = await fetch(COMPLETION_SOUND_NOTIFY_URL, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						title,
						body
					})
				});
				if (!res.ok) return false;
				return (await res.json()).ok === true;
			} catch {
				return false;
			}
		}
		/**
		* Deliver a completion notification through the best available channel:
		* browser when granted, Host-side OS notifier otherwise.
		*/
		async function notifyCompletion(title, body) {
			if (browserNotificationsAvailable() && Notification.permission === "granted") {
				sendNotification(title, body);
				return;
			}
			await sendSystemNotification(title, body);
		}
		/**
		* Request permission in a way that works with both the promise form and the
		* legacy callback form, and always settles within a bounded time.
		*/
		function requestPermissionDecision() {
			return new Promise((resolve) => {
				let settled = false;
				let timer;
				const finish = (permission) => {
					if (settled) return;
					settled = true;
					if (timer !== void 0) clearTimeout(timer);
					resolve(permission);
				};
				timer = setTimeout(() => finish(Notification.permission), PERMISSION_REQUEST_TIMEOUT_MS);
				try {
					const request = Notification.requestPermission;
					const result = request(finish);
					if (result instanceof Promise) result.then(finish, () => finish(Notification.permission));
					else if (result !== void 0) finish(result);
				} catch {
					finish(Notification.permission);
				}
			});
		}
		/** Request notification permission once (no-op when already decided). */
		function requestNotificationPermission() {
			if (!browserNotificationsAvailable()) return;
			if (Notification.permission !== "default") return;
			requestPermissionDecision();
		}
		/**
		* Fire a sample notification, requesting permission first when the browser has
		* not decided yet. Resolves to the resulting permission state so the caller can
		* surface an in-app hint — the browser/OS gives no signal when it swallows the
		* toast, but "denied" and "unsupported" both look like "nothing happened".
		* Falls back to the Host-side OS notifier when the browser channel is missing
		* or blocked, so the test succeeds on every platform that can raise a toast.
		*/
		async function testNotification(title, body) {
			if (!browserNotificationsAvailable()) return await sendSystemNotification(title, body) ? "granted" : "unsupported";
			try {
				if (Notification.permission === "default") {
					const decision = await requestPermissionDecision();
					if (decision === "granted") {
						sendNotification(title, body);
						return "granted";
					}
					if (decision === "denied") return await sendSystemNotification(title, body) ? "granted" : "denied";
					return decision;
				}
				if (Notification.permission === "granted") {
					sendNotification(title, body);
					return "granted";
				}
				return await sendSystemNotification(title, body) ? "granted" : "denied";
			} catch {
				return getNotificationPermission();
			}
		}
		//#endregion
		//#region src/client/sound.ts
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
		let audioContext = null;
		/** Create (or return) the shared context, resuming it if it is suspended. */
		function context() {
			if (audioContext === null) audioContext = new AudioContext();
			if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
			return audioContext;
		}
		/**
		* Prime the audio context on the first user gesture so a later completion
		* cue (which carries no gesture of its own) is allowed to play.
		*/
		function unlockAudio() {
			context();
		}
		/** The completion chime: a soft rising E5 → A5. */
		const CHIME_NOTES = [[659.25, 0], [880, .15]];
		/**
		* The answer-needed cue: three short rising notes (D5 → A5 → D6). Distinct
		* enough from the completion chime to read as "I need you", not "I am done".
		*/
		const ATTENTION_NOTES = [
			[587.33, 0],
			[880, .12],
			[1174.66, .24]
		];
		/**
		* Schedule one sine cue: each note gets a fast attack and an exponential
		* decay. Audio trouble (autoplay denied, no output device) degrades silently —
		* a missing cue must never break the completion path.
		* @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
		* @param notes - the cue's notes, in play order.
		* @param decay - per-note decay in seconds.
		*/
		async function playCue(volume, notes, decay = .4) {
			if (volume <= 0) return;
			try {
				const ctx = context();
				if (ctx.state === "suspended") await ctx.resume();
				const peak = Math.min(1, Math.max(0, volume));
				const start = ctx.currentTime;
				for (const [frequency, offset] of notes) {
					const oscillator = ctx.createOscillator();
					const gain = ctx.createGain();
					const when = start + offset;
					oscillator.type = "sine";
					oscillator.frequency.value = frequency;
					gain.gain.setValueAtTime(1e-4, when);
					gain.gain.exponentialRampToValueAtTime(peak, when + .03);
					gain.gain.exponentialRampToValueAtTime(1e-4, when + decay);
					oscillator.connect(gain);
					gain.connect(ctx.destination);
					oscillator.start(when);
					oscillator.stop(when + decay + .05);
				}
			} catch {}
		}
		/**
		* Play the completion chime (E5 → A5, gentle attack and exponential decay).
		* @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
		*/
		function playCompletionChime(volume) {
			return playCue(volume, CHIME_NOTES);
		}
		/**
		* Play the answer-needed cue (a card is waiting for the user).
		* @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
		*/
		function playAttentionChime(volume) {
			return playCue(volume, ATTENTION_NOTES, .3);
		}
		/** Decoded bundled sample, cached after the first successful load. */
		let bundledBuffer = null;
		/** In-flight bundled decode, deduped so concurrent completions share one fetch/decode. */
		let bundledLoadPromise = null;
		/** Fetch and decode the bundled long-task sample once, retrying on failure. */
		async function loadBundled(ctx) {
			if (bundledBuffer !== null) return bundledBuffer;
			if (bundledLoadPromise === null) bundledLoadPromise = (async () => {
				const response = await fetch(GUAN_YU_SOUND_URL);
				if (!response.ok) throw new Error(`completion-sound: bundled cue HTTP ${response.status}`);
				return await ctx.decodeAudioData(await response.arrayBuffer());
			})().then((buffer) => {
				bundledBuffer = buffer;
				return buffer;
			});
			try {
				return await bundledLoadPromise;
			} catch (error) {
				bundledLoadPromise = null;
				throw error;
			}
		}
		/** Decoded user-selected samples, keyed by the setting's `specialPath` (small LRU). */
		const customBufferCache = /* @__PURE__ */ new Map();
		/** Maximum entries retained in {@link customBufferCache}. */
		const CUSTOM_CACHE_MAX = 4;
		/** Whether a response was a directory-random pick (the host never reuses it). */
		function isRandomPick(response) {
			return response.headers.get("x-dsh-completion-sound-random") === "1";
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
		async function loadFileCue(ctx, path, route, bundledOnEmpty) {
			if (path === "" && bundledOnEmpty) return loadBundled(ctx);
			const cached = customBufferCache.get(path);
			if (cached !== void 0) return cached;
			const response = await fetch(route);
			if (!response.ok) throw new Error(`completion-sound: cue HTTP ${response.status}`);
			const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
			if (!isRandomPick(response)) {
				customBufferCache.set(path, buffer);
				if (customBufferCache.size > CUSTOM_CACHE_MAX) {
					const oldest = customBufferCache.keys().next().value;
					if (oldest !== void 0) customBufferCache.delete(oldest);
				}
			}
			return buffer;
		}
		/** The long-task cue slot. */
		const specialSlot = {
			source: null,
			epoch: 0
		};
		/** The answer-needed file-cue slot. */
		const askSlot = {
			source: null,
			epoch: 0
		};
		/** Stop one slot immediately (no-op when idle) and cancel any in-flight load. */
		function stopSlot(slot) {
			slot.epoch += 1;
			if (slot.source !== null) {
				try {
					slot.source.stop();
				} catch {}
				slot.source = null;
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
		async function playSlot(slot, volume, path, route, bundledOnEmpty) {
			if (volume <= 0) return false;
			const epoch = slot.epoch;
			try {
				const ctx = context();
				if (ctx.state === "suspended") await ctx.resume();
				const buffer = await loadFileCue(ctx, path, route, bundledOnEmpty);
				if (epoch !== slot.epoch) return false;
				if (slot.source !== null) try {
					slot.source.stop();
				} catch {}
				const source = ctx.createBufferSource();
				const gain = ctx.createGain();
				gain.gain.value = Math.min(1, Math.max(0, volume));
				source.buffer = buffer;
				source.onended = () => {
					if (slot.source === source) slot.source = null;
				};
				source.connect(gain);
				gain.connect(ctx.destination);
				slot.source = source;
				source.start();
				return true;
			} catch {
				return false;
			}
		}
		/**
		* Play the special long-task cue, resolving `specialPath` ('' = bundled
		* sample) through the host.
		* @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
		* @param specialPath - the durable `specialPath` setting selecting the cue source.
		* @returns true when playback actually started, false when skipped/stopped/failed.
		*/
		function playSpecialSound(volume, specialPath) {
			return playSlot(specialSlot, volume, specialPath, SPECIAL_SOUND_URL, true);
		}
		/** Stop the special long-task cue immediately (no-op when it is not playing). */
		function stopSpecialSound() {
			stopSlot(specialSlot);
		}
		/**
		* Play the answer-needed file cue, resolving `askPath` through the host. An
		* empty or unusable selection 404s here, which the caller reads as "fall back
		* to the synthesized cue".
		* @param volume - playback gain, 0..1; values ≤ 0 are silently skipped.
		* @param askPath - the durable `askPath` setting selecting the cue source.
		* @returns true when playback actually started, false when skipped/stopped/failed.
		*/
		function playAskSound(volume, askPath) {
			return playSlot(askSlot, volume, askPath, ASK_SOUND_URL, false);
		}
		/**
		* Stop the answer-needed cue immediately. Called the moment the card is
		* answered, so a long nag never outlives the question it was asking.
		*/
		function stopAskSound() {
			stopSlot(askSlot);
		}
		//#endregion
		//#region \0dsh-css:/Users/baoyu/Documents/dsh-completion-sound/src/client/stop-modal.module.css.mjs
		const css = ".jknvgW_overlay{z-index:10000;cursor:pointer;background:#0006;justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}.jknvgW_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);cursor:pointer;border-radius:12px;flex-direction:column;gap:8px;max-width:320px;padding:20px;display:flex;box-shadow:0 12px 40px #0000004d}.jknvgW_title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:22px}.jknvgW_body{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}.jknvgW_stop{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);height:32px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:16px;align-self:flex-end;padding:0 14px;font-size:13px;line-height:20px}.jknvgW_stop:hover{background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId = "@jensentsts/dsh-completion-sound/stop-modal.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@jensentsts/dsh-completion-sound";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var stop_modal_module_css_default = {
			"body": "jknvgW_body",
			"stop": "jknvgW_stop",
			"title": "jknvgW_title",
			"card": "jknvgW_card",
			"overlay": "jknvgW_overlay"
		};
		//#endregion
		//#region src/client/stop-modal.tsx
		/**
		* Playback-stop modal for the long-task cue: a fixed in-page overlay whose
		* click stops the cue immediately and dismisses itself. A window.alert cannot
		* do this job — it blocks the JS thread, so the WebAudio cue would keep
		* playing behind it until it ends on its own.
		*/
		/** The modal surface. Any click — overlay, card, or button — stops playback. */
		function StopModal({ title, body, stopLabel, onStop }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: stop_modal_module_css_default.overlay,
				onClick: onStop,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: stop_modal_module_css_default.card,
					onClick: onStop,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": title,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: stop_modal_module_css_default.title,
							children: title
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: stop_modal_module_css_default.body,
							children: body
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: stop_modal_module_css_default.stop,
							onClick: onStop,
							children: stopLabel
						})
					]
				})
			});
		}
		let root = null;
		let host = null;
		/** Unmount and detach the current modal (no-op when none is open). */
		function closeStopModal() {
			if (root !== null) {
				root.unmount();
				root = null;
			}
			if (host !== null) {
				host.remove();
				host = null;
			}
		}
		/**
		* Mount the stop modal into document.body (replacing any open instance) and
		* return a closer. Clicking the modal calls {@link StopModalOptions.onStop}
		* exactly once and then closes.
		*/
		function showStopModal(options) {
			closeStopModal();
			if (typeof document === "undefined") return closeStopModal;
			let stopped = false;
			const dismiss = () => {
				if (stopped) return;
				stopped = true;
				options.onStop();
				closeStopModal();
			};
			host = document.createElement("div");
			document.body.appendChild(host);
			root = (0, react_dom_client.createRoot)(host);
			root.render(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(StopModal, {
				...options,
				onStop: dismiss
			}));
			return closeStopModal;
		}
		//#endregion
		//#region src/client/single-tab.ts
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
		const LEADER_KEY = "dsh-completion-sound:leader";
		/** How often the leader refreshes its claim (ms). */
		const HEARTBEAT_MS = 2e3;
		/** A leader is presumed dead after this long without a refresh (ms). */
		const LEADER_TTL_MS = 4500;
		/** Stable id for this tab for the lifetime of the page. */
		const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
		/** Whether the browser globals we need are present (false during SSR/build). */
		function hasStorage() {
			return typeof window !== "undefined" && typeof localStorage !== "undefined";
		}
		/** Read and validate the current leader record, or null when absent/malformed. */
		function readLeader() {
			if (!hasStorage()) return null;
			try {
				const raw = localStorage.getItem(LEADER_KEY);
				if (raw === null) return null;
				const parsed = JSON.parse(raw);
				if (typeof parsed.tabId !== "string" || typeof parsed.ts !== "number" || typeof parsed.visible !== "boolean") return null;
				return {
					tabId: parsed.tabId,
					ts: parsed.ts,
					visible: parsed.visible
				};
			} catch {
				return null;
			}
		}
		/** Write our claim (refresh or takeover), stamping the current visibility. */
		function writeLeader(visible) {
			if (!hasStorage()) return;
			try {
				localStorage.setItem(LEADER_KEY, JSON.stringify({
					tabId: TAB_ID,
					ts: Date.now(),
					visible
				}));
			} catch {}
		}
		/** Clear our claim (called when a leader tab is unloading). */
		function clearLeader() {
			if (!hasStorage()) return;
			try {
				localStorage.removeItem(LEADER_KEY);
			} catch {}
		}
		/**
		* Coordinates a single leader among the browser tabs open on this origin.
		* `isLeader()` reflects the current decision; call `start()` once during
		* plugin setup and `stop()` on teardown.
		*/
		var SingleTabCoordinator = class {
			/** Whether this tab currently holds leadership. Defaults to true until the first election. */
			leading = true;
			beatTimer;
			onStorage = (event) => {
				if (event.key === LEADER_KEY) this.elect();
			};
			onVisibility = () => {
				this.elect();
			};
			onPageHide = () => {
				if (this.leading) clearLeader();
			};
			/**
			* Begin heartbeating and listening for other tabs' claims. The first
			* election runs immediately so `isLeader()` is settled before any cue.
			*/
			start() {
				if (typeof window === "undefined") return;
				this.elect();
				this.beatTimer = setInterval(() => this.elect(), HEARTBEAT_MS);
				window.addEventListener("storage", this.onStorage);
				window.addEventListener("visibilitychange", this.onVisibility);
				window.addEventListener("pagehide", this.onPageHide);
			}
			/** Stop heartbeating, detach listeners, and hand the claim to another tab if we held it. */
			stop() {
				if (typeof window === "undefined") return;
				if (this.beatTimer !== void 0) {
					clearInterval(this.beatTimer);
					this.beatTimer = void 0;
				}
				window.removeEventListener("storage", this.onStorage);
				window.removeEventListener("visibilitychange", this.onVisibility);
				window.removeEventListener("pagehide", this.onPageHide);
				if (this.leading) clearLeader();
			}
			/** Whether this tab is currently the elected leader and may fire cues. */
			isLeader() {
				return this.leading;
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
			elect() {
				const now = Date.now();
				const leader = readLeader();
				const alive = leader !== null && now - leader.ts <= LEADER_TTL_MS;
				const iAmVisible = typeof document !== "undefined" && document.visibilityState === "visible";
				if (!alive) {
					writeLeader(iAmVisible);
					this.leading = true;
					return;
				}
				if (leader.tabId === TAB_ID) {
					writeLeader(iAmVisible);
					this.leading = true;
					return;
				}
				const otherVisible = leader.visible;
				if (otherVisible === true && iAmVisible !== true) {
					this.leading = false;
					return;
				}
				if (otherVisible !== true && iAmVisible === true) {
					writeLeader(iAmVisible);
					this.leading = true;
					return;
				}
				if (leader.tabId < TAB_ID) {
					this.leading = false;
					return;
				}
				writeLeader(iAmVisible);
				this.leading = true;
			}
		};
		//#endregion
		//#region src/client/index.ts
		/** Namespace owning this feature's settings-section copy. */
		const SETTINGS_NS = NS;
		/** Required services: sessions (completion watch) plus config forms/slots/locale for the section. */
		const inject = [
			"sessions",
			"slots",
			"locale",
			"configForms"
		];
		/** Defaults applied until the Host settings section resolves. */
		const DEFAULT_SETTINGS = Object.freeze({
			enabled: true,
			notify: false,
			volume: .5,
			longTaskMinutes: 10,
			special: true,
			specialPath: "",
			askAlert: true,
			askRepeatMinutes: 3,
			askPath: ""
		});
		/** Turn duration (ms) that earns the long-task cue instead of the short chime. */
		function longTaskMs(settings) {
			return settings.longTaskMinutes * 6e4;
		}
		/**
		* Client plugin body: register the section, prime audio on the first gesture,
		* watch the sessions list for running → idle transitions, and watch the Session
		* pending-interaction source for cards that need an answer.
		* @param ctx - client cordis context.
		*/
		function apply(ctx) {
			const form = ctx.configForms.get(COMPLETION_SOUND_SETTINGS_NAMESPACE);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-completion-sound: settings section dictionaries");
			if (typeof window !== "undefined") ctx.effect(() => {
				window.addEventListener("pointerdown", unlockAudio);
				window.addEventListener("keydown", unlockAudio);
				return () => {
					window.removeEventListener("pointerdown", unlockAudio);
					window.removeEventListener("keydown", unlockAudio);
				};
			}, "ui-completion-sound: audio unlock");
			const t = ctx.locale.bind(NS);
			const coordinator = new SingleTabCoordinator();
			ctx.effect(() => {
				coordinator.start();
				return () => coordinator.stop();
			}, "ui-completion-sound: single-tab leader election");
			/**
			* Start the special long-task cue and mount a dismissable overlay whose click
			* stops playback immediately (window.alert can't: it blocks JS, so the cue
			* would keep playing). Volume ≤ 0 skips both sound and modal.
			*/
			const playSpecialWithStop = (volume, specialPath) => {
				if (volume <= 0) return;
				showStopModal({
					title: t("completion-sound.modalTitle"),
					body: t("completion-sound.modalBody"),
					stopLabel: t("completion-sound.modalStop"),
					onStop: () => {
						stopSpecialSound();
					}
				});
				playSpecialSound(volume, specialPath).then((started) => {
					if (!started) closeStopModal();
				});
			};
			let settings = { ...DEFAULT_SETTINGS };
			let revision = 0;
			const store = createCompletionSoundSectionStore();
			let bound;
			const publish = () => {
				bound?.sync(settings, revision);
			};
			const adopt = () => {
				const value = form.getSnapshot().value;
				if (value === void 0) return;
				revision += 1;
				settings = {
					...DEFAULT_SETTINGS,
					...value
				};
				publish();
			};
			ctx.effect(() => form.subscribe(adopt), "ui-completion-sound: config form adoption");
			const write = (field, value) => {
				settings = {
					...settings,
					[field]: value
				};
				revision += 1;
				publish();
				form.set(field, value).catch(() => {});
			};
			const running = /* @__PURE__ */ new Map();
			ctx.effect(() => ctx.sessions.list.subscribe(() => {
				const snapshot = ctx.sessions.list.getSnapshot();
				const now = Date.now();
				const finished = [];
				const next = /* @__PURE__ */ new Map();
				for (const id of snapshot.ids) {
					const summary = snapshot.byId[id];
					const isRunning = summary?.running ?? false;
					const startedAt = running.get(id);
					if (isRunning) next.set(id, startedAt ?? now);
					else if (startedAt !== void 0) finished.push({
						title: summary?.displayTitle ?? id,
						elapsedMs: now - startedAt
					});
				}
				running.clear();
				for (const [id, startedAt] of next) running.set(id, startedAt);
				if (finished.length === 0) return;
				if (!coordinator.isLeader()) return;
				const title = finished.map((f) => f.title).join(", ");
				if (settings.enabled) {
					if (finished.some((f) => f.elapsedMs >= longTaskMs(settings)) && settings.special) playSpecialWithStop(settings.volume, settings.specialPath);
					else playCompletionChime(settings.volume);
				}
				if (settings.notify) notifyCompletion(t("completion-sound.notified"), title);
			}), "ui-completion-sound: sessions completion watch");
			ctx.inject(["uiSession"], (sessionCtx) => {
				const awaiting = /* @__PURE__ */ new Map();
				/** The card one session is currently waiting on, if any. */
				const pendingOf = (id) => sessionCtx.uiSession.sessionStatus.getSnapshot().get(id)?.pendingInteraction;
				/** Play the answer-needed cue: the selected file when usable, else the synthesized chime. */
				const playAskCue = () => {
					const volume = settings.volume;
					if (settings.askPath === "") {
						playAttentionChime(volume);
						return;
					}
					playAskSound(volume, settings.askPath).then((started) => {
						if (!started) playAttentionChime(volume);
					});
				};
				/** Raise one alert — cue plus notification — for the given waiting sessions. */
				const announce = (ids, repeated) => {
					if (ids.length === 0 || !settings.askAlert) return;
					if (!coordinator.isLeader()) return;
					const list = ctx.sessions.list.getSnapshot();
					const titles = ids.map((id) => list.byId[id]?.displayTitle ?? id).join(", ");
					const titleKey = ids.some((id) => awaiting.get(id)?.approving ?? false) ? repeated ? "completion-sound.askedApprovalAgain" : "completion-sound.askedApproval" : repeated ? "completion-sound.askedAgain" : "completion-sound.asked";
					playAskCue();
					notifyCompletion(t(titleKey), titles);
				};
				/** (Re)arm the re-alert timer for one session, if repeating is switched on. */
				const armRepeat = (id) => {
					const entry = awaiting.get(id);
					if (entry === void 0) return;
					if (entry.timer !== null) clearTimeout(entry.timer);
					entry.timer = null;
					if (settings.askRepeatMinutes <= 0) return;
					entry.timer = setTimeout(() => {
						entry.timer = null;
						const interaction = pendingOf(id);
						if (interaction === void 0 || interaction.key !== entry.key) return;
						announce([id], true);
						armRepeat(id);
					}, settings.askRepeatMinutes * 6e4);
				};
				/** Drop one session's announcement entirely (answered, cancelled, or replaced). */
				const retire = (id) => {
					const entry = awaiting.get(id);
					if (entry === void 0) return;
					if (entry.timer !== null) clearTimeout(entry.timer);
					awaiting.delete(id);
					if (awaiting.size === 0) stopAskSound();
				};
				const observe = () => {
					const snapshot = sessionCtx.uiSession.sessionStatus.getSnapshot();
					for (const [id, entry] of [...awaiting]) {
						const interaction = snapshot.get(id)?.pendingInteraction;
						if (interaction === void 0 || interaction.key !== entry.key) retire(id);
					}
					const arrivals = [];
					for (const [id, status] of snapshot) {
						const interaction = status.pendingInteraction;
						if (interaction === void 0 || awaiting.has(id)) continue;
						awaiting.set(id, {
							key: interaction.key,
							approving: interaction.kind === "approval",
							timer: null
						});
						arrivals.push(id);
					}
					if (!settings.askAlert) {
						for (const id of [...awaiting.keys()]) retire(id);
						return;
					}
					announce(arrivals, false);
					for (const id of arrivals) armRepeat(id);
				};
				for (const [id, status] of sessionCtx.uiSession.sessionStatus.getSnapshot()) {
					const interaction = status.pendingInteraction;
					if (interaction === void 0) continue;
					awaiting.set(id, {
						key: interaction.key,
						approving: interaction.kind === "approval",
						timer: null
					});
				}
				sessionCtx.effect(() => {
					const unsubscribe = sessionCtx.uiSession.sessionStatus.subscribe(observe);
					return () => {
						unsubscribe();
						for (const id of [...awaiting.keys()]) retire(id);
					};
				}, "ui-completion-sound: answer-needed watch");
			});
			const injected = (actions) => {
				bound = actions;
				publish();
				return {
					setEnabled: (value) => {
						write("enabled", value);
					},
					setNotify: (value) => {
						if (value) requestNotificationPermission();
						write("notify", value);
					},
					setVolume: (value) => {
						write("volume", value);
					},
					setLongTaskMinutes: (value) => {
						write("longTaskMinutes", value);
					},
					setSpecial: (value) => {
						write("special", value);
					},
					setSpecialPath: (value) => {
						write("specialPath", value);
					},
					setAskAlert: (value) => {
						if (value) requestNotificationPermission();
						write("askAlert", value);
					},
					setAskRepeatMinutes: (value) => {
						write("askRepeatMinutes", value);
					},
					setAskPath: (value) => {
						write("askPath", value);
					},
					previewChime: (volume) => {
						playCompletionChime(volume);
					},
					previewAsk: (volume, askPath) => {
						if (askPath === "") {
							playAttentionChime(volume);
							return;
						}
						playAskSound(volume, askPath).then((started) => {
							if (!started) playAttentionChime(volume);
						});
					},
					previewSpecial: (volume, specialPath) => {
						playSpecialWithStop(volume, specialPath);
					},
					testNotify: () => testNotification(t("completion-sound.notified"), t("completion-sound.notifyTestBody"))
				};
			};
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "completion-sound",
				order: 30,
				label: () => t("completion-sound.nav"),
				store,
				locale: NS,
				inject: injected
			}, CompletionSoundSection));
		}
		//#endregion
		exports.SETTINGS_NS = SETTINGS_NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map