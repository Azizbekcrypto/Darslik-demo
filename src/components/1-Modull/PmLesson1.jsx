import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// PM 1-DARS — KIM MENING FOYDALANUVCHIM? — PLATFORM STANDARD v16
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

const LESSON_META = { lessonId: 'pm-audience-01-v16', lessonTitle: { uz: 'Kim mening foydalanuvchim?', ru: 'Кто мой пользователь?' } };
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

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, audioState, narrow, mentorStatic }) => {
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

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Telefoningizda o'nlab ilova bor. Ba'zilarini har kuni ochasiz, ba'zilarini esa bir marta ham emas. Sizningcha, asosiy farq nimada? Javobingizni tanlang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const APPS = [{ ic: Ico.youtube(26), n: 'YouTube' }, { ic: Ico.market(26), n: 'Bozor' }, { ic: Ico.taxi(26), n: 'Taksi' }, { ic: Ico.telegram(26), n: 'Telegram' }];
  const OPTS = [
    { id: 'a', label: 'Chiroyli ko\'rinishi uchun' },
    { id: 'b', label: 'Ular mening biror muammomni yechgani uchun' },
    { id: 'c', label: 'Ko\'p reklama qilingani uchun' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Nega ba'zi ilovalarni har kuni ochasiz, ba'zilarini esa <span className="italic" style={{ color: T.accent }}>hech qachon</span>?</h1>
        <Mentor>Telefoningizda o'nlab ilova bor. Ba'zilarini <b style={{ color: T.ink }}>har kuni</b> ochasiz, ba'zilarini esa — bir marta ham emas. Asosiy farq nimada deb o'ylaysiz?</Mentor>
        <Split>
          <Col>
            <p className="flow-label">Har kuni ochadiganlaringiz</p>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {APPS.map((o, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 14px', borderRadius: 13, background: T.paper, boxShadow: `0 6px 16px -7px rgba(${T.shadowBase},0.16)` }}>
                  <span style={{ color: T.accent, display: 'inline-flex', animation: `dl-pulse 1s ease-in-out infinite ${i * 0.16}s` }}>{o.ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{o.n}</span>
                </div>
              ))}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, asosiy farq nimada?</p>
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
            {picked !== null && <p className="hook-ack fade-step">Har kuni ochadigan sayt sizning bir <b>muammoyingizni</b> yechadi. Mana shu sirni ochamiz: sayt — kimningdir muammosiga yechim.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Dasturchi kod yozadi. Lekin undan oldin mahsulot menejeri uchta oddiy savol beradi: kim, qanday muammo, qanday yechim. Bugun aynan shu fikrlashni o'rganamiz, beshta qadamda.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Sayt — kimningdir muammosiga yechim', tag: '' },
    { text: 'Muammoni qanday topamiz', tag: '' },
    { text: 'Foydalanuvchi — aniq kim?', tag: 'kim uchun' },
    { text: 'Muammoni yechimga ulaymiz', tag: '' },
    { text: 'O\'z g\'oyangizni tuzasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Idea = ({ ic, h, t }) => (
    <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
      <IcoChip>{ic}</IcoChip>
      <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>{h}</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>{t}</p></div>
    </div>
  );
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Idea ic={Ico.solution(22)} h="SAYT = YECHIM" t="Har bir sayt muammoga yechim" />
        <Idea ic={Ico.problem(22)} h="3 SAVOL" t="Kim? · Qanday muammo? · Qanday yechim?" />
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ keyingi darslarda shu yechimni HTML'da quramiz</p>
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
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Bugun mahsulot menejeridek fikrlashni o'rganamiz!</span></h2>
        </div>
        <Mentor>Dasturchi kod yozadi. Lekin undan oldin kimdir muhim savol beradi: <b style={{ color: T.ink }}>bu sayt kimga va qanday muammo uchun kerak?</b> Bugun aynan shu fikrlashni ochamiz — 5 qadamda.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — SAYT = MUAMMOGA YECHIM (tap real sites) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Har bir mashhur sayt tasodifan paydo bo'lmagan — u kimningdir real muammosini yechgan. Har bir saytni bosib, avval qanday qiyin edi va sayt nimani o'zgartirganini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const SITES = {
    youtube: { ic: Ico.youtube(26), name: 'YouTube', url: 'youtube.com', mock: { logo: 'Y', color: '#FF0000', name: 'Video', headline: 'Bugun nima ko\'ramiz?', rows: ['Dasturlash darsi · 12 daq', 'Sayohat vlogi · 8 daq'], cta: 'Ko\'rish' }, before: 'Sevimli ko\'rsatuvni faqat televizor bergan vaqtda ko\'ra olardingiz.', after: 'Istalgan videoni, istalgan vaqtda — bir bosishda.' },
    market: { ic: Ico.market(26), name: 'Bozor', url: 'bozor.uz', mock: { logo: 'B', color: '#7B3FE4', name: 'Bozor', headline: 'Soting yoki sotib oling', rows: ['Velosiped — 450 000', 'Telefon — 1 200 000'], cta: 'E\'lon berish' }, before: 'Ortiqcha buyumingizni sotmoqchisiz, lekin xaridor topish juda qiyin edi.', after: 'Bir necha daqiqada e\'lon berasiz — minglab xaridor ko\'radi va sotib oladi.' },
    taxi: { ic: Ico.taxi(26), name: 'Taksi', url: 'taksi.uz', mock: { logo: 'T', color: '#FFB300', name: 'Taksi', headline: 'Mashina chaqiring', sub: 'Uyingizgacha 5 daqiqada keladi. Narx oldindan ma\'lum: 18 000 so\'m.', cta: 'Chaqirish' }, before: 'Yo\'l chetida taksi kutardingiz, narxi noaniq edi.', after: 'Ilovada chaqirasiz — mashina ham, narx ham oldindan ma\'lum.' },
    telegram: { ic: Ico.telegram(26), name: 'Telegram', url: 'telegram.org', mock: { logo: 'T', color: '#29A9EB', name: 'Telegram', headline: 'Suhbatlar', rows: ['Ona — Salom, qalaysan?', 'Do\'st — Bugun chiqamizmi?'], cta: 'Yozish' }, before: 'Uzoqdagi do\'st bilan tez gaplashish qiyin va qimmat edi.', after: 'Bepul, bir zumda xabar va ovozli qo\'ng\'iroq.' }
  };
  const [active, setActive] = useState('market');
  const [seen, setSeen] = useState(new Set(['market']));
  const done = seen.size === 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = SITES[active];
  return (
    <Stage eyebrow="Sayt = yechim" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 saytni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sevimli saytlaringiz qanday <span className="italic" style={{ color: T.accent }}>muammoni</span> yechgan?</h2></div>
        <Mentor>Har bir mashhur sayt kimningdir <b style={{ color: T.ink }}>real muammosini</b> yechgan. Saytni bosib, uni va <b style={{ color: T.ink }}>avval</b> qanday qiyin bo'lganini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Saytni tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.keys(SITES).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', border: 'none', borderRadius: 13, padding: '13px 12px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}>
                  <span style={{ display: 'inline-flex' }}>{SITES[k].ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink }}>{SITES[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}
                </button>
              ))}
            </div>
            <div className="frame-warn fade-step" key={active + 'b'} style={{ marginTop: 2 }}>
              <p className="flow-label" style={{ margin: '0 0 4px', color: T.accent }}>Avval qanday edi (muammo)</p>
              <p className="body" style={{ color: T.ink, margin: 0 }}>{cur.before}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bir sayt bir <b>qiyinchilikni</b> osonlikka aylantirgan. Sayt = muammoga yechim.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Sayt bilan (yechim)</p>
            <Preview url={cur.url} minH={188}><SiteMock {...cur.mock} /></Preview>
            <p className="body fade-step" key={active + 'a'} style={{ color: T.ink2, margin: 0, fontSize: 13.5 }}>{cur.after}</p>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — MUAMMO = SAYTNING YURAGI (conn-flow) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Sayt va muammo bir-biriga bog'langan. Sayt muammoni yechib turadi. Lekin muammoni olib tashlasak-chi? Tugmani bosib, o'z ko'zingiz bilan ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [gone, setGone] = useState(false);
  const [touched, setTouched] = useState(false);
  const done = touched;
  const toggle = () => { setGone(g => !g); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Muammo — yurak" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Sinab ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agar muammo bo'lmasa, sayt <span className="italic" style={{ color: T.accent }}>kerak</span> bo'larmidi?</h2></div>
        <Mentor>Sayt muammoni yechib turadi — ular bir-biriga <b style={{ color: T.ink }}>bog'langan</b>. Lekin muammoni olib tashlasak-chi? Tugmani bosib ko'ring.</Mentor>
        <div className="conn-flow fade-up delay-1">
          <div className="conn-node" style={{ opacity: gone ? 0.4 : 1 }}><span style={{ color: T.accent, display: 'inline-flex' }}>{Ico.problem(34)}</span><span className="conn-lbl">Muammo</span><span className="conn-sub">{gone ? 'olib tashlandi' : 'odamni qiynaydi'}</span></div>
          <div className={`conn-link ${gone ? 'cut' : ''}`}>
            <span className="conn-line" />
            <span className="conn-sig" style={{ color: gone ? T.ink3 : T.accent, display: 'inline-flex' }}>{gone ? Ico.problem(16) : Ico.arrow(18)}</span>
            <span className="conn-line" />
          </div>
          <div className="conn-node" style={{ opacity: gone ? 0.4 : 1 }}><span style={{ color: gone ? T.ink3 : T.success, display: 'inline-flex' }}>{Ico.solution(34)}</span><span className="conn-lbl">Sayt</span><span className="conn-sub">{gone ? 'endi keraksiz' : 'yechim beradi'}</span></div>
        </div>
        <button className="btn" onClick={toggle} style={{ alignSelf: 'flex-start' }}>{gone ? 'Muammoni qaytarish' : 'Muammoni olib tashlash'}</button>
        {done && (
          gone
            ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muammo yo'q — sayt ham <b>keraksiz</b> bo'lib qoldi. Hech kim ochmaydi.</p></div>
            : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muammo bor — sayt unga yechim. Demak <b>muammo — har bir saytning yuragi</b>.</p></div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Sayt birinchi navbatda nima uchun yaratiladi?"
    questionText="Sayt birinchi navbatda nima uchun yaratiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sayt birinchi navbatda <span className="italic" style={{ color: T.accent }}>nima uchun</span> yaratiladi?</h2></>}
    options={['Chiroyli ko\'rinishi uchun', 'Kimningdir real muammosini yechish uchun', 'Ko\'p tugma bo\'lishi uchun', 'Shunchaki, sababsiz']} correctIdx={1}
    explainCorrect="To'g'ri! Sayt — bu vosita: u aniq odamning aniq muammosini yechadi. Dizayn va tugmalar keyin, shu maqsadga xizmat qiladi."
    explainWrong={{
      0: 'Chiroylilik yordam beradi, lekin asosiy sabab emas. Sayt avvalo muammoni yechadi.',
      2: 'Tugmalar soni maqsad emas. Maqsad — kimningdir muammosini yechish.',
      3: 'Aksincha — yaxshi sayt aniq sabab bilan yaratiladi.',
      default: 'Sayt kimningdir real muammosini yechish uchun yaratiladi.'
    }} />
);

// ===== SCREEN 5 — MUAMMO ANIQ KIMNIKI? (toggle) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Muammo havoda turmaydi — u aniq odamlarniki. Hamma uchun degan gap aslida hech kim uchun degani. Ikki holatni almashtirib ko'ring: noaniq va aniq.`, trigger: 'on_mount', waits_for: null }]);
  const [mode, setMode] = useState('vague');
  const [seen, setSeen] = useState(new Set(['vague']));
  const done = seen.size >= 2;
  const set = (m) => { setMode(m); setSeen(prev => { const n = new Set(prev); n.add(m); return n; }); };
  const V = {
    vague: { title: 'Hamma uchun ovqat sayti', note: 'Kim bu odam? Unga nima kerak? Hech narsa aniq emas.' },
    specific: { title: 'Vaqti yo\'q talabalar uchun: 15 daqiqada tayyor retseptlar', note: 'Aniq odam, aniq ehtiyoj — endi nima ko\'rsatish kerakligi ham ravshan.' }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Foydalanuvchi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu muammo aniq <span className="italic" style={{ color: T.accent }}>kimniki</span>?</h2></div>
        <Mentor>Muammo o'z-o'zidan turmaydi — u <b style={{ color: T.ink }}>aniq odamlarniki</b>. "Hamma uchun" degan gap aslida "hech kim uchun" degani. Almashtirib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${mode === 'vague' ? 'chip-on' : ''}`} onClick={() => set('vague')}>Noaniq</button>
              <button className={`chip ${mode === 'specific' ? 'chip-on' : ''}`} onClick={() => set('specific')}>Aniq odam</button>
            </div>
            <div className="demo-swap" key={mode} style={{ background: T.paper, borderRadius: 14, padding: '20px 18px', boxShadow: `0 8px 20px -7px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${mode === 'specific' ? T.success : T.ink3}` }}>
              <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(16px,2.1vw,19px)', color: T.ink, margin: 0 }}>{V[mode].title}</p>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" key={mode + 'n'}>
              <p className="eyebrow" style={{ color: mode === 'specific' ? T.success : T.accent, margin: '0 0 6px' }}>{mode === 'specific' ? 'Aniq' : 'Noaniq'}</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>{V[mode].note}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aniq odamni tanlash — bu cheklov emas, <b>kuch</b>. Aniq foydalanuvchi = aniq, foydali yechim.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Hamma uchun qilingan sayt nega kam ishlaydi?"
    questionText="'Hamma uchun' qilingan sayt nega kam ishlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>"Hamma uchun" sayt nega <span className="italic" style={{ color: T.accent }}>kam</span> ishlaydi?</h2></>}
    options={['Hech kim o\'ziga keraklini topa olmaydi', 'Juda chiroyli bo\'lib ketadi', 'Tez yuklanadi', 'Ko\'p odam kiradi']} correctIdx={0}
    explainCorrect="To'g'ri! Hammaga gapirgan sayt hech kimga aniq gapirmaydi. Aniq odam tanlansa, uning muammosini chuqur yechib bo'ladi."
    explainWrong={{
      1: 'Chiroylilik bilan bog\'liq emas. Muammo — aniqlik yo\'qligida.',
      2: 'Tezlik boshqa mavzu. Asosiy muammo — kim uchun ekani aniq emas.',
      3: 'Odam kirsa ham, o\'ziga keraklini topmay ketadi.',
      default: 'Aniqlik yo\'q — hech kim o\'ziga keraklini topa olmaydi.'
    }} />
);

// ===== SCREEN 6 — QAYSI MUAMMO USTIDA ISHLASH KERAK? =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Quyidagi uch gapdan qaysi biri ustida ishlashga arziydigan real muammo? To'g'ri javobni tanlang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const OPTS = [
    { id: 0, label: 'Men shunchaki chiroyli sayt qilmoqchiman', why: 'Bu — istak, lekin muammo emas. Kimga va nima uchun kerakligi yo\'q.' },
    { id: 1, label: 'Tengdoshlarim dars jadvalini doim unutishadi', why: 'Mana bu — real muammo: aniq odam, aniq qiyinchilik. Bundan yaxshi g\'oya tug\'iladi.' },
    { id: 2, label: 'Sayt ko\'k rangda bo\'lsa zo\'r bo\'lardi', why: 'Bu — dizayn tafsiloti, muammo emas. Avval kimning qaysi muammosini yechishni hal qilamiz.' }
  ];
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const solved = picked === 1;
  const pick = (id) => { if (solved) return; setPicked(id); if (id === 1 && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: id }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Tekshiruv" screen={screen} narrow audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'Real muammoni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p>
          <h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi biri — ustida ishlashga arziydigan <span className="italic" style={{ color: T.accent }}>real muammo</span>?</h2>
        </div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {OPTS.map(o => {
            let cls = 'option';
            if (solved) { if (o.id === 1) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (o.id === picked) cls += ' option-picked-wrong';
            return (<button key={o.id} className={cls} disabled={solved} onClick={() => pick(o.id)} style={{ padding: 'clamp(13px,1.9vw,16px) clamp(15px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', textAlign: 'left' }}>{o.label}</button>);
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? 'To\'g\'ri' : 'Qaytadan'}</p>
          <p className="body" style={{ margin: 0 }}>{picked !== null ? OPTS[picked].why : ''}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — G'OYA QANDAY TUG'ILADI (stepper) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Yaxshi g'oya uchta qadamda tug'iladi: avval kim, keyin uning muammosi, oxirida yechim. Bir misolda ko'rsataman. Tugmani bosib, g'oyaning yig'ilishini kuzating.`, trigger: 'on_mount', waits_for: { type: 'flow_done' } }]);
  const STEPS = [
    { ic: Ico.user(24), h: 'KIM', t: 'Maktab o\'quvchilari' },
    { ic: Ico.problem(24), h: 'MUAMMO', t: 'Sinflarni topa olishmaydi' },
    { ic: Ico.solution(24), h: 'YECHIM', t: 'Xarita ko\'rsatadigan sayt' }
  ];
  const [step, setStep] = useState(storedAnswer ? STEPS.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = step >= STEPS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setStep(0); setRunning(true);
    const tick = (i) => { setStep(i); if (i < STEPS.length) timer.current = setTimeout(() => tick(i + 1), 760); else { setRunning(false); audio.triggerEvent('flow_done'); } };
    timer.current = setTimeout(() => tick(1), 350);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="G'oya tug'iladi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yaxshi g'oya qanday <span className="italic" style={{ color: T.accent }}>tug'iladi</span>?</h2></div>
        <Mentor>Yaxshi g'oya uchta qadamda tug'iladi: avval <b style={{ color: T.ink }}>kim</b>, keyin uning <b style={{ color: T.ink }}>muammosi</b>, oxirida <b style={{ color: T.ink }}>yechim</b>. Tugmani bosib, g'oyaning yig'ilishini kuzating.</Mentor>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map((s, i) => {
            const on = step > i;
            return (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: T.paper, borderRadius: 14, padding: 'clamp(14px,2vw,18px)', opacity: on ? 1 : 0.4, boxShadow: on ? `0 8px 20px -8px rgba(${T.shadowBase},0.18)` : 'none', transition: 'all 0.4s' }}>
                  <IcoChip color={on ? T.accent : T.ink3} soft={on ? T.accentSoft : '#ECEAE5'}>{s.ic}</IcoChip>
                  <div><p className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: on ? T.accent : T.ink3, margin: '0 0 2px' }}>{s.h}</p><p className="body" style={{ margin: 0, color: on ? T.ink : T.ink3, fontWeight: 500 }}>{s.t}</p></div>
                  {on && <span style={{ marginLeft: 'auto', color: T.success }}>{Ico.check(18)}</span>}
                </div>
                {i < STEPS.length - 1 && <div style={{ display: 'flex', justifyContent: 'center', color: step > i + 1 ? T.success : T.ink3, transform: 'rotate(90deg)', transition: 'color 0.3s' }}>{Ico.arrow(18)}</div>}
              </React.Fragment>
            );
          })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Yig\'ilmoqda…' : (done ? '↻ Yana ko\'rish' : 'G\'oyani yig\'ish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq g'oya: <b>kim + muammo + yechim</b>. Uchtasi birga bo'lsa, nima qurishni aniq bilasiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — BIR ODAM, BIR XIL EHTIYOJMI? (tap users) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Bozor saytiga, ya'ni marketplacega turli odamlar keladi — sotuvchi, xaridor, kuryer. Har biri butunlay boshqa muammo bilan keladi. Har bir odamni bosing, u nimani izlashini toping.`, trigger: 'on_mount', waits_for: null }]);
  const USERS = {
    seller: { ic: Ico.market(26), name: 'Sotuvchi', want: 'Ortiqcha buyumini tez SOTISH va ko\'proq xaridor topish. Eng katta muammosi — sotish!' },
    buyer: { ic: Ico.user(26), name: 'Xaridor', want: 'Arzon narx, ishonchli mahsulot va tez yetkazib berish.' },
    courier: { ic: Ico.map(26), name: 'Kuryer', want: 'Aniq manzil va qulay yo\'nalish — tez yetkazish uchun.' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Har xil odam" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bozorga kelgan har kim <span className="italic" style={{ color: T.accent }}>bir xil</span> narsa izlaydimi?</h2></div>
        <Mentor>Bozor saytiga (<b style={{ color: T.ink }}>marketplace</b>) turli odamlar keladi: <b style={{ color: T.ink }}>sotuvchi</b> sotmoqchi, <b style={{ color: T.ink }}>xaridor</b> sotib olmoqchi. Har birining muammosi boshqacha. Har birini bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.keys(USERS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '13px 15px', background: T.paper, color: active === k ? T.accent : T.ink2, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -7px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}>
                  <span style={{ display: 'inline-flex' }}>{USERS[k].ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, color: T.ink }}>{USERS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ color: T.accent, display: 'inline-flex' }}>{USERS[active].ic}</span><span className="sk-wordbadge">{USERS[active].name}</span></span>
                <p className="flow-label" style={{ margin: '13px 0 4px' }}>U nimani izlaydi?</p>
                <p className="body" style={{ color: T.ink, margin: 0 }}>{USERS[active].want}</p>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir odamni bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun avval <b>aniq bir odamni</b> tanlaymiz — uning muammosini yaxshi yechish uchun.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Yaxshi g'oya qayerdan boshlanadi?"
    questionText="Yaxshi g'oya qayerdan boshlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi g'oya <span className="italic" style={{ color: T.accent }}>qayerdan</span> boshlanadi?</h2></>}
    options={['Chiroyli rang tanlashdan', 'Aniq odamning real muammosidan', 'Mashhur saytni nusxalashdan', 'Ko\'p sahifa rejalashtirishdan']} correctIdx={1}
    explainCorrect="To'g'ri! G'oya aniq odam va uning real muammosidan boshlanadi. Qolgan hammasi shundan keyin keladi."
    explainWrong={{
      0: 'Rang — eng oxirgi qadam. Avval kim va qanday muammo ekanini bilamiz.',
      2: 'Nusxalash g\'oya bermaydi. O\'z foydalanuvchingizning muammosidan boshlang.',
      3: 'Sahifalar soni keyin hal bo\'ladi. Avval — odam va uning muammosi.',
      default: 'G\'oya aniq odamning real muammosidan boshlanadi.'
    }} />
);

// ===== SCREEN 10 — MUAMMO ↔ YECHIM moslash =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Endi o'zingizni sinang. Uchta muammo va uchta yechim bor. Har bir muammoni to'g'ri yechimi bilan ulang: avval muammoni, keyin unga mos yechimni bosing.`, trigger: 'on_mount', waits_for: null }]);
  const PROBLEMS = [
    { id: 'bus', ic: Ico.clock(20), text: 'Avtobus qachon kelishini bilmaysiz' },
    { id: 'hw', ic: Ico.book(20), text: 'Vazifani qachon topshirishni unutasiz' },
    { id: 'book', ic: Ico.map(20), text: 'Kutubxonadagi kitobni topib bo\'lmaydi' }
  ];
  const SOLUTIONS = [
    { id: 'hw', text: 'Vazifalar va muddatlar ro\'yxati' },
    { id: 'book', text: 'Kitoblarni qidirish sahifasi' },
    { id: 'bus', text: 'Avtobus vaqtini ko\'rsatadigan sayt' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= 3;
  const pickP = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickS = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '13px 15px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(13.5px,1.6vw,15px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Amaliyot" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/3 moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi yechim qaysi <span className="italic" style={{ color: T.accent }}>muammoga</span> mos?</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>muammoni</b> tanlang, keyin unga mos <b style={{ color: T.ink }}>yechimni</b> bosing. Uchalasini to'g'ri ulang.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Muammolar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PROBLEMS.map(p => {
                const m = matched[p.id]; const on = sel === p.id;
                return (
                  <button key={p.id} onClick={() => pickP(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -7px rgba(${T.shadowBase},0.16)` })}>
                    <span style={{ color: m ? T.success : T.accent, display: 'inline-flex' }}>{m ? Ico.check(18) : p.ic}</span>
                    <span style={{ flex: 1 }}>{p.text}</span>
                  </button>
                );
              })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Yechimlar</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {SOLUTIONS.map(s => {
                const m = matched[s.id]; const isWrong = wrong === s.id;
                return (
                  <button key={s.id} onClick={() => pickS(s.id)} disabled={m || !sel} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -7px rgba(${T.shadowBase},0.16)` })}>
                    <span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(18) : Ico.solution(18)}</span>
                    <span style={{ flex: 1 }}>{s.text}</span>
                  </button>
                );
              })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu yechim boshqa muammoga mos. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Har bir muammoga to'g'ri yechim topdingiz — bu mahsulot menejerining asosiy ishi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — G'OYANI BO'LAKLARDAN YIG'ISH =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Endi g'oyani o'zingiz yig'ing. Lekin diqqat: uchala bo'lak bitta odamga mos kelishi kerak — kim, uning muammosi va aynan o'sha muammoning yechimi.`, trigger: 'on_mount', waits_for: null }]);
  // har bir g'oya — bitta butun (guruh). To'g'ri g'oya = uchala bo'lak bir guruhdan.
  const GROUPS = {
    market: { kim: 'Ortiqcha buyumi bor odamlar', muammo: 'Sotmoqchi, lekin xaridor topolmaydi', yechim: 'Marketplace — e\'lon joylash sayti' },
    baby: { kim: 'Kichkina bolali onalar', muammo: 'Bola uxlash vaqtini eslolmaydi', yechim: 'Uyqu jadvali eslatmasi' },
    exam: { kim: 'Imtihonga tayyorlanayotgan o\'quvchilar', muammo: 'Qaysi mavzuni takrorlashni bilmaydi', yechim: 'Mavzular ro\'yxati va test' }
  };
  const ROWS = [
    { key: 'kim', label: 'KIM', ic: Ico.user(18), color: T.blue, order: ['market', 'baby', 'exam'] },
    { key: 'muammo', label: 'MUAMMO', ic: Ico.problem(18), color: T.accent, order: ['baby', 'exam', 'market'] },
    { key: 'yechim', label: 'YECHIM', ic: Ico.solution(18), color: T.success, order: ['exam', 'market', 'baby'] }
  ];
  const [pick, setPick] = useState({ kim: null, muammo: null, yechim: null });
  const keys = ['kim', 'muammo', 'yechim'];
  const allPicked = keys.every(k => pick[k] !== null);
  const matched = allPicked && pick.kim === pick.muammo && pick.muammo === pick.yechim;
  const set = (k, g) => setPick(prev => ({ ...prev, [k]: prev[k] === g ? null : g }));
  useEffect(() => { if (matched && storedAnswer === undefined) onAnswer(screen, { correct: true, group: pick.kim }); }, [matched]);
  const META = { kim: ROWS[0], muammo: ROWS[1], yechim: ROWS[2] };
  const low = (s) => s ? s[0].toLowerCase() + s.slice(1) : '';
  return (
    <Stage eyebrow="G'oya yig'ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!matched} label={matched ? 'Davom etish' : (allPicked ? 'Mos kelmadi — tekshiring' : 'Uchala bo\'lakni tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">G'oyani <span className="italic" style={{ color: T.accent }}>bo'laklardan</span> yig'a olasizmi?</h2></div>
        <Mentor>Har bir qatordan <b style={{ color: T.ink }}>bittadan</b> tanlang. Lekin diqqat: uchalasi <b style={{ color: T.ink }}>bitta odamga</b> mos kelishi kerak — kim, uning muammosi va aynan o'sha muammoning yechimi.</Mentor>
        <div className="split">
          <Col>
            {ROWS.map(r => (
              <div key={r.key}>
                <p className="flow-label" style={{ margin: '0 0 6px', color: r.color }}>{r.label}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {r.order.map(g => (
                    <button key={g} className="gchip" onClick={() => set(r.key, g)} style={pick[r.key] === g ? { background: r.color, color: '#fff', boxShadow: `0 6px 14px -6px ${r.color}` } : undefined}>{GROUPS[g][r.key]}</button>
                  ))}
                </div>
              </div>
            ))}
          </Col>
          <Col>
            <p className="flow-label">Mening g'oyam</p>
            <div className="algo-build fade-up delay-1" style={{ minHeight: 140 }}>
              {keys.every(k => !pick[k]) ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>// bo'laklarni tanlang…</p>
              ) : keys.map(k => pick[k] && (
                <div key={k + '|' + pick[k]} className="algo-line el-in" style={{ borderLeft: `3px solid ${META[k].color}` }}>
                  <span style={{ color: META[k].color, display: 'inline-flex' }}>{META[k].ic}</span>
                  <span className="mono" style={{ fontSize: 10, color: META[k].color, textTransform: 'uppercase', minWidth: 52 }}>{META[k].label}</span>
                  <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 13.5, color: T.ink }}>{GROUPS[pick[k]][k]}</span>
                </div>
              ))}
            </div>
            {matched && (
              <div className="frame-success fade-step" key={pick.kim}>
                <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mukammal — mos g'oya!</p>
                <p className="body" style={{ margin: 0, color: T.ink }}><b>{GROUPS[pick.kim].kim}</b> — {low(GROUPS[pick.kim].muammo)}. <span style={{ color: T.success, fontWeight: 600 }}>Yechim:</span> {low(GROUPS[pick.kim].yechim)}.</p>
              </div>
            )}
            {allPicked && !matched && (
              <div className="frame-warn fade-step">
                <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mos kelmadi</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>Bu uchtasi bitta odamga mos emas. <b>Kim</b>, uning <b>muammosi</b> va aynan o'sha muammoning <b>yechimi</b> — bittasini o'zgartirib ko'ring.</p>
              </div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="To'liq g'oya nimalardan iborat?"
    questionText="To'liq g'oya nimalardan iborat?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>To'liq g'oya <span className="italic" style={{ color: T.accent }}>nimalardan</span> iborat?</h2></>}
    options={['Faqat chiroyli dizayndan', 'Kim + muammo + yechim', 'Ko\'p tugma va rangdan', 'Faqat saytning nomidan']} correctIdx={1}
    explainCorrect="To'g'ri! To'liq g'oya = kim (foydalanuvchi) + uning muammosi + sayt qanday yechim beradi. Shu uchtasi birga bo'lishi kerak."
    explainWrong={{
      0: 'Dizayn — keyingi bosqich. G\'oyada avvalo kim, muammo va yechim bo\'lishi kerak.',
      2: 'Tugma va rang g\'oya emas. G\'oya = kim + muammo + yechim.',
      3: 'Nom yetarli emas. Asosiysi — kim, qanday muammo, qanday yechim.',
      default: 'To\'liq g\'oya = kim + muammo + yechim.'
    }} />
);

// ===== SCREEN 13 — KAMCHILIKNI TOPISH (zaif g'oya) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Sizning do'stingiz bir g'oya yozdi, lekin unda nimadir yetishmayapti. Mahsulot menejerining ishi — kamchilikni topish. Diqqat bilan o'qing: bu g'oyada qaysi savolga javob yo'q? O'sha qatorni bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'muammo' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'muammo';
  const done = fixed;
  const pickRow = (id) => { if (found) return; setPicked(id); if (id === 'muammo') { audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Muammo yozilmagan — odamda aynan qanday qiyinchilik borligi noma'lum. Endi to'g'rilaymiz.`); }, 300); } };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi g'oya to'liq: kim, qanday muammo va qanday yechim.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const WRONG = [
    { id: 'kim', label: 'KIM', text: 'Sport bilan shug\'ullanadigan o\'smirlar', ok: true },
    { id: 'muammo', label: 'MUAMMO', text: '— (bo\'sh) —', ok: false },
    { id: 'yechim', label: 'YECHIM', text: 'Mashqlar ro\'yxatini ko\'rsatadigan sayt', ok: true }
  ];
  const RIGHT = [
    { id: 'kim', label: 'KIM', text: 'Sport bilan shug\'ullanadigan o\'smirlar' },
    { id: 'muammo', label: 'MUAMMO', text: 'Qaysi mashqni qachon qilishni bilishmaydi' },
    { id: 'yechim', label: 'YECHIM', text: 'Mashqlar ro\'yxatini ko\'rsatadigan sayt' }
  ];
  return (
    <Stage eyebrow="Kamchilikni top" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi to\'g\'rilang' : 'Kamchilikni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu g'oyada nima <span className="italic" style={{ color: T.accent }}>yetishmayapti</span>?</h2></div>
        <Mentor>Do'stingiz g'oya yozdi, lekin nimadir <b style={{ color: T.ink }}>yetishmayapti</b>. Qaysi savolga javob yo'q? O'sha qatorni bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">G'OYA</span><span className="ai-bubble">Do'stingizning g'oyasi:</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(fixed ? RIGHT : WRONG).map(r => {
                  const isMiss = !fixed && r.id === 'muammo';
                  const badPicked = found && r.id === 'muammo';
                  return (
                    <div key={r.id} onClick={() => { if (found || fixed) return; pickRow(r.id); }} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 11, background: badPicked ? T.accentSoft : (fixed && r.id === 'muammo' ? T.successSoft : T.bg), boxShadow: badPicked ? `inset 0 0 0 1.5px ${T.accent}` : 'none', transition: 'all 0.18s' }}>
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: r.id === 'kim' ? T.blue : (r.id === 'muammo' ? T.accent : T.success), minWidth: 56, textTransform: 'uppercase' }}>{r.label}</span>
                      <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 13.5, color: isMiss ? T.accent : T.ink, fontStyle: isMiss ? 'italic' : 'normal' }}>{r.text}</span>
                    </div>
                  );
                })}
              </div>
              {!found && <p className="ai-prompt">Qaysi qator bo'sh? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Muammoni qo'shish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>To'g'rilandi — g'oya endi to'liq.</p>}
            </div>
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>G'oya to'liq bo'lishi uchun uchta narsa kerak: kim, <b>muammo</b>, yechim. Qaysi biri yo'q?</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Muammo bo'sh qolgan — odamda aynan qanday qiyinchilik borligi noma'lum. Chap tugmani bosib to'g'rilang.</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ color: T.accent, display: 'inline-flex' }}>{Ico.problem(34)}</div><p className="ta-h">Muammosiz g'oya — bo'sh g'oya</p><p className="ta-sub">Eng ko'p unutiladigan qism — aynan muammo</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Sizga bir savol: dunyodagi millionlab saytni bitta jumla bilan tushuntirsa bo'ladimi? Bo'ladi. Mana o'sha jumla — har bir sayt kimningdir muammosiga yechim. Shuning uchun qurishdan oldin doim uch savolga javob beramiz: kim, qanday muammo, qanday yechim.`, trigger: 'on_mount', waits_for: null }]);
  const ROWS = [
    { ic: Ico.user(22), color: T.blue, h: 'KIM?', t: 'Sayt aniq kim uchun' },
    { ic: Ico.problem(22), color: T.accent, h: 'MUAMMO?', t: 'U qanday qiyinchilikka duch keladi' },
    { ic: Ico.solution(22), color: T.success, h: 'YECHIM?', t: 'Sayt unga qanday yordam beradi' }
  ];
  return (
    <Stage eyebrow="Qoida" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Dunyodagi barcha saytlarni <span className="italic" style={{ color: T.accent }}>bitta jumlaga</span> sig'dira olasizmi?</h2></div>
        <Mentor>Ha — va mana o'sha jumla: <b style={{ color: T.ink }}>har bir sayt kimningdir muammosiga yechim</b>. Shuning uchun qurishdan oldin doim <b style={{ color: T.ink }}>uch savolga</b> javob beramiz.</Mentor>
        <div className="split">
          <Col>
            <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
              <IcoChip size={54}>{Ico.solution(28)}</IcoChip>
              <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Sayt = yechim</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Har bir sayt aniq odamning aniq muammosini yechadi.</p></div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Qurishdan oldin 3 savol</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROWS.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, background: T.paper, borderRadius: 13, padding: '13px 15px', boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` }}>
                  <IcoChip color={r.color} soft={r.color === T.accent ? T.accentSoft : (r.color === T.success ? T.successSoft : T.blueSoft)} size={40}>{r.ic}</IcoChip>
                  <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 16 }}>{r.h}</p><p className="body" style={{ margin: '1px 0 0', color: T.ink2, fontSize: 13.5 }}>{r.t}</p></div>
                </div>
              ))}
            </div>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: O'Z G'OYANGIZ =====
// Eslatma: ataylab saqlanmaydi — har kirganda bo'sh boshlanadi, o'quvchi yangi muammo o'ylasin.
const emptyIdea = () => ({ kim: '', muammo: '', yechim: '' });
const FIELDS = [
  { key: 'kim', ic: Ico.user(18), color: T.blue, label: 'KIM uchun?', ph: 'Masalan: ortiqcha buyumi bor odamlar' },
  { key: 'muammo', ic: Ico.problem(18), color: T.accent, label: 'Qanday MUAMMO?', ph: 'Masalan: sotmoqchi, lekin xaridor topa olmaydi' },
  { key: 'yechim', ic: Ico.solution(18), color: T.success, label: 'Qanday YECHIM (sayt)?', ph: 'Masalan: e\'lon joylaydigan bozor (marketplace) sayti' }
];

const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Mana eng muhim qadam. O'zingiz sezgan bitta muammoni oling. Uchta savolga javob yozing: kim uchun, qanday muammo va qanday sayt yordam beradi. O'ng tomonda g'oyangiz jonli yig'iladi.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [idea, setIdea] = useState(() => storedAnswer?.idea || emptyIdea());
  const isNarrow = useIsMobile(768);
  const filled = FIELDS.filter(f => idea[f.key] && idea[f.key].trim().length >= 3).length;
  const passed = filled >= 3;
  const prevPassed = useRef(false);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, idea, stage: 'final', screenIdx: screen });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Ajoyib! Endi sizda haqiqiy g'oya bor: kim, qanday muammo va qanday yechim.`); }, 300);
    }
  }, [passed]);
  const update = (k, v) => setIdea(prev => ({ ...prev, [k]: v }));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${filled}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi navbat sizda — qanday <span className="italic" style={{ color: T.accent }}>muammoni</span> yechasiz?</h2></div>
        <Mentor>O'zingiz sezgan bitta muammoni oling. Uchta savolga javob yozing: <b style={{ color: T.ink }}>kim uchun</b>, <b style={{ color: T.ink }}>qanday muammo</b> va <b style={{ color: T.ink }}>qanday sayt</b> yordam beradi.</Mentor>
        <div className="split">
          <Col>
            {FIELDS.map(f => {
              const ok = idea[f.key] && idea[f.key].trim().length >= 3;
              return (
                <div key={f.key} style={{ background: T.paper, borderRadius: 13, padding: '13px 15px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.18)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                    <span style={{ color: ok ? T.success : f.color, display: 'inline-flex' }}>{ok ? Ico.check(16) : f.ic}</span>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: T.ink, textTransform: 'uppercase' }}>{f.label}</span>
                  </div>
                  <textarea value={idea[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.ph} rows={2}
                    style={{ width: '100%', fontFamily: "'Manrope',sans-serif", fontSize: 14, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '9px 11px', resize: 'vertical', minHeight: 40, outline: 'none', lineHeight: 1.45, boxSizing: 'border-box' }} />
                </div>
              );
            })}
          </Col>
          <Col>
            <p className="flow-label">Sizning saytingiz shunday ko'rinadi</p>
            <Preview url="mening-saytim.uz" minH={188}>
              {FIELDS.every(f => !idea[f.key].trim()) ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: G }}>Chap tomonni to'ldiring — saytingiz shu yerda jonlanadi…</p>
              ) : (
                <SiteMock
                  logo={((idea.yechim.trim() || idea.kim.trim() || 'S')[0] || 'S').toUpperCase()}
                  color={T.accent}
                  name={idea.yechim.trim() ? idea.yechim.trim().split(' ').slice(0, 2).join(' ') : 'Mening saytim'}
                  headline={idea.yechim.trim() || 'Sizning yechimingiz'}
                  sub={`${idea.kim.trim() ? idea.kim.trim() + ' uchun. ' : ''}${idea.muammo.trim() ? 'Muammo: ' + idea.muammo.trim() + '.' : ''}`}
                  cta="Boshlash"
                />
              )}
            </Preview>
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! G'oyangiz allaqachon sayt kabi ko'rinmoqda — keyingi darslarda HTML bilan shunday saytni quramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz! Bugun siz mahsulot menejeridek o'ylay boshladingiz. Eslang: har bir sayt kimningdir muammosiga yechim. Avval kim va qanday muammo ekanini bilamiz, keyingina yechimni quramiz. Keyingi darslarda shu yechimni HTML bilan o'z qo'lingiz bilan qurishni boshlaymiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['Har bir sayt kimningdir real muammosiga yechim', 'Avval aniq odamni (foydalanuvchini) tanlaymiz', '"Hamma uchun" — aslida hech kim uchun', 'To\'liq g\'oya: KIM + MUAMMO + YECHIM'];
  const HOMEWORK = [{ b: 'Bitta muammo toping', t: '— atrofingizdagi odam (do\'st, oila) sezgan qiyinchilikni yozing' }, { b: 'Foydalanuvchini aniqlang', t: '— bu muammo aniq kimniki?' }, { b: 'Yechim o\'ylang', t: '— qanday oddiy sayt yordam berishi mumkin?' }];
  const GLOSSARY = [{ b: 'Foydalanuvchi', t: '— saytni ishlatadigan aniq odam' }, { b: 'Muammo', t: '— odam his qiladigan real qiyinchilik' }, { b: 'Yechim', t: '— sayt muammoni qanday osonlashtiradi' }, { b: 'Mahsulot menejeri (PM)', t: '— kim, qanday muammo, qanday yechim ekanini hal qiladi' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>mahsulot menejeridek</span> o'ylaysiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Muammo, foydalanuvchi va yechimni tushundingiz — qurishni boshlashga tayyorsiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Bitta yangi g'oyani topib keling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda HTML bilan shu yechimni qurishni boshlaymiz.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson1({ lang: langProp, onFinished }) {
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
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava svg { display: block; }
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
