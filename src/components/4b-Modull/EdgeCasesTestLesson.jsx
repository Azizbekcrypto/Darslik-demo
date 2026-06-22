import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// LOYIHANI TESTLASH MODULI · DARS 2 — EDGE CASES VA ERROR PATH — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi happy path'dan tashqari chegara holatlar (0, manfiy), noto'g'ri ma'lumot (NaN) va exception'larni (toThrow) sinashni o'rganadi.
// Davomi: Dars 46 (Jest asoslari) — o'sha orderTotal funksiyasi. Endi u himoyasiz ekani ko'rsatiladi, guard (throw) qo'shiladi va sinaladi.
// Funksiya rivoji: orderTotal(price, quantity) → if (typeof quantity !== 'number' || quantity <= 0) throw new Error(...).
// Yangi: expect(() => ...).toThrow(), boundary (1 vs 0), invalid data, error path → 400 (Modul 05 DTO bilan bog'lanish).
// Metafora: happy path = mijoz hammasini to'g'ri qiladi; edge case = "shumtaka mijoz" g'alati narsa kiritsa-chi.
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

const LESSON_META = { lessonId: 'edge-cases-test-v16', lessonTitle: { uz: 'Edge cases va error path', ru: 'Граничные случаи и обработка ошибок' } };
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
  { id: 's11', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's17', type: 'rule',        template: 'custom',   scored: false, scope: null },
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

// ===== JEST NATIJA EKRANI =====
const JestRun = ({ lines }) => (
  // lines: [{ ok: bool, name }]
  <div className="jest el-in">
    {(() => {
      const allOk = lines.every(l => l.ok);
      return <div><span className={`jest-tag ${allOk ? '' : 'fail'}`}>{allOk ? 'PASS' : 'FAIL'}</span><span className="jest-file"> order.spec.ts</span></div>;
    })()}
    {lines.map((l, i) => (
      <div key={i} className="jest-block">{l.ok ? <span style={{ color: CODE.str }}>✓</span> : <span style={{ color: '#FF8A7A' }}>✕</span>} {l.name}</div>
    ))}
    <div className="jest-sum">
      Tests: {lines.filter(l => !l.ok).length > 0 && <b style={{ color: T.danger }}>{lines.filter(l => !l.ok).length} failed</b>}
      {lines.filter(l => !l.ok).length > 0 && lines.some(l => l.ok) && ', '}
      {lines.some(l => l.ok) && <b style={{ color: T.success }}>{lines.filter(l => l.ok).length} passed</b>}
      {', '}{lines.length} total
    </div>
  </div>
);

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
    <Zoomable>
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
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Edge testlar tayyor — har holat alohida sinaldi.</p></div>}
      </Col>
    </div>
    </Zoomable>
  );
};

// ===== ORDER FUNKSIYASI (himoyasiz va mustahkam) =====
const OrderPlain = ({ minH }) => (
  <CodeFile name="order.ts" minH={minH || 90}>
    <Jx>export function</Jx>{' orderTotal(price, quantity) {'}{'\n'}
    {'  '}<Jx>return</Jx>{' price * quantity;'}{'  '}<Cm>{'// himoyasiz'}</Cm>{'\n'}
    {'}'}
  </CodeFile>
);
const OrderGuarded = ({ minH }) => (
  <CodeFile name="order.ts" minH={minH || 130}>
    <Jx>export function</Jx>{' orderTotal(price, quantity) {'}{'\n'}
    {'  '}<Jx>if</Jx>{' ('}<Jx>typeof</Jx>{' quantity !== '}<St>'number'</St>{' || quantity <= 0)'}{'\n'}
    {'    '}<Jx>throw new</Jx>{' Error('}<St>'quantity musbat raqam bo\\'lsin'</St>{');'}{'\n'}
    {'  '}<Jx>return</Jx>{' price * quantity;'}{'\n'}
    {'}'}
  </CodeFile>
);

// ===== SCREEN 0 — HOOK: shumtaka mijoz =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const WEIRD = [
    { in: '(10000, 0)', out: '0', note: '0 so\'m — bepul buyurtma!' },
    { in: '(10000, -5)', out: '-50000', note: 'manfiy — do\'kon pul to\'laydimi?!' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1]) : new Set());
  const [active, setActive] = useState(null);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const tried = seen.size >= 1;
  const OPTS = [
    { id: 'a', label: "Baribir hisoblab beraversin (hozirgidek)" },
    { id: 'b', label: "Xato (Error) berishi kerak — noto'g'ri buyurtma" },
    { id: 'c', label: "Farqi yo'q, hech kim bunday qilmaydi" }
  ];
  const tap = (i) => { setActive(i); setSeen(prev => { const s = new Set(prev); s.add(i); return s; }); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>orderTotal(10000, 2) ishlaydi. Lekin mijoz <span className="italic" style={{ color: T.accent }}>0 ta</span> yoki <span className="italic" style={{ color: T.accent }}>−5 ta</span> buyursa-chi?</h1>
        <Mentor>Dars 46'da funksiyani <b style={{ color: T.ink }}>oddiy</b> kirishda sinadingiz. Lekin haqiqiy do'konda har xil odam bor — kimdir g'alati narsa kiritadi. Pastdagi "g'alati buyurtma"larni bosib, funksiya nima qaytarishini ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <OrderPlain />
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {WEIRD.map((w, i) => <button key={i} className="gchip" onClick={() => tap(i)} style={seen.has(i) ? { boxShadow: `inset 0 0 0 1.5px ${T.danger}`, color: T.danger } : undefined}>orderTotal{w.in}</button>)}
            </div>
            {active !== null && <div className="frame-warn fade-step" key={active}><p className="body" style={{ margin: 0, color: T.ink }}>Natija: <b className="mono" style={{ color: T.danger }}>{WEIRD[active].out}</b> — {WEIRD[active].note}</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Funksiya bunday kirishga qanday javob berishi kerak?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval g'alati buyurtmani sinang ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Happy path (oddiy kirish) yetarli emas. Funksiya <b>noto'g'ri kirishni rad etishi</b> kerak — va biz buni ham <b>sinashimiz</b> kerak. Bugun: edge cases.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (preview + qadamlar) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Happy path vs xato yo\'li', tag: 'farqi' },
    { text: 'Chegara holatlar: 0, manfiy', tag: 'edge / boundary' },
    { text: 'Noto\'g\'ri ma\'lumot va exception', tag: 'throw' },
    { text: 'Exceptionni sinash', tag: 'toThrow()' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Dars oxirida — exceptionni ham sinaysiz</p>
      <JestRun lines={[{ ok: true, name: '2 kitob narxini hisoblaydi' }, { ok: true, name: '0 ta buyurtmada xato beradi' }, { ok: true, name: 'manfiy sonda xato beradi' }]} />
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Endi test faqat "to'g'ri ishlaydimi" emas, "<b>noto'g'rini rad etadimi</b>" ni ham tekshiradi.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Test faqat "to'g'ri ishlaydimi" ni tekshiradimi — yoki <span className="italic" style={{ color: T.accent }}>"noto'g'rini rad etadimi"</span> ham?</h2></div>
        <Mentor>Yaxshi dasturchi ikkalasini ham sinaydi: oddiy kirish (happy path) <b style={{ color: T.ink }}>va</b> g'alati kirish (edge cases). Mana natija va 4 qadam.</Mentor>
        {!isNarrow ? <Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — HAPPY PATH =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · happy path" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Happy path\'ni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Happy path" — bu <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></div>
        <Mentor><b style={{ color: T.ink }}>Happy path</b> — hammasi rejadagidek ketadigan oddiy yo'l: mijoz to'g'ri, kutilgan ma'lumot kiritadi (2 ta kitob, 5 ta...). Dars 46'da aynan shuni sinadingiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="order.spec.ts" minH={90}>
              <At>it</At>{'('}<St>'2 kitob narxini hisoblaydi'</St>{', () => {'}{'\n'}
              {'  '}<At>expect</At>{'(orderTotal(10000, 2)).'}<At>toBe</At>{'(20000);'}{'\n'}
              {'});'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : 'Bu yetarlimi?'}</button>
          </Col>
          <Col>
            <JestRun lines={[{ ok: true, name: '2 kitob narxini hisoblaydi' }]} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yashil! Lekin bu faqat <b>oddiy</b> kirish. Haqiqiy foydalanuvchilar har doim ham "happy" emas — keyingisi: g'alati kirishlar.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — EDGE / CHEGARA =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CASES = [
    { in: '(10000, 0)', out: '0', bad: true, note: '0 so\'m — bepul. Do\'kon zarar ko\'radi.' },
    { in: '(10000, -5)', out: '-50000', bad: true, note: 'Manfiy summa — mantiqsiz!' },
    { in: '(10000, 1)', out: '10000', bad: false, note: "Bu to'g'ri — eng kichik haqiqiy buyurtma." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1, 2]) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= CASES.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const s = new Set(prev); s.add(i); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · edge" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Chegaralarni sinang (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiya <span className="italic" style={{ color: T.accent }}>chegarada</span> qanday ishlaydi — 0, manfiy, eng kichik?</h2></div>
        <Mentor><b style={{ color: T.ink }}>Edge case</b> (chegara holati) — oddiylikning chetidagi qiymatlar: 0, manfiy, eng kichik/katta. Himoyasiz funksiya ularda <b style={{ color: T.ink }}>jim ravishda noto'g'ri</b> javob beradi. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <OrderPlain />
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CASES.map((c, i) => <button key={i} className="gchip" onClick={() => tap(i)} style={seen.has(i) ? { boxShadow: `inset 0 0 0 1.5px ${c.bad ? T.danger : T.success}`, color: c.bad ? T.danger : T.success } : undefined}>orderTotal{c.in}</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {active === null
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chegarani bosing ←</p></div>
              : <div className={CASES[active].bad ? 'frame-warn fade-step' : 'frame-success fade-step'} key={active}><p className="body mono" style={{ margin: '0 0 5px', color: CASES[active].bad ? T.danger : T.success, fontWeight: 700 }}>{CASES[active].in} → {CASES[active].out}</p><p className="body" style={{ margin: 0, color: T.ink }}>{CASES[active].note}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana muammo: <b>0</b> va <b>manfiy</b>da funksiya jim ravishda noto'g'ri ishlaydi. Lekin <b>1</b> to'g'ri. Demak chegara — 0 bilan 1 orasida.</p></div>}
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
    questionText="Edge case (chegara holati) nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>Edge case</span> nima?</h2></>}
    options={['Oddiylikning chetidagi qiymat: 0, manfiy, eng kichik/katta', 'Eng ko\'p uchraydigan oddiy kirish', 'Funksiya nomi', 'Faqat to\'g\'ri ishlaydigan kirish']} correctIdx={0}
    explainCorrect="To'g'ri! Edge case — chegaradagi g'ayrioddiy qiymat (0, manfiy, juda katta, bo'sh). Aynan shu yerda xatolar yashiringan bo'ladi."
    explainWrong={{
      1: "Oddiy kirish — bu happy path. Edge case esa chetdagi g'alati qiymatlar.",
      2: "Bu funksiya nomi emas — edge case kirish qiymatining turi.",
      3: "Aksincha — edge case ko'pincha funksiya noto'g'ri ishlaydigan joy.",
      default: "Edge case = chegaradagi g'ayrioddiy qiymat (0, manfiy...)."
    }} />
);

// ===== SCREEN 5 — NOTO'G'RI MA'LUMOT (NaN) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CASES = [
    { in: "(10000, 'ikki')", out: 'NaN', note: 'NaN = "Not a Number". Jim buzilish — eng xavfli, chunki xato sezilmaydi!' },
    { in: '(10000, null)', out: '0', note: 'null → 0 ga aylanadi — yana bepul buyurtma!' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1]) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= CASES.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const s = new Set(prev); s.add(i); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · noto'g'ri ma'lumot" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ikkalasini sinang (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mijoz raqam o'rniga <span className="italic" style={{ color: T.accent }}>"ikki"</span> deb yozsa nima bo'ladi?</h2></div>
        <Mentor>Foydalanuvchi har doim raqam yubormaydi — matn, bo'sh qiymat (null) kelishi mumkin. Himoyasiz funksiya bunda <b style={{ color: T.ink }}>NaN</b> yoki <b style={{ color: T.ink }}>0</b> beradi — eng yomoni, xato <b style={{ color: T.ink }}>sezilmay</b> qoladi. Sinab ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <OrderPlain />
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CASES.map((c, i) => <button key={i} className="gchip" onClick={() => tap(i)} style={seen.has(i) ? { boxShadow: `inset 0 0 0 1.5px ${T.danger}`, color: T.danger } : undefined}>orderTotal{c.in}</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {active === null
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Noto'g'ri kirishni bosing ←</p></div>
              : <div className="frame-warn fade-step" key={active}><p className="body mono" style={{ margin: '0 0 5px', color: T.danger, fontWeight: 700 }}>{CASES[active].in} → {CASES[active].out}</p><p className="body" style={{ margin: 0, color: T.ink }}>{CASES[active].note}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Demak funksiya noto'g'ri kirishni <b>o'zi to'xtatishi</b> kerak. Buni qanday qilamiz? — Keyingi qadam.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — GUARD (throw) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Yechim · throw" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Funksiyani mustahkamlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiya noto'g'ri kirishni qanday <span className="italic" style={{ color: T.accent }}>rad etadi</span>?</h2></div>
        <Mentor>Funksiya boshida <b style={{ color: T.ink }}>tekshiruv (guard)</b> qo'yamiz: agar quantity raqam bo'lmasa yoki 0 dan kichik bo'lsa — <span className="mono">throw new Error(...)</span> bilan <b style={{ color: T.ink }}>xato tashlaydi</b> va ishni to'xtatadi. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            {show ? <OrderGuarded /> : <OrderPlain minH={130} />}
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Mustahkamlandi' : '🛡️ Guard (throw) qo\'shish'}</button>
          </Col>
          <Col>
            <p className="flow-label">endi nima bo'ladi</p>
            {!show
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>
              : <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="frame-success" style={{ padding: 12 }}><p className="body mono" style={{ margin: 0, fontSize: 12, color: T.ink }}>orderTotal(10000, 2) → <b style={{ color: T.success }}>20000</b> ✓</p></div>
                <div className="frame-warn" style={{ padding: 12 }}><p className="body mono" style={{ margin: 0, fontSize: 12, color: T.ink }}>orderTotal(10000, 0) → <b style={{ color: T.danger }}>Error tashlaydi</b> ✋</p></div>
              </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi funksiya kuchli: to'g'ri kirishda hisoblaydi, noto'g'rida xato beradi. Lekin buni <b>qanday sinaymiz</b>? Xato tashlasa, test buzilmaydimi?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — toThrow (() => o'rashi) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [choice, setChoice] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const done = choice === 'b';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: 'b' }); }, [done]);
  const pick = (v) => { if (choice === 'b') return; setChoice(v); setSc(n => n + 1); };
  return (
    <Stage eyebrow="toThrow" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'To\'g\'ri yozuvni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiya xato tashlasa — uni qanday <span className="italic" style={{ color: T.accent }}>sinaymiz</span>?</h2></div>
        <Mentor>Xato tashlaydigan funksiyani to'g'ridan-to'g'ri chaqirsangiz, test ham buzilib qoladi. Shuning uchun funksiyani <span className="mono">() =&gt;</span> ichiga o'rab beramiz — Jest uni o'zi chaqiradi va <span className="mono">.toThrow()</span> bilan xato tashlaganini tekshiradi. Qaysi yozuv to'g'ri?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button className={`vcard ${choice === 'a' ? 'shake' : ''}`} onClick={() => pick('a')} disabled={done} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, boxShadow: choice === 'a' ? `inset 0 0 0 1.5px ${T.danger}` : undefined }}>
              <span className="vlbl">❌ Variant A</span>
              <span className="agent-msg">expect(orderTotal(10000, 0)).toThrow()</span>
            </button>
            {choice === 'a' && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu yerda <span className="mono">orderTotal(10000, 0)</span> <b>darrov</b> chaqiriladi va xato tashlaydi — expect ushlab ulgurmaydi, test qulaydi. <span className="mono">() =&gt;</span> kerak.</p></div>}
          </Col>
          <Col>
            <button className="vcard" onClick={() => pick('b')} disabled={done} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, boxShadow: choice === 'b' ? `inset 0 0 0 1.5px ${T.success}` : undefined }}>
              <span className="vlbl">✅ Variant B</span>
              <span className="agent-msg">expect(() =&gt; orderTotal(10000, 0)).toThrow()</span>
            </button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ To'g'ri! <span className="mono">() =&gt;</span> funksiyani "o'rab" beradi — Jest uni nazorat ostida chaqiradi va xato chiqqanini ko'rib, testni <b>PASS</b> qiladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Xato tashlashni tekshirish uchun qaysi yozuv to'g'ri?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Exceptionni <span className="italic" style={{ color: T.accent }}>qanday</span> sinaymiz?</h2></>}
    options={['expect(() => orderTotal(10000, 0)).toThrow()', 'expect(orderTotal(10000, 0)).toThrow()', 'expect(orderTotal(10000, 0)).toBe(0)', 'orderTotal(10000, 0).toThrow()']} correctIdx={0}
    explainCorrect="To'g'ri! () => bilan o'raymiz — Jest funksiyani o'zi chaqiradi va xato tashlaganini toThrow bilan tekshiradi."
    explainWrong={{
      1: "() => yo'q — funksiya darrov chaqirilib, xato tashlaydi va test qulaydi. O'rash kerak.",
      2: "toBe(0) — bu xatoni emas, qiymatni tekshiradi. Xato uchun toThrow va () => kerak.",
      3: "Bu noto'g'ri sintaksis — funksiya darrov ishlab xato tashlaydi.",
      default: "To'g'risi — expect(() => ...).toThrow()."
    }} />
);

// ===== SCREEN 9 — CHEGARA CHIZIG'I (1 vs 0) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [a, setA] = useState(!!storedAnswer); // 1 sinaldi
  const [b, setB] = useState(!!storedAnswer); // 0 sinaldi
  const [sc, setSc] = useState(0);
  const done = a && b;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · chegara chizig'i" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikki tomonni sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Chegara qayerda — <span className="italic" style={{ color: T.accent }}>1 to'g'ri, 0 noto'g'ri</span>. Ikkalasini sinaymiz.</h2></div>
        <Mentor>Eng muhim joy — chegara chizig'i. <span className="mono">quantity = 1</span> — eng kichik <b style={{ color: T.ink }}>to'g'ri</b> qiymat (PASS bo'lishi kerak). <span className="mono">quantity = 0</span> — birinchi <b style={{ color: T.ink }}>noto'g'ri</b> qiymat (xato berishi kerak). Yaxshi test chegaraning <b>ikki tomonini</b> ham sinaydi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="order.spec.ts" minH={150}>
              <Cm>{'// chegaraning ikki tomoni'}</Cm>{'\n'}
              <At>it</At>{'('}<St>'1 ta buyurtma ishlaydi'</St>{', () => {'}{'\n'}
              {'  '}<At>expect</At>{'(orderTotal(10000, 1)).'}<At>toBe</At>{'(10000);'}{'\n'}
              {'});'}{'\n'}
              <At>it</At>{'('}<St>'0 ta buyurtmada xato beradi'</St>{', () => {'}{'\n'}
              {'  '}<At>expect</At>{'(() => orderTotal(10000, 0)).'}<At>toThrow</At>{'();'}{'\n'}
              {'});'}
            </CodeFile>
          </Col>
          <Col>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" disabled={a} onClick={() => { setA(true); setSc(n => n + 1); }}>{a ? '✓ 1 → PASS' : '▶ 1 ni sinash'}</button>
              <button className="btn-soft" disabled={b} onClick={() => { setB(true); setSc(n => n + 1); }}>{b ? '✓ 0 → xato tutildi' : '▶ 0 ni sinash'}</button>
            </div>
            {(a || b) && <JestRun lines={[...(a ? [{ ok: true, name: '1 ta buyurtma ishlaydi' }] : []), ...(b ? [{ ok: true, name: '0 ta buyurtmada xato beradi' }] : [])]} />}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikkalasi ham yashil: 1 to'g'ri ishladi, 0 xato berdi (va test buni kutgan edi). Chegara puxta sinaldi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — KO'P EDGE TEST (PickLines) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'happy', correct: true, label: "it('2 kitob', ...) → toBe(20000)", node: <><At>it</At>{'('}<St>'2 kitob'</St>{', () => '}<At>expect</At>{'(orderTotal(10000,2)).'}<At>toBe</At>{'(20000));'}</> },
    { id: 'zero', correct: true, label: "it('0 ta', ...) → toThrow()", node: <><At>it</At>{'('}<St>'0 ta xato'</St>{', () => '}<At>expect</At>{'(() => orderTotal(10000,0)).'}<At>toThrow</At>{'());'}</> },
    { id: 'neg', correct: true, label: "it('manfiy', ...) → toThrow()", node: <><At>it</At>{'('}<St>'manfiy xato'</St>{', () => '}<At>expect</At>{'(() => orderTotal(10000,-5)).'}<At>toThrow</At>{'());'}</> },
    { id: 'log', correct: false, label: "console.log('hammasi joyida')", why: "console.log tekshirmaydi — bu test emas. Har holat uchun expect kerak." },
    { id: 'dup', correct: false, label: "it('test2', () => orderTotal(10000,2))", why: "Bu it'da expect yo'q — funksiya chaqirildi-yu, tekshirilmadi. Yolg'on test." }
  ];
  return (
    <Stage eyebrow="Amaliyot · ko'p test" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Edge testlarni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta funksiyaga <span className="italic" style={{ color: T.accent }}>nechta test</span> kerak — har holat uchunmi?</h2></div>
        <Mentor>Ha — har holat uchun <b style={{ color: T.ink }}>alohida</b> it(): happy path, 0, manfiy. Nomi aniq bo'lsin — qaysi biri qizil bo'lsa, nima buzilganini bilasiz. <span className="mono">describe</span> ichiga faqat haqiqiy testlarni yig'ing.</Mentor>
        <PickLines
          fileName="order.spec.ts"
          scaffoldTop={<><At>describe</At>{'('}<St>'orderTotal'</St>{', () => {'}</>}
          scaffoldBottom={<>{'});'}</>}
          candidates={candidates}
          agent={"orderTotal uchun to'liq test yoz: happy path (2 kitob), 0 ta va manfiy sonda toThrow — har holat alohida it."}
          instruction="describe ichiga qaysi testlar kiradi?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 ta test: happy + 0 + manfiy. Har biri bitta xatti-harakatni tekshiradi. <span className="mono">console.log</span> va expect'siz it — test emas.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="orderTotal funksiyasini sinaganda qaysi holatlarni tekshirish kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi holatlarni <span className="italic" style={{ color: T.accent }}>tekshiramiz</span>?</h2></>}
    options={['Happy path VA chegara/noto\'g\'ri holatlar', 'Faqat happy path (oddiy kirish)', 'Faqat eng katta son', 'Hech qaysi — funksiya o\'zi ishonchli']} correctIdx={0}
    explainCorrect="To'g'ri! Ikkalasi: oddiy kirish (happy path) VA chegara/noto'g'ri (0, manfiy, matn). Xatolar ko'pincha aynan chegarada yashiringan."
    explainWrong={{
      1: "Faqat happy path yetarli emas — 0, manfiy, noto'g'ri kirishda xato yashiringan bo'ladi.",
      2: "Faqat bitta holat — kam. Happy path va edge case'larni birga sinaymiz.",
      3: "Funksiya o'zicha ishonchli emas — aynan shuning uchun test yozamiz.",
      default: "Happy path VA edge case'larni birga sinash kerak."
    }} />
);

// ===== SCREEN 12 — ERROR PATH + API (400) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Error path · API" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bog\'lanishni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiyada <span className="mono" style={{ color: T.accent }}>throw</span> — API'da bu <span className="italic" style={{ color: T.accent }}>nimaga aylanadi</span>?</h2></div>
        <Mentor>Esingizdami — Modul 05'da <b style={{ color: T.ink }}>DTO</b> noto'g'ri ma'lumotni 400 bilan rad etardi. Bu o'sha g'oya: noto'g'ri kirish "error path"dan ketadi. Funksiyada <span className="mono">throw</span>, API'da <span className="mono">@IsNumber</span> → <b style={{ color: T.ink }}>400</b>. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="create-order.dto.ts" minH={90}>
              <At>@IsNumber</At>{'()  '}<At>@Min</At>{'(1)'}{'\n'}
              {'quantity: '}<St>number</St>{';'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : '▶ POST /order { quantity: 0 }'}</button>
          </Col>
          <Col>
            <p className="flow-label">API javobi</p>
            {!show
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>So'rovni yuboring ←</p></div>
              : <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 400 — Bad Request</p><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 12 }}>"quantity must not be less than 1"</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil mantiq, ikki qatlam: <b>funksiyada</b> throw (unit-test toThrow bilan tekshiradi), <b>API'da</b> DTO → 400. Ikkalasi ham "error path".</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — CASE: faqat edge-test tutadigan bug =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 2 : 0); // 0 boshlang'ich, 1 happy-only (bug o'tib ketdi), 2 edge qo'shildi (tutildi)
  const [sc, setSc] = useState(0);
  const done = step >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const go = () => { setStep(s => Math.min(s + 1, 2)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Payoff · case" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Hikoyani ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Faqat <span className="italic" style={{ color: T.accent }}>edge-test</span> tutadigan xato — qanday qutqaradi?</h2></div>
        <Mentor>Tasavvur qiling: kimdir <span className="mono">-5</span> ta buyurtma berib, do'kondan <b style={{ color: T.ink }}>50 000 so'm "qaytim"</b> oldi. Agar faqat happy-path test bo'lsa, bu xato sezilmay ishlab ketadi. Hikoyani bosib kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={go}>{step === 0 ? '▶ Faqat happy-path test bilan' : (step === 1 ? '🛡️ Edge testni qo\'shish' : '✓ Tutildi')}</button>
            {step >= 1 && <div className={step >= 2 ? 'frame-success fade-step' : 'frame-warn fade-step'}>
              {step === 1
                ? <p className="body" style={{ margin: 0, color: T.ink }}>Happy-path testlar <b style={{ color: T.success }}>yashil</b> — lekin manfiy buyurtma xatosi <b style={{ color: T.danger }}>sezilmay ishlab ketdi</b>. Pul yo'qotildi!</p>
                : <p className="body" style={{ margin: 0, color: T.ink }}>Edge test (<span className="mono">toThrow</span>) qo'shildi — endi manfiy buyurtma <b>darhol qizil</b> bo'ladi. Xato mijozgacha yetib bormaydi.</p>}
            </div>}
          </Col>
          <Col>
            <p className="flow-label">npm test</p>
            {step === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {step === 1 && <JestRun lines={[{ ok: true, name: '2 kitob narxini hisoblaydi' }]} />}
            {step >= 2 && <JestRun lines={[{ ok: true, name: '2 kitob narxini hisoblaydi' }, { ok: false, name: 'manfiy sonda xato beradi' }]} />}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qizil FAIL — bu yaxshi xabar! Test xatoni <b>siz</b> ko'rar oldidan tutdi. Mana edge case'ning kuchi.</p></div>}
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
    questionText="Nega faqat happy-path test yetarli emas?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega faqat <span className="italic" style={{ color: T.accent }}>happy-path</span> yetarli emas?</h2></>}
    options={['Xatolar ko\'pincha edge holatlarda (0, manfiy) yashiringan', 'Happy path testi sekin ishlaydi', 'Jest happy path\'ni qo\'llab-quvvatlamaydi', 'Edge case yozish shart emas']} correctIdx={0}
    explainCorrect="To'g'ri! Oddiy kirish ko'pincha ishlaydi — xatolar chegarada (0, manfiy, noto'g'ri tur) yashiringan. Faqat edge test ularni tutadi."
    explainWrong={{
      1: "Tezlik masala emas — gap qamrovda: happy path edge xatolarni ko'rmaydi.",
      2: "Jest happy path'ni ham, edge'ni ham qo'llaydi. Gap — ikkalasini sinashda.",
      3: "Aksincha — edge case eng muhim, chunki xatolar aynan o'sha yerda.",
      default: "Xatolar edge holatlarda yashiringan — shuning uchun ularni ham sinaymiz."
    }} />
);

// ===== SCREEN 15 — YIG'INDI: to'liq spec =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Yig'indi · to'liq spec" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'To\'liq specni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasi birga — <span className="italic" style={{ color: T.accent }}>happy + edge</span> to'liq test fayli</h2></div>
        <Mentor>Mana puxta test fayli: happy path va edge case'lar birga. Har holat — alohida it. Ko'rib chiqing, har qatorni endi tushunasiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="order.spec.ts" minH={210}>
              <At>describe</At>{'('}<St>'orderTotal'</St>{', () => {'}{'\n'}
              {'  '}<At>it</At>{'('}<St>'2 kitob narxini hisoblaydi'</St>{', () => {'}{'\n'}
              {'    '}<At>expect</At>{'(orderTotal(10000, 2)).'}<At>toBe</At>{'(20000);'}{'\n'}
              {'  });'}{'\n'}
              {'  '}<At>it</At>{'('}<St>'0 ta buyurtmada xato beradi'</St>{', () => {'}{'\n'}
              {'    '}<At>expect</At>{'(() => orderTotal(10000, 0)).'}<At>toThrow</At>{'();'}{'\n'}
              {'  });'}{'\n'}
              {'  '}<At>it</At>{'('}<St>'manfiy sonda xato beradi'</St>{', () => {'}{'\n'}
              {'    '}<At>expect</At>{'(() => orderTotal(10000, -5)).'}<At>toThrow</At>{'();'}{'\n'}
              {'  });'}{'\n'}
              {'});'}
            </CodeFile>
          </Col>
          <Col>
            <JestRun lines={[{ ok: true, name: '2 kitob narxini hisoblaydi' }, { ok: true, name: '0 ta buyurtmada xato beradi' }, { ok: true, name: 'manfiy sonda xato beradi' }]} />
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => { setDone(true); setSc(n => n + 1); }}>{done ? '✓ Tushundim' : 'Tushundim ✓'}</button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 test ham yashil — happy va edge birga. Mana puxta sinalgan funksiya.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — AI qamrovini tekshirish =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const MISSING = [
    { id: 'zero', t: '0 ta buyurtma → toThrow' },
    { id: 'neg', t: 'Manfiy son → toThrow' },
    { id: 'invalid', t: 'Noto\'g\'ri tur ("ikki") → toThrow' }
  ];
  const [added, setAdded] = useState(storedAnswer ? new Set(MISSING.map(m => m.id)) : new Set());
  const [sc, setSc] = useState(0);
  const done = added.size >= MISSING.length;
  const add = (id) => { setAdded(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="AI bilan · qamrov" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Qamrovni to'ldiring (${added.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI test yozdi — lekin <span className="italic" style={{ color: T.accent }}>hamma holatni</span> qamrab oldimi?</h2></div>
        <Mentor>AI tez yozadi, ammo ko'pincha faqat <b style={{ color: T.ink }}>happy path</b>ni yozadi. Tekshiruvchi sifatida siz <b style={{ color: T.ink }}>qaysi holatlar qolib ketganini</b> topasiz va qo'shtirasiz. Yetishmayotgan testlarni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <AgentCard>orderTotal funksiyasiga test yoz.</AgentCard>
            <CodeFile name="order.spec.ts (AI)" minH={120}>
              <At>describe</At>{'('}<St>'orderTotal'</St>{', () => {'}{'\n'}
              {'  '}<At>it</At>{'('}<St>'narxni hisoblaydi'</St>{', () => {'}{'\n'}
              {'    '}<At>expect</At>{'(orderTotal(10000, 2)).'}<At>toBe</At>{'(20000);'}{'\n'}
              {'  });'}{'\n'}
              {[...added].map((id) => { const m = MISSING.find(x => x.id === id); return <React.Fragment key={id}><span className="el-in" style={{ color: T.success }}>{'  '}<At>it</At>{'('}<St>'{m.t.split(' →')[0]}'</St>{', ...) ✓ qo\'shildi'}</span>{'\n'}</React.Fragment>; })}
              {'});'}
            </CodeFile>
          </Col>
          <Col>
            <p className="flow-label">qolib ketgan holatlar — bosib qo'shing</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {MISSING.map(m => {
                const on = added.has(m.id);
                return <button key={m.id} className="vcard" disabled={on} onClick={() => add(m.id)} style={{ boxShadow: on ? `inset 0 0 0 1.5px ${T.success}` : undefined, opacity: on ? 0.8 : 1 }}><span className="vseen" style={{ marginLeft: 0, marginRight: 4, color: on ? T.success : T.ink3, minWidth: 16 }}>{on ? '✓' : '+'}</span><span className="vlbl mono" style={{ fontSize: 12 }}>{m.t}</span></button>;
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Endi qamrov to'liq! AI happy path yozdi, siz <b>edge case'larni</b> qo'shdingiz. Tekshiruvchining eng muhim ishi — kamchilikni ko'rish.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — QOIDA: test checklist =====
const Screen17 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida · checklist" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Oxirgi qadam →" onClick={onNext} /></>}>
    <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
      <div className="head"><h2 className="title h-title fade-up">Har funksiyani sinaganda — <span className="italic" style={{ color: T.accent }}>nimani tekshirasiz</span>?</h2></div>
      <Mentor>Mana universal ro'yxat. Yangi funksiya yozsangiz (yoki AI yozib bersa), shu 4 holatni eslang:</Mentor>
      <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { n: '1', t: 'Happy path', d: 'Oddiy, kutilgan kirish — to\'g\'ri natija (toBe).' },
          { n: '2', t: 'Chegara (boundary)', d: '0, eng kichik/katta — chegaraning ikki tomoni.' },
          { n: '3', t: 'Noto\'g\'ri ma\'lumot', d: 'Matn, null, bo\'sh — funksiya rad etadimi?' },
          { n: '4', t: 'Exception', d: 'Noto\'g\'ri kirishda xato tashlaydimi (toThrow)?' }
        ].map((s, i) => (
          <div key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s`, alignItems: 'flex-start' }}>
            <span className="step-num">{s.n}</span>
            <span className="step-body" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}><span className="step-text">{s.t}</span><span className="body" style={{ color: T.ink2, fontSize: 13 }}>{s.d}</span></span>
          </div>
        ))}
      </div>
      <div className="frame-success fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}>Bu ro'yxat — sizning test playbook'ingiz. AI yozsa ham, shu 4 holat qamralganini <b>siz tekshirasiz</b>.</p></div>
    </div>
  </Stage>
);

// ===== SCREEN 18 — YAKUNIY: toThrow testini qo'lda yozish =====
const Screen18 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.toLowerCase().replace(/\s+/g, '');
  const hasExpect = /expect\(/.test(v);
  const hasArrow = /=>/.test(v);
  const hasCall = /ordertotal\(/.test(v);
  const hasThrow = /tothrow\(/.test(v);
  const valid = hasExpect && hasArrow && hasCall && hasThrow;
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'manfiy buyurtmada toThrow testini yozing', correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Testni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: exception testini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yozing.</h2></div>
        <Mentor>Manfiy buyurtma (<span className="mono">-5</span>) da funksiya xato tashlashini tekshiruvchi qatorni yozing. Eslang: <span className="mono">() =&gt;</span> bilan o'rang. Namuna: <span className="mono">expect(() =&gt; orderTotal(10000, -5)).toThrow()</span></Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">order.spec.ts — tasdiq qatorini yozing</p>
            <div className="editor">
              <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">order.spec.ts</span></div>
              <div className="editor-body">
                <pre className="editor-code">{"it('manfiy sonda xato beradi', () => {"}{'\n'}</pre>
                <input className={`code-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="expect(() => orderTotal(10000, -5)).toThrow()" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                <pre className="editor-code">{'});'}</pre>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasExpect && hasArrow ? 1 : 0.4 }}>{hasExpect && hasArrow ? '✓' : '1'} expect(() =&gt;</span>
              <span className="tagpill" style={{ opacity: hasCall ? 1 : 0.4 }}>{hasCall ? '✓' : '2'} orderTotal(...)</span>
              <span className="tagpill" style={{ opacity: hasThrow ? 1 : 0.4 }}>{hasThrow ? '✓' : '3'} .toThrow()</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {passed
              ? <JestRun lines={[{ ok: true, name: 'manfiy sonda xato beradi' }]} />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>To'liq yozing: expect(() =&gt; + orderTotal(10000, -5) + .toThrow()</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Endi exception'larni ham sinay olasiz. Funksiyangiz puxta himoyalangan.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 19 — YAKUN =====
const Screen19 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Happy path — oddiy kirish; edge case — chegara (0, manfiy, juda katta)",
    "Noto'g'ri ma'lumot (matn, null) → NaN/0 — jim buzilish, xavfli",
    "Guard: if (...) throw new Error(...) — noto'g'rini rad etadi",
    "expect(() => fn()).toThrow() — exceptionni sinaydi",
    "Har funksiya = happy + chegara + noto'g'ri + exception"
  ];
  const HOMEWORK = [
    { b: 'Edge testlar', t: "— o'z funksiyangizga 0, manfiy va noto'g'ri tur testlarini yozing" },
    { b: 'toThrow', t: "— () => bilan o'rashni unutmang" },
    { b: 'AI qamrovi', t: "— AI'dan test so'rang, qaysi edge case qolib ketganini toping" }
  ];
  const GLOSSARY = [
    { b: 'happy path', t: '— oddiy, kutilgan kirish' },
    { b: 'edge case', t: '— chegaradagi qiymat (0, manfiy...)' },
    { b: 'boundary', t: '— chegara chizig\'i (1 vs 0)' },
    { b: 'NaN', t: '— "Not a Number", jim buzilish' },
    { b: 'throw', t: '— xato tashlash (funksiyani to\'xtatadi)' },
    { b: 'toThrow', t: '— xato tashlaganini tekshiradi' },
    { b: '() =>', t: '— funksiyani o\'rab beradi (toThrow uchun)' },
    { b: 'error path', t: '— noto\'g\'ri kirish yo\'li (throw / 400)' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Modulni yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Edge case va exception'larni o'rgandingiz</span><h2 className="title h-title fade-up d1">Endi kodingiz <span className="italic" style={{ color: T.accent }}>g'alati kirishlardan</span> ham himoyalangan.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Happy path, chegara holatlar, noto'g'ri ma'lumot va toThrow — funksiyani har tomonlama sinay olasiz." : "Yaxshi harakat! toThrow va edge case'larni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🎉 Modul 06 tugadi! Endi kodingizni o'zingiz ham, kompyuter ham tekshiradi — happy path va edge case bilan.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function EdgeCasesTestLesson({ lang: langProp, onFinished }) {
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
