import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// CI/CD + DEPLOY MODULI · DARS 2 — GITHUB ACTIONS: BIRINCHI KONVEYER — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi GitHub Actions nima ekanini, .github/workflows/ci.yml qayerdaligini, YAML ierarxiyasini (Workflow→Job→Step),
//         on:push trigger va runs-on runnerni, uses vs run farqini tushunadi va har push'da npm test ishga tushiruvchi birinchi workflowni yozadi.
// Davomi: Dars 1 (CI/CD konveyer g'oyasi). Endi o'quvchi shu konveyerni O'ZI quradi — GitHub Actions robot orqali.
// Metafora: GitHub Actions = konveyerni boshqaruvchi ROBOT (bepul, repo ichida). ci.yml = robotga RETSEPT. Workflow→Job→Step = reja→stansiya→harakat.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy, global savol sarlavhalar. AUDIOSIZ. Lotincha.
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

const LESSON_META = { lessonId: 'github-actions-v16', lessonTitle: { uz: 'GitHub Actions — birinchi konveyer', ru: 'GitHub Actions — первый конвейер' } };
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
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
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
        <img src={mentorImg} alt="" />
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

// ===== GITHUB ACTIONS RUN (natija maketi) =====
const RUN_STEPS_PASS = [{ label: 'Checkout', ok: true }, { label: 'Setup Node', ok: true }, { label: 'npm install', ok: true }, { label: 'npm test', ok: true }];
const RUN_STEPS_FAIL = [{ label: 'Checkout', ok: true }, { label: 'Setup Node', ok: true }, { label: 'npm install', ok: true }, { label: 'npm test', ok: false }];
const ActionsRun = ({ status = 'pass', steps }) => {
  const list = steps || (status === 'pass' ? RUN_STEPS_PASS : RUN_STEPS_FAIL);
  return (
    <div className="ghrun">
      <div className="ghrun-head">
        <span className={`ghrun-badge ${status}`}>{status === 'pass' ? '✓ Success' : '✗ Failed'}</span>
        <span className="ghrun-title">CI · on: push · #14</span>
      </div>
      <div className="ghrun-job">
        <div className="ghrun-jobname"><span style={{ color: status === 'pass' ? T.success : T.danger }}>{status === 'pass' ? '✓' : '✗'}</span> test · ubuntu-latest</div>
        <div className="ghrun-steps">
          {list.map((s, i) => (<div className="ghrun-step el-in" key={i}><span className="ghrun-ck" style={{ color: s.ok ? T.success : T.danger }}>{s.ok ? '✓' : '✗'}</span><span>{s.label}</span></div>))}
        </div>
      </div>
    </div>
  );
};

// ===== FAYL-TREE EXPLORER (.github/workflows) =====
const FileTree = ({ revealed }) => (
  <div className="tree">
    <div className="tree-row" style={{ paddingLeft: 0 }}>📁 my-project</div>
    {revealed >= 1 && <div className="tree-row hl el-in" style={{ paddingLeft: 18 }}>📁 .github</div>}
    {revealed >= 2 && <div className="tree-row hl el-in" style={{ paddingLeft: 36 }}>📁 workflows</div>}
    {revealed >= 3 && <div className="tree-row hl el-in" style={{ paddingLeft: 54 }}>📄 ci.yml</div>}
    <div className="tree-row dim" style={{ paddingLeft: 18 }}>📁 src</div>
    <div className="tree-row dim" style={{ paddingLeft: 18 }}>📄 package.json</div>
  </div>
);

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
        <CodeFile name={fileName} minH={120}>
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
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Steplar yig'ildi — har push'da shu ketma-ketlik bajariladi.</p></div>}
      </Col>
    </div>
  );
};

// ===== TO'LIQ ci.yml (namuna) =====
const FullYml = ({ minH }) => (
  <CodeFile name=".github/workflows/ci.yml" minH={minH}>
    <At>name</At>{': CI'}{'\n'}
    <At>on</At>{': '}<Kw>push</Kw>{'\n'}
    <At>jobs</At>{':'}{'\n'}
    {'  '}<At>test</At>{':'}{'\n'}
    {'    '}<At>runs-on</At>{': ubuntu-latest'}{'\n'}
    {'    '}<At>steps</At>{':'}{'\n'}
    {'      - '}<At>uses</At>{': '}<St>actions/checkout@v4</St>{'\n'}
    {'      - '}<At>uses</At>{': '}<St>actions/setup-node@v4</St>{'\n'}
    {'      - '}<At>run</At>{': '}<St>npm install</St>{'\n'}
    {'      - '}<At>run</At>{': '}<St>npm test</St>
  </CodeFile>
);

// ===== SCREEN 0 — HOOK: push qildingiz, lekin hech kim tekshirmadi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Har push'dan keyin o'zim qo'lda npm test yozaman" },
    { id: 'b', label: "GitHub Actions sozlayman — robot har push'da o'zi test qiladi" },
    { id: 'c', label: "Testni umuman tashlab qo'yaman" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Kodni GitHub'ga push qildingiz — endi testni <span className="italic" style={{ color: T.accent }}>kim ishga tushiradi</span>?</h1>
        <Mentor>O'tgan darsda konveyer g'oyasini tushundik. Endi push qilib ko'ring — va kim testni ishga tushirishini kuzating.</Mentor>
        <Zoomable><Split>
          <Col>
            <Term title="bash" minH={120}>
              <TLine cmd="git push origin main" />
              {tried && <>
                <TLine out="main -> main" />
                <TLine out="✓ kod GitHub'da" col={CODE.str} />
                <TLine out="... test? hech kim ishga tushirmadi" col="#FF8A7A" />
              </>}
            </Term>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Push qilindi' : '▶ git push'}</button>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kod GitHub'ga bordi — lekin <b>uni hech kim tekshirmadi</b>. Test bormi-yo'qmi, buzuqmi — noma'lum. Buni avtomatlashtirsak-chi?</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Har push'da testni qanday avtomatik ishga tushiramiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval push'ni bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! <b>GitHub Actions</b> — repozitoriyangiz ichidagi bepul robot. Unga bir marta retsept (ci.yml) berasiz, u <b>har push'da</b> testni o'zi ishga tushiradi. Bugun shu robotni quramiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'GitHub Actions nima va qayerda yashaydi', tag: '.github/workflows' },
    { text: 'YAML va ierarxiya', tag: 'Workflow→Job→Step' },
    { text: 'on: push va runs-on', tag: 'qachon · qayerda' },
    { text: 'Birinchi workflow: har push\'da test', tag: 'npm test' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Dars oxirida — har push'da shu chiqadi</p>
      <ActionsRun status="pass" />
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Push qildingiz → GitHub Actions o'zi kodni oldi, test qildi va <b style={{ color: T.success }}>yashil ✓</b> berdi. Hech narsa qo'lda emas.</p></div>
    </Col>
  );
  const StepsB = (
    <Col>
      <p className="flow-label">Bugungi 4 qadam</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{s.tag}</span></span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic scrollSignal={showSteps} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Konveyerni <span className="italic" style={{ color: T.accent }}>o'zimiz</span> qanday quramiz?</h2></div>
        <Mentor>GitHub Actions — konveyerni boshqaradigan robot. Siz unga kichik bir <b style={{ color: T.ink }}>retsept</b> (ci.yml) yozasiz, qolganini u bajaradi. Mana natija va 4 qadam.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — GITHUB ACTIONS NIMA (robot) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · robot" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Robotni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">GitHub Actions — bu <span className="italic" style={{ color: T.accent }}>aslida nima</span>?</h2></div>
        <Mentor>GitHub Actions — GitHub'ning o'z xizmati: <b style={{ color: T.ink }}>bepul</b>, alohida server kerak emas. Siz retsept yozasiz, u har push'da o'zi ishlaydi. Natijani <b style={{ color: T.ink }}>Actions</b> bo'limida ko'rasiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}><p className="note-h" style={{ color: T.danger }}>🐌 Robotsiz</p><p className="body" style={{ margin: 0, color: T.ink }}>Push qilasiz — keyin o'zingiz eslab, qo'lda <span className="mono">npm test</span> yozasiz. Eslamasangiz — tekshiruv yo'q.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : 'Robot bilan-chi?'}</button>
          </Col>
          <Col>
            {show
              ? <><div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="note-h" style={{ color: T.success }}>🤖 GitHub Actions</p><p className="body" style={{ margin: 0, color: T.ink }}>Push'ni <b>sezadi</b> va retsept bo'yicha testni o'zi ishga tushiradi. Bepul, GitHub ichida, har safar. Natija — Actions bo'limida.</p></div><div className="fade-step"><ActionsRun status="pass" /></div></>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Robot tayyor turibdi — faqat unga retsept berishimiz kerak. Bu retsept qayerda saqlanadi?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — QAYERDA YASHAYDI (.github/workflows) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [revealed, setRevealed] = useState(storedAnswer ? 3 : 0);
  const [sc, setSc] = useState(0);
  const done = revealed >= 3;
  const NOTES = [
    'Loyiha ildizida maxsus papka — .github bilan boshlanadi.',
    'Uning ichida workflows papkasi — barcha konveyer retseptlari shu yerda.',
    'ci.yml — bizning retsept. GitHub bu papkani o\'zi topadi va ishga tushiradi.'
  ];
  const go = () => { setRevealed(r => Math.min(r + 1, 3)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · joylashuv" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Yo'lni oching"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Retsept <span className="italic" style={{ color: T.accent }}>qayerda</span> saqlanadi?</h2></div>
        <Mentor>GitHub Actions retsepti aniq bir joyga yoziladi: <span className="mono">.github/workflows/ci.yml</span>. Bu nomlar <b style={{ color: T.ink }}>aniq shunday</b> bo'lishi kerak — GitHub shu papkani o'zi qidiradi. Yo'lni qadam-baqadam oching.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <FileTree revealed={revealed} />
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={go}>{done ? '✓ ci.yml topildi' : (revealed === 0 ? '+ .github papkasini ochish' : revealed === 1 ? '+ workflows papkasini ochish' : '+ ci.yml faylini ochish')}</button>
          </Col>
          <Col>
            <p className="flow-label">izoh</p>
            {revealed === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Papkani oching ←</p></div>
              : <div className="sk-info fade-step" key={revealed}><p className="body" style={{ margin: 0, color: T.ink }}>{NOTES[revealed - 1]}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yodda tuting: <span className="mono">.github/workflows/</span> ichidagi har <span className="mono">.yml</span> fayl — alohida workflow. Endi shu faylning ichini yozamiz.</p></div>}
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
    questionText="GitHub Actions workflow fayli qayerda saqlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Workflow fayli <span className="italic" style={{ color: T.accent }}>qayerda</span> saqlanadi?</h2></>}
    options={['.github/workflows/ papkasida, .yml fayl sifatida', 'src/ papkasi ichida', 'package.json fayli ichida', 'Hech qayerda — GitHub o\'zi biladi']} correctIdx={0}
    explainCorrect="To'g'ri! Workflow fayllari .github/workflows/ papkasida .yml kengaytmasi bilan yashaydi. GitHub bu papkani avtomatik topadi."
    explainWrong={{
      1: "src/ — bu loyiha kodi uchun. Workflow esa .github/workflows/ ichida bo'ladi.",
      2: "package.json — paketlar va scriptlar uchun. Workflow alohida .yml faylda.",
      3: "GitHub aniq joyni qidiradi: .github/workflows/. Bo'lmasa — hech narsa ishlamaydi.",
      default: "To'g'risi — .github/workflows/ papkasidagi .yml fayl."
    }} />
);

// ===== SCREEN 5 — YAML (indentation = ierarxiya) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { id: 'kv', t: 'key: value', d: "Sodda juftlik: kalit va qiymat. Masalan name: CI yoki runs-on: ubuntu-latest." },
    { id: 'list', t: '- ro\'yxat', d: "Chiziqcha (-) ro'yxat elementi. steps: ostidagi har bir - — alohida qadam." },
    { id: 'indent', t: "bo'sh joy = ierarxiya", d: "Chap tomondagi bo'sh joy kim kimning ichidaligini bildiradi. steps: — test: ichida, test: — jobs: ichida." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Tushuncha · YAML" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 qoidani ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">YAML nima — nega <span className="italic" style={{ color: T.accent }}>bo'sh joy</span> muhim?</h2></div>
        <Mentor>ci.yml — YAML tilida. Unda qavs yo'q: <b style={{ color: T.ink }}>bo'sh joy (chekinish)</b> qaysi qator qaysining ichida turishini bildiradi. 3 ta qoidani bosib o'rganing — keyin ci.yml tushunarli bo'ladi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <FullYml minH={180} />
          </Col>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {PARTS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(p.id) ? '✓ ' : ''}{p.t}</button>)}
            </div>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent }}>{cur.t}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qoidani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bo'sh joy noto'g'ri bo'lsa — workflow ishlamaydi. Shuning uchun bo'sh joylarga e'tibor bering. Endi ierarxiyaning 3 darajasini ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — WORKFLOW → JOB → STEP =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LEVELS = [
    { id: 'workflow', icon: '📋', t: 'Workflow', en: 'butun retsept', d: 'Butun konveyer rejasi — bitta ci.yml fayl. name: va on: shu darajada. Ichida bir yoki bir nechta job bo\'ladi.' },
    { id: 'job', icon: '🏭', t: 'Job', en: 'stansiya', d: 'Bir stansiya — o\'z mashinasida (runner) ishlaydi. runs-on: shu yerda. Bir nechta job parallel ishlashi mumkin.' },
    { id: 'step', icon: '🔧', t: 'Step', en: 'harakat', d: 'Bitta harakat: buyruq (run:) yoki tayyor action (uses:). Steplar ketma-ket, yuqoridan pastga bajariladi.' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(LEVELS.map(l => l.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= LEVELS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = LEVELS.find(l => l.id === active);
  return (
    <Stage eyebrow="Tushuncha · ierarxiya" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 darajani ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Konveyer ichida nima — <span className="italic" style={{ color: T.accent }}>Workflow → Job → Step</span> qanday joylashgan?</h2></div>
        <Mentor>Bu darsning markazi. <b style={{ color: T.ink }}>Workflow</b> ichida <b style={{ color: T.ink }}>job</b>, job ichida <b style={{ color: T.ink }}>step</b>. Xuddi: reja → stansiya → harakat. Har darajani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LEVELS.map((l, i) => (
                <button key={l.id} className="vcard" onClick={() => tap(l.id)} style={{ marginLeft: i * 16, boxShadow: active === l.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{l.icon}</span>
                  <span className="vlbl">{l.t}</span>
                  <span className="role-r mono">{l.en}</span>
                  <span className="vseen" style={{ color: seen.has(l.id) ? T.success : T.ink3 }}>{seen.has(l.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span style={{ fontSize: 20, marginRight: 6 }}>{cur.icon}</span>{cur.t} <span className="mono" style={{ color: T.ink3, marginLeft: 6, fontSize: 12 }}>({cur.en})</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Darajani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Workflow ⊃ Job ⊃ Step. ci.yml'da bu bo'sh joy orqali ko'rinadi: steps test ichida, test jobs ichida.</p></div>}
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
    questionText="Workflow, job va step qanday joylashgan?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Workflow, job va step qanday <span className="italic" style={{ color: T.accent }}>joylashgan</span>?</h2></>}
    options={['Workflow ichida job, job ichida step', 'Step ichida job, job ichida workflow', 'Uchchalasi ham bir xil darajada', 'Job ichida workflow, workflow ichida step']} correctIdx={0}
    explainCorrect="To'g'ri! Workflow ⊃ Job ⊃ Step. Eng katta — workflow (butun retsept), uning ichida joblar, har job ichida steplar."
    explainWrong={{
      1: "Teskari — eng katta workflow, eng kichigi step. Step hech narsani o'z ichiga olmaydi.",
      2: "Bir xil daraja emas — ular ichma-ich joylashgan (ierarxiya).",
      3: "Workflow eng tashqarida — u job ichiga kira olmaydi.",
      default: "To'g'risi: Workflow ⊃ Job ⊃ Step."
    }} />
);

// ===== SCREEN 8 — on: TRIGGER =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TRIG = [
    { id: 'push', t: 'push', d: "Kod GitHub'ga yuborilganda ishga tushadi — eng keng tarqalgan. Biz aynan shuni ishlatamiz." },
    { id: 'pr', t: 'pull_request', d: "PR ochilganda/yangilanganda — kodni birlashtirishdan oldin tekshirish uchun." },
    { id: 'schedule', t: 'schedule', d: "Belgilangan vaqtda (cron), masalan har kecha — vaqtli tekshiruvlar uchun." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(TRIG.map(t => t.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= TRIG.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = TRIG.find(t => t.id === active);
  return (
    <Stage eyebrow="Tushuncha · on" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Triggerlarni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>on:</span> — konveyer <span className="italic" style={{ color: T.accent }}>qachon</span> ishga tushadi?</h2></div>
        <Mentor><span className="mono">on:</span> — workflowning <b style={{ color: T.ink }}>triggeri</b>: qaysi hodisa uni ishga tushiradi. Bizning maqsad — <span className="mono">on: push</span>. Uchala variantni bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="ci.yml" minH={90}>
              <At>name</At>{': CI'}{'\n'}
              <At>on</At>{': '}<Kw>{active || 'push'}</Kw>{'   '}<Cm>{'# trigger'}</Cm>{'\n'}
              <At>jobs</At>{':'}{' ...'}
            </CodeFile>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {TRIG.map(t => <button key={t.id} className="gchip" onClick={() => tap(t.id)} style={seen.has(t.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(t.id) ? '✓ ' : ''}{t.t}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent }}>on: {cur.t}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Triggerni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Biz <span className="mono">on: push</span> ishlatamiz — har push'da test ishga tushsin. Endi job qaysi mashinada ishlashini ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — runs-on RUNNER =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · runner" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Mashinani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>runs-on</span> — job <span className="italic" style={{ color: T.accent }}>qaysi mashinada</span> ishlaydi?</h2></div>
        <Mentor>Test bir joyda ishlashi kerak. <span className="mono">runs-on: ubuntu-latest</span> — GitHub sizga <b style={{ color: T.ink }}>bepul, toza virtual mashina</b> beradi. Har run yangi mashinada — toza muhitda. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="ci.yml" minH={110}>
              <At>jobs</At>{':'}{'\n'}
              {'  '}<At>test</At>{':'}{'\n'}
              {'    '}<At>runs-on</At>{': '}<Kw>ubuntu-latest</Kw>{'\n'}
              {'    '}<At>steps</At>{': ...'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Mashina tayyorlandi' : '▶ Mashina qayerdan keladi?'}</button>
          </Col>
          <Col>
            {show
              ? <Term title="GitHub runner" minH={90}><TLine out="🖥  ubuntu-latest ishga tushdi" col={CODE.str} /><TLine out="toza muhit · Node, npm tayyor" /><TLine out="job shu yerda bajariladi" /></Term>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>💡 Linux (ubuntu) eng tez va arzon. Kerak bo'lsa <span className="mono">windows-latest</span> yoki <span className="mono">macos-latest</span> ham bor.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mashina tayyor — endi unda nima bajarilishini (steplarni) yozamiz.</p></div>}
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
    questionText="ci.yml'da on: push nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>on: push</span> <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Workflowni har push qilinganda avtomatik ishga tushiradi', 'Kodni serverga push qiladi', 'Test natijasini GitHub\'ga push qiladi', 'Hech narsa — bu shunchaki izoh']} correctIdx={0}
    explainCorrect="To'g'ri! on: push — bu trigger. Har safar repoga kod push qilinsa, workflow avtomatik ishga tushadi."
    explainWrong={{
      1: "Yo'q — push'ni siz qilasiz (git push). on: push esa shu hodisani 'kutadi' va workflowni ishga tushiradi.",
      2: "Natijani Actions o'zi ko'rsatadi. on: push — bu ishga tushirish sharti.",
      3: "Izoh emas — bu ishlaydigan sozlama. U workflowni push'da ishga tushiradi.",
      default: "on: push — har push'da workflowni ishga tushiradi."
    }} />
);

// ===== SCREEN 11 — uses vs run =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const KINDS = [
    { id: 'uses', icon: '🧩', t: 'uses', d: "Marketplace'dan tayyor action — boshqalar yozgan 'detal'. Masalan uses: actions/checkout@v4 — repodagi kodni runnerga olib keladi." },
    { id: 'run', icon: '⌨️', t: 'run', d: "Oddiy terminal buyrug'i — xuddi o'zingiz yozgandek. Masalan run: npm install yoki run: npm test." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(KINDS.map(k => k.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= KINDS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = KINDS.find(k => k.id === active);
  return (
    <Stage eyebrow="Tushuncha · step turlari" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 turni ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Step qanday yoziladi — <span className="italic" style={{ color: T.accent }}>uses</span>mi yoki <span className="italic" style={{ color: T.accent }}>run</span>mi?</h2></div>
        <Mentor>Har step yo tayyor action chaqiradi (<span className="mono">uses</span>), yo buyruq bajaradi (<span className="mono">run</span>). Ikkalasini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {KINDS.map(k => (
                <button key={k.id} className="vcard" onClick={() => tap(k.id)} style={{ boxShadow: active === k.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{k.icon}</span>
                  <span className="vlbl mono">{k.t}:</span>
                  <span className="vseen" style={{ color: seen.has(k.id) ? T.success : T.ink3 }}>{seen.has(k.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.t}:</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Turini bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>uses</b> — tayyor detal, <b>run</b> — buyruq. Endi standart 4 qadamni tartibda ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — 4 STANDART QADAM TARTIBI =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { id: 'checkout', n: '1', kind: 'uses', code: 'actions/checkout@v4', d: "Repodagi kodni runner mashinasiga olib keladi — busiz mashina bo'sh." },
    { id: 'node', n: '2', kind: 'uses', code: 'actions/setup-node@v4', d: "Mashinaga Node.js o'rnatadi — npm ishlashi uchun kerak." },
    { id: 'install', n: '3', kind: 'run', code: 'npm install', d: "Loyiha paketlarini o'rnatadi (node_modules)." },
    { id: 'test', n: '4', kind: 'run', code: 'npm test', d: "Testlarni ishga tushiradi — yashil bo'lsa job o'tadi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(STEPS.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= STEPS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = STEPS.find(s => s.id === active);
  return (
    <Stage eyebrow="Tushuncha · 4 qadam" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 qadamni ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har workflow qaysi <span className="italic" style={{ color: T.accent }}>4 qadam</span>dan boshlanadi?</h2></div>
        <Mentor>Tartib muhim: avval kodni olamiz, Node o'rnatamiz, paketlarni o'rnatamiz, keyin test qilamiz. Har qadamni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.map(s => (
                <button key={s.id} className="pick-row" onClick={() => tap(s.id)} style={seen.has(s.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>
                  <span className="mono" style={{ color: T.accent, minWidth: 16 }}>{s.n}</span>
                  <span style={{ flex: 1 }}><b>{s.kind}:</b> {s.code}</span>
                  <span className="pick-plus">{seen.has(s.id) ? '✓' : '+'}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent }}>{cur.kind}: {cur.code}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qadamni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>checkout → setup-node → install → test. Endi shu steplarni o'zingiz yig'asiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — PICKLINES: steplarni yig'ish =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'checkout', correct: true, label: '- uses: actions/checkout@v4', node: <>{'- '}<At>uses</At>{': '}<St>actions/checkout@v4</St></> },
    { id: 'install', correct: true, label: '- run: npm install', node: <>{'- '}<At>run</At>{': '}<St>npm install</St></> },
    { id: 'test', correct: true, label: '- run: npm test', node: <>{'- '}<At>run</At>{': '}<St>npm test</St></> },
    { id: 'push', correct: false, label: '- run: git push', why: "git push — bu workflowni ISHGA TUSHIRADI, uning ichida bo'lmaydi. Aks holda cheksiz halqa." },
    { id: 'log', correct: false, label: "- print('test')", why: "Bu YAML/buyruq emas. Step yo run: (buyruq), yo uses: (action) bo'ladi." }
  ];
  return (
    <Stage eyebrow="Amaliyot · yig'ish" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Steplarni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Workflow steplarini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yig'ing.</h2></div>
        <Mentor>Mana <span className="mono">steps:</span> bo'limi. Faqat unga tegishli haqiqiy qatorlarni tanlang — chalg'ituvchilarini emas.</Mentor>
        <PickLines
          fileName=".github/workflows/ci.yml"
          scaffoldTop={<>{'    '}<At>steps</At>{':'}</>}
          candidates={candidates}
          agent={"Workflow yoz: har push'da kodni ol, npm install qil va npm test ishga tushir."}
          instruction="Qaysi qatorlar steps ichiga kiradi?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'g'ri! checkout (kodni ol) → npm install (paket) → npm test (tekshir). <span className="mono">git push</span> — step emas, u workflowni ishga tushiradi.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="- uses: actions/checkout@v4 step'i nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>uses: actions/checkout</span> <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Marketplace\'dagi tayyor action — repodagi kodni runner mashinasiga yuklab oladi', 'Repodagi barcha kodni o\'chiradi', 'Yangi GitHub repozitoriy yaratadi', 'Testni o\'zi yozib beradi']} correctIdx={0}
    explainCorrect="To'g'ri! checkout — eng birinchi step: u sizning kodingizni toza runner mashinasiga ko'chirib oladi. Busiz mashinada tekshiriladigan kod bo'lmaydi."
    explainWrong={{
      1: "Aksincha — u kodni o'chirmaydi, balki runnerga OLIB KELADI.",
      2: "Repo allaqachon bor. checkout faqat undagi kodni mashinaga yuklab oladi.",
      3: "Testni siz yozasiz. checkout — bu faqat kodni runnerga olib keluvchi tayyor action.",
      default: "checkout — kodni runner mashinasiga yuklab oladi."
    }} />
);

// ===== SCREEN 15 — NATIJA: yashil ✓ / qizil ✗ =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [broken, setBroken] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = broken;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Payoff · natija" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kodni buzib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Push'dan keyin natijani <span className="italic" style={{ color: T.accent }}>qayerda</span> ko'ramiz?</h2></div>
        <Mentor>Push qildingiz → GitHub'da <b style={{ color: T.ink }}>Actions</b> bo'limida run paydo bo'ladi. Hammasi o'tsa — yashil <b style={{ color: T.success }}>✓</b>. Bitta step yiqilsa — qizil <b style={{ color: T.danger }}>✗</b>. "Kodni buzish" tugmasini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <ActionsRun status={broken ? 'fail' : 'pass'} />
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={broken} onClick={() => { setBroken(true); setSc(n => n + 1); }}>{broken ? '✓ Test yiqildi → qizil ✗' : '🔨 Kodni buzish (test FAIL)'}</button>
          </Col>
          <Col>
            {!broken
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Yashil <b style={{ color: T.success }}>✓ Success</b> — barcha steplar o'tdi. Kod ishonchli: birlashtirsa ham, deploy qilsa ham bemalol.</p></div>
              : <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.danger}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Qizil <b style={{ color: T.danger }}>✗ Failed</b> — npm test yiqildi. PR'da qizil belgi chiqadi, birlashtirish/deploy <b>bloklanadi</b>. Aynan o'tgan darsdagi "konveyer to'xtadi".</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Natija doim Actions bo'limida ko'rinadi. Endi birinchi workflowingizni o'zingiz yozasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUNIY: ci.yml ni to'ldirish =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [trig, setTrig] = useState(storedAnswer?.trig || '');
  const [cmd, setCmd] = useState(storedAnswer?.cmd || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const tn = trig.toLowerCase().replace(/\s+/g, '');
  const cn = cmd.toLowerCase().replace(/\s+/g, '');
  const okTrig = tn === 'push' || tn === '[push]';
  const okCmd = cn === 'npmtest';
  const valid = okTrig && okCmd;
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'ci.yml: on va run qatorlarini yozing', correct: true, firstAttemptCorrect: true, solved: true, picked: `on: ${trig} / run: ${cmd}`, trig, cmd });
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "Workflowni to'ldiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: birinchi workflowingizni <span className="italic" style={{ color: T.accent }}>to'ldiring</span>.</h2></div>
        <Mentor>Ikki bo'sh joyni to'ldiring: workflow <b style={{ color: T.ink }}>har push'da</b> ishga tushsin (<span className="mono">on:</span>) va <b style={{ color: T.ink }}>testni</b> ishga tushirsin (<span className="mono">run:</span>).</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">.github/workflows/ci.yml — bo'sh joyni to'ldiring</p>
            <div className="editor">
              <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">ci.yml</span></div>
              <div className="editor-body">
                <pre className="editor-code">{'name: CI\n'}</pre>
                <div className="code-line"><pre className="editor-code" style={{ display: 'inline' }}>{'on: '}</pre><input className={`code-input inline ${okTrig ? 'ok' : ''}`} value={trig} onChange={e => setTrig(e.target.value)} placeholder="push" spellCheck={false} autoCapitalize="off" autoCorrect="off" /></div>
                <pre className="editor-code">{'jobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n      - run: npm install'}</pre>
                <div className="code-line"><pre className="editor-code" style={{ display: 'inline' }}>{'      - run: '}</pre><input className={`code-input inline ${okCmd ? 'ok' : ''}`} value={cmd} onChange={e => setCmd(e.target.value)} placeholder="npm test" spellCheck={false} autoCapitalize="off" autoCorrect="off" /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: okTrig ? 1 : 0.4 }}>{okTrig ? '✓' : '1'} on: push</span>
              <span className="tagpill" style={{ opacity: okCmd ? 1 : 0.4 }}>{okCmd ? '✓' : '2'} run: npm test</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {passed
              ? <ActionsRun status="pass" />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>To'ldiring: on: <b>push</b> va run: <b>npm test</b></p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Tabriklaymiz! Bu sizning birinchi konveyeringiz: har push'da kod olinadi va test qilinadi. Robot ishga tushdi.</p></div>}
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
    "GitHub Actions — GitHub ichidagi bepul robot; retsept .github/workflows/ci.yml",
    "YAML: bo'sh joy ierarxiyani bildiradi",
    "Workflow → Job → Step (reja → stansiya → harakat)",
    "on: push — har push'da ishga tushadi; runs-on — qaysi mashinada",
    "Step: uses (tayyor action) + run (buyruq); checkout → setup-node → install → test",
    "Natija — Actions bo'limida: yashil ✓ / qizil ✗"
  ];
  const HOMEWORK = [
    { b: 'Qo\'shing', t: "— o'z repongizga .github/workflows/ci.yml fayl yarating" },
    { b: 'Yozing', t: "— on: push va steps: checkout + npm install + npm test" },
    { b: 'Ko\'ring', t: "— push qilib, Actions bo'limida yashil ✓ ni kuzating" }
  ];
  const GLOSSARY = [
    { b: 'GitHub Actions', t: '— CI/CD robot, GitHub ichida' },
    { b: 'workflow', t: '— butun retsept (ci.yml)' },
    { b: 'job', t: '— stansiya, o\'z mashinasida ishlaydi' },
    { b: 'step', t: '— bitta harakat (uses yoki run)' },
    { b: 'runner', t: '— job ishlaydigan mashina (ubuntu-latest)' },
    { b: 'on: push', t: '— trigger: har push\'da ishga tushadi' },
    { b: 'uses', t: '— tayyor marketplace action' },
    { b: 'run', t: '— terminal buyrug\'i' },
    { b: 'checkout', t: '— kodni runnerga olib keladi' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Birinchi workflowni yozdingiz</span><h2 className="title h-title fade-up d1">Endi robot har push'da <span className="italic" style={{ color: T.accent }}>o'zi tekshiradi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! GitHub Actions, ci.yml, Workflow→Job→Step, on:push va birinchi workflowni o'zlashtirdingiz." : "Yaxshi harakat! Workflow→Job→Step va on:push'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — Loyiha kuni: to'liq pipeline (test + build + deploy) real Backend + Frontend loyihaga!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function GithubActionsLesson({ lang: langProp, onFinished }) {
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
        .code-line { display: flex; align-items: center; flex-wrap: wrap; }

        /* CODE INPUT */
        .code-input { display: block; width: 100%; margin: 2px 0; background: rgba(0,122,204,0.12); border: 1px dashed #4FA8D8; border-radius: 6px; color: ${CODE.text}; font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); padding: 7px 9px; outline: none; }
        .code-input.ok { border: 1.5px solid ${T.success}; background: rgba(31,122,77,0.18); }
        .code-input.inline { display: inline-block; width: auto; min-width: 120px; margin: 0; padding: 3px 8px; }

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

        /* FAYL-TREE */
        .tree { background: ${CODE.bg}; border-radius: 12px; padding: 13px 15px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .tree-row { font-family: 'JetBrains Mono'; font-size: 12.5px; line-height: 1.95; color: ${CODE.text}; display: flex; align-items: center; }
        .tree-row.hl { color: ${CODE.attr}; font-weight: 700; }
        .tree-row.dim { opacity: 0.45; }

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
