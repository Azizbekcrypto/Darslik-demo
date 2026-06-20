import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

// ============================================================
// PERN STACK — OBZOR: PostgreSQL + Express + React + Node.js — PLATFORM STANDARD v16
// Mavzu: frontend vs backend, React (ko'rinish), Node.js (JS serverda),
//        Express (yo'llar/so'rovlar), PostgreSQL (doimiy ombor),
//        to'liq so'rov sayohati — 4 texnologiya bitta jamoa (stack).
// Hook: saytga izoh yozasiz → sahifa yangilanadi → izoh yo'qoladi (saqlash yo'q!).
// Bosh metafora: RESTORAN — zal (React) · ofitsiant (Express) · oshxona (Node) · ombor (PostgreSQL).
// Maqsad: kod o'rgatish EMAS — keyingi modullarga (React, Node/Express/NestJS) xarita va qiziqish berish.
// AUDIOSIZ versiya — Mentor matni qoladi, TTS yo'q.
// Toza dizayn — ortiqcha emoji yo'q; ma'no so'z, rang va tipografiya bilan beriladi.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  purple: '#7C3AED', purpleSoft: '#EFE9FB',
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

// ===== Kod bo'yoqlari =====
const KW = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const STR = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const FN = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;
const CM = ({ children }) => <span style={{ color: CODE.comment }}>{children}</span>;

const LESSON_META = { lessonId: 'pean-stack-01-v16', lessonTitle: { uz: 'PERN Stack — 4 texnologiya, bitta jamoa', ru: 'PERN Stack — 4 технологии, одна команда' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's5b', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'rule',        template: 'custom',   scored: false, scope: null },
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

// ===== KO'P TANLOVLI TEST (audiosiz) =====
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

// ===== MENTOR (matn, audiosiz) =====
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

// ===== 4 TEXNOLOGIYA (PERN) — yagona manba =====
const TECH = [
  { key: 'react',    name: 'React',      color: '#019ACB', soft: '#E2F4FA', rest: 'Zal',       role: "Ko'rinish — foydalanuvchi ko'radigan va bosadigan hamma narsa", side: 'Frontend' },
  { key: 'express',  name: 'Express',    color: '#FF4F28', soft: '#FFE8E1', rest: 'Ofitsiant', role: "Yo'llar — so'rovni qabul qiladi va kerakli joyga yetkazadi", side: 'Backend' },
  { key: 'node',     name: 'Node.js',    color: '#1F7A4D', soft: '#E3F0E8', rest: 'Oshxona',   role: "Dvigatel — JavaScript'ni serverda ishlatadi", side: 'Backend' },
  { key: 'postgres', name: 'PostgreSQL', color: '#7C3AED', soft: '#EFE9FB', rest: 'Ombor',     role: "Xotira — ma'lumotlarni doimiy saqlaydi", side: 'Baza' }
];
const techBy = (k) => TECH.find(t => t.key === k);

// Texnologiya nishoni (rangli doira + nom)
const TechTag = ({ k, small }) => {
  const t = techBy(k);
  return (
    <span className="ttag" style={{ background: t.soft, color: t.color, fontSize: small ? 11.5 : 12.5 }}>
      <span className="ttag-dot" style={{ background: t.color }} />{t.name}
    </span>
  );
};

// Mini brauzer oynasi
const BWindow = ({ url = 'mening-saytim.uz', children, minH }) => (
  <div className="bw" style={minH ? { minHeight: minH } : undefined}>
    <div className="bw-bar">
      <span className="bw-dot" style={{ background: '#FF5F56' }} /><span className="bw-dot" style={{ background: '#FFBD2E' }} /><span className="bw-dot" style={{ background: '#27C93F' }} />
      <span className="bw-url mono">{url}</span>
    </div>
    <div className="bw-body">{children}</div>
  </div>
);

// ===== SCREEN 0 — HOOK (izoh yo'qoldi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [comments, setComments] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [lost, setLost] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const POOL = ['Zo’r sayt ekan! — Aziz', 'Menga ham yoqdi — Malika', 'Qoyil! — Sardor'];
  const OPTS = [
    { id: 'a', label: 'Internet uzilib qoldi' },
    { id: 'b', label: 'Izoh hech qayerda saqlanmagan edi' },
    { id: 'c', label: 'Sayt butunlay buzilib qoldi' }
  ];
  const addComment = () => setComments(c => (c.length < POOL.length ? [...c, POOL[c.length]] : c));
  const refresh = () => {
    if (comments.length === 0 || spinning) return;
    setSpinning(true);
    setTimeout(() => { setSpinning(false); setComments([]); setLost(true); }, 700);
  };
  const pick = (v) => { if (picked !== null || !lost) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Izohingiz <span className="italic" style={{ color: T.accent }}>qayoqqa</span> yo'qoldi?</h1>
        <Mentor>Siz AI bilan chiroyli sayt yasadingiz. Do'stlaringiz unga izoh yozdi. Endi tajriba: avval <b style={{ color: T.ink }}>izoh qoldiring</b>, keyin <b style={{ color: T.ink }}>sahifani yangilang</b> — nima bo'lishini kuzating.</Mentor>
        <Split>
          <Col>
            <BWindow minH={170}>
              {spinning ? (
                <div className="bw-spin"><span className="spinner" /> yuklanmoqda…</div>
              ) : (
                <>
                  <p className="bw-h">Mening saytim</p>
                  <p className="bw-sub">Izohlar:</p>
                  {comments.length === 0
                    ? <p className="bw-empty">{lost ? 'Izohlar yo’q… hammasi yo’qoldi!' : 'Hozircha izoh yo’q'}</p>
                    : comments.map((c, i) => <div key={i} className="cmt el-in">{c}</div>)}
                </>
              )}
            </BWindow>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={addComment} disabled={spinning || comments.length >= POOL.length}>Izoh qoldirish</button>
              <button className="btn-soft" onClick={refresh} disabled={comments.length === 0 || spinning} style={{ boxShadow: comments.length > 0 && !lost ? `0 0 0 1.5px ${T.accent}` : undefined }}>Sahifani yangilash ⟳</button>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>{lost ? 'Sizningcha, nega izohlar yo’qoldi?' : 'Avval chap tomonda tajriba qiling'}</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9, opacity: lost ? 1 : 0.45 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !lost} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Aynan shunday! Saytingiz izohni <b>eslab qolishni bilmaydi</b> — unga ko'rinmas jamoa kerak: server va baza. Bugun ana shu jamoa bilan tanishamiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Frontend va Backend', tag: 'ikki dunyo' },
    { text: "React — ko'rinish", tag: 'frontend' },
    { text: 'Node.js — JS serverda', tag: 'backend' },
    { text: 'Express va PostgreSQL', tag: "yo'llar + ombor" },
    { text: "To'liq sayohat", tag: 'PERN' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi jamoa — PERN stack</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TECH.map((t, i) => (
          <div key={t.key} className="pean-row fade-up" style={{ animationDelay: `${0.08 + i * 0.06}s` }}>
            <span className="pean-badge" style={{ background: t.color }}>{t.name[0]}</span>
            <span style={{ fontWeight: 700, color: T.ink, minWidth: 92 }}>{t.name}</span>
            <span className="small" style={{ color: T.ink2 }}>{t.role.split(' — ')[0]}</span>
          </div>
        ))}
      </div>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">5 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head">
          <h2 className="title h-title fade-up">Katta saytlar <span className="italic" style={{ color: T.accent }}>qanday</span> quriladi?</h2>
        </div>
        <Mentor>Bugun yangi kod yozmaymiz — <b style={{ color: T.ink }}>xarita</b> olamiz. YouTube ham, Telegram ham 4 texnologiya jamoasi ustida turadi. Shu jamoani bilsangiz, keyingi modullar aniq xaritaga aylanadi.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Jamoani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — FRONTEND vs BACKEND (restoran) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const INFO = {
    zal: { title: 'Zal = FRONTEND', color: T.blue, soft: T.blueSoft, lines: ['Mehmon KO’RADIGAN qism', 'Saytda: tugmalar, ranglar, kartochkalar, animatsiyalar', 'Siz buni allaqachon qilgansiz — HTML, CSS, JS!'] },
    osh: { title: 'Oshxona = BACKEND', color: T.success, soft: T.successSoft, lines: ['Mehmon KO’RMAYDIGAN qism — lekin asosiy ish shu yerda', 'Saytda: parolni tekshirish, izohni saqlash, pul o’tkazish', 'Bugun aynan shu dunyoga kiramiz'] }
  };
  const cur = active ? INFO[active] : null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Frontend va Backend" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala xonani ko’ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Restoranning qaysi qismini mehmon <span className="italic" style={{ color: T.accent }}>ko'radi</span>?</h2></div>
        <Mentor>Har bir sayt — restoranga o'xshaydi. Mehmon <b style={{ color: T.ink }}>zalni</b> ko'radi: stol, menyu, taom. Lekin taom <b style={{ color: T.ink }}>oshxonada</b> tayyorlanadi — mehmon u yerga kirmaydi. Ikkala xonani bosib, sayt bilan solishtiring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className={`rest-card ${active === 'zal' ? 'on' : ''}`} onClick={() => tap('zal')}>
                <span className="rest-ic" style={{ background: T.blueSoft, color: T.blue }}>Z</span>
                <span className="rest-body"><b>Zal</b><span className="small" style={{ color: T.ink2 }}>stol · menyu · taom {seen.has('zal') && '✓'}</span></span>
              </button>
              <button className={`rest-card ${active === 'osh' ? 'on' : ''}`} onClick={() => tap('osh')}>
                <span className="rest-ic" style={{ background: T.successSoft, color: T.success }}>O</span>
                <span className="rest-body"><b>Oshxona</b><span className="small" style={{ color: T.ink2 }}>oshpaz · pech · ombor {seen.has('osh') && '✓'}</span></span>
              </button>
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.title}</span></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  {cur.lines.map((l, i) => (<p key={i} className="body" style={{ margin: 0, color: T.ink }}>{i === 0 ? <b>{l}</b> : l}</p>))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Xonani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>Frontend</b> — siz ko'rgan hamma narsa. <b>Backend</b> — ko'rinmas, lekin izohni saqlaydigan, parolni tekshiradigan kuch. Hook'dagi izoh yo'qoldi, chunki saytimizda backend yo'q edi!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — REACT (bloklardan ko'rinish) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { key: 'header', label: 'Header' },
    { key: 'card', label: 'Karta' },
    { key: 'btn', label: 'Tugma' }
  ];
  const [added, setAdded] = useState([]);
  const done = added.length >= 3;
  const add = (k) => setAdded(a => (a.includes(k) ? a : [...a, k]));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="React" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${added.length}/3 blokni qo'shing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Million tugmali saytni <span className="italic" style={{ color: T.blue }}>qanday</span> yig'amiz?</h2></div>
        <Mentor>Frontend dunyosining yulduzi — <b style={{ color: T.blue }}>React</b>. G'oyasi oddiy: sayt <b style={{ color: T.ink }}>bloklardan</b> yig'iladi (xuddi Minecraft'dagidek!). Bitta "Karta" blokini yozasiz — uni 100 joyda ishlatasiz. Bloklarni bosib, saytni yig'ing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Bloklar (komponentlar)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PARTS.map(p => (<button key={p.key} className={`chip ${added.includes(p.key) ? 'chip-on' : ''}`} onClick={() => add(p.key)}><span className="mono">{'<'}{p.label}{' />'}</span>{added.includes(p.key) && ' ✓'}</button>))}
            </div>
            <div className="codebox fade-up delay-2" style={{ fontSize: 'clamp(12px,1.8vw,14px)' }}>
              <div><KW>function</KW> <FN>Sayt</FN>() {'{'}</div>
              <div>{'  '}<KW>return</KW> (</div>
              {added.length === 0 && <div>{'    '}<CM>// bloklarni qo'shing…</CM></div>}
              {added.map(k => { const p = PARTS.find(x => x.key === k); return <div key={k} className="el-in">{'    '}<STR>{'<'}{p.label}{' />'}</STR></div>; })}
              <div>{'  '})</div>
              <div>{'}'}</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija — ekranda</p>
            <BWindow minH={150}>
              {added.length === 0 && <p className="bw-empty">bo'sh sahifa…</p>}
              {added.includes('header') && <div className="rb rb-header el-in">Mening do'konim</div>}
              {added.includes('card') && <div className="rb rb-card el-in"><span className="rb-thumb" /><span>Krossovka — 250 000 so'm</span></div>}
              {added.includes('btn') && <button className="rb rb-btn el-in">Savatga qo'shish</button>}
            </BWindow>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b style={{ color: T.blue }}>React</b> — frontend kutubxonasi: ko'rinishni bloklardan yig'adi. Keyingi modul <b>to'liq React'ga</b> bag'ishlanadi — o'z bloklaringizni yasaysiz!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Saytning foydalanuvchi ko'radigan va bosadigan qismi nima deb ataladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Saytning foydalanuvchi <span className="italic" style={{ color: T.accent }}>ko'radigan</span> qismi nima deb ataladi?</h2></>}
    options={['Backend', 'Frontend', 'Baza (database)', 'Server']} correctIdx={1}
    explainCorrect="To'g'ri! Frontend — ekrandagi hamma narsa: tugmalar, ranglar, kartochkalar. Restorandagi zal kabi."
    explainWrong={{
      0: "Backend — aksincha, ko'rinmas qism (oshxona). Ko'rinadigan qism — frontend.",
      2: "Baza ma'lumotni saqlaydi, u ham ko'rinmas qismda. Ko'rinadigani — frontend.",
      3: "Server — backend ishlaydigan kompyuter. Foydalanuvchi ko'radigani — frontend.",
      default: "Ko'rinadigan qism — frontend."
    }} />
);

// ===== SCREEN 5 — NODE.JS (JS serverda) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [place, setPlace] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setPlace(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Node.js" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala joyda ishlating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">JavaScript brauzerdan tashqarida <span className="italic" style={{ color: T.success }}>yashay oladimi</span>?</h2></div>
        <Mentor>Siz JS'ni brauzerda yozdingiz. Lekin sir bor: <b style={{ color: T.success }}>Node.js</b> degan dvigatel JS'ni <b style={{ color: T.ink }}>serverda</b> ham ishlata oladi — restoran oshxonasidagi pech kabi. Bitta kodni ikki joyda ishlatib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Kod bitta — joy ikkita</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${place === 'browser' ? 'chip-on' : ''}`} onClick={() => tap('browser')}>Brauzerda{seen.has('browser') && ' ✓'}</button>
              <button className={`chip ${place === 'server' ? 'chip-on' : ''}`} onClick={() => tap('server')}>Serverda (Node.js){seen.has('server') && ' ✓'}</button>
            </div>
            <div className="codebox fade-up delay-2" style={{ fontSize: 'clamp(12.5px,1.9vw,14.5px)' }}>
              <div><FN>console</FN>.<FN>log</FN>(<STR>"Salom, dunyo!"</STR>)</div>
            </div>
          </Col>
          <Col>
            {place ? (
              <div className="demo-swap" key={place} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {place === 'browser' ? (
                  <BWindow minH={110}>
                    <p className="bw-sub mono" style={{ margin: 0 }}>Console</p>
                    <div className="cmt mono el-in">› Salom, dunyo!</div>
                  </BWindow>
                ) : (
                  <div className="term">
                    <div className="term-bar"><span className="term-dot" style={{ background: '#FF5F56' }} /><span className="term-dot" style={{ background: '#FFBD2E' }} /><span className="term-dot" style={{ background: '#27C93F' }} /><span className="term-title">server terminali</span></div>
                    <div className="term-body">
                      <div className="term-line"><span className="term-arrow">$</span><span>node salom.js</span></div>
                      <div className="term-line el-in"><span className="term-arrow">›</span><span>Salom, dunyo!</span></div>
                    </div>
                  </div>
                )}
                <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>{place === 'browser' ? "Bu sizga tanish — JS brauzerda, frontendda ishlayapti." : <span><b style={{ color: T.success }}>Node.js</b> — JS endi serverda! Brauzersiz, oshxonada. Backend ham — siz bilgan til!</span>}</p></div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Joyni tanlang</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Bitta til — ikki dunyo. JS bilganingiz uchun siz <b>backend'ga tayyorsiz</b>: yangi til o'rganish shart emas!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Node.js nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.success }}>Node.js</span> nima qiladi?</h2></>}
    options={['Sahifani bezaydi (CSS kabi)', "JavaScript'ni serverda ishlatadi", 'Rasmlarni tahrirlaydi', 'Internet tezligini oshiradi']} correctIdx={1}
    explainCorrect="To'g'ri! Node.js — dvigatel: JS kodini brauwersiz, serverda ishlatadi. Backend shu dvigatel ustida quriladi."
    explainWrong={{
      0: "Bezash — CSS'ning ishi, frontendda. Node.js esa JS'ni serverda ishlatadi.",
      2: "Yo'q, Node.js rasm bilan ishlamaydi — u JS'ni serverda ishlatadigan dvigatel.",
      3: "Tezlikka aloqasi yo'q — Node.js JS'ni serverda ishlatadi.",
      default: "Node.js — JS'ni serverda ishlatadigan dvigatel."
    }} />
);

// ===== SCREEN 6 — EXPRESS (ofitsiant / yo'llar) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const MENU = [
    { key: 'palov', label: 'Palov', path: '/palov' },
    { key: 'lagmon', label: "Lag'mon", path: '/lagmon' },
    { key: 'choy', label: 'Choy', path: '/choy' }
  ];
  const [order, setOrder] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setOrder(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const cur = MENU.find(m => m.key === order);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Express" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 buyurtma bering`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server minglab so'rovni qanday <span className="italic" style={{ color: T.accent }}>adashtirmaydi</span>?</h2></div>
        <Mentor>Restoranda buyurtmani <b style={{ color: T.accent }}>ofitsiant</b> oladi: eshitadi, oshxonaga yetkazadi, taomni qaytaradi. Serverda bu ishni <b style={{ color: T.accent }}>Express</b> qiladi: har taomning o'z <b style={{ color: T.ink }}>yo'li</b> bor. Buyurtma berib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Menyu — buyurtma bering</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MENU.map(m => (<button key={m.key} className={`chip ${order === m.key ? 'chip-on' : ''}`} onClick={() => tap(m.key)}>{m.label}{seen.has(m.key) && ' ✓'}</button>))}
            </div>
            <div className="codebox fade-up delay-2" style={{ fontSize: 'clamp(11.5px,1.7vw,13.5px)' }}>
              <div><CM>// Express — har taomning yo'li</CM></div>
              {MENU.map(m => (
                <div key={m.key} style={{ background: order === m.key ? 'rgba(31,122,77,0.25)' : 'transparent', borderRadius: 4, opacity: order && order !== m.key ? 0.45 : 1, padding: '1px 3px' }}>
                  <FN>app</FN>.<KW>get</KW>(<STR>'{m.path}'</STR>, …)
                </div>
              ))}
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="demo-swap" key={order} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="jr-mini">
                  <span className="jr-mini-step">Siz</span><span className="jr-mini-arr">→</span>
                  <span className="jr-mini-step" style={{ color: T.accent, fontWeight: 700 }}>Express</span><span className="jr-mini-arr">→</span>
                  <span className="jr-mini-step">Oshxona</span><span className="jr-mini-arr">→</span>
                  <span className="jr-mini-step" style={{ color: T.success, fontWeight: 700 }}>Tayyor!</span>
                </div>
                <div style={{ background: T.paper, borderRadius: 14, padding: '18px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
                  <p className="mono small" style={{ margin: '0 0 6px', color: T.ink2 }}>GET {cur.path}</p>
                  <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: T.success, margin: 0, fontSize: 'clamp(16px,2.4vw,20px)' }}>{cur.label} tayyor!</p>
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Taomni tanlang</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b style={{ color: T.accent }}>Express</b> — Node.js ustidagi "ofitsiant": so'rovni qabul qiladi, yo'lini topadi, javob qaytaradi. Har manzil (<span className="mono">/palov</span>) — bitta yo'l (route).</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — POSTGRESQL (ombor / jadval) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POOL = [
    { id: 1, item: 'Palov', who: 'Aziz' },
    { id: 2, item: "Lag'mon", who: 'Malika' },
    { id: 3, item: 'Choy', who: 'Sardor' }
  ];
  const [rows, setRows] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [restarted, setRestarted] = useState(false);
  const done = rows.length >= 2 && restarted;
  const addRow = () => setRows(r => (r.length < POOL.length ? [...r, POOL[r.length]] : r));
  const restart = () => {
    if (rows.length === 0 || spinning) return;
    setSpinning(true);
    setTimeout(() => { setSpinning(false); setRestarted(true); }, 800);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="PostgreSQL" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (rows.length < 2 ? 'Buyurtma qo’shing' : 'Serverni o’chirib-yoqing')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumot qayerda <span className="italic" style={{ color: T.purple }}>joylashadi</span>?</h2></div>
        <Mentor>Hook'dagi izohlar yo'qoldi, chunki ular hech qayerda yozilmagan edi. <b style={{ color: T.purple }}>PostgreSQL</b> — bu ombor daftari: ma'lumot <b style={{ color: T.ink }}>jadvalga</b> yoziladi va o'chmaydi. Buyurtma qo'shing, so'ng serverni o'chirib-yoqib sinang!</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={addRow} disabled={spinning || rows.length >= POOL.length}>+ Buyurtma qo'shish</button>
              <button className="btn-soft" onClick={restart} disabled={rows.length === 0 || spinning} style={{ boxShadow: rows.length >= 2 && !restarted ? `0 0 0 1.5px ${T.accent}` : undefined }}>Serverni o'chirib-yoqish ⏻</button>
            </div>
            <div className="codebox fade-up delay-2" style={{ fontSize: 'clamp(11.5px,1.7vw,13px)' }}>
              <div><CM>-- SQL: jadvalga yozish</CM></div>
              <div><KW>INSERT INTO</KW> buyurtmalar …</div>
            </div>
            {spinning && <p className="small mono fade-step" style={{ color: T.accent, margin: 0 }}>server o'chirilmoqda… yoqilmoqda…</p>}
          </Col>
          <Col>
            <p className="flow-label">Jadval: buyurtmalar</p>
            <div className="dbt fade-up delay-2" style={{ opacity: spinning ? 0.35 : 1 }}>
              <div className="dbt-row dbt-head"><span>id</span><span>taom</span><span>kim</span></div>
              {rows.length === 0
                ? <div className="dbt-empty">bo'sh jadval…</div>
                : rows.map(r => (<div key={r.id} className="dbt-row el-in"><span className="mono">{r.id}</span><span>{r.item}</span><span>{r.who}</span></div>))}
            </div>
            {restarted && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Server o'chib-yondi — ma'lumot <b>joyida!</b> Mana hook'dagi muammoning yechimi: <b style={{ color: T.purple }}>PostgreSQL</b> — doimiy xotira. Izoh endi hech qachon yo'qolmaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SAYOHAT QADAMLARI (s8 va s15 uchun yagona manba) =====
const JOURNEY = [
  { who: 'react', t: 'Siz like tugmasini bosdingiz', d: 'React buni darhol payqadi' },
  { who: 'react', t: "React serverga so'rov yubordi", d: 'POST /like — xat jo’nadi' },
  { who: 'express', t: 'Express so’rovni qabul qildi', d: "Node.js ichida kerakli yo'l topildi" },
  { who: 'postgres', t: 'PostgreSQL yozib qo’ydi', d: 'jadvalda like +1' },
  { who: 'react', t: 'Javob qaytdi — yurak qizardi', d: 'hammasi 1 soniyadan tez!' }
];

// ===== SCREEN 8 — TO'LIQ SAYOHAT (animatsiya) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [at, setAt] = useState(-1);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const done = finished;
  const start = () => { if (running) return; setRunning(true); setAt(-1); };
  useEffect(() => {
    if (!running) return;
    if (at >= JOURNEY.length - 1) { setRunning(false); setFinished(true); return; }
    const t = setTimeout(() => setAt(a => a + 1), at === -1 ? 300 : 750);
    return () => clearTimeout(t);
  }, [running, at]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="To'liq sayohat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Sayohatni boshlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Like bosilganda 1 soniyada <span className="italic" style={{ color: T.accent }}>nima bo'ladi</span>?</h2></div>
        <Mentor>Endi 4 texnologiyani <b style={{ color: T.ink }}>birga</b> ko'ramiz. Siz video ostidagi yurakchani bosasiz — va ko'z ochib-yumguncha to'rt qahramon ishga tushadi. Tugmani bosib, sayohatni kuzating.</Mentor>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" onClick={start} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Sayohat ketmoqda…' : (finished ? '↻ Yana bir bor' : '▶ Sayohatni boshlash')}</button>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {JOURNEY.map((s, i) => {
                const tech = techBy(s.who);
                const on = i <= at;
                const cur = i === at;
                return (
                  <div key={i} className={`jr-step ${on ? 'on' : ''} ${cur ? 'cur' : ''}`} style={on ? { boxShadow: `inset 0 0 0 1.5px ${tech.color}` } : undefined}>
                    <span className="jr-num" style={{ background: on ? tech.color : T.ink3 }}>{i + 1}</span>
                    <span className="jr-body">
                      <span className="jr-t">{s.t}</span>
                      {on && <span className="jr-d el-in">{s.d}</span>}
                    </span>
                    <span className="jr-tag" style={{ color: tech.color, background: on ? tech.soft : 'transparent', opacity: on ? 1 : 0.4 }}>{tech.name}</span>
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <BWindow url="ijtimoiy-tarmoq.uz" minH={150}>
              <div className="rb rb-card" style={{ marginBottom: 8 }}><span className="rb-thumb" style={{ background: '#cfe8f5' }} /><span>Mushukcha videosi</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24, filter: finished || at >= 4 ? 'none' : 'grayscale(1)', transition: 'filter 0.3s' }}>❤️</span>
                <span className="mono" style={{ fontWeight: 700, color: finished || at >= 3 ? T.accent : T.ink3 }}>{finished || at >= 3 ? '1 025' : '1 024'}</span>
                <span className="small" style={{ color: T.ink3 }}>like</span>
              </div>
            </BWindow>
            {finished && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mana — <b>to'liq stack ishda</b>: React ko'rsatdi, Express yo'lladi, Node yurgizdi, PostgreSQL esladi. Siz har kuni millionlab shunday sayohatga sabab bo'lasiz!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Like, izoh va boshqa ma'lumotlar doimiy qayerda saqlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Like va izohlar <span className="italic" style={{ color: T.accent }}>doimiy</span> qayerda saqlanadi?</h2></>}
    options={['Brauzerda', 'Telefon ekranida', 'PostgreSQL bazasida', 'CSS faylida']} correctIdx={2}
    explainCorrect="To'g'ri! Baza (PostgreSQL) — doimiy ombor: server o'chib-yonsa ham ma'lumot joyida qoladi."
    explainWrong={{
      0: "Brauzer sahifa yangilanganda unutadi — hook'da ko'rdik! Doimiy joy — baza.",
      1: "Ekran faqat ko'rsatadi, saqlamaydi. Doimiy joy — PostgreSQL bazasi.",
      3: "CSS — bezak tili, ma'lumot saqlamaydi. Doimiy joy — baza.",
      default: "Doimiy saqlash — PostgreSQL bazasining ishi."
    }} />
);

// ===== SCREEN 10 — PERN = JAMOA (4 karta) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const cur = active ? techBy(active) : null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="PERN jamoasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 a'zoni taniqing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'rt texnologiya — nega <span className="italic" style={{ color: T.accent }}>bitta jamoa</span>?</h2></div>
        <Mentor>Futbol jamoasida darvozabon, himoyachi, yarim himoyachi, hujumchi bor — har birining o'z roli. Saytda ham shunday. To'rt a'zoning har birini bosib, rolini bilib oling.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {TECH.map(t => (
                <button key={t.key} className={`tech-card ${active === t.key ? 'on' : ''}`} onClick={() => tap(t.key)} style={active === t.key ? { boxShadow: `inset 0 0 0 2px ${t.color}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` } : undefined}>
                  <span className="pean-badge" style={{ background: t.color }}>{t.name[0]}</span>
                  <span style={{ fontWeight: 700, fontSize: 'clamp(13px,1.7vw,15px)' }}>{t.name}</span>
                  <span className="small" style={{ color: T.ink3 }}>{seen.has(t.key) ? '✓ tanishdik' : t.side}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.name}</span><span style={{ fontWeight: 600, color: T.ink }}>{cur.side}</span></span>
                <p className="body" style={{ color: T.ink, margin: '10px 0 4px' }}>{cur.role}</p>
                <p className="small" style={{ color: T.ink2, margin: 0 }}>Restoranda: <b style={{ color: cur.color }}>{cur.rest}</b></p>
              </div>
            ) : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>A'zoni bosing</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu jamoaning nomi — <b style={{ color: T.accent }}>PERN stack</b>: <b>P</b>ostgreSQL + <b>E</b>xpress + <b>R</b>eact + <b>N</b>ode.js. <b>Stack</b> — bir-birini to'ldiruvchi texnologiyalar to'plami.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — KIM NIMA QILADI? (vazifa-tester) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { q: "Tugmani ko'k rangga bo'yab, bosilganda animatsiya qilish", a: 'react', hint: "Bu ko'rinadigan ish — zal." },
    { q: "/profil manziliga kelgan so'rovni qabul qilib yo'naltirish", a: 'express', hint: "Bu yo'l topish ishi — ofitsiant." },
    { q: "Foydalanuvchilar ro'yxatini doimiy eslab qolish", a: 'postgres', hint: 'Bu xotira ishi — ombor.' }
  ];
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState(null);
  const [solvedAll, setSolvedAll] = useState(false);
  const done = solvedAll;
  const cur = TASKS[Math.min(idx, TASKS.length - 1)];
  const pick = (k) => {
    if (solvedAll) return;
    if (k === cur.a) {
      setWrong(null);
      if (idx >= TASKS.length - 1) setSolvedAll(true);
      else setIdx(i => i + 1);
    } else setWrong(k);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vazifa taqsimoti" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Vazifa ${Math.min(idx + 1, TASKS.length)}/${TASKS.length}`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu vazifani <span className="italic" style={{ color: T.accent }}>qaysi texnologiya</span> bajaradi?</h2></div>
        <Mentor>Endi siz jamoa sardorisiz! Har vazifani <b style={{ color: T.ink }}>to'g'ri texnologiyaga</b> topshiring. O'ylab ko'ring: bu ish ko'rinadimi (zal), yo'l topishmi (ofitsiant), saqlashmi (ombor)?</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Vazifa {Math.min(idx + 1, TASKS.length)} / {TASKS.length}</p>
            <div className="task-card demo-swap" key={solvedAll ? 'fin' : idx}>
              <p className="body" style={{ margin: 0, color: T.ink, fontWeight: 600 }}>{solvedAll ? 'Barcha vazifalar taqsimlandi!' : cur.q}</p>
            </div>
            {!solvedAll && (
              <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TECH.map(t => (
                  <button key={t.key} className={`chip ${wrong === t.key ? 'chip-bad' : ''}`} onClick={() => pick(t.key)}>
                    <span className="ttag-dot" style={{ background: t.color }} />{t.name}
                  </button>
                ))}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Taqsimot</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TASKS.map((t, i) => {
                const ok = solvedAll || i < idx;
                const tech = techBy(t.a);
                return (
                  <div key={i} className={ok ? 'jr-step on el-in' : 'jr-step'} style={ok ? { boxShadow: `inset 0 0 0 1.5px ${tech.color}` } : { opacity: 0.45 }}>
                    <span className="jr-body"><span className="jr-t" style={{ fontSize: 'clamp(12.5px,1.5vw,14px)' }}>{t.q}</span></span>
                    {ok && <span className="jr-tag" style={{ color: tech.color, background: tech.soft }}>{tech.name}</span>}
                  </div>
                );
              })}
            </div>
            {wrong !== null && !solvedAll && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{techBy(wrong).name} emas. Maslahat: {cur.hint}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r taqsimladingiz! Har texnologiya — o'z ishining ustasi. Birini olib tashlasangiz, jamoa to'xtaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Buyurtma tugmasi bosilganda so'rov qaysi yo'l bilan boradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Tugma bosilganda so'rov qaysi <span className="italic" style={{ color: T.accent }}>yo'l</span> bilan boradi?</h2></>}
    options={['PostgreSQL → React → Express', 'React → Express → PostgreSQL', 'Express → React → PostgreSQL', 'React → PostgreSQL → Express']} correctIdx={1}
    explainCorrect="To'g'ri! Avval ko'rinish (React), so'rov ofitsiantga (Express), u esa omborga (PostgreSQL). Javob xuddi shu yo'ldan qaytadi."
    explainWrong={{
      0: "Baza o'zi boshlamaydi — sayohat foydalanuvchidan, ya'ni React'dan boshlanadi.",
      2: "Express so'rovni qabul qiladi, lekin sayohat React'dan (tugmadan) boshlanadi.",
      3: "React bazaga to'g'ridan-to'g'ri bormaydi — avval Express qabul qilib yo'naltiradi.",
      default: "Yo'l: React → Express → PostgreSQL."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: O'Z STACKINGIZNI YIG'ING =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const SLOTS = [
    { key: 'view', label: "Ko'rinish", sub: 'kartochkalar, tugmalar', a: 'react' },
    { key: 'engine', label: 'Dvigatel', sub: 'JS serverda', a: 'node' },
    { key: 'routes', label: "Yo'llar", sub: "so'rovlarni qabul qilish", a: 'express' },
    { key: 'store', label: 'Ombor', sub: 'buyurtmalarni saqlash', a: 'postgres' }
  ];
  const [assign, setAssign] = useState({});
  const [activeSlot, setActiveSlot] = useState('view');
  const [checked, setChecked] = useState(false);
  const [allOk, setAllOk] = useState(false);
  const usedTech = Object.values(assign);
  const full = SLOTS.every(s => assign[s.key]);
  const done = allOk;
  const tapSlot = (k) => {
    setChecked(false);
    if (assign[k]) { setAssign(a => { const n = { ...a }; delete n[k]; return n; }); setActiveSlot(k); }
    else setActiveSlot(k);
  };
  const tapTech = (tk) => {
    if (!activeSlot || usedTech.includes(tk) || allOk) return;
    setChecked(false);
    setAssign(a => {
      const n = { ...a, [activeSlot]: tk };
      const nextEmpty = SLOTS.find(s => !n[s.key]);
      setActiveSlot(nextEmpty ? nextEmpty.key : null);
      return n;
    });
  };
  const launch = () => {
    if (!full) return;
    setChecked(true);
    if (SLOTS.every(s => assign[s.key] === s.a)) setAllOk(true);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · stack yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Stackni yig’ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mini-do'kon jamoasini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> tuzing</h2></div>
        <Mentor>Tez orada <b style={{ color: T.ink }}>mini-do'kon</b> qurasiz — unga jamoa kerak! Texnologiyani tanlab vazifaga biriktiring, so'ng <b style={{ color: T.ink }}>Ishga tushirish</b>!</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">1 — texnologiyani tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TECH.map(t => {
                const used = usedTech.includes(t.key);
                return (
                  <button key={t.key} className="chip" disabled={used || allOk} onClick={() => tapTech(t.key)} style={{ opacity: used ? 0.35 : 1, padding: '7px 12px', fontSize: 13 }}>
                    <span className="ttag-dot" style={{ background: t.color }} />{t.name}
                  </button>
                );
              })}
            </div>
            <p className="flow-label">2 — vazifalarga biriktiring</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SLOTS.map(s => {
                const tk = assign[s.key];
                const tech = tk ? techBy(tk) : null;
                const isBad = checked && tk && tk !== s.a && !allOk;
                const isOk = (checked || allOk) && tk === s.a;
                return (
                  <button key={s.key} className={`slotx ${activeSlot === s.key && !tk ? 'act' : ''} ${isBad ? 'bad' : ''} ${isOk ? 'ok' : ''}`} onClick={() => tapSlot(s.key)}>
                    <span className="slotx-l"><b>{s.label}</b><span className="small" style={{ color: T.ink3 }}>{s.sub}</span></span>
                    {tech ? <span className="ttag" style={{ background: tech.soft, color: tech.color }}><span className="ttag-dot" style={{ background: tech.color }} />{tech.name}</span> : <span className="small" style={{ color: T.ink3, fontStyle: 'italic' }}>bo'sh</span>}
                  </button>
                );
              })}
            </div>
          </Col>
          <Col>
            <button className="btn fade-up delay-2" onClick={launch} disabled={!full || allOk} style={{ alignSelf: 'flex-start' }}>▶ Ishga tushirish</button>
            {allOk ? (
              <div className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <BWindow url="mini-dokon.uz" minH={120}>
                  <div className="rb rb-header el-in">Mini do'kon</div>
                  <div className="rb rb-card el-in"><span className="rb-thumb" /><span>Krossovka — 250 000 so'm</span></div>
                  <button className="rb rb-btn el-in">Savatga qo'shish</button>
                </BWindow>
                <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Do'kon ishga tushdi! Jamoa to'g'ri yig'ildi — endi izohlar ham, buyurtmalar ham yo'qolmaydi.</p></div>
              </div>
            ) : checked && full ? (
              <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qizil kartochkalar noto'g'ri joyda. Ularni bosib bo'shating va qayta biriktiring. Eslang: zal, pech, ofitsiant, daftar.</p></div>
            ) : (
              <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Maslahat: <b style={{ color: T.ink }}>ko'rinish</b> — zal, <b style={{ color: T.ink }}>dvigatel</b> — oshxona pechi, <b style={{ color: T.ink }}>yo'llar</b> — ofitsiant, <b style={{ color: T.ink }}>ombor</b> — daftar.</p></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (AI rollarni adashtirdi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'pg' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'pg';
  const done = fixed;
  const LINES = [
    { key: 'react', text: 'React — sahifadagi kartochka va tugmalarni chizadi', ok: true },
    { key: 'pg', text: fixed ? "PostgreSQL — ma'lumotlarni jadvalda doimiy saqlaydi" : 'PostgreSQL — sahifaga chiroyli tugmalar chizadi', ok: false },
    { key: 'express', text: "Express — so'rovlarni qabul qilib yo'naltiradi", ok: true },
    { key: 'node', text: "Node.js — JavaScript'ni serverda ishlatadi", ok: true }
  ];
  const tap = (k) => {
    if (found) return;
    setPicked(k);
  };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI jamoani tushuntirdi — lekin bitta rol <span className="italic" style={{ color: T.accent }}>adashgan</span>?</h2></div>
        <Mentor>AI'dan PERN jamoasini tushuntirishni so'radik. U deyarli to'g'ri yozdi, lekin <b style={{ color: T.ink }}>bitta a'zoning roli</b> adashib ketdi. Siz endi stackni bilasiz — xato qatorni toping va bosing!</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">PERN jamoasi rollari:</span></div>
              <div className="ai-code">
                {LINES.map(l => (
                  <div key={l.key} className={`ai-line ${found && l.key === 'pg' ? (fixed ? 'ok' : 'bad') : ''}`} onClick={() => tap(l.key)} style={{ cursor: found ? 'default' : 'pointer' }}>{l.text}</div>
                ))}
              </div>
              {!found && <p className="ai-prompt">Qaysi qatorda rol adashgan? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Rolni to'g'rilash</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi har kim o'z o'rnida!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              picked !== null
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — rol o'z egasida. Yana o'ylang: <b>chizish</b> kimning ishi edi, <b>saqlash</b> kimning?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: <b style={{ color: T.ink }}>chizish</b> — frontend (zal). <b style={{ color: T.ink }}>Saqlash</b> — baza (ombor). Qaysi a'zoga boshqaning ishi yozilgan?</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>PostgreSQL tugma chizmaydi — chizish React'ning ishi! PostgreSQL'ning vazifasi — <b>saqlash</b>. Chapdagi tugmani bosing.</p></div>)}
            {fixed && (<div className="takeaway fade-step"><div className="ta-bulb">✓</div><p className="ta-h">Topdingiz va tuzatdingiz — bu arxitektor ko'zi!</p><p className="ta-sub">AI ham adashadi — rollarni bilgan odam tekshiradi</p></div>)}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (sayohatni o'zingiz tuzing) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { key: 'click', label: 'Foydalanuvchi tugmani bosadi', who: 'react' },
    { key: 'send', label: "React so'rov yuboradi", who: 'react' },
    { key: 'route', label: 'Express qabul qiladi (Node ichida)', who: 'express' },
    { key: 'save', label: 'PostgreSQL saqlaydi', who: 'postgres' },
    { key: 'back', label: 'Javob qaytadi — ekran yangilanadi', who: 'react' }
  ];
  const POOL_ORDER = ['route', 'click', 'back', 'send', 'save'];
  const [placed, setPlaced] = useState(storedAnswer?.solved ? STEPS.map(s => s.key) : []);
  const [shake, setShake] = useState(null);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const solved = placed.length === STEPS.length;
  const tap = (k) => {
    if (solved || placed.includes(k)) return;
    const expected = STEPS[placed.length].key;
    if (k === expected) {
      const np = [...placed, k];
      setPlaced(np);
      setShake(null);
      if (np.length === STEPS.length) {
        if (firstCorrectRef.current === null) firstCorrectRef.current = true;
        onAnswer(screen, { stage: 'final', screenIdx: screen, correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: true, picked: np.join('→') });
      }
    } else {
      if (firstCorrectRef.current === null) firstCorrectRef.current = false;
      setShake(k);
      setTimeout(() => setShake(null), 450);
    }
  };
  const reset = () => { setPlaced([]); setShake(null); };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'Sayohatni tuzing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: sayohatni <span className="italic" style={{ color: T.accent }}>o'zingiz</span> tuzing</h2></div>
        <Mentor>Buyurtma tugmasi bosildi! Quyidagi qadamlarni <b style={{ color: T.ink }}>to'g'ri tartibda</b> bosing — so'rov sayohatini o'zingiz quring. Birinchi qadamdan boshlang.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Qadamlar — tartib bilan bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {POOL_ORDER.map(k => {
                const s = STEPS.find(x => x.key === k);
                const used = placed.includes(k);
                const tech = techBy(s.who);
                return (
                  <button key={k} className={`pool-chip ${used ? 'used' : ''} ${shake === k ? 'shake' : ''}`} disabled={used || solved} onClick={() => tap(k)}>
                    <span className="ttag-dot" style={{ background: tech.color }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
                    {used && <span style={{ color: T.success, fontWeight: 700 }}>✓</span>}
                  </button>
                );
              })}
            </div>
            {!solved && placed.length > 0 && <button className="btn-soft fade-step" style={{ alignSelf: 'flex-start' }} onClick={reset}>↺ Boshidan</button>}
          </Col>
          <Col>
            <p className="flow-label">Sayohat — {placed.length}/{STEPS.length}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.map((s, i) => {
                const on = i < placed.length;
                const tech = techBy(s.who);
                return (
                  <div key={s.key} className={`jr-step ${on ? 'on el-in' : ''}`} style={on ? { boxShadow: `inset 0 0 0 1.5px ${tech.color}` } : { opacity: 0.4 }}>
                    <span className="jr-num" style={{ background: on ? tech.color : T.ink3 }}>{i + 1}</span>
                    <span className="jr-body"><span className="jr-t">{on ? s.label : '…'}</span></span>
                    {on && <span className="jr-tag" style={{ color: tech.color, background: tech.soft }}>{tech.name}</span>}
                  </div>
                );
              })}
            </div>
            {solved && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Siz endi katta saytlarning ichini bilasiz: <b>React → Express → PostgreSQL → javob</b>. Bu xarita keyingi modullarda doim siz bilan bo'ladi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Frontend — ko'rinadigan qism, Backend — ko'rinmas ish",
    "React — ko'rinishni bloklardan yig'adi (frontend)",
    "Node.js — JavaScript'ni serverda ishlatadi",
    "Express — so'rov yo'llari · PostgreSQL — doimiy ombor",
    "4 texnologiya birga = PERN stack"
  ];
  const HOMEWORK = [
    { b: 'YouTube', t: "— frontend nimani ko'rsatadi, backend nimani saqlaydi? Yozing" },
    { b: 'Telegram', t: '— xabaringiz telefonda emas, qayerda saqlanadi?' },
    { b: "O'z saytingiz", t: "— unga PERN'ning qaysi a'zolari yetishmayapti?" }
  ];
  const GLOSSARY = [
    { b: 'frontend', t: "— ko'rinadigan qism (zal)" },
    { b: 'backend', t: "— ko'rinmas qism (oshxona)" },
    { b: 'React', t: "— ko'rinish kutubxonasi" },
    { b: 'Node.js', t: '— JS serverda (dvigatel)' },
    { b: 'Express', t: "— so'rov yo'llari (ofitsiant)" },
    { b: 'PostgreSQL', t: '— baza, doimiy ombor' },
    { b: 'stack', t: '— texnologiyalar jamoasi' },
    { b: "so'rov", t: '— frontenddan backendga xat' }
  ];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Katta saytlarning <span className="italic" style={{ color: T.accent }}>xaritasi</span> endi qo'lingizda.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Frontend, backend va PERN jamoasi endi sizga tanish." : "Yaxshi harakat! Bir-ikki ekranni qayta ko'rib, xaritani mustahkamlang."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa — detektiv bo'ling</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>3 ta tanish ilovani "ichidan" tahlil qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Oldinda: avval mini-do'kon praktikasi, so'ng React moduli (frontend) va Node.js + Express + NestJS moduli (backend). Xarita qo'lingizda!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PeanStackLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
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
        @keyframes shake-x { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .shake { animation: shake-x 0.3s ease-in-out; box-shadow: inset 0 0 0 1.5px ${T.accent} !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 14px; height: 14px; border: 2px solid ${T.ink3}; border-top-color: ${T.accent}; border-radius: 50%; display: inline-block; animation: spin 0.7s linear infinite; }

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
        .btn-soft:disabled { opacity: 0.4; cursor: not-allowed; }

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
        .chip-bad { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; animation: shake-x 0.3s ease-in-out; }
        .chip:disabled { cursor: not-allowed; }

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
        .demo-swap { animation: fade-step 0.3s ease-out; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 9px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
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

        /* === AI CARD / DEBUGGING === */
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: clamp(12px,1.6vw,13.5px); color: ${CODE.text}; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; word-break: break-word; }
        .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === TERMINAL === */
        .term { background: ${CODE.bg}; border-radius: 12px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.18); overflow: hidden; }
        .term-bar { display: flex; align-items: center; gap: 6px; padding: 9px 13px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .term-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .term-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${CODE.comment}; margin-left: 6px; }
        .term-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; font-family: 'JetBrains Mono'; font-size: clamp(12.5px,1.6vw,14px); color: ${CODE.text}; min-height: 64px; }
        .term-line { display: flex; gap: 9px; animation: el-pop 0.25s ease-out; }
        .term-arrow { color: ${T.success}; flex-shrink: 0; }

        /* === PERN: BRAUZER OYNASI === */
        .bw { background: ${T.paper}; border-radius: 13px; box-shadow: 0 10px 26px -8px rgba(${T.shadowBase},0.2); overflow: hidden; }
        .bw-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: #EFEBE4; border-bottom: 1px solid rgba(167,166,162,0.25); }
        .bw-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .bw-url { font-size: 11px; color: ${T.ink2}; background: ${T.paper}; border-radius: 6px; padding: 3px 10px; margin-left: 6px; }
        .bw-body { padding: 14px 16px; font-family: Georgia, serif; }
        .bw-h { font-size: clamp(16px,2.2vw,20px); font-weight: 700; color: ${T.ink}; margin: 0 0 4px; }
        .bw-sub { font-size: 12px; color: ${T.ink3}; margin: 0 0 8px; font-family: 'Manrope', sans-serif; font-weight: 600; }
        .bw-empty { font-size: 13px; color: ${T.ink3}; font-style: italic; margin: 0; }
        .bw-spin { display: flex; align-items: center; gap: 10px; min-height: 110px; justify-content: center; color: ${T.ink3}; font-family: 'JetBrains Mono'; font-size: 13px; }
        .cmt { font-size: 13.5px; color: ${T.ink}; background: ${T.bg}; border-radius: 8px; padding: 7px 11px; margin-bottom: 6px; }

        /* === PERN: JAMOA / NISHONLAR === */
        .pean-row { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 12px; padding: 9px 13px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .pean-badge { width: 28px; height: 28px; border-radius: 8px; color: #fff; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: 'Manrope'; }
        .ttag { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; padding: 4px 11px; border-radius: 99px; }
        .ttag-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .tech-card { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; background: ${T.paper}; border: none; border-radius: 14px; padding: 14px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; color: ${T.ink}; text-align: left; }
        .tech-card:hover { transform: translateY(-2px); }

        /* === PERN: RESTORAN === */
        .rest-card { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 14px; padding: 15px 17px; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; color: ${T.ink}; font-size: clamp(14px,1.7vw,16px); }
        .rest-card:hover:not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .rest-card.on { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22); }
        .rest-ic { width: 38px; height: 38px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0; }
        .rest-body { display: flex; flex-direction: column; gap: 2px; }

        /* === PERN: REACT BLOKLARI (mini sayt) === */
        .rb { font-family: 'Manrope', sans-serif; }
        .rb-header { background: ${T.ink}; color: ${T.bg}; border-radius: 8px; padding: 8px 12px; font-weight: 700; font-size: 13px; margin-bottom: 8px; }
        .rb-card { display: flex; align-items: center; gap: 9px; background: ${T.bg}; border-radius: 8px; padding: 8px 10px; font-size: 12.5px; color: ${T.ink}; margin-bottom: 8px; }
        .rb-thumb { width: 26px; height: 26px; border-radius: 6px; background: #f5d8cf; flex-shrink: 0; display: inline-block; }
        .rb-btn { background: ${T.accent}; color: #fff; border: none; border-radius: 8px; padding: 7px 14px; font-weight: 700; font-size: 12.5px; cursor: default; font-family: 'Manrope'; }

        /* === PERN: SAYOHAT QADAMLARI === */
        .jr-step { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 12px; padding: 9px 13px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.12); transition: all 0.25s; }
        .jr-step.cur { transform: translateX(4px); }
        .jr-num { width: 22px; height: 22px; border-radius: 50%; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.25s; }
        .jr-body { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
        .jr-t { font-weight: 600; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink}; }
        .jr-d { font-size: 11.5px; color: ${T.ink2}; }
        .jr-tag { font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; padding: 3px 8px; border-radius: 99px; flex-shrink: 0; }
        .jr-mini { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; background: ${T.paper}; border-radius: 12px; padding: 11px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; font-size: 13px; color: ${T.ink2}; }
        .jr-mini-arr { color: ${T.ink3}; }

        /* === PERN: BAZA JADVALI === */
        .dbt { background: ${T.paper}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); transition: opacity 0.3s; }
        .dbt-row { display: grid; grid-template-columns: 44px 1fr 1fr; gap: 8px; padding: 9px 14px; font-size: 13px; color: ${T.ink}; border-bottom: 1px solid rgba(167,166,162,0.18); font-family: 'Manrope'; }
        .dbt-row:last-child { border-bottom: none; }
        .dbt-head { background: ${T.purpleSoft}; color: ${T.purple}; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-family: 'JetBrains Mono'; }
        .dbt-empty { padding: 16px 14px; font-size: 13px; color: ${T.ink3}; font-style: italic; }

        /* === PERN: SLOT (s13) === */
        .slotx { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; background: ${T.paper}; border: 1.5px dashed transparent; border-radius: 12px; padding: 7px 13px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.12); font-family: 'Manrope'; color: ${T.ink}; text-align: left; }
        .slotx.act { border-color: ${T.accent}; box-shadow: 0 8px 20px -6px rgba(255,79,40,0.2); }
        .slotx.bad { box-shadow: inset 0 0 0 2px ${T.accent}; animation: shake-x 0.3s ease-in-out; }
        .slotx.ok { box-shadow: inset 0 0 0 2px ${T.success}; }
        .slotx-l { display: flex; flex-direction: column; gap: 1px; font-size: clamp(13px,1.6vw,14.5px); }

        /* === PERN: VAZIFA KARTASI / POOL === */
        .task-card { background: ${T.paper}; border-radius: 14px; padding: 16px 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); }
        .pool-chip { display: flex; align-items: center; gap: 10px; width: 100%; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink}; }
        .pool-chip:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.2); }
        .pool-chip.used { opacity: 0.45; cursor: default; }
        .pool-chip:disabled { cursor: default; }

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
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
