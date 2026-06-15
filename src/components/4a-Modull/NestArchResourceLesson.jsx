import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';

// ============================================================
// NEST ARXITEKTURA MODULI · DARS 2 — BIRINCHI RESURSNI QO'LDA QO'SHISH — PLATFORM STANDARD v16 (AUDIOSIZ)
// Domen: AVTOSALON. Dars 1'dagi admin endi mashinalarni (Car) boshqaradi. O'quvchi mashinalar resursini noldan qo'shadi.
// Sikl: Entity → DTO → Service (BaseService) → Controller → Module → AppModule'ga ulash. Repo: github.com/Azizbekcrypto/IntroNestArxitechture.
// Birlashtiruvchi analogiya: RESTORAN (layerlar) — controller=ofitsiant, dto=anketa, service=oshpaz, baseservice=tayyor retsept, entity=ombor shakli, module=bo'lim.
// Pedagogika: I-DO (Dars 1) → WE-DO (shu dars) → YOU-DO (Praktika). Har qadamda "💬 Agentni shunday yo'naltiring" — Praktikaga ko'prik (prompt playbook).
// SARLAVHALAR: darak gap emas — global/qiziqarli SAVOL (namunaviy darslardek). "resurs" so'zi bir marta sodda ta'riflanadi, qolganda "mashinalar jadvali".
// Eng ko'p unutiladigan xato beat (s13): CarModule'ni AppModule'ga ulash — usiz /car = 404.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy, "sehr"/"g'isht" yo'q. AUDIOSIZ.
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

const LESSON_META = { lessonId: 'nest-arch-resource-v16', lessonTitle: { uz: 'Birinchi resursni qo\'lda qo\'shish — mashinalar', ru: 'Добавляем первый ресурс вручную — машины' } };
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
  { id: 's9',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15', type: 'case',        template: 'custom',   scored: false, scope: null },
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

// ===== MOCK VS CODE EDITOR =====
const CodeFile = ({ name, children, minH }) => (
  <div className="editor">
    <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">{name}</span></div>
    <div className="editor-body" style={{ minHeight: minH }}><pre className="editor-code">{children}</pre></div>
  </div>
);

// ===== AGENT PROMPT (Praktikaga ko'prik) =====
const AgentCard = ({ children }) => (
  <div className="agent-card">
    <span className="agent-lbl">💬 Agentni shunday yo'naltiring</span>
    <p className="agent-msg">{children}</p>
  </div>
);

// ===== MOCK SWAGGER (Car) =====
const M_COLOR = { GET: T.blue, POST: T.success, PATCH: T.amber, DELETE: T.danger };
const CAR_EPS = [
  { m: 'POST', path: '/car', sum: 'Yangi mashina', resp: '{\n  "statusCode": 201,\n  "message": "success",\n  "data": { "id": "c1a...", "brand": "Chevrolet", "model": "Cobalt", "price": 15000, "is_available": true }\n}' },
  { m: 'GET', path: '/car', sum: 'Mashinalar ro\'yxati', resp: '{\n  "statusCode": 200,\n  "data": [ { "id": "c1a...", "brand": "Chevrolet", "model": "Cobalt" } ]\n}' },
  { m: 'GET', path: '/car/{id}', sum: 'Bitta mashina', resp: '{ "statusCode": 200, "data": { "id": "c1a...", "brand": "Chevrolet", "price": 15000 } }' },
  { m: 'PATCH', path: '/car/{id}', sum: 'Tahrirlash', resp: '{ "statusCode": 200, "message": "success" }' },
  { m: 'DELETE', path: '/car/{id}', sum: 'O\'chirish', resp: '{ "statusCode": 200, "message": "success" }' }
];
const CarSwagger = ({ available, openId, onToggle, triedIds, onTry }) => (
  <div className="swg">
    <div className="swg-top"><span className="swg-dot" style={{ background: available ? '#49cc90' : '#febc2e' }} /> Avtosalon API <span className="swg-ver">/api/v1</span></div>
    {CAR_EPS.map(e => {
      const id = e.m + e.path;
      const open = openId === id;
      const tried = triedIds.has(id);
      return (
        <div key={id} className="swg-row">
          <button className="swg-head" onClick={() => onToggle(id)}>
            <span className="swg-m" style={{ background: M_COLOR[e.m] }}>{e.m}</span>
            <span className="swg-path">{e.path}</span>
            <span className="swg-sum">{e.sum}</span>
            <span className="swg-chev">{open ? '▾' : '▸'}</span>
          </button>
          {open && (
            <div className="swg-detail el-in">
              {!tried
                ? <button className="btn-soft" onClick={() => onTry(id)} style={{ alignSelf: 'flex-start' }}>▶ Try it out</button>
                : (available
                  ? <><div className="swg-code-lbl">Javob · <span style={{ color: T.success }}>{e.m === 'POST' ? '201' : '200'}</span></div><pre className="json">{e.resp}</pre></>
                  : <><div className="swg-code-lbl">Javob · <span style={{ color: T.danger }}>404</span></div><pre className="json">{'{\n  "statusCode": 404,\n  "message": "Cannot ' + e.m + ' ' + e.path + '"\n}'}</pre></>)}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ===== PICK LINES — "qaysi qator shu faylga tegishli?" (qatlamlarni ajratish) =====
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
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Fayl tayyor — har qator o'z joyida. Begona qatorlar boshqa qatlamga tegishli edi.</p></div>}
      </Col>
    </div>
  );
};

// ===== SO'ROV YO'LI (Car) =====
const FLOW = [
  { k: "So'rov", icon: '📨', r: 'Admin buyurtmasi', d: "POST /car — admin yangi mashina qo'shmoqchi." },
  { k: 'Controller', icon: '🛎️', r: 'Ofitsiant', d: "CarController so'rovni qabul qiladi, create() ni chaqiradi." },
  { k: 'DTO', icon: '📋', r: 'Anketa tekshiruvi', d: "brand bormi, price raqammi? (ValidationPipe). Xato bo'lsa — 400." },
  { k: 'Service', icon: '👨‍🍳', r: 'Oshpaz', d: 'CarService — maxsus mantiq yo\'q, to\'g\'ri BaseService\'ga uzatadi.' },
  { k: 'BaseService', icon: '📖', r: 'Tayyor retsept', d: 'repository.save() — yozishni bajaradi (tekin keldi).' },
  { k: 'PostgreSQL', icon: '🗄️', r: 'Ombor', d: "cars jadvaliga yoziladi." },
  { k: 'successRes', icon: '🎁', r: 'Qadoqlash', d: '{ statusCode, message, data } — bir xil shakl.' },
  { k: 'Javob', icon: '✅', r: 'Adminga', d: '201 Created — mashina qo\'shildi!' }
];

// ===== SCREEN 0 — HOOK: admin bor, mashinalar jadvali yo'q =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "admin faylini o'zgartirib, ichiga mashinani tiqamiz" },
    { id: 'b', label: "Mashinalar uchun yangi resurs (Car) quramiz" },
    { id: 'c', label: "Imkonsiz — skeletga yangi narsa qo'shib bo'lmaydi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Admin tizimi tayyor — lekin avtosalon <span className="italic" style={{ color: T.accent }}>mashinalarini</span> qayerda saqlaydi?</h1>
        <Mentor>Dars 1'da clone qilgan skeletda <b style={{ color: T.ink }}>admin</b> tizimi ishlayapti. Endi admin avtosalon mashinalarini boshqarishi kerak — lekin hozir mashinalar jadvali yo'q. Pastdagi <span className="mono">POST /car</span> ni bosib sinab ko'ring — nima bo'larkan?</Mentor>
        <Split>
          <Col>
            <p className="flow-label fade-up delay-1">Hozirgi holat — /car hali yo'q</p>
            <div className="swg fade-up delay-1">
              <div className="swg-top"><span className="swg-dot" /> Avtosalon API <span className="swg-ver">/api/v1</span></div>
              <div className="swg-row"><div className="swg-head" style={{ cursor: 'default' }}><span className="swg-m" style={{ background: M_COLOR.POST }}>POST</span><span className="swg-path">/admin/signin</span><span className="swg-sum">ishlaydi ✓</span></div></div>
              <div className="swg-row"><div className="swg-head" style={{ cursor: 'default' }}><span className="swg-m" style={{ background: M_COLOR.GET }}>GET</span><span className="swg-path">/admin</span><span className="swg-sum">ishlaydi ✓</span></div></div>
              <div className="swg-row">
                <button className="swg-head" onClick={poke}><span className="swg-m" style={{ background: M_COLOR.POST }}>POST</span><span className="swg-path">/car</span><span className="swg-sum">sinab ko'ring</span><span className="swg-chev">▸</span></button>
                {tried && <div className="swg-detail el-in"><div className="swg-code-lbl">Javob · <span style={{ color: T.danger }}>404</span></div><pre className="json">{'{\n  "statusCode": 404,\n  "message": "Cannot POST /car"\n}'}</pre></div>}
              </div>
            </div>
            {tried && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>404 — bunday eshik yo'q. Chunki mashinalar jadvalini hali hech kim qo'shmagan.</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Endi /car ni qanday paydo qilamiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval POST /car ni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Admin faylini buzmaymiz. <b>Resurs</b> — bu ilovangiz boshqaradigan bir tur ma'lumot (admin, mashina, buyurtma...). Mashinalar — alohida resurs: <b>o'z papkasi</b>da, <b>o'z 5 qadami</b> bilan quriladi. Bugun mashinalarni noldan qo'shamiz — va <span className="mono">/car</span> tirik bo'ladi.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (5 qadam) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Entity — jadval shakli', tag: 'car.entity.ts' },
    { text: 'DTO — anketa + qoidalar', tag: 'create/update dto' },
    { text: 'Service — BaseService\'dan meros', tag: 'car.service.ts' },
    { text: 'Controller — eshiklar', tag: 'car.controller.ts' },
    { text: 'Module — ulaydi + AppModule', tag: 'car.module.ts' }
  ];
  return (
    <Stage eyebrow="Reja · 5 qadam" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Mashinalar jadvalini qo'shish — <span className="italic" style={{ color: T.accent }}>qayerdan boshlanadi</span>?</h2></div>
        <Mentor>Restoranda yangi <b style={{ color: T.ink }}>bo'lim</b> ochgandek, ilovaga yangi bo'lim — mashinalar — qo'shamiz. Sirning o'zi: <b style={{ color: T.ink }}>har</b> resurs uchun tartib bir xil va <b style={{ color: T.ink }}>pastdan yuqoriga</b>: avval ma'lumot shakli (Entity), keyin qoidalar (DTO), ish (Service), eshik (Controller), oxirida hammasini ulash (Module). Bir marta o'rgansangiz — istalgan loyihada shu sikl.</Mentor>
        <ol className="roadmap fade-up delay-1">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{s.tag}</span></span></li>))}</ol>
        <div className="frame-success fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}>Misol resurs — <span className="mono">Car</span> (mashina). Sodda: parol ham, kirish-chiqish ham yo'q — shu sababli <b>BaseService</b>ning kuchi to'liq ko'rinadi.</p></div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — REJA: mashina jadvali qanday ko'rinadi? =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FIELDS = [
    { id: 'brand', label: 'brand', d: 'marka (matn, majburiy)' },
    { id: 'model', label: 'model', d: 'model nomi (matn, majburiy)' },
    { id: 'price', label: 'price', d: 'narx (raqam)' },
    { id: 'is_available', label: 'is_available', d: 'sotuvda bormi? (true/false)' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(FIELDS.map(f => f.id)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= FIELDS.length;
  const tap = (id) => { setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Reja · mashina shakli" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ustunlarni belgilang (${seen.size}/${FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kod yozishdan oldin: bitta mashina haqida <span className="italic" style={{ color: T.accent }}>nimani saqlaymiz</span>?</h2></div>
        <Mentor>Professional dasturchi avval <b style={{ color: T.ink }}>rejalashtiradi</b>: qanday ma'lumot kerak? Mashina uchun to'rtta ustun yetadi. Har birini bosib belgilang.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">siz qo'shadigan ustunlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {FIELDS.map(f => (
                <button key={f.id} className="vcard" onClick={() => tap(f.id)} style={{ boxShadow: seen.has(f.id) ? `inset 0 0 0 1.5px ${T.success}, 0 5px 14px -6px rgba(${T.shadowBase},0.16)` : undefined }}>
                  <span className="vlbl mono">{f.label}</span>
                  <span className="role-r">{f.d}</span>
                  <span className="vseen" style={{ color: seen.has(f.id) ? T.success : T.ink3 }}>{seen.has(f.id) ? '✓' : '+'}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            <p className="flow-label">tekin keladi (BaseEntity)</p>
            <div className="frame" style={{ padding: 14 }}>
              <div className="ent-row free">id (uuid) <span>← BaseEntity</span></div>
              <div className="ent-row free">created_at <span>← BaseEntity</span></div>
              <div className="ent-row free">updated_at <span>← BaseEntity</span></div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Reja tayyor: 4 ta o'z ustunimiz + 3 ta tekin. Endi buni 1-faylga — Entity'ga yozamiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — 1-QADAM: ENTITY =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'brand', correct: true, label: '@Column()  brand: string;', node: <><At>@Column</At>{'()  brand: '}<St>string</St>{';'}</> },
    { id: 'model', correct: true, label: '@Column()  model: string;', node: <><At>@Column</At>{'()  model: '}<St>string</St>{';'}</> },
    { id: 'price', correct: true, label: '@Column()  price: number;', node: <><At>@Column</At>{'()  price: '}<St>number</St>{';'}</> },
    { id: 'avail', correct: true, label: '@Column({ default: true })  is_available: boolean;', node: <><At>@Column</At>{'({ default: '}<Jx>true</Jx>{' })  is_available: '}<St>boolean</St>{';'}</> },
    { id: 'id', correct: false, label: 'id: string;', why: "id kerakmas — u BaseEntity'dan tekin keladi. Qayta yozsangiz, takror bo'ladi." },
    { id: 'username', correct: false, label: 'username: string;', why: "Bu admin'ga tegishli. Mashinada username yo'q — bu qator boshqa resursdan." }
  ];
  return (
    <Stage eyebrow="1-qadam · Entity" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Faylni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashina haqida nimani saqlaymiz — jadval <span className="italic" style={{ color: T.accent }}>qanday ko'rinadi</span>?</h2></div>
        <Mentor><span className="mono">Entity</span> bazadagi jadval ko'rinishini belgilaydi. <span className="mono">BaseEntity</span>'dan meros olamiz — <b style={{ color: T.ink }}>id, created_at, updated_at tekin</b>. Faqat o'z ustunlarimizni qo'shamiz. Diqqat: o'ngdagi ba'zi qatorlar <b style={{ color: T.ink }}>boshqa qatlamga</b> tegishli — faqat to'g'rilarini tanlang.</Mentor>
        <PickLines
          fileName="src/core/entity/car.entity.ts"
          scaffoldTop={<><At>@Entity</At>{"('cars')"}{'\n'}<Jx>export class</Jx>{' CarEntity '}<Jx>extends</Jx>{' BaseEntity {'}</>}
          scaffoldBottom={<>{'}'}</>}
          candidates={candidates}
          agent={"car.entity.ts yoz: BaseEntity'dan meros olsin; brand, model (matn), price (raqam), is_available (default true) ustunlari bo'lsin."}
          instruction="car.entity.ts ga qaysi qatorlar tegishli?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>1-fayl tayyor! Lekin <span className="mono">/car</span> hali yo'q — bitta fayl yetmaydi. Keyingi qadam: ma'lumot qoidalari (DTO).</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (Entity) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Entity nimani belgilaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Entity</span> <span className="italic" style={{ color: T.accent }}>nimani</span> belgilaydi?</h2></>}
    options={['Bazadagi jadval shaklini — qaysi ustunlar bor', 'So\'rovni qabul qilishni', 'Kelgan ma\'lumot qoidalarini', 'Loyihani ishga tushirishni']} correctIdx={0}
    explainCorrect="To'g'ri! Entity — jadval ko'rinishi: qaysi ustunlar bor (brand, price...). id va vaqtlar BaseEntity'dan tekin keladi."
    explainWrong={{
      1: "So'rovni qabul qilish — Controller (ofitsiant) ishi. Entity — jadval shakli.",
      2: "Ma'lumot qoidalari — DTO ishi. Entity esa bazadagi ustunlarni belgilaydi.",
      3: "Ishga tushirish — main.ts. Entity — jadval shakli.",
      default: "Entity = jadval shakli (qaysi ustunlar bor)."
    }} />
);

// ===== SCREEN 5 — 2-QADAM: DTO + VALIDATSIYA =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [res, setRes] = useState(storedAnswer ? 'bad' : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['ok', 'bad']) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= 2;
  const send = (kind) => { setRes(kind); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(kind); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="2-qadam · DTO" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "To'g'ri va xato so'rovni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Noto'g'ri mashina ma'lumoti kelsa — <span className="italic" style={{ color: T.accent }}>kim to'xtatadi</span>?</h2></div>
        <Mentor><span className="mono">DTO</span> — buyurtma anketasi: <span className="mono">brand</span> matn va majburiy, <span className="mono">price</span> raqam bo'lishi shart. Qoidalarni <span className="mono">@IsString</span>, <span className="mono">@IsNotEmpty</span>, <span className="mono">@IsNumber</span> belgilaydi. Nazoratchi (ValidationPipe) tekshiradi. To'g'ri va xato so'rovni yuboring.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="src/api/car/dto/create-car.dto.ts">
              <Jx>export class</Jx>{' CreateCarDto {'}{'\n'}
              {'  '}<At>@IsString</At>{'()  '}<At>@IsNotEmpty</At>{'()'}{'\n'}
              {'  brand: '}<St>string</St>{';'}{'\n\n'}
              {'  '}<At>@IsNumber</At>{'()'}{'\n'}
              {'  price: '}<St>number</St>{';'}{'\n'}
              {'}'}
            </CodeFile>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={() => send('ok')}>✅ To'g'ri: {`{ brand: 'Chevrolet', price: 15000 }`}</button>
              <button className="btn-soft" onClick={() => send('bad')}>❌ Xato: {`{ brand: '', price: 'arzon' }`}</button>
            </div>
            <AgentCard>create-car.dto.ts yoz: brand — majburiy matn (@IsString, @IsNotEmpty), price — raqam (@IsNumber), is_available — ixtiyoriy.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">Nazoratchi javobi</p>
            {res === 'ok' && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ 201 — qabul qilindi</p><p className="body" style={{ margin: 0, color: T.ink }}>brand to'ldirilgan, price raqam — anketa to'g'ri, ichkariga o'tdi.</p></div>}
            {res === 'bad' && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 400 — rad etildi</p><p className="body" style={{ margin: 0, color: T.ink }}>brand bo'sh, price esa raqam emas ("arzon") — qoidalar buzilgan. So'rov service'gacha ham bormadi.</p></div>}
            {res === null && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>So'rov yuboring ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>DTO + nazoratchi ilovani ifloslangan ma'lumotdan himoya qiladi. Yomon ma'lumot bazaga umuman yetib bormaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — 2-QADAM (b): UpdateCarDto (PartialType) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="2-qadam · Update DTO" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "DRY'ni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashina narxini o'zgartirish uchun — anketani <span className="italic" style={{ color: T.accent }}>qaytadan yozamizmi</span>?</h2></div>
        <Mentor>Yo'q! Tahrirlashda faqat o'zgartirilgan maydon yuboriladi — hammasi ixtiyoriy bo'ladi. <span className="mono">PartialType(CreateCarDto)</span> create anketasini olib, hamma maydonini ixtiyoriy qiladi — <b style={{ color: T.ink }}>takrorlamaymiz</b> (DRY). Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="src/api/car/dto/update-car.dto.ts">
              <Jx>export class</Jx>{' UpdateCarDto '}{'\n'}
              {'  '}<Jx>extends</Jx>{' '}<At>PartialType</At>{'(CreateCarDto) {}'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : '🎁 PartialType nima qiladi?'}</button>
            <AgentCard>update-car.dto.ts yoz: PartialType(CreateCarDto) — barcha maydon ixtiyoriy bo'lsin.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">{show ? 'PartialType natijasi' : 'Siz yozasiz'}</p>
            <div className="frame" style={{ padding: 14 }}>
              <div className="ent-row siz">brand, price <span>← create'da majburiy</span></div>
              {show && <><div className="ent-row free el-in">brand? (ixtiyoriy) <span>← PartialType</span></div><div className="ent-row free el-in">price? (ixtiyoriy) <span>← PartialType</span></div></>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta qator — tahrirlash anketasi tayyor. Bir xil kodni ikki marta yozmaslik — professional odat (DRY).</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 (DTO) =====
const Screen7 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="brand bo'sh holda POST /car yuborilsa nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bo'sh <span className="mono">brand</span> yuborilsa <span className="italic" style={{ color: T.accent }}>nima</span> bo'ladi?</h2></>}
    options={['400 qaytadi — bazaga umuman bormaydi', '201 — baribir saqlanadi', 'Server ishdan chiqadi', 'Avtomatik brand qo\'yiladi']} correctIdx={0}
    explainCorrect="To'g'ri! DTO qoidasi (@IsNotEmpty) buzilgani uchun nazoratchi (ValidationPipe) so'rovni 400 bilan rad etadi — service va bazaga yetib bormaydi."
    explainWrong={{
      1: "Saqlanmaydi — qoida buzilgan. DTO yomon ma'lumotni ichkariga kiritmaydi (400).",
      2: "Server ishdan chiqmaydi — DTO toza ravishda 400 qaytaradi.",
      3: "Avtomatik qo'yilmaydi — qoida buzilsa so'rov rad etiladi (400).",
      default: "Bo'sh brand = 400, bazaga bormaydi."
    }} />
);

// ===== SCREEN 8 — 3-QADAM: SERVICE (BaseService meros) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FREE = ['create', 'findAll', 'findOneById', 'update', 'remove'];
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="3-qadam · Service" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Tekin CRUD\'ni ochib ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashina CRUD'ini kim yozadi — <span className="italic" style={{ color: T.accent }}>yana qo'ldami</span>?</h2></div>
        <Mentor>Yo'q! CarService <span className="mono">BaseService</span>'dan meros oladi — qo'shish/o'qish/o'zgartirish/o'chirish <b style={{ color: T.ink }}>tekin keladi</b>. Repozitoriyni inject qilib, <span className="mono">super(carRepo)</span> deymiz — tamom. Mashinada maxsus mantiq yo'q, shuning uchun boshqa hech narsa yozmaymiz. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="src/api/car/car.service.ts">
              <At>@Injectable</At>{'()'}{'\n'}
              <Jx>export class</Jx>{' CarService'}{'\n'}
              {'  '}<Jx>extends</Jx>{' BaseService<'}{'\n'}
              {'    CreateCarDto, UpdateCarDto, CarEntity> {'}{'\n'}
              {'  constructor('}{'\n'}
              {'    '}<At>@InjectRepository</At>{'(CarEntity)'}{'\n'}
              {'    '}<Jx>private readonly</Jx>{' carRepo: Repository<CarEntity>,'}{'\n'}
              {'  ) { '}<Jx>super</Jx>{'(carRepo); }'}{'\n'}
              {'}'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : '🎁 BaseService nima beradi?'}</button>
            <AgentCard>CarService yoz: BaseService'dan meros olsin (Create/Update DTO, CarEntity), CarEntity repozitoriysini inject qilib super(repo) chaqirsin.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">{show ? 'BaseService — tekin metodlar' : 'Siz yozasiz'}</p>
            {!show
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>
              : <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{FREE.map(m => <span key={m} className="gchip" style={{ boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success }}>✓ {m}()</span>)}</div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 ta CRUD metod — bittasini ham yozmadingiz, BaseService'dan keldi. O'ziga xos mantiq kerak bo'lsagina qo'shasiz (mashinada kerak emas).</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (BaseService) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="CarService'da CRUD (create, findAll, remove...) kodini kim yozadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>CRUD kodini <span className="italic" style={{ color: T.accent }}>kim</span> yozadi?</h2></>}
    options={['Hech kim — BaseService\'dan tekin keladi', 'Har resurs uchun qo\'lda qayta yozamiz', 'Controller yozadi', 'PostgreSQL avtomatik yozadi']} correctIdx={0}
    explainCorrect="To'g'ri! BaseService'dan meros olgani uchun CRUD tekin keladi. Siz faqat o'ziga xos mantiqni (kerak bo'lsa) qo'shasiz."
    explainWrong={{
      1: "Qayta yozish — vaqt isrofi. Aynan shuning uchun BaseService bor — meros olasiz, tekin keladi.",
      2: "Controller faqat so'rovni qabul qiladi. CRUD esa BaseService'dan keladi.",
      3: "Baza kodni yozmaydi. CRUD metodlari BaseService'dan meros bo'lib keladi.",
      default: "CRUD = BaseService'dan tekin (meros)."
    }} />
);

// ===== SCREEN 10 — 4-QADAM: CONTROLLER =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'post', correct: true, label: '@Post()  create(@Body() dto)', node: <><At>@Post</At>{'()  create('}<At>@Body</At>{'() dto) { '}<Jx>return</Jx>{' this.carService.create(dto); }'}</> },
    { id: 'get', correct: true, label: '@Get()  findAll()', node: <><At>@Get</At>{'()  findAll() { '}<Jx>return</Jx>{' this.carService.findAll(); }'}</> },
    { id: 'getid', correct: true, label: '@Get(\':id\')  findOne(@Param() id)', node: <><At>@Get</At>{"(':id')  findOne("}<At>@Param</At>{"('id') id) { "}<Jx>return</Jx>{' this.carService.findOneById(id); }'}</> },
    { id: 'patch', correct: true, label: '@Patch(\':id\')  update(...)', node: <><At>@Patch</At>{"(':id')  update("}<At>@Param</At>{"('id') id, "}<At>@Body</At>{'() dto) { '}<Jx>return</Jx>{' this.carService.update(id, dto); }'}</> },
    { id: 'delete', correct: true, label: '@Delete(\':id\')  remove(...)', node: <><At>@Delete</At>{"(':id')  remove("}<At>@Param</At>{"('id') id) { "}<Jx>return</Jx>{' this.carService.remove(id); }'}</> },
    { id: 'col', correct: false, label: '@Column()  brand: string;', why: "Bu Entity'ga tegishli (jadval ustuni). Controller'da eshiklar (@Get/@Post) bo'ladi." },
    { id: 'super', correct: false, label: 'super(carRepo);', why: "Bu Service'ga tegishli (BaseService chaqiruvi). Controller'da bunday qator bo'lmaydi." }
  ];
  return (
    <Stage eyebrow="4-qadam · Controller" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Eshiklarni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Admin mashina qo'shmoqchi — so'rov <span className="italic" style={{ color: T.accent }}>qaysi eshikdan</span> kiradi?</h2></div>
        <Mentor><span className="mono">Controller</span> — ofitsiant: so'rovni qabul qiladi va service'ning mos metodini chaqiradi. Har amal — bir eshik: <span className="mono">@Post</span> (qo'shish), <span className="mono">@Get</span> (o'qish), <span className="mono">@Patch</span> (o'zgartirish), <span className="mono">@Delete</span> (o'chirish). O'ngdagilardan faqat <b style={{ color: T.ink }}>controller'ga tegishlilarini</b> tanlang.</Mentor>
        <PickLines
          fileName="src/api/car/car.controller.ts"
          scaffoldTop={<><At>@Controller</At>{"('car')"}{'\n'}<Jx>export class</Jx>{' CarController {'}{'\n'}{'  constructor('}<Jx>private readonly</Jx>{' carService: CarService) {}'}</>}
          scaffoldBottom={<>{'}'}</>}
          candidates={candidates}
          agent={"CarController yoz: create, findAll, findOne, update, remove — standart CRUD endpointlar, har biri CarService'ning mos metodini chaqirsin."}
          instruction="car.controller.ts ga qaysi qatorlar tegishli?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 ta eshik tayyor. Controller faqat <b>qabul qilib chaqiradi</b> — asosiy ishni service/BaseService bajaradi. Oxirgi qadam: Module.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 4 (Controller) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Yangi mashina qo'shish uchun qaysi dekorator ishlatiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yangi mashina <span className="italic" style={{ color: T.accent }}>qo'shish</span> uchun qaysi dekorator?</h2></>}
    options={['@Post()', '@Get()', '@Delete()', '@Column()']} correctIdx={0}
    explainCorrect="To'g'ri! @Post() — yangi narsa qo'shish (create) uchun. @Get o'qish, @Patch o'zgartirish, @Delete o'chirish."
    explainWrong={{
      1: "@Get() — o'qish uchun. Qo'shish uchun @Post().",
      2: "@Delete() — o'chirish uchun. Qo'shish uchun @Post().",
      3: "@Column() — Entity ustuni, controller dekoratori emas. Qo'shish — @Post().",
      default: "Qo'shish = @Post()."
    }} />
);

// ===== SCREEN 12 — 5-QADAM: MODULE =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'imports', correct: true, label: 'imports: [TypeOrmModule.forFeature([CarEntity])]', node: <>{'imports: [TypeOrmModule.'}<At>forFeature</At>{'([CarEntity])],'}</> },
    { id: 'controllers', correct: true, label: 'controllers: [CarController]', node: <>{'controllers: [CarController],'}</> },
    { id: 'providers', correct: true, label: 'providers: [CarService]', node: <>{'providers: [CarService],'}</> },
    { id: 'isstring', correct: false, label: '@IsString()  brand: string;', why: "Bu DTO'ga tegishli (validatsiya qoidasi). Module'da ro'yxatlar bo'ladi." },
    { id: 'col', correct: false, label: '@Column()  price: number;', why: "Bu Entity'ga tegishli (jadval ustuni). Module bo'limni ulaydi, ustun yozmaydi." }
  ];
  return (
    <Stage eyebrow="5-qadam · Module" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Module\'ni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">5 fayl alohida turibdi — ularni <span className="italic" style={{ color: T.accent }}>kim bir-biriga ulaydi</span>?</h2></div>
        <Mentor><span className="mono">Module</span> bir bo'limning qismlarini ro'yxatga oladi: jadval (<span className="mono">forFeature</span>), eshik (controller), ish (service). Keyin NestJS ularni <b style={{ color: T.ink }}>avtomatik ulaydi</b> (DI). O'ngdan faqat <b style={{ color: T.ink }}>module'ga tegishli</b> ro'yxatlarni tanlang.</Mentor>
        <PickLines
          fileName="src/api/car/car.module.ts"
          scaffoldTop={<><At>@Module</At>{'({'}</>}
          scaffoldBottom={<>{'})'}{'\n'}<Jx>export class</Jx>{' CarModule {}'}</>}
          candidates={candidates}
          agent={"CarModule yoz: imports'da TypeOrmModule.forFeature([CarEntity]), controllers'da CarController, providers'da CarService bo'lsin."}
          instruction="car.module.ts ga qaysi qatorlar tegishli?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 fayl tayyor: Entity, DTO, Service, Controller, Module. Lekin bitta oxirgi ulanish qoldi — usiz <span className="mono">/car</span> baribir ishlamaydi!</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — ULASH: CarModule → AppModule (eng ko'p unutiladigan qadam) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 2 : 0); // 0 boshlang'ich, 1 try->404, 2 wired
  const [sc, setSc] = useState(0);
  const done = step >= 2;
  const wired = step >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const go = () => { setStep(s => Math.min(s + 1, 2)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Ulash · AppModule" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'CarModule\'ni ulang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">5 fayl tayyor — nega <span className="mono" style={{ color: T.accent }}>/car</span> hali ham <span className="italic" style={{ color: T.accent }}>404</span> qaytaradi?</h2></div>
        <Mentor>Chunki NestJS CarModule <b style={{ color: T.ink }}>borligini bilmaydi</b> — uni asosiy <span className="mono">AppModule</span>'ning imports'iga qo'shish kerak. Bu — eng ko'p unutiladigan qadam. Avval <span className="mono">POST /car</span> ni sinab ko'ring (hali 404), keyin ulang.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="src/api/app.module.ts" minH={120}>
              <At>@Module</At>{'({'}{'\n'}
              {'  imports: ['}{'\n'}
              {'    AdminModule, AuthModule,'}{'\n'}
              {wired
                ? <span className="el-in" style={{ color: T.success }}>{'    CarModule,   // ← qo\'shildi ✓'}</span>
                : <Cm>{'    // CarModule, ← yo\'q!'}</Cm>}{'\n'}
              {'  ],'}{'\n'}
              {'})'}{'\n'}
              <Jx>export class</Jx>{' AppModule {}'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={go}>{step === 0 ? '▶ POST /car yuborish' : (step === 1 ? '🔌 CarModule\'ni AppModule\'ga ulash' : '✓ Ulandi')}</button>
            <AgentCard>CarModule'ni AppModule'ning imports ro'yxatiga qo'sh — endpointlar tirik bo'lsin.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">POST /car natijasi</p>
            {step === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>So'rov yuboring ←</p></div>}
            {step === 1 && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 404 — topilmadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Fayllar bor, lekin CarModule AppModule'ga ulanmagan — NestJS uni ko'rmayapti. Mana shu xato eng ko'p uchraydi!</p></div>}
            {step >= 2 && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ 201 — mashina qo'shildi</p><p className="body" style={{ margin: 0, color: T.ink }}>Ulagandan keyin <span className="mono">/car</span> tirik bo'ldi! Bitta qator hammasini ishga tushirdi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 5 (Ulash / DI) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 5-savol"
    questionText="5 fayl yozildi, lekin CarModule AppModule'ga qo'shilmadi. Nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>CarModule <span className="italic" style={{ color: T.accent }}>ulanmasa</span> nima bo'ladi?</h2></>}
    options={['/car endpointlar ishlamaydi — 404', 'Hammasi baribir ishlaydi', 'Loyiha umuman ishga tushmaydi', 'Faqat GET ishlaydi']} correctIdx={0}
    explainCorrect="To'g'ri! NestJS faqat AppModule imports'idagi modullarni biladi. Ulanmasa — CarModule ko'rinmaydi, /car = 404."
    explainWrong={{
      1: "Ishlamaydi — NestJS modulni ro'yxatdan ko'rmasa, endpointlar paydo bo'lmaydi (404).",
      2: "Loyiha ishga tushadi, lekin /car eshiklari yo'q bo'ladi (404). Bu juda tez-tez bo'ladigan xato.",
      3: "GET ham ishlamaydi — butun CarModule ko'rinmaydi.",
      default: "Ulanmasa = /car 404."
    }} />
);

// ===== SCREEN 15 — CASE: SO'ROV YO'LI (POST /car) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? FLOW.length : -1);
  const [sc, setSc] = useState(0);
  const done = step >= FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const adv = () => { setStep(s => Math.min(s + 1, FLOW.length - 1)); setSc(n => n + 1); };
  const cur = step >= 0 ? FLOW[Math.min(step, FLOW.length - 1)] : null;
  return (
    <Stage eyebrow="Markaziy · so'rov yo'li" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni oxirigacha kuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Admin <span className="mono" style={{ color: T.accent }}>POST /car</span> bosdi — so'rov qanday <span className="italic" style={{ color: T.accent }}>sayohat</span> qiladi?</h2></div>
        <Mentor>Siz qurgan resurs orqali bitta so'rovni kuzatamiz. Har bekat — siz yozgan fayllardan biri. Tugmani bosib, oxirigacha boring.</Mentor>
        <div className="split">
          <Col>
            <div className="flow-rail fade-up delay-1">
              {FLOW.map((f, i) => {
                const lit = step >= i;
                return (
                  <div key={f.k} className="flow-stop" style={{ opacity: lit ? 1 : 0.35 }}>
                    <span className="flow-ico" style={{ background: lit ? T.accent : T.paper, color: lit ? '#fff' : T.ink3 }}>{f.icon}</span>
                    <span className="flow-k" style={{ color: lit ? T.ink : T.ink3 }}>{f.k}</span>
                    {i < FLOW.length - 1 && <span className="flow-down" style={{ color: step > i ? T.accent : T.ink3 + '66' }}>↓</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={adv}>{step < 0 ? "▶ So'rovni yuborish" : (done ? '✓ Javob qaytdi' : 'Keyingi bekat →')}</button>
            {cur && <div className="sk-info fade-step" key={step}><p className="note-h"><span style={{ fontSize: 20, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.k}</span> · {cur.r}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana butun yo'l — hammasi siz qurgan 5 fayl orqali o'tdi. Endi Swagger'da tirik ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — AGENT YARATADI (playbook → 5 fayl) =====
const PLAYBOOK_FILES = [
  { f: 'car.entity.ts', d: 'brand · model · price · is_available' },
  { f: 'dto/create-car.dto.ts', d: 'qoidalar (@IsString, @IsNumber)' },
  { f: 'dto/update-car.dto.ts', d: 'PartialType(CreateCarDto)' },
  { f: 'car.service.ts', d: 'BaseService meros — CRUD tekin' },
  { f: 'car.controller.ts', d: 'create · findAll · findOne · update · remove' },
  { f: 'car.module.ts → AppModule', d: 'ro\'yxatga olib, ulaydi' }
];
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TOTAL = PLAYBOOK_FILES.length;
  const [n, setN] = useState(storedAnswer ? TOTAL : 0);
  const [running, setRunning] = useState(false);
  const [sc, setSc] = useState(0);
  const done = n >= TOTAL;
  useEffect(() => {
    if (!running) return;
    if (n >= TOTAL) { setRunning(false); return; }
    const t = setTimeout(() => { setN(x => x + 1); setSc(s => s + 1); }, 600);
    return () => clearTimeout(t);
  }, [running, n]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const run = () => { if (running || done) return; setN(0); setRunning(true); };
  return (
    <Stage eyebrow="Agent · yaratish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Playbookni yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sekin qo'lda qildik — agent buni necha <span className="italic" style={{ color: T.accent }}>soniyada</span> quradi?</h2></div>
        <Mentor>Endi 5 qadamni tushunasiz — demak agentga ham aniq buyruq bera olasiz. Mana sizning <b style={{ color: T.ink }}>playbook</b>ingiz. Uni agentga yuboring — u fayllarni o'zi yozib beradi.</Mentor>
        <div className="split">
          <Col>
            <div className="prompt-box fade-up delay-1">
              <span className="agent-lbl">💬 Agentga playbook</span>
              <p className="agent-msg" style={{ marginBottom: 0 }}>"Avtosalon uchun Car resursini qo'sh: Entity (brand, model, price, is_available) → create/update DTO → BaseService'dan meros service → CRUD controller → module va uni AppModule'ga ula."</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={running || done} onClick={run}>{done ? '✓ Yozildi' : (running ? '⏳ Agent yozyapti…' : '▶ Playbookni agentga yuborish')}</button>
            <AgentCard>Bir buyruqning o'zi — chunki agent 5 qadamni qaysi tartibda qilishni siz aytib berdingiz.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">Agent yaratayotgan fayllar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {PLAYBOOK_FILES.map((file, i) => {
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
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Agent 5 qadamni soniyalarda bajardi! Lekin diqqat — agent ham shoshib xato qiladi. Keyingi ekranda uning kodini <b>tekshiramiz</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — DEBUG: agent xato qildi (begona qator) =====
const Screen17 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [openId, setOpenId] = useState(storedAnswer ? 'POST/car' : null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['POST/car']) : new Set());
  const [sc, setSc] = useState(0);
  const done = fixed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pickBad = () => { if (found) return; setFound(true); setSc(n => n + 1); };
  const pickGood = () => { if (found || fixed) return; setSc(n => n + 1); };
  const fix = () => { setFixed(true); setSc(n => n + 1); };
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Debugging · nazoratchi" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Oxirgi qadam →' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agent yozdi — lekin <span className="mono" style={{ color: T.accent }}>/car</span> xato beryapti. <span className="italic" style={{ color: T.accent }}>Qayerda</span> adashgan?</h2></div>
        <Mentor>Agent shoshib, bitta qatorni <b style={{ color: T.ink }}>noto'g'ri faylga</b> qo'ygan. Siz — <b style={{ color: T.ink }}>NAZORATCHI</b>. <span className="mono">car.controller.ts</span> ni o'qing: controller'ga tegishli bo'lmagan begona qatorni bosib toping.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana CarController kodingiz! (lekin /car ishlamayapti 🤔)</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default', opacity: 0.85 }}><span style={{ color: CODE.attr }}>@Controller</span>{"('car') {"}</div>
                <div className="ai-line" onClick={pickGood} title="to'g'ri qator"><span style={{ color: CODE.attr }}>@Post</span>{'()  create('}<span style={{ color: CODE.attr }}>@Body</span>{'() dto) { ... }'}</div>
                <div className="ai-line" onClick={pickGood} title="to'g'ri qator"><span style={{ color: CODE.attr }}>@Get</span>{'()  findAll() { ... }'}</div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickBad}><span style={{ color: CODE.attr }}>@Column</span>{'()  price: '}<span style={{ color: CODE.str }}>number</span>{';'}{fixed ? '' : '   // ?'}</div>
                <div className="ai-line" onClick={pickGood} title="to'g'ri qator"><span style={{ color: CODE.attr }}>@Delete</span>{"(':id')  remove(...) { ... }"}</div>
                <div className="ai-line" style={{ cursor: 'default', opacity: 0.85 }}>{'}'}</div>
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 Begona @Column qatorini olib tashlash</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — controller endi toza!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Har qatorni o'qing: <span className="mono">@Column</span> qaysi qatlamga tegishli edi? Begona qatorni bosing.</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">@Column</span> — bu <b>Entity</b> qatori (jadval ustuni), controller'da turibdi. Shuning uchun kod buziladi. Chap tomondagi tugma bilan olib tashlang →</p></div>}
            {fixed && <>
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Debug qildingiz!</p><p className="ta-sub">Kodni o'qib, begona qatorni topib, tuzatdingiz — agent ustidan nazorat shu</p></div>
              <CarSwagger available={true} openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
            </>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 18 — YAKUNIY: yangi ustunni qo'lda yozish =====
const Screen18 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.toLowerCase();
  const hasCol = /@column/.test(v);
  const hasYear = /\byear\b/.test(v);
  const hasNum = /\bnumber\b/.test(v);
  const valid = hasCol && hasYear && hasNum;
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'car.entity.ts ga year ustunini yozing', correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Ustunni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: mashinaga <span className="italic" style={{ color: T.accent }}>yangi ustunni</span> o'zingiz qo'shing.</h2></div>
        <Mentor>Avtosalon mashinaning ishlab chiqarilgan <b style={{ color: T.ink }}>yilini</b> ham saqlamoqchi. <span className="mono">car.entity.ts</span> ga <span className="mono">year</span> ustunini <b style={{ color: T.ink }}>o'zingiz</b> yozing — raqam (number) bo'lsin. Namuna: <span className="mono">@Column() year: number;</span></Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">car.entity.ts — yangi qatorni yozing</p>
            <div className="editor">
              <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">car.entity.ts</span></div>
              <div className="editor-body">
                <pre className="editor-code">{'@Entity'}{"('cars')"}{'\n'}{'export class CarEntity extends BaseEntity {'}{'\n'}{'  @Column()  brand: string;'}{'\n'}{'  ...'}{'\n'}</pre>
                <input className={`code-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="@Column() year: number;" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                <pre className="editor-code">{'}'}</pre>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasCol ? 1 : 0.4 }}>{hasCol ? '✓' : '1'} @Column()</span>
              <span className="tagpill" style={{ opacity: hasYear ? 1 : 0.4 }}>{hasYear ? '✓' : '2'} year</span>
              <span className="tagpill" style={{ opacity: hasNum ? 1 : 0.4 }}>{hasNum ? '✓' : '3'} number</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">cars jadvali</p>
            <div className="frame" style={{ padding: 14, minHeight: 120 }}>
              <div className="ent-row free">id, created_at, updated_at <span>← BaseEntity</span></div>
              <div className="ent-row siz">brand, model, price, is_available <span>← siz yozgansiz</span></div>
              {valid
                ? <div className="ent-row free el-in" style={{ background: T.successSoft }}>year (number) <span>← yangi! ✓</span></div>
                : <div className="ent-row" style={{ background: T.bg, color: T.ink3, fontStyle: 'italic' }}>year ustuni — to'liq yozing…</div>}
            </div>
            {passed
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Endi mashinaga o'zingiz ustun qo'shdingiz. Entity'ni tushunsangiz — istalgan jadvalga istalgan ustunni qo'sha olasiz.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>To'liq yozing: <span className="mono" style={{ fontStyle: 'normal' }}>@Column()</span> + <span className="mono" style={{ fontStyle: 'normal' }}>year</span> + <span className="mono" style={{ fontStyle: 'normal' }}>number</span>.</p>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 19 — YAKUN =====
const Screen19 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Har resurs = 5 qadam: Entity → DTO → Service → Controller → Module",
    "Entity — jadval shakli; id va vaqtlar BaseEntity'dan tekin",
    "DTO — kelgan ma'lumot qoidalari (bo'sh brand → 400)",
    "Service — BaseService'dan meros: CRUD tekin keladi",
    "CarModule'ni AppModule'ga ulash (aks holda 404)",
    "Agent yozgan kodni tekshirish: har qator o'z qatlamida (debug)"
  ];
  const HOMEWORK = [
    { b: 'O\'z resursingiz', t: "— masalan Order (buyurtma) yoki Client (mijoz): 5 qadamni qog'ozga yozing" },
    { b: 'Playbook', t: "— har qadam uchun agentga beradigan promptni tayyorlang" },
    { b: 'Tekshiruv', t: "— AppModule'ga ulanganini va Swagger'da ko'rinishini tasavvur qiling" }
  ];
  const GLOSSARY = [
    { b: 'Resurs', t: '— ilova boshqaradigan bir tur ma\'lumot (mashina, mijoz...)' },
    { b: 'Entity', t: '— jadval shakli (ustunlar)' },
    { b: 'BaseEntity', t: '— id, created_at, updated_at tekin' },
    { b: 'DTO', t: '— kelgan ma\'lumot qoidalari (anketa)' },
    { b: 'PartialType', t: '— create DTO\'ni ixtiyoriy qiladi (update)' },
    { b: 'BaseService', t: '— tekin CRUD (meros)' },
    { b: 'Controller', t: '— so\'rov eshiklari (@Get/@Post)' },
    { b: 'Module', t: '— bo\'limni ulaydi (forFeature)' },
    { b: 'AppModule', t: '— modulni ro\'yxatga oladi (imports)' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Mashinalar resursini qo'shdingiz</span><h2 className="title h-title fade-up d1">Endi <span className="italic" style={{ color: T.accent }}>yangi resurs qo'sha olasiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Mashinalar jadvalini noldan qurdingiz: 5 qadam + ulash. Har faylning nega kerakligini tushuntira olasiz." : "Yaxshi harakat! 5 qadam tartibini va ulashni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi — PRAKTIKA: o'z mini-loyihangiz uchun 2–3 resurs quring (Avtosalon / Kutubxona / Do'kon), agentni shu playbook bilan boshqarib!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function NestArchResourceLesson({ lang: langProp, onFinished }) {
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

        /* AGENT FILE GENERATION (s16) */
        .gen-file { display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 9px; padding: 9px 12px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-size: 12px; transition: all 0.2s; }
        .gen-file.ready { box-shadow: inset 0 0 0 1.5px ${T.success}33, 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .gen-ico { font-weight: 800; min-width: 16px; text-align: center; }
        .gen-file .mono { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .gen-d { font-size: 10px; color: ${T.ink2}; font-weight: 600; margin-left: auto; text-align: right; }

        /* AI DEBUG CARD (s17) */
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

        /* CODE INPUT (s18) */
        .code-input { display: block; width: 100%; margin: 2px 0; background: rgba(0,122,204,0.12); border: 1px dashed #4FA8D8; border-radius: 6px; color: ${CODE.text}; font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); padding: 7px 9px; outline: none; }
        .code-input.ok { border: 1.5px solid ${T.success}; background: rgba(31,122,77,0.18); }

        /* SWAGGER */
        .swg { border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.18); }
        .swg-top { background: #173647; color: #fff; padding: 10px 13px; font-family: 'Manrope'; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 8px; } .swg-dot { width: 8px; height: 8px; border-radius: 50%; background: #49cc90; } .swg-ver { font-family: 'JetBrains Mono'; font-weight: 400; font-size: 11px; color: #9FB4D8; margin-left: auto; }
        .swg-row { border-bottom: 1px solid #eee; }
        .swg-head { width: 100%; display: flex; align-items: center; gap: 9px; padding: 9px 11px; background: #fff; border: none; cursor: pointer; text-align: left; }
        .swg-head:hover { background: #FBFAF7; }
        .swg-m { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: #fff; padding: 3px 8px; border-radius: 5px; min-width: 52px; text-align: center; }
        .swg-path { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 700; color: ${T.ink}; }
        .swg-sum { font-size: 11px; color: ${T.ink3}; margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .swg-chev { margin-left: auto; color: ${T.ink3}; font-size: 11px; }
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
