window.__ModuleLoader__.load({
  id: 'dsh-deepbreath',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef } = React;

    const REC = 'http://127.0.0.1:8765';
    const CADENCE_MIN = 30;
    const SNOOZE_MIN = 15;
    const REDUCE = (typeof window !== 'undefined' && window.matchMedia)
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
    const LANG = ((typeof navigator !== 'undefined' && navigator.language) || 'zh').toLowerCase().indexOf('en') === 0 ? 'en' : 'zh';
    const TXT = {
      zh: {
        pillLoading: '呼吸', pillOffline: '记账离线 · 呼吸仍可用', pillDue: '到点啦 · 做 3 次长呼气',
        pillDone: function (n) { return '今天已呼吸 · 连续 ' + n + ' 天'; },
        pillStreak: function (n) { return '连续 ' + n + ' 天 · 今天还没做'; },
        pillIdle: '呼吸 · 今天还没做', pillTitle: '打开呼吸练习：做 3 次长呼气，完成自动记录',
        headerBtn: '呼吸', statsBtn: '统计', footBtn: '息',
        tabBreath: '练习', tabStats: '统计',
        eb: '行气导引 · 意到气到', title: '让这一口气，走完一整圈', sub: '吸 6 秒 → 停 1 秒 → 呼 4 秒 · 吸气长、呼气短 · 约 33 秒',
        cueIdle: '坐直，气沉丹田。吸气：气随横膈膜下沉、经丹田落到脚底涌泉；呼气：横膈膜上回弹，气自脚底经丹田松回、轻呼出。',
        cueInhale: '吸气：气随横膈膜下沉，经丹田落到脚底涌泉。',
        cueHold: '停 1 秒：气到涌泉，略停，别憋紧。',
        cueExhale: '呼气：横膈膜回弹，气自脚底经丹田轻呼出。',
        savedOk: '很好，完成了。今天已记录 ✓', savedQueued: '完成了。记录先存本地，稍后自动同步（不影响你呼吸）。', savedPending: '完成了，正在记录…',
        start: '开始 · 3 次', running: '进行中…', snooze: '稍后 15 分钟', done: '完成，回去干活',
        ariaClose: '关闭', ariaDialog: '呼吸',
        foot: '别用力、别憋气；头晕手麻即停。孕期/心肺疾病/腹部术后请先问医生。完成会写入本地。',
        footOffline: '⚠ 记账服务离线：本次先存本地、稍后自动补记，不影响呼吸。别用力、头晕即停；孕期/心肺病/腹部术后先问医生。',
        stToday: '今日', stStreakTotal: '连续 / 累计', stLast: '最近一次', stMissed: '距上次练习', stSend: '提醒邮箱',
        stDone: '已完成 ✓', stNotDone: '未完成', stTimes: '次', stDays: '天',
        setTitle: '设置', stRecipient: '收件邮箱', stThreshold: '连续漏做阈值',
        save: '保存设置', pauseToday: '暂停今天提醒', savedMsg: '已保存 ✓', pausedMsg: '已暂停今天的提醒 ✓', failMsg: '操作失败（记账服务离线？）', refresh: '刷新',
      },
      en: {
        pillLoading: 'Breath', pillOffline: 'Recorder offline · breathing still works', pillDue: 'Time to breathe · 3 long exhales',
        pillDone: function (n) { return 'Done today · ' + n + '-day streak'; },
        pillStreak: function (n) { return n + '-day streak · not yet today'; },
        pillIdle: 'Breathe · not yet today', pillTitle: 'Open a breathing session: 3 long exhales, recorded automatically',
        headerBtn: 'Breathe', statsBtn: 'Stats', footBtn: 'Shih',
        tabBreath: 'Practice', tabStats: 'Stats',
        eb: 'Guided qi flow', title: 'Let this breath complete a full circle', sub: 'Inhale 6s → hold 1s → exhale 4s · longer in, shorter out · ~33s',
        cueIdle: 'Sit tall, energy to the lower Dantian. Inhale: down with the diaphragm through the Dantian to the soles (Yongquan); exhale: the diaphragm springs up, energy releases from the soles through the Dantian.',
        cueInhale: 'Inhale: follow the diaphragm down, through the Dantian to the soles (Yongquan).',
        cueHold: 'Hold 1s: at the soles, pause gently.',
        cueExhale: 'Exhale: the diaphragm springs up, energy releases from the soles through the Dantian.',
        savedOk: 'Nice — done. Recorded for today ✓', savedQueued: 'Done. Saved locally, will sync later (breathing unaffected).', savedPending: 'Done, recording…',
        start: 'Start · 3', running: 'Running…', snooze: 'Snooze 15 min', done: 'Done, back to work',
        ariaClose: 'Close', ariaDialog: 'Breathing',
        foot: 'Do not force or hold your breath; stop if dizzy/tingling. If pregnant or with heart/lung/abdominal conditions, consult a doctor first. Completion is saved locally.',
        footOffline: '⚠ Recorder offline: saved locally, will retry. Do not force; stop if dizzy; consult a doctor if pregnant/heart/lung/abdominal.',
        stToday: 'Today', stStreakTotal: 'Streak / total', stLast: 'Last', stMissed: 'Since last', stSend: 'Reminder to',
        stDone: 'Done ✓', stNotDone: 'Not yet', stTimes: '', stDays: 'd',
        setTitle: 'Settings', stRecipient: 'Recipient', stThreshold: 'Miss threshold',
        save: 'Save', pauseToday: 'Pause today', savedMsg: 'Saved ✓', pausedMsg: 'Paused today\u2019s reminder ✓', failMsg: 'Failed (recorder offline?)', refresh: 'Refresh',
      },
    };
    const t = TXT[LANG];
    const EXTRA = {
      aiToast: LANG === 'en' ? 'Waiting on AI — take a ~33s breath?' : '在等 AI —— 顺手呼吸一下（约 33 秒）？',
      aiGo: LANG === 'en' ? 'Start' : '开始',
      aiSkip: LANG === 'en' ? 'Skip' : '跳过',
      dndLabel: LANG === 'en' ? 'Do not disturb' : '勿扰（暂不提醒）',
      hbIdle: LANG === 'en' ? 'Breathe' : '呼吸',
      hbDone: LANG === 'en' ? 'Done ✓' : '已息 ✓',
      hbDue: LANG === 'en' ? 'Breathe now' : '到点·呼吸',
      hbOff: LANG === 'en' ? 'Offline' : '离线',
      end: LANG === 'en' ? 'End' : '结束',
      stEmailBad: LANG === 'en' ? 'Invalid email format' : '邮箱格式不正确',
    };

    let lastActivity = Date.now();
    const AI_BUSY_MS = 20000, AI_IDLE_MS = 8000, AI_SKIP_MS = 20 * 60000;
    const store = { open: false, view: 'breath', autoStart: false, recOk: null, status: { todayDone: false, streak: 0, total: 0 }, due: false, dnd: false, aiNudge: false, aiSkipUntil: 0, nextRemindAt: Date.now() + CADENCE_MIN * 60000 };
    const listeners = new Set();
    function emit() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
    function useStore() {
      const [, setT] = useState(0);
      useEffect(function () {
        const f = function () { setT(function (x) { return x + 1; }); };
        listeners.add(f);
        return function () { listeners.delete(f); };
      }, []);
      return store;
    }
    function armReminder(min) { store.nextRemindAt = Date.now() + min * 60000; store.due = false; emit(); }
    function openBreath() { store.open = true; store.view = 'breath'; store.due = false; store.aiNudge = false; emit(); }
    function openAndStart() { store.open = true; store.view = 'breath'; store.due = false; store.aiNudge = false; store.autoStart = true; emit(); }
    function aiStart() { store.aiNudge = false; store.aiSkipUntil = Date.now() + AI_SKIP_MS; emit(); openAndStart(); }
    function aiSkip() { store.aiNudge = false; store.aiSkipUntil = Date.now() + AI_SKIP_MS; emit(); }

    async function refreshStatus() {
      try {
        const r = await fetch(REC + '/status', { cache: 'no-store' });
        const j = await r.json();
        if (j && j.ok) { store.status = j; store.recOk = true; } else { store.recOk = false; }
      } catch (e) { store.recOk = false; }
      emit();
    }
    async function recordDone(breaths) {
      const payload = { ts: new Date().toISOString(), breaths: breaths };
      try {
        const r = await fetch(REC + '/done', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('bad');
        let j = null; try { j = await r.json(); } catch (_) {} store.recOk = true; if (j) store.status = j; emit(); return true;
      } catch (e) {
        store.recOk = false;
        try { const q = JSON.parse(localStorage.getItem('shih.queue') || '[]'); q.push(payload); localStorage.setItem('shih.queue', JSON.stringify(q)); } catch (_) {}
        emit(); return false;
      }
    }
    async function flushQueue() {
      let q = [];
      try { q = JSON.parse(localStorage.getItem('shih.queue') || '[]'); } catch (_) {}
      if (!q.length) return;
      const remain = [];
      for (let i = 0; i < q.length; i++) {
        try { const r = await fetch(REC + '/done', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q[i]) }); if (!r.ok) remain.push(q[i]); }
        catch (e) { remain.push(q[i]); }
      }
      if (remain.length) localStorage.setItem('shih.queue', JSON.stringify(remain)); else localStorage.removeItem('shih.queue');
      refreshStatus();
    }

    const CSS = [
      '.shih-card{--ink:#171716;--sub:#6b6b66;--line:#e6e5e0;--accent:#b5482f;--accent-fg:#ffffff;--bg:#fbfbf9;--panel:#ffffff;--btn:#171716;--btn-fg:#ffffff;--sans:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;position:relative;width:min(600px,92vw);max-height:90vh;overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:26px 26px 20px;box-shadow:0 18px 44px rgba(0,0,0,.10);text-align:center;color:var(--ink);font-family:var(--sans);outline:none;}',
      '.shih-scrim{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.28);backdrop-filter:blur(4px);}',
      '.shih-x{position:absolute;top:12px;right:16px;border:none;background:none;font-size:22px;line-height:1;color:var(--sub);cursor:pointer;}',
      '.shih-tabs{display:flex;gap:26px;justify-content:center;margin:2px 0 18px;}',
      '.shih-tab{border:none;background:none;color:var(--sub);font-size:13.5px;padding:4px 2px;cursor:pointer;font-family:var(--sans);border-bottom:2px solid transparent;}',
      '.shih-tab.on{color:var(--ink);border-bottom-color:var(--ink);}',
      '.shih-eb{font-size:11px;letter-spacing:.22em;color:var(--sub);}',
      '.shih-title{font-size:26px;margin:8px 0 2px;font-weight:600;letter-spacing:.02em;}',
      '.shih-sub{font-size:12.5px;color:var(--sub);margin-bottom:6px;}',
      '.shih-stage{position:relative;height:220px;display:flex;align-items:center;justify-content:center;margin:8px 0;}',
      '.shih-glow{display:none;}',
      '.shih-pacer{width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 42% 36%,#ffffff,#f1f0ec 60%,#e7e6e1);border:1px solid var(--line);box-shadow:inset 0 2px 8px rgba(255,255,255,.9),0 10px 26px rgba(0,0,0,.07);will-change:transform;}',
      '.shih-phaselabel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;}',
      '.shih-plabel-phase{font-size:18px;font-weight:600;color:var(--ink);letter-spacing:.04em;}',
      '.shih-plabel-num{font-size:15px;color:var(--sub);font-variant-numeric:tabular-nums;}',
      '.shih-plabel-phase.big{font-size:22px;letter-spacing:.08em;}',
      '.shih-cue{font-size:13px;color:var(--sub);line-height:1.6;min-height:40px;margin:6px 0;}',
      '.shih-dots{display:flex;gap:8px;justify-content:center;margin:10px 0 16px;}',
      '.shih-dots i{width:7px;height:7px;border-radius:50%;background:var(--line);}',
      '.shih-dots i.on{background:var(--accent);}',
      '.shih-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}',
      '.shih-btn{border:1px solid var(--line);background:transparent;border-radius:9px;padding:10px 20px;font-size:13.5px;color:var(--sub);cursor:pointer;font-family:var(--sans);}',
      '.shih-btn:hover{border-color:var(--ink);color:var(--ink);}',
      '.shih-btn.primary{background:var(--btn);border-color:var(--btn);color:var(--btn-fg);}',
      '.shih-btn.primary:hover{opacity:.9;color:var(--btn-fg);border-color:var(--btn);}',
      '.shih-btn.primary:disabled{opacity:.5;cursor:default;}',
      '.shih-x:focus-visible,.shih-headerbtn:focus-visible,.shih-tab:focus-visible,.shih-btn:focus-visible,.shih-setlink:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}',
      '.shih-foot{font-size:11.5px;color:var(--sub);margin-top:14px;line-height:1.6;}',
      '.shih-stats{text-align:left;font-size:13.5px;}',
      '.shih-sec-title{font-weight:600;margin:4px 0 8px;font-size:11.5px;letter-spacing:.18em;color:var(--accent);text-align:left;}',
      '.shih-field{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 2px;font-size:12.5px;color:var(--ink);text-align:left;}',
      '.shih-field input:not([type=checkbox]),.shih-field select{border:1px solid var(--line);background:#ffffff;border-radius:8px;padding:6px 9px;font-size:12.5px;color:var(--ink);font-family:var(--sans);min-width:200px;}',
      '.shih-field input[type=checkbox]{min-width:auto;width:16px;height:16px;accent-color:var(--accent);}',
      '.shih-msg{font-size:12px;color:var(--accent);margin-top:8px;text-align:center;}',
      '.shih-hero{display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px 0 2px;}',
      '.shih-seal{width:58px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;border:1px solid var(--line);color:var(--sub);background:transparent;}',
      '.shih-seal.on{background:var(--accent);border-color:var(--accent);color:var(--accent-fg);box-shadow:0 6px 16px rgba(181,72,47,.28);}',
      '.shih-heroline{font-size:15px;font-weight:600;color:var(--ink);}',
      '.shih-daygrid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin:16px 2px 4px;}',
      '.shih-cell{aspect-ratio:1/1;border-radius:8px;border:1px solid var(--line);background:#f3f2ee;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--sub);}',
      '.shih-cell i{font-style:normal;font-size:12px;line-height:1;}',
      '.shih-cell.on{background:var(--accent);border-color:var(--accent);color:var(--accent-fg);}',
      '.shih-cell.today{outline:2px solid rgba(181,72,47,.45);outline-offset:2px;}',
      '.shih-cell-dow{font-size:9.5px;opacity:.8;}',
      '.shih-nums{display:flex;justify-content:space-around;margin:16px 0 4px;text-align:center;}',
      '.shih-numitem{padding:0 8px;} .shih-numitem + .shih-numitem{border-left:1px solid var(--line);}',
      '.shih-numitem .n{font-size:22px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums;}',
      '.shih-numitem .l{font-size:11px;color:var(--sub);margin-top:3px;}',
      '.shih-statsfoot{display:flex;justify-content:flex-end;margin-top:14px;}',
      '.shih-setlink{font-size:12.5px;color:var(--accent);cursor:pointer;}',
      '.shih-offline{font-size:13px;color:var(--sub);text-align:center;padding:18px 4px;}',
      '.shih-hint{display:flex;gap:8px;align-items:center;justify-content:space-between;background:rgba(181,72,47,.06);border:1px solid rgba(181,72,47,.22);border-radius:10px;padding:9px 12px;margin-bottom:12px;font-size:11.5px;color:var(--sub);text-align:left;line-height:1.6;}',
      '.shih-hint-x{border:none;background:var(--accent);color:var(--accent-fg);border-radius:7px;padding:4px 10px;font-size:11.5px;cursor:pointer;white-space:nowrap;flex:0 0 auto;}',
      '.shih-headerbtn{--hb:#171716;--hba:#b5482f;display:inline-flex;align-items:center;gap:6px;background:#ffffff;border:1px solid #e6e5e0;border-radius:9px;padding:5px 12px;font-size:12.5px;font-weight:600;color:var(--hb);cursor:pointer;font-family:var(--sans);letter-spacing:.02em;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,.08);}',
      '.shih-headerbtn:hover{border-color:var(--hb);}',
      '.shih-headerbtn.done{background:transparent;border-color:rgba(181,72,47,.35);color:var(--hba);}',
      '.shih-headerbtn.due{color:var(--hba);border-color:var(--hba);animation:shih-pulse 2.2s ease-in-out infinite;}',
      '.shih-dot{width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.85;}',
      '@keyframes shih-pulse{0%,100%{box-shadow:0 0 0 0 rgba(181,72,47,0);}50%{box-shadow:0 0 0 5px rgba(181,72,47,.2);}}',
      '.shih-toast{--ink:#171716;--sub:#6b6b66;--line:#e6e5e0;--accent:#b5482f;position:fixed;right:18px;bottom:18px;z-index:60;display:flex;align-items:center;gap:10px;background:#ffffff;border:1px solid var(--line);border-radius:14px;padding:12px 14px;box-shadow:0 12px 34px rgba(0,0,0,.16);max-width:340px;text-align:left;color:var(--ink);font-family:var(--sans);}',
      '.shih-toast-t{font-size:13px;line-height:1.4;}',
      '.shih-toast-b{border:1px solid var(--line);background:transparent;color:var(--sub);border-radius:8px;padding:6px 11px;font-size:12.5px;cursor:pointer;white-space:nowrap;font-family:var(--sans);}',
      '.shih-toast-b.primary{background:var(--accent);border-color:var(--accent);color:#ffffff;}',
      '@media (prefers-reduced-motion: reduce){.shih-headerbtn.due{animation:none;}}',
      '@media (prefers-color-scheme: dark){',
        '.shih-card{--ink:#ececec;--sub:#9a9a95;--line:rgba(255,255,255,.10);--accent:#c9644a;--accent-fg:#141414;--bg:#141414;--panel:#1b1b19;--btn:#f0efeb;--btn-fg:#171716;border-color:rgba(255,255,255,.08);box-shadow:0 18px 44px rgba(0,0,0,.5);}',
        '.shih-scrim{background:rgba(0,0,0,.55);}',
        '.shih-pacer{background:radial-gradient(circle at 42% 36%,#232323,#1a1a18 70%);border-color:rgba(255,255,255,.1);box-shadow:inset 0 2px 8px rgba(255,255,255,.06),0 10px 26px rgba(0,0,0,.4);}',
        '.shih-cell{background:#1f1f1d;border-color:rgba(255,255,255,.09);}',
        '.shih-field input:not([type=checkbox]),.shih-field select{background:rgba(255,255,255,.06);}',
        '.shih-headerbtn{--hb:#ececec;--hba:#c9644a;background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);box-shadow:none;}',
        '.shih-headerbtn.done{background:transparent;border-color:rgba(201,100,74,.6);}',
        '.shih-toast{background:#1b1b19;border-color:rgba(255,255,255,.1);color:#ececec;}',
        '.shih-hint{background:rgba(201,100,74,.1);border-color:rgba(201,100,74,.3);}',
      '}',
    ].join('');

    function Styles() { return h('style', { dangerouslySetInnerHTML: { __html: CSS } }); }
    function ease(p) { return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; }

    class ErrorBoundary extends React.Component {
      constructor(props) { super(props); this.state = { err: null }; }
      static getDerivedStateFromError(e) { return { err: e }; }
      componentDidCatch(e) { try { console.error('[shih] render error:', e); } catch (_) {} }
      render() {
        if (this.state.err) {
          return h('span', { title: '息 渲染出错：' + (this.state.err && this.state.err.message || this.state.err), style: { color: 'var(--dsw-alias-state-error-primary,#c0392b)', fontSize: '11px', padding: '2px 6px' } }, '息 ⚠');
        }
        return this.props.children;
      }
    }

    function HeaderButtons(props) {
      useStore();
      const sid = props.sessionId;
      const running = !!props.useSessionStatus(function (m) {
        const v = sid != null ? m.get(sid) : undefined;
        return !!(v && v.running);
      });
      useEffect(function () {
        try { store.dnd = localStorage.getItem('shih.dnd') === '1'; } catch (e) {}
        refreshStatus(); flushQueue();
        const tt = setInterval(refreshStatus, 60000);
        return function () { clearInterval(tt); if (store.open) { store.open = false; } if (store.aiNudge) { store.aiNudge = false; } emit(); };
      }, []);
      useEffect(function () {
        const tt = setInterval(function () {
          if (store.dnd) return;
          if (store.recOk === false) return;
          if (store.status && store.status.todayDone) { if (store.due) { store.due = false; emit(); } return; }
          if (Date.now() >= store.nextRemindAt && !store.due) { store.due = true; emit(); }
        }, 15000);
        return function () { clearInterval(tt); };
      }, []);
      const busySinceRef = useRef(0);
      useEffect(function () {
        if (running) { if (!busySinceRef.current) busySinceRef.current = Date.now(); }
        else { busySinceRef.current = 0; if (store.aiNudge) { store.aiNudge = false; emit(); } }
      }, [running]);
      useEffect(function () {
        if (!running) return;
        const tt = setInterval(function () {
          if (store.dnd || store.open || store.aiNudge || store.recOk === false) return;
          if (store.status && store.status.todayDone) return;
          if (Date.now() < store.aiSkipUntil) return;
          const busyMs = busySinceRef.current ? (Date.now() - busySinceRef.current) : 0;
          if (busyMs >= AI_BUSY_MS && (Date.now() - lastActivity) >= AI_IDLE_MS) { store.aiNudge = true; emit(); }
        }, 2000);
        return function () { clearInterval(tt); };
      }, [running]);
      const s = store.status || {};
      const done = !!s.todayDone, offline = store.recOk === false, due = store.due && !done && !offline && !store.dnd;
      let cls = 'shih-headerbtn';
      if (done) cls += ' done'; else if (offline) cls += ' offline'; else if (due) cls += ' due';
      const lbl = offline ? EXTRA.hbOff : (done ? EXTRA.hbDone : (due ? EXTRA.hbDue : EXTRA.hbIdle));
      return h(React.Fragment, null, h(Styles),
        h('button', { className: cls, title: lbl, 'aria-label': lbl, onClick: openBreath }, h('span', { className: 'shih-dot' }), h('span', null, lbl)));
    }

    function StatsView() {
      const [s, setS] = useState(null);
      const [hist, setHist] = useState([]);
      const [recipient, setRecipient] = useState('');
      const [threshold, setThreshold] = useState('1');
      const [msg, setMsg] = useState('');
      const [dnd, setDnd] = useState(!!store.dnd);
      const [err, setErr] = useState(false);
      const [showSettings, setShowSettings] = useState(false);

      function load() {
        setErr(false);
        fetch(REC + '/status').then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); }).then(function (j) { setS(j); }).catch(function () { setErr(true); });
        fetch(REC + '/history?days=7').then(function (r) { return r.json(); }).then(function (j) { setHist((j && j.days) || []); }).catch(function () {});
        fetch(REC + '/config').then(function (r) { return r.json(); }).then(function (j) {
          setRecipient(j.recipient || '');
          setThreshold(String(j.threshold_missed_days || 1));
        }).catch(function () {});
      }
      useEffect(function () { load(); }, []);

      function save() {
        const rc = String(recipient).trim();
        if (rc && rc.indexOf('@') < 0) { setMsg(EXTRA.stEmailBad); return; }
        const body = { recipient: rc, threshold_missed_days: Number(threshold) };
        fetch(REC + '/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          .then(function (r) { return r.json(); }).then(function () { setMsg(t.savedMsg); load(); }).catch(function () { setMsg(t.failMsg); });
      }
      function pauseToday() {
        const d = new Date();
        const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        fetch(REC + '/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pause_date: ds }) })
          .then(function () { setMsg(t.pausedMsg); }).catch(function () { setMsg(t.failMsg); });
      }

      const DOW = LANG === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['日', '一', '二', '三', '四', '五', '六'];
      function dow(ds) { try { return DOW[new Date(ds + 'T00:00:00').getDay()]; } catch (e) { return ''; } }
      const weekDone = hist.filter(function (x) { return x.done; }).length;
      const todayDone = !!(s && s.todayDone);
      const streakN = s ? (s.streak || 0) : 0;
      const longest = s ? (s.longest || 0) : 0;

      if (err) {
        return h('div', { className: 'shih-stats' },
          h('div', { className: 'shih-offline' }, LANG === 'en' ? 'Recorder offline — stats unavailable.' : '记账服务离线，统计暂不可用。'),
          h('div', { className: 'shih-actions', style: { justifyContent: 'center', marginTop: '12px' } },
            h('button', { className: 'shih-btn primary', onClick: load }, LANG === 'en' ? 'Retry' : '重试')));
      }
      if (showSettings) {
        return h('div', { className: 'shih-stats' },
          h('div', { className: 'shih-sec-title' }, t.setTitle),
          h('label', { className: 'shih-field' }, h('span', null, t.stRecipient), h('input', { value: recipient, onChange: function (e) { setRecipient(e.target.value); }, placeholder: 'you@example.com' })),
          h('label', { className: 'shih-field' }, h('span', null, t.stThreshold), h('select', { value: threshold, onChange: function (e) { setThreshold(e.target.value); } },
            h('option', { value: '1' }, '1 ' + t.stDays), h('option', { value: '2' }, '2 ' + t.stDays), h('option', { value: '3' }, '3 ' + t.stDays))),
          h('label', { className: 'shih-field' }, h('span', null, EXTRA.dndLabel), h('input', { type: 'checkbox', checked: dnd, onChange: function (e) { setDnd(e.target.checked); store.dnd = e.target.checked; if (e.target.checked) store.aiNudge = false; try { localStorage.setItem('shih.dnd', e.target.checked ? '1' : '0'); } catch (_) {} emit(); } })),
          h('div', { className: 'shih-actions', style: { marginTop: '10px' } },
            h('button', { className: 'shih-btn primary', onClick: save }, t.save),
            h('button', { className: 'shih-btn', onClick: pauseToday }, t.pauseToday)),
          msg ? h('div', { className: 'shih-msg' }, msg) : null,
          h('div', { className: 'shih-statsfoot' }, h('div', { className: 'shih-setlink', onClick: function () { setShowSettings(false); setMsg(''); } }, '‹ ' + (LANG === 'en' ? 'Back' : '返回'))));
      }

      return h('div', { className: 'shih-stats' },
        h('div', { className: 'shih-hero' },
          h('div', { className: 'shih-seal' + (todayDone ? ' on' : ''), 'aria-label': todayDone ? (LANG === 'en' ? 'Marked today' : '今日已印') : (LANG === 'en' ? 'Not yet today' : '今日未印') }, '印'),
          h('div', { className: 'shih-heroline' }, todayDone
            ? (LANG === 'en' ? ('Marked today' + (streakN > 1 ? ' · ' + streakN + '-day streak' : '')) : ('今日已印' + (streakN > 1 ? ' · 连续 ' + streakN + ' 天' : '')))
            : (LANG === 'en' ? 'Not yet today' : '今日未印'))),
        (!todayDone) ? h('div', { className: 'shih-actions', style: { marginTop: '4px' } },
          h('button', { className: 'shih-btn primary', onClick: openAndStart }, LANG === 'en' ? 'Breathe now · ~33s' : '现在补一次 · 约 33 秒')) : null,
        h('div', { className: 'shih-daygrid' }, hist.map(function (x, i) {
          return h('div', { key: i, className: 'shih-cell' + (x.done ? ' on' : '') + (i === hist.length - 1 ? ' today' : ''), 'aria-label': (x.date || '') + (x.done ? (LANG === 'en' ? ' done' : ' 已印') : (LANG === 'en' ? ' none' : ' 未印')) },
            h('span', { className: 'shih-cell-dow' }, dow(x.date)),
            h('i', null, x.done ? '印' : ''));
        })),
        h('div', { className: 'shih-nums' },
          h('div', { className: 'shih-numitem' }, h('div', { className: 'n' }, weekDone + '/7'), h('div', { className: 'l' }, LANG === 'en' ? 'last 7d' : '近7天')),
          h('div', { className: 'shih-numitem' }, h('div', { className: 'n' }, s ? s.total : '…'), h('div', { className: 'l' }, LANG === 'en' ? 'days total' : '累计(天)')),
          h('div', { className: 'shih-numitem' }, h('div', { className: 'n' }, s ? longest : '…'), h('div', { className: 'l' }, LANG === 'en' ? 'longest' : '最长'))),
        h('div', { className: 'shih-statsfoot' },
          h('div', { className: 'shih-setlink', onClick: function () { setShowSettings(true); } }, (LANG === 'en' ? 'Settings' : '设置') + ' ▸')));
    }

    function Overlay() {
      useStore();
      const [run, setRun] = useState(false);
      const [phase, setPhase] = useState('idle');
      const [num, setNum] = useState(0);
      const [breaths, setBreaths] = useState(0);
      const [saved, setSaved] = useState(false);
      const [recordState, setRecordState] = useState('idle');
      const [showHint, setShowHint] = useState(false);
      const pacerRef = useRef(null), glowRef = useRef(null), cardRef = useRef(null);
      const target = 3, IN = 6, HOLD = 1, EX = 4;

      useEffect(function () {
        if (store.open && store.view === 'breath') {
          try { setShowHint(!localStorage.getItem('shih.seenHint')); } catch (e) { setShowHint(false); }
        }
      }, [store.open, store.view]);
      useEffect(function () {
        if (store.open && store.autoStart) { store.autoStart = false; if (!run && !saved) start(); }
      }, [store.open, store.autoStart]);
      useEffect(function () {
        if (!store.open && run) { setRun(false); setPhase('idle'); setNum(0); setBreaths(0); }
      }, [store.open, run]);

      useEffect(function () {
        if (!store.open) return;
        const prev = document.activeElement;
        const card = cardRef.current;
        try {
          const pb = card && card.querySelector('.shih-btn.primary');
          if (pb && pb.focus) pb.focus();
          else if (card && card.focus) card.focus();
        } catch (e) {}
        function onKey(e) {
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
          if (e.key === 'Tab' && card) {
            const els = Array.prototype.slice.call(card.querySelectorAll('button, input, select')).filter(function (b) { return !b.disabled; });
            if (!els.length) return;
            const first = els[0], last = els[els.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
        document.addEventListener('keydown', onKey, true);
        return function () { document.removeEventListener('keydown', onKey, true); try { if (prev && prev.focus) prev.focus(); } catch (e) {} };
      }, [store.open]);

      useEffect(function () {
        if (!run) return;
        let phaseLocal = 'inhale', phaseStart = performance.now(), bs = 0, raf = 0, cancelled = false, lastPhase = '', lastNum = -1;
        function setScale(s) { if (REDUCE) return; if (pacerRef.current) pacerRef.current.style.transform = 'scale(' + s + ')'; if (glowRef.current) glowRef.current.style.transform = 'scale(' + (s * 1.12) + ')'; }
        function finish() { setRun(false); setPhase('✓'); setNum(''); setSaved(true); setRecordState('pending'); recordDone(target).then(function (ok) { setRecordState(ok ? 'ok' : 'queued'); }); }
        function tick(now) {
          if (cancelled) return;
          const tt = (now - phaseStart) / 1000;
          if (phaseLocal === 'inhale') {
            const p = Math.min(tt / IN, 1); setScale(0.7 + 0.42 * ease(p));
            const ph = LANG === 'en' ? 'Inhale' : '吸气'; if (lastPhase !== ph) { setPhase(ph); lastPhase = ph; }
            const nn = Math.max(1, Math.ceil(IN - tt)); if (nn !== lastNum) { setNum(nn); lastNum = nn; }
            if (p >= 1) { phaseLocal = 'hold'; phaseStart = now; }
          } else if (phaseLocal === 'hold') {
            setScale(1.12);
            const ph = LANG === 'en' ? 'Hold' : '停'; if (lastPhase !== ph) { setPhase(ph); lastPhase = ph; }
            const nn = Math.max(1, Math.ceil(HOLD - tt)); if (nn !== lastNum) { setNum(nn); lastNum = nn; }
            if (tt >= HOLD) { phaseLocal = 'exhale'; phaseStart = now; }
          } else {
            const p = Math.min(tt / EX, 1); setScale(1.12 - 0.42 * ease(p));
            const ph = LANG === 'en' ? 'Exhale' : '呼气'; if (lastPhase !== ph) { setPhase(ph); lastPhase = ph; }
            const nn = Math.max(1, Math.ceil(EX - tt)); if (nn !== lastNum) { setNum(nn); lastNum = nn; }
            if (p >= 1) { bs += 1; setBreaths(bs); if (bs >= target) { finish(); return; } phaseLocal = 'inhale'; phaseStart = now; }
          }
          raf = requestAnimationFrame(tick);
        }
        raf = requestAnimationFrame(tick);
        return function () { cancelled = true; cancelAnimationFrame(raf); };
      }, [run]);

      function start() { setBreaths(0); setSaved(false); setRecordState('idle'); setPhase(LANG === 'en' ? 'Inhale' : '吸气'); setNum(IN); if (pacerRef.current && !REDUCE) pacerRef.current.style.transform = 'scale(0.7)'; setRun(true); }
      function close() { setRun(false); store.open = false; setPhase('idle'); setNum(0); setBreaths(0); setSaved(false); setRecordState('idle'); emit(); }
      function snooze() { close(); armReminder(SNOOZE_MIN); }
      function setView(v) { store.view = v; emit(); }

      if (!store.open) {
        if (store.aiNudge && !store.dnd) {
          return h(React.Fragment, null, h(Styles),
            h('div', { className: 'shih-toast', role: 'status' },
              h('span', { className: 'shih-toast-t' }, EXTRA.aiToast),
              h('button', { className: 'shih-toast-b primary', onClick: aiStart }, EXTRA.aiGo),
              h('button', { className: 'shih-toast-b', onClick: aiSkip }, EXTRA.aiSkip)));
        }
        return null;
      }
      const view = run ? 'breath' : (store.view || 'breath');
      const offline = store.recOk === false;
      let cue;
      if (saved) cue = recordState === 'queued' ? t.savedQueued : (recordState === 'pending' ? t.savedPending : t.savedOk);
      else if (run) {
        if (phase === (LANG === 'en' ? 'Exhale' : '呼气')) cue = t.cueExhale;
        else if (phase === (LANG === 'en' ? 'Hold' : '停')) cue = t.cueHold;
        else cue = t.cueInhale;
      } else cue = t.cueIdle;
      const foot = offline ? t.footOffline : t.foot;
      const orbPhase = (!run && !saved) ? '息' : phase;
      const orbNum = run ? num : '';

      const breathBody = [
        showHint ? h('div', { className: 'shih-hint', key: 'hint' },
          h('span', null, '第一次用：点「开始」跟着圆做 3 次，做完自动记录；以后点右上「呼吸」或按 Ctrl+Shift+B 即可。'),
          h('button', { className: 'shih-hint-x', onClick: function () { try { localStorage.setItem('shih.seenHint', '1'); } catch (e) {} setShowHint(false); } }, '知道了')) : null,
        h('div', { className: 'shih-eb', key: 'eb' }, t.eb),
        h('div', { className: 'shih-title', key: 'ti' }, t.title),
        h('div', { className: 'shih-sub', key: 'su' }, t.sub),
        h('div', { className: 'shih-stage', key: 'st', 'aria-hidden': 'true' },
          h('div', { className: 'shih-glow', ref: glowRef }),
          h('div', { className: 'shih-pacer', ref: pacerRef }),
          h('div', { className: 'shih-phaselabel' },
            h('div', { className: 'shih-plabel-phase' + (orbNum ? '' : ' big') }, orbPhase),
            orbNum ? h('div', { className: 'shih-plabel-num' }, orbNum) : null)),
        h('div', { className: 'shih-cue', key: 'cu', 'aria-live': 'polite' }, cue),
        h('div', { className: 'shih-dots', key: 'do' }, [0, 1, 2].map(function (i) { return h('i', { key: i, className: i < breaths ? 'on' : '' }); })),
        saved
          ? h('div', { className: 'shih-actions', key: 'ac' }, h('button', { className: 'shih-btn primary', onClick: function () { close(); armReminder(CADENCE_MIN); } }, t.done))
          : run
            ? h('div', { className: 'shih-actions', key: 'ac' }, h('button', { className: 'shih-btn', onClick: close }, EXTRA.end))
            : h('div', { className: 'shih-actions', key: 'ac' },
                h('button', { className: 'shih-btn primary', onClick: start }, t.start),
                h('button', { className: 'shih-btn', onClick: snooze }, t.snooze)),
        h('div', { className: 'shih-foot', key: 'fo' }, foot),
      ];

      return h(React.Fragment, null, h(Styles),
        h('div', { className: 'shih-scrim', onClick: function (e) { if (e.target === e.currentTarget) close(); } },
          h('div', { className: 'shih-card', ref: cardRef, tabIndex: -1, role: 'dialog', 'aria-modal': 'true', 'aria-label': t.ariaDialog },
            h('button', { className: 'shih-x', 'aria-label': t.ariaClose, onClick: close }, '×'),
            (!run) ? h('div', { className: 'shih-tabs', role: 'tablist' },
              h('button', { className: 'shih-tab' + (view === 'breath' ? ' on' : ''), role: 'tab', 'aria-selected': view === 'breath', onClick: function () { setView('breath'); } }, t.tabBreath),
              h('button', { className: 'shih-tab' + (view === 'stats' ? ' on' : ''), role: 'tab', 'aria-selected': view === 'stats', onClick: function () { setView('stats'); } }, t.tabStats)) : null,
            view === 'stats' ? h(StatsView) : breathBody
          )
        )
      );
    }

    function wrap(Comp) { return function (props) { return h(ErrorBoundary, null, h(Comp, props)); }; }

    return {
      inject: ['slots'],
      apply(ctx) {
        try {
          const onKey = function (e) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
              e.preventDefault(); openAndStart();
            }
          };
          if (ctx.effect) {
            ctx.effect(function () { document.addEventListener('keydown', onKey, true); return function () { document.removeEventListener('keydown', onKey, true); }; });
          } else {
            document.addEventListener('keydown', onKey, true);
          }
        } catch (e) {}
        try {
          const mark = function () { lastActivity = Date.now(); };
          const evs = ['pointerdown', 'keydown', 'mousemove', 'wheel', 'touchstart'];
          if (ctx.effect) {
            ctx.effect(function () {
              evs.forEach(function (ev) { document.addEventListener(ev, mark, { passive: true, capture: true }); });
              return function () { evs.forEach(function (ev) { document.removeEventListener(ev, mark, { capture: true }); }); };
            });
          } else {
            evs.forEach(function (ev) { document.addEventListener(ev, mark, { passive: true, capture: true }); });
          }
        } catch (e) {}
        ctx.slots.inject('conversation.session.header.utilities', function () {
          return ctx.slots.register({ name: 'conversation.session.header.utilities', id: 'shih-header', order: 5 }, wrap(HeaderButtons));
        });
        ctx.slots.inject('shell.overlay', function () {
          return ctx.slots.register({ name: 'shell.overlay', id: 'shih-overlay', order: 20 }, wrap(Overlay));
        });
      },
    };
  },
});
