import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// ============================================================
// BACKEND MODULI (4-MODUL) · 2-DARS — SQL vs NoSQL / PostgreSQL — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: ikki oila (SQL relyatsion / NoSQL hujjatli), shakl (qat'iy jadval vs erkin hujjat),
//        SQL kuchi (JOIN/bog'lanish + ishonchlilik/tranzaksiya), NoSQL kuchi (miqyos/tezlik — chat),
//        qaror mezonlari (bog'lanish/shakl/ishonchlilik/miqyos), nega aynan PostgreSQL,
//        va YAKUNDA: "Qaror kompasi" — loyihaga 4 savol berib, strelka to'g'ri DB'ni ko'rsatadi.
// Misol: Instagram (1-darsdan davom) + onlayn do'kon (ishonchlilik) + chat (NoSQL miqyos).
// 1-dars ko'prigi: sxema chizdik — endi uni QAYERDA va QANDAY saqlashni tanlaymiz.
// MUHIM: kelgusi darslar ro'yxati o'quvchiga AYTILMAYDI — faqat yakunda keyingi dars teaser.
// SQL TA'MI: bitta SELECT/JOIN so'rovi faqat KO'RSATILADI (yozdirilmaydi) — keyingi darsda yoziladi.
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori.
// Yakuniy ekran (s15): Qaror kompasi — onlayn do'kon uchun 4 mezonga javob → strelka PostgreSQL'da to'xtaydi.
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

const LESSON_META = { lessonId: 'db-sql-nosql-04-02-v16', lessonTitle: { uz: 'SQL vs NoSQL — nega PostgreSQL', ru: 'SQL vs NoSQL — почему PostgreSQL' } };
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

// ===== 4-MODUL · 2-DARS YORDAMCHILAR (SQL vs NoSQL) =====
// DB oilasi badge'i
const DbBadge = ({ kind, big }) => {
  const sql = kind === 'sql';
  return (
    <span className={`dbbadge ${sql ? 'sql' : 'nosql'} ${big ? 'big' : ''}`}>
      <b>{sql ? 'SQL' : 'NoSQL'}</b>
      <span className="dbsub">{sql ? 'PostgreSQL' : 'MongoDB'}</span>
    </span>
  );
};

// Soddalashtirilgan SQL so'rovini rang bilan ko'rsatish (faqat ko'rsatish — yozdirilmaydi)
const SQL_KW = new Set(['SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'AND', 'VALUES', 'INSERT INTO', 'LIMIT', '*']);
const SqlCode = ({ q }) => {
  const segs = q.split(/(SELECT|FROM|WHERE|JOIN|ON|AND|INSERT INTO|VALUES|LIMIT|\*)/g);
  return (
    <pre className="sql-box">{segs.map((s, i) => SQL_KW.has(s) ? <span key={i} className="sql-kw">{s}</span> : <span key={i}>{s}</span>)}</pre>
  );
};

// QAROR KOMPASI — strelka NoSQL (chap) ↔ SQL/PostgreSQL (o'ng) tomon suriladi. lean: -1..+1
const Compass = ({ lean = 0 }) => {
  const a = Math.max(-1, Math.min(1, lean)) * 78 * Math.PI / 180;
  const L = 82;
  const tx = 130 + L * Math.sin(a);
  const ty = 120 - L * Math.cos(a);
  return (
    <svg className="compass-svg" width="260" height="146" viewBox="0 0 260 146">
      <path d="M 34 120 A 96 96 0 0 1 130 24" stroke={T.blue} strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M 130 24 A 96 96 0 0 1 226 120" stroke={T.accent} strokeWidth="13" fill="none" strokeLinecap="round" />
      <line x1="130" y1="120" x2={tx} y2={ty} stroke={T.ink} strokeWidth="4" strokeLinecap="round" style={{ transition: 'all .7s cubic-bezier(.34,1.45,.5,1)' }} />
      <circle cx="130" cy="120" r="8" fill={T.ink} />
      <text x="30" y="140" fontSize="11" fontWeight="700" fill={T.blue} fontFamily="'JetBrains Mono', monospace">NoSQL</text>
      <text x="188" y="140" fontSize="11" fontWeight="700" fill={T.accent} fontFamily="'JetBrains Mono', monospace">SQL · PG</text>
    </svg>
  );
};

// ===== SCREEN 0 — HOOK (bir xil ma'lumot — ikki xil saqlash) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [view, setView] = useState('sql');
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? ['sql', 'nosql'] : ['sql']));
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const tried = seen.has('sql') && seen.has('nosql');
  const swap = (v) => { setView(v); setSeen(prev => { const s = new Set(prev); s.add(v); return s; }); };
  const OPTS = [
    { id: 'a', label: "SQL ko'rinishi — chunki jadval har doim to'g'ri" },
    { id: 'b', label: "NoSQL ko'rinishi — chunki u zamonaviyroq" },
    { id: 'c', label: "Ikkalasi ham to'g'ri — qaysi birini ishlatish vazifaga bog'liq" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 840 }}>Bir xil ma'lumotni saqlashning <span className="italic" style={{ color: T.accent }}>ikki yo'li</span> bor. Qaysi biri to'g'ri?</h1>
        <Mentor>O'tgan darsda Instagram sxemasini chizdik. Endi savol: uni qayerda saqlaymiz? Aslida <b style={{ color: T.ink }}>ikkita butunlay boshqacha dunyo</b> bor — <b style={{ color: T.accent }}>SQL</b> (chiroyli jadvallar) va <b style={{ color: T.blue }}>NoSQL</b> (egiluvchan hujjatlar). Ikkala ko'rinishni ko'ring — bu <b style={{ color: T.ink }}>aynan bir xil ma'lumot</b>, faqat boshqacha qadoqlangan.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'sql' ? 'chip-on' : ''}`} onClick={() => swap('sql')}>SQL jadval {seen.has('sql') ? '✓' : ''}</button>
              <button className={`chip ${view === 'nosql' ? 'chip-on' : ''}`} onClick={() => swap('nosql')}>NoSQL hujjat {seen.has('nosql') ? '✓' : ''}</button>
            </div>
            <Win title={view === 'sql' ? 'PostgreSQL — posts jadvali' : 'MongoDB — posts hujjati'} minH={150}>
              {view === 'sql'
                ? <div className="demo-swap"><DataTable cols={['id', 'user_id', 'rasm', 'izoh']} rows={POSTS.slice(0, 3)} fkCols={['user_id']} /></div>
                : <div className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{POSTS.slice(0, 2).map(p => <JsonView key={p.id} obj={{ id: p.id, user_id: p.user_id, izoh: p.izoh }} />)}</div>}
            </Win>
            <p className="mono small" style={{ margin: 0, color: view === 'sql' ? T.accent : T.blue }}>{view === 'sql' ? 'qator-ustun — qat\'iy tartib' : '{ } hujjat — egiluvchan'}</p>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, qaysi biri to'g'ri saqlash usuli?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval ikkala ko'rinishni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Hech biri "noto'g'ri" emas — <b>ikkalasi ham ishlaydi</b>. Savol shundaki: <b>qaysi vazifa uchun qaysi biri yaxshiroq?</b> Bugun shu tanlovni qilishni o'rganamiz — va nega bizning loyihalarga PostgreSQL mos kelishini ko'ramiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Ikki oila — SQL va NoSQL", tag: 'PostgreSQL · MongoDB' },
    { text: "Shakl — qat'iy jadval vs erkin hujjat", tag: 'shape' },
    { text: "Har biri nimada kuchli", tag: 'bog\'lanish · tezlik' },
    { text: "Qaror mezonlari — qachon qaysi biri", tag: '4 savol' },
    { text: "Nega bizga PostgreSQL", tag: 'bog\'langan + ishonchli' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — siz ishlatadigan qaror kompasi</p>
      <Win title="qaror kompasi" minH={172}>
        <div className="fade-up delay-1" style={{ display: 'flex', justifyContent: 'center' }}><Compass lean={0.7} /></div>
      </Win>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ loyihaga 4 savol berasiz, strelka to'g'ri DB'ni ko'rsatadi</p>
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
        <div className="head"><h2 className="title h-title fade-up">Ikki dunyo orasidan <span className="italic" style={{ color: T.accent }}>to'g'ri tanlash</span></h2></div>
        <Mentor>Va'da: dars oxirida loyihangiz uchun <b style={{ color: T.ink }}>qaysi ma'lumotlar bazasi to'g'ri kelishini</b> o'zingiz aniqlay olasiz. SQL ham, NoSQL ham zo'r — gap ularni <b style={{ color: T.ink }}>qachon ishlatishni</b> bilishda. O'ngdagi kompas bizni shu qarorga olib boradi.</Mentor>
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

// ===== SCREEN 2 — IKKI OILA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FAM = {
    sql: { name: 'SQL — relyatsion', members: 'PostgreSQL · MySQL · SQLite', store: 'Jadvallar (qator/ustun)', idea: "Ma'lumot qat'iy jadvallarda, hammasi bog'langan. Excel jadvaliga o'xshaydi — har qatorda bir xil ustunlar." },
    nosql: { name: 'NoSQL — hujjatli', members: 'MongoDB · Firebase · Redis', store: 'Hujjatlar (JSON)', idea: "Ma'lumot erkin hujjatlarda. Har hujjat o'z shakliga ega bo'lishi mumkin — papkadagi turli qog'ozlar kabi." }
  };
  const [active, setActive] = useState('sql');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['sql', 'nosql']) : new Set(['sql']));
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  const cur = FAM[active];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ikki oila" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 oila ko'rildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumotlar bazalari <span className="italic" style={{ color: T.accent }}>ikki oilaga</span> bo'linadi</h2></div>
        <Mentor>Dunyodagi barcha bazalar ikki katta oilaga bo'linadi: <b style={{ color: T.accent }}>SQL</b> (relyatsion — jadvalli) va <b style={{ color: T.blue }}>NoSQL</b> (hujjatli). Har oilada ko'p a'zo bor. Ikkalasini bosib, farqini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="dbpick" onClick={() => tap('sql')} style={active === 'sql' ? { boxShadow: `0 0 0 2px ${T.accent}` } : undefined}><DbBadge kind="sql" big /></button>
              <button className="dbpick" onClick={() => tap('nosql')} style={active === 'nosql' ? { boxShadow: `0 0 0 2px ${T.blue}` } : undefined}><DbBadge kind="nosql" big /></button>
            </div>
            <div className="sk-info" key={active}>
              <span className="sk-tagbig"><span className="sk-wordbadge" style={{ background: active === 'sql' ? T.accentSoft : T.blueSoft, color: active === 'sql' ? T.accent : T.blue }}>{cur.name}</span></span>
              <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{cur.idea}</p>
              <p className="small" style={{ color: T.ink2, margin: '8px 0 0' }}>A'zolari: <span className="mono">{cur.members}</span></p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikki oila — ikki xil fikrlash. <b>SQL</b> = jadval va qoidalar. <b>NoSQL</b> = erkin hujjatlar. Endi asosiy farqni ko'ramiz: shakl.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">{active === 'sql' ? 'Jadval ko\'rinishi' : 'Hujjat ko\'rinishi'}</p>
            {active === 'sql'
              ? <DataTable cols={['id', 'username']} rows={USERS} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{USERS.slice(0, 2).map(u => <JsonView key={u.id} obj={{ id: u.id, username: u.username }} />)}</div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — SHAKL: QAT'IY vs ERKIN =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(!!storedAnswer); // qo'shimcha maydon qo'shishga urinish
  const done = added;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Shakl" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Qo'shimcha maydon qo'shib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta postga <span className="italic" style={{ color: T.accent }}>"musiqa" qo'shsak</span> — nima bo'ladi?</h2></div>
        <Mentor>Eng katta farq — <b style={{ color: T.ink }}>shakl</b>. SQL jadvalida ustunlar <b style={{ color: T.accent }}>oldindan belgilangan</b> — yangi maydon qo'shish uchun jadvalni qaytadan tuzish kerak. NoSQL hujjatiga esa <b style={{ color: T.blue }}>istalgan maydonni</b> bemalol qo'shasiz. Tugmani bosing — bitta postga "musiqa" maydonini qo'shib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label"><DbBadge kind="sql" /> &nbsp;qat'iy jadval</p>
            <DataTable cols={added ? ['id', 'izoh', 'musiqa'] : ['id', 'izoh']} rows={[{ id: 10, izoh: "Tog' sayohati", musiqa: '???' }]} hiCol={added ? 'musiqa' : null} />
            {added && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>Xato!</b> <span className="mono">musiqa</span> degan ustun jadvalda yo'q. SQL'da avval jadval tuzilishini o'zgartirish kerak — har qator bir xil ustunlarga ega bo'lishi shart.</p></div>}
          </Col>
          <Col>
            <p className="flow-label"><DbBadge kind="nosql" /> &nbsp;erkin hujjat</p>
            <JsonView obj={added ? { id: 10, izoh: "Tog' sayohati", musiqa: '🎵 Lo-fi' } : { id: 10, izoh: "Tog' sayohati" }} hiKeys={added ? ['musiqa'] : []} />
            {added && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>Bemalol!</b> NoSQL hujjatiga <span className="mono">musiqa</span> maydonini shunchaki qo'shdik — boshqa hujjatlar o'zgarmaydi ham. Mana shu <b>egiluvchanlik</b>.</p></div>}
          </Col>
        </div>
        {!added && <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={() => setAdded(true)}>+ Ikkalasiga "musiqa" maydonini qo'shish</button>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (egiluvchanlik) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Har element har xil maydonga ega bo'lishi mumkin bo'lsa, qaysi oila qulayroq?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Shakli tez-tez o'zgaradigan, har xil ma'lumot uchun <span className="italic" style={{ color: T.accent }}>qaysi oila</span> egiluvchanroq?</h2></>}
    options={["SQL — har qator bir xil ustun bo'lishi shart", "NoSQL — har hujjat o'z maydonlariga ega bo'la oladi", "Ikkalasi bir xil egiluvchan", "Hech biri yangi maydon qo'sha olmaydi"]} correctIdx={1}
    explainCorrect="To'g'ri! NoSQL hujjatlari erkin shaklga ega — har biriga turli maydon qo'shsa bo'ladi. SQL'da esa ustunlar oldindan qat'iy belgilangan."
    explainWrong={{
      0: "Aksincha — SQL qat'iy: har qator bir xil ustunga ega bo'lishi shart. Egiluvchanlik NoSQL'da.",
      2: "Yo'q — farqi katta: SQL qat'iy, NoSQL erkin shaklli.",
      3: "Yo'q — ikkalasi ham qo'sha oladi, lekin NoSQL buni osonroq qiladi (jadvalni qayta tuzmasdan).",
      default: "Egiluvchan shakl — NoSQL'ning kuchi."
    }} />
);

// ===== SCREEN 5 — SQL KUCHI: BOG'LANISH + SELECT TA'MI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ran, setRan] = useState(!!storedAnswer);
  const done = ran;
  const result = POSTS.map(p => ({ username: userById(p.user_id).username, izoh: p.izoh }));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="SQL kuchi · so'rov" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Har postning egasini ko'rsat" — SQL buni <span className="italic" style={{ color: T.accent }}>bir qatorda</span> bajaradi</h2></div>
        <Mentor>SQL — bu <b style={{ color: T.ink }}>jadval bilan gaplashish tili</b>. Siz so'rov yozasiz, u javobni jadval qilib qaytaradi. Eng kuchli tomoni — <b style={{ color: T.ink }}>JOIN</b>: ikki jadvalni <span className="mono">user_id</span> orqali bir-biriga ulaydi. Bugun yozmaymiz — faqat bitta so'rovni ishga tushirib, qanchalik kuchli ekanini ko'ramiz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">SQL so'rovi (faqat ko'rsatish)</p>
            <SqlCode q={"SELECT users.username, posts.izoh\nFROM posts\nJOIN users ON posts.user_id = users.id"} />
            <p className="small" style={{ color: T.ink2, margin: 0 }}>O'qilishi: "posts'ni users bilan <b>user_id</b> orqali birlashtir, har postga egasining ismini qo'sh".</p>
            {!ran && <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>▶ So'rovni ishga tushirish</button>}
          </Col>
          <Col>
            <p className="flow-label">Natija — ikki jadval birlashdi</p>
            {ran
              ? <><DataTable cols={['username', 'izoh']} rows={result} />
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana SQL'ning kuchi: ikkita jadvalni <b>bir qatorda</b> birlashtirdi. Ko'p bog'langan ma'lumot bilan ishlash — aynan SQL uchun yaratilgan.</p></div></>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← So'rovni ishga tushiring — natija shu yerda jadval bo'lib chiqadi</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (bog'langan ma'lumot) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Ko'p bog'langan ma'lumot (users, posts, comments) bilan qaysi oila qulayroq?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ko'p <span className="italic" style={{ color: T.accent }}>bog'langan</span> jadvallar bilan ishlashda qaysi oila qulayroq?</h2></>}
    options={["NoSQL — har narsa alohida hujjatda", "SQL — JOIN bilan jadvallarni oson bog'laydi", "Bog'lanish ikkalasida ham yo'q", "Faqat qo'lda hisoblash kerak"]} correctIdx={1}
    explainCorrect="To'g'ri! SQL aynan bog'langan ma'lumot uchun yaratilgan — JOIN bilan jadvallarni bir-biriga ulab, murakkab savollarga bir so'rovda javob beradi."
    explainWrong={{
      0: "NoSQL'da bog'lanish qiyinroq — ko'pincha ma'lumotni takrorlashga to'g'ri keladi.",
      2: "Bog'lanish bor — SQL uni JOIN bilan, juda qulay qiladi.",
      3: "Yo'q — SQL JOIN buni avtomatik bajaradi.",
      default: "Bog'langan ma'lumot — SQL'ning kuchli tomoni (JOIN)."
    }} />
);

// ===== SCREEN 6 — SQL KUCHI: ISHONCHLILIK (oxirgi mahsulot) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ran, setRan] = useState(!!storedAnswer);
  const done = ran;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="SQL kuchi · ishonchlilik" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Vaziyatni sinab ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi mahsulotni <span className="italic" style={{ color: T.accent }}>2 kishi bir vaqtda</span> sotib olsa-chi?</h2></div>
        <Mentor>Do'konda <b style={{ color: T.ink }}>bitta</b> telefon qoldi. Ali va Vali aynan bir lahzada "Sotib olish" bosdi. Agar baza ehtiyot bo'lmasa — <b style={{ color: T.ink }}>ikkovi ham</b> sotib olib qo'yadi (xato!). SQL bu yerda <b style={{ color: T.accent }}>tranzaksiya</b> bilan himoya qiladi: faqat bittasiga sotadi. Pul va buyurtmada bunday <b style={{ color: T.ink }}>ishonchlilik</b> hayotiy muhim.</Mentor>
        <div className="split">
          <Col>
            <Win title="do'kon — ombor" minH={120}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 34 }}>📱</div>
                <div>
                  <p className="body" style={{ margin: 0, color: T.ink, fontWeight: 700 }}>Telefon X</p>
                  <p className="mono small" style={{ margin: '3px 0 0', color: ran ? T.accent : T.ink2 }}>omborda: {ran ? 0 : 1} dona</p>
                </div>
              </div>
            </Win>
            {!ran && <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>🛒 Ali va Vali bir vaqtda bosdi</button>}
          </Col>
          <Col>
            <p className="flow-label">Natija — SQL nazorati</p>
            {ran ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="frame-success" style={{ padding: '11px 14px' }}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.success }}>✓ Ali</b> sotib oldi — tranzaksiya birinchi unga yetib bordi.</p></div>
                <div className="frame-warn" style={{ padding: '11px 14px' }}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>✗ Vali</b> "Kechirasiz, mahsulot tugadi" xabarini oldi.</p></div>
                <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>SQL bir lahzada faqat bittasiga sotdi — <b>ikki marta sotilmadi</b>. Bank, to'lov, buyurtma kabi joylarda bu xususiyat — eng muhimi.</p></div>
              </div>
            ) : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Tugmani bosing — SQL nima qilishini ko'ring</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — NoSQL KUCHI: MIQYOS + TEZLIK (chat) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(storedAnswer ? 1240517 : 1240489);
  const [msgs, setMsgs] = useState(storedAnswer ? ['Salom!', 'Qanaqasan?', 'Zo\'r 🔥'] : []);
  const timer = useRef(null);
  const done = count >= 1240505 || !!storedAnswer;
  const POOL = ['Salom!', 'Qanaqasan?', 'Bugun darsdamisan?', 'Zo\'r 🔥', 'Ha, keldim', '👍', 'Rahmat!', 'Kechqurun chiqamizmi?'];
  useEffect(() => () => clearInterval(timer.current), []);
  const run = () => {
    if (running) return; setRunning(true);
    let n = 0;
    timer.current = setInterval(() => {
      n++;
      setCount(c => c + 1 + Math.floor(n / 2));
      setMsgs(m => [...m.slice(-3), POOL[(n * 3) % POOL.length]]);
      if (n >= 6) { clearInterval(timer.current); setRunning(false); }
    }, 350);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="NoSQL kuchi · miqyos" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Xabarlar oqimini ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Millionlab chat xabari — bu yerda <span className="italic" style={{ color: T.blue }}>NoSQL</span> porlaydi</h2></div>
        <Mentor>Endi NoSQL kuchini ko'raylik. Telegram'simon chatda har soniyada <b style={{ color: T.ink }}>minglab xabar</b> keladi. Har xabar — oddiy hujjat (kim, matn, vaqt), murakkab bog'lanish yo'q. Bunday <b style={{ color: T.ink }}>ulkan miqyos + tezlik + oddiy shakl</b> uchun NoSQL ideal. Tugmani bosib, oqimni kuzating.</Mentor>
        <div className="split">
          <Col>
            <Win title="chat.uz — jonli oqim" minH={150}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {msgs.length === 0
                  ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Xabarlar shu yerda oqib o'tadi…</p>
                  : msgs.map((m, i) => <div key={i} className="chatmsg el-in">{m}</div>)}
              </div>
            </Win>
            {!running && !done && <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run}>💬 Xabarlar oqimini boshlash</button>}
            {running && <p className="mono small" style={{ color: T.blue, margin: 0 }}>oqim ketyapti…</p>}
          </Col>
          <Col>
            <p className="flow-label">Jami xabarlar</p>
            <div className="bigcount">{count.toLocaleString('en-US')}</div>
            <p className="small" style={{ color: T.ink2, margin: 0 }}>Har xabar — oddiy hujjat: <span className="mono">{'{ kim, matn, vaqt }'}</span>. Bog'lanish kam, soni ulkan, tezlik shart.</p>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>NoSQL ulkan, oddiy va tez ma'lumot uchun zo'r. <span className="mono">(Masalan, o'yin inventari ham har o'yinchida har xil — NoSQL egiluvchanligi shu yerda ham qo'l keladi.)</span></p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — QAROR MEZONLARI (4 savol + mini kompas) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CRIT = [
    { id: 'rel', q: "Ma'lumotlar bir-biriga bog'langanmi?", side: 'sql', note: "Bog'langan bo'lsa → SQL (JOIN)" },
    { id: 'shape', q: "Shakli qat'iy (hamma yozuv bir xil)mi?", side: 'sql', note: "Qat'iy shakl → SQL" },
    { id: 'safe', q: "Xatolik pul/buyurtmaga zarar qiladimi?", side: 'sql', note: "Ishonchlilik shart → SQL" },
    { id: 'scale', q: "Ulkan + juda oddiy + faqat tezlik kerakmi?", side: 'nosql', note: "Ulkan & oddiy → NoSQL" }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(CRIT.map(c => c.id)) : new Set());
  const [active, setActive] = useState(null);
  const done = seen.size >= CRIT.length;
  const tap = (c) => { setActive(c.id); setSeen(prev => { const s = new Set(prev); s.add(c.id); return s; }); };
  const sqlSeen = CRIT.filter(c => seen.has(c.id) && c.side === 'sql').length;
  const nosqlSeen = CRIT.filter(c => seen.has(c.id) && c.side === 'nosql').length;
  const lean = (sqlSeen - nosqlSeen) / CRIT.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qaror mezonlari" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 mezon ko'rildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi birini tanlash — <span className="italic" style={{ color: T.accent }}>4 savol</span> hal qiladi</h2></div>
        <Mentor>Tanlovni 4 ta savol osonlashtiradi. Har birini bosing — u qaysi tomonni ko'rsatishini ko'ring. O'ngdagi kompas javoblarga qarab suriladi. Ko'pchilik oddiy loyihalarda javoblar <b style={{ color: T.accent }}>SQL</b> tomon og'adi.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CRIT.map(c => (
                <button key={c.id} className={`crit-btn ${active === c.id ? 'on' : ''} ${seen.has(c.id) ? 'seen' : ''}`} onClick={() => tap(c)}>
                  <span className="crit-q">{c.q}</span>
                  {seen.has(c.id) && <span className="crit-side" style={{ color: c.side === 'sql' ? T.accent : T.blue }}>→ {c.side === 'sql' ? 'SQL' : 'NoSQL'}</span>}
                </button>
              ))}
            </div>
            {active && <div className="hint fade-step"><p className="small" style={{ margin: 0, color: T.ink2 }}>{CRIT.find(c => c.id === active).note}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Kompas — javoblarga qarab suriladi</p>
            <Win title="qaror kompasi" minH={172}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><Compass lean={lean} /></div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 mezondan 3 tasi <b>SQL</b> tomon, 1 tasi NoSQL tomon. Demak ko'p loyihalar uchun boshlang'ich tanlov — SQL. Endi nega aynan <b>PostgreSQL</b> ekanini ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (bank → SQL) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Bank ilovasi (pul, hisoblar, o'tkazmalar) uchun qaysi DB to'g'riroq?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bank ilovasi — pul, hisoblar, o'tkazmalar. <span className="italic" style={{ color: T.accent }}>Qaysi DB</span>?</h2></>}
    options={["NoSQL — chunki u tezroq", "SQL — bog'langan + ishonchlilik shart, pulda xato bo'lmasligi kerak", "Farqi yo'q", "Hech qanday DB kerak emas"]} correctIdx={1}
    explainCorrect="To'g'ri! Bankda ma'lumot bog'langan (hisob↔o'tkazma) va xato qimmatga tushadi — pul yo'qolmasligi kerak. Bu SQL'ning aynan kuchli tomoni (tranzaksiya, ishonchlilik)."
    explainWrong={{
      0: "Tezlik bu yerda asosiy emas — pulda xato bo'lmasligi muhimroq. Bu SQL.",
      2: "Farqi katta: bankka ishonchlilik va bog'lanish kerak → SQL.",
      3: "Albatta kerak — va bunday muhim ma'lumot uchun SQL (masalan PostgreSQL).",
      default: "Bank = bog'langan + ishonchli → SQL."
    }} />
);

// ===== SCREEN 10 — NEGA POSTGRESQL =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FEATS = [
    { id: 'rel', t: 'Relyatsion (SQL)', d: "Jadvallar va JOIN — bog'langan ma'lumot bilan zo'r ishlaydi." },
    { id: 'safe', t: 'Ishonchli', d: "Tranzaksiyalar — pul va buyurtmada xato bo'lmaydi." },
    { id: 'free', t: 'Bepul + ochiq kodli', d: "Hech kim pul so'ramaydi, butun dunyo ishlatadi." },
    { id: 'json', t: 'JSON ham saqlaydi', d: "Kerak bo'lsa, NoSQL kabi egiluvchan JSON ham saqlay oladi — ikki dunyodan eng yaxshisi!" },
    { id: 'stack', t: 'PERN/PEAN stackning "P"si', d: "React + Node + Express bilan ajoyib ishlaydi — bizning to'plamimiz." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(FEATS.map(f => f.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'json' : null);
  const done = seen.size >= 3 || !!storedAnswer;
  const tap = (f) => { setActive(f.id); setSeen(prev => { const s = new Set(prev); s.add(f.id); return s; }); };
  const cur = FEATS.find(f => f.id === active);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Nega PostgreSQL" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 sabab ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega bizning loyihalarga aynan <span className="italic" style={{ color: T.accent }}>PostgreSQL</span>?</h2></div>
        <Mentor>SQL oilasida ko'p a'zo bor — nega aynan <b style={{ color: T.accent }}>PostgreSQL</b>? Chunki u bizning loyihalarga (Instagram, do'kon, planner) juda mos: bog'langan, ishonchli, bepul — va kerak bo'lsa <b style={{ color: T.ink }}>JSON</b> ham saqlay oladi (ya'ni NoSQL egiluvchanligi ham bor!). Sabablarni bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="fade-up delay-1">
              <div className="pg-logo">🐘</div>
              <div><p className="body" style={{ margin: 0, fontWeight: 700, color: T.ink }}>PostgreSQL</p><p className="small mono" style={{ margin: '2px 0 0', color: T.accent }}>relyatsion · ishonchli · bepul</p></div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {FEATS.map(f => <button key={f.id} className={`chip ${active === f.id ? 'chip-on' : ''}`} onClick={() => tap(f)}>{f.t} {seen.has(f.id) ? '✓' : ''}</button>)}
            </div>
            {cur ? <div className="sk-info" key={cur.id}><span className="sk-tagbig"><span className="sk-wordbadge">{cur.t}</span></span><p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Yuqoridan bir sababni bosing</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Taqqoslash</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="cmp-row"><DbBadge kind="sql" /><span className="small" style={{ color: T.ink }}>bog'langan + ishonchli + JSON ham — <b style={{ color: T.accent }}>bizga mos</b></span></div>
              <div className="cmp-row"><DbBadge kind="nosql" /><span className="small" style={{ color: T.ink2 }}>ulkan oddiy oqim uchun zo'r, lekin bog'lanish qiyin</span></div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>PostgreSQL — SQL kuchini va NoSQL egiluvchanligini birlashtiradi. Shuning uchun bizning butun moduldagi tanlovimiz — <b>PostgreSQL</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — VIBECODING (AI'dan DB tavsiyasi) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const APPS = [
    { id: 'shop', label: 'Onlayn do\'kon yasamoqchiman', db: 'sql', why: "Buyurtma↔mahsulot↔to'lov bog'langan, pulda xato bo'lmasligi kerak → PostgreSQL." },
    { id: 'chat', label: 'Oddiy chat ilovasi yasamoqchiman', db: 'nosql', why: "Millionlab oddiy xabar, tezlik kerak, bog'lanish kam → NoSQL (MongoDB)." },
    { id: 'blog', label: 'Blog platformasi yasamoqchiman', db: 'sql', why: "Muallif↔maqola↔izoh bog'langan, qat'iy shakl → PostgreSQL." }
  ];
  const [app, setApp] = useState(null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle');
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id) => { clearTimeout(timer.current); setApp(id); setPhase('planned'); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1000); };
  const cur = APPS.find(a => a.id === app) || (storedAnswer ? APPS[0] : null);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi qadam · AI" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "AI'dan tavsiya so'rang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyihangizga DB'ni <span className="italic" style={{ color: T.accent }}>AI tavsiya</span> qilsin — siz tekshiring</h2></div>
        <Mentor>Endi siz tanlov mantig'ini bilasiz! Loyihangizni ayting, AI <b style={{ color: T.ink }}>DB tavsiya qiladi va sababini aytadi</b> — siz esa tekshirasiz: sabab to'g'rimi? Bog'langanmi, ishonchlilik kerakmi, yoki ulkan-oddiy oqimmi? Boshliq — siz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">1. AI'ga loyihangizni ayting</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {APPS.map(a => <button key={a.id} className={`chip ${app === a.id ? 'chip-on' : ''}`} onClick={() => choose(a.id)} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>"{a.label}"</button>)}
            </div>
            {!cur && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Yuqoridan bitta loyihani tanlang</p></div>}
            {cur && (
              <div className="ai-card fade-step" key={app || 'stored'}>
                <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">{phase === 'planned' ? 'Mana tahlilim — tasdiqlaysizmi?' : (phase === 'building' ? 'Tahlil qilyapman…' : 'Tavsiyam tayyor')}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {phase !== 'planned' && <DbBadge kind={cur.db} />}
                  <span className="small" style={{ color: T.ink }}>{phase === 'planned' ? 'Loyihani tahlil qildim.' : cur.why}</span>
                </div>
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Tahlilni ko'rsat</button>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">2. Tavsiya natijasi</p>
            <Win title={cur ? `${cur.id}-loyiha — DB tavsiyasi` : 'tavsiya'} minH={130}>
              {done && cur ? (
                <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <DbBadge kind={cur.db} big />
                  <p className="small" style={{ color: T.ink2, textAlign: 'center', margin: 0 }}>{cur.db === 'sql' ? 'PostgreSQL tavsiya etiladi' : 'MongoDB (NoSQL) tavsiya etiladi'}</p>
                </div>
              ) : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Loyihani tanlang va tahlilni tasdiqlang…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI tavsiya berdi, siz <b>sababini tekshirdingiz</b>. Do'kon va blog — bog'langan → SQL. Chat — ulkan oddiy oqim → NoSQL. Mantiq to'g'ri!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (nega PostgreSQL) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Nega bizning loyihalar uchun PostgreSQL tanlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega bizning loyihalar uchun <span className="italic" style={{ color: T.accent }}>PostgreSQL</span>?</h2></>}
    options={["Chunki u eng yangi va modaviy", "Bog'langan + ishonchli, bepul, va kerak bo'lsa JSON ham saqlaydi", "Chunki boshqa bazalar yo'q", "Chunki u faqat kichik loyihalarga"]} correctIdx={1}
    explainCorrect="To'g'ri! PostgreSQL relyatsion (bog'lanish), ishonchli (tranzaksiya), bepul/ochiq kodli, va hatto JSON ham saqlaydi — bizning loyihalarga ideal."
    explainWrong={{
      0: "Tanlov modaga emas, vazifaga bog'liq. PostgreSQL — bog'langan + ishonchli + bepul + JSON ham.",
      2: "Bazalar ko'p (MySQL, MongoDB...). PostgreSQL aniq sabablarga ko'ra tanlanadi.",
      3: "Aksincha — PostgreSQL ulkan loyihalarni ham ko'taradi.",
      default: "PostgreSQL: bog'langan + ishonchli + bepul + JSON ham."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: LOYIHA → DB MOSLASHTIRISH O'YINI =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PROJECTS = [
    { id: 'bank', label: 'Bank ilovasi', db: 'sql', why: "pul, bog'langan, ishonchlilik" },
    { id: 'chat', label: 'Chat ilovasi', db: 'nosql', why: "millionlab oddiy xabar, tezlik" },
    { id: 'shop', label: "Onlayn do'kon", db: 'sql', why: "buyurtma↔mahsulot, to'lov" },
    { id: 'logs', label: 'Server loglari', db: 'nosql', why: "ulkan, oddiy, bog'lanishsiz" }
  ];
  const [assign, setAssign] = useState(storedAnswer ? Object.fromEntries(PROJECTS.map(p => [p.id, p.db])) : {});
  const allRight = PROJECTS.every(p => assign[p.id] === p.db);
  const done = allRight;
  const choose = (id, db) => setAssign(a => ({ ...a, [id]: db }));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const okCount = PROJECTS.filter(p => assign[p.id] === p.db).length;
  return (
    <Stage eyebrow="Amaliyot · moslashtirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${okCount}/4 to'g'ri`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har loyihaga <span className="italic" style={{ color: T.accent }}>to'g'ri bazani</span> tanlang</h2></div>
        <Mentor>Endi o'zingiz qaror qiling! Har bir loyiha uchun <b style={{ color: T.accent }}>SQL</b> yoki <b style={{ color: T.blue }}>NoSQL</b> tugmasini bosing. O'ylang: bog'langanmi? ishonchlilik kerakmi? yoki ulkan-oddiy-tezmi? To'g'ri tanlasangiz — yashil bo'ladi.</Mentor>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640, margin: '0 auto', width: '100%' }}>
          {PROJECTS.map(p => {
            const a = assign[p.id];
            const correct = a === p.db;
            return (
              <div key={p.id} className="matchrow">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="body" style={{ margin: 0, fontWeight: 700, color: T.ink }}>{p.label}</p>
                  {a && <p className="small" style={{ margin: '2px 0 0', color: correct ? T.success : T.accent }}>{correct ? `✓ ${p.why}` : 'qayta o\'ylang'}</p>}
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button className={`mbtn ${a === 'sql' ? (correct ? 'ok' : 'bad') : ''}`} onClick={() => choose(p.id, 'sql')}>SQL</button>
                  <button className={`mbtn ${a === 'nosql' ? (correct ? 'ok' : 'bad') : ''}`} onClick={() => choose(p.id, 'nosql')}>NoSQL</button>
                </div>
              </div>
            );
          })}
        </div>
        {done && <div className="frame-success fade-step" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}><p className="body" style={{ margin: 0, color: T.ink }}>Hammasi to'g'ri! Bank va do'kon — bog'langan + ishonchli → <b>SQL</b>. Chat va loglar — ulkan + oddiy → <b>NoSQL</b>. Tanlov vazifaga bog'liq.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — MIF-BUSTER (debugging uslubi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'myth' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'myth';
  const done = fixed;
  const CLAIMS = [
    { id: 'c1', txt: "SQL bog'langan ma'lumot bilan zo'r ishlaydi", ok: true },
    { id: 'myth', txt: "NoSQL zamonaviyroq, shuning uchun do'konga ham NoSQL kerak", ok: false },
    { id: 'c3', txt: "Tanlov vazifaga bog'liq, modaga emas", ok: true }
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Mif-buster" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi to\'g\'irlang' : "Noto'g'ri fikrni toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Do'stingiz aytdi — bitta fikr <span className="italic" style={{ color: T.accent }}>noto'g'ri</span>. Toping.</h2></div>
        <Mentor>Ko'p odam adashadi: "NoSQL yangi, demak har doim yaxshiroq". Bu — <b style={{ color: T.ink }}>mif</b>! Tanlov modaga emas, <b style={{ color: T.ink }}>vazifaga</b> bog'liq. Quyidagi fikrlardan noto'g'risini bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Do'st</span><span className="ai-bubble">Fikrlar:</span></div>
              <div className="ai-code">
                {CLAIMS.map(c => {
                  const isMyth = c.id === 'myth';
                  if (isMyth && fixed) return <div key={c.id} className="ai-line ok el-in" style={{ cursor: 'default' }}>Do'kon bog'langan + ishonchli kerak → <b style={{ color: CODE.str }}>SQL (PostgreSQL)</b> ✓</div>;
                  return <div key={c.id} className={`ai-line ${found && isMyth ? 'bad' : ''} ${!found && picked === c.id && !isMyth ? 'ok' : ''}`} onClick={() => { if (!found) setPicked(isMyth ? 'myth' : c.id); }}>{c.txt}</div>;
                })}
              </div>
              {!found && <p className="ai-prompt">Qaysi fikr noto'g'ri? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 To'g'ri fikrga almashtirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ To'g'irlandi!</p>}
            </div>
          </Col>
          <Col>
            {!found && ((picked && picked !== 'myth')
              ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu fikr to'g'ri. Yana qarang: qaysi fikr DB'ni <b>modaga qarab</b> ("zamonaviyroq") tanlamoqda?</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Maslahat: "zamonaviyroq" — bu sabab emas. Do'kon ma'lumoti bog'langan va ishonchli bo'lishi kerak.</p></div>)}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>"Zamonaviyroq" — yaxshi sabab emas. Do'konda buyurtma, mahsulot va to'lov <b>bog'langan</b> hamda <b>ishonchlilik</b> shart — bu <b>SQL</b> (PostgreSQL) ishi. Chapdagi tugma bilan to'g'irlang →</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🧭</div><p className="ta-h">DB modaga emas, vazifaga qarab tanlanadi</p><p className="ta-sub">Bog'langan + ishonchli → SQL · ulkan + oddiy → NoSQL</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: QAROR KOMPASI =====
const FINAL_CRIT = [
  { id: 'rel', q: "Buyurtma, mahsulot va xaridor bir-biriga bog'langanmi?", sql: 'ha' },
  { id: 'shape', q: "Har buyurtmada bir xil maydonlar bo'ladimi (qat'iy shakl)?", sql: 'ha' },
  { id: 'safe', q: "To'lovda xatolik qimmatga tushadimi?", sql: 'ha' },
  { id: 'scale', q: "Ma'lumot ulkan + juda oddiy + faqat tezlik kerakmi?", sql: 'yoq' }
];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ans, setAns] = useState(storedAnswer ? Object.fromEntries(FINAL_CRIT.map(c => [c.id, c.sql])) : {});
  const answered = FINAL_CRIT.filter(c => ans[c.id]).length;
  const sqlCount = FINAL_CRIT.filter(c => ans[c.id] === c.sql).length;
  const nosqlCount = FINAL_CRIT.filter(c => ans[c.id] && ans[c.id] !== c.sql).length;
  const lean = (sqlCount - nosqlCount) / FINAL_CRIT.length;
  const allAnswered = answered === FINAL_CRIT.length;
  const passed = allAnswered && lean >= 0.5; // do'kon → SQL/PostgreSQL
  const wrongLean = allAnswered && !passed;
  useEffect(() => {
    if (passed && !storedAnswer) onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Loyiha uchun DB tanlash (qaror kompasi)", correct: true, firstAttemptCorrect: true, solved: true, picked: 'postgresql' });
  }, [passed]);
  const setA = (id, v) => setAns(a => ({ ...a, [id]: v }));
  const reset = () => setAns({});
  return (
    <Stage eyebrow="Yakuniy · qaror kompasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `${answered}/4 javob`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,14px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>onlayn do'kon</span> uchun DB tanlang.</h2></div>
        <Mentor>Mana sizning loyihangiz — <b style={{ color: T.ink }}>onlayn do'kon</b>. 4 ta savolga rostini javob bering. Har javob kompas strelkasini suradi. To'g'ri fikrlasangiz — strelka <b style={{ color: T.accent }}>PostgreSQL</b> tomon to'xtaydi.</Mentor>
        <div className="split" style={{ gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)', alignItems: 'start' }}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {FINAL_CRIT.map(c => (
                <div key={c.id} className="ynrow fade-up">
                  <span className="ynq">{c.q}</span>
                  <div className="ynbtns">
                    <button className={`ynbtn ${ans[c.id] === 'ha' ? 'on' : ''}`} onClick={() => setA(c.id, 'ha')}>Ha</button>
                    <button className={`ynbtn ${ans[c.id] === 'yoq' ? 'on' : ''}`} onClick={() => setA(c.id, 'yoq')}>Yo'q</button>
                  </div>
                </div>
              ))}
            </div>
            {wrongLean && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hmm — do'kon ma'lumotlari <b>bog'langan</b> va to'lov <b>ishonchli</b> bo'lishi kerak. Javoblarni qayta ko'rib chiqing.</p></div>}
          </Col>
          <Col>
            <Win title={passed ? 'natija: PostgreSQL ✓' : 'qaror kompasi'} minH={172} hotTitle={passed}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Compass lean={lean} />
                {passed && <DbBadge kind="sql" big />}
              </div>
            </Win>
            {passed
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Mukammal! Strelka <b>PostgreSQL</b>'da to'xtadi. Siz loyiha uchun to'g'ri bazani — mezonlar asosida — o'zingiz tanladingiz!</p></div>
              : <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={reset}>↻ Qaytadan</button>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Ikki oila: SQL (jadval) va NoSQL (hujjat)",
    "SQL — qat'iy shakl, bog'lanish (JOIN), ishonchlilik",
    "NoSQL — erkin shakl, ulkan miqyos, tezlik",
    "Tanlov modaga emas, vazifaga bog'liq",
    "Bizning loyihalarga — PostgreSQL (+ JSON ham qiladi)"
  ];
  const HOMEWORK = [
    { b: "Orzu ilovangiz", t: "— sevimli ilova g'oyangizni tanlang va unga SQL yoki NoSQL'ni 4 mezon bo'yicha tanlang" },
    { b: "Sababini yozing", t: "— nega aynan shu DB? (bog'langanmi, ishonchlilikmi, yoki ulkan-oddiymi)" },
    { b: "PostgreSQL'ni ko'ring", t: "— postgresql.org saytiga kiring va 🐘 logotipini toping" }
  ];
  const GLOSSARY = [
    { b: 'SQL', t: "— relyatsion (jadvalli) bazalar tili" },
    { b: 'NoSQL', t: "— hujjatli/egiluvchan bazalar" },
    { b: 'PostgreSQL', t: "— bizning SQL bazamiz (🐘)" },
    { b: 'MongoDB', t: "— mashhur NoSQL bazasi" },
    { b: 'JOIN', t: "— SQL'da ikki jadvalni bog'lash" },
    { b: 'Tranzaksiya', t: "— ishonchlilik: xato bo'lmaydi" },
    { b: 'Qaror mezoni', t: "— bog'lanish / shakl / ishonchlilik / miqyos" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>to'g'ri bazani</span> tanlay olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! SQL va NoSQL farqini va PostgreSQL nega bizga mosligini tushundingiz — har loyiha uchun ongli tanlov qila olasiz." : "Yaxshi harakat! Qaror mezonlarini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'z loyihangiz uchun DB tanlang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda PostgreSQL'da haqiqiy jadval yaratamiz — CREATE TABLE! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function DbSqlNosqlLesson({ lang: langProp, onFinished }) {
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

        /* === 4-MODUL · 2-DARS: SQL vs NoSQL === */
        .dbbadge { display: inline-flex; flex-direction: column; align-items: flex-start; line-height: 1.1; padding: 6px 12px; border-radius: 10px; font-family: 'Manrope', sans-serif; }
        .dbbadge b { font-size: 13px; font-weight: 800; letter-spacing: 0.02em; }
        .dbbadge .dbsub { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; opacity: 0.85; margin-top: 1px; }
        .dbbadge.big b { font-size: 16px; } .dbbadge.big .dbsub { font-size: 11px; }
        .dbbadge.sql { background: ${T.accentSoft}; color: ${T.accent}; }
        .dbbadge.nosql { background: ${T.blueSoft}; color: ${T.blue}; }
        .dbpick { border: none; background: ${T.paper}; border-radius: 12px; padding: 10px 12px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .dbpick:hover { transform: translateY(-1px); }

        .sql-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.75; padding: 14px 16px; border-radius: 12px; margin: 0; overflow-x: auto; white-space: pre-wrap; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .sql-kw { color: ${CODE.tag}; font-weight: 700; }

        .compass-svg { max-width: 100%; height: auto; }

        .crit-btn { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .crit-btn:hover { box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.2); }
        .crit-btn.on { box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22), inset 0 0 0 1.5px ${T.ink3}; }
        .crit-btn.seen { background: #FBFAF7; }
        .crit-q { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.6vw,14.5px); color: ${T.ink}; }
        .crit-side { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; flex-shrink: 0; }

        .cmp-row { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 11px; padding: 11px 13px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }

        .chatmsg { align-self: flex-start; background: ${T.blueSoft}; color: ${T.ink}; font-family: 'Manrope'; font-weight: 600; font-size: 13px; padding: 7px 13px; border-radius: 13px 13px 13px 4px; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); }
        .bigcount { font-family: 'Fraunces', serif; font-size: clamp(26px,4vw,38px); font-weight: 400; color: ${T.blue}; letter-spacing: -0.01em; }
        .pg-logo { width: 46px; height: 46px; border-radius: 12px; background: ${T.accentSoft}; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }

        .matchrow { display: flex; align-items: center; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .mbtn { font-family: 'Manrope'; font-weight: 700; font-size: 13px; border: none; border-radius: 9px; padding: 8px 15px; cursor: pointer; background: ${T.bg}; color: ${T.ink2}; transition: all 0.16s; box-shadow: inset 0 0 0 1.5px rgba(${T.shadowBase},0.12); }
        .mbtn:hover { transform: translateY(-1px); }
        .mbtn.ok { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .mbtn.bad { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }

        .ynrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .ynq { font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; flex: 1; min-width: 0; }
        .ynbtns { display: flex; gap: 6px; flex-shrink: 0; }
        .ynbtn { font-family: 'Manrope'; font-weight: 700; font-size: 13px; border: none; border-radius: 9px; padding: 7px 14px; cursor: pointer; background: ${T.bg}; color: ${T.ink2}; transition: all 0.16s; box-shadow: inset 0 0 0 1.5px rgba(${T.shadowBase},0.12); }
        .ynbtn:hover { transform: translateY(-1px); }
        .ynbtn.on { background: ${T.accent}; color: #fff; box-shadow: 0 5px 13px -5px rgba(255,79,40,0.45); }

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
