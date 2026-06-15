import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const lessons = [

  {
    id: 0,
    number: "00",
    title: "Internet qanday ishlaydi",
    subtitle: "Brauzer, server, domen, DNS — so'rov yo'li",
    screens: 18,
    emoji: "web",
    ready: true,
  },

  {
    id: 1,
    number: "01",
    title: "PM — Kim mening foydalanuvchim?",
    subtitle: "Muammo → kim → yechim: sayt qanday g'oyadan boshlanadi",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 2,
    number: "02",
    title: "Html 1-lesson",
    subtitle: "Struktura, teglar, sarlavha, matn, ro'yxat, havola",
    screens: 18,
    emoji: "123",
    ready: true,
  },

  {
    id: 3,
    number: "03",
    title: "Html 2-lesson",
    subtitle: "Rasm, sahifa strukturasi, forma, DevTools",
    screens: 18,
    emoji: "456",
    ready: true,
  },

  {
    id: 4,
    number: "04",
    title: "PM — Struktura: UX qaror",
    subtitle: "Sayt bo'limlari qaysi tartibda — foydalanuvchini yechimga olib boruvchi tuzilish",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 5,
    number: "05",
    title: "CSS 1-dars",
    subtitle: "Ranglar, shriftlar, bo'shliqlar (otступы)",
    screens: 18,
    emoji: "css",
    ready: true,
  },

  {
    id: 6,
    number: "06",
    title: "CSS 2-dars",
    subtitle: "Layout, Flexbox asoslari, DevTools (CSS)",
    screens: 18,
    emoji: "flex",
    ready: true,
  },

  {
    id: 7,
    number: "07",
    title: "HTML Praktika — Portfolio",
    subtitle: "O'z portfolio saytingni HTML bilan noldan qur",
    screens: 18,
    emoji: "html",
    ready: true,
  },

  {
    id: 8,
    number: "08",
    title: "Git - GitHup",
    subtitle: "Git va Githup bilan ishlash",
    screens: 18,
    emoji: "git",
    ready: true,
  },

  {
    id: 9,
    number: "09",
    title: "CSS Praktika — Portfolio",
    subtitle: "Portfolioni CSS bilan bezab, interaktiv tugma yasa",
    screens: 18,
    emoji: "css",
    ready: true,
  },

  {
    id: 10,
    number: "10",
    title: "Netlify va Deploy",
    subtitle: "Saytingizni internetga joylash — Netlify bilan deploy",
    screens: 18,
    emoji: "web",
    ready: true,
  },

  {
    id: 11,
    number: "11",
    title: "PM — Storytelling: питч",
    subtitle: "Mahsulotni 2 daqiqada qiziqtirib tushuntirish — Demo Day'ga tayyorgarlik",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 12,
    number: "12",
    title: "JavaScript — Sistema va Algoritm",
    subtitle: "Kompyuter qanday o'ylaydi, algoritm va qadamlar ketma-ketligi",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 13,
    number: "13",
    title: "JavaScript — O'zgaruvchilar",
    subtitle: "let, const, ma'lumot turlari — qiymatlarni saqlash",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 14,
    number: "14",
    title: "JavaScript — Shartlar (if/else)",
    subtitle: "if, else, taqqoslash — kompyuter qanday qaror qabul qiladi",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 15,
    number: "15",
    title: "JavaScript — Sikllar",
    subtitle: "for va while — takrorlanuvchi amallar",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 16,
    number: "16",
    title: "JavaScript — Funksiyalar",
    subtitle: "Funksiya, parametr va return — kodni qayta ishlatish",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 17,
    number: "17",
    title: "Praktika 1 — Saytni jonlantiramiz",
    subtitle: "Interaktivlik: JavaScript bilan saytga jon kiritamiz",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 18,
    number: "18",
    title: "Praktika 2 — AI bilan tez sayt",
    subtitle: "AI yordamida sifatli promo landing yasash",
    screens: 18,
    emoji: "ai",
    ready: true,
  },

  {
    id: 19,
    number: "19",
    title: "PEAN Stack — Katta saytlar qanday quriladi?",
    subtitle: "PostgreSQL + Express + React + Node.js — 4 texnologiya, bitta jamoa",
    screens: 18,
    emoji: "stack",
    ready: true,
  },

  {
    id: 20,
    number: "20",
    title: "Praktika 3 — Dekompozitsiya",
    subtitle: "Mini-do'kon (1-qism): vazifani bo'laklarga ajratish",
    screens: 18,
    emoji: "shop",
    ready: true,
  },

  {
    id: 21,
    number: "21",
    title: "Praktika 4 — MVP tayyor",
    subtitle: "Mini-do'kon (2-qism): tayyor mahsulotni yig'amiz",
    screens: 18,
    emoji: "mvp",
    ready: true,
  },

  {
    id: 22,
    number: "22",
    title: "React — Tanishuv",
    subtitle: "React nima va nega kerak — sahifa bloklardan qanday yig'iladi",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 23,
    number: "23",
    title: "React — Birinchi komponent",
    subtitle: "JSX, npm run dev, o'z komponentingizni yozib ekranga chiqarish",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 24,
    number: "24",
    title: "React — State va useEffect",
    subtitle: "useState bilan xotira, useEffect bilan komponent hayoti",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 25,
    number: "25",
    title: "React — Props",
    subtitle: "Bitta komponentni qayta ishlatish — ma'lumotni props orqali uzatish",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 26,
    number: "26",
    title: "React Praktika 1 — CRUD",
    subtitle: "To'liq boshqariladigan ilova: qo'shish, ko'rish, tahrirlash, o'chirish",
    screens: 17,
    emoji: "react",
    ready: true,
  },

  {
    id: 27,
    number: "27",
    title: "React — API GET",
    subtitle: "fetch bilan serverdan ma'lumot olish va ekranga chiqarish",
    screens: 18,
    emoji: "api",
    ready: true,
  },

  {
    id: 28,
    number: "28",
    title: "React — API POST",
    subtitle: "POST so'rovi bilan serverga yangi ma'lumot yuborish",
    screens: 19,
    emoji: "api",
    ready: true,
  },

  {
    id: 29,
    number: "29",
    title: "React Praktika 2 — Router",
    subtitle: "React Router bilan ko'p sahifali ilova qurish",
    screens: 17,
    emoji: "react",
    ready: true,
  },

  {
    id: 30,
    number: "30",
    title: "React Praktika 3 — Loyiha kuni",
    subtitle: "AvtoIjara: o'rgangan bilimlarni bitta loyihada birlashtiramiz",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 31,
    number: "31",
    title: "React Praktika 4 — Istalgan saytni qurish",
    subtitle: "Bo'laklash + aniq prompt bilan har qanday saytni quramiz",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 32,
    number: "32",
    title: "Ma'lumot va bog'lanishlar",
    subtitle: "JSON, jadval, id va bog'lovchi, sxema — o'z ilovangiz xaritasini chizing",
    screens: 18,
    emoji: "data",
    ready: true,
  },

  {
    id: 33,
    number: "33",
    title: "SQL vs NoSQL — nega PostgreSQL",
    subtitle: "Ikki dunyo: jadval vs hujjat. Qachon qaysi biri — qaror kompasi bilan tanlang",
    screens: 18,
    emoji: "db",
    ready: true,
  },

  {
    id: 34,
    number: "34",
    title: "Node.js — birinchi serveringiz",
    subtitle: "Server, npm, Express, endpoint. Birinchi serverni yozib, localda ishga tushiring",
    screens: 18,
    emoji: "server",
    ready: true,
  },

  {
    id: 35,
    number: "35",
    title: "Routing: server so'rovni qanday topadi",
    subtitle: "Method + path, HTTP method'lar, route param va Nest controller — @Post eshigini o'zingiz oching",
    screens: 18,
    emoji: "route",
    ready: true,
  },

  {
    id: 36,
    number: "36",
    title: "PostgreSQL so'rovlar — CRUD + AI bilan",
    subtitle: "Jadval yaratish, ma'lumot qo'shish/ko'rish/o'zgartirish/o'chirish (CRUD) va AI bilan SQL yozish",
    screens: 18,
    emoji: "db",
    ready: true,
  },

  {
    id: 37,
    number: "37",
    title: "API va Postman — front backend bilan qanday gaplashadi",
    subtitle: "So'rov/javob, GET/POST/PUT/DELETE va Postman bilan o'z API'ingizni chaqirish",
    screens: 18,
    emoji: "api",
    ready: true,
  },

  {
    id: 38,
    number: "38",
    title: "Autentifikatsiya va .env — login, JWT, maxfiy kalitlar",
    subtitle: "Email orqali login, JWT token, route himoyasi (401) va secret'larni .env'ga ko'chirish",
    screens: 18,
    emoji: "auth",
    ready: true,
  },

]

const modules = [
  {
    id: 1,
    label: "Modul 01",
    title: "Web asoslari",
    subtitle: "Internet, HTML, CSS, Git — birinchi saytdan deploygacha",
    from: 0,
    to: 11,
  },
  {
    id: 2,
    label: "Modul 02",
    title: "JavaScript",
    subtitle: "O'zgaruvchilar, shartlar, sikllar, funksiyalar — saytga jon kiritamiz",
    from: 12,
    to: 21,
  },
  {
    id: 3,
    label: "Modul 03",
    title: "React",
    subtitle: "Komponentlar, state, props va serverlar — zamonaviy frontend",
    from: 22,
    to: 31,
  },
  {
    id: 4,
    label: "Modul 04",
    title: "Ma'lumot va backend",
    subtitle: "Node.js + PostgreSQL — ma'lumot, jadval, bog'lanish va sxema",
    from: 32,
    to: 99,
  },
]

const INK = '#1a1a1a'
const INK_SOFT = '#6b6b6b'
const INK_FAINT = '#a0a0a0'
const BORDER = '#eaeaea'
const ACCENT = '#e05a2b'
const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = '-apple-system, "Helvetica Neue", Arial, sans-serif'

export default function HomePage({ onSelectLesson }) {
  const [hovered, setHovered] = useState(null)
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: INK,
        fontFamily: SERIF,
        paddingBottom: 96,
      }}
    >
      <style>{`
        @keyframes ccUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes ccFade { from { opacity:0; } to { opacity:1; } }
        @keyframes ccSlide{ from { opacity:0; transform:translateX(-52px); } to { opacity:1; transform:none; } }
        @keyframes ccLine { from { transform:scaleX(0); } to { transform:scaleX(1); } }

        .cc-up   { opacity:0; animation:ccUp   .8s cubic-bezier(.2,.7,.2,1) forwards; }
        .cc-fade { opacity:0; animation:ccFade 1s ease forwards; }
        .cc-slide{ opacity:0; animation:ccSlide .85s cubic-bezier(.18,.7,.2,1) forwards; }
        .cc-line { transform:scaleX(0); transform-origin:left; animation:ccLine .7s cubic-bezier(.2,.7,.2,1) forwards; }

        .cc ::selection { background:${ACCENT}; color:#fff; }
        .cc-card .cc-arrow { display:inline-block; transition:transform .35s cubic-bezier(.2,.7,.2,1); }
        .cc-card:hover .cc-arrow { transform:translateX(6px); }
      `}</style>

      <div className="cc">
        {/* HEADER */}
        <header
          className="cc-fade"
          style={{
            borderBottom: `1px solid ${BORDER}`,
            padding: '24px clamp(24px,6vw,64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: ACCENT,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: SANS }}>C</span>
            </div>
            <span
              style={{
                fontSize: 14,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: INK,
                fontFamily: SANS,
                fontWeight: 600,
              }}
            >
              Coddycamp
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_FAINT,
              fontFamily: SANS,
            }}
          >
            O'quv darsligi
          </span>
        </header>

        {/* HERO */}
        <section style={{ padding: 'clamp(56px,8vw,84px) clamp(24px,6vw,64px) clamp(40px,5vw,56px)' }}>
          <div
            className="cc-up"
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, animationDelay: '.05s' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />
            <span
              style={{
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: ACCENT,
                fontFamily: SANS,
                fontWeight: 600,
              }}
            >
              Interaktiv darslar
            </span>
          </div>

          <h1
            className="cc-up"
            style={{
              fontSize: 'clamp(40px,7vw,76px)',
              fontWeight: 400,
              lineHeight: 1.08,
              margin: '0 0 24px',
              maxWidth: 720,
              animationDelay: '.14s',
            }}
          >
            CODDYCAMP<br />
            <span style={{ color: ACCENT, fontStyle: 'italic' }}>o'quv darsligi</span>
          </h1>

          <p
            className="cc-up"
            style={{
              fontSize: 18,
              color: INK_SOFT,
              fontFamily: SANS,
              lineHeight: 1.7,
              maxWidth: 520,
              margin: 0,
              animationDelay: '.24s',
            }}
          >
            Interaktiv animatsiyalar orqali matematika va ingliz tilini oson va qiziqarli o'rganing.
          </p>
        </section>

        {/* MODULES */}
        {modules.map((mod) => {
          const modLessons = lessons.filter((l) => l.id >= mod.from && l.id <= mod.to)
          return (
            <section key={mod.id} style={{ marginBottom: 64 }}>
              {/* MODULE HEADING */}
              <div
                style={{
                  padding: '0 clamp(24px,6vw,64px)',
                  marginBottom: 34,
                  maxWidth: 1120,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 20,
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: ACCENT,
                      fontFamily: SANS,
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    {mod.label}
                  </span>
                  <h2
                    style={{
                      fontSize: 'clamp(32px,5vw,46px)',
                      fontWeight: 400,
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {mod.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 15,
                      color: INK_SOFT,
                      fontFamily: SANS,
                      lineHeight: 1.6,
                      margin: '10px 0 0',
                      maxWidth: 520,
                    }}
                  >
                    {mod.subtitle}
                  </p>
                  <div
                    style={{
                      height: 3,
                      width: 64,
                      background: ACCENT,
                      borderRadius: 2,
                      marginTop: 16,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: INK_FAINT,
                    fontFamily: SANS,
                    paddingBottom: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {modLessons.length} ta dars
                </span>
              </div>

              {/* CARDS */}
              <div
                style={{
                  padding: '0 clamp(24px,6vw,64px)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 22,
                  maxWidth: 1120,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {modLessons.map((lesson, i) => {
                  const on = hovered === lesson.id
                  return (
                    <article
                      key={lesson.id}
                      className="cc-card cc-up"
                      onClick={() => lesson.ready && navigate(`/lesson/${lesson.id}`)}
                      onMouseEnter={() => setHovered(lesson.id)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: '#fff',
                        border: `1px solid ${on ? ACCENT : BORDER}`,
                        borderRadius: 14,
                        padding: '32px 32px 28px',
                        cursor: lesson.ready ? 'pointer' : 'default',
                        transition: 'transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease, border-color .25s ease',
                        transform: on ? 'translateY(-4px)' : 'none',
                        boxShadow: on ? '0 18px 44px -16px rgba(224,90,43,0.28)' : '0 1px 3px rgba(0,0,0,0.04)',
                        animationDelay: `${0.15 + i * 0.08}s`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 30,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            letterSpacing: '0.14em',
                            color: ACCENT,
                            fontFamily: SANS,
                            fontWeight: 600,
                          }}
                        >
                          {lesson.number}
                        </span>
                        <span
                          style={{
                            fontSize: 26,
                            color: ACCENT,
                            fontStyle: 'italic',
                            lineHeight: 1,
                            fontFamily: SERIF,
                          }}
                        >
                          {lesson.emoji}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: 26,
                          fontWeight: 400,
                          lineHeight: 1.2,
                          margin: '0 0 8px',
                        }}
                      >
                        {lesson.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 14,
                          color: INK_SOFT,
                          fontFamily: SANS,
                          lineHeight: 1.6,
                          margin: '0 0 28px',
                        }}
                      >
                        {lesson.subtitle}
                      </p>

                      <div style={{ height: 1, background: BORDER, marginBottom: 18 }} />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: INK_FAINT,
                            fontFamily: SANS,
                            letterSpacing: '0.06em',
                          }}
                        >
                          {lesson.screens} ta ekran
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontFamily: SANS,
                            fontWeight: 500,
                            color: on ? ACCENT : INK_SOFT,
                            transition: 'color .25s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          Boshlash <span className="cc-arrow">→</span>
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}