import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// PM 3-DARS — STORYTELLING / PITCH (2 daqiqada tushuntirish) — PLATFORM STANDARD v16
// G'oya: har bir sayt — kimningdir REAL muammosiga yechim.
// Fikrlash yo'li: MUAMMO (qanday qiyinchilik) → KIM (kim uchun) → YECHIM (sayt qanday yordam beradi).
// Namunaviy darslik (JsIntro) dizayn tili: Split interaktiv demolar, animatsiyalar, rangli panellar.
// Har ekran global savol bilan ochiladi. Portfolioga urg'u yo'q.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };
const G = "Georgia, serif"; // "haqiqiy sayt" ko'rinishi uchun (HTML darslar standarti)

const LangContext = createContext('uz');
const MentorCtx = createContext(null);
const useLang = () => useContext(LangContext);

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

// AUDIOSIZ: AudioIndicator (ovoz/replay tugmalari) olib tashlandi — ovoz o'chirilgan, ikonka kerak emas.

// ===== IKONKALAR — abstrakt tushunchalar uchun toza chiziq, real ilovalar uchun rangli brend belgilari =====
const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  // abstrakt tushunchalar — joriy rangda (chiziqli)
  user: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.2-5.8 7-5.8s7 2.2 7 5.8" /></svg>),
  problem: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.2c-.7.4-1 .9-1 1.7" /><path d="M12 16.7h.01" /></svg>),
  solution: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9.5 18h5" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-3.8 10.7c.7.6 1 1.1 1 1.8h5.6c0-.7.3-1.2 1-1.8A6 6 0 0 0 12 3z" /></svg>),
  arrow: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={1.9}><path d="M4 12h14" /><path d="M13 6l6 6-6 6" /></svg>),
  check: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.3}><path d="M20 6L9 17l-5-5" /></svg>),
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  map: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>),
  book: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" /><path d="M5 16h13" /></svg>),
  // real ilovalar — o'z brend ranglari bilan (bolalar taniydigan belgilar)
  youtube: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="5" width="20" height="14" rx="4.2" fill="#FF0000" /><path d="M10 8.6v6.8L15.8 12z" fill="#fff" /></svg>),
  telegram: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><circle cx="12" cy="12" r="11" fill="#29A9EB" /><path d="M17.9 7.2l-2.05 9.4c-.15.68-.56.84-1.13.52l-3.1-2.28-1.5 1.44c-.16.16-.3.3-.62.3l.22-3.1 5.68-5.13c.25-.22-.05-.34-.38-.12l-7 4.42-3.02-.94c-.66-.2-.67-.66.14-.97l11.8-4.55c.55-.2 1.03.13.98.49z" fill="#fff" /></svg>),
  market: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><path d="M5 9.5h14V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" fill="#7B3FE4" fillOpacity="0.18" /><path d="M3.4 5.5h17.2l1.05 3.3a2.25 2.25 0 0 1-4.35.55 2.25 2.25 0 0 1-4.3 0 2.25 2.25 0 0 1-4.3 0 2.25 2.25 0 0 1-4.35-.55z" fill="#7B3FE4" /><rect x="9.7" y="13" width="4.6" height="7" rx="0.8" fill="#7B3FE4" /></svg>),
  taxi: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><path d="M4 16.2l1.5-4.9A2.5 2.5 0 0 1 7.9 9.6h8.2a2.5 2.5 0 0 1 2.4 1.7l1.5 4.9v3a.8.8 0 0 1-.8.8h-1.5a.8.8 0 0 1-.8-.8V19H6.6v.2a.8.8 0 0 1-.8.8H4.3a.8.8 0 0 1-.8-.8z" fill="#FFB300" /><rect x="9" y="6.4" width="6" height="2.6" rx="0.5" fill="#222" /><circle cx="7.6" cy="16.4" r="1.15" fill="#222" /><circle cx="16.4" cy="16.4" r="1.15" fill="#222" /></svg>)
};

const LESSON_META = { lessonId: 'pm-pitch-03-v16', lessonTitle: { uz: 'Storytelling — pitch', ru: 'Сторителлинг — питч' } };
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
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* AUDIOSIZ: ovoz tugmasi (AudioIndicator) ko'rsatilmaydi — ovoz allaqachon o'chirilgan */}
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

const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, audioText, audioOk, audioWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio(audioText ? [{ id: `s${screen}_intro`, text: audioText, trigger: 'on_mount', waits_for: { type: 'option_picked' } }] : null);
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

// global savol — har ekran shu bilan ochiladi
const Q = ({ children, max = 760 }) => <h2 className="title h-title fade-up" style={{ maxWidth: max }}>{children}</h2>;
const IcoChip = ({ color = T.accent, soft = T.accentSoft, children, size = 46 }) => (
  <span style={{ width: size, height: size, borderRadius: 13, background: soft, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</span>
);

// Brauzer oynasi — "haqiqiy sayt" maketi (HTML darslar dizayni)
const Preview = ({ url, children, minH }) => (
  <div className="bp-window fade-up delay-1">
    <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-url"><span className="lock">●</span>{url}</span></div>
    <div className="bp-body" style={{ minHeight: minH }}>{children}</div>
  </div>
);

// Sayt maketi ichidagi mini landing-page
const SiteMock = ({ logo = 'S', color = T.accent, name = 'Sayt', headline, sub, rows, cta }) => (
  <div className="pg-in" key={name + (headline || '')}>
    <div className="site-header"><span className="site-brand"><span className="site-logo" style={{ background: color }}>{logo}</span><span className="site-name">{name}</span></span><span className="site-nav"><span>Asosiy</span><span>Haqida</span></span></div>
    {headline && <h3 className="site-h3" style={{ marginTop: 2 }}>{headline}</h3>}
    {sub && <p style={{ fontFamily: G, color: T.ink2, fontSize: 'clamp(12.5px,1.6vw,14px)', lineHeight: 1.5, margin: '0 0 12px' }}>{sub}</p>}
    {rows && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 13px' }}>{rows.map((r, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 38, height: 28, borderRadius: 6, background: T.bg, flexShrink: 0, boxShadow: `inset 0 0 0 1px ${T.ink3}30` }} /><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{r}</span></div>))}</div>}
    {cta && <span style={{ display: 'inline-block', background: color, color: '#fff', fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, padding: '9px 18px', borderRadius: 9 }}>{cta}</span>}
  </div>
);

// ===== PM-3 PITCH — mahsulotni 2 daqiqada tushuntirish (treyler kabi) =====
const p3sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const p3 = {
  hook: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p3sv}><path d="M4 9v6h4l6 4V5L8 9z" /><path d="M17 8.5a4 4 0 0 1 0 7" /></svg>),
  demo: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p3sv}><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5 3.5-5 3.5z" /></svg>),
  film: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p3sv}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 15h18M8 4v16M16 4v16" /></svg>),
  mic: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p3sv}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /><path d="M12 17v4M9 21h6" /></svg>)
};
const PARTS = [
  { key: 'ilgak', label: 'Diqqat tortish', ic: p3.hook(18), color: '#E0892B', job: 'Birinchi gap — diqqatni tortadi, tinglovchini ushlaydi.', ex: 'Uyingizda ishlatilmay yotgan narsalar bormi?' },
  { key: 'muammo', label: 'Muammo', ic: Ico.problem(18), color: T.accent, job: 'Tinglovchi his qiladigan tanish qiyinchilik.', ex: 'Ularni sotish qiyin — e\'lon joylash, xaridor topish ko\'p vaqt oladi.' },
  { key: 'yechim', label: 'Yechim', ic: Ico.solution(18), color: T.blue, job: 'Mahsulotingiz — bir aniq jumlada.', ex: 'Bozor — 3 daqiqada e\'lon bering, minglab xaridor ko\'radi.' },
  { key: 'demo', label: 'Demo + harakat', ic: p3.demo(18), color: '#7B3FE4', job: 'Ko\'rsating va aniq chaqiring: nima qilsin.', ex: 'Mana, velosipedni 2 daqiqada sotuvga qo\'ydim. Siz ham hoziroq sinab ko\'ring!' }
];
const PMETA = {}; PARTS.forEach(p => { PMETA[p.key] = p; });

// Mobil: Mentor yopilganda ish maydonini ko'rsatadi (avtoskroll)
const MentorCollapseScroll = ({ targetRef }) => {
  const ctx = useContext(MentorCtx) || {};
  const prev = useRef(false);
  useEffect(() => {
    if (ctx.enabled && ctx.collapsed && !prev.current && targetRef && targetRef.current) {
      const el = targetRef.current;
      setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 420);
    }
    prev.current = !!ctx.collapsed;
  }, [ctx.collapsed, ctx.enabled, targetRef]);
  return null;
};

// Teleprompter — pitch-kartasi (script)
const PitchCard = ({ items, minH = 200 }) => (
  <div style={{ background: CODE.bg, borderRadius: 14, padding: '16px 17px', minHeight: minH, boxShadow: `0 12px 30px -10px rgba(${T.shadowBase},0.3)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 9, borderBottom: `1px solid #ffffff18` }}>
      <span style={{ color: '#9FB4D8', display: 'inline-flex' }}>{p3.mic(15)}</span>
      <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: '#9FB4D8', textTransform: 'uppercase' }}>2 daqiqalik pitch</span>
    </div>
    {items.map((it, i) => (
      <div key={i}>
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: it.color, textTransform: 'uppercase' }}>{it.label}</span>
        <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.7vw,15px)', lineHeight: 1.5, color: it.text ? '#E8E5DD' : '#6B7585', margin: '3px 0 0', fontStyle: it.text ? 'normal' : 'italic' }}>{it.text || it.ph}</p>
      </div>
    ))}
  </div>
);

// 2 daqiqa mashq taymeri
const RehearseTimer = () => {
  const [sec, setSec] = useState(120);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => () => clearInterval(ref.current), []);
  const start = () => { if (running) return; setRunning(true); clearInterval(ref.current); ref.current = setInterval(() => setSec(s => { if (s <= 1) { clearInterval(ref.current); setRunning(false); return 0; } return s - 1; }), 1000); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setSec(120); };
  const mm = Math.floor(sec / 60); const ss = String(sec % 60).padStart(2, '0');
  const over = sec === 0;
  return (
    <div className="frame fade-step" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 30, lineHeight: 1, color: over ? T.accent : (running ? T.success : T.ink), minWidth: 64 }}>{mm}:{ss}</span>
      <div style={{ flex: 1, minWidth: 150 }}>
        <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink, margin: 0 }}>{over ? 'Vaqt tugadi — qanday chiqdi?' : (running ? 'Ovoz chiqarib o\'qing — oyna oldida!' : 'Pitchingizni 2 daqiqada o\'qib mashq qiling')}</p>
      </div>
      {!running && !over && <button className="btn" onClick={start}>▶ Mashq qilish</button>}
      {(running || over) && <button className="btn-soft" onClick={reset}>↺ Qaytadan</button>}
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

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Bitta mahsulot — ikki xil aytilgan. Birini eshitib zerikasiz, birini eshitib qiziqasiz. Ikkala variantni bosib o'qing, keyin sababini tanlang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [v, setV] = useState('boring');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const TEXT = { boring: 'Men bir sayt qildim. Unda odamlar narsa qo\'yadi. HTML va CSS ishlatdim. Bor, ko\'ring.', great: 'Uyingizda ortiqcha narsa bormi? Sotish qiyin-a. Bozor — 3 daqiqada e\'lon bering, minglab xaridor topadi. Hoziroq sinab ko\'ring!' };
  const OPTS = [
    { id: 'a', label: 'Ikkinchisi chiroyliroq yozilgani uchun' },
    { id: 'b', label: 'Muammoni his qildirib, hikoya qilib gapirgani uchun' },
    { id: 'c', label: 'Farqi yo\'q, ikkalasi bir xil' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Bir mahsulot — nega biri <span className="italic" style={{ color: T.accent }}>qiziqarli</span>, biri zerikarli?</h1>
        <Mentor>Bitta mahsulot, ikki xil aytilgan. Birini eshitib <b style={{ color: T.ink }}>zerikasiz</b>, birini eshitib <b style={{ color: T.ink }}>qiziqasiz</b>. Ikkalasini bosib o'qing.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'boring' ? 'chip-on' : ''}`} onClick={() => setV('boring')}>Zerikarli</button>
              <button className={`chip ${v === 'great' ? 'chip-on' : ''}`} onClick={() => setV('great')}>Qiziqarli</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '18px 17px', boxShadow: `0 8px 20px -7px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${v === 'great' ? T.success : T.ink3}` }}>
              <span style={{ color: v === 'great' ? T.success : T.ink3, display: 'inline-flex' }}>{p3.mic(18)}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(15px,2vw,17px)', lineHeight: 1.55, color: T.ink, margin: '9px 0 0' }}>{TEXT[v]}</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nega biri qiziqarli?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Mahsulotning o'zi bir xil — lekin <b>qanday aytish</b> hammasini hal qiladi. Buni <b>pitch</b> deyiladi. Bugun 2 daqiqada qiziqtirishni o'rganamiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `G'oyani topdik, sahifani tuzdik. Endi eng muhimi — buni odamlarga qanday qilib 2 daqiqada tushuntirish. Buni pitch deyiladi va u kino treyleri kabi ishlaydi. Bugun shuni to'rtta qism bilan o'rganamiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Birinchi gap — diqqatni tortadi', tag: '' },
    { text: 'Muammo va yechimni hikoya qiling', tag: '' },
    { text: 'Demo bilan ishontiring va chaqiring', tag: '' },
    { text: 'Cho\'zib yubormang — 2 daqiqa', tag: 'vaqt' },
    { text: 'O\'z pitchingizni yozib, mashq qilasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Idea = ({ ic, h, t, c }) => (<div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}><IcoChip color={c} soft={c + '1c'}>{ic}</IcoChip><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>{h}</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>{t}</p></div></div>);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Idea ic={p3.film(22)} c="#E0892B" h="PITCH = TREYLER" t="Hammasini aytmaydi — qiziqtiradi" />
        <Idea ic={p3.mic(22)} c={T.blue} h="4 QISM" t="Diqqat tortish · Muammo · Yechim · Demo+harakat" />
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Demo Day'da shu pitch bilan saytingizni taqdim qilasiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Mahsulotingizni 2 daqiqada qanday qiziqtirasiz?</span></h2></div>
        <Mentor>G'oyani topdik, sahifani tuzdik. Endi eng muhimi — buni <b style={{ color: T.ink }}>2 daqiqada</b> tushuntirish. Bu — <b style={{ color: T.ink }}>pitch</b>, va u kino <b style={{ color: T.ink }}>treyleri</b> kabi ishlaydi.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — DIQQAT TORTISH (birinchi gap) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Kino treyleri birinchi soniyada ushlaydi. Pitch ham shunday — birinchi gap qiziqtirmasa, qolganini hech kim eshitmaydi. Quyidagi uchta boshlamadan qaysi biri eng kuchli? To'g'ri javobni tanlang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const OPTS = [
    { id: 0, label: 'Salom, men bir sayt qildim.', why: 'Bu hech kimni qiziqtirmaydi — na muammo, na qiziqish bor. Zaif boshlama.' },
    { id: 1, label: 'Uyingizda ishlatilmay yotgan narsalar bormi?', why: 'Mana bu — kuchli! Savol bilan boshlaydi, tinglovchini o\'ylantiradi va muammoga olib keladi.' },
    { id: 2, label: 'Bu sayt HTML va CSS da qilingan.', why: 'Bu — texnik tafsilot, tinglovchiga qiziq emas. Birinchi gap odamning muammosiga tegishi kerak.' }
  ];
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const solved = picked === 1;
  const pick = (id) => { if (solved) return; setPicked(id); if (id === 1 && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: id }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Diqqat tortish" screen={screen} narrow audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'Eng kuchlisini toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p>
          <h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi <span className="italic" style={{ color: T.accent }}>birinchi gap</span> tinglovchini ushlaydi?</h2>
        </div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {OPTS.map(o => { let cls = 'option'; if (solved) { if (o.id === 1) cls += ' option-correct'; else cls += ' option-wrong'; } else if (o.id === picked) cls += ' option-picked-wrong'; return (<button key={o.id} className={cls} disabled={solved} onClick={() => pick(o.id)} style={{ padding: 'clamp(13px,1.9vw,16px) clamp(15px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', textAlign: 'left' }}>{o.label}</button>); })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? 'To\'g\'ri' : 'Qaytadan'}</p>
          <p className="body" style={{ margin: 0 }}>{picked !== null ? OPTS[picked].why : ''}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — REAL MAHSULOTLAR BIR JUMLALI PITCH =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Eng zo'r mahsulotlar o'zini bitta jumlada tushuntira oladi. Har bir mahsulotni bosib, uning bir jumlali pitchini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const SITES = {
    youtube: { ic: Ico.youtube(24), name: 'YouTube', line: 'Sevimli videolaringizni xohlagan vaqtda, bepul ko\'ring — darslar ham, ko\'ngilochar ham bir joyda.' },
    market: { ic: Ico.market(24), name: 'Bozor', line: 'Uydan chiqmasdan, bir necha daqiqada e\'lon bering — yoki kerakli narsani arzonga toping.' },
    taxi: { ic: Ico.taxi(24), name: 'Taksi', line: 'Ko\'chada kutmasdan bir bosishda mashina chaqiring — narxini oldindan bilib turasiz.' },
    telegram: { ic: Ico.telegram(24), name: 'Telegram', line: 'Uzoqda bo\'lsangiz ham, do\'st va oilangiz bilan bepul va bir zumda yozishing.' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bir jumlali pitch" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashhur mahsulotlar o'zini <span className="italic" style={{ color: T.accent }}>bir jumlada</span> qanday aytadi?</h2></div>
        <Mentor>Eng zo'r mahsulotlar o'zini <b style={{ color: T.ink }}>bitta jumlada</b> tushuntira oladi. Har birini bosib, pitchini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.keys(SITES).map(k => (<button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', border: 'none', borderRadius: 13, padding: '13px 12px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ display: 'inline-flex' }}>{SITES[k].ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: T.ink }}>{SITES[k].name}</span>{seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ display: 'inline-flex' }}>{SITES[active].ic}</span><span className="sk-wordbadge">{SITES[active].name}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.5, color: T.ink, margin: '13px 0 0', fontStyle: 'italic' }}>"{SITES[active].line}"</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir mahsulotni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi — bironta ham "men sayt qildim" demaydi. Hammasi <b>foydani</b> bir jumlada aytadi.</p></div>}
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
    audioText="Yaxshi pitch nimadan boshlanadi?"
    questionText="Yaxshi pitch nimadan boshlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi pitch <span className="italic" style={{ color: T.accent }}>nimadan</span> boshlanadi?</h2></>}
    options={['Texnik tafsilotlardan (qaysi tilda qilingani)', 'Diqqatni tortadigan birinchi gapdan', 'Salomlashuv va o\'zini tanishtirishdan', 'Narxidan']} correctIdx={1}
    explainCorrect="To'g'ri! Treyler kabi — birinchi gap tinglovchini ushlaydi. Aks holda qolganini eshitmaydi."
    explainWrong={{ 0: 'Texnik tafsilot tinglovchiga qiziq emas. Avval qiziqtiruvchi birinchi gap kerak.', 2: 'Uzoq salomlashuv zeriktiradi. Darhol qiziqtiruvchi birinchi gap bilan boshlang.', 3: 'Narx — keyin. Avval qiziqtirish, muammoni his qildirish kerak.', default: 'Pitch diqqatni tortadigan birinchi gapdan boshlanadi.' }} />
);

// ===== SCREEN 5 — 4 QISM (tap → vazifa) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Yaxshi pitch to'rtta qismdan iborat: diqqat tortish, muammo, yechim va demo bilan harakat. Har birini bosib, vazifasini va "Bozor" misolini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Pitch tuzilishi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 qismni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pitch qaysi <span className="italic" style={{ color: T.accent }}>4 qism</span>dan iborat?</h2></div>
        <Mentor>Yaxshi pitch 4 qismdan iborat: <b style={{ color: T.ink }}>diqqat tortish, muammo, yechim, demo+harakat</b>. Har birini bosib, vazifasini va "Bozor" misolini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map(s => (<button key={s.key} onClick={() => tap(s.key)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === s.key ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{s.label}</span>{seen.has(s.key) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: PMETA[active].color, display: 'inline-flex' }}>{PMETA[active].ic}</span><span className="sk-wordbadge" style={{ color: PMETA[active].color, background: PMETA[active].color + '1c' }}>{PMETA[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{PMETA[active].job}</p><p style={{ fontFamily: G, fontStyle: 'italic', color: T.ink2, margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.5 }}>"{PMETA[active].ex}"</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qismni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'rt qism birga — tayyor pitch. Endi ularni <b>tartib bilan</b> bog'laymiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Demo va harakat qismi pitchda nima vazifani bajaradi?"
    questionText="Demo + harakat qismi pitchda nima vazifani bajaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>"Demo + harakat" qismi <span className="italic" style={{ color: T.accent }}>nima uchun</span> kerak?</h2></>}
    options={['Ko\'rsatib ishontiradi va aniq keyingi qadamni beradi', 'Pitchni uzaytirish uchun', 'Texnik tafsilotlarni sanash uchun', 'Salomlashish uchun']} correctIdx={0}
    explainCorrect="To'g'ri! Demo — ishlayotganini ko'rsatadi, harakat esa aniq aytadi: 'hoziroq sinab ko'ring'. Pitchni kuchli yakunlaydi."
    explainWrong={{ 1: 'Maqsad uzaytirish emas. Demo ishontiradi, harakat keyingi qadamni beradi.', 2: 'Texnik tafsilot kerak emas. Demo — natijani ko\'rsatadi.', 3: 'Salomlashuv emas — bu pitchning kuchli yakuni: ko\'rsat va chaqir.', default: 'Demo ishontiradi, harakat aniq chaqiradi.' }} />
);

// ===== SCREEN 6 — TREYLER STEPPER =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Endi pitchni treyler kabi yig'amiz: diqqatni tortamiz, muammoni eslatamiz, yechimni aytamiz va demo bilan chaqiramiz. Tugmani bosib, pitchning qurilishini kuzating.`, trigger: 'on_mount', waits_for: { type: 'flow_done' } }]);
  const [step, setStep] = useState(storedAnswer ? PARTS.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const isMobile = useIsMobile();
  const done = step >= PARTS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); setRunning(true); const tick = (i) => { setStep(i); if (i < PARTS.length) timer.current = setTimeout(() => tick(i + 1), 780); else { setRunning(false); audio.triggerEvent('flow_done'); } }; timer.current = setTimeout(() => tick(1), 350); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Treyler" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,13px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pitch treyler kabi <span className="italic" style={{ color: T.accent }}>qurilsa</span> — qanday bo'ladi?</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>diqqatni tortamiz</b>, muammoni eslatamiz, yechimni aytamiz va demo bilan <b style={{ color: T.ink }}>chaqiramiz</b>. Tugmani bosing.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PARTS.map((s, i) => { const on = step > i; return (<React.Fragment key={s.key}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '8px 13px', opacity: on ? 1 : 0.4, boxShadow: on ? `0 7px 18px -10px rgba(${T.shadowBase},0.18)` : 'none', transition: 'all 0.4s' }}><IcoChip color={on ? s.color : T.ink3} soft={on ? s.color + '1c' : '#ECEAE5'} size={31}>{s.ic}</IcoChip><div style={{ minWidth: 0, flex: 1 }}><p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 13, color: on ? s.color : T.ink3, margin: 0 }}>{s.label}</p>{on && <p style={{ fontFamily: G, fontStyle: 'italic', fontSize: 12.5, color: T.ink2, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>"{s.ex}"</p>}</div>{on && <span style={{ color: T.success }}>{Ico.check(15)}</span>}</div>{i < PARTS.length - 1 && <div style={{ display: 'flex', justifyContent: 'center', color: step > i + 1 ? T.success : T.ink3, transform: 'rotate(90deg)', lineHeight: 1, transition: 'color 0.3s' }}>{Ico.arrow(12)}</div>}</React.Fragment>); })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Qurilmoqda…' : (done ? '↻ Yana ko\'rish' : 'Pitchni qurish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq pitch: <b>diqqat tortish → muammo → yechim → demo+harakat</b>. Treyler kabi qiziqtiradi.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — KUCHLI vs ZAIF PITCH (toggle) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Bir mahsulot — ikki pitch. Biri to'rtta qismni bajaradi, biri shunchaki gapiradi. Ikkalasini bosib solishtiring.`, trigger: 'on_mount', waits_for: null }]);
  const [v, setV] = useState('strong');
  const [seen, setSeen] = useState(new Set(['strong']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  const STRONG = PARTS.map(p => ({ label: p.label, color: p.color, text: p.ex }));
  const WEAK = [{ label: 'Ochilish', color: T.ink3, text: 'Salom. Men bir loyiha qildim.' }, { label: 'Tafsilot', color: T.ink3, text: 'U HTML, CSS va biroz JavaScriptda yozilgan.' }, { label: 'Yana', color: T.ink3, text: 'Unda turli sahifalar bor, rangi ko\'k.' }, { label: 'Tugadi', color: T.ink3, text: 'Mana, xolos.' }];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Kuchli vs zaif" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi pitch sizni <span className="italic" style={{ color: T.accent }}>ishontiradi</span>?</h2></div>
        <Mentor>Bir mahsulot — ikki pitch. Biri 4 qismni bajaradi, biri shunchaki gapiradi. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'strong' ? 'chip-on' : ''}`} onClick={() => set('strong')}>Kuchli pitch</button>
              <button className={`chip ${v === 'weak' ? 'chip-on' : ''}`} onClick={() => set('weak')}>Zaif pitch</button>
            </div>
            <div key={v}><PitchCard items={v === 'strong' ? STRONG : WEAK} minH={210} /></div>
          </Col>
          <Col>
            {v === 'strong'
              ? <div className="frame-success fade-step" key="s"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ishontiradi</p><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi gap ushlaydi, muammo tanish, yechim aniq, demo chaqiradi. Tinglovchi sinab ko'rgisi keladi.</p></div>
              : <div className="frame-warn fade-step" key="w"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Zerikarli</p><p className="body" style={{ margin: 0, color: T.ink }}>Faqat texnik faktlar — na qiziqarli boshlama, na muammo, na chaqiriq. Tinglovchi befarq qoladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mahsulot bir xil — <b>pitch</b> hammasini hal qiladi. Fakt emas, hikoya soting.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MOSLASH: qism ↔ vazifa =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `To'rtta qism va ularning to'rtta vazifasi. Har bir qismni vazifasi bilan ulang: avval qismni, keyin vazifani bosing.`, trigger: 'on_mount', waits_for: null }]);
  const KEYS = ['ilgak', 'muammo', 'yechim', 'demo'];
  const NEEDS = [
    { id: 'yechim', text: 'Mahsulotni bir aniq jumlada aytadi' },
    { id: 'ilgak', text: 'Birinchi gap bilan diqqatni tortadi' },
    { id: 'demo', text: 'Ko\'rsatadi va keyingi qadamga chaqiradi' },
    { id: 'muammo', text: 'Tanish qiyinchilikni his qildiradi' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= 4;
  const pickP = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickN = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(13px,1.5vw,14.5px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Amaliyot" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/4 moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bir qismni <span className="italic" style={{ color: T.accent }}>vazifasi</span> bilan ulang</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>qismni</b>, keyin uning <b style={{ color: T.ink }}>vazifasini</b> bosing. To'rttasini to'g'ri ulang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Pitch qismlari</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {KEYS.map(id => { const s = PMETA[id]; const m = matched[id]; const on = sel === id; return (<button key={id} onClick={() => pickP(id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : s.color, display: 'inline-flex' }}>{m ? Ico.check(18) : s.ic}</span><span style={{ flex: 1, fontWeight: 600 }}>{s.label}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Vazifalar</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {NEEDS.map(n => { const m = matched[n.id]; const isWrong = wrong === n.id; return (<button key={n.id} onClick={() => pickN(n.id)} disabled={m || !sel} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ flex: 1 }}>{n.text}</span>{m && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(16)}</span>}</button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa qismning vazifasi. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Har bir qism pitchda nima uchun turishini bildingiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Pitch haqida eng to'g'ri fikr qaysi?"
    questionText="Pitch haqida eng to'g'ri fikr qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Pitch haqida eng <span className="italic" style={{ color: T.accent }}>to'g'ri</span> fikr qaysi?</h2></>}
    options={['Mahsulot haqida hamma narsani aytish kerak', 'Treyler kabi — faqat qiziqtirib, foydani aytish kerak', 'Qancha uzun bo\'lsa, shuncha yaxshi', 'Texnik tafsilotlar eng muhim']} correctIdx={1}
    explainCorrect="To'g'ri! Pitch — treyler: hammasini aytmaydi, qisqa va qiziqarli qilib foydani ko'rsatadi."
    explainWrong={{ 0: 'Hammasini aytsa, tinglovchi charchaydi. Faqat eng muhimini — qiziqtirib ayting.', 2: 'Uzunlik yomon. 2 daqiqada, qisqa va aniq bo\'lishi kerak.', 3: 'Texnik tafsilot tinglovchiga qiziq emas. Foydani ayting.', default: 'Pitch — treyler kabi: qisqa, qiziqarli, foydani ko\'rsatadi.' }} />
);

// ===== SCREEN 10 — ZAIF QISMNI TUZATISH (debugging) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Bir pitch yozilgan, lekin ochilishi zaif — texnik tafsilotdan boshlangan, hech kimni qiziqtirmaydi. Qaysi qator zaif ekanini toping va o'sha qatorni bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const WEAK_ILGAK = 'Bu sayt HTML va CSS da qilingan.';
  const lines = [
    { key: 'ilgak', label: 'Diqqat tortish', color: '#E0892B', bad: WEAK_ILGAK, good: PMETA.ilgak.ex },
    { key: 'muammo', label: 'Muammo', color: T.accent, bad: PMETA.muammo.ex, good: PMETA.muammo.ex },
    { key: 'yechim', label: 'Yechim', color: T.blue, bad: PMETA.yechim.ex, good: PMETA.yechim.ex },
    { key: 'demo', label: 'Demo + harakat', color: '#7B3FE4', bad: PMETA.demo.ex, good: PMETA.demo.ex }
  ];
  const clickLine = (k) => { if (found) return; if (k === 'ilgak') { setFound(true); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Birinchi gap texnik tafsilotdan boshlangan — bu qiziqtirmaydi. Kuchli gap bilan almashtiramiz.`); }, 300); } };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi pitch savol bilan, qiziqtirib boshlanadi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tuzatish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Zaif qatorni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu pitchda qaysi qator <span className="italic" style={{ color: T.accent }}>zaif</span>?</h2></div>
        <Mentor>Pitch yozilgan, lekin <b style={{ color: T.ink }}>ochilishi zaif</b> — texnik tafsilotdan boshlangan. Qaysi qator qiziqtirmaydi? O'sha qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">PITCH</span><span className="ai-bubble">Tekshirib ko'ring:</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.map(l => { const bad = found && !fixed && l.key === 'ilgak'; const txt = (l.key === 'ilgak' && !fixed) ? l.bad : l.good; return (<div key={l.key} onClick={() => { if (!found && !fixed) clickLine(l.key); }} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', gap: 2, background: bad ? T.accentSoft : (fixed && l.key === 'ilgak' ? T.successSoft : T.bg), borderRadius: 10, padding: '9px 12px', boxShadow: bad ? `inset 0 0 0 1.5px ${T.accent}` : 'none', transition: 'all 0.18s' }}><span className="mono" style={{ fontSize: 9.5, fontWeight: 700, color: l.color, textTransform: 'uppercase' }}>{l.label}</span><span style={{ fontFamily: G, fontSize: 13, color: T.ink, fontStyle: (l.key === 'ilgak' && !fixed) ? 'normal' : 'normal' }}>"{txt}"</span></div>); })}
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Kuchli birinchi gap bilan almashtirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>Tuzatildi — endi qiziqtiradi.</p>}
            </div>
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: birinchi gap <b>qiziqtirishi</b> kerak. Qaysi qator texnik fakt bo'lib, befarq qoldiradi?</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi gap "HTML va CSS da qilingan" deb boshlanyapti — bu hech kimni qiziqtirmaydi. Chap tugmani bosib, kuchli gapga almashtiring.</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ color: '#E0892B', display: 'inline-flex' }}>{p3.hook(34)}</div><p className="ta-h">Zaif boshlama — butun pitchni yo'qotadi</p><p className="ta-sub">Birinchi gap muammoga teginsin, faktga emas</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — ENG KUCHLI GAPNI TANLASH (build) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Endi pitchni o'zingiz yig'ing. Har bir qism uchun ikkita variant bor — kuchliroq, qiziqarliroq gapni tanlang. O'ngda pitch-kartangiz to'ladi.`, trigger: 'on_mount', waits_for: null }]);
  const POOL = {
    ilgak: { color: '#E0892B', a: 'Salom, men bir sayt qildim.', b: 'Uyingizda ishlatilmay yotgan narsalar bormi?' },
    muammo: { color: T.accent, a: 'Sayt ko\'k rangda.', b: 'Sotish qiyin — xaridor topish ko\'p vaqt oladi.' },
    yechim: { color: T.blue, a: 'Unda tugmalar bor.', b: 'Bozor — 3 daqiqada e\'lon, minglab xaridor.' },
    demo: { color: '#7B3FE4', a: 'Mana, xolos.', b: 'Velosipedni 2 daqiqada sotdim — siz ham sinab ko\'ring!' }
  };
  const KEYS = ['ilgak', 'muammo', 'yechim', 'demo'];
  const [pick, setPick] = useState({});
  const allGood = KEYS.every(k => pick[k] === 'b');
  const allPicked = KEYS.every(k => pick[k]);
  const workRef = useRef(null);
  const set = (k, v) => { if (allGood) return; setPick(prev => ({ ...prev, [k]: v })); };
  useEffect(() => {
    if (!allGood) return;
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [allGood]);
  const items = KEYS.map(k => ({ label: PMETA[k].label, color: POOL[k].color, text: pick[k] ? POOL[k][pick[k]] : '', ph: 'tanlanmagan…' }));
  return (
    <Stage eyebrow="Pitch yig'ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!allGood} label={allGood ? 'Davom etish' : (allPicked ? 'Eng kuchli gaplarni tanlang' : 'Har qismdan tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har qism uchun <span className="italic" style={{ color: T.accent }}>kuchliroq</span> gapni tanlang</h2></div>
        <Mentor>Har bir qism uchun ikkita variant — <b style={{ color: T.ink }}>qiziqarliroq</b> gapni tanlang. O'ngda pitch-kartangiz to'ladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {KEYS.map(k => (<div key={k}><p className="flow-label" style={{ margin: '0 0 6px', color: POOL[k].color }}>{PMETA[k].label}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{['a', 'b'].map(v => { const on = pick[k] === v; return (<button key={v} onClick={() => set(k, v)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '10px 13px', fontFamily: G, fontSize: 13, color: on ? '#fff' : T.ink, background: on ? POOL[k].color : T.paper, boxShadow: on ? `0 6px 14px -6px ${POOL[k].color}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}>"{POOL[k][v]}"</button>); })}</div></div>))}
          </Col>
          <Col>
            <p className="flow-label">Pitch-kartangiz</p>
            <PitchCard items={items} minH={200} />
            {allGood && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — kuchli pitch! Har qism qiziqtiradi va harakatga undaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="2 daqiqalik pitchda vaqtni qanday taqsimlash to'g'ri?"
    questionText="2 daqiqalik pitchda eng ko'p vaqtni nimaga ajratasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>2 daqiqada eng ko'p e'tibor <span className="italic" style={{ color: T.accent }}>nimaga</span>?</h2></>}
    options={['Texnik tafsilotlarni sanashga', 'Muammo va yechimni aniq ko\'rsatishga', 'Uzoq salomlashuvga', 'Qaysi dasturlarda qilganini aytishga']} correctIdx={1}
    explainCorrect="To'g'ri! Vaqtning katta qismi — muammo va yechimga. Tinglovchi 'nega kerak va qanday yordam beradi'ni tushunishi shart."
    explainWrong={{ 0: 'Texnik tafsilot vaqtni behuda yeydi. Muammo va yechimga e\'tibor bering.', 2: 'Salomlashuv qisqa bo\'lsin. Asosiysi — muammo va yechim.', 3: 'Qaysi dasturda qilingani tinglovchiga qiziq emas. Foydani ko\'rsating.', default: 'Eng ko\'p e\'tibor — muammo va yechimga.' }} />
);

// ===== SCREEN 13 — NAMUNA (to'liq Bozor pitchi) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Mana to'liq "Bozor" pitchi — kartada yozilgan. Har bir qatorni bosib, nega aynan shunday yozilganini ko'ring. Keyin o'zingiznikini yozasiz.`, trigger: 'on_mount', waits_for: null }]);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= PARTS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Namuna" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/4 qatorni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tayyor pitch: har qator <span className="italic" style={{ color: T.accent }}>nega</span> shunday?</h2></div>
        <Mentor>Mana to'liq "Bozor" pitchi. Har qatorni bosib, <b style={{ color: T.ink }}>nega</b> aynan shunday yozilganini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map(s => { const open = seen.has(s.key); return (<button key={s.key} onClick={() => tap(s.key)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '11px 14px', background: T.paper, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: active === s.key ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : (open ? `inset 0 0 0 1px ${T.success}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`), transition: 'all 0.18s' }}><span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span className="mono" style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase' }}>{s.label}</span>{open && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</span><span style={{ fontFamily: G, fontSize: 13, color: T.ink, fontStyle: 'italic' }}>"{s.ex}"</span></button>); })}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: PMETA[active].color, display: 'inline-flex' }}>{PMETA[active].ic}</span><span className="sk-wordbadge" style={{ color: PMETA[active].color, background: PMETA[active].color + '1c' }}>{PMETA[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{PMETA[active].job}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har qator o'z vazifasini bajaradi. Endi o'zingizning pitchingizni yozasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA (global savol) =====
const Screen14 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Sizga savol: odamlar aslida nimani sotib oladi — mahsulotnimi? Yo'q. Ular yechilgan muammoni, o'zining yaxshiroq holatini sotib oladi. Shuning uchun pitch faktni emas, hikoyani aytadi: muammodan yechimga.`, trigger: 'on_mount', waits_for: null }]);
  return (
    <Stage eyebrow="Qoida" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Odamlar aslida <span className="italic" style={{ color: T.accent }}>nimani</span> sotib oladi?</h2></div>
        <Mentor>Mahsulotni emas — <b style={{ color: T.ink }}>yechilgan muammoni</b>, o'zining yaxshiroq holatini. Shuning uchun pitch faktni emas, <b style={{ color: T.ink }}>hikoyani</b> aytadi: muammodan yechimga.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
              <IcoChip size={54} color="#E0892B" soft="#E0892B1c">{p3.film(28)}</IcoChip>
              <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Pitch = hikoya</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Fakt emas — yechilgan muammoni soting.</p></div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Yaxshi pitch — har doim</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map((s, i) => (<React.Fragment key={s.key}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.label}</span></div>{i < PARTS.length - 1 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: O'Z PITCHING + REPETITSIYA =====
const emptyPitch = () => ({ ilgak: '', muammo: '', yechim: '', demo: '' });
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Mana eng muhim qadam. O'z mahsulotingiz uchun 2 daqiqalik pitch yozing: diqqat tortish, muammo, yechim va demo bilan harakat. O'ngda pitch-kartangiz to'ladi. Keyin taymerni bosib, ovoz chiqarib mashq qiling.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [pit, setPit] = useState(() => storedAnswer?.pitch || emptyPitch());
  const filled = PARTS.filter(p => pit[p.key] && pit[p.key].trim().length >= 3).length;
  const passed = filled >= 4;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, pitch: pit, stage: 'final', screenIdx: screen });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Ajoyib! Pitchingiz tayyor. Endi taymerni bosib, oyna oldida ovoz chiqarib mashq qiling.`); }, 300);
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setPit(prev => ({ ...prev, [k]: v }));
  const items = PARTS.map(p => ({ label: p.label, color: p.color, text: pit[p.key], ph: p.ex }));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${filled}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z mahsulotingiz uchun <span className="italic" style={{ color: T.accent }}>2 daqiqalik pitch</span> yozing</h2></div>
        <Mentor>To'rt qismni yozing: <b style={{ color: T.ink }}>diqqat tortish, muammo, yechim, demo+harakat</b>. O'ngda pitch-kartangiz to'ladi — keyin <b style={{ color: T.ink }}>ovoz chiqarib</b> mashq qiling.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {PARTS.map(p => { const ok = pit[p.key] && pit[p.key].trim().length >= 3; return (<div key={p.key} style={{ background: T.paper, borderRadius: 12, padding: '11px 13px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}><span style={{ color: ok ? T.success : p.color, display: 'inline-flex' }}>{ok ? Ico.check(15) : p.ic}</span><span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', color: T.ink, textTransform: 'uppercase' }}>{p.label}</span></div><textarea value={pit[p.key]} onChange={e => upd(p.key, e.target.value)} placeholder={p.ex} rows={2} style={{ width: '100%', fontFamily: G, fontSize: 13.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '8px 11px', resize: 'vertical', minHeight: 38, outline: 'none', lineHeight: 1.45, boxSizing: 'border-box' }} /></div>); })}
          </Col>
          <Col>
            <p className="flow-label">Pitch-kartangiz</p>
            <PitchCard items={items} minH={188} />
            {passed && <RehearseTimer />}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi Demo Day'da shu pitch bilan saytingizni taqdim qilasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN + DEMO DAY =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz! Endi siz mahsulot menejeri kabi o'ylaysiz: kim uchun, qanday tartibda va qanday qilib pitch qilish. Bularning hammasi Demo Day uchun. O'sha kuni o'zingiz xohlagan saytni qurib, pitch qilasiz. Omad!", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['Pitch — treyler: qiziqtiradi, hammasini aytmaydi', 'Diqqat tortish: birinchi gap e\'tiborni tortadi', '4 qism: diqqat tortish → muammo → yechim → demo+harakat', 'Odamlar yechilgan muammoni sotib oladi'];
  const HOMEWORK = [{ b: 'Pitchni mashq qiling', t: '— oyna oldida 2 daqiqada ovoz chiqarib ayting' }, { b: 'Do\'stga ayting', t: '— u 2 daqiqada tushundimi? Qiziqdimi?' }, { b: 'Demo Day\'ga tayyorlaning', t: '— o\'z saytingiz va pitchingizni o\'ylab qo\'ying' }];
  const GLOSSARY = [{ b: 'Pitch', t: '— mahsulotni qisqa, qiziqarli tushuntirish' }, { b: 'Diqqat tortish', t: '— diqqatni tortuvchi birinchi gap' }, { b: 'Demo', t: '— mahsulot ishlayotganini ko\'rsatish' }, { b: 'Harakatga chaqiruv (CTA)', t: '— "hoziroq sinab ko\'ring"' }, { b: 'Demo Day', t: '— o\'z mahsulotingizni taqdim qilish kuni' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM bloki tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>pitch</span> qila olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Kim uchun, qanday tartibda va qanday pitch — hammasini o\'rgandingiz. Demo Day\'ga tayyorsiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Demo Day'ga tayyorgarlik</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Pitchingizni jonli qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Demo Day — o'zingiz xohlagan saytni qurib, pitch qilasiz! 🎬</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson3({ lang: langProp, onFinished }) {
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
    const finalCorrect = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean).filter(a => a.correct).length;
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
        .fade-up { animation: fade-in-up 0.45s cubic-bezier(.2,.7,.2,1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .fade-step { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes dl-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.16); } }
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
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.16); }
        .option:hover:not(:disabled) { background: #FDFBF7; transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -8px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.5 !important; box-shadow: none !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.34) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 9px 14px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -6px rgba(${T.shadowBase},0.22); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover { transform: translateY(-1px); }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -7px rgba(${T.shadowBase},0.16); }

        /* === HOOK OPSIYALARI === */
        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.16); }
        .hook-option:hover:not(:disabled):not(.on) { transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
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
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }

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
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === BRAUZER MAKETI (HTML darslar dizayni) === */
        .bp-window { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 12px 30px -8px rgba(${T.shadowBase},0.2); }
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-url { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; display: flex; align-items: center; gap: 6px; } .lock { color: ${T.success}; font-size: 8px; }
        .bp-body { padding: clamp(13px,2.2vw,18px); }
        .pg-in { animation: pg-in 0.38s cubic-bezier(.2,.7,.2,1); } @keyframes pg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .site-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid ${T.ink3}40; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .site-brand { display: inline-flex; align-items: center; gap: 8px; } .site-logo { width: 24px; height: 24px; border-radius: 6px; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 13px; } .site-name { font-family: 'Manrope'; font-weight: 700; color: ${T.ink}; font-size: 14px; }
        .site-nav { display: inline-flex; gap: 12px; font-family: 'Manrope'; font-size: 12px; color: ${T.ink2}; }
        .site-h3 { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,21px); color: ${T.ink}; margin: 0 0 8px; }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 16px 18px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); animation: fade-step 0.34s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === CONN === */
        .conn-flow { display: flex; align-items: center; justify-content: center; gap: 6px; background: ${T.paper}; border-radius: 16px; padding: 24px 16px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .conn-node { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; transition: opacity 0.3s; }
        .conn-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .conn-sub { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; text-align: center; }
        .conn-link { display: flex; align-items: center; gap: 3px; flex: 1; max-width: 150px; }
        .conn-line { flex: 1; height: 3px; background: ${T.success}; border-radius: 2px; transition: background 0.3s; }
        .conn-sig { display: inline-flex; }
        .conn-link.cut .conn-line { background: ${T.ink3}; opacity: 0.5; border-top: 2px dashed ${T.accent}; height: 0; }
        .conn-link.cut { animation: shake 0.3s; }
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }

        /* === ALGO BUILD === */
        .algo-build { background: ${T.paper}; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 7px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .algo-line { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: ${T.bg}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; } .ta-bulb { } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === YAKUN === */
        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { display: inline-flex; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 400; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; flex-shrink: 0; margin-top: 1px; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.12); overflow: hidden; }
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
