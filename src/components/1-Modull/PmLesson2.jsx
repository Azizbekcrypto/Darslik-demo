import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// PM 2-DARS — STRUKTURA UX QAROR (sayt bo'limlari tartibi) — PLATFORM STANDARD v16
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

const LESSON_META = { lessonId: 'pm-structure-02-v16', lessonTitle: { uz: 'Struktura — UX qaror', ru: 'Структура как UX-решение' } };
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
        <img src={mentorImg} alt="" />
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

// Mobil: Mentor yopilganda ish maydonini ko'rinishga olib keladi (avtoskroll)
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

// ===== PM-2 STRUKTURA — bo'limlar va ularning to'g'ri tartibi (marketplace "Bozor") =====
const ssv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const sIco = {
  star: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...ssv}><path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z" /></svg>),
  shield: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...ssv}><path d="M12 3l7 3v5c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>),
  cursor: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...ssv}><path d="M5 4l6 16 2.2-6.2L19 11z" /></svg>),
  up: (s = 15) => (<svg viewBox="0 0 24 24" width={s} height={s} {...ssv} strokeWidth={2.3}><path d="M6 14l6-6 6 6" /></svg>),
  down: (s = 15) => (<svg viewBox="0 0 24 24" width={s} height={s} {...ssv} strokeWidth={2.3}><path d="M6 10l6 6 6-6" /></svg>)
};
const SECDATA = {
  hero: { label: 'Sarlavha (Hero)', ic: sIco.star(18), color: '#E0892B', job: 'Bir jumlada sayt nima taklif qilishini aytadi — birinchi taassurot.', snip: '"Ortiqcha buyumingizni soting"' },
  muammo: { label: 'Muammo', ic: Ico.problem(18), color: T.accent, job: 'Foydalanuvchining tanish qiyinchiligi — "ha, bu menga tanish".', snip: '"Sotish qiyin edi"' },
  yechim: { label: 'Qanday ishlaydi', ic: Ico.solution(18), color: T.blue, job: 'Sayt muammoni qanday hal qilishini ko\'rsatadi.', snip: '"3 daqiqada e\'lon"' },
  isbot: { label: 'Isbot', ic: sIco.shield(18), color: T.success, job: 'Boshqalar foydalanyapti, mahsulotlar bor — ishonch uyg\'otadi.', snip: 'Velosiped · Telefon' },
  harakat: { label: 'Harakat tugmasi', ic: sIco.cursor(18), color: '#7B3FE4', job: 'Aniq keyingi qadam: "E\'lon berish".', snip: '[ E\'lon berish ]' }
};
const ORDER = ['hero', 'muammo', 'yechim', 'isbot', 'harakat'];
const move = (arr, i, dir) => { const j = i + dir; if (j < 0 || j >= arr.length) return arr; const n = [...arr]; const t = n[i]; n[i] = n[j]; n[j] = t; return n; };

const SecView = ({ k }) => {
  if (k === 'hero') return (<div><div className="site-header" style={{ marginBottom: 8 }}><span className="site-brand"><span className="site-logo" style={{ background: '#7B3FE4' }}>B</span><span className="site-name">Bozor</span></span><span className="site-nav"><span>Sotish</span><span>Xarid</span></span></div><h3 className="site-h3" style={{ margin: 0 }}>Ortiqcha buyumingizni soting</h3></div>);
  if (k === 'muammo') return (<p style={{ fontFamily: G, fontSize: 13.5, color: T.ink2, margin: 0 }}>Uyda ishlatilmaydigan narsalar bor — sotish esa qiyin va uzoq.</p>);
  if (k === 'yechim') return (<p style={{ fontFamily: G, fontSize: 13.5, color: T.ink, margin: 0 }}><b>3 daqiqada</b> e'lon bering — minglab xaridor ko'radi.</p>);
  if (k === 'isbot') return (<div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{['Velosiped — 450 000', 'Telefon — 1 200 000'].map((r, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 34, height: 26, borderRadius: 6, background: T.bg, flexShrink: 0, boxShadow: `inset 0 0 0 1px ${T.ink3}30` }} /><span style={{ fontFamily: G, fontSize: 13, color: T.ink }}>{r}</span></div>))}</div>);
  if (k === 'harakat') return (<span style={{ display: 'inline-block', background: '#7B3FE4', color: '#fff', fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, padding: '9px 18px', borderRadius: 9 }}>E'lon berish</span>);
  return null;
};
const PagePreview = ({ order, url = 'bozor.uz', minH = 240 }) => (
  <Preview url={url} minH={minH}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {order.map((k, i) => (<div key={k} className="pg-in" style={{ paddingBottom: 11, borderBottom: i < order.length - 1 ? `1px solid ${T.ink3}22` : 'none' }}><SecView k={k} /></div>))}
    </div>
  </Preview>
);
const reordBtn = (disabled) => ({ border: 'none', background: T.bg, borderRadius: 6, padding: '3px 7px', cursor: disabled ? 'default' : 'pointer', color: T.ink2, opacity: disabled ? 0.3 : 1, display: 'inline-flex' });
const SecCard = ({ k, i, total, onMove, showJob }) => {
  const s = SECDATA[k];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 12, padding: '11px 13px', boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` }}>
      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3, minWidth: 14 }}>{i + 1}</span>
      <span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: T.ink, margin: 0 }}>{s.label}</p>
        {showJob && <p style={{ margin: '2px 0 0', color: T.ink3, fontSize: 11.5, lineHeight: 1.35, fontFamily: "'Manrope',sans-serif" }}>{s.job}</p>}
      </div>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <button style={reordBtn(i === 0)} disabled={i === 0} onClick={() => onMove(i, -1)}>{sIco.up(14)}</button>
        <button style={reordBtn(i === total - 1)} disabled={i === total - 1} onClick={() => onMove(i, 1)}>{sIco.down(14)}</button>
      </span>
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
  const audio = useAudio([{ id: 's0', text: `Bir xil sayt, bir xil so'zlar — lekin ikki xil tartibda joylashtirilgan. Biri tushunarli, biri chalkash. Ikkala tugmani bosib ko'ring, keyin sababini tanlang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [v, setV] = useState('good');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const goodOrder = ORDER;
  const badOrder = ['harakat', 'isbot', 'muammo', 'hero', 'yechim'];
  const OPTS = [
    { id: 'a', label: 'Ranglari chiroyliroq bo\'lgani uchun' },
    { id: 'b', label: 'Bo\'limlar to\'g\'ri tartibda — avval nima, keyin nima aniq' },
    { id: 'c', label: 'Farqi yo\'q, ikkalasi bir xil' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Bir xil sayt — nega biri tushunarli, biri <span className="italic" style={{ color: T.accent }}>chalkash</span>?</h1>
        <Mentor>Mana bitta marketplace sayt, bir xil so'zlar bilan — lekin ikki xil <b style={{ color: T.ink }}>tartibda</b>. Ikkala tugmani bosib solishtiring, keyin sababini tanlang.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'good' ? 'chip-on' : ''}`} onClick={() => setV('good')}>Tartibli</button>
              <button className={`chip ${v === 'bad' ? 'chip-on' : ''}`} onClick={() => setV('bad')}>Chalkash</button>
            </div>
            <div key={v}><PagePreview order={v === 'good' ? goodOrder : badOrder} minH={232} /></div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nega biri tushunarli?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Bo'limlarning <b>tartibi</b> — bu UX qaror. To'g'ri tartib foydalanuvchini yechimga olib boradi, chalkashi esa yo'qotadi. Bugun shuni o'rganamiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `O'tgan darsda g'oyani topdik: kim, muammo, yechim. Endi savol — buni saytda qanday tartibda ko'rsatamiz? Foydalanuvchi birinchi nimani ko'radi? Struktura — bu UX qaror. Bugun shuni beshta qadamda ochamiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Foydalanuvchi birinchi nimani ko\'radi', tag: '' },
    { text: 'Bo\'limlar tartibi = hikoya', tag: '' },
    { text: 'Har bo\'limning vazifasi', tag: '' },
    { text: 'Chalkash sahifani tuzatish', tag: '' },
    { text: 'O\'z sahifa tartibingizni qurasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Idea = ({ ic, h, t, c }) => (<div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}><IcoChip color={c} soft={T.bg}>{ic}</IcoChip><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>{h}</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>{t}</p></div></div>);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Idea ic={sIco.star(22)} c="#E0892B" h="STRUKTURA = UX QAROR" t="Bo'limlar tartibi tasodifan tanlanmaydi" />
        <Idea ic={Ico.arrow(22)} c={T.accent} h="TO'G'RI YO'L" t="Muammo → yechim → harakat: foydalanuvchini yetaklaydi" />
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ keyin CSS bilan shu tuzilishni bezaymiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Sayt qaysi tartibda tuzilsa, foydalanuvchi tushunadi?</span></h2></div>
        <Mentor>O'tgan darsda g'oyani topdik: <b style={{ color: T.ink }}>kim, muammo, yechim</b>. Endi savol — buni saytda <b style={{ color: T.ink }}>qanday tartibda</b> ko'rsatamiz? Struktura — bu UX qaror (foydalanuvchi qulayligi uchun qaror).</Mentor>
        {!isNarrow ? (<Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — BIRINCHI EKRAN (fold) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Foydalanuvchi saytni ochganda, pastga aylantirmasdan turib faqat tepasini ko'radi. Tepada nima tursa — o'sha birinchi taassurot. Tepaga qaysi bo'limni qo'yamiz? Ikkalasini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [top, setTop] = useState('hero');
  const [seen, setSeen] = useState(new Set(['hero']));
  const done = seen.size >= 2;
  const set = (t) => { setTop(t); setSeen(prev => { const n = new Set(prev); n.add(t); return n; }); };
  const order = top === 'hero' ? ORDER : ['harakat', 'hero', 'muammo', 'yechim', 'isbot'];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Birinchi ekran" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Foydalanuvchi avval <span className="italic" style={{ color: T.accent }}>nimani</span> ko'radi?</h2></div>
        <Mentor>Sayt ochilganda foydalanuvchi pastga aylantirmay turib faqat <b style={{ color: T.ink }}>tepasini</b> ko'radi — bu birinchi taassurot. Tepaga qaysi bo'limni qo'yamiz? Ikkalasini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${top === 'hero' ? 'chip-on' : ''}`} onClick={() => set('hero')}>Tepada: Sarlavha</button>
              <button className={`chip ${top === 'cta' ? 'chip-on' : ''}`} onClick={() => set('cta')}>Tepada: Tugma</button>
            </div>
            <div key={top}><PagePreview order={order} minH={210} /></div>
          </Col>
          <Col>
            {top === 'hero'
              ? <div className="frame-success fade-step" key="h"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tushunarli</p><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi qarashda <b>sayt nima taklif qilishi</b> ma'lum: "Ortiqcha buyumingizni soting". Foydalanuvchi qoladi.</p></div>
              : <div className="frame-warn fade-step" key="c"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chalkash</p><p className="body" style={{ margin: 0, color: T.ink }}>Tepada <b>tugma</b>, lekin nega bosish kerakligi noma'lum. Foydalanuvchi tushunmay ketib qoladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun eng muhim narsa — <b>sarlavha (hero)</b> — doim tepada, birinchi ekranda turadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — REAL SAYTLAR TUZILISHI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Mashhur saytlar bir xil mantiqqa amal qiladi: avval eng muhimi, oxirida harakat. Har bir saytni bosib, uning bo'limlari qaysi tartibda joylashganini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const SITES = {
    market: { ic: Ico.market(24), name: 'Bozor', rows: ['Sarlavha: nimani sotasiz', 'Qanday ishlaydi', 'Mahsulotlar (isbot)', 'E\'lon berish (tugma)'] },
    news: { ic: Ico.book(24), name: 'Yangiliklar', rows: ['Eng katta sarlavha', 'Asosiy yangiliklar', 'Boshqa xabarlar', 'Obuna bo\'lish (tugma)'] },
    video: { ic: Ico.youtube(24), name: 'Video', rows: ['Tavsiya etilgan video', 'Mashhur videolar', 'Kanallar', 'Ko\'rishni boshlash'] }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Real saytlar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashhur saytlar qanday <span className="italic" style={{ color: T.accent }}>tartibda</span> tuzilgan?</h2></div>
        <Mentor>Ular bir xil mantiqqa amal qiladi: avval <b style={{ color: T.ink }}>eng muhimi</b>, oxirida <b style={{ color: T.ink }}>harakat</b>. Har birini bosib, bo'limlar tartibini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.keys(SITES).map(k => (<button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', border: 'none', borderRadius: 12, padding: '13px 15px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ display: 'inline-flex' }}>{SITES[k].ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, color: T.ink }}>{SITES[k].name}</span>{seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ display: 'inline-flex' }}>{SITES[active].ic}</span><span className="sk-wordbadge">{SITES[active].name}</span></span><div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>{SITES[active].rows.map((r, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: T.accent, minWidth: 14 }}>{i + 1}</span><span className="body" style={{ margin: 0, color: T.ink }}>{r}</span></div>))}</div></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir saytni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi — uchchalasida ham <b>muhimi tepada, harakat oxirida</b>. Bu tasodif emas, qoida.</p></div>}
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
    audioText="Foydalanuvchi saytga kirganda birinchi nimani ko'rishi kerak?"
    questionText="Foydalanuvchi saytga kirganda birinchi nimani ko'rishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Foydalanuvchi birinchi <span className="italic" style={{ color: T.accent }}>nimani</span> ko'rishi kerak?</h2></>}
    options={['Eng pastdagi footerni', 'Sayt nima taklif qilishini — sarlavhani', 'Harakat tugmasini, sababsiz', 'Tasodifiy bo\'limni']} correctIdx={1}
    explainCorrect="To'g'ri! Birinchi ekranda sarlavha (hero) turadi — u bir jumlada sayt nimaligini aytadi. Shundan keyingina foydalanuvchi qoladi."
    explainWrong={{ 0: 'Footer — eng oxirida. Birinchi ko\'rinishda sarlavha bo\'lishi kerak.', 2: 'Tugmani sababsiz ko\'rsatsa, foydalanuvchi nega bosishini tushunmaydi. Avval sarlavha.', 3: 'Tasodif emas — eng muhimi, ya\'ni sarlavha birinchi turadi.', default: 'Birinchi — sarlavha (sayt nima taklif qiladi).' }} />
);

// ===== SCREEN 5 — HAR BO'LIMNING VAZIFASI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Yaxshi sahifada har bir bo'lim o'z vazifasini bajaradi — bekorga turmaydi. Beshta bo'limni bosib, har birining vazifasini bilib oling.`, trigger: 'on_mount', waits_for: null }]);
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 5;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bo'lim vazifasi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/5 bo'limni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bir bo'lim <span className="italic" style={{ color: T.accent }}>nima uchun</span> kerak?</h2></div>
        <Mentor>Yaxshi sahifada har bir bo'lim <b style={{ color: T.ink }}>o'z vazifasini</b> bajaradi — bekorga turmaydi. Har birini bosib, vazifasini bilib oling.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ORDER.map(k => { const s = SECDATA[k]; return (<button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, color: active === k ? s.color : T.ink2, boxShadow: active === k ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{s.label}</span>{seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>); })}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: SECDATA[active].color, display: 'inline-flex' }}>{SECDATA[active].ic}</span><span className="sk-wordbadge" style={{ color: SECDATA[active].color, background: SECDATA[active].color + '1c' }}>{SECDATA[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{SECDATA[active].job}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir bo'limni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Beshala bo'lim — beshta aniq vazifa. Endi ularni <b>to'g'ri tartibga</b> qo'yish qoldi.</p></div>}
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
    audioText="Harakat tugmasi (E'lon berish) sahifaning qayerida turishi mantiqiy?"
    questionText="Harakat tugmasi sahifaning qayerida turishi mantiqiy?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Harakat tugmasi (CTA) <span className="italic" style={{ color: T.accent }}>qayerda</span> turishi mantiqiy?</h2></>}
    options={['Eng tepada, hammadan oldin', 'Foydalanuvchi sayt foydasini tushungandan keyin', 'Umuman kerak emas', 'Sahifa o\'rtasida, muammodan oldin']} correctIdx={1}
    explainCorrect="To'g'ri! Avval foydalanuvchi muammoni, yechimni va isbotni ko'radi — ishonadi. Shundan keyin harakat tugmasi bosiladi."
    explainWrong={{ 0: 'Tepada bo\'lsa, foydalanuvchi nega bosishini hali bilmaydi. Avval ishontirish kerak.', 2: 'Kerak — aks holda foydalanuvchi nima qilishini bilmaydi. Faqat oxirida turadi.', 3: 'Muammodan oldin erta — foydalanuvchi hali ishonmagan. Tugma oxirida.', default: 'Tugma — foydalanuvchi ishongandan keyin, oxirida.' }} />
);

// ===== SCREEN 6 — TARTIB = HIKOYA (stepper) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Yaxshi sahifa — bu hikoya. Avval foydalanuvchining muammosini eslatamiz, keyin yechimni ko'rsatamiz, isbot bilan ishontiramiz va oxirida harakatga chaqiramiz. Tugmani bosib, hikoyaning qurilishini kuzating.`, trigger: 'on_mount', waits_for: { type: 'flow_done' } }]);
  const [step, setStep] = useState(storedAnswer ? ORDER.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = step >= ORDER.length;
  const isMobile = useIsMobile();
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); setRunning(true); const tick = (i) => { setStep(i); if (i < ORDER.length) timer.current = setTimeout(() => tick(i + 1), 720); else { setRunning(false); audio.triggerEvent('flow_done'); } }; timer.current = setTimeout(() => tick(1), 350); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tartib = hikoya" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,13px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yaxshi sahifa — bu <span className="italic" style={{ color: T.accent }}>hikoya</span>mi?</h2></div>
        <Mentor>Ha! Avval foydalanuvchining <b style={{ color: T.ink }}>muammosini</b> eslatamiz, keyin <b style={{ color: T.ink }}>yechimni</b>, <b style={{ color: T.ink }}>isbot</b> bilan ishontiramiz va oxirida <b style={{ color: T.ink }}>harakatga</b> chaqiramiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ORDER.map((k, i) => { const s = SECDATA[k]; const on = step > i; return (<React.Fragment key={k}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '7px 13px', opacity: on ? 1 : 0.4, boxShadow: on ? `0 7px 18px -10px rgba(${T.shadowBase},0.18)` : 'none', transition: 'all 0.4s' }}><IcoChip color={on ? s.color : T.ink3} soft={on ? s.color + '1c' : '#ECEAE5'} size={31}>{s.ic}</IcoChip><div style={{ minWidth: 0 }}><p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 13.5, color: on ? T.ink : T.ink3, margin: 0 }}>{s.label}</p></div>{!isMobile && <span style={{ marginLeft: 'auto', fontFamily: G, fontSize: 12.5, fontStyle: 'italic', color: on ? T.ink2 : T.ink3, whiteSpace: 'nowrap' }}>{s.snip}</span>}{on && <span style={{ marginLeft: isMobile ? 'auto' : 10, color: T.success }}>{Ico.check(15)}</span>}</div>{i < ORDER.length - 1 && <div style={{ display: 'flex', justifyContent: 'center', color: step > i + 1 ? T.success : T.ink3, transform: 'rotate(90deg)', lineHeight: 1, transition: 'color 0.3s' }}>{Ico.arrow(12)}</div>}</React.Fragment>); })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Qurilmoqda…' : (done ? '↻ Yana ko\'rish' : 'Hikoyani qurish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'g'ri tartib: <b>sarlavha → muammo → yechim → isbot → harakat</b>. Foydalanuvchi qadam-baqadam ishonadi.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TO'G'RI vs ARALASH (toggle) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Endi solishtiramiz. Bir xil bo'limlar — lekin biri to'g'ri tartibda, biri aralash. Ikkalasini bosib, qaysi biri foydalanuvchini yechimga olib borishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [v, setV] = useState('good');
  const [seen, setSeen] = useState(new Set(['good']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  const bad = ['isbot', 'harakat', 'hero', 'muammo', 'yechim'];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="To'g'ri vs aralash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tartib o'zgarsa, sahifa <span className="italic" style={{ color: T.accent }}>tushunarli</span> bo'ladimi?</h2></div>
        <Mentor>Bir xil bo'limlar — lekin biri <b style={{ color: T.ink }}>to'g'ri tartibda</b>, biri <b style={{ color: T.ink }}>aralash</b>. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'good' ? 'chip-on' : ''}`} onClick={() => set('good')}>To'g'ri tartib</button>
              <button className={`chip ${v === 'bad' ? 'chip-on' : ''}`} onClick={() => set('bad')}>Aralash</button>
            </div>
            <div key={v}><PagePreview order={v === 'good' ? ORDER : bad} minH={224} /></div>
          </Col>
          <Col>
            {v === 'good'
              ? <div className="frame-success fade-step" key="g"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mantiqiy</p><p className="body" style={{ margin: 0, color: T.ink }}>Hikoya kabi: sarlavha → muammo → yechim → isbot → tugma. Har qadam keyingisiga tayyorlaydi.</p></div>
              : <div className="frame-warn fade-step" key="b"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chalkash</p><p className="body" style={{ margin: 0, color: T.ink }}>Isbot va tugma boshida — lekin nimaga ishonish kerakligi hali noma'lum. Foydalanuvchi adashadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Xulosa: bir xil bo'limlar — <b>tartib</b> esa hammasini hal qiladi. Bu UX qaror.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MOSLASH: bo'lim ↔ vazifa =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Endi o'zingizni sinang. To'rtta bo'lim va ularning to'rtta vazifasi bor. Har bir bo'limni o'z vazifasi bilan ulang: avval bo'limni, keyin vazifani bosing.`, trigger: 'on_mount', waits_for: null }]);
  const PAIRS = ['hero', 'muammo', 'isbot', 'harakat'];
  const NEEDS = [
    { id: 'isbot', text: 'Ishonch uyg\'otadi (boshqalar foydalanyapti)' },
    { id: 'hero', text: 'Bir jumlada sayt nimaligini aytadi' },
    { id: 'harakat', text: 'Aniq keyingi qadamni beradi' },
    { id: 'muammo', text: 'Tanish qiyinchilikni eslatadi' }
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
        <div className="head"><h2 className="title h-title fade-up">Har bir bo'limni <span className="italic" style={{ color: T.accent }}>vazifasi</span> bilan ulang</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>bo'limni</b> tanlang, keyin uning <b style={{ color: T.ink }}>vazifasini</b> bosing. To'rttasini to'g'ri ulang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Bo'limlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PAIRS.map(id => { const s = SECDATA[id]; const m = matched[id]; const on = sel === id; return (<button key={id} onClick={() => pickP(id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : s.color, display: 'inline-flex' }}>{m ? Ico.check(18) : s.ic}</span><span style={{ flex: 1, fontWeight: 600 }}>{s.label}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Vazifalar</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {NEEDS.map(n => { const m = matched[n.id]; const isWrong = wrong === n.id; return (<button key={n.id} onClick={() => pickN(n.id)} disabled={m || !sel} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ flex: 1 }}>{n.text}</span>{m && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(16)}</span>}</button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa bo'limning vazifasi. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Har bir bo'lim nima uchun kerakligini bildingiz.</p></div>}
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
    audioText="Sahifa bo'limlarining tartibi nima uchun muhim?"
    questionText="Sahifa bo'limlarining tartibi nima uchun muhim?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bo'limlar <span className="italic" style={{ color: T.accent }}>tartibi</span> nega muhim?</h2></>}
    options={['Chiroyli ko\'rinish uchun', 'U foydalanuvchini muammodan yechimga qadam-baqadam olib boradi', 'Sahifa uzunroq bo\'lishi uchun', 'Muhim emas — tartib farq qilmaydi']} correctIdx={1}
    explainCorrect="To'g'ri! Tartib — bu yo'l: foydalanuvchini muammodan yechimga, keyin harakatga olib boradi. Bu UX qaror."
    explainWrong={{ 0: 'Chiroylilik emas — tartib foydalanuvchini yetaklash uchun. Bu UX qaror.', 2: 'Uzunlik maqsad emas. Tartib — foydalanuvchini to\'g\'ri yo\'ldan olib borish uchun.', 3: 'Aksincha — tartib hammasini hal qiladi. Aralash sahifa chalkashtiradi.', default: 'Tartib foydalanuvchini muammodan yechimga olib boradi.' }} />
);

// ===== SCREEN 10 — CHALKASH SAHIFANI TUZATISH (debugging) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Bir sahifa tuzilgan, lekin bitta bo'lim noto'g'ri joyda — harakat tugmasi eng tepada turibdi. Qaysi bo'lim noto'g'ri joyda ekanini toping va o'sha bo'limni bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const wrongOrder = ['harakat', 'hero', 'muammo', 'yechim', 'isbot'];
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const clickSec = (k) => { if (found) return; if (k === 'harakat') { setFound(true); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Harakat tugmasi eng tepada — lekin foydalanuvchi hali nega bosishini bilmaydi. Uni oxiriga ko'chiramiz.`); }, 300); } };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi tugma oxirida — foydalanuvchi ishongandan keyin bosadi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const curOrder = fixed ? ORDER : wrongOrder;
  return (
    <Stage eyebrow="Tuzatish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xato bo\'limni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu sahifada qaysi bo'lim <span className="italic" style={{ color: T.accent }}>noto'g'ri</span> joyda?</h2></div>
        <Mentor>Sahifa tayyor, lekin bitta bo'lim <b style={{ color: T.ink }}>noto'g'ri joyda</b>. Qaysi bo'lim erta turibdi? Pastdagi ro'yxatdan o'sha bo'limni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Sahifa tartibi</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {curOrder.map((k, i) => { const s = SECDATA[k]; const bad = found && !fixed && k === 'harakat'; return (<div key={k} onClick={() => { if (!found && !fixed) clickSec(k); }} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 11, background: bad ? T.accentSoft : (fixed && k === 'harakat' ? T.successSoft : T.paper), borderRadius: 11, padding: '11px 13px', boxShadow: bad ? `inset 0 0 0 1.5px ${T.accent}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: T.ink3, minWidth: 14 }}>{i + 1}</span><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: T.ink }}>{s.label}</span></div>); })}
            </div>
            {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Tugmani oxiriga ko'chirish</button>}
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: foydalanuvchi <b>nega bosishini</b> bilishi kerak. Qaysi bo'lim erta turgani uchun chalkash?</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Harakat tugmasi eng tepada — foydalanuvchi hali ishonmagan. Chap tugmani bosib oxiriga ko'chiring.</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ color: '#7B3FE4', display: 'inline-flex' }}>{sIco.cursor(34)}</div><p className="ta-h">Tugma — oxirda, ishongandan keyin</p><p className="ta-sub">Bitta bo'limning o'rni butun sahifani o'zgartiradi</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — REORDER WARM-UP (3 bo'lim) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Endi o'zingiz tartiblang. Uchta bo'limni to'g'ri ketma-ketlikka qo'ying: yuqori va past o'qlar bilan ko'chiring. O'ngda sahifa real vaqtda o'zgaradi.`, trigger: 'on_mount', waits_for: null }]);
  const correct = ['hero', 'muammo', 'harakat'];
  const [arr, setArr] = useState(storedAnswer?.arr || ['harakat', 'hero', 'muammo']);
  const matched = arr.every((k, i) => k === correct[i]);
  const onMove = (i, dir) => { if (matched) return; setArr(prev => move(prev, i, dir)); };
  useEffect(() => { if (matched && storedAnswer === undefined) onAnswer(screen, { correct: true, arr }); }, [matched]);
  return (
    <Stage eyebrow="Tartiblash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!matched} label={matched ? 'Davom etish' : 'To\'g\'ri tartibga keltiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu uchta bo'limni <span className="italic" style={{ color: T.accent }}>to'g'ri tartibga</span> qo'ying</h2></div>
        <Mentor>Yuqori/past o'qlar bilan bo'limlarni ko'chiring. To'g'ri tartibni o'zingiz toping — o'ngda <b style={{ color: T.ink }}>sahifa</b> real vaqtda o'zgaradi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Bo'limlar — tartiblang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {arr.map((k, i) => (<SecCard key={k} k={k} i={i} total={arr.length} onMove={onMove} showJob />))}
            </div>
            {matched && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'g'ri! Sarlavha → muammo → harakat. Mana tayyor tartib.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Sahifa ko'rinishi</p>
            <PagePreview order={arr} minH={196} />
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
    audioText="Sahifa bo'limlarining eng mantiqiy tartibi qaysi?"
    questionText="Sahifa bo'limlarining eng mantiqiy tartibi qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Eng <span className="italic" style={{ color: T.accent }}>mantiqiy</span> tartib qaysi?</h2></>}
    options={['Tugma → isbot → sarlavha → muammo', 'Sarlavha → muammo → yechim → isbot → tugma', 'Muammo → tugma → sarlavha', 'Isbot → tugma → muammo → sarlavha']} correctIdx={1}
    explainCorrect="To'g'ri! Sarlavha (nima), muammo (nega), yechim (qanday), isbot (ishonch), tugma (harakat). Mukammal hikoya tartibi."
    explainWrong={{ 0: 'Tugma boshida — erta. Avval sarlavha va ishontirish kerak.', 2: 'Sarlavha boshida bo\'lishi kerak, tugma esa oxirida.', 3: 'Aralashib ketgan. To\'g\'risi: sarlavha → muammo → yechim → isbot → tugma.', default: 'Sarlavha → muammo → yechim → isbot → tugma.' }} />
);

// ===== SCREEN 13 — NAMUNA (tayyor tartib + izohlar) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Mana to'liq, to'g'ri tartibga keltirilgan sahifa. Har bir bo'limni bosib, nega aynan shu o'rinda turishini ko'ring — keyin o'zingiznikini tuzasiz.`, trigger: 'on_mount', waits_for: null }]);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= ORDER.length;
  const [active, setActive] = useState(null);
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Namuna" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/5 bo'limni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tayyor tartib: har bo'lim <span className="italic" style={{ color: T.accent }}>nega</span> shu o'rinda?</h2></div>
        <Mentor>Mana to'g'ri tartibdagi sahifa. Har bir bo'limni bosib, <b style={{ color: T.ink }}>nega</b> aynan shu o'rinda turishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ORDER.map((k, i) => { const s = SECDATA[k]; const open = seen.has(k); return (<button key={k} onClick={() => tap(k)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '11px 14px', background: T.paper, display: 'flex', alignItems: 'center', gap: 11, boxShadow: active === k ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : (open ? `inset 0 0 0 1px ${T.success}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`), transition: 'all 0.18s' }}><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: T.ink3, minWidth: 14 }}>{i + 1}</span><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: T.ink }}>{s.label}</span>{open && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>); })}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: SECDATA[active].color, display: 'inline-flex' }}>{SECDATA[active].ic}</span><span className="sk-wordbadge" style={{ color: SECDATA[active].color, background: SECDATA[active].color + '1c' }}>{SECDATA[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{SECDATA[active].job}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir bo'limni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bo'lim o'z o'rnida — sababi bilan. Endi o'zingiz tuzasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA (global savol) =====
const Screen14 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Sizga savol: chiroyli sayt bilan ishonchli sayt orasidagi farq nimada? Ko'pincha — tartibida. Yaxshi struktura foydalanuvchini muammodan yechimga, keyin harakatga olib boradi. Bezak emas — bu UX qaror.`, trigger: 'on_mount', waits_for: null }]);
  return (
    <Stage eyebrow="Qoida" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Chiroyli sayt bilan <span className="italic" style={{ color: T.accent }}>ishonchli</span> sayt — farqi nimada?</h2></div>
        <Mentor>Ko'pincha farq — <b style={{ color: T.ink }}>tartibida</b>. Yaxshi struktura foydalanuvchini muammodan yechimga, keyin harakatga olib boradi. Bu bezak emas — <b style={{ color: T.ink }}>UX qaror</b>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
              <IcoChip size={54} color="#E0892B" soft="#E0892B1c">{sIco.star(28)}</IcoChip>
              <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Struktura = UX qaror</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Bo'limlar tartibi foydalanuvchini yechimga olib boradi.</p></div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">To'g'ri yo'l — har doim</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ORDER.map((k, i) => { const s = SECDATA[k]; return (<React.Fragment key={k}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.label}</span></div>{i < ORDER.length - 1 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>); })}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: O'Z TARTIBINGIZNI QURING =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Mana eng muhim qadam. Beshta bo'lim aralash turibdi. Ularni to'g'ri tartibga keltiring — o'qlar bilan ko'chiring. Har bir bo'lim ostida nega shu o'rinda turishi yozilgan. O'ngda sahifangiz real vaqtda quriladi.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [arr, setArr] = useState(storedAnswer?.arr || ['isbot', 'hero', 'harakat', 'muammo', 'yechim']);
  const passed = arr.every((k, i) => k === ORDER[i]);
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  const onMove = (i, dir) => { if (passed) return; setArr(prev => move(prev, i, dir)); };
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, arr, stage: 'final', screenIdx: screen });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Ajoyib! Siz sahifa tuzilishini o'zingiz qurdingiz — bu mahsulot menejerining ishi.`); }, 300);
      // mobil: to'g'ri yig'ilganda natija (yashil) va sahifa ko'rinishga olib kelinadi
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) {
        const el = workRef.current;
        setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360);
      }
    }
  }, [passed]);
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'To\'g\'ri tartibga keltiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Bozor" sahifasini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibga</span> keltiring</h2></div>
        <Mentor>Beshta bo'lim aralash. O'qlar bilan ularni <b style={{ color: T.ink }}>to'g'ri tartibga</b> keltiring. Har bo'lim ostidagi izoh — uning vazifasi. O'ngda sahifa <b style={{ color: T.ink }}>real vaqtda</b> quriladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            <p className="flow-label">Bo'limlar — tartiblang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {arr.map((k, i) => (<SecCard key={k} k={k} i={i} total={arr.length} onMove={onMove} showJob />))}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Sahifangiz</p>
            <PagePreview order={arr} minH={236} />
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Sahifa tuzilishi to'g'ri — keyingi CSS darslarida shu tuzilishni bezaymiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz! Bugun siz strukturani UX qaror sifatida ko'rdingiz. Eslang: sahifa bo'limlarining tartibi foydalanuvchini muammodan yechimga, keyin harakatga olib boradi. Keyingi modulda — CSS bilan shu tuzilishni chiroyli qilamiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['Struktura — bezak emas, UX qaror', 'Birinchi ekranda eng muhimi (sarlavha) turadi', 'Tartib = hikoya: muammo → yechim → isbot → harakat', 'Harakat tugmasi — oxirida, ishongandan keyin'];
  const HOMEWORK = [{ b: 'Sevimli saytni oching', t: '— bo\'limlari qaysi tartibda joylashganini yozing' }, { b: 'Birinchi ekran', t: '— u yerda nima turibdi va nega shundaymi?' }, { b: 'O\'z g\'oyangiz', t: '— sahifa bo\'limlarini tartib bilan yozib chiqing' }];
  const GLOSSARY = [{ b: 'Struktura', t: '— sahifa bo\'limlarining tartibi' }, { b: 'Birinchi ekran (hero)', t: '— aylantirmay ko\'rinadigan tepa qism' }, { b: 'Harakat tugmasi (CTA)', t: '— foydalanuvchiga keyingi qadam' }, { b: 'UX qaror', t: '— foydalanuvchi qulayligi uchun olinadigan qaror' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>strukturani</span> qura olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Tuzilish — UX qaror ekanini tushundingiz. CSS modulida shu sahifani bezashga tayyorsiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Tuzilishni kuzatishni davom ettiring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi modulda CSS bilan shu tuzilishni bezaymiz.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson2({ lang: langProp, onFinished }) {
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
