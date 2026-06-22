import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// PRAKTIKA 2-DARS — AI BILAN TEZ SIFATLI SAYT (promo landing) — PLATFORM STANDARD v16
// Mavzu: vibecoding; yaxshi PROMPT (4 ingredient: mavzu, uslub, rang, qismlar);
//        yomon vs yaxshi prompt; iteratsiya (qayta so'rash); natijani tekshirish.
// Loyiha: bloklardan prompt yig'ib, promo landing sahifa qurish (jonli preview).
// Asosiy xabar: "AI tezlik beradi — SIFATni siz ta'minlaysiz."
// Tool: Antigravity (haqiqiy uyga vazifa muhiti).
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

const LESSON_META = { lessonId: 'practice-02-ai-promo-v16', lessonTitle: { uz: 'Praktika 2 — AI bilan tez sayt', ru: 'Практика 2 — Быстрый сайт через AI' } };
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
  { id: 's11', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
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
        <img src={mentorImg} alt="" />
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

// ===== PROMO MA'LUMOTLARI =====
const PROMO = {
  oyin:   { tag: "O'yin", title: 'PIXEL QUEST', sub: "Yangi sarguzasht o'yini — hoziroq sinab ko'ring", cta: "O'ynash", cards: ['3D olam', 'Reytinglar', '100 daraja'] },
  klub:   { tag: 'Klub', title: 'SHAXMAT KLUBI', sub: "Har shanba — bepul mashg'ulot va turnirlar", cta: "Ro'yxatdan o'tish", cards: ['Murabbiy', 'Turnirlar', 'Yangi do\'stlar'] },
  tadbir: { tag: 'Tadbir', title: 'TEXNO FEST', sub: 'Yilning eng katta IT festivali', cta: 'Bilet olish', cards: ['Spikerlar', 'Master-klass', "Sovg'alar"] },
  ilova:  { tag: 'Ilova', title: 'FOCUSLY', sub: 'Vaqtingizni aqlli boshqaring', cta: 'Yuklab olish', cards: ['Taymer', 'Statistika', 'Eslatma'] }
};
const TOPIC_LABEL = { oyin: "o'yin promo", klub: 'klub', tadbir: 'tadbir', ilova: 'ilova' };
const STYLE_LABEL = { zamonaviy: 'zamonaviy', oynoqi: "o'ynoqi", minimal: 'minimal' };
const COLOR_HEX = { kok: '#2563EB', yashil: '#1F9D55', sariq: '#F59E0B', siyohrang: '#7C3AED' };
const COLOR_LABEL = { kok: "ko'k", yashil: 'yashil', sariq: "to'q sariq", siyohrang: 'siyohrang' };
const TOPICS = [['oyin', "O'yin"], ['klub', 'Klub'], ['tadbir', 'Tadbir'], ['ilova', 'Ilova']];
const STYLES = [['zamonaviy', 'Zamonaviy'], ['oynoqi', "O'ynoqi"], ['minimal', 'Minimal']];
const COLORS_LIST = [['kok', "Ko'k"], ['yashil', 'Yashil'], ['sariq', "To'q sariq"], ['siyohrang', 'Siyohrang']];
const SECTIONS = [['button', 'Tugma'], ['cards', 'Kartalar'], ['banner', 'Banner']];

const sectionWords = (s = {}) => {
  const w = [];
  if (s.button) w.push('tugma');
  if (s.cards) w.push('kartalar');
  if (s.banner) w.push('banner');
  return w;
};

const Slot = ({ val, ph }) => val ? <span className="pb-slot">{val}</span> : <span className="pb-ph">{ph}</span>;

const PromptLine = ({ topic, style, color, sections }) => {
  const secs = sectionWords(sections);
  return (
    <div className="promptbox">
      Menga <Slot val={style ? STYLE_LABEL[style] : null} ph="uslub" />,{' '}
      <Slot val={color ? COLOR_LABEL[color] + ' rangli' : null} ph="rang" />{' '}
      <Slot val={topic ? TOPIC_LABEL[topic] : null} ph="mavzu" /> sahifasini{' '}
      <Slot val={secs.length ? secs.join(', ') : null} ph="qismlar" /> bilan yasab ber.
    </div>
  );
};

// Jonli promo-sahifa preview
const LandingPreview = ({ topic, style = 'zamonaviy', color = 'kok', sections = {}, vague = false }) => {
  if (vague || !topic) {
    return (
      <div style={{ textAlign: 'center', padding: '26px 16px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#E6E1D8', margin: '0 auto 10px' }} />
        <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 17, margin: '0 0 4px', color: T.ink2 }}>Sayt</p>
        <p style={{ fontSize: 12.5, margin: 0, color: T.ink3, fontStyle: 'italic' }}>Bu yerda biror narsa bo'lishi kerak edi…</p>
      </div>
    );
  }
  const p = PROMO[topic];
  const c = COLOR_HEX[color] || T.accent;
  const radius = style === 'oynoqi' ? 18 : style === 'minimal' ? 6 : 12;
  const minimal = style === 'minimal';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: minimal ? '#FFFFFF' : `linear-gradient(135deg, ${c}, ${c}cc)`, color: minimal ? T.ink : '#fff', borderRadius: radius, padding: 'clamp(16px,3vw,22px)', border: minimal ? `2px solid ${c}` : 'none', textAlign: minimal ? 'left' : 'center' }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: minimal ? c : 'rgba(255,255,255,0.9)' }}>{p.tag}</span>
        <h3 style={{ fontFamily: "'Source Serif 4',serif", fontWeight: style === 'oynoqi' ? 700 : 600, fontSize: 'clamp(20px,4vw,30px)', margin: '5px 0 6px', lineHeight: 1.08 }}>{p.title}</h3>
        <p style={{ fontSize: 13, margin: 0, opacity: minimal ? 0.75 : 0.95 }}>{p.sub}</p>
        {sections.button && <button style={{ marginTop: 13, border: 'none', borderRadius: Math.max(radius - 4, 6), padding: '9px 18px', fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13, cursor: 'pointer', background: minimal ? c : '#fff', color: minimal ? '#fff' : c }}>{p.cta}</button>}
      </div>
      {sections.cards && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {p.cards.map((cd, i) => (
            <div key={i} style={{ background: T.paper, borderRadius: Math.max(radius - 4, 6), padding: '11px 6px', textAlign: 'center', boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.16)` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, margin: '0 auto 6px' }} />
              <div style={{ fontSize: 11.5, fontWeight: 700, color: T.ink }}>{cd}</div>
            </div>
          ))}
        </div>
      )}
      {sections.banner && <div style={{ background: `${c}1f`, color: c, borderRadius: Math.max(radius - 4, 6), padding: '9px 12px', fontSize: 12.5, fontWeight: 700, textAlign: 'center' }}>★ Maxsus taklif — faqat shu hafta!</div>}
    </div>
  );
};

// Mobil: berilgan element paydo bo'lganda/o'zgarganda unga avtoskroll (faqat <768px)
function useScrollIntoViewOnMobile(trigger) {
  const ref = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!trigger) return;
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 160);
    return () => clearTimeout(t);
  }, [trigger]);
  return ref;
}

// Prompt-quruvchi (4 blok) — mobilda rang/qismlar tanlanganda natijaga avtoskroll
const PromoBuilder = ({ topic, setTopic, style, setStyle, color, setColor, sec, setSec }) => {
  const tog = (k) => setSec(s => ({ ...s, [k]: !s[k] }));
  const previewRef = useScrollIntoViewOnMobile(`${color}|${sec.button ? 1 : 0}${sec.cards ? 1 : 0}${sec.banner ? 1 : 0}`);
  return (
    <Zoomable>
    <div className="split">
      <Col>
        <p className="flow-label">1. Mavzu (nima)</p>
        <div className="chiprow">{TOPICS.map(([v, l]) => <button key={v} className={`chip ${topic === v ? 'chip-on' : ''}`} onClick={() => setTopic(v)}>{l}</button>)}</div>
        <p className="flow-label">2. Uslub</p>
        <div className="chiprow">{STYLES.map(([v, l]) => <button key={v} className={`chip ${style === v ? 'chip-on' : ''}`} onClick={() => setStyle(v)}>{l}</button>)}</div>
        <p className="flow-label">3. Rang</p>
        <div className="chiprow">{COLORS_LIST.map(([v, l]) => <button key={v} className={`chip ${color === v ? 'chip-on' : ''}`} onClick={() => setColor(v)}><span style={{ width: 11, height: 11, borderRadius: '50%', background: COLOR_HEX[v], display: 'inline-block' }} />{l}</button>)}</div>
        <p className="flow-label">4. Qismlar (tafsilot)</p>
        <div className="chiprow">{SECTIONS.map(([k, l]) => <button key={k} className={`chip ${sec[k] ? 'chip-on' : ''}`} onClick={() => tog(k)}>{sec[k] ? '✓ ' : '+ '}{l}</button>)}</div>
        <PromptLine topic={topic} style={style} color={color} sections={sec} />
      </Col>
      <Col>
        <p className="flow-label">Natija — jonli yangilanadi</p>
        <div ref={previewRef}><Browser url="mening-promo.uz"><LandingPreview topic={topic} style={style} color={color} sections={sec} /></Browser></div>
      </Col>
    </div>
    </Zoomable>
  );
};

// Animatsiyani katta ekranda ko'rish uchun o'rovchi — ⛶ tugma, holat saqlanadi
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

// ===== SCREEN 0 — HOOK (vague prompt -> bo'sh natija) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'built' : 'idle');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const OPTS = [
    { id: 'a', label: "AI nima xohlayotganimni bilmadi — juda kam tushuntirdim" },
    { id: 'b', label: "AI buzilgan, shuning uchun bo'sh chiqdi" },
    { id: 'c', label: "Internet sekin bo'lgani uchun" }
  ];
  const send = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('built'), 1100); };
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  const built = phase === 'built';
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>Butun bir saytni <span className="italic" style={{ color: T.accent }}>bitta jumla</span> bilan qura olasizmi?</h1>
        <Mentor>1-darsda har bir narsani qo'lda qurdik. AI esa saytni soniyalarda yasaydi! Quyidagi buyruqni agentga yuboring va o'ngdagi natijaga diqqat bilan qarang.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label">Sizning buyrug'ingiz</p>
            <div className="promptbox">Menga <span className="pb-slot">sayt</span> yasab ber.</div>
            <button className="btn" onClick={send} disabled={phase === 'building'} style={{ alignSelf: 'flex-start' }}>{phase === 'building' ? 'Quryapti…' : (built ? '↻ Qayta yuborish' : 'Agentga yuborish')}</button>
            {built && <p className="hook-ack fade-step" style={{ marginTop: 4 }}>Kutganday chiqmadimi? O'ngda — buning sababini toping.</p>}
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <Browser url="ai-natija.uz">
              {phase === 'idle' && <p className="small" style={{ margin: 0, opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>(hali yuborilmadi)</p>}
              {phase === 'building' && <p className="small" style={{ margin: 0, opacity: 0.6, textAlign: 'center', padding: '24px 0' }}>Agent quryapti…</p>}
              {built && <LandingPreview vague />}
            </Browser>
            {built && (
              <div className="fade-step">
                <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 9px' }}>Nega natija bunchalik bo'sh?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {OPTS.map(o => { const on = picked === o.id; return (
                    <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}>
                      <span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span>
                    </button>); })}
                </div>
                {picked !== null && <p className="hook-ack fade-step">To'g'ri! AI o'ta tez, lekin u sizning miyangizni o'qiy olmaydi. <b>Aniq aytsangiz — aniq natija.</b> Bugun yaxshi "prompt" yozishni o'rganamiz.</p>}
              </div>
            )}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'AI bilan tezlik — soatlar emas, soniyalar', tag: 'wow' },
    { text: 'Yaxshi PROMPT — 4 ingredient', tag: 'mavzu·uslub·rang·qism' },
    { text: 'Yomon vs yaxshi prompt', tag: '' },
    { text: "Iteratsiya — qayta so'rab yaxshilash", tag: '' },
    { text: 'Tekshirish — AI xatosini topish', tag: '' },
    { text: "O'z promo sahifangizni qurish", tag: '' }
  ];
  const ING = [['1', 'MAVZU', 'Qanaqa sahifa'], ['2', 'USLUB', 'Qanday ko\'rinishda'], ['3', 'RANG', 'Asosiy rang'], ['4', 'QISMLAR', 'Nimalar bo\'lsin']];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <div className="fade-up frame" style={{ background: T.ink, color: '#fff', textAlign: 'center', padding: '20px 18px' }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>Bugungi asosiy qoida</p>
        <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(18px,3vw,24px)', lineHeight: 1.25, margin: 0 }}>AI <span style={{ color: T.accent, fontStyle: 'italic' }}>tezlik</span> beradi — <span style={{ color: T.accent, fontStyle: 'italic' }}>sifatni</span> siz ta'minlaysiz.</p>
      </div>
      <p className="flow-label">Yaxshi promptning 4 ingredienti</p>
      <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {ING.map(([n, name, d]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', boxShadow: `0 5px 14px -6px rgba(${T.shadowBase},0.14)` }}>
            <span className="num-badge" style={{ width: 26, height: 26, fontSize: 12 }}>{n}</span>
            <div><div style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13 }}>{name}</div><div style={{ fontSize: 11, color: T.ink2 }}>{d}</div></div>
          </div>
        ))}
      </div>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">Bugungi 6 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">AI hammasini yasaydi — unda nega <span className="italic" style={{ color: T.accent }}>biz</span> kerakmiz?</h2></div>
        <Mentor>AI — juda kuchli ishchi: soniyada butun sahifa yasaydi. Ammo u sizning <b style={{ color: T.ink }}>so'zlaringizga</b> qarab ishlaydi. Shuning uchun bugun eng muhim mahorat — <b style={{ color: T.ink }}>yaxshi prompt (buyruq)</b> yozishni o'rganamiz, 6 qadamda.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>6 qadamni ko'rish</button></div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Qoidani ko'rish</button>{StepsBlock}</div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — WOW (yaxshi prompt -> soniyada sayt) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'built' : 'idle');
  const timer = useRef(null);
  const built = phase === 'built';
  const done = built;
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('built'), 1300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tezlik" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aniq buyruq bersak, AI <span className="italic" style={{ color: T.accent }}>qanchalik tez</span> quradi?</h2></div>
        <Mentor>Endi <b style={{ color: T.ink }}>aniq</b> buyruq beramiz — 4 ingredient bilan. Yuboring va kuzating: 1-darsda 5 ta narsani soatlab qurgan edik. AI esa butun bir sahifani <b style={{ color: T.ink }}>bir necha soniyada</b> yasaydi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Tayyor yaxshi buyruq</p>
            <PromptLine topic="tadbir" style="oynoqi" color="siyohrang" sections={{ button: true, cards: true, banner: true }} />
            <button className="btn" onClick={send} disabled={phase === 'building'} style={{ alignSelf: 'flex-start' }}>{phase === 'building' ? 'Quryapti…' : (built ? '↻ Qayta yuborish' : 'Agentga yuborish')}</button>
            {built && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — tugallangan, rangli, chiroyli sahifa. Va bu atigi bir buyruq! AI bergan <b>tezlik</b> shu.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <Browser url="texno-fest.uz">
              {phase === 'idle' && <p className="small" style={{ margin: 0, opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>(buyruqni yuboring)</p>}
              {phase === 'building' && <p className="small" style={{ margin: 0, opacity: 0.6, textAlign: 'center', padding: '24px 0' }}>Agent quryapti…</p>}
              {built && <LandingPreview topic="tadbir" style="oynoqi" color="siyohrang" sections={{ button: true, cards: true, banner: true }} />}
            </Browser>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — PROMPT ANATOMIYASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [part, setPart] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const done = seen.size >= 2;
  const PARTS = {
    mavzu: { color: T.blue, hex: '#5BC8EC', name: 'MAVZU', word: "o'yin promo", desc: 'Qanaqa sahifa kerakligi. Masalan: o\'yin promo, klub, tadbir yoki ilova sahifasi.' },
    uslub: { color: T.accent, hex: '#FF9777', name: 'USLUB', word: "o'ynoqi", desc: 'Sahifa qanday ko\'rinishda bo\'lsin: zamonaviy, o\'ynoqi yoki minimal.' },
    rang: { color: T.success, hex: '#6FD79E', name: 'RANG', word: "ko'k", desc: 'Asosiy rang: ko\'k, yashil, to\'q sariq yoki siyohrang.' },
    qism: { color: '#A78BFA', hex: '#C4B5FD', name: 'QISMLAR', word: 'tugma, kartalar', desc: 'Sahifada nimalar bo\'lsin: tugma, kartalar yoki banner.' }
  };
  const tap = (k) => { setPart(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const Span = ({ k }) => <span onClick={() => tap(k)} style={{ cursor: 'pointer', color: PARTS[k].hex, fontWeight: 700, background: part === k ? PARTS[k].color + '22' : 'transparent', borderRadius: 5, padding: '1px 5px', outline: part === k ? `2px solid ${PARTS[k].color}` : 'none' }}>{PARTS[k].word}</span>;
  return (
    <Stage eyebrow="Prompt anatomiyasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Kamida 2 qismni bosing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yaxshi buyruq <span className="italic" style={{ color: T.accent }}>nimalardan</span> tashkil topadi?</h2></div>
        <Mentor>Yaxshi prompt — tasodifiy gap emas, u <b style={{ color: T.ink }}>4 ingredientdan</b> iborat. Pastdagi buyruqdagi rangli qismlarni <b style={{ color: T.ink }}>bosib</b>, har birini bilib oling.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="codebox" style={{ background: T.paper, color: T.ink, fontFamily: "'Manrope'", fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 2.1, boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.16)` }}>
              Menga <Span k="uslub" />, <Span k="rang" /> rangli <Span k="mavzu" /> sahifasini <Span k="qism" /> bilan yasab ber.
            </div>
            {part ? (
              <div className="sk-info fade-step" key={part}>
                <span className="sk-tagbig"><span className="lg-dot" style={{ background: PARTS[part].color, width: 14, height: 14 }} /><span className="sk-wordbadge" style={{ color: PARTS[part].color, background: PARTS[part].color + '22' }}>{PARTS[part].name}</span></span>
                <p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{PARTS[part].desc}</p>
              </div>
            ) : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Buyruqdagi 4 ta rangli qismni bosing</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Shu buyruqning natijasi</p>
            <Browser url="pixel-quest.uz"><LandingPreview topic="oyin" style="oynoqi" color="kok" sections={{ button: true, cards: true, banner: false }} /></Browser>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 ingredient = aniq buyruq = aniq natija. Buni eslab qoling: <b>MAVZU · USLUB · RANG · QISMLAR</b>.</p></div>}
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
    questionText="Yaxshi prompt yomonidan nimasi bilan farq qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi prompt yomonidan nimasi bilan <span className="italic" style={{ color: T.accent }}>farq qiladi?</span></h2></>}
    options={['Aniq tafsilot beradi: nima, uslub, rang, qismlar', 'Shunchaki uzunroq bo\'ladi', 'Faqat inglizcha yoziladi', 'Hech qanday farqi yo\'q']} correctIdx={0}
    explainCorrect="To'g'ri! Yaxshi prompt AI'ga aniq aytadi: qanaqa sahifa (mavzu), qanday ko'rinishda (uslub), qaysi rangda va qaysi qismlar bilan. Aniqlik — sifatli natijaning kaliti."
    explainWrong={{
      1: 'Yo’q — gap uzunlikda emas, aniqlikda. Qisqa, lekin 4 ingredientli prompt ham zo’r ishlaydi.',
      2: 'Yo’q — til muhim emas. O’zbekcha aniq prompt ham ajoyib natija beradi.',
      3: 'Yo’q — farq katta: aniq prompt aniq natija beradi, vague prompt bo’sh natija.',
      default: 'Yaxshi prompt = aniq tafsilot (mavzu, uslub, rang, qismlar).'
    }} />
);

// ===== SCREEN 5 — PROMPT-QURUVCHI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [topic, setTopic] = useState(storedAnswer ? 'oyin' : null);
  const [style, setStyle] = useState(storedAnswer ? 'zamonaviy' : null);
  const [color, setColor] = useState(storedAnswer ? 'kok' : null);
  const [sec, setSec] = useState(storedAnswer ? { button: true, cards: true, banner: false } : { button: false, cards: false, banner: false });
  const anySec = sec.button || sec.cards || sec.banner;
  const all4 = topic && style && color && anySec;
  const done = all4;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Prompt-quruvchi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '4 ingredientni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bir blok natijani <span className="italic" style={{ color: T.accent }}>qanday</span> o'zgartiradi?</h2></div>
        <Mentor>Pastdagi 4 blokdan tanlang — buyruq jumlasi <b style={{ color: T.ink }}>siz tanlagani sari yig'iladi</b>, o'ngdagi sayt esa <b style={{ color: T.ink }}>darhol</b> o'zgaradi. Har bir tanlovingiz natijaga qanday ta'sir qilishini ko'ring.</Mentor>
        <PromoBuilder topic={topic} setTopic={setTopic} style={style} setStyle={setStyle} color={color} setColor={setColor} sec={sec} setSec={setSec} />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sezdingizmi? Har bir blok natijani o'zgartirdi. Siz AI'ni <b>so'z bilan boshqaryapsiz</b> — mana shu prompt mahorati.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — YOMON vs YAXSHI PROMPT =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mode, setMode] = useState('yomon'); // joriy buyruq: yomon | yaxshi
  const [sent, setSent] = useState(null);    // qurilgan buyruq: null | yomon | yaxshi
  const [phase, setPhase] = useState('idle'); // idle | building
  const [seenBuilt, setSeenBuilt] = useState(new Set());
  const timer = useRef(null);
  const done = seenBuilt.size >= 2;
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => { setSent(mode); setSeenBuilt(prev => { const n = new Set(prev); n.add(mode); return n; }); setPhase('idle'); }, 1100); };
  const improve = () => { setMode('yaxshi'); };
  const stale = sent !== null && sent !== mode && phase === 'idle';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Yomon ⚔️ Yaxshi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikki buyruqni ham yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega bir maqsad <span className="italic" style={{ color: T.accent }}>ikki xil</span> natija beradi?</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>loyqa</b> buyruqni yuboramiz va natijani ko'ramiz. So'ng buyruqni <b style={{ color: T.ink }}>yaxshilab</b>, qayta yuboramiz. Ikkala natijani solishtiring — farqni o'z ko'zingiz bilan ko'rasiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">{mode === 'yomon' ? 'Buyruq (loyqa)' : 'Buyruq (aniq, 4 ingredient)'}</p>
            {mode === 'yaxshi'
              ? <PromptLine topic="klub" style="oynoqi" color="yashil" sections={{ button: true, cards: true, banner: true }} />
              : <div className="promptbox">Menga <span className="pb-slot">klub sayti</span> yasab ber.</div>}
            <button className="btn" onClick={send} disabled={phase === 'building'} style={{ alignSelf: 'flex-start' }}>{phase === 'building' ? 'Quryapti…' : 'Agentga yuborish'}</button>
            {sent === 'yomon' && mode === 'yomon' && phase === 'idle' && <button className="btn-soft" onClick={improve} style={{ alignSelf: 'flex-start' }}>Buyruqni yaxshilash →</button>}
            {stale && <p className="hook-ack fade-step" style={{ margin: 0, color: T.accent }}>Buyruq o'zgardi — endi qayta yuboring.</p>}
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <Browser url={sent === 'yaxshi' ? 'shaxmat-klubi.uz' : 'ai-natija.uz'}>
              {phase === 'building' && <p className="small" style={{ margin: 0, opacity: 0.6, textAlign: 'center', padding: '24px 0' }}>Agent quryapti…</p>}
              {phase === 'idle' && sent === null && <p className="small" style={{ margin: 0, opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>(buyruqni yuboring)</p>}
              {phase === 'idle' && sent === 'yomon' && <LandingPreview vague />}
              {phase === 'idle' && sent === 'yaxshi' && <LandingPreview topic="klub" style="oynoqi" color="yashil" sections={{ button: true, cards: true, banner: true }} />}
            </Browser>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil maqsad, lekin tafsilot bilan natija osmon-u yer farq qiladi. <b>Tafsilot = sifat.</b></p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 =====
const Screen7 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="O'yin promo sahifa uchun qaysi buyruq eng yaxshi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>O'yin promo sahifa uchun qaysi buyruq <span className="italic" style={{ color: T.accent }}>eng yaxshi?</span></h2></>}
    options={['Biror narsa qil', "Ko'k rangli, zamonaviy o'yin promo sahifasi — sarlavha, tugma va 3 ta karta bilan", 'Chiroyli qilib ber', 'Sayt']} correctIdx={1}
    explainCorrect="To'g'ri! Bu buyruqda 4 ingredient bor: mavzu (o'yin promo), uslub (zamonaviy), rang (ko'k) va qismlar (tugma, kartalar). AI aniq nima qilishni biladi."
    explainWrong={{
      0: 'Yo’q — «biror narsa» juda loyqa. AI nima qilishni bilmaydi, natija tasodifiy bo’ladi.',
      2: 'Yo’q — «chiroyli» bu fikr, tafsilot emas. Qanaqa, qaysi rangda, nimalar bilan — aytilmagan.',
      3: 'Yo’q — bitta so’z hech narsa tushuntirmaydi. Hookdagi bo’sh natijani eslang.',
      default: 'Eng yaxshi buyruq 4 ingredientni aniq aytadi.'
    }} />
);

// ===== SCREEN 8 — ITERATSIYA =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const BASE = { topic: 'ilova', style: 'zamonaviy', color: 'sariq', sec: { button: true, cards: true, banner: false } };
  const [st, setSt] = useState(BASE);
  const [log, setLog] = useState([]);
  const [usedIds, setUsedIds] = useState(new Set());
  const done = usedIds.size >= 2;
  const doneRef = useScrollIntoViewOnMobile(done);
  const FOLLOWS = [
    { id: 'f1', label: "Rangni yashilga o'zgartir", apply: (s) => ({ ...s, color: 'yashil' }) },
    { id: 'f2', label: "Uslubni o'ynoqi qil", apply: (s) => ({ ...s, style: 'oynoqi' }) },
    { id: 'f3', label: "Banner qo'sh", apply: (s) => ({ ...s, sec: { ...s.sec, banner: true } }) },
    { id: 'f4', label: 'Siyohrang qil', apply: (s) => ({ ...s, color: 'siyohrang' }) }
  ];
  const apply = (f) => { if (usedIds.has(f.id)) return; setSt(f.apply); setLog(l => [...l, f.label]); setUsedIds(prev => { const n = new Set(prev); n.add(f.id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Iteratsiya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kamida 2 marta yaxshilang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI birinchi urinishda <span className="italic" style={{ color: T.accent }}>mukammal</span> qiladimi?</h2></div>
        <Mentor>AI birinchi urinishda har doim mukammal qilmaydi — bu normal. Siz <b style={{ color: T.ink }}>qayta so'raysiz</b>: "rangni o'zgartir", "banner qo'sh". Bu — <b style={{ color: T.ink }}>iteratsiya</b>. Quyidagi buyruqlarni bering va sayt qadam-baqadam yaxshilanishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qo'shimcha buyruqlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FOLLOWS.map(f => <button key={f.id} className={`chip ${usedIds.has(f.id) ? 'chip-on' : ''}`} disabled={usedIds.has(f.id)} onClick={() => apply(f)} style={{ justifyContent: 'flex-start', opacity: usedIds.has(f.id) ? 0.6 : 1 }}>{usedIds.has(f.id) ? '✓ ' : '+ '}{f.label}</button>)}
            </div>
            {log.length > 0 && (
              <div className="frame" style={{ padding: '12px 14px' }}>
                <p className="flow-label" style={{ margin: '0 0 7px' }}>Sizning buyruqlaringiz</p>
                {log.map((l, i) => <div key={i} style={{ display: 'flex', gap: 7, fontSize: 13, marginBottom: 3 }}><span style={{ color: T.accent, fontWeight: 700 }}>{i + 1}.</span><span>{l}</span></div>)}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Sayt — qadam-baqadam yaxshilanadi</p>
            <Browser url="focusly.uz"><LandingPreview topic={st.topic} style={st.style} color={st.color} sections={st.sec} /></Browser>
            {done && <div ref={doneRef} className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana iteratsiya kuchi! Har bir kichik buyruq saytni mukammallikka yaqinlashtiradi. Mukammal natija — bir emas, bir necha qadam.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="AI birinchi urinishda xohlaganingizday qilmasa, nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI birinchi urinishda <span className="italic" style={{ color: T.accent }}>xohlaganingizday</span> qilmasa, nima qilasiz?</h2></>}
    options={['Qayta, aniqroq so\'rayman (iteratsiya)', 'Tashlab ketaman', 'Hammasini qo\'lda qayta yozaman', '"AI yomon" deb xafa bo\'laman']} correctIdx={0}
    explainCorrect="To'g'ri! Bu — iteratsiya. «Rangni o'zgartir», «tugma qo'sh» kabi qo'shimcha buyruqlar bilan natijani qadam-baqadam yaxshilaysiz."
    explainWrong={{
      1: 'Yo’q — birinchi natija oxirgisi emas. Bir-ikki qo’shimcha buyruq bilan ajoyib bo’ladi.',
      2: 'Yo’q — qo’lda qayta yozish AI tezligini yo’qotadi. Qayta so’rash (iteratsiya) ancha tez.',
      3: 'Yo’q — AI yomon emas, shunchaki aniqroq yo’naltirish kerak. Qayta so’rang.',
      default: 'Yoqmasa — qayta, aniqroq so’raysiz. Bu iteratsiya.'
    }} />
);

// ===== SCREEN 10 — TEKSHIRISH (AI xatosini topish) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(storedAnswer ? 'rang' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const isFound = found === 'rang';
  const done = fixed;
  const ASPECTS = [['mavzu', 'Mavzu'], ['rang', 'Rang'], ['tugma', 'Tugma'], ['ok', 'Hammasi joyida']];
  const click = (a) => { if (isFound) return; setFound(a); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tekshirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (isFound ? 'Endi aniqlashtiring' : 'Farqni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI so'rovni har doim <span className="italic" style={{ color: T.accent }}>aniq</span> tushunadimi?</h2></div>
        <Mentor>AI ba'zan buyruqni biroz <b style={{ color: T.ink }}>boshqacha</b> tushunadi — bu tabiiy, do'stingiz ham shunday qilishi mumkin. Siz <b style={{ color: T.ink }}>ko'k</b> rangli o'yin sahifasi so'radingiz, AI yasab berdi. Endi solishtiring: natija buyruqqa <b style={{ color: T.ink }}>to'liq mos keldimi?</b> Qaysi qism boshqacha chiqqan?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Sizning buyrug'ingiz</p>
            <PromptLine topic="oyin" style="zamonaviy" color="kok" sections={{ button: true }} />
            <p className="flow-label" style={{ marginTop: 4 }}>AI natijasi</p>
            <Browser url="pixel-quest.uz"><LandingPreview topic="oyin" style="zamonaviy" color={fixed ? 'kok' : 'sariq'} sections={{ button: true }} /></Browser>
          </Col>
          <Col>
            {!fixed && <>
              <p className="flow-label">Natijaning qaysi qismi buyruqdan farq qiladi?</p>
              <div className="chiprow">{ASPECTS.map(([k, l]) => <button key={k} className={`chip ${found === k ? 'chip-on' : ''}`} disabled={isFound} onClick={() => click(k)}>{l}</button>)}</div>
            </>}
            {!isFound && found && found !== 'rang' && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qism aslida to'g'ri. Buyruqni va rangni yana solishtiring — qaysi <b>rangda</b> so'radingiz, qaysi rangda chiqdi?</p></div>}
            {!isFound && !found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Buyruqdagi har bir ingredientni natija bilan solishtiring: mavzu? rang? tugma?</p></div>}
            {isFound && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Siz <b>ko'k</b> so'ragandingiz, AI uni <b>to'q sariq</b> deb tushunibdi. Hech qisi yo'q — shunchaki aniqroq qayta so'raymiz.</p><button className="btn fade-step" style={{ alignSelf: 'flex-start', marginTop: 10 }} onClick={() => setFixed(true)}>"Rangni ko'kka o'zgartir" deb so'rash</button></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 24, fontWeight: 800, color: T.success }}>✓</div><p className="ta-h">Tekshirdingiz va aniqlashtirdingiz!</p><p className="ta-sub">AI quradi, siz solishtirib aniqlik kiritasiz — ajoyib jamoa.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — AI: KUCHLI vs EHTIYOT =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CARDS = {
    kuch: { name: 'AI nimada KUCHLI', color: T.success, items: ['Tezlik — soniyalarda quradi', 'Ko\'p variant taklif qiladi', 'Dizayn va bezakda usta', 'Zerikarli ishlarni bajaradi'] },
    tekshir: { name: 'Siz nimani tekshirasiz', color: T.blue, items: ['So\'raganim chiqdimi?', 'Ortiqcha narsa yo\'qmi?', 'Matn to\'g\'ri yozilganmi?', 'Hammasi ishlayaptimi?'] }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="AI bilan ishlash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI bilan eng <span className="italic" style={{ color: T.accent }}>zo'r natijani</span> qanday olamiz?</h2></div>
        <Mentor>AI — ajoyib va juda foydali ishchi. Ba'zan adashishi ham mumkin — bu mutlaqo normal, hammaning ishida shunday bo'ladi. Sirri oddiy: <b style={{ color: T.ink }}>birga ishlaysiz</b> — AI tez quradi, siz natijani tekshirib, kerak bo'lsa aniqlashtirib qo'yasiz. Ikkala kartani bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.keys(CARDS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 14, padding: '15px 16px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${CARDS[k].color}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: CARDS[k].color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 16, color: T.ink }}>{CARDS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ width: 14, height: 14, borderRadius: 4, background: CARDS[active].color }} /><span className="sk-wordbadge" style={{ color: CARDS[active].color, background: CARDS[active].color + '22' }}>{CARDS[active].name}</span></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 11 }}>
                  {CARDS[active].items.map((e, i) => (<div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.bg, borderRadius: 8, padding: '8px 11px' }}><span style={{ color: CARDS[active].color }}>•</span><span className="body" style={{ margin: 0, color: T.ink2 }}>{e}</span></div>))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir kartani bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida oddiy: AI'dan <b>tezlik</b> uchun foydalaning, natijani <b>o'zingiz tekshiring</b> va kerak bo'lsa aniqroq qayta so'rang. Shunda har doim zo'r natija.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — O'Z PROMO SAHIFANG =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [topic, setTopic] = useState(storedAnswer ? 'tadbir' : null);
  const [style, setStyle] = useState(storedAnswer ? 'oynoqi' : null);
  const [color, setColor] = useState(storedAnswer ? 'siyohrang' : null);
  const [sec, setSec] = useState(storedAnswer ? { button: true, cards: true, banner: true } : { button: false, cards: false, banner: false });
  const [published, setPublished] = useState(!!storedAnswer);
  const anySec = sec.button || sec.cards || sec.banner;
  const all4 = topic && style && color && anySec;
  const done = published;
  const pubRef = useScrollIntoViewOnMobile(published);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'z loyihangiz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Sahifani nashr qiling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>o'zingiz</span> qanday sayt yaratasiz?</h2></div>
        <Mentor>Endi to'liq erkinlik sizda! Yoqtirgan mavzu, uslub, rang va qismlarni tanlab, <b style={{ color: T.ink }}>o'zingizning</b> promo sahifangizni quring. Tayyor bo'lgach — uni <b style={{ color: T.ink }}>nashr qiling</b> (deploy) va dunyoga ulashing.</Mentor>
        <PromoBuilder topic={topic} setTopic={setTopic} style={style} setStyle={setStyle} color={color} setColor={setColor} sec={sec} setSec={setSec} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn" disabled={!all4 || published} onClick={() => setPublished(true)} style={{ opacity: all4 ? 1 : 0.5 }}>{published ? '✓ Nashr qilindi' : 'Nashr qilish (deploy)'}</button>
          {!all4 && !published && <span className="mono small" style={{ color: T.ink3 }}>avval 4 ingredientni tanlang</span>}
          {published && <span className="mono small" style={{ color: T.success }}>https://mening-promo.netlify.app</span>}
        </div>
        {published && <div ref={pubRef} className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tabriklaymiz! Siz AI bilan to'liq sahifa qurib, uni nashr qildingiz — havolani do'stlaringizga yuborsangiz bo'ladi. Mana shu — tez, sifatli loyiha.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — BITTA USUL, KO'P SAYT =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [topic, setTopic] = useState('oyin');
  const [sent, setSent] = useState(null);     // qurilgan mavzu
  const [phase, setPhase] = useState('idle');  // idle | building
  const [builtTopics, setBuiltTopics] = useState(new Set());
  const timer = useRef(null);
  const done = builtTopics.size >= 2;
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => { setSent(topic); setBuiltTopics(prev => { const n = new Set(prev); n.add(topic); return n; }); setPhase('idle'); }, 900); };
  const stale = sent !== null && sent !== topic && phase === 'idle';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tez-tez" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Kamida 2 mavzu yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta usul bilan <span className="italic" style={{ color: T.accent }}>nechta xil</span> sayt qura olasiz?</h2></div>
        <Mentor>Eng zo'r tomoni: bitta usulni o'rgandingiz, endi <b style={{ color: T.ink }}>faqat mavzuni almashtirib</b>, butunlay boshqa saytni yasaysiz. Mavzuni tanlang, <b style={{ color: T.ink }}>yuboring</b> — keyin boshqa mavzuni tanlab, yana yuboring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Mavzuni tanlang</p>
            <div className="chiprow fade-up delay-1">{TOPICS.map(([v, l]) => <button key={v} className={`chip ${topic === v ? 'chip-on' : ''}`} onClick={() => setTopic(v)}>{l}</button>)}</div>
            <div className="promptbox">Menga <span className="pb-slot">o'ynoqi</span>, <span className="pb-slot">siyohrang rangli</span> <span className="pb-slot">{TOPIC_LABEL[topic]}</span> sahifasini <span className="pb-slot">tugma, kartalar</span> bilan yasab ber.</div>
            <button className="btn" onClick={send} disabled={phase === 'building'} style={{ alignSelf: 'flex-start' }}>{phase === 'building' ? 'Quryapti…' : 'Agentga yuborish'}</button>
            {stale && <p className="hook-ack fade-step" style={{ margin: 0, color: T.accent }}>Yangi mavzu tanlandi — yuborib ko'ring.</p>}
          </Col>
          <Col>
            <p className="flow-label">Natija — har mavzuga boshqa sayt</p>
            <Browser url={sent ? `${sent}.uz` : 'promo.uz'} key={sent || 'none'}>
              {phase === 'building' && <p className="small" style={{ margin: 0, opacity: 0.6, textAlign: 'center', padding: '24px 0' }}>Agent quryapti…</p>}
              {phase === 'idle' && sent === null && <p className="small" style={{ margin: 0, opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>(mavzu tanlab, yuboring)</p>}
              {phase === 'idle' && sent && <LandingPreview topic={sent} style="oynoqi" color="siyohrang" sections={{ button: true, cards: true, banner: false }} />}
            </Browser>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? O'yin, klub, tadbir, ilova — bitta usul bilan hammasi. Endi siz <b>istalgancha sayt</b> qura olasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — ANTIGRAVITY (haqiqiy asbob) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | plan | building | done
  const timer = useRef(null);
  const done = phase === 'done';
  const doneRef = useScrollIntoViewOnMobile(done);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setPhase('plan'); timer.current = setTimeout(() => { setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1200); }, 1000); };
  const PLAN = ['Sahifa strukturasini yarataman', 'Sarlavha, tugma va kartalarni qo\'shaman', 'Tanlangan rang va uslubni qo\'llayman'];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Haqiqiy asbob" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Demoni ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu usulni endi <span className="italic" style={{ color: T.accent }}>haqiqiy loyihada</span> qanday ishlatamiz?</h2></div>
        <Mentor>Bugun o'rgangan usul haqiqiy <b style={{ color: T.ink }}>Antigravity</b> muhitida aynan shunday ishlaydi: siz oddiy tilda yozasiz, agent <b style={{ color: T.ink }}>reja</b> tuzadi, quradi va brauzerda ko'rsatadi — yoqmasa qayta so'raysiz. Demoni ishga tushiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Siz Antigravity'ga yozasiz</p>
            <PromptLine topic="ilova" style="minimal" color="kok" sections={{ button: true, cards: true }} />
            <button className="btn" onClick={run} disabled={phase === 'plan' || phase === 'building'} style={{ alignSelf: 'flex-start' }}>{phase === 'plan' ? 'Reja tuzyapti…' : (phase === 'building' ? 'Quryapti…' : (done ? '↻ Yana' : 'Antigravity\'ga yuborish'))}</button>
            {(phase === 'plan' || phase === 'building' || done) && (
              <div className="ai-card fade-step">
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">Rejam:</span></div>
                {PLAN.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'plan' ? T.ink3 : T.success }}>{phase === 'plan' ? '○' : '✓'}</span><span>{p}</span></div>)}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Antigravity brauzeri</p>
            <Browser url="focusly.uz">
              {phase === 'idle' && <p className="small" style={{ margin: 0, opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>(demoni ishga tushiring)</p>}
              {(phase === 'plan' || phase === 'building') && <p className="small" style={{ margin: 0, opacity: 0.6, textAlign: 'center', padding: '24px 0' }}>{phase === 'plan' ? 'Reja tuzilyapti…' : 'Quryapti…'}</p>}
              {done && <LandingPreview topic="ilova" style="minimal" color="kok" sections={{ button: true, cards: true }} />}
            </Browser>
            {done && <div ref={doneRef} className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aynan shu oqim! Uyga vazifada haqiqiy Antigravity'da 4-ingredientli buyruq bilan o'z saytingizni quring.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (to'liq buyruq tuzish) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [topic, setTopic] = useState(storedAnswer?.correct ? 'tadbir' : null);
  const [style, setStyle] = useState(storedAnswer?.correct ? 'zamonaviy' : null);
  const [color, setColor] = useState(storedAnswer?.correct ? 'kok' : null);
  const [sec, setSec] = useState(storedAnswer?.correct ? { button: true, cards: true, banner: false } : { button: false, cards: false, banner: false });
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const passedRef = useScrollIntoViewOnMobile(passed);
  const anySec = sec.button || sec.cards || sec.banner;
  const all4 = topic && style && color && anySec;
  useEffect(() => { if (all4 && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'To\'liq 4-ingredientli buyruq tuzish', studentAnswer: `${topic}/${style}/${color}`, correct: true, firstAttemptCorrect: true, solved: true, picked: `${topic}/${style}/${color}` }); } }, [all4]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "4 ingredientni to'ldiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi sinov: <span className="italic" style={{ color: T.accent }}>to'liq</span> buyruq tuzing</h2></div>
        <Mentor>Vazifa: <b style={{ color: T.ink }}>maktab konsertiga promo sahifa</b> kerak. To'liq, sifatli buyruq tuzing — <b style={{ color: T.ink }}>4 ingredientning hammasini</b> tanlang: mavzu, uslub, rang va kamida bitta qism. Hammasi to'lganda buyruq tayyor bo'ladi.</Mentor>
        <PromoBuilder topic={topic} setTopic={setTopic} style={style} setStyle={setStyle} color={color} setColor={setColor} sec={sec} setSec={setSec} />
        {passed
          ? <div ref={passedRef} className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mukammal! To'liq 4-ingredientli buyruq — aniq, sifatli natija beradi. Siz endi AI'ga to'g'ri buyruq bera olasiz.</p></div>
          : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>4 ingredient kerak: mavzu + uslub + rang + kamida bitta qism.</p>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['AI tezlik beradi — sifatni siz ta\'minlaysiz', 'Yaxshi prompt = 4 ingredient: mavzu, uslub, rang, qismlar', 'Yomon prompt = bo\'sh natija; aniq prompt = chiroyli natija', 'Iteratsiya — qayta so\'rab natijani yaxshilash', 'Doim tekshiring — AI xato qilishi mumkin'];
  const HOMEWORK = [{ b: 'Antigravity\'da', t: '— 4-ingredientli buyruq bilan bitta promo sahifa qurdiring' }, { b: 'Iteratsiya', t: '— natijani kamida 2 marta qayta so\'rab yaxshilang' }, { b: 'Tekshiring', t: '— so\'raganingiz chiqdimi? Ortiqcha narsa yo\'qmi?' }];
  const GLOSSARY = [{ b: 'Prompt', t: '— AI\'ga beriladigan buyruq' }, { b: 'Vibecoding', t: '— so\'z bilan tasvirlab, AI bilan qurish' }, { b: 'Iteratsiya', t: '— qayta so\'rab yaxshilash' }, { b: 'Agent', t: '— mustaqil quradigan AI' }, { b: '4 ingredient', t: '— mavzu, uslub, rang, qismlar' }, { b: 'Deploy', t: '— saytni internetga chiqarish' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> 2-praktika tugadi</span><h2 className="title h-title fade-up d1">Endi AI bilan <span className="italic" style={{ color: T.accent }}>tez va sifatli</span> sayt qura olasiz</h2><p className="body h-sub fade-up d2">{PASSED ? 'Zo\'r! Yaxshi prompt, iteratsiya va tekshirishni egalladingiz. Keyingi darslarda kattaroq loyihaga — mini-do\'konga o\'tamiz.' : 'Yaxshi harakat! Prompt anatomiyasini bir-ikki ekranni qayta ko\'rib mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Esda tuting: AI tezlik beradi — sifatni siz ta'minlaysiz.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (AI bilan qurish)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};
// ============================================================ LESSON ROOT
export default function PracticeLesson2({ lang: langProp, onFinished }) {
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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
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
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
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

        /* === PROMPT-QURUVCHI === */
        .chiprow { display: flex; flex-wrap: wrap; gap: 8px; }
        .promptbox { background: ${T.paper}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-size: clamp(13px,1.6vw,14.5px); line-height: 2; color: ${T.ink}; }
        .pb-slot { display: inline-flex; align-items: center; background: ${T.accentSoft}; color: ${T.accent}; font-weight: 700; border-radius: 6px; padding: 2px 8px; margin: 0 1px; }
        .pb-ph { display: inline-flex; align-items: center; border: 1.5px dashed ${T.ink3}; color: ${T.ink3}; border-radius: 6px; padding: 1px 8px; margin: 0 1px; font-style: italic; }

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
