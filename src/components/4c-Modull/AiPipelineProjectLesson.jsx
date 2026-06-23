import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// CI/CD + DEPLOY MODULI · DARS 4 (P2) — LOYIHA KUNI: AI BILAN KONVEYER — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi pipeline'ni AI promptlari bilan tez yasaydi (vibecoding) VA AI xatolarini tutadi (token ochiq, npm test unutilgan).
// Davomi: P1 (qo'lda yig'ish). Endi: AI yozadi → siz tekshirasiz. Asosiy mahorat: prompt-craft + AI-verifikatsiya.
// Loyiha: AvtoIjara (React frontend + Express backend). Metafora: konveyer; siz REJISSYOR, AI quradi, siz tekshirasiz.
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

const LESSON_META = { lessonId: 'cicd-ai-pipeline-v16', lessonTitle: { uz: 'Loyiha kuni: AI bilan konveyer', ru: 'Проектный день: конвейер с AI' } };
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

const Zoomable = ({ children }) => {
  const [big, setBig] = useState(false);
  useEffect(() => {
    if (!big) return;
    const onKey = (e) => { if (e.key === 'Escape') setBig(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [big]);
  return (
    <>
      {big && <div className="zoom-backdrop" onClick={() => setBig(false)} />}
      <div className={`zoomable ${big ? 'zoom-on' : ''}`}>
        <button type="button" className="zoom-btn" onClick={() => setBig(b => !b)} aria-label={big ? 'Kichraytirish' : 'Kattalashtirish'} title={big ? 'Kichraytirish' : 'Kattalashtirish'}>{big ? '✕' : '⛶'}</button>
        {children}
      </div>
    </>
  );
};

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
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .pick-row, .chip, .ai-line');
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
        <img src={mentorImg} alt="" />
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

// ===== GITHUB ACTIONS RUN (ko'p job) =====
const ActionsRun = ({ jobs }) => {
  const overall = jobs.every(j => j.ok) ? 'pass' : 'fail';
  return (
    <div className="ghrun">
      <div className="ghrun-head"><span className={`ghrun-badge ${overall}`}>{overall === 'pass' ? '✓ Success' : '✗ Failed'}</span><span className="ghrun-title">CI · on: push · #34</span></div>
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

// ===== AGENT BUILD (vibecoding halqasi: compose → planned → building → done) =====
const AgentBuild = ({ promptParts, plan, code, onDone, storedDone }) => {
  const [sel, setSel] = useState(() => storedDone ? new Set(promptParts.map(p => p.id)) : new Set());
  const [phase, setPhase] = useState(storedDone ? 'done' : 'compose');
  const timer = useRef(null);
  const fired = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const ready = sel.size === promptParts.length;
  const toggle = (id) => { if (phase !== 'compose') return; setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const send = () => { if (ready) setPhase('planned'); };
  const approve = () => { setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  const done = phase === 'done';
  useEffect(() => { if (done && !fired.current) { fired.current = true; onDone && onDone(); } }, [done]);
  const chosen = promptParts.filter(p => sel.has(p.id));
  return (
    <Zoomable>
    <div className="split">
      <Col>
        <p className="flow-label">1. Promptni yig'ing (3 qism)</p>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {promptParts.map(p => <button key={p.id} className={`chip ${sel.has(p.id) ? 'chip-on' : ''}`} disabled={phase !== 'compose'} onClick={() => toggle(p.id)} style={{ justifyContent: 'flex-start', textAlign: 'left' }}><b style={{ marginRight: 6 }}>{p.tag}</b>{p.label}</button>)}
        </div>
        <AgentCard title="💬 Yig'ilgan prompt">{chosen.length ? chosen.map(p => p.label).join('; ') : 'Yuqoridan 3 qismni tanlang…'}</AgentCard>
        {phase === 'compose' && <button className="btn" disabled={!ready} style={{ alignSelf: 'flex-start' }} onClick={send}>Agentga yuborish →</button>}
      </Col>
      <Col>
        <p className="flow-label">2. Agent</p>
        {phase === 'compose'
          ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Promptni yig'ib, yuboring →</p></div>
          : <div className="ai-card fade-step">
            <div className="ai-row"><span className="ai-badge">Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Mana rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Yozyapman…' : 'Tayyor — endi tekshiring')}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {plan.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span style={{ color: T.ink }}>{p}</span></div>)}
            </div>
            {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani tasdiqlash</button>}
            {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>ci.yml yozilyapti…</p>}
            {phase === 'done' && <div className="ai-code fade-step"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{code}</div></div>}
          </div>}
      </Col>
    </div>
    </Zoomable>
  );
};

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "AI yozgan — to'g'ridan ishlataman — tez bo'ladi" },
    { id: 'b', label: "AI yozadi, men o'qib tekshiraman — keyin ishlataman" },
    { id: 'c', label: "AI'ga ishonmayman, hammasini qo'lda yozaman" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha kuni · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>P1'da konveyerni qo'lda yozdingiz — AI buni <span className="italic" style={{ color: T.accent }}>10 soniyada</span> yozadi. Ishonamizmi?</h1>
        <Mentor>Pipeline yozish — ko'p qatlam. AI (Copilot, Claude) buni soniyalarda yozadi. Lekin AI ba'zan xato qiladi: tokenni ochiq qoldiradi yoki testni unutadi. Bir martani ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <Term title="AI · ci.yml yozyapti" minH={130}>
              <TLine out="🤖 prompt qabul qilindi" />
              {tried && <>
                <TLine out="ci.yml yozildi (12 qator)" col={CODE.str} />
                <TLine out="✓ frontend + backend job" col={CODE.str} />
                <TLine out="⚠ token ochiq qolgan? test bormi?" col="#FF8A7A" />
              </>}
            </Term>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ AI workflow yozdi' : '▶ AI\'ga yozdirish'}</button>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI soniyalarda yozdi — lekin ikkita shubha bor: token ochiq qolganmi? test step bormi? Ko'z yumib push qilamizmi?</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>AI yozdi — endi nima qilamiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval AI'ga yozdiring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Testlash modulida ko'rgandek: <b>AI yozadi, siz tekshirasiz</b>. Bugun pipeline'ni AI bilan tez yasab, xatolarini tutamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Yaxshi prompt: Nima + Qanday + Qayerda', tag: 'prompt' },
    { text: 'AI reja beradi — tasdiqlaysiz', tag: 'plan → approve' },
    { text: 'AI workflow yozadi', tag: 'AI quradi' },
    { text: 'Tekshirish: secrets va test xatolarini tutish', tag: 'review' },
    { text: 'Tuzatib push — yashil', tag: '2 job ✓' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Dars oxirida — AI yozadi, siz tekshirasiz</p>
      <ActionsRun jobs={[FE_JOB, BE_JOB]} />
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>AI tezlikni beradi, siz <b>xavfsizlik va to'g'rilikni</b> berasiz. Birga — soniyalarda ishonchli pipeline.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">AI quradi — unda <span className="italic" style={{ color: T.accent }}>sizning ishingiz</span> nima?</h2></div>
        <Mentor>Vibecoding: AI'ga yaxshi buyruq berasiz, u workflow yozadi, siz xatolarini tutib tuzatasiz. Mana natija va 5 qadam.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — NEGA PROMPT BILAN =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · nega AI" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "AI tomonini ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qo'lda yozamizmi — yoki <span className="italic" style={{ color: T.accent }}>AI'ga yozdirib, tekshiramizmi</span>?</h2></div>
        <Mentor>Ikkala usul ham kerak. Qo'lda — har qatorni tushunasiz (P1). AI bilan — soniyalarda yozasiz, lekin <b style={{ color: T.ink }}>tekshirish</b> siz tomondan. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.ink3}` }}><p className="note-h">✍️ Qo'lda (P1)</p><p className="body" style={{ margin: 0, color: T.ink }}>Har qatorni o'zingiz yozasiz — aniq tushunasiz, lekin sekin (15–20 daqiqa).</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : 'AI bilan-chi?'}</button>
          </Col>
          <Col>
            {show
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🤖 AI bilan (P2)</p><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi prompt → AI soniyalarda yozadi. Tez, lekin <b>ko'r-ko'rona ishonib bo'lmaydi</b>: siz o'qib tekshirasiz. P1'da o'rgangan bilim — aynan shu tekshiruv uchun kerak.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI = tezlik, siz = nazorat. Tekshira olishingiz uchun P1'da qo'lda o'rgangansiz. Endi yaxshi prompt yozamiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — YAXSHI PROMPT 3 QISM =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { id: 'what', tag: 'Nima', label: "Fullstack uchun CI/CD workflow yoz", d: "Nimani so'rayotganingiz aniq: bitta ci.yml, frontend + backend." },
    { id: 'how', tag: 'Qanday', label: "frontend build, backend test, ikkalasini deploy", d: "Qaysi qadamlar bo'lishini aytasiz — AI taxmin qilib o'tirmaydi." },
    { id: 'where', tag: 'Qayerda', label: "Netlify + Render, tokenlar secrets'da", d: "Qayerga deploy va muhim shart: token xavfsiz (secrets) bo'lsin." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const chosen = PARTS.filter(p => seen.has(p.id));
  const cur = PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Tushuncha · prompt" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 qismni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yaxshi prompt qaysi <span className="italic" style={{ color: T.accent }}>3 qism</span>dan iborat?</h2></div>
        <Mentor>"Workflow yoz" deb yozsangiz — AI taxmin qiladi va xato qiladi. Aniq ayting: <b style={{ color: T.ink }}>Nima</b>, <b style={{ color: T.ink }}>Qanday</b>, <b style={{ color: T.ink }}>Qayerda</b>. Har qismni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {PARTS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(p.id) ? '✓ ' : ''}{p.tag}</button>)}
            </div>
            <AgentCard title="💬 Yig'ilgan prompt">{chosen.length ? chosen.map(p => p.label).join('; ') : 'Qismlarni tanlang…'}</AgentCard>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ color: T.accent }}>{cur.tag}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Nima + Qanday + Qayerda — to'liq prompt. AI endi taxmin qilmaydi. Endi shu bilan yozdiramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Yaxshi CI/CD prompt nimani aniq aytishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi prompt <span className="italic" style={{ color: T.accent }}>nimani</span> aniq aytadi?</h2></>}
    options={['Nima qilish, qanday qadamlar va qayerga deploy (+ secrets)', 'Faqat "workflow yoz" degan bitta so\'z', 'Hech narsa — AI o\'zi hammasini biladi', 'Faqat saytning rangi va shrifti']} correctIdx={0}
    explainCorrect="To'g'ri! Nima + Qanday + Qayerda. Qancha aniq aytsangiz, AI shuncha to'g'ri yozadi va kamroq xato qiladi."
    explainWrong={{
      1: "'Workflow yoz' — juda umumiy. AI taxmin qiladi va xato (token ochiq, test yo'q) qiladi.",
      2: "AI o'qiy olmaydi — siz aytmasangiz, taxmin qiladi. Aniq prompt kerak.",
      3: "Rang/shrift — CI/CD'ga aloqasi yo'q. Prompt: nima, qanday, qayerda.",
      default: "Yaxshi prompt: Nima + Qanday + Qayerda."
    }} />
);

// ===== SCREEN 5 — AGENTBUILD: frontend =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const parts = [
    { id: 'build', tag: 'Nima:', label: "frontend'ni build qil (npm run build)" },
    { id: 'deploy', tag: 'Qanday:', label: "dist/ ni Netlify'ga deploy qil" },
    { id: 'sec', tag: 'Qayerda:', label: "tokenni secrets'dan ol" }
  ];
  const plan = ['checkout + npm install', 'npm run build → dist/', "Netlify deploy (token: ${{ secrets }})"];
  const code = <>{'frontend:\n  steps:\n    - run: npm install\n    - run: npm run build\n    - run: netlify deploy --prod'}</>;
  return (
    <Stage eyebrow="Vibecoding · frontend" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agent bilan yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontend workflow'ni <span className="italic" style={{ color: T.accent }}>AI'ga yozdiramiz</span>.</h2></div>
        <Mentor>Promptni 3 qismdan yig'ing, agentga yuboring, rejani <b style={{ color: T.ink }}>tasdiqlang</b>, kodni oling. Keyin uni tekshiramiz.</Mentor>
        <AgentBuild promptParts={parts} plan={plan} code={code} completedInit={!!storedAnswer} storedDone={!!storedAnswer} onDone={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }} />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Agent frontend job'ini yozdi. Lekin to'g'rimi? Tez orada uni o'qib tekshiramiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — AI REJASINI TASDIQLASH (noto'g'ri qadamni toping) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(null);
  const [sc, setSc] = useState(0);
  // plan items: index 1 is the wrong one (hardcode token)
  const PLAN = [
    { t: 'Kodni checkout qilaman', bad: false },
    { t: 'Tokenni ci.yml ichiga ochiq yozaman', bad: true },
    { t: 'npm run build qilaman', bad: false }
  ];
  const tap = (i) => {
    if (found) return;
    setPicked(i);
    if (PLAN[i].bad) { setFound(true); setSc(n => n + 1); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: i }); }
  };
  return (
    <Stage eyebrow="Vibecoding · nazorat" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!found} label={found ? 'Davom etish' : "Xato qadamni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI avval <span className="italic" style={{ color: T.accent }}>reja</span> ko'rsatadi — nega muhim?</h2></div>
        <Mentor>Yaxshi AI to'g'ridan kod yozmaydi — avval reja beradi, siz <b style={{ color: T.ink }}>tasdiqlaysiz</b>. Bu sizga nazorat beradi: noto'g'ri qadamni <b style={{ color: T.ink }}>kod yozilishidan oldin</b> tutasiz. Mana AI rejasi — xato qadamni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card">
              <div className="ai-row"><span className="ai-badge">Agent</span><span className="ai-bubble">Mana rejam — tasdiqlaysizmi?</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {PLAN.map((p, i) => (
                  <button key={i} className={`pick-row ${found && p.bad ? '' : ''} ${picked === i && !p.bad ? 'shake' : ''}`} onClick={() => tap(i)} disabled={found} style={found && p.bad ? { boxShadow: `inset 0 0 0 1.5px ${T.danger}`, background: T.dangerSoft } : undefined}>
                    <span style={{ color: found && p.bad ? T.danger : T.ink3 }}>{found && p.bad ? '✗' : '○'}</span>
                    <span style={{ flex: 1 }}>{p.t}</span>
                  </button>
                ))}
              </div>
            </div>
            {picked !== null && !PLAN[picked]?.bad && !found && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qadam yaxshi. Xato boshqasida — tokenga e'tibor bering.</p></div>}
          </Col>
          <Col>
            {!found
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Rejadagi xavfli qadamni bosing ←</p></div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Topdingiz! "Tokenni ochiq yozish" — xavfli. Siz buni <b>rejada</b> tutdingiz — AI hali kod yozmadi. Endi "tokenni secrets'ga ol" deb tuzattirasiz.</p></div>}
            {found && <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Mana nega reja muhim: xatoni erta, arzon bosqichda tutasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 =====
const Screen7 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Vibecoding (AI bilan qurish) halqasi qanday tartibda?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Vibecoding halqasi qanday <span className="italic" style={{ color: T.accent }}>tartibda</span>?</h2></>}
    options={['Prompt yoz → AI reja beradi → tasdiqlaysiz → AI yozadi → siz tekshirasiz', 'AI darhol deploy qiladi, tekshiruv yo\'q', 'Avval kod, keyin prompt', 'Faqat tasdiqlash — prompt va tekshiruv kerak emas']} correctIdx={0}
    explainCorrect="To'g'ri! Prompt → reja → tasdiq → AI yozadi → tekshirish. Tekshirish — eng muhim qadam: AI xatosini aynan shu yerda tutasiz."
    explainWrong={{
      1: "Tekshiruvsiz deploy — xavfli. AI xatosi to'g'ridan productionga chiqadi.",
      2: "Avval prompt (buyruq), keyin AI kod yozadi. Teskari emas.",
      3: "Prompt — boshlanish, tekshirish — yakun. Ikkalasi ham shart.",
      default: "Prompt → reja → tasdiq → AI yozadi → tekshirasiz."
    }} />
);

// ===== SCREEN 8 — TEKSHIRISH #1: SECRETS (xato qatorni toping) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const tapBad = () => { if (found) return; setFound(true); setSc(n => n + 1); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); };
  return (
    <Stage eyebrow="Tekshirish · secrets" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!found} label={found ? 'Davom etish' : "Xavfli qatorni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI workflow yozdi — <span className="italic" style={{ color: T.accent }}>tokenni qanday qoldirdi</span>?</h2></div>
        <Mentor>AI tez yozdi, lekin diqqat: deploy tokeni <b style={{ color: T.ink }}>ochiq matn</b> bilan turibdi. Bu xavfli — reponi ko'rgan har kim o'g'irlaydi. Xavfli qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">🤖 AI yozgan ci.yml</p>
            <div className="ai-code">
              <div className="ai-line" style={{ cursor: 'default' }}><At>steps</At>{':'}</div>
              <div className="ai-line" style={{ cursor: 'default' }}>{'  - '}<At>run</At>{': '}<St>netlify deploy --prod</St></div>
              <div className="ai-line" style={{ cursor: 'default' }}>{'    '}<At>env</At>{':'}</div>
              <div className={`ai-line ${found ? 'bad' : ''}`} onClick={tapBad}>{'      '}<At>NETLIFY_AUTH_TOKEN</At>{': '}<span style={{ color: found ? '#FF8A7A' : CODE.str }}>nfp_8Kx9aQ2bT...</span>{found ? '  ' : ''}{found ? <Cm>{'// ochiq!'}</Cm> : ''}</div>
              {found && <div className="ai-line ok el-in">{'      '}<At>NETLIFY_AUTH_TOKEN</At>{': '}<St>{'${{ secrets.NETLIFY_AUTH_TOKEN }}'}</St></div>}
            </div>
          </Col>
          <Col>
            {!found
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tokeni ochiq yozilgan qatorni bosing ←</p></div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Topdingiz! AI tokenni ochiq qoldirgan. To'g'risi — <span className="mono">{'${{ secrets.NETLIFY_AUTH_TOKEN }}'}</span>. Qiymat hech qachon ko'rinmaydi.</p></div>}
            {found && <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Bu AI'ning tipik xatosi. Shuning uchun AI yozganini <b>doim o'qiysiz</b>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEKSHIRISH #2: TEST UNUTILGAN (yetishmagan qadamni qo'shing) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'test', label: '- run: npm test', correct: true },
    { id: 'log', label: '- run: echo "deploy"', correct: false, why: "Bu shunchaki matn chiqaradi — kodni tekshirmaydi. Kerak: npm test." },
    { id: 'build', label: '- run: npm run build', correct: false, why: "Build — frontend ishi. Backend uchun kerakli himoya — npm test." }
  ];
  const tap = (o) => {
    if (fixed) return;
    setPicked(o.id);
    if (o.correct) { setFixed(true); setSc(n => n + 1); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }
  };
  const cur = OPTS.find(o => o.id === picked);
  return (
    <Stage eyebrow="Tekshirish · test" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!fixed} label={fixed ? 'Davom etish' : "Yetishmagan qadamni qo'shing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI backend job'da <span className="italic" style={{ color: T.accent }}>nimani unutdi</span>?</h2></div>
        <Mentor>AI backend job yozdi: install → deploy. Lekin <b style={{ color: T.ink }}>test yo'q</b>! Demak buzuq kod ham to'g'ridan deploy bo'ladi. Deploydan oldin qaysi qadam kerak?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">🤖 AI yozgan backend (test yo'q)</p>
            <div className="ai-code">
              <div className="ai-line" style={{ cursor: 'default' }}>{'- '}<At>run</At>{': '}<St>npm install</St></div>
              {fixed && <div className="ai-line ok el-in">{'- '}<At>run</At>{': '}<St>npm test</St></div>}
              <div className="ai-line" style={{ cursor: 'default', color: fixed ? CODE.text : '#FF8A7A' }}>{'- '}<At>run</At>{': '}<St>curl $RENDER_HOOK</St>{fixed ? '' : '  '}{fixed ? '' : <Cm>{'// test\'siz deploy!'}</Cm>}</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">deploydan oldin qaysi qadam?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {OPTS.map(o => <button key={o.id} className={`pick-row ${fixed && o.correct ? 'picked' : ''} ${picked === o.id && !o.correct && !fixed ? 'shake' : ''}`} disabled={fixed} onClick={() => tap(o)}><span style={{ flex: 1 }}>{o.label}</span><span className="pick-plus">{fixed && o.correct ? '✓' : '+'}</span></button>)}
            </div>
            {cur && !cur.correct && !fixed && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{cur.why}</p></div>}
            {fixed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <span className="mono">npm test</span> qo'shildi. Endi backend faqat test o'tsa deploy bo'ladi — buzuq API chiqmaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TEST 3 =====
const Screen10 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="AI sizga workflow yozib berdi — birinchi nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI workflow yozdi — <span className="italic" style={{ color: T.accent }}>birinchi</span> nima qilasiz?</h2></>}
    options={['O\'qib tekshiraman — secrets va test bormi, xavfsizmi', 'Ko\'rmasdan darhol push qilaman', 'Hammasini o\'chirib, qo\'lda boshlayman', 'AI\'ga rahmat aytaman va ketaman']} correctIdx={0}
    explainCorrect="To'g'ri! AI yozganini doim o'qiysiz: token secrets'dami, test bormi, qadamlar to'g'rimi. AI tez, lekin xatosiz emas."
    explainWrong={{
      1: "Ko'rmasdan push — AI xatosi (ochiq token, test yo'q) productionga chiqadi. Avval o'qing.",
      2: "O'chirish shart emas — AI yozgani 90% to'g'ri, faqat tekshirib tuzatasiz.",
      3: "Rahmat yaxshi, lekin avval ish: tekshirish. Mas'uliyat sizda.",
      default: "Birinchi — o'qib tekshirasiz (secrets, test)."
    }} />
);

// ===== SCREEN 11 — AGENTBUILD: backend (to'g'ri) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const parts = [
    { id: 'test', tag: 'Nima:', label: "backend'ni test qil (npm test)" },
    { id: 'deploy', tag: 'Qanday:', label: "test o'tsa Render'ga deploy qil" },
    { id: 'sec', tag: 'Qayerda:', label: "RENDER_API_KEY secret bilan" }
  ];
  const plan = ['checkout + npm install', 'npm test (himoya darvozasi)', "Render deploy (secret: ${{ secrets }})"];
  const code = <>{'backend:\n  steps:\n    - run: npm install\n    - run: npm test\n    - run: deploy\n      env: ${{ secrets.RENDER_API_KEY }}'}</>;
  return (
    <Stage eyebrow="Vibecoding · backend" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agent bilan yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Backend workflow'ni ham AI bilan — <span className="italic" style={{ color: T.accent }}>bu safar to'g'ri</span>.</h2></div>
        <Mentor>Endi promptda test va secret'ni <b style={{ color: T.ink }}>aniq</b> aytamiz — AI o'sha xatolarni qilmaydi. Promptni yig'ing va yuboring.</Mentor>
        <AgentBuild promptParts={parts} plan={plan} code={code} storedDone={!!storedAnswer} onDone={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }} />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu safar AI to'g'ri yozdi: <span className="mono">npm test</span> bor, token <span className="mono">secrets</span>'dan. Aniq prompt — kam xato.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — FOLLOW-UP PROMPT =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'good', label: "Tokenni ${{ secrets.NETLIFY_AUTH_TOKEN }} ga ko'chir va deploydan oldin npm test qo'sh", correct: true },
    { id: 'vague', label: "Tuzat", correct: false, why: "Juda umumiy — AI nimani tuzatishni bilmaydi. Aniq ayting: nima va qayerda." },
    { id: 'nuke', label: "Hammasini o'chirib, qaytadan yoz", correct: false, why: "Shart emas — 90% to'g'ri edi. Faqat 2 joyni aniq aytib tuzattirasiz." }
  ];
  const tap = (o) => { if (fixed) return; setPicked(o.id); if (o.correct) { setFixed(true); setSc(n => n + 1); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); } };
  const cur = OPTS.find(o => o.id === picked);
  return (
    <Stage eyebrow="Vibecoding · follow-up" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!fixed} label={fixed ? 'Davom etish' : "Yaxshi follow-up'ni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI xato qildi — qanday <span className="italic" style={{ color: T.accent }}>tuzattirasiz</span>?</h2></div>
        <Mentor>Xato topsangiz, qaytadan boshlamaysiz — <b style={{ color: T.ink }}>follow-up prompt</b> berasiz: aniq nima va qayerda. Qaysi follow-up eng yaxshi?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OPTS.map(o => <button key={o.id} className={`vcard ${picked === o.id && !o.correct && !fixed ? 'shake' : ''}`} disabled={fixed} onClick={() => tap(o)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, boxShadow: fixed && o.correct ? `inset 0 0 0 1.5px ${T.success}` : (picked === o.id && !o.correct ? `inset 0 0 0 1.5px ${T.danger}` : undefined) }}><span className="agent-msg" style={{ fontSize: 12.5 }}>"{o.label}"</span></button>)}
            </div>
          </Col>
          <Col>
            {cur && !cur.correct && !fixed && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{cur.why}</p></div>}
            {!fixed && !cur && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Eng aniq follow-up'ni tanlang ←</p></div>}
            {fixed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ To'g'ri! Yaxshi follow-up — <b>aniq</b>: nimani (token, test) va qayerga (secrets, deploydan oldin). AI darrov tuzatadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — CASE: to'liq vibecoding hikoyasi =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hayotiy · vibecoding" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Natijani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI bilan to'liq pipeline — <span className="italic" style={{ color: T.accent }}>qancha vaqt</span> oladi?</h2></div>
        <Mentor>Mana qanday kechadi: prompt → AI yozadi → siz tekshirasiz → follow-up → yashil. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Term title="vibecoding · vaqt jadvali" minH={150}>
              <TLine out="0:00  prompt: Nima+Qanday+Qayerda" />
              {show && <>
                <TLine out="0:10  🤖 AI ci.yml yozdi" col={CODE.str} />
                <TLine out="0:40  siz o'qidingiz — 2 xato: token ochiq, test yo'q" col="#FF8A7A" />
                <TLine out="1:10  follow-up: secrets + npm test" />
                <TLine out="1:30  🤖 AI tuzatdi" col={CODE.str} />
                <TLine out="2:30  git push → yashil ✓" col={CODE.str} />
              </>}
            </Term>
            {!show && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setShow(true); setSc(n => n + 1); }}>▶ Halqani ko'rish</button>}
          </Col>
          <Col>
            {show
              ? <ActionsRun jobs={[FE_JOB, BE_JOB]} />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI 10 soniya yozdi, siz 2 daqiqa tekshirdingiz — jami ~2.5 daqiqa. Qo'lda 30 daqiqa edi. AI tezligi + sizning nazorat.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="AI tokenni kodga ochiq yozib qo'ydi. Nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI tokenni <span className="italic" style={{ color: T.accent }}>ochiq</span> yozdi. Nima qilasiz?</h2></>}
    options={['Follow-up prompt bilan ${{ secrets.X }} ga ko\'chirtaman (yoki o\'zim tuzataman)', 'Shundayligicha qoldiraman — AI biladi', 'Reponi butunlay o\'chiraman', 'Tokenni hammaga e\'lon qilaman']} correctIdx={0}
    explainCorrect="To'g'ri! Aniq follow-up bilan tokenni secrets'ga ko'chirtaman. AI xatosini tuzatish — sizning mas'uliyatingiz."
    explainWrong={{
      1: "Qoldirsangiz — token o'g'irlanadi. Albatta secrets'ga ko'chiring.",
      2: "Reponi o'chirish shart emas — faqat bitta qatorni tuzatasiz.",
      3: "Tokenni e'lon qilish — eng xavfli ish. Aksincha, uni yashirasiz (secrets).",
      default: "To'g'risi — secrets'ga ko'chirtirish."
    }} />
);

// ===== SCREEN 15 — TO'LIQ NATIJA =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Payoff · natija" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Tushundim"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI va siz birga — <span className="italic" style={{ color: T.accent }}>natija qanday</span>?</h2></div>
        <Mentor>AI tezlikni berdi, siz <b style={{ color: T.ink }}>xavfsizlik va to'g'rilikni</b> berdingiz. Ikkalasi birga — eng yaxshi natija.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <ActionsRun jobs={[FE_JOB, BE_JOB]} />
            {!done && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setDone(true); setSc(n => n + 1); }}>Tushundim ✓</button>}
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🤖 <b>AI:</b> 12 qator ci.yml'ni 10 soniyada yozdi.</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🧑‍💻 <b>Siz:</b> token → secrets, +npm test — 2 ta muhim tuzatish.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana vibecoding: AI yozadi, siz tekshirasiz. Endi hammasini o'zingiz bir martada bajarasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUNIY: AI workflow'idagi 2 xatoni tuzatish =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [fixedToken, setFixedToken] = useState(!!storedAnswer);
  const [addedTest, setAddedTest] = useState(!!storedAnswer);
  const passed = fixedToken && addedTest;
  const fired = useRef(!!storedAnswer);
  useEffect(() => {
    if (passed && !fired.current) {
      fired.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "AI workflow'idagi 2 xatoni tuzating (token→secrets, +npm test)", correct: true, firstAttemptCorrect: true, solved: true, picked: 'token+test fixed' });
    }
  }, [passed]);
  return (
    <Stage eyebrow="Yakuniy · tekshiruv" screen={screen} scrollSignal={passed ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "2 xatoni tuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: AI bergan workflow'dagi <span className="italic" style={{ color: T.accent }}>2 xatoni</span> toping va tuzating.</h2></div>
        <Mentor>AI yozgan ci.yml'da ikki muammo bor: token ochiq, va backend testsiz deploy qilyapti. Ikkalasini tuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">🤖 AI yozgan ci.yml — tuzating</p>
            <div className="ai-code">
              <div className="ai-line" style={{ cursor: 'default' }}><At>frontend</At>{': ... '}<At>run</At>{': '}<St>netlify deploy</St></div>
              <div className={`ai-line ${fixedToken ? 'ok' : 'bad'}`} onClick={() => setFixedToken(true)} title="bosib tuzating">
                {'  TOKEN: '}{fixedToken ? <St>{'${{ secrets.NETLIFY_AUTH_TOKEN }}'}</St> : <span style={{ color: '#FF8A7A' }}>nfp_8Kx9...  // ochiq!</span>}
              </div>
              <div className="ai-line" style={{ cursor: 'default', marginTop: 6 }}><At>backend</At>{': '}<At>run</At>{': '}<St>npm install</St></div>
              {addedTest && <div className="ai-line ok el-in">{'  - '}<At>run</At>{': '}<St>npm test</St></div>}
              <div className="ai-line" style={{ cursor: 'default', color: addedTest ? CODE.text : '#FF8A7A' }}>{'  - '}<At>run</At>{': '}<St>deploy</St>{addedTest ? '' : '  // testsiz!'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" disabled={fixedToken} onClick={() => setFixedToken(true)}>{fixedToken ? '✓ Token secrets\'da' : '🔒 Tokenni secrets\'ga ko\'chir'}</button>
              <button className="btn-soft" disabled={addedTest} onClick={() => setAddedTest(true)}>{addedTest ? '✓ npm test qo\'shildi' : '🧪 npm test qo\'shish'}</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: fixedToken ? 1 : 0.4 }}>{fixedToken ? '✓' : '1'} secrets</span>
              <span className="tagpill" style={{ opacity: addedTest ? 1 : 0.4 }}>{addedTest ? '✓' : '2'} npm test</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {passed
              ? <ActionsRun jobs={[FE_JOB, BE_JOB]} />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Ikki xatoni tuzating: token → secrets, va npm test qo'shing</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Tabriklaymiz! AI'ning ikki xatosini tutib tuzatdingiz. Endi pipeline xavfsiz va to'g'ri — AI + siz birga.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — YAKUN =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "AI pipeline'ni soniyalarda yozadi — lekin tekshirish shart",
    "Yaxshi prompt: Nima + Qanday + Qayerda",
    "Vibecoding halqasi: prompt → reja → tasdiq → AI yozadi → tekshir",
    "AI tipik xatolari: token ochiq (secrets kerak), test unutilgan",
    "Follow-up prompt bilan aniq tuzatish (qaytadan yozish shart emas)"
  ];
  const HOMEWORK = [
    { b: 'So\'rang', t: "— o'z loyihangizga AI'dan ikki-job ci.yml so'rang (Nima+Qanday+Qayerda)" },
    { b: 'Tekshiring', t: "— secrets va npm test borligini o'qib tasdiqlang" },
    { b: 'Ko\'ring', t: "— tuzatib push qiling, Actions'da yashil ✓ ni kuzating" }
  ];
  const GLOSSARY = [
    { b: 'prompt', t: '— AI\'ga buyruq (Nima+Qanday+Qayerda)' },
    { b: 'vibecoding', t: '— AI bilan qurish halqasi' },
    { b: 'reja (plan)', t: '— AI kod yozishdan oldin ko\'rsatadi' },
    { b: 'tekshirish', t: '— AI yozganini o\'qib xato tutish' },
    { b: 'follow-up', t: '— tuzatish uchun aniq qo\'shimcha prompt' },
    { b: 'secrets', t: '— maxfiy token (AI ochiq qoldirishi mumkin)' },
    { b: 'hardcode', t: '— qiymatni ochiq yozib qo\'yish (xavfli)' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> AI bilan konveyer qurdingiz</span><h2 className="title h-title fade-up d1">AI yozdi — siz <span className="italic" style={{ color: T.accent }}>tekshirdingiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Prompt-craft, vibecoding halqasi va AI xatolarini tutish (secrets, test) — endi qo'lingizda." : "Yaxshi harakat! Yaxshi prompt va AI tekshiruvini (secrets, test) mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars (P3) — hammasi birga: test + lint + deploy + monitoring, o'z loyihangiz uchun to'liq professional pipeline!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function AiPipelineProjectLesson({ lang: langProp, onFinished }) {
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
        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 12px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip:disabled { opacity: 0.5; cursor: default; }

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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
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

        /* AI CARD / CODE */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 12px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; word-break: break-word; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }

        /* PICK LINES / ROWS */
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
