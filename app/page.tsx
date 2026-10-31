import JellyfishCanvas from "@/components/JellyfishCanvas";
import Diver from "@/components/Diver";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      {/* Decorative background — real, crawlable text sits on top of it */}
      <JellyfishCanvas />
      {/* Side diver: wide screens only */}
      <Diver />

      <header className="nav">
        <a href="#top" className="logo">clairetong<span>_</span></a>
        <nav>
          <a href="#about">about</a>
          <a href="#work">work</a>
          <a href="#now">now</a>
          <a href="#twin">twin</a>
          <a href="#contact">contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="eyebrow">{site.role} · {site.location}</p>
          <h1>{site.name}</h1>
          <h2>{site.motto}</h2>
          <p className="tagline">{site.tagline}</p>
          <div className="cta">
            <a className="btn primary" href="#work">See my work</a>
            <a className="btn" href={site.links.resume} target="_blank" rel="noopener">View résumé</a>
          </div>
          <p className="status"><span className="dot" /> Open to full stack roles</p>
        </section>

        <section id="about" className="panel">
          <h3><span>01.</span> About</h3>
          {site.about.map((p) => <p key={p}>{p}</p>)}
          <ul className="skills">
            {site.skills.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>

        <section id="work" className="panel">
          <h3><span>02.</span> Featured work</h3>
          <div className="grid">
            {site.projects.map((p) => (
              <article key={p.title} className="card">
                <p className="meta">{p.kind}{p.year && ` · ${p.year}`}</p>
                <h4><a href={p.href} target="_blank" rel="noopener">{p.title}</a></h4>
                <p>{p.blurb}</p>
                <ul className="tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                {p.links && (
                  <p className="links">
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener">{l.label} ↗</a>
                    ))}
                  </p>
                )}
              </article>
            ))}
          </div>
          <div className="cta">
            <a className="btn" href={site.links.github} target="_blank" rel="noopener">More on GitHub ↗</a>
          </div>
        </section>

        <section id="now" className="panel">
          <h3><span>03.</span> Now</h3>
          <ul className="now">
            {site.now.map((n) => (
              <li key={n.title}><strong>{n.title}</strong><span>{n.text}</span></li>
            ))}
          </ul>
        </section>

        <section id="twin" className="panel">
          <h3><span>04.</span> Chat with my digital twin</h3>
          <p>
            An AI version of me that knows my background, projects and career goals. Ask it anything
            you&apos;d ask in a first call, any time of day.
          </p>
          <div className="chips">
            {site.twinQuestions.map((q) => (
              <a key={q} className="chip" href={site.links.twin} target="_blank" rel="noopener">{q}</a>
            ))}
          </div>
          <div className="cta">
            <a className="btn primary" href={site.links.twin} target="_blank" rel="noopener">Start chatting</a>
          </div>
          <p className="fine">Answers are AI-generated, so confirm the important stuff with the real me.</p>
        </section>

        <section id="contact" className="panel">
          <h3><span>05.</span> Let&apos;s build something awesome together</h3>
          <p>Hiring for a full stack role, or have a project in mind? My inbox is always open.</p>
          <div className="cta">
            <a className="btn primary" href={`mailto:${site.email}`}>{site.email}</a>
            <a className="btn" href={site.links.resume} target="_blank" rel="noopener">Résumé</a>
            <a className="btn" href={site.links.github} target="_blank" rel="noopener">GitHub</a>
            <a className="btn" href={site.links.linkedin} target="_blank" rel="noopener">LinkedIn</a>
            <a className="btn" href={site.links.instagram} target="_blank" rel="noopener">Instagram</a>
          </div>
        </section>
      </main>

      <footer>© {new Date().getFullYear()} {site.name} · Built with Next.js</footer>
    </>
  );
}
