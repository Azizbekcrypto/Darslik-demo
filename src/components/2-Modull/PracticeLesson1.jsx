import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

// ============================================================
// PRAKTIKA 1-DARS — SAYTNI JONLANTIRAMIZ (interaktivlik) — PLATFORM STANDARD v16
// Mavzu: statik sahifa vs jonli sahifa; HODISA (event) -> REAKSIYA (JS) -> O'ZGARISH (DOM).
//        5 vosita: Like sanagich, tungi/kunduzgi rejim, ko'rsat/yashir,
//        jonli salom (input), forma tekshiruvi (if/else).
// Maqsad (1-modul): bola interaktivlik NIMALIGINI his qilsin va tushunsin. AI minimal.
// Hook: chiroyli, lekin "o'lik" sayt — tugma bosiladi, hech nima bo'lmaydi.
// Ko'prik: keyingi darsda Antigravity agenti buni tez qiladi — bola TEKSHIRUVCHI.
// Toza dizayn — ortiqcha emoji yo'q; ma'no so'z va tipografiya bilan beriladi.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
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

// ===== Kod bo'yoqlari (syntax highlight) =====
const KW = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const NUM = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const STR = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const FN = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;
const CM = ({ children }) => <span style={{ color: CODE.comment }}>{children}</span>;

const LESSON_META = { lessonId: 'practice-01-jonlantirish-v16', lessonTitle: { uz: 'Praktika 1 — Saytni jonlantiramiz', ru: 'Практика 1 — Оживляем сайт' } };
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
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  const setCollapsed = (v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  };
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    if (e.target && e.target.closest && e.target.closest('.mentor')) return;
    setMCollapsed(true);
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

// ===== KO'P TANLOVLI TEST =====
const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === correctIdx)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === correctIdx;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect;
    if (isCorrect) setSolved(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], picked: i, studentAnswerIndex: i, studentAnswer: options[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (solved) { if (i === correctIdx) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (i === picked) cls += ' option-picked-wrong';
            return (
              <button key={i} className={cls} disabled={solved} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: solved && i === correctIdx ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}</p>
          <p className="body" style={{ margin: 0 }}>{solved ? explainCorrect : (explainWrong[picked] ?? explainWrong.default)}</p>
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

// ===== MENTOR =====
const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => { e.stopPropagation(); if (ctx.setCollapsed) ctx.setCollapsed(false); };
  return (
    <div className={`mentor fade-up ${enabled ? 'mentor-mob' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={collapsed ? expand : undefined} role={collapsed ? 'button' : undefined}>
      <div className="mentor-ava" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="40" height="40">
          <circle cx="20" cy="20" r="20" fill={T.accentSoft} />
          <circle cx="20" cy="16" r="6" fill={T.accent} />
          <path d="M8 36 a12 9 0 0 1 24 0 Z" fill={T.accent} />
        </svg>
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

// ===== BROWSER (jonli sayt preview) =====
const Browser = ({ url = 'mening-saytim.uz', children, dark = false }) => (
  <div className={`browser ${dark ? 'browser-dark' : ''}`}>
    <div className="browser-bar">
      <span className="browser-dot" style={{ background: '#FF5F56' }} />
      <span className="browser-dot" style={{ background: '#FFBD2E' }} />
      <span className="browser-dot" style={{ background: '#27C93F' }} />
      <span className="browser-url">{url}</span>
    </div>
    <div className="browser-body">{children}</div>
  </div>
);

// ===== FLOW (Hodisa -> Reaksiya -> O'zgarish) =====
const Flow = ({ step }) => {
  const NODES = [{ n: '1', l: 'Hodisa' }, { n: '2', l: 'Reaksiya' }, { n: '3', l: "O'zgarish" }];
  return (
    <div className="flow">
      {NODES.map((nd, i) => (
        <React.Fragment key={i}>
          <div className={`flow-node ${step >= i + 1 ? 'on' : ''}`}><span className="flow-n">{nd.n}</span><span>{nd.l}</span></div>
          {i < 2 && <span className="flow-arrow">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// Kichik sayt kartasi (ko'p ekranda qayta ishlatiladi)
const SiteCard = ({ name = 'Akmal', role = 'Veb-dasturchi · 14 yosh', children }) => (
  <div className="site-card">
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="site-ava">{(name && name.trim()[0]) || 'A'}</div>
      <div>
        <div className="site-name">{name}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>{role}</div>
      </div>
    </div>
    {children}
  </div>
);

// ===== SCREEN 0 — HOOK (o'lik sayt) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [dead, setDead] = useState(0);
  const [shake, setShake] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const timer = useRef(null);
  const OPTS = [
    { id: 'a', label: "JavaScript yo'q — sayt reaksiya qila olmaydi" },
    { id: 'b', label: "Internet sekin, shuning uchun ishlamayapti" },
    { id: 'c', label: "Tugma chiroyli emas, shuning uchun bosilmaydi" }
  ];
  useEffect(() => () => clearTimeout(timer.current), []);
  const tapDead = () => { setDead(d => d + 1); setShake(true); clearTimeout(timer.current); timer.current = setTimeout(() => setShake(false), 360); };
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>Chiroyli sayt, lekin tugma <span className="italic" style={{ color: T.accent }}>bosilsa</span> — hech nima bo'lmaydi</h1>
        <Mentor>Mana siz qurgan sayt — chiroyli ko'rinadi. Pastdagi <b style={{ color: T.ink }}>Like</b> tugmasini bir necha marta bosing va diqqat qiling: nima o'zgaryapti? Hozircha bu sayt emas — sayt <b style={{ color: T.ink }}>rasmi</b>, chunki u <b style={{ color: T.ink }}>reaksiya qilmaydi</b>.</Mentor>
        <Split>
          <Col>
            <p className="flow-label">Sizning saytingiz</p>
            <Browser>
              <SiteCard>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, opacity: 0.85 }}>Salom! Bu mening birinchi saytim. Yoqsa, like bosing.</p>
                <button className={`site-like ${shake ? 'shake' : ''}`} onClick={tapDead}>Like · 0</button>
                {dead > 0 && <p className="mono small" style={{ color: T.accent, margin: '4px 0 0' }}>{dead}-marta bosildi, son hali 0. Hech nima bo'lmadi.</p>}
              </SiteCard>
            </Browser>
          </Col>
          <Col>
            {dead < 3 ? (
              <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', minHeight: 120 }}>
                <p className="body" style={{ margin: 0, color: T.ink2 }}>Avval tugmani <b>kamida 3 marta</b> bosib ko'ring — jonsiz sayt qanaqa ekanini his qiling.</p>
              </div>
            ) : (
              <div className="fade-step">
                <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 9px' }}>Nega tugma ishlamayapti?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {OPTS.map(o => {
                    const on = picked === o.id;
                    return (
                      <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}>
                        <span className="radio">{on && <span className="radio-dot" />}</span>
                        <span>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
                {picked !== null && <p className="hook-ack fade-step">To'g'ri. HTML/CSS — saytning <b>tashqi ko'rinishi</b>, lekin u <b>jonsiz</b>. Jon kiritadigan narsa — <b>JavaScript</b>. Bugun saytimizni jonlantiramiz.</p>}
              </div>
            )}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Like sanagich — bosilsa son oshadi', tag: 'son' },
    { text: 'Tungi / kunduzgi rejim', tag: 'rejim' },
    { text: 'Ko\'rsat / yashir — menyu, batafsil', tag: 'holat' },
    { text: 'Jonli salom — ism yozsang o\'zgaradi', tag: 'input' },
    { text: 'Forma tekshiruvi — bo\'sh bo\'lsa xato', tag: 'shart' }
  ];
  const NODES = [
    { n: '1', name: 'HODISA', desc: 'Foydalanuvchi biror harakat qiladi (bosish, yozish)' },
    { n: '2', name: 'REAKSIYA', desc: 'JavaScript funksiyasi ishga tushadi' },
    { n: '3', name: "O'ZGARISH", desc: "Sahifa ko'z oldida o'zgaradi" }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Jonlantirishning oddiy qoidasi</p>
      <div className="fade-up"><Flow step={3} /></div>
      <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {NODES.map(nd => (
          <div key={nd.n} className="frame" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px' }}>
            <span className="num-badge">{nd.n}</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0 }}>{nd.name}</p><p className="body" style={{ margin: '1px 0 0', color: T.ink2 }}>{nd.desc}</p></div>
          </div>
        ))}
      </div>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">Bugun saytga 5 ta vosita qo'shamiz</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Bugun saytimizni <span className="italic" style={{ color: T.accent }}>jonlantiramiz</span></h2></div>
        <Mentor>Sayt jonlanishi uchun bitta oddiy qoidani bilish kifoya: <b style={{ color: T.ink }}>HODISA → REAKSIYA → O'ZGARISH</b>. Kimdir tugmani bosadi (hodisa), JavaScript javob beradi (reaksiya), sahifa o'zgaradi. Bugun shu qoida bilan saytimizga <b style={{ color: T.ink }}>5 ta vosita</b> qo'shamiz.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 ta vositani ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Qoidani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — KATTA G'OYA (o'lik tugma jonlanadi) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [pressed, setPressed] = useState(!!storedAnswer);
  const [step, setStep] = useState(0);
  const timer = useRef(null);
  const done = pressed;
  useEffect(() => () => clearTimeout(timer.current), []);
  const click = () => {
    clearTimeout(timer.current);
    setStep(1);
    timer.current = setTimeout(() => {
      setStep(2);
      timer.current = setTimeout(() => {
        setStep(3); setPressed(true);
        timer.current = setTimeout(() => setStep(0), 900);
      }, 360);
    }, 360);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const running = step > 0;
  return (
    <Stage eyebrow="Katta g'oya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval tugmani bosing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tugma bosilganda <span className="italic" style={{ color: T.accent }}>aslida</span> nima sodir bo'ladi?</h2></div>
        <Mentor>Biz tugmaga JavaScript "uladik". Endi uni bosing va <b style={{ color: T.ink }}>3 bosqichni</b> kuzating: <b style={{ color: T.accent }}>Hodisa</b> (bosish sezildi) → <b style={{ color: T.accent }}>Reaksiya</b> (funksiya ishladi) → <b style={{ color: T.accent }}>O'zgarish</b> (sahifa o'zgardi). Mana shu — jonlantirish.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Saytingiz — endi reaksiya qiladi</p>
            <Browser>
              <SiteCard>
                <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>Tugmani bosing.</p>
                <button className="site-btn" onClick={click} style={{ background: pressed && step === 0 ? T.success : T.ink }}>{step === 0 && pressed ? 'Ishladi!' : (running ? 'Ishlayapti…' : 'Meni bos')}</button>
              </SiteCard>
            </Browser>
            <div className="codebox" style={{ fontSize: 'clamp(12px,1.6vw,13.5px)' }}>
              <div><CM>// tugma BOSILGANDA bu funksiya ishlaydi:</CM></div>
              <div><FN>tugma</FN>.<FN>onclick</FN> = () =&gt; {'{'}</div>
              <div style={{ paddingLeft: 18 }}><FN>tugma</FN>.<FN>matn</FN> = <STR>"Ishladi!"</STR></div>
              <div>{'}'}</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Nima yuz beryapti?</p>
            <div className="frame" style={{ display: 'flex', justifyContent: 'center', padding: '22px 10px' }}><Flow step={step} /></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sezdingizmi? Bir bosish — uchta narsa: sayt hodisani <b>eshitdi</b>, JavaScript <b>javob berdi</b>, ekran <b>o'zgardi</b>. Statik rasm jonli sahifaga aylandi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — HODISALAR (event turlari) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const isMobile = useIsMobile();
  const EVENTS = [
    { id: 'click', name: 'Bosish (click)', hint: 'Tugma yoki rasmni bosganda' },
    { id: 'hover', name: isMobile ? 'Bosib turish (hover)' : 'Ustiga olib borish (hover)', hint: isMobile ? 'Element ustida barmoqni bosib turganda' : 'Sichqoncha ustiga kelganda' },
    { id: 'type', name: 'Yozish (input)', hint: 'Matn maydoniga yozganda' }
  ];
  const [active, setActive] = useState('click');
  const [seen, setSeen] = useState(new Set(['click']));
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [text, setText] = useState('');
  const done = seen.size >= 2;
  const pick = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hodisalar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Kamida 2 hodisani sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt foydalanuvchining qaysi <span className="italic" style={{ color: T.accent }}>harakatlarini</span> sezadi?</h2></div>
        <Mentor>"Hodisa" — bu foydalanuvchining harakati. Eng ko'p uchraydigani uchta: <b style={{ color: T.ink }}>bosish</b>, <b style={{ color: T.ink }}>ustiga olib borish</b> va <b style={{ color: T.ink }}>yozish</b>. Har birini tanlab, o'ngdagi saytda jonli sinab ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {EVENTS.map(e => (
                <button key={e.id} className={`evt-card ${active === e.id ? 'on' : ''}`} onClick={() => pick(e.id)}>
                  <span style={{ flex: 1 }}><span className="evt-name">{e.name}</span><br /><span className="evt-hint">{e.hint}</span></span>
                  {seen.has(e.id) && <span style={{ color: T.success }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Sinab ko'ring</p>
            <Browser url="sinov.uz">
              {active === 'click' && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <button className="site-btn" onClick={() => setClicked(c => !c)} style={{ background: clicked ? T.success : T.ink }}>{clicked ? 'Bosildi!' : 'Meni bos'}</button>
                  <p className="small" style={{ margin: '10px 0 0', opacity: 0.7 }}>Bosish hodisasi → tugma o'zgaradi</p>
                </div>
              )}
              {active === 'hover' && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onTouchStart={() => setHovered(true)}
                    onTouchEnd={(e) => { e.preventDefault(); setHovered(false); }}
                    style={{ display: 'inline-block', padding: '18px 26px', borderRadius: 12, fontWeight: 700, transition: 'all .2s', background: hovered ? T.accent : T.accentSoft, color: hovered ? '#fff' : T.accent, cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >{hovered ? 'Ustimdasiz!' : (isMobile ? 'Bosib turing' : 'Ustimga keling')}</div>
                  <p className="small" style={{ margin: '10px 0 0', opacity: 0.7 }}>{isMobile ? "Bosib turing → rang o'zgaradi" : "Hover hodisasi → rang o'zgaradi"}</p>
                </div>
              )}
              {active === 'type' && (
                <div style={{ padding: '4px 0' }}>
                  <input value={text} onChange={e => setText(e.target.value)} placeholder="Bu yerga yozing…" style={{ width: '100%', padding: '10px 13px', borderRadius: 10, border: `1.5px solid ${T.ink3}`, fontFamily: "'Manrope'", fontSize: 14, outline: 'none' }} />
                  <p style={{ margin: '12px 0 0', fontSize: 15 }}>Siz yozdingiz: <b style={{ color: T.accent }}>{text || '—'}</b></p>
                  <p className="small" style={{ margin: '6px 0 0', opacity: 0.7 }}>Yozish hodisasi → matn jonli aks etadi</p>
                </div>
              )}
            </Browser>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har xil hodisa — har xil reaksiya. Sayt foydalanuvchini "eshitadi" va javob beradi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Hodisa (event) nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Veb-saytda <span className="italic" style={{ color: T.accent }}>"hodisa" (event)</span> nima?</h2></>}
    options={['Saytning rangi va shrifti', "Foydalanuvchining harakati (bosish, yozish, hover)", 'Internet tezligi', 'Saytning nomi']} correctIdx={1}
    explainCorrect="To'g'ri! Hodisa — foydalanuvchi qiladigan harakat: tugmani bosish, matn yozish, sichqonchani ustiga olib borish. JavaScript shu hodisaga javob beradi."
    explainWrong={{
      0: 'Yo’q — rang va shrift bu CSS (ko’rinish). Hodisa esa foydalanuvchining harakati.',
      2: 'Yo’q — internet tezligi boshqa narsa. Hodisa — bosish, yozish kabi harakatlar.',
      3: 'Yo’q — nom boshqa. Hodisa — foydalanuvchi bajaradigan harakat.',
      default: 'Hodisa = foydalanuvchining harakati (bosish, yozish, hover).'
    }} />
);

// ===== SCREEN 5 — VOSITA 1: LIKE SANAGICH =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [n, setN] = useState(storedAnswer ? 3 : 0);
  const [pop, setPop] = useState(false);
  const timer = useRef(null);
  const done = n >= 3;
  useEffect(() => () => clearTimeout(timer.current), []);
  const like = () => { setN(c => c + 1); setPop(true); clearTimeout(timer.current); timer.current = setTimeout(() => setPop(false), 200); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vosita 1 · Like" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '3 marta like bosing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Necha marta bosilganini sayt qanday <span className="italic" style={{ color: T.accent }}>eslab qoladi?</span></h2></div>
        <Mentor>Hookdagi jonsiz tugma esingizdami? Endi unga jon kiritamiz. Sir — <b style={{ color: T.ink }}>o'zgaruvchi</b>da (<span className="mono">son</span>) yashiringan. Har bosishda funksiya <span className="mono">son = son + 1</span> qiladi va ekranni yangilaydi. Like bosing va sonni kuzating.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Saytingiz</p>
            <Browser>
              <SiteCard>
                <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>Saytim yoqdimi? Like bosing.</p>
                <button className="site-like" onClick={like} style={{ transform: pop ? 'scale(1.12)' : 'scale(1)' }}>Like · {n}</button>
              </SiteCard>
            </Browser>
          </Col>
          <Col>
            <div className="codebox">
              <div><KW>let</KW> son = <NUM>0</NUM> <CM>// o'zgaruvchi</CM></div>
              <div style={{ marginTop: 6 }}><FN>tugma</FN>.<FN>onclick</FN> = () =&gt; {'{'}</div>
              <div style={{ paddingLeft: 18 }}>son = son + <NUM>1</NUM> <CM>// +1</CM></div>
              <div style={{ paddingLeft: 18 }}><FN>tugma</FN>.<FN>matn</FN> = <STR>"Like · "</STR> + son</div>
              <div>{'}'}</div>
            </div>
            <div className="iwatch">
              <span className="iwatch-lbl">son</span>
              <span className="iwatch-eq">=</span>
              <span className="iwatch-num">{n}</span>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bosish — funksiya ishladi, son oshdi, ekran yangilandi. Mana o'zgaruvchi va hodisa birga ishlagani.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — VOSITA 2: TUNGI/KUNDUZGI REJIM =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [dark, setDark] = useState(false);
  const [seen, setSeen] = useState(new Set(['light']));
  const done = seen.size >= 2;
  const toggle = () => { setDark(d => { const nv = !d; setSeen(prev => { const n = new Set(prev); n.add(nv ? 'dark' : 'light'); return n; }); return nv; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vosita 2 · Rejim" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Rejimni almashtiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta tugma butun sayt ko'rinishini qanday <span className="italic" style={{ color: T.accent }}>o'zgartiradi?</span></h2></div>
        <Mentor>Bu yerda <b style={{ color: T.ink }}>shart</b> (if/else) ishlaydi: <b style={{ color: T.ink }}>agar</b> hozir yorug' bo'lsa — qorong'iga o'tkaz, <b style={{ color: T.ink }}>aks holda</b> — yorug'ga. Bitta tugma butun saytning ko'rinishini o'zgartiradi. Tugmani bosib ikkala rejimni ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Saytingiz — {dark ? 'tungi' : 'kunduzgi'}</p>
            <Browser dark={dark}>
              <SiteCard>
                <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>Ranglar rejimga qarab o'zgaradi.</p>
                <button className="site-btn" onClick={toggle} style={{ background: dark ? '#FFD380' : T.ink, color: dark ? '#1A2436' : '#fff' }}>{dark ? 'Kunduzgi rejim' : 'Tungi rejim'}</button>
              </SiteCard>
            </Browser>
          </Col>
          <Col>
            <div className="codebox">
              <div><KW>if</KW> (rejim === <STR>"yorug'"</STR>) {'{'}</div>
              <div style={{ paddingLeft: 18 }}>rejim = <STR>"qorong'i"</STR> <CM>// tungi</CM></div>
              <div>{'}'} <KW>else</KW> {'{'}</div>
              <div style={{ paddingLeft: 18 }}>rejim = <STR>"yorug'"</STR> <CM>// kunduzgi</CM></div>
              <div>{'}'}</div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta tugma — butun sayt o'zgardi. Bu <b>shart</b> yordamida: har bosishda rejim teskarisiga aylanadi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 =====
const Screen7 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="son = 0. Tugma bosilganda son = son + 1. Tugma 3 marta bosilsa, son nechta bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><div className="codebox" style={{ marginTop: 10, marginBottom: 6 }}><div><KW>let</KW> son = <NUM>0</NUM></div><div><FN>tugma</FN>.<FN>onclick</FN> = () =&gt; son = son + <NUM>1</NUM></div></div><h2 className="title h-sub" style={{ marginTop: 6 }}>Tugma <span className="italic" style={{ color: T.accent }}>3 marta</span> bosilsa, son nechta bo'ladi?</h2></>}
    options={['0', '1', '3', '33']} correctIdx={2}
    explainCorrect="To'g'ri! Har bosish son ni 1 ga oshiradi. 3 marta bosilsa: 0 → 1 → 2 → 3. Demak son = 3."
    explainWrong={{
      0: 'Yo’q — endi tugma jonli: har bosishda son oshadi. 3 marta → 3.',
      1: 'Yo’q — 1 faqat bitta bosishdan keyin bo’lardi. 3 marta bossak → 3.',
      3: 'Yo’q — 33 bu matn ulanishi bo’lardi. Bu yerda son ga +1 qo’shiladi: 3.',
      default: 'Har bosish +1 → 3 marta → son = 3.'
    }} />
);

// ===== SCREEN 8 — VOSITA 3: KO'RSAT / YASHIR =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(new Set());
  const done = seen.size >= 2;
  const toggle = () => { setOpen(o => { const nv = !o; setSeen(prev => { const n = new Set(prev); n.add(nv ? 'open' : 'closed'); return n; }); return nv; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vosita 3 · Ko'rsat/Yashir" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Oching va yoping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Menyu qanday qilib o'zi <span className="italic" style={{ color: T.accent }}>ochilib-yopiladi?</span></h2></div>
        <Mentor>Menyu, "batafsil" matni, savol-javob bo'limlari — hammasi bitta g'oyaga asoslangan: <b style={{ color: T.ink }}>bosilganda ko'rsat, yana bosilganda yashir</b>. Bu joyni tejaydi va saytni qulay qiladi. Tugmani bosib batafsil matnni oching-yoping.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Saytingiz</p>
            <Browser>
              <SiteCard>
                <button className="site-btn" onClick={toggle}>{open ? '▲ Yashirish' : '▼ Batafsil'}</button>
                {open && (
                  <div className="fade-step" style={{ background: T.bg, borderRadius: 10, padding: '12px 14px', fontSize: 13, lineHeight: 1.55 }}>
                    Men 14 yoshdaman va veb-saytlar yarataman. HTML, CSS va JavaScriptni o'rganyapman. Kelajakda o'z startapimni ochmoqchiman.
                  </div>
                )}
              </SiteCard>
            </Browser>
          </Col>
          <Col>
            <div className="codebox">
              <div><FN>tugma</FN>.<FN>onclick</FN> = () =&gt; {'{'}</div>
              <div style={{ paddingLeft: 18 }}><KW>if</KW> (matn.<FN>yashirin</FN>) ko'rsat()</div>
              <div style={{ paddingLeft: 18 }}><KW>else</KW> yashir()</div>
              <div>{'}'}</div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir tugma — ikki holat: ochiq va yopiq. Saytlardagi menyular aynan shunday ishlaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — VOSITA 4: JONLI SALOM =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [name, setName] = useState(storedAnswer ? 'Akmal' : '');
  const done = name.trim().length >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vosita 4 · Jonli salom" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ismingizni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Siz yozayotganingizni sayt qanday <span className="italic" style={{ color: T.accent }}>darhol sezadi?</span></h2></div>
        <Mentor>Bu eng yoqimli his: matn maydoniga <b style={{ color: T.ink }}>har bir harf</b> yozganingizda sayt <b style={{ color: T.ink }}>shu zahoti</b> o'zgaradi. "Yozish" hodisasi har harf yozilganda ishlaydi va salomni yangilaydi. Ismingizni yozib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Saytingiz</p>
            <Browser>
              <div className="site-card">
                <div style={{ fontSize: 'clamp(20px,3vw,26px)', fontFamily: "'Source Serif 4',serif", fontWeight: 600 }}>Salom, <span style={{ color: T.accent }}>{name.trim() || '—'}</span>!</div>
                <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>Ismingizni kiriting:</p>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ismingiz…" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${T.ink3}`, fontFamily: "'Manrope'", fontSize: 15, outline: 'none' }} />
              </div>
            </Browser>
          </Col>
          <Col>
            <div className="codebox">
              <div><FN>maydon</FN>.<FN>oninput</FN> = () =&gt; {'{'}</div>
              <div style={{ paddingLeft: 18 }}><FN>salom</FN>.<FN>matn</FN> = <STR>"Salom, "</STR> + maydon.<FN>qiymat</FN></div>
              <div>{'}'}</div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har harf — yangi reaksiya. Sayt sizni real vaqtda eshityapti. Juda kuchli his, to'g'rimi?</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — VOSITA 5: FORMA TEKSHIRUVI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [val, setVal] = useState('');
  const [msg, setMsg] = useState(null); // null | 'error' | 'ok'
  const [seen, setSeen] = useState(new Set(storedAnswer ? ['error', 'ok'] : []));
  const done = seen.size >= 2;
  const submit = () => {
    const ok = val.trim().length > 0;
    setMsg(ok ? 'ok' : 'error');
    setSeen(prev => { const n = new Set(prev); n.add(ok ? 'ok' : 'error'); return n; });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vosita 5 · Forma" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bo'sh va to'liq holatni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bo'sh forma yuborilsa, sayt buni qanday <span className="italic" style={{ color: T.accent }}>payqaydi?</span></h2></div>
        <Mentor>Aqlli saytlar foydalanuvchi xato qilmasin deb <b style={{ color: T.ink }}>tekshiradi</b>. Bu yerda <b style={{ color: T.ink }}>shart</b> ishlaydi: <b style={{ color: T.ink }}>agar</b> maydon bo'sh bo'lsa — qizil xato, <b style={{ color: T.ink }}>aks holda</b> — yashil "yuborildi". Avval <b>bo'sh</b> holda "Yuborish"ni bosing, keyin ism yozib qayta bosing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Saytingiz</p>
            <Browser>
              <div className="site-card">
                <p style={{ fontSize: 13, margin: 0, opacity: 0.85, fontWeight: 600 }}>Bog'lanish formasi</p>
                <input value={val} onChange={e => { setVal(e.target.value); setMsg(null); }} placeholder="Ismingiz…" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${msg === 'error' ? T.accent : T.ink3}`, fontFamily: "'Manrope'", fontSize: 15, outline: 'none' }} />
                <button className="site-btn" onClick={submit}>Yuborish</button>
                {msg === 'error' && <p className="fade-step" style={{ margin: 0, color: T.accent, fontWeight: 600, fontSize: 13 }}>Iltimos, ismingizni kiriting.</p>}
                {msg === 'ok' && <p className="fade-step" style={{ margin: 0, color: T.success, fontWeight: 600, fontSize: 13 }}>Rahmat, xabaringiz yuborildi.</p>}
              </div>
            </Browser>
          </Col>
          <Col>
            <div className="codebox">
              <div><KW>if</KW> (maydon.<FN>qiymat</FN> === <STR>""</STR>) {'{'}</div>
              <div style={{ paddingLeft: 18 }}>xato(<STR>"Ism kiriting!"</STR>) <CM>// bo'sh</CM></div>
              <div>{'}'} <KW>else</KW> {'{'}</div>
              <div style={{ paddingLeft: 18 }}>yubor() <CM>// to'liq</CM></div>
              <div>{'}'}</div>
            </div>
            <div className="fade-up" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: seen.has('error') ? 1 : 0.4 }}>{seen.has('error') ? '✓' : '1'} bo'sh → xato</span>
              <span className="tagpill" style={{ opacity: seen.has('ok') ? 1 : 0.4 }}>{seen.has('ok') ? '✓' : '2'} to'liq → ok</span>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikkala holatni ko'rdingiz. Sayt endi foydalanuvchini xatodan saqlaydi — bu professional saytlarning belgisi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Foydalanuvchi ism yozganda jonli salom o'zgarishi uchun qaysi hodisa kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Foydalanuvchi <span className="italic" style={{ color: T.accent }}>ism yozganda</span> salom jonli o'zgarishi uchun qaysi hodisa kerak?</h2></>}
    options={['Bosish (click)', "Yozish (input)", 'Hover (ustiga olib borish)', 'Hech qanday hodisa kerak emas']} correctIdx={1}
    explainCorrect="To'g'ri! Yozish (input) hodisasi har bir harf kiritilganda ishlaydi, shuning uchun salom real vaqtda o'zgaradi."
    explainWrong={{
      0: 'Yo’q — bosish faqat tugma uchun. Yozilayotgan matnni kuzatish uchun "input" hodisasi kerak.',
      2: 'Yo’q — hover sichqoncha harakati uchun. Yozish uchun "input" hodisasi kerak.',
      3: 'Yo’q — hodisasiz sayt o’zgarmaydi. Yozishni kuzatish uchun "input" hodisasi shart.',
      default: 'Yozishni kuzatish → "input" hodisasi.'
    }} />
);

// ===== SCREEN 12 — HAMMASI BIRGA (to'liq tirik sayt) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [alive, setAlive] = useState(true);
  const [likes, setLikes] = useState(0);
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [played, setPlayed] = useState(!!storedAnswer);
  const done = played;
  const act = (fn) => () => { if (!alive) return; fn(); setPlayed(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hammasi birga" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Saytingiz bilan o'ynang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mana — saytingiz endi <span className="italic" style={{ color: T.accent }}>to'liq jonlandi</span></h2></div>
        <Mentor>Mana — 5 ta vositaning hammasi bitta saytda. Like bosing, rejimni almashtiring, batafsilni oching, ismingizni yozing. Va eng qizig'i: <b style={{ color: T.ink }}>"Jonsiz"</b> tugmasini bosib, dars boshidagi jonsiz saytga qaytib ko'ring — farqni his qiling.</Mentor>
        <div className="split">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className={`chip ${alive ? 'chip-on' : ''}`} onClick={() => setAlive(true)}>Jonli</button>
              <button className={`chip ${!alive ? 'chip-on' : ''}`} onClick={() => setAlive(false)}>Jonsiz</button>
              <span className="mono small" style={{ color: alive ? T.success : T.ink3 }}>{alive ? 'JavaScript yoqilgan' : "JavaScript o'chiq — bosing, hech nima bo'lmaydi"}</span>
            </div>
            <Browser dark={alive && dark}>
              <div className="site-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="site-ava">{(name.trim()[0]) || 'A'}</div>
                  <div>
                    <div className="site-name">Salom, {name.trim() || 'Akmal'}!</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>Veb-dasturchi · 14 yosh</div>
                  </div>
                </div>
                <input value={name} onChange={e => { if (alive) { setName(e.target.value); setPlayed(true); } }} placeholder={alive ? 'Ismingizni yozing…' : "(jonsiz — yozib bo'lmaydi)"} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${T.ink3}`, fontFamily: "'Manrope'", fontSize: 14, outline: 'none', opacity: alive ? 1 : 0.5 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="site-like" onClick={act(() => setLikes(c => c + 1))}>Like · {likes}</button>
                  <button className="site-btn" onClick={act(() => setDark(d => !d))} style={{ background: dark ? '#FFD380' : T.ink, color: dark ? '#1A2436' : '#fff' }}>{dark ? 'Kunduzgi' : 'Tungi'}</button>
                  <button className="site-btn" onClick={act(() => setOpen(o => !o))}>{open ? '▲ Yashir' : '▼ Batafsil'}</button>
                </div>
                {alive && open && <div className="fade-step" style={{ background: dark ? 'rgba(255,255,255,0.08)' : T.bg, borderRadius: 9, padding: '10px 12px', fontSize: 13 }}>HTML, CSS va JavaScriptni o'rganyapman. Kelajakda startap ochaman.</div>}
              </div>
            </Browser>
          </Col>
          <Col>
            <p className="flow-label">Nimalarni sinab ko'rdingiz?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[['Like', likes > 0], ['Tungi rejim', dark], ['Batafsil', open], ['Ism', name.trim().length > 0]].map(([lbl, ok], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.paper, borderRadius: 10, padding: '9px 13px', boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.14)` }}>
                  <span style={{ color: ok ? T.success : T.ink3, fontWeight: 700 }}>{ok ? '✓' : '○'}</span>
                  <span className="body" style={{ margin: 0, color: ok ? T.ink : T.ink2 }}>{lbl}</span>
                </div>
              ))}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Statik rasmdan to'laqonli jonli saytgacha. Siz HTML/CSS saytiga JavaScript bilan jon kiritdingiz — bu haqiqiy dasturchining ishi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — HAYOTDA (statik vs interaktiv) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CARDS = {
    statik: { color: T.ink3, name: 'Statik (jonsiz)', when: "Faqat ko'rsatadi, javob bermaydi", ex: ['Gazeta yoki plakat', 'Oddiy "biz haqimizda" sahifa', "Rasm galereyasi (faqat ko'rish)"] },
    inter: { color: T.accent, name: 'Interaktiv (jonli)', when: 'Foydalanuvchiga javob beradi', ex: ['Instagram — like, komment', 'Onlayn o\'yin', "Do'kon — savatga qo'shish"] }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hayotda" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Interaktivlik <span className="italic" style={{ color: T.accent }}>qachon</span> kerak?</h2></div>
        <Mentor>Har bir sayt ham jonli bo'lishi shart emas. Ba'zilari faqat <b style={{ color: T.ink }}>ma'lumot ko'rsatadi</b> (statik), ba'zilari esa foydalanuvchi bilan <b style={{ color: T.ink }}>"gaplashadi"</b> (interaktiv). Har ikkala kartani bosib, farqini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.keys(CARDS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 14, padding: '15px 16px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: CARDS[k].color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 16, color: T.ink }}>{CARDS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 15 }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ width: 14, height: 14, borderRadius: 4, background: CARDS[active].color }} /><span className="sk-wordbadge">{CARDS[active].name}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 9px', fontWeight: 600 }}>{CARDS[active].when}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CARDS[active].ex.map((e, i) => (<div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.bg, borderRadius: 8, padding: '8px 11px' }}><span style={{ color: T.accent }}>•</span><span className="body" style={{ margin: 0, color: T.ink2 }}>{e}</span></div>))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir kartani bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Esda tuting: ishlatadigan deyarli barcha ilovalar — Instagram, YouTube, o'yinlar — <b>interaktiv</b>. Jonlantirish — zamonaviy vebning yuragi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — VIBECODING (tasvirla -> tasdiqla -> quradi -> tekshir) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 't1', label: "Saytimga tungi rejim qo'shib ber", plan: ['Tungi rejim tugmasini qo\'shaman', "Bosilganda ranglarni qorong'iga o'tkazaman"], dark: true, result: 'Tungi rejim' },
    { id: 't2', label: "Like tugmasini qo'shib ber", plan: ['son nomli o\'zgaruvchi yarataman', 'Bosilganda sonni 1 ga oshiraman'], dark: false, result: 'Like · 0' },
    { id: 't3', label: "Ochiladigan menyu qo'shib ber", plan: ['Menyu tugmasini qo\'yaman', "Bosilganda ro'yxatni ko'rsataman/yashiraman"], dark: false, result: '▾ Menyu' }
  ];
  const [task, setTask] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | planned | building | done
  const [demoDark, setDemoDark] = useState(false);
  const [demoLikes, setDemoLikes] = useState(0);
  const [demoMenu, setDemoMenu] = useState(false);
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const resetDemo = () => { setDemoDark(false); setDemoLikes(0); setDemoMenu(false); };
  const choose = (id) => { clearTimeout(timer.current); setTask(id); setPhase('planned'); resetDemo(); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  const cur = TASKS.find(t => t.id === task);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi qadam · AI" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agent bilan ishlab ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Shularni endi <span className="italic" style={{ color: T.accent }}>AI'ga aytib</span> qildirsak-chi?</h2></div>
        <Mentor>Buni <b style={{ color: T.ink }}>vibecoding</b> deyiladi: kodni o'zingiz yozish o'rniga, <b style={{ color: T.ink }}>oddiy so'z bilan</b> nima xohlayotganingizni aytasiz — AI agent (masalan, <b style={{ color: T.ink }}>Antigravity</b>) yozib beradi. Ammo <b style={{ color: T.accent }}>boshliq — siz</b>: agent avval rejasini ko'rsatadi, siz uni <b style={{ color: T.ink }}>tasdiqlaysiz</b>, oxirida natijani <b style={{ color: T.ink }}>tekshirasiz</b>. Bir buyruqni sinab ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">1. Agentga so'z bilan ayting</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TASKS.map(t => <button key={t.id} className={`chip ${task === t.id ? 'chip-on' : ''}`} onClick={() => choose(t.id)} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>"{t.label}"</button>)}
            </div>
            {!cur && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Yuqoridan bitta buyruqni tanlang</p></div>}
            {cur && (
              <div className="ai-card fade-step" key={task}>
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Mana rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Quryapman…' : 'Bajardim')}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cur.plan.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span style={{ color: T.ink }}>{p}</span></div>)}
                </div>
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani tasdiqlash</button>}
                {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>Kod yozilyapti…</p>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">2. Natija — bosib sinab ko'ring</p>
            <Browser dark={done && task === 't1' && demoDark}>
              <SiteCard>
                <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>Mening saytim</p>
                {!done && <p className="small" style={{ margin: 0, opacity: 0.5 }}>(agent hali hech narsa qo'shmadi)</p>}
                {done && task === 't1' && (
                  <div className="fade-step" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button className="site-btn" onClick={() => setDemoDark(d => !d)} style={{ background: demoDark ? '#FFD380' : T.ink, color: demoDark ? '#1A2436' : '#fff' }}>{demoDark ? 'Kunduzgi rejim' : 'Tungi rejim'}</button>
                    <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>+ yangi</span>
                  </div>
                )}
                {done && task === 't2' && (
                  <div className="fade-step" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button className="site-like" onClick={() => setDemoLikes(c => c + 1)}>Like · {demoLikes}</button>
                    <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>+ yangi</span>
                  </div>
                )}
                {done && task === 't3' && (
                  <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button className="site-btn" onClick={() => setDemoMenu(m => !m)}>{demoMenu ? '▴ Menyu' : '▾ Menyu'}</button>
                      <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>+ yangi</span>
                    </div>
                    {demoMenu && <div className="fade-step" style={{ background: T.bg, borderRadius: 9, padding: '9px 12px', fontSize: 13, width: '100%', lineHeight: 1.7 }}>Bosh sahifa · Loyihalar · Bog'lanish</div>}
                  </div>
                )}
              </SiteCard>
            </Browser>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Agent qo'shgan tugmani <b>o'zingiz bosib sinang</b> — haqiqatan ishlayaptimi? Darsda har birini qo'lda qurganingiz uchun, agent to'g'ri qildimi yo'qmi — <b>tekshira olasiz</b>.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Buyruq bering va rejani tasdiqlang — ishlaydigan natija shu yerda paydo bo'ladi.</p>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (o'lik tugmani jonlantirish) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [evt, setEvt] = useState(storedAnswer ? 'click' : null);
  const [react, setReact] = useState(storedAnswer ? 'color' : null);
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [bg, setBg] = useState(false);
  const evtOk = evt === 'click';
  const reactOk = react === 'color';
  const ready = evtOk && reactOk;
  useEffect(() => { if (ready && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Tugmani jonlantirish: hodisa + reaksiya", studentAnswer: `${evt}+${react}`, correct: true, firstAttemptCorrect: true, solved: true, picked: `${evt}+${react}` }); } }, [ready]);
  const EVTS = [{ id: 'click', l: 'Bosilganda (click)' }, { id: 'hover', l: 'Hover' }, { id: 'scroll', l: 'Aylantirilganda' }];
  const REACTS = [{ id: 'color', l: "Rangni o'zgartir" }, { id: 'delete', l: "Sahifani o'chir" }, { id: 'nothing', l: 'Hech narsa' }];
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "To'g'ri retseptni tuzing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi sinov: tugmani <span className="italic" style={{ color: T.accent }}>o'zingiz</span> to'g'ri jonlantiring</h2></div>
        <Mentor>Maqsad: <b style={{ color: T.ink }}>"Tugma bosilganda sahifa rangi o'zgarsin."</b> To'g'ri <b style={{ color: T.ink }}>HODISA</b> va to'g'ri <b style={{ color: T.ink }}>REAKSIYA</b>ni tanlang. Ikkalasi to'g'ri bo'lsa — tugma o'ngdagi saytda haqiqatan ishlay boshlaydi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">1. Qaysi HODISA?</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EVTS.map(e => <button key={e.id} className={`chip ${evt === e.id ? 'chip-on' : ''}`} onClick={() => { setEvt(e.id); setBg(false); }}>{e.l}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 4 }}>2. Qaysi REAKSIYA?</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {REACTS.map(r => <button key={r.id} className={`chip ${react === r.id ? 'chip-on' : ''}`} onClick={() => { setReact(r.id); setBg(false); }}>{r.l}</button>)}
            </div>
            <div className="codebox" style={{ marginTop: 6 }}>
              <div><FN>tugma</FN>.<FN>{evt === 'click' ? 'onclick' : (evt || '???')}</FN> = () =&gt; {'{'}</div>
              <div style={{ paddingLeft: 18 }}>{reactOk ? <>sahifa.<FN>rang</FN> = <STR>"yangi"</STR></> : <CM>// reaksiyani tanlang</CM>}</div>
              <div>{'}'}</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija — saytingiz</p>
            <Browser>
              <div style={{ borderRadius: 12, padding: 'clamp(22px,4vw,34px)', textAlign: 'center', transition: 'background .35s ease', background: bg ? T.accent : '#FFFFFF', border: `1.5px solid ${bg ? T.accent : '#E6E1D8'}` }}>
                <p className="small" style={{ margin: '0 0 14px', fontWeight: 700, letterSpacing: '0.03em', color: bg ? '#fff' : T.ink2 }}>Sahifa rangi: {bg ? "TO'Q SARIQ" : 'OQ'}</p>
                <button className="site-btn" disabled={!ready} onClick={() => { if (ready) setBg(b => !b); }} style={{ opacity: ready ? 1 : 0.5, background: bg ? '#fff' : T.ink, color: bg ? T.accent : '#fff' }}>{ready ? 'Tugmani bos' : 'qulflangan'}</button>
              </div>
            </Browser>
            <p className="small" style={{ margin: 0, color: T.ink3 }}>{!ready ? "Hodisa va reaksiyani to'g'ri tanlasangiz, tugma ishlay boshlaydi." : (bg ? 'Bosdingiz — sahifa rangi o\'zgardi! Yana bosing, qaytadi.' : 'Tugmani bosing — sahifa rangi darhol o\'zgaradi.')}</p>
            {passed
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mukammal! <b>Bosish</b> hodisasi va <b>rangni o'zgartirish</b> reaksiyasi birga — tugma jonlandi. Siz uni o'zingiz jonlantirdingiz.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Maslahat: tugma uchun "bosish" hodisasi va maqsadga mos reaksiya kerak.</p>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ["Statik sayt — jonsiz rasm; interaktiv sayt — javob beradi", "Asosiy qoida: HODISA → REAKSIYA → O'ZGARISH", "Hodisalar: bosish (click), hover, yozish (input)", "5 vosita: like, rejim, ko'rsat/yashir, jonli salom, forma", "AI agent quradi — lekin siz tushunasiz va tekshirasiz"];
  const HOMEWORK = [{ b: "O'z sahifangiz", t: "— HTML/CSS saytingizga 1 ta vosita qo'shing (masalan, like yoki tungi rejim)" }, { b: 'Antigravity bilan', t: "— agentga \"saytimga tungi rejim qo'sh\" deb topshiring, rejasini o'qing, keyin tasdiqlang" }, { b: "Tekshiruvchi bo'ling", t: "— agent qo'shgan vositani sinab ko'ring: ishlayaptimi? Xato bormi?" }];
  const GLOSSARY = [{ b: 'Interaktivlik', t: '— saytning foydalanuvchiga javob berishi' }, { b: 'Hodisa (event)', t: '— foydalanuvchi harakati (bosish, yozish)' }, { b: 'Reaksiya', t: '— ishga tushadigan JavaScript funksiyasi' }, { b: 'click', t: '— bosish hodisasi' }, { b: 'input', t: '— yozish hodisasi' }, { b: 'hover', t: '— ustiga olib borish hodisasi' }, { b: 'Antigravity', t: '— AI agent yordamida sayt quradigan muhit' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => {
    const nv = !o;
    if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80);
    return nv;
  });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> 1-praktika tugadi</span><h2 className="title h-title fade-up d1">Statik saytni <span className="italic" style={{ color: T.accent }}>jonli</span> saytga aylantirdingiz</h2><p className="body h-sub fade-up d2">{PASSED ? 'Zo\'r! Endi interaktivlik nimaligini his qildingiz va tushundingiz. Keyingi darsda AI bilan buni tezroq qilamiz.' : 'Yaxshi harakat! Hodisa → reaksiya → o\'zgarish qoidasini bir-ikki ekranni qayta ko\'rib mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Saytingizni jonlantiring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Esda tuting: AI quradi, lekin boshliq — sizsiz. Tushunib, tekshirib boring.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (interaktivlik)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PracticeLesson1({ lang: langProp, onFinished }) {
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
      answers: SCREEN_META.map((_, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        /* PRODUCTION: shu @import OLIB TASHLANADI — shriftlarni LMS yuklaydi (platform_contract). */
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
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === KNOPKALAR === */
        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava svg { display: block; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        /* === HOOK OPSIYALARI (radio) === */
        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .h-title { font-size: clamp(22px,4vw,38px); }
        .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

        /* === STAGE === */
        .stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55), 0 0 3px rgba(255,79,40,0.4); }

        /* === FRAME === */
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .num-badge { width: 30px; height: 30px; border-radius: 50%; background: ${T.accentSoft}; color: ${T.accent}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; flex-shrink: 0; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }

        /* === CODEBOX === */
        .codebox { background: ${CODE.bg}; border-radius: 12px; padding: 14px 16px; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); color: ${CODE.text}; line-height: 1.75; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.18); overflow-x: hidden; }
        .codebox > div { white-space: pre-wrap; word-break: break-word; }

        /* === TAGPILL / AI CARD === */
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; }

        /* === BROWSER / SAYT PREVIEW === */
        .browser { background: ${T.paper}; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.22); border: 1px solid rgba(167,166,162,0.25); }
        .browser-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: #ECEAE4; }
        .browser-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .browser-url { margin-left: 8px; flex: 1; font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; background: ${T.paper}; border-radius: 6px; padding: 4px 10px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .browser-body { padding: clamp(15px,2.6vw,22px); min-height: 150px; background: ${T.paper}; color: ${T.ink}; transition: background .35s ease, color .35s ease; }
        .browser-dark .browser-bar { background: #11151C; }
        .browser-dark .browser-body { background: #161E2B; color: #E8E5DD; }
        .browser-dark .browser-url { background: #0E141D; color: #7A8699; }

        /* === MINI-SAYT === */
        .site-card { display: flex; flex-direction: column; gap: 13px; align-items: flex-start; }
        .site-ava { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, ${T.accent}, #FF9B7D); display: flex; align-items: center; justify-content: center; font-family: 'Source Serif 4', serif; font-weight: 700; font-size: 24px; color: #fff; flex-shrink: 0; text-transform: uppercase; }
        .site-name { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(17px,2.4vw,21px); }
        .site-btn { font-family: 'Manrope'; font-weight: 600; font-size: 14px; border: none; border-radius: 10px; padding: 9px 16px; cursor: pointer; background: ${T.ink}; color: ${T.paper}; transition: all .18s; }
        .site-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .site-btn:disabled { cursor: not-allowed; }
        .site-like { display: inline-flex; align-items: center; gap: 8px; background: ${T.accentSoft}; color: ${T.accent}; border: none; border-radius: 99px; padding: 8px 16px; font-family: 'Manrope'; font-weight: 700; font-size: 15px; cursor: pointer; transition: transform .15s; }
        .site-like:active { transform: scale(.94); }
        .shake { animation: shake .36s ease; }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }

        /* === FLOW (Hodisa->Reaksiya->O'zgarish) === */
        .flow { display: flex; align-items: center; justify-content: center; gap: 5px; flex-wrap: wrap; }
        .flow-node { display: flex; align-items: center; gap: 5px; background: ${T.paper}; border-radius: 9px; padding: 6px 9px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-weight: 600; font-size: 11.5px; color: ${T.ink2}; transition: all .25s; opacity: .45; white-space: nowrap; }
        .flow-node.on { opacity: 1; background: ${T.accent}; color: #fff; transform: translateY(-2px); box-shadow: 0 8px 18px -6px rgba(255,79,40,0.4); }
        .flow-node .flow-n { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; background: rgba(167,166,162,0.3); font-family: 'JetBrains Mono'; font-weight: 700; font-size: 9.5px; flex-shrink: 0; }
        .flow-node.on .flow-n { background: rgba(255,255,255,0.3); }
        .flow-arrow { color: ${T.ink3}; font-size: 13px; }

        /* === EVENT KARTALAR === */
        .evt-card { display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer; border: none; border-radius: 12px; padding: 13px 15px; background: ${T.paper}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: all .18s; width: 100%; }
        .evt-card:hover { transform: translateY(-1px); }
        .evt-card.on { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22); }
        .evt-card .evt-name { font-family: 'Manrope'; font-weight: 600; font-size: 14px; color: ${T.ink}; }
        .evt-card .evt-hint { font-size: 12px; color: ${T.ink2}; }

        /* === IWATCH === */
        .iwatch { display: flex; align-items: baseline; gap: 9px; background: ${T.paper}; border-radius: 12px; padding: 12px 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .iwatch-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink3}; }
        .iwatch-eq { font-family: 'JetBrains Mono'; font-size: 18px; color: ${T.ink2}; }
        .iwatch-num { font-family: 'Fraunces', serif; font-size: clamp(34px,7vw,52px); color: ${T.accent}; line-height: 1; }

        /* === YAKUN === */
        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { width: 15px; height: 15px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 400; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; font-weight: 700; flex-shrink: 0; background: none; padding: 0; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

        /* MOBIL: yig'iladigan Mentor */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }

        /* === MOBIL POLISH (zichroq, toza, gorizontal toshmasin) === */
        @media (max-width: 640px) {
          .stage-content { padding-bottom: clamp(14px,3vw,22px); }
          .screen { gap: 13px; }
          .browser-body { min-height: 84px; padding: 14px 15px; }
          .codebox { font-size: 12.5px; line-height: 1.6; padding: 12px 13px; }
          .mentor-msg { padding: 11px 14px; }
          .site-ava { width: 46px; height: 46px; font-size: 21px; }
          .frame { padding: 15px 16px; }
          .split { gap: 14px; }
          .flow { gap: 4px; }
          .flow-node { padding: 6px 8px; }
        }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
