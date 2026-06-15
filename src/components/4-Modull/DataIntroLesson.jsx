import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// ============================================================
// BACKEND MODULI (4-MODUL) · 1-DARS — MA'LUMOT VA BOG'LANISHLAR — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: ma'lumot nima (tartibsiz matn → tartibli key:value), JSON anatomiyasi,
//        jadval (qator/ustun), bir nechta jadval, id va bog'lovchi (foreign key),
//        bog'lanish (bitta → ko'p / one-to-many), real mahsulot sxemasi,
//        va YAKUNDA: o'zingiz ilovaning ma'lumot sxemasini ulab chizasiz.
// Misol ilova: Instagram-simon ijtimoiy tarmoq — users / posts / comments / likes.
// Frontend ko'prigi: React darsida fetch('.../posts') qildingiz — bugun o'sha postlar
//        SERVER o'chsa ham qayerda saqlanib qolishini ko'ramiz (ma'lumotlar bazasi).
// MUHIM: kelgusi darslar ro'yxati o'quvchiga AYTILMAYDI — faqat yakunda keyingi dars teaser.
// SQL YO'Q: bu dars faqat tushuncha + vizual sxema (CREATE TABLE/SELECT keyingi darslarda).
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori.
// Yakuniy ekran (s15): 3 jadvalni 3 bog'lanish bilan ulab, ilova sxemasini chizish.
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
const MentorCtx = createContext(null); // mobil: yig'iladigan Mentor

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

const LESSON_META = { lessonId: 'data-intro-04-01-v16', lessonTitle: { uz: "Ma'lumot va bog'lanishlar: JSON, jadval, sxema", ru: 'Данные и связи: JSON, таблицы, схема' } };
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
  { id: 's11', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
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
  const isNarrow = useIsMobile(768); // mobil: Mentor yig'ilish rejimi
  const collapseOn = isNarrow && !mentorStatic; // ba'zi sahifalarda Mentor yig'ilmaydi
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]); // har ekranda Mentor ochiq holatdan boshlanadi
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    if (e.target && e.target.closest && e.target.closest('.mentor')) return; // Mentorning o'ziga tegsa — yig'maymiz
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

const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === correctIdx)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === correctIdx;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect; // ball: 1-urinishni qotirib qo'yamiz
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

// ===== OYNA (brauzer/baza chrome) =====
const Win = ({ title, children, minH, hotTitle }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title" style={hotTitle ? { color: T.accent, fontWeight: 700 } : undefined}>{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);

// ===== 4-MODUL YORDAMCHILAR — Instagram-simon ma'lumotlar (dars bo'ylab davom etadi) =====
const USERS = [
  { id: 1, username: 'ali_dev',    avatar: '🦊' },
  { id: 2, username: 'malika.art', avatar: '🐱' },
  { id: 3, username: 'bek_777',    avatar: '🐼' }
];
const POSTS = [
  { id: 10, user_id: 1, rasm: '🏔️', izoh: "Tog' sayohati" },
  { id: 11, user_id: 2, rasm: '🎨', izoh: 'Yangi rasm' },
  { id: 12, user_id: 1, rasm: '🍜', izoh: 'Tushlik' },
  { id: 13, user_id: 3, rasm: '⚽', izoh: 'Match kuni' }
];
const COMMENTS = [
  { id: 100, post_id: 10, user_id: 2, matn: "Zo'r manzara!" },
  { id: 101, post_id: 10, user_id: 3, matn: 'Qayer bu?' },
  { id: 102, post_id: 11, user_id: 1, matn: 'Juda chiroyli 🔥' }
];
const userById = (id) => USERS.find(u => u.id === id);

// Instagram post kartochkasi (vizual)
const IgCard = ({ post, small }) => {
  const u = userById(post.user_id);
  return (
    <div className="igcard el-in" style={small ? { maxWidth: 150 } : undefined}>
      <div className="igcard-h"><span className="igcard-ava">{u ? u.avatar : '👤'}</span><span className="igcard-user">{u ? u.username : '—'}</span></div>
      <div className="igcard-img">{post.rasm}</div>
      <div className="igcard-cap"><b>{u ? u.username : '—'}</b> {post.izoh}</div>
    </div>
  );
};

// JSON ko'rinishi — qismlarni bosib o'rganish mumkin (onPart berilsa)
const JsonView = ({ obj, active, onPart, hiKeys }) => {
  const keys = Object.keys(obj);
  const fmt = (v) => typeof v === 'string' ? `"${v}"` : String(v);
  return (
    <pre className="json-view">
      <span className="jv-brace">{'{'}</span>{'\n'}
      {keys.map((k, i) => {
        const on = active === k || (hiKeys && hiKeys.includes(k));
        return (
          <span key={k}>
            {'  '}
            <span className={`jv-key ${onPart ? 'click' : ''} ${on ? 'on' : ''}`} onClick={onPart ? () => onPart(k) : undefined}>"{k}"</span>
            <span className="jv-punct">: </span>
            <span className="jv-val">{fmt(obj[k])}</span>
            {i < keys.length - 1 ? <span className="jv-punct">,</span> : null}{'\n'}
          </span>
        );
      })}
      <span className="jv-brace">{'}'}</span>
    </pre>
  );
};

// Jadval — qator/ustun, ustun yoki qatorni ajratib ko'rsatish mumkin
const DataTable = ({ cols, rows, hiRow, hiCol, onCol, onRow, fkCols }) => (
  <div className="dtable-wrap fade-up">
    <table className="dtable">
      <thead>
        <tr>{cols.map(c => (
          <th key={c} className={`${hiCol === c ? 'hi' : ''} ${onCol ? 'click' : ''} ${fkCols && fkCols.includes(c) ? 'fk' : ''}`} onClick={onCol ? () => onCol(c) : undefined}>{c}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className={`${hiRow === ri ? 'hi' : ''} ${onRow ? 'click' : ''}`} onClick={onRow ? () => onRow(ri) : undefined}>
            {cols.map(c => <td key={c} className={hiCol === c ? 'hi' : ''}>{String(r[c])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Sxema jadval-kartochkasi (bog'lanish va yakuniy ekranda)
const TableCard = ({ title, cols, onField, activeField, doneFields, accent }) => (
  <div className={`tcard ${accent ? 'accent' : ''}`}>
    <div className="tcard-h">{title}</div>
    {cols.map(c => {
      const id = `${title}.${c.k}`;
      const done = doneFields && doneFields.has(id);
      const cls = ['tcard-row', c.pk ? 'pk' : '', c.fk ? 'fk' : '', onField ? 'click' : '', activeField === id ? 'active' : '', done ? 'done' : ''].filter(Boolean).join(' ');
      return (
        <div key={c.k} className={cls} onClick={onField ? () => onField(id, c) : undefined}>
          {c.pk && <span className="tc-badge pk">PK</span>}
          {c.fk && <span className="tc-badge fk">FK</span>}
          <span className="tc-k">{c.k}</span>
        </div>
      );
    })}
  </div>
);

// ===== SCREEN 0 — HOOK (server o'chsa, postlar qayerda?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [off, setOff] = useState(false);       // server o'chiq holatda
  const [tried, setTried] = useState(!!storedAnswer); // kamida bir marta o'chir-yoq qilingan
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const toggle = () => { setOff(o => !o); setTried(true); };
  const OPTS = [
    { id: 'a', label: "Postlar internetda 'havoda' suzib yuradi" },
    { id: 'b', label: "Server doim yoniq turishi shart — o'chsa, hammasi o'chadi" },
    { id: 'c', label: "Postlar alohida joyda — ma'lumotlar bazasida saqlanadi" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>Server <span className="italic" style={{ color: T.accent }}>o'chsa</span>, postlaringiz qayerda qoladi?</h1>
        <Mentor>React darsida <span className="mono">fetch('.../posts')</span> yozib, serverdan postlar ro'yxatini oldingiz. Lekin bir savol: server kompyuteri <b style={{ color: T.ink }}>o'chib qolsa</b>, o'sha postlar yo'qoladimi? Pastdagi tugma bilan <b style={{ color: T.ink }}>serverni o'chirib-yoqib</b> ko'ring — ikki xil joyda nima bo'lishini kuzating.</Mentor>
        <Split>
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={toggle}>{off ? '⏻ Serverni yoqish' : '⏻ Serverni o\'chirish'}</button>
            <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p className="flow-label" style={{ marginBottom: 7 }}>Faqat xotirada (RAM)</p>
                <Win title="server xotirasi" minH={104}>
                  {off
                    ? <p style={{ color: T.accent, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Bo'm-bo'sh — hammasi o'chdi! 😱</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{POSTS.slice(0, 3).map(p => <div key={p.id} className="mini-row">{p.rasm} {p.izoh}</div>)}</div>}
                </Win>
                <p className="mono small" style={{ margin: '6px 0 0', color: off ? T.accent : T.ink3 }}>{off ? 'o\'chdi → yo\'qoldi' : 'yoniq'}</p>
              </div>
              <div>
                <p className="flow-label" style={{ marginBottom: 7 }}>Ma'lumotlar bazasi</p>
                <Win title="🗄️ baza (disk)" minH={104}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{POSTS.slice(0, 3).map(p => <div key={p.id} className="mini-row">{p.rasm} {p.izoh}</div>)}</div>
                </Win>
                <p className="mono small" style={{ margin: '6px 0 0', color: T.success }}>{off ? '✓ baza saqlab qoldi' : 'saqlanmoqda'}</p>
              </div>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, postlar qayerda yashaydi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval serverni o'chirib-yoqib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Topdingiz! Postlar serverning vaqtinchalik xotirasida emas, alohida <b>ma'lumotlar bazasida</b> (diskda) saqlanadi. Shuning uchun server o'chib-yonsa ham yo'qolmaydi. Bugun aynan shu ma'lumot dunyosiga kiramiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Ma'lumot nima — tartibli ma'lumot", tag: 'kalit: qiymat' },
    { text: 'JSON — frontendda ko\'rgan shakl', tag: '{ "izoh": "..." }' },
    { text: 'Jadval — qator va ustun', tag: 'rows / columns' },
    { text: "Bog'lanish — bitta → ko'p", tag: 'user → posts' },
    { text: "Sxema — butun ilova xaritasi", tag: 'users · posts · comments' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — siz chizadigan sxema</p>
      <Win title="ilova ma'lumot sxemasi" minH={148}>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <TableCard title="users" cols={[{ k: 'id', pk: true }, { k: 'username' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>↓</span>
            <span>bog'lanish</span>
          </div>
          <TableCard title="posts" cols={[{ k: 'id', pk: true }, { k: 'user_id', fk: 'users' }]} />
        </div>
      </Win>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ shu chiziqni dars oxirida o'zingiz ulab chizasiz</p>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">Bugungi 5 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up">Ilovaning <span className="italic" style={{ color: T.accent }}>ichki xaritasini</span> chizamiz</h2>
        </div>
        <Mentor>Va'da: dars oxirida haqiqiy ilovaning <b style={{ color: T.ink }}>ma'lumot xaritasini</b> — sxemasini — o'zingiz chizasiz. Sxema ikki narsadan iborat: <b style={{ color: T.ink }}>jadvallar</b> (ma'lumot saqlanadigan qutilar) va ular orasidagi <b style={{ color: T.ink }}>bog'lanishlar</b> (ularni ulovchi chiziqlar). O'ngdagi 5 qadam bizni shu natijaga olib boradi.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — MA'LUMOT NIMA (tartibsiz matn → tartibli) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ordered, setOrdered] = useState(!!storedAnswer);
  const done = ordered;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ma'lumot" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Tartibga keltiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kompyuter oddiy jumlani <span className="italic" style={{ color: T.accent }}>tushunadimi</span>?</h2></div>
        <Mentor>Mana Ali haqida oddiy jumla — biz odamlar uni bemalol o'qiymiz. Lekin kompyuter uchun bu <b style={{ color: T.ink }}>shunchaki harflar</b>: "izoh qayerda?" desangiz, topa olmaydi. Yechim — bir xil ma'noni <b style={{ color: T.ink }}>bo'laklarga ajratib</b>, har bo'lakka nom berish. Tugmani bosing — o'sha jumlani kompyuter tushunadigan ko'rinishga keltiramiz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">① Odam yozganda — oddiy jumla</p>
            <div className="frame-dash" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(14px,1.9vw,17px)', color: T.ink, lineHeight: 1.6 }}>
              "ali_dev degan foydalanuvchi tog' rasmini joyladi, izohi esa <i>Tog' sayohati</i> edi"
            </div>
            <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>Kompyuter bu yerdan "izoh"ni ajrata olmaydi — hammasi aralash.</p>
            {!ordered && <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={() => setOrdered(true)}>↓ Kompyuter tiliga o'tkazish</button>}
          </Col>
          <Col>
            <p className="flow-label">② Kompyuter uchun — tartibli ma'lumot</p>
            {ordered ? (
              <>
                <div className="fade-step"><JsonView obj={{ username: 'ali_dev', rasm: '🏔️', izoh: "Tog' sayohati" }} /></div>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil ma'no — endi <b>tartibli</b>! Har bo'lakka nom (<b>kalit</b>) va <b>qiymat</b> berildi: <span className="mono">username</span>, <span className="mono">rasm</span>, <span className="mono">izoh</span>. Endi kompyuter "izoh nima?" deganda — aniq <span className="mono">"Tog' sayohati"</span> deb javob beradi. Mana shu — <b>ma'lumot</b>.</p></div>
              </>
            ) : (
              <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 90 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Chapdagi tugmani bosing — bir xil jumla kompyuter tushunadigan tartibga keladi</p></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — JSON ANATOMIYASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    username: { word: 'kalit (key)', info: <>Ma'lumot bo'lagining <b>nomi</b>. Doim qo'shtirnoq ichida: <span className="mono">"username"</span>. Kompyuter aynan shu nom bo'yicha qiymatni topadi.</> },
    rasm: { word: 'qiymat (value)', info: <>Kalitga tegishli <b>ma'lumotning o'zi</b>. <span className="mono">: </span> belgisidan keyin keladi. Matn, son yoki belgi bo'lishi mumkin.</> },
    izoh: { word: 'juftlik (key: value)', info: <>Har bir qator — <b>kalit va qiymat juftligi</b>, vergul bilan ajratiladi. JSON shunday juftliklardan yig'iladi.</> }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['username', 'rasm', 'izoh']) : new Set());
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="JSON" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qism o'rganildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontendda ko'rgan shakl — <span className="italic" style={{ color: T.accent }}>JSON</span> nimadan tuziladi?</h2></div>
        <Mentor>Bu shaklni React darsida ko'rgansiz! Nomi — <b style={{ color: T.ink }}>JSON</b>. Server ma'lumotni xuddi shunday yuboradi. U <b style={{ color: T.ink }}>kalit: qiymat</b> juftliklaridan yig'iladi. Har bir bo'lakni bosib, nima ekanini o'rganing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Bitta post — JSON ko'rinishida</p>
            <JsonView obj={{ username: 'ali_dev', rasm: '🏔️', izoh: "Tog' sayohati" }} active={active} onPart={tap} />
            <div className="hint fade-up delay-2"><p className="small" style={{ margin: 0, color: T.ink2 }}>O'qilishi: "username degan kalitning qiymati <b>ali_dev</b>, izoh degan kalitniki <b>Tog' sayohati</b>".</p></div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Qismlar</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 3 topildi</span>
            </div>
            {active ? (
              <div className="sk-info" key={active}>
                <span className="sk-tagbig"><span className="sk-wordbadge">{PARTS[active].word}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].info}</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>JSON'dan bir qatorni bosing</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>JSON — <b>kalit: qiymat</b> juftliklari to'plami, <span className="mono">{'{ }'}</span> qavslar ichida. Bitta narsa (bitta post, bitta foydalanuvchi) shunday yoziladi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (qaysi biri JSON?) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Qaysi biri to'g'ri tartibli ma'lumot (JSON)?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi biri <span className="italic" style={{ color: T.accent }}>tartibli ma'lumot</span> (JSON)?</h2></>}
    options={['"ali tog rasm joyladi izoh sayohat"', '{ "username": "ali_dev", "izoh": "Tog\' sayohati" }', 'username ali_dev izoh sayohat', 'ali_dev = tog = sayohat']} correctIdx={1}
    explainCorrect="To'g'ri! Har bo'lakka kalit va qiymat berilgan, { } qavslar ichida, qo'shtirnoqlar bilan — bu JSON. Kompyuter har bir qiymatni nomi bo'yicha topa oladi."
    explainWrong={{
      0: "Bu oddiy jumla — kompyuter uchun shunchaki matn. Kalit: qiymat tuzilishi yo'q.",
      2: "Yaqin, lekin tuzilish yo'q: qavslar, qo'shtirnoq va : belgisi kerak.",
      3: "Yo'q — bu kalit: qiymat juftligi emas. JSON { \"kalit\": \"qiymat\" } ko'rinishida bo'ladi.",
      default: "JSON — { \"kalit\": \"qiymat\" } ko'rinishidagi tartibli ma'lumot."
    }} />
);

// ===== SCREEN 5 — JADVAL (JSON ro'yxati → qator/ustun) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [hiCol, setHiCol] = useState(null);
  const [hiRow, setHiRow] = useState(null);
  const [colTried, setColTried] = useState(!!storedAnswer); // bir marta ustun bosilgani esda qoladi
  const [rowTried, setRowTried] = useState(!!storedAnswer); // bir marta qator bosilgani esda qoladi
  const done = (colTried && rowTried) || !!storedAnswer;
  const rows = POSTS.map(p => ({ id: p.id, rasm: p.rasm, izoh: p.izoh }));
  const navLabel = done ? 'Davom etish' : (!colTried ? 'Bitta ustunni bosing' : !rowTried ? 'Endi bitta qatorni bosing' : 'Davom etish');
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Jadval" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Minglab post — <span className="italic" style={{ color: T.accent }}>qanday saqlanadi</span>?</h2></div>
        <Mentor>Bitta post — bitta JSON edi. Endi tasavvur qiling, postlar <b style={{ color: T.ink }}>minglab</b>. Ularni <b style={{ color: T.ink }}>jadvalga</b> joylaymiz — xuddi Excel jadvalidek. Har bir post — bitta <b style={{ color: T.ink }}>qator</b> (gorizontal), har bir kalit — bitta <b style={{ color: T.ink }}>ustun</b> (vertikal). Avval bitta <b style={{ color: T.ink }}>ustunni</b>, keyin bitta <b style={{ color: T.ink }}>qatorni</b> bosib farqini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">posts jadvali — har post bitta qator</p>
            <DataTable cols={['id', 'rasm', 'izoh']} rows={rows} hiCol={hiCol} hiRow={hiRow} onCol={(c) => { setHiCol(c); setHiRow(null); setColTried(true); }} onRow={(r) => { setHiRow(r); setHiCol(null); setRowTried(true); }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: colTried ? 1 : 0.45, color: colTried ? T.success : T.ink }}>{colTried ? '✓' : '○'} ustun bosildi</span>
              <span className="tagpill" style={{ opacity: rowTried ? 1 : 0.45, color: rowTried ? T.success : T.ink }}>{rowTried ? '✓' : '○'} qator bosildi</span>
            </div>
          </Col>
          <Col>
            <div className="sk-info">
              <span className="sk-tagbig"><span className="sk-wordbadge">{hiRow !== null ? 'Qator (row)' : hiCol ? 'Ustun (column)' : 'Jadval'}</span></span>
              <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>
                {hiRow !== null
                  ? <>Bitta <b>qator</b> — bitta to'liq post: <span className="mono">{rows[hiRow].rasm} {rows[hiRow].izoh}</span>. Xuddi bitta JSON kabi.</>
                  : hiCol
                    ? <>Bitta <b>ustun</b> — barcha postlarning <span className="mono">{hiCol}</span> qiymati. Masalan, hamma postlarning izohlari shu ustunda.</>
                    : <>Jadval = qatorlar (postlar) × ustunlar (kalitlar). Ustun yoki qatorni bosib ajratib ko'ring.</>}
              </p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ma'lumotlar bazasi — shunaqa <b>jadvallar</b>dan iborat. Bir nechta JSON yig'ilib, bitta tartibli jadval bo'ladi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (qator nima?) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Jadvalda bitta QATOR (row) nimani anglatadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Jadvaldagi bitta <span className="italic" style={{ color: T.accent }}>qator</span> nima?</h2></>}
    options={['Bitta ustun nomi', 'Bitta to\'liq yozuv — masalan, bitta post', 'Butun jadval', 'Faqat sarlavha qatori']} correctIdx={1}
    explainCorrect="To'g'ri! Bitta qator — bitta to'liq yozuv (bitta post, bitta foydalanuvchi). Ustunlar esa shu yozuvning maydonlari (kalitlari)."
    explainWrong={{
      0: "Yo'q — ustun bu vertikal maydon (masalan, hamma izohlar). Qator esa gorizontal: bitta to'liq post.",
      2: "Yo'q — butun jadval ko'p qatordan iborat. Bitta qator — bitta yozuv.",
      3: "Sarlavha — ustun nomlari. Ma'lumot qatorlari esa har biri bitta postdir.",
      default: "Qator = bitta to'liq yozuv (bitta post)."
    }} />
);

// ===== SCREEN 6 — BIR NECHTA JADVAL =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TABLES = {
    users: { desc: 'Foydalanuvchilar — kim ro\'yxatdan o\'tgan', cols: ['id', 'username', 'avatar'], rows: USERS },
    posts: { desc: 'Postlar — kim nima joylagan', cols: ['id', 'user_id', 'rasm', 'izoh'], rows: POSTS },
    comments: { desc: 'Izohlar — kim qaysi postga yozgan', cols: ['id', 'post_id', 'user_id', 'matn'], rows: COMMENTS }
  };
  const [active, setActive] = useState('users');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['users', 'posts', 'comments']) : new Set(['users']));
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  const cur = TABLES[active];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ko'p jadval" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 jadval ko'rildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta jadval yetadimi? — Instagram'da <span className="italic" style={{ color: T.accent }}>nechta jadval bor</span>?</h2></div>
        <Mentor>Bitta jadval kamlik qiladi! Foydalanuvchilar — alohida, postlar — alohida, izohlar — alohida. Har bir <b style={{ color: T.ink }}>tur</b> uchun o'z jadvali. Uchala jadval kartochkasini bosib, ichidagi ustunlarni ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Jadvallar — bosib tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.keys(TABLES).map(k => <button key={k} className={`chip ${active === k ? 'chip-on' : ''}`} onClick={() => tap(k)}>{k} {seen.has(k) ? '✓' : ''}</button>)}
            </div>
            <div className="sk-info" key={active}>
              <span className="sk-tagbig"><span className="sk-wordbadge">{active}</span></span>
              <p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{cur.desc}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uch jadval, uch xil narsa. Lekin e'tibor bering: <span className="mono">posts</span> va <span className="mono">comments</span> ichida g'alati ustunlar bor — <span className="mono">user_id</span>, <span className="mono">post_id</span>. Ular nima uchun? Keyingi ekranda!</p></div>}
          </Col>
          <Col>
            <p className="flow-label">{active} jadvali</p>
            <DataTable cols={cur.cols} rows={cur.rows} fkCols={['user_id', 'post_id']} />
            <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>Sarg'ish ustunlar — bog'lovchi ustunlar (keyingi qadamda)</p>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — id VA BOG'LOVCHI (foreign key) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [postId, setPostId] = useState(storedAnswer ? 10 : null);
  const post = POSTS.find(p => p.id === postId);
  const owner = post ? userById(post.user_id) : null;
  const done = postId !== null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="id va bog'lovchi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bir postni bosing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu post kimniki ekanini — <span className="italic" style={{ color: T.accent }}>qanday bilamiz</span>?</h2></div>
        <Mentor>Har bir foydalanuvchining <b style={{ color: T.ink }}>id</b> raqami bor (xuddi pasport raqami kabi). Postda esa to'liq ism emas, faqat <b style={{ color: T.ink }}>user_id</b> yoziladi — ya'ni "bu post kimnikiligini" ko'rsatuvchi raqam. Postni bosing — uning egasini <span className="mono">user_id</span> orqali topamiz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">posts jadvali — postni bosing</p>
            <DataTable cols={['id', 'user_id', 'izoh']} rows={POSTS.map(p => ({ id: p.id, user_id: p.user_id, izoh: p.izoh }))} hiRow={post ? POSTS.indexOf(post) : null} fkCols={['user_id']} onRow={(r) => setPostId(POSTS[r].id)} />
            <p className="flow-label" style={{ marginTop: 4 }}>users jadvali</p>
            <DataTable cols={['id', 'username']} rows={USERS} hiRow={owner ? USERS.indexOf(owner) : null} />
          </Col>
          <Col>
            {post ? (
              <div className="sk-info fade-step" key={postId}>
                <p className="body" style={{ margin: 0, color: T.ink }}>
                  <b>{post.rasm} "{post.izoh}"</b> postining <span className="mono">user_id</span> = <b style={{ color: T.accent }}>{post.user_id}</b>.
                </p>
                <p className="body" style={{ margin: '8px 0 0', color: T.ink }}>
                  users jadvalida <span className="mono">id = {post.user_id}</span> ni topamiz → bu <b style={{ color: T.success }}>{owner ? owner.avatar + ' ' + owner.username : '—'}</b>.
                </p>
                <p className="small" style={{ margin: '8px 0 0', color: T.ink2 }}>Demak post egasini topdik — raqam orqali ulanish!</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>posts jadvalidan bir postni bosing</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu <b>bog'lovchi ustun</b> (foreign key): <span className="mono">user_id</span> bitta jadvalni ikkinchisiga ulaydi. Ismni qayta-qayta yozish shart emas — faqat raqam yetadi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — BOG'LANISH (bitta → ko'p / one-to-many) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [userId, setUserId] = useState(storedAnswer ? 1 : null);
  const userPosts = userId ? POSTS.filter(p => p.user_id === userId) : [];
  const u = userId ? userById(userId) : null;
  const done = userId !== null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bog'lanish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Foydalanuvchini tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta foydalanuvchida <span className="italic" style={{ color: T.accent }}>nechta post</span> bo'ladi?</h2></div>
        <Mentor>Bu eng muhim g'oya — <b style={{ color: T.ink }}>bog'lanish</b>. Bitta foydalanuvchi <b style={{ color: T.ink }}>ko'p post</b> joylashi mumkin, lekin har bir post faqat <b style={{ color: T.ink }}>bitta</b> egaga tegishli. Bunga "bitta → ko'p" deyiladi. Foydalanuvchini tanlang — uning barcha postlari yonadi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Foydalanuvchini bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {USERS.map(usr => <button key={usr.id} className={`chip ${userId === usr.id ? 'chip-on' : ''}`} onClick={() => setUserId(usr.id)}>{usr.avatar} {usr.username}</button>)}
            </div>
            {u && (
              <div className="sk-info fade-step" key={userId}>
                <p className="body" style={{ margin: 0, color: T.ink }}><b>{u.avatar} {u.username}</b> (id={u.id}) — <b style={{ color: T.accent }}>{userPosts.length} ta</b> post joylagan:</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {userPosts.map(p => <IgCard key={p.id} post={p} small />)}
                </div>
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Bog'lanish ko'rinishi</p>
            <Win title="bitta → ko'p" minH={150}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
                <TableCard title="users" cols={[{ k: 'id', pk: true }, { k: 'username' }]} accent={!!u} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: u ? T.accent : T.ink3, fontFamily: "'JetBrains Mono'", fontSize: 11 }}>
                  <span style={{ fontSize: 18 }}>→→</span>
                  <span>1 ga {u ? userPosts.length : 'ko\'p'}</span>
                </div>
                <TableCard title="posts" cols={[{ k: 'id', pk: true }, { k: 'user_id', fk: 'users' }]} accent={!!u} />
              </div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>users → posts</b>: bitta foydalanuvchi, ko'p post. <span className="mono">posts.user_id</span> qaysi foydalanuvchiga tegishliligini ko'rsatadi. Mana shu — <b>bog'lanish</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (bog'lanish turi) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="users va posts orasidagi bog'lanish qanday?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>users</span> va <span className="mono" style={{ color: T.accent }}>posts</span> qanday bog'langan?</h2></>}
    options={['Bitta foydalanuvchi — bitta post', 'Bitta foydalanuvchi — ko\'p post (bitta → ko\'p)', 'Bog\'lanish yo\'q', 'Har bir post — barcha foydalanuvchilarniki']} correctIdx={1}
    explainCorrect="To'g'ri! Bitta foydalanuvchi ko'p post joylashi mumkin, lekin har post bitta egaga tegishli. Bu 'bitta → ko'p' (one-to-many) bog'lanish."
    explainWrong={{
      0: "Yo'q — bitta foydalanuvchi bir nechta post joylay oladi (ali_dev'da 2 ta bor edi).",
      2: "Bog'lanish bor — uni posts.user_id ustuni hosil qiladi.",
      3: "Yo'q — har post faqat bitta egaga tegishli (uning user_id'si bitta).",
      default: "users → posts: bitta foydalanuvchi, ko'p post."
    }} />
);

// ===== SCREEN 10 — REAL MAHSULOT SXEMASI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? 2 : 0); // ko'rilgan bog'lanishlar
  const RELS = [
    { from: 'posts.user_id', to: 'users', text: 'Har post — bitta egaga (user)' },
    { from: 'comments.post_id', to: 'posts', text: 'Har izoh — bitta postga' },
    { from: 'comments.user_id', to: 'users', text: 'Har izoh — bitta muallifga' }
  ];
  const [active, setActive] = useState(storedAnswer ? 2 : null);
  const done = seen >= 2 || !!storedAnswer;
  const tap = (i) => { setActive(i); setSeen(s => Math.max(s, i + 1)); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Real sxema" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bog\'lanishlarni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mana butun Instagram'ning <span className="italic" style={{ color: T.accent }}>ma'lumot xaritasi</span></h2></div>
        <Mentor>Real ilovada hamma jadvallar bir-biriga bog'langan — bu <b style={{ color: T.ink }}>sxema</b> (xarita). Pastdagi bog'lanishlarni bosib, har birini ko'ring. Yana bir tur ham bor: <span className="mono">likes</span> — bunda bitta foydalanuvchi ko'p postni, bitta postni ko'p foydalanuvchi yoqtiradi (<b style={{ color: T.ink }}>ko'pga-ko'p</b>).</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Bog'lanishlar — bosib ko'ring</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RELS.map((r, i) => (
                <button key={i} className={`rel-btn ${active === i ? 'on' : ''}`} onClick={() => tap(i)}>
                  <span className="mono" style={{ fontSize: 12 }}>{r.from} → {r.to}</span>
                  <span className="small" style={{ color: active === i ? '#fff' : T.ink2 }}>{r.text}</span>
                </button>
              ))}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hamma jadval id va bog'lovchi ustunlar bilan ulangan. Mana shu butun rasm — <b>ma'lumot sxemasi</b>. Har ilovaning o'z sxemasi bor.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Sxema</p>
            <Win title="instagram — ma'lumot sxemasi" minH={210}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                  <TableCard title="users" cols={[{ k: 'id', pk: true }, { k: 'username' }]} accent={active !== null && RELS[active].to === 'users'} />
                  <TableCard title="posts" cols={[{ k: 'id', pk: true }, { k: 'user_id', fk: 'users' }]} accent={active !== null && (RELS[active].to === 'posts' || RELS[active].from.startsWith('posts'))} />
                </div>
                <TableCard title="comments" cols={[{ k: 'id', pk: true }, { k: 'post_id', fk: 'posts' }, { k: 'user_id', fk: 'users' }, { k: 'matn' }]} accent={active !== null && RELS[active].from.startsWith('comments')} />
              </div>
            </Win>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — VIBECODING (AI'ga sxema buyurtma) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const APPS = [
    { id: 'shop', label: 'Onlayn do\'kon yasamoqchiman', tables: ['users — xaridorlar', 'products — mahsulotlar', 'orders — buyurtmalar'], note: 'orders.user_id va orders.product_id — bog\'lovchilar' },
    { id: 'school', label: 'Maktab jurnali yasamoqchiman', tables: ['students — o\'quvchilar', 'lessons — darslar', 'grades — baholar'], note: 'grades.student_id va grades.lesson_id — bog\'lovchilar' },
    { id: 'music', label: 'Musiqa ilovasi yasamoqchiman', tables: ['users — tinglovchilar', 'songs — qo\'shiqlar', 'playlists — to\'plamlar'], note: 'playlists.user_id — qaysi foydalanuvchiniki' }
  ];
  const [app, setApp] = useState(null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | planned | done
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id) => { clearTimeout(timer.current); setApp(id); setPhase('planned'); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1100); };
  const cur = APPS.find(a => a.id === app) || (storedAnswer ? APPS[0] : null);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi qadam · AI" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Sxemani buyurtma qiling"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi ilova uchun sxemani <span className="italic" style={{ color: T.accent }}>AI'ga buyurtma</span> qilsak-chi?</h2></div>
        <Mentor>Endi siz sxemani <b style={{ color: T.ink }}>o'qiy olasiz</b>! Qaysi ilova kerakligini ayting, AI <b style={{ color: T.ink }}>jadvallarni taklif qiladi</b> — siz esa tekshirasiz: jadvallar to'g'rimi, bog'lovchi ustunlar (<span className="mono">_id</span>) bormi. Boshliq — siz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">1. AI'ga ilovangizni ayting</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {APPS.map(a => <button key={a.id} className={`chip ${app === a.id ? 'chip-on' : ''}`} onClick={() => choose(a.id)} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>"{a.label}"</button>)}
            </div>
            {!cur && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Yuqoridan bitta ilovani tanlang</p></div>}
            {cur && (
              <div className="ai-card fade-step" key={app || 'stored'}>
                <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">{phase === 'planned' ? 'Mana taklif qilgan jadvallarim:' : (phase === 'building' ? 'Sxema chizilyapti…' : 'Tayyor — sxemani tekshiring')}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cur.tables.map((t, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span className="mono" style={{ color: T.ink, fontSize: 12.5 }}>{t}</span></div>)}
                </div>
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Sxemani tasdiqlash</button>}
                {phase === 'done' && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ {cur.note}</p>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">2. Natija — jadvallar sxemasi</p>
            <Win title={cur ? `${cur.id}-ilova — sxema` : 'sxema'} minH={150}>
              {done && cur ? (
                <div className="fade-step" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {cur.tables.map((t, i) => {
                    const name = t.split(' — ')[0];
                    return <TableCard key={i} title={name} cols={[{ k: 'id', pk: true }, ...(name.includes('order') || name.includes('grade') || name.includes('playlist') ? [{ k: '…_id', fk: 'x' }] : [])]} />;
                  })}
                </div>
              ) : (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Ilovani tanlang va sxemani tasdiqlang…</p>
              )}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI tez yozadi, siz <b>tekshirasiz</b>: har jadvalda <span className="mono">id</span> bormi, bog'lanish uchun <span className="mono">_id</span> ustunlari to'g'rimi. Mana shu — sxemani o'qish mahorati.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (foreign key roli) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="comments jadvalidagi post_id ustuni nima uchun kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>comments.post_id</span> nima uchun kerak?</h2></>}
    options={['Izohning rangini saqlash uchun', 'Izoh QAYSI postga tegishli ekanini ko\'rsatish uchun', 'Izohni o\'chirish uchun', 'Hech narsa uchun — ortiqcha ustun']} correctIdx={1}
    explainCorrect="To'g'ri! post_id — bog'lovchi ustun (foreign key). U izohni posts jadvalidagi aniq bir postga ulaydi: 'bu izoh id=10 postga yozilgan'."
    explainWrong={{
      0: "Yo'q — rangga aloqasi yo'q. post_id izohni qaysi postga tegishli ekanini ko'rsatadi.",
      2: "Yo'q — o'chirishga aloqasi yo'q. Bu bog'lovchi: izoh ↔ post.",
      3: "Aksincha, eng muhim ustun! Usiz izoh qaysi postga yozilganini bilib bo'lmaydi.",
      default: "post_id — izohni postga ulovchi bog'lovchi (foreign key)."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: jadvalga to'g'ri ustunni qo'shing =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // Maqsad: comments jadvaliga to'g'ri ustunlarni tanlash
  const OPTIONS = [
    { k: 'matn', ok: true, why: "izohning yozuvi — kerak" },
    { k: 'post_id', ok: true, why: "qaysi postga — bog'lovchi, kerak" },
    { k: 'avatar', ok: false, why: "bu users jadvaliga tegishli, comments'ga emas" },
    { k: 'user_id', ok: true, why: "kim yozgan — bog'lovchi, kerak" },
    { k: 'narx', ok: false, why: "izohda narx bo'lmaydi — keraksiz" }
  ];
  const correctSet = OPTIONS.filter(o => o.ok).map(o => o.k);
  const [chosen, setChosen] = useState(storedAnswer ? new Set(correctSet) : new Set());
  const toggle = (k) => setChosen(prev => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s; });
  const allRight = correctSet.every(k => chosen.has(k)) && [...chosen].every(k => correctSet.includes(k));
  const done = allRight;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "To'g'ri ustunlarni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>comments</span> jadvaliga qaysi ustunlar <span className="italic" style={{ color: T.accent }}>kerak</span>?</h2></div>
        <Mentor>Endi o'zingiz qaror qiling! <span className="mono">comments</span> (izohlar) jadvalini quryapmiz. Quyidagi ustunlardan <b style={{ color: T.ink }}>shu jadvalga mosini</b> tanlang — keraksizlarini qoldiring. Esda tuting: izoh = matn + kim yozgani + qaysi postga.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Ustunlarni tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OPTIONS.map(o => {
                const on = chosen.has(o.k);
                return (
                  <button key={o.k} className={`pick-row ${on ? 'on' : ''}`} onClick={() => toggle(o.k)}>
                    <span className="pick-box">{on && '✓'}</span>
                    <span className="mono" style={{ fontSize: 13 }}>{o.k}</span>
                    {on && <span className="small" style={{ marginLeft: 'auto', color: o.ok ? T.success : T.accent }}>{o.ok ? 'to\'g\'ri' : 'mos emas'}</span>}
                  </button>
                );
              })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">comments jadvali — natija</p>
            <TableCard title="comments" cols={[{ k: 'id', pk: true }, ...[...chosen].map(k => ({ k, fk: k.endsWith('_id') ? 'x' : undefined }))]} />
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mukammal! <span className="mono">matn</span>, <span className="mono">post_id</span>, <span className="mono">user_id</span> — aynan shu uchtasi kerak. <span className="mono">avatar</span> va <span className="mono">narx</span> boshqa jadvallarniki edi.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Izohda nima bo'lishi kerak? Yozuvning o'zi, kim yozgani, qaysi postga. Ortiqchasini olib tashlang.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (xato bog'lanish) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'bad' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'bad';
  const done = fixed;
  const RELS = [
    { id: 'r1', txt: 'posts.user_id → users', ok: true },
    { id: 'bad', txt: 'comments.post_id → users', ok: false },
    { id: 'r3', txt: 'comments.user_id → users', ok: true }
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xato bog\'lanishni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI sxema chizdi — bitta bog'lanish <span className="italic" style={{ color: T.accent }}>noto'g'ri</span>. Toping.</h2></div>
        <Mentor>AI sxemani tez chizib berdi, lekin <b style={{ color: T.ink }}>bitta bog'lanishda xato</b> bor. Eslang: <span className="mono">post_id</span> degan ustun nomidan o'zi aytib turibdi — u qaysi jadvalga ulanishi kerak? Xato qatorni bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Bog'lanishlar:</span></div>
              <div className="ai-code">
                {RELS.map(r => {
                  const isBad = r.id === 'bad';
                  if (isBad && fixed) {
                    return <div key={r.id} className="ai-line ok el-in" style={{ cursor: 'default' }}>comments.post_id → <b style={{ color: CODE.str }}>posts</b> ✓</div>;
                  }
                  return (
                    <div key={r.id} className={`ai-line ${found && isBad ? 'bad' : ''} ${!found && picked === r.id && !isBad ? 'ok' : ''}`} onClick={() => { if (!found) setPicked(isBad ? 'bad' : r.id); }}>{r.txt}</div>
                  );
                })}
              </div>
              {!found && <p className="ai-prompt">Qaysi bog'lanish noto'g'ri? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 → posts ga to'g'rilash</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi sxema to'g'ri!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              (picked && picked !== 'bad')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu bog'lanish to'g'ri. Yana qarang: <span className="mono">post_id</span> nomli ustun qaysi jadvalga ulanishi kerak — users'gami yoki posts'gami?</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Maslahat: ustun nomi <span className="mono">post_id</span> — demak u <b style={{ color: T.ink }}>posts</b> jadvaliga ulanishi kerak, users'ga emas.</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">comments.post_id</span> — bu izoh qaysi <b>postga</b> tegishli ekanini ko'rsatadi, shuning uchun <b>posts</b> jadvaliga ulanishi kerak, users'ga emas. Chapdagi tugma bilan to'g'rilang →</p></div>}
            {fixed && (
              <>
                <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu ham debugging!</p><p className="ta-sub">AI tez chizadi, siz sxemani tekshirasiz</p></div>
                <p className="flow-label" style={{ margin: 0 }}>To'g'ri sxema</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <TableCard title="posts" cols={[{ k: 'id', pk: true }, { k: 'user_id', fk: 'users' }]} accent />
                  <TableCard title="comments" cols={[{ k: 'id', pk: true }, { k: 'post_id', fk: 'posts' }]} accent />
                </div>
              </>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: SXEMANI ULAB CHIZISH =====
// 3 jadvalni 3 bog'lanish bilan ulash. FK ustunini bosib, keyin to'g'ri jadvalning id'sini bosish.
const SCHEMA_NODES = {
  users:    { x: 24,  y: 30,  cols: [{ k: 'id', pk: true }, { k: 'username' }, { k: 'avatar' }] },
  posts:    { x: 496, y: 24,  cols: [{ k: 'id', pk: true }, { k: 'user_id', fk: 'users' }, { k: 'izoh' }] },
  comments: { x: 256, y: 222, cols: [{ k: 'id', pk: true }, { k: 'post_id', fk: 'posts' }, { k: 'user_id', fk: 'users' }, { k: 'matn' }] }
};
const CANVAS_W = 700, CANVAS_H = 392;
const CARD_W = 168, HEAD_H = 34, ROW_H = 31;
// FK → to'g'ri PK (jadval.id)
const EXPECTED = {
  'posts.user_id': 'users.id',
  'comments.post_id': 'posts.id',
  'comments.user_id': 'users.id'
};
const REL_LABEL = {
  'posts.user_id': 'posts → users',
  'comments.post_id': 'comments → posts',
  'comments.user_id': 'comments → users'
};
// maydon markaziy-y koordinatasi
const fieldY = (node, idx) => node.y + HEAD_H + idx * ROW_H + ROW_H / 2;
const fieldPos = (tableName, colKey) => {
  const node = SCHEMA_NODES[tableName];
  const idx = node.cols.findIndex(c => c.k === colKey);
  return { yc: fieldY(node, idx), left: node.x, right: node.x + CARD_W, cx: node.x + CARD_W / 2 };
};
// ikki maydon orasidagi chiziq (yaqin qirralarni tanlaymiz)
const relLine = (fromId, toId) => {
  const [ft, fk] = fromId.split('.');
  const [tt, tk] = toId.split('.');
  const a = fieldPos(ft, fk);
  const b = fieldPos(tt, tk);
  const aRight = a.cx < b.cx; // from chap tomonda bo'lsa, uning o'ng qirrasidan chiqamiz
  const x1 = aRight ? a.right : a.left;
  const x2 = aRight ? b.left : b.right;
  return { x1, y1: a.yc, x2, y2: b.yc };
};

const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ALL = Object.keys(EXPECTED);
  const [sel, setSel] = useState(null);       // tanlangan FK id
  const [doneRels, setDoneRels] = useState(storedAnswer ? new Set(ALL) : new Set());
  const [wrong, setWrong] = useState(false);
  const allDone = ALL.every(r => doneRels.has(r));
  const doneFields = new Set([...doneRels]); // FK id'lar bajarilgan
  useEffect(() => {
    if (allDone && !storedAnswer) {
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Ilova ma'lumot sxemasini ulab chizish (3 bog'lanish)", correct: true, firstAttemptCorrect: true, solved: true, picked: 'connected' });
    }
  }, [allDone]);
  const clickField = (id, col) => {
    if (doneRels.has(id)) return;
    setWrong(false);
    if (sel === null) {
      if (col.fk) setSel(id);     // boshlanishi FK bo'lishi kerak
      return;
    }
    // sel — FK, endi to'g'ri id (PK) kutilyapti
    if (id === EXPECTED[sel]) {
      setDoneRels(prev => { const s = new Set(prev); s.add(sel); return s; });
      setSel(null);
    } else if (col.fk) {
      setSel(id);                 // boshqa FK bosilsa — qayta tanlash
    } else {
      setWrong(true); setSel(null);
    }
  };
  const reset = () => { setDoneRels(new Set()); setSel(null); setWrong(false); };
  const renderNode = (name) => {
    const node = SCHEMA_NODES[name];
    return (
      <div key={name} className="schema-node" style={{ left: node.x, top: node.y, width: CARD_W }}>
        <div className="tcard" style={{ width: CARD_W }}>
          <div className="tcard-h">{name}</div>
          {node.cols.map(c => {
            const id = `${name}.${c.k}`;
            const isDoneFk = doneFields.has(id);
            const cls = ['tcard-row', c.pk ? 'pk' : '', c.fk ? 'fk' : '', 'click', sel === id ? 'active' : '', isDoneFk ? 'done' : ''].filter(Boolean).join(' ');
            return (
              <div key={c.k} className={cls} style={{ height: ROW_H }} onClick={() => clickField(id, c)}>
                {c.pk && <span className="tc-badge pk">PK</span>}
                {c.fk && <span className="tc-badge fk">FK</span>}
                <span className="tc-k">{c.k}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <Stage eyebrow="Yakuniy · sxema chizish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!allDone} label={allDone ? 'Davom etish' : `${doneRels.size}/3 bog'lanish`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,14px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: ilova sxemasini <span className="italic" style={{ color: T.accent }}>o'zingiz ulang</span>.</h2></div>
        <Mentor>Mana 3 jadval. Ularni 3 ta bog'lanish bilan ulang: avval <b style={{ color: T.accent }}>FK</b> (bog'lovchi) ustunni bosing, keyin u ulanishi kerak bo'lgan jadvalning <b style={{ color: T.blue }}>id</b> (PK) ustunini bosing. To'g'ri ulasangiz — chiziq paydo bo'ladi. Masalan: <span className="mono">posts.user_id</span> → <span className="mono">users.id</span>.</Mentor>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span className="flow-label" style={{ marginRight: 4 }}>Bog'lanishlar {doneRels.size}/3:</span>
          {ALL.map(r => (
            <span key={r} className="tagpill" style={{ color: doneRels.has(r) ? T.success : T.ink3, opacity: doneRels.has(r) ? 1 : 0.6 }}>
              {doneRels.has(r) ? '✓' : '○'} {REL_LABEL[r]}
            </span>
          ))}
          {!allDone && <button className="btn-soft" style={{ marginLeft: 'auto' }} onClick={reset}>↻ Qaytadan</button>}
        </div>
        {sel && <div className="hint fade-step"><p className="small" style={{ margin: 0, color: T.ink2 }}><b style={{ color: T.accent }}>{sel}</b> tanlandi — endi u ulanadigan jadvalning <b>id</b> ustunini bosing.</p></div>}
        {wrong && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu ustun mos emas. Bog'lovchining nomiga qarang: <span className="mono">user_id</span> → <span className="mono">users.id</span>, <span className="mono">post_id</span> → <span className="mono">posts.id</span>.</p></div>}
        {allDone && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Tayyor! Siz <b>ilovaning ma'lumot sxemasini</b> noldan ulab chizdingiz. Mana shu — har bir backend loyihaning asosi.</p></div>}
        <div className="schema-scroll">
          <div className="schema-canvas" style={{ width: CANVAS_W, height: CANVAS_H, margin: '0 auto' }}>
            <svg className="schema-svg" width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
              {[...doneRels].map(r => {
                const ln = relLine(r, EXPECTED[r]);
                return (
                  <g key={r}>
                    <line x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2} stroke={T.success} strokeWidth="2.5" />
                    <circle cx={ln.x1} cy={ln.y1} r="4" fill={T.success} />
                    <circle cx={ln.x2} cy={ln.y2} r="4" fill={T.success} />
                  </g>
                );
              })}
            </svg>
            {Object.keys(SCHEMA_NODES).map(renderNode)}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Ma'lumot — tartibli kalit: qiymat juftliklari",
    "JSON — bitta narsa: { \"kalit\": \"qiymat\" }",
    "Jadval — qatorlar (yozuvlar) × ustunlar (maydonlar)",
    "id va bog'lovchi (_id) jadvallarni ulaydi",
    "Sxema — bitta → ko'p bog'lanishlar xaritasi"
  ];
  const HOMEWORK = [
    { b: 'O\'z ilovangiz', t: "— sevimli ilovangizni tanlang (TikTok, do'kon, o'yin) va unga 3 ta jadval o'ylab toping" },
    { b: 'Bog\'lovchilar', t: "— har jadvalga id va kerakli _id (bog'lovchi) ustunlarini yozing" },
    { b: 'Sxema chizing', t: "— qog'ozda yoki AI bilan jadvallarni chizib, bog'lanish chiziqlarini torting" }
  ];
  const GLOSSARY = [
    { b: 'Ma\'lumot', t: "— tartibli saqlangan axborot" },
    { b: 'JSON', t: "— { kalit: qiymat } ko'rinishidagi yozuv" },
    { b: 'Jadval', t: "— qator va ustunlardan iborat" },
    { b: 'Qator (row)', t: "— bitta to'liq yozuv (post)" },
    { b: 'Ustun (column)', t: "— bitta maydon (izoh)" },
    { b: 'id (PK)', t: "— yozuvning yagona raqami" },
    { b: 'Bog\'lovchi (FK)', t: "— boshqa jadvalga ulovchi _id ustun" },
    { b: 'Bog\'lanish', t: "— bitta → ko'p (user → posts)" },
    { b: 'Sxema', t: "— butun ilovaning ma'lumot xaritasi" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Birinchi sxemangiz <span className="italic" style={{ color: T.accent }}>tayyor</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi siz har qanday ilovaning ma'lumotini jadval va bog'lanishlarga ajrata olasiz — bu backendning asosi." : "Yaxshi harakat! Jadval va bog'lanish tushunchalarini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'z ilovangiz sxemasini chizib ko'ring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda bu jadvallarni haqiqiy bazada — PostgreSQL'da quramiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function DataIntroLesson({ lang: langProp, onFinished }) {
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
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

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
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

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

        .bp-window { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.16); }

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
        @media (max-width: 760px) { .split { grid-template-columns: 1fr !important; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.3s ease-out; }

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
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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

        /* === 4-MODUL: KOD QUTISI === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; transition: color 0.3s; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .mini-row { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink}; padding: 5px 9px; background: ${T.bg}; border-radius: 7px; }

        /* === JSON KO'RINISHI === */
        .json-view { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.85; padding: 14px 16px; border-radius: 12px; margin: 0; overflow-x: auto; white-space: pre; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .jv-key { color: ${CODE.attr}; padding: 1px 3px; border-radius: 4px; }
        .jv-key.click { cursor: pointer; }
        .jv-key.click:hover { background: rgba(255,255,255,0.08); }
        .jv-key.on { background: rgba(255,79,40,0.22); color: #FFC9B8; }
        .jv-val { color: ${CODE.str}; } .jv-punct { color: ${CODE.punct}; } .jv-brace { color: ${CODE.text}; }

        /* === MA'LUMOT JADVALI === */
        .dtable-wrap { overflow-x: auto; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .dtable { border-collapse: collapse; width: 100%; background: #fff; font-family: 'Manrope', sans-serif; font-size: clamp(11.5px,1.45vw,13px); }
        .dtable th { background: #F0EEE8; color: ${T.ink2}; font-weight: 700; text-align: left; padding: 8px 12px; font-family: 'JetBrains Mono'; font-size: 11.5px; white-space: nowrap; }
        .dtable th.fk { color: ${T.accent}; }
        .dtable td { padding: 8px 12px; border-top: 1px solid #EFECE5; color: ${T.ink}; white-space: nowrap; }
        .dtable th.click, .dtable tr.click { cursor: pointer; }
        .dtable th.hi, .dtable td.hi { background: ${T.accentSoft}; color: ${T.accent}; }
        .dtable tr.hi td { background: ${T.accentSoft}; color: ${T.accent}; }
        .dtable tr.click:hover td { background: #FBF6F2; }

        /* === SXEMA JADVAL-KARTOCHKASI === */
        .tcard { background: #fff; border-radius: 11px; overflow: hidden; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.18); min-width: 130px; transition: box-shadow 0.2s; }
        .tcard.accent { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.25); }
        .tcard-h { background: ${T.ink}; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12.5px; padding: 8px 12px; letter-spacing: 0.03em; }
        .tcard-row { display: flex; align-items: center; gap: 7px; padding: 6px 11px; font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink}; border-top: 1px solid #EFECE5; transition: background 0.15s; }
        .tcard-row.pk { font-weight: 700; }
        .tcard-row.click { cursor: pointer; }
        .tcard-row.click:hover { background: ${T.bg}; }
        .tcard-row.active { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .tcard-row.done { background: ${T.successSoft}; color: ${T.success}; }
        .tc-k { white-space: nowrap; }
        .tc-badge { font-family: 'Manrope'; font-size: 8.5px; font-weight: 800; padding: 1px 5px; border-radius: 5px; letter-spacing: 0.03em; }
        .tc-badge.pk { background: ${T.blueSoft}; color: ${T.blue}; }
        .tc-badge.fk { background: ${T.accentSoft}; color: ${T.accent}; }

        /* === BOG'LANISH TUGMASI (s10) === */
        .rel-btn { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); color: ${T.ink}; }
        .rel-btn:hover { transform: translateY(-1px); }
        .rel-btn.on { background: ${T.accent}; color: #fff; box-shadow: 0 8px 18px -5px rgba(255,79,40,0.4); }
        .rel-btn.on .mono { color: #fff; }

        /* === TANLASH QATORI (s13) === */
        .pick-row { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); color: ${T.ink}; }
        .pick-row:hover { box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.2); }
        .pick-row.on { background: ${T.successSoft}; box-shadow: 0 8px 18px -6px rgba(31,122,77,0.25), inset 0 0 0 1.5px ${T.success}; }
        .pick-box { width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; color: ${T.success}; font-weight: 800; }
        .pick-row.on .pick-box { box-shadow: inset 0 0 0 2px ${T.success}; background: #fff; }

        /* === YAKUNIY SXEMA KANVAS (s15) === */
        .schema-scroll { overflow: auto; border-radius: 14px; -webkit-overflow-scrolling: touch; }
        .schema-canvas { position: relative; background: #FBFAF7; border-radius: 14px; box-shadow: inset 0 0 0 1px rgba(${T.shadowBase},0.08); }
        .schema-node { position: absolute; }
        .schema-svg { position: absolute; left: 0; top: 0; pointer-events: none; }
        .schema-svg line { stroke-dasharray: 640; stroke-dashoffset: 640; animation: draw-line 0.55s cubic-bezier(.4,0,.2,1) forwards; }
        @keyframes draw-line { to { stroke-dashoffset: 0; } }
        .schema-svg circle { animation: fade-step 0.5s ease both; }

        /* === Instagram POST KARTOCHKASI === */
        .igcard { border-radius: 11px; background: #fff; box-shadow: 0 4px 14px -4px rgba(0,0,0,0.16); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); width: 150px; }
        .igcard-h { display: flex; align-items: center; gap: 6px; padding: 6px 9px; }
        .igcard-ava { font-size: 16px; } .igcard-user { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink}; }
        .igcard-img { height: 70px; display: flex; align-items: center; justify-content: center; font-size: 34px; background: ${T.bg}; }
        .igcard-cap { padding: 7px 9px; font-family: 'Manrope'; font-size: 11px; color: ${T.ink}; line-height: 1.4; } .igcard-cap b { font-weight: 700; }

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
