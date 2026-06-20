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
    subtitle: "Ranglar, shriftlar, bo'shliqlar",
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
    title: "PM — Storytelling: pitch",
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
    title: "PM — Muammo → Yechim",
    subtitle: "Har funksiya bitta og'riqni yopadi — dori (kerak) vs shirinlik (bezak)",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 14,
    number: "14",
    title: "JavaScript — O'zgaruvchilar",
    subtitle: "let, const, ma'lumot turlari — qiymatlarni saqlash",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 15,
    number: "15",
    title: "JavaScript — Shartlar (if/else)",
    subtitle: "if, else, taqqoslash — kompyuter qanday qaror qabul qiladi",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 16,
    number: "16",
    title: "JavaScript — Sikllar",
    subtitle: "for va while — takrorlanuvchi amallar",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 17,
    number: "17",
    title: "JavaScript — Funksiyalar",
    subtitle: "Funksiya, parametr va return — kodni qayta ishlatish",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 18,
    number: "18",
    title: "PM — Dekompozitsiya (MVP)",
    subtitle: "Katta g'oyani bosqichlarga bo'lish — feature list, MVP va backlog (skeytbord → mashina)",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 19,
    number: "19",
    title: "Praktika 1 — Saytni jonlantiramiz",
    subtitle: "Interaktivlik: JavaScript bilan saytga jon kiritamiz",
    screens: 18,
    emoji: "js",
    ready: true,
  },

  {
    id: 20,
    number: "20",
    title: "Praktika 2 — AI bilan tez sayt",
    subtitle: "AI yordamida sifatli promo landing yasash",
    screens: 18,
    emoji: "ai",
    ready: true,
  },

  {
    id: 21,
    number: "21",
    title: "PERN Stack — Katta saytlar qanday quriladi?",
    subtitle: "PostgreSQL + Express + React + Node.js — 4 texnologiya, bitta jamoa",
    screens: 18,
    emoji: "stack",
    ready: true,
  },

  {
    id: 22,
    number: "22",
    title: "Praktika 3 — Dekompozitsiya",
    subtitle: "Mini-do'kon (1-qism): vazifani bo'laklarga ajratish",
    screens: 18,
    emoji: "shop",
    ready: true,
  },

  {
    id: 23,
    number: "23",
    title: "Praktika 4 — MVP tayyor",
    subtitle: "Mini-do'kon (2-qism): tayyor mahsulotni yig'amiz",
    screens: 18,
    emoji: "mvp",
    ready: true,
  },

  {
    id: 24,
    number: "24",
    title: "PM — Demo Day: jonli pitch",
    subtitle: "Real saytingni 2 daqiqada jonli ko'rsat — show don't tell, skelet/teri/harakat (Demo Day finali)",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 25,
    number: "25",
    title: "React — Tanishuv",
    subtitle: "React nima va nega kerak — sahifa bloklardan qanday yig'iladi",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 26,
    number: "26",
    title: "PM — User Story (kim va nima uchun?)",
    subtitle: "Foydalanuvchi ehtiyojini yozish: [kim] sifatida, men [harakat]ni xohlayman, [natija] uchun",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 27,
    number: "27",
    title: "React — Birinchi komponent",
    subtitle: "JSX, npm run dev, o'z komponentingizni yozib ekranga chiqarish",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 28,
    number: "28",
    title: "React — State va useEffect",
    subtitle: "useState bilan xotira, useEffect bilan komponent hayoti",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 29,
    number: "29",
    title: "PM — Prioritet (Impact vs Effort)",
    subtitle: "Har komponent = fycha. Nimani avval qurish — foyda va kuch matritsasi (oson g'alaba)",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 30,
    number: "30",
    title: "React — Props",
    subtitle: "Bitta komponentni qayta ishlatish — ma'lumotni props orqali uzatish",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 31,
    number: "31",
    title: "React Praktika 1 — CRUD",
    subtitle: "To'liq boshqariladigan ilova: qo'shish, ko'rish, tahrirlash, o'chirish",
    screens: 17,
    emoji: "react",
    ready: true,
  },

  {
    id: 32,
    number: "32",
    title: "React — API GET",
    subtitle: "fetch bilan serverdan ma'lumot olish va ekranga chiqarish",
    screens: 18,
    emoji: "api",
    ready: true,
  },

  {
    id: 33,
    number: "33",
    title: "React — API POST",
    subtitle: "POST so'rovi bilan serverga yangi ma'lumot yuborish",
    screens: 19,
    emoji: "api",
    ready: true,
  },

  {
    id: 34,
    number: "34",
    title: "PM — Acceptance Criteria",
    subtitle: "Fycha qachon tayyor? Ish boshlashdan oldin aniq chek-list (ha/yo'q deb tekshiriladigan)",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 35,
    number: "35",
    title: "React Praktika 2 — Router",
    subtitle: "React Router bilan ko'p sahifali ilova qurish",
    screens: 17,
    emoji: "react",
    ready: true,
  },

  {
    id: 36,
    number: "36",
    title: "React Praktika 3 — Loyiha kuni",
    subtitle: "AvtoIjara: o'rgangan bilimlarni bitta loyihada birlashtiramiz",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 37,
    number: "37",
    title: "React Praktika 4 — Istalgan saytni qurish",
    subtitle: "Bo'laklash + aniq prompt bilan har qanday saytni quramiz",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 38,
    number: "38",
    title: "PM — Frontend mahsulotni topshirish",
    subtitle: "Vitrina vs ombor: F5 da ma'lumot nega o'chadi va mijozga halol topshirish — backendga ko'prik",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 39,
    number: "39",
    title: "Ma'lumot va bog'lanishlar",
    subtitle: "JSON, jadval, id va bog'lovchi, sxema — o'z ilovangiz xaritasini chizing",
    screens: 18,
    emoji: "data",
    ready: true,
  },

  {
    id: 40,
    number: "40",
    title: "PM — Metrikalar: qaysi raqam muhim?",
    subtitle: "AvtoIjara metrikalari: vanity vs actionable, teshik funnel va 'ma'lumot = qaror' — to'g'ri raqamni o'lchash",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 41,
    number: "41",
    title: "SQL vs NoSQL — nega PostgreSQL",
    subtitle: "Ikki dunyo: jadval vs hujjat. Qachon qaysi biri — qaror kompasi bilan tanlang",
    screens: 18,
    emoji: "db",
    ready: true,
  },

  {
    id: 42,
    number: "42",
    title: "Node.js — birinchi serveringiz",
    subtitle: "Server, npm, Express, endpoint. Birinchi serverni yozib, localda ishga tushiring",
    screens: 18,
    emoji: "server",
    ready: true,
  },

  {
    id: 43,
    number: "43",
    title: "Routing: server so'rovni qanday topadi",
    subtitle: "Method + path, HTTP method'lar, route param va Nest controller — @Post eshigini o'zingiz oching",
    screens: 18,
    emoji: "route",
    ready: true,
  },

  {
    id: 44,
    number: "44",
    title: "PostgreSQL so'rovlar — CRUD + AI bilan",
    subtitle: "Jadval yaratish, ma'lumot qo'shish/ko'rish/o'zgartirish/o'chirish (CRUD) va AI bilan SQL yozish",
    screens: 18,
    emoji: "db",
    ready: true,
  },

  {
    id: 45,
    number: "45",
    title: "PM — Xavfsizlik = foydalanuvchi ishonchi",
    subtitle: "AvtoIjara: .env va ma'lumot himoyasi = mahsulot qiymati. Sir ko'chirish, GitHub leak, GDPR oddiy tilda",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 46,
    number: "46",
    title: "Backend Praktika 1 — CRUD (AvtoIjara)",
    subtitle: "Sxemani qo'lda loyihalab, Express + PostgreSQL bilan CRUD backend quramiz",
    screens: 17,
    emoji: "db",
    ready: true,
  },

  {
    id: 47,
    number: "47",
    title: "API va Postman — front backend bilan qanday gaplashadi",
    subtitle: "So'rov/javob, GET/POST/PUT/DELETE va Postman bilan o'z API'ingizni chaqirish",
    screens: 18,
    emoji: "api",
    ready: true,
  },

  {
    id: 48,
    number: "48",
    title: "Backend Praktika 2 — Fullstack ulash (AvtoIjara)",
    subtitle: "Modul 3 React frontini serverga fetch bilan ulash — loading, error, CORS",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 49,
    number: "49",
    title: "Autentifikatsiya va .env — login, JWT, maxfiy kalitlar",
    subtitle: "Email orqali login, JWT token, route himoyasi (401) va secret'larni .env'ga ko'chirish",
    screens: 18,
    emoji: "auth",
    ready: true,
  },

  {
    id: 50,
    number: "50",
    title: "PM — Ma'lumot sxemasi = PRD hujjati",
    subtitle: "AvtoStoyanka sxemasi: joylar◄joy_id sessiyalar (FK/JOIN), har maydon mahsulot izohi, sxema ↔ roadmap",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 51,
    number: "51",
    title: "Backend Praktika 3 — Loyiha kuni (AvtoStoyanka)",
    subtitle: "Qorovul uchun to'liq fullstack panel: 2 jadval bog'lanishi (FK/JOIN), kirish-chiqish, tolov",
    screens: 19,
    emoji: "db",
    ready: true,
  },

  {
    id: 52,
    number: "52",
    title: "Backend Praktika 4 — Feedback bilan yaxshilash",
    subtitle: "AvtoStoyankani yaxshilash: fikr yig'ish, saralash (Impact/Effort), upgrade (tasdiq, dashboard, sozlamalar)",
    screens: 18,
    emoji: "react",
    ready: true,
  },

  {
    id: 53,
    number: "53",
    title: "PM — Fullstack arxitektura pitchi",
    subtitle: "AvtoStoyanka (React→Express→PostgreSQL) ni stakeholderga: arxitektura diagrammasi + texnik→biznes tarjima (Modul 4 PM finale)",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 54,
    number: "54",
    title: "Nest arxitektura — tirik ko'rish",
    subtitle: "Tayyor NestJS skeletni clone qilib, Swagger'da tirik API, fayl xaritasi va so'rov yo'lini ko'ramiz",
    screens: 20,
    emoji: "server",
    ready: true,
  },

  {
    id: 55,
    number: "55",
    title: "PM — Masshtablanuvchanlik = mahsulot qarori",
    subtitle: "Nega bitta jadval uchun 5 fayl? Bugungi arxitektura 6 oydan keyingi tezlikni belgilaydi — texnik qarz = mahsulot riski",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 56,
    number: "56",
    title: "Birinchi resursni qo'lda qo'shish",
    subtitle: "Admin avtosalon mashinalari (Car) jadvalini noldan: Entity → DTO → Service → Controller → Module → AppModule'ga ulash, Swagger'da tirik",
    screens: 20,
    emoji: "server",
    ready: true,
  },

  {
    id: 57,
    number: "57",
    title: "Praktika: KitobShop backend",
    subtitle: "AI agentni boshqarib 3 bog'langan resursli onlayn kitob do'koni: Category, Book, Order — auth, @ManyToOne bog'lanish va top kitoblar bilan",
    screens: 21,
    emoji: "server",
    ready: true,
  },

  {
    id: 58,
    number: "58",
    title: "Unit-test: Jest",
    subtitle: "Nega test kerak, Jest o'rnatish, birinchi test: describe / it / expect / toBe va npm test bilan PASS/FAIL",
    screens: 20,
    emoji: "server",
    ready: true,
  },

  {
    id: 59,
    number: "59",
    title: "PM — Sifat = mahsulot qiymati",
    subtitle: "Bug ↔ retention, test = talablar hujjati, happy path vs edge case (PM fikrlashi) — KitobShop orderTotal edge case ro'yxati",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 60,
    number: "60",
    title: "Edge cases va error path",
    subtitle: "Happy path yetarli emas: chegara holatlar (0, manfiy), noto'g'ri ma'lumot va exception'larni toThrow bilan sinash",
    screens: 20,
    emoji: "server",
    ready: true,
  },

  {
    id: 61,
    number: "61",
    title: "CI/CD nima va nega kerak",
    subtitle: "Continuous Integration / Deployment — deploy'ni avtomatlashtirish: zavod konveyeri, CI va CD farqi, pipeline stansiyalari",
    screens: 17,
    emoji: "cicd",
    ready: true,
  },

  {
    id: 62,
    number: "62",
    title: "PM — Reliz tezligi = raqobat ustunligi",
    subtitle: "Iteratsiya tezligi g'oyadan muhimroq. CI/CD = eksperiment infratuzilmasi — oyiga nechta eksperiment (CI/CD bilan vs bilmasdan)",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 63,
    number: "63",
    title: "GitHub Actions — birinchi konveyer",
    subtitle: "Workflow, job, step. Birinchi action: har push'da testlarni avtomatik ishga tushirish (.github/workflows/ci.yml)",
    screens: 18,
    emoji: "cicd",
    ready: true,
  },

  {
    id: 64,
    number: "64",
    title: "Loyiha kuni: to'liq konveyer",
    subtitle: "AvtoIjara (Backend + Frontend) — to'liq CI/CD: ikki job, build → Netlify, test → Render, secrets va env",
    screens: 18,
    emoji: "cicd",
    ready: true,
  },

  {
    id: 65,
    number: "65",
    title: "Loyiha kuni: AI bilan konveyer",
    subtitle: "Pipeline'ni AI promptlari bilan yasash (vibecoding) va AI xatolarini tutish — token secrets, npm test",
    screens: 18,
    emoji: "cicd",
    ready: true,
  },

  {
    id: 66,
    number: "66",
    title: "PM — Monitoring = mahsulot metrikasi",
    subtitle: "Uptime, latency, error rate — ishonchlilik metrikalari. SLA va ishonch; 99% = yiliga 3.6 kun o'chiq! Maqbul uptime'ni belgilang",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 67,
    number: "67",
    title: "Loyiha kuni: to'liq professional konveyer",
    subtitle: "Test, lint, deploy va monitoring — o'z loyihangiz uchun to'liq professional pipeline, alert va CI badge",
    screens: 18,
    emoji: "cicd",
    ready: true,
  },

  {
    id: 68,
    number: "68",
    title: "Bot nima: trigger va action",
    subtitle: "Bot — signalga reaksiya qiladigan dastur: event-driven mantiq (trigger → action), arxitektura (Telegram → Bot API → kod) va bot tsikli",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 69,
    number: "69",
    title: "PM — Birinchi foydalanuvchilar: strategiya",
    subtitle: "Pulsiz birinchi 20 foydalanuvchini yig'ish — shaxsiy kanallar, sinf chati, og'izdan-og'iz (o'smir growth hacking). Birinchi 20 rejasini yozasiz",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 70,
    number: "70",
    title: "Telegram Bot API + tugmalar",
    subtitle: "BotFather va token, .env'da saqlash, NestJS + Telegraf arxitekturasi, /start handler va ctx, inline hamda reply tugmalar",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 71,
    number: "71",
    title: "Stateful logika + PostgreSQL",
    subtitle: "Bot xotirasiz (stateless) — unga xotira beramiz: suhbat holati va PostgreSQL (INSERT/SELECT/UPDATE) bilan ma'lumotni saqlash, restart'dan keyin ham eslab qolish",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 72,
    number: "72",
    title: "Loyiha kuni: AI bilan istalgan bot",
    subtitle: "AI promptlari bilan to'liq bot qurish: reja (trigger→action), aniq prompt, AI kodini o'qish, test va tuzatish (vibecoding sikli)",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 73,
    number: "73",
    title: "AI-bot: botga AI miya ulash",
    subtitle: "Rule-bot → AI-bot: AI API (Claude) ulash, system prompt bilan xulqni sozlash, AI-bot reaktivligi (faqat gapiradi)",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 74,
    number: "74",
    title: "Mini-loyiha: bot + DB + AI + hosting",
    subtitle: "Loyiha kuni: tugma (T2) + AI miya (P2) + xotira/DB (T3) ni bitta botga yig'ish, hosting bilan serverga chiqarib 24/7 jonli qilish, polling vs webhook va deploy oqimi",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 75,
    number: "75",
    title: "PM — Custdev: jonli foydalanuvchilar bilan",
    subtitle: "Foydalanuvchini bezovta qilmasdan fidbek yig'ish — 5-savol shabloni, yetaklovchi vs ochiq savol, jonli intervyu simulyatori. 5 mini-intervyu rejasini tuzasiz",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 76,
    number: "76",
    title: "Fidbek va iteratsiya",
    subtitle: "Foydalanuvchi fikrini saralash (triaj), prioritet (chastota × ta'sir), noaniq fikrni aniq o'zgarishga aylantirish va iteratsiya sikli: tingla → tuzat → qayta tingla",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 77,
    number: "77",
    title: "AI-agent: idrok → qaror → amal",
    subtitle: "AI-bot (gapiradi) → AI-agent (amal qiladi): maqsadga yo'naltirilgan sikl idrok → qaror → amal, asboblar (tools), agentni promptbilan qurish va xavfsizlik chegaralari (guardrails)",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 78,
    number: "78",
    title: "PM — Foydalanuvchi yig'ish + metrikalar",
    subtitle: "PM1 rejasini ishga tushir; bot metrikalari (DAU, retention, komandalar) va raqamni o'qish — jonli panel + data detektiv. Birinchi metrika hisobotini yozasiz (acquisition finali)",
    screens: 18,
    emoji: "pm",
    ready: true,
  },

  {
    id: 79,
    number: "79",
    title: "Komponentlardan tizim",
    subtitle: "Real mahsulot — komponentlar tizimi: Frontend + Backend + Database + AI + Bot qanday bog'lanadi, ma'lumot oqimi (Front→Back→DB) va 'ko'p eshik, bitta tizim'; o'z arxitekturangizni chizish",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 80,
    number: "80",
    title: "PM: PRD nima (mahsulot talablari hujjati)",
    subtitle: "Qurishdan oldin bir sahifalik PRD: Muammo / Auditoriya / Yechim / Metrika. Muammodan boshlash, aniq auditoriya, NIMA tilidagi yechim, actionable metrika. O'z PRD'ingizni yozasiz",
    screens: 18,
    emoji: "bot",
    ready: true,
  },

  {
    id: 81,
    number: "81",
    title: "Arxitektura patternlari",
    subtitle: "Tizimni tashkil qilish andozalari: MVC (Model-View-Controller) va monolit vs mikroservis — qachon qaysi; tizimni pattern bilan ta'riflash",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 82,
    number: "82",
    title: "AI-agent — arxitektura komponenti",
    subtitle: "Oddiy AI ↔ agent farqi (tizim nuqtai nazaridan), agent toollar (DB/API/bot) orqali tizimga ulanishi va qachon agent, qachon oddiy AI ishlatish",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 83,
    number: "83",
    title: "Claude Skills — nima va qanday",
    subtitle: "Skill — AI uchun yozma yo'riqnoma (SKILL.md): frontmatter (name/description) + body, description rolini va progressive disclosure'ni tushunish, tayyor skillni o'qish va tahlil qilish",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 84,
    number: "84",
    title: "PM: Etika va mas'uliyat (AI-mahsulot)",
    subtitle: "AI bilan nima noto'g'ri ketishi mumkin (gallyutsinatsiya, zararli amal, maxfiylik); PM riskar uchun mas'ul; cheklov (guardrail) = mahsulot qarori. O'z AI-agentingiz risklari + himoyasini yozasiz",
    screens: 18,
    emoji: "bot",
    ready: true,
  },

  {
    id: 85,
    number: "85",
    title: "O'z Skill'ingizni yozish",
    subtitle: "Aniq description + body (qadamlar va misol) yozish, skillni test qilish va kontekst-injiniring bilan yaxshilash (yoz → test → tuzat → qayta test)",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 86,
    number: "86",
    title: "Pipeline: barcha qismni bitta tizimga ulaymiz",
    subtitle: "React + Node.js + PostgreSQL + Telegram + AI — 5 komponentni bitta ishlaydigan pipeline'ga ulash. Qurilishni AI-promptlar boshqaradi (vibecoding): aniq prompt → AI kod → test → tuzat",
    screens: 18,
    emoji: "bot",
    ready: true,
  },

  {
    id: 87,
    number: "87",
    title: "React Native — asoslari",
    subtitle: "React bilimi bilan haqiqiy mobil ilova: React'dan farqi (View, Text, StyleSheet), Expo va Expo Go (QR) bilan telefonda ko'rish, birinchi ekranni yig'ish",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 88,
    number: "88",
    title: "RN: komponent, navigatsiya, API",
    subtitle: "Ko'p ekranli ilova: FlatList va komponentlar, Stack Navigator (push/pop), backend'dan fetch (o'sha Node.js API) va AsyncStorage bilan telefonda saqlash",
    screens: 17,
    emoji: "bot",
    ready: true,
  },

  {
    id: 89,
    number: "89",
    title: "Praktika: mobil ilova (mini-do'kon)",
    subtitle: "Loyiha kuni: mini-do'konning mobil versiyasini qurish (React Native) — o'sha backendga ulanadi. List + Detail + Savat + Checkout, telefonda test, sayqal va Expo Go bilan deploy/ulashish (vibecoding)",
    screens: 18,
    emoji: "bot",
    ready: true,
  },

  {
    id: 90,
    number: "90",
    title: "PM: Roadmap — mahsulot rejalashtirish",
    subtitle: "Dorojnaya karta qanday quriladi: horizontlar (Hozir / 3 oy / 6 oy) va RICE bilan prioritet — (Reach × Impact × Confidence) ÷ Effort. O'z tizimingiz uchun 3-oylik roadmap yozasiz",
    screens: 18,
    emoji: "bot",
    ready: true,
  },

  {
    id: 91,
    number: "91",
    title: "Loyiha kuni: to'liq tizim (kurs finali)",
    subtitle: "Hamma qismni bitta tizimga yig'amiz: web + mobil + bot + backend + baza + AI. Ko'p kanal — bitta backend, end-to-end test, integratsiya bug'ini topib tuzatish va ishga tushirish. Kursning yakuniy capstone'i",
    screens: 18,
    emoji: "bot",
    ready: true,
  },

  {
    id: 92,
    number: "92",
    title: "PM: Metrikali pitch — Demo Day 3",
    subtitle: "IT-auditoriya uchun pitch strukturasi (Muammo→Demo→Arxitektura→Metrika→So'rov); metrika = isbot; arxitektura sxemasi — kuchli slayd. 3-daqiqalik pitchni repetitsiya qilasiz. Kursning yakuniy darsi",
    screens: 18,
    emoji: "bot",
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
    to: 24,
  },
  {
    id: 3,
    label: "Modul 03",
    title: "React",
    subtitle: "Komponentlar, state, props va serverlar — zamonaviy frontend",
    from: 25,
    to: 38,
  },
  {
    id: 4,
    label: "Modul 04",
    title: "Ma'lumot va backend",
    subtitle: "Node.js + PostgreSQL — ma'lumot, jadval, bog'lanish va sxema",
    from: 39,
    to: 53,
  },
  {
    id: 5,
    label: "Modul 05",
    title: "Nest arxitektura",
    subtitle: "Professional NestJS qatlamli arxitektura — clone, sikl, agent bilan loyiha qurish",
    from: 54,
    to: 57,
  },
  {
    id: 6,
    label: "Modul 06",
    title: "Loyihani testlash",
    subtitle: "Jest bilan unit-test — kodingizni kompyuter avtomatik tekshiradi, happy path va edge case",
    from: 58,
    to: 60,
  },
  {
    id: 7,
    label: "Modul 07",
    title: "CI/CD + Deploy",
    subtitle: "Zavod konveyeri — test, build va deploy'ni avtomatlashtirish: GitHub Actions va to'liq pipeline",
    from: 61,
    to: 67,
  },
  {
    id: 8,
    label: "Modul 08",
    title: "Botlar va avtomatizatsiya",
    subtitle: "Telegram botlar — trigger → action, NestJS + Telegraf, holat + PostgreSQL va AI bilan istalgan botni qurish",
    from: 68,
    to: 78,
  },
  {
    id: 9,
    label: "Modul 09",
    title: "Tizimni yaxlit yig'aman",
    subtitle: "Arxitektura fikrlash + Claude Skills + React Native (mobil) + to'liq tizim — kursning yakuniy capstone moduli",
    from: 79,
    to: 92,
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