import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';
import togImg from '../../assets/images/tog.png';
import mushukImg from '../../assets/images/mushuk.png';
import raketaImg from '../../assets/images/raketa.png';

// ============================================================
// HTML 1-DARS — PLATFORM STANDARD v15 (Notion: design_system + platform_contract + infrastructure_v1)
// Arxitektura va asosiy dizayn — Notiondan. 17 ekran bizning kontentimiz.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// Eslatma: ekran-spetsifik widget bezaklari page-by-page bosqichida yakuniy sayqal oladi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', link: '#1a56db',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

const LangContext = createContext('uz');
const MentorCtx = createContext(null); // mobil: yig'iladigan Mentor
const useLang = () => useContext(LangContext);
const useT = () => {
  const lang = useLang();
  return useCallback((node) => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (React.isValidElement(node)) return node;
    if (node[lang] !== undefined) return node[lang];
    return node.uz ?? node.ru ?? '';
  }, [lang]);
};

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

class AudioEngine {
  constructor() {
    this.queue = []; this.currentIdx = 0; this.isPlaying = false;
    this.currentUtterance = null; this.onStateChange = null; this.waitingFor = null;
    this.voicesByLang = { ru: null, uz: null }; this.voicesReady = false; this.currentLang = 'uz';
    this.initVoices();
  }
  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return;
      this.voicesByLang.ru = v.find(x => x.lang.startsWith('ru')) || v[0];
      this.voicesByLang.uz = v.find(x => x.lang.startsWith('uz')) || v.find(x => x.lang.startsWith('ru')) || v[0];
      this.voicesReady = true;
    };
    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = load;
  }
  setLang(l) { this.currentLang = l; }
  getVoice() { return this.voicesByLang[this.currentLang] || this.voicesByLang.ru || null; }
  hasUz() { if (typeof window === 'undefined' || !window.speechSynthesis) return false; return window.speechSynthesis.getVoices().some(v => v.lang.startsWith('uz')); }
  loadQueue(s) { this.stop(); this.queue = s; this.currentIdx = 0; this.waitingFor = null; }
  playSegment(seg) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(seg.text);
    const useUz = this.currentLang === 'uz' && this.hasUz();
    u.lang = useUz ? 'uz-UZ' : 'ru-RU'; u.rate = 0.95; u.pitch = 1.0;
    const v = this.getVoice(); if (v) u.voice = v;
    u.onstart = () => { this.isPlaying = true; if (this.onStateChange) this.onStateChange({ isPlaying: true, currentSegment: seg.id }); };
    u.onend = () => { this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); this.handleEnd(seg); };
    u.onerror = () => { this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); };
    this.currentUtterance = u; /* AUDIOSIZ: ovoz o'chirildi (kontekst saqlandi) */
  }
  handleEnd(seg) { if (seg.waits_for) { this.waitingFor = seg.waits_for; if (this.onStateChange) this.onStateChange({ isPlaying: false, waitingFor: seg.waits_for }); } else { this.currentIdx++; this.playNext(); } }
  playNext() { if (this.currentIdx >= this.queue.length) return; this.playSegment(this.queue[this.currentIdx]); }
  start() { this.currentIdx = 0; this.waitingFor = null; this.playNext(); }
  triggerEvent(type, target) { if (!this.waitingFor) return; const m = this.waitingFor.type === type && (this.waitingFor.target === target || !this.waitingFor.target); if (m) { this.waitingFor = null; this.currentIdx++; this.playNext(); } }
  pushOneOff(text) { if (!text) return; this.queue.push({ id: `oneoff_${Date.now()}`, text, trigger: 'manual', waits_for: null }); this.currentIdx = this.queue.length - 1; this.playNext(); }
  replay() { if (this.currentIdx > 0) this.currentIdx--; this.waitingFor = null; this.playNext(); }
  stop() { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); }
}
let audioEngineInstance = null;
const getAudioEngine = () => { if (typeof window === 'undefined') return null; if (!audioEngineInstance) audioEngineInstance = new AudioEngine(); return audioEngineInstance; };

function useAudio(segments) {
  const lang = useLang();
  const [state, setState] = useState({ isPlaying: false, currentSegment: null, waitingFor: null, muted: false });
  const engineRef = useRef(null);
  const segmentsRef = useRef(segments);
  const key = segments ? JSON.stringify(segments) : '';
  const prevKey = useRef(key);
  if (prevKey.current !== key) { segmentsRef.current = segments; prevKey.current = key; }
  const stable = segmentsRef.current;
  useEffect(() => {
    const engine = getAudioEngine(); if (!engine) return;
    engineRef.current = engine; engine.setLang(lang);
    engine.onStateChange = (s) => setState(p => ({ ...p, ...s }));
    if (stable && stable.length > 0 && !state.muted) {
      engine.loadQueue(stable);
      const t = setTimeout(() => engine.start(), 300);
      return () => { clearTimeout(t); engine.stop(); };
    }
    return () => { if (engine) engine.stop(); };
    // eslint-disable-next-line
  }, [stable, lang]);
  const triggerEvent = useCallback((type, target) => { if (engineRef.current) engineRef.current.triggerEvent(type, target); }, []);
  const replay = useCallback(() => { if (engineRef.current) engineRef.current.replay(); }, []);
  const toggleMute = useCallback(() => { setState(p => { const m = !p.muted; if (m && engineRef.current) engineRef.current.stop(); return { ...p, muted: m }; }); }, []);
  return { ...state, triggerEvent, replay, toggleMute };
}

const AudioIndicator = ({ audioState }) => {
  const { isPlaying, muted, replay, toggleMute } = audioState;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={toggleMute} title={muted ? 'Sound on' : 'Sound off'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: muted ? T.ink3 : (isPlaying ? T.accent : T.ink2) }}>
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
        ) : isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
        )}
      </button>
      {!muted && (
        <button onClick={replay} title="Replay" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: T.ink2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
        </button>
      )}
    </div>
  );
};

const LESSON_META = { lessonId: 'html-02-v16', lessonTitle: { uz: 'HTML: rasm, struktura, forma, DevTools', ru: 'HTML: картинки, структура, формы, DevTools' } };
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

const CodeBox = ({ children }) => <pre className="code-box">{children}</pre>;
const Tg = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Sr = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Preview = ({ children, title = 'preview.html', minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH }}>{children}</div></div>
);
const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, audioState, narrow, mentorStatic }) => {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {audioState && <AudioIndicator audioState={audioState} />}
              <div className="mono small" style={{ color: T.ink3 }}>{String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}</div>
            </div>
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

const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, audioText, audioOk, audioWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio(audioText ? [{ id: `s${screen}_intro`, text: audioText, trigger: 'on_mount', waits_for: { type: 'option_picked' } }] : null);
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
    if (audioText) { audio.triggerEvent('option_picked'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(isCorrect ? (audioOk || "To'g'ri.") : (audioWrong || "Unchalik emas. Qaytadan urinib ko'ring.")); }, 300); }
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow audioState={audioText ? audio : undefined} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
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

// ===== MENTOR (nomsiz ustoz ovozi — intro/izoh shu orqali; audio matni = shu matn) =====
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

// ===== RASM HELPER (tog/mushuk/raketa — haqiqiy rasm; profil — emoji) =====
const PHOTO_IMG = { tog: togImg, mushuk: mushukImg, raketa: raketaImg };
const Photo = ({ kind = 'tog', w = 180, h = 120, broken = false, alt = '' }) => {
  const SET = {
    tog:    { bg: 'linear-gradient(160deg,#a9def0,#eaf6ee)', emoji: '🏔️' },
    mushuk: { bg: 'linear-gradient(160deg,#ffe1c4,#fff3e6)', emoji: '🐱' },
    raketa: { bg: 'linear-gradient(160deg,#d9d4ff,#f0eeff)', emoji: '🚀' },
    profil: { bg: 'linear-gradient(160deg,#ffd9cf,#ffeee9)', emoji: '🧑‍🚀' }
  };
  if (broken) return (<span className="img-broken" style={{ width: w, height: h }}><span className="ib-ic">🖼️</span><span>{alt || 'rasm yuklanmadi'}</span></span>);
  const src = PHOTO_IMG[kind];
  if (src) return (<img src={src} alt={alt} style={{ width: w, height: h, objectFit: 'cover', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'block' }} />);
  const sc = SET[kind] || SET.tog;
  return (<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: w, height: h, borderRadius: 10, background: sc.bg, fontSize: Math.round(h * 0.36), boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{sc.emoji}</span>);
};

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Birinchi darsda matn va sarlavhali sayt yasadingiz. Endi Instagram yoki online-do'konni eslang — u yerda rasm, tugma, forma to'la. "Sayt" tugmasini bosib, ichida nima borligini ko'ring.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('site');
  const OPTS = [
    { id: 'a', label: 'Faqat matn va sarlavha' },
    { id: 'b', label: "Rasm, forma va tugmalar ham" },
    { id: 'c', label: 'Faqat ranglar' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Sayt faqat <span className="italic" style={{ color: T.accent }}>matndan</span> iboratmi?</h1>
        <Mentor>Birinchi darsda matn va sarlavhali sayt yasadingiz. Endi <b style={{ color: T.ink }}>Instagram</b> yoki online-do'konni eslang — u yerda rasm, tugma, forma to'la. <b style={{ color: T.ink }}>"Sayt"</b> tugmasini bosib, ichida nima borligini ko'ring.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'site' ? 'chip-on' : ''}`} onClick={() => setView('site')}>🌐 Sayt</button>
              <button className={`chip ${view === 'code' ? 'chip-on' : ''}`} onClick={() => setView('code')}>{'</>'} Kod</button>
            </div>
            <div className="demo-swap" key={view}>
              {view === 'site' ? (
                <Preview minH={190} title="mening-saytim.uz">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Photo kind="profil" w={56} h={56} />
                    <div><h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,2.6vw,22px)', margin: 0, color: T.ink }}>Aziza</h1><p style={{ fontFamily: 'Georgia, serif', margin: 0, color: T.ink2, fontSize: 13 }}>Web-dasturchi</p></div>
                  </div>
                  <p style={{ fontFamily: 'Georgia, serif', margin: '0 0 10px', color: T.ink2, fontSize: 'clamp(13px,1.8vw,15px)' }}>Menga yozing:</p>
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ background: T.bg, border: `1px solid ${T.ink3}55`, borderRadius: 8, padding: '7px 12px', fontFamily: "'Manrope', sans-serif", fontSize: 13, color: T.ink3 }}>Ismingiz…</span><span style={{ background: T.accent, color: '#fff', borderRadius: 8, padding: '7px 14px', fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13 }}>Yuborish</span></span>
                </Preview>
              ) : (
                <>
                  <CodeBox><Tg>{'<img '}</Tg><At>src</At>=<Sr>"aziza.jpg"</Sr><Tg>{'>'}</Tg>{'\n'}<Tg>{'<h1>'}</Tg>Aziza<Tg>{'</h1>'}</Tg>{'\n'}<Tg>{'<form>'}</Tg>{'\n  '}<Tg>{'<input>'}</Tg>{'\n  '}<Tg>{'<button>'}</Tg>Yuborish<Tg>{'</button>'}</Tg>{'\n'}<Tg>{'</form>'}</Tg></CodeBox>
                  <p className="mono small" style={{ color: T.ink3, marginTop: 6, textAlign: 'center' }}>↑ rasm, forma, tugma — bugun shularni o'rganamiz!</p>
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, saytni jonli qiladigan nima?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
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
            {picked !== null && <p className="hook-ack fade-step">Aynan! Rasm, struktura va forma — saytni jonli qiladi. Boshladik.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Bugun 1-darsdagi saytingizni kuchaytiramiz: rasm qo'shamiz, sahifani bo'limlarga ajratamiz, forma yasaymiz va DevTools bilan ichini ochib ko'ramiz. 4 qadam — mana natija.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: "Rasm qo'shamiz", tag: 'img' },
    { text: "Sahifani bo'limlarga ajratamiz", tag: 'header, main, footer' },
    { text: 'Forma yasaymiz', tag: 'form, input' },
    { text: 'DevTools bilan ichini ochamiz', tag: 'F12' }
  ];
  const G = "Georgia, serif";
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Natija — dars oxirida shunday bo'ladi</p>
      <Preview title="mening-saytim.html" minH={250}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Photo kind="profil" w={50} h={50} />
          <h1 style={{ fontFamily: G, fontSize: 'clamp(18px,2.6vw,22px)', margin: 0, color: T.ink }}>Salom, men Aziza!</h1>
        </div>
        <p style={{ fontFamily: G, margin: '0 0 10px', color: T.ink2, fontSize: 'clamp(13px,1.8vw,15px)', lineHeight: 1.5 }}>Web-dasturlashni o'rganyapman.</p>
        <p style={{ fontFamily: G, fontWeight: 700, margin: '0 0 6px', color: T.ink }}>Menga yozing:</p>
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ background: T.bg, border: `1px solid ${T.ink3}55`, borderRadius: 8, padding: '7px 12px', fontFamily: "'Manrope', sans-serif", fontSize: 13, color: T.ink3 }}>Ismingiz…</span><span style={{ background: T.accent, color: '#fff', borderRadius: 8, padding: '7px 14px', fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13 }}>Yuborish</span></span>
      </Preview>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">4 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Saytimizni kuchaytiramiz!</span></h2></div>
        <Mentor>Bugun 1-darsdagi saytingizni kuchaytiramiz: <b style={{ color: T.ink }}>rasm</b> qo'shamiz, sahifani <b style={{ color: T.ink }}>bo'limlarga</b> ajratamiz, <b style={{ color: T.ink }}>forma</b> yasaymiz va <b style={{ color: T.ink }}>DevTools</b> bilan ichini ochamiz. 4 qadam.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Bugungi 4 qadamni ko'rish</button>
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

// ===== SCREEN 2 — RASM (img) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Saytga rasm qo'yish — devorga surat ilganga o'xshaydi. img — bu ramka, src esa qaysi rasmni qo'yishni aytadi. Eng qizig'i: img yopuvchi tegsiz, o'zi yopiladi. Tugmalarni bosib, rasmni almashtiring.`, trigger: 'on_mount', waits_for: null }]);
  const CHOICES = [{ key: 'tog', label: "🏔️ Tog'", file: 'tog.jpg' }, { key: 'mushuk', label: '🐱 Mushuk', file: 'mushuk.jpg' }, { key: 'raketa', label: '🚀 Raketa', file: 'raketa.jpg' }];
  const [kind, setKind] = useState('tog');
  const [touched, setTouched] = useState(!!storedAnswer);
  const done = touched;
  const isNarrow = useIsMobile(768);
  const cur = CHOICES.find(c => c.key === kind) || CHOICES[0];
  const pick = (k) => { setKind(k); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Rasm" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Rasmni almashtiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytga rasmni qanday <span className="italic" style={{ color: T.accent }}>qo'yamiz</span>?</h2></div>
        <Mentor>Saytga rasm qo'yish — devorga <b style={{ color: T.ink }}>surat</b> ilganga o'xshaydi. <span className="mono">img</span> — bu ramka, <span className="mono">src</span> esa qaysi rasmni qo'yishni aytadi. Eng qizig'i: <span className="mono">img</span> <b style={{ color: T.ink }}>yopuvchi tegsiz</b>. Tugmalarni bosib, rasmni almashtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{CHOICES.map(c => (<button key={c.key} className={`chip ${kind === c.key ? 'chip-on' : ''}`} onClick={() => pick(c.key)}>{c.label}</button>))}</div>
            <pre className="code-box fade-up delay-2" key={kind}><Tg>{'<img '}</Tg><At>src</At>=<Sr>"{cur.file}"</Sr><Tg>{'>'}</Tg></pre>
            <div className="frame-soft fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}><b>Sizning loyihangiz:</b> saytingizga o'z rasmingizni <span className="mono">&lt;img&gt;</span> bilan qo'shasiz.</p></div>
          </div>
          {(!isNarrow || done) && (<div className="col">
            <div className="flow-label">Sahifada shunday ko'rinadi</div>
            <Preview title="rasm.html" minH={150}><div style={{ display: 'flex', justifyContent: 'center' }} key={kind}><span className="el-in"><Photo kind={kind} w={200} h={130} /></span></div></Preview>
          </div>)}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ALT atributi =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Internet sekin bo'lsa yoki rasm yo'qolsa nima bo'ladi? Mana shu yerda alt yordam beradi — u rasmni so'z bilan tasvirlaydi. Ko'zi ojiz odamlar va Google ham aynan shu matnni o'qiydi. Tugmani bosib, rasmni o'chirib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [broken, setBroken] = useState(false);
  const [touched, setTouched] = useState(!!storedAnswer);
  const done = touched;
  const toggle = () => { setBroken(b => !b); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="alt atributi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Rasmni o'chirib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Rasm <span className="italic" style={{ color: T.accent }}>yuklanmasa</span> nima bo'ladi?</h2></div>
        <Mentor>Internet sekin bo'lsa yoki rasm yo'qolsa-chi? Mana shu yerda <span className="mono">alt</span> yordam beradi — u rasmni <b style={{ color: T.ink }}>so'z bilan</b> tasvirlaydi. Ko'zi ojiz odamlar va Google ham shu matnni o'qiydi. Rasmni "o'chirib" ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Tg>{'<img '}</Tg><At>src</At>=<Sr>"mushuk.jpg"</Sr> <At>alt</At>=<Sr>"Oq mushuk"</Sr><Tg>{'>'}</Tg></pre>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={toggle}>{broken ? '🌐 Rasmni yoqish' : "📵 Rasmni o'chirish"}</button>
            <div className={broken ? 'frame-success fade-step' : 'hint'}><p className="body" style={{ margin: 0, color: T.ink }}>{broken ? <>Rasm yo'q — lekin <b>alt</b> matni ("Oq mushuk") ko'rinib turibdi. Foydalanuvchi baribir nima rasm ekanini biladi.</> : <>Hozir rasm ko'rinyapti. <b style={{ color: T.ink }}>alt</b> esa yashirin turadi — u faqat rasm yo'qolganda yoki ekranni ovoz bilan o'qib beruvchi dasturlar uchun chiqadi.</>}</p></div>
          </div>
          <div className="col">
            <div className="flow-label">natija</div>
            <Preview title="mushuk.html" minH={150}><div style={{ display: 'flex', justifyContent: 'center' }} key={broken}><span className="el-in"><Photo kind="mushuk" w={200} h={130} broken={broken} alt="Oq mushuk" /></span></div></Preview>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};
// ===== SCREEN 4 — TEST (rasm) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Rasm faylining manzilini, ya'ni qaysi rasm ekanini qaysi atribut ko'rsatadi?"
    questionText="Rasm faylining manzilini qaysi atribut ko'rsatadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri atributni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Rasm faylining manzilini qaysi atribut ko'rsatadi?</h2></>}
    options={['alt', 'src', 'href', 'file']} correctIdx={1}
    explainCorrect="To'g'ri! src (source) — rasm faylining manzilini ko'rsatadi. Masalan: img src bilan 'mushuk.jpg' ni yuklaydi."
    explainWrong={{ 0: 'alt — rasm yuklanmaganda chiqadigan matn. Manzilni esa src ko’rsatadi.', 2: 'href — bu havola (a teg) manzili. Rasm uchun src ishlatiladi.', 3: 'file — bunday atribut yo’q. To’g’risi — src.', default: 'Rasm manzili src atributida yoziladi.' }} />
);

// ===== SCREEN 5 — STRUKTURA (header/main/footer) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Gazetani eslang: tepada nomi, o'rtada asosiy maqolalar, pastda aloqa ma'lumotlari. Sahifa ham shunaqa bo'limlarga bo'linadi: header tepa, main asosiy qism, footer pastki qism. Har bir bo'limni bosib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    header: { tag: '<header>', word: 'Tepa', role: 'Sahifaning tepasi: logotip, sayt nomi va menyu shu yerda turadi.' },
    main:   { tag: '<main>', word: 'Asosiy qism', role: 'Sahifaning asosiy kontenti — matn, rasmlar, eng muhim narsalar shu yerda.' },
    footer: { tag: '<footer>', word: 'Pastki qism', role: "Sahifaning pasti: aloqa, mualliflik huquqi (©), qo'shimcha havolalar." }
  };
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = clicked.size === 3;
  const tap = (k) => { setActive(k); setClicked(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const zc = (k) => `szone szone-${k} ${active === k ? 'active' : ''}`;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Struktura" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : `${clicked.size}/3 bo'lim ko'rilgan`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sahifa qanday <span className="italic" style={{ color: T.accent }}>bo'limlarga</span> bo'linadi?</h2></div>
        <Mentor>Gazetani eslang: tepada nomi, o'rtada maqolalar, pastda aloqa. Sahifa ham shunaqa: <b style={{ color: T.ink }}>header</b> — tepa, <b style={{ color: T.ink }}>main</b> — asosiy qism, <b style={{ color: T.ink }}>footer</b> — pastki qism. Har bir bo'limni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="struktwin fade-up delay-2">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">aziza.uz — bitta sahifa, uch bo'lak</span></div>
              <div className="strukt">
              <div className={zc('header')} onClick={() => tap('header')}><p className="szone-h">🏷️ Logo · Menyu</p><p className="szone-d">sayt nomi va navigatsiya</p><span className="szone-tag">&lt;header&gt;</span></div>
              <div className={zc('main') + ' szone-main'} onClick={() => tap('main')}><p className="szone-h">📄 Asosiy kontent</p><p className="szone-d">matn, rasmlar, eng muhim narsa</p><span className="szone-tag">&lt;main&gt;</span></div>
              <div className={zc('footer')} onClick={() => tap('footer')}><p className="szone-h">📮 Aloqa · © 2026</p><p className="szone-d">pastki ma'lumotlar</p><span className="szone-tag">&lt;footer&gt;</span></div>
              </div>
            </div>
          </div>
          <div className="col" style={{ gap: 8 }}>
            {!isNarrow && (<>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><div className="flow-label">HTML kodi</div><span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{clicked.size} / 3</span></div>
              <pre className="code-box fade-up delay-2">
                <span className={`ck ${active === 'header' ? 'active' : ''}`} onClick={() => tap('header')}><span className="t-tag">&lt;header&gt;</span>...&lt;/header&gt;</span>{'\n'}
                <span className={`ck ${active === 'main' ? 'active' : ''}`} onClick={() => tap('main')}><span className="t-tag">&lt;main&gt;</span>...&lt;/main&gt;</span>{'\n'}
                <span className={`ck ${active === 'footer' ? 'active' : ''}`} onClick={() => tap('footer')}><span className="t-tag">&lt;footer&gt;</span>...&lt;/footer&gt;</span>
              </pre>
            </>)}
            {active ? (
              <div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-chip">{PARTS[active].tag}</span><span className="sk-wordbadge">{PARTS[active].word}</span></span><p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].role}</p></div>
            ) : (
              !done && !isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bo'limni yoki koddan birini bosing</p></div> : null
            )}
            {done && (
              <div className="frame-success fade-step" style={{ marginTop: active ? 'clamp(8px,1.2vw,12px)' : 0 }}><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Strukturani o'rgandingiz</p><p className="body" style={{ margin: 0, color: T.ink }}>Sahifa odatda shu tartibda: <b>header (tepa) → main (asosiy) → footer (past)</b>.</p></div>
            )}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST (struktura) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Sahifaning eng tepasidagi logotip va menyu qaysi bo'limga joylanadi?"
    questionText="Logotip va menyu qaysi bo'limga joylanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sahifaning tepasidagi <span className="italic" style={{ color: T.accent }}>logotip va menyu</span> qaysi bo'limga joylanadi?</h2></>}
    options={['<footer>', '<main>', '<header>', '<img>']} correctIdx={2}
    explainCorrect="To'g'ri! header — sahifaning tepasi: logotip, sayt nomi va menyu shu yerda turadi."
    explainWrong={{ 0: 'footer — bu pastki qism (aloqa, ©). Tepadagi menyu header’da.', 1: 'main — bu asosiy kontent qismi. Logotip va menyu header’da.', 3: '<img> — bu rasm tegi, bo’lim emas. To’g’risi — header.', default: 'Tepadagi logotip va menyu header bo’limiga joylanadi.' }} />
);

// ===== SCREEN 6 — DIV (guruhlash) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Tasavvur qiling: stol ustida qalam, daftar, o'chirg'ich tarqoq yotibdi. Ularni bitta qutiga solsangiz tartibli bo'ladi. div ham xuddi shunaqa: bir nechta elementni bitta qutiga guruhlaydi. Tugmani bosib, elementlarni qutiga soling.`, trigger: 'on_mount', waits_for: null }]);
  const [boxed, setBoxed] = useState(false);
  const [touched, setTouched] = useState(!!storedAnswer);
  const done = touched;
  const toggle = () => { setBoxed(b => !b); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="div — guruhlash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Qutiga solib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir nechta elementni qanday <span className="italic" style={{ color: T.accent }}>guruhlaymiz</span>?</h2></div>
        <Mentor>Stolda qalam, daftar, o'chirg'ich tarqoq yotsa — ularni bitta <b style={{ color: T.ink }}>qutiga</b> solsangiz tartibli bo'ladi. <span className="mono">div</span> ham shunaqa: bir nechta elementni bitta qutiga guruhlaydi. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={toggle}>{boxed ? '↻ Qaytadan' : '📦 Qutiga (div) solish'}</button>
            <pre className="code-box fade-up delay-2" key={boxed ? 'b' : 'n'}>{boxed ? (<><Tg>{'<div '}</Tg><At>class</At>=<Sr>"karta"</Sr><Tg>{'>'}</Tg>{'\n  '}<Tg>{'<img '}</Tg><At>src</At>=<Sr>"aziza.jpg"</Sr><Tg>{'>'}</Tg>{'\n  '}<Tg>{'<h1>'}</Tg>Aziza<Tg>{'</h1>'}</Tg>{'\n  '}<Tg>{'<p>'}</Tg>Web-dasturchi<Tg>{'</p>'}</Tg>{'\n'}<Tg>{'</div>'}</Tg></>) : (<><Tg>{'<img '}</Tg><At>src</At>=<Sr>"aziza.jpg"</Sr><Tg>{'>'}</Tg>{'\n'}<Tg>{'<h1>'}</Tg>Aziza<Tg>{'</h1>'}</Tg>{'\n'}<Tg>{'<p>'}</Tg>Web-dasturchi<Tg>{'</p>'}</Tg></>)}</pre>
          </div>
          <div className="col">
            <div className="flow-label">Sahifada</div>
            <Preview title="karta.html" minH={170}>
              {boxed ? (
                <div className="el-in" style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.bg, borderRadius: 12, padding: 14, boxShadow: `inset 0 0 0 2px ${T.accent}` }}>
                  <Photo kind="profil" w={56} h={56} />
                  <div><h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, margin: 0, color: T.ink }}>Aziza</h1><p style={{ fontFamily: 'Georgia, serif', margin: 0, color: T.ink2, fontSize: 13 }}>Web-dasturchi</p></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Photo kind="profil" w={56} h={56} />
                  <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, margin: 0, color: T.ink }}>Aziza</h1>
                  <p style={{ fontFamily: 'Georgia, serif', margin: 0, color: T.ink2, fontSize: 13 }}>Web-dasturchi</p>
                </div>
              )}
            </Preview>
            <div className={boxed ? 'frame-ok fade-step' : 'hint'}><p className="body" style={{ margin: 0, color: T.ink }}>{boxed ? <>✓ Endi rasm, sarlavha va matn — bitta <b>karta</b> (div) ichida birga turadi.</> : <>Hozir elementlar tarqoq. <span className="mono">div</span> ularni bitta guruhga jamlaydi.</>}</p></div>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};
// ===== SCREEN 7 — FORMA =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Saytda ro'yxatdan o'tish yoki xabar yozish — bularning hammasi forma orqali bo'ladi. Forma — bu qog'oz anketa kabi: label savol nomi, input javob yoziladigan joy, button esa yuborish tugmasi. Ismingizni yozib, Yuborish tugmasini bosing.`, trigger: 'on_mount', waits_for: null }]);
  const [name, setName] = useState('');
  const [sent, setSent] = useState(!!storedAnswer);
  const done = sent;
  const submit = (e) => { if (e) e.preventDefault(); if (name.trim()) setSent(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Forma" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Formani to'ldiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Foydalanuvchidan ma'lumotni qanday <span className="italic" style={{ color: T.accent }}>olamiz</span>?</h2></div>
        <Mentor>Saytda ro'yxatdan o'tish yoki xabar yozish — hammasi <b style={{ color: T.ink }}>forma</b> orqali. Forma qog'oz anketa kabi: <span className="mono">label</span> — savol nomi, <span className="mono">input</span> — javob joyi, <span className="mono">button</span> — yuborish tugmasi. Ismingizni yozib, Yuborishni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <form className="miniform fade-up delay-2" onSubmit={submit}>
              <label className="mf-label">Ismingiz</label>
              <input className="mf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Masalan: Aziza" />
              <button className="mf-btn" type="submit">Yuborish</button>
            </form>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Forma yuborildi! Sayt javobingizni oldi: <b>Salom, {name.trim()}!</b></p></div>}
          </div>
          <div className="col">
            <div className="flow-label">Forma kodi</div>
            <pre className="code-box fade-up delay-2"><Tg>{'<form>'}</Tg>{'\n  '}<Tg>{'<label>'}</Tg>Ismingiz<Tg>{'</label>'}</Tg>{'\n  '}<Tg>{'<input>'}</Tg>{'\n  '}<Tg>{'<button>'}</Tg>Yuborish<Tg>{'</button>'}</Tg>{'\n'}<Tg>{'</form>'}</Tg></pre>
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>label</b> — savol nomi · <b>input</b> — javob joyi · <b>button</b> — yuborish tugmasi.</p></div>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — INPUT turlari =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Hamma input bir xil emas. Parol uchun nuqtalar bilan yashiriladigan, email uchun maxsus, raqam uchun faqat son kiritiladigan input bor. type atributi turini belgilaydi. Turlarni almashtirib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const TYPES = [
    { key: 'text', label: 'Matn', ph: 'Ismingiz', note: 'Oddiy matn — ism, shahar va hokazo.' },
    { key: 'email', label: 'Email', ph: 'siz@mail.com', note: 'Email manzil — @ belgisini tekshiradi.' },
    { key: 'password', label: 'Parol', ph: 'parolingiz', note: "Parol — yozganingiz nuqta bo'lib yashiriladi." },
    { key: 'number', label: 'Raqam', ph: '18', note: 'Faqat son — yosh, telefon raqami va hokazo.' }
  ];
  const [type, setType] = useState('text');
  const [val, setVal] = useState('');
  const [touched, setTouched] = useState(!!storedAnswer);
  const done = touched;
  const cur = TYPES.find(t => t.key === type) || TYPES[0];
  const pick = (k) => { setType(k); setVal(''); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="input turlari" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Turini almashtiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Parol, email, raqam — hammasi <span className="italic" style={{ color: T.accent }}>bir xilmi</span>?</h2></div>
        <Mentor>Hamma <span className="mono">input</span> bir xil emas. Parol uchun nuqta bilan yashiriladigan, email uchun maxsus, raqam uchun faqat son kiritiladigan input bor. <span className="mono">type</span> atributi turini belgilaydi. Almashtirib ko'ring.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{TYPES.map(t => (<button key={t.key} className={`chip ${type === t.key ? 'chip-on' : ''}`} onClick={() => pick(t.key)}>{t.label}</button>))}</div>
            <div className="miniform fade-up delay-2" key={type}>
              <label className="mf-label">{cur.label}</label>
              <input className="mf-input" type={type} value={val} onChange={e => setVal(e.target.value)} placeholder={cur.ph} />
            </div>
            <div className="when"><p className="body" style={{ margin: 0, color: T.ink }}>{cur.note}</p></div>
          </div>
          <div className="col">
            <div className="flow-label">Kod</div>
            <pre className="code-box fade-up delay-2" key={type}><Tg>{'<input '}</Tg><At>type</At>=<Sr>"{type}"</Sr><Tg>{'>'}</Tg></pre>
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>Sizning loyihangiz:</b> aloqa formangizga ism yoki email uchun mos <span className="mono">type</span> qo'yasiz.</p></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST (forma) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Foydalanuvchi matn yozadigan maydonni qaysi teg yasaydi?"
    questionText="Foydalanuvchi matn yozadigan maydonni qaysi teg yasaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri tegni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Foydalanuvchi matn yozadigan maydonni qaysi teg yasaydi?</h2></>}
    options={['<label>', '<form>', '<button>', '<input>']} correctIdx={3}
    explainCorrect="To'g'ri! input — foydalanuvchi matn (yoki parol, email, raqam) yozadigan maydon."
    explainWrong={{ 0: 'label — bu maydon nomi (yozuv), yozish joyi emas. To’g’risi — input.', 1: 'form — bu butun formani o’rab turuvchi teg. Yozish joyi — input.', 2: 'button — bu yuborish tugmasi. Matn yoziladigan joy — input.', default: 'Matn yoziladigan maydon — input.' }} />
);
// ===== SCREEN 10 — DEVTOOLS (inspect) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Har bir saytning ichida HTML kodi bor — uni ko'rish mumkin! Brauzerda F12 tugmasini bossangiz yoki istalgan joyni o'ng tugma bosib Inspect tanlasangiz, DevTools ochiladi va sahifaning butun kodini ko'rsatadi. Tugmani bosib, sahifaning ichini oching.`, trigger: 'on_mount', waits_for: null }]);
  const [opened, setOpened] = useState(!!storedAnswer);
  const [hov, setHov] = useState(null);
  const done = opened;
  const isNarrow = useIsMobile(768);
  const hl = (k) => (hov === k ? 'hl-on' : '');
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="DevTools" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "DevTools'ni oching"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytning <span className="italic" style={{ color: T.accent }}>ichini</span> qanday ko'ramiz?</h2></div>
        <Mentor>Har bir saytning ichida HTML kodi bor — uni ko'rish mumkin! Brauzerda <b style={{ color: T.ink }}>F12</b> (yoki o'ng tugma → <b style={{ color: T.ink }}>Inspect</b>) bossangiz, <b style={{ color: T.ink }}>DevTools</b> ochiladi va sahifa kodini ko'rsatadi. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="bp-window fade-up delay-2"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">aziza.uz</span></div>
              <div className="bp-body" style={{ display: 'block' }}>
                <div className={hl('header')} onMouseEnter={() => opened && setHov('header')} onMouseLeave={() => setHov(h => h === 'header' ? null : h)} onClick={() => opened && setHov('header')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: 4, borderRadius: 4, cursor: opened ? 'pointer' : 'default' }}><b style={{ fontFamily: "'Manrope', sans-serif", color: T.ink }}>Aziza</b><span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: T.ink2 }}>Asosiy · Aloqa</span></div>
                <h1 className={hl('h1')} onMouseEnter={() => opened && setHov('h1')} onMouseLeave={() => setHov(h => h === 'h1' ? null : h)} onClick={() => opened && setHov('h1')} style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,2.6vw,24px)', color: T.ink, margin: '0 0 6px', padding: 4, borderRadius: 4, cursor: opened ? 'pointer' : 'default' }}>Salom! 👋</h1>
                <p className={hl('p')} onMouseEnter={() => opened && setHov('p')} onMouseLeave={() => setHov(h => h === 'p' ? null : h)} onClick={() => opened && setHov('p')} style={{ fontFamily: 'Georgia, serif', color: T.ink2, margin: 0, padding: 4, borderRadius: 4, fontSize: 14, cursor: opened ? 'pointer' : 'default' }}>Bu mening saytim.</p>
              </div>
            </div>
            {!opened && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setOpened(true)}>🔍 Inspect (F12) — kodni ochish</button>}
          </div>
          <div className="col">
            {opened ? (
              <div className="fade-step">
                <div className="flow-label" style={{ marginBottom: 6 }}>DevTools — Elements</div>
                <div className="devtools">
                  <div className="dt-bar"><span className="dt-tab">Elements</span><span>Console</span><span>Network</span></div>
                  <div className="dt-tree">
                    <div className={`dt-node ${hov === 'header' ? 'hl' : ''}`} onClick={() => setHov('header')} onMouseEnter={() => setHov('header')} onMouseLeave={() => setHov(h => h === 'header' ? null : h)}><span className="tg">&lt;header&gt;</span>…<span className="tg">&lt;/header&gt;</span></div>
                    <div className={`dt-node ${hov === 'h1' ? 'hl' : ''}`} onClick={() => setHov('h1')} onMouseEnter={() => setHov('h1')} onMouseLeave={() => setHov(h => h === 'h1' ? null : h)}><span className="tg">&lt;h1&gt;</span>Salom! 👋<span className="tg">&lt;/h1&gt;</span></div>
                    <div className={`dt-node ${hov === 'p' ? 'hl' : ''}`} onClick={() => setHov('p')} onMouseEnter={() => setHov('p')} onMouseLeave={() => setHov(h => h === 'p' ? null : h)}><span className="tg">&lt;p&gt;</span>Bu mening saytim.<span className="tg">&lt;/p&gt;</span></div>
                  </div>
                  <p className="dt-hint">{isNarrow ? '👆 Kod qatori yoki sahifa qismiga tegin — ikkalasi birga yonadi.' : '↕ Kod qatori yoki chapdagi sahifa qismiga kursor oling — ikkalasi birga yonadi.'}</p>
                </div>
              </div>
            ) : (
              <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Hozir faqat sayt ko'rinyapti. <b style={{ color: T.ink }}>Inspect</b> tugmasini bossangiz, ichidagi HTML kodi ochiladi.</p></div>
            )}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — DEVTOOLS (jonli tahrir) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `DevTools'da kodni shunchaki ko'rib qolmay, o'zgartirib ham ko'rish mumkin. h1 ichidagi matnni o'zgartiring — sahifa darhol yangilanadi. Lekin esda tuting: bu o'zgarish faqat sizning ekraningizda va vaqtincha. Sahifani yangilasangiz, hammasi joyiga qaytadi.`, trigger: 'on_mount', waits_for: null }]);
  const ORIG = 'Salom! 👋';
  const [text, setText] = useState(ORIG);
  const [edited, setEdited] = useState(!!storedAnswer);
  const done = edited;
  const onChange = (v) => { setText(v); if (v.trim() && v !== ORIG) setEdited(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="DevTools · tahrir" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Matnni o'zgartiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">DevTools'da kodni <span className="italic" style={{ color: T.accent }}>o'zgartirib</span> ko'ring</h2></div>
        <Mentor>DevTools'da kodni shunchaki ko'rib qolmay, <b style={{ color: T.ink }}>o'zgartirib</b> ham ko'rish mumkin. <span className="mono">h1</span> ichidagi matnni o'zgartiring — sahifa darhol yangilanadi. Esda tuting: bu <b style={{ color: T.ink }}>vaqtincha</b>, faqat sizning ekraningizda.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="flow-label">DevTools — Elements</div>
            <div className="devtools fade-up delay-2">
              <div className="dt-bar"><span className="dt-tab">Elements</span></div>
              <div className="dt-tree">
                <div className="dt-node"><span className="tg">&lt;h1&gt;</span><input className="dt-edit" value={text} onChange={e => onChange(e.target.value)} spellCheck={false} /><span className="tg">&lt;/h1&gt;</span></div>
              </div>
              <p className="dt-hint">↑ Matnni o'zgartiring — o'ngdagi sahifa darhol yangilanadi.</p>
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Sahifa <span className="live-dot">● jonli</span></div>
            <Preview title="aziza.uz" minH={120}><div style={{ display: 'block' }}><h1 key={text} className="hl-sync" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3vw,28px)', color: T.ink, margin: '0 0 6px' }}>{text || '...'}</h1><p style={{ fontFamily: 'Georgia, serif', color: T.ink2, margin: 0, fontSize: 14 }}>Bu mening saytim.</p></div></Preview>
            {done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>⚠️ Bu o'zgarish <b>vaqtincha</b> — faqat sizning ekraningizda. Sahifani yangilasangiz, asl matn (<b>{ORIG}</b>) qaytadi. Shuning uchun bemalol tajriba qiling!</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST (DevTools) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="DevTools orqali sahifadagi matnni o'zgartirsangiz, bu o'zgarish nima bo'ladi?"
    questionText="DevTools orqali matnni o'zgartirsangiz, bu o'zgarish..."
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>DevTools orqali sahifadagi matnni o'zgartirsangiz, bu o'zgarish...</h2></>}
    options={["Butun internetda, hamma uchun o'zgaradi", "Saytni butunlay o'chirib yuboradi", "Faqat sizning ekraningizda, vaqtincha bo'ladi", "Hech qachon ko'rinmaydi"]} correctIdx={2}
    explainCorrect="To'g'ri! DevTools'dagi o'zgarish faqat sizning brauzeringizda va vaqtincha. Sahifani yangilasangiz, asl holiga qaytadi — shuning uchun bemalol tajriba qilsa bo'ladi."
    explainWrong={{ 0: "Yo'q — o'zgarish faqat sizda. Boshqalar asl saytni ko'radi.", 1: "Yo'q — sayt o'chmaydi, faqat sizning ekraningizda vaqtincha ko'rinadi.", 3: "O'zgarish ko'rinadi — lekin faqat sizda va vaqtincha.", default: "DevTools o'zgarishi faqat sizda va vaqtincha bo'ladi." }} />
);
// ===== SCREEN 13 — BUILDER (amaliyot) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Vaqti keldi — bugun o'rgangan teglardan o'z sahifangizni yig'asiz. Buyruq yozing yoki tayyor teglardan tanlang, kod o'zi paydo bo'ladi. Kamida 3 ta bo'lak qo'shing: rasm, bo'lim, forma, sarlavha yoki matn.`, trigger: 'on_mount', waits_for: null }]);
  const MAX = 6;
  const CHIPS = [{ key: 'h1', label: 'Sarlavha', tag: 'h1' }, { key: 'img', label: 'Rasm', tag: 'img' }, { key: 'header', label: "Bo'lim", tag: 'header' }, { key: 'form', label: 'Forma', tag: 'form' }, { key: 'p', label: 'Matn', tag: 'p' }];
  const detect = (txt) => { const t = (txt || '').toLowerCase(); if (/sarlavha|ism|title|bosh/.test(t)) return 'h1'; if (/rasm|surat|img|foto/.test(t)) return 'img'; if (/bo.?lim|header|menyu|struktura|footer/.test(t)) return 'header'; if (/forma|form|anketa|input|aloqa/.test(t)) return 'form'; if (/matn|paragraf|haqim|tavsif|yoz/.test(t)) return 'p'; return null; };
  const elCode = (type) => { switch (type) { case 'h1': return <><Tg>{'<h1>'}</Tg>Mening sahifam<Tg>{'</h1>'}</Tg></>; case 'p': return <><Tg>{'<p>'}</Tg>Men HTML o'rganyapman.<Tg>{'</p>'}</Tg></>; case 'img': return <><Tg>{'<img '}</Tg><At>src</At>=<Sr>"rasm.jpg"</Sr> <At>alt</At>=<Sr>"Rasmim"</Sr><Tg>{'>'}</Tg></>; case 'header': return <><Tg>{'<header>'}</Tg>{'\n    '}<Tg>{'<h1>'}</Tg>Logo<Tg>{'</h1>'}</Tg>{'\n  '}<Tg>{'</header>'}</Tg></>; case 'form': return <><Tg>{'<form>'}</Tg>{'\n    '}<Tg>{'<input>'}</Tg>{'\n    '}<Tg>{'<button>'}</Tg>Yuborish<Tg>{'</button>'}</Tg>{'\n  '}<Tg>{'</form>'}</Tg></>; default: return null; } };
  const elView = (type, i) => { switch (type) { case 'h1': return <h1 key={i} style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,2.8vw,24px)', margin: '0 0 6px', color: T.ink }}>Mening sahifam</h1>; case 'p': return <p key={i} style={{ fontFamily: 'Georgia, serif', margin: '0 0 6px', color: T.ink, fontSize: 'clamp(13px,1.8vw,15px)' }}>Men HTML o'rganyapman.</p>; case 'img': return <span key={i} style={{ display: 'block', marginBottom: 6 }}><Photo kind="profil" w={150} h={96} /></span>; case 'header': return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}><b style={{ fontFamily: "'Manrope', sans-serif", color: T.ink, fontSize: 14 }}>Logo</b><span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: T.ink2 }}>Asosiy · Aloqa</span></div>; case 'form': return <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}><span style={{ background: T.bg, border: `1px solid ${T.ink3}55`, borderRadius: 8, padding: '6px 12px', fontFamily: "'Manrope', sans-serif", fontSize: 12, color: T.ink3 }}>Ismingiz…</span><span style={{ background: T.accent, color: '#fff', borderRadius: 8, padding: '6px 12px', fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 12 }}>Yuborish</span></div>; default: return null; } };
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [pending, setPending] = useState(null);
  const timer = useRef(null);
  const done = items.length >= 3;
  const generate = (type) => { if (items.length >= MAX || pending) return; setHint(''); setPending(type); clearTimeout(timer.current); timer.current = setTimeout(() => { setItems(prev => [...prev, type]); setPending(null); }, 650); };
  const submit = () => { const type = detect(text); if (!type) { setHint("Tushunmadim 🙂 Mana shulardan yozing: sarlavha, rasm, bo'lim, forma, matn."); return; } generate(type); setText(''); };
  const reset = () => { setItems([]); setPending(null); setHint(''); clearTimeout(timer.current); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · sahifa quramiz" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : `Kamida 3 ta bo'lak (${items.length}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Buyruq bering — <span className="italic" style={{ color: T.accent }}>kod o'zi yaraladi</span>.</h2></div>
        <Mentor>Vaqti keldi — bugun o'rgangan teglardan o'z sahifangizni yig'asiz. Buyruq yozing yoki tayyor teglardan tanlang — kod o'zi paydo bo'ladi. Kamida 3 ta bo'lak qo'shing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 7 }}>Buyruq yozing</p><div className="prompt-row"><input className="prompt-input" value={text} placeholder="masalan: rasm qo'sh" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} /><button className="prompt-btn" onClick={submit} disabled={!!pending || items.length >= MAX}>Yarat</button></div></div>
            <div className="fade-up delay-2"><p className="flow-label" style={{ margin: '2px 0 7px' }}>yoki tayyor buyruqlardan tanlang</p><div className="chips">{CHIPS.map(c => (<button key={c.key} className="gchip" disabled={items.length >= MAX} onClick={() => { setText(c.label.toLowerCase() + " qo'sh"); setHint(''); }}>{c.label} <span className="gt">&lt;{c.tag}&gt;</span></button>))}{items.length > 0 && <button className="gchip" onClick={reset}>↺ Tozalash</button>}</div></div>
            {hint && <p className="hint fade-step">{hint}</p>}
            {done && (<div style={{ background: T.successSoft, borderLeft: `4px solid ${T.success}`, borderRadius: 12, padding: '12px 15px' }} className="fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Siz <b>buyruq berib</b> sahifa qurdingiz — rasm, bo'lim va forma bilan.</p></div>)}
          </div>
          <div className="col">
            <div className="flow-label">Kod</div>
            <pre className="code-box"><Tg>{'<body>'}</Tg>{'\n'}{items.length === 0 && !pending && <><span className="cm">{'  <!-- buyruq bering -->'}</span>{'\n'}</>}{items.map((it, i) => (<React.Fragment key={i}>{'  '}{elCode(it)}{'\n'}</React.Fragment>))}{pending && <><span className="gen-line">{'  yaratilmoqda'}</span>{'\n'}</>}<Tg>{'</body>'}</Tg></pre>
            <div className="flow-label">Sahifa</div>
            <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">mening-sahifam.html</span></div><div className="bp-body">{items.length === 0 && !pending ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif' }}>Bo'sh sahifa — buyruq bering...</p> : items.map((it, i) => <span key={i} className="el-in" style={{ display: 'block' }}>{elView(it, i)}</span>)}</div></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (DevTools bilan) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `AI sizga sahifa kodini yozib berdi, lekin rasm ko'rinmayapti. Nega? DevTools'da img qatorini bosib, sababini toping. Keyin birga tuzatamiz.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const pickImg = () => { if (found) return; setFound(true); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! src bo'm-bo'sh — qaysi rasmni ko'rsatishni aytmagan. Endi fayl nomini qo'shib tuzatamiz.`); }, 300); };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi src rasmni ko'rsatyapti va rasm chiqdi. DevTools xatoni topishda shunaqa yordam beradi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : (found ? "Endi tuzating" : "Xatoni toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Rasm ko'rinmayapti — <span className="italic" style={{ color: T.accent }}>nega</span>?</h2></div>
        <Mentor>AI sizga sahifa kodini yozib berdi, lekin <b style={{ color: T.ink }}>rasm ko'rinmayapti</b>. Nega? <b style={{ color: T.ink }}>DevTools</b>'da <span className="mono">img</span> qatorini bosib, sababini toping — keyin birga tuzatamiz.</Mentor>
        <div className="split">
          <div className="col">
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana sahifangiz kodi! (lekin rasm chiqmayapti 🤔)</span></div>
              <div className="ai-code">
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickImg}><span className="tg">&lt;img </span><span className="at">src</span>=<span className="st">"{fixed ? 'aziza.jpg' : ''}"</span><span className="at"> alt</span>=<span className="st">"Aziza"</span><span className="tg">&gt;</span></div>
                <div className="ai-line"><span className="tg">&lt;h1&gt;</span>Aziza<span className="tg">&lt;/h1&gt;</span></div>
              </div>
              {!found && <p className="ai-prompt">Rasm nega ko'rinmayapti? img qatorini bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 src ga fayl nomini qo'shib tuzatish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi rasm bor!</p>}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Sahifa</div>
            <div className="bp-window fade-up delay-2"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">aziza.html</span></div><div className="bp-body" style={{ display: 'block', textAlign: 'center' }}><span key={fixed ? 'f' : 'b'}><Photo kind="profil" w={160} h={104} broken={!fixed} alt="Aziza" /></span><h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: T.ink, margin: '8px 0 0' }}>Aziza</h1></div></div>
            {!found && (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>DevTools'da <span className="mono">img</span> qatorini bossangiz, <span className="mono">src</span> ning bo'm-bo'sh ekanini ko'rasiz.</p></div>)}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">src=""</span> bo'm-bo'sh — brauzer qaysi rasmni ko'rsatishni bilmaydi. Chap tomondagi tugma bilan tuzating →</p></div>)}
            {fixed && (<div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">DevTools bilan xatoni topding!</p><p className="ta-sub">Kodni ko'rib, sababni topib, tuzatding — bu debugging</p></div>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 15 — YAKUNIY (qo'lda img yozish) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Oxirgi qadam. O'zingiz to'liq img tegini yozing: ochilish, src bilan fayl nomi va alt bilan tavsif. Masalan: img src teng rasm.jpg, alt teng Mening rasmim.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const hasImg = /<\s*img/i.test(value);
  const hasSrc = /src\s*=\s*["'][^"']+["']/i.test(value);
  const hasAlt = /alt\s*=\s*["'][^"']+["']/i.test(value);
  const valid = hasImg && hasSrc && hasAlt;
  const altMatch = value.match(/alt\s*=\s*["']([^"']+)["']/i);
  const altText = altMatch ? altMatch[1] : '';
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { correct: true, picked: value });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! img, src va alt — uchalasini to'liq yozdingiz.`); }, 300);
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? "Davom etish" : "Img tegini yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: rasm tegini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yozing.</h2></div>
        <Mentor>To'liq <span className="mono">img</span> tegini yozing: <b style={{ color: T.ink }}>src</b> bilan fayl nomi, <b style={{ color: T.ink }}>alt</b> bilan tavsif. Namuna pastda turibdi.</Mentor>
        <div className="split">
          <div className="col">
            <input className="fade-up delay-2" value={value} onChange={e => setValue(e.target.value)} placeholder={'<img src="rasm.jpg" alt="...">'} spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasImg ? 1 : 0.4 }}>{hasImg ? '✓' : '1'} &lt;img</span>
              <span className="tagpill" style={{ opacity: hasSrc ? 1 : 0.4 }}>{hasSrc ? '✓' : '2'} src="…"</span>
              <span className="tagpill" style={{ opacity: hasAlt ? 1 : 0.4 }}>{hasAlt ? '✓' : '3'} alt="…"</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! <span className="mono">img</span>, <span className="mono">src</span> va <span className="mono">alt</span> — to'liq rasm tegi.</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Bu — baholanadigan topshiriqlardan biri; yakka o'zi bahoni hal qilmaydi.</p>)}
          </div>
          <div className="col">
            <div className="flow-label">natija</div>
            <div style={{ background: T.paper, borderRadius: 14, minHeight: 150, padding: '20px 22px', boxShadow: `0 8px 22px -10px rgba(${T.shadowBase},0.16)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {valid
                ? (<><span key={altText} className="fade-step"><Photo kind="profil" w={180} h={116} /></span><p style={{ fontFamily: 'Georgia, serif', color: T.ink2, fontStyle: 'italic', margin: 0, fontSize: 13 }}>{altText}</p></>)
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>To'liq yozing: <span className="mono" style={{ fontStyle: 'normal' }}>&lt;img</span> + <span className="mono" style={{ fontStyle: 'normal' }}>src</span> + <span className="mono" style={{ fontStyle: 'normal' }}>alt</span></p>}
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Ikkinchi dars yakunlandi! Endi saytingizga rasm qo'sha olasiz, uni header, main va footer bo'limlarga ajratasiz, forma yasaysiz va DevTools bilan kodni ko'rib, tuzata olasiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ["Rasm qo'shish (img, src, alt)", 'Sahifa strukturasi (header, main, footer, div)', 'Forma yasash (form, label, input, button)', 'input turlari (text, email, password, number)', "DevTools bilan kodni ko'rish va tuzatish"];
  const HOMEWORK = [{ b: 'Rasm (img)', t: '— o’zingizning rasmingiz, alt bilan' }, { b: 'Struktura', t: '— header, main, footer bo’limlari' }, { b: 'Aloqa formasi', t: '— ism va email uchun input' }, { b: 'DevTools', t: '— sahifangizni Inspect qilib ko’ring' }];
  const GLOSSARY = [{ b: 'img', t: '— rasm' }, { b: 'src', t: '— rasm manzili' }, { b: 'alt', t: '— rasm tavsifi' }, { b: 'header/main/footer', t: '— sahifa bo’limlari' }, { b: 'div', t: '— guruhlovchi quti' }, { b: 'form/input/label', t: '— forma qismlari' }, { b: 'DevTools', t: '— F12, kodni ko’rish va tuzatish' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Modulni yakunlash →</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> 2-dars tugadi</span><h2 className="title h-title fade-up d1">Saytingiz endi <span className="italic" style={{ color: T.accent }}>haqiqiy</span> ko'rinishga ega.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Rasm, struktura, forma va DevTools — hammasini egalladingiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko’ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>1-darsdagi saytingizni boyiting:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Avval o'z qo'lingiz bilan yozing, keyin DevTools bilan tekshiring. Tayyor bo'lsa platformaga yuklang.</p></div>
        </div>
        <div className="gloss fade-up d4"><div className="gloss-head" onClick={() => setOpen(o => !o)}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function HtmlLesson({ lang: langProp, onFinished }) {
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
      answers: SCREEN_META.map((_s, i) => answers[i]).filter(Boolean)
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
        .bp-body ul { list-style-type: disc; list-style-position: outside; padding-left: 24px; }
        .bp-body ol { list-style-type: decimal; list-style-position: outside; padding-left: 24px; }
        .bp-body li { display: list-item; }

        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .display { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.0; letter-spacing: -0.01em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        /* Kattalashtirish (zoom) — animatsiyani katta ekranda ko'rish */
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === KNOPKALAR v15 (soyalar) === */
        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === OPSIYALAR v15 === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
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

        .text-input, .prompt-input { width: 100%; font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); font-weight: 500; padding: 11px 13px; border: none; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: box-shadow 0.2s; }
        .text-input:focus, .prompt-input:focus { box-shadow: 0 10px 22px -6px rgba(255,79,40,0.3), 0 0 0 1px rgba(255,79,40,0.2); }
        .prompt-input { font-family: 'Manrope'; }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.55; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .code-box .tg, .t-tag { color: ${CODE.tag}; }
        .ck.active .t-tag { color: #fff; }
        .t-cm, .cm { color: ${CODE.comment}; font-style: italic; }
        .t-title { color: ${CODE.comment}; font-style: italic; opacity: 0.85; }
        .at { color: ${CODE.attr}; } .st { color: ${CODE.str}; } .tx { color: ${CODE.text}; }

        .bp-window { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.16); }
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }

        .h-title { font-size: clamp(22px,4vw,38px); }
        .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .lead { margin: 0; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

        /* === STAGE v15 (sticky header, 936px) === */
        .stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55), 0 0 3px rgba(255,79,40,0.4); }

        /* === FRAME v15 === */
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-ok { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: 12px 15px; }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        /* === PROBLEM REVEAL === */
        .pr { display: flex; flex-direction: column; gap: 12px; }
        .mu-block { display: flex; flex-direction: column; gap: 14px; transition: opacity 0.35s, transform 0.35s; }
        .mu-block.leave { opacity: 0; transform: translateY(-8px); }
        .ps-line { display: flex; gap: 10px; align-items: flex-start; }
        .ps-badge { flex-shrink: 0; font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 9px; border-radius: 6px; margin-top: 2px; }
        .ps-q { background: ${T.accentSoft}; color: ${T.accent}; }
        .ps-a { background: ${T.successSoft}; color: ${T.success}; }
        .ps-text { font-size: clamp(14px,1.7vw,16px); line-height: 1.5; color: ${T.ink}; }
        .solve-btn { align-self: flex-start; font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.6vw,15px); padding: 10px 18px; border-radius: 10px; border: none; background: ${T.ink}; color: ${T.bg}; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(${T.shadowBase},0.3); }
        .solve-btn:hover:not(:disabled) { background: ${T.accent}; }
        .ye-solved, .ye-stack { display: flex; flex-direction: column; gap: 12px; }
        .mu-mini { opacity: 0.7; }
        .idea { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 0; }
        .happy { font-size: 30px; animation: pop 0.5s ease-out; } .idea-bulb { font-size: 22px; animation: pop 0.5s ease-out 0.1s both; }
        @keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .pr-answer { animation: fade-step 0.4s ease-out; }

        .demo-swap { animation: fade-step 0.3s ease-out; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }
        .dest { display: flex; align-items: center; gap: 14px; background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 14px 18px; }
        .dest-emoji { font-size: 28px; } .dest-title { font-weight: 700; color: ${T.ink}; margin: 0; font-size: clamp(15px,1.8vw,17px); } .dest-sub { color: ${T.ink2}; margin: 2px 0 0; font-size: clamp(13px,1.5vw,14px); }

        /* === RECIPE === */
        .recipe-list { display: flex; flex-direction: column; list-style: none; }
        .recipe-list li { display: flex; align-items: center; gap: 13px; padding: 11px 2px; border-bottom: 1px solid rgba(167,166,162,0.22); transition: all 0.3s; }
        .recipe-list li:last-child { border-bottom: none; }
        .recipe-num { width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 2px ${T.ink3}; background: transparent; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; flex-shrink: 0; transition: all 0.3s; }
        .recipe-list li.on .recipe-num { box-shadow: inset 0 0 0 2px ${T.success}; background: ${T.success}; }
        .recipe-text { font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }

        /* === FLOW ARROW === */
        .flow-arrow { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 0; }
        .flow-track { width: 2px; height: 10px; background: ${T.ink3}; position: relative; overflow: hidden; border-radius: 2px; }
        .flow-bead { position: absolute; top: -8px; left: -1px; width: 4px; height: 8px; background: ${T.accent}; border-radius: 2px; animation: bead 1.4s linear infinite; }
        @keyframes bead { from { top: -8px; } to { top: 18px; } }
        .flow-chevron { color: ${T.accent}; font-size: 11px; animation: chev 1.4s ease-in-out infinite; }
        @keyframes chev { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .brauzer-step { display: flex; align-items: center; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 9px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .brauzer-icon { font-size: 20px; } .brauzer-h { font-weight: 700; color: ${T.ink}; margin: 0; font-size: 14px; } .brauzer-sub { color: ${T.ink2}; margin: 1px 0 0; font-size: 12px; font-family: 'JetBrains Mono'; }

        /* === PROFILE CARD === */
        .profile-card { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; padding: 2px 0; animation: fade-step 0.3s; }
        .pf-ava { width: 44px; height: 44px; border-radius: 50%; background: ${T.accent}; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 20px; }
        .pf-name { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,19px); color: ${T.ink}; margin: 0; }
        .pf-bio { color: ${T.ink2}; margin: 0; font-size: 12.5px; }
        .pf-btn { margin-top: 3px; background: ${T.accent}; color: #fff; border: none; border-radius: 8px; padding: 6px 14px; font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; cursor: default; }

        /* === BSKEL (skeleton anatomy) === */
        .bskel { display: flex; flex-direction: column; gap: 0; }
        .bskel-doctype, .bskel-html, .bskel-tab, .bskel-page { cursor: pointer; transition: all 0.2s; position: relative; }
        .bskel-doctype { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; padding: 6px 10px; border-radius: 8px 8px 0 0; background: ${T.bg}; }
        .bskel-html { border: 2px solid ${T.ink3}; border-radius: 0 8px 12px 12px; padding: 18px 10px 10px; background: ${T.paper}; }
        .bskel-htmllabel { position: absolute; top: -1px; left: 10px; transform: translateY(-50%); font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink2}; background: ${T.paper}; padding: 0 6px; }
        .bskel-win { border-radius: 10px; overflow: hidden; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.18); }
        .bskel-tab { background: #f0eee8; padding: 8px 10px; display: flex; align-items: center; gap: 8px; }
        .bskel-dots { display: flex; gap: 4px; } .bskel-dots i { width: 8px; height: 8px; border-radius: 50%; background: ${T.ink3}; }
        .bskel-tabpill { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: #fff; padding: 3px 9px; border-radius: 5px; }
        .bskel-zone { margin-left: auto; font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; }
        .bskel-page { background: #fff; padding: 16px; min-height: 80px; }
        .bskel-ptitle { font-family: 'Georgia, serif'; font-size: 18px; color: ${T.ink}; margin: 0 0 4px; } .bskel-ptext { font-family: 'Georgia, serif'; color: ${T.ink2}; margin: 0; font-size: 13px; }
        .bskel-zone-b { position: absolute; bottom: 6px; right: 10px; }
        .bskel-doctype.active, .bskel-html.active, .bskel-tab.active, .bskel-page.active { box-shadow: inset 0 0 0 2px ${T.accent}; background: ${T.accentSoft}; }
        .bskel-tab.active, .bskel-page.active { background: ${T.accentSoft}; }
        .ck { cursor: pointer; border-radius: 4px; transition: all 0.15s; padding: 0 2px; }
        .ck:hover { background: rgba(255,255,255,0.08); }
        .ck.active { background: ${T.accent}; }
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 4px 9px; border-radius: 6px; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }

        /* === HUG (teg o'raydi) === */
        .hug-wrap { display: flex; justify-content: center; padding: 10px 0; }
        .hug { display: flex; align-items: stretch; gap: 0; transition: gap 0.4s; }
        .hug.on { gap: 4px; }
        .hug-item { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 14px; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
        .hug-tag { background: ${CODE.bg}; } .hug-content { background: ${T.accentSoft}; }
        .hug-item.active { box-shadow: 0 0 0 2px ${T.accent}; }
        .hug-code { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(15px,2vw,18px); }
        .hug-tag .hug-code { color: ${CODE.tag}; } .hug-content .hug-code { color: ${T.accent}; }
        .hug-slash { color: ${CODE.attr}; }
        .hug-lbl { font-family: 'JetBrains Mono'; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: ${T.ink3}; }
        .role-line { background: ${T.paper}; border-radius: 10px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .pv-h1 { font-family: 'Georgia, serif'; font-size: clamp(22px,3vw,30px); color: ${T.ink}; margin: 0; animation: fade-step 0.4s; }

        /* === LADDER (sarlavhalar) === */
        .ladder { display: flex; flex-direction: column; gap: 6px; }
        .hl-row { display: flex; align-items: center; gap: 13px; padding: 9px 14px; border-radius: 10px; cursor: pointer; transition: all 0.18s; background: ${T.paper}; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.12); }
        .hl-row:hover { box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.2); }
        .hl-row.on { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.25); background: ${T.accentSoft}; }
        .hl-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 3px 8px; border-radius: 5px; flex-shrink: 0; }
        .hl-text { font-family: 'Georgia, serif'; font-weight: 700; color: ${T.ink}; line-height: 1; }
        .hl-tag { margin-left: auto; font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; background: ${T.accentSoft}; padding: 3px 9px; border-radius: 99px; }
        .hl-note { background: ${T.paper}; border-radius: 10px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .hl-note .nb { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; }
        .hl-hint { padding: 10px 2px; }

        /* === MCARD (matn) === */
        .mcard { background: ${T.paper}; border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .mc-head { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .mc-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 3px 9px; border-radius: 5px; }
        .mc-label { font-weight: 600; font-size: 13px; color: ${T.ink2}; }
        .mc-demo { font-family: 'Georgia, serif'; font-size: clamp(18px,2.5vw,24px); color: ${T.ink}; padding: 8px 0; }
        .w-anim { display: inline-block; transition: all 0.3s; } .w-bold { font-weight: 800; } .w-ital { font-style: italic; }
        .mc-btn { align-self: flex-start; font-family: 'Manrope'; font-weight: 600; font-size: 13px; padding: 8px 15px; border-radius: 9px; border: none; background: ${T.bg}; color: ${T.ink}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 7px; }
        .mc-btn:hover { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .mc-btn.on { background: ${T.accent}; color: #fff; }
        .mc-btn .ic { font-family: 'Georgia, serif'; }
        .mc-code { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; background: ${T.bg}; padding: 8px 11px; border-radius: 8px; margin: 0; } .mc-code .tg { color: ${CODE.tag}; }

        /* === WHEN / LISTS === */
        .when { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 10px; padding: 11px 15px; }
        .site-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid ${T.ink3}40; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .site-brand { display: inline-flex; align-items: center; gap: 8px; } .site-logo { width: 22px; height: 22px; border-radius: 6px; background: ${T.accent}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 13px; } .site-name { font-family: 'Manrope'; font-weight: 700; color: ${T.ink}; font-size: 14px; }
        .site-nav { display: inline-flex; gap: 11px; font-family: 'Manrope'; font-size: 12px; color: ${T.ink2}; }
        .site-sec { } .site-h3 { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0 0 8px; }
        .site-list { font-family: 'Georgia, serif'; color: ${T.ink}; font-size: clamp(14px,1.8vw,16px); }
        .site-list ul, .site-list ol { padding-left: 24px; } .site-list li { display: list-item; margin: 3px 0; }

        /* === WEB (graf) === */
        .web { position: relative; height: 150px; background: ${T.paper}; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .web-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .web-node { position: absolute; transform: translate(-50%,-50%); font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.ink}; background: ${T.bg}; padding: 5px 10px; border-radius: 99px; cursor: pointer; transition: all 0.2s; white-space: nowrap; box-shadow: 0 3px 8px -3px rgba(${T.shadowBase},0.25); }
        .web-node:hover { transform: translate(-50%,-50%) scale(1.06); }
        .web-node.on { background: ${T.accent}; color: #fff; }
        .web-cap { font-size: clamp(12px,1.5vw,13px); color: ${T.ink2}; margin: 0; line-height: 1.5; }

        .bp-url { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; display: flex; align-items: center; gap: 6px; animation: fade-step 0.3s; } .lock { color: ${T.success}; font-size: 8px; }
        .pg-in { animation: pg-in 0.35s ease-out; } @keyframes pg-in { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        .site-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; flex-wrap: wrap; gap: 4px; }
        .site-wordmark { font-family: 'Georgia, serif'; font-weight: 700; color: ${T.ink}; font-size: 14px; } .site-tag { font-size: 10px; color: ${T.ink3}; font-family: 'JetBrains Mono'; }
        .pg-h1 { font-family: 'Georgia, serif'; font-size: clamp(20px,2.8vw,26px); color: ${T.ink}; margin: 0 0 7px; } .pg-body { font-family: 'Georgia, serif'; color: ${T.ink2}; font-size: clamp(13px,1.7vw,15px); line-height: 1.55; margin: 0 0 12px; }
        .pg-divider { height: 1px; background: ${T.ink3}30; margin: 0 0 12px; }
        .pg-linklabel { font-family: 'Manrope'; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${T.ink3}; margin: 0 0 8px; }
        .pg-links { display: flex; flex-direction: column; gap: 7px; margin-bottom: 12px; }
        .pg-a { font-family: 'Georgia, serif'; color: ${T.link}; text-decoration: underline; cursor: pointer; font-size: clamp(13px,1.7vw,15px); display: inline-flex; align-items: center; gap: 5px; transition: gap 0.2s; } .pg-a:hover { gap: 9px; } .arr { font-size: 12px; }
        .pg-foot { font-size: 10px; color: ${T.ink3}; margin: 0; font-family: 'Manrope'; }

        .codecard { background: ${T.paper}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s ease-out forwards; }
        .codecard-top { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; margin: 0 0 8px; display: flex; align-items: center; gap: 7px; } .dotf { width: 8px; height: 8px; border-radius: 50%; background: ${T.accent}; }
        .codeblock { background: ${CODE.bg}; border-radius: 8px; padding: 11px 13px; margin: 0; font-family: 'JetBrains Mono'; font-size: 12px; line-height: 1.6; display: flex; flex-direction: column; } .codeblock .ln { white-space: pre-wrap; word-break: break-word; } .codeblock .tg { color: ${CODE.tag}; }
        .codecap { font-size: 12px; color: ${T.ink2}; margin: 8px 0 0; } .mn { font-family: 'JetBrains Mono'; color: ${T.accent}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 4px 7px; border-radius: 6px; transition: all 0.15s; } .ai-line:hover { background: rgba(255,255,255,0.06); } .ai-line .tg { color: ${CODE.tag}; }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === BUILDER === */
        .prompt-row { display: flex; gap: 8px; }
        .prompt-btn { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14px; padding: 0 18px; border-radius: 12px; border: none; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); } .prompt-btn:hover:not(:disabled) { box-shadow: 0 10px 22px -5px rgba(255,79,40,0.55); } .prompt-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 7px 12px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; } .gt { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.accent}; }
        .gen-line { color: ${CODE.attr}; } .gen-line::after { content: '…'; animation: blink 1s steps(3) infinite; } @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        .el-in { animation: fade-step 0.35s ease-out; }

        /* === YOZISH (Screen7) === */
        .yz-card { background: ${T.paper}; border-radius: 14px; padding: 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 10px; }
        .yz-line { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-family: 'JetBrains Mono'; font-size: clamp(15px,2vw,18px); }
        .yz-code { color: ${T.ink}; } .yz-code .t-tag { color: ${CODE.tag}; } .yz-done { animation: fade-step 0.3s; }
        .yz-input { font-family: 'JetBrains Mono'; font-size: clamp(15px,2vw,18px); padding: 5px 10px; border: none; border-radius: 8px; background: ${T.bg}; color: ${T.ink}; outline: none; width: 150px; box-shadow: inset 0 0 0 1.5px ${T.accent}40; } .yz-input:focus { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .yz-hint { font-size: 12.5px; color: ${T.ink2}; margin: 0; } .yz-ok { font-size: 13px; color: ${T.success}; font-weight: 600; margin: 0; animation: fade-step 0.3s; } .yz-placeholder { color: ${T.ink3}; font-style: italic; margin: 0; font-family: 'Georgia, serif'; }

        /* === YAKUN (Screen16) === */
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
        /* ============ v16 QO'SHIMCHA CSS ============ */
        /* SCREEN 2 — Hayotdan misol (2-bosqich) */
        .frame-col { display: flex; flex-direction: column; gap: 14px; }
        .savo { gap: 12px; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }
        .pz-head { display: flex; align-items: flex-start; gap: 12px; }
        .pz-emoji { font-size: 26px; line-height: 1; flex-shrink: 0; }
        .pz-title { font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 3px; }
        .pz-sub { font-size: clamp(13px,1.6vw,15px); color: ${T.ink2}; line-height: 1.45; margin: 0; }
        .pz-flow { display: flex; align-items: flex-start; gap: 4px; overflow-x: auto; padding: 4px 2px 2px; }
        .pz-step { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 88px; flex: 0 0 auto; padding: 10px 6px; border-radius: 12px; transition: background 0.3s; }
        .pz-step.on { background: ${T.successSoft}; }
        .pz-step.active { background: ${T.accentSoft}; }
        .pz-ic { width: 34px; height: 34px; border-radius: 50%; box-shadow: inset 0 0 0 2px ${T.ink3}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 14px; color: ${T.ink2}; background: transparent; transition: all 0.3s; }
        .pz-step.on .pz-ic { box-shadow: inset 0 0 0 2px ${T.success}; background: ${T.success}; color: #fff; }
        .pz-step.active .pz-ic { box-shadow: inset 0 0 0 2px ${T.accent}; color: ${T.accent}; }
        .pz-lbl { font-size: 11.5px; text-align: center; color: ${T.ink2}; line-height: 1.25; font-weight: 500; }
        .pz-step.on .pz-lbl { color: ${T.ink}; }
        .pz-arrow { align-self: center; margin-top: 16px; color: ${T.ink3}; font-size: 15px; flex: 0 0 auto; transition: color 0.3s; }
        .pz-arrow.on { color: ${T.success}; }
        /* SCREEN 6 — Teg (qo'shtirnoq modeli) */
        .pv-plain { font-family: 'Georgia, serif'; font-size: 14px; color: ${T.ink3}; margin: 0; }
        .tegbuild-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 22px 0 14px; }
        .tegbuild { display: flex; align-items: center; justify-content: center; gap: 5px; min-height: 78px; }
        .tegbuild.on { gap: 4px; }
        .tb-chip { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 13px 16px; border-radius: 11px; transition: transform 0.55s cubic-bezier(.34,1.25,.4,1), opacity 0.4s; cursor: default; }
        .tegbuild.on .tb-chip { cursor: pointer; }
        .tb-tag { background: ${CODE.bg}; } .tb-content { background: ${T.accentSoft}; }
        .tb-code { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(16px,2.4vw,20px); }
        .tb-tag .tb-code { color: ${CODE.tag}; } .tb-content .tb-code { color: ${T.accent}; }
        .tb-slash { color: ${CODE.attr}; display: inline-block; }
        .tegbuild.on .tb-slash { animation: slashpulse 1.3s ease-in-out 0.55s 2; }
        @keyframes slashpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.45); } }
        .tb-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: ${T.ink3}; transition: opacity 0.3s 0.35s; }
        .tb-open.hide { transform: translateX(-64px) scale(0.82); opacity: 0; }
        .tb-close.hide { transform: translateX(64px) scale(0.82); opacity: 0; }
        .tegbuild:not(.on) .tb-tag .tb-lbl { opacity: 0; }
        .tb-chip.active { box-shadow: 0 0 0 2px ${T.accent}; }
        .tb-bracket { display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: 0; transition: opacity 0.3s 0.5s; }
        .tegbuild-wrap.on .tb-bracket { opacity: 1; }
        .tb-brace { width: 150px; max-width: 70%; height: 9px; border: 1.5px solid ${T.ink3}; border-top: none; border-radius: 0 0 9px 9px; }
        .tb-brace-lbl { font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink2}; }
        .slash-callout { display: flex; align-items: center; gap: 13px; background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .slash-big { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 30px; color: ${T.accent}; line-height: 1; flex-shrink: 0; }
        /* SCREEN 8 — Sarlavhalar (gazeta -> teglar qo'nadi) */
        .news-card { display: flex; flex-direction: column; }
        .news-line { display: flex; align-items: center; gap: 12px; padding: 9px 10px; margin: 0 -10px; border-radius: 10px; transition: background 0.4s ease; }
        .news-card.tagged .news-line { background: ${T.bg}; }
        .news-card.tagged .news-headline { background: ${T.accentSoft}; }
        .news-line > h3, .news-line > p { flex: 1; min-width: 0; }
        .tag-badge { flex-shrink: 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 4px 9px; border-radius: 6px; opacity: 0; transform: translateX(10px) scale(0.9); transition: opacity 0.4s ease, transform 0.45s cubic-bezier(.34,1.25,.4,1); }
        .news-card.tagged .tag-badge { opacity: 1; transform: none; }
        .tag-badge.accent { color: #fff; background: ${T.accent}; box-shadow: 0 4px 12px -4px rgba(255,79,40,0.5); }
        .tag-badge.soft { color: ${T.ink2}; background: ${T.bg}; box-shadow: inset 0 0 0 1px ${T.ink3}55; }
        .news-hint { font-family: 'Manrope'; font-size: 12.5px; color: ${T.ink2}; margin: 12px 0 0; }
        /* Avtoscroll */
        .stage-content { scroll-behavior: smooth; }
        /* MOBIL: yig'iladigan Mentor (skrollni kamaytirish) */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }

        /* ============ LESSON 2 QO'SHIMCHA CSS ============ */
        .strukt { display: flex; flex-direction: column; gap: 6px; }
        .struktwin { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.16); }
        .struktwin .strukt { padding: 8px; gap: 7px; }
        .struktwin .szone { box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.16); }
        .szone { position: relative; cursor: pointer; border-radius: 12px; padding: 14px 14px 22px; background: ${T.paper}; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); transition: all 0.18s; border: 2px solid transparent; }
        .szone:hover { box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.22); }
        .szone.active { border-color: ${T.accent}; background: ${T.accentSoft}; }
        .szone-main { min-height: 64px; }
        .szone-h { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; margin: 0 0 3px; }
        .szone-d { font-size: 12px; color: ${T.ink2}; margin: 0; font-family: 'Manrope'; }
        .szone-tag { position: absolute; bottom: 7px; right: 9px; font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 600; color: ${T.accent}; background: ${T.accentSoft}; padding: 2px 7px; border-radius: 6px; }
        .miniform { background: ${T.paper}; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .mf-label { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink2}; }
        .mf-input { font-family: 'Manrope', sans-serif; font-size: 15px; padding: 11px 13px; border: none; border-radius: 10px; background: ${T.bg}; color: ${T.ink}; outline: none; box-shadow: inset 0 0 0 1.5px ${T.ink3}40; transition: box-shadow 0.18s; width: 100%; }
        .mf-input:focus { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .mf-btn { align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 14px; padding: 10px 20px; border-radius: 10px; border: none; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .mf-btn:hover { box-shadow: 0 10px 22px -5px rgba(255,79,40,0.55); }
        .devtools { background: ${CODE.bg}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.22); }
        .dt-bar { background: #232f45; color: ${CODE.punct}; font-family: 'JetBrains Mono'; font-size: 11px; padding: 8px 12px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #2e3a52; }
        .dt-tab { color: ${CODE.text}; border-bottom: 2px solid ${T.accent}; padding-bottom: 4px; }
        .dt-tree { padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; }
        .dt-node { font-family: 'JetBrains Mono'; font-size: 12.5px; color: ${CODE.text}; padding: 4px 7px; border-radius: 5px; cursor: pointer; transition: background 0.15s; white-space: pre-wrap; word-break: break-word; display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
        .dt-node:hover, .dt-node.hl { background: rgba(255,255,255,0.09); }
        .dt-node .tg { color: ${CODE.tag}; } .dt-node .at { color: ${CODE.attr}; } .dt-node .st { color: ${CODE.str}; }
        .dt-edit { font-family: 'JetBrains Mono'; font-size: 12.5px; background: #0f1626; color: ${CODE.str}; border: none; border-radius: 4px; padding: 2px 6px; outline: none; box-shadow: inset 0 0 0 1px ${T.accent}; width: 130px; }
        .dt-hint { font-family: 'JetBrains Mono'; font-size: 11px; color: ${CODE.comment}; padding: 2px 12px 10px; margin: 0; }
        .hl-on { box-shadow: inset 0 0 0 2px ${T.accent}; background: ${T.accentSoft}; }
        .hl-sync { border-radius: 4px; padding: 0 3px; animation: hl-sync 0.6s ease; }
        @keyframes hl-sync { 0% { background: ${T.accent}; color: #fff; } 55% { background: ${T.accentSoft}; color: ${T.accent}; } 100% { background: transparent; color: ${T.ink}; } }
        .live-dot { font-family: 'Manrope'; font-size: 10px; font-weight: 700; color: ${T.success}; margin-left: 7px; letter-spacing: 0.04em; animation: live-pulse 1.4s ease-in-out infinite; }
        @keyframes live-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .img-broken { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border-radius: 10px; border: 1.5px dashed ${T.ink3}; background: ${T.bg}; color: ${T.ink2}; font-size: 12px; text-align: center; padding: 8px; }
        .img-broken .ib-ic { font-size: 24px; filter: grayscale(1); opacity: 0.55; }

      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}