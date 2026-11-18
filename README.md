# dsh-deepbreath

> **这是一个 DeepSeek Harness（DSH）插件 · A DeepSeek Harness (DSH) plugin.**
> 在 GitHub 上可通过 topic `dsh-plugin`、`dsh`、`deepseek-harness` 发现本仓库。

A DeepSeek Harness (DSH) session-view plugin for a short, guided breathing break — an ambient "Breathe" entry in the session header that opens a paced card.

- **Guided qi-flow breathing**: inhale 6s → hold 1s → exhale 4s (inhale long, exhale short). Inhale visualization: crown (Baihui) → lower Dantian → soles (Yongquan). Exhale: the diaphragm springs up and energy releases from the soles through the Dantian.
- **Practice / Stats tabs**: a one-tap practice card, plus a stats & settings panel (today, streak, total, 7-day bars; recipient, threshold).
- **Global shortcut**: `Ctrl/⌘ + Shift + B` opens the card and starts a session.
- **Wait-for-AI nudge (event-driven)**: when the assistant is generating (`SessionStatus.running`) and you have been idle a few seconds, a small non-blocking "take a ~33s breath?" toast appears (Start / Skip); it auto-dismisses when the answer is ready. A fixed cadence + pre-break pulse also remain.
- **Do not disturb**: a toggle in the Stats panel pauses all reminders.
- **Local completion recording**: each completed session is posted to a local recorder (`127.0.0.1:8765`) and stored on your machine. If the recorder is not running, completions are queued locally and synced later.
- **Accessible**: dialog semantics, focus trap, Esc to close, `aria-live` phase guidance, respects `prefers-reduced-motion`, theme-token styling (light/dark).

## Install (into a DSH profile)

This is a DSH bundle. Install it via **Plugins → Add plugin** (choose this directory), or with `plugin_manager install_bundle` pointing at this folder. It registers a single **Breathe** entry in the session header; the card has **Practice** and **Stats** tabs.

## Notes / limitations

- The in-app plugin only records completions and shows stats. The optional local companion (a tiny recorder + an optional daily "missed-a-day" email job) lives in [`tools/`](tools/README.md) — each user configures their **own** sender mailbox and authorization code (stored in a local `.env`, never committed/shared). See `tools/README.md`.
- Breathing is a relaxation exercise, **not medical advice**. Do not force or hold your breath; stop if dizzy. If pregnant or with heart/lung/abdominal conditions, consult a doctor first.
- No session content is read or sent; completions are stored locally.

## License

MIT (personal project — adjust as needed).

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
