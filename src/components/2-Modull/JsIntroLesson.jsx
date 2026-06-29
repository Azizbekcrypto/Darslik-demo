import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// 07-DARS — JAVASCRIPT MODULIGA KIRISH: SISTEMA VA ALGORITM — PLATFORM STANDARD v16
// Mavzu: Sistema (inson tanasi: komponentlar + bog'lanishlar),
//        Algoritm = retsept (ertalabki tartib: ketma-ketlik, shart, sikl).
// Sof tushuncha — JS kodisiz. Keyingi darsda haqiqiy JavaScript yoziladi.
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

// AUDIOSIZ: AudioIndicator (ovoz/replay tugmalari) olib tashlandi — ovoz o'chirilgan, ikonka kerak emas.

const LESSON_META = { lessonId: 'js-intro-01-v16', lessonTitle: { uz: 'Sistema va Algoritm', ru: 'Система и алгоритм' } };
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

// ===== SCREEN 0 — HOOK (inson tanasi sistema) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Yugurib ketayotganingizni tasavvur qiling. Faqat oyoq ishlayaptimi? Yo'q — yurak tezroq uradi, nafas tezlashadi, miya har bir qadamni boshqaradi. Hammasi bir vaqtda, siz buyurmasdan ham. Bu qanday bo'ladi? "Yugur" tugmasini bosib ko'ring.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('rest');
  const ORGANS = [{ ic: '🧠', n: 'Miya' }, { ic: '🫁', n: "O'pka" }, { ic: '🫀', n: 'Yurak' }, { ic: '💪', n: 'Mushaklar' }];
  const OPTS = [
    { id: 'a', label: 'Faqat oyoq mushaklari ishlaydi' },
    { id: 'b', label: "Ko'p a'zo birgalikda ishlaydi" },
    { id: 'c', label: "Hech qanday sa'y-harakatsiz" }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Yugurganda tanangizda <span className="italic" style={{ color: T.accent }}>faqat oyoq</span> ishlaydimi?</h1>
        <Mentor>Yugurib ketayotganingizni tasavvur qiling. Faqat oyoq ishlayaptimi? Yo'q — yurak tezroq uradi, nafas tezlashadi, miya har bir qadamni boshqaradi. Hammasi bir vaqtda, <b style={{ color: T.ink }}>siz buyurmasdan ham</b>. Bu qanday bo'ladi? <b style={{ color: T.ink }}>"Yugur"</b> tugmasini bosib ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'rest' ? 'chip-on' : ''}`} onClick={() => setView('rest')}>🧍 Tinch</button>
              <button className={`chip ${view === 'run' ? 'chip-on' : ''}`} onClick={() => setView('run')}>🏃 Yugur</button>
            </div>
            <div className="demo-swap" key={view} style={{ background: T.paper, borderRadius: 14, padding: '18px 16px', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <p className="flow-label" style={{ marginBottom: 12 }}>{view === 'run' ? '🏃 Yugurmoqda — a’zolar birga ishlayapti' : '🧍 Tinch holatda'}</p>
              <div className="bpm-row">
                <span className="bpm-heart" style={{ animationDuration: view === 'run' ? '0.42s' : '1s' }}>❤️</span>
                <div className="bpm-info">
                  <span className="bpm-num" style={{ color: view === 'run' ? T.accent : T.ink2 }}>{view === 'run' ? '140' : '72'}</span>
                  <span className="bpm-unit">zarba / daqiqa</span>
                </div>
                <div className="eq">
                  {[0, 1, 2, 3, 4].map(i => (<span key={i} className="eq-bar" style={{ animationDuration: view === 'run' ? '0.5s' : '1.4s', animationDelay: `${i * 0.08}s`, opacity: view === 'run' ? 1 : 0.45 }} />))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ORGANS.map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, background: view === 'run' ? T.accentSoft : T.bg, boxShadow: view === 'run' ? '0 6px 16px -5px rgba(255,79,40,0.4)' : 'none', transition: 'all 0.3s' }}>
                    <span style={{ fontSize: 22, animation: view === 'run' ? `dl-pulse 0.7s ease-in-out infinite ${i * 0.12}s` : 'none', display: 'inline-block' }}>{o.ic}</span>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: view === 'run' ? T.accent : T.ink2 }}>{o.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nega yugura olasiz?</p>
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
            {picked !== null && <p className="hook-ack fade-step">To'g'ri! Tana — bu <b>sistema</b>: ko'p a'zo birga ishlaydi. Bugun shuni o'rganamiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Sizga bir sirni aytaman: dasturchilar kod yozishdan oldin boshqacha fikrlaydi. Ularning butun ishi ikkita asosiy tushunchaga — ya'ni 2 ta muhim fikrga — tayanadi: sistema va algoritm. Bugun aynan shu ikkalasini, birma-bir va oddiy misollar bilan o'rganamiz, 5 ta qadamda. Keyin esa — haqiqiy JavaScript.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Sistema nima? — komponentlar', tag: '' },
    { text: 'Bog\'lanishlar — qismlar qanday ulanadi', tag: '' },
    { text: 'Algoritm = retsept', tag: '' },
    { text: 'Shart va sikl', tag: 'agar · takrorla' },
    { text: 'O\'z algoritmingni tuz', tag: '' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi 2 ta asosiy tushuncha</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
          <span className="idea-ic idea-ic-sys">🧩</span>
          <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>SISTEMA</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Birga ishlaydigan qismlar + bog'lanishlar</p></div>
        </div>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
          <span className="idea-ic idea-ic-algo">📋</span>
          <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>ALGORITM</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Retsept: ketma-ketlik, shart, sikl</p></div>
        </div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ keyingi darsda buni JavaScript'da yozamiz</p>
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
          <h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Bugun dasturchidek fikrlashni o'rganamiz!</span></h2>
        </div>
        <Mentor>Sizga bir sirni aytaman: dasturchilar kod yozishdan oldin boshqacha <b style={{ color: T.ink }}>fikrlaydi</b>. Ularning butun ishi ikkita asosiy <b style={{ color: T.ink }}>tushunchaga</b> — ya'ni 2 ta muhim fikrga — tayanadi: <b style={{ color: T.ink }}>sistema</b> va <b style={{ color: T.ink }}>algoritm</b>. Bugun aynan shu ikkalasini <b style={{ color: T.ink }}>birma-bir</b>, oddiy misollar bilan o'rganamiz. Keyin esa — haqiqiy <b style={{ color: T.ink }}>JavaScript</b>.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Bugungi 5 qadamni ko'rish</button>
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

// ===== SCREEN 2 — SISTEMA = KOMPONENTLAR =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Tanangizni bir butun deb o'ylaysiz, to'g'rimi? Aslida u ko'plab qismdan — komponentdan iborat, va har biri o'z ishini bajaradi: miya boshqaradi, yurak qon haydaydi, o'pka kislorod oladi. Har bir a'zoni bosib, vazifasini bilib oling.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    miya: { ic: '🧠', name: 'Miya', role: "Boshqaruv markazi — barcha a'zolarga buyruq beradi." },
    yurak: { ic: '🫀', name: 'Yurak', role: 'Nasos — qonni butun tanaga haydaydi.' },
    opka: { ic: '🫁', name: "O'pka", role: 'Havodan kislorod oladi va qonga beradi.' },
    mushak: { ic: '💪', name: 'Mushaklar', role: 'Harakatni bajaradi — yuradi, ko\'taradi, yuguradi.' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size === 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sistema" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 a'zo ko'rilgan`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tana <span className="italic" style={{ color: T.accent }}>nimalardan</span> tuzilgan?</h2></div>
        <Mentor>Tanangizni bir butun deb o'ylaysiz, to'g'rimi? Aslida u ko'plab <b style={{ color: T.ink }}>qismdan (komponentdan)</b> iborat, va har biri o'z ishini bajaradi: miya boshqaradi, yurak qon haydaydi, o'pka kislorod oladi. Har bir a'zoni bosib, vazifasini bilib oling.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Komponentlar (a'zolar)</p>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.keys(PARTS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none', borderRadius: 14, padding: '16px 10px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span style={{ fontSize: 30 }}>{PARTS[k].ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink }}>{PARTS[k].name}</span>
                  {seen.has(k) && <span style={{ color: T.success, fontSize: 12 }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ fontSize: 26 }}>{PARTS[active].ic}</span><span className="sk-wordbadge">{PARTS[active].name}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].role}</p>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir a'zoni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mana shu — <b>komponentlar</b>. Har biri alohida ishni bajaradi, lekin birga — bitta sistema. Endi ko'ramiz: ular qanday <b>bog'lanadi</b>?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BOG'LANISHLAR =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Komponentlar yolg'iz hech nima qila olmaydi — ular bir-biriga bog'langan. Miya mushakka "qimirla" degan signalni nerv orqali jo'natadi. Lekin shu bog'lanish uzilib qolsa-chi? Tugmani bosib, o'z ko'zingiz bilan ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [broken, setBroken] = useState(false);
  const [touched, setTouched] = useState(false);
  const done = touched;
  const toggle = () => { setBroken(b => !b); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bog'lanishlar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bog\'lanishni sinab ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qismlar bir-biriga <span className="italic" style={{ color: T.accent }}>qanday</span> ulanadi?</h2></div>
        <Mentor>Komponentlar yolg'iz hech nima qila olmaydi — ular bir-biriga <b style={{ color: T.ink }}>bog'langan</b>. Miya mushakka "qimirla" signalini <b style={{ color: T.ink }}>nerv</b> orqali jo'natadi. Lekin shu bog'lanish uzilib qolsa-chi? Tugmani bosib, o'z ko'zingiz bilan ko'ring.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="conn-flow fade-up delay-1">
          <div className="conn-node"><span style={{ fontSize: 34 }}>🧠</span><span className="conn-lbl">Miya</span><span className="conn-sub">buyruq beradi</span></div>
          <div className={`conn-link ${broken ? 'cut' : ''}`}>
            <span className="conn-line" />
            <span className="conn-sig">{broken ? '✂️' : '⚡'}</span>
            <span className="conn-line" />
          </div>
          <div className="conn-node" style={{ opacity: broken ? 0.45 : 1 }}><span style={{ fontSize: 34 }}>{broken ? '😴' : '💪'}</span><span className="conn-lbl">Mushak</span><span className="conn-sub">{broken ? 'buyruq yetmadi' : 'harakatlanadi'}</span></div>
        </div>
        <button className="btn" onClick={toggle} style={{ alignSelf: 'flex-start' }}>{broken ? '🔗 Bog\'lanishni ulash' : '✂️ Bog\'lanishni uzish'}</button>
        {done && (
          broken
            ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bog'lanish uzildi — signal mushakka <b>yetib bormadi</b>, harakat yo'q. Demak sistemada bog'lanish ham komponent kabi muhim!</p></div>
            : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>Bog'lanish</b> — qismlar bir-biriga ta'sir o'tkazadigan yo'l. U bo'lmasa, komponentlar yakka qoladi va sistema ishlamaydi.</p></div>
        )}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Sistema nima? To'g'ri variantni tanlang."
    questionText="Sistema nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Sistema nima?</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sistema nima?</h2></>}
    options={['Bitta katta, bo\'linmas qism', 'Birga ishlaydigan komponentlar va ularning bog\'lanishlari', 'Tasodifiy narsalar to\'plami', 'Faqat kompyuter']} correctIdx={1}
    explainCorrect="To'g'ri! Sistema — birga ishlaydigan komponentlar (qismlar) va ular orasidagi bog'lanishlardir. Inson tanasi shunga misol."
    explainWrong={{ 0: 'Yo’q — sistema aynan ko’p qismdan iborat, bitta bo’linmas narsa emas.', 2: 'Yo’q — sistemadagi qismlar tasodifiy emas, ular birga, maqsad bilan ishlaydi.', 3: 'Yo’q — kompyuter ham sistema, lekin sistema faqat kompyuter degani emas. Tana, jamoa ham sistema.', default: 'Sistema — komponentlar va ularning bog’lanishlari.' }} />
);

// ===== SCREEN 5 — ATROFDAGI SISTEMALAR =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Bir marta payqang — endi sistemani hamma joyda ko'ra boshlaysiz. Futbol jamoasi, tanangiz, hatto o'zingiz yasagan sayt ham — bari sistema. Har birini bosib, qismlari va bog'lanishini toping.`, trigger: 'on_mount', waits_for: null }]);
  const EX = {
    tana: { ic: '🫀', title: 'Inson tanasi', parts: ['miya', 'yurak', "o'pka", 'mushaklar'], conn: 'qon tomir va nervlar', note: 'Bir a\'zo to\'xtasa, butun tana qiynaladi.' },
    jamoa: { ic: '⚽', title: 'Futbol jamoasi', parts: ['o\'yinchilar', 'darvozabon', 'murabbiy'], conn: 'paslar va kelishuv', note: 'Paslar yo\'q bo\'lsa, jamoa o\'yin qura olmaydi.' },
    sayt: { ic: '🌐', title: 'Veb-sayt', parts: ['brauzer', 'server', 'HTML', 'CSS'], conn: 'internet so\'rovlari', note: 'Internet darsida ko\'rgan so\'rov yo\'li — ayni shu bog\'lanish!' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sistemalar atrofda" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yana <span className="italic" style={{ color: T.accent }}>qayerda</span> sistema bor?</h2></div>
        <Mentor>Bir marta payqang — endi sistemani <b style={{ color: T.ink }}>hamma joyda</b> ko'ra boshlaysiz. Futbol jamoasi, tanangiz, hatto o'zingiz yasagan <b style={{ color: T.ink }}>sayt</b> ham — bari sistema! Har birini bosib, qismlari va bog'lanishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.keys(EX).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '13px 15px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span style={{ fontSize: 26 }}>{EX[k].ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, color: T.ink }}>{EX[k].title}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 14 }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ fontSize: 24 }}>{EX[active].ic}</span><span className="sk-wordbadge">{EX[active].title}</span></span>
                <p className="flow-label" style={{ margin: '13px 0 7px' }}>Komponentlar (qismlar)</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EX[active].parts.map((p, i) => (<span key={i} className="el-in" style={{ animationDelay: `${i * 0.07}s`, fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 12.5, color: T.ink, background: T.bg, padding: '6px 12px', borderRadius: 99 }}>{p}</span>))}
                </div>
                <div className="el-in" style={{ animationDelay: '0.28s', display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, background: T.successSoft, borderRadius: 10, padding: '10px 13px' }}>
                  <span className="lnk-pulse" style={{ fontSize: 17 }}>🔗</span>
                  <span className="body" style={{ margin: 0, color: T.ink }}><b>Bog'lanish:</b> {EX[active].conn}</span>
                </div>
                <p className="body" style={{ color: T.ink2, margin: '10px 0 0', fontStyle: 'italic' }}>{EX[active].note}</p>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir misolni bosing — qismlari ko'rinadi</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har xil narsa — lekin tuzilishi bir xil: <b>qismlar + bog'lanish</b>. Siz yasagan sayt ham aynan shunday sistema edi!</p></div>}
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
    audioText="Sistemada bog'lanish nima?"
    questionText="Sistemada 'bog'lanish' nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sistemada <span className="italic" style={{ color: T.accent }}>bog'lanish</span> nima?</h2></>}
    options={['Qismlar bir-biriga ta\'sir o\'tkazadigan yo\'l', 'Eng katta komponent', 'Sistemaning nomi', 'Tasodifiy hodisa']} correctIdx={0}
    explainCorrect="To'g'ri! Bog'lanish — komponentlar bir-biriga ta'sir o'tkazadigan, signal yoki ma'lumot uzatadigan yo'l (masalan, nerv yoki internet so'rovi)."
    explainWrong={{
      1: 'Yo’q — bu komponent emas. Bog’lanish — qismlarni ulaydigan yo’l.',
      2: 'Yo’q — bog’lanish nom emas, u qismlar orasidagi aloqa.',
      3: 'Yo’q — bog’lanish tasodif emas, u qismlarni maqsadli ulaydi.',
      default: 'Bog’lanish — qismlar bir-biriga ta’sir o’tkazadigan yo’l.'
    }} />
);

// ===== SCREEN 6 — ALGORITM = RETSEPT (ketma-ketlik) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Har kuni ertalab deyarli bir xil ishni qilasiz: uyg'onasiz, yuvinasiz, kiyinasiz... O'ylab ko'rsangiz, bu ham algoritm — maqsadga olib boradigan aniq, ketma-ket qadamlar, xuddi ovqat retsepti kabi. "Boshlash"ni bosib, qadamlarni kuzating.`, trigger: 'on_mount', waits_for: { type: 'flow_done' } }]);
  const STEPS = [
    { ic: '🛏️', h: 'Uyg\'onish' }, { ic: '🚿', h: 'Yuvinish' }, { ic: '👕', h: 'Kiyinish' }, { ic: '🍳', h: 'Nonushta' }, { ic: '🏫', h: 'Maktabga' }
  ];
  const [step, setStep] = useState(storedAnswer ? STEPS.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const isNarrow = useIsMobile(768);
  const done = step >= STEPS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setStep(0); setRunning(true);
    const tick = (i) => { setStep(i); if (i < STEPS.length) timer.current = setTimeout(() => tick(i + 1), 560); else { setRunning(false); audio.triggerEvent('flow_done'); } };
    timer.current = setTimeout(() => tick(1), 350);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Algoritm" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ertalab nimadan <span className="italic" style={{ color: T.accent }}>boshlaysiz</span>?</h2></div>
        <Mentor>Har kuni ertalab deyarli bir xil ishni qilasiz: uyg'onasiz, yuvinasiz, kiyinasiz... O'ylab ko'rsangiz, bu ham <b style={{ color: T.ink }}>algoritm</b> — maqsadga olib boradigan aniq, <b style={{ color: T.ink }}>ketma-ket qadamlar</b>, xuddi ovqat retsepti kabi. Tugmani bosib, qadamlarni kuzating.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!isNarrow ? (
          <div className="pz-flow" style={{ justifyContent: 'center' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`pz-step ${step > i ? 'on' : ''} ${running && step === i + 1 ? 'active' : ''}`} style={{ minWidth: 92 }}>
                  <span style={{ fontSize: 26 }}>{step > i ? s.ic : '○'}</span>
                  <span className="pz-lbl"><b style={{ color: step > i ? T.ink : T.ink2 }}>{s.h}</b></span>
                </div>
                {i < STEPS.length - 1 && <span className={`pz-arrow ${step > i + 1 ? 'on' : ''}`}>→</span>}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="pz-flow-v">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`pz-rowstep ${step > i ? 'on' : ''} ${running && step === i + 1 ? 'active' : ''}`}>
                  <span className="pz-rowic">{step > i ? s.ic : '○'}</span>
                  <span className="pz-rowtxt"><b>{i + 1}. {s.h}</b></span>
                  {step > i && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 15 }}>✓</span>}
                </div>
                {i < STEPS.length - 1 && <span className={`pz-varrow ${step > i + 1 ? 'on' : ''}`}>↓</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Bajarilmoqda…' : (done ? '↻ Yana ko\'rsatish' : '▶ Boshlash')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mana shu — <b>algoritm</b>: aniq qadamlar, aniq <b>tartibda</b>. Kompyuterga ham xuddi shunday aniq qadamlar beramiz.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — KETMA-KETLIK MUHIM =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Retsept qadamlarining o'rnini almashtirib ko'ring-chi — tuxumni pishirishdan oldin yorasizmi yoki keyin? Algoritmda ham xuddi shunday: bitta qadam o'rnini o'zgartirsa, natija kulgili bo'lib qoladi. Ikki tugmani bosib solishtiring.`, trigger: 'on_mount', waits_for: null }]);
  const [order, setOrder] = useState('correct');
  const [seen, setSeen] = useState(new Set(['correct']));
  const done = seen.has('mixed');
  const set = (o) => { setOrder(o); setSeen(prev => { const n = new Set(prev); n.add(o); return n; }); };
  const CORRECT = [{ ic: '👕', h: 'Kiyinish' }, { ic: '🏫', h: 'Ko\'chaga chiqish' }];
  const MIXED = [{ ic: '🏫', h: 'Ko\'chaga chiqish' }, { ic: '👕', h: 'Kiyinish' }];
  const list = order === 'correct' ? CORRECT : MIXED;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ketma-ketlik" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Aralash tartibni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qadamlar <span className="italic" style={{ color: T.accent }}>tartibi</span> muhimmi?</h2></div>
        <Mentor>Retsept qadamlarining o'rnini almashtirib ko'ring-chi — tuxumni pishirishdan <b style={{ color: T.ink }}>oldin</b> yorasizmi yoki <b style={{ color: T.ink }}>keyin</b>? Algoritmda ham shunday: bitta qadam o'rnini o'zgartirsa, natija <b style={{ color: T.ink }}>kulgili</b> bo'lib qoladi. Ikki tugmani bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${order === 'correct' ? 'chip-on' : ''}`} onClick={() => set('correct')}>✅ To'g'ri tartib</button>
              <button className={`chip ${order === 'mixed' ? 'chip-on' : ''}`} onClick={() => set('mixed')}>🔀 Aralash</button>
            </div>
            <div className="demo-swap" key={order} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((s, i) => (
                <div key={i} className="el-in" style={{ animationDelay: `${i * 0.12}s`, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, background: T.paper, boxShadow: `0 6px 16px -6px rgba(${T.shadowBase},0.14)` }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: T.accent }}>{i + 1}</span>
                  <span style={{ fontSize: 22 }}>{s.ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink }}>{s.h}</span>
                </div>
              ))}
              <div className="seq-result" style={{ background: order === 'correct' ? T.successSoft : T.accentSoft, color: order === 'correct' ? T.success : T.accent }}>
                <span style={{ fontSize: 26 }}>{order === 'correct' ? '🙂' : '🙈'}</span>
                <span>{order === 'correct' ? 'Tartibli — hammasi joyida' : "Pijamada ko'chada qoldingiz!"}</span>
              </div>
            </div>
          </Col>
          <Col>
            {order === 'correct' ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Mantiqiy</p><p className="body" style={{ margin: 0, color: T.ink }}>Avval kiyinasiz, keyin ko'chaga chiqasiz. To'g'ri natija!</p></div>
            ) : (
              <div className="frame-warn fade-step"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>😄 Kulgili xato</p><p className="body" style={{ margin: 0, color: T.ink }}>Avval ko'chaga chiqib, keyin kiyinish? Pijamada ko'chada qolasiz! <b>Tartib o'zgardi — natija buzildi.</b></p></div>
            )}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun algoritmda <b>ketma-ketlik</b> — birinchi qoida. Kompyuter qadamlarni aynan yozgan tartibingizda bajaradi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — SHARTLAR =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Har doim bir xil ish qilmaysiz-ku: tashqarida yomg'ir bo'lsa soyabon olasiz, bo'lmasa — olmaysiz. Algoritm ham xuddi shunday o'ylaydi: agar bo'lsa, buni qil; aks holda, buni qil. Bunga shart deyiladi. Ob-havoni almashtirib, qarorni kuzating.`, trigger: 'on_mount', waits_for: null }]);
  const [weather, setWeather] = useState('sun');
  const [seen, setSeen] = useState(new Set(['sun']));
  const rain = weather === 'rain';
  const done = seen.size >= 2;
  const toggle = () => { const w = rain ? 'sun' : 'rain'; setWeather(w); setSeen(prev => { const n = new Set(prev); n.add(w); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Shartlar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ob-havoni almashtiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Algoritm <span className="italic" style={{ color: T.accent }}>qaror</span> qabul qila oladimi?</h2></div>
        <Mentor>Har doim bir xil ish qilmaysiz-ku: tashqarida yomg'ir bo'lsa soyabon olasiz, bo'lmasa — olmaysiz. Algoritm ham shunday o'ylaydi: <b style={{ color: T.ink }}>AGAR</b> yomg'ir bo'lsa — soyabon ol, <b style={{ color: T.ink }}>AKS HOLDA</b> — soyabonsiz chiq. Bunga <b style={{ color: T.ink }}>shart</b> deyiladi. Ob-havoni almashtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Tashqarida hozir:</p>
            <button onClick={toggle} className="weather-btn fade-up delay-1" style={{ cursor: 'pointer', border: 'none', borderRadius: 16, padding: '24px', background: rain ? '#dce6ef' : '#fff4d6', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.16)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.3s', width: '100%' }}>
              {rain
                ? <span className="wx-fx">{[8, 26, 44, 62, 80, 92].map((l, i) => (<i key={i} style={{ left: `${l}%`, animationDelay: `${i * 0.13}s` }} />))}</span>
                : <span className="sun-fx" />}
              <span style={{ fontSize: 48, position: 'relative', zIndex: 1 }}>{rain ? '🌧️' : '☀️'}</span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, color: T.ink, position: 'relative', zIndex: 1 }}>{rain ? 'Yomg\'ir yog\'yapti' : 'Quyoshli'}</span>
              <span className="mono small" style={{ color: T.ink3, position: 'relative', zIndex: 1 }}>↻ almashtirish uchun bosing</span>
            </button>
          </Col>
          <Col>
            <p className="flow-label">Algoritmning qarori</p>
            <div className="cond-card fade-up delay-1">
              <div className={`cond-line ${rain ? 'on' : ''}`}><span className="cond-kw">AGAR</span> yomg'ir 🌧️ <span className="cond-kw">BO'LSA</span> → <b>soyabon ol ☂️</b></div>
              <div className={`cond-line ${!rain ? 'on' : ''}`}><span className="cond-kw">AKS HOLDA</span> ☀️ → <b>soyabonsiz chiq</b></div>
            </div>
            <div className="cond-result" key={`r${weather}`} style={{ color: rain ? T.blue : T.accent }}><span style={{ fontSize: 20 }}>{rain ? '☂️' : '🚶'}</span>{rain ? 'Soyabon olindi' : 'Soyabonsiz chiqildi'}</div>
            <div className="frame-success fade-step" key={weather}><p className="body" style={{ margin: 0, color: T.ink }}>Hozir {rain ? '🌧️ yomg\'irli' : '☀️ quyoshli'} — algoritm <b>{rain ? 'soyabon olishni' : 'soyabonsiz chiqishni'}</b> tanladi.</p></div>
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta algoritm — vaziyatga qarab ikki xil ishladi. Mana <b>shart</b>ning kuchi!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (shart) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Agar yomg'ir bo'lsa, soyabon ol — algoritmda bu qanday qism?"
    questionText="'AGAR yomg'ir bo'lsa, soyabon ol' — algoritmda bu qanday qism?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>«AGAR yomg'ir bo'lsa, soyabon ol» — bu qanday qism?</h2></>}
    options={['Sikl (takrorlash)', 'Shart (agar...bo\'lsa)', 'Komponent', 'Bog\'lanish']} correctIdx={1}
    explainCorrect="To'g'ri! Bu — shart: algoritm vaziyatga qarab («agar...bo'lsa») qaror qabul qiladi."
    explainWrong={{
      0: 'Yo’q — sikl bu amalni takrorlash. Bu yerda esa qaror qabul qilinyapti — bu shart.',
      2: 'Yo’q — komponent sistemaning qismi. Bu esa algoritmdagi qaror — shart.',
      3: 'Yo’q — bog’lanish qismlarni ulaydi. Bu esa shart: agar...bo’lsa.',
      default: 'Bu — shart: agar...bo’lsa...'
    }} />
);

// ===== SCREEN 10 — SIKLLAR =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Sport mashg'ulotini eslang: murabbiy "o'tirib-tur, o'n marta!" deydi. U buni o'n marta takrorlab aytmaydi-ku — bir marta aytadi, son bilan. Kodda ham aynan shunday: bir marta yozasiz, "o'n marta takrorla" deysiz. Bunga sikl deyiladi. Tugmani bosing.`, trigger: 'on_mount', waits_for: { type: 'loop_done' } }]);
  const TOTAL = 10;
  const [count, setCount] = useState(storedAnswer ? TOTAL : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = count >= TOTAL;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setCount(0); setRunning(true);
    const tick = (i) => { setCount(i); if (i < TOTAL) timer.current = setTimeout(() => tick(i + 1), 280); else { setRunning(false); audio.triggerEvent('loop_done'); } };
    timer.current = setTimeout(() => tick(1), 300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sikllar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Siklni ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir ishni <span className="italic" style={{ color: T.accent }}>takror-takror</span> — qanday qilamiz?</h2></div>
        <Mentor>Sport mashg'ulotini eslang: murabbiy "o'tirib-tur, 10 marta!" deydi. U buni 10 marta takrorlab aytmaydi-ku — bir marta aytadi, son bilan. Kodda ham shunday: bir marta yozasiz, <b style={{ color: T.ink }}>"10 marta takrorla"</b> deysiz. Bunga <b style={{ color: T.ink }}>sikl</b> deyiladi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="loop-card fade-up delay-1">
              <p className="loop-kw"><span className="cond-kw">TAKRORLA 10 marta:</span></p>
              <div className="squat-stage" key={count}>
                <span className="squat-fig">🏋️</span>
                <span className="loop-spin">🔁</span>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink }}>o'tirib-tur</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(40px,8vw,60px)', color: count > 0 ? T.accent : T.ink3, lineHeight: 1 }}>{count}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T.ink3, fontSize: 18 }}>/ {TOTAL} marta</span>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                {Array.from({ length: TOTAL }).map((_, i) => (<span key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: i < count ? T.accent : T.ink3 + '33', transform: i === count - 1 && running ? 'scale(1.45)' : 'scale(1)', boxShadow: i === count - 1 && running ? '0 0 10px rgba(255,79,40,0.6)' : 'none', transition: 'all 0.2s' }} />))}
              </div>
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Bajarilmoqda…' : (done ? '↻ Yana' : '▶ Siklni boshlash')}</button>
          </Col>
          <Col>
            <div className="frame fade-up delay-2">
              <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px' }}>Sikl nimaga kerak?</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Tasavvur qiling — 100 marta takrorlash kerak. Sikl bo'lmasa, 100 qator yozardingiz! Sikl bilan — <b>bitta qoida, 100 marta bajariladi.</b></p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>Sikl</b> — bir amalni belgilangan marta (yoki shart bajarilguncha) takrorlaydi. Dasturchining eng kuchli vositasi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — ALGORITMNING 3 G'ISHTI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Mana eng qiziq haqiqat — va u juda oddiy: butun dunyodagi har bir dastur — o'yinmi, ilovami, sayt-mi — atigi uchta asosiy qismdan quriladi: ketma-ketlik, shart va sikl. Siz ularning uchalasini ham ko'rib bo'ldingiz! Har birini bosib, yodga oling.`, trigger: 'on_mount', waits_for: null }]);
  const BRICKS = {
    seq: { ic: '📋', name: 'Ketma-ketlik', ex: 'Qadamlar aniq tartibda: uyg\'on → yuvin → kiyin.' },
    cond: { ic: '🔀', name: 'Shart', ex: 'Vaziyatga qarab qaror: agar yomg\'ir bo\'lsa — soyabon ol.' },
    loop: { ic: '🔁', name: 'Sikl', ex: 'Takrorlash: o\'tirib-turishni 10 marta bajar.' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Algoritm asoslari" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 eslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Algoritm <span className="italic" style={{ color: T.accent }}>nimalardan</span> quriladi?</h2></div>
        <Mentor>Mana eng qiziq haqiqat — va u juda oddiy: butun dunyodagi <b style={{ color: T.ink }}>har bir dastur</b> — o'yinmi, ilovami — atigi uchta asosiy qismdan quriladi: <b style={{ color: T.ink }}>ketma-ketlik</b>, <b style={{ color: T.ink }}>shart</b> va <b style={{ color: T.ink }}>sikl</b>. Siz uchalasini ham ko'rib bo'ldingiz! Har birini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.keys(BRICKS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 14, padding: '15px 16px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span style={{ fontSize: 28 }}>{BRICKS[k].ic}</span>
                  <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 18, color: T.ink }}>{BRICKS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 15 }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ fontSize: 26 }}>{BRICKS[active].ic}</span><span className="sk-wordbadge">{BRICKS[active].name}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{BRICKS[active].ex}</p>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qismni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mana shu uchtasi — barcha dasturlarning poydevori. Hatto eng katta o'yinlar ham shulardan tuzilgan!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (sikl) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Bir xil amalni ko'p marta takrorlash uchun algoritmda nima ishlatamiz?"
    questionText="Bir xil amalni ko'p marta takrorlash uchun algoritmda nima ishlatamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bir xil amalni ko'p marta takrorlash uchun nima ishlatamiz?</h2></>}
    options={['Shart', 'Sikl (takrorlash)', 'Komponent', 'Bog\'lanish']} correctIdx={1}
    explainCorrect="To'g'ri! Sikl bir amalni belgilangan marta takrorlaydi — uni qayta-qayta yozish shart emas."
    explainWrong={{
      0: 'Yo’q — shart qaror qabul qiladi (agar...bo’lsa). Takrorlash uchun esa sikl kerak.',
      2: 'Yo’q — komponent sistemaning qismi. Takrorlash — sikl ishi.',
      3: 'Yo’q — bog’lanish qismlarni ulaydi. Takrorlash uchun sikl ishlatamiz.',
      default: 'Takrorlash uchun — sikl.'
    }} />
);

// ===== SCREEN 13 — AMALIYOT: ALGORITM YIG'ISH =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Endi navbat sizga. Quyidagi bloklardan o'z ertalabki algoritmingizni yig'ing — qadam, shart va siklni qo'shing. Haqiqiy dasturchi ham xuddi shunday, bo'laklardan yaxlit narsa quradi. Kamida 3 ta blok qo'shing.`, trigger: 'on_mount', waits_for: null }]);
  const BLOCKS = [
    { ic: '🛏️', label: 'Uyg\'onish', type: 'qadam' },
    { ic: '🚿', label: 'Yuvinish', type: 'qadam' },
    { ic: '👕', label: 'Kiyinish', type: 'qadam' },
    { ic: '🍳', label: 'Nonushta', type: 'qadam' },
    { ic: '🔀', label: 'Agar yomg\'ir → soyabon ol', type: 'shart' },
    { ic: '🔁', label: 'O\'tirib-tur × 10 marta', type: 'sikl' }
  ];
  const TYPE_COLOR = { qadam: T.ink2, shart: T.blue, sikl: T.accent };
  const MAX = 6;
  const [items, setItems] = useState([]);
  const done = items.length >= 3;
  const add = (b) => { if (items.length >= MAX) return; setItems(prev => [...prev, b]); };
  const reset = () => setItems([]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · algoritm yig'ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 3 blok (${items.length}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z algoritmingizni <span className="italic" style={{ color: T.accent }}>quring</span></h2></div>
        <Mentor>Endi navbat sizga. Quyidagi bloklardan o'z algoritmingizni yig'ing — <b style={{ color: T.ink }}>qadam</b>, <b style={{ color: T.blue }}>shart</b> va <b style={{ color: T.accent }}>sikl</b>ni qo'shing. Haqiqiy dasturchi ham bo'laklardan yaxlit narsa quradi. Kamida 3 ta blok qo'shing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Bloklar — bosib qo'shing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BLOCKS.map((b, i) => (
                <button key={i} className="gchip" disabled={items.length >= MAX} onClick={() => add(b)}>
                  <span style={{ fontSize: 15 }}>{b.ic}</span> {b.label}
                </button>
              ))}
              {items.length > 0 && <button className="gchip" onClick={reset}>↺ Tozalash</button>}
            </div>
            <p className="body fade-up delay-2" style={{ margin: '2px 0 0', color: T.ink3, fontSize: 13 }}><b style={{ color: T.ink2 }}>Maslahat:</b> kuchli algoritm — qadam + shart + sikl birga.</p>
          </Col>
          <Col>
            <p className="flow-label">Mening algoritmim</p>
            <div className="algo-build fade-up delay-1">
              {items.length === 0 ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>// bloklarni qo'shing…</p>
              ) : items.map((b, i) => (
                <div key={i} className="algo-line el-in" style={{ borderLeft: `3px solid ${TYPE_COLOR[b.type]}` }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T.ink3, fontSize: 12, minWidth: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 16 }}>{b.ic}</span>
                  <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 14, color: T.ink }}>{b.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: TYPE_COLOR[b.type], textTransform: 'uppercase' }}>{b.type}</span>
                </div>
              ))}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Siz <b>algoritm</b> tuzdingiz — aynan shunday fikrlash dasturchini dasturchi qiladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (noto'g'ri tartib) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `AI sizga algoritm yozib berdi, lekin biror joyda adashibdi — qadamlar chalkashib ketibdi. Dasturchining eng muhim mahorati shu: xatoni topish. Diqqat bilan o'qing — qaysi ish noto'g'ri joyda turibdi? Topib, o'sha qatorni bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'go' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'go';
  const done = fixed;
  const pickGo = () => { if (found) return; setPicked('go'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! "Maktabga chiqish" birinchi bo'lib qolgan — kiyinishdan oldin. Endi tartibni to'g'rilaymiz.`); }, 300); };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi tartib to'g'ri: kiyin, nonushta qil, keyin maktabga.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const WRONG = [{ id: 'go', ic: '🏫', t: 'Maktabga chiqish' }, { id: 'dress', ic: '👕', t: 'Kiyinish' }, { id: 'eat', ic: '🍳', t: 'Nonushta' }];
  const RIGHT = [{ ic: '👕', t: 'Kiyinish' }, { ic: '🍳', t: 'Nonushta' }, { ic: '🏫', t: 'Maktabga chiqish' }];
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Algoritmda <span className="italic" style={{ color: T.accent }}>xato</span> bor — toping</h2></div>
        <Mentor>AI sizga algoritm yozib berdi, lekin biror joyda <b style={{ color: T.ink }}>adashibdi</b> — qadamlar chalkashib ketibdi. Dasturchining eng muhim mahorati — xatoni topish. Qaysi qadam noto'g'ri joyda turibdi? O'sha qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Ertalabki tartibingiz tayyor:</span></div>
              <div className="ai-code">
                {!fixed ? WRONG.map((s, i) => (
                  <div key={s.id} className={`ai-line ${found && s.id === 'go' ? 'bad' : (picked === s.id && !found ? 'ok' : '')}`} onClick={() => { if (found) return; if (s.id === 'go') pickGo(); else setPicked(s.id); }}>
                    <span style={{ color: CODE.comment }}>{i + 1}.</span> {s.ic} {s.t} {s.id === 'go' && <span style={{ color: CODE.comment }}>← birinchi?</span>}
                  </div>
                )) : RIGHT.map((s, i) => (
                  <div key={i} className="ai-line ok"><span style={{ color: CODE.comment }}>{i + 1}.</span> {s.ic} {s.t}</div>
                ))}
              </div>
              {!found && <p className="ai-prompt">Qaysi qadam noto'g'ri joyda? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 Tartibni to'g'rilash</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tartib to'g'rilandi!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              picked && picked !== 'go'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qadam o'rnida — yaxshi. Lekin yana qarang: qaysi ish boshqalardan <b>oldin</b> bo'lib qolgan, vaholanki u oxirida bo'lishi kerak?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Mantiqan o'ylang: maktabga chiqishdan <b>oldin</b> nima qilish kerak? Tartibni tekshiring.</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>«Maktabga chiqish» birinchi bo'lib qolgan — kiyinish va nonushtadan oldin! Chap tugmani bosib to'g'rilang →</p></div>)}
            {fixed && (<>
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">Algoritmda tartib — eng ko'p xato chiqadigan joy</p></div>
            </>)}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (tartibga solish) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Mana, oxirgi sinov. Endi hammasini o'zingiz qiling: ertalabki tartibni to'g'ri ketma-ketlikda tuzing. Yaxshilab o'ylang — eng avval nimadan boshlanadi?`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const STEPS = { wake: { ic: '🛏️', t: 'Uyg\'onish' }, wash: { ic: '🚿', t: 'Yuvinish' }, dress: { ic: '👕', t: 'Kiyinish' }, eat: { ic: '🍳', t: 'Nonushta' } };
  const CORRECT = ['wake', 'wash', 'dress', 'eat'];
  const SHUFFLED = ['dress', 'eat', 'wake', 'wash'];
  const [picked, setPicked] = useState(storedAnswer?.picked || []);
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [failed, setFailed] = useState(false);
  const tap = (id) => {
    if (passed || picked.includes(id)) return;
    const np = [...picked, id];
    setPicked(np);
    if (np.length === CORRECT.length) {
      const ok = np.every((x, i) => x === CORRECT[i]);
      if (ok) { setPassed(true); onAnswer(screen, { correct: true, picked: np }); audio.triggerEvent('typed_ok'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! Ketma-ketlik to'liq to'g'ri.`); }, 300); }
      else setFailed(true);
    }
  };
  const reset = () => { setPicked([]); setFailed(false); };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Tartibni tuzing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>tartibni</span> o'zingiz tuzing.</h2></div>
        <Mentor>Mana, oxirgi sinov. Endi hammasini o'zingiz qiling: ertalabki tartibni <b style={{ color: T.ink }}>to'g'ri ketma-ketlikda</b> tuzing. Yaxshilab o'ylang — eng avval nimadan boshlanadi?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qadamlar — to'g'ri tartibda bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {SHUFFLED.map(id => {
                const used = picked.includes(id);
                return (
                  <button key={id} onClick={() => tap(id)} disabled={used || passed} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: used || passed ? 'default' : 'pointer', border: 'none', borderRadius: 12, padding: '12px 15px', background: used ? T.bg : T.paper, opacity: used ? 0.4 : 1, boxShadow: used ? 'none' : `0 6px 16px -6px rgba(${T.shadowBase},0.16)`, fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, color: T.ink, transition: 'all 0.18s' }}>
                    <span style={{ fontSize: 18 }}>{STEPS[id].ic}</span> {STEPS[id].t}
                  </button>
                );
              })}
            </div>
            {!passed && picked.length > 0 && <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={reset}>↺ Qaytadan</button>}
          </Col>
          <Col>
            <p className="flow-label">Sizning algoritmingiz</p>
            <div className="algo-build" style={{ minHeight: 120 }}>
              {picked.length === 0 ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>// qadamlarni tartib bilan tanlang…</p>
              ) : picked.map((id, i) => (
                <div key={i} className="algo-line el-in" style={{ borderLeft: `3px solid ${passed ? T.success : T.accent}` }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T.ink3, fontSize: 12, minWidth: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 16 }}>{STEPS[id].ic}</span>
                  <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 14, color: T.ink }}>{STEPS[id].t}</span>
                </div>
              ))}
            </div>
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ To'g'ri! Uyg'on → yuvin → kiyin → nonushta. Mukammal ketma-ketlik!</p></div>}
            {failed && !passed && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartib biroz aralashdi. «Qaytadan» bosib, qaytadan urinib ko'ring — avval nimadan boshlaysiz?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz — bugun siz dasturchining tilida fikrlay boshladingiz! Esda saqlang: sistema — bu qismlar va ularning bog'lanishlari, algoritm esa retsept: ketma-ketlik, shart va sikl. Keyingi darsda eng qizig'i boshlanadi — shu algoritmlarni kompyuterga JavaScript tilida yozamiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['Sistema — komponentlar va bog\'lanishlar', 'Atrofdagi sistemalar (tana, jamoa, sayt)', 'Algoritm = retsept (aniq qadamlar)', 'Ketma-ketlik — tartib muhim', 'Shart (agar...bo\'lsa) va Sikl (takrorla)'];
  const HOMEWORK = [{ b: 'Sistema top', t: '— atrofingizdan 1 sistema toping, qismlarini yozing' }, { b: 'Algoritm yoz', t: '— maktabga tayyorgarlikni qadam-baqadam yozing' }, { b: 'Shart qo\'sh', t: '— "agar... bo\'lsa..." qadamini qo\'shing' }];
  const GLOSSARY = [{ b: 'Sistema', t: '— birga ishlaydigan qismlar' }, { b: 'Komponent', t: '— sistemaning bir qismi' }, { b: 'Bog\'lanish', t: '— qismlarni ulaydigan yo\'l' }, { b: 'Algoritm', t: '— aniq qadamlar (retsept)' }, { b: 'Ketma-ketlik', t: '— qadamlar tartibi' }, { b: 'Shart', t: '— agar...bo\'lsa...' }, { b: 'Sikl', t: '— takrorlash' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi <span className="italic" style={{ color: T.accent }}>dasturchidek</span> fikrlaysiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Sistema va algoritmni tushundingiz — JavaScript yozishga tayyorsiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Atrofingizdagi hayotni algoritm qilib yozing:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda shu algoritmlarni kompyuterga JavaScript tilida yozishni boshlaymiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function JsIntroLesson({ lang: langProp, onFinished }) {
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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes dl-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }

        /* === OPTIMALLASHTIRISH (2026) — yangi animatsiyalar === */
        /* p1: yurak urishi / tezlik indikatori */
        .bpm-row { display: flex; align-items: center; gap: 12px; background: ${T.bg}; border-radius: 12px; padding: 10px 14px; margin-bottom: 12px; }
        .bpm-heart { font-size: 24px; display: inline-block; animation: heart-beat 1s ease-in-out infinite; }
        @keyframes heart-beat { 0%,100% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.18); } 56% { transform: scale(1); } }
        .bpm-info { display: flex; flex-direction: column; line-height: 1.05; }
        .bpm-num { font-family: 'Fraunces', serif; font-size: 26px; transition: color 0.3s; }
        .bpm-unit { font-family: 'JetBrains Mono'; font-size: 9px; color: ${T.ink3}; text-transform: uppercase; letter-spacing: 0.07em; }
        .eq { display: flex; align-items: flex-end; gap: 3px; height: 26px; margin-left: auto; }
        .eq-bar { width: 5px; height: 100%; background: ${T.accent}; border-radius: 2px; transform-origin: bottom; animation: eq-bounce 1s ease-in-out infinite; }
        @keyframes eq-bounce { 0%,100% { transform: scaleY(0.28); } 50% { transform: scaleY(1); } }
        /* p2: g'oya emoji badge */
        .idea-ic { width: 54px; height: 54px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; font-size: 30px; flex-shrink: 0; animation: idea-float 3.2s ease-in-out infinite; }
        .idea-ic-sys { background: ${T.accentSoft}; }
        .idea-ic-algo { background: ${T.blueSoft}; animation-delay: 0.8s; }
        @keyframes idea-float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-5px) rotate(-4deg); } }
        /* p6: bog'lanish pulsi */
        .lnk-pulse { display: inline-block; animation: lnk-pulse 1.3s ease-in-out infinite; }
        @keyframes lnk-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.22); } }
        /* p7: ketma-ketlik natija */
        .seq-result { display: flex; align-items: center; gap: 10px; margin-top: 4px; padding: 10px 13px; border-radius: 12px; font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; animation: fade-step 0.35s ease-out; }
        /* p8: ob-havo effektlari */
        .weather-btn { position: relative; overflow: hidden; }
        .wx-fx { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .wx-fx i { position: absolute; top: -14%; width: 2px; height: 15px; background: rgba(1,154,203,0.6); border-radius: 2px; animation: rain-fall 0.85s linear infinite; }
        @keyframes rain-fall { to { transform: translateY(170px); opacity: 0.2; } }
        .sun-fx { position: absolute; top: 14px; left: 50%; width: 96px; height: 96px; transform: translateX(-50%); background: radial-gradient(circle, rgba(255,184,0,0.5), transparent 68%); border-radius: 50%; animation: sun-glow 2.6s ease-in-out infinite; pointer-events: none; z-index: 0; }
        @keyframes sun-glow { 0%,100% { transform: translateX(-50%) scale(0.82); opacity: 0.55; } 50% { transform: translateX(-50%) scale(1.16); opacity: 1; } }
        .cond-result { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; margin-top: 4px; padding: 9px 14px; border-radius: 99px; font-family: 'Manrope'; font-weight: 700; font-size: 14px; background: ${T.paper}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.22); animation: veh-pop 0.4s cubic-bezier(.34,1.4,.5,1); }
        @keyframes veh-pop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        /* p12: sikl — squat figurasi */
        .squat-stage { display: flex; align-items: center; gap: 16px; margin: 4px 0 2px; }
        .squat-fig { font-size: 40px; display: inline-block; animation: squat 0.42s ease-out; }
        @keyframes squat { 0% { transform: translateY(0) scaleY(1); } 42% { transform: translateY(11px) scaleY(0.8); } 100% { transform: translateY(0) scaleY(1); } }
        .loop-spin { font-size: 22px; display: inline-block; animation: loop-rot 0.55s ease-in-out; }
        @keyframes loop-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

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
