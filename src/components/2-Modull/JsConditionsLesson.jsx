import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// 09-DARS — JAVASCRIPT: if / else — PLATFORM STANDARD v16
// Mavzu: shart (if), taqqoslash operatorlari (> < >= <= === !==),
//        else, else if, ichma-ich (nested) shartlar, === vs =.
// Hook: yosh chegarasi (attraksion turniketi).
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

const LESSON_META = { lessonId: 'js-cond-01-v16', lessonTitle: { uz: 'JavaScript — if/else', ru: 'JavaScript — if/else' } };
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
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;

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
        <img src={mentorImg} alt="" />
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

// Natija (true/false) belgisi
const BoolPill = ({ value, pulse }) => (
  <span className={pulse ? `pop-in ${value ? 'ring-green' : 'ring-red'}` : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: value ? T.success : T.accent, background: value ? T.successSoft : T.accentSoft, padding: '5px 12px', borderRadius: 99 }}>{value ? '✓ true' : '✗ false'}</span>
);

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

// ===== SCREEN 0 — HOOK (yosh chegarasi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Attraksionga yozuv osilgan: "12 yoshdan oshganlar chiqadi". Turniket sizning yoshingizga qarab ochiladi yoki yopiq qoladi. Dastur bu qarorni qanday qabul qiladi? Yoshni o'zgartirib, turniketni sinab ko'ring.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [age, setAge] = useState(10);
  const allowed = age >= 12;
  const OPTS = [
    { id: 'a', label: 'Tasodifan — goh ochadi, goh yo\'q' },
    { id: 'b', label: 'Shartni tekshiradi: yosh 12 dan oshganmi?' },
    { id: 'c', label: 'Hamma uchun doim ochiq' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Turniket <span className="italic" style={{ color: T.accent }}>qachon</span> ochiladi?</h1>
        <Mentor><b style={{ color: T.ink }}>Turniket</b> — bu kirish darvozasi. Attraksionda yozuv: <b style={{ color: T.ink }}>"12 yoshdan oshganlar chiqadi"</b>. Demak darvoza <b style={{ color: T.ink }}>yoshni tekshiradi</b>: yetarli bo'lsa ochiladi, bo'lmasa yopiq qoladi. Yoshni o'zgartirib, sinab ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label">Yoshingizni tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[8, 12, 15].map(a => (<button key={a} className={`chip ${age === a ? 'chip-on' : ''}`} onClick={() => setAge(a)}>{a} yosh</button>))}
            </div>
            <div style={{ background: allowed ? T.successSoft : T.accentSoft, borderRadius: 16, padding: '22px 16px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.16)`, transition: 'background 0.35s ease' }}>
              <div className="gate-wrap"><span className="gate-post l" /><span className="gate-post r" /><span className={`gate-bar ${allowed ? 'open' : 'shut'}`} /></div>
              <p className="demo-swap" key={age} style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: allowed ? T.success : T.accent, margin: '16px 0 2px', fontSize: 'clamp(16px,2.4vw,20px)' }}>{allowed ? '✅ Turniket ochildi!' : '⛔ Turniket yopiq'}</p>
              <p className="mono small" style={{ color: T.ink2, margin: 0 }}>yosh = {age} · {age} {'>='} 12 → {String(allowed)}</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Dastur turniketni qanday hal qiladi?</p>
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
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'nalish! Dastur <b>shartni</b> tekshiradi. Buni <span className="mono">if</span> bilan yozamiz — bugun shuni o'rganamiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Algoritm darsida "agar... bo'lsa..." degandik, esingizdami? Bugun aynan shuni haqiqiy kodga aylantiramiz — if va else. Dasturingiz endi qaror qabul qila oladi. 5 qadamda o'rganamiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'if — shart bajarilsa, kod ishlaydi', tag: 'if' },
    { text: 'Taqqoslash operatorlari', tag: '> < >= ===' },
    { text: 'else — aks holda', tag: 'else' },
    { text: "Bir nechta yo'l", tag: 'else if' },
    { text: 'Ichma-ich shartlar + o\'zing yoz', tag: 'nested' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugun shunday kod yozasiz</p>
      <pre className="code-box fade-up" style={{ fontSize: 'clamp(12.5px,1.9vw,14.5px)' }}><Kw>if</Kw> (<Vr>yosh</Vr> <Op>{'>='}</Op> <Nm>12</Nm>) {'{'}{'\n'}{'  '}<Vr>console</Vr>.<Vr>log</Vr>(<St>"Kiring!"</St>){'\n'}{'}'} <Kw>else</Kw> {'{'}{'\n'}{'  '}<Vr>console</Vr>.<Vr>log</Vr>(<St>"Ruxsat yo'q"</St>){'\n'}{'}'}</pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ dastur qaror qabul qiladi</p>
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
          <h2 className="title h-title fade-up">Kod endi <span className="italic" style={{ color: T.accent }}>o'zi tanlaydi</span></h2>
        </div>
        <Mentor>Hayotda doim shart bilan ish qilamiz: <b style={{ color: T.ink }}>yomg'ir yog'sa</b> — soyabon olasiz, <b style={{ color: T.ink }}>aks holda</b> — yo'q. Kod ham xuddi shunday <b style={{ color: T.ink }}>"agar... bo'lsa..."</b> deb o'ylaydi — buni <span className="mono">if</span> va <span className="mono">else</span> bilan yozamiz. 5 qadamda o'rganamiz.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
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

// ===== SCREEN 2 — if (shart) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `if degani "agar" degani. Qavs ichiga shart yozasiz, figurali qavs ichiga esa kod. Qoida oddiy: agar shart rost — true bo'lsa, ichidagi kod ishlaydi. Yolg'on — false bo'lsa, o'tkazib yuboriladi. Yoshni o'zgartirib, kod ishlaydimi yoki yo'qmi, ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [age, setAge] = useState(10);
  const [touched, setTouched] = useState(false);
  const cond = age >= 12;
  const done = touched;
  const setA = (a) => { setAge(a); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="if" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Yoshni o\'zgartiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Dastur <span className="italic" style={{ color: T.accent }}>qachon</span> kodni bajaradi?</h2></div>
        <Mentor><span className="mono">if</span> degani <b style={{ color: T.ink }}>"agar"</b>. Qavs ichiga <b style={{ color: T.ink }}>shart</b>, figurali qavs <span className="mono">{'{ }'}</span> ichiga <b style={{ color: T.ink }}>kod</b> yoziladi. Shart <b style={{ color: T.ink }}>rost (true)</b> bo'lsa — kod ishlaydi. Yoshni o'zgartiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">yosh = {age}</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[10, 15].map(a => (<button key={a} className={`chip ${age === a ? 'chip-on' : ''}`} onClick={() => setA(a)}>{a} yosh</button>))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(13px,2vw,15px)' }}>
              <Kw>if</Kw> (<Vr>yosh</Vr> <Op>{'>='}</Op> <Nm>12</Nm>) {'{'}  <Cm>{`// ${age} >= 12 → ${cond}`}</Cm>{'\n'}
              <span style={{ background: cond ? 'rgba(31,122,77,0.25)' : 'transparent', borderRadius: 4, opacity: cond ? 1 : 0.4 }}>{'  '}<Vr>console</Vr>.<Vr>log</Vr>(<St>"Kiring!"</St>)</span>{'\n'}
              {'}'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <div className="demo-swap" key={age + 'r'} style={{ background: T.paper, borderRadius: 14, padding: '18px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <BoolPill value={cond} />
              <p className="body" style={{ margin: '12px 0 0', color: T.ink }}>{cond ? '✅ Shart rost → kod ishladi: «Kiring!»' : '⛔ Shart yolg\'on → kod o\'tkazib yuborildi'}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>if</b> — bu darvoza: shart <b>true</b> bo'lsagina ichidagi kodga yo'l ochiladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — TAQQOSLASH OPERATORLARI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Shartni qanday yozamiz? Taqqoslash operatorlari bilan. Katta, kichik, katta yoki teng, teng, teng emas. Har biri ikki qiymatni solishtirib, true yoki false qaytaradi. Operatorlarni bosib, natijani ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const A = 14, B = 12;
  const OPS = [
    { op: '>', res: A > B, name: 'katta' },
    { op: '<', res: A < B, name: 'kichik' },
    { op: '>=', res: A >= B, name: 'katta yoki teng' },
    { op: '<=', res: A <= B, name: 'kichik yoki teng' },
    { op: '===', res: A === B, name: 'teng' },
    { op: '!==', res: A !== B, name: 'teng emas' }
  ];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 3;
  const tap = (op) => { setActive(op); setSeen(prev => { const n = new Set(prev); n.add(op); return n; }); };
  const cur = OPS.find(o => o.op === active);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Taqqoslash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 operatorni sinang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Shartni <span className="italic" style={{ color: T.accent }}>qanday</span> yozamiz?</h2></div>
        <Mentor>Shart — <b style={{ color: T.ink }}>taqqoslash operatorlari</b> bilan yoziladi. Har biri ikki qiymatni solishtirib, <b style={{ color: T.ink }}>true</b> yoki <b style={{ color: T.ink }}>false</b> qaytaradi. Operatorlarni bosib, natijani ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Operatorni tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {OPS.map(o => (<button key={o.op} className={`chip ${active === o.op ? 'chip-on' : ''}`} onClick={() => tap(o.op)}><span className="mono">{o.op}</span>{seen.has(o.op) && ' ✓'}</button>))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(15px,2.6vw,20px)', textAlign: 'center' }}><Nm>{A}</Nm> <span className="pop-num" key={active} style={{ color: CODE.punct, fontWeight: 700 }}>{active || '?'}</span> <Nm>{B}</Nm></pre>
          </Col>
          <Col>
            {cur ? (
              <div className="demo-swap" key={active} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="pop-in" style={{ background: T.paper, borderRadius: 14, padding: '18px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
                  <p className="mono" style={{ margin: '0 0 10px', color: T.ink2, fontSize: 15 }}>{A} {cur.op} {B}</p>
                  <BoolPill value={cur.res} pulse />
                </div>
                <div className="sk-info"><span className="sk-tagbig"><span className="sk-wordbadge mono">{cur.op}</span><span style={{ fontWeight: 600, color: T.ink }}>{cur.name}</span></span><p className="body" style={{ color: T.ink, margin: '9px 0 0' }}>{`14 ${cur.name} 12? Javob: ${cur.res ? 'ha (true)' : "yo'q (false)"}.`}</p></div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Operatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Esda saqlang: <span className="mono">===</span> teng, <span className="mono">!==</span> teng emas, <span className="mono">{'>='}</span> katta yoki teng. Hammasi true/false beradi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="if blokining ichidagi kod qachon ishlaydi?"
    questionText="if blokining ichidagi kod qachon ishlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>if blokining ichidagi kod <span className="italic" style={{ color: T.accent }}>qachon</span> ishlaydi?</h2></>}
    options={['Doim, har safar', 'Shart rost (true) bo\'lganda', 'Hech qachon', 'Shart yolg\'on (false) bo\'lganda']} correctIdx={1}
    explainCorrect="To'g'ri! if ichidagi kod faqat shart true bo'lganda ishlaydi. false bo'lsa — o'tkazib yuboriladi."
    explainWrong={{ 0: 'Yo’q — doim emas. Faqat shart true bo’lganda ishlaydi.', 2: 'Yo’q — shart true bo’lsa ishlaydi.', 3: 'Aksincha — false bo’lsa o’tkazib yuboriladi. true bo’lsa ishlaydi.', default: 'if ichidagi kod shart true bo’lganda ishlaydi.' }} />
);

// ===== SCREEN 5 — else =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Agar shart bajarilmasa-chi? Buning uchun else bor — "aks holda" degani. if rost bo'lsa, birinchi blok ishlaydi; aks holda else bloki ishlaydi. Ikkalasidan bittasi doim ishlaydi. Yoshni o'zgartirib, qaysi yo'l tanlanishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [age, setAge] = useState(10);
  const [seen, setSeen] = useState(new Set([10]));
  const allowed = age >= 12;
  const done = seen.size >= 2;
  const setA = (a) => { setAge(a); setSeen(prev => { const n = new Set(prev); n.add(a); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="else" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala yo\'lni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Shart bajarilmasa, dastur <span className="italic" style={{ color: T.accent }}>nima qiladi</span>?</h2></div>
        <Mentor><span className="mono">else</span> — bu <b style={{ color: T.ink }}>"aks holda"</b>, ya'ni <b style={{ color: T.ink }}>ikkinchi yo'l</b> (tugadi degani emas!). Shart <b style={{ color: T.ink }}>rost</b> bo'lsa — if bloki, <b style={{ color: T.ink }}>yolg'on</b> bo'lsa — else bloki ishlaydi. Doim ikkitadan bittasi. Yoshni o'zgartiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[10, 15].map(a => (<button key={a} className={`chip ${age === a ? 'chip-on' : ''}`} onClick={() => setA(a)}>{a} yosh</button>))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(12.5px,1.9vw,14.5px)' }}>
              <Kw>if</Kw> (<Vr>yosh</Vr> <Op>{'>='}</Op> <Nm>12</Nm>) {'{'}{'\n'}
              <span style={{ background: allowed ? 'rgba(31,122,77,0.25)' : 'transparent', borderRadius: 4, opacity: allowed ? 1 : 0.4, transition: 'background 0.35s, opacity 0.35s' }}>{'  '}<Vr>console</Vr>.<Vr>log</Vr>(<St>"Kiring!"</St>)</span>{'\n'}
              {'}'} <Kw>else</Kw> {'{'}{'\n'}
              <span style={{ background: !allowed ? 'rgba(255,79,40,0.22)' : 'transparent', borderRadius: 4, opacity: !allowed ? 1 : 0.4, transition: 'background 0.35s, opacity 0.35s' }}>{'  '}<Vr>console</Vr>.<Vr>log</Vr>(<St>"Ruxsat yo'q"</St>)</span>{'\n'}
              {'}'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <div className="demo-swap" key={age} style={{ background: allowed ? T.successSoft : T.accentSoft, borderRadius: 14, padding: '20px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)`, transition: 'background 0.35s' }}>
              <div className="pop-num" style={{ fontSize: 36 }}>{allowed ? '✅' : '⛔'}</div>
              <p className="mono" style={{ margin: '8px 0 0', fontWeight: 700, color: allowed ? T.success : T.accent }}>{allowed ? '"Kiring!"' : '"Ruxsat yo\'q"'}</p>
              <p className="small" style={{ margin: '6px 0 0', color: T.ink2 }}>{allowed ? '↑ if bloki ishladi' : '↓ else bloki ishladi'}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>if / else</b> — ikki yo'lli ayri: rost bo'lsa biri, yolg'on bo'lsa ikkinchisi. Hech qachon ikkalasi birga emas.</p></div>}
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
    audioText="Shart yolg'on, ya'ni false bo'lsa, qaysi blok ishlaydi?"
    questionText="Shart false (yolg'on) bo'lsa, qaysi blok ishlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Shart <span className="italic" style={{ color: T.accent }}>false</span> bo'lsa, qaysi blok ishlaydi?</h2></>}
    options={['if bloki', 'else bloki', 'Ikkalasi', 'Hech biri']} correctIdx={1}
    explainCorrect="To'g'ri! Shart false bo'lsa, if bloki o'tkazib yuboriladi va else bloki ishlaydi."
    explainWrong={{
      0: 'Yo’q — if bloki shart true bo’lganda ishlaydi. false bo’lsa — else.',
      2: 'Yo’q — har doim faqat bittasi ishlaydi, ikkalasi emas.',
      3: 'Yo’q — else aynan shu holat uchun: false bo’lsa else ishlaydi.',
      default: 'false bo’lsa — else bloki ishlaydi.'
    }} />
);

// ===== SCREEN 6 — === vs = =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Endi eng muhim sirni aytaman — yangi boshlovchilar shu yerda ko'p adashadi. Bitta teng belgisi qiymatni qutiga soladi, o'zlashtiradi. Uchta teng belgisi esa savol beradi: bular tengmi? va true yoki false qaytaradi. Shart yozganda doim uchta teng belgisi ishlatasiz. Ikkala kartani bosib solishtiring.`, trigger: 'on_mount', waits_for: null }]);
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="=== va =" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>=</span> va <span className="italic" style={{ color: T.accent }}>===</span> — farqi nimada?</h2></div>
        <Mentor>Bu yerda yangi boshlovchilar ko'p adashadi! <b style={{ color: T.ink }}>=</b> qiymatni qutiga <b style={{ color: T.ink }}>soladi</b>. <b style={{ color: T.ink }}>===</b> esa savol beradi: <b style={{ color: T.ink }}>tengmi?</b> va true/false qaytaradi. Shartda doim <span className="mono">===</span> ishlatasiz! Ikkala kartani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button onClick={() => tap('assign')} className="fade-up delay-1" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', borderRadius: 14, padding: '15px 17px', background: T.paper, boxShadow: active === 'assign' ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s', marginBottom: 10 }}>
              <p className="mono" style={{ margin: '0 0 6px', fontSize: 16, color: T.ink }}><Vr>ball</Vr> <Op>=</Op> <Nm>10</Nm></p>
              <p className="small" style={{ margin: 0, color: T.ink2 }}>📥 O'zlashtirish — "10 ni ball qutisiga sol" {seen.has('assign') && '✓'}</p>
            </button>
            <button onClick={() => tap('compare')} className="fade-up delay-1" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', borderRadius: 14, padding: '15px 17px', background: T.paper, boxShadow: active === 'compare' ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
              <p className="mono" style={{ margin: '0 0 6px', fontSize: 16, color: T.ink }}><Vr>ball</Vr> <Op>===</Op> <Nm>10</Nm></p>
              <p className="small" style={{ margin: 0, color: T.ink2 }}>❓ Taqqoslash — "ball 10 ga tengmi?" → true/false {seen.has('compare') && '✓'}</p>
            </button>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                {active === 'assign'
                  ? (<><span className="sk-tagbig"><span className="sk-wordbadge mono">=</span><span style={{ fontWeight: 600, color: T.ink }}>o'zlashtirish</span></span><p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>Quti yaratganda ishlatamiz (1-darsdan). Hech narsa tekshirmaydi — shunchaki qiymat soladi.</p><div className="pop-in" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span className="mono" style={{ fontWeight: 700, color: T.ink }}>10</span><span className="flow-x" style={{ color: T.accent, fontWeight: 700, fontSize: 18 }}>→</span><span className="var-box" style={{ minWidth: 92 }}><span className="var-name">ball</span><span className="var-val" style={{ fontSize: 18, color: T.ink }}>10</span></span></div></>)
                  : (<><span className="sk-tagbig"><span className="sk-wordbadge mono">===</span><span style={{ fontWeight: 600, color: T.ink }}>taqqoslash</span></span><p className="body" style={{ color: T.ink, margin: '10px 0 4px' }}>Ikki qiymatni solishtiradi va <b>true</b> yoki <b>false</b> qaytaradi.</p><div className="pop-in" style={{ margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, flexWrap: 'wrap' }}><span className="mono" style={{ color: T.ink2 }}>10 === 10</span><span className="flow-x" style={{ color: T.ink3, fontSize: 18 }}>→</span><BoolPill value={true} pulse /></div><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>Shartlarda (if) doim shu — ===.</b></p></>)}
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir kartani bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>Qoida:</b> qiymat berish — <span className="mono">=</span>, tekshirish — <span className="mono">===</span>. Aralashtirmang!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — else if =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Ba'zan ikki emas, bir nechta yo'l bo'ladi. Masalan imtihon bahosi: ball 90 dan oshsa — besh, 70 dan — to'rt, 60 dan — uch, aks holda — ikki. Buning uchun else if ishlatamiz — ya'ni "aks holda, agar...". Ballni o'zgartirib, qaysi baho chiqishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const BALLS = [95, 80, 65, 40];
  const [ball, setBall] = useState(95);
  const [seen, setSeen] = useState(new Set([95]));
  const grade = ball >= 90 ? 5 : ball >= 70 ? 4 : ball >= 60 ? 3 : 2;
  const branch = ball >= 90 ? 0 : ball >= 70 ? 1 : ball >= 60 ? 2 : 3;
  const done = seen.size >= 2;
  const setB = (b) => { setBall(b); setSeen(prev => { const n = new Set(prev); n.add(b); return n; }); };
  const LINES = [
    { c: <><Kw>if</Kw> (<Vr>ball</Vr> <Op>{'>='}</Op> <Nm>90</Nm>) {'{'} <Vr>baho</Vr> <Op>=</Op> <Nm>5</Nm> {'}'}</> },
    { c: <><Kw>else if</Kw> (<Vr>ball</Vr> <Op>{'>='}</Op> <Nm>70</Nm>) {'{'} <Vr>baho</Vr> <Op>=</Op> <Nm>4</Nm> {'}'}</> },
    { c: <><Kw>else if</Kw> (<Vr>ball</Vr> <Op>{'>='}</Op> <Nm>60</Nm>) {'{'} <Vr>baho</Vr> <Op>=</Op> <Nm>3</Nm> {'}'}</> },
    { c: <><Kw>else</Kw> {'{'} <Vr>baho</Vr> <Op>=</Op> <Nm>2</Nm> {'}'}</> }
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="else if" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ballni o\'zgartiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir nechta yo'l bo'lsa, dastur <span className="italic" style={{ color: T.accent }}>qaysi birini</span> tanlaydi?</h2></div>
        <Mentor>Ba'zan bir nechta yo'l bo'ladi. Imtihon bahosi: 90+ → 5, 70+ → 4, 60+ → 3, aks holda → 2. Buning uchun <span className="mono">else if</span> — <b style={{ color: T.ink }}>"aks holda, agar..."</b>. Ballni o'zgartiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">ball = {ball}</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {BALLS.map(b => (<button key={b} className={`chip ${ball === b ? 'chip-on' : ''}`} onClick={() => setB(b)}>{b}</button>))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(11.5px,1.7vw,13.5px)' }}>
              {LINES.map((l, i) => (<span key={i} style={{ display: 'block', background: branch === i ? 'rgba(31,122,77,0.25)' : 'transparent', borderRadius: 4, opacity: branch === i ? 1 : 0.45, padding: '2px 4px', transition: 'background 0.35s, opacity 0.35s' }}>{branch === i && <span style={{ color: CODE.str, fontWeight: 700 }}>▶ </span>}{l.c}</span>))}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <div className="demo-swap" key={ball} style={{ background: T.paper, borderRadius: 14, padding: '20px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <div className="pop-num" key={grade} style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(40px,9vw,60px)', color: grade >= 3 ? T.success : T.accent }}>{grade}</div>
              <p className="small" style={{ margin: '4px 0 0', color: T.ink2 }}>baho — {ball} ball uchun</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>else if</b> zanjiri: yuqoridan pastga tekshiriladi, birinchi rost shart ishlaydi, qolganlari o'tkazib yuboriladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — SHART = true/false (boolean) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Bir sirni payqadingizmi: taqqoslashning natijasi — bu o'sha boolean, ya'ni true yoki false. Birinchi darsdagi true/false esingizdami? Demak shartni qutiga ham solib qo'yish mumkin. Yoshni o'zgartirib, katta degan qutiga nima tushishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [age, setAge] = useState(15);
  const [touched, setTouched] = useState(false);
  const val = age >= 18;
  const done = touched;
  const setA = (a) => { setAge(a); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Shart natijasi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Yoshni o\'zgartiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Shart <span className="italic" style={{ color: T.accent }}>true/false</span> beradi — buni saqlasa bo'ladimi?</h2></div>
        <Mentor>E'tibor bering: taqqoslash (<span className="mono">yosh {'>='} 18</span>) natijasi — bu o'sha <b style={{ color: T.ink }}>true yoki false</b> (1-darsdagi boolean!). Demak uni <b style={{ color: T.ink }}>o'zgaruvchiga saqlash</b> mumkin. Yoshni o'zgartirib, <span className="mono">katta</span> o'zgaruvchisiga nima yozilishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[15, 20].map(a => (<button key={a} className={`chip ${age === a ? 'chip-on' : ''}`} onClick={() => setA(a)}>{a} yosh</button>))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(13px,2vw,15px)' }}><Kw>let</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>{age}</Nm>{'\n'}<Kw>let</Kw> <Vr>katta</Vr> <Op>=</Op> <Vr>yosh</Vr> <Op>{'>='}</Op> <Nm>18</Nm>{'\n'}<Cm>{`// katta = ${val}`}</Cm></pre>
          </Col>
          <Col>
            <p className="flow-label">Taqqoslash natijasi o'zgaruvchiga tushadi</p>
            <div className="demo-swap" key={age} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <span className="mono pop-in" style={{ fontSize: 15, color: T.ink2 }}>{age} {'>='} 18 → <b style={{ color: val ? T.success : T.accent }}>{String(val)}</b></span>
              <span className="flow-x" style={{ color: T.ink3, fontSize: 22 }}>↓</span>
              <div className={`var-box ${val ? 'ring-green' : 'ring-red'}`} style={{ minWidth: 150 }}><div className="var-name">o'zgaruvchi: katta</div><div className="var-val pop-num" style={{ color: val ? T.success : T.accent }}>{String(val)}</div></div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Ko'rdingizmi — <span className="mono">yosh {'>='} 18</span> shunchaki <b>true/false</b>. Shart va boolean — bir narsa!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Ikki qiymat teng ekanini tekshirish uchun shartda qaysi belgi ishlatiladi?"
    questionText="Ikki qiymat tengligini tekshirish uchun shartda qaysi belgi ishlatiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ikki qiymat <span className="italic" style={{ color: T.accent }}>tengligini</span> tekshirish uchun qaysi belgi?</h2></>}
    options={['=', '===', '+', '=>']} correctIdx={1}
    explainCorrect="To'g'ri! === ikki qiymatni taqqoslab, true yoki false qaytaradi. Shartlarda doim shu ishlatiladi."
    explainWrong={{
      0: '= qiymatni qutiga soladi (o’zlashtirish), tekshirmaydi. Tenglikni === tekshiradi.',
      2: '+ qo’shish amali, taqqoslash emas. Tenglik — ===.',
      3: '=> bunday taqqoslash belgisi emas. Tenglik — ===.',
      default: 'Tenglikni === tekshiradi.'
    }} />
);

// ===== SCREEN 10 — ICHMA-ICH SHARTLAR (nested) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Ba'zan bitta shart yetmaydi. Attraksionga kirish uchun: avval yosh yetarli bo'lishi, keyin chiptasi ham bo'lishi kerak. Demak if ichiga yana bitta if yozamiz — bunga ichma-ich shart deyiladi. Yosh va chiptani o'zgartirib, qaysi yo'l ochilishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [age, setAge] = useState(10);
  const [ticket, setTicket] = useState(false);
  const [touch, setTouch] = useState(0);
  const ageOk = age >= 12;
  const done = touch >= 2;
  const bump = (fn) => { fn(); setTouch(t => t + 1); };
  const result = !ageOk ? { ic: '⛔', t: 'Ruxsat yo\'q — 12 yoshdan kichik', c: T.accent } : (ticket ? { ic: '🎢', t: 'Marhamat, chiqing!', c: T.success } : { ic: '🎫', t: 'Avval chipta oling', c: T.blue });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ichma-ich shart" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Sozlamalarni sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir shart ichida <span className="italic" style={{ color: T.accent }}>yana bir shart</span> bo'lsa-chi?</h2></div>
        <Mentor>Attraksionga kirish uchun: avval <b style={{ color: T.ink }}>yosh</b> yetarli, keyin <b style={{ color: T.ink }}>chipta</b> ham kerak. Demak <span className="mono">if</span> ichiga yana <span className="mono">if</span> yozamiz — <b style={{ color: T.ink }}>ichma-ich shart</b>. Sozlamalarni o'zgartiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><span className="flow-label" style={{ minWidth: 54 }}>Yosh</span>{[10, 15].map(a => (<button key={a} className={`chip ${age === a ? 'chip-on' : ''}`} onClick={() => bump(() => setAge(a))}>{a}</button>))}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><span className="flow-label" style={{ minWidth: 54 }}>Chipta</span><button className={`chip ${ticket ? 'chip-on' : ''}`} onClick={() => bump(() => setTicket(t => !t))}>{ticket ? '🎫 Bor' : '✖ Yo\'q'}</button></div>
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(11px,1.7vw,13px)' }}>
              <span style={{ display: 'block', background: ageOk ? 'transparent' : 'rgba(255,79,40,0.18)', borderRadius: 4, transition: 'background 0.35s' }}><Kw>if</Kw> (<Vr>yosh</Vr> <Op>{'>='}</Op> <Nm>12</Nm>) {'{'}</span>
              <span style={{ display: 'block', opacity: ageOk ? 1 : 0.4, transition: 'opacity 0.35s' }}>{'  '}<Kw>if</Kw> (<Vr>chiptaBor</Vr>) {'{'} <Cm>kir</Cm> {'}'}</span>
              <span style={{ display: 'block', opacity: ageOk ? 1 : 0.4, transition: 'opacity 0.35s' }}>{'  '}<Kw>else</Kw> {'{'} <Cm>chipta ol</Cm> {'}'}</span>
              <span style={{ display: 'block' }}>{'}'} <Kw>else</Kw> {'{'} <Cm>ruxsat yo'q</Cm> {'}'}</span>
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Ikkala shart ham kerak</p>
            <div className="fade-up" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 13, padding: '6px 12px', borderRadius: 99, background: ageOk ? T.successSoft : T.accentSoft, color: ageOk ? T.success : T.accent, transition: 'all 0.3s' }}>{ageOk ? '✓' : '✗'} yosh ≥ 12</span>
              <span className="mono" style={{ fontWeight: 700, fontSize: 13, padding: '6px 12px', borderRadius: 99, background: ticket ? T.successSoft : T.accentSoft, color: ticket ? T.success : T.accent, transition: 'all 0.3s' }}>{ticket ? '✓' : '✗'} chipta</span>
            </div>
            <div className="demo-swap" key={`${age}-${ticket}`} style={{ background: T.paper, borderRadius: 14, padding: '20px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <div className="pop-num" style={{ fontSize: 38 }}>{result.ic}</div>
              <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, margin: '8px 0 0', color: result.c, fontSize: 'clamp(15px,2.2vw,18px)' }}>{result.t}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>Ichma-ich shart</b>: tashqi if rost bo'lsagina, ichki if tekshiriladi. Bosqichma-bosqich qaror.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — KONSOLIDATSIYA (bilet narxi) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Keling, hamma narsani birga ishlatamiz. Kino chiptasi narxi yoshga bog'liq: 7 yoshgacha bolalar tekin, 18 gacha o'quvchilar yarim narx, kattalar to'liq. Yoshni o'zgartirib, narx qanday hisoblanishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const AGES = [5, 14, 30];
  const [age, setAge] = useState(5);
  const [seen, setSeen] = useState(new Set([5]));
  const price = age < 7 ? 0 : age < 18 ? 25000 : 50000;
  const branch = age < 7 ? 0 : age < 18 ? 1 : 2;
  const done = seen.size >= 2;
  const setA = (a) => { setAge(a); setSeen(prev => { const n = new Set(prev); n.add(a); return n; }); };
  const LINES = [
    <><Kw>if</Kw> (<Vr>yosh</Vr> <Op>{'<'}</Op> <Nm>7</Nm>) {'{'} <Vr>narx</Vr> <Op>=</Op> <Nm>0</Nm> {'}'}</>,
    <><Kw>else if</Kw> (<Vr>yosh</Vr> <Op>{'<'}</Op> <Nm>18</Nm>) {'{'} <Vr>narx</Vr> <Op>=</Op> <Nm>25000</Nm> {'}'}</>,
    <><Kw>else</Kw> {'{'} <Vr>narx</Vr> <Op>=</Op> <Nm>50000</Nm> {'}'}</>
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliy misol" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Yoshlarni sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Siz <span className="italic" style={{ color: T.accent }}>kassirsiz</span>: chipta narxi qancha?</h2></div>
        <Mentor>Kinoteatr <b style={{ color: T.ink }}>kassasidasiz</b>! Har bir mehmonga yoshiga qarab narx aytasiz: 7 gacha bola — <b style={{ color: T.ink }}>tekin</b>, 18 gacha o'quvchi — <b style={{ color: T.ink }}>yarim narx</b>, kattalar — <b style={{ color: T.ink }}>to'liq</b>. <span className="mono">if / else if</span> shu qarorni o'zi chiqaradi. Yoshni tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">yosh = {age}</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {AGES.map(a => (<button key={a} className={`chip ${age === a ? 'chip-on' : ''}`} onClick={() => setA(a)}>{a} yosh</button>))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(11.5px,1.7vw,13.5px)' }}>
              {LINES.map((l, i) => (<span key={i} style={{ display: 'block', background: branch === i ? 'rgba(31,122,77,0.25)' : 'transparent', borderRadius: 4, opacity: branch === i ? 1 : 0.45, padding: '2px 4px', transition: 'background 0.35s, opacity 0.35s' }}>{branch === i && <span style={{ color: CODE.str, fontWeight: 700 }}>▶ </span>}{l}</span>))}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Chipta narxi</p>
            <div className="demo-swap" key={age} style={{ background: T.paper, borderRadius: 14, padding: '20px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <div className="pop-num" key={price} style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(28px,6vw,40px)', color: price === 0 ? T.success : T.accent }}>{price === 0 ? 'TEKIN' : price.toLocaleString('ru-RU') + ' so\'m'}</div>
              <p className="small" style={{ margin: '4px 0 0', color: T.ink2 }}>🎟️ {age < 7 ? 'bola (7 gacha)' : age < 18 ? "o'quvchi (18 gacha)" : 'katta'}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mana — haqiqiy dasturlardagi mantiq! if/else if bilan har qanday qoidani yozish mumkin.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="if blokining ichiga yana bitta if yozilsa, bu nima deyiladi?"
    questionText="if ichiga yana bitta if yozilsa, bu nima deyiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>if ichiga yana bitta if yozilsa, bu nima deyiladi?</h2></>}
    options={['Sikl', 'Ichma-ich (nested) shart', 'O\'zgaruvchi', 'Taqqoslash']} correctIdx={1}
    explainCorrect="To'g'ri! Shart ichidagi shart — ichma-ich (nested) shart. Bosqichma-bosqich, chuqurroq tekshiruv."
    explainWrong={{
      0: 'Yo’q — sikl takrorlash uchun. Shart ichidagi shart — ichma-ich shart.',
      2: 'Yo’q — o’zgaruvchi qiymat saqlaydi. Bu — ichma-ich shart.',
      3: 'Yo’q — taqqoslash bu > < ===. Shart ichidagi shart — ichma-ich (nested).',
      default: 'Shart ichidagi shart — ichma-ich (nested) shart.'
    }} />
);

// ===== SCREEN 13 — AMALIYOT: SHARTNI O'ZING TUZ =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Endi o'zingiz shart tuzasiz. Operator va sonni tanlang — turniket shartini quring. So'ng pastdagi yoshlar bilan sinab ko'ring: shartingiz to'g'ri ishlayaptimi?`, trigger: 'on_mount', waits_for: null }]);
  const OPS = ['>', '>=', '==='];
  const NUMS = [7, 12, 18];
  const [op, setOp] = useState(null);
  const [num, setNum] = useState(null);
  const [test, setTest] = useState(null);
  const ready = op && num;
  const done = ready;
  const evalCond = (t) => { if (op === '>') return t > num; if (op === '>=') return t >= num; return t === num; };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · shart tuz" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Shart tuzing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Turniket shartini <span className="italic" style={{ color: T.accent }}>o'zingiz tuzing</span></h2></div>
        <Mentor>Endi o'zingiz shart tuzasiz. <b style={{ color: T.ink }}>Operator</b> va <b style={{ color: T.ink }}>son</b>ni tanlang — turniket shartini quring. So'ng yoshlar bilan sinab ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Operator</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 7 }}>{OPS.map(o => (<button key={o} className={`chip ${op === o ? 'chip-on' : ''}`} onClick={() => setOp(o)}><span className="mono">{o}</span></button>))}</div>
            <p className="flow-label">Son (yosh chegarasi)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 7 }}>{NUMS.map(n => (<button key={n} className={`chip ${num === n ? 'chip-on' : ''}`} onClick={() => setNum(n)}>{n}</button>))}</div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(12.5px,1.9vw,15px)' }}><Kw>if</Kw> (<Vr>yosh</Vr> <span className="pop-num" key={op} style={{ color: op ? CODE.punct : CODE.comment, fontWeight: 700 }}>{op || '?'}</span> <span className="pop-num" key={num} style={{ color: num != null ? CODE.num : CODE.comment, fontWeight: 700 }}>{num ?? '?'}</span>) {'{'} <Cm>kir</Cm> {'}'}</pre>
          </Col>
          <Col>
            <p className="flow-label">Shartingizni sinab ko'ring</p>
            {ready ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 7 }}>{[8, 12, 16].map(t => (<button key={t} className={`chip ${test === t ? 'chip-on' : ''}`} onClick={() => setTest(t)}>{t} yosh</button>))}</div>
                {test !== null && (
                  <div className={`demo-swap ${evalCond(test) ? 'ring-green' : 'ring-red'}`} key={test} style={{ background: evalCond(test) ? T.successSoft : T.accentSoft, borderRadius: 14, padding: '16px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
                    <p className="mono small" style={{ margin: '0 0 6px', color: T.ink2 }}>{test} {op} {num} → <b style={{ color: evalCond(test) ? T.success : T.accent }}>{String(evalCond(test))}</b></p>
                    <p className="pop-num" style={{ fontWeight: 700, margin: 0, color: evalCond(test) ? T.success : T.accent }}>{evalCond(test) ? '✅ Turniket ochildi' : '⛔ Yopiq'}</p>
                  </div>
                )}
                <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Shartingiz tayyor! Yoshlarni sinab, qanday ishlashini ko'ring.</p></div>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Operator va sonni tanlang</p></div>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (= o'rniga ===) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `AI shart yozdi, lekin xato qilibdi. Diqqat bilan qarang: shartda bitta teng belgisi ishlatilibdi — bu qiymatni o'zlashtiradi, tekshirmaydi. Tekshirish uchun uchta teng kerak. Xato qatorni toping va bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'if' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'if';
  const done = fixed;
  const pickIf = () => { if (found) return; setPicked('if'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Shartda bitta teng — o'zlashtirish. Uni uchta tengga almashtiramiz.`); }, 300); };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi shart to'g'ri tekshiradi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">10 yoshli bola ham <span className="italic" style={{ color: T.accent }}>"katta"</span> chiqyapti — nega?</h2></div>
        <Mentor>AI shart yozdi, lekin xato qilibdi: yoshi <b style={{ color: T.ink }}>10</b> bo'lsa ham natija doim <b style={{ color: T.ink }}>"katta"</b>! Sababi — shartda <b style={{ color: T.ink }}>bitta teng belgisi</b> ishlatilibdi: u qiymatni o'zlashtiradi, <b style={{ color: T.ink }}>tekshirmaydi</b>. Tekshirish uchun <span className="mono">===</span> kerak. Xato qatorni toping.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Yosh tekshiruvi:</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default' }}><Kw>let</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>10</Nm></div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickIf}><Kw>if</Kw> (<Vr>yosh</Vr> <Op>{fixed ? '===' : '='}</Op> <Nm>18</Nm>) {'{'} <Cm>katta</Cm> {'}'} {!fixed && <Cm>// ?</Cm>}</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qatorda xato? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 = ni === ga almashtirish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi shart to'g'ri tekshiradi!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              picked && picked !== 'if'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — bu yerda <span className="mono">=</span> o'rinli (quti yaratyapti). Xato esa <b>shart ichida</b>.</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: shart ichida tenglik <b style={{ color: T.ink }}>=== </b> bilan tekshiriladi. Qaysi qatorda <span className="mono">=</span> noto'g'ri ishlatilgan?</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Shartda <span className="mono">=</span> — qiymat soladi, tekshirmaydi. To'g'risi: <span className="mono">===</span>. Chap tugmani bosing →</p></div>)}
            {fixed && (<div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">Shartda doim === (tekshirish), = emas</p></div>)}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (if o'zi yozadi) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Mana, oxirgi qadam — o'zingiz if yozasiz. Ball 90 dan katta bo'lsa tekshiradigan shart yozing. if, qavs ichida ball katta 90, va figurali qavs ochilsin. Masalan: if qavs ball katta 90 qavs figurali qavs.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.trim();
  const hasIf = /^if\b/.test(v);
  const hasParen = /^if\s*\(.+\)/.test(v);
  const hasOp = /(>=|<=|===|!==|>|<)/.test(v);
  const hasBrace = /\{/.test(v);
  const valid = /^if\s*\([^)]*(>=|<=|===|!==|>|<)[^)]*\)\s*\{/.test(v);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { correct: true, picked: value });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! Birinchi shartingizni o'zingiz yozdingiz. Tabriklayman!`); }, 300);
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Shartni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>if</span> ni o'zingiz yozing.</h2></div>
        <Mentor>Ball 90 dan katta bo'lsa tekshiradigan shart yozing: <span className="mono">if</span>, qavs ichida <span className="mono">ball {'>'} 90</span>, va <span className="mono">{'{'}</span> oching. Masalan: <span className="mono">{'if (ball > 90) {'}</span></Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <input className="fade-up delay-1" value={value} onChange={e => setValue(e.target.value)} placeholder={'if (ball > 90) {'} spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasIf ? 1 : 0.4 }}>{hasIf ? '✓' : '1'} if</span>
              <span className="tagpill" style={{ opacity: hasParen ? 1 : 0.4 }}>{hasParen ? '✓' : '2'} ( shart )</span>
              <span className="tagpill" style={{ opacity: hasOp ? 1 : 0.4 }}>{hasOp ? '✓' : '3'} taqqoslash</span>
              <span className="tagpill" style={{ opacity: hasBrace ? 1 : 0.4 }}>{hasBrace ? '✓' : '4'} {'{'}</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Bu to'g'ri shart — dasturingiz endi qaror qabul qila oladi!</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Taqqoslash operatori: {'>'}, {'<'}, {'>='}, yoki ===. Oxirida {'{'} ochishni unutmang.</p>)}
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            <div style={{ background: T.paper, borderRadius: 14, minHeight: 120, padding: '20px', boxShadow: `0 8px 22px -10px rgba(${T.shadowBase},0.16)`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              {valid
                ? <div className="fade-step"><div style={{ fontSize: 34 }}>🚦</div><p style={{ fontFamily: 'Georgia, serif', color: T.success, fontWeight: 700, margin: '8px 0 0' }}>Shart tayyor!</p><p className="small" style={{ margin: '4px 0 0', color: T.ink2 }}>dastur tekshira oladi</p></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0 }}>To'liq yozing: <span className="mono" style={{ fontStyle: 'normal' }}>{'if ( shart ) {'}</span></p>}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz — endi dasturingiz qaror qabul qila oladi! Eslab qoling: if shart rost bo'lsa ishlaydi, else aks holda, else if bir nechta yo'l uchun, taqqoslash operatorlari true yoki false beradi, va shartlarni ichma-ich yozish mumkin. Keyingi darsda kompyuterni ko'p marta takrorlatishni — sikllarni o'rganamiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['if — shart rost bo\'lsa kod ishlaydi', 'Taqqoslash: > < >= <= === !==', 'else — aks holda', 'else if — bir nechta yo\'l', 'Ichma-ich (nested) shartlar · === vs ='];
  const HOMEWORK = [{ b: 'yosh', t: '— if/else bilan "katta/kichik" ni aniqlang' }, { b: 'baho', t: '— else if bilan ball → 5/4/3/2' }, { b: 'parol', t: '— === bilan to‘g‘ri/xato tekshiring' }];
  const GLOSSARY = [{ b: 'if', t: '— agar (shart rost bo‘lsa)' }, { b: 'else', t: '— aks holda' }, { b: 'else if', t: '— aks holda, agar...' }, { b: '===', t: '— teng (taqqoslash)' }, { b: '!==', t: '— teng emas' }, { b: '>= <=', t: '— katta/kichik yoki teng' }, { b: 'nested', t: '— ichma-ich shart' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Dasturingiz endi <span className="italic" style={{ color: T.accent }}>qaror</span> qabul qiladi.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! if, else, else if va taqqoslash operatorlari endi sizniki.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko‘ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Quyidagi shartlarni yozib ko'ring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b className="mono">{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda kompyuterni ko'p marta takrorlatamiz — sikllar! 🔁</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function JsConditionsLesson({ lang: langProp, onFinished }) {
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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        /* ── Jonli demo animatsiyalari ── */
        @keyframes pop-in { 0% { opacity: 0; transform: scale(.82) translateY(10px); } 55% { opacity: 1; transform: scale(1.05) translateY(0); } 100% { transform: scale(1); } }
        .pop-in { animation: pop-in .42s cubic-bezier(.34,1.4,.4,1); }
        @keyframes pop-num { 0% { transform: scale(.5); opacity: 0; } 60% { transform: scale(1.18); opacity: 1; } 100% { transform: scale(1); } }
        .pop-num { animation: pop-num .5s cubic-bezier(.34,1.5,.4,1); display: inline-block; }
        @keyframes shake-x { 0%,100% { transform: translateX(0); } 18% { transform: translateX(-6px); } 38% { transform: translateX(6px); } 58% { transform: translateX(-4px); } 78% { transform: translateX(4px); } }
        .shake-x { animation: shake-x .45s ease; }
        @keyframes ring-green { 0% { box-shadow: 0 0 0 0 rgba(31,122,77,.5); } 70% { box-shadow: 0 0 0 16px rgba(31,122,77,0); } 100% { box-shadow: 0 0 0 0 rgba(31,122,77,0); } }
        @keyframes ring-red { 0% { box-shadow: 0 0 0 0 rgba(255,79,40,.5); } 70% { box-shadow: 0 0 0 16px rgba(255,79,40,0); } 100% { box-shadow: 0 0 0 0 rgba(255,79,40,0); } }
        .ring-green { animation: ring-green 1.3s ease-out; } .ring-red { animation: ring-red 1.3s ease-out; }
        @keyframes flow-x { 0% { transform: translate(-3px,0); opacity: .45; } 50% { transform: translate(3px,0); opacity: 1; } 100% { transform: translate(-3px,0); opacity: .45; } }
        .flow-x { animation: flow-x 1.1s ease-in-out infinite; display: inline-block; }
        /* Turniket darvozasi */
        .gate-wrap { position: relative; width: 92px; height: 56px; margin: 0 auto; }
        .gate-post { position: absolute; top: 0; width: 8px; height: 56px; border-radius: 4px; background: ${T.ink}; } .gate-post.l { left: 0; } .gate-post.r { right: 0; }
        .gate-bar { position: absolute; top: 24px; left: 8px; width: 76px; height: 8px; border-radius: 4px; transform-origin: left center; transition: transform .55s cubic-bezier(.34,1.3,.4,1), background .3s; }
        .gate-bar.open { transform: rotate(-74deg); background: ${T.success}; }
        .gate-bar.shut { transform: rotate(0deg); background: ${T.accent}; }

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
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
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

        .var-box { display: inline-flex; flex-direction: column; min-width: 130px; border-radius: 14px; overflow: hidden; background: ${T.paper}; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.18); }
        .var-name { background: ${T.ink}; color: ${T.bg}; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12.5px; padding: 8px 14px; letter-spacing: 0.03em; }
        .var-val { padding: 16px 14px; font-family: 'JetBrains Mono', monospace; font-weight: 700; text-align: center; font-size: clamp(18px,3vw,24px); }

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
