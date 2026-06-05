import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// УРОК nat_5_05 v1 — Деление столбиком, деление с остатком, 5 класс. Палитра эталонная.
// Сюжет: раздача/раскладка поровну. Hook — Зайнаб (остаток больше делителя).
// Деление столбиком + ноль в частном (s0-s5) → деление с остатком (s6-s9) →
//   кейс/финал (s10-s13) → итог (s14). Инфраструктура — visual v15 (как nat_5_03).
// НОВОЕ (infra_v2): DivBoard (уголок + чипы по шагам), DivSolutionPlayer
//   (анимированный разбор), ShareBoard (раздача по кругу), NumInputRemainder
//   (частное + остаток). Recovery — анимированный разбор (решение методиста).
// Числа: визуал — цифрами, аудио — словами. UZ — DRAFT, нужна валидация.
const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', shadowBase: '58, 53, 48'
};

const LangContext = createContext('ru');
const useLang = () => useContext(LangContext);

const useT = () => {
  const lang = useLang();
  return useCallback((node) => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (React.isValidElement(node)) return node;
    if (node[lang] !== undefined) return node[lang];
    return node.ru ?? '';
  }, [lang]);
};

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
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
    this.voicesByLang = { ru: null, uz: null }; this.voicesReady = false;
    this.currentLang = 'ru'; this.initVoices();
  }
  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      this.voicesByLang.ru = voices.find(v => v.lang.startsWith('ru')) || voices[0];
      this.voicesByLang.uz = voices.find(v => v.lang.startsWith('uz')) || voices.find(v => v.lang.startsWith('ru')) || voices[0];
      this.voicesReady = true;
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  setLang(lang) { this.currentLang = lang; }
  getCurrentVoice() {
    if (!this.voicesReady && typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesByLang.ru = voices.find(v => v.lang.startsWith('ru')) || voices[0];
        this.voicesByLang.uz = voices.find(v => v.lang.startsWith('uz')) || voices.find(v => v.lang.startsWith('ru')) || voices[0];
        this.voicesReady = true;
      }
    }
    return this.voicesByLang[this.currentLang] || this.voicesByLang.ru || null;
  }
  hasRealUzVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    return window.speechSynthesis.getVoices().some(v => v.lang.startsWith('uz'));
  }
  loadQueue(segments) { this.stop(); this.queue = segments; this.currentIdx = 0; this.waitingFor = null; }
  playSegment(segment) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(segment.text);
    const useRealUz = this.currentLang === 'uz' && this.hasRealUzVoice();
    utterance.lang = useRealUz ? 'uz-UZ' : 'ru-RU';
    utterance.rate = 0.95; utterance.pitch = 1.0;
    const voice = this.getCurrentVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { this.isPlaying = true; if (this.onStateChange) this.onStateChange({ isPlaying: true, currentSegment: segment.id }); };
    utterance.onend = () => { this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); this.handleSegmentEnd(segment); };
    utterance.onerror = () => { this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); };
    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }
  handleSegmentEnd(segment) {
    if (segment.waits_for) { this.waitingFor = segment.waits_for; if (this.onStateChange) this.onStateChange({ isPlaying: false, waitingFor: segment.waits_for }); }
    else { this.currentIdx++; this.playNext(); }
  }
  playNext() { if (this.currentIdx >= this.queue.length) return; this.playSegment(this.queue[this.currentIdx]); }
  start() { this.currentIdx = 0; this.waitingFor = null; this.playNext(); }
  triggerEvent(eventType, target) {
    if (!this.waitingFor) return;
    const matches = this.waitingFor.type === eventType && (this.waitingFor.target === target || !this.waitingFor.target);
    if (matches) { this.waitingFor = null; this.currentIdx++; this.playNext(); }
  }
  triggerInternalEvent(eventName) {
    const nextIdx = this.queue.findIndex((s, i) => i >= this.currentIdx && s.trigger === `on_event:${eventName}`);
    if (nextIdx !== -1) { this.currentIdx = nextIdx; this.waitingFor = null; this.playNext(); }
  }
  pushOneOff(text) {
    if (!text) return;
    this.queue.push({ id: `oneoff_${Date.now()}`, text, trigger: 'manual', waits_for: null });
    this.currentIdx = this.queue.length - 1; this.playNext();
  }
  replay() { if (this.currentIdx > 0) this.currentIdx--; this.waitingFor = null; this.playNext(); }
  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    this.isPlaying = false; this.currentUtterance = null;
    if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null });
  }
}

let audioEngineInstance = null;
const getAudioEngine = () => {
  if (typeof window === 'undefined') return null;
  if (!audioEngineInstance) audioEngineInstance = new AudioEngine();
  return audioEngineInstance;
};

function useAudio(segments) {
  const lang = useLang();
  const [state, setState] = useState({ isPlaying: false, currentSegment: null, waitingFor: null, muted: false });
  const engineRef = useRef(null);
  const segmentsRef = useRef(segments);
  const segmentsKey = segments ? JSON.stringify(segments) : '';
  const prevKeyRef = useRef(segmentsKey);
  if (prevKeyRef.current !== segmentsKey) { segmentsRef.current = segments; prevKeyRef.current = segmentsKey; }
  const stableSegments = segmentsRef.current;
  useEffect(() => {
    const engine = getAudioEngine();
    if (!engine) return;
    engineRef.current = engine;
    engine.setLang(lang);
    engine.onStateChange = (s) => setState(prev => ({ ...prev, ...s }));
    if (stableSegments && stableSegments.length > 0 && !state.muted) {
      engine.loadQueue(stableSegments);
      const timer = setTimeout(() => engine.start(), 300);
      return () => { clearTimeout(timer); engine.stop(); };
    }
    return () => engine.stop();
  // eslint-disable-next-line
  }, [stableSegments, lang]);
  const triggerEvent = useCallback((type, target) => { if (engineRef.current) engineRef.current.triggerEvent(type, target); }, []);
  const triggerInternal = useCallback((eventName) => { if (engineRef.current) engineRef.current.triggerInternalEvent(eventName); }, []);
  const replay = useCallback(() => { if (engineRef.current) engineRef.current.replay(); }, []);
  const toggleMute = useCallback(() => {
    setState(prev => { const newMuted = !prev.muted; if (newMuted && engineRef.current) engineRef.current.stop(); return { ...prev, muted: newMuted }; });
  }, []);
  return { ...state, triggerEvent, triggerInternal, replay, toggleMute };
}

const MONO = { fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(20px, 4.4vw, 30px)', lineHeight: 1.5 };

const AudioIndicator = ({ audioState }) => {
  const { isPlaying, muted, replay, toggleMute } = audioState;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={toggleMute} title={muted ? 'Sound on' : 'Sound off'}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: muted ? T.ink3 : (isPlaying ? T.accent : T.ink2) }}>
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>
      {!muted && (
        <button onClick={replay} title="Replay"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: T.ink2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
      )}
    </div>
  );
};

const FeedbackBlock = ({ show, isCorrect, children }) => {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => { if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 350);
      }));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [show]);
  if (!mounted) return null;
  return (
    <div ref={ref} className={`feedback-block ${visible ? 'visible' : ''}`}>
      <div className={isCorrect ? 'frame-success' : 'frame-soft'}>{children}</div>
    </div>
  );
};

const Stage = ({ children, eyebrow, screen, totalScreens, navContent, audioState }) => {
  const t = useT();
  const isMobile = useIsMobile();
  const padH = isMobile ? 12 : 100;
  return (
    <div className="stage">
      <div className="stage-header" style={{ paddingLeft: padH, paddingRight: padH }}>
        <div className="progress-track"><div className="progress-bar" style={{ width: `${((screen + 1) / totalScreens) * 100}%` }}/></div>
        <div className="chrome">
          <div className="chrome-left eyebrow"><span className="dot"/><span>{t(eyebrow)}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {audioState && <AudioIndicator audioState={audioState}/>}
            <div className="mono small" style={{ color: T.ink3 }}>{String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}</div>
          </div>
        </div>
      </div>
      <div className="stage-content" style={{ paddingLeft: padH, paddingRight: padH }}>{children}</div>
      {navContent && <div className="stage-nav" style={{ paddingLeft: padH, paddingRight: padH }}>{navContent}</div>}
    </div>
  );
};

const NavBack = ({ onPrev, label = 'Назад' }) => (
  <button className="btn-ghost" onClick={onPrev} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(15px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{label}</button>
);
const NavNext = ({ disabled, label, onClick }) => (
  <button className="btn-white-accent" disabled={disabled} onClick={onClick} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)', marginLeft: 'auto' }}>{label}</button>
);
const NextLabel = () => { const lang = useLang(); return lang === 'uz' ? 'Davom etish' : 'Дальше'; };
const BackLabel = () => { const lang = useLang(); return lang === 'uz' ? 'Orqaga' : 'Назад'; };
const CheckLabel = () => { const lang = useLang(); return lang === 'uz' ? 'Tekshirish' : 'Проверить'; };

const ArrowLeft = ({ color }) => (
  <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 7H3"/><path d="M9 1 3 7l6 6"/>
  </svg>
);

const UI = {
  hint: { ru: 'Подсказка', uz: 'Maslahat' },
  hide: { ru: 'Скрыть подсказку', uz: 'Maslahatni yashirish' },
  solution: { ru: 'Решение', uz: 'Yechim' },
  showSolution: { ru: 'Показать решение', uz: "Yechimni ko'rsatish" },
  replay: { ru: '↻ Повторить', uz: '↻ Qaytarish' },
  retryOk: { ru: 'Теперь верно. В счёт идёт первая попытка.', uz: "Endi to'g'ri. Hisobga birinchi urinish kiradi." },
  gaveUp: { ru: 'Ничего страшного. Посмотри разбор решения ниже.', uz: "Hechqisi yo'q. Quyida yechim tahlilini ko'ring." },
  tryAgain: { ru: 'Не сходится. Загляни в подсказку и попробуй ещё раз.', uz: "To'g'ri kelmadi. Maslahatga qarang va yana urinib ko'ring." },
  wrongAudio: { ru: 'Не совсем. Попробуй ещё раз.', uz: "Unchalik emas. Yana urinib ko'ring." }
};

const HintToggle = ({ hint }) => {
  const t = useT(); const lang = useLang();
  const [open, setOpen] = useState(false);
  if (!hint) return null;
  return (
    <div>
      <button className="hint-toggle" onClick={() => setOpen(o => !o)}>{open ? UI.hide[lang] : `? ${UI.hint[lang]}`}</button>
      {open && <div className="frame-soft" style={{ marginTop: 8 }}><p className="body" style={{ margin: 0 }}>{t(hint)}</p></div>}
    </div>
  );
};

const RefNote = ({ idx }) => {
  const t = useT();
  const r = REFS[idx];
  if (!r) return null;
  return (
    <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
      <span style={{ flexShrink: 0, paddingTop: 3 }}><ArrowLeft color={T.ink3}/></span>
      <span className="small" style={{ color: T.ink3 }}>{t(r)}</span>
    </div>
  );
};

// ===== НОВЫЕ КОМПОНЕНТЫ (infra_v2): деление =====
// Настоящий уголок: делимое слева, делитель справа, частное под делителем.
// Под делимым — вертикальные шаги: умножил (со знаком минус) → черта → снёс.
// step = { pd, col, qd, prod }: pd — неполное делимое, col — индекс его правой
// цифры в делимом, prod — вычитаемое произведение (qd × делитель).
const DivBoard = ({ plan, reveal, fs = 'clamp(18px, 4.6vw, 28px)' }) => {
  const lang = useLang();
  const L = plan.dividend.length;
  const shown = Math.min(reveal, plan.steps.length);
  const qShown = plan.quotient.slice(0, shown);
  const grid = (s, endCol) => {
    const a = Array(L).fill(' ');
    const start = endCol - s.length + 1;
    for (let i = 0; i < s.length; i++) { const idx = start + i; if (idx >= 0 && idx < L) a[idx] = s[i]; }
    return a.join('');
  };
  const rows = [];
  rows.push({ kind: 'num', s: grid(plan.dividend, L - 1), color: T.ink, minus: false });
  for (let k = 0; k < shown; k++) {
    const st = plan.steps[k];
    if (k >= 1) rows.push({ kind: 'num', s: grid(st.pd, st.col), color: T.ink, minus: false });
    rows.push({ kind: 'num', s: grid(st.prod, st.col), color: T.ink2, minus: true, start: st.col - st.prod.length + 1 });
    rows.push({ kind: 'bar', start: st.col - st.prod.length + 1, len: st.prod.length }); // черта вычитания — тонкая линия
  }
  if (shown === plan.steps.length) rows.push({ kind: 'num', s: grid(plan.finalRemainder, L - 1), color: plan.finalRemainder !== '0' ? T.accent : T.ink3, minus: false });

  const mono = { fontFamily: "'JetBrains Mono', monospace", fontSize: fs, lineHeight: 1, fontWeight: 700, whiteSpace: 'pre', letterSpacing: 0, margin: 0 };
  const lineW = Math.max(plan.divisor.length, plan.quotient.length) + 0.6;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <div>
        {rows.map((r, ri) => (
          r.kind === 'bar' ? (
            <div key={ri} style={{ position: 'relative', height: '0.3em' }}>
              <div style={{ position: 'absolute', top: '50%', left: `calc(0.9ch + ${r.start}ch)`, width: `${r.len + 3}ch`, height: 2, background: T.ink, transform: 'translateY(-50%)' }}/>
            </div>
          ) : (
            <div key={ri} style={{ display: 'flex', position: 'relative' }}>
              <span style={{ ...mono, width: '0.9ch' }}>{'\u00A0'}</span>
              <span style={{ ...mono, color: r.color }}>{r.s}</span>
              {r.minus && (
                <span style={{ position: 'absolute', top: 0, left: `calc(0.9ch + ${r.start}ch)`, transform: 'translate(-120%, -50%)', ...mono, color: T.ink2 }}>{'\u2212'}</span>
              )}
            </div>
          )
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `2px solid ${T.ink}`, paddingLeft: 2, alignItems: 'flex-start' }}>
        <div style={{ ...mono, color: T.ink }}>{plan.divisor}</div>
        <div style={{ height: 2, background: T.ink, width: `${lineW}ch`, fontFamily: "'JetBrains Mono', monospace", fontSize: fs, borderRadius: 1, margin: '2px 0' }}/>
        <div style={{ ...mono, color: T.success }}>
          {(qShown || '\u00A0').split('').map((d, i) => (<span key={i} style={{ color: d === '0' ? T.accent : T.success }}>{d}</span>))}
        </div>
        {shown === plan.steps.length && plan.finalRemainder !== '0' && (
          <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: T.accent, fontWeight: 600, marginTop: 6 }}>{lang === 'uz' ? 'qoldiq' : 'остаток'} {plan.finalRemainder}</div>
        )}
      </div>
    </div>
  );
};

const DivSolutionPlayer = ({ sol }) => {
  const lang = useLang();
  const steps = sol.steps.length;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    if (step >= steps - 1) { setPlaying(false); return; }
    const id = setTimeout(() => setStep(s => s + 1), 1300);
    return () => clearTimeout(id);
  }, [step, playing, steps]);
  return (
    <div className="frame-soft fade-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span className="mono small" style={{ color: T.success, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{UI.solution[lang]}</span>
        <button className="sol-replay" onClick={() => { setStep(0); setPlaying(true); }}>{UI.replay[lang]}</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}><DivBoard plan={sol} reveal={step + 1} fs="clamp(14px, 3.4vw, 20px)"/></div>
    </div>
  );
};

const ShareBoard = ({ groups, perGroup, remainder, highlight }) => {
  const lang = useLang();
  const Dot = ({ color }) => (<span style={{ width: 11, height: 11, borderRadius: '50%', background: color, display: 'inline-block' }}/>);
  const leftLabel = lang === 'uz' ? 'Ortdi:' : 'Осталось:';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2.5vw, 18px)', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: groups }).map((_, g) => (
          <div key={g} className="frame" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', minWidth: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{Array.from({ length: perGroup }).map((_, k) => (<Dot key={k} color={T.success}/>))}</div>
            <span className="mono small" style={{ color: T.ink3 }}>{perGroup}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 12, background: highlight ? T.accentSoft : T.paper, boxShadow: '0 4px 12px -6px rgba(58, 53, 48, 0.16)', transition: 'background 0.3s' }}>
        <span className="small" style={{ color: highlight ? T.accent : T.ink2, fontWeight: 600 }}>{leftLabel}</span>
        <div style={{ display: 'flex', gap: 5 }}>{Array.from({ length: remainder }).map((_, k) => (<Dot key={k} color={highlight ? T.accent : T.ink3}/>))}</div>
        <span className="mono" style={{ color: highlight ? T.accent : T.ink2, fontWeight: 700 }}>{remainder}</span>
      </div>
    </div>
  );
};

// ============================================================
// SEQUENCE / META
// ============================================================
const SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const TOTAL_SCREENS = SEQUENCE.length;

const LESSON_META = {
  lessonId: 'nat-5-05-v1',
  lessonTitle: { ru: 'Деление столбиком, деление с остатком', uz: "Ustun shaklida bo'lish, qoldiqli bo'lish" }
};

const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',            scored: false, scope: 'hook' },
  { id: 's1',  type: 'exploration', template: 'custom',            scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',            scored: false, scope: null },
  { id: 's3',  type: 'rule',        template: 'custom',            scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'NumInputScreen',    scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'test',        template: 'MCScreen',          scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',            scored: false, scope: null },
  { id: 's7',  type: 'rule',        template: 'custom',            scored: false, scope: null },
  { id: 's8',  type: 'test',        template: 'NumInputRemainder', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'test',        template: 'MCScreen',          scored: true,  scope: 'module-mikro' },
  { id: 's10', type: 'case',        template: 'custom',            scored: false, scope: null },
  { id: 's11', type: 'case',        template: 'MCScreen',          scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'test',        template: 'MCScreen',          scored: true,  scope: 'final' },
  { id: 's13', type: 'test',        template: 'NumInputScreen',    scored: true,  scope: 'final' },
  { id: 's14', type: 'summary',     template: 'custom',            scored: false, scope: null }
];

// step = { pd: неполное делимое, col: индекс правой цифры pd в делимом, qd, prod }
const DIV_PLANS = {
  1: { dividend: '936', divisor: '4', quotient: '234', finalRemainder: '0',
       steps: [{ pd: '9', col: 0, qd: '2', prod: '8' }, { pd: '13', col: 1, qd: '3', prod: '12' }, { pd: '16', col: 2, qd: '4', prod: '16' }] },
  2: { dividend: '618', divisor: '6', quotient: '103', finalRemainder: '0',
       steps: [{ pd: '6', col: 0, qd: '1', prod: '6' }, { pd: '1', col: 1, qd: '0', prod: '0' }, { pd: '18', col: 2, qd: '3', prod: '18' }] }
};

const DIV_SOLUTIONS = {
  4:  { dividend: '945', divisor: '3', quotient: '315', finalRemainder: '0', steps: [{ pd: '9', col: 0, qd: '3', prod: '9' }, { pd: '4', col: 1, qd: '1', prod: '3' }, { pd: '15', col: 2, qd: '5', prod: '15' }] },
  5:  { dividend: '824', divisor: '4', quotient: '206', finalRemainder: '0', steps: [{ pd: '8', col: 0, qd: '2', prod: '8' }, { pd: '2', col: 1, qd: '0', prod: '0' }, { pd: '24', col: 2, qd: '6', prod: '24' }] },
  8:  { dividend: '58', divisor: '7', quotient: '8', finalRemainder: '2', steps: [{ pd: '58', col: 1, qd: '8', prod: '56' }] },
  11: { dividend: '100', divisor: '8', quotient: '12', finalRemainder: '4', steps: [{ pd: '10', col: 1, qd: '1', prod: '8' }, { pd: '20', col: 2, qd: '2', prod: '16' }] },
  12: { dividend: '612', divisor: '6', quotient: '102', finalRemainder: '0', steps: [{ pd: '6', col: 0, qd: '1', prod: '6' }, { pd: '1', col: 1, qd: '0', prod: '0' }, { pd: '12', col: 2, qd: '2', prod: '12' }] },
  13: { dividend: '728', divisor: '7', quotient: '104', finalRemainder: '0', steps: [{ pd: '7', col: 0, qd: '1', prod: '7' }, { pd: '2', col: 1, qd: '0', prod: '0' }, { pd: '28', col: 2, qd: '4', prod: '28' }] }
};

const REFS = { 3: null, 7: null, 10: null, 14: null };

// ============================================================
// CONTENT
// ============================================================
const CONTENT = {
  s0: {
    eyebrow: { ru: 'Вопрос урока', uz: 'Dars savoli' },
    global_q: { ru: 'Что делать с остатком?', uz: "Qoldiq bilan nima qilamiz?" },
    claim_lead: { ru: 'Зайнаб делит 30 конфет поровну между 4 друзьями. Она быстро посчитала и говорит:', uz: "Zaynab 30 ta konfetni 4 ta do'stiga teng bo'ladi. U tez hisoblab, shunday deydi:" },
    claim_em: { ru: 'По 6, остаток 6.', uz: '6 tadan, qoldiq 6.' },
    question: { ru: 'Зайнаб права?', uz: 'Zaynab haqmi?' },
    opt_yes: { ru: 'Зайнаб права', uz: 'Zaynab haq' },
    opt_no: { ru: 'Зайнаб ошибается', uz: 'Zaynab xato qilyapti' },
    opt_idk: { ru: 'Не уверен', uz: 'Ishonchim komil emas' },
    audio: {
      intro: { ru: 'Зайнаб делит тридцать конфет поровну между четырьмя друзьями. Она посчитала и говорит, что выйдет по шесть каждому, а в остатке шесть. Права ли она?', uz: "Zaynab o'ttizta konfetni to'rtta do'stiga teng bo'ladi. U hisoblab, har biriga oltitadan, qoldiqda esa oltita bo'ladi deydi. U haqmi?" },
      on_correct: { ru: 'Хорошо. Сейчас проверим.', uz: 'Yaxshi. Hozir tekshiramiz.' },
      on_wrong: { ru: 'Хорошо. Сейчас проверим.', uz: 'Yaxshi. Hozir tekshiramiz.' }
    }
  },

  s1: {
    eyebrow: { ru: 'Разберём', uz: "Ko'rib chiqamiz" },
    title: { ru: 'Как работает деление столбиком', uz: "Ustun shaklida bo'lish qanday ishlaydi" },
    intro: { ru: 'Делим столбиком слева направо. На каждом шаге берём неполное делимое: делим, умножаем цифру частного на делитель, вычитаем и сносим следующую цифру.', uz: "Ustun shaklida chapdan o'ngga bo'lamiz. Har qadamda to'liqsiz bo'linuvchini olamiz: bo'lamiz, bo'linma raqamini bo'luvchiga ko'paytiramiz, ayiramiz va keyingi raqamni tushiramiz." },
    step1_label: { ru: 'Первое неполное делимое — 9', uz: "Birinchi to'liqsiz bo'linuvchi — 9" },
    step1_text: { ru: '9 на 4 — это 2. Умножаем 2 на 4, получаем 8, вычитаем из 9 — остаётся 1.', uz: "9 ni 4 ga — bu 2. 2 ni 4 ga ko'paytiramiz, 8 chiqadi, 9 dan ayiramiz — 1 qoladi." },
    step2_label: { ru: 'Сносим 3 — неполное делимое 13', uz: "3 ni tushiramiz — to'liqsiz bo'linuvchi 13" },
    step2_text: { ru: '13 на 4 — это 3. Умножаем 3 на 4, получаем 12, вычитаем — остаётся 1.', uz: "13 ni 4 ga — bu 3. 3 ni 4 ga ko'paytiramiz, 12 chiqadi, ayiramiz — 1 qoladi." },
    step3_label: { ru: 'Сносим 6 — неполное делимое 16', uz: "6 ni tushiramiz — to'liqsiz bo'linuvchi 16" },
    step3_text: { ru: '16 на 4 равно 4. Умножаем 4 на 4, получаем 16, вычитаем — остаётся 0. Частное 234.', uz: "16 ni 4 ga teng 4. 4 ni 4 ga ko'paytiramiz, 16 chiqadi, ayiramiz — 0 qoladi. Bo'linma 234." },
    btn_step: { ru: 'Дальше', uz: 'Davom etish' },
    audio: {
      ru: [
        'Первое неполное делимое — девять. Девять на четыре — это два. Умножаем два на четыре, получается восемь, вычитаем из девяти — остаётся один.',
        'Сносим тройку — неполное делимое тринадцать. Тринадцать на четыре — это три. Умножаем три на четыре, получается двенадцать, вычитаем — остаётся один.',
        'Сносим шестёрку — неполное делимое шестнадцать. Шестнадцать на четыре равно четыре. Умножаем четыре на четыре, получается шестнадцать, вычитаем — остаётся ноль. Частное двести тридцать четыре.'
      ],
      uz: [
        "Birinchi to'liqsiz bo'linuvchi — to'qqiz. To'qqizni to'rtga — bu ikki. Ikkini to'rtga ko'paytiramiz, sakkiz chiqadi, to'qqizdan ayiramiz — bir qoladi.",
        "Uchni tushiramiz — to'liqsiz bo'linuvchi o'n uch. O'n uchni to'rtga — bu uch. Uchni to'rtga ko'paytiramiz, o'n ikki chiqadi, ayiramiz — bir qoladi.",
        "Oltini tushiramiz — to'liqsiz bo'linuvchi o'n olti. O'n oltini to'rtga teng to'rt. To'rtni to'rtga ko'paytiramiz, o'n olti chiqadi, ayiramiz — nol qoladi. Bo'linma ikki yuz o'ttiz to'rt."
      ]
    }
  },

  s2: {
    eyebrow: { ru: 'Разберём', uz: "Ko'rib chiqamiz" },
    title: { ru: 'Когда в частном появляется ноль', uz: "Bo'linmada nol qachon paydo bo'ladi" },
    intro: { ru: 'Иногда неполное делимое меньше делителя — оно делится 0 раз. Тогда в частное ставим ноль и сносим следующую цифру. Пропускать ноль нельзя.', uz: "Ba'zan to'liqsiz bo'linuvchi bo'luvchidan kichik bo'ladi — u 0 marta bo'linadi. Shunda bo'linmaga nol qo'yamiz va keyingi raqamni tushiramiz. Nolni tashlab ketib bo'lmaydi." },
    step1_label: { ru: 'Первое неполное делимое — 6', uz: "Birinchi to'liqsiz bo'linuvchi — 6" },
    step1_text: { ru: '6 на 6 равно 1. Умножаем 1 на 6, вычитаем — остаётся 0.', uz: "6 ni 6 ga teng 1. 1 ni 6 ga ko'paytiramiz, ayiramiz — 0 qoladi." },
    step2_label: { ru: 'Сносим 1 — неполное делимое 1', uz: "1 ni tushiramiz — to'liqsiz bo'linuvchi 1" },
    step2_text: { ru: '1 меньше 6 — делится 0 раз. Пишем в частное ноль и сносим дальше.', uz: "1 son 6 dan kichik — 0 marta bo'linadi. Bo'linmaga nol yozamiz va davom etamiz." },
    step3_label: { ru: 'Сносим 8 — неполное делимое 18', uz: "8 ni tushiramiz — to'liqsiz bo'linuvchi 18" },
    step3_text: { ru: '18 на 6 равно 3. Частное 103. Без нуля вышло бы 13 — на разряд короче и неверно.', uz: "18 ni 6 ga teng 3. Bo'linma 103. Nolsiz 13 chiqardi — bir xonaga qisqa va noto'g'ri." },
    btn_step: { ru: 'Дальше', uz: 'Davom etish' },
    audio: {
      ru: [
        'Первое неполное делимое — шесть. Шесть на шесть равно один. Умножаем один на шесть, вычитаем — остаётся ноль.',
        'Сносим единицу — неполное делимое один. Но один меньше шести, делится ноль раз. Поэтому в частное пишем ноль и сносим дальше.',
        'Сносим восьмёрку — неполное делимое восемнадцать. Восемнадцать на шесть равно три. Частное сто три. Если пропустить ноль, получится тринадцать — это на разряд короче и неверно.'
      ],
      uz: [
        "Birinchi to'liqsiz bo'linuvchi — olti. Oltini oltiga teng bir. Birni oltiga ko'paytiramiz, ayiramiz — nol qoladi.",
        "Birni tushiramiz — to'liqsiz bo'linuvchi bir. Ammo bir oltidan kichik, nol marta bo'linadi. Shuning uchun bo'linmaga nol yozamiz va davom etamiz.",
        "Sakkizni tushiramiz — to'liqsiz bo'linuvchi o'n sakkiz. O'n sakkizni oltiga teng uch. Bo'linma bir yuz uch. Nolni tashlab ketsak, o'n uch chiqadi — bu bir xonaga qisqa va noto'g'ri."
      ]
    }
  },

  s3: {
    eyebrow: { ru: 'Правило', uz: 'Qoida' },
    title: { ru: 'Деление столбиком', uz: "Ustun shaklida bo'lish" },
    rule_1: { ru: 'Выделяем первое неполное делимое — наименьшую левую часть, которая делится на делитель. Сколько неполных делимых, столько цифр в частном.', uz: "Birinchi to'liqsiz bo'linuvchini ajratamiz — bo'luvchiga bo'linadigan eng kichik chap qism. Nechta to'liqsiz bo'linuvchi bo'lsa, bo'linmada shuncha raqam bo'ladi." },
    rule_2: { ru: 'Делим, умножаем цифру частного на делитель, вычитаем и сносим следующую цифру — получаем новое неполное делимое.', uz: "Bo'lamiz, bo'linma raqamini bo'luvchiga ko'paytiramiz, ayiramiz va keyingi raqamni tushiramiz — yangi to'liqsiz bo'linuvchi hosil bo'ladi." },
    rule_3: { ru: 'Если неполное делимое меньше делителя — в частное ставим ноль и сносим дальше.', uz: "To'liqsiz bo'linuvchi bo'luvchidan kichik bo'lsa — bo'linmaga nol qo'yamiz va davom etamiz." },
    term: { ru: 'Неполное делимое — часть числа, которую делим на этом шаге. Делимое — что делим целиком, делитель — на что делим, частное — результат.', uz: "To'liqsiz bo'linuvchi — shu qadamda bo'linadigan qism. Bo'linuvchi — butun bo'linadigan son, bo'luvchi — nimaga bo'lsak, bo'linma — natija." },
    example: { ru: '936 : 4 = 234', uz: '936 : 4 = 234' },
    audio: {
      ru: 'Запомним правило. Сначала выделяем первое неполное делимое — наименьшую левую часть, которая делится на делитель. Сколько неполных делимых, столько цифр в частном. Дальше на каждом шаге делим, умножаем цифру частного на делитель, вычитаем и сносим следующую цифру. Если неполное делимое меньше делителя, в частное ставим ноль. В конце проверяем умножением: частное умножить на делитель даёт делимое.',
      uz: "Qoidani eslab qolamiz. Avval birinchi to'liqsiz bo'linuvchini ajratamiz — bo'luvchiga bo'linadigan eng kichik chap qism. Nechta to'liqsiz bo'linuvchi bo'lsa, bo'linmada shuncha raqam bo'ladi. Keyin har qadamda bo'lamiz, bo'linma raqamini bo'luvchiga ko'paytiramiz, ayiramiz va keyingi raqamni tushiramiz. To'liqsiz bo'linuvchi bo'luvchidan kichik bo'lsa, bo'linmaga nol qo'yamiz. Oxirida ko'paytirib tekshiramiz: bo'linmani bo'luvchiga ko'paytirsak, bo'linuvchi chiqadi."
    }
  },

  s4: {
    eyebrow: { ru: 'Тренировка · 1 из 2', uz: 'Mashq · 2 dan 1' },
    label: { ru: 'Раздели сам', uz: "O'zingiz bo'ling" },
    question: { ru: 'Мадина раздаёт 945 наклеек поровну на 3 команды. Сколько каждой? 945 : 3.', uz: "Madina 945 ta stikerni 3 ta jamoaga teng bo'ladi. Har biriga nechtadan? 945 : 3." },
    placeholder: { ru: '0', uz: '0' },
    correctValue: '315',
    hint: { ru: 'Делим слева направо: 9 на 3, потом 4 на 3 с остатком, снеси 5.', uz: "Chapdan o'ngga bo'lamiz: 9 ni 3 ga, keyin 4 ni 3 ga qoldiq bilan, 5 ni tushiring." },
    fb_correct: { ru: 'Правильно. 9 на 3 равно 3, 4 на 3 равно 1 и остаётся 1, сносим 5 — 15 на 3 равно 5. Итог 315.', uz: "To'g'ri. 9 ni 3 ga bo'lsak 3, 4 ni 3 ga bo'lsak 1 va 1 ortadi, 5 ni tushiramiz — 15 ni 3 ga bo'lsak 5. Natija 315." },
    fb_wrong: { ru: 'Верный ответ — 315. Делим по разрядам слева направо: 9 на 3, затем 4 на 3 с остатком 1, сносим 5 и делим 15 на 3.', uz: "To'g'ri javob — 315. Xonalar bo'yicha chapdan o'ngga bo'lamiz: 9 ni 3 ga, keyin 4 ni 3 ga qoldiq 1 bilan, 5 ni tushirib, 15 ni 3 ga bo'lamiz." },
    audio: {
      intro: { ru: 'Мадина раздаёт девятьсот сорок пять наклеек поровну на три команды. Сколько достанется каждой? Введи ответ и нажми кнопку проверить.', uz: "Madina to'qqiz yuz qirq besh stikerni uch jamoaga teng bo'ladi. Har biriga nechtadan tegadi? Javobni kiriting va tekshirish tugmasini bosing." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Не совсем. Загляни в подсказку и попробуй ещё раз.', uz: "Unchalik emas. Maslahatga qarang va yana urinib ko'ring." }
    }
  },

  s5: {
    eyebrow: { ru: 'Тренировка · 2 из 2', uz: 'Mashq · 2 dan 2' },
    label: { ru: 'Найди верное частное', uz: "To'g'ri bo'linmani toping" },
    question: { ru: 'Сколько будет 824 : 4?', uz: '824 : 4 nechaga teng?' },
    opt0: { ru: '26 — без нуля в середине', uz: "26 — o'rtada nolsiz" },
    opt1: { ru: '206 — делится точно', uz: "206 — qoldiqsiz bo'linadi" },
    opt2: { ru: '260 — ноль в конце', uz: '260 — nol oxirida' },
    correctIndex: 1,
    hint: { ru: 'После первой цифры посмотри: делится ли следующее число на 4? Если нет — поставь ноль и сноси дальше.', uz: "Birinchi raqamdan keyin qarang: keyingi son 4 ga bo'linadimi? Bo'linmasa — nol qo'ying va davom eting." },
    correct_text: { ru: 'Правильно. После первой цифры 2 не делится на 4 — ставим ноль и сносим дальше: 24 на 4 равно 6. Выходит 206.', uz: "To'g'ri. Birinchi raqamdan keyin 2 ni 4 ga bo'lib bo'lmaydi — nol qo'yib davom etamiz: 24 ni 4 ga bo'lsak 6. 206 chiqadi." },
    wrong_0: { ru: 'Ноль пропущен. Здесь 2 не делится на 4 — нужен ноль, иначе частное теряет разряд. Верно 206.', uz: "Nol tushib qolgan. Bu yerda 2 ni 4 ga bo'lib bo'lmaydi — nol kerak, aks holda bo'linma xonasini yo'qotadi. To'g'risi 206." },
    wrong_2: { ru: 'Ноль не на месте. Он возникает в середине, когда 2 не делится на 4, а не в конце. Верно 206.', uz: "Nol joyida emas. U o'rtada, 2 ni 4 ga bo'lib bo'lmaganda paydo bo'ladi, oxirida emas. To'g'risi 206." },
    wrong_default: { ru: 'Делим слева направо; если число не делится — ставим ноль и сносим дальше. Верно 206.', uz: "Chapdan o'ngga bo'lamiz; son bo'linmasa — nol qo'yib davom etamiz. To'g'risi 206." },
    audio: {
      intro: { ru: 'Сколько будет восемьсот двадцать четыре разделить на четыре? Выбери ответ.', uz: "Sakkiz yuz yigirma to'rtni to'rtga bo'lsak, nechaga teng? Javobni tanlang." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Не совсем. Посмотри разбор ниже.', uz: "Unchalik emas. Quyidagi tahlilga qarang." }
    }
  },

  s6: {
    eyebrow: { ru: 'Разберём', uz: "Ko'rib chiqamiz" },
    title: { ru: 'Откуда берётся остаток', uz: "Qoldiq qayerdan paydo bo'ladi" },
    intro: { ru: '23 предмета раздаём поровну в 5 групп. Кладём по одному по кругу, пока хватает.', uz: "23 ta narsani 5 ta guruhga teng bo'lamiz. Yetguncha aylana bo'ylab bittadan qo'yamiz." },
    step1_label: { ru: 'Раздаём по кругу', uz: "Aylana bo'ylab tarqatamiz" },
    step1_text: { ru: 'Прошли круг — по 1, ушло 5. Ещё круги: по 2 — это 10, по 3 — 15, по 4 — 20.', uz: "Bir aylana — 1 tadan, 5 tasi ketdi. Yana: 2 tadan — bu 10, 3 tadan — 15, 4 tadan — 20." },
    step2_label: { ru: 'Что осталось', uz: 'Nima qoldi' },
    step2_text: { ru: 'Раздали по 4, ушло 20. Осталось 3 предмета — на новый полный круг их не хватает.', uz: "4 tadan tarqatdik, 20 tasi ketdi. 3 ta narsa qoldi — yangi to'liq aylanaga yetmaydi." },
    step3_label: { ru: 'Остаток меньше делителя', uz: "Qoldiq bo'luvchidan kichik" },
    step3_text: { ru: 'Каждой группе досталось 4, осталось 3. Остаток 3 меньше 5 — иначе раздали бы ещё по одному. Пишем 23 : 5 = 4, остаток 3.', uz: "Har guruhga 4 tadan tegdi, 3 ta qoldi. Qoldiq 3 beshdan kichik — aks holda yana bittadan tarqatardik. 23 : 5 = 4, qoldiq 3 deb yozamiz." },
    btn_step: { ru: 'Дальше', uz: 'Davom etish' },
    audio: {
      ru: [
        'Двадцать три предмета раздаём поровну в пять групп. Кладём по одному по кругу: один круг — по одному, ушло пять, дальше по два, по три, по четыре.',
        'Раздали по четыре, ушло двадцать. Осталось три предмета — на новый полный круг их уже не хватает.',
        'Значит, каждой группе досталось четыре, а в остатке три. Остаток три меньше пяти, иначе мы раздали бы ещё по одному. Записываем: двадцать три разделить на пять равно четыре, остаток три.'
      ],
      uz: [
        "Yigirma uchta narsani besh guruhga teng bo'lamiz. Aylana bo'ylab bittadan qo'yamiz: bir aylana — bittadan, beshtasi ketdi, keyin ikkitadan, uchtadan, to'rttadan.",
        "To'rttadan tarqatdik, yigirmatasi ketdi. Uchta narsa qoldi — yangi to'liq aylanaga endi yetmaydi.",
        "Demak, har guruhga to'rttadan tegdi, qoldiqda uchta. Qoldiq uch beshdan kichik, aks holda yana bittadan tarqatardik. Yozamiz: yigirma uchni beshga bo'lamiz teng to'rt, qoldiq uch."
      ]
    }
  },

  s7: {
    eyebrow: { ru: 'Правило', uz: 'Qoida' },
    title: { ru: 'Деление с остатком', uz: "Qoldiqli bo'lish" },
    rule_1: { ru: 'Если число не делится нацело, в частном получаем неполное частное, а лишнее — остаток.', uz: "Son qoldiqsiz bo'linmasa, bo'linmada to'liqsiz bo'linma, ortig'i esa qoldiq bo'ladi." },
    rule_2: { ru: 'Остаток всегда меньше делителя. Если он не меньше — деление не закончено.', uz: "Qoldiq har doim bo'luvchidan kichik. Agar kichik bo'lmasa — bo'lish tugamagan." },
    term: { ru: 'В записи 23 : 5 = 4, остаток 3 число 4 — неполное частное, 3 — остаток.', uz: "23 : 5 = 4, qoldiq 3 yozuvida 4 — to'liqsiz bo'linma, 3 — qoldiq." },
    example: { ru: '23 : 5 = 4 (остаток 3)', uz: '23 : 5 = 4 (qoldiq 3)' },
    audio: {
      ru: 'Запомним правило. Если число не делится нацело, получаем неполное частное и остаток. Остаток всегда меньше делителя — если он не меньше, деление ещё не закончено. Проверить можно так: неполное частное умножить на делитель и прибавить остаток, должно выйти делимое.',
      uz: "Qoidani eslab qolamiz. Son qoldiqsiz bo'linmasa, to'liqsiz bo'linma va qoldiq chiqadi. Qoldiq har doim bo'luvchidan kichik — agar kichik bo'lmasa, bo'lish hali tugamagan. Tekshirish: to'liqsiz bo'linmani bo'luvchiga ko'paytirib, qoldiqni qo'shsak, bo'linuvchi chiqishi kerak."
    }
  },

  s8: {
    eyebrow: { ru: 'Тренировка · 1 из 2', uz: 'Mashq · 2 dan 1' },
    label: { ru: 'Раздели с остатком', uz: "Qoldiq bilan bo'ling" },
    question: { ru: 'Алишер раскладывает 58 значков по 7 на стенд. Сколько полных стендов и сколько значков останется? 58 : 7.', uz: "Alisher 58 ta nishonni 7 tadan stendga teradi. Nechta to'liq stend va nechta nishon ortadi? 58 : 7." },
    placeholder: { ru: '0', uz: '0' },
    correctQuotient: '8',
    correctRemainder: '2',
    hint: { ru: 'Сколько раз 7 помещается в 58? Проверь умножением и найди, сколько осталось.', uz: "7 son 58 ga necha marta sig'adi? Ko'paytirib tekshiring va nechta qolishini toping." },
    fb_correct: { ru: 'Правильно. 7 умножить на 8 равно 56, до 58 остаётся 2, и 2 меньше 7.', uz: "To'g'ri. 7 ni 8 ga ko'paytirsak 56, 58 gacha 2 qoladi, 2 esa 7 dan kichik." },
    fb_wrong: { ru: 'Верный ответ — 8, остаток 2. 7 помещается в 58 восемь раз, это 56, остаётся 2. Остаток меньше делителя.', uz: "To'g'ri javob — 8, qoldiq 2. 7 son 58 ga sakkiz marta sig'adi, bu 56, 2 qoladi. Qoldiq bo'luvchidan kichik." },
    audio: {
      intro: { ru: 'Алишер раскладывает пятьдесят восемь значков по семь на стенд. Сколько выйдет полных стендов и сколько значков останется? Введи неполное частное и остаток, потом нажми кнопку проверить.', uz: "Alisher ellik sakkiz nishonni har stendga yettitadan teradi. Nechta to'liq stend chiqadi va nechta nishon ortadi? To'liqsiz bo'linma va qoldiqni kiriting, so'ng tekshirish tugmasini bosing." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Не совсем. Загляни в подсказку и попробуй ещё раз.', uz: "Unchalik emas. Maslahatga qarang va yana urinib ko'ring." }
    }
  },

  s9: {
    eyebrow: { ru: 'Тренировка · 2 из 2', uz: 'Mashq · 2 dan 2' },
    label: { ru: 'Сколько каждому и сколько лишних', uz: 'Har biriga nechtadan va nechta ortadi' },
    question: { ru: 'Вернёмся к Зайнаб: 30 конфет на 4 друзей. Сколько каждому и сколько останется? 30 : 4.', uz: "Zaynabga qaytamiz: 30 konfet 4 do'stga. Har biriga nechtadan va nechta qoladi? 30 : 4." },
    opt0: { ru: 'По 6, остаток 6', uz: '6 tadan, qoldiq 6' },
    opt1: { ru: 'По 7, остаток 2', uz: '7 tadan, qoldiq 2' },
    opt2: { ru: 'По 7, остаток 6', uz: '7 tadan, qoldiq 6' },
    opt3: { ru: 'По 5, остаток 10', uz: '5 tadan, qoldiq 10' },
    correctIndex: 1,
    hint: { ru: 'Остаток должен быть меньше 4. Если он 4 или больше — раздай ещё по одной.', uz: "Qoldiq 4 dan kichik bo'lishi kerak. Agar 4 yoki katta bo'lsa — yana bittadan tarqating." },
    correct_text: { ru: 'Правильно. 7 умножить на 4 равно 28, до 30 остаётся 2, и 2 меньше 4.', uz: "To'g'ri. 7 ni 4 ga ko'paytirsak 28, 30 gacha 2 qoladi, 2 esa 4 dan kichik." },
    wrong_0: { ru: 'Это ошибка из начала урока. Остаток 6 больше делителя 4 — значит, каждому можно дать ещё по одной. Верно 7, остаток 2.', uz: "Bu darsning boshidagi xato. Qoldiq 6 bo'luvchi 4 dan katta — demak, har biriga yana bittadan berish mumkin. To'g'risi 7, qoldiq 2." },
    wrong_2: { ru: 'Частное верное, а остаток нет. 7 умножить на 4 равно 28, остаётся не 6, а 2. Верно 7, остаток 2.', uz: "Bo'linma to'g'ri, qoldiq esa yo'q. 7 ni 4 ga ko'paytirsak 28, 6 emas, 2 qoladi. To'g'risi 7, qoldiq 2." },
    wrong_3: { ru: 'Деление остановлено слишком рано. Остаток 10 больше делителя 4 — раздаём ещё. Верно 7, остаток 2.', uz: "Bo'lish juda erta to'xtatilgan. Qoldiq 10 bo'luvchi 4 dan katta — yana tarqatamiz. To'g'risi 7, qoldiq 2." },
    wrong_default: { ru: 'Остаток должен быть меньше делителя. Верно 7, остаток 2.', uz: "Qoldiq bo'luvchidan kichik bo'lishi kerak. To'g'risi 7, qoldiq 2." },
    audio: {
      intro: { ru: 'Вернёмся к Зайнаб. Тридцать конфет нужно раздать поровну четырём друзьям. Сколько достанется каждому и сколько останется? Выбери ответ.', uz: "Zaynabga qaytamiz. O'ttizta konfetni to'rtta do'stga teng bo'lish kerak. Har biriga nechtadan tegadi va nechta qoladi? Javobni tanlang." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Не совсем. Посмотри разбор справа.', uz: "Unchalik emas. O'ngdagi tushuntirishga qarang." }
    }
  },

  s10: {
    eyebrow: { ru: 'Задача · раскладка класса', uz: 'Masala · sinf terishi' },
    title: { ru: 'Раскладка тетрадей', uz: 'Daftarlarni terish' },
    intro: { ru: 'Класс 5-А получил 100 тетрадей. Их раскладывают по пачкам, в каждой пачке по 8 тетрадей. Поможем посчитать.', uz: "5-A sinf 100 ta daftar oldi. Ularni pachkalarga teradi, har pachkada 8 tadan daftar. Hisoblashga yordam beramiz." },
    fact_1: { ru: 'Всего тетрадей — 100', uz: 'Jami daftar — 100' },
    fact_2: { ru: 'В одной пачке — 8', uz: 'Bir pachkada — 8' },
    cta: { ru: 'Помочь классу', uz: 'Sinfga yordam berish' },
    audio: {
      ru: 'Класс пять А получил сто тетрадей. Их раскладывают по пачкам, в каждой пачке по восемь. Поможем посчитать, сколько выйдет полных пачек и сколько тетрадей останется.',
      uz: "Besh A sinf yuzta daftar oldi. Ularni pachkalarga teradi, har pachkada sakkiztadan. Nechta to'liq pachka chiqishini va nechta daftar qolishini hisoblashga yordam beramiz."
    }
  },

  s11: {
    eyebrow: { ru: 'Задача · раскладка класса', uz: 'Masala · sinf terishi' },
    label: { ru: 'Сколько пачек и сколько лишних', uz: 'Nechta pachka va nechta ortadi' },
    question: { ru: 'Сколько выйдет полных пачек и сколько тетрадей останется? 100 : 8.', uz: "Nechta to'liq pachka chiqadi va nechta daftar qoladi? 100 : 8." },
    opt0: { ru: '12 пачек, без лишних', uz: "12 pachka, ortig'i yo'q" },
    opt1: { ru: '12 пачек, 4 лишних', uz: '12 pachka, 4 ta ortadi' },
    opt2: { ru: '13 пачек', uz: '13 pachka' },
    correctIndex: 1,
    hint: { ru: 'Сколько раз 8 помещается в 100? Что осталось — лишние тетради.', uz: "8 son 100 ga necha marta sig'adi? Qolgani — ortgan daftarlar." },
    correct_text: { ru: 'Правильно. 8 умножить на 12 равно 96, до 100 остаётся 4 тетради — на полную пачку их не хватает.', uz: "To'g'ri. 8 ni 12 ga ko'paytirsak 96, 100 gacha 4 ta daftar qoladi — to'liq pachkaga yetmaydi." },
    wrong_0: { ru: 'Остаток потерян. 8 умножить на 12 равно 96, а тетрадей 100 — 4 не вошли ни в одну полную пачку. Верно 12 пачек и 4 лишних.', uz: "Qoldiq yo'qolgan. 8 ni 12 ga ko'paytirsak 96, daftar esa 100 — 4 tasi birorta to'liq pachkaga kirmadi. To'g'risi 12 pachka va 4 ta ortadi." },
    wrong_2: { ru: '13-й пачки не выйдет. 4 оставшиеся тетради не образуют полную пачку из 8. Верно 12 пачек и 4 лишних.', uz: "13-pachka chiqmaydi. Qolgan 4 ta daftar 8 talik to'liq pachka hosil qilmaydi. To'g'risi 12 pachka va 4 ta ortadi." },
    wrong_default: { ru: 'Полные пачки — это частное, лишние тетради — остаток. Верно 12 пачек и 4 лишних.', uz: "To'liq pachkalar — bo'linma, ortgan daftarlar — qoldiq. To'g'risi 12 pachka va 4 ta ortadi." },
    audio: {
      intro: { ru: 'Сколько получится полных пачек и сколько тетрадей останется лишними? Сто разделить на восемь. Выбери ответ.', uz: "Nechta to'liq pachka chiqadi va nechta daftar ortib qoladi? Yuzni sakkizga bo'lamiz. Javobni tanlang." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Не совсем. Посмотри разбор ниже.', uz: "Unchalik emas. Quyidagi tahlilga qarang." }
    }
  },

  s12: {
    eyebrow: { ru: 'Итог · 1 из 2', uz: 'Yakun · 2 dan 1' },
    label: { ru: 'Проверь результат', uz: 'Natijani tekshiring' },
    question: { ru: 'Сколько будет 612 : 6?', uz: '612 : 6 nechaga teng?' },
    opt0: { ru: '12 — без нуля в середине', uz: "12 — o'rtada nolsiz" },
    opt1: { ru: '102 — делится точно', uz: "102 — qoldiqsiz bo'linadi" },
    opt2: { ru: '112 — проверь умножением', uz: "112 — ko'paytirib tekshiring" },
    opt3: { ru: '120 — ноль в конце', uz: '120 — nol oxirida' },
    correctIndex: 1,
    hint: { ru: 'В среднем разряде проверь: делится ли 1 на 6? И проверь ответ умножением.', uz: "O'rtadagi xonani tekshiring: 1 son 6 ga bo'linadimi? Javobni ko'paytirib ham tekshiring." },
    correct_text: { ru: 'Правильно. В среднем разряде 1 не делится на 6 — ставим ноль, потом 12 на 6 равно 2. Проверка: 102 умножить на 6 равно 612.', uz: "To'g'ri. O'rtadagi xonada 1 ni 6 ga bo'lib bo'lmaydi — nol qo'yamiz, keyin 12 ni 6 ga bo'lsak 2. Tekshirish: 102 ni 6 ga ko'paytirsak 612." },
    wrong_0: { ru: 'Ноль пропущен. В среднем разряде 1 не делится на 6 — нужен ноль, иначе частное короче на разряд. Верно 102.', uz: "Nol tushib qolgan. O'rtadagi xonada 1 ni 6 ga bo'lib bo'lmaydi — nol kerak, aks holda bo'linma bir xonaga qisqa. To'g'risi 102." },
    wrong_2: { ru: 'Проверка не сходится: 112 умножить на 6 равно 672, а не 612. Перепроверь среднюю цифру. Верно 102.', uz: "Tekshirish to'g'ri kelmaydi: 112 ni 6 ga ko'paytirsak 672, 612 emas. O'rtadagi raqamni qayta tekshiring. To'g'risi 102." },
    wrong_3: { ru: 'Ноль не на месте. Он стоит в середине, где 1 не делится на 6, а не в конце. Верно 102.', uz: "Nol joyida emas. U o'rtada, 1 ni 6 ga bo'lib bo'lmagan joyda turadi, oxirida emas. To'g'risi 102." },
    wrong_default: { ru: 'Не теряй ноль в частном и проверяй ответ умножением. Верно 102.', uz: "Bo'linmadagi nolni yo'qotmang va javobni ko'paytirib tekshiring. To'g'risi 102." },
    audio: {
      intro: { ru: 'Сколько будет шестьсот двенадцать разделить на шесть? Выбери ответ.', uz: "Olti yuz o'n ikkini oltiga bo'lsak, nechaga teng? Javobni tanlang." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Не совсем. Посмотри разбор ниже.', uz: "Unchalik emas. Quyidagi tahlilga qarang." }
    }
  },

  s13: {
    eyebrow: { ru: 'Итог · 2 из 2', uz: 'Yakun · 2 dan 2' },
    label: { ru: 'Раздели столбиком', uz: "Ustun shaklida bo'ling" },
    question: { ru: 'Бекзод делит 728 страниц на 7 дней поровну. Сколько в день? 728 : 7.', uz: "Bekzod 728 betni 7 kunga teng bo'ladi. Kuniga nechtadan? 728 : 7." },
    placeholder: { ru: '0', uz: '0' },
    correctValue: '104',
    hint: { ru: '7 на 7, потом 2 на 7 не делится — поставь ноль и снеси 8.', uz: "7 ni 7 ga, keyin 2 ni 7 ga bo'lib bo'lmaydi — nol qo'ying va 8 ni tushiring." },
    fb_correct: { ru: 'Правильно. 7 на 7 равно 1, 2 на 7 не делится — ставим ноль, сносим 8, 28 на 7 равно 4. Итог 104.', uz: "To'g'ri. 7 ni 7 ga bo'lsak 1, 2 ni 7 ga bo'lib bo'lmaydi — nol qo'yamiz, 8 ni tushiramiz, 28 ni 7 ga bo'lsak 4. Natija 104." },
    fb_wrong: { ru: 'Верный ответ — 104. 2 не делится на 7 — в частном нужен ноль, потом 28 на 7 равно 4. Без нуля выходит 14 — это неверно.', uz: "To'g'ri javob — 104. 2 ni 7 ga bo'lib bo'lmaydi — bo'linmada nol kerak, keyin 28 ni 7 ga bo'lsak 4. Nolsiz 14 chiqadi — bu noto'g'ri." },
    audio: {
      intro: { ru: 'Бекзод делит семьсот двадцать восемь страниц на семь дней поровну. Сколько страниц в день? Введи ответ и нажми кнопку проверить.', uz: "Bekzod yetti yuz yigirma sakkiz betni yetti kunga teng bo'ladi. Kuniga nechtadan bet? Javobni kiriting va tekshirish tugmasini bosing." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Не совсем. Загляни в подсказку и попробуй ещё раз.', uz: "Unchalik emas. Maslahatga qarang va yana urinib ko'ring." }
    }
  },

  s14: {
    eyebrow: { ru: 'Итог урока', uz: 'Dars yakuni' },
    title: { ru: 'Что ты теперь умеешь', uz: 'Endi nimani bilasiz' },
    ring_back: { ru: 'Помнишь Зайнаб? Она сказала: по 6, остаток 6. Но остаток 6 больше делителя 4 — значит, каждому можно дать ещё по одной. На самом деле 30 : 4 = 7, остаток 2.', uz: "Zaynab esingizdami? U: 6 tadan, qoldiq 6 dedi. Ammo qoldiq 6 bo'luvchi 4 dan katta — demak, har biriga yana bittadan berish mumkin. Aslida 30 : 4 = 7, qoldiq 2." },
    learned_1: { ru: 'Делить столбиком, не теряя ноль в частном.', uz: "Bo'linmadagi nolni yo'qotmasdan ustun shaklida bo'lish." },
    learned_2: { ru: 'Делить с остатком и помнить: остаток меньше делителя.', uz: "Qoldiqli bo'lish va eslab qolish: qoldiq bo'luvchidan kichik." },
    why_heading: { ru: 'Зачем это нужно', uz: 'Bu nimaga kerak' },
    why_1: { ru: 'Проверка умножением ловит ошибку: неполное частное умножить на делитель плюс остаток даёт делимое.', uz: "Ko'paytirib tekshirish xatoni tutadi: to'liqsiz bo'linmani bo'luvchiga ko'paytirib, qoldiqni qo'shsak, bo'linuvchi chiqadi." },
    why_2: { ru: 'Деление — основа дробей: дробь по сути и означает деление.', uz: "Bo'lish — kasrlarning asosi: kasr aslida bo'lishni bildiradi." },
    score_label: { ru: 'Правильных ответов', uz: "To'g'ri javoblar" },
    teaser: { ru: 'Дальше — обыкновенные дроби: что такое часть целого.', uz: "Keyin — oddiy kasrlar: butunning qismi nima." },
    audio: {
      ru: [
        'Вернёмся к началу. Зайнаб сказала: по шесть, остаток шесть. Но остаток шесть больше делителя четыре — значит, каждому можно дать ещё по одной. На самом деле тридцать разделить на четыре равно семь, остаток два.',
        'Теперь ты умеешь делить столбиком, не теряя ноль в частном, и делить с остатком, помня, что остаток меньше делителя.',
        'Проверка умножением ловит ошибку: неполное частное умножить на делитель и прибавить остаток даёт делимое. А ещё деление — это основа дробей.',
        'Дальше начнём обыкновенные дроби — что такое часть целого.'
      ],
      uz: [
        "Boshiga qaytamiz. Zaynab: oltitadan, qoldiq olti dedi. Ammo qoldiq olti bo'luvchi to'rtdan katta — demak, har biriga yana bittadan berish mumkin. Aslida o'ttizni to'rtga bo'lamiz teng yetti, qoldiq ikki.",
        "Endi siz bo'linmadagi nolni yo'qotmasdan ustun shaklida bo'lishni va qoldiq bo'luvchidan kichikligini eslab, qoldiqli bo'lishni bilasiz.",
        "Ko'paytirib tekshirish xatoni tutadi: to'liqsiz bo'linmani bo'luvchiga ko'paytirib, qoldiqni qo'shsak, bo'linuvchi chiqadi. Bundan tashqari, bo'lish — kasrlarning asosi.",
        "Keyin oddiy kasrlarni boshlaymiz — butunning qismi nima."
      ]
    }
  }
};

// ============================================================
// SCREEN-КОМПОНЕНТЫ
// ============================================================

const ExplorationStep = ({ idx, screen, totalScreens, onNext, onPrev, board }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT();
  const lang = useLang();
  const segs = c.audio[lang].map((text, i) => ({
    id: `s${idx}_a${i}`,
    text,
    trigger: i === 0 ? 'on_mount' : `on_event:step_${i}`,
    waits_for: { type: 'button_click', target: i < c.audio[lang].length - 1 ? 'step' : 'next' }
  }));
  const audio = useAudio(segs);
  const [step, setStep] = useState(0);
  const last = c.audio[lang].length - 1;
  const endRef = useRef(null);

  useEffect(() => {
    if (step > 0 && endRef.current) {
      setTimeout(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 150);
    }
  }, [step]);

  const handleStep = () => {
    if (step < last) { const ns = step + 1; setStep(ns); audio.triggerInternal(`step_${ns}`); }
    else { audio.triggerEvent('button_click', 'next'); onNext(); }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext label={step < last ? t(c.btn_step) : <NextLabel/>} onClick={handleStep}/></>);
  const blocks = [{ from: 0, label: 'step1_label', text: 'step1_text' }, { from: 1, label: 'step2_label', text: 'step2_text' }];

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 22px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.intro)}</p>
        <div className="frame fade-up delay-2" style={{ display: 'flex', justifyContent: 'center', padding: 'clamp(16px, 3vw, 24px) clamp(10px, 2vw, 16px)', overflowX: 'auto' }}>
          {board(step)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {blocks.map((b, i) => (
            step >= b.from && (
              <div key={i} className="fade-up" style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'start' }}>
                <div className="mono small" style={{ color: T.accent, fontWeight: 600, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="small" style={{ color: T.ink, fontWeight: 600, marginBottom: 4 }}>{t(c[b.label])}</div>
                  <div className="body" style={{ color: T.ink2 }}>{t(c[b.text])}</div>
                </div>
              </div>
            )
          ))}
        </div>
        {step >= last && <div className="fade-up frame-soft"><p className="body" style={{ margin: 0 }}>{t(c.step3_text)}</p></div>}
        <div ref={endRef}/>
      </div>
    </Stage>
  );
};

const RuleScreenGold = ({ idx, screen, totalScreens, onNext, onPrev, rules }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: `s${idx}_a`, text: c.audio[lang], trigger: 'on_mount', waits_for: { type: 'button_click', target: 'next' } }]);
  const handleNext = () => { audio.triggerEvent('button_click', 'next'); onNext(); };
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext onClick={handleNext} label={<NextLabel/>}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <div className="frame fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rules.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'start' }}>
              <div className="mono small" style={{ color: T.accent, fontWeight: 600, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</div>
              <div className="body" style={{ color: T.ink }}>{t(c[r])}</div>
            </div>
          ))}
          {c.term && <div className="frame-soft" style={{ marginTop: 4 }}><p className="body" style={{ margin: 0 }}>{t(c.term)}</p></div>}
          <div style={{ textAlign: 'center', marginTop: 4 }}><span className="mono" style={{ fontSize: 'clamp(16px, 2.6vw, 20px)', color: T.ink }}>{t(c.example)}</span></div>
        </div>
        <RefNote idx={idx}/>
      </div>
    </Stage>
  );
};

const MCScreen = ({ idx, screen, totalScreens, storedAnswer, onAnswer, onNext, onPrev }) => {
  const c = CONTENT[`s${idx}`];
  const meta = SCREEN_META[idx];
  const lang = useLang();
  const t = useT();
  const audio = useAudio([{ id: `s${idx}_intro`, text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const opts = [c.opt0, c.opt1, c.opt2, c.opt3].filter(Boolean);
  const [picked, setPicked] = useState(storedAnswer?.studentAnswerIndex ?? null);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);

  const pick = (i) => {
    if (revealed) return;
    setPicked(i); setRevealed(true);
    const isCorrect = i === c.correctIndex;
    onAnswer({
      stage: meta.scope, screenIdx: idx, question: c.question?.[lang] ?? null,
      options: opts.map(o => o[lang]), correctIndex: c.correctIndex,
      correctAnswer: opts[c.correctIndex]?.[lang] ?? null,
      studentAnswerIndex: i, studentAnswer: opts[i]?.[lang] ?? null, correct: isCorrect
    });
    audio.triggerEvent('option_picked');
    if (!audio.muted) {
      setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(isCorrect ? c.audio.on_correct[lang] : c.audio.on_wrong[lang]); }, 300);
    }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!revealed} onClick={onNext} label={<NextLabel/>}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(17px, 2.5vw, 24px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>{t(c.label)}</p>
          <h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.question)}</h2>
        </div>
        {!revealed && c.hint && <div className="fade-up delay-1"><HintToggle hint={c.hint}/></div>}
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {opts.map((opt, i) => {
            let cls = 'option';
            if (revealed) { if (i === c.correctIndex) cls += ' option-correct'; else if (i === picked) cls += ' option-picked-wrong'; else cls += ' option-wrong'; }
            return (
              <button key={i} className={cls} disabled={revealed} onClick={() => pick(i)}
                style={{ padding: 'clamp(12px, 1.7vw, 15px) clamp(14px, 2.1vw, 19px)', fontSize: 'clamp(13px, 1.6vw, 14px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: revealed && i === c.correctIndex ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{t(opt)}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={revealed} isCorrect={picked === c.correctIndex}>
          <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: picked === c.correctIndex ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {picked === c.correctIndex ? (lang === 'uz' ? "To'g'ri" : 'Верно') : (lang === 'uz' ? "Noto'g'ri" : 'Не совсем')}
          </p>
          <p className="body" style={{ margin: 0 }}>{picked === c.correctIndex ? t(c.correct_text) : t(c[`wrong_${picked}`] || c.wrong_default)}</p>
        </FeedbackBlock>
        {revealed && DIV_SOLUTIONS[idx] && <DivSolutionPlayer sol={DIV_SOLUTIONS[idx]}/>}
      </div>
    </Stage>
  );
};

const NumInputScreen = ({ idx, screen, totalScreens, storedAnswer, onAnswer, onNext, onPrev }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT(); const lang = useLang();
  const meta = SCREEN_META[idx];
  const target = parseInt(c.correctValue, 10);
  const audio = useAudio([{ id: `s${idx}_intro`, text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'check_pressed' } }]);
  const restored = storedAnswer !== undefined;
  const [value, setValue] = useState(storedAnswer?.studentAnswer ?? '');
  const [firstDone, setFirstDone] = useState(restored);
  const [firstCorrect, setFirstCorrect] = useState(restored ? !!storedAnswer.correct : false);
  const [solved, setSolved] = useState(restored ? !!storedAnswer.correct : false);
  const [gaveUp, setGaveUp] = useState(restored ? !storedAnswer.correct : false);
  const locked = solved || gaveUp;
  const showSolution = locked && !!DIV_SOLUTIONS[idx];

  const submit = () => {
    if (value === '' || locked) return;
    const ok = parseInt(value, 10) === target;
    if (!firstDone) {
      setFirstDone(true); setFirstCorrect(ok);
      onAnswer({ stage: meta.scope, screenIdx: idx, question: c.question?.[lang] ?? null, options: null, correctIndex: null, correctAnswer: c.correctValue, studentAnswerIndex: null, studentAnswer: String(value), correct: ok });
    }
    setSolved(ok);
    audio.triggerEvent('check_pressed');
    if (!audio.muted) { const fb = ok ? c.audio.on_correct[lang] : UI.wrongAudio[lang]; setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(fb); }, 300); }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!firstDone} onClick={onNext} label={<NextLabel/>}/></>);
  const inputState = solved ? 'correct' : (firstDone ? 'wrong' : '');
  const banner = solved ? (lang === 'uz' ? "To'g'ri" : 'Верно') : (lang === 'uz' ? "Noto'g'ri" : 'Не совсем');
  const feedbackText = solved ? (firstCorrect ? t(c.fb_correct) : UI.retryOk[lang]) : (gaveUp ? UI.gaveUp[lang] : UI.tryAgain[lang]);

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <div className="fade-up"><p className="eyebrow" style={{ color: T.accent }}>{t(c.label)}</p><h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.question)}</h2></div>
        {!locked && c.hint && <div className="fade-up delay-1"><HintToggle hint={c.hint}/></div>}
        <div className="frame fade-up delay-1" style={{ display: 'flex', justifyContent: 'center' }}>
          <input type="number" inputMode="numeric" className={`answer-input ${inputState}`} value={value} placeholder={t(c.placeholder)} onChange={e => setValue(e.target.value)} disabled={locked} onKeyDown={e => e.key === 'Enter' && submit()} style={{ minWidth: 'min(70%, 240px)' }}/>
        </div>
        <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {firstDone && !locked && <button className="btn-ghost" onClick={() => setGaveUp(true)} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(16px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{UI.showSolution[lang]}</button>}
          <button className="btn-white-accent" disabled={!value || locked} onClick={submit} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}><CheckLabel/></button>
        </div>
        <FeedbackBlock show={firstDone} isCorrect={solved}>
          <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{banner}</p>
          <p className="body" style={{ margin: 0 }}>{feedbackText}</p>
        </FeedbackBlock>
        {showSolution && <DivSolutionPlayer sol={DIV_SOLUTIONS[idx]}/>}
      </div>
    </Stage>
  );
};

const NumInputRemainder = ({ idx, screen, totalScreens, storedAnswer, onAnswer, onNext, onPrev }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT(); const lang = useLang();
  const meta = SCREEN_META[idx];
  const audio = useAudio([{ id: `s${idx}_intro`, text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'check_pressed' } }]);
  const restored = storedAnswer !== undefined;
  const parsed = (storedAnswer?.studentAnswer || '').match(/\d+/g) || [];
  const [q, setQ] = useState(restored ? (parsed[0] ?? '') : '');
  const [r, setR] = useState(restored ? (parsed[1] ?? '') : '');
  const [firstDone, setFirstDone] = useState(restored);
  const [firstCorrect, setFirstCorrect] = useState(restored ? !!storedAnswer.correct : false);
  const [solved, setSolved] = useState(restored ? !!storedAnswer.correct : false);
  const [gaveUp, setGaveUp] = useState(restored ? !storedAnswer.correct : false);
  const locked = solved || gaveUp;
  const showSolution = locked && !!DIV_SOLUTIONS[idx];
  const remWord = lang === 'uz' ? 'qoldiq' : 'ост';
  const qLabel = lang === 'uz' ? "To'liqsiz bo'linma" : 'Неполное частное';
  const rLabel = lang === 'uz' ? 'Qoldiq' : 'Остаток';

  const submit = () => {
    if (q === '' || r === '' || locked) return;
    const ok = q === c.correctQuotient && r === c.correctRemainder;
    if (!firstDone) {
      setFirstDone(true); setFirstCorrect(ok);
      onAnswer({ stage: meta.scope, screenIdx: idx, question: c.question?.[lang] ?? null, options: null, correctIndex: null, correctAnswer: `${c.correctQuotient} ${remWord} ${c.correctRemainder}`, studentAnswerIndex: null, studentAnswer: `${q} ${remWord} ${r}`, correct: ok });
    }
    setSolved(ok);
    audio.triggerEvent('check_pressed');
    if (!audio.muted) { const fb = ok ? c.audio.on_correct[lang] : UI.wrongAudio[lang]; setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(fb); }, 300); }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!firstDone} onClick={onNext} label={<NextLabel/>}/></>);
  const inputState = solved ? 'correct' : (firstDone ? 'wrong' : '');
  const banner = solved ? (lang === 'uz' ? "To'g'ri" : 'Верно') : (lang === 'uz' ? "Noto'g'ri" : 'Не совсем');
  const feedbackText = solved ? (firstCorrect ? t(c.fb_correct) : UI.retryOk[lang]) : (gaveUp ? UI.gaveUp[lang] : UI.tryAgain[lang]);
  const field = (label, val, setVal) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span className="small mono" style={{ color: T.ink2, fontWeight: 600 }}>{label}</span>
      <input type="number" inputMode="numeric" className={`answer-input ${inputState}`} value={val} placeholder={t(c.placeholder) || '0'} onChange={e => setVal(e.target.value)} disabled={locked} onKeyDown={e => e.key === 'Enter' && submit()} style={{ width: 'min(40vw, 130px)' }}/>
    </div>
  );

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <div className="fade-up"><p className="eyebrow" style={{ color: T.accent }}>{t(c.label)}</p><h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.question)}</h2></div>
        {!locked && c.hint && <div className="fade-up delay-1"><HintToggle hint={c.hint}/></div>}
        <div className="frame fade-up delay-1" style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px, 4vw, 32px)', flexWrap: 'wrap' }}>{field(qLabel, q, setQ)}{field(rLabel, r, setR)}</div>
        <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {firstDone && !locked && <button className="btn-ghost" onClick={() => setGaveUp(true)} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(16px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{UI.showSolution[lang]}</button>}
          <button className="btn-white-accent" disabled={!q || !r || locked} onClick={submit} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}><CheckLabel/></button>
        </div>
        <FeedbackBlock show={firstDone} isCorrect={solved}>
          <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{banner}</p>
          <p className="body" style={{ margin: 0 }}>{feedbackText}</p>
        </FeedbackBlock>
        {showSolution && <DivSolutionPlayer sol={DIV_SOLUTIONS[idx]}/>}
      </div>
    </Stage>
  );
};

const Screen0 = ({ screen, totalScreens, onAnswer, onNext }) => {
  const c = CONTENT.s0;
  const t = useT(); const lang = useLang();
  const audio = useAudio([{ id: 's0_intro', text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(null);
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer({ stage: null, screenIdx: 0, studentAnswer: v, correct: true }); audio.triggerEvent('option_picked'); setTimeout(onNext, 300); };
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <h1 className="title h-title fade-up">{t(c.global_q)}</h1>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.claim_lead)}</p>
        <div className="frame fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px, 2vw, 18px)' }}>
          <div style={{ ...MONO, fontSize: 'clamp(30px, 7vw, 46px)', fontWeight: 700, color: T.ink }}>30 : 4</div>
          <p className="body italic" style={{ margin: 0, color: T.accent, textAlign: 'center' }}>{t(c.claim_em)}</p>
        </div>
        <p className="h-sub title fade-up delay-3">{t(c.question)}</p>
        <div className="fade-up delay-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[{ id: 'yes', label: c.opt_yes }, { id: 'no', label: c.opt_no }, { id: 'idk', label: c.opt_idk }].map((opt) => (
            <button key={opt.id} className="option" disabled={picked !== null} onClick={() => pick(opt.id)} style={{ padding: 'clamp(14px, 2vw, 15px) clamp(16px, 2.5vw, 20px)', fontSize: 'clamp(15px, 1.9vw, 15px)' }}>{t(opt.label)}</button>
          ))}
        </div>
      </div>
    </Stage>
  );
};

const Screen1 = (props) => <ExplorationStep {...props} idx={1} board={(step) => <DivBoard plan={DIV_PLANS[1]} reveal={step + 1}/>}/>;
const Screen2 = (props) => <ExplorationStep {...props} idx={2} board={(step) => <DivBoard plan={DIV_PLANS[2]} reveal={step + 1}/>}/>;
const Screen3 = (props) => <RuleScreenGold {...props} idx={3} rules={['rule_1', 'rule_2', 'rule_3']}/>;
const Screen4 = (props) => <NumInputScreen {...props} idx={4}/>;
const Screen5 = (props) => <MCScreen {...props} idx={5}/>;
const Screen6 = (props) => <ExplorationStep {...props} idx={6} board={(step) => <ShareBoard groups={5} perGroup={4} remainder={3} highlight={step >= 1}/>}/>;
const Screen7 = (props) => <RuleScreenGold {...props} idx={7} rules={['rule_1', 'rule_2']}/>;
const Screen8 = (props) => <NumInputRemainder {...props} idx={8}/>;
const Screen9 = (props) => <MCScreen {...props} idx={9}/>;
const Screen11 = (props) => <MCScreen {...props} idx={11}/>;
const Screen12 = (props) => <MCScreen {...props} idx={12}/>;
const Screen13 = (props) => <NumInputScreen {...props} idx={13}/>;

const Screen10 = ({ screen, totalScreens, onNext, onPrev }) => {
  const c = CONTENT.s10;
  const t = useT(); const lang = useLang();
  const audio = useAudio([{ id: 's10_a', text: c.audio[lang], trigger: 'on_mount', waits_for: { type: 'button_click', target: 'next' } }]);
  const handleNext = () => { audio.triggerEvent('button_click', 'next'); onNext(); };
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext label={t(c.cta)} onClick={handleNext}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.intro)}</p>
        <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[c.fact_1, c.fact_2].map((fobj, i) => (
            <div key={i} className="frame" style={{ padding: 'clamp(16px, 3vw, 20px)' }}><p className="body" style={{ margin: 0, fontWeight: 600, color: T.ink }}>{t(fobj)}</p></div>
          ))}
        </div>
        <RefNote idx={10}/>
      </div>
    </Stage>
  );
};

const Screen14 = ({ screen, totalScreens, answers, onReset, onPrev, finishLesson }) => {
  const c = CONTENT.s14;
  const t = useT(); const lang = useLang();
  const audio = useAudio(makeAudioSegments(c, lang));
  const scored = SEQUENCE.filter(i => SCREEN_META[i]?.scored);
  const correct = scored.filter(i => answers[i]?.correct).length;
  const total = scored.length;
  useEffect(() => { finishLesson(); /* eslint-disable-next-line */ }, []);
  const navContent = (
    <>
      <NavBack onPrev={onPrev} label={<BackLabel/>}/>
      <button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(15px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{lang === 'uz' ? "Qaytadan o'tish" : 'Пройти заново'}</button>
      <button className="btn-white-accent" disabled style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)', marginLeft: 'auto' }}>{lang === 'uz' ? 'Keyingi dars →' : 'Следующий урок →'}</button>
    </>
  );
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 24px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <div className="frame-soft fade-up delay-1"><p className="body" style={{ margin: 0 }}>{t(c.ring_back)}</p></div>
        <div className="frame fade-up delay-1" style={{ textAlign: 'center' }}>
          <p className="eyebrow" style={{ color: T.ink3, margin: 0 }}>{t(c.score_label)}</p>
          <div className="display" style={{ fontSize: 'clamp(56px, 11vw, 80px)', marginTop: 8 }}>
            <span style={{ color: correct >= total * 0.7 ? T.success : T.accent }}>{correct}</span><span style={{ color: T.ink3 }}>/{total}</span>
          </div>
        </div>
        <div className="frame fade-up delay-2">
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>{lang === 'uz' ? 'Asosiy' : 'Главное'}</p>
          <ul className="body" style={{ marginTop: 12, paddingLeft: 20, color: T.ink2, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>{t(c.learned_1)}</li><li>{t(c.learned_2)}</li>
          </ul>
        </div>
        <div className="frame-success fade-up delay-3">
          <p className="eyebrow" style={{ color: T.success, margin: 0 }}>{t(c.why_heading)}</p>
          <ul className="body" style={{ marginTop: 12, paddingLeft: 20, color: T.ink2, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>{t(c.why_1)}</li><li>{t(c.why_2)}</li>
          </ul>
        </div>
        <p className="body fade-up delay-4" style={{ color: T.ink2 }}>{t(c.teaser)}</p>
        <RefNote idx={14}/>
      </div>
    </Stage>
  );
};

// ============================================================
// КОРНЕВОЙ КОМПОНЕНТ
// ============================================================
export default function DivisionLesson({ lang: langProp, onFinished }) {
  const isPreview = !langProp;
  const [previewLang, setPreviewLang] = useState('ru');
  const lang = langProp || previewLang;
  const safeOnFinished = onFinished || ((payload) => { /* eslint-disable-next-line no-console */ console.log('[Preview] onFinished payload:', payload); });

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const startTimeRef = useRef(Date.now());

  const recordAnswer = useCallback((screenIdx, data) => { setAnswers(prev => { const next = [...prev]; next[screenIdx] = data; return next; }); }, []);
  const reset = useCallback(() => { setAnswers([]); setCurrent(0); startTimeRef.current = Date.now(); }, []);

  const finishLesson = useCallback(() => {
    const presentScored = SEQUENCE.filter(i => SCREEN_META[i]?.scored);
    const presentFinal = presentScored.filter(i => SCREEN_META[i]?.scope === 'final');
    const correctAnswersCount = presentScored.filter(i => answers[i]?.correct).length;
    const finalCorrect = presentFinal.filter(i => answers[i]?.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId,
      lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: presentScored.length,
      correctAnswers: correctAnswersCount,
      scorePercent: presentScored.length > 0 ? Math.round((correctAnswersCount / presentScored.length) * 100) : 0,
      finalScore: finalCorrect,
      finalTotal: presentFinal.length,
      passed: presentFinal.length > 0 ? finalCorrect / presentFinal.length >= 0.6 : (presentScored.length > 0 ? (correctAnswersCount / presentScored.length) >= 0.6 : false),
      answers: answers.filter(Boolean)
    };
    safeOnFinished(payload);
  }, [answers, safeOnFinished]);

  const SCREEN_COMPONENTS = { 0: Screen0, 1: Screen1, 2: Screen2, 3: Screen3, 4: Screen4, 5: Screen5, 6: Screen6, 7: Screen7, 8: Screen8, 9: Screen9, 10: Screen10, 11: Screen11, 12: Screen12, 13: Screen13, 14: Screen14 };
  const sIdx = SEQUENCE[current];
  const CurrentScreen = SCREEN_COMPONENTS[sIdx];
  const next = () => setCurrent(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setCurrent(s => Math.max(s - 1, 0));
  const handleAnswer = useCallback((data) => { recordAnswer(SEQUENCE[current], data); }, [current, recordAnswer]);

  return (
    <LangContext.Provider value={lang}>
      <style>{STYLES}</style>
      <div className="lesson-root">
        {isPreview && (
          <div className="lang-switch">
            <button className={`lang-btn ${previewLang === 'ru' ? 'active' : ''}`} onClick={() => setPreviewLang('ru')}>RU</button>
            <button className={`lang-btn ${previewLang === 'uz' ? 'active' : ''}`} onClick={() => setPreviewLang('uz')}>UZ</button>
          </div>
        )}
        <CurrentScreen screen={current} totalScreens={TOTAL_SCREENS} storedAnswer={answers[sIdx]} answers={answers} onAnswer={handleAnswer} onNext={next} onPrev={prev} onReset={reset} finishLesson={finishLesson}/>
      </div>
    </LangContext.Provider>
  );
}

// CSS (visual v15)
const STYLES = `
html, body { margin: 0; padding: 0; }
.lesson-root, .lesson-root * { box-sizing: border-box; }
.lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: #0E0E10; background: #F6F4EF; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
.lesson-root h1, .lesson-root h2, .lesson-root h3, .lesson-root h4, .lesson-root h5, .lesson-root h6, .lesson-root p, .lesson-root ul, .lesson-root ol { margin: 0; padding: 0; }
.title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; font-variation-settings: "opsz" 60; }
.display { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.0; letter-spacing: -0.01em; font-variation-settings: "opsz" 60; }
.italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; font-variation-settings: "opsz" 60; }
.mono { font-family: 'JetBrains Mono', monospace; }
.mop { font-family: 'Manrope', sans-serif; font-weight: 600; color: #0E0E10; display: inline-block; padding: 0 0.06em; }
@keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
.delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
.feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
.feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px, 2vw, 20px); }
.btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: #FFFFFF; color: #FF4F28; letter-spacing: 0.01em; border-radius: 12px; border: none; box-shadow: 0 8px 22px -4px rgba(255, 79, 40, 0.35), 0 0 0 1px rgba(255, 79, 40, 0.12); }
.btn-white-accent:hover:not(:disabled) { background: #FF4F28; color: #FFFFFF; box-shadow: 0 12px 28px -6px rgba(255, 79, 40, 0.55); }
.btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(58, 53, 48, 0.14); }
.btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: #0E0E10; letter-spacing: 0.01em; border-radius: 12px; border: none; box-shadow: none; }
.btn-ghost:hover:not(:disabled) { background: #FFFFFF; box-shadow: 0 6px 18px -6px rgba(58, 53, 48, 0.18); }
.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
.option { background: #FFFFFF; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: #0E0E10; box-shadow: 0 6px 16px -6px rgba(58, 53, 48, 0.14); }
.option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(58, 53, 48, 0.22); }
.option:disabled { cursor: default; }
.option-correct { background: #E3F0E8 !important; color: #1F7A4D !important; box-shadow: 0 8px 22px -6px rgba(31, 122, 77, 0.32) !important; }
.option-wrong { background: #FFFFFF !important; color: #A7A6A2 !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(58, 53, 48, 0.08) !important; }
.option-picked-wrong { background: #FFE8E1 !important; color: #FF4F28 !important; box-shadow: 0 8px 22px -6px rgba(255, 79, 40, 0.38) !important; }
.h-title { font-size: clamp(22px, 4vw, 38px); }
.h-sub { font-size: clamp(17px, 2.5vw, 20px); }
.body { font-size: clamp(15px, 1.9vw, 15px); line-height: 1.5; }
.eyebrow { font-size: clamp(11px, 1.3vw, 11px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
.small { font-size: clamp(13px, 1.5vw, 13px); }
.stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
.stage-header { flex-shrink: 0; background: #F6F4EF; padding-top: clamp(12px, 2vw, 18px); padding-bottom: clamp(8px, 1.5vw, 12px); }
.stage-content { flex: 1; padding-top: clamp(10px, 1.7vw, 16px); padding-bottom: clamp(17px, 3.4vw, 34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
.stage-nav { flex-shrink: 0; background: #F6F4EF; border-top: 1px solid rgba(167, 166, 162, 0.25); padding-top: clamp(12px, 2vw, 15px); padding-bottom: clamp(12px, 2vw, 15px); display: flex; gap: 12px; }
.chrome { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
.chrome-left { display: flex; align-items: center; gap: 10px; color: #5A5A60; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #FF4F28; box-shadow: 0 0 8px rgba(255, 79, 40, 0.55); }
.progress-track { height: 3px; background: rgba(167, 166, 162, 0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; overflow: visible; }
.progress-bar { height: 100%; background: #FF4F28; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 99px; box-shadow: 0 0 10px rgba(255, 79, 40, 0.55), 0 0 3px rgba(255, 79, 40, 0.40); }
.answer-input { font-family: 'Fraunces', serif; font-size: clamp(22px, 4vw, 27px); font-weight: 400; text-align: center; border-radius: 12px; background: #FFFFFF; padding: 8px 12px; outline: none; border: none; color: #0E0E10; transition: all 0.2s; box-shadow: 0 6px 16px -6px rgba(58, 53, 48, 0.14); }
.answer-input:focus { box-shadow: 0 10px 22px -6px rgba(255, 79, 40, 0.30), 0 0 0 1px rgba(255, 79, 40, 0.20); }
.answer-input.correct { background: #E3F0E8; color: #1F7A4D; box-shadow: 0 8px 20px -6px rgba(31, 122, 77, 0.30); }
.answer-input.wrong { background: #FFE8E1; color: #FF4F28; box-shadow: 0 8px 20px -6px rgba(255, 79, 40, 0.36); }
.frame { background: #FFFFFF; border-radius: 16px; padding: clamp(17px, 3.4vw, 30px); border: none; box-shadow: 0 8px 22px -6px rgba(58, 53, 48, 0.14); }
.frame-soft { background: #FFE8E1; border-left: 4px solid #FF4F28; border-radius: 12px; padding: clamp(14px, 2.5vw, 20px); box-shadow: 0 6px 16px -6px rgba(255, 79, 40, 0.22); }
.frame-success { background: #E3F0E8; border-left: 4px solid #1F7A4D; border-radius: 12px; padding: clamp(14px, 2.5vw, 20px); box-shadow: 0 6px 16px -6px rgba(31, 122, 77, 0.22); }
.lang-switch { position: fixed; top: 12px; right: 12px; z-index: 100; display: flex; gap: 4px; background: #FFFFFF; border-radius: 99px; padding: 3px; box-shadow: 0 3px 9px -4px rgba(58, 53, 48, 0.16), 0 1px 3px -1px rgba(58, 53, 48, 0.10); }
.lang-btn { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 99px; border: none; background: transparent; color: #5A5A60; cursor: pointer; transition: all 0.15s; letter-spacing: 0.06em; }
.lang-btn.active { background: #0E0E10; color: #F6F4EF; }
.lang-btn:hover:not(.active) { color: #0E0E10; }
@keyframes mb-pop-in { from { opacity: 0; transform: translateY(6px) scale(0.9); } to { opacity: 1; transform: none; } }
.mb-pop { display: inline-block; animation: mb-pop-in 0.32s ease-out both; }
.mb-work-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.mb-chip { background: #FFFFFF; border-radius: 10px; padding: 6px 10px; font-size: clamp(13px, 1.7vw, 15px); box-shadow: 0 4px 12px -6px rgba(58, 53, 48, 0.16); white-space: nowrap; }
.hint-toggle { background: transparent; border: 1px dashed rgba(58, 53, 48, 0.28); border-radius: 10px; padding: 8px 14px; font-size: clamp(12px, 1.5vw, 13px); font-weight: 600; color: #B25A1E; cursor: pointer; transition: all 0.15s; }
.hint-toggle:hover { border-color: rgba(178, 90, 30, 0.6); }
.sol-replay { background: #FFFFFF; border: 1px solid rgba(58, 53, 48, 0.14); border-radius: 99px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: #5A5A60; cursor: pointer; transition: color 0.15s; }
.sol-replay:hover { color: #0E0E10; }
`;