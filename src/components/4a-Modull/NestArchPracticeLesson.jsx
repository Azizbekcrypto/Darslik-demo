import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// NEST ARXITEKTURA MODULI · PRAKTIKA — "KitobShop" MINI-LOYIHA — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad (YOU-DO): o'quvchi AI agentni boshqarib, 3 bog'langan resursli real backend quradi: Category, Book, Order.
// Boshqaruv sikli: ME'MOR (rejala) → REJISSYOR (agentga aniq buyruq) → NAZORATCHI (natijani tekshir).
// Yangi tushunchalar: AUTH (@UseGuards + @Roles — public vs admin), BOG'LANISH (@ManyToOne), maxsus endpoint (GET /book/featured), mustaqil DEBUG.
// Arxitektura: github.com/Azizbekcrypto/IntroNestArxitechture bilan AYNAN mos (BaseService meros, successRes, AuthGuard+RolesGuard, @Roles('public')/UserRole, app.module imports).
// Davomi: Dars 1 (tirik ko'rish) → Dars 2 (Car resursini qo'lda) → SHU PRAKTIKA (mustaqil 3 resurs + auth + bog'lanish).
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy, "sehr"/"g'isht" yo'q, global savol sarlavhalar. AUDIOSIZ.
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

const LESSON_META = { lessonId: 'nest-arch-practice-v16', lessonTitle: { uz: 'Praktika — KitobShop backend', ru: 'Практика — бэкенд KitobShop' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's5',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's16', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's17', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's18', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's19', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's20', type: 'summary',     template: 'custom',   scored: false, scope: null }
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
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .swg-row, .tree-row, .pick-row');
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

// ===== MOCK SWAGGER (KitobShop, lock = faqat admin) =====
const M_COLOR = { GET: T.blue, POST: T.success, PATCH: T.amber, DELETE: T.danger };
const SHOP_EPS = [
  { m: 'POST', path: '/category', lock: true, sum: 'Kategoriya qo\'shish', resp: '{ "statusCode": 201, "data": { "id": "ct1...", "name": "Detektiv" } }' },
  { m: 'GET', path: '/category', lock: false, sum: 'Kategoriyalar', resp: '{ "statusCode": 200, "data": [ { "name": "Detektiv" }, { "name": "Ilmiy" } ] }' },
  { m: 'POST', path: '/book', lock: true, sum: 'Kitob qo\'shish', resp: '{ "statusCode": 201, "data": { "title": "Sherlok Holms", "price": 45000 } }' },
  { m: 'GET', path: '/book', lock: false, sum: 'Barcha kitoblar', resp: '{ "statusCode": 200, "data": [ { "title": "Sherlok Holms", "author": "Doyl", "price": 45000 } ] }' },
  { m: 'GET', path: '/book/featured', lock: false, sum: '⭐ Top kitoblar', resp: '{ "statusCode": 200, "data": [ { "title": "Sherlok Holms", "is_featured": true } ] }' },
  { m: 'POST', path: '/order', lock: false, sum: 'Buyurtma berish', resp: '{ "statusCode": 201, "data": { "bookId": "bk1...", "quantity": 2 } }' },
  { m: 'GET', path: '/order', lock: true, sum: 'Buyurtmalar', resp: '{ "statusCode": 200, "data": [ { "customer_name": "Ali", "quantity": 2 } ] }' }
];
const ShopSwagger = ({ eps = SHOP_EPS, openId, onToggle, triedIds, onTry }) => (
  <div className="swg">
    <div className="swg-top"><span className="swg-dot" /> KitobShop API <span className="swg-ver">/api/v1</span></div>
    {eps.map(e => {
      const id = e.m + e.path;
      const open = openId === id;
      const tried = triedIds.has(id);
      return (
        <div key={id} className="swg-row">
          <button className="swg-head" onClick={() => onToggle(id)}>
            <span className="swg-m" style={{ background: M_COLOR[e.m] }}>{e.m}</span>
            <span className="swg-path">{e.path}</span>
            <span className="swg-sum">{e.sum}</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span title={e.lock ? 'faqat admin' : 'ochiq'} style={{ fontSize: 12 }}>{e.lock ? '🔒' : '🌐'}</span>
              <span className="swg-chev">{open ? '▾' : '▸'}</span>
            </span>
          </button>
          {open && (
            <div className="swg-detail el-in">
              {!tried
                ? <button className="btn-soft" onClick={() => onTry(id)} style={{ alignSelf: 'flex-start' }}>▶ Try it out</button>
                : <><div className="swg-code-lbl">Javob · <span style={{ color: T.success }}>{e.m === 'POST' ? '201' : '200'}</span></div><pre className="json">{e.resp}</pre></>}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ===== PICK LINES (Dars 2 dan) =====
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
            ? <span className="line-empty">{'  // qatorlarni o\'ng tomondan tanlang →'}</span>
            : pickedCorrect.map((c, i) => <React.Fragment key={c.id}>{i > 0 ? '\n' : ''}{'  '}{c.node}</React.Fragment>)}
          {'\n'}{scaffoldBottom}
        </CodeFile>
        {agent && <AgentCard>{agent}</AgentCard>}
      </Col>
      <Col>
        <p className="flow-label">{instruction || 'Shu faylga tegishli qatorlarni tanlang'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {candidates.map(c => (
            <button key={c.id} className={`pick-row ${picked.has(c.id) ? 'picked' : ''} ${shakeId === c.id ? 'shake' : ''}`} disabled={picked.has(c.id)} onClick={() => tap(c)}>
              <span style={{ flex: 1 }}>{c.label}</span>
              <span className="pick-plus">{picked.has(c.id) ? '✓' : '+'}</span>
            </button>
          ))}
        </div>
        {why && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{why}</p></div>}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Fayl tayyor — har qator o'z joyida.</p></div>}
      </Col>
    </div>
    </Zoomable>
  );
};

// ===== AGENT FAYL GENERATSIYASI (Dars 2 s16 dan) =====
const FileGen = ({ files, running, n }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
    {files.map((file, i) => {
      const ready = i < n;
      const active = running && i === n;
      if (!ready && !active) return <div key={i} className="gen-file" style={{ opacity: 0.4 }}><span className="gen-ico">·</span><span className="mono" style={{ flex: 1 }}>{file.f}</span></div>;
      return (
        <div key={i} className={`gen-file ${ready ? 'ready' : ''} el-in`}>
          <span className="gen-ico" style={{ color: ready ? T.success : T.amber }}>{ready ? '✓' : '⏳'}</span>
          <span className="mono" style={{ flex: 1 }}>{file.f}</span>
          <span className="gen-d">{ready ? file.d : 'yozilmoqda…'}</span>
        </div>
      );
    })}
  </div>
);
function useFileGen(total, storedAnswer) {
  const [n, setN] = useState(storedAnswer ? total : 0);
  const [running, setRunning] = useState(false);
  const done = n >= total;
  useEffect(() => {
    if (!running) return;
    if (n >= total) { setRunning(false); return; }
    const t = setTimeout(() => setN(x => x + 1), 560);
    return () => clearTimeout(t);
  }, [running, n, total]);
  const run = () => { if (running || done) return; setN(0); setRunning(true); };
  return { n, running, done, run };
}

// ===== TEKSHIRUV CHECKLIST (NAZORATCHI) =====
const Checklist = ({ items, doneInit, onComplete }) => {
  const [seen, setSeen] = useState(() => doneInit ? new Set(items.map((_, i) => i)) : new Set());
  const done = seen.size >= items.length;
  const fired = useRef(false);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onComplete && onComplete(); } }, [done]);
  const tap = (i) => setSeen(prev => { const s = new Set(prev); s.add(i); return s; });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map((it, i) => {
        const on = seen.has(i);
        return (
          <button key={i} className="vcard" onClick={() => tap(i)} style={{ boxShadow: on ? `inset 0 0 0 1.5px ${T.success}, 0 5px 14px -6px rgba(${T.shadowBase},0.16)` : undefined, alignItems: 'flex-start' }}>
            <span className="vseen" style={{ marginLeft: 0, marginRight: 2, color: on ? T.success : T.ink3, minWidth: 18 }}>{on ? '✓' : '☐'}</span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
              <span className="vlbl" style={{ fontFamily: "'Manrope'", fontSize: 13 }}>{it.t}</span>
              {on && <span className="role-r el-in">{it.ok}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ===== SO'ROV YO'LI (Integration) =====
const SHOP_FLOW = [
  { k: 'Admin', icon: '🔒', r: 'POST /book', d: 'Admin token bilan yangi kitob qo\'shadi (guard ruxsat beradi).' },
  { k: 'Mijoz', icon: '🌐', r: 'GET /book/featured', d: 'Mijoz top kitoblarni ko\'radi — token kerakmas (public).' },
  { k: 'Buyurtma', icon: '🛒', r: 'POST /order', d: 'Mijoz bookId bilan buyurtma beradi (Order → Book bog\'lanishi).' },
  { k: 'Tekshiruv', icon: '📋', r: 'GET /order', d: 'Admin kelgan buyurtmalarni ko\'radi (faqat admin).' },
  { k: 'Tayyor', icon: '✅', r: 'KitobShop ishlaydi', d: 'Admin + mijoz oqimi to\'liq — real do\'kon backendi!' }
];

// ===== SCREEN 0 — HOOK: tayyor KitobShop =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [openId, setOpenId] = useState(null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['GET/book/featured']) : new Set());
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const triedOne = tried.size >= 1;
  const OPTS = [
    { id: 'a', label: "Hammasini bitta ulkan faylga yozamiz" },
    { id: 'b', label: "3 resurs — har biri 5 qadam, agent bilan tez quramiz" },
    { id: 'c', label: "Bunday do'kon backendini faqat katta jamoa quradi" }
  ];
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !triedOne) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Praktika · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Boshlaymiz" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Mana siz quradigan narsa — haqiqiy <span className="italic" style={{ color: T.accent }}>onlayn kitob do'koni</span>.</h1>
        <Mentor>Bu — <b style={{ color: T.ink }}>KitobShop</b>: admin kitob qo'shadi, mijozlar ko'radi, "Top kitoblar"ni ko'zdan kechiradi va buyurtma beradi. 🔒 — faqat admin, 🌐 — hamma uchun. Bittasini ochib <b style={{ color: T.ink }}>"Try it out"</b> bilan sinab ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <ShopSwagger openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Bunday backendni qanday quramiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !triedOne} style={{ opacity: !triedOne ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!triedOne && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval bitta endpointni sinang ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Har resurs — o'sha 5 qadam sikli. Bugun <b>3 resursni</b> (Kategoriya, Kitob, Buyurtma) <b>AI yordamchi bilan</b> qurasiz: siz <b>rejalashtirasiz</b>, AI'ni <b>yo'naltirasiz</b> va natijani <b>tekshirasiz</b>.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — RULE: bosh dasturchi 3 ishi =====
const Screen1 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const HATS = [
    { id: 'plan', icon: '🧠', t: 'Rejalashtiruvchi', d: 'Rejalashtiradi: qaysi resurs, qaysi ustun, qanday bog\'lanish.' },
    { id: 'guide', icon: '🤖', t: 'Yo\'naltiruvchi', d: 'AI yordamchiga aniq topshiriq beradi (playbook prompt).' },
    { id: 'check', icon: '🔍', t: 'Tekshiruvchi', d: 'Natijani tekshiradi: to\'g\'ri qatlam? ulangan? himoyalangan?' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(HATS.map(h => h.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= HATS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = HATS.find(h => h.id === active);
  return (
    <Stage eyebrow="Qoida · 3 ish" screen={screen} scrollSignal={sc} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Boshlaymiz →' : `3 ishni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bugun ko'p kod yozmaysiz — siz <span className="italic" style={{ color: T.accent }}>bosh dasturchisiz</span>.</h2></div>
        <Mentor>AI yordamchingiz kodni soniyalarda yozadi — siz uni <b style={{ color: T.ink }}>yo'naltirasiz</b> va natijani <b style={{ color: T.ink }}>tekshirasiz</b>. Bosh dasturchi shu uchta ishni qiladi. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HATS.map(h => (
                <button key={h.id} className="vcard" onClick={() => tap(h.id)} style={{ boxShadow: active === h.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{h.icon}</span>
                  <span className="vlbl mono">{h.t}</span>
                  <span className="vseen" style={{ color: seen.has(h.id) ? T.success : T.ink3 }}>{seen.has(h.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span style={{ fontSize: 22, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.t}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Rolni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sikl: <b>Rejalashtir → Yo'naltir → Tekshir</b>. Har resurs uchun shu uch qadam. Boshlaymiz — avval reja.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — ME'MOR: data model =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const NODES = [
    { id: 'cat', t: 'Category', cols: 'name', rel: null, d: 'Kitob turlari: Detektiv, Ilmiy, Bolalar...' },
    { id: 'book', t: 'Book', cols: 'title · author · price · is_featured', rel: '→ Category (@ManyToOne)', d: 'Har kitob bitta kategoriyaga tegishli.' },
    { id: 'order', t: 'Order', cols: 'customer_name · quantity', rel: '→ Book (@ManyToOne)', d: 'Har buyurtma bitta kitobga ishora qiladi.' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(NODES.map(n => n.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= NODES.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = NODES.find(n => n.id === active);
  return (
    <Stage eyebrow="Reja · ma'lumotlar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 jadvalni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kitob do'koni qanday <span className="italic" style={{ color: T.accent }}>ma'lumotlarni</span> saqlaydi — va ular bir-biriga qanday <span className="italic" style={{ color: T.accent }}>ulanadi</span>?</h2></div>
        <Mentor>AI'ga buyruq berishdan oldin <b style={{ color: T.ink }}>reja</b> tuzamiz: do'konda 3 turdagi ma'lumot bor — kategoriyalar, kitoblar va buyurtmalar. Ular bir-biriga bog'lanadi. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {NODES.map((nd) => (
                <React.Fragment key={nd.id}>
                  <button className="vcard" onClick={() => tap(nd.id)} style={{ boxShadow: active === nd.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined, flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}><span className="vlbl mono">📦 {nd.t}</span><span className="vseen" style={{ color: seen.has(nd.id) ? T.success : T.ink3 }}>{seen.has(nd.id) ? '✓' : ''}</span></span>
                    <span className="role-r" style={{ fontFamily: "'JetBrains Mono'" }}>{nd.cols}</span>
                  </button>
                  {nd.rel && <div className="mono" style={{ fontSize: 10.5, color: T.accent, fontWeight: 700, margin: '4px 0 4px 14px' }}>↑ {nd.rel}</div>}
                </React.Fragment>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent }}>📦 {cur.t}</span></p><p className="body" style={{ margin: '0 0 8px', color: T.ink }}>{cur.d}</p><div className="ent-row siz">{cur.cols} <span>← ustunlar</span></div>{cur.rel && <div className="ent-row free el-in">{cur.rel} <span>← bog'lanish</span></div>}</div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Jadvalni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Reja tayyor: <b>Category ← Book ← Order</b>. Endi har birini agent bilan quramiz — Category'dan boshlaymiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — REJISSYOR: prompt sifati (Category) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FILES = [{ f: 'category.entity.ts', d: 'name' }, { f: 'create/update-category.dto.ts', d: 'qoidalar' }, { f: 'category.service.ts', d: 'BaseService' }, { f: 'category.controller.ts', d: 'CRUD' }, { f: 'category.module.ts → AppModule', d: 'ulash' }];
  const gen = useFileGen(FILES.length, storedAnswer && storedAnswer.picked === 'good');
  const [choice, setChoice] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const done = choice === 'good' && gen.done;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: 'good' }); }, [done]);
  const pickGood = () => { if (choice === 'good') return; setChoice('good'); setSc(n => n + 1); gen.run(); };
  const pickVague = () => { setChoice('vague'); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Yo'naltirish · prompt" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Aniq promptni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agentga qanday buyruq bersangiz — shunday <span className="italic" style={{ color: T.accent }}>natija</span> olasiz.</h2></div>
        <Mentor>Birinchi resurs — <b style={{ color: T.ink }}>Category</b>. Quyidagi ikki promptdan qaysi biri agentga aniqroq? To'g'risini tanlasangiz, agent 5 faylni yozib beradi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button className={`vcard ${choice === 'vague' ? 'shake' : ''}`} onClick={pickVague} disabled={done} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, boxShadow: choice === 'vague' ? `inset 0 0 0 1.5px ${T.danger}` : undefined }}>
              <span className="vlbl" style={{ fontFamily: "'Manrope'" }}>❌ Noaniq</span>
              <span className="agent-msg">"kategoriya qil"</span>
            </button>
            <button className="vcard" onClick={pickGood} disabled={done} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, boxShadow: choice === 'good' ? `inset 0 0 0 1.5px ${T.success}` : undefined }}>
              <span className="vlbl" style={{ fontFamily: "'Manrope'" }}>✅ Aniq (playbook)</span>
              <span className="agent-msg">"Category resursini qo'sh: Entity (name) → DTO → BaseService'dan service → CRUD controller → module va AppModule'ga ula."</span>
            </button>
            {choice === 'vague' && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Noaniq prompt — agent qaysi ustun, qaysi qatlam kerakligini bilmaydi, chalkash kod chiqaradi. Aniq buyruq bering.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Agent yaratayotgan fayllar</p>
            {choice === 'good'
              ? <FileGen files={FILES} running={gen.running} n={gen.n} />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Aniq promptni tanlang →</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Category tayyor! Aniq buyruq = aniq natija. Endi tekshiruvchi bo'lib ko'rib chiqamiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — NAZORATCHI: tekshiruv checklist (Category) =====
const Screen4 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const ITEMS = [
    { t: '5 fayl yaratildimi? (entity, dto, service, controller, module)', ok: '✓ Hammasi bor.' },
    { t: 'category.module.ts AppModule imports\'iga ulanganmi?', ok: '✓ Ulangan — usiz /category 404 bo\'lardi.' },
    { t: 'Service BaseService\'dan meros olganmi? (CRUD tekin)', ok: '✓ Ha — create/findAll/... tekin keldi.' },
    { t: 'Swagger\'da /category endpointlari ko\'rinyaptimi?', ok: '✓ Ko\'rinyapti — Category tirik!' }
  ];
  return (
    <Stage eyebrow="Tekshiruv · checklist" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Har bandni tekshiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yozib berdi — endi uni qanday <span className="italic" style={{ color: T.accent }}>tekshiramiz</span>?</h2></div>
        <Mentor>Natijani tekshirish — bosh dasturchining doimiy odati (AI yomon bo'lgani uchun emas, shunchaki professional ish shunaqa). Mana tekshiruv ro'yxati — har bandni bosib tasdiqlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Checklist items={ITEMS} doneInit={!!storedAnswer} onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }} />
          </Col>
          <Col>
            <AgentCard title="🔍 Tekshiruv qoidasi">Har resurs uchun shu 4 bandni ko'rib chiqing. AI tez yozadi — siz natija to'g'riligiga ishonch hosil qilasiz.</AgentCard>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Category ✓ tasdiqlandi. 1-resurs tayyor! Endi muhim savol: <b>har kim kitob qo'sha olishi kerakmi?</b></p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5 — TEST 1 (tekshiruv) =====
const Screen5 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Bosh dasturchi sifatida AI kod yozgandan keyin eng muhim vazifangiz nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI yozgach, sizning eng muhim <span className="italic" style={{ color: T.accent }}>vazifangiz</span>?</h2></>}
    options={['Natijani tekshirish (to\'g\'ri qatlam? ulangan?)', 'Hech narsa — natijani ko\'rmasdan o\'tib ketish', 'Kodni har safar o\'chirib qayta yozish', 'Boshqa AI chaqirish']} correctIdx={0}
    explainCorrect="To'g'ri! AI tez yozadi, siz esa natijani tekshirasiz: to'g'ri qatlam? ulangan? himoyalangan? Swagger'da ko'rinyaptimi? Bu — bosh dasturchining asosiy ishi."
    explainWrong={{
      1: "Ko'rmasdan o'tib ketish xavfli — mayda narsa o'tkazib yuborilishi mumkin. Tekshirish shart.",
      2: "Har safar qayta yozish shart emas — avval tekshiring, kerak bo'lsa aniq tuzating.",
      3: "Boshqa AI ham xato qilishi mumkin. Asosiysi — siz natijani tekshirasiz.",
      default: "Eng muhimi — natijani tekshirish."
    }} />
);

// ===== SCREEN 6 — AUTH tushuncha =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [guard, setGuard] = useState(!!storedAnswer);
  const [tried, setTried] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = guard;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tryHack = () => { setTried(true); setSc(n => n + 1); };
  const addGuard = () => { setGuard(true); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Yangi · Auth" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Qo\'riqchini qo\'ying'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har kim kitob qo'sha olsa — do'kon <span className="italic" style={{ color: T.accent }}>nima bo'ladi</span>?</h2></div>
        <Mentor>Kitob qo'shish — faqat <b style={{ color: T.ink }}>admin</b> ishi. Hozir himoya yo'q: istalgan odam <span className="mono">POST /book</span> qila oladi. Avval "hujum"ni sinab ko'ring, keyin qo'riqchi (<span className="mono">guard</span>) qo'ying.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="book.controller.ts" minH={110}>
              {guard ? <><At>@UseGuards</At>{'(AuthGuard, RolesGuard)'}{'\n'}</> : <Cm>{'// himoya yo\'q!'}{'\n'}</Cm>}
              <At>@Controller</At>{"('book') {"}{'\n'}
              {guard ? <span className="el-in" style={{ color: CODE.attr }}>{'  @Roles'}<span style={{ color: CODE.text }}>{'(UserRole.ADMIN)'}</span></span> : <span style={{ color: CODE.comment }}>{'  // hamma kira oladi'}</span>}{'\n'}
              {'  '}<At>@Post</At>{'()  create(dto) { ... }'}{'\n'}
              {'}'}
            </CodeFile>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={tryHack} disabled={guard}>🕵️ Begona odam: POST /book</button>
              {!guard && <button className="btn" onClick={addGuard}>🛡️ Guard + @Roles qo'shish</button>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {!tried && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>So'rovni sinang ←</p></div>}
            {tried && !guard && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 201 — har kim kitob qo'shdi!</p><p className="body" style={{ margin: 0, color: T.ink }}>Himoyasiz — begona odam ham do'konga kitob qo'shyapti. Bu xavfli.</p></div>}
            {guard && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ Endi faqat admin</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">AuthGuard</span> tokenni tekshiradi, <span className="mono">@Roles(ADMIN)</span> rolni. Begona odam — 401/403. Bu — Dars 1'dagi "qo'riqchi"!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — AUTH apply: qaysi eshik ochiq/admin =====
const AUTH_ROWS = [
  { id: 'getbook', label: 'GET /book', correct: 'public', hint: 'Kitoblarni hamma ko\'rishi kerak — ochiq (public).' },
  { id: 'featured', label: 'GET /book/featured', correct: 'public', hint: 'Top kitoblar — vitrina, hamma ko\'radi (public).' },
  { id: 'order', label: 'POST /order', correct: 'public', hint: 'Mijoz buyurtma beradi — ro\'yxatdan o\'tmasdan ham (public).' },
  { id: 'postbook', label: 'POST /book', correct: 'admin', hint: 'Kitob qo\'shish — faqat admin.' },
  { id: 'delbook', label: 'DELETE /book/:id', correct: 'admin', hint: 'O\'chirish — faqat admin.' },
  { id: 'getorder', label: 'GET /order', correct: 'admin', hint: 'Buyurtmalarni ko\'rish — faqat admin.' }
];
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [chosen, setChosen] = useState(storedAnswer ? Object.fromEntries(AUTH_ROWS.map(r => [r.id, r.correct])) : {});
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const [sc, setSc] = useState(0);
  const done = AUTH_ROWS.every(r => chosen[r.id] === r.correct);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const set = (row, val) => {
    if (chosen[row.id] === row.correct) return;
    if (val === row.correct) { setChosen(c => ({ ...c, [row.id]: val })); setHint(null); setSc(n => n + 1); }
    else { setShakeId(row.id); setHint({ id: row.id, txt: row.hint }); setTimeout(() => setShakeId(x => (x === row.id ? null : x)), 450); }
  };
  return (
    <Stage eyebrow="Auth · biriktirish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Har eshikni belgilang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi eshik <span className="italic" style={{ color: T.accent }}>ochiq</span>, qaysi biri faqat <span className="italic" style={{ color: T.accent }}>admin</span> uchun?</h2></div>
        <Mentor>Har endpoint uchun <span className="mono">@Roles</span> ni to'g'ri tanlang: 🌐 <b style={{ color: T.ink }}>public</b> (hamma) yoki 🔒 <b style={{ color: T.ink }}>admin</b>. O'ylang: bu amalni begona odam qila olsa, xavfli emasmi?</Mentor>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {AUTH_ROWS.map(r => {
            const val = chosen[r.id];
            const locked = val === r.correct;
            return (
              <div key={r.id} className={`auth-row ${shakeId === r.id ? 'shake' : ''}`}>
                <span className="mono" style={{ flex: 1, fontSize: 13, color: T.ink }}>{r.label}</span>
                <button className={`auth-btn ${val === 'public' ? (r.correct === 'public' ? 'ok' : 'bad') : ''}`} disabled={locked} onClick={() => set(r, 'public')}>🌐 public</button>
                <button className={`auth-btn ${val === 'admin' ? (r.correct === 'admin' ? 'ok' : 'bad') : ''}`} disabled={locked} onClick={() => set(r, 'admin')}>🔒 admin</button>
              </div>
            );
          })}
        </div>
        {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint.txt}</p></div>}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Ko'rish/buyurtma — ochiq, qo'shish/o'chirish/buyurtmalar ro'yxati — admin. <span className="mono">@Roles('public')</span> tokenni o'tkazib yuboradi, qolgani himoyalangan.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 (auth) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Oddiy mijoz (admin emas) POST /book qilsa nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mijoz <span className="mono">POST /book</span> qilsa <span className="italic" style={{ color: T.accent }}>nima</span> bo'ladi?</h2></>}
    options={['403/401 — guard rad etadi (faqat admin)', '201 — kitob qo\'shiladi', 'Kitob, lekin yashirin', 'Server o\'chadi']} correctIdx={0}
    explainCorrect="To'g'ri! @Roles(ADMIN) tufayli RolesGuard mijozni rad etadi — 403. Token bo'lmasa AuthGuard 401 beradi. Faqat admin kitob qo'sha oladi."
    explainWrong={{
      1: "Qo'shilmaydi — endpoint admin uchun himoyalangan. Mijoz 403 oladi.",
      2: "Yashirin qo'shilmaydi — guard butunlay to'xtatadi (403).",
      3: "Server o'chmaydi — guard toza ravishda 403/401 qaytaradi.",
      default: "Mijoz admin endpointiga = 403 (guard rad etadi)."
    }} />
);

// ===== SCREEN 9 — BOG'LANISH tushuncha (Book → Category) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Yangi · Bog'lanish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bog\'lanishni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har kitob qaysi kategoriyaga tegishli — qanday <span className="italic" style={{ color: T.accent }}>bog'laymiz</span>?</h2></div>
        <Mentor>Kitob bitta kategoriyaga tegishli (ko'p kitob — bitta kategoriya). Buni <span className="mono">@ManyToOne</span> bog'lanishi bilan ifodalaymiz. Entity ichida bitta qator — va kitob kategoriyaga ulanadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="book.entity.ts">
              <At>@Entity</At>{"('books')"}{'\n'}
              <Jx>export class</Jx>{' BookEntity '}<Jx>extends</Jx>{' BaseEntity {'}{'\n'}
              {'  '}<At>@Column</At>{'()  title: '}<St>string</St>{';'}{'\n'}
              {show && <><span className="el-in" style={{ color: CODE.attr }}>{'  @ManyToOne'}<span style={{ color: CODE.text }}>{'(() => CategoryEntity)'}</span></span>{'\n'}<span className="el-in" style={{ color: CODE.text }}>{'  category: CategoryEntity;'}</span>{'\n'}</>}
              {'}'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : '🔗 Bog\'lanishni qo\'shish'}</button>
          </Col>
          <Col>
            <p className="flow-label">bog'lanish — Book → Category</p>
            <div className="frame" style={{ padding: 14 }}>
              <div className="ent-row siz">📦 Book (title, price...) <span>ko'p</span></div>
              <div style={{ textAlign: 'center', color: show ? T.accent : T.ink3, fontWeight: 700, fontSize: 13, margin: '2px 0' }}>{show ? '↓ @ManyToOne' : '↓ ?'}</div>
              <div className="ent-row free">📦 Category (name) <span>bitta</span></div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi har kitobning <span className="mono">category</span> si bor. <span className="mono">findAll({'{ relations: { category: true } }'})</span> bilan kategoriya nomini ham qaytarish — BaseService'da tekin.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — Book entity yig'ish (PickLines) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'title', correct: true, label: '@Column()  title: string;', node: <><At>@Column</At>{'()  title: '}<St>string</St>{';'}</> },
    { id: 'author', correct: true, label: '@Column()  author: string;', node: <><At>@Column</At>{'()  author: '}<St>string</St>{';'}</> },
    { id: 'price', correct: true, label: '@Column()  price: number;', node: <><At>@Column</At>{'()  price: '}<St>number</St>{';'}</> },
    { id: 'feat', correct: true, label: '@Column({ default: false })  is_featured: boolean;', node: <><At>@Column</At>{'({ default: '}<Jx>false</Jx>{' })  is_featured: '}<St>boolean</St>{';'}</> },
    { id: 'rel', correct: true, label: '@ManyToOne(() => CategoryEntity)  category: CategoryEntity;', node: <><At>@ManyToOne</At>{'(() => CategoryEntity)  category;'}</> },
    { id: 'isstring', correct: false, label: '@IsString()  title: string;', why: "Bu DTO qatori (validatsiya). Entity'da @Column bo'ladi, @IsString emas." },
    { id: 'roles', correct: false, label: '@Roles(UserRole.ADMIN)', why: "Bu controller qatori (himoya). Entity jadval shaklini belgilaydi, ruxsatni emas." }
  ];
  return (
    <Stage eyebrow="Book · Entity" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Faylni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kitob jadvalini yig'ing — qaysi qator <span className="italic" style={{ color: T.accent }}>Entity'ga</span> tegishli?</h2></div>
        <Mentor>Agent xato qilmasin — siz Book entity'ni tekshirib yig'asiz. Ustunlar + bog'lanish (<span className="mono">@ManyToOne</span>) Entity'da. O'ngdagi begona qatorlar boshqa qatlamdan — faqat to'g'rilarini tanlang.</Mentor>
        <PickLines
          fileName="src/core/entity/book.entity.ts"
          scaffoldTop={<><At>@Entity</At>{"('books')"}{'\n'}<Jx>export class</Jx>{' BookEntity '}<Jx>extends</Jx>{' BaseEntity {'}</>}
          scaffoldBottom={<>{'}'}</>}
          candidates={candidates}
          agent={"book.entity.ts yoz: title, author, price, is_featured (default false) ustunlari + @ManyToOne bilan Category bog'lanishi."}
          instruction="book.entity.ts ga qaysi qatorlar tegishli?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Book entity tayyor — ustunlar + Category bog'lanishi bilan. Endi "Top kitoblar" bo'limini qo'shamiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — FEATURED endpoint =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Book · Top kitoblar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Endpointni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Top kitoblar" bo'limi — yangi metod <span className="italic" style={{ color: T.accent }}>yozamizmi</span>?</h2></div>
        <Mentor>Bosh sahifada faqat <span className="mono">is_featured: true</span> kitoblar chiqsin. Yangi CRUD yozmaymiz — controller'ga bitta maxsus eshik qo'shamiz va <b style={{ color: T.ink }}>BaseService'ning findAll</b>'iga shart beramiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="book.controller.ts" minH={120}>
              <At>@Roles</At>{"('public')"}{'\n'}
              <At>@Get</At>{"('featured')"}{'\n'}
              {'featured() {'}{'\n'}
              {show
                ? <span className="el-in" style={{ color: CODE.text }}>{'  return this.bookService.findAll('}{'\n    { where: { is_featured: '}<span style={{ color: CODE.tag }}>true</span>{' } });'}</span>
                : <Cm>{'  // top kitoblarni qaytarish...'}</Cm>}{'\n'}
              {'}'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : '⭐ findAll bilan to\'ldirish'}</button>
            <AgentCard>BookController'ga public GET /book/featured endpoint qo'sh: findAll({'{ where: { is_featured: true } }'}) qaytarsin.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">GET /book/featured</p>
            {!show
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Endpointni to'ldiring ←</p></div>
              : <div className="frame fade-step"><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 12, lineHeight: 1.7 }}>[<br />&nbsp;&nbsp;{'{ title: "Sherlok Holms", is_featured: true }'},<br />&nbsp;&nbsp;{'{ title: "Hobbit", is_featured: true }'}<br />]</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Maxsus endpoint — lekin yangi CRUD kodi yo'q! <span className="mono">findAll</span> BaseService'dan, siz faqat <span className="mono">where</span> shartini berdingiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 3 (featured / bog'lanish) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Top kitoblarni (is_featured) qaytaruvchi endpointni qanday yozamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Top kitoblarni <span className="italic" style={{ color: T.accent }}>qanday</span> qaytaramiz?</h2></>}
    options={['findAll({ where: { is_featured: true } }) — BaseService bilan', 'Yangi CRUD kodini noldan yozib', 'To\'g\'ridan-to\'g\'ri bazaga SQL yozib', 'Frontend\'da filtrlab']} correctIdx={0}
    explainCorrect="To'g'ri! BaseService'ning findAll'i where shartini oladi. Yangi metod yozmaysiz — faqat shart berasiz. Bog'langan ma'lumot uchun relations ham shu yerda."
    explainWrong={{
      1: "Noldan yozish shart emas — BaseService findAll allaqachon where shartini qabul qiladi.",
      2: "Xom SQL kerakmas — TypeORM/BaseService buni hal qiladi (findAll + where).",
      3: "Frontend'da filtrlash xavfli va sekin — server faqat kerakli kitoblarni qaytarsin.",
      default: "Top kitoblar = findAll({ where: { is_featured: true } })."
    }} />
);

// ===== SCREEN 13 — Order: REJISSYOR + bog'lanish =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FILES = [{ f: 'order.entity.ts', d: 'customer_name, quantity + @ManyToOne Book' }, { f: 'create/update-order.dto.ts', d: 'bookId, quantity qoidalari' }, { f: 'order.service.ts', d: 'BaseService' }, { f: 'order.controller.ts', d: 'POST public, GET admin' }, { f: 'order.module.ts → AppModule', d: 'ulash' }];
  const gen = useFileGen(FILES.length, storedAnswer);
  const [sc, setSc] = useState(0);
  const done = gen.done;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const run = () => { gen.run(); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Order · yo'naltirish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Playbookni yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi resurs — <span className="italic" style={{ color: T.accent }}>Buyurtma</span>. Qaysi kitobga bog'lanadi?</h2></div>
        <Mentor>Order <span className="mono">@ManyToOne</span> bilan Book'ga bog'lanadi (har buyurtma — bitta kitob). Buyurtma berish — <b style={{ color: T.ink }}>public</b> (mijoz), ko'rish — admin. Playbookni agentga yuboring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="prompt-box fade-up delay-1"><span className="agent-lbl">💬 Agentga playbook</span><p className="agent-msg" style={{ marginBottom: 0 }}>"Order resursini qo'sh: Entity (customer_name, quantity + @ManyToOne Book) → DTO (bookId, quantity) → BaseService service → controller (POST public, GET admin) → module va AppModule'ga ula."</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={gen.running || done} onClick={run}>{done ? '✓ Yozildi' : (gen.running ? '⏳ Agent yozyapti…' : '▶ Playbookni yuborish')}</button>
          </Col>
          <Col>
            <p className="flow-label">Agent yaratayotgan fayllar</p>
            <FileGen files={FILES} running={gen.running} n={gen.n} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI Order'ni yozdi. Lekin... mijoz buyurtma bera olmayapti! Keyingi ekranda tekshiruvchi bo'lib sababini topamiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUG (mustaqil): agent @Roles ni adashtirgan =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [openId, setOpenId] = useState(storedAnswer ? 'POST/order' : null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['POST/order']) : new Set());
  const [sc, setSc] = useState(0);
  const done = fixed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pickBad = () => { if (found) return; setFound(true); setSc(n => n + 1); };
  const pickGood = () => { if (found || fixed) return; setSc(n => n + 1); };
  const fix = () => { setFixed(true); setSc(n => n + 1); };
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Debugging · mustaqil" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mijoz buyurtma bera olmayapti — <span className="mono" style={{ color: T.accent }}>POST /order</span> 403. <span className="italic" style={{ color: T.accent }}>Nega</span>?</h2></div>
        <Mentor>Bunday bo'lishi mumkin — ruxsat bittasi noto'g'ri qo'yilgan. Endi <b style={{ color: T.ink }}>yo'l-ko'rsatmasiz</b>, o'zingiz tekshirasiz. <span className="mono">order.controller.ts</span> ni o'qing: buyurtma berish <b style={{ color: T.ink }}>public</b> bo'lishi kerak edi. Xato qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">OrderController tayyor! (lekin mijoz 403 olyapti 🤔)</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default', opacity: 0.85 }}><span style={{ color: CODE.attr }}>@Controller</span>{"('order') {"}</div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickBad}><span style={{ color: CODE.attr }}>@Roles</span>{fixed ? "('public')" : '(UserRole.ADMIN)'}{fixed ? '' : '   // ?'}</div>
                <div className="ai-line" onClick={pickGood} title="to'g'ri"><span style={{ color: CODE.attr }}>@Post</span>{'()  create(@Body() dto) { ... }'}</div>
                <div className="ai-line" onClick={pickGood} title="to'g'ri"><span style={{ color: CODE.attr }}>@Roles</span>{'(UserRole.ADMIN)  '}<span style={{ color: CODE.attr }}>@Get</span>{'()  findAll()'}</div>
                <div className="ai-line" style={{ cursor: 'default', opacity: 0.85 }}>{'}'}</div>
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 POST'ni @Roles('public') ga o'zgartirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — buyurtma endi ochiq!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Buyurtma berish — mijoz ishi (public). Qaysi qator uni admin'ga cheklab qo'ygan? O'sha qatorni bosing.</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>POST /order'da <span className="mono">@Roles(ADMIN)</span> turibdi — shuning uchun mijoz 403 oladi. To'g'risi: <span className="mono">@Roles('public')</span>. Chap tugma bilan tuzating →</p></div>}
            {fixed && <>
              <div className="takeaway fade-step"><div className="ta-bulb">🔍</div><p className="ta-h">Mustaqil debug qildingiz!</p><p className="ta-sub">Ruxsat noto'g'ri edi — siz o'zingiz topib tuzatdingiz</p></div>
              <ShopSwagger eps={SHOP_EPS.filter(e => e.path === '/order' && e.m === 'POST')} openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
            </>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — TEST 4 (debug) =====
const Screen15 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="POST /order'ga xato bilan @Roles(ADMIN) qo'yilgan. To'g'ri tuzatish qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mijoz buyurtma berolsin desak, qatorni <span className="italic" style={{ color: T.accent }}>qanday</span> tuzatamiz?</h2></>}
    options={["@Roles('public') ga o'zgartiramiz", 'Guard\'ni butunlay o\'chiramiz', 'Mijozni admin qilamiz', 'Frontend\'da yashiramiz']} correctIdx={0}
    explainCorrect="To'g'ri! POST /order public bo'lishi kerak — @Roles('public'). Boshqa endpointlar (GET /order) admin'da qoladi. Faqat shu qatorni tuzatamiz."
    explainWrong={{
      1: "Guard'ni o'chirsak, admin endpointlari ham himoyasiz qoladi. Faqat shu qatorni public qilamiz.",
      2: "Har mijozni admin qilish juda xavfli — ular kitob ham qo'sha oladi. To'g'risi: POST /order public.",
      3: "Frontend himoya emas — backend baribir 403 beradi. Server tomonda @Roles('public') to'g'ri.",
      default: "To'g'ri tuzatish — POST /order'ni @Roles('public') qilish."
    }} />
);

// ===== SCREEN 16 — INTEGRATION: to'liq stsenariy =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? SHOP_FLOW.length : -1);
  const [sc, setSc] = useState(0);
  const done = step >= SHOP_FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const adv = () => { setStep(s => Math.min(s + 1, SHOP_FLOW.length - 1)); setSc(n => n + 1); };
  const cur = step >= 0 ? SHOP_FLOW[Math.min(step, SHOP_FLOW.length - 1)] : null;
  return (
    <Stage eyebrow="Integratsiya · stsenariy" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Stsenariyni kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasi birga: bitta haqiqiy <span className="italic" style={{ color: T.accent }}>xarid</span> qanday kechadi?</h2></div>
        <Mentor>3 resurs, auth va bog'lanish — endi birga ishlaydi. Admin kitob qo'shadi, mijoz top kitoblarni ko'rib buyurtma beradi, admin buyurtmani ko'radi. Tugmani bosib kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="flow-rail fade-up delay-1">
              {SHOP_FLOW.map((f, i) => {
                const lit = step >= i;
                return (
                  <div key={f.k} className="flow-stop" style={{ opacity: lit ? 1 : 0.35 }}>
                    <span className="flow-ico" style={{ background: lit ? T.accent : T.paper, color: lit ? '#fff' : T.ink3 }}>{f.icon}</span>
                    <span className="flow-k" style={{ color: lit ? T.ink : T.ink3 }}>{f.k}</span>
                    {i < SHOP_FLOW.length - 1 && <span className="flow-down" style={{ color: step > i ? T.accent : T.ink3 + '66' }}>↓</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={adv}>{step < 0 ? '▶ Stsenariyni boshlash' : (done ? '✓ Tugadi' : 'Keyingi qadam →')}</button>
            {cur && <div className="sk-info fade-step" key={step}><p className="note-h"><span style={{ fontSize: 20, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.r}</span> · {cur.k}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq do'kon oqimi! Auth, bog'lanish, maxsus endpoint — hammasi birga ishlayapti.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — SWAGGER: to'liq KitobShop tirik =====
const Screen17 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [openId, setOpenId] = useState(storedAnswer ? 'GET/book/featured' : null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['GET/book/featured', 'POST/order']) : new Set());
  const [sc, setSc] = useState(0);
  const done = tried.size >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Natija · Swagger" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 endpoint sinang (${tried.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>KitobShop</span>'ingiz — to'liq tirik!</h2></div>
        <Mentor>3 resurs, 7 endpoint, auth himoyasi, bog'lanish — hammasi siz boshqarib qurildi. Kamida 2 ta endpointni <b style={{ color: T.ink }}>"Try it out"</b> bilan sinab ko'ring (🔒 admin, 🌐 ochiq).</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <ShopSwagger openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🌐 Mijoz: kitoblarni ko'radi, top kitoblar, buyurtma. 🔒 Admin: kitob/kategoriya qo'shadi, buyurtmalarni ko'radi.</p></div>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Tabriklaymiz! Siz haqiqiy, auth bilan himoyalangan, bog'langan backend qurdingiz — agentni boshqarib.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Endpointni oching → "Try it out" → javobni ko'ring.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 18 — YAKUNIY: bog'lanishni qo'lda yozish =====
const Screen18 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.toLowerCase();
  const hasM2O = /@manytoone/.test(v);
  const hasArrow = /=>/.test(v);
  const hasEntity = /categoryentity/.test(v);
  const valid = hasM2O && hasArrow && hasEntity;
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'book.entity.ts ga Category bog\'lanishini yozing', correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Bog\'lanishni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: kitobni kategoriyaga <span className="italic" style={{ color: T.accent }}>o'zingiz</span> bog'lang.</h2></div>
        <Mentor>Eng muhim yangi ko'nikma — bog'lanish. <span className="mono">book.entity.ts</span> ga Book → Category bog'lanishini <b style={{ color: T.ink }}>o'zingiz</b> yozing. Namuna: <span className="mono">@ManyToOne(() =&gt; CategoryEntity)</span></Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">book.entity.ts — bog'lanish qatorini yozing</p>
            <div className="editor">
              <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">book.entity.ts</span></div>
              <div className="editor-body">
                <pre className="editor-code">{'export class BookEntity extends BaseEntity {'}{'\n'}{'  @Column()  title: string;'}{'\n'}</pre>
                <input className={`code-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="@ManyToOne(() => CategoryEntity)" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                <pre className="editor-code">{'  category: CategoryEntity;'}{'\n'}{'}'}</pre>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasM2O ? 1 : 0.4 }}>{hasM2O ? '✓' : '1'} @ManyToOne</span>
              <span className="tagpill" style={{ opacity: hasArrow ? 1 : 0.4 }}>{hasArrow ? '✓' : '2'} () =&gt;</span>
              <span className="tagpill" style={{ opacity: hasEntity ? 1 : 0.4 }}>{hasEntity ? '✓' : '3'} CategoryEntity</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">bog'lanish</p>
            <div className="frame" style={{ padding: 14, minHeight: 110 }}>
              <div className="ent-row siz">📦 Book <span>ko'p</span></div>
              <div style={{ textAlign: 'center', color: valid ? T.accent : T.ink3, fontWeight: 700, fontSize: 13, margin: '2px 0' }}>{valid ? '↓ @ManyToOne ✓' : '↓ ?'}</div>
              <div className="ent-row free">📦 Category <span>bitta</span></div>
            </div>
            {passed
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Book → Category ulandi. Endi bog'lanishni ham o'zingiz yoza olasiz — real backend ko'nikmasi!</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>To'liq yozing: <span className="mono" style={{ fontStyle: 'normal' }}>@ManyToOne</span> + <span className="mono" style={{ fontStyle: 'normal' }}>() =&gt;</span> + <span className="mono" style={{ fontStyle: 'normal' }}>CategoryEntity</span>.</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 19 — NAZORATCHI: yakuniy tekshiruv =====
const Screen19 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const ITEMS = [
    { t: '3 resurs: Category, Book, Order — har biri 5 qadam', ok: '✓ Uchchalasi tayyor.' },
    { t: 'Auth: qo\'shish/o\'chirish admin, ko\'rish/buyurtma public', ok: '✓ @Roles to\'g\'ri taqsimlangan.' },
    { t: 'Bog\'lanish: Book → Category, Order → Book (@ManyToOne)', ok: '✓ Jadvallar ulangan.' },
    { t: 'Maxsus endpoint: GET /book/featured (top kitoblar)', ok: '✓ findAll + where bilan.' },
    { t: 'Har modul AppModule\'ga ulangan, Swagger\'da ko\'rinadi', ok: '✓ Hammasi tirik.' }
  ];
  return (
    <Stage eyebrow="Tekshiruv · yakuniy" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Yakunga →' : 'Backendni tekshiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Backend tayyormi? <span className="italic" style={{ color: T.accent }}>Yakuniy tekshiruv</span>.</h2></div>
        <Mentor>Loyihani topshirishdan oldin — oxirgi tekshiruv ro'yxati. Har bandni bosib tasdiqlang: hammasi joyidami?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Checklist items={ITEMS} doneInit={!!storedAnswer} onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }} />
          </Col>
          <Col>
            <AgentCard title="🎯 Eslab qoling">Har loyihada shu ro'yxat: resurslar + auth + bog'lanish + ulanish + Swagger. Bosh dasturchi sifatida buni siz tekshirasiz.</AgentCard>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ KitobShop tayyor va tekshirildi — topshirishga shay!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 20 — YAKUN =====
const Screen20 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "3 bog'langan resursli real backend qurdingiz (Category · Book · Order)",
    "Bosh dasturchi sikli: Rejalashtir → Yo'naltir → Tekshir",
    "Auth: @UseGuards + @Roles — public (mijoz) vs admin",
    "Bog'lanish: @ManyToOne (Book→Category, Order→Book)",
    "AI yo'l qo'ygan xatoni mustaqil topib tuzatdingiz (debug)"
  ];
  const HOMEWORK = [
    { b: 'O\'z marketplace\'ingiz', t: "— elektronika/kiyim do'koni: 3 resursni rejaga soling" },
    { b: 'Playbook', t: "— har resurs uchun AI'ga beradigan aniq promptni yozing" },
    { b: 'Tekshiruv', t: "— AI natijasini 5 bandli ro'yxat bilan tekshiring" }
  ];
  const GLOSSARY = [
    { b: 'Resurs', t: '— ilova boshqaradigan bir tur ma\'lumot' },
    { b: '@UseGuards', t: '— qo\'riqchini ulaydi (Auth + Roles)' },
    { b: '@Roles', t: "— public (hamma) yoki admin" },
    { b: '@ManyToOne', t: '— jadvallar bog\'lanishi (ko\'p → bitta)' },
    { b: 'featured', t: '— findAll({ where }) maxsus endpoint' },
    { b: 'Rejalashtir', t: '— qaysi resurs, ustun, bog\'lanish (data-model)' },
    { b: 'Yo\'naltir', t: '— AI\'ga aniq topshiriq berish' },
    { b: 'Tekshir', t: '— natijani tekshirish (checklist)' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Real backend qurdingiz</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>backend dasturchisi</span>siz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! KitobShop — 3 resurs, auth, bog'lanish va maxsus endpoint. Hammasini AI'ni yo'naltirib qurdingiz va tekshirdingiz." : "Yaxshi harakat! Auth, bog'lanish va tekshiruv siklini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Siz endi istalgan g'oyani backendga aylantira olasiz — agentni boshqarib, har faylni tekshirib!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function NestArchPracticeLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17, Screen18, Screen19, Screen20];
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
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: default; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); }
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
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono'; font-size: clamp(11.5px,1.5vw,13px); line-height: 1.55; padding: clamp(12px,2.2vw,15px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

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
        .prompt-box { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 12px 15px; }

        /* AGENT FILE GENERATION */
        .gen-file { display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 9px; padding: 9px 12px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-size: 12px; transition: all 0.2s; }
        .gen-file.ready { box-shadow: inset 0 0 0 1.5px ${T.success}33, 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .gen-ico { font-weight: 800; min-width: 16px; text-align: center; }
        .gen-file .mono { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .gen-d { font-size: 10px; color: ${T.ink2}; font-weight: 600; margin-left: auto; text-align: right; }

        /* AI DEBUG CARD */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); display: flex; flex-direction: column; gap: 11px; }
        .ai-row { display: flex; gap: 8px; align-items: flex-start; }
        .ai-badge { background: ${T.nest}; color: #fff; font-family: 'Manrope'; font-weight: 800; font-size: 10px; padding: 4px 8px; border-radius: 6px; flex-shrink: 0; }
        .ai-bubble { background: ${T.bg}; border-radius: 4px 12px 12px 12px; padding: 9px 12px; font-size: 13px; color: ${T.ink}; }
        .ai-code { background: ${CODE.bg}; border-radius: 10px; padding: 10px 11px; display: flex; flex-direction: column; gap: 2px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${CODE.text}; padding: 5px 7px; border-radius: 6px; cursor: pointer; transition: all 0.16s; }
        .ai-line:hover { background: rgba(255,255,255,0.07); }
        .ai-line.bad { background: rgba(194,54,43,0.26); box-shadow: inset 0 0 0 1.5px ${T.danger}; }
        .ai-line.ok { opacity: 0.4; text-decoration: line-through; cursor: default; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; font-style: italic; margin: 0; }
        .takeaway { background: ${T.successSoft}; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 3px; text-align: center; }
        .ta-bulb { font-size: 26px; } .ta-h { font-family: 'Manrope'; font-weight: 800; font-size: 14px; color: ${T.ink}; margin: 0; } .ta-sub { font-size: 12px; color: ${T.ink2}; margin: 0; }

        /* CODE INPUT */
        .code-input { display: block; width: 100%; margin: 2px 0; background: rgba(0,122,204,0.12); border: 1px dashed #4FA8D8; border-radius: 6px; color: ${CODE.text}; font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); padding: 7px 9px; outline: none; }
        .code-input.ok { border: 1.5px solid ${T.success}; background: rgba(31,122,77,0.18); }

        /* AUTH ROW (s7) */
        .auth-row { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 10px; padding: 9px 12px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .auth-btn { font-family: 'Manrope'; font-weight: 700; font-size: 12px; padding: 7px 12px; border-radius: 8px; border: none; background: ${T.bg}; color: ${T.ink2}; cursor: pointer; transition: all 0.16s; }
        .auth-btn:hover:not(:disabled) { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.25); }
        .auth-btn:disabled { cursor: default; }
        .auth-btn.ok { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .auth-btn.bad { background: ${T.accentSoft}; color: ${T.danger}; }

        /* SWAGGER */
        .swg { border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.18); }
        .swg-top { background: #173647; color: #fff; padding: 10px 13px; font-family: 'Manrope'; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 8px; } .swg-dot { width: 8px; height: 8px; border-radius: 50%; background: #49cc90; } .swg-ver { font-family: 'JetBrains Mono'; font-weight: 400; font-size: 11px; color: #9FB4D8; margin-left: auto; }
        .swg-row { border-bottom: 1px solid #eee; }
        .swg-head { width: 100%; display: flex; align-items: center; gap: 9px; padding: 9px 11px; background: #fff; border: none; cursor: pointer; text-align: left; }
        .swg-head:hover { background: #FBFAF7; }
        .swg-m { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: #fff; padding: 3px 8px; border-radius: 5px; min-width: 52px; text-align: center; }
        .swg-path { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 700; color: ${T.ink}; }
        .swg-sum { font-size: 11px; color: ${T.ink3}; margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .swg-chev { color: ${T.ink3}; font-size: 11px; }
        .swg-detail { padding: 11px; background: #F8FAFB; display: flex; flex-direction: column; gap: 8px; }
        .swg-code-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink2}; }
        .json { background: ${CODE.bg}; color: ${CODE.text}; border-radius: 9px; padding: 10px 12px; font-family: 'JetBrains Mono'; font-size: 11px; white-space: pre-wrap; word-break: break-word; line-height: 1.6; margin: 0; }

        /* SO'ROV YO'LI */
        .flow-rail { display: flex; flex-direction: column; gap: 2px; }
        .flow-stop { display: flex; flex-direction: column; align-items: flex-start; transition: opacity 0.3s; }
        .flow-stop > span { display: inline-flex; }
        .flow-ico { width: 34px; height: 34px; border-radius: 9px; align-items: center; justify-content: center; font-size: 17px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); transition: all 0.3s; }
        .flow-k { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; margin: 3px 0 0 6px; }
        .flow-down { font-size: 15px; margin: 1px 0 1px 9px; line-height: 1; transition: color 0.3s; }

        /* ENTITY ROWS */
        .ent-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-family: 'JetBrains Mono'; font-size: 11.5px; padding: 7px 10px; border-radius: 8px; margin-bottom: 5px; }
        .ent-row span { font-size: 10px; font-weight: 700; }
        .ent-row.siz { background: ${T.accentSoft}; color: ${T.ink}; } .ent-row.siz span { color: ${T.accent}; }
        .ent-row.free { background: ${T.successSoft}; color: ${T.ink}; } .ent-row.free span { color: ${T.success}; }

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
