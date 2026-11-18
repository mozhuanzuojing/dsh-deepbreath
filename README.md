# dsh-deepbreath

A DeepSeek Harness (DSH) session-view plugin for a short, guided breathing break — an ambient "Breathe" entry in the session header that opens a paced card.

- **Guided qi-flow breathing**: inhale 6s → hold 1s → exhale 4s (inhale long, exhale short). Inhale visualization: crown (Baihui) → lower Dantian → soles (Yongquan); exhale reverses.
- **Practice / Stats tabs**: a one-tap practice card, plus a stats & settings panel (today, streak, total, 7-day bars; recipient, threshold, dry-run).
- **Global shortcut**: `Ctrl/⌘ + Shift + B` opens the card and starts a session.
- **Local completion recording**: each completed session is posted to a local recorder (`127.0.0.1:8765`) and stored on your machine. If the recorder is not running, completions are queued locally and synced later.
- **Accessible**: dialog semantics, focus trap, Esc to close, `aria-live` phase guidance, respects `prefers-reduced-motion`, theme-token styling (light/dark).

## Install (into a DSH profile)

This is a DSH bundle. Install it via **Plugins → Add plugin** (choose this directory), or with `plugin_manager install_bundle` pointing at this folder. It registers a single **Breathe** entry in the session header; the card has **Practice** and **Stats** tabs.

## Notes / limitations

- The in-app plugin only records completions and shows stats. A separate local helper (a tiny recorder + an optional daily "missed-a-day" email job) is intentionally **not** bundled here — this repo contains the DSH plugin only.
- Breathing is a relaxation exercise, **not medical advice**. Do not force or hold your breath; stop if dizzy. If pregnant or with heart/lung/abdominal conditions, consult a doctor first.
- No session content is read or sent; completions are stored locally.

## License

MIT (personal project — adjust as needed).
