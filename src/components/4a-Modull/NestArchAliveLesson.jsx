import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';

// ============================================================
// NEST ARXITEKTURA MODULI · DARS 1 — ARXITEKTURANI TIRIK KO'RISH — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: tayyor NestJS boilerplate'ni clone qilib ishga tushirish, Swagger'da tirik API ko'rish, fayl xaritasi, so'rov yo'li.
// Repo: https://github.com/Azizbekcrypto/IntroNestArxitechture
// Birlashtiruvchi analogiya: RESTORAN (controller=ofitsiant, dto=anketa, service=oshpaz, entity=ombor, guard=qo'riqchi, module=bo'lim).
// O'rtada tushunchalar: Entity/BaseEntity, DTO+validatsiya, BaseService (tayyor CRUD), Module+DI. Sikl preview (5 qadam) → Dars 2.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy, "sehr"/"g'isht" yo'q. AUDIOSIZ.
// Yakuniy ekran (s17): mock terminal — `git clone <repo>` ni yozish (yangi loyihaning birinchi qadami).
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

const LESSON_META = { lessonId: 'nest-arch-alive-v16', lessonTitle: { uz: 'Nest arxitektura — tirik ko\'rish', ru: 'Nest архитектура — живой обзор' } };
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
  { id: 's9',  type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's17', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's18', type: 'builder',     template: 'custom',   scored: false, scope: null },
  { id: 's19', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
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
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .swg-row, .tree-row');
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
const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
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

// ===== MOCK TERMINAL =====
const REPO = 'https://github.com/Azizbekcrypto/IntroNestArxitechture';
const Term = ({ title = 'Terminal', children, minH }) => (
  <div className="term"><div className="term-bar"><span className="bb-dots"><i /><i /><i /></span><span className="term-title">{title}</span></div><div className="term-body" style={{ minHeight: minH }}>{children}</div></div>
);
const TLine = ({ cmd, out, col }) => (
  <div className="el-in tline">{cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : <span style={{ color: col || CODE.comment }}>{out}</span>}</div>
);

// ===== MOCK SWAGGER =====
const M_COLOR = { GET: T.blue, POST: T.success, PATCH: T.amber, DELETE: T.danger };
const ENDPOINTS = [
  { id: 'e1', m: 'POST', path: '/admin/signin', sum: 'Tizimga kirish', resp: '{\n  "statusCode": 200,\n  "message": "success",\n  "data": { "token": "eyJhbGci..." }\n}' },
  { id: 'e2', m: 'GET', path: '/admin', sum: 'Adminlar ro\'yxati', resp: '{\n  "statusCode": 200,\n  "data": [ { "id": "a1f...", "username": "ali" } ]\n}' },
  { id: 'e3', m: 'POST', path: '/admin', sum: 'Yangi admin', resp: '{ "statusCode": 201, "message": "success" }' },
  { id: 'e4', m: 'GET', path: '/admin/{id}', sum: 'Bitta admin', resp: '{ "statusCode": 200, "data": { "id": "a1f...", "username": "ali" } }' },
  { id: 'e5', m: 'DELETE', path: '/admin/{id}', sum: 'Adminni o\'chirish', resp: '{ "statusCode": 200, "message": "success" }' }
];
const Swagger = ({ openId, onToggle, triedIds, onTry }) => (
  <div className="swg">
    <div className="swg-top"><span className="swg-dot" /> AvtoNest API <span className="swg-ver">/api/v1</span></div>
    {ENDPOINTS.map(e => {
      const open = openId === e.id;
      const tried = triedIds.has(e.id);
      return (
        <div key={e.id} className="swg-row">
          <button className="swg-head" onClick={() => onToggle(e.id)}>
            <span className="swg-m" style={{ background: M_COLOR[e.m] }}>{e.m}</span>
            <span className="swg-path">{e.path}</span>
            <span className="swg-sum">{e.sum}</span>
            <span className="swg-chev">{open ? '▾' : '▸'}</span>
          </button>
          {open && (
            <div className="swg-detail el-in">
              {!tried
                ? <button className="btn-soft" onClick={() => onTry(e.id)} style={{ alignSelf: 'flex-start' }}>▶ Try it out</button>
                : <><div className="swg-code-lbl">Javob · <span style={{ color: T.success }}>200</span></div><pre className="json">{e.resp}</pre></>}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ===== FAYL DARAXTI =====
const TREE = [
  { k: 'core/', role: 'Domen modeli', d: "Jadval shakllari (entity) va omborchi (repository). Ma'lumot qanday ko'rinishda saqlanadi.", kids: ['entity/Base.entity.ts', 'entity/admin.entity.ts', 'repository/admin.repository.ts'] },
  { k: 'api/', role: 'Domenlar (oshxona bo\'limlari)', d: "Har bir mavzu (admin, auth...) — controller + service + module + dto. Mijoz bilan ishlaydigan qism.", kids: ['admin/  (controller · service · module · dto)', 'auth/', 'app.module.ts'] },
  { k: 'infrastructure/', role: 'Tayyor asboblar', d: "Bir marta yasalgan, hamma joyda ishlatiladigan jihozlar: BaseService, token, crypto, pagination, javob, xato.", kids: ['base/base.service.ts', 'lib/token · lib/crypto', 'pagination · response · exception'] },
  { k: 'common/', role: 'Umumiy yordamchilar', d: "Qo'riqchilar (guard), maxsus dekoratorlar, qoidalar (interface, enum).", kids: ['guard/  (auth · roles)', 'decorator/', 'interface/ · enum/'] }
];

// ===== RESTORAN ROLLARI =====
const ROLES = [
  { layer: 'Controller', icon: '🤵', role: 'Ofitsiant', d: "So'rovni qabul qiladi, javobni qaytaradi. @Get / @Post eshiklari." },
  { layer: 'DTO', icon: '📝', role: 'Buyurtma anketasi', d: "Kelgan ma'lumot to'g'rimi? Maydonlar va qoidalar (validatsiya)." },
  { layer: 'Service', icon: '👨‍🍳', role: 'Oshpaz', d: 'Asosiy ish va mantiq: parolni hash qilish, tekshirish.' },
  { layer: 'BaseService', icon: '📖', role: 'Tayyor retseptlar', d: 'CRUD (qo\'shish/o\'qish/o\'zgartirish/o\'chirish) tayyor keladi.' },
  { layer: 'Entity', icon: '📦', role: 'Ombor shakli', d: 'Jadval ko\'rinishi: qaysi ustunlar bor (id, username...).' },
  { layer: 'Module', icon: '🧩', role: 'Bo\'lim', d: 'Controller + service + repository — hammasini bir joyga ulaydi.' },
  { layer: 'Guard', icon: '🛡️', role: 'Eshik qo\'riqchisi', d: 'Kirishga ruxsatmi? Token bormi? Bo\'lmasa — 401.' }
];

// ===== SO'ROV YO'LI (request flow) =====
const FLOW = [
  { k: "So'rov", icon: '📨', r: 'Mijoz buyurtmasi', d: 'POST /admin — yangi admin qo\'shmoqchimiz.' },
  { k: 'Guard', icon: '🛡️', r: 'Qo\'riqchi', d: 'Token bormi, ruxsatmi? Yo\'q bo\'lsa — 401 va to\'xtaydi.' },
  { k: 'Controller', icon: '🤵', r: 'Ofitsiant', d: 'So\'rovni qabul qiladi, create() metodini chaqiradi.' },
  { k: 'DTO', icon: '📝', r: 'Anketa tekshiruvi', d: 'Maydonlar to\'g\'rimi? (ValidationPipe). Xato bo\'lsa — 400.' },
  { k: 'Service', icon: '👨‍🍳', r: 'Oshpaz', d: 'Asosiy ish: parolni hash qiladi, takror bormi tekshiradi.' },
  { k: 'BaseService', icon: '📖', r: 'Tayyor retsept', d: 'repository.save() — yozishni bajaradi.' },
  { k: 'PostgreSQL', icon: '🗄️', r: 'Ombor', d: 'Ma\'lumot bazaga yoziladi.' },
  { k: 'successRes', icon: '🎁', r: 'Qadoqlash', d: '{ statusCode, message, data } — bir xil shakl.' },
  { k: 'Javob', icon: '✅', r: 'Mijozga', d: '201 Created — tayyor!' }
];

// ===== SCREEN 0 — HOOK (1 fayl chalkash vs tartibli) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [shaking, setShaking] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const poke = () => { setTried(true); setSc(n => n + 1); clearTimeout(timer.current); setShaking(true); timer.current = setTimeout(() => setShaking(false), 450); };
  const OPTS = [
    { id: 'a', label: "Hammasini yana bitta faylga yozamiz" },
    { id: 'b', label: "Tartibli arxitektura — har narsa o'z joyida" },
    { id: 'c', label: "Loyihani tashlab ketamiz" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Katta backend bitta faylga sig'adimi — uni <span className="italic" style={{ color: T.accent }}>boshqarib bo'ladimi</span>?</h1>
        <Mentor>Oldingi modulda hamma narsani bitta faylga yozar edingiz. Loyiha o'sganda u 1000+ qatorli chalkashlikka aylanadi. Quyidagi ulkan fayldan <b style={{ color: T.ink }}>"login" kodini toping</b> — bosib ko'ring.</Mentor>
        <Split>
          <Col>
            <p className="flow-label fade-up delay-1">server.js — 1240 qator 😵</p>
            <div className={`fade-up delay-1 ${shaking ? 'shake' : ''}`}>
              <div className="messy" onClick={poke}>
                <p>{"app.get('/a') app.post('/b') const db = ..."}</p>
                <p>{"function x() ... let token = ... if (role) ..."}</p>
                <p>{"app.put('/c') hash(pw) jwt.sign SELECT * FROM"}</p>
                <p>{"app.delete() cors() bcrypt app.post('/login')"}</p>
                <p>{"const pool = ... try ... catch ... app.get('/d')"}</p>
                <p style={{ color: T.danger }}>{"// login qayerda??? 1000 qator pastda..."}</p>
              </div>
            </div>
            {tried && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Topib bo'lmaydi — hammasi aralash. O'sganda bunaqa kod jamoaga azob!</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Katta loyiha o'sib borishi uchun nima kerak?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval ulkan faylni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Professional jamoalar har narsani <b>o'z joyiga</b> qo'yadigan tartibli <b>arxitektura</b> ishlatadi (NestJS). Bugun tayyor shunday skeletni <b>clone qilib</b>, uni tirik ko'ramiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Clone qilib ishga tushiramiz', tag: 'git clone + run' },
    { text: 'Swagger\'da tirik API ko\'ramiz', tag: 'API hujjati' },
    { text: 'Fayl xaritasini o\'rganamiz', tag: 'qaysi papka nima' },
    { text: 'Bitta so\'rovning yo\'lini kuzatamiz', tag: 'restoran' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Bugun ko'radiganingiz — tirik API</p>
      <Swagger openId={'e1'} onToggle={() => { }} triedIds={new Set(['e1'])} onTry={() => { }} />
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
        <div className="head"><h2 className="title h-title fade-up">Tayyor arxitektura qanday <span className="italic" style={{ color: T.accent }}>ishlaydi</span> — o'zimiz ko'ramiz?</h2></div>
        <Mentor>Bugun kod <b style={{ color: T.ink }}>yozmaymiz</b> — tayyor professional skeletni clone qilib, qanday ishlashini ko'ramiz. Yordamchi g'oya: arxitektura — bu bir <b style={{ color: T.ink }}>restoran</b>. Har bo'limning o'z vazifasi bor. Dars oxirida bitta so'rovning butun yo'lini tushuntira olasiz.</Mentor>
        {!isNarrow ? <Split>{Preview}{StepsB}</Split>
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — CLONE + INSTALL =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 2 : 0);
  const [sc, setSc] = useState(0);
  const done = step >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const go = () => { setStep(s => Math.min(s + 1, 2)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="1-qadam · clone" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '2 qadamni bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi loyihani <span className="italic" style={{ color: T.accent }}>noldan</span> yozamizmi?</h2></div>
        <Mentor>Yo'q! Professional dasturchi tayyor, tekshirilgan <b style={{ color: T.ink }}>skeletni clone qiladi</b>. Ikki buyruq: <span className="mono">git clone</span> (yuklab oladi) va <span className="mono">npm install</span> (kerakli paketlarni o'rnatadi). Tugmani bosib bajaring.</Mentor>
        <Split>
          <Col>
            <Term title="bash" minH={150}>
              <TLine cmd={`git clone ${REPO}`} />
              {step >= 1 && <><TLine out="Cloning into 'IntroNestArxitechture'..." /><TLine out="✓ yuklab olindi" col={CODE.str} /></>}
              {step >= 1 && <TLine cmd="cd IntroNestArxitechture && npm install" />}
              {step >= 2 && <><TLine out="added 412 packages" /><TLine out="✓ paketlar o'rnatildi" col={CODE.str} /></>}
            </Term>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={go}>{step === 0 ? '▶ git clone' : (step === 1 ? '▶ npm install' : '✓ Tayyor')}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>git clone</b> — GitHub'dagi tayyor loyihani kompyuteringizga ko'chiradi.</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>npm install</b> — loyiha ishlashi uchun kerakli kutubxonalarni yuklaydi (NestJS, TypeORM...).</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Skelet tayyor! Endi bazaga ulab, serverni ishga tushiramiz.</p></div>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — .env + RUN =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 2 : 0); // 0 boshlang'ich, 1 .env, 2 run
  const [sc, setSc] = useState(0);
  const done = step >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const go = () => { setStep(s => Math.min(s + 1, 2)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="1-qadam · ishga tushirish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Serverni yoqing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server qaysi <span className="italic" style={{ color: T.accent }}>bazaga</span> ulanishini qayerdan biladi?</h2></div>
        <Mentor>Maxfiy sozlamalar (baza manzili, kalitlar) kodga emas, <span className="mono">.env</span> fayliga yoziladi — bu xavfsiz. Keyin <span className="mono">npm run start:dev</span> serverni yoqadi. Ikki qadamni bajaring.</Mentor>
        <Split>
          <Col>
            {step < 1
              ? <pre className="code-box" style={{ lineHeight: 1.9 }}><Cm>{'# .env  (maxfiy sozlamalar)'}</Cm>{'\n'}{'PORT='}<St>3000</St>{'\n'}{'DEV_DB_URL='}<St>postgres://localhost/nest_db</St>{'\n'}{'Access_Token_Key='}<St>maxfiy_kalit</St></pre>
              : <Term title="bash" minH={120}><TLine cmd="npm run start:dev" />{step >= 2 && <><TLine out="Nest application successfully started" col={CODE.str} /><TLine out="server running on port 3000 ✓" col={CODE.str} /></>}{step < 2 && <TLine out="ishga tushyapti..." />}</Term>}
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={go}>{step === 0 ? '✓ .env to\'ldirildi → run' : (step === 1 ? '▶ npm run start:dev' : '✓ Server ishlayapti')}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>.env</b> — maxfiy kalitlar shu yerda. GitHub'ga yuklanmaydi (.gitignore).</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>start:dev</b> — serverni yoqadi va o'zgarishlarni avtomatik kuzatadi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Server tirik — <span className="mono">localhost:3000</span>! Hozircha bir qator ham yozmadingiz. Endi API'ni ko'ramiz.</p></div>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Maxfiy sozlamalar (baza manzili, kalitlar) qayerga yoziladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Maxfiy sozlamalar <span className="italic" style={{ color: T.accent }}>qayerga</span> yoziladi?</h2></>}
    options={['.env fayliga — kodga emas, GitHub\'ga yuklanmaydi', 'To\'g\'ridan-to\'g\'ri kod ichiga', 'Swagger ichiga', 'README faylga']} correctIdx={0}
    explainCorrect="To'g'ri! Maxfiy kalitlar .env faylida saqlanadi va .gitignore orqali GitHub'ga chiqmaydi — bu xavfsizlik."
    explainWrong={{
      1: "Kodga yozsangiz, GitHub'da hamma ko'radi — xavfli. To'g'risi: .env.",
      2: "Swagger — API hujjati, sozlama joyi emas. To'g'risi: .env.",
      3: "README — tavsif fayli. Maxfiy sozlamalar .env'da.",
      default: "Maxfiy sozlamalar = .env fayli."
    }} />
);

// ===== SCREEN 5 — SWAGGER (tirik API) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [openId, setOpenId] = useState(storedAnswer ? 'e1' : null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['e1']) : new Set());
  const [sc, setSc] = useState(0);
  const done = tried.size >= 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  return (
    <Stage eyebrow="2-qadam · Swagger" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bitta endpointni sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hech narsa yozmadik — <span className="italic" style={{ color: T.accent }}>API qayerda</span>?</h2></div>
        <Mentor><b style={{ color: T.ink }}>Swagger</b> — bu ishlaydigan API'ning avtomatik hujjati. <span className="mono">localhost:3000/api/v1</span> ni oching: barcha eshiklar (endpointlar) ko'rinadi. Bittasini ochib, <b style={{ color: T.ink }}>"Try it out"</b> bilan sinab ko'ring — javob keladi.</Mentor>
        <Split>
          <Col>
            <Swagger openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Rangli yorliqlar — <b style={{ color: T.blue }}>GET</b> (o'qish), <b style={{ color: T.success }}>POST</b> (qo'shish), <b style={{ color: T.amber }}>PATCH</b> (o'zgartirish), <b style={{ color: T.danger }}>DELETE</b> (o'chirish).</p></div>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? API <b>tirik</b> — bir qator ham yozmadingiz, lekin to'liq ishlaydigan admin tizimi bor. Bularning hammasini skelet bergan. Endi: bu qayerda turibdi?</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Endpointni bosib oching → "Try it out" → javobni ko'ring.</p></div>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — FAYL DARAXTI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(TREE.map(t => t.k)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= TREE.length;
  const tap = (k) => { setActive(k); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = TREE.find(t => t.k === active);
  return (
    <Stage eyebrow="3-qadam · xarita" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Papkalarni oching (${seen.size}/${TREE.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu papkalar nima — <span className="italic" style={{ color: T.accent }}>qayerda nima</span> turadi?</h2></div>
        <Mentor>Skeletning <span className="mono">src/</span> papkasi 4 ta asosiy qismga bo'lingan. Har birini bosing — ichida nima borligini va vazifasini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="tree fade-up delay-1">
              <div className="tree-root">📁 src/</div>
              {TREE.map(t => (
                <button key={t.k} className={`tree-row ${active === t.k ? 'on' : ''}`} onClick={() => tap(t.k)}>
                  <span className="tree-folder">📁 {t.k}</span>
                  <span className="tree-role">{t.role}</span>
                  <span className="tree-seen" style={{ color: seen.has(t.k) ? T.success : T.ink3 }}>{seen.has(t.k) ? '✓' : ''}</span>
                </button>
              ))}
              <div className="tree-root" style={{ opacity: 0.6 }}>📄 main.ts · config/</div>
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h" style={{ color: T.accent }}>📁 {cur.k} <span style={{ color: T.ink2, fontWeight: 500 }}>· {cur.role}</span></p><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>{cur.d}</p><div className="tree-kids">{cur.kids.map((k, i) => <div key={i} className="tree-kid">📄 {k}</div>)}</div></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Papkani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana xarita: <span className="mono">core</span> (model), <span className="mono">api</span> (domenlar), <span className="mono">infrastructure</span> (asboblar), <span className="mono">common</span> (yordamchilar). Endi bularni restoran bilan tushunamiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — RESTORAN ROLLARI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(ROLES.map(r => r.layer)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= ROLES.length;
  const tap = (l) => { setActive(l); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(l); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = ROLES.find(r => r.layer === active);
  return (
    <Stage eyebrow="Analogiya · restoran" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Rollarni ko'ring (${seen.size}/${ROLES.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Arxitektura — aslida bir <span className="italic" style={{ color: T.accent }}>restoran</span>.</h2></div>
        <Mentor>Har qatlam — restoranning bir bo'limi, har birining aniq vazifasi bor. Bularni bosib o'rganing — keyin so'rov yo'lini ko'rganda hammasi joyiga tushadi.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ROLES.map(r => (
                <button key={r.layer} className="vcard" onClick={() => tap(r.layer)} style={{ boxShadow: active === r.layer ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{r.icon}</span>
                  <span className="vlbl mono">{r.layer}</span>
                  <span className="role-r">{r.role}</span>
                  <span className="vseen" style={{ color: seen.has(r.layer) ? T.success : T.ink3 }}>{seen.has(r.layer) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span style={{ fontSize: 22, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.layer}</span> = {cur.role}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bo'limni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi har "bo'lim"ni bilasiz. Keling, bitta so'rov shu restoran bo'ylab qanday sayohat qilishini ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} idx={8} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Controller (ofitsiant) nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Controller</span> (ofitsiant) <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['So\'rovni qabul qilib, javobni qaytaradi (eshik)', 'Ma\'lumotni bazaga yozadi', 'Parolni hash qiladi', 'Loyihani ishga tushiradi']} correctIdx={0}
    explainCorrect="To'g'ri! Controller — ofitsiant: so'rovni qabul qiladi va mos metodni chaqirib, javobni qaytaradi. Asosiy ishni service (oshpaz) bajaradi."
    explainWrong={{
      1: "Bazaga yozish — repository/service ishi (omborchi/oshpaz). Controller — eshik.",
      2: "Parol hash — service (oshpaz) ishi. Controller faqat qabul qiladi va qaytaradi.",
      3: "Ishga tushirish — main.ts. Controller — so'rovlar eshigi.",
      default: "Controller = so'rovni qabul qilib javob qaytaradi (ofitsiant)."
    }} />
);

// ===== SCREEN 9 — CASE: SO'ROV YO'LI =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? FLOW.length : -1);
  const [sc, setSc] = useState(0);
  const done = step >= FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const adv = () => { setStep(s => Math.min(s + 1, FLOW.length - 1)); setSc(n => n + 1); };
  const cur = step >= 0 ? FLOW[Math.min(step, FLOW.length - 1)] : null;
  return (
    <Stage eyebrow="Markaziy · so'rov yo'li" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni oxirigacha kuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta so'rov ichkarida qaysi <span className="italic" style={{ color: T.accent }}>yo'ldan</span> o'tadi?</h2></div>
        <Mentor>Tasavvur qiling: kimdir <span className="mono">POST /admin</span> yubordi (mijoz buyurtma berdi). U restoran bo'ylab bosqichma-bosqich o'tadi. Tugmani bosib, har bekatni yoqing.</Mentor>
        <div className="flow-grid fade-up delay-1">
          {FLOW.map((f, i) => {
            const lit = step >= i;
            return (
              <div key={f.k} className={`fg-card ${lit ? 'lit' : ''} ${cur && cur.k === f.k ? 'cur' : ''}`}>
                <span className="fg-n" style={{ color: lit ? T.accent : T.ink3 }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="fg-ico" style={{ opacity: lit ? 1 : 0.4, filter: lit ? 'none' : 'grayscale(1)' }}>{f.icon}</span>
                <span className="fg-k" style={{ color: lit ? T.ink : T.ink3 }}>{f.k}</span>
              </div>
            );
          })}
        </div>
        <div className="flow-ctl">
          <button className="btn" style={{ flexShrink: 0 }} disabled={done} onClick={adv}>{step < 0 ? "▶ So'rovni yuborish" : (done ? '✓ Javob qaytdi' : 'Keyingi bekat →')}</button>
          {cur && <div className="sk-info fade-step" key={step} style={{ flex: 1, minWidth: 0 }}><p className="note-h"><span style={{ fontSize: 20, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.k}</span> · {cur.r}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana butun yo'l! Har bekat o'z ishini qiladi — shuning uchun kod tartibli va xatoni topish oson. Bu — arxitekturaning kuchi.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TEST 3 =====
const Screen10 = (props) => (
  <QuestionScreen {...props} idx={10} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="So'rov serverga kelganda birinchi kimga uchraydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>So'rov <span className="italic" style={{ color: T.accent }}>birinchi</span> kimga uchraydi?</h2></>}
    options={['Guard — qo\'riqchi (ruxsat tekshiriladi)', 'PostgreSQL — to\'g\'ri bazaga', 'successRes — qadoqlash', 'Service — oshpaz']} correctIdx={0}
    explainCorrect="To'g'ri! Avval qo'riqchi (guard) tekshiradi: token bormi, ruxsatmi? Faqat o'tgach controller'ga boradi. Ruxsat yo'q bo'lsa — 401."
    explainWrong={{
      1: "Baza — eng oxirida. Avval qo'riqchi (guard) ruxsatni tekshiradi.",
      2: "successRes — javobni qadoqlash, oxirida. Birinchi — guard.",
      3: "Service ishni keyinroq qiladi. Eng avval qo'riqchi (guard).",
      default: "Birinchi — guard (qo'riqchi)."
    }} />
);

// ===== SCREEN 11 — ENTITY =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · Entity" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'BaseEntity sovg\'asini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>Entity</span> — jadval <span className="italic" style={{ color: T.accent }}>shakli</span>. Nimani saqlaymiz?</h2></div>
        <Mentor>Entity — bazadagi jadval ko'rinishi (qaysi ustunlar bor). Eng zo'r joyi: har entity <span className="mono">BaseEntity</span>'dan meros oladi — <b style={{ color: T.ink }}>id, created_at, updated_at</b> tayyor keladi! Siz faqat o'ziga xos maydonlarni yozasiz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">admin.entity.ts</p>
            <pre className="code-box" style={{ lineHeight: 1.85 }}>
              <Jx>{'@Entity'}</Jx>{"('admins')"}{'\n'}
              <Jx>{'export class'}</Jx>{' AdminEntity '}<Jx>extends</Jx>{' BaseEntity {'}{'\n'}
              {'  '}<At>@Column</At>{'({ unique: '}<Jx>true</Jx>{' })'}{'\n'}
              {'  username: '}<St>string</St>{';'}{'\n'}
              {'  '}<At>@Column</At>{'()  hashed_password: '}<St>string</St>{';'}{'\n'}
              {'  '}<At>@Column</At>{'()  full_name: '}<St>string</St>{';'}{'\n'}
              {'}'}
            </pre>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : '🎁 BaseEntity nima beradi?'}</button>
          </Col>
          <Col>
            <p className="flow-label">{show ? 'BaseEntity — tayyor keladi' : 'Siz yozasiz'}</p>
            <div className="frame" style={{ padding: 14 }}>
              <div className="ent-row siz">username, hashed_password, full_name <span>← siz yozasiz</span></div>
              {show && <><div className="ent-row free el-in">id (uuid) <span>← BaseEntity</span></div><div className="ent-row free el-in">created_at <span>← BaseEntity</span></div><div className="ent-row free el-in">updated_at <span>← BaseEntity</span></div></>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana "siz yozasiz vs tayyor": har jadvalga kerakli <span className="mono">id</span> va vaqtlar avtomatik. Siz faqat o'ziga xosini qo'shasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — DTO + VALIDATSIYA =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [res, setRes] = useState(storedAnswer ? 'bad' : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['ok', 'bad']) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= 2;
  const send = (kind) => { setRes(kind); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(kind); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · DTO" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "To'g'ri va xato so'rovni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>DTO</span> — buyurtma <span className="italic" style={{ color: T.accent }}>anketasi</span>. Ma'lumot to'g'rimi?</h2></div>
        <Mentor>DTO — kelgan ma'lumot qanday bo'lishi <b style={{ color: T.ink }}>kerakligini</b> va qoidalarini belgilaydi (<span className="mono">@IsString</span>, <span className="mono">@IsStrongPassword</span>). Anketani <b style={{ color: T.ink }}>nazoratchi</b> (ValidationPipe) tekshiradi: noto'g'ri bo'lsa — ichkariga kiritmaydi (400). To'g'ri va xato so'rovni yuboring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">create-admin.dto.ts</p>
            <pre className="code-box" style={{ lineHeight: 1.8 }}>
              <At>@IsString</At>{'()  '}<At>@IsNotEmpty</At>{'()'}{'\n'}
              {'username: '}<St>string</St>{';'}{'\n\n'}
              <At>@IsStrongPassword</At>{'()'}{'\n'}
              {'password: '}<St>string</St>{';'}
            </pre>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={() => send('ok')}>✅ To'g'ri: {`{username:'ali', password:'Aa1!xyz'}`}</button>
              <button className="btn-soft" onClick={() => send('bad')}>❌ Xato: {`{username:'', password:'123'}`}</button>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Nazoratchi javobi</p>
            {res === 'ok' && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ 201 — qabul qilindi</p><p className="body" style={{ margin: 0, color: T.ink }}>Anketa to'g'ri to'ldirilgan — ichkariga o'tdi.</p></div>}
            {res === 'bad' && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 400 — rad etildi</p><p className="body" style={{ margin: 0, color: T.ink }}>"username bo'sh bo'lmasin", "password kuchli bo'lsin" — qoidalar buzilgan. Bazaga umuman bormadi.</p></div>}
            {res === null && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>So'rov yuboring ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>DTO + nazoratchi — ilovani ifloslangan ma'lumotdan himoya qiladi. Yomon ma'lumot service'gacha ham yetib bormaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — BASESERVICE (tayyor CRUD) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FREE = ['create', 'findAll', 'findAllWithPagination', 'findOneById', 'update', 'remove'];
  const [seen, setSeen] = useState(storedAnswer ? new Set(FREE) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= 3;
  const tap = (m) => { setActive(m); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(m); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · BaseService" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tekin metodlarni ko'ring (${seen.size}/3+)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Admin CRUD'ni kim yozgan — <span className="italic" style={{ color: T.accent }}>tayyormi</span>?</h2></div>
        <Mentor>Mana arxitekturaning eng kuchli joyi: <span className="mono">BaseService</span> — bir marta yozilgan <b style={{ color: T.ink }}>tayyor retseptlar</b>. Har servis undan meros oladi va CRUD'ni <b style={{ color: T.ink }}>shu yerdan</b> oladi — qayta yozmaydi. Metodlarni bosing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">BaseService — tayyor metodlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {FREE.map(m => <button key={m} className="gchip" onClick={() => tap(m)} style={seen.has(m) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(m) ? '✓ ' : ''}{m}()</button>)}
            </div>
            {active && <div className="sk-info" key={active}><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 13 }}>{active}() — {active === 'create' ? 'yangi qator qo\'shadi' : active === 'findAll' ? 'hammasini o\'qiydi' : active === 'remove' ? 'o\'chiradi' : active === 'update' ? 'o\'zgartiradi' : active === 'findOneById' ? 'bittasini topadi' : 'sahifalab o\'qiydi'}</p></div>}
          </Col>
          <Col>
            <pre className="code-box" style={{ lineHeight: 1.8 }}>
              <Jx>export class</Jx>{' AdminService'}{'\n'}
              {'  '}<Jx>extends</Jx>{' BaseService {'}{'\n'}
              {'    '}<Cm>{'// CRUD tayyor keldi!'}</Cm>{'\n'}
              {'    '}<Cm>{'// faqat signIn() ni'}</Cm>{'\n'}
              {'    '}<Cm>{'// o\'zingiz qo\'shasiz'}</Cm>{'\n'}
              {'}'}
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Demak har yangi resurs uchun CRUD <b>qayta yozilmaydi</b> — BaseService'dan keladi. Siz faqat o'ziga xos mantiqni qo'shasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — MODULE + DI =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [wired, setWired] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = wired;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · Module" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ulanishni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>Module</span> — hammasini <span className="italic" style={{ color: T.accent }}>bir joyga</span> ulaydi.</h2></div>
        <Mentor>Module — bir bo'limning hamma qismini (controller, service, repository) ro'yxatga oladi. Keyin NestJS ularni <b style={{ color: T.ink }}>avtomatik bir-biriga ulaydi</b> (Dependency Injection) — siz qo'lda ulamaysiz. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <pre className="code-box" style={{ lineHeight: 1.8 }}>
              <At>@Module</At>{'({'}{'\n'}
              {'  imports: [TypeOrmModule'}{'\n'}
              {'    .forFeature([AdminEntity])],'}{'\n'}
              {'  controllers: [AdminController],'}{'\n'}
              {'  providers: [AdminService],'}{'\n'}
              {'})'}{'\n'}
              <Jx>export class</Jx>{' AdminModule {}'}
            </pre>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={wired} onClick={() => { setWired(true); setSc(n => n + 1); }}>{wired ? '✓ Ulandi' : '▶ NestJS qanday ulaydi?'}</button>
          </Col>
          <Col>
            <p className="flow-label">Avtomatik ulanish (DI)</p>
            <div className="wire">
              <div className="wire-box">Controller</div>
              <span className="wire-arr" style={{ color: wired ? T.accent : T.ink3 }}>{wired ? '✓ chaqiradi →' : '— ?'}</span>
              <div className="wire-box">Service</div>
              <span className="wire-arr" style={{ color: wired ? T.accent : T.ink3 }}>{wired ? '✓ ishlatadi →' : '— ?'}</span>
              <div className="wire-box">Repository</div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>NestJS module'dagi ro'yxatga qarab hammasini o'zi ulaydi. Siz <span className="mono">new AdminService()</span> qilmaysiz — Nest beradi. Bu — Dependency Injection.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — SIKL PREVIEW (5 qadam) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { n: '1', t: 'Entity', d: 'jadval shakli', icon: '📦' },
    { n: '2', t: 'DTO', d: 'anketa + qoidalar', icon: '📝' },
    { n: '3', t: 'Service', d: 'BaseService\'dan meros', icon: '👨‍🍳' },
    { n: '4', t: 'Controller', d: 'eshiklar (@Get/@Post)', icon: '🤵' },
    { n: '5', t: 'Module', d: 'hammasini ulaydi', icon: '🧩' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1, 2, 3, 4]) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= STEPS.length;
  const tap = (i) => { setSeen(prev => { const s = new Set(prev); s.add(i); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sikl · 5 qadam" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Qadamlarni ko'ring (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi narsa qo'shsam — har safar <span className="italic" style={{ color: T.accent }}>nima yozaman</span>?</h2></div>
        <Mentor>Eng zo'r yangilik: har bir yangi resurs (mas. <span className="mono">Task</span>) — doim <b style={{ color: T.ink }}>bir xil 5 qadam</b>. Bir marta o'rgansangiz, istalgan loyihani shu sikl bilan quryapsiz. Qadamlarni bosib ko'ring.</Mentor>
        <div className="cyc fade-up delay-1">
          {STEPS.map((s, i) => (
            <button key={i} className={`cyc-card ${seen.has(i) ? 'on' : ''}`} onClick={() => tap(i)}>
              <span className="cyc-n">{s.n}</span>
              <span className="cyc-ico">{s.icon}</span>
              <span className="cyc-t">{s.t}</span>
              {seen.has(i) && <span className="cyc-d fade-step">{s.d}</span>}
            </button>
          ))}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana sikl: <b>Entity → DTO → Service → Controller → Module</b>. Keyingi darsda aynan shu 5 qadam bilan o'z resursingizni (Task) qo'shasiz!</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — TEST 4 =====
const Screen16 = (props) => (
  <QuestionScreen {...props} idx={16} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Yangi resurs qo'shganda asosan nechta fayl yoziladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yangi resurs = <span className="italic" style={{ color: T.accent }}>nechta</span> asosiy fayl?</h2></>}
    options={['5 ta: Entity, DTO, Service, Controller, Module', '1 ta: hammasini bitta faylga', '20 ta har xil fayl', 'Hech narsa — avtomatik bo\'ladi']} correctIdx={0}
    explainCorrect="To'g'ri! Har resurs — bir xil 5 qadam: Entity, DTO, Service (BaseService'dan), Controller, Module. Oldindan aytib bo'ladigan va tartibli."
    explainWrong={{
      1: "Bitta faylga yozsak — yana o'sha chalkashlik. Arxitektura buni 5 faylga bo'ladi.",
      2: "20 ta emas — asosiy 5 ta fayl yetadi (qolgani tayyor asboblar).",
      3: "Avtomatik emas — siz 5 faylni yozasiz (lekin CRUD BaseService'dan tayyor).",
      default: "Yangi resurs = 5 fayl (Entity, DTO, Service, Controller, Module)."
    }} />
);

// ===== SCREEN 17 — QOIDA (recap) =====
const Screen17 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida · xulosa" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Oxirgi qadam →" onClick={onNext} /></>}>
    <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
      <div className="head"><h2 className="title h-title fade-up">Bir qarashda: <span className="italic" style={{ color: T.accent }}>xarita + so'rov yo'li</span>.</h2></div>
      <Mentor>Bugun kod yozmasdan, professional arxitekturani tirik ko'rdingiz. Eng muhimi: har narsa o'z joyida, va har so'rov bir xil yo'ldan o'tadi.</Mentor>
      <Split>
        <Col>
          <p className="flow-label">4 qatlam (restoran)</p>
          <div className="roadmap">
            <div className="step-card"><span className="step-num">core</span><span className="step-body"><span className="step-text">Model</span><span className="step-tag">entity · repository</span></span></div>
            <div className="step-card"><span className="step-num">api</span><span className="step-body"><span className="step-text">Domenlar</span><span className="step-tag">controller · service · dto · module</span></span></div>
            <div className="step-card"><span className="step-num">infra</span><span className="step-body"><span className="step-text">Tayyor asboblar</span><span className="step-tag">BaseService · token · ...</span></span></div>
            <div className="step-card"><span className="step-num">common</span><span className="step-body"><span className="step-text">Yordamchilar</span><span className="step-tag">guard · decorator</span></span></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">So'rov yo'li</p>
          <div className="frame" style={{ padding: 14 }}><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 12.5, lineHeight: 1.9 }}>guard 🛡️ → controller 🤵 → DTO 📝 → service 👨‍🍳 → BaseService 📖 → DB 🗄️ → successRes 🎁 → javob ✅</p></div>
          <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}>Yangi resurs = <b>5 qadam</b>: Entity → DTO → Service → Controller → Module.</p></div>
        </Col>
      </Split>
    </div>
  </Stage>
);

// ===== SCREEN 18 — AI BUILDER (buyruq ber → AI 5 faylni yozadi) =====
const BUILD_STEPS = [
  { step: 'Entity', icon: '📦', file: (r) => `${r}.entity.ts` },
  { step: 'DTO', icon: '📝', file: (r) => `create-${r}.dto.ts` },
  { step: 'Service', icon: '👨‍🍳', file: (r) => `${r}.service.ts` },
  { step: 'Controller', icon: '🤵', file: (r) => `${r}.controller.ts` },
  { step: 'Module', icon: '🧩', file: (r) => `${r}.module.ts` }
];
const buildCode = (i, R) => {
  const r = R.toLowerCase();
  switch (i) {
    case 0: return <><Jx>@Entity</Jx>{`('${r}s')`}{'\n'}<Jx>export class</Jx>{` ${R}Entity `}<Jx>extends</Jx>{' BaseEntity {'}{'\n'}{'  '}<At>@Column</At>{'()  title: '}<St>string</St>{';'}{'\n'}{'}'}</>;
    case 1: return <><Jx>export class</Jx>{` Create${R}Dto {`}{'\n'}{'  '}<At>@IsString</At>{'()  '}<At>@IsNotEmpty</At>{'()'}{'\n'}{'  title: '}<St>string</St>{';'}{'\n'}{'}'}</>;
    case 2: return <><At>@Injectable</At>{'()'}{'\n'}<Jx>export class</Jx>{` ${R}Service `}<Jx>extends</Jx>{' BaseService {}'}{'\n'}<Cm>{'// CRUD tayyor — BaseService\'dan'}</Cm></>;
    case 3: return <><At>@Controller</At>{`('${r}')`}{'\n'}<Jx>export class</Jx>{` ${R}Controller {}`}</>;
    case 4: return <><At>@Module</At>{'({'}{'\n'}{`  controllers: [${R}Controller],`}{'\n'}{`  providers: [${R}Service],`}{'\n'}{'})'}{'\n'}<Jx>export class</Jx>{` ${R}Module {}`}</>;
    default: return null;
  }
};
const Screen18 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PRESET = ['Task', 'Product', 'Comment'];
  const [name, setName] = useState('');
  const [resName, setResName] = useState(storedAnswer ? (storedAnswer.picked || 'Task') : '');
  const [built, setBuilt] = useState(storedAnswer ? [0, 1, 2, 3, 4] : []);
  const [building, setBuilding] = useState(false);
  const [hint, setHint] = useState('');
  const [sc, setSc] = useState(0);
  const timer = useRef(null);
  const runningRef = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const done = built.length >= BUILD_STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: resName || 'Task' }); }, [done]);
  const start = (raw) => {
    if (building || runningRef.current) return; // sinxron guard — tez ketma-ket bosishda parallel zanjirlarning oldini oladi
    const clean = (raw || '').trim().replace(/[^a-zA-Z]/g, '');
    if (!clean) { setHint('Resurs nomini lotin harflarda yozing — masalan: Task'); return; }
    runningRef.current = true;
    const R = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    setHint(''); setResName(R); setBuilt([]); setBuilding(true); setSc(n => n + 1);
    let i = 0;
    const tick = () => {
      setBuilt(prev => (prev.length >= BUILD_STEPS.length ? prev : [...prev, i])); setSc(n => n + 1); i++;
      if (i < BUILD_STEPS.length) { timer.current = setTimeout(tick, 620); } else { setBuilding(false); runningRef.current = false; }
    };
    timer.current = setTimeout(tick, 450);
  };
  const reset = () => { clearTimeout(timer.current); runningRef.current = false; setBuilt([]); setBuilding(false); setResName(''); setName(''); setHint(''); };
  const R = resName || 'Task';
  return (
    <Stage eyebrow="Amaliyot · resurs quramiz" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'AI 5 faylni yozsin'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Buyruq bering — AI <span className="italic" style={{ color: T.accent }}>5 faylni o'zi yozadi</span>.</h2></div>
        <Mentor>Endi siklni sinaymiz. Yangi resurs kerakmi (masalan <span className="mono">Task</span>)? Nomini yozing va <b style={{ color: T.ink }}>"Yarat"</b> bosing — AI o'rgangan tartibimizda <b style={{ color: T.ink }}>Entity → DTO → Service → Controller → Module</b> fayllarini ketma-ket yozadi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Resurs nomini yozing</p>
            <div className="prompt-row">
              <input className="prompt-input" value={name} placeholder="masalan: Task" spellCheck={false} autoCapitalize="off" autoCorrect="off" disabled={building} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') start(name); }} />
              <button className="prompt-btn" onClick={() => start(name)} disabled={building}>Yarat</button>
            </div>
            <div className="chips">
              {PRESET.map(p => <button key={p} className="gchip" disabled={building} onClick={() => { setName(p); start(p); }}>{p}</button>)}
              {(built.length > 0 || resName) && <button className="gchip" disabled={building} onClick={reset}>↺ Tozalash</button>}
            </div>
            {hint && <p className="hint fade-step">{hint}</p>}
            <div className="gen-steps">
              {BUILD_STEPS.map((s, i) => {
                const okk = built.includes(i);
                const curr = building && built.length === i;
                return <span key={i} className={`gen-step ${okk ? 'on' : ''} ${curr ? 'cur' : ''}`}>{okk ? '✓' : i + 1} {s.step}</span>;
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! <b>{R}</b> resursi 5 fayl bilan tayyor — har doim shu sikl. Siz buyruq berdingiz, AI yozdi. Lekin AI har doim 100% to'g'ri yozadimi? Keyingi ekranda tekshiramiz.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">AI yozayotgan fayllar · {R}</p>
            <div className="filestream">
              {built.length === 0 && !building && <p className="fs-empty">Buyruq bering — fayllar shu yerda paydo bo'ladi…</p>}
              {built.map((i, idx) => { const st = BUILD_STEPS[i]; if (!st) return null; return (
                <div key={idx} className="fs-file el-in">
                  <div className="fs-name"><span className="fs-ico">{st.icon}</span>{st.file(R.toLowerCase())}</div>
                  <pre className="fs-code">{buildCode(i, R)}</pre>
                </div>
              ); })}
              {building && built.length < BUILD_STEPS.length && <p className="gen-line">{BUILD_STEPS[built.length]?.step} yozilmoqda</p>}
            </div>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 19 — DEBUGGING (AI yozdi, siz tekshirasiz) · baholanadigan final =====
const Screen19 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'prov' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const found = picked === 'prov';
  const done = fixed;
  const pickLine = (id) => { if (found) return; setPicked(id); setSc(n => n + 1); };
  const fix = () => { setFixed(true); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { stage: 'final', screenIdx: screen, question: "AI yozgan Module'dagi xatoni toping va tuzating", studentAnswer: 'providers: [TaskService]', correct: true, firstAttemptCorrect: true, solved: true, picked: 'prov' }); }, [done]);
  return (
    <Stage eyebrow="Yakuniy · debugging" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yozdi — endi siz <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI tez yozadi, lekin ba'zan kichik xato qiladi. Mana, AI <span className="mono">task.module.ts</span> yozdi, ammo server ishga tushmayapti. Endi siz Module'ni bilasiz: <b style={{ color: T.ink }}>qaysi qator xato?</b> Bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana, Task moduli tayyor!</span></div>
              <div className="ai-code">
                <div className="ai-line" onClick={() => pickLine('mod')}><span className="tg">@Module</span>({'{'}</div>
                <div className="ai-line" onClick={() => pickLine('ctrl')}>{'  '}controllers: [<span className="tg">TaskController</span>],</div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={() => pickLine('prov')}>{'  '}providers: [{fixed && <span className="tg">TaskService</span>}],{!fixed && <span className="ai-tag-empty"> ← bo'sh</span>}</div>
                <div className="ai-line" onClick={() => pickLine('end')}>{'}'})</div>
                <div className="ai-line" onClick={() => pickLine('cls')}><span className="tg">export class</span> TaskModule {'{}'}</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qatorda xato? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 providers'ga TaskService'ni qo'shish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — providers'da TaskService bor!</p>}
            </div>
          </Col>
          <Col>
            {!found && (picked && picked !== 'prov'
              ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri. Eslang: Module har bir qismni ro'yxatga olishi kerak. <span className="mono">providers</span> ro'yxatiga qarang — service bormi?</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Module controller'ni service bilan ulaydi. Agar <span className="mono">providers</span> bo'sh bo'lsa, NestJS service'ni topa olmaydi.</p></div>)}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">providers: []</span> bo'sh — <span className="mono">TaskService</span> ro'yxatga olinmagan. Shuning uchun controller uni topa olmaydi. Chap tugma bilan tuzating →</p></div>}
            {!fixed && <Term title="terminal · xato" minH={84}><TLine out="✗ Nest can't resolve dependencies of" col={T.danger} /><TLine out="  TaskController (?). TaskService topilmadi." col={CODE.comment} /></Term>}
            {fixed && <>
              <Term title="terminal" minH={84}><TLine cmd="npm run start:dev" /><TLine out="Nest application successfully started" col={CODE.str} /><TLine out="server running on port 3000 ✓" col={CODE.str} /></Term>
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>
            </>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 20 — YAKUN =====
const Screen20 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Professional loyiha clone qilinadi (noldan yozilmaydi)",
    "Swagger — ishlaydigan API'ning tirik hujjati",
    "4 qatlam: core (model), api (domen), infrastructure (asbob), common (yordamchi)",
    "So'rov yo'li: guard → controller → DTO → service → BaseService → DB → successRes → javob",
    "Yangi resurs = 5 qadam: Entity → DTO → Service → Controller → Module"
  ];
  const HOMEWORK = [
    { b: 'Repo\'ni oching', t: "— github.com/Azizbekcrypto/IntroNestArxitechture — papkalarni ko'zdan kechiring" },
    { b: 'Restoran', t: "— har papkani restoran bo'limiga moslab ayting" },
    { b: 'So\'rov yo\'li', t: "— bitta endpoint uchun so'rov yo'lini o'z so'zingiz bilan tushuntiring" }
  ];
  const GLOSSARY = [
    { b: 'git clone', t: "— tayyor loyihani yuklab olish" },
    { b: 'Swagger', t: '— API\'ning avtomatik hujjati' },
    { b: 'Controller', t: '— so\'rovni qabul qiladi (ofitsiant)' },
    { b: 'DTO', t: '— kelgan ma\'lumot qoidalari (anketa)' },
    { b: 'Service', t: '— asosiy mantiq (oshpaz)' },
    { b: 'BaseService', t: '— tayyor CRUD (retseptlar kabi)' },
    { b: 'Entity', t: '— jadval shakli' },
    { b: 'Module', t: '— hammasini ulaydi' },
    { b: 'Guard', t: '— ruxsat qo\'riqchisi' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Arxitekturani tirik ko'rdingiz</span><h2 className="title h-title fade-up d1">Endi <span className="italic" style={{ color: T.accent }}>nima qayerdaligini</span> tushunasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Professional skeletni clone qildingiz, Swagger'da API'ni ko'rdingiz va so'rov yo'lini tushunasiz." : "Yaxshi harakat! So'rov yo'li va 4 qatlamni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi darsda — o'z resursingizni (Task) noldan qo'shasiz: Entity → DTO → Service → Controller → Module!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function NestArchAliveLesson({ lang: langProp, onFinished }) {
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
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); } .gchip:hover { transform: translateY(-1px); }
        .tagpill { font-family: 'JetBrains Mono'; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); }

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope'; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .vcard { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover { transform: translateY(-1px); }
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

        /* TERMINAL */
        .term { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .term-bar { background: #2D2D2D; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; } .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .term-title { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; }
        .term-body { background: #1E1E1E; padding: 12px 13px; min-height: 60px; }
        .tline { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.8; color: ${CODE.text}; word-break: break-word; }
        .term-input { background: rgba(0,122,204,0.1); border: 1px dashed #007ACC; border-radius: 6px; color: #E6EDF3; font-family: 'JetBrains Mono'; font-size: 13px; padding: 4px 9px; outline: none; width: 130px; } .term-input.ok { border: 1.5px solid ${T.success}; background: rgba(31,122,77,0.16); }

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

        /* FAYL DARAXTI */
        .tree { background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); display: flex; flex-direction: column; gap: 5px; }
        .tree-root { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; padding: 4px 6px; }
        .tree-row { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: ${T.bg}; border: none; border-radius: 9px; padding: 10px 11px; margin-left: 14px; cursor: pointer; transition: all 0.16s; }
        .tree-row:hover { background: #EFEBE3; }
        .tree-row.on { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .tree-folder { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .tree-role { font-size: 10.5px; color: ${T.ink2}; font-weight: 600; }
        .tree-seen { margin-left: auto; font-weight: 700; }
        .tree-kids { display: flex; flex-direction: column; gap: 4px; }
        .tree-kid { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 5px 9px; border-radius: 7px; }

        /* SO'ROV YO'LI — ixcham grid (skrolsiz) */
        .flow-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        @media (max-width: 600px) { .flow-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; } }
        .fg-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; background: ${T.paper}; border-radius: 12px; padding: clamp(9px,1.4vw,13px) 6px; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); transition: all 0.3s; }
        .fg-card.lit { box-shadow: inset 0 0 0 1.5px ${T.accent}33, 0 6px 16px -6px rgba(255,79,40,0.18); }
        .fg-card.cur { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.3); }
        .fg-n { position: absolute; top: 6px; left: 8px; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 10px; }
        .fg-ico { font-size: clamp(20px,3vw,26px); line-height: 1; transition: all 0.3s; }
        .fg-k { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(10px,1.4vw,12px); text-align: center; line-height: 1.1; }
        .flow-ctl { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
        @media (max-width: 600px) { .flow-ctl .btn { width: 100%; } }

        /* DI WIRE */
        .wire { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); }
        .wire-box { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11.5px; background: ${T.bg}; padding: 8px 11px; border-radius: 8px; color: ${T.ink}; }
        .wire-arr { font-family: 'JetBrains Mono'; font-size: 10.5px; font-weight: 700; transition: color 0.3s; }

        /* ENTITY ROWS */
        .ent-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-family: 'JetBrains Mono'; font-size: 11.5px; padding: 7px 10px; border-radius: 8px; margin-bottom: 5px; }
        .ent-row span { font-size: 10px; font-weight: 700; }
        .ent-row.siz { background: ${T.accentSoft}; color: ${T.ink}; } .ent-row.siz span { color: ${T.accent}; }
        .ent-row.free { background: ${T.successSoft}; color: ${T.ink}; } .ent-row.free span { color: ${T.success}; }

        /* SIKL KARTALARI */
        .cyc { display: grid; grid-template-columns: repeat(5,1fr); gap: 8px; }
        @media (max-width: 600px) { .cyc { grid-template-columns: repeat(2,1fr); } }
        .cyc-card { display: flex; flex-direction: column; align-items: center; gap: 3px; background: #fff; border: none; border-radius: 12px; padding: 13px 8px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); position: relative; }
        .cyc-card:hover { transform: translateY(-2px); }
        .cyc-card.on { box-shadow: inset 0 0 0 1.5px ${T.success}, 0 8px 18px -6px rgba(31,122,77,0.2); }
        .cyc-n { position: absolute; top: 6px; left: 8px; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 11px; color: ${T.accent}; }
        .cyc-ico { font-size: 24px; } .cyc-t { font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.ink}; } .cyc-d { font-size: 9.5px; color: ${T.ink2}; text-align: center; font-weight: 600; }

        .messy { background: ${CODE.bg}; color: ${CODE.comment}; font-family: 'JetBrains Mono'; font-size: 10.5px; line-height: 1.7; padding: 13px; border-radius: 11px; cursor: pointer; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); max-height: 170px; overflow: hidden; } .messy p { margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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

        /* ===== AI BUILDER (Screen18) ===== */
        .prompt-row { display: flex; gap: 8px; }
        .prompt-input { flex: 1; min-width: 0; font-family: 'JetBrains Mono'; font-size: 14px; padding: 11px 14px; border: none; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; box-shadow: inset 0 0 0 1.5px ${T.ink3}40; transition: box-shadow 0.2s; }
        .prompt-input:focus { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .prompt-btn { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14px; padding: 0 18px; border-radius: 12px; border: none; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .prompt-btn:hover:not(:disabled) { box-shadow: 0 10px 22px -5px rgba(255,79,40,0.55); }
        .prompt-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
        .chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .gen-steps { display: flex; flex-wrap: wrap; gap: 6px; }
        .gen-step { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; padding: 6px 10px; border-radius: 99px; background: ${T.paper}; color: ${T.ink3}; box-shadow: inset 0 0 0 1px ${T.ink3}30; transition: all 0.25s; }
        .gen-step.on { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}55; }
        .gen-step.cur { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .gen-line { font-family: 'JetBrains Mono'; font-size: 12px; color: ${CODE.attr}; margin: 4px 2px 0; } .gen-line::after { content: '…'; animation: blink 1s steps(3) infinite; } @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        .filestream { display: flex; flex-direction: column; gap: 8px; max-height: clamp(260px,42vh,360px); overflow-y: auto; padding-right: 2px; }
        .fs-empty { font-size: 13px; color: ${T.ink3}; font-style: italic; margin: 0; padding: 10px 0; }
        .fs-file { background: ${CODE.bg}; border-radius: 11px; overflow: hidden; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.22); }
        .fs-name { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11.5px; color: #C9D1D9; background: #243049; padding: 7px 11px; display: flex; align-items: center; gap: 7px; } .fs-ico { font-size: 14px; }
        .fs-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.55; color: ${CODE.text}; padding: 10px 12px; margin: 0; white-space: pre-wrap; word-break: break-word; }

        /* ===== DEBUGGING (Screen19) ===== */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: clamp(12px,1.5vw,13px); color: ${CODE.text}; cursor: pointer; padding: 4px 7px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); } .ai-line .tg { color: ${CODE.tag}; }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); box-shadow: inset 0 0 0 1px ${T.success}; }
        .ai-tag-empty { color: ${CODE.comment}; font-style: italic; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 32px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(15px,2.2vw,19px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 12.5px; margin: 0; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
