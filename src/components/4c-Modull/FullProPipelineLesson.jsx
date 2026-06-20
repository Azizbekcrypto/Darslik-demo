import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, Fragment } from 'react';

// ============================================================
// CI/CD + DEPLOY MODULI · DARS 5 (P3) — LOYIHA KUNI: TO'LIQ PROFESSIONAL KONVEYER — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi to'liq professional pipeline yig'adi: install → lint → test → build → deploy + monitoring + alert + CI badge.
//         Yangi: LINT (deploydan oldin sifat darvozasi) va MONITORING (deploydan keyin tiriklik kuzatuvi). Capstone — o'z loyihasiga transfer.
// Davomi: P1 (to'liq konveyer), P2 (AI bilan). Endi 2 yetishmayotgan qismni qo'shamiz: lint yo'q edi, monitoring yo'q edi.
// Loyiha: AvtoIjara. Metafora: konveyer + qo'riqchi (monitoring 24/7 kuzatadi).
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

const LangContext = createContext('uz');
const MentorCtx = createContext(null);

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

const LESSON_META = { lessonId: 'cicd-full-pro-v16', lessonTitle: { uz: "Loyiha kuni: to'liq professional konveyer", ru: 'Проектный день: полный профессиональный конвейер' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's8',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's17', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic, scrollSignal }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  useEffect(() => {
    if (!scrollSignal || !isNarrow) return;
    const el = contentRef.current;
    if (!el) return;
    const t = setTimeout(() => { if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, 240);
    return () => clearTimeout(t);
  }, [scrollSignal, isNarrow]);
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    const tgt = e.target;
    if (tgt && tgt.closest && tgt.closest('.mentor')) return;
    setMCollapsed(true);
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .pick-row');
    if (!isControl) {
      const el = contentRef.current;
      if (el) setTimeout(() => { if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); }, 80);
    }
  };
  const onContentScroll = () => {
    if (!collapseOn || mCollapsed) return;
    const el = contentRef.current;
    if (el && el.scrollTop > 6) setMCollapsed(true);
  };
  return (
    <MentorCtx.Provider value={{ enabled: collapseOn, collapsed: mCollapsed, setCollapsed }}>
      <div className="stage">
        <div className="stage-header" style={{ paddingLeft: padH, paddingRight: padH }}>
          <div className="progress-track"><div className="progress-bar" style={{ width: `${((screen + 1) / totalScreens) * 100}%` }} /></div>
          <div className="chrome">
            <div className="chrome-left eyebrow"><span className="dot" /><span>{eyebrow}</span></div>
            <div className="mono small" style={{ color: T.ink3 }}>{String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}</div>
          </div>
        </div>
        <div ref={contentRef} onClick={onContentClick} onScroll={onContentScroll} className={`stage-content ${narrow ? 'narrow' : ''}`} style={{ paddingLeft: padH, paddingRight: padH }}>{children}</div>
        {navContent && <div className="stage-nav" style={{ paddingLeft: padH, paddingRight: padH }}>{navContent}</div>}
      </div>
    </MentorCtx.Provider>
  );
};
const NavBack = ({ onPrev }) => <button className="btn-ghost" onClick={onPrev} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Orqaga</button>;
const NavNext = ({ disabled, label = 'Davom etish', onClick }) => <button className="btn-white-accent" disabled={disabled} onClick={onClick} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)', marginLeft: 'auto' }}>{label}</button>;

const FeedbackBlock = ({ show, isCorrect, children }) => {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (show) { setMounted(true); requestAnimationFrame(() => requestAnimationFrame(() => { setVisible(true); setTimeout(() => { if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 350); })); }
    else { setVisible(false); const t = setTimeout(() => setMounted(false), 400); return () => clearTimeout(t); }
  }, [show]);
  if (!mounted) return null;
  return <div ref={ref} className={`feedback-block ${visible ? 'visible' : ''}`}><div className={isCorrect ? 'frame-success' : 'frame-soft'}>{children}</div></div>;
};

function placeCorrect(n, correctIdx, screen) {
  const others = [];
  for (let i = 0; i < n; i++) if (i !== correctIdx) others.push(i);
  let seed = ((screen + 7) * 48271) % 2147483647;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = others[i]; others[i] = others[j]; others[j] = t; }
  const pos = n > 1 ? 1 + (screen % (n - 1)) : 0;
  const out = []; let oi = 0;
  for (let p = 0; p < n; p++) out.push(p === pos ? correctIdx : others[oi++]);
  return out;
}
const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const order = useMemo(() => placeCorrect(options.length, correctIdx, screen), [options.length, correctIdx, screen]);
  const dispOptions = order.map(i => options[i]);
  const dispCorrect = order.indexOf(correctIdx);
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === dispCorrect)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === dispCorrect;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect;
    if (isCorrect) setSolved(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options: dispOptions, correctIndex: dispCorrect, correctAnswer: dispOptions[dispCorrect], picked: i, studentAnswerIndex: i, studentAnswer: dispOptions[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {dispOptions.map((opt, i) => {
            let cls = 'option';
            if (solved) { if (i === dispCorrect) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (i === picked) cls += ' option-picked-wrong';
            return (
              <button key={i} className={cls} disabled={solved} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: solved && i === dispCorrect ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}</p>
          <p className="body" style={{ margin: 0 }}>{solved ? explainCorrect : (explainWrong[order[picked]] ?? explainWrong.default)}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

function ScoreRing({ correct, total }) {
  const PCT = total ? correct / total : 0;
  const col = PCT >= 0.6 ? T.success : T.accent;
  const R = 50, ST = 9, C = 2 * Math.PI * R;
  const [off, setOff] = useState(C);
  useEffect(() => { const t = setTimeout(() => setOff(C * (1 - PCT)), 200); return () => clearTimeout(t); }, [C, PCT]);
  return (
    <div className="ring-wrap">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={R} fill="none" stroke={T.ink3 + '40'} strokeWidth={ST} />
        <circle cx="64" cy="64" r={R} fill="none" stroke={col} strokeWidth={ST} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="ring-center"><div className="ring-num"><span style={{ color: col }}>{correct}</span><span className="ring-den">/{total}</span></div><div className="ring-lbl">to'g'ri javob</div></div>
    </div>
  );
}

const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => { e.stopPropagation(); if (ctx.setCollapsed) ctx.setCollapsed(false); };
  return (
    <div className={`mentor fade-up ${enabled ? 'mentor-mob' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={collapsed ? expand : undefined} role={collapsed ? 'button' : undefined}>
      <div className="mentor-ava" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="20" fill={T.accentSoft} /><circle cx="20" cy="16" r="6" fill={T.accent} /><path d="M8 36 a12 9 0 0 1 24 0 Z" fill={T.accent} /></svg>
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;

const CodeFile = ({ name, children, minH }) => (
  <div className="editor">
    <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">{name}</span></div>
    <div className="editor-body" style={{ minHeight: minH }}><pre className="editor-code">{children}</pre></div>
  </div>
);

// ===== MOCK TERMINAL =====
const Term = ({ title = 'Terminal', children, minH }) => (
  <div className="term"><div className="term-bar"><span className="bb-dots"><i /><i /><i /></span><span className="term-title">{title}</span></div><div className="term-body" style={{ minHeight: minH }}>{children}</div></div>
);
const TLine = ({ cmd, out, col }) => (
  <div className="el-in tline">{cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : <span style={{ color: col || CODE.comment }}>{out}</span>}</div>
);

// ===== KONVEYER (PIPELINE) =====
const FULL_STATIONS = [
  { id: 'install', ico: '📦', label: 'Install' },
  { id: 'lint', ico: '🔍', label: 'Lint' },
  { id: 'test', ico: '🧪', label: 'Test' },
  { id: 'build', ico: '🔨', label: 'Build' },
  { id: 'deploy', ico: '🚀', label: 'Deploy' }
];
const badgeOf = (s) => (s === 'pass' ? '✓' : s === 'fail' ? '✗' : s === 'run' ? '●' : s === 'skip' ? '—' : ' ');
const Pipeline = ({ stations, statuses = {}, live }) => (
  <div className="pipe">
    {stations.map((s, i) => (
      <Fragment key={s.id}>
        {i > 0 && <span className="pipe-arrow">→</span>}
        <div className={`pipe-step ${statuses[s.id] || ''}`}>
          <span className="pipe-ico">{s.ico}</span>
          <span className="pipe-lbl">{s.label}</span>
          <span className="pipe-badge">{badgeOf(statuses[s.id])}</span>
        </div>
      </Fragment>
    ))}
    {live && <>
      <span className="pipe-arrow">→</span>
      <div className={`pipe-step ${statuses.live || ''}`}><span className="pipe-ico">🌍</span><span className="pipe-lbl">Jonli</span><span className="pipe-badge">{badgeOf(statuses.live)}</span></div>
    </>}
  </div>
);
const ALL = { install: 'pass', lint: 'pass', test: 'pass', build: 'pass', deploy: 'pass', live: 'pass' };

// ===== GITHUB ACTIONS RUN =====
const ActionsRun = ({ steps, status = 'pass' }) => {
  const list = steps || [{ label: 'Lint', ok: true }, { label: 'Test', ok: true }, { label: 'Build', ok: true }, { label: 'Deploy', ok: true }];
  const overall = list.every(s => s.ok && !s.fail) && status === 'pass' ? 'pass' : 'fail';
  return (
    <div className="ghrun">
      <div className="ghrun-head"><span className={`ghrun-badge ${overall}`}>{overall === 'pass' ? '✓ Success' : '✗ Failed'}</span><span className="ghrun-title">CI · on: push · #58</span></div>
      <div className="ghrun-job">
        <div className="ghrun-jobname"><span style={{ color: overall === 'pass' ? T.success : T.danger }}>{overall === 'pass' ? '✓' : '✗'}</span> ci · ubuntu-latest</div>
        <div className="ghrun-steps">
          {list.map((s, i) => (<div className="ghrun-step el-in" key={i}><span className="ghrun-ck" style={{ color: s.skip ? T.ink3 : (s.ok ? T.success : T.danger) }}>{s.skip ? '—' : (s.ok ? '✓' : '✗')}</span><span style={s.skip ? { opacity: 0.5 } : undefined}>{s.label}</span></div>))}
        </div>
      </div>
    </div>
  );
};

// ===== MONITORING PANEL (uptime) =====
const MonitorPanel = ({ status = 'up', alerted = false }) => (
  <div className="monitor">
    <div className="monitor-head">
      <span className={`monitor-dot ${status}`} />
      <span className="monitor-url">avtoijara.netlify.app</span>
      <span className={`monitor-pill ${status}`}>{status === 'up' ? 'UP' : 'DOWN'}</span>
    </div>
    <div className="monitor-log">
      <div className="mline"><span style={{ color: T.success }}>01:55</span>{'  GET /health → 200 OK'}</div>
      <div className="mline"><span style={{ color: T.success }}>02:00</span>{'  GET /health → 200 OK'}</div>
      {status === 'down'
        ? <div className="mline el-in"><span style={{ color: T.danger }}>02:05</span>{'  GET /health → '}<b style={{ color: T.danger }}>timeout ✗</b></div>
        : <div className="mline"><span style={{ color: T.success }}>02:05</span>{'  GET /health → 200 OK'}</div>}
    </div>
    {alerted && <div className="monitor-alert el-in">🔔 Telegram: "avtoijara.netlify.app DOWN — 02:05"</div>}
  </div>
);

// ===== CI BADGE =====
const CIBadge = ({ ok = true }) => (
  <span className="badge"><span className="badge-l">CI</span><span className={`badge-r ${ok ? 'ok' : 'no'}`}>{ok ? 'passing' : 'failing'}</span></span>
);

// ===== SCREEN 0 — HOOK: ikki yetishmayotgan qism (lint + monitoring) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Test + deploy yetarli, qo'shimcha shart emas" },
    { id: 'b', label: "Lint qo'shaman (sifat) va monitoring qo'shaman (kuzatuv)" },
    { id: 'c', label: "Har kuni qo'lda saytni ochib tekshiraman" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha kuni · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Konveyer test va deploy qiladi — nega kod hali ham <span className="italic" style={{ color: T.accent }}>buzilib chiqdi</span>?</h1>
        <Mentor>P1 va P2'da konveyer qurdingiz: test → build → deploy. Yaxshi ishlayapti. Lekin o'tgan hafta <b style={{ color: T.ink }}>2 ta muammo</b> yuz berdi. Tugmani bosing — nimaligini ko'ramiz.</Mentor>
        <Split>
          <Col>
            <Term title="o'tgan hafta" minH={130}>
              <TLine cmd="git push" />
              {tried && <>
                <TLine out="⚠ muammo 1: mayda xato (typo) tekshirilmay chiqib ketdi" col="#FF8A7A" />
                <TLine out="⚠ muammo 2: tunda sayt 3 soat o'chdi — hech kim bilmadi" col="#FF8A7A" />
              </>}
            </Term>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Muammolar ko\'rindi' : '▶ Nima bo\'ldi?'}</button>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Birinchisi: kodda mayda xato bor edi, lekin hech narsa uni tekshirmadi — to'g'ri internetga chiqdi. Ikkinchisi: tunda sayt o'chdi, lekin hech kim sezmadi. Ikkala muammoni ham hal qilsak-chi?</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Pipeline'ni qanday to'liq qilamiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Professional pipeline 2 narsa qo'shadi: deploydan OLDIN <b>lint</b> (sifat darvozasi), deploydan KEYIN <b>monitoring</b> (tirik kuzatuv). Bugun to'liq konveyerni yig'amiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Lint — deploydan oldin sifat darvozasi', tag: 'eslint' },
    { text: "To'liq tartib: install → lint → test → build → deploy", tag: 'pipeline' },
    { text: 'Monitoring — sayt tirikligini kuzatish', tag: '/health' },
    { text: 'Ogohlantirish — o\'chsa Telegram xabar', tag: 'alert' },
    { text: 'CI badge + o\'z loyihangizga', tag: 'capstone' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Dars oxirida — to'liq professional konveyer</p>
      <Pipeline stations={FULL_STATIONS} statuses={ALL} live />
      <MonitorPanel status="up" />
    </Col>
  );
  const StepsB = (
    <Col>
      <p className="flow-label">Bugungi 5 qadam</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{s.tag}</span></span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic scrollSignal={showSteps} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Konveyerni qanday <span className="italic" style={{ color: T.accent }}>to'liq professional</span> qilamiz?</h2></div>
        <Mentor>Konveyerga <b style={{ color: T.ink }}>2 narsa</b> qo'shamiz: deploydan oldin <b style={{ color: T.ink }}>lint</b> (kod tozami?), deploydan keyin <b style={{ color: T.ink }}>monitoring</b> (sayt tirikmi?). Mana to'liq natija va unga olib boradigan 5 qadam.</Mentor>
        {!isNarrow ? <Split>{Preview}{StepsB}</Split>
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — IKKI TESHIK =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const GAPS = [
    { id: 'lint', ico: '🔍', t: 'Lint yo\'q', d: "Mayda kod xatolari (ishlatilmagan o'zgaruvchi, typo) tekshirilmaydi — sifatsiz kod deploy bo'ladi." },
    { id: 'mon', ico: '📡', t: 'Monitoring yo\'q', d: "Deploydan keyin sayt o'chsa — hech kim sezmaydi. Mijozlar ketadi, siz ertalab bilasiz." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(GAPS.map(g => g.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= GAPS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = GAPS.find(g => g.id === active);
  return (
    <Stage eyebrow="Tushuncha · kamchilik" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 qismni ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hozirgi konveyerda <span className="italic" style={{ color: T.accent }}>nima yetishmayapti</span>?</h2></div>
        <Mentor>Konveyeringiz test va deploy qiladi — bu yaxshi. Lekin <b style={{ color: T.ink }}>2 narsa</b> yetishmayapti: deploydan <b style={{ color: T.ink }}>oldin</b> sifat tekshiruvi, deploydan <b style={{ color: T.ink }}>keyin</b> tiriklik kuzatuvi. Ikkalasini bosib ko'ring.</Mentor>
        <div className="fade-up"><Pipeline stations={FULL_STATIONS.filter(s => s.id !== 'lint')} statuses={{ install: 'pass', test: 'pass', build: 'pass', deploy: 'pass' }} live /></div>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GAPS.map(g => (
                <button key={g.id} className="vcard" onClick={() => tap(g.id)} style={{ boxShadow: active === g.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{g.ico}</span>
                  <span className="vlbl">{g.t}</span>
                  <span className="vseen" style={{ color: seen.has(g.id) ? T.success : T.ink3 }}>{seen.has(g.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active} style={{ borderLeft: `4px solid ${T.danger}` }}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.t}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Teshikni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Lint = sifat darvozasi (oldin). Monitoring = tiriklik qo'riqchisi (keyin). Ikkalasini qo'shamiz. Avval lint.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — LINT NIMA =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ran, setRan] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = ran;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · lint" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Lintni ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kod <span className="italic" style={{ color: T.accent }}>toza yozilganini</span> kim tekshiradi?</h2></div>
        <Mentor>Test kod <b style={{ color: T.ink }}>to'g'ri ishlashini</b> tekshiradi. Lekin kod <b style={{ color: T.ink }}>toza yozilganini</b> kim ko'radi? Buni <b style={{ color: T.ink }}>Lint</b> (ESLint) qiladi: ishlatilmagan o'zgaruvchi, typo, <span className="mono">==</span> o'rniga <span className="mono">===</span>. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="cars.js" minH={100}>
              <At>const</At>{' total = 0;  '}<Cm>{'// ishlatilmagan'}</Cm>{'\n'}
              <At>if</At>{' (price == '}<St>"100"</St>{') {'}{'  '}{ran ? <Cm>{'// == xato'}</Cm> : ''}{'\n'}
              {'  return cars;'}{'\n'}
              {'}'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={ran} onClick={() => { setRan(true); setSc(n => n + 1); }}>{ran ? '✓ Lint topdi' : '▶ npm run lint'}</button>
          </Col>
          <Col>
            <p className="flow-label">eslint natijasi</p>
            {ran
              ? <div className="ghrun el-in"><div className="ghrun-job"><div className="mline" style={{ color: T.amber, fontFamily: 'JetBrains Mono', fontSize: 12 }}>⚠ 'total' is defined but never used</div><div className="mline el-in" style={{ color: T.amber, fontFamily: 'JetBrains Mono', fontSize: 12 }}>⚠ Expected '===' and instead saw '=='</div></div></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Lintni ishga tushiring ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Lint 2 muammoni topdi — kod ishlaydi, lekin toza emas. Bu xatolar erta tutilsa, kod sifatli qoladi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Lint (ESLint) nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Lint (ESLint) <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Kod uslubi va mayda xatolarni topadi (ishlatilmagan o\'zgaruvchi, typo)', 'Kodni internetga chiqaradi', 'Serverni doimiy kuzatadi', 'Testlarni o\'zi yozib beradi']} correctIdx={0}
    explainCorrect="To'g'ri! Lint kod TOZA va bir xil uslubda yozilishini tekshiradi. Test (to'g'rilik) va lint (sifat) — ikki xil darvoza."
    explainWrong={{
      1: "Chiqarish — deploy ishi. Lint kod sifatini tekshiradi.",
      2: "Kuzatish — monitoring ishi. Lint kod uslubini tekshiradi.",
      3: "Testni siz yozasiz. Lint mavjud kodning uslubini tekshiradi.",
      default: "Lint = kod uslubi va mayda xatolarni topadi."
    }} />
);

// ===== SCREEN 5 — TO'LIQ TARTIB =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ST = [
    { id: 'install', ico: '📦', label: 'Install', d: "Paketlarni o'rnatadi." },
    { id: 'lint', ico: '🔍', label: 'Lint', d: "Eng tez — kod uslubini tekshiradi. Erta turadi: typo bo'lsa, test/build'ga vaqt sarflamaymiz." },
    { id: 'test', ico: '🧪', label: 'Test', d: "Kod to'g'ri ishlashini tekshiradi." },
    { id: 'build', ico: '🔨', label: 'Build', d: "Internetga tayyor holatga yig'adi." },
    { id: 'deploy', ico: '🚀', label: 'Deploy', d: "Hammasi o'tsa — internetga chiqaradi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(ST.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= ST.length;
  const statuses = {}; seen.forEach(id => { statuses[id] = 'pass'; });
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = ST.find(s => s.id === active);
  return (
    <Stage eyebrow="Tushuncha · tartib" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `5 stansiyani ko'ring (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq konveyer tartibi — <span className="italic" style={{ color: T.accent }}>lint qayerda</span>?</h2></div>
        <Mentor>Lint <b style={{ color: T.ink }}>erta</b> turadi (install'dan keyin): u eng tez va arzon. Mayda xato bo'lsa — sekin test/build'ga o'tmasdan darrov to'xtatadi. Har stansiyani bosing.</Mentor>
        <div className="fade-up"><Pipeline stations={FULL_STATIONS} statuses={statuses} live={done} /></div>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ST.map(s => <button key={s.id} className="gchip" onClick={() => tap(s.id)} style={seen.has(s.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{s.ico} {s.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Stansiyani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>install → lint → test → build → deploy. Lint erta — tez fikr-mulohaza. Endi lint qizil bo'lsa nima bo'lishini ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — LINT FAIL =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [broken, setBroken] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = broken;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const statuses = broken ? { install: 'pass', lint: 'fail', test: 'skip', build: 'skip', deploy: 'skip', live: 'skip' } : ALL;
  return (
    <Stage eyebrow="Payoff · lint FAIL" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kodni buzib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sifatsiz kod — <span className="italic" style={{ color: T.accent }}>konveyerdan o'tadimi</span>?</h2></div>
        <Mentor>Lint ham xuddi test kabi darvoza: <b style={{ color: T.ink }}>qizil bo'lsa konveyer to'xtaydi</b>. Sifatsiz kod deploy bo'lmaydi. "Kodni buzish (lint)"ni bosing.</Mentor>
        <div className="fade-up"><Pipeline stations={FULL_STATIONS} statuses={statuses} live={!broken} /></div>
        <div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={broken} onClick={() => { setBroken(true); setSc(n => n + 1); }}>{broken ? '✓ Lint qizil → konveyer to\'xtadi' : '🔨 Kodni buzish (lint xatosi)'}</button>
            {broken && <div className="frame-warn fade-step"><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 13 }}>🔍 Lint: <b style={{ color: T.danger }}>FAIL</b><br />→ Test, Build, Deploy: <b>o'tkazib yuborildi</b></p></div>}
          </Col>
          <Col>
            {!broken
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Lint yashil — kod toza. Konveyer davom etadi.</p></div>
              : <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Lint Install'dan darrov keyin to'xtadi — sekin test/build'ga umuman o'tmadi. Tez va arzon. Sifatsiz kod chiqmadi.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Lint — sifat darvozasi. Endi deploydan keyingi qism: monitoring.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 =====
const Screen7 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="To'liq pipeline'da lint qayerda va nega?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Lint pipeline'da <span className="italic" style={{ color: T.accent }}>qayerda</span> va nega?</h2></>}
    options={['Erta (test/build\'dan oldin) — tez va arzon, mayda xatoni darrov tutadi', 'Eng oxirida, deploydan keyin', 'Lint umuman kerak emas', 'Faqat juma kuni ishlaydi']} correctIdx={0}
    explainCorrect="To'g'ri! Lint eng tez qadam — uni erta qo'yamiz. Typo bo'lsa, sekin test/build'ga vaqt sarflamasdan darrov to'xtaydi."
    explainWrong={{
      1: "Deploydan keyin kech — sifatsiz kod allaqachon chiqib ketgan bo'ladi. Lint OLDIN turadi.",
      2: "Lint kerak — u mayda xatolarni arzon bosqichda tutadi.",
      3: "Lint har push'da, doim ishlaydi. Erta turadi.",
      default: "Lint erta — tez va arzon darvoza."
    }} />
);

// ===== SCREEN 8 — MONITORING NEGA KERAK =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · monitoring" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Health-check'ni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Deploy bo'ldi — endi <span className="italic" style={{ color: T.accent }}>kim kuzatadi</span>?</h2></div>
        <Mentor>Deploy — mahsulot chiqdi. Lekin server o'chishi, baza uzilishi mumkin. <b style={{ color: T.ink }}>Health-check</b> endpoint qo'shamiz: <span className="mono">/health</span> → 200 OK. Tashqi xizmat (UptimeRobot) uni har 5 daqiqada so'raydi. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="server.js" minH={90}>
              <At>app</At>{'.get('}<St>'/health'</St>{', (req, res) => {'}{'\n'}
              {'  '}{show ? <>res.status(200).send(<St>'OK'</St>);</> : <span style={{ color: T.ink3 }}>{'// ...'}</span>}{'\n'}
              {'});'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Health-check tayyor' : '▶ /health endpoint qo\'shish'}</button>
          </Col>
          <Col>
            {show
              ? <Term title="UptimeRobot" minH={90}><TLine out="🤖 har 5 daqiqada tekshiraman:" /><TLine out="GET avtoijara.../health → 200 OK" col={CODE.str} /><TLine out="✓ sayt tirik" col={CODE.str} /></Term>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Health-check — saytning "puls"i. Tashqi monitor uni so'rab, tirikligini biladi. Endi monitorni ish ustida ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — UPTIME MONITOR =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [down, setDown] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = down;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · uptime" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Saytni o'chirib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Monitor — sayt <span className="italic" style={{ color: T.accent }}>tirikmi</span>?</h2></div>
        <Mentor>Monitor har 5 daqiqada <span className="mono">/health</span>'ni so'raydi. Javob bo'lsa — <b style={{ color: T.success }}>UP</b>. Javob bo'lmasa — <b style={{ color: T.danger }}>DOWN</b>. "Saytni o'chirish"ni bosing.</Mentor>
        <div className="split">
          <Col>
            <MonitorPanel status={down ? 'down' : 'up'} />
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={down} onClick={() => { setDown(true); setSc(n => n + 1); }}>{down ? '✓ Monitor o\'chishni sezdi' : '⚡ Saytni o\'chirish'}</button>
          </Col>
          <Col>
            {!down
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="body" style={{ margin: 0, color: T.ink }}>🟢 Sayt UP — har tekshiruvda 200 OK. Hammasi joyida.</p></div>
              : <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.danger}` }}><p className="body" style={{ margin: 0, color: T.ink }}>🔴 Sayt DOWN — health-check javob bermadi (timeout). Monitor buni <b>02:05</b>da, ya'ni darrov sezdi.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Monitor o'chishni soniyalarda sezdi. Lekin siz uxlab yotsangiz — qanday bilasiz? Ogohlantirish kerak.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TEST 3 =====
const Screen10 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Monitoring nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Monitoring <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Sayt tirikligini doimiy tekshiradi (health-check) va o\'chsa xabar beradi', 'Kodni internetga deploy qiladi', 'Testlarni yozadi', 'Kod uslubini tekshiradi']} correctIdx={0}
    explainCorrect="To'g'ri! Monitoring deploydan keyin ishlaydi: /health'ni doimiy so'rab, sayt tirikligini kuzatadi va o'chsa darrov ogohlantiradi."
    explainWrong={{
      1: "Deploy — bu boshqa qadam. Monitoring deploydan KEYIN saytni kuzatadi.",
      2: "Test yozish — sizning ishingiz. Monitoring tirik saytni kuzatadi.",
      3: "Uslub — lint ishi. Monitoring sayt tirikligini tekshiradi.",
      default: "Monitoring — sayt tirikligini kuzatadi."
    }} />
);

// ===== SCREEN 11 — OGOHLANTIRISH =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [alerted, setAlerted] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = alerted;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · alert" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ogohlantirishni yoqing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt o'chdi — <span className="italic" style={{ color: T.accent }}>kim xabar oladi</span>?</h2></div>
        <Mentor>Monitor o'chishni sezsa — darhol <b style={{ color: T.ink }}>Telegram/email</b> xabar yuboradi. Yarim tunda ham. Siz uxlasangiz ham, telefoningiz jiringlaydi. "Ogohlantirishni yoqish"ni bosing.</Mentor>
        <div className="split">
          <Col>
            <MonitorPanel status="down" alerted={alerted} />
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={alerted} onClick={() => { setAlerted(true); setSc(n => n + 1); }}>{alerted ? '✓ Telegram xabar keldi' : '🔔 Ogohlantirishni yoqish'}</button>
          </Col>
          <Col>
            {alerted
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Sayt o'chgan zahoti (02:05) Telegram xabar keldi. Siz 02:10'da tuzatdingiz — atigi <b>5 daqiqa</b> o'chiq turdi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Monitor + alert = tinch uyqu. Muammo bo'lsa, birinchi siz bilasiz — mijoz emas.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — CI BADGE =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ok, setOk] = useState(true);
  const [seen, setSeen] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = seen;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const toggle = () => { setOk(o => !o); setSeen(true); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Tushuncha · badge" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Badge'ni almashtiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyiha sog'ligini <span className="italic" style={{ color: T.accent }}>bir qarashda</span> qanday bilamiz?</h2></div>
        <Mentor>README'ga kichik <b style={{ color: T.ink }}>CI badge</b> qo'yasiz — u oxirgi push barcha tekshiruvlardan o'tganini ko'rsatadi: yashil <b style={{ color: T.success }}>passing</b> yoki qizil <b style={{ color: T.danger }}>failing</b>. Bir qarashda hamma biladi loyiha sog'lommi. Tugma bilan almashtiring.</Mentor>
        <div className="split">
          <Col>
            <div className="frame" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="flow-label">README.md</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontFamily: 'Source Serif 4, serif', fontWeight: 600, fontSize: 18 }}># AvtoIjara</span><CIBadge ok={ok} /></div>
            </div>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={toggle}>↔ {ok ? 'Push qizil bo\'lsa?' : 'Push yashil bo\'lsa?'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.success }}>passing</b> — oxirgi push barcha tekshiruvlardan o'tdi. <b style={{ color: T.danger }}>failing</b> — biror qadam yiqilgan, e'tibor kerak.</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>💡 <b>Branch protection:</b> sozlash mumkin — CI yashil bo'lmasa, kodni <span className="mono">main</span>'ga birlashtirib bo'lmaydi. Buzuq kod umuman kirmaydi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Badge — loyiha sog'lig'ining yorlig'i. Endi hammasini birga ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — CASE: yarim tunda =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hayotiy · 02:00" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkinchi holatni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yarim tunda, 02:00 — sayt o'chdi. <span className="italic" style={{ color: T.accent }}>Monitoring bormi</span>?</h2></div>
        <Mentor>Bir xil tun, ikki xil yakun. Avval monitoring <b style={{ color: T.danger }}>bo'lmagan</b> holatni o'qing, keyin <b style={{ color: T.success }}>bor</b> holatni bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}>
              <p className="note-h" style={{ color: T.danger }}>❌ Monitoring yo'q</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Server 02:00'da o'chdi. Hech kim sezmadi. Mijozlar saytga kira olmadi, ketib qoldi. Siz 09:00'da, ish boshida bildingiz — sayt <b>7 soat</b> o'chiq turdi.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : 'Monitoring bilan-chi?'}</button>
          </Col>
          <Col>
            {show
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}>
                  <p className="note-h" style={{ color: T.success }}>✅ Monitoring bor</p>
                  <p className="body" style={{ margin: 0, color: T.ink }}>02:05'da monitor o'chishni sezdi → Telegram xabar keldi. Siz uyg'onib, 02:15'da serverni qayta yoqdingiz. Sayt atigi <b>10 daqiqa</b> o'chiq turdi — ko'pchilik sezmadi ham.</p>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>7 soat vs 10 daqiqa. Farq — monitoring va alert. Mahsulot tirik bo'lishi — deploy bilan tugamaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Sayt yarim tunda o'chdi. Monitoring + alert bilan nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sayt tunda o'chdi. <span className="italic" style={{ color: T.accent }}>Monitoring + alert</span> bilan?</h2></>}
    options={['Bir necha daqiqada Telegram/email xabar keladi — tezda tuzatasiz', 'Hech narsa, ertalab o\'zingiz bilasiz', 'Sayt o\'zi avtomatik tuzaladi', 'Monitoring saytni butunlay o\'chiradi']} correctIdx={0}
    explainCorrect="To'g'ri! Monitor o'chishni soniyalarda sezadi va darhol xabar yuboradi. Siz tunda ham bilib, tezda tuzatasiz — 7 soat emas, 10 daqiqa."
    explainWrong={{
      1: "Aynan shuni monitoring oldini oladi — siz ertalabgacha kutmaysiz, darrov xabar olasiz.",
      2: "Sayt o'zi tuzalmaydi — lekin monitor sizni darrov ogohlantiradi.",
      3: "Monitoring saytni o'chirmaydi — faqat tirikligini kuzatadi va xabar beradi.",
      default: "Monitoring + alert → darrov xabar, tez tuzatish."
    }} />
);

// ===== SCREEN 15 — HAMMASI BIRGA =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Payoff · to'liq" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Tushundim"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sifat, to'g'rilik, chiqarish, kuzatuv — <span className="italic" style={{ color: T.accent }}>hammasi qanday birlashadi</span>?</h2></div>
        <Mentor>Mana to'liq rasm: konveyer (<b style={{ color: T.ink }}>lint → test → build → deploy</b>), keyin <b style={{ color: T.ink }}>monitoring</b> 24/7 kuzatadi, README'da yashil badge. Bu — productionga tayyor, professional loyiha.</Mentor>
        <div className="fade-up"><Pipeline stations={FULL_STATIONS} statuses={ALL} live /></div>
        <div className="split">
          <Col>
            <ActionsRun steps={[{ label: 'Lint', ok: true }, { label: 'Test', ok: true }, { label: 'Build', ok: true }, { label: 'Deploy', ok: true }]} />
            {!done && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setDone(true); setSc(n => n + 1); }}>Tushundim ✓</button>}
          </Col>
          <Col>
            <MonitorPanel status="up" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="flow-label" style={{ margin: 0 }}>README:</span><CIBadge ok={true} /></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sifat (lint) + to'g'rilik (test) + chiqarish (deploy) + kuzatuv (monitoring). To'liq professional konveyer. Endi o'zingiz yig'asiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUNIY: to'liq konveyerni yig'ish =====
const ORDER = ['install', 'lint', 'test', 'build', 'deploy', 'monitor'];
const FINAL_STATIONS = {
  install: { ico: '📦', label: 'Install' }, lint: { ico: '🔍', label: 'Lint' }, test: { ico: '🧪', label: 'Test' },
  build: { ico: '🔨', label: 'Build' }, deploy: { ico: '🚀', label: 'Deploy' }, monitor: { ico: '📡', label: 'Monitor' }
};
const SCRAMBLED = ['test', 'monitor', 'install', 'deploy', 'lint', 'build'];
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(() => (storedAnswer ? [...ORDER] : []));
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const done = placed.length === ORDER.length;
  const need = ORDER[placed.length];
  const fired = useRef(!!storedAnswer);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "To'liq professional konveyerni tartibda yig'ing", correct: true, firstAttemptCorrect: true, solved: true, picked: ORDER.join(' → ') });
    }
  }, [done]);
  const tap = (id) => {
    if (placed.includes(id) || done) return;
    if (id === need) { setPlaced(p => [...p, id]); setHint(null); }
    else { const nd = FINAL_STATIONS[need]; setShakeId(id); setHint(`Hozir emas — avval ${nd.ico} ${nd.label} bo'lishi kerak.`); setTimeout(() => setShakeId(x => (x === id ? null : x)), 450); }
  };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Konveyerni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: to'liq professional konveyerni <span className="italic" style={{ color: T.accent }}>tartibda yig'ing</span>.</h2></div>
        <Mentor>Hamma narsani to'g'ri ketma-ketlikda joylang: paketlardan boshlab, sifat va to'g'rilik tekshiruvi, yig'ish, chiqarish — va oxirida kuzatuv. To'g'ri stansiyani o'ng tomondan tanlang.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">konveyer (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="fade-step"><Pipeline stations={placed.map(id => ({ id, ...FINAL_STATIONS[id] }))} statuses={Object.fromEntries(placed.map(id => [id, 'pass']))} /></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ To'liq konveyer: <b>Install → Lint → Test → Build → Deploy → Monitor</b>. Mana professional CI/CD — boshidan oxirigacha.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">stansiyani tanlang ({placed.length}/{ORDER.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {SCRAMBLED.map(id => {
                const s = FINAL_STATIONS[id];
                const isPlaced = placed.includes(id);
                return (
                  <button key={id} className={`pick-row ${isPlaced ? 'picked' : ''} ${shakeId === id ? 'shake' : ''}`} disabled={isPlaced || done} onClick={() => tap(id)}>
                    <span style={{ marginRight: 6 }}>{s.ico}</span>
                    <span style={{ flex: 1 }}>{s.label}</span>
                    <span className="pick-plus">{isPlaced ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
            {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint}</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — YAKUN + TRANSFER (capstone) =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "To'liq pipeline: install → lint → test → build → deploy",
    "Lint — deploydan oldin sifat darvozasi (typo, ishlatilmagan o'zgaruvchi)",
    "Monitoring — health-check (/health) + uptime, sayt tirikligini kuzatadi",
    "Alert — sayt o'chsa Telegram/email darrov xabar beradi",
    "CI badge — README'da loyiha sog'lig'i bir qarashda"
  ];
  const HOMEWORK = [
    { b: 'Qo\'shing', t: "— o'z bitiruv loyihangizga to'liq pipeline (lint + test + build + deploy)" },
    { b: 'Sozlang', t: "— /health endpoint + UptimeRobot monitoring va alert" },
    { b: 'Ko\'rsating', t: "— README'ga CI badge qo'shing, push qilib yashil ✓ ni kuzating" }
  ];
  const GLOSSARY = [
    { b: 'lint', t: '— kod uslubi/mayda xato tekshiruvi (ESLint)' },
    { b: 'health-check', t: '— /health endpoint, sayt "puls"i' },
    { b: 'uptime', t: '— sayt tirik turgan vaqt' },
    { b: 'monitoring', t: '— tiriklikni doimiy kuzatish' },
    { b: 'alert', t: '— o\'chsa Telegram/email xabar' },
    { b: 'CI badge', t: '— README\'dagi holat yorlig\'i' },
    { b: 'branch protection', t: '— yashil bo\'lmasa merge yo\'q' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Modul yakuni" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> CI/CD modulini yakunladingiz</span><h2 className="title h-title fade-up d1">Bu AvtoIjara edi — endi <span className="italic" style={{ color: T.accent }}>o'z loyihangizga</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Lint, monitoring, alert va CI badge bilan to'liq professional pipeline — endi qo'lingizda. Har loyihangiz shunday quriladi." : "Yaxshi harakat! Lint va monitoring qismlarini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Capstone vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🎓 CI/CD + Deploy moduli tamom! Endi har push'da kodingiz o'zi tekshiriladi, chiqadi va kuzatiladi — professional dasturchidek.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function FullProPipelineLesson({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());
  const next = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setScreen(s => Math.max(s - 1, 0));
  const recordAnswer = (idx, data) => setAnswers(a => ({ ...a, [idx]: data }));
  const reset = () => { setAnswers({}); setScreen(0); startTimeRef.current = Date.now(); };

  const finishLesson = () => {
    const scoredMeta = SCREEN_META.filter(s => s.scored);
    const finalMeta = scoredMeta.filter(s => s.scope === 'final');
    const scoredAnswers = SCREEN_META.map((s, i) => (s.scored ? answers[i] : null)).filter(Boolean);
    const correctAnswers = scoredAnswers.filter(a => a.correct).length;
    const finalAnswers = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean);
    const finalCorrect = finalAnswers.filter(a => a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId, lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length, correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,500&family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
        .lesson-root h1,.lesson-root h2,.lesson-root h3,.lesson-root h4,.lesson-root h5,.lesson-root h6,.lesson-root p,.lesson-root ul,.lesson-root ol { margin: 0; padding: 0; }
        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }
        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        .btn { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 14px; font-size: 12.5px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.6; cursor: not-allowed; }
        .gchip { font-family: 'JetBrains Mono'; font-weight: 600; font-size: 12px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); } .gchip:hover:not(:disabled) { transform: translateY(-1px); }
        .tagpill { font-family: 'JetBrains Mono'; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); }

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope'; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .vcard { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover:not(:disabled) { transform: translateY(-1px); }
        .vcard:disabled { cursor: default; }
        .vlbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }
        .role-ico { font-size: 20px; flex-shrink: 0; } .role-r { font-size: 11.5px; color: ${T.ink2}; font-weight: 600; }

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope'; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope'; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .h-title { font-size: clamp(22px,4vw,38px); } .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

        .stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55); }

        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(15px,2.5vw,22px); box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.danger}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.accent}; flex-shrink: 0; min-width: 38px; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 600; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .note-h { font-weight: 700; font-size: 13.5px; margin: 0 0 5px; display: flex; align-items: center; }

        /* VS CODE EDITOR */
        .editor { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .editor-bar { background: #2D2D2D; padding: 7px 11px; display: flex; align-items: center; gap: 9px; }
        .editor-tab { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; background: #1E1E1E; padding: 4px 11px; border-radius: 6px 6px 0 0; word-break: break-all; }
        .editor-body { background: ${CODE.bg}; padding: 12px 14px; }
        .editor-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.75; color: ${CODE.text}; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .line-empty { color: ${CODE.comment}; font-style: italic; }

        /* PICK LINES / ROWS */
        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 10px 12px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; }

        /* TERMINAL */
        .term { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .term-bar { background: #2D2D2D; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; } .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .term-title { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; }
        .term-body { background: #1E1E1E; padding: 12px 13px; min-height: 60px; }
        .tline { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.8; color: ${CODE.text}; word-break: break-word; }

        /* KONVEYER (PIPELINE) */
        .pipe { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 4px 0; }
        .pipe-step { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 11px; min-width: 64px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
        .pipe-ico { font-size: 19px; line-height: 1; }
        .pipe-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: ${T.ink}; }
        .pipe-badge { font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 800; min-height: 13px; line-height: 1; color: ${T.ink3}; }
        .pipe-arrow { color: ${T.ink3}; font-weight: 700; font-size: 14px; }
        .pipe-step.run { box-shadow: inset 0 0 0 1.5px ${T.blue}, 0 5px 14px -6px rgba(1,154,203,0.3); }
        .pipe-step.run .pipe-badge { color: ${T.blue}; }
        .pipe-step.pass { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .pipe-step.pass .pipe-badge { color: ${T.success}; }
        .pipe-step.fail { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.danger}; }
        .pipe-step.fail .pipe-badge { color: ${T.danger}; }
        .pipe-step.skip { opacity: 0.38; }

        /* GITHUB ACTIONS RUN */
        .ghrun { background: ${T.paper}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); }
        .ghrun-head { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-bottom: 1px solid rgba(167,166,162,0.22); }
        .ghrun-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 99px; }
        .ghrun-badge.pass { background: ${T.successSoft}; color: ${T.success}; }
        .ghrun-badge.fail { background: ${T.dangerSoft}; color: ${T.danger}; }
        .ghrun-title { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; }
        .ghrun-job { padding: 11px 14px; }
        .ghrun-jobname { font-family: 'JetBrains Mono'; font-size: 12.5px; font-weight: 700; color: ${T.ink}; margin-bottom: 9px; display: flex; align-items: center; gap: 7px; }
        .ghrun-steps { display: flex; flex-direction: column; gap: 6px; padding-left: 8px; }
        .ghrun-step { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink2}; display: flex; align-items: center; gap: 9px; }
        .ghrun-ck { font-weight: 800; min-width: 12px; }
        .mline { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink2}; line-height: 1.7; }

        /* MONITORING */
        .monitor { background: ${T.paper}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); }
        .monitor-head { display: flex; align-items: center; gap: 9px; padding: 11px 14px; border-bottom: 1px solid rgba(167,166,162,0.2); }
        .monitor-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .monitor-dot.up { background: ${T.success}; animation: pulse 2s infinite; }
        .monitor-dot.down { background: ${T.danger}; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(31,122,77,0.5); } 70% { box-shadow: 0 0 0 7px rgba(31,122,77,0); } 100% { box-shadow: 0 0 0 0 rgba(31,122,77,0); } }
        .monitor-url { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink}; flex: 1; }
        .monitor-pill { font-family: 'Manrope'; font-weight: 800; font-size: 11px; padding: 2px 9px; border-radius: 99px; }
        .monitor-pill.up { background: ${T.successSoft}; color: ${T.success}; }
        .monitor-pill.down { background: ${T.dangerSoft}; color: ${T.danger}; }
        .monitor-log { padding: 10px 14px; display: flex; flex-direction: column; gap: 4px; }
        .monitor-alert { margin: 0 14px 12px; background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 8px; padding: 9px 12px; font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink}; }

        /* CI BADGE */
        .badge { display: inline-flex; font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 700; border-radius: 6px; overflow: hidden; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.3); }
        .badge-l { background: #3a3a3a; color: #fff; padding: 4px 9px; }
        .badge-r { padding: 4px 9px; color: #fff; }
        .badge-r.ok { background: ${T.success}; }
        .badge-r.no { background: ${T.danger}; }

        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }

        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { width: 15px; height: 15px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; font-weight: 700; flex-shrink: 0; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; } .gloss-body b { color: ${T.ink}; }

        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
