import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';

// ============================================================
// CI/CD + DEPLOY MODULI · DARS 3 (P1) — LOYIHA KUNI: TO'LIQ KONVEYER — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi real fullstack loyihaga (AvtoIjara) to'liq pipeline ulaydi: frontend (build→Netlify) + backend (test→Render),
//         ikki job, secrets, env. Hammasini O'ZI QO'LDA yig'adi (vibecoding/AI emas — u P2'da).
// Davomi: Dars 2 (GitHub Actions, faqat test). Endi to'liq: test → build → deploy, ikki tomon.
// Loyiha: AvtoIjara = React frontend (Netlify) + Express/Postgres backend (Render). 3-4 modullardan tanish.
// Metafora: bitta zavod, IKKI konveyer liniyasi (frontend + backend).
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

const LESSON_META = { lessonId: 'cicd-full-pipeline-v16', lessonTitle: { uz: "Loyiha kuni: to'liq konveyer", ru: 'Проектный день: полный конвейер' } };
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

const Kw = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;

const CodeFile = ({ name, children, minH }) => (
  <div className="editor">
    <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">{name}</span></div>
    <div className="editor-body" style={{ minHeight: minH }}><pre className="editor-code">{children}</pre></div>
  </div>
);
const AgentCard = ({ children, title = "💬 Agentni shunday yo'naltiring" }) => (
  <div className="agent-card"><span className="agent-lbl">{title}</span><p className="agent-msg">{children}</p></div>
);

// ===== MOCK TERMINAL =====
const Term = ({ title = 'Terminal', children, minH }) => (
  <div className="term"><div className="term-bar"><span className="bb-dots"><i /><i /><i /></span><span className="term-title">{title}</span></div><div className="term-body" style={{ minHeight: minH }}>{children}</div></div>
);
const TLine = ({ cmd, out, col }) => (
  <div className="el-in tline">{cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : <span style={{ color: col || CODE.comment }}>{out}</span>}</div>
);

// ===== KONVEYER (PIPELINE) — har xil stansiya to'plamlari =====
const FE_STATIONS = [
  { id: 'install', ico: '📦', label: 'Install' },
  { id: 'build', ico: '🔨', label: 'Build' },
  { id: 'deploy', ico: '🚀', label: 'Deploy' }
];
const BE_STATIONS = [
  { id: 'install', ico: '📦', label: 'Install' },
  { id: 'test', ico: '🧪', label: 'Test' },
  { id: 'deploy', ico: '🚀', label: 'Deploy' }
];
const badgeOf = (s) => (s === 'pass' ? '✓' : s === 'fail' ? '✗' : s === 'run' ? '●' : s === 'skip' ? '—' : ' ');
const Pipeline = ({ stations, statuses = {}, live }) => (
  <div className="pipe">
    {stations.map((s, i) => (
      <React.Fragment key={s.id}>
        {i > 0 && <span className="pipe-arrow">→</span>}
        <div className={`pipe-step ${statuses[s.id] || ''}`}>
          <span className="pipe-ico">{s.ico}</span>
          <span className="pipe-lbl">{s.label}</span>
          <span className="pipe-badge">{badgeOf(statuses[s.id])}</span>
        </div>
      </React.Fragment>
    ))}
    {live && <>
      <span className="pipe-arrow">→</span>
      <div className={`pipe-step ${statuses.live || ''}`}><span className="pipe-ico">🌍</span><span className="pipe-lbl">Jonli</span><span className="pipe-badge">{badgeOf(statuses.live)}</span></div>
    </>}
  </div>
);
const ALL = { install: 'pass', test: 'pass', build: 'pass', deploy: 'pass', live: 'pass' };

// ===== GITHUB ACTIONS RUN (ko'p job) =====
const ActionsRun = ({ jobs }) => {
  const overall = jobs.every(j => j.ok) ? 'pass' : 'fail';
  return (
    <div className="ghrun">
      <div className="ghrun-head"><span className={`ghrun-badge ${overall}`}>{overall === 'pass' ? '✓ Success' : '✗ Failed'}</span><span className="ghrun-title">CI · on: push · #21</span></div>
      {jobs.map((job, ji) => (
        <div className="ghrun-job" key={ji} style={ji > 0 ? { borderTop: '1px solid rgba(167,166,162,0.18)' } : undefined}>
          <div className="ghrun-jobname"><span style={{ color: job.ok ? T.success : T.danger }}>{job.ok ? '✓' : '✗'}</span> {job.name}</div>
          <div className="ghrun-steps">
            {job.steps.map((s, i) => (<div className="ghrun-step el-in" key={i}><span className="ghrun-ck" style={{ color: s.skip ? T.ink3 : (s.ok ? T.success : T.danger) }}>{s.skip ? '—' : (s.ok ? '✓' : '✗')}</span><span style={s.skip ? { opacity: 0.5 } : undefined}>{s.label}</span></div>))}
          </div>
        </div>
      ))}
    </div>
  );
};
const FE_JOB = { name: 'frontend · ubuntu-latest', ok: true, steps: [{ label: 'Checkout', ok: true }, { label: 'npm install', ok: true }, { label: 'npm run build', ok: true }, { label: 'Netlify deploy', ok: true }] };
const BE_JOB = { name: 'backend · ubuntu-latest', ok: true, steps: [{ label: 'Checkout', ok: true }, { label: 'npm install', ok: true }, { label: 'npm test', ok: true }, { label: 'Render deploy', ok: true }] };
const BE_JOB_FAIL = { name: 'backend · ubuntu-latest', ok: false, steps: [{ label: 'Checkout', ok: true }, { label: 'npm install', ok: true }, { label: 'npm test', ok: false }, { label: 'Render deploy', skip: true }] };

// ===== PICK LINES =====
const PickLines = ({ fileName, scaffoldTop, candidates, agent, instruction, onComplete, completedInit }) => {
  const correct = candidates.filter(c => c.correct);
  const [picked, setPicked] = useState(() => completedInit ? new Set(correct.map(c => c.id)) : new Set());
  const [shakeId, setShakeId] = useState(null);
  const [why, setWhy] = useState(null);
  const done = correct.every(c => picked.has(c.id));
  const fired = useRef(false);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onComplete && onComplete(); } }, [done]);
  const tap = (c) => {
    if (picked.has(c.id) || done) return;
    if (c.correct) { setPicked(p => { const s = new Set(p); s.add(c.id); return s; }); setWhy(null); }
    else { setShakeId(c.id); setWhy(c.why); setTimeout(() => setShakeId(x => (x === c.id ? null : x)), 450); }
  };
  const pickedCorrect = correct.filter(c => picked.has(c.id));
  return (
    <div className="split">
      <Col>
        <p className="flow-label">{fileName}</p>
        <CodeFile name={fileName} minH={130}>
          {scaffoldTop}{'\n'}
          {pickedCorrect.length === 0
            ? <span className="line-empty">{'      # qatorlarni o\'ng tomondan tanlang →'}</span>
            : pickedCorrect.map((c, i) => <React.Fragment key={c.id}>{i > 0 ? '\n' : ''}{'      '}{c.node}</React.Fragment>)}
        </CodeFile>
        {agent && <AgentCard>{agent}</AgentCard>}
      </Col>
      <Col>
        <p className="flow-label">{instruction || 'Qatorlarni tanlang'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {candidates.map(c => (
            <button key={c.id} className={`pick-row ${picked.has(c.id) ? 'picked' : ''} ${shakeId === c.id ? 'shake' : ''}`} disabled={picked.has(c.id)} onClick={() => tap(c)}>
              <span style={{ flex: 1 }}>{c.label}</span>
              <span className="pick-plus">{picked.has(c.id) ? '✓' : '+'}</span>
            </button>
          ))}
        </div>
        {why && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{why}</p></div>}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Frontend job yig'ildi — build qilinadi va Netlify'ga chiqadi.</p></div>}
      </Col>
    </div>
  );
};

// ===== TO'LIQ ci.yml (ikki job, namuna) =====
const TwoJobYml = ({ minH, hi }) => (
  <CodeFile name=".github/workflows/ci.yml" minH={minH}>
    <At>name</At>{': CI'}{'\n'}
    <At>on</At>{': '}<Kw>push</Kw>{'\n'}
    <At>jobs</At>{':'}{'\n'}
    <span style={{ opacity: hi === 'backend' ? 0.4 : 1 }}>
      {'  '}<At>frontend</At>{':'}{'\n'}
      {'    '}<At>runs-on</At>{': ubuntu-latest'}{'\n'}
      {'    '}<At>steps</At>{':'}{'\n'}
      {'      - '}<At>uses</At>{': '}<St>actions/checkout@v4</St>{'\n'}
      {'      - '}<At>run</At>{': '}<St>npm install</St>{'\n'}
      {'      - '}<At>run</At>{': '}<St>npm run build</St>{'   '}<Cm>{'# → dist/'}</Cm>{'\n'}
      {'      - '}<At>run</At>{': '}<St>netlify deploy --prod</St>{'\n'}
    </span>
    <span style={{ opacity: hi === 'frontend' ? 0.4 : 1 }}>
      {'  '}<At>backend</At>{':'}{'\n'}
      {'    '}<At>runs-on</At>{': ubuntu-latest'}{'\n'}
      {'    '}<At>steps</At>{':'}{'\n'}
      {'      - '}<At>uses</At>{': '}<St>actions/checkout@v4</St>{'\n'}
      {'      - '}<At>run</At>{': '}<St>npm install</St>{'\n'}
      {'      - '}<At>run</At>{': '}<St>npm test</St>{'\n'}
      {'      - '}<At>run</At>{': '}<St>curl $RENDER_HOOK</St>
    </span>
  </CodeFile>
);

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Har safar ikkalasini qo'lda, alohida deploy qilaman" },
    { id: 'b', label: "Bitta konveyer quraman — har push'da ikkalasi o'zi deploy bo'ladi" },
    { id: 'c', label: "Faqat frontendni yangilayman, backend qolaversin" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha kuni · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>AvtoIjara tayyor — lekin har yangilanishda <span className="italic" style={{ color: T.accent }}>ikkalasini qo'lda</span> deploy qilyapsiz.</h1>
        <Mentor>Frontend Netlify'da, backend Render'da. Mashina narxini o'zgartirdingiz — endi ikkalasini ham qayta deploy qilish kerak: build, token, yuklash... ikki marta, qo'lda. Bir martani bosib ko'ring.</Mentor>
        <Split>
          <Col>
            <Term title="qo'lda fullstack deploy" minH={155}>
              <TLine cmd="cd frontend && npm run build" />
              {tried && <>
                <TLine cmd="netlify deploy --prod" />
                <TLine out="✓ frontend chiqdi" col={CODE.str} />
                <TLine cmd="cd ../backend && npm test" />
                <TLine cmd="git push render main" />
                <TLine out="✓ backend chiqdi (8 qadam, 2 marta)" col={CODE.str} />
              </>}
            </Term>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Qo\'lda deploy bajarildi' : '▶ Qo\'lda deploy qilish'}</button>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikki tomon, sakkiz qadam — har push'da. Frontend yangiladingiz-u backendni unutdingiz? Sayt ishlamay qoladi. Buni to'liq avtomatlashtirsak-chi?</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Frontend + backendni qanday avtomatik chiqaramiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval qo'lda deploy'ni bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! 2-darsda faqat <b>testni</b> avtomatlashtirdik. Bugun <b>to'liq konveyer</b>: frontend ham, backend ham — har push'da test/build/deploy o'zi bo'ladi. Loyiha kuni boshlandi.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Loyihani 2 qism: frontend va backend pipeline', tag: 'reja' },
    { text: 'Frontend konveyeri: build → Netlify', tag: 'dist → deploy' },
    { text: 'Backend konveyeri: test → Render', tag: 'test → deploy' },
    { text: 'Secrets va env — tokenlarni xavfsiz saqlash', tag: '${{ secrets }}' },
    { text: 'Hammasi yashil — to\'liq avtomatik', tag: '2 job ✓' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Dars oxirida — har push'da shu chiqadi</p>
      <ActionsRun jobs={[FE_JOB, BE_JOB]} />
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta push → ikkala job parallel ishladi: frontend build+deploy, backend test+deploy. Ikkalasi <b style={{ color: T.success }}>yashil ✓</b>.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">AvtoIjara'ga <span className="italic" style={{ color: T.accent }}>to'liq konveyerni</span> qanday ulaymiz?</h2></div>
        <Mentor>Bugun nazariya emas — <b style={{ color: T.ink }}>quramiz</b>. Real loyihaga ikki tomonlama pipeline ulaymiz. Mana natija va 5 qadam.</Mentor>
        {!isNarrow ? <Split>{Preview}{StepsB}</Split>
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — REJA: 2 qism → 2 pipeline =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { id: 'fe', ico: '🖥', t: 'Frontend', tech: 'React', target: 'Netlify', line: 'install → build → deploy', d: "React ilova. npm run build bilan statik fayllarga (dist/) aylanadi va Netlify'ga chiqadi. Server kerak emas." },
    { id: 'be', ico: '⚙️', t: 'Backend', tech: 'Express + Postgres', target: 'Render', line: 'install → test → deploy', d: "API server. Doimiy ishlaydi, ma'lumotlar bazasiga ulanadi. Test o'tsa Render'ga deploy bo'ladi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Reja · 2 qism" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 qismni ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoIjara — nechta qism, <span className="italic" style={{ color: T.accent }}>nechta konveyer</span>?</h2></div>
        <Mentor>Fullstack loyiha = ikki mustaqil qism. Har biri <b style={{ color: T.ink }}>boshqa joyga</b> va <b style={{ color: T.ink }}>boshqa qadamlar</b> bilan chiqadi. Ikkalasini bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map(p => (
                <button key={p.id} className="vcard" onClick={() => tap(p.id)} style={{ boxShadow: active === p.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{p.ico}</span>
                  <span className="vlbl">{p.t}</span>
                  <span className="role-r mono">{p.target}</span>
                  <span className="vseen" style={{ color: seen.has(p.id) ? T.success : T.ink3 }}>{seen.has(p.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.t} <span className="mono" style={{ color: T.ink3, marginLeft: 6, fontSize: 12 }}>{cur.tech}</span></p><p className="body" style={{ margin: '0 0 8px', color: T.ink }}>{cur.d}</p><p className="body mono" style={{ margin: 0, color: T.accent, fontSize: 12 }}>{cur.line} → {cur.target}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Frontend: <b>build → Netlify</b>. Backend: <b>test → Render</b>. Ikki liniya — bitta workflowda. Keyin shuni ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BITTA WORKFLOW, IKKI JOB =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const JOBS = [
    { id: 'frontend', d: "Frontend job: React'ni build qilib Netlify'ga chiqaradi. O'z mashinasida ishlaydi." },
    { id: 'backend', d: "Backend job: testdan o'tkazib Render'ga chiqaradi. Alohida mashinada, frontend bilan parallel." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(JOBS.map(j => j.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= JOBS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = JOBS.find(j => j.id === active);
  return (
    <Stage eyebrow="Tushuncha · ikki job" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 jobni ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta <span className="mono" style={{ color: T.accent }}>ci.yml</span> ichida <span className="italic" style={{ color: T.accent }}>ikki job</span> qanday ishlaydi?</h2></div>
        <Mentor>2-darsda bitta job (test) bor edi. Endi <b style={{ color: T.ink }}>jobs:</b> ostida ikkita: <span className="mono">frontend</span> va <span className="mono">backend</span>. Ular <b style={{ color: T.ink }}>parallel</b> ishlaydi. Jobni bosib, ci.yml'da yoritib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <TwoJobYml minH={230} hi={active} />
          </Col>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {JOBS.map(j => <button key={j.id} className="gchip" onClick={() => tap(j.id)} style={seen.has(j.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(j.id) ? '✓ ' : ''}{j.id} job</button>)}
            </div>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Jobni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikki job — ikki mustaqil liniya. Biri yiqilsa, ikkinchisi davom etadi. Endi frontend liniyasini batafsil ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Frontend va backendni bitta workflowda qanday tashkil qilamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Frontend va backendni bitta workflowda <span className="italic" style={{ color: T.accent }}>qanday</span> tashkil qilamiz?</h2></>}
    options={['Ikkita alohida job — frontend va backend (parallel ishlaydi)', 'Bitta job, hamma narsa aralash', 'Ikkita alohida repozitoriy kerak', 'Umuman workflow kerak emas']} correctIdx={0}
    explainCorrect="To'g'ri! jobs: ostida ikkita job — frontend va backend. Ular alohida mashinalarda parallel ishlaydi, biri ikkinchisiga to'sqinlik qilmaydi."
    explainWrong={{
      1: "Aralash bo'lsa — chalkash. Har qism o'z jobida bo'lgani toza va parallel.",
      2: "Bitta repo yetarli — ikki qism bitta loyihada, ikki job sifatida.",
      3: "Workflow aynan shu uchun kerak — har push'da ikkalasini avtomatlashtiradi.",
      default: "To'g'risi — ikkita alohida job."
    }} />
);

// ===== SCREEN 5 — FRONTEND LINIYASI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ST = [
    { id: 'install', ico: '📦', label: 'Install', cmd: 'npm install', d: "Frontend paketlarini (React, Vite) o'rnatadi." },
    { id: 'build', ico: '🔨', label: 'Build', cmd: 'npm run build', d: "React kodini optimizatsiya qilib dist/ papkaga yig'adi — internetga tayyor statik fayllar." },
    { id: 'deploy', ico: '🚀', label: 'Deploy', cmd: 'netlify deploy', d: "dist/ papkani Netlify'ga yuklaydi — foydalanuvchi yangilangan saytni ko'radi." }
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
    <Stage eyebrow="Frontend · liniya" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 stansiyani ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontend liniyasida nima bo'ladi — <span className="italic" style={{ color: T.accent }}>build → deploy</span>?</h2></div>
        <Mentor>Frontendning o'zagi — <b style={{ color: T.ink }}>build</b>. React kodi to'g'ridan-to'g'ri chiqmaydi: avval <span className="mono">dist/</span>ga yig'iladi, keyin o'sha papka Netlify'ga ketadi. Har stansiyani bosing.</Mentor>
        <div className="fade-up"><Pipeline stations={FE_STATIONS} statuses={statuses} live={done} /></div>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ST.map(s => <button key={s.id} className="gchip" onClick={() => tap(s.id)} style={seen.has(s.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{s.ico} {s.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label} <span className="mono" style={{ color: T.ink3, marginLeft: 6, fontSize: 12 }}>{cur.cmd}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Stansiyani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>install → build → deploy. Endi shu steplarni o'zingiz yig'asiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — PICKLINES: frontend job =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'checkout', correct: true, label: '- uses: actions/checkout@v4', node: <>{'- '}<At>uses</At>{': '}<St>actions/checkout@v4</St></> },
    { id: 'install', correct: true, label: '- run: npm install', node: <>{'- '}<At>run</At>{': '}<St>npm install</St></> },
    { id: 'build', correct: true, label: '- run: npm run build', node: <>{'- '}<At>run</At>{': '}<St>npm run build</St></> },
    { id: 'deploy', correct: true, label: '- run: netlify deploy --prod', node: <>{'- '}<At>run</At>{': '}<St>netlify deploy --prod</St></> },
    { id: 'push', correct: false, label: '- run: git push', why: "git push workflowni ISHGA TUSHIRADI — uning ichida bo'lmaydi." },
    { id: 'test', correct: false, label: '- run: psql -c "DROP TABLE"', why: "Bu backend/baza buyrug'i — frontend liniyasiga aloqasi yo'q. Frontend faqat build va deploy qiladi." }
  ];
  return (
    <Stage eyebrow="Frontend · yig'ish" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Frontend job'ini yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontend job'ini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yig'ing.</h2></div>
        <Mentor>Mana <span className="mono">frontend:</span> jobining <span className="mono">steps:</span> bo'limi. Faqat frontendga tegishli to'g'ri qatorlarni tanlang.</Mentor>
        <PickLines
          fileName=".github/workflows/ci.yml"
          scaffoldTop={<>{'  '}<At>frontend</At>{':'}{'\n'}{'    '}<At>steps</At>{':'}</>}
          candidates={candidates}
          agent={"Frontend job: kodni ol, paketlarni o'rnat, npm run build qil va Netlify'ga deploy qil."}
          instruction="Qaysi qatorlar frontend steps ichiga kiradi?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'g'ri! checkout → install → build → deploy. Frontend liniyasi tayyor. Endi build aynan nima berishini aniqlaymiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 =====
const Screen7 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Frontend pipeline'da npm run build nima hosil qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>npm run build</span> <span className="italic" style={{ color: T.accent }}>nima</span> hosil qiladi?</h2></>}
    options={['dist/ papka — internetga tayyor statik fayllar; deploy aynan shuni chiqaradi', 'Hech narsa, faqat testlaydi', 'Yangi server ishga tushiradi', 'Ma\'lumotlar bazasini yaratadi']} correctIdx={0}
    explainCorrect="To'g'ri! build React kodini optimizatsiya qilib dist/ papkaga yig'adi (HTML, CSS, JS). Deploy aynan shu papkani Netlify'ga chiqaradi."
    explainWrong={{
      1: "Test — bu alohida qadam. build esa internetga tayyor fayllarni yig'adi.",
      2: "Frontend statik — server kerak emas. build faqat dist/ fayllarini tayyorlaydi.",
      3: "Baza — backend ishi. build frontend fayllarini yig'adi.",
      default: "build → dist/ (internetga tayyor fayllar)."
    }} />
);

// ===== SCREEN 8 — BACKEND LINIYASI =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [broken, setBroken] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = broken;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const statuses = broken ? { install: 'pass', test: 'fail', deploy: 'skip' } : ALL;
  return (
    <Stage eyebrow="Backend · liniya" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Testni buzib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Backend liniyasi nega <span className="italic" style={{ color: T.accent }}>test → deploy</span> tartibida?</h2></div>
        <Mentor>Backend foydalanuvchi ma'lumotlari bilan ishlaydi — shuning uchun avval <b style={{ color: T.ink }}>test</b>. 4b-modulda yozgan testlar o'tsa, Render'ga deploy bo'ladi. Test qizil bo'lsa — deploy <b style={{ color: T.ink }}>to'xtaydi</b>. "Testni buzish"ni bosing.</Mentor>
        <div className="fade-up"><Pipeline stations={BE_STATIONS} statuses={statuses} live={!broken} /></div>
        <div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={broken} onClick={() => { setBroken(true); setSc(n => n + 1); }}>{broken ? '✓ Test qizil → deploy to\'xtadi' : '🔨 Testni buzish (FAIL)'}</button>
            {broken && <div className="frame-warn fade-step"><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 13 }}>🧪 Test: <b style={{ color: T.danger }}>FAIL</b><br />→ 🚀 Deploy: <b>o'tkazib yuborildi</b></p></div>}
          </Col>
          <Col>
            {!broken
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Test yashil → backend Render'ga deploy bo'ldi. Yangilangan API jonli.</p></div>
              : <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.danger}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Test yiqildi → deploy <b>bo'lmadi</b>. Buzuq API foydalanuvchiga chiqmadi — eski ishlaydigan versiya joyida qoldi.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Backend uchun test — himoya darvozasi. Endi deploy uchun zarur narsa: maxfiy token.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — SECRETS =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [safe, setSafe] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = safe;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Xavfsizlik · secrets" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Xavfsiz qiling"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Deploy tokeni — uni <span className="italic" style={{ color: T.accent }}>ochiq yozamizmi</span>?</h2></div>
        <Mentor>Netlify/Render'ga deploy uchun maxfiy <b style={{ color: T.ink }}>token</b> kerak. Uni ci.yml'ga ochiq yozsangiz — repongizni ko'rgan har kim o'g'irlaydi. To'g'risi: <b style={{ color: T.ink }}>GitHub Secrets</b>'da saqlash. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">{safe ? "xavfsiz — ${{ secrets }}" : "xavfli — ochiq token"}</p>
            {!safe
              ? <CodeFile name="ci.yml" minH={90}><At>env</At>{':'}{'\n'}{'  '}<At>NETLIFY_AUTH_TOKEN</At>{': '}<span style={{ color: T.danger, background: 'rgba(194,54,43,0.22)', padding: '0 3px', borderRadius: 3 }}>nfp_8Kx9aQ2bT...</span>{'  '}<Cm>{'// hamma ko\'radi!'}</Cm></CodeFile>
              : <CodeFile name="ci.yml" minH={90}><At>env</At>{':'}{'\n'}{'  '}<At>NETLIFY_AUTH_TOKEN</At>{': '}<St>{'${{ secrets.NETLIFY_AUTH_TOKEN }}'}</St>{'  '}<Cm>{'// yashirin'}</Cm></CodeFile>}
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={safe} onClick={() => { setSafe(true); setSc(n => n + 1); }}>{safe ? '✓ Secrets bilan yashirildi' : '🔒 Xavfsiz qilish'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Tokenni GitHub'da <b>Settings → Secrets</b>'ga bir marta qo'shasiz. ci.yml unga <span className="mono">{'${{ secrets.NAME }}'}</span> orqali murojaat qiladi — qiymat hech qachon ko'rinmaydi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: <b>hech qachon</b> token/parol kodga yoki ci.yml'ga ochiq yozilmaydi. Doim Secrets.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TEST 3 =====
const Screen10 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Netlify deploy tokenini qayerga yozamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Deploy tokenini <span className="italic" style={{ color: T.accent }}>qayerga</span> yozamiz?</h2></>}
    options={['GitHub Secrets\'ga; ci.yml\'da ${{ secrets.NETLIFY_AUTH_TOKEN }} bilan o\'qiymiz', 'To\'g\'ridan-to\'g\'ri ci.yml\'ga ochiq matn sifatida', 'Kod ichiga, App.jsx faylga', 'Hech qayerga — token kerak emas']} correctIdx={0}
    explainCorrect="To'g'ri! Token GitHub Secrets'da saqlanadi va ci.yml'da ${{ secrets.X }} orqali o'qiladi. Qiymat hech qachon ochiq ko'rinmaydi."
    explainWrong={{
      1: "Ochiq yozsangiz — reponi ko'rgan har kim tokenni o'g'irlaydi. Faqat Secrets.",
      2: "Kodga yozish ham xavfli — u GitHub'da ko'rinadi. Token Secrets'da bo'ladi.",
      3: "Deploy uchun token shart — usiz Netlify/Render kim ekaningizni bilmaydi.",
      default: "To'g'risi — GitHub Secrets + ${{ secrets.X }}."
    }} />
);

// ===== SCREEN 11 — ENV (frontend backendni topadi) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ENVS = [
    { id: 'local', t: 'Lokal (kompyuteringiz)', url: 'http://localhost:3000', d: "Ishlab chiqishda backend kompyuteringizda ishlaydi. Frontend localhost:3000'ga so'rov yuboradi." },
    { id: 'prod', t: 'Production (internet)', url: 'https://avtoijara-api.onrender.com', d: "Deploy bo'lgach backend Render'da. Frontend endi real URL'ga so'rov yuboradi — VITE_API_URL shu bilan almashtiriladi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(ENVS.map(e => e.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= ENVS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = ENVS.find(e => e.id === active);
  return (
    <Stage eyebrow="Tushuncha · env" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 muhitni ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontend backendni <span className="italic" style={{ color: T.accent }}>qayerdan topadi</span>?</h2></div>
        <Mentor>Frontend API manzilini bilishi kerak. Lokalda u <span className="mono">localhost:3000</span>, productionda esa real Render URL. Manzilni kodga yozib qo'ymaymiz — <b style={{ color: T.ink }}>env o'zgaruvchisi</b> (<span className="mono">VITE_API_URL</span>) orqali beramiz. Ikkalasini bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ENVS.map(e => <button key={e.id} className="gchip" onClick={() => tap(e.id)} style={seen.has(e.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(e.id) ? '✓ ' : ''}{e.id}</button>)}
            </div>
            {cur && <div className="fade-step" key={active}><CodeFile name=".env" minH={50}><At>VITE_API_URL</At>{'='}<St>{cur.url}</St></CodeFile></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active + 'd'}><p className="note-h">{cur.t}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Muhitni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta kod — ikki muhit. Faqat <span className="mono">VITE_API_URL</span> o'zgaradi. Shuning uchun manzil hech qachon kodga qattiq yozilmaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — DEPLOY MAYDONLARI (Netlify vs Render) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const HOSTS = [
    { id: 'netlify', t: 'Netlify', for: 'Frontend', d: "Statik fayllar (dist/) uchun. Server doim ishlamaydi — fayllar shunchaki tarqatiladi. Tez, arzon, frontendga ideal." },
    { id: 'render', t: 'Render', for: 'Backend', d: "Doimiy ishlaydigan server uchun. Node jarayoni tirik turadi, ma'lumotlar bazasiga ulanadi, so'rovlarga javob beradi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(HOSTS.map(h => h.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= HOSTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = HOSTS.find(h => h.id === active);
  return (
    <Stage eyebrow="Tushuncha · maydonlar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 maydonni ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontend va backend <span className="italic" style={{ color: T.accent }}>har xil joyga</span> chiqadi — nega?</h2></div>
        <Mentor>Frontend = statik fayllar, backend = doimiy server. Ular tabiatan boshqacha, shuning uchun boshqa joylarga deploy bo'ladi. Ikkalasini bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HOSTS.map(h => (
                <button key={h.id} className="vcard" onClick={() => tap(h.id)} style={{ boxShadow: active === h.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="vlbl">{h.t}</span>
                  <span className="role-r mono">{h.for}</span>
                  <span className="vseen" style={{ color: seen.has(h.id) ? T.success : T.ink3 }}>{seen.has(h.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h">{cur.t} <span className="mono" style={{ color: T.ink3, marginLeft: 6, fontSize: 12 }}>{cur.for}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Maydonni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Frontend → Netlify (statik), Backend → Render (server). Boshqa nomlar ham bor (Vercel, Railway), lekin mantiq bir xil.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — CASE: push → 3 daqiqada jonli =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hayotiy · push kuni" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Natijani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashina narxini o'zgartirdingiz va <span className="italic" style={{ color: T.accent }}>push qildingiz</span>. Keyin?</h2></div>
        <Mentor>Bitta <span className="mono">git push</span> — qolgani o'zidan. Tugmani bosib konveyerni kuzating.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">🖥 frontend liniyasi</p>
            <Pipeline stations={FE_STATIONS} statuses={show ? ALL : {}} live={show} />
            <p className="flow-label" style={{ marginTop: 6 }}>⚙️ backend liniyasi</p>
            <Pipeline stations={BE_STATIONS} statuses={show ? ALL : {}} live={show} />
            {!show && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setShow(true); setSc(n => n + 1); }}>▶ git push origin main</button>}
          </Col>
          <Col>
            {show
              ? <Term title="natija" minH={90}><TLine out="✓ frontend: build + deploy (1m 20s)" col={CODE.str} /><TLine out="✓ backend: test + deploy (1m 40s)" col={CODE.str} /><TLine out="🌍 yangi narx jonli saytda" /></Term>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Push qiling ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>~3 daqiqada ikkala tomon ham yangilandi — siz boshqa ish bilan band edingiz. Qo'lda bu 30 daqiqa va ko'p xato edi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Backend testi FAIL bo'lsa nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Backend testi <span className="italic" style={{ color: T.accent }}>FAIL</span> bo'lsa nima bo'ladi?</h2></>}
    options={['Backend deploy to\'xtaydi; frontend o\'z jobida alohida deploy bo\'laveradi', 'Hamma narsa to\'xtaydi, frontend ham chiqmaydi', 'Baribir backend deploy bo\'laveradi', 'Sayt butunlay o\'chib qoladi']} correctIdx={0}
    explainCorrect="To'g'ri! Job'lar mustaqil. Backend testi yiqilsa, backend deploy to'xtaydi — lekin frontend o'z jobida parallel ishlagani uchun u baribir deploy bo'ladi."
    explainWrong={{
      1: "Frontend alohida job — backend yiqilsa ham u to'xtamaydi. Mustaqillik shuning uchun foydali.",
      2: "Test FAIL bo'lsa deploy aynan TO'XTAYDI — buzuq API chiqmaydi.",
      3: "Sayt o'chmaydi — eski ishlaydigan backend joyida qoladi, yangi buzuq versiya chiqmaydi.",
      default: "Backend deploy to'xtaydi, frontend alohida ishlaydi."
    }} />
);

// ===== SCREEN 15 — TO'LIQ NATIJA (2 job) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [broken, setBroken] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = broken;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Payoff · natija" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Backendni buzib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Push'dan keyin <span className="italic" style={{ color: T.accent }}>ikki job</span> qayerda ko'rinadi?</h2></div>
        <Mentor>Push'dan keyin Actions'da ikkala job: frontend va backend. Endi <b style={{ color: T.ink }}>backendni buzib</b>, job'lar bir-biridan mustaqilligini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <ActionsRun jobs={broken ? [FE_JOB, BE_JOB_FAIL] : [FE_JOB, BE_JOB]} />
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={broken} onClick={() => { setBroken(true); setSc(n => n + 1); }}>{broken ? '✓ Backend qizil, frontend yashil' : '🔨 Backend testini buzish'}</button>
          </Col>
          <Col>
            {!broken
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Ikkala job <b style={{ color: T.success }}>yashil ✓</b> — frontend va backend ikkalasi jonli. Sayt to'liq yangilandi.</p></div>
              : <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.amber}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Backend <b style={{ color: T.danger }}>qizil ✗</b> (deploy to'xtadi), lekin frontend <b style={{ color: T.success }}>yashil ✓</b>. Job'lar mustaqil — biri ikkinchisini to'xtatmaydi.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq konveyer: ikki job, har biri o'z liniyasi. Endi hammasini o'zingiz yig'asiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUNIY: to'liq ci.yml to'ldirish =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [build, setBuild] = useState(storedAnswer?.build || '');
  const [secret, setSecret] = useState(storedAnswer?.secret || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const bn = build.toLowerCase().replace(/\s+/g, '');
  const sn = secret.toLowerCase().replace(/\s+/g, '');
  const okBuild = bn === 'build';
  const okSecret = sn.includes('secrets.');
  const valid = okBuild && okSecret;
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'To\'liq ci.yml: build buyrug\'i va secret', correct: true, firstAttemptCorrect: true, solved: true, picked: `build: ${build} / secret: ${secret}`, build, secret });
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "Konveyerni to'ldiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: to'liq konveyerni <span className="italic" style={{ color: T.accent }}>o'zingiz to'ldiring</span>.</h2></div>
        <Mentor>Ikki bo'sh joy: frontend qaysi buyruq bilan <b style={{ color: T.ink }}>build</b> qilinadi va deploy tokeni <b style={{ color: T.ink }}>qayerdan</b> olinadi (xavfsiz).</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">.github/workflows/ci.yml — bo'sh joyni to'ldiring</p>
            <div className="editor">
              <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">ci.yml</span></div>
              <div className="editor-body">
                <pre className="editor-code">{'  frontend:\n    steps:\n      - run: npm install'}</pre>
                <div className="code-line"><pre className="editor-code" style={{ display: 'inline' }}>{'      - run: npm run '}</pre><input className={`code-input inline ${okBuild ? 'ok' : ''}`} value={build} onChange={e => setBuild(e.target.value)} placeholder="build" spellCheck={false} autoCapitalize="off" autoCorrect="off" /></div>
                <pre className="editor-code">{'      - run: netlify deploy --prod\n        env:'}</pre>
                <div className="code-line"><pre className="editor-code" style={{ display: 'inline' }}>{'          NETLIFY_AUTH_TOKEN: ${{ '}</pre><input className={`code-input inline ${okSecret ? 'ok' : ''}`} value={secret} onChange={e => setSecret(e.target.value)} placeholder="secrets.NETLIFY_AUTH_TOKEN" spellCheck={false} autoCapitalize="off" autoCorrect="off" /><pre className="editor-code" style={{ display: 'inline' }}>{' }}'}</pre></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: okBuild ? 1 : 0.4 }}>{okBuild ? '✓' : '1'} npm run build</span>
              <span className="tagpill" style={{ opacity: okSecret ? 1 : 0.4 }}>{okSecret ? '✓' : '2'} secrets.…</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {passed
              ? <ActionsRun jobs={[FE_JOB, BE_JOB]} />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>To'ldiring: npm run <b>build</b> va <b>secrets.</b>NETLIFY_AUTH_TOKEN</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Tabriklaymiz! To'liq konveyer tayyor: frontend build+deploy (token xavfsiz) va backend test+deploy. Har push'da o'zi ishlaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — YAKUN =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "To'liq konveyer: test → build → deploy, frontend va backend uchun",
    "Bitta workflow, ikki job (parallel, mustaqil)",
    "Frontend: build → dist/ → Netlify; Backend: test → Render",
    "Secrets — token GitHub Secrets'da, ${{ secrets.X }} bilan o'qiladi",
    "Env — frontend backend URL'ini VITE_API_URL orqali topadi (lokal vs prod)"
  ];
  const HOMEWORK = [
    { b: 'Qo\'shing', t: "— o'z fullstack loyihangizga ikki-job ci.yml yarating" },
    { b: 'Saqlang', t: "— Netlify/Render tokenlarini GitHub Secrets'ga qo'ying" },
    { b: 'Ko\'ring', t: "— push qilib, ikkala job ham yashil bo'lishini kuzating" }
  ];
  const GLOSSARY = [
    { b: 'job', t: '— mustaqil liniya (frontend / backend)' },
    { b: 'build', t: '— frontendni dist/ ga yig\'ish' },
    { b: 'dist/', t: '— internetga tayyor statik fayllar' },
    { b: 'deploy', t: '— internetga chiqarish' },
    { b: 'secrets', t: '— maxfiy token (GitHub Secrets)' },
    { b: 'env', t: '— muhit o\'zgaruvchisi (VITE_API_URL)' },
    { b: 'Netlify', t: '— frontend (statik) hosting' },
    { b: 'Render', t: '— backend (server) hosting' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> To'liq konveyerni qurdingiz</span><h2 className="title h-title fade-up d1">AvtoIjara endi <span className="italic" style={{ color: T.accent }}>o'zi deploy bo'ladi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Ikki job, frontend build+deploy, backend test+deploy, secrets va env — to'liq fullstack pipeline." : "Yaxshi harakat! Ikki job, secrets va build/deploy farqini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars (P2) — xuddi shu pipeline'ni AI promptlari bilan tez yasaymiz va tekshiramiz (vibecoding)!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function FullPipelineProjectLesson({ lang: langProp, onFinished }) {
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
        .code-line { display: flex; align-items: center; flex-wrap: wrap; }

        /* CODE INPUT */
        .code-input { display: block; width: 100%; margin: 2px 0; background: rgba(0,122,204,0.12); border: 1px dashed #4FA8D8; border-radius: 6px; color: ${CODE.text}; font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); padding: 7px 9px; outline: none; }
        .code-input.ok { border: 1.5px solid ${T.success}; background: rgba(31,122,77,0.18); }
        .code-input.inline { display: inline-block; width: auto; min-width: 90px; margin: 0; padding: 3px 8px; }

        /* PICK LINES */
        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 10px 12px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; }

        /* AGENT CARD */
        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 11px 14px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 4px; }
        .agent-msg { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink}; margin: 0; line-height: 1.55; }

        /* TERMINAL */
        .term { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .term-bar { background: #2D2D2D; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; } .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .term-title { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; }
        .term-body { background: #1E1E1E; padding: 12px 13px; min-height: 60px; }
        .tline { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.8; color: ${CODE.text}; word-break: break-word; }

        /* KONVEYER (PIPELINE) */
        .pipe { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 4px 0; }
        .pipe-step { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 11px; min-width: 66px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
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
