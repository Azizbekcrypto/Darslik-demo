import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// УРОК nat_5_01 — Многозначные числа, разряды и классы. 5 класс.
// Спайн: один глобальный вопрос → подача → вывод.
// Инфраструктура — из infrastructure_v1 (содержимое v15), строка-в-строку.
// Структура Screen-компонентов — по образцам etalon_v14 (v15).
// Узбекский — DRAFT, требует валидации узбекским методистом.
// ============================================================

// ============================================================
// ПАЛИТРА (из infrastructure_v1)
// ============================================================
const T = {
  bg: '#F6F4EF',
  ink: '#0E0E10',
  ink2: '#5A5A60',
  ink3: '#A7A6A2',
  paper: '#FFFFFF',
  accent: '#FF4F28',
  accentSoft: '#FFE8E1',
  success: '#1F7A4D',
  successSoft: '#E3F0E8',
  blue: '#019ACB',
  shadowBase: '58, 53, 48'
};

// ============================================================
// LANGUAGE CONTEXT + useT
// ============================================================
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

// ============================================================
// useIsMobile (design_system 5.0)
// ============================================================
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

// ============================================================
// AUDIO ENGINE
// ============================================================
class AudioEngine {
  constructor() {
    this.queue = [];
    this.currentIdx = 0;
    this.isPlaying = false;
    this.currentUtterance = null;
    this.onStateChange = null;
    this.waitingFor = null;
    this.voicesByLang = { ru: null, uz: null };
    this.voicesReady = false;
    this.currentLang = 'ru';
    this.initVoices();
  }

  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      this.voicesByLang.ru = voices.find(v => v.lang.startsWith('ru')) || voices[0];
      this.voicesByLang.uz = voices.find(v => v.lang.startsWith('uz'))
                          || voices.find(v => v.lang.startsWith('ru'))
                          || voices[0];
      this.voicesReady = true;
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  setLang(lang) {
    this.currentLang = lang;
  }

  getCurrentVoice() {
    if (!this.voicesReady && typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesByLang.ru = voices.find(v => v.lang.startsWith('ru')) || voices[0];
        this.voicesByLang.uz = voices.find(v => v.lang.startsWith('uz'))
                            || voices.find(v => v.lang.startsWith('ru'))
                            || voices[0];
        this.voicesReady = true;
      }
    }
    return this.voicesByLang[this.currentLang] || this.voicesByLang.ru || null;
  }

  hasRealUzVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    const voices = window.speechSynthesis.getVoices();
    return voices.some(v => v.lang.startsWith('uz'));
  }

  loadQueue(segments) {
    this.stop();
    this.queue = segments;
    this.currentIdx = 0;
    this.waitingFor = null;
  }

  playSegment(segment) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(segment.text);
    const wantsUz = this.currentLang === 'uz';
    const useRealUz = wantsUz && this.hasRealUzVoice();
    utterance.lang = useRealUz ? 'uz-UZ' : 'ru-RU';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    const voice = this.getCurrentVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange({ isPlaying: true, currentSegment: segment.id });
    };
    utterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null });
      this.handleSegmentEnd(segment);
    };
    utterance.onerror = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null });
    };
    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  handleSegmentEnd(segment) {
    if (segment.waits_for) {
      this.waitingFor = segment.waits_for;
      if (this.onStateChange) this.onStateChange({ isPlaying: false, waitingFor: segment.waits_for });
    } else {
      this.currentIdx++;
      this.playNext();
    }
  }

  playNext() {
    if (this.currentIdx >= this.queue.length) return;
    this.playSegment(this.queue[this.currentIdx]);
  }

  start() {
    this.currentIdx = 0;
    this.waitingFor = null;
    this.playNext();
  }

  triggerEvent(eventType, target) {
    if (!this.waitingFor) return;
    const matches = this.waitingFor.type === eventType &&
                   (this.waitingFor.target === target || !this.waitingFor.target);
    if (matches) {
      this.waitingFor = null;
      this.currentIdx++;
      this.playNext();
    }
  }

  triggerInternalEvent(eventName) {
    const nextIdx = this.queue.findIndex((s, i) => i >= this.currentIdx && s.trigger === `on_event:${eventName}`);
    if (nextIdx !== -1) {
      this.currentIdx = nextIdx;
      this.waitingFor = null;
      this.playNext();
    }
  }

  pushOneOff(text) {
    if (!text) return;
    this.queue.push({ id: `oneoff_${Date.now()}`, text, trigger: 'manual', waits_for: null });
    this.currentIdx = this.queue.length - 1;
    this.playNext();
  }

  replay() {
    if (this.currentIdx > 0) this.currentIdx--;
    this.waitingFor = null;
    this.playNext();
  }

  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this.currentUtterance = null;
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

  // Стабилизация segments по содержимому, не по ссылке (без этого cancel-loop, звук молчит)
  const segmentsRef = useRef(segments);
  const segmentsKey = segments ? JSON.stringify(segments) : '';
  const prevKeyRef = useRef(segmentsKey);
  if (prevKeyRef.current !== segmentsKey) {
    segmentsRef.current = segments;
    prevKeyRef.current = segmentsKey;
  }
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
      return () => {
        clearTimeout(timer);
        engine.stop();
      };
    }
    return () => engine.stop();
  // eslint-disable-next-line
  }, [stableSegments, lang]);

  const triggerEvent = useCallback((type, target) => {
    if (engineRef.current) engineRef.current.triggerEvent(type, target);
  }, []);
  const triggerInternal = useCallback((eventName) => {
    if (engineRef.current) engineRef.current.triggerInternalEvent(eventName);
  }, []);
  const replay = useCallback(() => {
    if (engineRef.current) engineRef.current.replay();
  }, []);
  const toggleMute = useCallback(() => {
    setState(prev => {
      const newMuted = !prev.muted;
      if (newMuted && engineRef.current) engineRef.current.stop();
      return { ...prev, muted: newMuted };
    });
  }, []);

  return { ...state, triggerEvent, triggerInternal, replay, toggleMute };
}

// Хелпер: построить audio-segments для экрана из CONTENT
const makeAudioSegments = (screenContent, lang) => {
  if (Array.isArray(screenContent.audio?.[lang])) {
    return screenContent.audio[lang].map((text, i) => ({
      id: `aud_${i}`,
      text,
      trigger: i === 0 ? 'on_mount' : (i === 1 ? 'after_previous' : `on_event:step_${i - 1}`),
      waits_for: i < screenContent.audio[lang].length - 1
        ? { type: 'button_click', target: 'step' }
        : { type: 'button_click', target: 'next' }
    }));
  }
  const text = screenContent.audio?.[lang];
  if (!text) return [];
  return [{ id: 'aud_0', text, trigger: 'on_mount', waits_for: null }];
};

// ============================================================
// БАЗОВЫЕ КОМПОНЕНТЫ
// ============================================================
const Op = React.memo(({ children, size = 'mid' }) => {
  const fontSize = size === 'big' ? 'clamp(25px, 4.7vw, 38px)' :
                   size === 'mid' ? 'clamp(16px, 3vw, 27px)' :
                   'clamp(12px, 2.1vw, 18px)';
  return <span className="mop" style={{ fontSize }}>{children}</span>;
});

const Frac = React.memo(({ n, d, color, size = 'sm' }) => (
  <span className={`frac frac-${size}`} style={{ color }}>
    <span className="n">{n}</span>
    <span className="bar"/>
    <span className="d">{d}</span>
  </span>
));

const AudioIndicator = ({ audioState }) => {
  const { isPlaying, muted, replay, toggleMute } = audioState;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={toggleMute} title={muted ? 'Sound on' : 'Sound off'}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: muted ? T.ink3 : (isPlaying ? T.accent : T.ink2) }}>
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
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
        setTimeout(() => {
          if (ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 350);
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

// Slider — компонент v15 с track-wrap + track-bg + track-fill + glow
const Slider = ({ value, min, max, step = 1, onChange, disabled = false }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="track-wrap">
      <div className="track-bg"/>
      <div className="track-fill" style={{ width: `${pct}%` }}/>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input"
      />
    </div>
  );
};

// Stage — progress + chrome вынесены в отдельный stage-header (sticky, flex-shrink: 0)
const Stage = ({ children, eyebrow, screen, totalScreens, navContent, audioState }) => {
  const t = useT();
  const isMobile = useIsMobile();
  const padH = isMobile ? 12 : 100;
  return (
    <div className="stage">
      <div className="stage-header" style={{ paddingLeft: padH, paddingRight: padH }}>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${((screen + 1) / totalScreens) * 100}%` }}/>
        </div>
        <div className="chrome">
          <div className="chrome-left eyebrow">
            <span className="dot"/>
            <span>{t(eyebrow)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {audioState && <AudioIndicator audioState={audioState}/>}
            <div className="mono small" style={{ color: T.ink3 }}>
              {String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>
      <div className="stage-content" style={{ paddingLeft: padH, paddingRight: padH }}>
        {children}
      </div>
      {navContent && <div className="stage-nav" style={{ paddingLeft: padH, paddingRight: padH }}>{navContent}</div>}
    </div>
  );
};

const NavBack = ({ onPrev, label = 'Назад' }) => (
  <button className="btn-ghost" onClick={onPrev}
    style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(15px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
    {label}
  </button>
);

const NavNext = ({ disabled, label, onClick }) => (
  <button className="btn-white-accent" disabled={disabled} onClick={onClick}
    style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)', marginLeft: 'auto' }}>
    {label}
  </button>
);

const NextLabel = () => {
  const lang = useLang();
  return lang === 'uz' ? 'Davom etish' : 'Дальше';
};

const BackLabel = () => {
  const lang = useLang();
  return lang === 'uz' ? 'Orqaga' : 'Назад';
};

// ============================================================
// QUESTION SCREEN — универсальный MC-компонент под формат audio: { intro, on_correct, on_wrong }
// ============================================================
const QuestionScreen = ({ screen, idx, totalScreens, screenMeta, screenContent, question, options, correctIdx, storedAnswer, onAnswer, onNext, onPrev }) => {
  const lang = useLang();
  const t = useT();
  const c = screenContent;

  const audio = useAudio([{
    id: `s${idx}_intro`,
    text: c.audio.intro[lang],
    trigger: 'on_mount',
    waits_for: { type: 'option_picked' }
  }]);

  const [picked, setPicked] = useState(storedAnswer?.studentAnswerIndex ?? null);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);

  const pick = (i) => {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    const isCorrect = i === correctIdx;
    onAnswer({
      stage: screenMeta?.scope ?? null,
      screenIdx: idx,
      question: typeof question === 'string' ? question : null,
      options: options.map(o => typeof o === 'string' ? o : null),
      correctIndex: correctIdx,
      correctAnswer: typeof options[correctIdx] === 'string' ? options[correctIdx] : null,
      studentAnswerIndex: i,
      studentAnswer: typeof options[i] === 'string' ? options[i] : null,
      correct: isCorrect
    });
    audio.triggerEvent('option_picked');

    if (!audio.muted) {
      setTimeout(() => {
        const engine = getAudioEngine();
        if (engine && !audio.muted) {
          const fbAudio = isCorrect ? c.audio.on_correct[lang] : c.audio.on_wrong[lang];
          engine.pushOneOff(fbAudio);
        }
      }, 300);
    }
  };

  const navContent = (
    <>
      <NavBack onPrev={onPrev} label={<BackLabel/>}/>
      <NavNext disabled={!revealed} onClick={onNext} label={<NextLabel/>}/>
    </>
  );

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(17px, 2.5vw, 24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (revealed) {
              if (i === correctIdx) cls += ' option-correct';
              else if (i === picked) cls += ' option-picked-wrong';
              else cls += ' option-wrong';
            }
            return (
              <button key={i} className={cls} disabled={revealed} onClick={() => pick(i)}
                style={{ padding: 'clamp(12px, 1.7vw, 15px) clamp(14px, 2.1vw, 19px)', fontSize: 'clamp(13px, 1.6vw, 14px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: revealed && i === correctIdx ? T.success : T.ink3 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={revealed} isCorrect={picked === correctIdx}>
          <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: picked === correctIdx ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {picked === correctIdx ? (lang === 'uz' ? "To'g'ri" : 'Верно') : (lang === 'uz' ? "Noto'g'ri" : 'Не совсем')}
          </p>
          <p className="body" style={{ margin: 0 }}>
            {picked === correctIdx
              ? t(c.correct_text)
              : t(c[`wrong_${picked}`] || c.wrong_default)}
          </p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ============================================================
// LESSON META + SCREEN META
// ============================================================
// CONTENT — урок nat_5_01 «Зачем различать и читать числа», 5 класс (переработка).
// Спайн: мотивационный вопрос «зачем» → механика как инструмент → вывод-«зачем».
// 15 экранов. Вход для jsx-builder.
// UZ — DRAFT, требует валидации узбекским методистом. RU — на «ты», UZ — siz.

// CONTENT — урок nat_5_01 «Огромные числа вокруг нас», 5 класс (кейс-первый).
// Спайн: открытие расстоянием Земля-Солнце → разворот темы → космическая нить → кольцевой вывод.
// 14 экранов. Вход для jsx-builder.
// Центральный вопрос: как прочитать и представить огромные числа вокруг нас.
// UZ — DRAFT, требует валидации узбекским методистом. RU — на «ты», UZ — siz.
// Нить чисел: Луна 384 400 → диаметр Солнца 1 392 000 → Солнце 149 600 000 → скорость света 299 792 458.

// CONTENT — урок nat_5_01 «Огромные числа вокруг нас», 5 класс (кейс-первый).
// Спайн: открытие расстоянием Земля-Солнце → разворот темы → космическая нить → кольцевой вывод.
// 14 экранов. Вход для jsx-builder.
// Центральный вопрос: как прочитать и представить огромные числа вокруг нас.
// UZ — DRAFT, требует валидации узбекским методистом. RU — на «ты», UZ — siz.
// Нить чисел: Луна 384 400 → диаметр Солнца 1 392 000 → Солнце 149 600 000 → скорость света 299 792 458.

const LESSON_META = {
  lessonId: 'nat-5-01-v4',
  lessonTitle: {
    ru: 'Огромные числа вокруг нас',
    uz: 'Atrofimizdagi katta sonlar'
  }
};

const CONTENT = {
  // ───────── s0 · hook · открытие: расстояние до Солнца
  s0: {
    eyebrow: { ru: 'Вопрос урока', uz: 'Dars savoli' },
    title_part1: { ru: 'Как', uz: "Atrofimizdagi" },
    title_part2_em: { ru: 'прочитать и представить', uz: "katta sonlarni" },
    title_part3: { ru: 'огромные числа вокруг нас?', uz: "qanday o'qish va tasavvur qilish mumkin?" },
    sub: { ru: 'Земля летит вокруг Солнца. А как далеко до него?', uz: "Yer Quyosh atrofida aylanadi. Ungacha qancha masofa bor?" },
    fact_label: { ru: 'Расстояние от Земли до Солнца, км', uz: 'Yerdan Quyoshgacha masofa, km' },
    fact_value: { ru: '149 600 000', uz: '149 600 000' },
    opt_yes: { ru: 'Легко прочту', uz: "Bemalol o'qiyman" },
    opt_no: { ru: 'Пока трудно', uz: 'Hozircha qiyin' },
    opt_idk: { ru: 'Хочу научиться', uz: "O'rganmoqchiman" },
    audio: {
      intro: {
        ru: 'Земля летит вокруг Солнца. Расстояние до Солнца — сто сорок девять миллионов шестьсот тысяч километров. Прочитать такое число с ходу трудно. Главный вопрос урока: как прочитать и представить себе огромные числа вокруг нас? К концу урока ты сможешь сам.',
        uz: "Yer Quyosh atrofida aylanadi. Quyoshgacha masofa — bir yuz qirq to'qqiz million olti yuz ming kilometr. Bunday sonni darrov o'qish qiyin. Darsning asosiy savoli: atrofimizdagi katta sonlarni qanday o'qish va tasavvur qilish mumkin? Dars oxirida buni o'zingiz uddalaysiz."
      },
      on_correct: { ru: 'Тогда начнём.', uz: "Unda boshlaymiz." },
      on_wrong: { ru: 'Тогда начнём.', uz: "Unda boshlaymiz." }
    }
  },

  // ───────── s1 · exploration · классы (на числе Солнца)
  s1: {
    eyebrow: { ru: 'Открытие', uz: 'Kashfiyot' },
    title: { ru: 'Разбиваем число на классы', uz: 'Sonni sinflarga ajratamiz' },
    lead: { ru: 'Чтобы прочитать это число, разделим его на группы по три цифры справа.', uz: "Bu sonni o'qish uchun uni o'ngdan uch xonadan guruhlarga ajratamiz." },
    number_grouped: { ru: '149 600 000', uz: '149 600 000' },
    step_1: { ru: 'Группа справа — класс единиц.', uz: "O'ngdagi guruh — birlar sinfi." },
    step_2: { ru: 'Следующая — класс тысяч.', uz: "Keyingisi — minglar sinfi." },
    step_3: { ru: 'Слева — класс миллионов.', uz: "Chapda — millionlar sinfi." },
    audio: {
      ru: [
        'Поставим пробелы через каждые три цифры, считая справа. Первая группа справа это класс единиц.',
        'Следующая группа это класс тысяч.',
        'А слева стоит класс миллионов. Теперь число читается по группам.'
      ],
      uz: [
        "O'ngdan boshlab har uch xonadan keyin bo'sh joy qo'yamiz. O'ngdagi birinchi guruh bu birlar sinfi.",
        "Keyingi guruh bu minglar sinfi.",
        "Chapda esa millionlar sinfi turadi. Endi son guruhlar bo'yicha o'qiladi."
      ]
    }
  },

  // ───────── s2 · rule · класс
  s2: {
    eyebrow: { ru: 'Правило', uz: 'Qoida' },
    title: { ru: 'Класс', uz: 'Sinf' },
    rule_text: { ru: 'Многозначное число делят на классы по три разряда, считая справа налево. Каждый класс — это группа из трёх цифр.', uz: "Ko'p xonali son o'ngdan chapga uch xonadan sinflarga ajratiladi. Har bir sinf — uchta raqamdan iborat guruh." },
    example: { ru: '149 600 000  →  149 | 600 | 000', uz: '149 600 000  →  149 | 600 | 000' },
    audio: {
      ru: 'Запомним правило. Многозначное число делят на классы по три разряда, считая справа налево. Каждый класс — это группа из трёх цифр.',
      uz: "Qoidani eslab qolamiz. Ko'p xonali son o'ngdan chapga uch xonadan sinflarga ajratiladi. Har bir sinf — uchta raqamdan iborat guruh."
    }
  },

  // ───────── s3 · test choice · раздели 384 400 (Луна)
  s3: {
    eyebrow: { ru: 'Тренировка', uz: 'Mashq' },
    label: { ru: '1', uz: '1' },
    context: { ru: 'Расстояние от Земли до Луны.', uz: 'Yerdan Oygacha masofa.' },
    prompt: { ru: 'Как думаешь, где поставить пробелы, чтобы число читалось правильно?', uz: "Sizningcha, son to'g'ri o'qilishi uchun bo'sh joylarni qayerga qo'yish kerak?" },
    raw: '384400',
    correct: '384 400',
    hint: { ru: 'Отсчитай три цифры справа и поставь пробел перед ними.', uz: "O'ngdan uchta xonani sanang va ulardan oldin bo'sh joy qo'ying." },
    fb_correct: { ru: 'Верно. Пробел через три цифры справа: 384 400 — триста восемьдесят четыре тысячи четыреста.', uz: "To'g'ri. Bo'sh joy o'ngdan uch xonadan keyin: 384 400 — uch yuz sakson to'rt ming to'rt yuz." },
    reveal_note: { ru: '384 400 км — это среднее расстояние от Земли до Луны.', uz: "384 400 km — bu Yerdan Oygacha o'rtacha masofa." },
    audio: {
      intro: { ru: 'Поставь пробелы так, чтобы число делилось на классы и читалось правильно.', uz: "Son sinflarga bo'linib, to'g'ri o'qilishi uchun bo'sh joylarni qo'ying." },
      on_correct: { ru: 'Верно, ты поставил пробел правильно. Через три цифры справа число делится на классы и читается как триста восемьдесят четыре тысячи четыреста.', uz: "To'g'ri, bo'sh joyni to'g'ri qo'ydingiz. O'ngdan uch xonadan keyin son sinflarga bo'linadi va uch yuz sakson to'rt ming to'rt yuz deb o'qiladi." },
      on_wrong: { ru: 'Не совсем.', uz: "Unchalik emas." }
    }
  },

  // ───────── s4 · exploration · три разряда в классе
  s4: {
    eyebrow: { ru: 'Открытие', uz: 'Kashfiyot' },
    title: { ru: 'Три разряда в каждом классе', uz: 'Har bir sinfda uchta xona' },
    lead: { ru: 'Заглянем внутрь одного класса. В нём всегда три разряда.', uz: "Bitta sinfning ichiga qaraymiz. Unda doimo uchta xona bo'ladi." },
    step_1: { ru: 'Справа — разряд единиц.', uz: "O'ngda — birlar xonasi." },
    step_2: { ru: 'Слева от него — разряд десятков.', uz: "Uning chap tomonida — o'nlar xonasi." },
    step_3: { ru: 'Дальше — разряд сотен.', uz: "Undan keyin — yuzlar xonasi." },
    table_note: { ru: 'Эти три разряда повторяются в каждом классе: единицы, тысячи, миллионы.', uz: "Bu uch xona har bir sinfda takrorlanadi: birlar, minglar, millionlar." },
    audio: {
      ru: [
        'Заглянем внутрь одного класса. В каждом классе всегда три разряда, и считаем их справа налево. Самый правый разряд это единицы.',
        'Слева от единиц стоит разряд десятков. Он показывает, сколько в числе десятков.',
        'Ещё левее разряд сотен. Эти три разряда повторяются в каждом классе, поэтому любое число читается по одному правилу.'
      ],
      uz: [
        "Bitta sinfning ichiga qaraymiz. Har bir sinfda doimo uchta xona bor, va ularni o'ngdan chapga sanaymiz. Eng o'ngdagi xona bu birlar.",
        "Birlardan chapda o'nlar xonasi turadi. U sonda nechta o'nlik borligini ko'rsatadi.",
        "Undan ham chapda yuzlar xonasi. Bu uchta xona har bir sinfda takrorlanadi, shuning uchun har qanday son bitta qoida bilan o'qiladi."
      ]
    }
  },

  // ───────── s5 · rule · как читать
  s5: {
    eyebrow: { ru: 'Правило', uz: 'Qoida' },
    title: { ru: 'Как читать число', uz: "Sonni qanday o'qiladi" },
    rule_text: { ru: 'Читаем слева направо: называем число в каждом классе и добавляем название класса. Класс единиц название не получает.', uz: "Chapdan o'ngga o'qiymiz: har bir sinfdagi sonni aytamiz va sinf nomini qo'shamiz. Birlar sinfining nomi aytilmaydi." },
    example: { ru: '384 400  →  триста восемьдесят четыре тысячи четыреста', uz: "384 400  →  uch yuz sakson to'rt ming to'rt yuz" },
    audio: {
      ru: 'Правило чтения. Идём слева направо, называем число в каждом классе и добавляем название класса. Класс единиц название не получает.',
      uz: "O'qish qoidasi. Chapdan o'ngga boramiz, har bir sinfdagi sonni aytamiz va sinf nomini qo'shamiz. Birlar sinfining nomi aytilmaydi."
    }
  },

  // ───────── s6 · test choice · прочитай 384 400
  s6: {
    eyebrow: { ru: 'Тренировка', uz: 'Mashq' },
    label: { ru: '2', uz: '2' },
    context: { ru: 'То же расстояние до Луны.', uz: "O'sha Oygacha masofa." },
    question: { ru: 'Как читается это число?', uz: "Bu son qanday o'qiladi?" },
    number_display: { ru: '384 400', uz: '384 400' },
    options: [
      { ru: 'тридцать восемь тысяч четыреста сорок', uz: "o'ttiz sakkiz ming to'rt yuz qirq" },
      { ru: 'триста восемьдесят четыре четыреста', uz: "uch yuz sakson to'rt to'rt yuz" },
      { ru: 'триста восемьдесят четыре тысячи четыреста', uz: "uch yuz sakson to'rt ming to'rt yuz" },
      { ru: 'триста восемьдесят четыре тысячи сорок', uz: "uch yuz sakson to'rt ming qirq" }
    ],
    correctIndex: 2,
    correct_text: { ru: 'Правильно. В классе тысяч 384, в классе единиц 400.', uz: "To'g'ri. Minglar sinfida 384, birlar sinfida 400." },
    wrong_0: { ru: 'Группы отсчитаны неверно. В классе тысяч стоит 384 — триста восемьдесят четыре тысячи.', uz: "Guruhlar noto'g'ri sanaldi. Minglar sinfida 384 turibdi — uch yuz sakson to'rt ming." },
    wrong_1: { ru: 'Пропущено название класса тысяч. Число 384 стоит в классе тысяч.', uz: "Minglar sinfining nomi tushirib qoldirilgan. 384 minglar sinfida turibdi." },
    wrong_3: { ru: 'Число 400 прочитано как 40 — потерян ноль. В классе единиц четыреста, а не сорок.', uz: "400 soni 40 deb o'qildi — nol yo'qoldi. Birlar sinfida to'rt yuz turibdi, qirq emas." },
    hint: { ru: 'Назови число в каждом классе и добавь имя класса. Класс единиц не называют.', uz: "Har bir sinfdagi sonni ayting va sinf nomini qo'shing. Birlar sinfi aytilmaydi." },
    audio: {
      intro: { ru: 'Прочитай число на экране. Выбери, как оно читается.', uz: "Ekrandagi sonni o'qing. U qanday o'qilishini tanlang." },
      on_correct: { ru: 'Верно, ты выбрал правильно. В классе тысяч триста восемьдесят четыре, в классе единиц четыреста, поэтому число читается триста восемьдесят четыре тысячи четыреста.', uz: "To'g'ri, to'g'ri tanladingiz. Minglar sinfida uch yuz sakson to'rt, birlar sinfida to'rt yuz, shuning uchun son uch yuz sakson to'rt ming to'rt yuz deb o'qiladi." },
      on_wrong: { ru: 'Не совсем.', uz: "Unchalik emas." }
    }
  },

  // ───────── s7 · exploration · роль нуля = масштаб
  s7: {
    eyebrow: { ru: 'Открытие', uz: 'Kashfiyot' },
    title: { ru: 'Ноль и масштаб', uz: 'Nol va kattalik' },
    lead: { ru: 'Вернёмся к расстоянию до Солнца и уберём один ноль.', uz: "Quyoshgacha masofaga qaytamiz va bitta nolni olib tashlaymiz." },
    number_a: { ru: '149 600 000', uz: '149 600 000' },
    number_b: { ru: '14 960 000', uz: '14 960 000' },
    step_1: { ru: 'В числе много нулей — они держат разряды.', uz: "Sonda nollar ko'p — ular xonalarni ushlab turadi." },
    step_2: { ru: 'Уберём один ноль — все цифры сдвинутся вправо.', uz: "Bitta nolni olib tashlasak — barcha raqamlar o'ngga suriladi." },
    step_3: { ru: 'Получилось 14 960 000 — в десять раз меньше. Ноль выбрасывать нельзя.', uz: "14 960 000 hosil bo'ldi — o'n barobar kichik. Nolni tashlab bo'lmaydi." },
    audio: {
      ru: [
        'Вернёмся к расстоянию до Солнца. В этом числе много нулей, и они держат разряды.',
        'Уберём всего один ноль, и все цифры сдвинутся вправо.',
        'Получится четырнадцать миллионов девятьсот шестьдесят тысяч, в десять раз меньше. Значит, ноль выбрасывать нельзя.'
      ],
      uz: [
        "Quyoshgacha masofaga qaytamiz. Bu sonda nollar ko'p va ular xonalarni ushlab turadi.",
        "Atigi bitta nolni olib tashlaymiz, va barcha raqamlar o'ngga suriladi.",
        "O'n to'rt million to'qqiz yuz oltmish ming hosil bo'ladi, o'n barobar kichik. Demak, nolni tashlab bo'lmaydi."
      ]
    }
  },

  // ───────── s8 · rule · ноль держит разряд
  s8: {
    eyebrow: { ru: 'Правило', uz: 'Qoida' },
    title: { ru: 'Ноль держит разряд', uz: 'Nol xonani ushlab turadi' },
    rule_text: { ru: 'Если разряд пустой, в нём пишут ноль. Выбросить такой ноль нельзя — иначе остальные цифры сдвинутся и число изменится.', uz: "Agar xona bo'sh bo'lsa, unga nol yoziladi. Bunday nolni tashlab yuborib bo'lmaydi — aks holda qolgan raqamlar suriladi va son o'zgaradi." },
    example: { ru: '149 600 000  —  это не то же самое, что  14 960 000', uz: "149 600 000  —  bu 14 960 000 bilan bir xil emas" },
    audio: {
      ru: 'Запомним. Если разряд пустой, в нём пишут ноль. Такой ноль выбрасывать нельзя: иначе остальные цифры сдвинутся и число станет другим.',
      uz: "Eslab qolamiz. Agar xona bo'sh bo'lsa, unga nol yoziladi. Bunday nolni tashlab bo'lmaydi: aks holda qolgan raqamlar suriladi va son boshqacha bo'lib qoladi."
    }
  },

  // ───────── s9 · test input · запиши 1 392 000 (диаметр Солнца)
  s9: {
    eyebrow: { ru: 'Тренировка', uz: 'Mashq' },
    label: { ru: '3', uz: '3' },
    context: { ru: 'Диаметр Солнца, км.', uz: 'Quyosh diametri, km.' },
    prompt: { ru: 'Запиши цифрами: один миллион триста девяносто две тысячи.', uz: "Raqamlar bilan yozing: bir million uch yuz to'qson ikki ming." },
    placeholder: { ru: '0', uz: '0' },
    answer: '1392000',
    fb_correct: { ru: 'Правильно. Миллионы — 1, тысячи — 392, класс единиц пуст и держится нулями — 000.', uz: "To'g'ri. Millionlar — 1, minglar — 392, birlar sinfi bo'sh va nollar bilan ushlab turibdi — 000." },
    fb_wrong: { ru: 'Проверь класс единиц. Он пустой и держится тремя нулями: миллионы 1, тысячи 392, единицы 000. Получается 1 392 000.', uz: "Birlar sinfini tekshiring. U bo'sh va uchta nol bilan ushlanadi: millionlar 1, minglar 392, birlar 000. Natijada 1 392 000 chiqadi." },
    hint: { ru: 'Класс единиц здесь пустой, держи его тремя нулями.', uz: "Bu yerda birlar sinfi bo'sh, uni uchta nol bilan ushlang." },
    audio: {
      intro: { ru: 'Запиши цифрами число один миллион триста девяносто две тысячи. Потом нажми кнопку проверить.', uz: "Bir million uch yuz to'qson ikki ming sonini raqamlar bilan yozing. Keyin tekshirish tugmasini bosing." },
      on_correct: { ru: 'Верно, ты записал правильно. Один миллион, в классе тысяч триста девяносто два, и класс единиц из трёх нулей.', uz: "To'g'ri, to'g'ri yozdingiz. Bir million, minglar sinfida uch yuz to'qson ikki, va uchta noldan iborat birlar sinfi." },
      on_wrong: { ru: 'Не совсем.', uz: "Unchalik emas." }
    }
  },

  // ───────── s10 · exploration · скорость света (плотное число)
  s10: {
    eyebrow: { ru: 'Открытие', uz: 'Kashfiyot' },
    title: { ru: 'Самое плотное число', uz: 'Eng zich son' },
    lead: { ru: 'Скорость света — двести девяносто девять миллионов семьсот девяносто две тысячи четыреста пятьдесят восемь метров в секунду. Ни одного нуля. Читаем по классам.', uz: "Yorug'lik tezligi — sekundiga ikki yuz to'qson to'qqiz million yetti yuz to'qson ikki ming to'rt yuz ellik sakkiz metr. Birorta ham nol yo'q. Sinflar bo'yicha o'qiymiz." },
    number_grouped: { ru: '299 792 458', uz: '299 792 458' },
    step_1: { ru: 'Класс миллионов — 299.', uz: 'Millionlar sinfi — 299.' },
    step_2: { ru: 'Класс тысяч — 792.', uz: 'Minglar sinfi — 792.' },
    step_3: { ru: 'Класс единиц — 458.', uz: 'Birlar sinfi — 458.' },
    audio: {
      ru: [
        'Скорость света очень плотное число, в нём нет ни одного нуля. В классе миллионов двести девяносто девять.',
        'В классе тысяч семьсот девяносто два.',
        'В классе единиц четыреста пятьдесят восемь. Читаем слева направо и получаем всё число.'
      ],
      uz: [
        "Yorug'lik tezligi juda zich son, unda birorta ham nol yo'q. Millionlar sinfida ikki yuz to'qson to'qqiz.",
        "Minglar sinfida yetti yuz to'qson ikki.",
        "Birlar sinfida to'rt yuz ellik sakkiz. Chapdan o'ngga o'qib, butun sonni olamiz."
      ]
    }
  },

  // ───────── s11 · test choice · прочитай 299 792 458 (final)
  s11: {
    eyebrow: { ru: 'Итог', uz: 'Yakun' },
    label: { ru: '1', uz: '1' },
    prompt: { ru: 'Сопоставь каждое число с его прочтением. Перетащи прочтение к числу.', uz: "Har bir sonni o'z o'qilishi bilan moslang. O'qilishini songa torting." },
    pairs: [
      { number: '384 400', label: { ru: 'Луна — расстояние от Земли, км', uz: "Oy — Yergacha masofa, km" }, reading: { ru: 'триста восемьдесят четыре тысячи четыреста', uz: "uch yuz sakson to'rt ming to'rt yuz" } },
      { number: '1 392 000', label: { ru: 'диаметр Солнца', uz: 'Quyosh diametri' }, reading: { ru: 'один миллион триста девяносто две тысячи', uz: "bir million uch yuz to'qson ikki ming" } },
      { number: '299 792 458', label: { ru: 'скорость света', uz: "yorug'lik tezligi" }, reading: { ru: 'двести девяносто девять миллионов семьсот девяносто две тысячи четыреста пятьдесят восемь', uz: "ikki yuz to'qson to'qqiz million yetti yuz to'qson ikki ming to'rt yuz ellik sakkiz" } }
    ],
    hint: { ru: 'Раздели каждое число на классы по три справа и прочитай по классам.', uz: "Har bir sonni o'ngdan uch xonadan sinflarga ajrating va sinflar bo'yicha o'qing." },
    fb_correct: { ru: 'Верно. Все числа урока прочитаны по классам.', uz: "To'g'ri. Darsdagi barcha sonlar sinflar bo'yicha o'qildi." },
    audio: {
      intro: { ru: 'Сопоставь каждое число с тем, как оно читается.', uz: "Har bir sonni qanday o'qilishi bilan moslang." },
      on_correct: { ru: 'Верно, все числа сопоставлены правильно. Каждое прочитано по классам слева направо.', uz: "To'g'ri, barcha sonlar to'g'ri moslandi. Har biri chapdan o'ngga sinflar bo'yicha o'qildi." },
      on_wrong: { ru: 'Не совсем.', uz: "Unchalik emas." }
    }
  },

  // ───────── s12 · test input · запиши 149 600 000 (кольцо, final)
  s12: {
    eyebrow: { ru: 'Итог', uz: 'Yakun' },
    label: { ru: '2', uz: '2' },
    context: { ru: 'Снова расстояние до Солнца, км.', uz: "Yana Quyoshgacha masofa, km." },
    prompt: { ru: 'Запиши цифрами: сто сорок девять миллионов шестьсот тысяч.', uz: "Raqamlar bilan yozing: bir yuz qirq to'qqiz million olti yuz ming." },
    placeholder: { ru: '0', uz: '0' },
    answer: '149600000',
    fb_correct: { ru: 'Правильно. Миллионы — 149, тысячи — 600, класс единиц пуст — 000. Получается 149 600 000.', uz: "To'g'ri. Millionlar — 149, minglar — 600, birlar sinfi bo'sh — 000. Natijada 149 600 000." },
    fb_wrong: { ru: 'Проверь нули. Миллионы 149, тысячи 600, класс единиц держится тремя нулями. Получается 149 600 000.', uz: "Nollarni tekshiring. Millionlar 149, minglar 600, birlar sinfi uchta nol bilan ushlanadi. Natijada 149 600 000 chiqadi." },
    hint: { ru: 'Не теряй нули. После шестисот тысяч идёт пустой класс единиц.', uz: "Nollarni yo'qotmang. Olti yuz mingdan keyin bo'sh birlar sinfi keladi." },
    audio: {
      intro: { ru: 'Запиши цифрами расстояние до Солнца: сто сорок девять миллионов шестьсот тысяч. Потом нажми кнопку проверить.', uz: "Quyoshgacha masofani raqamlar bilan yozing: bir yuz qirq to'qqiz million olti yuz ming. Keyin tekshirish tugmasini bosing." },
      on_correct: { ru: 'Верно, ты записал правильно. Сто сорок девять миллионов, шестьсот тысяч, и класс единиц из трёх нулей.', uz: "To'g'ri, to'g'ri yozdingiz. Bir yuz qirq to'qqiz million, olti yuz ming, va uchta noldan iborat birlar sinfi." },
      on_wrong: { ru: 'Не совсем.', uz: "Unchalik emas." }
    }
  },

  // ───────── s13 · summary · ответ на вопрос (кольцо к Солнцу)
  s13: {
    eyebrow: { ru: 'Вывод', uz: 'Xulosa' },
    title: { ru: 'Теперь ты можешь прочитать любое огромное число', uz: "Endi istalgan katta sonni o'qiy olasiz" },
    question_recall: { ru: 'Как прочитать и представить огромные числа вокруг нас?', uz: "Atrofimizdagi katta sonlarni qanday o'qish va tasavvur qilish mumkin?" },
    answer_1: { ru: 'Разбей число на классы по три цифры справа.', uz: "Sonni o'ngdan uch xonadan sinflarga ajrating." },
    answer_2: { ru: 'В каждом классе три разряда: сотни, десятки, единицы.', uz: "Har bir sinfda uchta xona: yuzlar, o'nlar, birlar." },
    answer_3: { ru: 'Читай слева направо по классам.', uz: "Chapdan o'ngga sinflar bo'yicha o'qing." },
    answer_4: { ru: 'Ноль держит разряд — без него число в разы меньше.', uz: "Nol xonani ushlaydi — usiz son necha barobar kichik bo'ladi." },
    answer_5: { ru: 'Так читается даже расстояние до Солнца — сто сорок девять миллионов шестьсот тысяч.', uz: "Shunday qilib hatto Quyoshgacha masofa ham o'qiladi — bir yuz qirq to'qqiz million olti yuz ming." },
    score_label: { ru: 'Правильных ответов', uz: "To'g'ri javoblar" },
    learned_title: { ru: 'Что ты теперь умеешь', uz: 'Endi nimani uddalaysiz' },
    learned: { ru: 'Читать и записывать многозначные числа до сотен миллионов и понимать их масштаб.', uz: "Yuz millionlargacha ko'p xonali sonlarni o'qish, yozish va ularning kattaligini tushunish." },
    forward: { ru: 'Скоро эти же разряды продолжатся вправо от запятой — в десятичных дробях.', uz: "Tez orada o'sha xonalar vergulning o'ng tomonida davom etadi — o'nli kasrlarda." },
    audio: {
      ru: [
        'Вернёмся к вопросу урока: как прочитать и представить огромные числа вокруг нас.',
        'Разбиваем число на классы по три цифры справа, в каждом классе три разряда, и читаем слева направо.',
        'Ноль держит пустой разряд, и выбрасывать его нельзя, иначе число станет в разы меньше.',
        'Теперь даже расстояние до Солнца тебе по силам. Скоро эти разряды продолжатся в десятичных дробях.'
      ],
      uz: [
        "Dars savoliga qaytamiz: atrofimizdagi katta sonlarni qanday o'qish va tasavvur qilish mumkin.",
        "Sonni o'ngdan uch xonadan sinflarga ajratamiz, har bir sinfda uchta xona, va chapdan o'ngga o'qiymiz.",
        "Nol bo'sh xonani ushlaydi, uni tashlab bo'lmaydi, aks holda son necha barobar kichik bo'lib qoladi.",
        "Endi hatto Quyoshgacha masofa ham qo'lingizdan keladi. Tez orada bu xonalar o'nli kasrlarda davom etadi."
      ]
    }
  }
};

const TOTAL_SCREENS = 14;

const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'MCScreen',       scored: false, scope: 'hook' },
  { id: 's1',  type: 'exploration', template: 'custom',         scored: false, scope: null },
  { id: 's2',  type: 'rule',        template: 'custom',         scored: false, scope: null },
  { id: 's3',  type: 'test',        template: 'custom',         scored: true,  scope: 'module-mikro' },
  { id: 's4',  type: 'exploration', template: 'custom',         scored: false, scope: null },
  { id: 's5',  type: 'rule',        template: 'custom',         scored: false, scope: null },
  { id: 's6',  type: 'test',        template: 'custom',         scored: true,  scope: 'module-mikro' },
  { id: 's7',  type: 'exploration', template: 'custom',         scored: false, scope: null },
  { id: 's8',  type: 'rule',        template: 'custom',         scored: false, scope: null },
  { id: 's9',  type: 'test',        template: 'NumInputScreen', scored: true,  scope: 'module-mikro' },
  { id: 's10', type: 'exploration', template: 'custom',         scored: false, scope: null },
  { id: 's11', type: 'test',        template: 'custom',         scored: true,  scope: 'final' },
  { id: 's12', type: 'test',        template: 'NumInputScreen', scored: true,  scope: 'final' },
  { id: 's13', type: 'summary',     template: 'custom',         scored: false, scope: null }
];

// ============================================================
// АНИМАЦИОННЫЕ ХЕЛПЕРЫ
// ============================================================
const fmtNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf, start = null;
    const tick = (t) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick); else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}
const CountUp = ({ target, duration, style, className }) => {
  const v = useCountUp(target, duration);
  return <span className={className} style={style}>{fmtNum(v)}</span>;
};
const AnimatedDigits = ({ text, color }) => (
  <div className="display" style={{ fontSize: 'clamp(34px, 7vw, 58px)', letterSpacing: '0.04em', color: color || T.ink, textAlign: 'center', wordBreak: 'break-word' }}>
    {text.split('').map((ch, i) => <span key={i} className="fade-up" style={{ display: 'inline-block', animationDelay: `${i * 0.05}s` }}>{ch}</span>)}
  </div>
);
const BigNumber = ({ text, color }) => (
  <div className="display" style={{ fontSize: 'clamp(34px, 7vw, 58px)', letterSpacing: '0.04em', color: color || T.ink, textAlign: 'center', wordBreak: 'break-word' }}>{text}</div>
);
const GroupingReveal = ({ groups, color, active = -1 }) => (
  <div className="display" style={{ fontSize: 'clamp(30px, 6vw, 52px)', letterSpacing: '0.02em', color: color || T.ink, textAlign: 'center', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 'clamp(8px, 1.6vw, 16px)' }}>
    {groups.map((g, i) => (
      <span key={i} className="lesson-group cls-cell" style={{ animationDelay: `${(groups.length - 1 - i) * 0.14}s`, background: active === i ? T.accentSoft : 'transparent', color: active === i ? T.accent : (color || T.ink), padding: '2px 8px' }}>{g}</span>
    ))}
  </div>
);
const ZeroMorph = ({ a, b, collapsed }) => (
  <div style={{ position: 'relative', height: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span className="display" style={{ position: 'absolute', fontSize: 'clamp(30px, 6vw, 50px)', letterSpacing: '0.02em', color: T.ink, transition: 'opacity 0.5s ease', opacity: collapsed ? 0 : 1 }}>{a}</span>
    <span className="display" style={{ position: 'absolute', fontSize: 'clamp(30px, 6vw, 50px)', letterSpacing: '0.02em', color: T.accent, transition: 'opacity 0.5s ease', opacity: collapsed ? 1 : 0 }}>{b}</span>
  </div>
);
const OrbitDiagram = ({ small }) => (
  <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: small ? 150 : 250, margin: '0 auto', display: 'block' }}>
    <circle cx="100" cy="100" r="72" fill="none" stroke={T.ink3} strokeWidth="1" strokeDasharray="3 5" opacity="0.6"/>
    <line x1="100" y1="100" x2="172" y2="100" stroke={T.accent} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45"/>
    <circle className="sun-pulse" cx="100" cy="100" r="22" fill={T.accent}/>
    <g className="orbit-spin"><circle cx="172" cy="100" r="8" fill={T.blue}/></g>
  </svg>
);
const MoonOrbit = () => (
  <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 230, margin: '0 auto', display: 'block' }}>
    <circle cx="100" cy="60" r="42" fill="none" stroke={T.ink3} strokeWidth="1" strokeDasharray="2 6" opacity="0.5"/>
    <circle cx="100" cy="60" r="15" fill={T.blue}/>
    <g className="moon-spin"><circle cx="142" cy="60" r="6" fill="#9A9690"/></g>
  </svg>
);
const PlaceGrid = ({ answer, filled }) => {
  const digits = String(answer).split('');
  const n = digits.length;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
      {digits.map((d, i) => {
        const classBreak = (n - i) % 3 === 0 && i !== 0;
        return (
          <React.Fragment key={i}>
            {classBreak && <span style={{ width: 8 }}/>}
            <span className={`place-cell ${filled ? 'filled' : ''}`} style={{ transitionDelay: `${i * 0.05}s` }}>{filled ? d : '·'}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================
// БАЗОВЫЕ КОМПОНЕНТЫ
// ============================================================
const StepExploration = ({ idx, screenContent, onNext, onPrev, renderBody, screen, totalScreens }) => {
  const c = screenContent;
  const t = useT();
  const lang = useLang();
  const segs = c.audio[lang].map((text, i) => ({ id: `s${idx}_a${i}`, text, trigger: i === 0 ? 'on_mount' : `on_event:step_${i}`, waits_for: { type: 'button_click', target: i < c.audio[lang].length - 1 ? 'step' : 'next' } }));
  const audio = useAudio(segs);
  const last = c.audio[lang].length - 1;
  const [step, setStep] = useState(0);
  const stepEndRef = useRef(null);
  useEffect(() => { if (step > 0 && stepEndRef.current) setTimeout(() => { if (stepEndRef.current) stepEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 200); }, [step]);
  const handleStep = () => { if (step < last) { const ns = step + 1; setStep(ns); audio.triggerInternal(`step_${ns}`); } else { audio.triggerEvent('button_click', 'next'); onNext(); } };
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext label={<NextLabel/>} onClick={handleStep}/></>);
  return (<Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>{renderBody({ t, step, stepEndRef })}</Stage>);
};
const StepLine = ({ children, soft }) => (
  <div className={`fade-up ${soft ? 'frame-soft' : 'frame'}`} style={{ padding: 'clamp(12px, 2vw, 16px)' }}>
    <p className="body" style={{ margin: 0, color: T.ink }}>{children}</p>
  </div>
);
const RuleScreen = ({ screenContent, onNext, onPrev, screen, totalScreens, exampleNode }) => {
  const c = screenContent;
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: 'a', text: c.audio[lang], trigger: 'on_mount', waits_for: { type: 'button_click', target: 'next' } }]);
  const handleNext = () => { audio.triggerEvent('button_click', 'next'); onNext(); };
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext onClick={handleNext} label={<NextLabel/>}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 27px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <div className="frame-soft fade-up delay-1"><p className="body" style={{ margin: 0, color: T.ink }}>{t(c.rule_text)}</p></div>
        <div className="frame fade-up delay-2" style={{ textAlign: 'center' }}>
          {exampleNode || <p className="mono" style={{ margin: 0, fontSize: 'clamp(15px, 2.2vw, 18px)', color: T.ink }}>{t(c.example)}</p>}
        </div>
      </div>
    </Stage>
  );
};
const MCQuestion = ({ c, t, visual }) => (
  <>
    <p className="eyebrow" style={{ color: T.accent }}>{t(c.eyebrow)} · {t(c.label)}</p>
    {c.context && <p className="small" style={{ marginTop: 6, color: T.ink3 }}>{t(c.context)}</p>}
    <h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.question)}</h2>
    {visual && <div className="frame" style={{ marginTop: 14 }}>{visual}</div>}
  </>
);

// Блок подсказки (наводка, не ответ)
const HintBlock = ({ show, children }) => (
  show ? <div className="frame-soft fade-up" style={{ padding: 'clamp(12px, 2vw, 16px)' }}>
    <p className="small mono" style={{ margin: 0, marginBottom: 6, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Подсказка</p>
    <p className="body" style={{ margin: 0, color: T.ink }}>{children}</p>
  </div> : null
);

// Ввод числа с hint-loop: ошибка -> подсказка, без правильного, повтор; оценка по первой попытке
const InputScreen = ({ idx, screenContent, onNext, onPrev, storedAnswer, onAnswer, screen, totalScreens, ringSun }) => {
  const c = screenContent;
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: `s${idx}_intro`, text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'check_pressed' } }]);
  const norm = (s) => String(s).replace(/[^0-9]/g, '');
  const solvedInit = storedAnswer !== undefined && norm(storedAnswer.studentAnswer) === norm(c.answer);
  const [value, setValue] = useState(storedAnswer?.studentAnswer ?? '');
  const [solved, setSolved] = useState(solvedInit);
  const [showHint, setShowHint] = useState(storedAnswer !== undefined && !solvedInit);
  const [firstTry, setFirstTry] = useState(storedAnswer !== undefined ? { done: true, correct: !!storedAnswer.correct } : { done: false, correct: false });
  const isCorrect = norm(value) === norm(c.answer) && norm(value) !== '';

  const submit = () => {
    if (norm(value) === '' || solved) return;
    const scored = firstTry.done ? firstTry.correct : isCorrect;
    if (!firstTry.done) setFirstTry({ done: true, correct: isCorrect });
    onAnswer({ stage: SCREEN_META[idx].scope, screenIdx: idx, question: c.prompt[lang], options: null, correctIndex: null, correctAnswer: c.answer, studentAnswerIndex: null, studentAnswer: String(value), correct: scored, firstTryCorrect: scored });
    audio.triggerEvent('check_pressed');
    if (isCorrect) { setSolved(true); setShowHint(false); } else { setShowHint(true); }
    if (!audio.muted) { const txt = isCorrect ? c.audio.on_correct[lang] : (c.audio.on_wrong[lang] + ' ' + c.hint[lang]); setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(txt); }, 300); }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!solved} onClick={onNext} label={<NextLabel/>}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 24px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>{t(c.eyebrow)} · {t(c.label)}</p>
          {c.context && <p className="small" style={{ marginTop: 6, color: T.ink3 }}>{t(c.context)}</p>}
          <h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.prompt)}</h2>
        </div>
        <div className="frame fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          {ringSun && <OrbitDiagram small/>}
          <input type="text" inputMode="numeric" className={`answer-input ${solved ? 'correct' : (showHint ? 'wrong' : '')}`} value={value} placeholder={t(c.placeholder)} onChange={e => setValue(e.target.value)} disabled={solved} onKeyDown={e => e.key === 'Enter' && submit()} style={{ width: 'min(100%, 320px)' }}/>
          <PlaceGrid answer={c.answer} filled={solved}/>
        </div>
        <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-white-accent" disabled={!value || solved} onClick={submit} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{lang === 'uz' ? 'Tekshirish' : 'Проверить'}</button>
        </div>
        {solved && (
          <FeedbackBlock show={true} isCorrect={true}>
            <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'uz' ? "To'g'ri" : 'Верно'}</p>
            <p className="body" style={{ margin: 0 }}>{t(c.fb_correct)}</p>
          </FeedbackBlock>
        )}
        {!solved && <HintBlock show={showHint}>{t(c.hint)}</HintBlock>}
      </div>
    </Stage>
  );
};

// Выбор с hint-loop: первый неверный -> наводка, правильный не раскрывается, повтор до верного
const HintChoice = ({ idx, screenContent, visual, onNext, onPrev, storedAnswer, onAnswer, screen, totalScreens }) => {
  const c = screenContent;
  const t = useT();
  const lang = useLang();
  const correctIdx = c.correctIndex;
  const options = c.options.map(o => t(o));
  const audio = useAudio([{ id: `s${idx}_intro`, text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(null);
  const [solved, setSolved] = useState(storedAnswer !== undefined && storedAnswer.studentAnswerIndex === correctIdx);
  const [showHint, setShowHint] = useState(false);
  const [firstTry, setFirstTry] = useState(storedAnswer !== undefined ? { done: true, correct: !!storedAnswer.correct } : { done: false, correct: false });

  const pick = (i) => {
    if (solved) return;
    const isC = i === correctIdx;
    setPicked(i);
    const scored = firstTry.done ? firstTry.correct : isC;
    if (!firstTry.done) setFirstTry({ done: true, correct: isC });
    onAnswer({ stage: SCREEN_META[idx].scope, screenIdx: idx, question: c.question[lang], options, correctIndex: correctIdx, correctAnswer: options[correctIdx], studentAnswerIndex: i, studentAnswer: options[i], correct: scored, firstTryCorrect: scored });
    audio.triggerEvent('option_picked');
    if (isC) { setSolved(true); setShowHint(false); } else { setShowHint(true); }
    if (!audio.muted) { const txt = isC ? c.audio.on_correct[lang] : (c.audio.on_wrong[lang] + ' ' + c.hint[lang]); setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(txt); }, 300); }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!solved} onClick={onNext} label={<NextLabel/>}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(17px, 2.5vw, 24px)' }}>
        <div className="fade-up"><MCQuestion c={c} t={t} visual={visual}/></div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (solved && i === correctIdx) cls += ' option-correct';
            else if (!solved && i === picked) cls += ' option-picked-wrong';
            return (
              <button key={i} className={cls} disabled={solved} onClick={() => pick(i)} style={{ padding: 'clamp(12px, 1.7vw, 15px) clamp(14px, 2.1vw, 19px)', fontSize: 'clamp(13px, 1.6vw, 14px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: solved && i === correctIdx ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        {solved && (
          <FeedbackBlock show={true} isCorrect={true}>
            <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'uz' ? "To'g'ri" : 'Верно'}</p>
            <p className="body" style={{ margin: 0 }}>{t(c.correct_text)}</p>
          </FeedbackBlock>
        )}
        {!solved && <HintBlock show={showHint}>{t(c.hint)}</HintBlock>}
      </div>
    </Stage>
  );
};

// Интерактив «поставь пробелы» — тап между цифрами; hint-loop; оценка по первой попытке
const SpacesInteractive = ({ screen, totalScreens, storedAnswer, onAnswer, onNext, onPrev }) => {
  const c = CONTENT.s3;
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: 's3_intro', text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'check_pressed' } }]);
  const digits = c.raw.split('');
  const correct = c.correct;
  const parseSpaces = (str) => { const set = new Set(); let d = 0; for (const ch of str) { if (ch === ' ') set.add(d); else d++; } return set; };
  const solvedInit = storedAnswer !== undefined && storedAnswer.studentAnswer === correct;
  const [spaces, setSpaces] = useState(() => storedAnswer?.studentAnswer ? parseSpaces(storedAnswer.studentAnswer) : new Set());
  const [solved, setSolved] = useState(solvedInit);
  const [showHint, setShowHint] = useState(storedAnswer !== undefined && !solvedInit);
  const [firstTry, setFirstTry] = useState(storedAnswer !== undefined ? { done: true, correct: !!storedAnswer.correct } : { done: false, correct: false });

  const joined = digits.map((d, i) => (i > 0 && spaces.has(i) ? ' ' + d : d)).join('');
  const isCorrect = joined === correct;

  const toggleGap = (i) => { if (solved) return; setSpaces(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); };

  const submit = () => {
    if (solved) return;
    const scored = firstTry.done ? firstTry.correct : isCorrect;
    if (!firstTry.done) setFirstTry({ done: true, correct: isCorrect });
    onAnswer({ stage: 'module-mikro', screenIdx: 3, question: c.prompt[lang], options: null, correctIndex: null, correctAnswer: correct, studentAnswerIndex: null, studentAnswer: joined, correct: scored, firstTryCorrect: scored });
    audio.triggerEvent('check_pressed');
    if (isCorrect) { setSolved(true); setShowHint(false); } else { setShowHint(true); }
    if (!audio.muted) { const txt = isCorrect ? c.audio.on_correct[lang] : (c.audio.on_wrong[lang] + ' ' + c.hint[lang]); setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(txt); }, 300); }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!solved} onClick={onNext} label={<NextLabel/>}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 24px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>{t(c.eyebrow)} · {t(c.label)}</p>
          {c.context && <p className="small" style={{ marginTop: 6, color: T.ink3 }}>{t(c.context)}</p>}
          <h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.prompt)}</h2>
        </div>
        <div className="frame fade-up delay-1" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'clamp(20px, 4vw, 32px) clamp(12px, 2vw, 16px)' }}>
          <div className="display" style={{ fontSize: 'clamp(34px, 7vw, 56px)', display: 'flex', alignItems: 'center' }}>
            {digits.map((d, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <button onClick={() => toggleGap(i)} disabled={solved} aria-label="пробел"
                    className="gap-slot" style={{ width: spaces.has(i) ? 'clamp(14px,3vw,24px)' : 'clamp(7px,1.6vw,12px)', background: spaces.has(i) ? T.accent : 'transparent' }}/>
                )}
                <span style={{ color: T.ink }}>{d}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-white-accent" disabled={solved} onClick={submit} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{lang === 'uz' ? 'Tekshirish' : 'Проверить'}</button>
        </div>
        {solved && (
          <>
            <FeedbackBlock show={true} isCorrect={true}>
              <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'uz' ? "To'g'ri" : 'Верно'}</p>
              <p className="body" style={{ margin: 0 }}>{t(c.fb_correct)}</p>
            </FeedbackBlock>
            <div className="frame-soft fade-up" style={{ textAlign: 'center' }}>
              <p className="body" style={{ margin: 0, color: T.ink }}>{t(c.reveal_note)}</p>
              <div style={{ marginTop: 12 }}><MoonOrbit/></div>
            </div>
          </>
        )}
        {!solved && <HintBlock show={showHint}>{t(c.hint)}</HintBlock>}
      </div>
    </Stage>
  );
};

// Drag-сопоставление число ↔ прочтение (pointer events, работает на тач)
const DragMatch = ({ screen, totalScreens, storedAnswer, onAnswer, onNext, onPrev }) => {
  const c = CONTENT.s11;
  const t = useT();
  const lang = useLang();
  const pairs = c.pairs;
  const n = pairs.length;
  const audio = useAudio([{ id: 's11_intro', text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'check_pressed' } }]);
  const [order] = useState(() => shuffle([...Array(n).keys()]));
  const [assign, setAssign] = useState(() => Array(n).fill(null)); // slotIdx -> pairIdx
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [firstTry, setFirstTry] = useState({ done: false, correct: false });
  const [drag, setDrag] = useState(null); // { pairIdx, x, y }
  const slotRefs = useRef([]);

  const allPlaced = assign.every(a => a !== null);
  const isCorrect = assign.every((a, k) => a === k);

  useEffect(() => {
    if (!drag) return;
    const move = (e) => { const p = e.touches ? e.touches[0] : e; setDrag(d => d ? { ...d, x: p.clientX, y: p.clientY } : d); };
    const up = (e) => {
      const p = (e.changedTouches ? e.changedTouches[0] : e);
      let hit = -1;
      slotRefs.current.forEach((el, k) => { if (!el) return; const r = el.getBoundingClientRect(); if (p.clientX >= r.left && p.clientX <= r.right && p.clientY >= r.top && p.clientY <= r.bottom) hit = k; });
      setDrag(cur => {
        if (cur && hit >= 0) {
          setAssign(prev => { const nx = prev.map(a => (a === cur.pairIdx ? null : a)); nx[hit] = cur.pairIdx; return nx; });
        }
        return null;
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag]);

  const startDrag = (pairIdx, e) => { if (solved) return; const p = e.touches ? e.touches[0] : e; setDrag({ pairIdx, x: p.clientX, y: p.clientY }); };

  const check = () => {
    if (solved || !allPlaced) return;
    const scored = firstTry.done ? firstTry.correct : isCorrect;
    if (!firstTry.done) setFirstTry({ done: true, correct: isCorrect });
    onAnswer({ stage: 'final', screenIdx: 11, question: c.prompt[lang], options: null, correctIndex: null, correctAnswer: 'match', studentAnswerIndex: null, studentAnswer: JSON.stringify(assign), correct: scored, firstTryCorrect: scored });
    audio.triggerEvent('check_pressed');
    if (isCorrect) { setSolved(true); setShowHint(false); } else { setShowHint(true); }
    if (!audio.muted) { const txt = isCorrect ? c.audio.on_correct[lang] : (c.audio.on_wrong[lang] + ' ' + c.hint[lang]); setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(txt); }, 300); }
  };

  const placedPairs = new Set(assign.filter(a => a !== null));
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!solved} onClick={onNext} label={<NextLabel/>}/></>);

  const readingCard = (pairIdx, inSlot) => (
    <div onPointerDown={(e) => startDrag(pairIdx, e)}
      className="drag-card" style={{ touchAction: 'none', opacity: drag && drag.pairIdx === pairIdx ? 0.3 : 1, cursor: solved ? 'default' : 'grab', borderColor: solved ? T.success : 'transparent' }}>
      {t(pairs[pairIdx].reading)}
    </div>
  );

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 22px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>{t(c.eyebrow)} · {t(c.label)}</p>
          <h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.prompt)}</h2>
        </div>

        {/* числа-слоты */}
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pairs.map((pr, k) => (
            <div key={k} className="frame" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'clamp(10px,1.8vw,14px)' }}>
              <div style={{ minWidth: 'clamp(110px, 30vw, 160px)' }}>
                <div className="display" style={{ fontSize: 'clamp(18px, 3.6vw, 26px)', color: T.ink }}>{pr.number}</div>
                <div className="small mono" style={{ color: T.ink3 }}>{t(pr.label)}</div>
              </div>
              <div ref={el => slotRefs.current[k] = el} className="drop-slot" style={{ flex: 1, borderColor: solved ? T.success : (assign[k] !== null ? T.accent : T.ink3) }}>
                {assign[k] !== null ? readingCard(assign[k], true) : <span className="small" style={{ color: T.ink3 }}>{lang === 'uz' ? 'shu yerga torting' : 'перетащи сюда'}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* банк прочтений (неразмещённые) */}
        <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {order.filter(pi => !placedPairs.has(pi)).map(pi => <React.Fragment key={pi}>{readingCard(pi, false)}</React.Fragment>)}
        </div>

        <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-white-accent" disabled={!allPlaced || solved} onClick={check} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{lang === 'uz' ? 'Tekshirish' : 'Проверить'}</button>
        </div>

        {solved && (
          <FeedbackBlock show={true} isCorrect={true}>
            <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'uz' ? "To'g'ri" : 'Верно'}</p>
            <p className="body" style={{ margin: 0 }}>{t(c.fb_correct)}</p>
          </FeedbackBlock>
        )}
        {!solved && <HintBlock show={showHint}>{t(c.hint)}</HintBlock>}
      </div>

      {drag && (
        <div className="drag-card" style={{ position: 'fixed', left: drag.x, top: drag.y, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1000, background: '#FFFFFF', boxShadow: '0 12px 30px -8px rgba(58,53,48,0.4)' }}>
          {t(pairs[drag.pairIdx].reading)}
        </div>
      )}
    </Stage>
  );
};

// ============================================================
// ЭКРАНЫ
// ============================================================
const Screen0 = ({ screen, totalScreens, onAnswer, onNext }) => {
  const c = CONTENT.s0;
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: 's0_intro', text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const startedRef = useRef(false);
  useEffect(() => {
    if (audio.muted) { setShowOptions(true); return; }
    if (audio.isPlaying) startedRef.current = true;
    if (startedRef.current && !audio.isPlaying) setShowOptions(true);
  }, [audio.isPlaying, audio.muted]);
  useEffect(() => {
    const words = (c.audio.intro[lang] || '').trim().split(/\s+/).filter(Boolean).length;
    const ms = Math.max(4000, Math.min(Math.round(words / 2.3 * 1000) + 1500, 16000));
    const tmr = setTimeout(() => setShowOptions(true), ms);
    return () => clearTimeout(tmr);
  }, [lang]);
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer({ stage: null, screenIdx: 0, studentAnswer: v, correct: true }); audio.triggerEvent('option_picked'); setTimeout(onNext, 300); };
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vw, 24px)' }}>
        <h1 className="title h-title fade-up">{t(c.title_part1)} <span className="italic" style={{ color: T.accent }}>{t(c.title_part2_em)}</span> {t(c.title_part3)}</h1>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.sub)}</p>
        <div className="frame fade-up delay-2" style={{ textAlign: 'center' }}>
          <OrbitDiagram/>
          <p className="eyebrow" style={{ marginTop: 12, color: T.ink3 }}>{t(c.fact_label)}</p>
          <div style={{ marginTop: 8 }}><CountUp target={149600000} duration={1500} className="display" style={{ fontSize: 'clamp(30px, 6.4vw, 52px)', color: T.accent, letterSpacing: '0.03em' }}/></div>
        </div>
        {showOptions && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[{ id: 'yes', label: c.opt_yes }, { id: 'no', label: c.opt_no }, { id: 'idk', label: c.opt_idk }].map(opt => (
              <button key={opt.id} className="option" disabled={picked !== null} onClick={() => pick(opt.id)} style={{ padding: 'clamp(13px, 1.9vw, 15px) clamp(16px, 2.5vw, 20px)', fontSize: 'clamp(15px, 1.9vw, 15px)' }}>{t(opt.label)}</button>
            ))}
          </div>
        )}
      </div>
    </Stage>
  );
};
const Screen1 = ({ screen, totalScreens, onNext, onPrev }) => {
  const c = CONTENT.s1;
  return (<StepExploration idx={1} screenContent={c} onNext={onNext} onPrev={onPrev} screen={screen} totalScreens={totalScreens}
    renderBody={({ t, step, stepEndRef }) => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 20px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.lead)}</p>
        <div className="frame fade-up delay-2"><GroupingReveal groups={['149', '600', '000']} active={step < 3 ? [2, 1, 0][step] : -1}/></div>
        <StepLine>{t(c.step_1)}</StepLine>
        {step >= 1 && <StepLine>{t(c.step_2)}</StepLine>}
        {step >= 2 && <StepLine>{t(c.step_3)}</StepLine>}
        <div ref={stepEndRef}/>
      </div>
    )}/>);
};
const Screen2 = (props) => (<RuleScreen {...props} screenContent={CONTENT.s2} exampleNode={<GroupingReveal groups={['149', '600', '000']} color={T.ink}/>}/>);
const Screen3 = (props) => <SpacesInteractive {...props}/>;
const Screen4 = ({ screen, totalScreens, onNext, onPrev }) => {
  const c = CONTENT.s4;
  const cells = [{ d: '3', ru: 'сотни', uz: 'yuzlar' }, { d: '7', ru: 'десятки', uz: "o'nlar" }, { d: '5', ru: 'единицы', uz: 'birlar' }];
  const stepToCell = [2, 1, 0];
  return (<StepExploration idx={4} screenContent={c} onNext={onNext} onPrev={onPrev} screen={screen} totalScreens={totalScreens}
    renderBody={({ t, step, stepEndRef }) => {
      const lang = useLang();
      const active = stepToCell[Math.min(step, 2)];
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 20px)' }}>
          <h2 className="title h-title fade-up">{t(c.title)}</h2>
          <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.lead)}</p>
          <div className="frame fade-up delay-2" style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(10px, 2vw, 18px)' }}>
            {cells.map((cell, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="display cls-cell" style={{ fontSize: 'clamp(30px, 6vw, 48px)', padding: '4px 10px', background: i === active ? T.accentSoft : 'transparent', color: i === active ? T.accent : T.ink }}>{cell.d}</div>
                <p className="small mono" style={{ marginTop: 6, color: i === active ? T.accent : T.ink3 }}>{lang === 'uz' ? cell.uz : cell.ru}</p>
              </div>
            ))}
          </div>
          <StepLine>{t(c.step_1)}</StepLine>
          {step >= 1 && <StepLine>{t(c.step_2)}</StepLine>}
          {step >= 2 && <StepLine>{t(c.step_3)}</StepLine>}
          {step >= 2 && <StepLine soft>{t(c.table_note)}</StepLine>}
          <div ref={stepEndRef}/>
        </div>
      );
    }}/>);
};
const Screen5 = (props) => <RuleScreen {...props} screenContent={CONTENT.s5}/>;
const Screen6 = (props) => {
  const t = useT();
  return <HintChoice {...props} idx={6} screenContent={CONTENT.s6} visual={<GroupingReveal groups={['384', '400']}/>}/>;
};
const Screen7 = ({ screen, totalScreens, onNext, onPrev }) => {
  const c = CONTENT.s7;
  return (<StepExploration idx={7} screenContent={c} onNext={onNext} onPrev={onPrev} screen={screen} totalScreens={totalScreens}
    renderBody={({ t, step, stepEndRef }) => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 20px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.lead)}</p>
        <div className="frame fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ZeroMorph a={t(c.number_a)} b={t(c.number_b)} collapsed={step >= 2}/>
          <div>
            <div className="cmp-bar" style={{ width: step >= 2 ? '10%' : '100%' }}/>
            <p className="small mono" style={{ marginTop: 8, color: step >= 2 ? T.accent : T.ink3 }}>{step >= 2 ? t(c.number_b) : t(c.number_a)}</p>
          </div>
        </div>
        <StepLine>{t(c.step_1)}</StepLine>
        {step >= 1 && <StepLine>{t(c.step_2)}</StepLine>}
        {step >= 2 && <StepLine soft>{t(c.step_3)}</StepLine>}
        <div ref={stepEndRef}/>
      </div>
    )}/>);
};
const Screen8 = (props) => {
  const c = CONTENT.s8;
  return (<RuleScreen {...props} screenContent={c} exampleNode={
    <div className="display" style={{ fontSize: 'clamp(20px, 4vw, 30px)', color: T.ink }}>
      <span>149 600 000</span><span style={{ color: T.ink3, margin: '0 0.35em' }}>≠</span><span style={{ color: T.accent }}>14 960 000</span>
    </div>}/>);
};
const Screen9 = (props) => <InputScreen {...props} idx={9} screenContent={CONTENT.s9}/>;
const Screen10 = ({ screen, totalScreens, onNext, onPrev }) => {
  const c = CONTENT.s10;
  return (<StepExploration idx={10} screenContent={c} onNext={onNext} onPrev={onPrev} screen={screen} totalScreens={totalScreens}
    renderBody={({ t, step, stepEndRef }) => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 20px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.lead)}</p>
        <div className="frame fade-up delay-2">
          <GroupingReveal groups={['299', '792', '458']} active={Math.min(step, 2)}/>
          <div className="light-track"><div className="light-beam"/></div>
        </div>
        <StepLine>{t(c.step_1)}</StepLine>
        {step >= 1 && <StepLine>{t(c.step_2)}</StepLine>}
        {step >= 2 && <StepLine>{t(c.step_3)}</StepLine>}
        <div ref={stepEndRef}/>
      </div>
    )}/>);
};
const Screen11 = (props) => <DragMatch {...props}/>;
const Screen12 = (props) => <InputScreen {...props} idx={12} screenContent={CONTENT.s12} ringSun/>;
const Screen13 = ({ screen, totalScreens, answers, onReset, onPrev, finishLesson }) => {
  const c = CONTENT.s13;
  const t = useT();
  const lang = useLang();
  const segs = c.audio[lang].map((text, i) => ({ id: `s13_a${i}`, text, trigger: i === 0 ? 'on_mount' : 'after_previous', waits_for: null }));
  const audio = useAudio(segs);
  const scoredIdx = SCREEN_META.map((m, i) => (m.scored ? i : -1)).filter(i => i >= 0);
  const correct = scoredIdx.filter(i => answers[i]?.correct).length;
  const total = scoredIdx.length;
  const scoreVal = useCountUp(correct, 800);
  useEffect(() => { finishLesson(); /* eslint-disable-next-line */ }, []);
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(15px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{lang === 'uz' ? "Qaytadan o'tish" : 'Пройти заново'}</button></>);
  const answersArr = [c.answer_1, c.answer_2, c.answer_3, c.answer_4, c.answer_5];
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 24px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <div className="frame fade-up delay-1" style={{ textAlign: 'center' }}>
          <OrbitDiagram small/>
          <p className="eyebrow" style={{ color: T.ink3, margin: '12px 0 0' }}>{t(c.score_label)}</p>
          <div className="display" style={{ fontSize: 'clamp(44px, 9vw, 72px)', marginTop: 4 }}>
            <span style={{ color: correct >= total * 0.7 ? T.success : T.accent }}>{scoreVal}</span><span style={{ color: T.ink3 }}>/{total}</span>
          </div>
        </div>
        <div className="frame-soft fade-up delay-2"><p className="body" style={{ margin: 0, fontWeight: 600, color: T.ink }}>{t(c.question_recall)}</p></div>
        <div className="frame fade-up delay-3">
          <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 10, color: T.ink2 }}>
            {answersArr.map((a, i) => (
              <div key={i} className="fade-up" style={{ animationDelay: `${0.15 + i * 0.12}s`, display: 'flex', gap: 10 }}>
                <span className="mono small" style={{ color: T.accent, minWidth: 16 }}>{i + 1}</span><span>{t(a)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="frame-success fade-up delay-4"><p className="eyebrow" style={{ margin: 0, color: T.success }}>{t(c.learned_title)}</p><p className="body" style={{ marginTop: 8, marginBottom: 0, color: T.ink }}>{t(c.learned)}</p></div>
        <p className="small fade-up delay-4" style={{ color: T.ink3 }}>{t(c.forward)}</p>
      </div>
    </Stage>
  );
};

// ============================================================
// КОРНЕВОЙ КОМПОНЕНТ — { lang, onFinished } (production-чистый)
// ============================================================
export default function NaturalNumbersLesson({ lang: langProp, onFinished }) {
  const lang = langProp || 'ru';
  const safeOnFinished = onFinished || ((payload) => { /* eslint-disable-next-line no-console */ console.log('[Preview] onFinished:', payload); });
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const startTimeRef = useRef(Date.now());
  const recordAnswer = useCallback((screenIdx, data) => { setAnswers(prev => { const next = [...prev]; next[screenIdx] = data; return next; }); }, []);
  const reset = useCallback(() => { setAnswers([]); setCurrent(0); startTimeRef.current = Date.now(); }, []);
  const finishLesson = useCallback(() => {
    const scoredScreens = SCREEN_META.filter(s => s.scored);
    const finalScreens = scoredScreens.filter(s => s.scope === 'final');
    const correctAnswersCount = answers.filter((a, i) => a && SCREEN_META[i]?.scored && a.correct).length;
    const finalCorrect = answers.filter((a, i) => a && SCREEN_META[i]?.scope === 'final' && a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId, lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredScreens.length, correctAnswers: correctAnswersCount,
      scorePercent: scoredScreens.length > 0 ? Math.round((correctAnswersCount / scoredScreens.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalScreens.length,
      passed: finalScreens.length > 0 ? finalCorrect / finalScreens.length >= 0.6 : (scoredScreens.length > 0 ? (correctAnswersCount / scoredScreens.length) >= 0.6 : false),
      answers: answers.filter(Boolean)
    };
    safeOnFinished(payload);
  }, [answers, safeOnFinished]);
  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13];
  const CurrentScreen = screens[current];
  const next = () => setCurrent(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setCurrent(s => Math.max(s - 1, 0));
  const handleAnswer = useCallback((data) => { recordAnswer(current, data); }, [current, recordAnswer]);
  return (
    <LangContext.Provider value={lang}>
      <style>{STYLES}</style>
      <div className="lesson-root">
        <CurrentScreen screen={current} totalScreens={TOTAL_SCREENS} storedAnswer={answers[current]} answers={answers} onAnswer={handleAnswer} onNext={next} onPrev={prev} onReset={reset} finishLesson={finishLesson}/>
      </div>
    </LangContext.Provider>
  );
}

const STYLES = `
html, body { margin: 0; padding: 0; }
.lesson-root, .lesson-root * { box-sizing: border-box; }
.lesson-root {
  font-family: 'Manrope', system-ui, sans-serif;
  color: #0E0E10;
  background: #F6F4EF;
  height: 100dvh;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "ss01","cv11";
}

.lesson-root h1,
.lesson-root h2,
.lesson-root h3,
.lesson-root h4,
.lesson-root h5,
.lesson-root h6,
.lesson-root p,
.lesson-root ul,
.lesson-root ol { margin: 0; padding: 0; }

.title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; font-variation-settings: "opsz" 60; }
.display { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.0; letter-spacing: -0.01em; font-variation-settings: "opsz" 60; }
.italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; font-variation-settings: "opsz" 60; }
.mono { font-family: 'JetBrains Mono', monospace; }
.mop { font-family: 'Manrope', sans-serif; font-weight: 600; color: #0E0E10; display: inline-block; padding: 0 0.06em; }

.frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1; margin: 0 0.08em; font-family: 'Fraunces', serif; font-variation-settings: "opsz" 144; font-weight: 400; }
.frac .n, .frac .d { padding: 0 0.12em; }
.frac .bar { height: 0.08em; background: currentColor; width: 100%; margin: 0.08em 0; border-radius: 2px; }

@keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
.delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; }
.delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }

.feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
.feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px, 2vw, 20px); }

.btn {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: #0E0E10;
  color: #F6F4EF;
  letter-spacing: 0.01em;
  border-radius: 12px;
  border: none;
  box-shadow: 0 6px 18px -4px rgba(58, 53, 48, 0.32);
}
.btn:hover:not(:disabled) {
  background: #FF4F28;
  box-shadow: 0 10px 24px -4px rgba(255, 79, 40, 0.45);
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

.btn-white-accent {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: #FFFFFF;
  color: #FF4F28;
  letter-spacing: 0.01em;
  border-radius: 12px;
  border: none;
  box-shadow: 0 8px 22px -4px rgba(255, 79, 40, 0.35), 0 0 0 1px rgba(255, 79, 40, 0.12);
}
.btn-white-accent:hover:not(:disabled) {
  background: #FF4F28;
  color: #FFFFFF;
  box-shadow: 0 12px 28px -6px rgba(255, 79, 40, 0.55);
}
.btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(58, 53, 48, 0.14); }

.btn-ghost {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #0E0E10;
  letter-spacing: 0.01em;
  border-radius: 12px;
  border: none;
  box-shadow: none;
}
.btn-ghost:hover:not(:disabled) {
  background: #FFFFFF;
  box-shadow: 0 6px 18px -6px rgba(58, 53, 48, 0.18);
}
.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

.option {
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Manrope', sans-serif;
  font-weight: 500;
  text-align: left;
  border-radius: 12px;
  width: 100%;
  border: none;
  color: #0E0E10;
  box-shadow: 0 6px 16px -6px rgba(58, 53, 48, 0.14);
}
.option:hover:not(:disabled) {
  background: #FDFBF7;
  box-shadow: 0 10px 22px -6px rgba(58, 53, 48, 0.22);
}
.option:disabled { cursor: default; }
.option-correct {
  background: #E3F0E8 !important;
  color: #1F7A4D !important;
  box-shadow: 0 8px 22px -6px rgba(31, 122, 77, 0.32) !important;
}
.option-wrong {
  background: #FFFFFF !important;
  color: #A7A6A2 !important;
  opacity: 0.55 !important;
  box-shadow: 0 4px 12px -6px rgba(58, 53, 48, 0.08) !important;
}
.option-picked-wrong {
  background: #FFE8E1 !important;
  color: #FF4F28 !important;
  box-shadow: 0 8px 22px -6px rgba(255, 79, 40, 0.38) !important;
}

.h-title { font-size: clamp(22px, 4vw, 38px); }
.h-sub { font-size: clamp(17px, 2.5vw, 20px); }
.body { font-size: clamp(15px, 1.9vw, 15px); line-height: 1.5; }
.eyebrow { font-size: clamp(11px, 1.3vw, 11px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
.small { font-size: clamp(13px, 1.5vw, 13px); }
.frac-display { font-size: clamp(45px, 9vw, 75px); }
.frac-mid { font-size: clamp(26px, 5vw, 38px); }
.frac-sm { font-size: clamp(16px, 2.5vw, 20px); }

.stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
.stage-header {
  flex-shrink: 0;
  background: #F6F4EF;
  padding-top: clamp(12px, 2vw, 18px);
  padding-bottom: clamp(8px, 1.5vw, 12px);
}
.stage-content {
  flex: 1;
  padding-top: clamp(10px, 1.7vw, 16px);
  padding-bottom: clamp(17px, 3.4vw, 34px);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.stage-nav {
  flex-shrink: 0;
  background: #F6F4EF;
  border-top: 1px solid rgba(167, 166, 162, 0.25);
  padding-top: clamp(12px, 2vw, 15px);
  padding-bottom: clamp(12px, 2vw, 15px);
  display: flex;
  gap: 12px;
}

.chrome { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
.chrome-left { display: flex; align-items: center; gap: 10px; color: #5A5A60; }
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #FF4F28;
  box-shadow: 0 0 8px rgba(255, 79, 40, 0.55);
}

.progress-track {
  height: 3px;
  background: rgba(167, 166, 162, 0.25);
  width: 100%;
  margin-bottom: 12px;
  border-radius: 99px;
  overflow: visible;
}
.progress-bar {
  height: 100%;
  background: #FF4F28;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 99px;
  box-shadow: 0 0 10px rgba(255, 79, 40, 0.55), 0 0 3px rgba(255, 79, 40, 0.40);
}

.track-wrap {
  position: relative;
  height: 26px;
  margin: 18px 0;
  display: flex;
  align-items: center;
}
.track-bg {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: rgba(167, 166, 162, 0.30);
  border-radius: 99px;
  pointer-events: none;
}
.track-fill {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: #FF4F28;
  border-radius: 99px;
  pointer-events: none;
  box-shadow: 0 0 8px rgba(255, 79, 40, 0.50), 0 0 2px rgba(255, 79, 40, 0.40);
  transition: width 0.15s ease-out;
}
.slider-input {
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  width: 100%;
  height: 24px;
  background: transparent;
  outline: none;
  margin: 0;
  cursor: grab;
  z-index: 2;
}
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: #FF4F28;
  border-radius: 50%;
  cursor: grab;
  transition: transform 0.1s;
  border: none;
  box-shadow: 0 0 0 4px #F6F4EF, 0 0 12px 0 rgba(255, 79, 40, 0.55);
}
.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #FF4F28;
  border-radius: 50%;
  cursor: grab;
  border: none;
  box-shadow: 0 0 0 4px #F6F4EF, 0 0 12px 0 rgba(255, 79, 40, 0.55);
}
.slider-input::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.12); }
.slider-input:disabled { cursor: not-allowed; }
.slider-input:disabled::-webkit-slider-thumb { opacity: 0.5; cursor: not-allowed; }

.answer-input {
  font-family: 'Fraunces', serif;
  font-size: clamp(22px, 4vw, 27px);
  font-weight: 400;
  text-align: center;
  border-radius: 12px;
  background: #FFFFFF;
  padding: 8px 12px;
  outline: none;
  border: none;
  color: #0E0E10;
  transition: all 0.2s;
  box-shadow: 0 6px 16px -6px rgba(58, 53, 48, 0.14);
}
.answer-input:focus {
  box-shadow: 0 10px 22px -6px rgba(255, 79, 40, 0.30), 0 0 0 1px rgba(255, 79, 40, 0.20);
}
.answer-input.correct {
  background: #E3F0E8;
  color: #1F7A4D;
  box-shadow: 0 8px 20px -6px rgba(31, 122, 77, 0.30);
}
.answer-input.wrong {
  background: #FFE8E1;
  color: #FF4F28;
  box-shadow: 0 8px 20px -6px rgba(255, 79, 40, 0.36);
}

.frame {
  background: #FFFFFF;
  border-radius: 16px;
  padding: clamp(17px, 3.4vw, 30px);
  border: none;
  box-shadow: 0 8px 22px -6px rgba(58, 53, 48, 0.14);
}
.frame-soft {
  background: #FFE8E1;
  border-left: 4px solid #FF4F28;
  border-radius: 12px;
  padding: clamp(14px, 2.5vw, 20px);
  box-shadow: 0 6px 16px -6px rgba(255, 79, 40, 0.22);
}
.frame-success {
  background: #E3F0E8;
  border-left: 4px solid #1F7A4D;
  border-radius: 12px;
  padding: clamp(14px, 2.5vw, 20px);
  box-shadow: 0 6px 16px -6px rgba(31, 122, 77, 0.22);
}

/* PREVIEW: переключатель языка (только для методиста, скрыт на платформе) */
.lang-switch {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 100;
  display: flex;
  gap: 4px;
  background: #FFFFFF;
  border-radius: 99px;
  padding: 3px;
  box-shadow: 0 3px 9px -4px rgba(58, 53, 48, 0.16), 0 1px 3px -1px rgba(58, 53, 48, 0.10);
}
.lang-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 99px;
  border: none;
  background: transparent;
  color: #5A5A60;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.06em;
}
.lang-btn.active { background: #0E0E10; color: #F6F4EF; }
.lang-btn:hover:not(.active) { color: #0E0E10; }


/* ===== lesson animations (поверх базового слоя infrastructure_v1) ===== */
@keyframes lesson-group-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
.lesson-group { display: inline-block; animation: lesson-group-in 0.5s ease-out both; }
.cls-cell { transition: background 0.4s, color 0.4s; border-radius: 8px; }
.cmp-bar { height: clamp(14px, 2.4vw, 18px); border-radius: 99px; background: #FF4F28; transition: width 0.9s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.40); }
.place-cell {
  font-family: 'JetBrains Mono', monospace;
  display: flex; align-items: center; justify-content: center;
  min-width: clamp(20px, 3.6vw, 30px);
  height: clamp(28px, 5vw, 40px);
  border-radius: 8px;
  background: #FFFFFF; color: #A7A6A2;
  box-shadow: 0 4px 12px -6px rgba(58,53,48,0.16);
  transition: all 0.35s;
}
.place-cell.filled { background: #E3F0E8; color: #1F7A4D; box-shadow: 0 6px 16px -6px rgba(31,122,77,0.30); }


/* ===== lesson animations (поверх базового слоя infrastructure_v1) ===== */
@keyframes lesson-group-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
.lesson-group { display: inline-block; animation: lesson-group-in 0.5s ease-out both; }
.cls-cell { transition: background 0.4s, color 0.4s; border-radius: 8px; }
.cmp-bar { height: clamp(14px, 2.4vw, 18px); border-radius: 99px; background: #FF4F28; transition: width 0.9s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.40); }
.place-cell {
  font-family: 'JetBrains Mono', monospace;
  display: flex; align-items: center; justify-content: center;
  min-width: clamp(20px, 3.6vw, 30px);
  height: clamp(28px, 5vw, 40px);
  border-radius: 8px;
  background: #FFFFFF; color: #A7A6A2;
  box-shadow: 0 4px 12px -6px rgba(58,53,48,0.16);
  transition: all 0.35s;
}
.place-cell.filled { background: #E3F0E8; color: #1F7A4D; box-shadow: 0 6px 16px -6px rgba(31,122,77,0.30); }

/* движение Солнца / орбита */
.orbit-spin { transform-box: view-box; transform-origin: 100px 100px; animation: orbit-rot 14s linear infinite; }
@keyframes orbit-rot { to { transform: rotate(360deg); } }
.sun-pulse { transform-box: view-box; transform-origin: 100px 100px; animation: sun-pulse 2.6s ease-in-out infinite; }
@keyframes sun-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
.moon-spin { transform-box: view-box; transform-origin: 100px 60px; animation: orbit-rot 7s linear infinite reverse; }

/* луч света */
.light-track { position: relative; height: 4px; margin-top: 16px; border-radius: 99px; background: rgba(167,166,162,0.25); overflow: hidden; }
.light-beam { position: absolute; top: 0; left: 0; height: 100%; width: 30%; border-radius: 99px; background: #FF4F28; box-shadow: 0 0 10px rgba(255,79,40,0.6); animation: light-sweep 1.8s ease-in-out infinite; }
@keyframes light-sweep { 0% { left: -30%; } 100% { left: 100%; } }


/* ===== интерактивы: пробелы и перетаскивание ===== */
.gap-slot { height: clamp(34px, 7vw, 56px); border: none; cursor: pointer; border-radius: 5px; transition: width 0.25s ease, background 0.25s ease; }
.gap-slot:disabled { cursor: default; }
.gap-slot:not(:disabled):hover { background: rgba(255, 79, 40, 0.25) !important; }
.drag-card { display: inline-block; padding: clamp(8px, 1.6vw, 12px) clamp(12px, 2vw, 16px); border-radius: 12px; background: #FFFFFF; box-shadow: 0 6px 16px -8px rgba(58, 53, 48, 0.28); font-size: clamp(13px, 1.7vw, 15px); border: 2px solid transparent; user-select: none; -webkit-user-select: none; max-width: 100%; line-height: 1.3; }
.drop-slot { display: flex; align-items: center; justify-content: center; min-height: clamp(46px, 8vw, 58px); border-radius: 12px; border: 2px dashed; padding: 6px; transition: border-color 0.3s ease; }
`;