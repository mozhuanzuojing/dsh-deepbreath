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
      '.shih-card{--sh-ink:#2b2a26;--sh-sub:#5a4f3d;--sh-line:rgba(43,42,38,.16);--sh-accent:#a23b2a;--sh-accent-fg:#f7f2e6;--sh-glow:rgba(176,140,84,.22);--sh-serif:"Source Han Serif SC","Songti SC","Noto Serif SC","STSong",Georgia,serif;--sh-paper:radial-gradient(120% 100% at 50% 0%,#fdfaf2,#f6f0e3 70%,#efe6d6 100%);--sh-orb:radial-gradient(circle at 40% 36%,#6a6350,#40392d 60%,#2a251d 100%);--sh-orb-fg:#f7f2e6;--sh-btn-bg:#2b2a26;--sh-btn-fg:#f7f2e6;position:relative;width:min(600px,92vw);max-height:90vh;overflow:auto;background:var(--sh-paper);border:1px solid rgba(90,70,40,.28);border-radius:22px;padding:30px 30px 22px;box-shadow:0 22px 60px rgba(70,55,30,.20);text-align:center;color:var(--sh-ink);font-family:var(--sh-serif);outline:none;}',
      '.shih-scrim{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(30,25,16,.20);backdrop-filter:blur(6px);}',
      '.shih-x{position:absolute;top:12px;right:16px;border:none;background:none;font-size:22px;line-height:1;color:var(--sh-sub);cursor:pointer;}',
      '.shih-tabs{display:flex;gap:22px;justify-content:center;margin:2px 0 18px;}',
      '.shih-tab{border:none;background:none;color:var(--sh-sub);font-size:13.5px;letter-spacing:.18em;padding:4px 2px;cursor:pointer;font-family:var(--sh-serif);border-bottom:2px solid transparent;}',
      '.shih-tab.on{color:var(--sh-accent);border-bottom-color:var(--sh-accent);}',
      '.shih-eb{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;font-size:11px;letter-spacing:.34em;color:var(--sh-accent);}',
      '.shih-title{font-size:26px;margin:8px 0 2px;font-weight:600;letter-spacing:.12em;}',
      '.shih-sub{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;font-size:12.5px;letter-spacing:.16em;color:var(--sh-sub);margin-bottom:6px;}',
      '.shih-stage{position:relative;height:220px;display:flex;align-items:center;justify-content:center;margin:8px 0;}',
      '.shih-glow{position:absolute;width:128px;height:128px;border-radius:50%;transform:scale(1.1);background:radial-gradient(circle,var(--sh-glow),rgba(0,0,0,0) 62%);will-change:transform;}',
      '.shih-pacer{width:134px;height:134px;border-radius:50%;transform:scale(.9);background:radial-gradient(circle at 40% 34%,#fffef9 0%,#ffeccb 38%,#f3d49b 68%,#e9c07f 86%,rgba(233,192,127,0) 100%);box-shadow:0 0 0 1px rgba(162,59,42,.20),0 8px 22px rgba(120,90,50,.22),inset 0 3px 10px rgba(255,255,255,.92),inset 0 -10px 20px rgba(200,150,90,.28);will-change:transform;}',
      '.shih-phaselabel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;}',
      '.shih-plabel-num{font-family:var(--sh-serif);font-size:16px;font-weight:600;line-height:1;color:#5a4f3d;margin-top:3px;}',
      '.shih-plabel-phase{font-family:var(--sh-serif);font-size:18px;letter-spacing:.2em;text-indent:.2em;color:#241f18;}',
      '.shih-plabel-phase.big{font-size:22px;letter-spacing:.28em;text-indent:.28em;color:#241f18;}',
      '.shih-phase{font-family:var(--sh-serif);font-size:22px;letter-spacing:.28em;text-indent:.28em;}',
      '.shih-num{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;font-size:13px;font-weight:300;opacity:.7;margin-top:2px;}',
      '.shih-cue{font-size:13px;letter-spacing:.12em;color:var(--sh-sub);line-height:1.7;min-height:40px;margin:6px 0;}',
      '.shih-dots{display:flex;gap:9px;justify-content:center;margin:10px 0 16px;}',
      '.shih-dots i{width:7px;height:7px;border-radius:50%;background:var(--sh-line);}',
      '.shih-dots i.on{background:var(--sh-accent);}',
      '.shih-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}',
      '.shih-btn{border:1px solid var(--sh-line);background:transparent;border-radius:10px;padding:10px 20px;font-size:13.5px;letter-spacing:.1em;color:var(--sh-sub);cursor:pointer;font-family:var(--sh-serif);}',
      '.shih-btn:hover{border-color:var(--sh-accent);color:var(--sh-accent);}',
      '.shih-btn.primary{background:var(--sh-btn-bg);border-color:var(--sh-btn-bg);color:var(--sh-btn-fg);}',
      '.shih-btn.primary:hover{opacity:.9;color:var(--sh-btn-fg);border-color:var(--sh-btn-bg);}',
      '.shih-btn.primary:disabled{opacity:.55;cursor:default;}',
      '.shih-x:focus-visible,.shih-headerbtn:focus-visible,.shih-tab:focus-visible,.shih-btn:focus-visible{outline:2px solid var(--sh-accent,#a23b2a);outline-offset:2px;}',
      '.shih-foot{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--sh-sub);margin-top:14px;line-height:1.6;}',
      '.shih-stats{text-align:left;font-size:13.5px;}',
      '.shih-stat-row{display:flex;justify-content:space-between;align-items:baseline;padding:12px 2px;border-bottom:1px solid var(--sh-line);}',
      '.shih-stat-row span{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;color:var(--sh-sub);font-size:12.5px;letter-spacing:.06em;}',
      '.shih-stat-row b{font-family:var(--sh-serif);font-weight:600;font-size:16px;} .shih-stat-row b.ok{color:var(--sh-accent);} .shih-stat-row b.no{color:var(--sh-sub);}',
      '.shih-hist{display:flex;align-items:flex-end;gap:9px;height:64px;margin:16px 2px 6px;}',
      '.shih-hbar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;}',
      '.shih-hbar i{width:100%;height:42px;background:var(--sh-line);border-radius:7px;display:block;} .shih-hbar.on i{background:linear-gradient(#c0523f,#a23b2a);}',
      '.shih-hbar span{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;font-size:10.5px;color:var(--sh-sub);}',
      '.shih-offline{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;font-size:13px;color:var(--sh-sub);text-align:center;padding:18px 4px;}',
      '.shih-sec-title{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;font-weight:600;margin:18px 0 6px;font-size:11.5px;letter-spacing:.24em;color:var(--sh-accent);}',
      '.shih-field{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 2px;font-size:12.5px;font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;color:var(--sh-ink);}',
      '.shih-field input:not([type=checkbox]),.shih-field select{border:1px solid var(--sh-line);background:rgba(255,255,255,.5);border-radius:8px;padding:6px 9px;font-size:12.5px;color:var(--sh-ink);font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;min-width:200px;}',
      '.shih-field input[type=checkbox]{min-width:auto;width:auto;accent-color:var(--sh-accent);}',
      '.shih-msg{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;font-size:11.5px;color:var(--sh-accent);margin-top:8px;text-align:center;}',
      '.shih-hint{display:flex;gap:8px;align-items:center;justify-content:space-between;background:rgba(162,59,42,.08);border:1px solid rgba(162,59,42,.28);border-radius:10px;padding:9px 12px;margin-bottom:12px;font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;font-size:11.5px;color:var(--sh-sub);text-align:left;line-height:1.6;}',
      '.shih-hint-x{border:none;background:var(--sh-accent,#a23b2a);color:var(--sh-accent-fg,#f7f2e6);border-radius:7px;padding:4px 10px;font-size:11.5px;cursor:pointer;white-space:nowrap;flex:0 0 auto;}',
      '.shih-headerbtn{--hb-ink:#2b2a26;--hb-accent:#a23b2a;display:inline-flex;align-items:center;gap:6px;background:#f7f2e6;border:1px solid rgba(90,70,40,.28);border-radius:9px;padding:5px 12px;font-size:12.5px;font-weight:600;color:var(--hb-ink);cursor:pointer;font-family:"Source Han Serif SC","Songti SC",serif;letter-spacing:.1em;line-height:1;box-shadow:0 1px 3px rgba(70,55,30,.18);}',
      '.shih-headerbtn:hover{border-color:var(--hb-accent);color:var(--hb-accent);}',
      '.shih-headerbtn.done{background:transparent;border-color:rgba(162,59,42,.45);color:var(--hb-accent);}',
      '.shih-headerbtn.due{color:var(--hb-accent);border-color:var(--hb-accent);animation:shih-pulse 2.2s ease-in-out infinite;}',
      '.shih-dot{width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.85;}',
      '@keyframes shih-pulse{0%,100%{box-shadow:0 0 0 0 rgba(162,59,42,0);}50%{box-shadow:0 0 0 5px rgba(162,59,42,.22);}}',
      '.shih-toast{--sh-ink:#2b2a26;--sh-sub:#6b5f49;--sh-line:rgba(43,42,38,.16);--sh-accent:#a23b2a;--sh-serif:"Source Han Serif SC","Songti SC",serif;position:fixed;right:18px;bottom:18px;z-index:60;display:flex;align-items:center;gap:10px;background:radial-gradient(120% 120% at 0% 0%,#f8f3e7,#efe7d6 80%);border:1px solid rgba(90,70,40,.24);border-radius:14px;padding:12px 14px;box-shadow:0 12px 34px rgba(60,45,25,.24);max-width:340px;text-align:left;font-family:var(--sh-serif);color:var(--sh-ink);}',
      '.shih-toast-t{font-size:13px;line-height:1.4;letter-spacing:.04em;}',
      '.shih-toast-b{border:1px solid var(--sh-line);background:transparent;color:var(--sh-sub);border-radius:8px;padding:6px 11px;font-size:12.5px;cursor:pointer;font-family:var(--sh-serif);letter-spacing:.08em;white-space:nowrap;}',
      '.shih-toast-b.primary{background:var(--sh-accent,#a23b2a);border-color:var(--sh-accent,#a23b2a);color:var(--sh-accent-fg,#f7f2e6);}',
      '@media (prefers-reduced-motion: reduce){.shih-headerbtn.due{animation:none;}.shih-pacer,.shih-glow{transition:none;}}',
      '@media (prefers-color-scheme: dark){',
        '.shih-card{--sh-ink:#ece7dc;--sh-sub:#b3a794;--sh-line:rgba(236,231,220,.16);--sh-accent:#d98a5f;--sh-accent-fg:#1c130d;--sh-glow:rgba(210,150,90,.20);--sh-paper:radial-gradient(120% 100% at 50% 0%,#241d15,#1a140e 68%,#120d09 100%);--sh-btn-bg:#7a4630;--sh-btn-fg:#f7f2e6;border-color:rgba(210,150,90,.22);box-shadow:0 22px 60px rgba(0,0,0,.5),inset 0 0 90px rgba(210,150,90,.05);}',
        '.shih-scrim{background:rgba(8,6,4,.5);}',
        '.shih-field input:not([type=checkbox]),.shih-field select{background:rgba(255,255,255,.06);}',
        '.shih-headerbtn{--hb-ink:#ece7dc;--hb-accent:#d98a5f;background:rgba(255,255,255,.06);border-color:rgba(217,138,95,.32);}',
        '.shih-headerbtn.done{background:transparent;border-color:rgba(217,138,95,.5);color:var(--hb-accent);}',
        '.shih-toast{--sh-ink:#ece7dc;--sh-sub:#b3a794;--sh-line:rgba(236,231,220,.16);--sh-accent:#d98a5f;--sh-accent-fg:#1c130d;background:radial-gradient(120% 120% at 0% 0%,#241d15,#1a140e 85%);border-color:rgba(217,138,95,.24);}',
        '.shih-hint{background:rgba(217,138,95,.12);border-color:rgba(217,138,95,.3);}',
        '.shih-pacer{background:radial-gradient(circle at 40% 34%,#fff7ea 0%,#ffdca8 38%,#e9b878 72%,#d9a463 88%,rgba(217,164,99,0) 100%);box-shadow:0 0 0 1px rgba(217,138,95,.4),0 8px 22px rgba(0,0,0,.35),inset 0 3px 10px rgba(255,255,255,.75),inset 0 -10px 20px rgba(180,120,60,.35);}',
        '.shih-hbar i{background:#9a8f76;} .shih-hbar.on i{background:linear-gradient(#e0916f,#c96b4e);}',
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
        const body = { recipient: String(recipient).trim(), threshold_missed_days: Number(threshold) };
        fetch(REC + '/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          .then(function (r) { return r.json(); }).then(function () { setMsg(t.savedMsg); load(); }).catch(function () { setMsg(t.failMsg); });
      }
      function pauseToday() {
        const d = new Date();
        const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        fetch(REC + '/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pause_date: ds }) })
          .then(function () { setMsg(t.pausedMsg); }).catch(function () { setMsg(t.failMsg); });
      }

      if (err) {
        return h('div', { className: 'shih-stats' },
          h('div', { className: 'shih-offline' }, LANG === 'en' ? 'Recorder offline — stats unavailable.' : '记账服务离线，统计暂不可用。'),
          h('div', { className: 'shih-actions', style: { justifyContent: 'center', marginTop: '12px' } },
            h('button', { className: 'shih-btn primary', onClick: load }, LANG === 'en' ? 'Retry' : '重试')));
      }
      return h('div', { className: 'shih-stats' },
        h('div', { className: 'shih-stat-row' }, h('span', null, t.stToday), h('b', { className: s && s.todayDone ? 'ok' : 'no' }, s ? (s.todayDone ? t.stDone : t.stNotDone) : '…')),
        h('div', { className: 'shih-stat-row' }, h('span', null, t.stStreakTotal), h('b', null, (s ? (s.streak || 0) : '…') + ' ' + t.stDays + ' / ' + (s ? (s.total || 0) : '…') + ' ' + t.stTimes)),
        h('div', { className: 'shih-stat-row' }, h('span', null, t.stLast), h('b', null, (s && s.last) ? s.last : '—')),
        (s && s.missed > 0) ? h('div', { className: 'shih-stat-row' }, h('span', null, t.stMissed), h('b', null, s.missed + ' ' + t.stDays)) : null,
        h('div', { className: 'shih-hist' }, hist.map(function (x, i) {
          return h('div', { key: i, className: 'shih-hbar' + (x.done ? ' on' : '') },
            h('i', null),
            h('span', null, String(x.date || '').slice(5)));
        })),
        h('div', { className: 'shih-sec-title' }, t.setTitle),
        h('label', { className: 'shih-field' }, h('span', null, t.stRecipient), h('input', { value: recipient, onChange: function (e) { setRecipient(e.target.value); }, placeholder: 'you@example.com' })),
        h('label', { className: 'shih-field' }, h('span', null, t.stThreshold), h('select', { value: threshold, onChange: function (e) { setThreshold(e.target.value); } },
          h('option', { value: '1' }, '1 ' + t.stDays), h('option', { value: '2' }, '2 ' + t.stDays), h('option', { value: '3' }, '3 ' + t.stDays))),
        h('label', { className: 'shih-field' }, h('span', null, EXTRA.dndLabel), h('input', { type: 'checkbox', checked: dnd, onChange: function (e) { setDnd(e.target.checked); store.dnd = e.target.checked; if (e.target.checked) store.aiNudge = false; try { localStorage.setItem('shih.dnd', e.target.checked ? '1' : '0'); } catch (_) {} emit(); } })),
        h('div', { className: 'shih-actions' },
          h('button', { className: 'shih-btn primary', onClick: save }, t.save),
          h('button', { className: 'shih-btn', onClick: pauseToday }, t.pauseToday)),
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
