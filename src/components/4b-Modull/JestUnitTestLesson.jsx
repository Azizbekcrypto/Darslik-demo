import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';

// ============================================================
// LOYIHANI TESTLASH MODULI · DARS 1 — UNIT-TEST: JEST — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi nima uchun test kerakligini tushunadi, Jest o'rnatadi, birinchi testni yozadi (describe/it/expect/toBe) va ishga tushiradi.
// Davomi: Modul 05 (Nest arxitektura) — Praktikada o'quvchi O'ZI tekshirgan; endi TEST yozadi, kompyuter O'ZI tekshiradi (har safar).
// Sinaladigan kod: KitobShop'ning orderTotal(price, quantity) funksiyasi. Repo bilan mos: .spec.ts, npm test, ts-jest, describe/it/expect.
// Metafora: funksiya = MASHINA; test = "kiritsam → to'g'ri chiqaryaptimi?" avtomatik tekshiruvchi.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy, global savol sarlavhalar, AI ijobiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309', nest: '#E0234E',
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

const LESSON_META = { lessonId: 'jest-unit-test-v16', lessonTitle: { uz: 'Unit-test: Jest', ru: 'Юнит-тесты: Jest' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's16', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's17', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's18', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's19', type: 'summary',     template: 'custom',   scored: false, scope: null }
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

const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
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

// ===== JEST NATIJA EKRANI =====
const JestRun = ({ status, testName = '2 kitob narxini hisoblaydi', expected = '20000', received = '10002' }) => {
  if (status === 'pass') return (
    <div className="jest el-in">
      <div><span className="jest-tag">PASS</span><span className="jest-file"> order.spec.ts</span></div>
      <div className="jest-block"><span style={{ color: CODE.str }}>✓</span> {testName} <span style={{ color: CODE.comment }}>(3 ms)</span></div>
      <div className="jest-sum">Tests: <b style={{ color: T.success }}>1 passed</b>, 1 total</div>
    </div>
  );
  if (status === 'fail') return (
    <div className="jest el-in">
      <div><span className="jest-tag fail">FAIL</span><span className="jest-file"> order.spec.ts</span></div>
      <div className="jest-block"><span style={{ color: '#FF8A7A' }}>✕</span> {testName}</div>
      <div className="jest-diff">{'Expected: '}<span style={{ color: CODE.str }}>{expected}</span>{'\nReceived: '}<span style={{ color: '#FF8A7A' }}>{received}</span></div>
      <div className="jest-sum">Tests: <b style={{ color: T.danger }}>1 failed</b>, 1 total</div>
    </div>
  );
  return null;
};

// ===== PICK LINES =====
const PickLines = ({ fileName, scaffoldTop, scaffoldBottom, candidates, agent, instruction, onComplete, completedInit }) => {
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
            ? <span className="line-empty">{'    // qatorlarni o\'ng tomondan tanlang →'}</span>
            : pickedCorrect.map((c, i) => <React.Fragment key={c.id}>{i > 0 ? '\n' : ''}{'    '}{c.node}</React.Fragment>)}
          {'\n'}{scaffoldBottom}
        </CodeFile>
        {agent && <AgentCard>{agent}</AgentCard>}
      </Col>
      <Col>
        <p className="flow-label">{instruction || 'Testga tegishli qatorlarni tanlang'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {candidates.map(c => (
            <button key={c.id} className={`pick-row ${picked.has(c.id) ? 'picked' : ''} ${shakeId === c.id ? 'shake' : ''}`} disabled={picked.has(c.id)} onClick={() => tap(c)}>
              <span style={{ flex: 1 }}>{c.label}</span>
              <span className="pick-plus">{picked.has(c.id) ? '✓' : '+'}</span>
            </button>
          ))}
        </div>
        {why && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{why}</p></div>}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Test tayyor — chaqirdik va natijani tekshirdik.</p></div>}
      </Col>
    </div>
  );
};

// ===== ORDER FUNKSIYASI (sinaladigan kod) =====
const OrderFn = () => (
  <CodeFile name="order.ts" minH={90}>
    <Jx>export function</Jx>{' orderTotal(price, quantity) {'}{'\n'}
    {'  '}<Jx>return</Jx>{' price * quantity;'}{'\n'}
    {'}'}
  </CodeFile>
);

// ===== SCREEN 0 — HOOK: kodni o'zgartirdingiz, buzilmadimi? =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Har safar qo'lda hisoblab, ko'z bilan tekshiraman" },
    { id: 'b', label: "Test yozaman — kompyuter o'zi avtomatik tekshiradi" },
    { id: 'c', label: "Hech tekshirmayman, ishonaman" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Narx kodini o'zgartirdingiz — biror narsa <span className="italic" style={{ color: T.accent }}>buzilib qolmadimi</span>? Qanday bilasiz?</h1>
        <Mentor>KitobShop'da buyurtma summasini hisoblovchi funksiya bor. Uni o'zgartirdingiz. <b style={{ color: T.ink }}>Hisob hali ham to'g'rimi?</b> Funksiyani bosib, javobni tekshirib ko'ring.</Mentor>
        <Split>
          <Col>
            <OrderFn />
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke}>▶ orderTotal(10000, 2) ni hisoblash</button>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Javob: <b className="mono">20000</b>. To'g'ri ko'rinadi. Lekin funksiyada 5 ta hisob bo'lsa? 50 ta? Har birini har safar <b>qo'lda</b> tekshirasizmi?</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Kod to'g'ri ishlashiga qanday ishonch hosil qilamiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval funksiyani hisoblang ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Modul 05'da <b>o'zingiz</b> tekshirgansiz. Endi <b>test</b> yozasiz — kompyuter kodni <b>har o'zgarishda avtomatik</b> tekshiradi. Bugun shuni o'rganamiz: Jest.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (preview <-> qadamlar, namunaviy v16) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Unit-test nima va nega kerak', tag: 'tushuncha' },
    { text: 'Jest o\'rnatish', tag: 'npm i -D jest' },
    { text: 'Birinchi test: describe / it / expect', tag: 'order.spec.ts' },
    { text: 'Testni ishga tushirish', tag: 'npm test → PASS' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Dars oxirida — shu natijaga erishasiz</p>
      <JestRun status="pass" />
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Sinaymiz: <span className="mono">orderTotal(price, quantity)</span> — KitobShop funksiyasi. Yashil <b style={{ color: T.success }}>PASS</b> — kod to'g'ri ishlayotganini kompyuter tasdiqlaydi.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Kodni har safar qo'lda tekshiramizmi — yoki <span className="italic" style={{ color: T.accent }}>kompyuterga topshiramizmi</span>?</h2></div>
        <Mentor>Test — bu kodingizni avtomatik tekshiradigan boshqa bir kod. Bir marta yozasiz, u <b style={{ color: T.ink }}>har safar</b> tekshiradi. Mana natija va unga olib boradigan 4 qadam.</Mentor>
        {!isNarrow ? <Split>{Preview}{StepsB}</Split>
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — FUNKSIYA = MASHINA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CASES = [
    { in: '(10000, 2)', out: '20000' },
    { in: '(5000, 3)', out: '15000' },
    { in: '(12000, 1)', out: '12000' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1, 2]) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= CASES.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const s = new Set(prev); s.add(i); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · funksiya" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Misollarni sinang (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiya — bu <span className="italic" style={{ color: T.accent }}>mashina</span>. Kiritsangiz, to'g'ri chiqaryaptimi?</h2></div>
        <Mentor>Har funksiya bir mashina: <b style={{ color: T.ink }}>kirish</b> (price, quantity) berasiz, <b style={{ color: T.ink }}>chiqish</b> (summa) qaytaradi. Test — shu mashinani sinash: "shu kirishga shu chiqishni beradimi?". Misollarni bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <OrderFn />
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CASES.map((c, i) => <button key={i} className="gchip" onClick={() => tap(i)} style={seen.has(i) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>orderTotal{c.in}</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">mashina natijasi</p>
            {active === null
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Misolni bosing ←</p></div>
              : <div className="frame fade-step" key={active}><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 14 }}>kirish: <b>{CASES[active].in}</b><br />↓<br />chiqish: <b style={{ color: T.success }}>{CASES[active].out}</b></p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana mashina mantig'i: <b>kirish → chiqish</b>. Test aynan shuni yozib qo'yadi va har safar tekshiradi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — NEGA TEST? (qo'lda vs avtomatik) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · nega" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Farqni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir marta tekshirib bo'ldimi — yoki <span className="italic" style={{ color: T.accent }}>har o'zgarishda qaytamizmi</span>?</h2></div>
        <Mentor>Loyiha o'sganda kod tez-tez o'zgaradi. Bitta joyni tuzatsangiz, boshqasi buzilishi mumkin. Qo'lda tekshirish — sekin va unutiladi. Test — bir marta yoziladi, doim ishlaydi. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}><p className="note-h" style={{ color: T.danger }}>🐌 Qo'lda tekshirish</p><p className="body" style={{ margin: 0, color: T.ink }}>Har o'zgarishdan keyin o'zingiz hisoblaysiz. Sekin, zerikarli — va bir kuni <b>unutib qo'yasiz</b>. Xato sezilmay qoladi.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : 'Test bilan-chi?'}</button>
          </Col>
          <Col>
            {show
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="note-h" style={{ color: T.success }}>⚡ Avtomatik test</p><p className="body" style={{ margin: 0, color: T.ink }}>Bir marta yozasiz. <span className="mono">npm test</span> — sekundda hammasini tekshiradi, har safar. Xato bo'lsa — darhol qizil ko'rsatadi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun professional loyihalarda test yoziladi: <b>ishonch</b> va <b>tezlik</b>. Endi birinchi testni yozamiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Unit-test nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Unit-test <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Funksiyaga kirish berib, chiqish to\'g\'riligini avtomatik tekshiradi', 'Saytni chiroyli qiladi', 'Ma\'lumotni bazaga yozadi', 'Serverni ishga tushiradi']} correctIdx={0}
    explainCorrect="To'g'ri! Unit-test bitta funksiyani sinaydi: ma'lum kirishga kutilgan chiqishni beryaptimi? Va buni har safar avtomatik tekshiradi."
    explainWrong={{
      1: "Dizayn — CSS ishi. Test esa kod to'g'ri ishlashini tekshiradi.",
      2: "Bazaga yozish — service ishi. Test funksiya natijasini tekshiradi.",
      3: "Ishga tushirish — main.ts. Test kod to'g'riligini tekshiradi.",
      default: "Unit-test = funksiya kirish→chiqishini avtomatik tekshiradi."
    }} />
);

// ===== SCREEN 5 — JEST O'RNATISH =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 2 : 0);
  const [sc, setSc] = useState(0);
  const done = step >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const go = () => { setStep(s => Math.min(s + 1, 2)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="1-qadam · o'rnatish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '2 qadamni bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Test yozish uchun <span className="italic" style={{ color: T.accent }}>nima kerak</span>?</h2></div>
        <Mentor>Test asbobi kerak — <b style={{ color: T.ink }}>Jest</b>. Uni bir marta o'rnatamiz va <span className="mono">package.json</span>'ga <span className="mono">"test": "jest"</span> buyrug'ini yozamiz. Ikki qadamni bajaring.</Mentor>
        <Split>
          <Col>
            <Term title="bash" minH={130}>
              <TLine cmd="npm install --save-dev jest ts-jest" />
              {step >= 1 && <><TLine out="added 2 packages" /><TLine out="✓ Jest o'rnatildi" col={CODE.str} /></>}
            </Term>
            {step >= 1 && <CodeFile name="package.json"><Cm>{'"scripts": {'}</Cm>{'\n'}{'  '}<St>"test"</St>{': '}<St>"jest"</St>{'\n'}{'}'}</CodeFile>}
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={go}>{step === 0 ? '▶ npm install -D jest' : (step === 1 ? '✓ "test": "jest" qo\'shish' : '✓ Tayyor')}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>--save-dev</b> — Jest faqat ishlab chiqishda kerak, mijozga yuborilmaydi.</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>"test": "jest"</b> — endi <span className="mono">npm test</span> deb yozsangiz, Jest ishga tushadi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Jest tayyor! Endi birinchi test faylini yozamiz.</p></div>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — TEST FAYLI ANATOMIYASI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { id: 'import', t: 'import', d: "Sinaladigan funksiyani olib kiramiz: import { orderTotal } from './order'." },
    { id: 'describe', t: 'describe', d: "Bog'liq testlarni guruhlaydi: describe('orderTotal', () => { ... })." },
    { id: 'it', t: 'it', d: "Bitta testni yozadi: it('2 kitob narxini hisoblaydi', () => { ... })." },
    { id: 'expect', t: 'expect', d: "Tasdiq: expect(natija).toBe(kutilgan) — to'g'rimi tekshiradi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="2-qadam · test fayli" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 qismni ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Test fayli qanday <span className="italic" style={{ color: T.accent }}>ko'rinadi</span>?</h2></div>
        <Mentor>Test fayli <span className="mono">order.spec.ts</span> deb nomlanadi (<span className="mono">.spec.ts</span> — Jest shularni topadi). Uning 4 qismini bosib o'rganing.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="order.spec.ts" minH={150}>
              <Jx>import</Jx>{' { orderTotal } '}<Jx>from</Jx>{' '}<St>'./order'</St>{';'}{'\n\n'}
              <At>describe</At>{'('}<St>'orderTotal'</St>{', () => {'}{'\n'}
              {'  '}<At>it</At>{'('}<St>'2 kitob narxini hisoblaydi'</St>{', () => {'}{'\n'}
              {'    '}<At>expect</At>{'(orderTotal(10000, 2)).'}<At>toBe</At>{'(20000);'}{'\n'}
              {'  });'}{'\n'}
              {'});'}
            </CodeFile>
          </Col>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {PARTS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(p.id) ? '✓ ' : ''}{p.t}</button>)}
            </div>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent }}>{cur.t}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 qism: import → describe → it → expect. Eng muhimi — <b>expect</b>. Uni chuqurroq ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TESTNI YIG'ISH (PickLines) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'act', correct: true, label: 'const natija = orderTotal(10000, 2);', node: <>{'const natija = orderTotal(10000, 2);'}</> },
    { id: 'assert', correct: true, label: 'expect(natija).toBe(20000);', node: <><At>expect</At>{'(natija).'}<At>toBe</At>{'(20000);'}</> },
    { id: 'log', correct: false, label: "console.log('test ishladi');", why: "console.log faqat ekranga chiqaradi — hech narsani tekshirmaydi. Test uchun expect kerak." },
    { id: 'if', correct: false, label: 'if (natija === 20000) ok();', why: "Jest'da qo'lda if yozilmaydi — expect(...).toBe(...) buni o'zi tekshiradi va hisobot beradi." }
  ];
  return (
    <Stage eyebrow="2-qadam · expect" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Testni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kompyuterga "shu javob <span className="italic" style={{ color: T.accent }}>to'g'ri</span>" deb qanday aytamiz?</h2></div>
        <Mentor><span className="mono">expect(natija).toBe(kutilgan)</span> — bu tasdiq (assertion): "natija aynan shu bo'lishi kerak". Agar boshqacha bo'lsa, Jest qizil xato beradi. Testni yig'ing — faqat haqiqiy tekshiruvchi qatorlarni tanlang.</Mentor>
        <PickLines
          fileName="order.spec.ts"
          scaffoldTop={<><At>it</At>{'('}<St>'2 kitob narxini hisoblaydi'</St>{', () => {'}</>}
          scaffoldBottom={<>{'  });'}</>}
          candidates={candidates}
          agent={"orderTotal'ni sinaydigan test yoz: 10000 narx, 2 dona → 20000 bo'lishini expect(...).toBe(...) bilan tekshir."}
          instruction="Testga qaysi qatorlar kiradi?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana asosiy g'oya: funksiyani <b>chaqir</b>, natijani <b>expect bilan tekshir</b>. <span className="mono">console.log</span> tekshirmaydi — u test emas.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="orderTotal(5000, 3) natijasi 15000 ekanini qanday tekshiramiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Natija 15000 ekanini <span className="italic" style={{ color: T.accent }}>qanday</span> tekshiramiz?</h2></>}
    options={['expect(orderTotal(5000, 3)).toBe(15000)', 'console.log(orderTotal(5000, 3))', 'orderTotal(5000, 3) === 15000', 'return orderTotal(5000, 3)']} correctIdx={0}
    explainCorrect="To'g'ri! expect(...).toBe(15000) — Jest natijani kutilgan qiymat bilan solishtiradi va PASS/FAIL beradi."
    explainWrong={{
      1: "console.log faqat chiqaradi, tekshirmaydi — PASS/FAIL bermaydi.",
      2: "Bu shunchaki true/false beradi, lekin Jest'ga hisobot bermaydi. expect kerak.",
      3: "return natijani qaytaradi, lekin tekshirmaydi. Tasdiq uchun expect(...).toBe(...).",
      default: "To'g'risi — expect(...).toBe(...)."
    }} />
);

// ===== SCREEN 9 — it (bitta xatti-harakat) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · it" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Misolni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta test <span className="italic" style={{ color: T.accent }}>nimani</span> tekshirishi kerak?</h2></div>
        <Mentor><span className="mono">it(...)</span> — bitta test, va u <b style={{ color: T.ink }}>bitta xatti-harakatni</b> tekshiradi. Nomi tushunarli bo'lsin: o'qigan odam nima sinalishini bilsin. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="order.spec.ts" minH={120}>
              <At>it</At>{'('}<St>'2 kitob narxini hisoblaydi'</St>{', () => {'}{'\n'}
              {'  '}<At>expect</At>{'(orderTotal(10000, 2)).'}<At>toBe</At>{'(20000);'}{'\n'}
              {'});'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : 'Yaxshi nom nega muhim?'}</button>
          </Col>
          <Col>
            <p className="flow-label">{show ? 'yaxshi vs yomon nom' : 'it nomi'}</p>
            {!show
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>
              : <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="frame" style={{ borderLeft: `4px solid ${T.success}`, padding: 12 }}><p className="body mono" style={{ margin: 0, fontSize: 12, color: T.ink }}>✓ it('2 kitob narxini hisoblaydi')</p></div>
                <div className="frame" style={{ borderLeft: `4px solid ${T.danger}`, padding: 12 }}><p className="body mono" style={{ margin: 0, fontSize: 12, color: T.ink }}>✗ it('test1')</p></div>
              </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Test qizil bo'lganda, nomidan <b>nima buzilganini</b> darhol bilasiz. Shuning uchun nom tushunarli bo'lsin.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — describe (guruhlash) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · describe" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Guruhlashni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">10 ta test — ularni qanday <span className="italic" style={{ color: T.accent }}>tartibga solamiz</span>?</h2></div>
        <Mentor><span className="mono">describe</span> — bog'liq testlarni bitta guruhga yig'adi (mas. hammasi <span className="mono">orderTotal</span> haqida). Ichida ko'p <span className="mono">it</span> bo'lishi mumkin. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="order.spec.ts" minH={160}>
              <At>describe</At>{'('}<St>'orderTotal'</St>{', () => {'}{'\n'}
              {'  '}<At>it</At>{'('}<St>'2 kitob'</St>{', () => {'}{'\n'}
              {'    '}<At>expect</At>{'(orderTotal(10000, 2)).'}<At>toBe</At>{'(20000);'}{'\n'}
              {'  });'}{'\n'}
              {show && <><span className="el-in">{'  '}<At>it</At>{'('}<St>'3 kitob'</St>{', () => {'}{'\n'}{'    '}<At>expect</At>{'(orderTotal(5000, 3)).'}<At>toBe</At>{'(15000);'}{'\n'}{'  });'}</span>{'\n'}</>}
              {'});'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : '+ Yana bitta test qo\'shish'}</button>
          </Col>
          <Col>
            <p className="flow-label">tuzilma</p>
            <div className="frame" style={{ padding: 14 }}>
              <p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 12, lineHeight: 1.9 }}>📁 describe('orderTotal')<br />&nbsp;&nbsp;✓ it('2 kitob')<br />{show && <span className="el-in">&nbsp;&nbsp;✓ it('3 kitob')</span>}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta <span className="mono">describe</span> ichida nechta <span className="mono">it</span> bo'lsa ham — hammasi bir guruh. Tartibli va o'qish oson.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — npm test (PASS) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ran, setRan] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = ran;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="3-qadam · npm test" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Testni ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tugmani bosdik — kompyuter <span className="italic" style={{ color: T.accent }}>nima deydi</span>?</h2></div>
        <Mentor>Test yozildi. Endi <span className="mono">npm test</span> deb ishga tushiramiz — Jest barcha <span className="mono">.spec.ts</span> fayllarni topib, har testni tekshiradi. Yashil <b style={{ color: T.success }}>PASS</b> — hammasi to'g'ri. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <Term title="bash" minH={70}><TLine cmd="npm test" />{ran && <TLine out="jest ishga tushdi..." />}</Term>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={ran} onClick={() => { setRan(true); setSc(n => n + 1); }}>{ran ? '✓ Bajarildi' : '▶ npm test'}</button>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {ran
              ? <JestRun status="pass" />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>npm test ni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 <b style={{ color: T.success }}>1 passed</b>! Kodingiz to'g'ri ishlayapti — va buni kompyuter tasdiqladi. Lekin test qachon <b>qizil</b> bo'ladi?</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 3 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="describe nima uchun ishlatiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>describe</span> nima uchun <span className="italic" style={{ color: T.accent }}>kerak</span>?</h2></>}
    options={['Bog\'liq testlarni bitta guruhga yig\'adi', 'Funksiyani ishga tushiradi', 'Natijani tekshiradi', 'Jest\'ni o\'rnatadi']} correctIdx={0}
    explainCorrect="To'g'ri! describe('orderTotal', ...) ichidagi barcha it() testlarini bitta guruhga yig'adi — tartibli va o'qish oson."
    explainWrong={{
      1: "Funksiyani it ichida siz chaqirasiz. describe — guruhlash uchun.",
      2: "Tekshirish — expect ishi. describe testlarni guruhlaydi.",
      3: "O'rnatish — npm install. describe testlarni guruhlaydi.",
      default: "describe = bog'liq testlarni guruhlaydi."
    }} />
);

// ===== SCREEN 13 — AAA (tayyorla-chaqir-tekshir) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { id: 'a', icon: '📦', t: 'Tayyorla', d: 'Kerakli ma\'lumotni tayyorlaysiz (price = 10000, qty = 2).', en: 'Arrange' },
    { id: 'b', icon: '▶️', t: 'Chaqir', d: 'Funksiyani chaqirasiz: orderTotal(10000, 2).', en: 'Act' },
    { id: 'c', icon: '✅', t: 'Tekshir', d: 'Natijani tasdiqlaysiz: expect(...).toBe(20000).', en: 'Assert' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(STEPS.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= STEPS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = STEPS.find(s => s.id === active);
  return (
    <Stage eyebrow="Tushuncha · 3 qadam" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 qadamni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yaxshi test qanday <span className="italic" style={{ color: T.accent }}>yoziladi</span>?</h2></div>
        <Mentor>Har test 3 qadamdan iborat: <b style={{ color: T.ink }}>Tayyorla → Chaqir → Tekshir</b> (ingliz tilida AAA: Arrange-Act-Assert). Har qadamni bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STEPS.map(s => (
                <button key={s.id} className="vcard" onClick={() => tap(s.id)} style={{ boxShadow: active === s.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{s.icon}</span>
                  <span className="vlbl">{s.t}</span>
                  <span className="role-r mono">{s.en}</span>
                  <span className="vseen" style={{ color: seen.has(s.id) ? T.success : T.ink3 }}>{seen.has(s.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span style={{ fontSize: 20, marginRight: 6 }}>{cur.icon}</span>{cur.t} <span className="mono" style={{ color: T.ink3, marginLeft: 6, fontSize: 12 }}>({cur.en})</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qadamni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyorla → Chaqir → Tekshir. Har testni shu tartibda yozsangiz — toza va tushunarli bo'ladi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — FAIL: kodni buzsang test sezadi =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [broken, setBroken] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = broken;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Payoff · FAIL" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Kodni buzib ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kodni buzib qo'ysangiz — test buni <span className="italic" style={{ color: T.accent }}>sezadimi</span>?</h2></div>
        <Mentor>Mana testning eng katta foydasi. Funksiyada <span className="mono">*</span> (ko'paytirish) o'rniga xato bilan <span className="mono">+</span> yozildi deylik. Test buni darhol tutadimi? "Buzish" tugmasini bosing.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="order.ts" minH={90}>
              <Jx>export function</Jx>{' orderTotal(price, quantity) {'}{'\n'}
              {'  '}<Jx>return</Jx>{' price '}{broken ? <span style={{ color: T.danger, background: 'rgba(194,54,43,0.25)', padding: '0 3px', borderRadius: 3 }}>+</span> : '*'}{' quantity;'}{broken ? '  ' : ''}{broken ? <Cm>{'// xato!'}</Cm> : ''}{'\n'}
              {'}'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={broken} onClick={() => { setBroken(true); setSc(n => n + 1); }}>{broken ? '✓ Buzildi → test ishladi' : '🔨 Kodni buzish (* → +)'}</button>
          </Col>
          <Col>
            <p className="flow-label">npm test natijasi</p>
            {!broken
              ? <JestRun status="pass" />
              : <JestRun status="fail" expected="20000" received="10002" />}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? 10000 + 2 = 10002, lekin test <b>20000</b> kutgan. Jest darhol <b style={{ color: T.danger }}>qizil FAIL</b> berdi — xato sizgacha yetib keldi, mijozgacha emas. Mana shuning uchun test yoziladi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — TEST 4 =====
const Screen15 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="expect 20000 kutgan, funksiya 10002 qaytardi. Jest nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Natija kutilgandan farq qilsa, Jest <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Qizil FAIL beradi — kutilgan va olingan qiymatni ko\'rsatadi', 'Hech narsa, jim turadi', 'Kodni o\'zi tuzatadi', 'Funksiyani o\'chiradi']} correctIdx={0}
    explainCorrect="To'g'ri! Jest FAIL beradi va 'Expected: 20000, Received: 10002' deb ko'rsatadi — xatoni qayerdaligini darhol bilasiz."
    explainWrong={{
      1: "Jim turmaydi — aynan farqni ko'rsatib, FAIL beradi. Shuning uchun foydali.",
      2: "Jest kodni tuzatmaydi — u faqat xatoni ko'rsatadi, tuzatish sizning ishingiz.",
      3: "Funksiyani o'chirmaydi — faqat test FAIL bo'ladi va sababini ko'rsatadi.",
      default: "Farq bo'lsa — Jest qizil FAIL beradi."
    }} />
);

// ===== SCREEN 16 — CASE: to'liq test fayl =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Yig'indi · to'liq test" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'To\'liq faylni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasi birga — <span className="italic" style={{ color: T.accent }}>to'liq test fayli</span> qanday?</h2></div>
        <Mentor>Mana bugun o'rgangan hamma narsa bitta faylda: import, describe, ikkita it va expect. Ko'rib chiqing — har qatorni endi tushunasiz.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="order.spec.ts" minH={200}>
              <Jx>import</Jx>{' { orderTotal } '}<Jx>from</Jx>{' '}<St>'./order'</St>{';'}{'\n\n'}
              <At>describe</At>{'('}<St>'orderTotal'</St>{', () => {'}{'\n'}
              {'  '}<At>it</At>{'('}<St>'2 kitob narxini hisoblaydi'</St>{', () => {'}{'\n'}
              {'    '}<At>expect</At>{'(orderTotal(10000, 2)).'}<At>toBe</At>{'(20000);'}{'\n'}
              {'  });'}{'\n\n'}
              {'  '}<At>it</At>{'('}<St>'3 kitob narxini hisoblaydi'</St>{', () => {'}{'\n'}
              {'    '}<At>expect</At>{'(orderTotal(5000, 3)).'}<At>toBe</At>{'(15000);'}{'\n'}
              {'  });'}{'\n'}
              {'});'}
            </CodeFile>
          </Col>
          <Col>
            <JestRun status="pass" testName="2 kitob narxini hisoblaydi" />
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => { setDone(true); setSc(n => n + 1); }}>{done ? '✓ Tushundim' : 'Tushundim ✓'}</button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana professional test fayli. 2 ta test ham yashil. Endi buni AI bilan tezroq yozishni ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — AI bilan: test yozdirib, tekshirish =====
const Screen17 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [choice, setChoice] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const done = choice === 'b';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: 'b' }); }, [done]);
  const pick = (v) => { if (choice === 'b') return; setChoice(v); setSc(n => n + 1); };
  return (
    <Stage eyebrow="AI bilan · tekshirish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Haqiqiy testni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI test yozib bersa — <span className="italic" style={{ color: T.accent }}>unga ishonamizmi</span>?</h2></div>
        <Mentor>AI testni tez yozadi — siz uni tekshirasiz. AI ikkita variant berdi. Qaysi biri <b style={{ color: T.ink }}>haqiqatan</b> tekshiradi? (Diqqat: test <span className="mono">expect</span>siz bo'lsa, hech narsani tekshirmaydi.)</Mentor>
        <AgentCard>orderTotal funksiyasiga Jest test yoz: 10000 narx, 2 dona uchun.</AgentCard>
        <div className="split">
          <Col>
            <button className={`vcard ${choice === 'a' ? 'shake' : ''}`} onClick={() => pick('a')} disabled={done} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, boxShadow: choice === 'a' ? `inset 0 0 0 1.5px ${T.danger}` : undefined }}>
              <span className="vlbl">Variant A</span>
              <span className="agent-msg">it('ishlaydi', () =&gt; {'{'} orderTotal(10000, 2); {'}'})</span>
            </button>
            {choice === 'a' && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu test <b>doim PASS</b> bo'ladi — chunki <span className="mono">expect</span> yo'q! Funksiya chaqirildi, lekin natija tekshirilmadi. Bu yolg'on test.</p></div>}
          </Col>
          <Col>
            <button className="vcard" onClick={() => pick('b')} disabled={done} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, boxShadow: choice === 'b' ? `inset 0 0 0 1.5px ${T.success}` : undefined }}>
              <span className="vlbl">Variant B</span>
              <span className="agent-msg">it('2 kitob', () =&gt; {'{'} expect(orderTotal(10000, 2)).toBe(20000); {'}'})</span>
            </button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ To'g'ri! B'da <span className="mono">expect(...).toBe(20000)</span> bor — u natijani haqiqatan tekshiradi. AI yozsa ham, <b>expect borligini</b> siz tekshirasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 18 — YAKUNIY: testni qo'lda yozish =====
const Screen18 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.toLowerCase().replace(/\s+/g, '');
  const hasExpect = /expect\(/.test(v);
  const hasCall = /ordertotal\(5000,3\)/.test(v) || /ordertotal\(5000,3\)/.test(v);
  const hasToBe = /tobe\(15000\)/.test(v);
  const valid = hasExpect && hasCall && hasToBe;
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'orderTotal(5000,3) uchun expect yozing', correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Testni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: testni <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yozing.</h2></div>
        <Mentor><span className="mono">orderTotal(5000, 3)</span> natijasi <b style={{ color: T.ink }}>15000</b> ekanini tekshiruvchi tasdiqni yozing. Namuna: <span className="mono">expect(orderTotal(5000, 3)).toBe(15000)</span></Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">order.spec.ts — tasdiq qatorini yozing</p>
            <div className="editor">
              <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">order.spec.ts</span></div>
              <div className="editor-body">
                <pre className="editor-code">{"it('3 kitob narxini hisoblaydi', () => {"}{'\n'}</pre>
                <input className={`code-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="expect(orderTotal(5000, 3)).toBe(15000)" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                <pre className="editor-code">{'});'}</pre>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasExpect ? 1 : 0.4 }}>{hasExpect ? '✓' : '1'} expect(</span>
              <span className="tagpill" style={{ opacity: hasCall ? 1 : 0.4 }}>{hasCall ? '✓' : '2'} orderTotal(5000, 3)</span>
              <span className="tagpill" style={{ opacity: hasToBe ? 1 : 0.4 }}>{hasToBe ? '✓' : '3'} toBe(15000)</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {passed
              ? <JestRun status="pass" testName="3 kitob narxini hisoblaydi" />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>To'liq yozing: expect( + orderTotal(5000, 3) + .toBe(15000)</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Endi o'zingiz unit-test yoza olasiz. Kompyuter siz uchun tekshiradi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 19 — YAKUN =====
const Screen19 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Unit-test — funksiya kirish→chiqishini avtomatik tekshiradi",
    "Jest o'rnatish: npm install -D jest, \"test\": \"jest\"",
    "Test fayli: import → describe → it → expect",
    "expect(natija).toBe(kutilgan) — asosiy tasdiq",
    "npm test → yashil PASS / qizil FAIL (xatoni tutadi)"
  ];
  const HOMEWORK = [
    { b: 'Yangi test', t: "— orderTotal(7000, 4) uchun toBe(28000) testini yozing" },
    { b: 'AAA', t: "— Tayyorla → Chaqir → Tekshir tartibini qo'llang" },
    { b: 'AI bilan', t: "— AI'dan test so'rang, expect borligini tekshiring" }
  ];
  const GLOSSARY = [
    { b: 'unit-test', t: '— bitta funksiyani sinash' },
    { b: 'Jest', t: '— test asbobi (npm test)' },
    { b: 'describe', t: '— testlarni guruhlaydi' },
    { b: 'it / test', t: '— bitta test (bitta xatti-harakat)' },
    { b: 'expect', t: '— tasdiq: natija to\'g\'rimi' },
    { b: 'toBe', t: '— kutilgan qiymat bilan solishtiradi' },
    { b: 'PASS / FAIL', t: '— yashil to\'g\'ri / qizil xato' },
    { b: 'AAA', t: '— Tayyorla · Chaqir · Tekshir' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Birinchi testni yozdingiz</span><h2 className="title h-title fade-up d1">Endi kompyuter siz uchun <span className="italic" style={{ color: T.accent }}>tekshiradi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Jest o'rnatdingiz, describe/it/expect bilan test yozdingiz va npm test bilan ishga tushirdingiz." : "Yaxshi harakat! expect/toBe va npm test'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — happy path yetarli emas: 0, manfiy, noto'g'ri ma'lumot va exception'larni sinaymiz (edge cases)!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function JestUnitTestLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17, Screen18, Screen19];
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
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* VS CODE EDITOR */
        .editor { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .editor-bar { background: #2D2D2D; padding: 7px 11px; display: flex; align-items: center; gap: 9px; }
        .editor-tab { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; background: #1E1E1E; padding: 4px 11px; border-radius: 6px 6px 0 0; word-break: break-all; }
        .editor-body { background: ${CODE.bg}; padding: 12px 14px; }
        .editor-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.75; color: ${CODE.text}; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .line-empty { color: ${CODE.comment}; font-style: italic; }

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

        /* JEST NATIJA */
        .jest { background: ${CODE.bg}; border-radius: 12px; padding: 13px 15px; font-family: 'JetBrains Mono'; font-size: 12px; color: ${CODE.text}; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); line-height: 1.7; }
        .jest-tag { display: inline-block; background: ${T.success}; color: #fff; font-weight: 800; padding: 2px 9px; border-radius: 5px; font-size: 11px; }
        .jest-tag.fail { background: ${T.danger}; }
        .jest-file { color: #C9D1D9; }
        .jest-block { margin-top: 8px; padding-left: 6px; }
        .jest-diff { margin-top: 6px; padding: 8px 10px; background: rgba(194,54,43,0.16); border-radius: 7px; white-space: pre-wrap; }
        .jest-sum { margin-top: 9px; color: #9FB4D8; border-top: 1px solid rgba(159,180,216,0.2); padding-top: 8px; }

        /* CODE INPUT */
        .code-input { display: block; width: 100%; margin: 2px 0; background: rgba(0,122,204,0.12); border: 1px dashed #4FA8D8; border-radius: 6px; color: ${CODE.text}; font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); padding: 7px 9px; outline: none; }
        .code-input.ok { border: 1.5px solid ${T.success}; background: rgba(31,122,77,0.18); }

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
