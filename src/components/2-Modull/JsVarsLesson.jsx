import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// 08-DARS — JAVASCRIPT: O'ZGARUVCHILAR (Peremennie) — PLATFORM STANDARD v16
// Mavzu: o'zgaruvchi nima (nomlangan quti), qiymat berish (=),
//        let / const / var, ma'lumot turlari (string, number, boolean),
//        o'z qo'li bilan birinchi o'zgaruvchilarni yozish.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8', kw: '#C792EA', num: '#F78C6C', vr: '#82AAFF', bool: '#FFCB6B' };

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

const LESSON_META = { lessonId: 'js-vars-01-v16', lessonTitle: { uz: "JavaScript — O'zgaruvchilar", ru: 'JavaScript — Переменные' } };
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

// JS kod ranglari
const Kw = ({ children }) => <span style={{ color: CODE.kw }}>{children}</span>;
const Vr = ({ children }) => <span style={{ color: CODE.vr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Nm = ({ children }) => <span style={{ color: CODE.num }}>{children}</span>;
const Op = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;

// O'zgaruvchi = nomlangan quti (asosiy vizual metafora)
const VarBox = ({ name, value, valColor = T.accent, small }) => (
  <div className="var-box" key={value}>
    <div className="var-name">📦 {name}</div>
    <div className="var-val" style={{ color: valColor, fontSize: small ? 'clamp(15px,2.4vw,19px)' : 'clamp(18px,3vw,24px)' }}>{value}</div>
  </div>
);

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

const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, audioText, audioOk, audioWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
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

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `O'yin o'ynaganingizda ekranda ballingiz, jonlaringiz va ismingiz turadi. O'yin ularni qayerda eslab qoladi? "Kod" tugmasini bosib, ichkariga qarang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('game');
  const OPTS = [
    { id: 'a', label: 'Sehr bilan — shunchaki eslab qoladi' },
    { id: 'b', label: "Nomlangan \"quti\" — o'zgaruvchida saqlaydi" },
    { id: 'c', label: 'Hech qayerda — har safar yo\'qoladi' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>O'yin ballingizni <span className="italic" style={{ color: T.accent }}>qayerda</span> saqlaydi?</h1>
        <Mentor>O'yin o'ynaganingizda ekranda <b style={{ color: T.ink }}>ballingiz</b>, jonlaringiz va ismingiz turadi. O'yin ularni qayerda eslab qoladi? <b style={{ color: T.ink }}>"Kod"</b> tugmasini bosib, ichkariga qarang.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'game' ? 'chip-on' : ''}`} onClick={() => setView('game')}>👾 O'yin</button>
              <button className={`chip ${view === 'code' ? 'chip-on' : ''}`} onClick={() => setView('code')}>{'</>'} Kod</button>
            </div>
            <div className="demo-swap" key={view}>
              {view === 'game' ? (
                <div style={{ background: '#101826', borderRadius: 14, padding: '18px 16px', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.2)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontFamily: "'Manrope',sans-serif" }}>
                    <span style={{ fontWeight: 800, color: '#FFCB6B' }}>👾 SPACE</span>
                    <span style={{ fontSize: 13, color: '#82AAFF' }}>O'yinchi: Aziza</span>
                  </div>
                  <div style={{ textAlign: 'center', margin: '16px 0' }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 38, color: '#7DD181' }}>1250</div>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: '#9FB4D8', letterSpacing: '0.1em' }}>BALL</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 18 }}>❤️ ❤️ ❤️</div>
                </div>
              ) : (
                <pre className="code-box"><Kw>let</Kw> <Vr>ball</Vr> <Op>=</Op> <Nm>1250</Nm>{'\n'}<Kw>let</Kw> <Vr>jon</Vr> <Op>=</Op> <Nm>3</Nm>{'\n'}<Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St></pre>
              )}
            </div>
            {view === 'code' && <p className="mono small" style={{ color: T.ink3, marginTop: 6, textAlign: 'center' }}>↑ har bir qiymat — nomlangan "quti"da</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, o'yin ballni qanday eslab qoladi?</p>
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
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'nalish! Bu "qutilar" — <b>o'zgaruvchilar</b>. Bugun ularni o'rganamiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Mana, eng qizig'i boshlanadi — bugun siz birinchi marta haqiqiy JavaScript kodi yozasiz! Boshlanishi esa o'zgaruvchilardan. Ularni 5 ta qadamda o'rganamiz va oxirida o'zingiz yozasiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: "O'zgaruvchi nima — nomlangan quti", tag: '' },
    { text: "Qiymat berish", tag: '=' },
    { text: "O'zgaradigan va o'zgarmas", tag: 'let / const' },
    { text: "Ma'lumot turlari", tag: 'matn · raqam' },
    { text: "O'zgaruvchini o'zing yozasan", tag: '' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugun shunday kod yozasiz</p>
      <pre className="code-box fade-up" style={{ fontSize: 'clamp(13px,1.9vw,15px)' }}><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St>{'\n'}<Kw>let</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>14</Nm>{'\n'}<Kw>const</Kw> <Vr>shahar</Vr> <Op>=</Op> <St>"Toshkent"</St></pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ uchta o'zgaruvchi, uchta "quti"</p>
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
          <h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Birinchi haqiqiy kodingizni yozasiz!</span></h2>
        </div>
        <Mentor>Mana, eng qizig'i boshlanadi — bugun siz birinchi marta <b style={{ color: T.ink }}>haqiqiy JavaScript kodi</b> yozasiz! Hammasi <b style={{ color: T.ink }}>o'zgaruvchilardan</b> boshlanadi. 5 qadamda o'rganamiz va oxirida o'zingiz yozasiz.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Kodni ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — O'ZGARUVCHI = NOMLANGAN QUTI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `O'zgaruvchini shunday tasavvur qiling: ustiga nom yozilgan quti. Qutining nomi bor — masalan "ism", ichida esa qiymat turadi — masalan Aziza. Nom orqali qutini istalgan payt topib, ichidagini olasiz. Quti qismlarini bosib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    nom: { label: 'Nom', role: 'Qutining yorlig\'i — uni shu nom orqali chaqirasiz. Masalan: ism, ball, yosh.' },
    qiymat: { label: 'Qiymat', role: 'Quti ichida saqlanadigan narsa. Masalan: "Aziza", 1250, 14.' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'zgaruvchi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 qismni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'zgaruvchi aslida <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></div>
        <Mentor>O'zgaruvchini shunday tasavvur qiling: ustiga nom yozilgan <b style={{ color: T.ink }}>quti</b>. Qutining <b style={{ color: T.ink }}>nomi</b> bor, ichida esa <b style={{ color: T.ink }}>qiymat</b> turadi. Nom orqali qutini istalgan payt topasiz. Quti qismlarini bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ background: T.paper, borderRadius: 16, boxShadow: `0 10px 26px -6px rgba(${T.shadowBase},0.16)`, overflow: 'hidden', minWidth: 180 }}>
                <div onClick={() => tap('nom')} style={{ cursor: 'pointer', background: active === 'nom' ? T.accent : T.ink, color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>📦 ism {seen.has('nom') && <span style={{ marginLeft: 'auto' }}>✓</span>}</div>
                <div onClick={() => tap('qiymat')} style={{ cursor: 'pointer', padding: '22px 16px', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 'clamp(20px,4vw,28px)', color: active === 'qiymat' ? T.accent : T.ink, background: active === 'qiymat' ? T.accentSoft : '#fff', transition: 'all 0.2s' }}>"Aziza" {seen.has('qiymat') && <span style={{ fontSize: 14, color: T.success }}>✓</span>}</div>
              </div>
            </div>
            <pre className="code-box fade-up delay-2" style={{ textAlign: 'center' }}><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St></pre>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span className="sk-wordbadge">{PARTS[active].label}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].role}</p>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Quti nomi yoki ichini bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mana shu — <b>o'zgaruvchi</b>: nomi bor quti. <span className="mono">ism</span> deb chaqirsangiz, ichidagi <span className="mono">"Aziza"</span> ni olasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — QIYMAT BERISH (=) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Qutiga qiymatni qanday solamiz? Teng belgisi orqali. Lekin diqqat: kodda teng belgisi "teng" degani emas — u "qutiga sol" degani. let ism teng Aziza degani: Aziza ni ism qutisiga sol. Bir qiymat tanlab, qutiga tushishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const VALUES = ['Aziza', 'Bobur', 'Dilnoza'];
  const [val, setVal] = useState(null);
  const done = val !== null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qiymat berish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bir qiymat tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qutiga qiymatni <span className="italic" style={{ color: T.accent }}>qanday</span> solamiz?</h2></div>
        <Mentor>Qutiga qiymat <b style={{ color: T.ink }}>= belgisi</b> orqali solinadi. Lekin diqqat: kodda <b style={{ color: T.ink }}>=</b> "teng" degani emas — u <b style={{ color: T.ink }}>"qutiga sol"</b> degani! Bir qiymat tanlab, qutiga tushishini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Qiymat tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {VALUES.map(v => (<button key={v} className={`chip ${val === v ? 'chip-on' : ''}`} onClick={() => setVal(v)}>"{v}"</button>))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(14px,2.4vw,18px)' }}><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"{val || '...'}"</St></pre>
            <div className="frame-soft fade-up delay-2"><p className="body" style={{ margin: 0, color: T.ink }}>O'qiymiz: «<span className="mono">"{val || '...'}"</span> ni <span className="mono">ism</span> qutisiga sol».</p></div>
          </Col>
          <Col>
            <p className="flow-label">Natija — quti</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              {val ? <VarBox name="ism" value={`"${val}"`} valColor={CODE.str} /> : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qiymat tanlang — quti to'ladi</p></div>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Tayyor! <span className="mono">ism</span> qutisida endi <span className="mono">"{val}"</span> turibdi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="O'zgaruvchi nima? To'g'ri variantni tanlang."
    questionText="O'zgaruvchi (peremennaya) nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>O'zgaruvchi nima?</p><h2 className="title h-sub" style={{ marginTop: 8 }}>O'zgaruvchi (peremennaya) nima?</h2></>}
    options={['Hisob-kitob amali', "Qiymat saqlaydigan nomlangan \"quti\"", 'Internet sahifasi', 'Rang turi']} correctIdx={1}
    explainCorrect="To'g'ri! O'zgaruvchi — nomi bor quti: ichida qiymat (matn, raqam...) saqlanadi va siz uni nom orqali chaqirasiz."
    explainWrong={{ 0: 'Yo’q — bu hisoblash emas. O’zgaruvchi qiymat saqlaydigan nomlangan quti.', 2: 'Yo’q — bu sahifa emas. O’zgaruvchi — kod ichidagi qiymat qutisi.', 3: 'Yo’q — rang emas. O’zgaruvchi — qiymat saqlaydigan nomlangan quti.', default: 'O’zgaruvchi — qiymat saqlaydigan nomlangan quti.' }} />
);

// ===== SCREEN 5 — let (o'zgaradigan quti) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `O'yindagi ballingizni eslang — u doim o'zgarib turadi-ku. Bunday o'zgarib turadigan qiymatlar uchun let so'zini ishlatamiz. let bilan ochilgan qutining ichini istagancha o'zgartirish mumkin. Tugmani bosib, ballni oshiring.`, trigger: 'on_mount', waits_for: null }]);
  const SEQ = [10, 25, 60, 100];
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const ball = SEQ[step];
  const done = touched;
  const bump = () => { setStep(s => (s + 1) % SEQ.length); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="let" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ballni o\'zgartiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Quti ichidagini <span className="italic" style={{ color: T.accent }}>o'zgartirsa</span> bo'ladimi?</h2></div>
        <Mentor>O'yindagi <b style={{ color: T.ink }}>ballingiz</b> doim o'zgarib turadi-ku. Bunday qiymatlar uchun <b style={{ color: T.ink }}>let</b> so'zini ishlatamiz — uning ichini istagancha o'zgartirsa bo'ladi. Tugmani bosib, ballni oshiring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Quti — ball</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}><VarBox name="ball" value={ball} valColor={CODE.num} /></div>
            <button className="btn" onClick={bump} style={{ alignSelf: 'center' }}>⬆️ Ballni oshirish</button>
          </Col>
          <Col>
            <p className="flow-label">Kod</p>
            <pre className="code-box fade-up" style={{ fontSize: 'clamp(13px,2vw,15px)' }}><Kw>let</Kw> <Vr>ball</Vr> <Op>=</Op> <Nm>10</Nm>  <span style={{ color: CODE.comment }}>{'// boshlang‘ich'}</span>{'\n'}{touched && <><Vr>ball</Vr> <Op>=</Op> <Nm>{ball}</Nm>  <span style={{ color: CODE.comment }}>{'// yangilandi'}</span></>}</pre>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>let</b> — bu o'zgaradigan quti. Qiymatni xohlagancha yangilaysiz: ball, jon, kayfiyat...</p></div>
              : <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Diqqat: ikkinchi marta <span className="mono">let</span> yozilmaydi — quti bor, faqat ichini almashtiramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Qiymati keyin o'zgarib turadigan o'zgaruvchini qaysi so'z bilan ochamiz?"
    questionText="Qiymati keyin o'zgaradigan o'zgaruvchini qaysi so'z bilan ochamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qiymati keyin <span className="italic" style={{ color: T.accent }}>o'zgaradigan</span> o'zgaruvchini qaysi so'z bilan ochamiz?</h2></>}
    options={['const', 'let', 'number', 'print']} correctIdx={1}
    explainCorrect="To'g'ri! let bilan ochilgan qutining qiymatini keyin istagancha o'zgartirish mumkin."
    explainWrong={{
      0: 'Yo’q — const o’zgarmas qiymat uchun. O’zgaradigan qiymat uchun let.',
      2: 'Yo’q — number bunday so’z emas. To’g’risi — let.',
      3: 'Yo’q — print bunday so’z emas. O’zgaradigan qiymat uchun let.',
      default: 'O’zgaradigan qiymat uchun — let.'
    }} />
);

// ===== SCREEN 6 — const (o'zgarmas quti) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Ba'zi qiymatlar esa hech qachon o'zgarmaydi. Tug'ilgan yilingizni o'ylab ko'ring — u doim bir xil. Bunday qiymatlar uchun const so'zini ishlatamiz. const qutisining ichini o'zgartirib bo'lmaydi. Ishonmaysizmi? Tugmani bosib, o'zgartirishga urinib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [tried, setTried] = useState(false);
  const done = tried;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="const" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'O\'zgartirishga urining'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ba'zi qiymatlar <span className="italic" style={{ color: T.accent }}>o'zgarmasligi</span> kerakmi?</h2></div>
        <Mentor>Ba'zi qiymatlar hech qachon o'zgarmaydi: <b style={{ color: T.ink }}>tug'ilgan yilingiz</b> doim bir xil-ku. Bunday qiymatlar uchun <b style={{ color: T.ink }}>const</b> so'zini ishlatamiz — uning ichini o'zgartirib bo'lmaydi. Ishonmaysizmi? Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Quti — o'zgarmas (const)</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ position: 'relative' }}>
                <VarBox name="tugilgan_yil" value={2012} valColor={CODE.num} />
                {tried && <span style={{ position: 'absolute', top: -10, right: -10, fontSize: 22 }}>🔒</span>}
              </div>
            </div>
            <button className="btn" onClick={() => setTried(true)} style={{ alignSelf: 'center' }}>✏️ Qiymatni o'zgartirishga urinish</button>
          </Col>
          <Col>
            <p className="flow-label">Kod</p>
            <pre className="code-box fade-up" style={{ fontSize: 'clamp(13px,2vw,15px)' }}><Kw>const</Kw> <Vr>tugilgan_yil</Vr> <Op>=</Op> <Nm>2012</Nm>{'\n'}{tried && <><Vr>tugilgan_yil</Vr> <Op>=</Op> <Nm>2015</Nm>{'\n'}<span style={{ color: T.accent }}>{'❌ Xato: const o‘zgarmaydi!'}</span></>}</pre>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi — <b>const</b> qutini "qulflaydi" 🔒. Qiymat bir marta solinadi va o'zgarmaydi.</p></div>
              : <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>const = constant = o'zgarmas. Tug'ilgan yil, hafta kunlari soni (7), Pi soni — bularga const.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — let vs const (qaysini tanlash) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Endi eng muhim qoidani mustahkamlaymiz. Qiymat o'zgaradimi — let. O'zgarmaydimi — const. Quyidagi har bir holat uchun to'g'ri so'zni tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const CASES = [
    { t: "O'yindagi balling", a: 'let', why: 'doim o‘zgaradi' },
    { t: "Tug'ilgan yiling", a: 'const', why: 'hech o‘zgarmaydi' },
    { t: 'Haftadagi kunlar (7)', a: 'const', why: 'doim 7' }
  ];
  const [ans, setAns] = useState(storedAnswer?.ans || {});
  const done = CASES.every((c, i) => ans[i] === c.a);
  const choose = (i, v) => { if (ans[i] === CASES[i].a) return; setAns(p => ({ ...p, [i]: v })); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, ans }); }, [done]);
  return (
    <Stage eyebrow="let vs const" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Hammasini to\'g\'ri tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">let yoki const — <span className="italic" style={{ color: T.accent }}>qaysi birini</span>?</h2></div>
        <Mentor>Oddiy qoida: qiymat <b style={{ color: T.ink }}>o'zgaradimi</b> — <span className="mono">let</span>. <b style={{ color: T.ink }}>O'zgarmaydimi</b> — <span className="mono">const</span>. Har bir holat uchun to'g'ri so'zni tanlang.</Mentor>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CASES.map((c, i) => {
            const correct = ans[i] === c.a;
            const wrong = ans[i] && ans[i] !== c.a;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.paper, borderRadius: 12, padding: '12px 15px', boxShadow: `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, flexWrap: 'wrap' }}>
                <span style={{ flex: 1, minWidth: 140, fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink }}>{c.t}</span>
                {correct ? (
                  <span className="mono" style={{ color: T.success, fontWeight: 700, fontSize: 14 }}>✓ {c.a} — {c.why}</span>
                ) : (
                  <span style={{ display: 'flex', gap: 7 }}>
                    {['let', 'const'].map(opt => (
                      <button key={opt} onClick={() => choose(i, opt)} className="mono" style={{ cursor: 'pointer', border: 'none', borderRadius: 9, padding: '8px 16px', fontWeight: 700, fontSize: 14, background: wrong && ans[i] === opt ? T.accentSoft : T.bg, color: wrong && ans[i] === opt ? T.accent : T.ink, boxShadow: `0 3px 9px -5px rgba(${T.shadowBase},0.2)` }}>{opt}</button>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Ajoyib! Ko'pincha <b>const</b> dan boshlanadi — agar qiymat keyin o'zgarishi kerak bo'lsa, <b>let</b> ga o'tasiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — var (eski usul) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Eski kodlarda yana bitta so'zni uchratasiz — var. Bu o'zgaruvchining eng eski usuli, 2015-yilgacha hamma shuni ishlatardi. Lekin uning kamchiliklari bor edi, shuning uchun bugun biz let va const ishlatamiz. var bilan shunchaki tanish bo'lib qo'ying. Tugmani bosib, eski va yangi usulni solishtiring.`, trigger: 'on_mount', waits_for: null }]);
  const [era, setEra] = useState('new');
  const [touched, setTouched] = useState(false);
  const done = touched;
  const set = (e) => { setEra(e); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="var" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">var — bu <span className="italic" style={{ color: T.accent }}>nima</span> (eski tanish)?</h2></div>
        <Mentor>Eski kodlarda yana bitta so'zni uchratasiz — <b style={{ color: T.ink }}>var</b>. Bu o'zgaruvchining eng eski usuli (2015-yilgacha). Kamchiliklari borligi uchun bugun biz <b style={{ color: T.ink }}>let</b> va <b style={{ color: T.ink }}>const</b> ishlatamiz. var bilan shunchaki tanish bo'lib qo'ying.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${era === 'old' ? 'chip-on' : ''}`} onClick={() => set('old')}>🕰️ Eski (2015 gacha)</button>
              <button className={`chip ${era === 'new' ? 'chip-on' : ''}`} onClick={() => set('new')}>✨ Hozir</button>
            </div>
            <pre className="code-box demo-swap" key={era} style={{ fontSize: 'clamp(13px,2.1vw,16px)' }}>
              {era === 'old'
                ? <><Kw>var</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St>{'\n'}<Kw>var</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>14</Nm></>
                : <><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St>{'\n'}<Kw>const</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>14</Nm></>}
            </pre>
          </Col>
          <Col>
            <div className="frame fade-up delay-2">
              <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px' }}>Qisqa xulosa</p>
              <p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">var</span> — eski usul, eski kodlarda ko'rasiz. <br /><span className="mono">let</span> va <span className="mono">const</span> — zamonaviy, ishonchli usul. <b>Siz doim shu ikkitasini ishlating.</b></p>
            </div>
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi uchalasini ham bilasiz: <b>var</b> (eski), <b>let</b> va <b>const</b> (yangi). Tanlov oson — let yoki const.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Tug'ilgan yilingiz kabi o'zgarmas qiymat uchun qaysi so'zni ishlatasiz?"
    questionText="Tug'ilgan yilingiz kabi o'zgarmas qiymat uchun qaysi so'zni ishlatasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Tug'ilgan yilingiz kabi <span className="italic" style={{ color: T.accent }}>o'zgarmas</span> qiymat uchun qaysi so'zni ishlatasiz?</h2></>}
    options={['let', 'const', 'var', 'box']} correctIdx={1}
    explainCorrect="To'g'ri! O'zgarmas qiymat uchun const — u qutini qulflaydi, qiymat o'zgarmaydi."
    explainWrong={{
      0: 'Yo’q — let o’zgaradigan qiymat uchun. O’zgarmas qiymatga const.',
      2: 'Yo’q — var eski usul. Zamonaviy o’zgarmas qiymat uchun const.',
      3: 'Yo’q — box bunday so’z emas. O’zgarmas qiymat uchun const.',
      default: 'O’zgarmas qiymat uchun — const.'
    }} />
);

// ===== SCREEN 10 — MA'LUMOT TURLARI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Qutiga turli xil narsa solish mumkin. Matn — masalan ism, qo'shtirnoq ichida yoziladi. Raqam — masalan yosh, qo'shtirnoqsiz. Va ha-yo'q qiymati — true yoki false. Bularni ma'lumot turlari deyiladi. Har birini bosib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const TYPES = {
    string: { name: 'Matn — string', box: { n: 'ism', v: '"Aziza"' }, color: CODE.str, desc: 'Harflar, so‘zlar. Doim qo‘shtirnoq ichida: "..."' },
    number: { name: 'Raqam — number', box: { n: 'yosh', v: '14' }, color: CODE.num, desc: 'Sonlar, qo‘shtirnoqsiz. Ular bilan hisob qilamiz.' },
    boolean: { name: "Ha/yo'q — boolean", box: { n: 'maktabda', v: 'true' }, color: CODE.bool, desc: 'Faqat ikki qiymat: true (ha) yoki false (yo‘q).' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ma'lumot turlari" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 turni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qutiga <span className="italic" style={{ color: T.accent }}>nima</span> solish mumkin?</h2></div>
        <Mentor>Qutiga turli xil narsa sig'adi: <b style={{ color: T.ink }}>matn</b> (qo'shtirnoq ichida), <b style={{ color: T.ink }}>raqam</b> (qo'shtirnoqsiz) va <b style={{ color: T.ink }}>ha/yo'q</b> (true yoki false). Bular — <b style={{ color: T.ink }}>ma'lumot turlari</b>. Har birini bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.keys(TYPES).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 15px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${TYPES[k].color}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span className="mono" style={{ fontWeight: 700, color: TYPES[k].color, fontSize: 14 }}>{TYPES[k].box.v}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{TYPES[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 14 }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }} key={active}>
                <div style={{ display: 'flex', justifyContent: 'center' }}><VarBox name={TYPES[active].box.n} value={TYPES[active].box.v} valColor={TYPES[active].color} small /></div>
                <div className="sk-info"><span className="sk-tagbig"><span className="sk-wordbadge">{TYPES[active].name}</span></span><p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{TYPES[active].desc}</p></div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir turni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Uchta asosiy tur: <b>matn</b>, <b>raqam</b>, <b>boolean</b>. Eng muhim farq — qo'shtirnoq!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — STRING vs NUMBER =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Endi eng muhim sirni ochaman. Qo'shtirnoq bitta narsani butunlay o'zgartiradi. Agar raqamlar qo'shtirnoqsiz bo'lsa — qo'shiladi: besh qo'shuv besh — o'n. Lekin qo'shtirnoq ichida bo'lsa — ular matn, shunchaki yopishtiriladi: besh-besh — besh yuz emas, ellik besh degani — "55". Ikki tugmani bosib solishtiring.`, trigger: 'on_mount', waits_for: null }]);
  const [mode, setMode] = useState('num');
  const [seen, setSeen] = useState(new Set(['num']));
  const done = seen.size >= 2;
  const set = (m) => { setMode(m); setSeen(prev => { const n = new Set(prev); n.add(m); return n; }); };
  const isNum = mode === 'num';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Matn vs Raqam" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Besh qo'shuv besh — <span className="italic" style={{ color: T.accent }}>qachon</span> o'n emas?</h2></div>
        <Mentor>Bitta <b style={{ color: T.ink }}>qo'shtirnoq</b> hammasini o'zgartiradi! Raqamlar qo'shtirnoqsiz bo'lsa — <b style={{ color: T.ink }}>qo'shiladi</b> (5+5=10). Qo'shtirnoq ichida bo'lsa — ular matn, <b style={{ color: T.ink }}>yopishtiriladi</b> ("5"+"5"="55"). Solishtiring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isNum ? 'chip-on' : ''}`} onClick={() => set('num')}>🔢 Raqam</button>
              <button className={`chip ${!isNum ? 'chip-on' : ''}`} onClick={() => set('str')}>🔤 Matn</button>
            </div>
            <pre className="code-box demo-swap" key={mode} style={{ fontSize: 'clamp(14px,2.4vw,18px)' }}>
              {isNum
                ? <><Nm>5</Nm> <Op>+</Op> <Nm>5</Nm>  <span style={{ color: CODE.comment }}>{'// raqamlar'}</span></>
                : <><St>"5"</St> <Op>+</Op> <St>"5"</St>  <span style={{ color: CODE.comment }}>{'// matn'}</span></>}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <div className="demo-swap" key={mode + 'r'} style={{ background: T.paper, borderRadius: 14, padding: '22px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(36px,8vw,52px)', color: isNum ? CODE.num : T.accent }}>{isNum ? '10' : '"55"'}</div>
              <p className="body" style={{ margin: '6px 0 0', color: T.ink2 }}>{isNum ? 'Qo‘shildi — chunki raqam' : 'Yopishdi — chunki matn'}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Esda saqlang: <b>qo'shtirnoq bor → matn</b>, <b>qo'shtirnoq yo'q → raqam</b>. Bu — eng ko'p chalkashtiradigan joy!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Quyidagilardan qaysi biri RAQAM (number)?"
    questionText="Qaysi biri RAQAM (number)?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi biri <span className="italic" style={{ color: T.accent }}>RAQAM</span> (number)?</h2></>}
    options={['"25"', '25', '"yigirma"', 'true']} correctIdx={1}
    explainCorrect="To'g'ri! 25 — qo'shtirnoqsiz, demak raqam (number). U bilan hisob qilsa bo'ladi."
    explainWrong={{
      0: '"25" — qo’shtirnoqda, demak bu matn (string), raqam emas.',
      2: '"yigirma" — qo’shtirnoqdagi so’z, bu matn (string).',
      3: 'true — bu boolean (ha/yo’q), raqam emas. Raqam — qo’shtirnoqsiz 25.',
      default: 'Qo’shtirnoqsiz son — raqam: 25.'
    }} />
);

// ===== SCREEN 13 — AMALIYOT: O'ZGARUVCHILAR YIG'ISH =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Endi navbat sizga — o'zingiz haqingizda bir nechta o'zgaruvchi yarating. Pastdagi bloklarni bosib qo'shing: ism, yosh, shahar... Kamida 3 ta o'zgaruvchi yig'ing.`, trigger: 'on_mount', waits_for: null }]);
  const BLOCKS = [
    { kw: 'let', name: 'ism', val: '"Aziza"', t: 'str' },
    { kw: 'let', name: 'yosh', val: '14', t: 'num' },
    { kw: 'const', name: 'shahar', val: '"Toshkent"', t: 'str' },
    { kw: 'let', name: 'ball', val: '0', t: 'num' },
    { kw: 'const', name: 'maktab', val: '"Coddycamp"', t: 'str' },
    { kw: 'let', name: 'oqiyaptimi', val: 'true', t: 'bool' }
  ];
  const MAX = 6;
  const colorOf = (t) => (t === 'str' ? CODE.str : t === 'bool' ? CODE.bool : CODE.num);
  const [items, setItems] = useState([]);
  const done = items.length >= 3;
  const add = (b) => { if (items.length >= MAX || items.find(x => x.name === b.name)) return; setItems(prev => [...prev, b]); };
  const reset = () => setItems([]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · o'zgaruvchilar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 3 ta (${items.length}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z o'zgaruvchilaringizni <span className="italic" style={{ color: T.accent }}>yarating</span></h2></div>
        <Mentor>Endi navbat sizga — o'zingiz haqingizda o'zgaruvchilar yarating. Bloklarni bosib qo'shing: ism, yosh, shahar... Kamida <b style={{ color: T.ink }}>3 ta</b> o'zgaruvchi yig'ing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Bloklar — bosib qo'shing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BLOCKS.map((b, i) => (
                <button key={i} className="gchip" disabled={items.length >= MAX || !!items.find(x => x.name === b.name)} onClick={() => add(b)}>
                  <span className="mono" style={{ color: T.accent }}>{b.kw}</span> {b.name}
                </button>
              ))}
              {items.length > 0 && <button className="gchip" onClick={reset}>↺ Tozalash</button>}
            </div>
            <p className="body fade-up delay-2" style={{ margin: '2px 0 0', color: T.ink3, fontSize: 13 }}><b style={{ color: T.ink2 }}>Maslahat:</b> o'zgaradiganiga let, o'zgarmasiga const.</p>
          </Col>
          <Col>
            <p className="flow-label">Sizning kodingiz</p>
            <pre className="code-box" style={{ minHeight: 110 }}>
              {items.length === 0
                ? <span style={{ color: CODE.comment }}>{'// blok qo‘shing…'}</span>
                : items.map((b, i) => (<span key={i} className="el-in" style={{ display: 'block' }}><Kw>{b.kw}</Kw> <Vr>{b.name}</Vr> <Op>=</Op> <span style={{ color: colorOf(b.t) }}>{b.val}</span></span>))}
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Siz {items.length} ta o'zgaruvchi yaratdingiz — har biri nomi va qiymati bor quti.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (qo'shtirnoq tushib qolgan) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `AI sizga kod yozib berdi, lekin bittasida xato bor — dastur ishlamayapti. Yaxshilab qarang: bir o'zgaruvchining matn qiymati qo'shtirnoqsiz qolib ketibdi. Xato qatorni toping va bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'ism' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'ism';
  const done = fixed;
  const pickIsm = () => { if (found) return; setPicked('ism'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Aziza qo'shtirnoqsiz — kompyuter uni o'zgaruvchi deb o'ylab, topolmayapti. Qo'shtirnoq qo'shamiz.`); }, 300); };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi "Aziza" matn bo'ldi — kod ishlaydi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kod ishlamadi — <span className="italic" style={{ color: T.accent }}>nega</span>?</h2></div>
        <Mentor>AI kod yozib berdi, lekin dastur <b style={{ color: T.ink }}>ishlamayapti</b>. Yaxshilab qarang: bir o'zgaruvchining <b style={{ color: T.ink }}>matn qiymati qo'shtirnoqsiz</b> qolib ketibdi. Xato qatorni toping va bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana, o'zgaruvchilaringiz:</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default' }}><Kw>let</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>14</Nm></div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickIsm}><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> {fixed ? <St>"Aziza"</St> : <span style={{ color: CODE.text }}>Aziza</span>} {!fixed && <span style={{ color: CODE.comment }}>{'// ?'}</span>}</div>
                <div className="ai-line" style={{ cursor: 'default' }}><Kw>const</Kw> <Vr>shahar</Vr> <Op>=</Op> <St>"Toshkent"</St></div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qatorda xato? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 "Aziza" ga qo'shtirnoq qo'shish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi kod ishlaydi!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              picked && picked !== 'ism'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri. Yana qarang: qaysi matn qiymatida <b>qo'shtirnoq yetishmayapti</b>?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: matn qiymati doim <b style={{ color: T.ink }}>qo'shtirnoq ichida</b> bo'lishi kerak. Qaysi qatorda yo'q?</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">Aziza</span> qo'shtirnoqsiz — kompyuter uni o'zgaruvchi deb o'ylab, topolmayapti. To'g'risi: <span className="mono">"Aziza"</span>. Chap tugmani bosing →</p></div>)}
            {fixed && (<>
              <p className="flow-label">Endi ishlaydi</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}><VarBox name="ism" value={'"Aziza"'} valColor={CODE.str} small /></div>
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">Matn = qo'shtirnoq ichida</p></div>
            </>)}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (o'zgaruvchini o'zi yozadi) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Mana, eng muhim lahza — birinchi o'zgaruvchingizni butunlay o'zingiz yozasiz. Ismingizni saqlaydigan o'zgaruvchi yozing: let, keyin nom, teng belgisi va qo'shtirnoqda ismingiz. Masalan: let ism teng qo'shtirnoqda Aziza.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.trim();
  const m = v.match(/^(let|const|var)\s+([A-Za-z_]\w*)\s*=\s*(.+)$/);
  const hasKw = /^(let|const|var)\b/.test(v);
  const hasName = /^(let|const|var)\s+[A-Za-z_]\w*/.test(v);
  const hasEq = /^(let|const|var)\s+[A-Za-z_]\w*\s*=/.test(v);
  const valid = !!m && m[3].trim().length > 0;
  const nm = valid ? m[2] : '';
  const vv = valid ? m[3].trim() : '';
  const valIsStr = /^".*"$/.test(vv) || /^'.*'$/.test(vv);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { correct: true, picked: value });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! Birinchi o'zgaruvchingizni o'zingiz yozdingiz. Tabriklayman!`); }, 300);
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'O\'zgaruvchini yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: o'zgaruvchini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yozing.</h2></div>
        <Mentor>Ismingizni saqlaydigan o'zgaruvchi yozing: <span className="mono">let</span>, keyin nom, <span className="mono">=</span> va qo'shtirnoqda ismingiz. Masalan: <span className="mono">let ism = "Aziza"</span>.</Mentor>
        <div className="split">
          <Col>
            <input className="fade-up delay-1" value={value} onChange={e => setValue(e.target.value)} placeholder={'let ism = "Aziza"'} spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasKw ? 1 : 0.4 }}>{hasKw ? '✓' : '1'} let / const</span>
              <span className="tagpill" style={{ opacity: hasName ? 1 : 0.4 }}>{hasName ? '✓' : '2'} nom</span>
              <span className="tagpill" style={{ opacity: hasEq ? 1 : 0.4 }}>{hasEq ? '✓' : '3'} =</span>
              <span className="tagpill" style={{ opacity: valid ? 1 : 0.4 }}>{valid ? '✓' : '4'} qiymat</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Bu — to'liq, to'g'ri o'zgaruvchi. Siz haqiqiy JavaScript yozdingiz!</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Matn qiymatini qo'shtirnoqqa oling: <span className="mono">"..."</span>. Raqam uchun qo'shtirnoq shart emas.</p>)}
          </Col>
          <Col>
            <p className="flow-label">natija — quti</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              {valid
                ? <VarBox name={nm} value={vv} valColor={valIsStr ? CODE.str : CODE.num} />
                : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>To'liq yozing — quti shu yerda paydo bo'ladi</p></div>}
            </div>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz — bugun siz birinchi haqiqiy JavaScript kodingizni yozdingiz! Eslab qoling: o'zgaruvchi — nomlangan quti, let o'zgaradi, const o'zgarmaydi, qiymatlar esa matn, raqam yoki boolean bo'ladi. Keyingi darsda o'zgaruvchilarni ekranga chiqarib, ular bilan amallar bajaramiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ["O'zgaruvchi — qiymat saqlaydigan nomlangan quti", "Qiymat berish: = (\"qutiga sol\")", "let — o'zgaradi, const — o'zgarmas", "var — eski usul, bugun let/const", "Turlar: matn (string), raqam (number), boolean"];
  const HOMEWORK = [{ b: 'ism', t: '— let bilan, qo‘shtirnoqda' }, { b: 'yosh', t: '— let bilan, qo‘shtirnoqsiz raqam' }, { b: 'tugilgan_yil', t: '— const bilan' }];
  const GLOSSARY = [{ b: "O'zgaruvchi", t: '— nomlangan quti' }, { b: 'let', t: '— o‘zgaradigan' }, { b: 'const', t: '— o‘zgarmas' }, { b: 'var', t: '— eski usul' }, { b: 'string', t: '— matn ("...")' }, { b: 'number', t: '— raqam' }, { b: 'boolean', t: '— true / false' }];
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
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Birinchi <span className="italic" style={{ color: T.accent }}>JavaScript</span> kodingizni yozdingiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Endi o‘zgaruvchilar bilan ishlay olasiz — let, const va ma’lumot turlari sizniki.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko‘ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'zingiz haqingizda 3 ta o'zgaruvchi yozing:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b className="mono">{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Avval qo'lda yozing, keyin to'g'ri-noto'g'risini tekshiring. Keyingi darsda ularni ekranga chiqaramiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function JsVarsLesson({ lang: langProp, onFinished }) {
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

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava svg { display: block; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.65; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

        /* O'zgaruvchi qutisi */
        .var-box { display: inline-flex; flex-direction: column; min-width: 130px; border-radius: 14px; overflow: hidden; background: ${T.paper}; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.18); }
        .var-name { background: ${T.ink}; color: ${T.bg}; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12.5px; padding: 8px 14px; letter-spacing: 0.03em; display: flex; align-items: center; gap: 6px; }
        .var-val { padding: 16px 14px; font-family: 'JetBrains Mono', monospace; font-weight: 700; text-align: center; }

        .h-title { font-size: clamp(22px,4vw,38px); }
        .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

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

        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.3s ease-out; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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
