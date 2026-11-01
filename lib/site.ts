// Edit this one file to personalize the whole site (text, links, SEO).
export const site = {
  // Your live domain — used for SEO tags, canonical URL, and the sitemap.
  url: "https://www.chuyutong.com",
  name: "Claire Tong",
  role: "Full Stack Developer",
  location: "San Francisco, CA",
  motto: "Dream. Code. Build.",
  // Hero subtitle: "I build" + a phrase that rotates with a blur-in animation
  subtitle: {
    prefix: "I build",
    phrases: [
      "calm, fast dashboards",
      "full-stack web apps",
      "iOS apps people enjoy",
      "games you can play in a browser",
      "things people actually enjoy using",
    ],
  },
  tagline:
    "A full stack developer who turns live data, APIs and half-formed ideas into products people actually enjoy using.",
  description:
    "Claire Tong is a full stack developer in San Francisco building fast, friendly, data-heavy web and mobile apps with React, Node and Django.",
  email: "claire.cy.tong@gmail.com",
  links: {
    github: "https://github.com/Starlla",
    linkedin: "https://www.linkedin.com/in/chuyutong/",
    instagram: "https://www.instagram.com/claire_illust/",
    resume: "https://drive.google.com/file/d/1ff3q-HRJxVWeX9L3hh9gjk5xFsEEn_t3/view?usp=sharing",
    twin: "https://clairetong-twin.hf.space/",
  },
  about: [
    "I'm a full stack developer who cares most about making data-heavy screens feel calm and fast: live APIs, charts and clean state.",
    "I'm frontend first, building interfaces that feel fast and friendly, and full-stack ready with Node, Express and MongoDB when a project needs it. I also build cross-platform mobile apps with React Native, and I obsess over the details: loading states, errors and edge cases.",
    "Off screen, I paint watercolors to unwind between commits — poppies, cherry blossoms and alpine meadows.",
  ],
  skills: [
    "React", "Angular", "Vite", "TypeScript", "Charts & live API data",
    "Node.js", "Express", "MongoDB", "Django", "PostgreSQL", "React Native / Expo", "Unity",
  ],
  projects: [
    {
      title: "Loophaus",
      kind: "Frontend",
      year: "2026",
      blurb:
        "A landing page for a fictional sharing platform for music producers. It has an animated canvas waveform with a moving playhead, accessible audience tabs, an interactive track card, and support for reduced motion.",
      tags: ["React", "Canvas", "ARIA"],
      href: "https://creative-website-cyan.vercel.app/",
      links: [
        { label: "Live site", href: "https://creative-website-cyan.vercel.app/" },
        { label: "GitHub", href: "https://github.com/Starlla/Creative-Website" },
      ],
    },
    {
      title: "2 Retro Prints",
      kind: "Mobile",
      year: "2026",
      blurb:
        "An iOS app that turns phone photos into print-ready Instax-style frames in a few taps. I designed, built, and released it to the App Store on my own.",
      tags: ["React Native", "TypeScript", "Expo"],
      href: "https://apps.apple.com/us/app/2-retro-prints/id6758162927",
      links: [{ label: "App Store", href: "https://apps.apple.com/us/app/2-retro-prints/id6758162927" }],
    },
    {
      title: "MERN Storefront",
      kind: "Full-stack",
      year: "2021",
      blurb:
        "A full shopping flow I built end to end: an Express REST API with JWT auth and admin routes, category and price filters, a cart, and Braintree checkout.",
      tags: ["React", "Node · Express", "MongoDB", "JWT", "Braintree"],
      href: "https://github.com/Starlla/ecommerce-front",
      links: [
        { label: "Frontend repo", href: "https://github.com/Starlla/ecommerce-front" },
        { label: "API repo", href: "https://github.com/Starlla/Ecommerce" },
      ],
    },
    {
      title: "Personal Website",
      kind: "Frontend",
      year: "2026",
      blurb:
        "A single-page React portfolio that presents projects as engineering decisions and embeds my AI digital twin so visitors can chat with it.",
      tags: ["React", "Vite", "Vercel", "Hugging Face"],
      href: "https://claire-personal-website-may-2026.vercel.app/",
      links: [{ label: "Live site", href: "https://claire-personal-website-may-2026.vercel.app/" }],
    },
    {
      title: "Unity Mini Games",
      kind: "Games",
      year: "",
      blurb:
        "Six small Unity games, each built around one classic mechanic: a platformer, a lunar lander, an endless runner, a Bomberman-style game, a color matcher, and a primitives arcade game. They're exported to WebGL so they play in the browser.",
      tags: ["Unity", "C#", "WebGL"],
      href: "https://cyoi.itch.io/",
      links: [
        { label: "Play on itch.io ▶", href: "https://cyoi.itch.io/" },
        { label: "Rabbit Run", href: "https://cyoi.itch.io/rabbit-run" },
        { label: "Lunar Lander", href: "https://cyoi.itch.io/lunarlander" },
      ],
    },
    {
      title: "ASCII Jellyfish",
      kind: "This site",
      year: "2026",
      blurb:
        "The animated background of this site: jellyfish drawn as text on a 2D canvas that drift toward your cursor, built with Next.js as a static export.",
      tags: ["Canvas", "TypeScript", "Next.js"],
      href: "https://github.com/Starlla/Personal_Portfolio_10_31_2026",
      links: [{ label: "GitHub", href: "https://github.com/Starlla/Personal_Portfolio_10_31_2026" }],
    },
  ],
  now: [
    { title: "Looking for my next role", text: "Frontend-focused and full-stack teams in SF." },
    { title: "Building data-heavy UIs", text: "Live APIs, charts, clean state." },
    { title: "Sharpening fundamentals", text: "Data structures, one problem at a time." },
    { title: "Always curious ☺", text: "Small UI experiments and watercolors on the side." },
  ],
  twinQuestions: [
    "What are you building right now?",
    "What's your tech stack?",
    "What kind of role are you looking for?",
    "Tell me about your projects",
  ],
};
