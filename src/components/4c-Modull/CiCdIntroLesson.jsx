import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// CI/CD + DEPLOY MODULI · DARS 1 — CI/CD NIMA VA NEGA KERAK — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi CI/CD nima ekanini, CI va CD farqini, pipeline (konveyer) tushunchasini va nega avtomatlashtirish kerakligini tushunadi.
// Davomi: 4b (test yozdik) + 1-modul (Netlify'ga qo'lda deploy). Endi: robot HAR push'da avtomatik test qiladi va deploy qiladi.
// Metafora: ZAVOD KONVEYERI. Kod = detal. Push → Install → Test → Lint → Build → Deploy → 🌍. Stansiya qizil bersa — konveyer to'xtaydi.
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

const LESSON_META = { lessonId: 'cicd-intro-v16', lessonTitle: { uz: 'CI/CD nima va nega kerak', ru: 'Что такое CI/CD и зачем' } };
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
  { id: 's12', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
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
// ===== MOCK TERMINAL =====
const Term = ({ title = 'Terminal', children, minH }) => (
  <div className="term"><div className="term-bar"><span className="bb-dots"><i /><i /><i /></span><span className="term-title">{title}</span></div><div className="term-body" style={{ minHeight: minH }}>{children}</div></div>
);
const TLine = ({ cmd, out, col }) => (
  <div className="el-in tline">{cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : <span style={{ color: col || CODE.comment }}>{out}</span>}</div>
);

// ===== KONVEYER (PIPELINE) STANSIYALARI =====
const STATIONS = [
  { id: 'install', ico: '📦', label: 'Install', cmd: 'npm install', desc: "Loyihaga kerakli paketlarni o'rnatadi — toza muhitda boshlaydi." },
  { id: 'test',    ico: '🧪', label: 'Test',    cmd: 'npm test',    desc: "4b-modulda yozgan testlaringizni ishga tushiradi — kod to'g'ri ishlayaptimi?" },
  { id: 'lint',    ico: '🔍', label: 'Lint',    cmd: 'eslint .',    desc: "Kod uslubini tekshiradi — bo'sh o'zgaruvchi, xato yozuv va boshqalarni topadi." },
  { id: 'build',   ico: '🔨', label: 'Build',   cmd: 'npm run build', desc: "Loyihani internetga tayyor holatga yig'adi (optimizatsiya qiladi)." },
  { id: 'deploy',  ico: '🚀', label: 'Deploy',  cmd: 'deploy',      desc: "Tayyor saytni serverga / internetga chiqaradi — foydalanuvchi ko'radi." }
];
const badgeOf = (s) => (s === 'pass' ? '✓' : s === 'fail' ? '✗' : s === 'run' ? '●' : s === 'skip' ? '—' : ' ');
const Pipeline = ({ statuses = {}, showLive = true }) => (
  <div className="pipe">
    {STATIONS.map((s, i) => (
      <React.Fragment key={s.id}>
        {i > 0 && <span className="pipe-arrow">→</span>}
        <div className={`pipe-step ${statuses[s.id] || ''}`}>
          <span className="pipe-ico">{s.ico}</span>
          <span className="pipe-lbl">{s.label}</span>
          <span className="pipe-badge">{badgeOf(statuses[s.id])}</span>
        </div>
      </React.Fragment>
    ))}
    {showLive && <>
      <span className="pipe-arrow">→</span>
      <div className={`pipe-step ${statuses.live || ''}`}>
        <span className="pipe-ico">🌍</span>
        <span className="pipe-lbl">Jonli</span>
        <span className="pipe-badge">{badgeOf(statuses.live)}</span>
      </div>
    </>}
  </div>
);
const ALL_PASS = { install: 'pass', test: 'pass', lint: 'pass', build: 'pass', deploy: 'pass', live: 'pass' };

// ===== SCREEN 0 — HOOK: qo'lda deploy charchatadi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Har safar shu 5 qadamni qo'lda, diqqat bilan bajaraman" },
    { id: 'b', label: "Robotga topshiraman — har push'da o'zi test qilib, deploy qiladi" },
    { id: 'c', label: "Umuman deploy qilmayman, lokalda ishlasa bo'ldi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Kodni yangiladingiz — endi uni internetga chiqarish uchun <span className="italic" style={{ color: T.accent }}>nechta amal</span> kerak?</h1>
        <Mentor>Kod tayyor, test ham yashil. Endi uni foydalanuvchiga yetkazish kerak. Bir martani <b style={{ color: T.ink }}>qo'lda</b> bajarib ko'ring — tugmani bosing.</Mentor>
        <Zoomable><Split>
          <Col>
            <Term title="qo'lda deploy" minH={150}>
              <TLine cmd="npm test" />
              {tried && <>
                <TLine out="✓ testlar yashil" col={CODE.str} />
                <TLine cmd="npm run build" />
                <TLine cmd="ssh server" />
                <TLine cmd="scp ./dist server:/var/www" />
                <TLine cmd="systemctl restart app" />
                <TLine out="✓ deploy tugadi (5 qadam)" col={CODE.str} />
              </>}
            </Term>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Qo\'lda deploy bajarildi' : '▶ Qo\'lda deploy qilish'}</button>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 qadam bajarildi. Va buni <b>har push'da</b> takrorlaysiz. Bittasini unutsangiz (masalan testni) — buzuq kod internetga chiqib ketadi.</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Bu ishni qanday yaxshilaymiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval qo'lda deploy'ni bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! 4b-modulda <b>test</b> yozdingiz, 1-modulda Netlify'ga <b>qo'lda deploy</b> qildingiz. Bugun shularni bitta <b>robot</b> — CI/CD — har o'zgarishda avtomatik bajarishini o'rganamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'CI/CD nima va nega kerak', tag: 'tushuncha' },
    { text: 'CI va CD — integration va deployment', tag: 'farq' },
    { text: 'Pipeline — konveyer stansiyalari', tag: 'Install→Deploy' },
    { text: 'Konveyer qachon to\'xtaydi', tag: 'test FAIL' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Dars oxirida — shu konveyerni tushunasiz</p>
      <Pipeline statuses={ALL_PASS} />
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Push qildingiz → konveyer o'zi ishladi: paket o'rnatildi, test yashil, build yig'ildi va sayt <b style={{ color: T.success }}>avtomatik</b> internetga chiqdi. Qo'l tegmaydi.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Deploy'ni har safar qo'lda qilamizmi — yoki <span className="italic" style={{ color: T.accent }}>konveyerga topshiramizmi</span>?</h2></div>
        <Mentor>CI/CD — bu kodingizni avtomatik tekshiradigan va internetga chiqaradigan <b style={{ color: T.ink }}>konveyer</b>. Bir marta sozlaysiz, u har push'da o'zi ishlaydi. Mana natija va unga olib boradigan 4 qadam.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Konveyerni ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — QO'LDA DEPLOY ZANJIRI (charchatadi) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const MAN = [
    { id: 'test', t: '1 · Test', d: "npm test — qo'lda ishga tushirib, yashil ekanini ko'z bilan tekshirasiz." },
    { id: 'build', t: '2 · Build', d: "npm run build — loyihani internetga tayyor holatga yig'asiz." },
    { id: 'ssh', t: '3 · Serverga ulanish', d: "ssh bilan serverga kirasiz (parol, manzil — har safar)." },
    { id: 'upload', t: '4 · Fayllarni yuklash', d: "Yangi fayllarni serverga nusxalaysiz — eskisi ustiga." },
    { id: 'restart', t: '5 · Qayta ishga tushirish', d: "Serverni restart qilasiz, so'ng sayt ochilishini tekshirasiz." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(MAN.map(m => m.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= MAN.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = MAN.find(m => m.id === active);
  return (
    <Stage eyebrow="Muammo · qo'lda" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `5 qadamni ko'ring (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta deploy — aslida <span className="italic" style={{ color: T.accent }}>nechta qadam</span>?</h2></div>
        <Mentor>Sayt internetga chiqishi uchun bir nechta amal ketma-ket bajariladi. Har qadamni bosib ko'ring — va bu <b style={{ color: T.ink }}>har push'da</b> qaytarilishini his qiling.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {MAN.map(m => <button key={m.id} className="gchip" onClick={() => tap(m.id)} style={seen.has(m.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(m.id) ? '✓ ' : ''}{m.t}</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">qadam tafsiloti</p>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ color: T.accent }}>{cur.t}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qadamni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 qadam — har push'da takrorlanadi. Sekin, zerikarli, va bir kuni bittasini unutasiz. Buni avtomatlashtirsak-chi?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — KONVEYER G'OYASI (avtomatlashtirish) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · konveyer" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "G'oyani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir marta sozlasangiz — keyin <span className="italic" style={{ color: T.accent }}>o'zi ishlasa-chi</span>?</h2></div>
        <Mentor>Zavodni tasavvur qiling: <b style={{ color: T.ink }}>kod = detal</b>. Siz uni push qilasiz, u <b style={{ color: T.ink }}>konveyerga</b> tushadi. Har stansiya detalni tekshiradi, oxirida tayyor mahsulot avtomatik mijozga jo'natiladi. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}><p className="note-h" style={{ color: T.danger }}>🐌 Qo'lda</p><p className="body" style={{ margin: 0, color: T.ink }}>Har push'dan keyin 5 qadamni o'zingiz bajarasiz. Sekin, xatoga moyil — va bir kuni <b>unutib qo'yasiz</b>.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : 'Konveyer bilan-chi?'}</button>
          </Col>
          <Col>
            {show
              ? <><div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="note-h" style={{ color: T.success }}>⚙️ Konveyer (CI/CD)</p><p className="body" style={{ margin: 0, color: T.ink }}>Bir marta sozlaysiz. Endi <b>har push</b> avtomatik: test → build → deploy. Qo'l tegmaydi, hech narsa unutilmaydi.</p></div><div className="fade-step"><Pipeline statuses={ALL_PASS} /></div></>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana CI/CD'ning butun g'oyasi: <b>qo'l mehnatini konveyerga aylantirish</b>. Endi CI va CD nimaligini ajratamiz.</p></div>}
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
    questionText="CI/CD asosan nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>CI/CD asosan <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Kod har o\'zgarganda uni avtomatik tekshiradi va internetga chiqaradi', 'Saytni chiroyli dizayn qiladi', 'Kodni siz o\'rniga yozadi', 'Internet tezligini oshiradi']} correctIdx={0}
    explainCorrect="To'g'ri! CI/CD — avtomatlashtirilgan konveyer: kod o'zgarsa, u test → build → deploy bosqichlarini o'zi bajaradi. Sizning ishingiz — faqat push qilish."
    explainWrong={{
      1: "Dizayn — CSS ishi. CI/CD esa tekshirish va deploy jarayonini avtomatlashtiradi.",
      2: "Kodni siz yozasiz (yoki AI bilan). CI/CD yozilgan kodni tekshiradi va chiqaradi.",
      3: "Internet tezligi — bu boshqa narsa. CI/CD deploy jarayonini avtomatlashtiradi.",
      default: "CI/CD = kodni avtomatik tekshiradi va deploy qiladi."
    }} />
);

// ===== SCREEN 5 — CI (Continuous Integration) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const DEVS = [
    { id: 'ali', name: 'Ali', work: 'savatcha funksiyasi' },
    { id: 'vali', name: 'Vali', work: 'login sahifasi' },
    { id: 'sora', name: 'Sora', work: 'mahsulot ro\'yxati' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(DEVS.map(d => d.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= DEVS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = DEVS.find(d => d.id === active);
  return (
    <Stage eyebrow="Tushuncha · CI" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Push'larni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">CI — <span className="italic" style={{ color: T.accent }}>Continuous Integration</span>: nima birlashtiriladi?</h2></div>
        <Mentor><b style={{ color: T.ink }}>CI = uzluksiz birlashtirish.</b> Jamoadagi har kishi kod yozadi. Har push'da CI kodni umumiy loyihaga birlashtiradi va <b style={{ color: T.ink }}>darhol avtomatik tekshiradi</b> (test, lint). Maqsad — xatoni erta tutish. Har dasturchini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {DEVS.map(d => <button key={d.id} className="gchip" onClick={() => tap(d.id)} style={seen.has(d.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(d.id) ? '✓ ' : ''}{d.name} push qildi</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">CI nima qildi?</p>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="body" style={{ margin: 0, color: T.ink }}>CI <b>{cur.name}</b>ning kodini ({cur.work}) umumiy loyihaga qo'shdi va avtomatik test qildi — <b style={{ color: T.success }}>✓ yashil</b>, konflikt yo'q.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Dasturchini bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana CI: 3 kishining kodi bir joyga birlashdi va har biri avtomatik tekshirildi. Hech kim "mening kompimda ishlayapti-ku" demaydi — konveyer hammasini bir xil sinaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — CD (Continuous Deployment) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · CD" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Natijani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">CD — <span className="italic" style={{ color: T.accent }}>Continuous Deployment</span>: test o'tgach nima bo'ladi?</h2></div>
        <Mentor><b style={{ color: T.ink }}>CD = uzluksiz yetkazish.</b> Test yashil bo'lsa, kod <b style={{ color: T.ink }}>avtomatik</b> internetga (production) chiqadi — siz hech narsa qilmaysiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Pipeline statuses={show ? ALL_PASS : { install: 'pass', test: 'pass', lint: 'pass', build: 'pass' }} />
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Avtomatik chiqdi' : '▶ Test yashil — keyin nima?'}</button>
          </Col>
          <Col>
            {show
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="note-h" style={{ color: T.success }}>🚀 Avtomatik deploy</p><p className="body" style={{ margin: 0, color: T.ink }}>Test o'tdi — konveyer kodni o'zi internetga chiqardi. Foydalanuvchi yangilangan saytni ko'rdi. Siz faqat push qilgansiz.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>💡 <b>Continuous Delivery</b> — deyarli shu, faqat oxirida siz "chiqarish" tugmasini bosib tasdiqlaysiz. <b>Deployment</b> esa to'liq avtomatik.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>CI tekshirdi, CD chiqardi. Ikkalasi birga — CI/CD konveyeri.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — PIPELINE STANSIYALARI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(STATIONS.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= STATIONS.length;
  const statuses = {}; seen.forEach(id => { statuses[id] = 'pass'; });
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = STATIONS.find(s => s.id === active);
  return (
    <Stage eyebrow="Tushuncha · pipeline" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Stansiyalarni ko'ring (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Konveyerda qanday <span className="italic" style={{ color: T.accent }}>stansiyalar</span> bor?</h2></div>
        <Mentor>Pipeline (konveyer) — ketma-ket stansiyalar. Detal (kod) har biridan o'tadi. Har stansiyani bosib, u nima qilishini ko'ring.</Mentor>
        <div className="fade-up"><Pipeline statuses={statuses} showLive={false} /></div>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STATIONS.map(s => <button key={s.id} className="gchip" onClick={() => tap(s.id)} style={seen.has(s.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{s.ico} {s.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label} <span className="mono" style={{ color: T.ink3, marginLeft: 6, fontSize: 12 }}>{cur.cmd}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Stansiyani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartibi muhim: <b>Install → Test → Lint → Build → Deploy</b>. Avval tekshiramiz, keyin chiqaramiz — hech qachon teskari emas.</p></div>}
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
    questionText="CI va CD orasidagi farq nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>CI</span> va <span className="mono" style={{ color: T.accent }}>CD</span> orasidagi <span className="italic" style={{ color: T.accent }}>farq</span> nima?</h2></>}
    options={['CI — har o\'zgarishni avtomatik tekshiradi (test/lint); CD — tekshiruvdan o\'tgan kodni avtomatik deploy qiladi', 'CI va CD — bir xil narsaning ikki nomi', 'CI deploy qiladi, CD test qiladi', 'Ikkalasi ham faqat dizayn bilan shug\'ullanadi']} correctIdx={0}
    explainCorrect="To'g'ri! CI (Integration) — kodni birlashtiradi va tekshiradi. CD (Deployment) — tekshiruvdan o'tgan kodni avtomatik internetga chiqaradi. Avval CI, keyin CD."
    explainWrong={{
      1: "Bir xil emas — CI tekshiradi, CD chiqaradi. Ular konveyerning ikki qismi.",
      2: "Teskari aytildi: CI tekshiradi (test/lint), CD deploy qiladi.",
      3: "Dizayn — CSS ishi. CI/CD esa tekshirish va deploy jarayoni.",
      default: "CI tekshiradi, CD deploy qiladi."
    }} />
);

// ===== SCREEN 9 — KONVEYER TO'XTAYDI (test FAIL) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [broken, setBroken] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = broken;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const statuses = broken
    ? { install: 'pass', test: 'fail', lint: 'skip', build: 'skip', deploy: 'skip', live: 'skip' }
    : ALL_PASS;
  return (
    <Stage eyebrow="Payoff · FAIL" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kodni buzib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Test <span className="italic" style={{ color: T.accent }}>qizil</span> bo'lsa — buzuq kod foydalanuvchiga chiqadimi?</h2></div>
        <Mentor>Konveyerning eng muhim qoidasi: bir stansiya <b style={{ color: T.danger }}>qizil</b> bersa — konveyer <b style={{ color: T.ink }}>to'xtaydi</b>. Keyingi stansiyalar (Build, Deploy) bajarilmaydi. Buzuq detal mijozga chiqmaydi. "Kodni buzish" tugmasini bosing.</Mentor>
        <div className="fade-up"><Pipeline statuses={statuses} /></div>
        <Zoomable>
        <div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={broken} onClick={() => { setBroken(true); setSc(n => n + 1); }}>{broken ? '✓ Test qizil → konveyer to\'xtadi' : '🔨 Kodni buzish (test FAIL)'}</button>
            {broken && <div className="frame-warn fade-step"><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 13 }}>🧪 Test: <b style={{ color: T.danger }}>FAIL</b><br />→ 🔍 Lint, 🔨 Build, 🚀 Deploy: <b>o'tkazib yuborildi</b></p></div>}
          </Col>
          <Col>
            {!broken
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>
              : <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}><p className="body" style={{ margin: 0, color: T.ink }}>Konveyer Test stansiyasida to'xtadi — Deploy'gacha yetmadi. Buzuq kod <b style={{ color: T.success }}>internetga chiqmadi</b>, foydalanuvchi eski (ishlaydigan) versiyani ko'rmoqda.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana CI/CD'ning asosiy himoyasi: <b>buzuq kod hech qachon avtomatik deploy bo'lmaydi</b>. Xato sizgacha keladi — mijozgacha emas.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — NEGA AVTOMATLASHTIRAMIZ (3 foyda) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const WHY = [
    { id: 'speed', icon: '⚡', t: 'Tezlik', d: 'Push qildingiz — bir necha daqiqada test, build va deploy o\'zi bo\'ladi. Qo\'lda 20 daqiqalik ish — sekundlarda.' },
    { id: 'trust', icon: '🛡', t: 'Ishonch', d: 'Test qizil bo\'lsa deploy to\'xtaydi. Buzuq kod productionga chiqmaydi — "juma kuni deploy qo\'rquvi" yo\'qoladi.' },
    { id: 'team', icon: '👥', t: 'Jamoa', d: 'Har kishi push qiladi, konveyer hammani bir xil tekshiradi. "Mening kompimda ishlayapti-ku" muammosi tugaydi.' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(WHY.map(w => w.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= WHY.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = WHY.find(w => w.id === active);
  return (
    <Stage eyebrow="Tushuncha · nega" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 foydani ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega bu mehnatni <span className="italic" style={{ color: T.accent }}>avtomatlashtiramiz</span>?</h2></div>
        <Mentor>CI/CD uchta katta narsani beradi: <b style={{ color: T.ink }}>tezlik, ishonch va jamoa hamohangligi</b>. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WHY.map(w => (
                <button key={w.id} className="vcard" onClick={() => tap(w.id)} style={{ boxShadow: active === w.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{w.icon}</span>
                  <span className="vlbl">{w.t}</span>
                  <span className="vseen" style={{ color: seen.has(w.id) ? T.success : T.ink3 }}>{seen.has(w.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span style={{ fontSize: 20, marginRight: 6 }}>{cur.icon}</span>{cur.t}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Foydani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tezlik · Ishonch · Jamoa. Shuning uchun professional jamoalarning deyarli barchasi CI/CD ishlatadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Pipeline'da test qizil (FAIL) bo'lsa nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Pipeline'da test <span className="italic" style={{ color: T.accent }}>qizil</span> bo'lsa nima bo'ladi?</h2></>}
    options={['Konveyer to\'xtaydi — Build va Deploy bajarilmaydi, buzuq kod chiqmaydi', 'Hech narsa, baribir avtomatik deploy bo\'ladi', 'Konveyer kodni o\'zi tuzatib qo\'yadi', 'Sayt butunlay o\'chib qoladi']} correctIdx={0}
    explainCorrect="To'g'ri! Test qizil bo'lsa konveyer to'xtaydi — keyingi stansiyalar (Build, Deploy) ishlamaydi. Shuning uchun buzuq kod foydalanuvchiga yetib bormaydi."
    explainWrong={{
      1: "Aksincha — test FAIL bo'lsa deploy TO'XTAYDI. Bu CI/CD'ning asosiy himoyasi.",
      2: "Konveyer kodni tuzatmaydi — u faqat xatoni tutadi va to'xtaydi. Tuzatish sizning ishingiz.",
      3: "Sayt o'chmaydi — eski ishlaydigan versiya joyida qoladi, yangi buzuq versiya chiqmaydi.",
      default: "Test FAIL → konveyer to'xtaydi, deploy bo'lmaydi."
    }} />
);

// ===== SCREEN 12 — CASE: juma kuni jamoa =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hayotiy · jamoa" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkinchi holatni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Juma, soat 18:00 — kod push qilindi. <span className="italic" style={{ color: T.accent }}>CI/CD bormi</span>?</h2></div>
        <Mentor>Bir xil vaziyat, ikki xil yakun. Avval CI/CD <b style={{ color: T.danger }}>bo'lmagan</b> holatni o'qing, keyin tugmani bosib <b style={{ color: T.success }}>bor</b> holatni ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}>
              <p className="note-h" style={{ color: T.danger }}>❌ CI/CD yo'q</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Dasturchi shoshib qo'lda deploy qildi — <b>testni o'tkazib yubordi</b>. Savatcha funksiyasida xato bor edi. Sayt buzildi, lekin kech — hamma uyga ketgan. Mijozlar dam olish kuni xarid qila olmadi. Dushanba ertalab muammo aniqlandi.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : 'CI/CD bilan-chi?'}</button>
          </Col>
          <Col>
            {show
              ? <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.success}` }}>
                  <p className="note-h" style={{ color: T.success }}>✅ CI/CD bor</p>
                  <p className="body" style={{ margin: 0, color: T.ink }}>Push qilindi → konveyer testni ishga tushirdi → <b style={{ color: T.danger }}>qizil FAIL</b> → deploy <b>to'xtadi</b>. Dasturchiga darhol xabar keldi. U 5 daqiqada tuzatdi, qayta push qildi → yashil → sayt avtomatik yangilandi. Mijoz buzuq saytni umuman ko'rmadi.</p>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil xato — butunlay boshqa yakun. CI/CD xatoni <b>productionga chiqishidan oldin</b> tutadi. Mana shuning uchun kerak.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — QANDAY VOSITALAR (GitHub Actions teaser) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const TOOLS = [
    { t: 'GitHub Actions', d: 'konveyerni quradi (bepul, GitHub ichida)' },
    { t: 'Netlify / Vercel', d: 'frontend deploy' },
    { t: 'Render / Railway', d: 'backend deploy' },
    { t: 'ESLint', d: 'lint (kod uslubi)' }
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amalda · vositalar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Konveyer 'retsepti'ni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu konveyerni <span className="italic" style={{ color: T.accent }}>kim quradi</span>?</h2></div>
        <Mentor>Konveyer o'z-o'zidan paydo bo'lmaydi — uni siz <b style={{ color: T.ink }}>bir marta</b> sozlaysiz. Eng mashhuri va bepuli — <b style={{ color: T.ink }}>GitHub Actions</b>: kichik bir "retsept" fayli yozasiz, qolganini robot bajaradi. Keyingi darsda buni o'zimiz quramiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">.github/workflows/ci.yml — konveyer retsepti (namuna)</p>
            <CodeFile name="ci.yml" minH={170}>
              <At>name</At>{': CI'}{'\n'}
              <At>on</At>{': '}<Kw>push</Kw>{'        '}<Cm>{'# har push\'da ishga tushadi'}</Cm>{'\n'}
              <At>jobs</At>{':'}{'\n'}
              {'  '}<At>test</At>{':'}{'\n'}
              {'    '}<At>runs-on</At>{': ubuntu-latest'}{'\n'}
              {'    '}<At>steps</At>{':'}{'\n'}
              {'      - '}<At>run</At>{': '}<St>npm install</St>{'\n'}
              {'      - '}<At>run</At>{': '}<St>npm test</St>
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => { setDone(true); setSc(n => n + 1); }}>{done ? '✓ Tushundim' : 'Tushundim ✓'}</button>
          </Col>
          <Col>
            <p className="flow-label">kerakli vositalar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TOOLS.map((t, i) => <div key={i} className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>{t.t}</b> — {t.d}</p></div>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hozir har qatorni tushunish shart emas — keyingi darsda <span className="mono">name</span>, <span className="mono">on</span>, <span className="mono">jobs</span>, <span className="mono">steps</span>ni birma-bir o'rganamiz.</p></div>}
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
    questionText="Konveyer (pipeline) qachon ishga tushadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Konveyer (pipeline) odatda <span className="italic" style={{ color: T.accent }}>qachon</span> ishga tushadi?</h2></>}
    options={['Har safar kod push qilinganda — avtomatik', 'Faqat men qo\'lda maxsus tugma bossam', 'Yiliga bir marta', 'Hech qachon — deploy\'ni baribir o\'zim qilaman']} correctIdx={0}
    explainCorrect="To'g'ri! Odatda CI/CD har push (yoki pull request)da avtomatik ishga tushadi — buni ci.yml'dagi 'on: push' belgilaydi. Siz faqat push qilasiz."
    explainWrong={{
      1: "Qo'lda tugma — bu avtomatlashtirishning teskarisi. CI/CD odatda push'da o'zi ishlaydi.",
      2: "Yiliga bir marta emas — har o'zgarishda, ya'ni juda tez-tez (continuous = uzluksiz).",
      3: "Agar o'zingiz qilsangiz — bu CI/CD emas. Maqsad — push'da konveyer o'zi ishlashi.",
      default: "Konveyer har push'da avtomatik ishga tushadi."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: konveyerni to'g'ri tartibda yig'ish =====
const ORDER = ['install', 'test', 'lint', 'build', 'deploy'];
const SCRAMBLED = ['build', 'install', 'deploy', 'lint', 'test'];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(() => (storedAnswer ? [...ORDER] : []));
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const done = placed.length === ORDER.length;
  const need = ORDER[placed.length];
  const fired = useRef(!!storedAnswer);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'Konveyer stansiyalarini to\'g\'ri tartibda joylang', correct: true, firstAttemptCorrect: true, solved: true, picked: ORDER.join(' → ') });
    }
  }, [done]);
  const tap = (id) => {
    if (placed.includes(id) || done) return;
    if (id === need) { setPlaced(p => [...p, id]); setHint(null); }
    else {
      const needSt = STATIONS.find(s => s.id === need);
      setShakeId(id); setHint(`Hozir emas — avval ${needSt.ico} ${needSt.label} bo'lishi kerak.`);
      setTimeout(() => setShakeId(x => (x === id ? null : x)), 450);
    }
  };
  const placedStatuses = {}; placed.forEach(id => { placedStatuses[id] = 'pass'; });
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Konveyerni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: konveyerni <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Stansiyalarni to'g'ri ketma-ketlikda joylang: avval kerakli paketlar o'rnatiladi, keyin kod tekshiriladi, oxirida internetga chiqadi. To'g'ri stansiyani o'ng tomondan tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">konveyer (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="fade-step"><Pipeline statuses={placedStatuses} showLive={done} /></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Konveyer tayyor: <b>Install → Test → Lint → Build → Deploy</b>. Har push'da shu tartibda avtomatik ishlaydi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">stansiyani tanlang (keyingisi: {placed.length}/{ORDER.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {SCRAMBLED.map(id => {
                const s = STATIONS.find(x => x.id === id);
                const isPlaced = placed.includes(id);
                return (
                  <button key={id} className={`pick-row ${isPlaced ? 'picked' : ''} ${shakeId === id ? 'shake' : ''}`} disabled={isPlaced || done} onClick={() => tap(id)}>
                    <span style={{ marginRight: 6 }}>{s.ico}</span>
                    <span style={{ flex: 1 }}>{s.label} <span style={{ color: T.ink3 }}>· {s.cmd}</span></span>
                    <span className="pick-plus">{isPlaced ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
            {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint}</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "CI/CD — kodni har o'zgarishda avtomatik tekshiradi va deploy qiladi",
    "CI (Integration) — har push birlashtiriladi va tekshiriladi (test, lint)",
    "CD (Deployment) — test o'tgach kod avtomatik internetga chiqadi",
    "Pipeline — konveyer: Install → Test → Lint → Build → Deploy",
    "Test qizil bo'lsa konveyer to'xtaydi — buzuq kod chiqmaydi"
  ];
  const HOMEWORK = [
    { b: 'Sanang', t: "— o'z loyihangizda deploy hozir nechta qo'lda qadamdan iborat?" },
    { b: 'Tartib', t: "— konveyer 5 stansiyasini yoddan to'g'ri tartibda yozing" },
    { b: 'O\'qing', t: "— GitHub Actions nima ekani haqida qisqa material ko'rib keling" }
  ];
  const GLOSSARY = [
    { b: 'CI', t: '— Continuous Integration: birlashtirish va tekshirish' },
    { b: 'CD', t: '— Continuous Deployment: avtomatik deploy' },
    { b: 'pipeline', t: '— konveyer: ketma-ket stansiyalar' },
    { b: 'push', t: '— kodni repozitoriyga yuborish' },
    { b: 'deploy', t: '— saytni internetga chiqarish' },
    { b: 'build', t: '— loyihani tayyor holatga yig\'ish' },
    { b: 'lint', t: '— kod uslubini tekshirish' },
    { b: 'GitHub Actions', t: '— konveyer quradigan bepul vosita' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> CI/CD konveyerini tushundingiz</span><h2 className="title h-title fade-up d1">Endi kod o'zgarishini <span className="italic" style={{ color: T.accent }}>robot</span> chiqaradi.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! CI va CD farqini, pipeline stansiyalarini va konveyer qachon to'xtashini bilib oldingiz." : "Yaxshi harakat! CI/CD farqi va pipeline tartibini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <Zoomable>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — GitHub Actions: birinchi workflow'ni o'zimiz yozamiz va har push'da testlarni avtomatik ishga tushiramiz!</p></div>
        </div>
        </Zoomable>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function CiCdIntroLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
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
