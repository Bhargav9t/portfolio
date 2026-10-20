export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  fullDetails: string;
  tags: string[];
  award?: string;
  githubUrl?: string;
  liveUrl?: string;
  stats?: { label: string; value: string }[];
  featured?: boolean;
}

export interface Publication {
  id: string;
  title: string;
  venue: string;
  year: number;
  authors: string[];
  abstract: string;
  doi?: string;
  pdfUrl?: string;
  citations?: number;
  highlight?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  highlights: string[];
  technologies: string[];
}

export interface BuildingConfig {
  id: "about" | "projects" | "publications" | "experience" | "contact";
  number: string;
  label: string;
  subtitle: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  vel: number;
  amp: number;
  pos: number;
  cameraOffset: [number, number, number];
}

export interface SpawnLocation {
  x: number;
  z: number;
  rotationY: number;
}

// Procedural spawn generator ensuring varied, non-overlapping monolith spawn locations every session
export function generateMonolithSpawnLocations(
  count: number = 5,
  minDist: number = 2.0
): SpawnLocation[] {
  const positions: SpawnLocation[] = [];
  const xMin = -4.8;
  const xMax = 4.8;
  const zMin = -2.8;
  const zMax = 0.8;

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = xMin + Math.random() * (xMax - xMin);
      const z = zMin + Math.random() * (zMax - zMin);

      let tooClose = false;
      for (const p of positions) {
        const dx = p.x - x;
        const dz = p.z - z;
        if (Math.sqrt(dx * dx + dz * dz) < minDist) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        positions.push({
          x: Math.round(x * 100) / 100,
          z: Math.round(z * 100) / 100,
          rotationY: Math.round((Math.random() - 0.5) * 0.8 * 100) / 100,
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      const step = (xMax - xMin) / Math.max(1, count - 1);
      const fallbackX = xMin + i * step + (Math.random() - 0.5) * 0.4;
      const fallbackZ = (zMin + zMax) / 2 + (Math.random() - 0.5) * 1.4;
      positions.push({
        x: Math.round(fallbackX * 100) / 100,
        z: Math.round(fallbackZ * 100) / 100,
        rotationY: Math.round((Math.random() - 0.5) * 0.6 * 100) / 100,
      });
    }
  }

  // Sort left-to-right along the horizon so 01 to 05 flow logically
  positions.sort((a, b) => a.x - b.x);

  return positions;
}

// 5 Elegantly Proportioned Monolith Buildings across the ocean horizon
export const BUILDINGS: BuildingConfig[] = [
  {
    id: "about",
    number: "01",
    label: "ABOUT",
    subtitle: "Identity & Philosophy",
    position: [-5.2, 0, -1.2],
    scale: [0.85, 2.0, 0.85],
    rotationY: 0.15,
    vel: 2.2,
    amp: 1.8,
    pos: 0.1,
    cameraOffset: [-4.6, 1.6, 2.6],
  },
  {
    id: "projects",
    number: "02",
    label: "PROJECTS",
    subtitle: "Key Engineered Systems",
    position: [-2.6, 0, -2.2],
    scale: [0.95, 2.5, 0.95],
    rotationY: -0.06,
    vel: 2.9,
    amp: 2.2,
    pos: 0.12,
    cameraOffset: [-2.2, 1.9, 2.2],
  },
  {
    id: "publications",
    number: "03",
    label: "PUBLICATIONS",
    subtitle: "Research & Awards",
    position: [0.0, 0, -2.8],
    scale: [1.0, 2.8, 1.0],
    rotationY: 0.0,
    vel: 2.6,
    amp: 2.0,
    pos: 0.11,
    cameraOffset: [0.0, 2.1, 2.0],
  },
  {
    id: "experience",
    number: "04",
    label: "EXPERIENCE",
    subtitle: "Career & Leadership",
    position: [2.6, 0, -2.2],
    scale: [0.95, 2.3, 0.95],
    rotationY: 0.06,
    vel: 2.1,
    amp: 1.9,
    pos: 0.1,
    cameraOffset: [2.2, 1.8, 2.2],
  },
  {
    id: "contact",
    number: "05",
    label: "CONTACT",
    subtitle: "Signal Transmission",
    position: [5.2, 0, -1.2],
    scale: [0.85, 1.9, 0.85],
    rotationY: -0.15,
    vel: 2.4,
    amp: 1.7,
    pos: 0.09,
    cameraOffset: [4.6, 1.6, 2.6],
  },
];

// Palette Presets from User Reference
export const COLOR_PALETTE = {
  spaceCadet: 0x25344f,   // #25344F (Space Cadet / Deep Midnight Navy)
  slateGray: 0x617891,    // #617891 (Slate Gray / Twilight Sky & Ocean Midtones)
  tan: 0xd5b893,          // #D5B893 (Tan / Sunlight, Golden Glow & Parchment Scroll)
  coffee: 0x6f4d38,       // #6F4D38 (Coffee / Warm Earthy Dusk & Cork Stopper)
  caputMortuum: 0x632024, // #632024 (Caput Mortuum / Sunset Crimson & Wax Seal)
  // Backward compatibility aliases
  tronCyan: 0xd5b893,
  tronElectricBlue: 0x617891,
  tronOrange: 0x6f4d38,
  tronEmerald: 0x2e9e55,
  tronWhite: 0xe0f8ff,
  gridBlack: 0x25344f,
};

export const PORTFOLIO_DATA = {
  profile: {
    name: "Chinipilli Bhargav Reddy",
    shortName: "Bhargav Reddy",
    handle: "bhargav-reddy",
    role: "AI & Machine Learning Engineer | Full-Stack Systems Architect",
    tagline: "Driven B.Tech student in Artificial Intelligence and Machine Learning with award-winning experience in full-stack development, systems architecture, and AI integration.",
    location: "Hyderabad, Telangana, India",
    phone: "+91 8317604705",
    email: "Bhargavreddy9t@gmail.com",
    github: "https://github.com/Bhargav9t",
    linkedin: "https://www.linkedin.com/in/bhargav-reddy-6369b732b/",
    bio: [
      "I am a B.Tech student specializing in Artificial Intelligence and Machine Learning at Hyderabad Institute of Technology and Management (HITAM), actively engineering end-to-end full-stack architectures and machine learning systems.",
      "My work spans leading research & development initiatives, developing encrypted cross-device synchronization networks, and creating gamified AI solutions that have won competitive recognitions across university expos and national hackathons.",
      "I believe in mastering fundamental engineering and robust software craftsmanship, building real-world solutions that bridge academic concepts with scalable industry applications."
    ],
    stats: [
      { label: "Awards & Honors", value: "4 Wins" },
      { label: "Published Papers", value: "1 Paper" },
      { label: "Intermediate Score", value: "93.4%" },
      { label: "SSC CGPA", value: "8.8" }
    ],
    skills: {
      languages: ["Python", "Java", "C", "SQL", "JavaScript"],
      frameworks: ["FastAPI", "React 19", "Vite", "Tailwind CSS", "Three.js"],
      backendCloud: ["Docker", "Supabase", "Neon", "SQL Databases", "Render", "Vercel", "Hostinger"],
      aiTools: ["Machine Learning", "AI Integration", "Local AI Models", "Linux", "Git", "MSYS2", "Fernet Encryption", "Progressive Web Apps (PWA)"]
    },
    certifications: [
      "Machine Learning Certification",
      "Anthropic Claude Certifications"
    ],
    hackathons: [
      "Bharatiya Antariksh Hackathon",
      "WED WFEO Hackathon",
      "Google XPrize",
      "Google Gemini 3 Hackathon"
    ]
  },

  projects: [
    {
      id: "career-ladder",
      title: "Career Ladder",
      category: "AI & EdTech Architecture",
      featured: true,
      award: "1st Prize, Project Expo | 3rd Prize, Aavishkar Manthan 2026 (Malnad University)",
      description: "AI-powered career advancement platform centralizing job-market aggregation and automating resume analysis.",
      fullDetails: "Engineered an intelligent career planning ecosystem that aggregates live job-market data and applies automated resume evaluation to streamline student job searches, identifying key skill gaps and tailored growth roadmaps.",
      tags: ["AI Integration", "React 19", "FastAPI", "Python", "Docker"],
      githubUrl: "https://github.com/Bhargav9t/Career-Ladder-EDCNE",
      liveUrl: "https://github.com/Bhargav9t/Career-Ladder-EDCNE",
      stats: [
        { label: "Project Expo", value: "1st Prize" },
        { label: "Aavishkar Manthan", value: "3rd Prize" }
      ]
    },
    {
      id: "ecotracker",
      title: "EcoTracker",
      category: "Sustainability & Gamification",
      featured: true,
      award: "3rd Prize, Market Minds",
      description: "Gamified, Duolingo-inspired sustainability web application monitoring daily carbon footprints across travel, energy, and diet.",
      fullDetails: "Designed and built an interactive gamified UI that calculates carbon footprints and rewards users with milestones and points, incentivizing positive environmental behavioral changes.",
      tags: ["React", "Tailwind CSS", "JavaScript", "Gamification", "Supabase"],
      githubUrl: "https://github.com/Bhargav9t",
      stats: [
        { label: "Market Minds", value: "3rd Prize" },
        { label: "Domains Tracked", value: "3 Sectors" }
      ]
    },
    {
      id: "wardrop",
      title: "WarDrop (WardropBridge)",
      category: "Security & Distributed PWA",
      featured: true,
      description: "Cross-device encrypted synchronization PWA for real-time clipboard sharing across local networks.",
      fullDetails: "Developed a Progressive Web App (PWA) using React 19, Vite, and Tailwind CSS enabling seamless local network clipboard sharing. Integrated Fernet Symmetric Encryption for secure text beaming and optional AI-driven clipboard intelligence.",
      tags: ["React 19", "Vite", "PWA", "Fernet Encryption", "Tailwind CSS"],
      githubUrl: "https://github.com/Bhargav9t",
      stats: [
        { label: "Encryption", value: "Fernet AES" },
        { label: "Architecture", value: "Local PWA" }
      ]
    },
    {
      id: "ideaforge",
      title: "IdeaForge",
      category: "Engineering Education Platform",
      featured: false,
      description: "Educational platform teaching developers how to independently architect and build software from first principles.",
      fullDetails: "Built an interactive educational environment emphasizing active learning, core software architecture, and fundamental engineering over blind AI code generation.",
      tags: ["Python", "FastAPI", "React", "Software Architecture"],
      githubUrl: "https://github.com/Bhargav9t",
      stats: [
        { label: "Pedagogy", value: "Active Learning" },
        { label: "Focus", value: "Core Architecture" }
      ]
    },
    {
      id: "volunteer-platforms",
      title: "IUCEE EWB & Helping Hearts Web Platforms",
      category: "Production Web Development",
      featured: false,
      description: "Official web platforms designed, developed, and deployed for community and NGO outreach.",
      fullDetails: "Designed, developed, and deployed the official production web platforms for the IUCEE EWB Student Chapter and the Helping Hearts NGO, enhancing digital presence and volunteer mobilization.",
      tags: ["React", "Tailwind CSS", "Vercel", "Web Development"],
      githubUrl: "https://github.com/Bhargav9t",
      stats: [
        { label: "Organizations", value: "2 Entities" },
        { label: "Deployment", value: "Production Live" }
      ]
    }
  ] as Project[],

  publications: [
    {
      id: "pub-iclamp",
      title: "Research Paper on AI Systems & Engineering",
      venue: "ICLAMP Conference Proceedings",
      year: 2026,
      authors: ["Chinipilli Bhargav Reddy", "Co-Authors"],
      abstract: "Co-authored and published peer-reviewed research in the ICLAMP Conference Proceedings (April 2026), examining modern engineering paradigms and intelligent computational workflows.",
      highlight: "ICLAMP April 2026 Publication",
      pdfUrl: "#",
      citations: 1
    }
  ] as Publication[],

  awards: [
    {
      title: "1st Prize — Project Expo",
      project: "Career Ladder",
      description: "Awarded 1st place in the competitive project expo for innovative AI career mapping."
    },
    {
      title: "3rd Prize — Aavishkar Manthan 2026",
      project: "Career Ladder",
      organization: "Malnad University",
      description: "Recognized among top technical innovations across university participants."
    },
    {
      title: "3rd Prize — Market Minds",
      project: "EcoTracker",
      description: "Awarded for gamified UI and practical carbon footprint tracking methodology."
    },
    {
      title: "3rd Prize — AUNSF",
      project: "Anurag University National Science Festival",
      description: "Competitive science and engineering recognition."
    }
  ],

  experience: [
    {
      id: "exp-1",
      role: "Lead R&D",
      company: "IUCEE EWB HITAM Student Chapter",
      period: "March 2026 — Present",
      location: "Hyderabad, India",
      highlights: [
        "Spearhead research and development initiatives, guiding technical strategy and project execution for chapter members.",
        "Coordinate technical outreach and mentor student teams in building impactful, real-world engineering solutions that bridge academic concepts with practical application.",
        "Oversee architecture reviews and project development pipelines across chapter initiatives."
      ],
      technologies: ["R&D Leadership", "System Architecture", "Mentorship", "Full-Stack Development"]
    },
    {
      id: "exp-2",
      role: "Technology Intern",
      company: "CallHealth",
      period: "14 Mar 2026 — 12 Sep 2026",
      location: "Hyderabad, India",
      highlights: [
        "Selected for an intensive technology internship following rigorous hiring assessments.",
        "Contributing to healthcare digital technology systems, software services, and application workflows.",
        "Collaborating with engineering teams to enhance digital platform capabilities and reliability."
      ],
      technologies: ["Python", "FastAPI", "React", "Docker", "Database Systems"]
    }
  ] as ExperienceItem[],

  education: [
    {
      institution: "Hyderabad Institute of Technology and Management (HITAM)",
      degree: "B.Tech in Artificial Intelligence and Machine Learning (AIML)",
      period: "2026 — 2028",
      highlights: "Core focus in Machine Learning, Deep Learning, Intelligent Systems, and Full-Stack Engineering."
    },
    {
      institution: "Sri Aadya Junior College",
      degree: "Intermediate Education",
      period: "2024",
      highlights: "Score: 93.4%"
    },
    {
      institution: "St. Ann's High School",
      degree: "Secondary School Certificate (SSC)",
      period: "2022",
      highlights: "CGPA: 8.8"
    }
  ]
};
