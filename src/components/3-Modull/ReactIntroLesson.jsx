import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// REACT MODULI · 1-DARS — REACT NIMA VA NIMA UCHUN? — PLATFORM STANDARD v16
// Mavzu: React nima (JS kutubxonasi, Facebook 2013), komponent yondashuvi (Minecraft bloklari),
//        Virtual DOM (solishtir -> faqat farqni yangila), oddiy sayt vs React ilova,
//        React Native bilan tanishuv (bir bilim — sayt ham, telefon ilovasi ham).
// Misol sayt: Minecraft skinlar galereyasi (mc-skinlar.uz) — kartochkalar like bilan.
// Hook: like bosilganda butun sahifa qayta yuklanadimi? (eski sayt vs zamonaviy ilova)
// Sof tushuncha — kod yozdirilmaydi. Keyingi darsda muhit o'rnatilib, birinchi komponent yoziladi.
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

const LESSON_META = { lessonId: 'react-intro-01-v16', lessonTitle: { uz: 'React nima va nima uchun?', ru: 'Что такое React и зачем' } };
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

// ===== REACT-1 YORDAMCHILAR =====
const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Win = ({ title, children, minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);
// Minecraft skinlar — misol saytning kartochkalari
const SKINS = [
  { name: 'Creeper', emoji: '🟩', bg: 'linear-gradient(135deg,#8FBF6B,#3E7A33)' },
  { name: 'Zombi', emoji: '🧟', bg: 'linear-gradient(135deg,#A8C686,#5E8C4A)' },
  { name: 'Ninja', emoji: '🥷', bg: 'linear-gradient(135deg,#7A87A8,#2E3A56)' },
  { name: 'Qahramon', emoji: '🦸', bg: 'linear-gradient(135deg,#F0B27A,#C96B2E)' },
  { name: 'Robot', emoji: '🤖', bg: 'linear-gradient(135deg,#AFC2D2,#5E7A92)' },
  { name: 'Piglin', emoji: '🐷', bg: 'linear-gradient(135deg,#F0B6C4,#C96B86)' }
];
const SkinCard = ({ n }) => {
  const s = SKINS[(n - 1) % SKINS.length];
  const [liked, setLiked] = useState(false);
  return (
    <div className="vcard el-in">
      <div className="vthumb" style={{ background: s.bg }}><span style={{ fontSize: 19 }}>{s.emoji}</span></div>
      <div style={{ padding: '7px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 11.5, color: T.ink, margin: 0 }}>{s.name}</p>
        <button onClick={() => setLiked(v => !v)} title="Like bosib ko'ring" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontFamily: "'Manrope',sans-serif", fontSize: 10.5, fontWeight: liked ? 700 : 400, color: liked ? T.accent : T.ink3 }}>
          <span className={liked ? 'hpop' : undefined} style={{ display: 'inline-block' }}>{liked ? '♥' : '♡'}</span> {10 + n * 3 + (liked ? 1 : 0)}
        </button>
      </div>
    </div>
  );
};
// Like demo: mode='old' — butun sahifa qayta yuklanadi; mode='react' — faqat son yangilanadi
const LikeDemo = ({ mode, title, onLiked }) => {
  const [likes, setLikes] = useState(12);
  const [loading, setLoading] = useState(false);
  const [rk, setRk] = useState(0);
  const [pop, setPop] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const click = () => {
    if (loading) return;
    if (mode === 'old') {
      setLoading(true);
      timer.current = setTimeout(() => { setLikes(l => l + 1); setRk(k => k + 1); setLoading(false); if (onLiked) onLiked(); }, 950);
    } else {
      setLikes(l => l + 1); setPop(true); timer.current = setTimeout(() => setPop(false), 420); if (onLiked) onLiked();
    }
  };
  return (
    <Win title={title} minH={132}>
      {loading && <div className="reload-cover"><span className="spinner" /><span className="small" style={{ color: T.ink2 }}>Sahifa qayta yuklanmoqda…</span></div>}
      <div key={rk} className={mode === 'old' ? 'fade-step' : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
          <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#8FBF6B,#3E7A33)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🟩</span>
          <div><p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12.5, color: T.ink, margin: 0 }}>mc_quruvchi</p><p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10.5, color: T.ink3, margin: 0 }}>Yangi qal'a qurdim · 2 soat oldin</p></div>
        </div>
        <div style={{ height: 46, borderRadius: 9, background: 'linear-gradient(135deg,#8FBF6B,#6D4C41)', marginBottom: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏰</div>
        <button className={`likebtn ${pop ? 'liked' : ''}`} onClick={click}>
          <span className={pop ? 'hpop' : undefined} style={{ color: pop ? T.accent : T.ink2 }}>♥</span> {likes}
        </button>
      </div>
    </Win>
  );
};

// ===== SCREEN 0 — HOOK (like bosilganda butun sahifa yangilanadimi?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Telefoningizda like bosganingizda butun ekran o'chib-yonadimi? Yo'q-ku! Lekin eski saytlarda aynan shunday bo'lardi. Ikkala rejimni almashtirib, like bosib ko'ring — farqni his qiling. Keyin ayting: zamonaviy ilovalar buni qanday uddalaydi?`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('old');
  const OPTS = [
    { id: 'a', label: "Telefon va internet juda tez bo'lgani uchun" },
    { id: 'b', label: "Faqat o'zgargan joygina yangilanadi" },
    { id: 'c', label: 'Har safar butun sahifa qayta yuklanadi' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Like bossangiz, butun sahifa <span className="italic" style={{ color: T.accent }}>qayta yuklanadimi</span>?</h1>
        <Mentor>Telefoningizda like bosganingizda butun ekran o'chib-yonadimi? Yo'q-ku! Lekin <b style={{ color: T.ink }}>eski saytlarda</b> aynan shunday bo'lardi. Ikkala rejimni almashtirib, like bosib ko'ring — <b style={{ color: T.ink }}>farqni his qiling</b>.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`chip ${view === 'old' ? 'chip-on' : ''}`} onClick={() => setView('old')}>Eski sayt</button>
              <button className={`chip ${view === 'react' ? 'chip-on' : ''}`} onClick={() => setView('react')}>Zamonaviy ilova</button>
            </div>
            <div className="demo-swap" key={view}>
              <LikeDemo mode={view} title={view === 'old' ? 'eski-sayt.uz' : 'zamonaviy-ilova.uz'} />
              <p className="mono small" style={{ color: T.ink3, marginTop: 6 }}>{view === 'old' ? '↑ like bosing — nima bo’lishini kuzating' : '↑ like bosing — endi solishtiring'}</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, zamonaviy ilovalar siri nimada?</p>
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
            {picked !== null && <p className="hook-ack fade-step">Yaxshi! Sir — <b>faqat o'zgargan joy yangilanadi</b>. Buni qiladigan vositaning nomi — <b>React</b>. Hozir hammasini ochamiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Va'da beraman: dars oxirida Instagram nega buncha tez ishlashini aniq bilasiz. Butun sir ikkita g'oyada — komponent va Virtual DOM. Bugun shu ikkalasini ochamiz, 5 ta qadamda. Keyingi darsda esa birinchi React komponentingizni o'zingiz yozasiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Oddiy saytning dardi', tag: 'HTML + JS' },
    { text: 'React nima? Kim ishlatadi?', tag: 'kutubxona' },
    { text: 'Komponent — sahifa bloklari', tag: '<SkinCard />' },
    { text: 'Virtual DOM — aqlli yangilash', tag: 'solishtir → yangila' },
    { text: 'React Native — telefonga yo’l', tag: 'iOS · Android' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi 2 katta g'oya</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: 32 }}>🧩</span>
          <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>KOMPONENT</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Sahifaning bloki: bir marta yoz — ming marta ishlat</p></div>
        </div>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: 32 }}>⚡</span>
          <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>VIRTUAL DOM</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Solishtiradi — faqat o'zgargan joyni yangilaydi</p></div>
        </div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ keyingi darsda birinchi komponentingizni yozasiz</p>
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
          <h2 className="title h-title fade-up">Instagram nega buncha <span className="italic" style={{ color: T.accent }}>tez</span> ishlaydi?</h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida <b style={{ color: T.ink }}>Instagram nega buncha tez ishlashini</b> aniq bilasiz. Butun sir ikkita g'oyada — <b style={{ color: T.ink }}>komponent</b> va <b style={{ color: T.ink }}>Virtual DOM</b>. Bugun shu ikkalasini ochamiz, 5 ta qadamda.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyalarni ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — ODDIY SAYTNING DARDI (kod nusxalanadi) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Mana oddiy HTML'da yasalgan Minecraft skinlar sayti. Yana bitta skin kartochkasi kerakmi? Kodni nusxalaysiz. Yana bittasi? Yana nusxalaysiz. "Skin qo'shish" tugmasini bosib ko'ring — kod qanday shishib ketishini kuzating.`, trigger: 'on_mount', waits_for: null }]);
  const [n, setN] = useState(storedAnswer ? 3 : 1);
  const done = n >= 3;
  const lines = 2 + n * 4;
  const add = () => setN(v => Math.min(v + 1, 5));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Muammo" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 3 ta skin (${n}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">100 ta skin kartochkasini <span className="italic" style={{ color: T.accent }}>qo'lda</span> yozasizmi?</h2></div>
        <Mentor>Mana oddiy HTML'da yasalgan <b style={{ color: T.ink }}>Minecraft skinlar sayti</b>. Yana bitta skin kerakmi? Kodni <b style={{ color: T.ink }}>nusxalaysiz</b>. Yana bittasi? Yana nusxalaysiz. <b style={{ color: T.ink }}>"Skin qo'shish"</b> tugmasini bosib ko'ring — kod qanday shishib ketishini kuzating.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={add} disabled={n >= 5}>+ Skin qo'shish</button>
              <span className="tagpill" key={lines} style={{ color: n >= 3 ? T.accent : T.ink }}>{lines} qator kod</span>
            </div>
            <pre className="code-box fade-up delay-2">
              {Array.from({ length: Math.min(n, 2) }, (_, i) => (
                <React.Fragment key={i}>
                  <Jx>{'<div class="skin">'}</Jx>{'\n'}
                  {'  '}<Jx>{'<img src="skin' + (i + 1) + '.png">'}</Jx>{'\n'}
                  {'  '}<Jx>{'<h3>'}</Jx>{SKINS[i].name}<Jx>{'</h3>'}</Jx>{'\n'}
                  <Jx>{'</div>'}</Jx>{'\n'}
                </React.Fragment>
              ))}
              {n > 2 && <Cm>{'<!-- ...va yana ' + (n - 2) + ' marta XUDDI SHU kod nusxalanadi... -->'}</Cm>}
            </pre>
            {done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi tasavvur qiling: saytingizda <b>yuzlab</b> skin. Kartochka dizaynini o'zgartirmoqchimisiz? <b>Hammasini bittalab</b> o'zgartirasiz. Charchatadi-a?</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Sayt shunday ko'rinadi — like bosib ko'ring</p>
            <Win title="mc-skinlar.uz" minH={120}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Array.from({ length: n }, (_, i) => <SkinCard key={i} n={i + 1} />)}
              </div>
            </Win>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — REACT NIMA? KIM ISHLATADI? =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `React — JavaScript'da yozilgan kutubxona, ya'ni tayyor asboblar to'plami. Uni 2013-yilda Facebook yaratgan va hammaga bepul tarqatgan. Sizga tanish ilovalarni bosing — qaysilari React'da qurilganini bilib oling.`, trigger: 'on_mount', waits_for: null }]);
  const APPS = {
    ig: { n: 'Instagram', bg: 'linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)', letter: 'In', fact: "Lenta, stories, like tugmasi — hammasi React komponentlari. Telefondagi ilovasi esa React Native'da." },
    fb: { n: 'Facebook', bg: '#1877F2', letter: 'f', fact: "React'ni aynan Facebook o'zi uchun yaratgan (2013) — keyin butun dunyoga bepul ochib bergan." },
    nf: { n: 'Netflix', bg: '#E50914', letter: 'N', fact: 'Minglab film kartochkasi — aslida bitta komponent, minglab marta qayta ishlatilgan.' },
    wa: { n: 'WhatsApp Web', bg: '#25D366', letter: 'W', fact: "Kompyuterdagi WhatsApp ham React'da qurilgan — har bir chat qatori bitta komponent." }
  };
  const KEYS = ['ig', 'fb', 'nf', 'wa'];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(KEYS) : new Set());
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="React nima?" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 ilova ko'rildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu muammoni kim, qanday <span className="italic" style={{ color: T.accent }}>yechgan</span>?</h2></div>
        <Mentor>React — JavaScript'da yozilgan <b style={{ color: T.ink }}>kutubxona</b>, ya'ni tayyor asboblar to'plami. Uni 2013-yilda <b style={{ color: T.ink }}>Facebook</b> yaratgan va hammaga bepul tarqatgan. Ilovalarni bosing — qaysilari React'da qurilganini bilib oling.</Mentor>
        <div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: '13px 16px' }}>
              <p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>React</b> = JavaScript <b>kutubxonasi</b>. Kutubxona — tayyor asboblar to'plami: hammasini noldan yozmaysiz, tayyorini olasiz.</p>
            </div>
            <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {KEYS.map(k => (
                <button key={k} className={`appbtn ${active === k ? 'active' : ''} ${seen.has(k) ? 'seen' : ''}`} onClick={() => tap(k)}>
                  <span className="applogo" style={{ background: APPS[k].bg }}>{APPS[k].letter}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 13, color: T.ink }}>{APPS[k].n}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>React'da qurilganmi?</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 4</span>
            </div>
            {active ? (
              <div className="sk-info" key={active}>
                <span className="sk-tagbig"><span className="applogo" style={{ background: APPS[active].bg, width: 28, height: 28, fontSize: 12, borderRadius: 7 }}>{APPS[active].letter}</span><span className="sk-wordbadge">React'da qurilgan ✓</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{APPS[active].fact}</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Ilovalardan birini bosing</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har kuni ishlatadigan ilovalaringiz — <b>React'da</b>. Bugun siz ham shu yo'lga qadam qo'yasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (React nima?) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="React aslida nima? To'g'ri javobni tanlang."
    questionText="React aslida nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>React aslida <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Yangi dasturlash tili', "JavaScript kutubxonasi — interfeys qurish uchun", 'Brauzer dasturi', 'Operatsion tizim']} correctIdx={1}
    explainCorrect="To'g'ri! React — JavaScript'da yozilgan kutubxona: sahifa interfeysini qurish uchun tayyor asboblar to'plami."
    explainWrong={{
      0: "Yo'q — React yangi til emas. U siz o'rgangan JavaScript'ning o'zida yozilgan kutubxona.",
      2: "Brauzer — Chrome, Safari kabi dastur. React esa kutubxona — kod uchun asboblar to'plami.",
      3: "Operatsion tizim — Windows, Android. React — interfeys qurish kutubxonasi.",
      default: "React — interfeys qurish uchun JavaScript kutubxonasi."
    }} />
);

// ===== SCREEN 5 — KOMPONENT = BLOK (sahifani bosib o'rganish) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Minecraft'ni eslang: butun dunyo alohida bloklardan quriladi. React'da sahifa ham xuddi shunday — komponent degan bloklardan yig'iladi. Sahifadagi har bir qismni bosib, qaysi blok ekanini bilib oling.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    nav: { jx: '<Navbar />', word: 'Yuqori menyu', role: "Bir marta yoziladi — saytning har sahifasida qayta ishlatiladi." },
    search: { jx: '<SearchBar />', word: 'Qidiruv', role: "Qidiruv katagi — alohida kichik bo'lak. Uni boshqa loyihaga ham olib o'tsa bo'ladi." },
    card: { jx: '<SkinCard />', word: 'Skin kartochka', role: "Eng muhim sir: sahifada ikkita kartochka bor, lekin kod BITTA. Bitta blok — ikki joyda!" },
    like: { jx: '<LikeButton />', word: 'Tugma', role: "Komponent ichida komponent: kartochkaning ichida like tugmasi yashaydi. Blok ichida blok." }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['nav', 'search', 'card', 'like']) : new Set());
  const done = seen.size >= 4;
  const tap = (k, e) => { if (e) e.stopPropagation(); setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  const zc = (k) => `zone ${active === k ? 'active' : ''} ${seen.has(k) ? 'seen' : ''}`;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Komponent" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 blok topildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu sahifa nechta <span className="italic" style={{ color: T.accent }}>blokdan</span> yig'ilgan?</h2></div>
        <Mentor>Minecraft'ni eslang: butun dunyo <b style={{ color: T.ink }}>alohida bloklardan</b> quriladi. React'da sahifa ham xuddi shunday — <b style={{ color: T.ink }}>komponent</b> degan bloklardan yig'iladi. Sahifadagi <b style={{ color: T.ink }}>har bir qismni bosib</b>, qaysi blok ekanini bilib oling.</Mentor>
        <div className="split">
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className={zc('nav')} onClick={() => tap('nav')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bg, padding: '8px 11px', gap: 8 }}>
                {seen.has('nav') && <span className="zlbl">{'<Navbar />'}</span>}
                <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 12.5, color: T.ink }}>⛏ MC Skinlar</span>
                <span className={zc('search')} onClick={(e) => tap('search', e)} style={{ background: '#fff', borderRadius: 8, padding: '5px 10px', fontFamily: "'Manrope',sans-serif", fontSize: 10.5, color: T.ink3, flex: '0 1 110px', position: 'relative' }}>
                  {seen.has('search') && <span className="zlbl">{'<SearchBar />'}</span>}
                  Skin qidirish…
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[1, 2].map(i => (
                  <div key={i} className={zc('card')} onClick={() => tap('card')} style={{ background: '#fff', boxShadow: '0 3px 9px -3px rgba(0,0,0,0.12)', overflow: 'visible', padding: 0 }}>
                    {seen.has('card') && i === 1 && <span className="zlbl">{'<SkinCard />'}</span>}
                    <div className="vthumb" style={{ borderRadius: '10px 10px 0 0', background: SKINS[i - 1].bg }}><span style={{ fontSize: 17 }}>{SKINS[i - 1].emoji}</span></div>
                    <div style={{ padding: '7px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 11, color: T.ink }}>{SKINS[i - 1].name}</span>
                      <span className={zc('like')} onClick={(e) => tap('like', e)} style={{ background: T.bg, borderRadius: 7, padding: '3px 8px', fontSize: 10.5, color: T.ink2, position: 'relative' }}>
                        {seen.has('like') && i === 2 && <span className="zlbl">{'<LikeButton />'}</span>}
                        ♥ {9 + i * 3}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Bloklar</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 4 topildi</span>
            </div>
            {done ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Hammasini topdingiz</p><p className="body" style={{ margin: 0, color: T.ink }}>Sahifa = komponentlar yig'indisi: <span className="mono">Navbar + SearchBar + SkinCard + LikeButton</span>. Har biri — mustaqil blok.</p></div>
            ) : active ? (
              <div className="sk-info" key={active}>
                <span className="sk-tagbig"><span className="mono" style={{ fontWeight: 700, fontSize: 14, color: CODE.tag, background: CODE.bg, padding: '4px 10px', borderRadius: 7 }}>{PARTS[active].jx}</span><span className="sk-wordbadge">{PARTS[active].word}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].role}</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Sahifadan bir qismni bosing</p></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (komponent nima?) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Komponent nima? To'g'ri javobni tanlang."
    questionText="Komponent nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>Komponent</span> nima?</h2></>}
    options={['Brauzerning sozlamasi', 'Internet tezligini oshiradigan dastur', "Sahifaning qayta ishlatiladigan bo'lagi — Minecraft bloki kabi", 'Rasm fayli turi']} correctIdx={2}
    explainCorrect="To'g'ri! Komponent — sahifaning mustaqil bo'lagi: bir marta yoziladi, istalgancha qayta ishlatiladi."
    explainWrong={{
      0: "Yo'q — sozlama emas. Komponent — sahifaning qayta ishlatiladigan bo'lagi.",
      1: "Yo'q — tezlikka aloqasi yo'q. Komponent — sahifaning qayta ishlatiladigan bloki.",
      3: "Yo'q — rasm emas. Komponent — interfeys bo'lagi: kartochka, tugma, menyu.",
      default: "Komponent — qayta ishlatiladigan interfeys bo'lagi."
    }} />
);

// ===== SCREEN 6 — BIR MARTA YOZ, MING MARTA ISHLAT =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Esingizdami, oddiy HTML'da kod qanday shishib ketgan edi? Endi React usuli: SkinCard komponenti bir marta yoziladi. Keyin uni xohlagancha chaqirasiz. Qo'shib ko'ring — kod qatorini diqqat bilan kuzating.`, trigger: 'on_mount', waits_for: null }]);
  const [n, setN] = useState(storedAnswer ? 3 : 1);
  const done = n >= 3;
  const add = () => setN(v => Math.min(v + 1, 6));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qayta ishlatish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 3 ta qo'shing (${n}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir marta yozib, <span className="italic" style={{ color: T.accent }}>ming marta</span> ishlatish mumkinmi?</h2></div>
        <Mentor>Esingizdami, oddiy HTML'da kod qanday <b style={{ color: T.ink }}>shishib ketgan</b> edi? Endi React usuli: <span className="mono">SkinCard</span> <b style={{ color: T.ink }}>bir marta</b> yoziladi, keyin xohlagancha chaqiriladi. Qo'shib ko'ring — kod qatorini kuzating.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={add} disabled={n >= 6}>+ {'<SkinCard />'} qo'shish</button>
            </div>
            <pre className="code-box fade-up delay-2">
              <Cm>{'// blok BIR marta yoziladi:'}</Cm>{'\n'}
              <Jx>{'function'}</Jx>{' SkinCard() { … }'}{'\n\n'}
              <Cm>{'// keyin xohlagancha ishlatiladi:'}</Cm>{'\n'}
              {Array.from({ length: n }, (_, i) => <React.Fragment key={i}><Jx>{'<SkinCard />'}</Jx>{'\n'}</React.Fragment>)}
            </pre>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ color: T.success }}>React: {4 + n} qator</span>
              <span className="tagpill" style={{ color: T.accent }}>Oddiy HTML bo'lsa: {2 + n * 4} qator</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Sahifa — like bosib ko'ring</p>
            <Win title="mc-skinlar.uz" minH={120}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Array.from({ length: n }, (_, i) => <SkinCard key={i} n={i + 1} />)}
              </div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sezdingizmi? Kartochka ko'paydi, kod esa <b>deyarli o'smadi</b>. Mana komponentning kuchi. O'zgartirish kerakmi? Bitta joyda o'zgartirasiz — hammasi yangilanadi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — SINF JURNALI ANALOGIYASI (V-DOM muammosi) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Sinf jurnalini tasavvur qiling. Azizaning matematikadan bahosi o'zgardi. O'qituvchi butun jurnalni boshidan qayta yozadimi? Albatta yo'q — faqat bitta katakni to'g'rilaydi. Ikkala usulni ham sinab ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const NAMES = ['Aziza', 'Bobur', 'Dilnoza'];
  const SUBJ = ['Mat', 'Ona tili', 'Ingliz', 'Fizika'];
  const [mode, setMode] = useState('old');
  const [grade, setGrade] = useState(4);
  const [flashKey, setFlashKey] = useState(0);
  const [tried, setTried] = useState(storedAnswer ? new Set(['old', 'smart']) : new Set());
  const done = tried.has('old') && tried.has('smart');
  const change = () => {
    setGrade(g => (g === 4 ? 5 : 4));
    if (mode === 'old') setFlashKey(k => k + 1);
    setTried(prev => { const s = new Set(prev); s.add(mode); return s; });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cellStyle = { background: '#fff', borderRadius: 7, padding: '6px 4px', textAlign: 'center', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12, color: T.ink };
  return (
    <Stage eyebrow="Hayotdan misol" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala usulni sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta baho o'zgarsa, <span className="italic" style={{ color: T.accent }}>butun jurnalni</span> qayta yozasizmi?</h2></div>
        <Mentor>Sinf jurnalini tasavvur qiling. Azizaning matematikadan bahosi o'zgardi. O'qituvchi <b style={{ color: T.ink }}>butun jurnalni</b> boshidan qayta yozadimi? Albatta yo'q — <b style={{ color: T.ink }}>faqat bitta katakni</b> to'g'rilaydi. Ikkala usulni sinab ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`chip ${mode === 'old' ? 'chip-on' : ''}`} onClick={() => setMode('old')}>Eski usul {tried.has('old') ? '✓' : ''}</button>
              <button className={`chip ${mode === 'smart' ? 'chip-on' : ''}`} onClick={() => setMode('smart')}>Aqlli usul {tried.has('smart') ? '✓' : ''}</button>
            </div>
            <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={change}>Azizaning bahosini o'zgartirish</button>
            {tried.size > 0 && (
              <div className="hint fade-step" key={`${mode}-${tried.size}`}>
                <p className="body" style={{ margin: 0, color: T.ink2 }}>{mode === 'old'
                  ? <>Ko'rdingizmi? <b style={{ color: T.accent }}>Butun jurnal qayta chizildi — 12 katak!</b> Oddiy saytlar DOM'ni shunday yangilaydi. Isrof va sekin.</>
                  : <>Endi <b style={{ color: T.success }}>faqat 1 katak</b> yangilandi. React aynan shunday ishlaydi — keyingi ekranda qanday qilishini ko'ramiz.</>}</p>
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Sinf jurnali</p>
            <div className="frame fade-up delay-2" style={{ padding: 12 }} key={mode === 'old' ? `j-${flashKey}` : 'j-smart'}>
              <div style={{ display: 'grid', gridTemplateColumns: '76px repeat(4, 1fr)', gap: 5 }}>
                <span />
                {SUBJ.map(s => <span key={s} style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 10, color: T.ink3, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s}</span>)}
                {NAMES.map((nm, r) => (
                  <React.Fragment key={nm}>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 12, color: T.ink2, alignSelf: 'center' }}>{nm}</span>
                    {SUBJ.map((s, c) => {
                      const isHot = r === 0 && c === 0;
                      const flashing = mode === 'old' && flashKey > 0;
                      const hotNow = mode === 'smart' && isHot;
                      return (
                        <span key={`${r}-${c}-${isHot ? grade : 0}`} className={flashing ? 'jflash' : (hotNow ? 'jhot' : '')} style={{ ...cellStyle, animationDelay: flashing ? `${(r * 4 + c) * 0.05}s` : undefined }}>
                          {isHot ? grade : [4, 5, 4, 5, 3, 4, 5, 4, 4, 5, 4, 3][r * 4 + c]}
                        </span>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — VIRTUAL DOM MEXANIZMI =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `React xotirasida sahifaning yengil nusxasini — qoralamasini saqlaydi. Bu Virtual DOM deyiladi. O'zgarish bo'lganda u yangi qoralama chizadi, eskisi bilan solishtiradi va faqat farqni haqiqiy sahifaga qo'yadi. Tugmani bosib, jarayonni kuzating.`, trigger: 'on_mount', waits_for: null }]);
  const [phase, setPhase] = useState(storedAnswer ? 3 : 0); // 0 boshlanmagan, 1 qoralama, 2 solishtirish, 3 yangilandi
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = phase >= 3;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setRunning(true); setPhase(1);
    timer.current = setTimeout(() => {
      setPhase(2);
      timer.current = setTimeout(() => { setPhase(3); setRunning(false); }, 1100);
    }, 1100);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const STEPS = ["Yangi qoralama chiziladi", "Eski bilan solishtiriladi — farq topiladi", "Faqat farq sahifaga qo'yiladi"];
  const Snap = ({ label, likes, hot }) => (
    <div style={{ flex: 1, minWidth: 0, background: CODE.bg, borderRadius: 10, padding: '9px 10px' }}>
      <p className="mono" style={{ fontSize: 9.5, color: CODE.comment, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p className="mono" style={{ fontSize: 11.5, color: CODE.text, margin: 0 }}>post: "Qal'a"</p>
      <p className="mono" style={{ fontSize: 11.5, color: CODE.text, margin: '3px 0 0', borderRadius: 5, padding: '1px 4px', background: hot ? 'rgba(255,79,40,0.22)' : 'transparent', boxShadow: hot ? `inset 0 0 0 1px ${T.accent}` : 'none', display: 'inline-block' }}>like: <span style={{ color: CODE.str }}>{likes}</span></p>
    </div>
  );
  return (
    <Stage eyebrow="Virtual DOM" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Jarayonni kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">React nima o'zgarganini <span className="italic" style={{ color: T.accent }}>qayerdan</span> biladi?</h2></div>
        <Mentor>React xotirasida sahifaning yengil nusxasini — <b style={{ color: T.ink }}>qoralamasini</b> saqlaydi. Bu <b style={{ color: T.ink }}>Virtual DOM</b> deyiladi. O'zgarish bo'lganda: yangi qoralama → eskisi bilan solishtirish → <b style={{ color: T.ink }}>faqat farq</b> sahifaga. Tugmani bosib kuzating.</Mentor>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run} disabled={running}>{running ? 'Ishlayapti…' : (done ? '↻ Yana ko’rsatish' : '▶ Like bosildi — kuzating')}</button>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 11, background: phase > i ? T.successSoft : T.bg, opacity: phase > i ? 1 : 0.55, transition: 'all 0.4s' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: phase > i ? T.success : T.ink3, minWidth: 16 }}>{phase > i ? '✓' : i + 1}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: phase > i ? T.ink : T.ink2 }}>{s}</span>
                </div>
              ))}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Xotirada (Virtual DOM)</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Snap label="Eski nusxa" likes={12} hot={phase === 2} />
              {phase >= 1 ? <Snap label="Yangi nusxa" likes={13} hot={phase === 2} /> : <div style={{ flex: 1, border: `1.5px dashed ${T.ink3}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 70 }}><span className="small" style={{ color: T.ink3, fontStyle: 'italic' }}>kutilmoqda…</span></div>}
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>Haqiqiy sahifa</p>
            <Win title="ilova.uz" minH={56}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#8FBF6B,#6D4C41)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏰</span>
                <span className={phase >= 3 ? 'jhot' : ''} key={`pg-${phase >= 3 ? 'new' : 'old'}`} style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14, color: phase >= 3 ? T.success : T.ink, borderRadius: 7, padding: '3px 9px' }}>♥ {phase >= 3 ? 13 : 12}</span>
                {phase >= 3 && <span className="small fade-step" style={{ color: T.success, fontWeight: 600 }}>faqat shu son yangilandi!</span>}
              </div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>Virtual DOM</b> — xotiradagi qoralama. Solishtirdi → farqni topdi → faqat o'sha joyni yangiladi. Shuning uchun React ilovalar tez!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (Virtual DOM) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Virtual DOM nima qiladi? To'g'ri javobni tanlang."
    questionText="Virtual DOM nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>Virtual DOM</span> nima qiladi?</h2></>}
    options={["Sahifani har safar to'liq qayta yuklaydi", 'Internetni tezlashtiradi', 'Kodni avtomatik yozib beradi', "Eski va yangi holatni solishtirib, faqat o'zgargan joyni yangilaydi"]} correctIdx={3}
    explainCorrect="To'g'ri! Virtual DOM — xotiradagi qoralama: React eski va yangi nusxani solishtiradi va faqat farqni haqiqiy sahifaga qo'yadi."
    explainWrong={{
      0: "Aksincha! To'liq qayta yuklash — eski usul. Virtual DOM aynan shundan qutqaradi.",
      1: "Yo'q — internet tezligiga aloqasi yo'q. Gap sahifani aqlli yangilashda.",
      2: "Yo'q — kod yozib bermaydi. U o'zgarishlarni topib, faqat kerakli joyni yangilaydi.",
      default: "Virtual DOM solishtiradi va faqat farqni yangilaydi."
    }} />
);

// ===== SCREEN 10 — ODDIY SAYT vs REACT ILOVA (yonma-yon) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Endi ikkalasini yonma-yon solishtiring — xuddi dars boshidagidek, lekin endi siz sababini bilasiz. Avval chapdagi oddiy saytda, keyin o'ngdagi React ilovada like bosing.`, trigger: 'on_mount', waits_for: null }]);
  const [liked, setLiked] = useState(storedAnswer ? new Set(['old', 'react']) : new Set());
  const done = liked.has('old') && liked.has('react');
  const mark = (k) => setLiked(prev => { const s = new Set(prev); s.add(k); return s; });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const ROWS = [
    ['Yangilash', 'Butun sahifa', "Faqat o'zgargan joy"],
    ['Kod', 'Nusxa-nusxa takror', 'Komponentlar'],
    ['Sezgi', 'Sekin, miltillaydi', 'Bir zumda']
  ];
  return (
    <Stage eyebrow="Taqqoslash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasida like bosing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oddiy sayt va React ilova — <span className="italic" style={{ color: T.accent }}>farqni his qiling</span>.</h2></div>
        <Mentor>Endi ikkalasini <b style={{ color: T.ink }}>yonma-yon</b> solishtiring — xuddi dars boshidagidek, lekin endi siz <b style={{ color: T.ink }}>sababini bilasiz</b>. Avval chapda, keyin o'ngda like bosing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Oddiy sayt (HTML + JS) {liked.has('old') ? '✓' : ''}</p>
            <LikeDemo mode="old" title="eski-sayt.uz" onLiked={() => mark('old')} />
          </Col>
          <Col>
            <p className="flow-label">React ilova {liked.has('react') ? '✓' : ''}</p>
            <LikeDemo mode="react" title="react-ilova.uz" onLiked={() => mark('react')} />
          </Col>
        </div>
        {done && (
          <div className="frame fade-step" style={{ padding: '13px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr 1fr', gap: 7, alignItems: 'center' }}>
              <span />
              <span className="flow-label" style={{ color: T.ink3 }}>Oddiy sayt</span>
              <span className="flow-label" style={{ color: T.accent }}>React ilova</span>
              {ROWS.map(([k, a, b]) => (
                <React.Fragment key={k}>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12, color: T.ink2 }}>{k}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: T.ink3 }}>{a}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink }}>{b}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — REACT NATIVE =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Eng zo'r yangilik: React'ni o'rgansangiz, faqat sayt emas — haqiqiy telefon ilovalarini ham yasay olasiz. Buning nomi React Native. Ikkala ko'rinishni almashtirib ko'ring: kod bitta, dunyo ikkita.`, trigger: 'on_mount', waits_for: null }]);
  const [view, setView] = useState('web');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['web', 'phone']) : new Set(['web']));
  const done = seen.has('web') && seen.has('phone');
  const sw = (v) => { setView(v); setSeen(prev => { const s = new Set(prev); s.add(v); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const AppUI = ({ compact }) => (
    <div style={{ padding: compact ? '10px 11px' : 0 }}>
      <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: compact ? 12 : 13.5, color: T.ink, margin: '0 0 7px' }}>Mening ilovam</p>
      <div style={{ height: compact ? 40 : 48, borderRadius: 9, background: 'linear-gradient(135deg,#AFC8EE,#D9C5EC)', marginBottom: 8 }} />
      <button className="likebtn liked"><span style={{ color: T.accent }}>♥</span> 27</button>
    </div>
  );
  return (
    <Stage eyebrow="React Native" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkala ko'rinishni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta texnologiya bilan <span className="italic" style={{ color: T.accent }}>telefon ilovasi</span> ham yasaladimi?</h2></div>
        <Mentor>Eng zo'r yangilik: React'ni o'rgansangiz, faqat sayt emas — haqiqiy <b style={{ color: T.ink }}>telefon ilovalarini</b> ham yasay olasiz. Buning nomi <b style={{ color: T.ink }}>React Native</b>. Ikkala ko'rinishni almashtiring: <b style={{ color: T.ink }}>kod bitta, dunyo ikkita</b>.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`chip ${view === 'web' ? 'chip-on' : ''}`} onClick={() => sw('web')}>Brauzerda — React {seen.has('web') ? '✓' : ''}</button>
              <button className={`chip ${view === 'phone' ? 'chip-on' : ''}`} onClick={() => sw('phone')}>Telefonda — React Native {seen.has('phone') ? '✓' : ''}</button>
            </div>
            <pre className="code-box fade-up delay-2">
              <Cm>{'// kod O’ZGARMAYDI:'}</Cm>{'\n'}
              <Jx>{'function'}</Jx>{' LikeButton() { … }'}{'\n'}
              <Jx>{'<LikeButton />'}</Jx>{'\n'}
              <Cm>{view === 'web' ? '// → brauzerda sayt bo’ladi' : '// → telefonda ilova bo’ladi'}</Cm>
            </pre>
          </Col>
          <Col>
            <p className="flow-label">{view === 'web' ? 'Brauzer (sayt)' : 'Telefon (ilova)'}</p>
            <div className="demo-swap" key={view}>
              {view === 'web' ? (
                <Win title="mening-ilovam.uz" minH={110}><AppUI /></Win>
              ) : (
                <div className="phone"><div className="phone-notch" /><div className="phone-scr"><AppUI compact /></div></div>
              )}
            </div>
            <div className="fade-up delay-3" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="flow-label" style={{ marginRight: 2 }}>React Native'da qurilgan:</span>
              {['Instagram', 'Discord', 'Shopify'].map(a => <span key={a} className="tagpill">{a}</span>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir marta React o'rganasiz — <b>sayt ham, telefon ilovasi ham</b> qo'lingizda.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (React Native) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    audioText="React Native nima imkon beradi? To'g'ri javobni tanlang."
    questionText="React Native nima imkon beradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>React Native</span> nima imkon beradi?</h2></>}
    options={["Faqat kompyuter o'yinlarini yasash", 'React bilimi bilan haqiqiy telefon ilovalarini yasash', 'Saytlarni bezash', 'Internetga ulanish']} correctIdx={1}
    explainCorrect="To'g'ri! React Native — o'sha React bilimi bilan iOS va Android ilovalari yasash imkonini beradi. Instagram va Discord shu yo'ldan foydalanadi."
    explainWrong={{
      0: "Yo'q — o'yin emas. React Native telefon ilovalari yasaydi: Instagram, Discord kabi.",
      2: "Bezash — CSS'ning ishi. React Native — telefon ilovalarini qurish vositasi.",
      3: "Yo'q — internetga ulanish emas. Bu React bilan telefon ilovalari qurish.",
      default: "React Native — React bilimi bilan telefon ilovalari yasash."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: SAHIFANI KOMPONENTLARDAN YIG'ISH =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Endi o'zingiz quring! Chiplardan bosib, o'z Minecraft saytingizni komponentlardan yig'ing. Eng zo'ri: bitta komponentni necha marta xohlasangiz, shuncha marta ishlating — xuddi Minecraft'da bitta blokni qayta-qayta qo'yganday! Kamida 3 ta blok qo'ying.`, trigger: 'on_mount', waits_for: null }]);
  const COMP = {
    nav: { l: '<Navbar />', name: 'Menyu' },
    search: { l: '<SearchBar />', name: 'Qidiruv' },
    card: { l: '<SkinCard />', name: 'Skin kartochka' },
    footer: { l: '<Footer />', name: 'Pastki qism' }
  };
  const [items, setItems] = useState(storedAnswer ? ['nav', 'card', 'card'] : []);
  const done = items.length >= 3;
  const MAX = 7;
  const add = (k) => { if (items.length >= MAX) return; setItems(prev => [...prev, k]); };
  const reset = () => setItems([]);
  const counts = items.reduce((m, k) => { m[k] = (m[k] || 0) + 1; return m; }, {});
  const reused = Object.keys(counts).find(k => counts[k] >= 2);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const renderPart = (k, i) => {
    switch (k) {
      case 'nav': return <div key={i} className="el-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.bg, borderRadius: 8, padding: '6px 10px' }}><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 11, color: T.ink }}>⛏ Mening MC saytim</span><span style={{ fontSize: 9.5, color: T.ink3, fontFamily: "'Manrope',sans-serif" }}>Asosiy · Skinlar</span></div>;
      case 'search': return <div key={i} className="el-in" style={{ background: T.bg, borderRadius: 8, padding: '6px 10px', fontFamily: "'Manrope',sans-serif", fontSize: 10.5, color: T.ink3 }}>Skin qidirish…</div>;
      case 'card': return <div key={i} className="el-in" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, padding: 6, boxShadow: '0 2px 7px -2px rgba(0,0,0,0.12)' }}><span style={{ width: 34, height: 24, borderRadius: 5, background: SKINS[i % SKINS.length].bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{SKINS[i % SKINS.length].emoji}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 10.5, color: T.ink }}>{SKINS[i % SKINS.length].name}</span><span style={{ marginLeft: 'auto', fontSize: 9.5, color: T.ink3 }}>♥ 12</span></div>;
      case 'footer': return <div key={i} className="el-in" style={{ background: T.bg, borderRadius: 8, padding: '6px 10px', textAlign: 'center', fontFamily: "'Manrope',sans-serif", fontSize: 9.5, color: T.ink3 }}>© Mening saytim · 2026</div>;
      default: return null;
    }
  };
  return (
    <Stage eyebrow="Amaliyot · sahifa yig'amiz" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 3 ta blok (${items.length}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z saytingizni <span className="italic" style={{ color: T.accent }}>bloklardan</span> quring.</h2></div>
        <Mentor>Endi o'zingiz quring! Chiplardan bosib, o'z Minecraft saytingizni komponentlardan yig'ing. Eng zo'ri: <b style={{ color: T.ink }}>bitta komponentni necha marta xohlasangiz</b> — shuncha ishlating, xuddi Minecraft'da bitta blokni qayta-qayta qo'yganday! Kamida 3 ta blok qo'ying.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Bloklar (komponentlar)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.keys(COMP).map(k => (
                <button key={k} className="gchip" disabled={items.length >= MAX} onClick={() => add(k)}>{COMP[k].name} <span className="mono" style={{ color: CODE.tag, fontSize: 11 }}>{COMP[k].l}</span></button>
              ))}
              {items.length > 0 && <button className="gchip" onClick={reset}>↺ Tozalash</button>}
            </div>
            <div className="algo-build fade-up delay-2" style={{ minHeight: 110 }}>
              <div className="mono" style={{ fontSize: 12.5, color: CODE.comment }}>{'<App>'}</div>
              {items.length === 0
                ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, paddingLeft: 14 }}>{'// blok qo’shing…'}</p>
                : items.map((k, i) => <div key={i} className="algo-line el-in" style={{ borderLeft: `3px solid ${T.accent}` }}><span className="mono" style={{ fontSize: 12.5, color: '#C8501F' }}>{COMP[k].l}</span></div>)}
              <div className="mono" style={{ fontSize: 12.5, color: CODE.comment }}>{'</App>'}</div>
            </div>
            {reused && <span className="tagpill fade-step" style={{ color: T.success }}>✓ {COMP[reused].l} — {counts[reused]} marta. Bitta kod!</span>}
          </Col>
          <Col>
            <p className="flow-label">Sahifangiz</p>
            <Win title="mening-mc-saytim.uz" minH={130}>
              {items.length === 0
                ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Bo'sh sahifa — blok qo'shing…</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{items.map((k, i) => renderPart(k, i))}</div>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz hozir <b>React'cha fikrladingiz</b>: sahifa = komponentlar ro'yxati. Keyingi darsda buni haqiqiy kodda yozasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (monolit komponent xatosi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `AI kod yozishda zo'r yordamchi — Minecraft do'koni sahifasini bir zumda komponentlarga bo'lib berdi. Lekin odamlar ham, AI ham ba'zan kichik xato qiladi. Shuni topib tuzatish debugging deyiladi — dasturchining eng zo'r mahorati. Endi siz komponentlarni bilasiz: har bo'lak kichik va aniq bo'lishi kerak. Qaysi qator bu qoidaga zid? Toping-chi.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'mono' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'mono';
  const done = fixed;
  const pickMono = () => {
    if (found) return; setPicked('mono'); audio.triggerEvent('error_found');
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Qolgan hammasi bitta katta komponentga tiqilgan. Endi bo'laklarga ajratamiz.`); }, 300);
  };
  const fix = () => {
    setFixed(true);
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Mana, debugging shunday bo'ladi: xatoni topasiz va to'g'rilaysiz. Endi har bir bo'lak — alohida, qayta ishlatiladigan blok.`); }, 300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI kod yozishda <b style={{ color: T.ink }}>zo'r yordamchi</b> — Minecraft do'koni sahifasini bir zumda komponentlarga bo'lib berdi. Lekin <b style={{ color: T.ink }}>odamlar ham, AI ham</b> ba'zan kichik xato qiladi. Shuni topib tuzatish — <b style={{ color: T.ink }}>debugging</b> deyiladi, va bu eng zo'r mahorat. Esingizda: har bo'lak <b style={{ color: T.ink }}>kichik va aniq</b> bo'lishi kerak. Qaysi qator bunga zid? Toping-chi.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Minecraft do'koni sahifasini komponentlarga bo'ldim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'nav' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('nav'); }}><Jx>{'<Navbar />'}</Jx> <Cm>{'// yuqori menyu'}</Cm></div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={pickMono}><Jx>{'<ButunSahifa />'}</Jx> <Cm>{'// qolgan HAMMASI shu yerda'}</Cm></div>
                ) : (
                  <>
                    <div className="ai-line ok el-in"><Jx>{'<SkinKartasi />'}</Jx> <Cm>{'// alohida blok'}</Cm></div>
                    <div className="ai-line ok el-in"><Jx>{'<Savat />'}</Jx> <Cm>{'// alohida blok'}</Cm></div>
                  </>
                )}
                <div className={`ai-line ${picked === 'footer' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('footer'); }}><Jx>{'<Footer />'}</Jx> <Cm>{'// pastki qism'}</Cm></div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qator "kichik va aniq bo'lak" qoidasiga zid? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Bo'laklarga ajratish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Endi har bo'lak — alohida komponent!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              (picked === 'nav' || picked === 'footer')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — kichik, aniq vazifali bo'lak. Yana qarang: qaysi komponent <b>juda katta</b>?</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Endi siz komponentlarni bilasiz — AI yozgan kodni <b style={{ color: T.ink }}>tekshira olasiz</b>. Komponent — <b style={{ color: T.ink }}>kichik va aniq</b> bo'lak. "Qolgan hammasi" degani esa bitta ulkan <b style={{ color: T.ink }}>monolit</b>. Qaysi qator shunday?</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">ButunSahifa</span> — hammasi bitta katta blokda. Uni qayta ishlatib bo'lmaydi, o'zgartirish ham qiyin. Chapdagi tugma bilan bo'laklarga ajrating →</p></div>}
            {fixed && (
              <>
                <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>
                <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tanish-a? Bu — Praktika darsidagi <b>dekompozitsiya</b>! React shu fikrlashni kodning o'ziga olib kiradi.</p></div>
              </>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (React yangilash tartibi) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Oxirgi sinov! Like bosilgandan to sahifa yangilangunigacha React ichida nima yuz beradi? Qadamlarni to'g'ri tartibda bosing.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const STEPS = {
    change: { ic: '👆', t: 'Foydalanuvchi like bosadi' },
    draft: { ic: '📝', t: 'React yangi qoralama chizadi' },
    diff: { ic: '🔍', t: 'Eski nusxa bilan solishtiradi' },
    update: { ic: '⚡', t: "Faqat farqni sahifaga qo'yadi" }
  };
  const CORRECT = ['change', 'draft', 'diff', 'update'];
  const SHUFFLED = ['diff', 'update', 'change', 'draft'];
  const [picked, setPicked] = useState(storedAnswer?.picked || []);
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [failed, setFailed] = useState(false);
  const tap = (id) => {
    if (passed || picked.includes(id)) return;
    const np = [...picked, id];
    setPicked(np);
    if (np.length === CORRECT.length) {
      const ok = np.every((x, i) => x === CORRECT[i]);
      if (ok) { setPassed(true); onAnswer(screen, { correct: true, picked: np }); audio.triggerEvent('typed_ok'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! React'ning butun kuchi — shu to'rt qadamda.`); }, 300); }
      else setFailed(true);
    }
  };
  const reset = () => { setPicked([]); setFailed(false); };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Tartibni tuzing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Like bosildi — React ichida <span className="italic" style={{ color: T.accent }}>nima yuz beradi</span>?</h2></div>
        <Mentor>Oxirgi sinov! Like bosilgandan to sahifa yangilangunigacha React ichida <b style={{ color: T.ink }}>nima yuz beradi</b>? Qadamlarni to'g'ri tartibda bosing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Qadamlar — to'g'ri tartibda bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {SHUFFLED.map(id => {
                const used = picked.includes(id);
                return (
                  <button key={id} onClick={() => tap(id)} disabled={used || passed} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: used || passed ? 'default' : 'pointer', border: 'none', borderRadius: 12, padding: '12px 15px', background: used ? T.bg : T.paper, opacity: used ? 0.4 : 1, boxShadow: used ? 'none' : `0 6px 16px -6px rgba(${T.shadowBase},0.16)`, fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink, transition: 'all 0.18s', textAlign: 'left' }}>
                    <span style={{ fontSize: 17 }}>{STEPS[id].ic}</span> {STEPS[id].t}
                  </button>
                );
              })}
            </div>
            {!passed && picked.length > 0 && <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={reset}>↺ Qaytadan</button>}
          </Col>
          <Col>
            <p className="flow-label">React ichidagi oqim</p>
            <div className="algo-build" style={{ minHeight: 120 }}>
              {picked.length === 0 ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{'// qadamlarni tartib bilan tanlang…'}</p>
              ) : picked.map((id, i) => (
                <div key={i} className="algo-line el-in" style={{ borderLeft: `3px solid ${passed ? T.success : T.accent}` }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T.ink3, fontSize: 12, minWidth: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 16 }}>{STEPS[id].ic}</span>
                  <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 14, color: T.ink }}>{STEPS[id].t}</span>
                </div>
              ))}
            </div>
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Bosildi → qoralama → solishtirish → faqat farq. React aynan shunday ishlaydi!</p></div>}
            {failed && !passed && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartib biroz aralashdi. «Qaytadan» bosing — hammasi nimadan <b>boshlanadi</b>? Solishtirish uchun avval nima kerak?</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz — React dunyosiga birinchi qadamni qo'ydingiz! Esda saqlang: React — interfeys uchun JavaScript kutubxonasi. Komponent — sahifaning bloki: bir marta yoz, ming marta ishlat. Virtual DOM esa solishtiradi va faqat o'zgargan joyni yangilaydi. Keyingi darsda birinchi komponentingizni o'zingiz yozasiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = [
    "React — interfeys uchun JavaScript kutubxonasi (Facebook, 2013)",
    "Komponent — sahifaning bloki: bir marta yoz, ming marta ishlat",
    "Virtual DOM — solishtiradi, faqat farqni yangilaydi",
    "Oddiy sayt to'liq yangilanadi, React — kerakli joynigina",
    "React Native — shu bilim bilan telefon ilovalari"
  ];
  const HOMEWORK = [
    { b: 'Komponent ovi', t: "— Instagram yoki YouTube'ni oching, takrorlanadigan 5 ta bo'lakni toping va daftaringizga yozing" },
    { b: "Bo'laklash", t: "— sevimli saytingiz bosh sahifasini qog'ozga komponentlarga bo'lib chizing" },
    { b: 'Kuzatuv', t: "— 3 ta ilovada like yoki tugma bosing: sahifa to'liq yangilanadimi yoki faqat bir joyi?" }
  ];
  const GLOSSARY = [
    { b: 'React', t: '— interfeys qurish uchun JS kutubxonasi' },
    { b: 'Kutubxona', t: "— tayyor asboblar to'plami" },
    { b: 'Komponent', t: "— qayta ishlatiladigan bo'lak (sahifaning bloki)" },
    { b: 'DOM', t: '— brauzerdagi sahifa tuzilishi' },
    { b: 'Virtual DOM', t: '— xotiradagi yengil nusxa (qoralama)' },
    { b: 'React Native', t: '— React bilan telefon ilovalari' }
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
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">React dunyosiga <span className="italic" style={{ color: T.accent }}>xush kelibsiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi Instagram nega tez ishlashini bilasiz — va tez orada o'zingiz shunday ilova yasaysiz." : "Yaxshi harakat! Komponent va Virtual DOM'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Atrofingizdagi ilovalarga React ko'zi bilan qarang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda muhitni o'rnatib, birinchi React komponentingizni o'zingiz yozasiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function ReactIntroLesson({ lang: langProp, onFinished }) {
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
        @keyframes dl-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
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
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.3s ease-out; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === STEP FLOW (gorizontal) === */
        .pz-flow { display: flex; align-items: flex-start; gap: 4px; overflow-x: auto; padding: 4px 2px 2px; }
        .pz-step { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 88px; flex: 0 0 auto; padding: 10px 6px; border-radius: 12px; transition: background 0.3s; }
        .pz-step.on { background: ${T.successSoft}; }
        .pz-step.active { background: ${T.accentSoft}; }
        .pz-lbl { font-size: 11.5px; text-align: center; color: ${T.ink2}; line-height: 1.3; font-weight: 500; }
        .pz-step.on .pz-lbl { color: ${T.ink}; }
        .pz-arrow { align-self: center; margin-top: 18px; color: ${T.ink3}; font-size: 15px; flex: 0 0 auto; transition: color 0.3s; }
        .pz-arrow.on { color: ${T.success}; }
        /* Vertikal oqim (mobil) */
        .pz-flow-v { display: flex; flex-direction: column; align-items: stretch; gap: 3px; }
        .pz-rowstep { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 12px; background: ${T.bg}; transition: background 0.3s; }
        .pz-rowstep.on { background: ${T.successSoft}; }
        .pz-rowstep.active { background: ${T.accentSoft}; }
        .pz-rowic { font-size: 22px; width: 28px; text-align: center; flex-shrink: 0; }
        .pz-rowtxt { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .pz-rowtxt b { font-size: 14px; color: ${T.ink2}; font-weight: 700; }
        .pz-rowstep.on .pz-rowtxt b { color: ${T.ink}; }
        .pz-varrow { align-self: center; color: ${T.ink3}; font-size: 15px; line-height: 1; transition: color 0.3s; }
        .pz-varrow.on { color: ${T.success}; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === CONN (bog'lanish) === */
        .conn-flow { display: flex; align-items: center; justify-content: center; gap: 6px; background: ${T.paper}; border-radius: 16px; padding: 20px 14px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .conn-node { display: flex; flex-direction: column; align-items: center; gap: 3px; flex-shrink: 0; transition: opacity 0.3s; }
        .conn-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .conn-sub { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; text-align: center; }
        .conn-link { display: flex; align-items: center; gap: 3px; flex: 1; max-width: 140px; }
        .conn-line { flex: 1; height: 3px; background: ${T.success}; border-radius: 2px; transition: background 0.3s; }
        .conn-sig { font-size: 18px; }
        .conn-link.cut .conn-line { background: ${T.ink3}; opacity: 0.5; border-top: 2px dashed ${T.accent}; height: 0; }
        .conn-link.cut { animation: shake 0.3s; }
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }

        /* === COND (shart) === */
        .cond-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 9px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .cond-line { font-family: 'Manrope'; font-size: clamp(13px,1.7vw,15px); color: ${T.ink2}; padding: 9px 12px; border-radius: 10px; background: ${T.bg}; transition: all 0.3s; }
        .cond-line.on { background: ${T.successSoft}; color: ${T.ink}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .cond-kw { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.blue}; font-size: 0.92em; }

        /* === LOOP (sikl) === */
        .loop-card { background: ${T.paper}; border-radius: 14px; padding: 16px 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .loop-kw { margin: 0; }
        .loop-act { font-family: 'Manrope'; font-weight: 600; color: ${T.ink}; margin: 4px 0 0; padding-left: 14px; }

        /* === ALGO BUILD === */
        .algo-build { background: ${T.paper}; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 7px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .algo-line { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; background: ${T.bg}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; } .ai-line:hover { background: rgba(255,255,255,0.06); }
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


        /* === REACT-1 DARS CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .vcard { border-radius: 10px; background: #fff; box-shadow: 0 4px 12px -4px rgba(0,0,0,0.14); overflow: hidden; border: 1px solid rgba(0,0,0,0.04); }
        .vthumb { height: 42px; background: linear-gradient(135deg,#AFC8EE,#D9C5EC); display: flex; align-items: center; justify-content: center; }
        .vplay { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,0.85); color: #333; font-size: 8px; display: flex; align-items: center; justify-content: center; }
        .likebtn { font-family: 'Manrope'; font-weight: 700; font-size: 13px; border: none; border-radius: 10px; background: ${T.bg}; color: ${T.ink}; padding: 7px 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; box-shadow: 0 3px 8px -3px rgba(0,0,0,0.15); }
        .likebtn:hover { transform: translateY(-1px); }
        .likebtn.liked { background: ${T.accentSoft}; color: ${T.accent}; }
        @keyframes heart-pop { 0% { transform: scale(1); } 40% { transform: scale(1.45); } 100% { transform: scale(1); } }
        .hpop { animation: heart-pop 0.4s ease; display: inline-block; }
        @keyframes spin360 { to { transform: rotate(360deg); } }
        .reload-cover { position: absolute; inset: 0; background: rgba(255,255,255,0.93); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; z-index: 2; }
        .spinner { width: 22px; height: 22px; border-radius: 50%; border: 3px solid rgba(167,166,162,0.4); border-top-color: ${T.accent}; animation: spin360 0.7s linear infinite; }
        .appbtn { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 14px; cursor: pointer; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: all 0.18s; width: 100%; text-align: left; }
        .appbtn:hover { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .appbtn.seen { box-shadow: inset 0 0 0 1.5px ${T.success}, 0 4px 10px -5px rgba(${T.shadowBase},0.12); }
        .appbtn.active { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.25); }
        .applogo { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Manrope'; font-weight: 800; font-size: 15px; flex-shrink: 0; }
        .zone { cursor: pointer; transition: box-shadow 0.18s; border-radius: 10px; position: relative; }
        .zone.seen { box-shadow: 0 0 0 1.5px ${T.success}; }
        .zone.active { box-shadow: 0 0 0 2px ${T.accent}; }
        .zlbl { position: absolute; top: -9px; right: -5px; font-family: 'JetBrains Mono'; font-size: 9px; background: ${T.ink}; color: #fff; padding: 2px 7px; border-radius: 6px; z-index: 3; white-space: nowrap; animation: fade-step 0.3s; }
        @keyframes jflash { 0% { background: ${T.accentSoft}; } 100% { background: #fff; } }
        .jflash { animation: jflash 0.9s ease-out; }
        @keyframes jpop { 0% { transform: scale(0.55); } 100% { transform: scale(1); } }
        .jhot { animation: jpop 0.45s ease-out; background: ${T.successSoft} !important; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .phone { width: clamp(150px,17vw,185px); background: #0E0E10; border-radius: 26px; padding: 9px; box-shadow: 0 14px 30px -10px rgba(${T.shadowBase},0.45); margin: 0 auto; }
        .phone-notch { width: 54px; height: 5px; border-radius: 99px; background: #3a3a3e; margin: 0 auto 7px; }
        .phone-scr { background: #fff; border-radius: 18px; overflow: hidden; }

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
