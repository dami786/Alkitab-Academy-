import { Link } from "react-router-dom";
import { useContent } from "../content.jsx";

function Heading({ eyebrow, title, text, note, urdu = false }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-goldDeep">{eyebrow}</p>
      <h2 className={`mt-3 font-extrabold text-pine ${urdu ? "urdu text-2xl md:text-3xl" : "text-3xl md:text-4xl"}`} dir={urdu ? "rtl" : undefined}>{urdu ? <Honorific>{title}</Honorific> : title}</h2>
      {note && <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-goldDeep">{note}</p>}
      <div className="gold-line mx-auto mt-4" />
      {text && <p className="mt-5 text-base leading-8 text-muted">{text}</p>}
    </div>
  );
}

function Honorific({ children }) {
  const pieces = String(children).split("ﷺ");
  return pieces.map((piece, index) => (
    <span key={`${index}-${piece.slice(0, 8)}`}>
      {piece}
      {index < pieces.length - 1 && <span className="honorific">ﷺ</span>}
    </span>
  ));
}

function Icon({ children }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pine/10 text-pine">{children}</span>
  );
}

export default function Home() {
  const { content, error } = useContent();

  if (!content) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-lg font-semibold text-pine">{error || "Loading the competition page…"}</p>
      </div>
    );
  }

  const provinces = [...new Set(content.centers.map((center) => center.province))];

  return (
    <div>
      <section className="pattern">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-pine/15 bg-white px-4 py-2 text-sm font-semibold text-pine shadow-sm">
            <span className="h-2 w-2 rounded-full bg-gold" />
            {content.hero.badge}
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight text-pine md:text-6xl">
            <Honorific>{content.hero.title}</Honorific>
          </h1>
          <p className="urdu mx-auto mt-6 max-w-3xl text-base text-ink md:text-lg" dir="rtl">
            <Honorific>{content.hero.urduTitle}</Honorific>
          </p>
          <p className="urdu mx-auto mt-2 max-w-3xl text-sm text-goldDeep md:text-base" dir="rtl">
            <Honorific>{content.hero.tagline}</Honorific>
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted md:text-lg"><Honorific>{content.hero.intro}</Honorific></p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {content.registrationOpen ? (
              <Link to="/register" className="btn-primary px-8">Apply for Admission</Link>
            ) : (
              <span className="inline-flex rounded-full bg-neutral-400 px-8 py-3 text-sm font-semibold text-white">Registration Closed</span>
            )}
            <Link to="/status" className="btn-outline px-8">Check Registration Status</Link>
          </div>
          <div className="mx-auto mt-12 overflow-hidden rounded-[28px] border border-gold/50 bg-white shadow-card">
            <img src="/hero.jpg" alt="Rahmat-e-Kainat Quiz Competition 2026-27, coming soon" className="h-auto w-full" decoding="async" fetchPriority="high" />
          </div>
        </div>
      </section>

      <section id="about" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Heading eyebrow="Introduction" title="About the Competition" text={content.about.purpose} />
          <div className="card mb-8 p-6 md:p-10" dir="rtl">
            <p className="urdu text-center text-base text-ink md:text-lg"><Honorific>{content.about.urduIntro}</Honorific></p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="card p-7">
              <Icon>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>
              </Icon>
              <h3 className="mt-4 text-2xl font-extrabold text-pine">Our Mission</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{content.about.mission}</p>
            </article>
            <article className="card p-7">
              <Icon>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></svg>
              </Icon>
              <h3 className="mt-4 text-2xl font-extrabold text-pine">Our Vision</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{content.about.vision}</p>
            </article>
          </div>

          <article className="card mt-6 p-7 md:p-10">
            <h3 className="text-2xl font-extrabold text-pine">Core Objectives</h3>
            <ul className="mt-6 space-y-4">
              {content.about.objectives.map((item, index) => (
                <li key={item} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pine text-xs font-bold text-white">{index + 1}</span>
                  <p className="pt-1 text-sm leading-7 text-ink">{item}</p>
                </li>
              ))}
            </ul>
          </article>

          <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-5">
            <article className="card overflow-hidden lg:col-span-3">
              <div className="grid items-stretch md:grid-cols-[300px_1fr]">
                <div className="flex items-center justify-center bg-[#d7eef8]">
                  <img
                    src="/founder.jpg"
                    alt="Khizar Hayyat Abbasi, Founder and Project Director"
                    className="h-auto w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-goldDeep">Project leadership</p>
                  <h3 className="mt-2 text-2xl font-extrabold text-pine">Khizar Hayyat Abbasi</h3>
                  <p className="mt-1 font-semibold text-moss">{content.about.founderTitle}</p>
                  <p className="text-sm font-semibold text-pine">{content.about.founderOrg}</p>
                  <p className="mt-4 text-sm leading-7 text-muted">{content.about.founder}</p>
                </div>
              </div>
            </article>
            <article className="rounded-3xl bg-pine p-7 text-white shadow-card lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Event highlights</p>
              <h3 className="mt-2 text-2xl font-extrabold text-white">{content.about.highlightsTitle}</h3>
              <p className="mt-4 text-sm leading-7 text-white/85">{content.about.highlights}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="prizes" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Heading
            eyebrow="Rewards & Recognition"
            title="Cash Prizes, Awards & Certificates"
            note="Honouring Excellence in Seerah"
            text={<Honorific>To appreciate students’ dedication and promote the study of the blessed Seerah of Prophet Muhammad ﷺ, the Rahmat-e-Kainat ﷺ Seerah Quiz Competition 2026–27 offers cash prizes, awards, and certificates to outstanding participants.</Honorific>}
          />
          <div className="mx-auto mb-10 max-w-3xl overflow-hidden rounded-[28px] border border-gold/50 bg-white shadow-card">
            <img
              src="/prizes.jpg"
              loading="lazy"
              decoding="async"
              alt="Rahmat-e-Kainat Quiz Competition 2026–27 cash prizes: first prize 300,000 PKR, second prize 200,000 PKR, and third prize 100,000 PKR"
              className="h-auto w-full"
            />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              {content.prizes.map((prize) => (
                <article key={prize.place} className="card flex items-center gap-4 p-5">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-pine text-sm font-extrabold text-white">{prize.place}</span>
                  <div>
                    <h3 className="text-lg font-extrabold text-pine">{prize.title}</h3>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-goldDeep">{prize.amount}</p>
                    <p className="text-sm text-muted">{prize.detail}</p>
                  </div>
                </article>
              ))}
            </div>
            <article className="card flex flex-col justify-center p-8">
              <h3 className="text-2xl font-extrabold text-pine">Top 20 Position Holders</h3>
              <p className="mt-4 leading-8 text-muted">{String(content.top100).replace(/\btop 100\b/gi, "top 20")}</p>
              <p className="urdu mt-6 text-base text-ink" dir="rtl">
                <Honorific>ملکی سطح پر پہلی پوزیشن کے لیے تین لاکھ، دوسری کے لیے دو لاکھ اور تیسری پوزیشن کے لیے ایک لاکھ روپے کا انعام رکھا گیا ہے۔ یہ انعام حوصلہ افزائی ہے، اصل کامیابی سیرتِ رسول اللہ ﷺ کو پڑھنا، سمجھنا اور اس پر عمل کرنا ہے۔</Honorific>
              </p>
              <Link to="/register" className="btn-primary mt-8 self-start">Register Today</Link>
            </article>
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-7 text-muted">{content.rewardsNote}</p>
        </div>
      </section>

      <section id="syllabus" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Heading eyebrow="Books & Syllabus" title="سیرتِ نبوی ﷺ کا منتخب نصاب" urdu />
          <div className="card p-7 md:p-10">
            <p className="urdu text-base text-ink" dir="rtl"><Honorific>{content.syllabus.urdu}</Honorific></p>
            <p className="mt-6 leading-8 text-muted">{content.syllabus.english}</p>
          </div>
          <div className="mt-6 grid items-stretch gap-6 md:grid-cols-2">
            {content.books.map((book, index) => {
              const image = ["/book-raheeq.jpg", "/book-aasan.png"][index] || book.image;
              return (
                <article key={book.english} className="card flex h-full flex-col overflow-hidden">
                  {image && (
                    <img src={image} alt={book.english} className="h-72 w-full bg-[#f6efe2] object-contain sm:h-80" loading="lazy" decoding="async" />
                  )}
                  <div className="flex flex-1 flex-col p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-goldDeep">Book {index + 1}</p>
                    <h3 className="urdu mt-3 text-xl text-pine" dir="rtl"><Honorific>{book.title}</Honorific></h3>
                    <p className="urdu mt-2 text-sm text-muted" dir="rtl"><Honorific>{book.author}</Honorific></p>
                    <p className="mt-4 text-sm font-semibold text-ink">{book.english}</p>
                    {book.link && (
                      <a href={book.link} target="_blank" rel="noreferrer" className="btn-primary mt-6 self-start">
                        Open book PDF
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mx-auto mt-8 max-w-3xl rounded-2xl bg-gold/30 px-5 py-4 text-center text-base font-extrabold leading-7 text-pine">
            If you want to purchase these books, please contact this number:{" "}
            <a href="tel:+923473371350" className="underline">+92347-3371350</a>
          </p>
        </div>
      </section>

      <section id="eligibility" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Heading eyebrow="Participation Criteria" title="Eligibility Guidelines" text="Please read these conditions before you apply. One candidate may submit only one registration." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {content.eligibility.map((item) => (
              <article key={item.title} className="card p-6">
                <h3 className="text-lg font-extrabold text-pine">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="centers" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Heading
            eyebrow="Province / District"
            title="Test Centers"
            text="Choose your province and city while registering. The exact test center is not confirmed yet. It will be printed on your roll number slip when the academy announces it."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {provinces.map((province) => (
              <article key={province} className="card p-6">
                <h3 className="text-lg font-extrabold text-pine">{province}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {content.centers
                    .filter((center) => center.province === province)
                    .map((center) => (
                      <span key={center.city} className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-pine">
                        {center.city}
                      </span>
                    ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="timeline" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Heading eyebrow="Important Dates" title="Timeline" text="Dates can be updated by the academy. The date printed on your admit card is the date to follow." />
          <div className="grid gap-5 md:grid-cols-4">
            {content.timeline.map((item, index) => (
              <article key={item.title} className="card p-6">
                <span className="text-sm font-extrabold text-goldDeep">0{index + 1}</span>
                <h3 className="mt-3 text-lg font-extrabold text-pine">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4">
          <Heading eyebrow="Help" title="Frequently Asked Questions" />
          <div className="space-y-3">
            {content.faq.map((item) => (
              <details key={item.q} className="card group p-5">
                <summary className="cursor-pointer list-none font-bold text-pine">{item.q}</summary>
                <p className="mt-3 text-sm leading-7 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-[32px] bg-pine px-6 py-12 text-center text-white md:px-12">
            <h2 className="text-3xl font-extrabold">Begin the blessed journey of Seerah</h2>
            <p className="urdu mx-auto mt-4 max-w-2xl text-base text-white/85" dir="rtl">
              <Honorific>آج ہی رجسٹریشن کریں اور سیرتِ مصطفیٰ ﷺ کے اس بابرکت سفر کا آغاز کریں۔</Honorific>
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-gold">Apply for Admission</Link>
              <Link to="/contact" className="btn-outline !border-white/30 !bg-transparent !text-white">Contact the Academy</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
