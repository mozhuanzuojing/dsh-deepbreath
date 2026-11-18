window.__ModuleLoader__.load({
  id: 'dsh-deepbreath',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef } = React;

    const REC = 'http://127.0.0.1:8765';
    const CADENCE_MIN = 50;
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
        eb: '行气导引 · 意到气到', title: '让这一口气，走完一整圈', sub: '吸 6 秒 → 停 1 秒 → 呼 4 秒 · 吸气长、呼气短',
        cueIdle: '坐直，气沉丹田。吸气：百会 → 丹田 → 涌泉；呼气：涌泉 → 丹田 → 百会。',
        cueInhale: '吸气（长）：意想气自头顶「百会」，经「下丹田」，下行至脚底「涌泉」。',
        cueHold: '停顿 1 秒：气已到脚底「涌泉」，略停一下，别憋紧。',
        cueExhale: '呼气（短）：气自脚底「涌泉」，经「下丹田」，上行回头顶「百会」。',
        savedOk: '很好，完成了。今天已记录 ✓', savedQueued: '完成了。记录先存本地，稍后自动同步（不影响你呼吸）。', savedPending: '完成了，正在记录…',
        start: '开始 · 3 次', running: '进行中…', snooze: '稍后 15 分钟', done: '完成，回去干活',
        ariaClose: '关闭', ariaDialog: '呼吸',
        foot: '别用力、别憋气；头晕手麻即停。孕期/心肺疾病/腹部术后请先问医生。完成会写入本地。',
        footOffline: '⚠ 记账服务离线：本次先存本地、稍后自动补记，不影响呼吸。别用力、头晕即停；孕期/心肺病/腹部术后先问医生。',
        stToday: '今日', stStreakTotal: '连续 / 累计', stLast: '最近一次', stMissed: '距上次练习', stSend: '发信状态',
        stDone: '已完成 ✓', stNotDone: '未完成', stTimes: '次', stDays: '天', stDry: '仅记录（不发信）', stLive: '真发', stPause: '已暂停',
        setTitle: '设置', stRecipient: '收件邮箱', stThreshold: '连续漏做阈值', stDryLabel: '先别真发（dry-run）',
        save: '保存设置', pauseToday: '暂停今天提醒', savedMsg: '已保存 ✓', pausedMsg: '已暂停今天的提醒 ✓', failMsg: '操作失败（记账服务离线？）', refresh: '刷新',
      },
      en: {
        pillLoading: 'Breath', pillOffline: 'Recorder offline · breathing still works', pillDue: 'Time to breathe · 3 long exhales',
        pillDone: function (n) { return 'Done today · ' + n + '-day streak'; },
        pillStreak: function (n) { return n + '-day streak · not yet today'; },
        pillIdle: 'Breathe · not yet today', pillTitle: 'Open a breathing session: 3 long exhales, recorded automatically',
        headerBtn: 'Breathe', statsBtn: 'Stats', footBtn: 'Shih',
        tabBreath: 'Practice', tabStats: 'Stats',
        eb: 'Guided qi flow', title: 'Let this breath complete a full circle', sub: 'Inhale 6s → hold 1s → exhale 4s · longer in, shorter out',
        cueIdle: 'Sit tall, energy into the lower Dantian. Inhale: Baihui→Dantian→Yongquan; exhale: Yongquan→Dantian→Baihui.',
        cueInhale: 'Inhale (long): energy from the crown (Baihui) down through the lower Dantian to the soles (Yongquan).',
        cueHold: 'Hold 1s: energy has reached the soles; pause briefly, do not clench.',
        cueExhale: 'Exhale (short): energy from the soles (Yongquan) up through the Dantian back to the crown (Baihui).',
        savedOk: 'Nice — done. Recorded for today ✓', savedQueued: 'Done. Saved locally, will sync later (breathing unaffected).', savedPending: 'Done, recording…',
        start: 'Start · 3', running: 'Running…', snooze: 'Snooze 15 min', done: 'Done, back to work',
        ariaClose: 'Close', ariaDialog: 'Breathing',
        foot: 'Do not force or hold your breath; stop if dizzy/tingling. If pregnant or with heart/lung/abdominal conditions, consult a doctor first. Completion is saved locally.',
        footOffline: '⚠ Recorder offline: saved locally, will retry. Do not force; stop if dizzy; consult a doctor if pregnant/heart/lung/abdominal.',
        stToday: 'Today', stStreakTotal: 'Streak / total', stLast: 'Last', stMissed: 'Since last', stSend: 'Email',
        stDone: 'Done ✓', stNotDone: 'Not yet', stTimes: '', stDays: 'd', stDry: 'Record only (no email)', stLive: 'Live', stPause: 'Paused',
        setTitle: 'Settings', stRecipient: 'Recipient', stThreshold: 'Miss threshold', stDryLabel: 'Dry-run (don\u2019t send)',
        save: 'Save', pauseToday: 'Pause today', savedMsg: 'Saved ✓', pausedMsg: 'Paused today\u2019s reminder ✓', failMsg: 'Failed (recorder offline?)', refresh: 'Refresh',
      },
    };
    const t = TXT[LANG];

    const store = { open: false, view: 'breath', autoStart: false, recOk: null, status: { todayDone: false, streak: 0, total: 0 }, due: false, nextRemindAt: Date.now() + CADENCE_MIN * 60000 };
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
    function openBreath() { store.open = true; store.view = 'breath'; store.due = false; emit(); }
    function openAndStart() { store.open = true; store.view = 'breath'; store.due = false; store.autoStart = true; emit(); }

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
        store.status = await r.json(); store.recOk = true; emit(); return true;
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
      '.shih-pill{display:inline-flex;align-items:center;gap:8px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l1,#e6e3db);border-radius:20px;padding:5px 12px;font-size:12.5px;color:var(--dsw-alias-label-secondary,#767166);cursor:pointer;font-family:inherit;transition:.15s;}',
      '.shih-pill:hover{border-color:var(--dsw-alias-brand-primary,#2f8f7a);color:var(--dsw-alias-brand-primary,#2f8f7a);}',
      '.shih-pill.done{background:var(--dsw-alias-brand-primary,#2f8f7a);border-color:var(--dsw-alias-brand-primary,#2f8f7a);color:#fff;}',
      '.shih-pill.due{border-color:var(--dsw-alias-brand-primary,#2f8f7a);color:var(--dsw-alias-brand-primary,#2f8f7a);animation:shih-pulse 2.2s ease-in-out infinite;}',
      '.shih-pill.offline{opacity:.75;}',
      '@keyframes shih-pulse{0%,100%{box-shadow:0 0 0 0 rgba(47,143,122,0);}50%{box-shadow:0 0 0 5px rgba(47,143,122,.25);}}',
      '.shih-dot{width:9px;height:9px;border-radius:50%;background:currentColor;opacity:.9;}',
      '.shih-headerbtn{display:inline-flex;align-items:center;gap:6px;background:var(--dsw-alias-brand-primary,#2f8f7a);border:1px solid var(--dsw-alias-brand-primary,#2f8f7a);border-radius:8px;padding:5px 12px;font-size:12.5px;font-weight:600;color:#fff;cursor:pointer;font-family:inherit;line-height:1;box-shadow:0 1px 3px rgba(47,143,122,.35);}',
      '.shih-headerbtn:hover{background:#277a68;border-color:#277a68;color:#fff;}',
      '.shih-headerbtn.alt{background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-brand-primary,#2f8f7a);border-color:var(--dsw-alias-brand-primary,#2f8f7a);font-weight:500;box-shadow:none;}',
      '.shih-headerbtn.alt:hover{background:var(--dsw-alias-brand-primary,#2f8f7a);color:#fff;}',
      '.shih-headerbtn.done{background:var(--dsw-alias-state-success-primary,#1f9d6b);border-color:var(--dsw-alias-state-success-primary,#1f9d6b);color:#fff;}',
      '.shih-headerbtn.due{animation:shih-pulse 2.2s ease-in-out infinite;}',
      '.shih-hwrap{display:inline-flex;gap:6px;align-items:center;}',
      '.shih-scrim{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(20,24,22,.28);backdrop-filter:blur(3px);}',
      '.shih-card{position:relative;width:min(400px,90vw);max-height:90vh;overflow:auto;background:var(--dsw-alias-bg-overlay,#fff);border:1px solid var(--dsw-alias-border-l1,#e6e3db);border-radius:16px;padding:22px 22px 18px;box-shadow:0 10px 30px rgba(0,0,0,.18);text-align:center;color:var(--dsw-alias-label-primary,#2b2a26);font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;outline:none;}',
      '.shih-x{position:absolute;top:10px;right:14px;border:none;background:none;font-size:20px;color:var(--dsw-alias-label-secondary,#8a857a);cursor:pointer;}',
      '.shih-tabs{display:flex;gap:6px;justify-content:center;margin-bottom:12px;}',
      '.shih-tab{border:1px solid var(--dsw-alias-border-l1,#e6e3db);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-secondary,#6f6a60);font-size:13px;padding:5px 14px;border-radius:8px;cursor:pointer;font-family:inherit;}',
      '.shih-tab.on{background:var(--dsw-alias-brand-primary,#2f8f7a);border-color:var(--dsw-alias-brand-primary,#2f8f7a);color:#fff;}',
      '.shih-eb{font-size:11px;letter-spacing:.15em;color:var(--dsw-alias-brand-primary,#2f8f7a);font-weight:600;}',
      '.shih-title{font-size:19px;margin:6px 0 2px;font-weight:600;}',
      '.shih-sub{font-size:12.5px;color:var(--dsw-alias-label-secondary,#6f6a60);margin-bottom:8px;}',
      '.shih-stage{position:relative;height:190px;display:flex;align-items:center;justify-content:center;}',
      '.shih-glow{position:absolute;width:140px;height:140px;border-radius:50%;transform:scale(1.2);background:radial-gradient(circle,rgba(47,143,122,.25),rgba(47,143,122,0) 70%);will-change:transform;}',
      '.shih-pacer{width:110px;height:110px;border-radius:50%;display:flex;flex-direction:column;align-items:center;transform:scale(.9);justify-content:center;color:#fff;background:radial-gradient(circle at 35% 30%,#4bb59c,#237a67);box-shadow:0 10px 30px rgba(35,122,103,.35);will-change:transform;transition:transform .1s linear;}',
      '.shih-phase{font-size:12px;letter-spacing:.1em;}',
      '.shih-num{font-size:24px;font-weight:300;}',
      '.shih-cue{font-size:12.5px;color:var(--dsw-alias-label-secondary,#6f6a60);line-height:1.6;min-height:38px;margin:4px 0 6px;}',
      '.shih-dots{display:flex;gap:7px;justify-content:center;margin-bottom:14px;}',
      '.shih-dots i{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-border-l2,#dcd9d0);}',
      '.shih-dots i.on{background:var(--dsw-alias-brand-primary,#2f8f7a);}',
      '.shih-actions{display:flex;gap:9px;justify-content:center;flex-wrap:wrap;}',
      '.shih-btn{border:1px solid var(--dsw-alias-border-l1,#e6e3db);background:var(--dsw-alias-bg-layer-1,#fff);border-radius:10px;padding:9px 16px;font-size:13px;color:var(--dsw-alias-label-secondary,#5c574d);cursor:pointer;font-family:inherit;}',
      '.shih-btn:hover{border-color:var(--dsw-alias-brand-primary,#2f8f7a);}',
      '.shih-btn.primary{background:var(--dsw-alias-brand-primary,#2f8f7a);border-color:var(--dsw-alias-brand-primary,#2f8f7a);color:#fff;}',
      '.shih-btn.primary:disabled{opacity:.6;cursor:default;}',
      '.shih-btn:focus-visible,.shih-x:focus-visible,.shih-pill:focus-visible,.shih-headerbtn:focus-visible,.shih-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2f8f7a);outline-offset:2px;}',
      '.shih-foot{font-size:11px;color:var(--dsw-alias-label-secondary,#9a9488);margin-top:12px;line-height:1.5;}',
      '.shih-stats{text-align:left;font-size:13px;}',
      '.shih-stat-row{display:flex;justify-content:space-between;padding:6px 2px;border-bottom:1px solid var(--dsw-alias-border-l1,#eee);}',
      '.shih-stat-row span{color:var(--dsw-alias-label-secondary,#6f6a60);}',
      '.shih-stat-row b{font-weight:600;} .shih-stat-row b.ok{color:var(--dsw-alias-state-success-primary,#1f9d6b);} .shih-stat-row b.no{color:var(--dsw-alias-label-secondary,#6f6a60);}',
      '.shih-hist{display:flex;align-items:flex-end;gap:6px;height:58px;margin:12px 2px 4px;}',
      '.shih-hbar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;}',
      '.shih-hbar i{width:68%;background:var(--dsw-alias-border-l2,#dcd9d0);border-radius:3px 3px 0 0;display:block;min-height:3px;} .shih-hbar.on i{background:var(--dsw-alias-brand-primary,#2f8f7a);}',
      '.shih-hbar span{font-size:9px;color:var(--dsw-alias-label-secondary,#9a9488);}',
      '.shih-sec-title{font-weight:600;margin:14px 0 4px;font-size:12px;color:var(--dsw-alias-label-secondary,#6f6a60);}',
      '.shih-field{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 2px;font-size:12.5px;color:var(--dsw-alias-label-primary,#2b2a26);}',
      '.shih-field input:not([type=checkbox]),.shih-field select{border:1px solid var(--dsw-alias-border-l1,#e6e3db);background:var(--dsw-alias-bg-layer-1,#fff);border-radius:8px;padding:5px 8px;font-size:12.5px;color:inherit;font-family:inherit;min-width:140px;}',
      '.shih-field input[type=checkbox]{min-width:auto;width:auto;}',
      '.shih-msg{font-size:11.5px;color:var(--dsw-alias-state-success-primary,#1f9d6b);margin-top:8px;text-align:center;}',
      '@media (prefers-reduced-motion: reduce){.shih-pill.due,.shih-headerbtn.due{animation:none;} .shih-pacer{transition:none;}}',
      '.shih-hint{display:flex;gap:8px;align-items:center;justify-content:space-between;background:rgba(47,143,122,.10);border:1px solid rgba(47,143,122,.25);border-radius:10px;padding:8px 10px;margin-bottom:10px;font-size:11.5px;color:var(--dsw-alias-label-secondary,#5c574d);text-align:left;line-height:1.5;}',
      '.shih-hint-x{border:none;background:var(--dsw-alias-brand-primary,#2f8f7a);color:#fff;border-radius:7px;padding:4px 10px;font-size:11.5px;cursor:pointer;white-space:nowrap;flex:0 0 auto;}',
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

    function HeaderButtons() {
      useStore();
      useEffect(function () {
        refreshStatus(); flushQueue();
        const tt = setInterval(refreshStatus, 60000);
        return function () { clearInterval(tt); if (store.open) { store.open = false; emit(); } };
      }, []);
      useEffect(function () {
        const tt = setInterval(function () {
          if (store.recOk === false) return;
          if (store.status && store.status.todayDone) { if (store.due) { store.due = false; emit(); } return; }
          if (Date.now() >= store.nextRemindAt && !store.due) { store.due = true; emit(); }
        }, 15000);
        return function () { clearInterval(tt); };
      }, []);
      const s = store.status || {};
      const done = !!s.todayDone, offline = store.recOk === false, due = store.due && !done && !offline;
      let cls = 'shih-headerbtn';
      if (done) cls += ' done'; else if (due) cls += ' due';
      return h(React.Fragment, null, h(Styles),
        h('button', { className: cls, title: t.pillTitle, onClick: openBreath }, h('span', { className: 'shih-dot' }), h('span', null, t.headerBtn)));
    }

    function StatsView() {
      const [s, setS] = useState(null);
      const [hist, setHist] = useState([]);
      const [recipient, setRecipient] = useState('');
      const [threshold, setThreshold] = useState('1');
      const [dry, setDry] = useState(true);
      const [msg, setMsg] = useState('');
      const [dryCfg, setDryCfg] = useState(true);

      function load() {
        fetch(REC + '/status').then(function (r) { return r.json(); }).then(setS).catch(function () {});
        fetch(REC + '/history?days=7').then(function (r) { return r.json(); }).then(function (j) { setHist((j && j.days) || []); }).catch(function () {});
        fetch(REC + '/config').then(function (r) { return r.json(); }).then(function (j) {
          setRecipient(j.recipient || '');
          setThreshold(String(j.threshold_missed_days || 1));
          setDry(!!j.dry_run); setDryCfg(!!j.dry_run);
        }).catch(function () {});
      }
      useEffect(function () { load(); }, []);

      function save() {
        const body = { recipient: String(recipient).trim(), threshold_missed_days: Number(threshold), dry_run: !!dry };
        fetch(REC + '/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          .then(function (r) { return r.json(); }).then(function () { setMsg(t.savedMsg); load(); }).catch(function () { setMsg(t.failMsg); });
      }
      function pauseToday() {
        const d = new Date();
        const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        fetch(REC + '/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pause_date: ds }) })
          .then(function () { setMsg(t.pausedMsg); }).catch(function () { setMsg(t.failMsg); });
      }

      const maxCount = Math.max(1, hist.reduce(function (m, x) { return Math.max(m, x.count); }, 0));
      const sendState = dryCfg ? t.stDry : t.stLive;
      return h('div', { className: 'shih-stats' },
        h('div', { className: 'shih-stat-row' }, h('span', null, t.stToday), h('b', { className: s && s.todayDone ? 'ok' : 'no' }, s ? (s.todayDone ? t.stDone : t.stNotDone) : '…')),
        h('div', { className: 'shih-stat-row' }, h('span', null, t.stStreakTotal), h('b', null, (s ? (s.streak || 0) : '…') + ' ' + t.stDays + ' / ' + (s ? (s.total || 0) : '…') + ' ' + t.stTimes)),
        h('div', { className: 'shih-stat-row' }, h('span', null, t.stLast), h('b', null, (s && s.last) ? s.last : '—')),
        h('div', { className: 'shih-stat-row' }, h('span', null, t.stMissed), h('b', null, s ? ((s.missed == null ? '—' : s.missed) + ' ' + t.stDays) : '…')),
        h('div', { className: 'shih-stat-row' }, h('span', null, t.stSend), h('b', null, sendState)),
        h('div', { className: 'shih-hist' }, hist.map(function (x, i) {
          return h('div', { key: i, className: 'shih-hbar' + (x.done ? ' on' : '') },
            h('i', { style: { height: (6 + (x.count / maxCount) * 40) + 'px' } }),
            h('span', null, x.date.slice(5)));
        })),
        h('div', { className: 'shih-sec-title' }, t.setTitle),
        h('label', { className: 'shih-field' }, h('span', null, t.stRecipient), h('input', { value: recipient, onChange: function (e) { setRecipient(e.target.value); }, placeholder: 'you@example.com' })),
        h('label', { className: 'shih-field' }, h('span', null, t.stThreshold), h('select', { value: threshold, onChange: function (e) { setThreshold(e.target.value); } },
          h('option', { value: '1' }, '1 ' + t.stDays), h('option', { value: '2' }, '2 ' + t.stDays), h('option', { value: '3' }, '3 ' + t.stDays))),
        h('label', { className: 'shih-field' }, h('span', null, t.stDryLabel), h('input', { type: 'checkbox', checked: dry, onChange: function (e) { setDry(e.target.checked); } })),
        h('div', { className: 'shih-actions' },
          h('button', { className: 'shih-btn primary', onClick: save }, t.save),
          h('button', { className: 'shih-btn', onClick: pauseToday }, t.pauseToday),
          h('button', { className: 'shih-btn', onClick: load }, t.refresh)),
        msg ? h('div', { className: 'shih-msg' }, msg) : null
      );
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
        function setScale(s) { if (REDUCE) return; if (pacerRef.current) pacerRef.current.style.transform = 'scale(' + s + ')'; if (glowRef.current) glowRef.current.style.transform = 'scale(' + (s * 1.5) + ')'; }
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

      if (!store.open) return null;
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

      const breathBody = [
        showHint ? h('div', { className: 'shih-hint', key: 'hint' },
          h('span', null, '第一次用：点「开始」跟着圆做 3 次，做完自动记录；以后点右上「呼吸」或按 Ctrl+Shift+B 即可。'),
          h('button', { className: 'shih-hint-x', onClick: function () { try { localStorage.setItem('shih.seenHint', '1'); } catch (e) {} setShowHint(false); } }, '知道了')) : null,
        h('div', { className: 'shih-eb', key: 'eb' }, t.eb),
        h('div', { className: 'shih-title', key: 'ti' }, t.title),
        h('div', { className: 'shih-sub', key: 'su' }, t.sub),
        h('div', { className: 'shih-stage', key: 'st', 'aria-hidden': 'true' },
          h('div', { className: 'shih-glow', ref: glowRef }),
          h('div', { className: 'shih-pacer', ref: pacerRef }, h('div', { className: 'shih-phase' }, phase), h('div', { className: 'shih-num' }, num))),
        h('div', { className: 'shih-cue', key: 'cu', 'aria-live': 'polite' }, cue),
        h('div', { className: 'shih-dots', key: 'do' }, [0, 1, 2].map(function (i) { return h('i', { key: i, className: i < breaths ? 'on' : '' }); })),
        saved
          ? h('div', { className: 'shih-actions', key: 'ac' }, h('button', { className: 'shih-btn primary', onClick: function () { close(); armReminder(CADENCE_MIN); } }, t.done))
          : h('div', { className: 'shih-actions', key: 'ac' },
              h('button', { className: 'shih-btn primary', disabled: run, onClick: start }, run ? t.running : t.start),
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

    function wrap(Comp) { return function () { return h(ErrorBoundary, null, h(Comp)); }; }

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
