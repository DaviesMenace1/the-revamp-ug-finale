// Shared project portfolio. Mirrors DB `projects` schema for easy API swap.

export interface Project {
  id: string
  slug: string
  name: string
  client: string
  description: string
  shortDescription: string
  location: string
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold'
  progress: number
  year: string
  features: string[]
  images: string[]
  dueDate: string
  createdAt: string
}

const IMG = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=85&auto=format&fit=crop`

export const projects: Project[] = [
  {
    id: 'pr1',
    slug: 'nakasero-residence',
    name: 'The Nakasero Residence',
    client: 'Sarah Kiwanuka',
    shortDescription: 'Modern luxury residence in Kampala\'s most coveted neighborhood',
    description: 'A complete interior design overhaul of a sprawling residence in Nakasero. The project included full space planning, furniture curation, finishes selection, and project management through final installation.',
    location: 'Nakasero, Kampala',
    status: 'completed',
    progress: 100,
    year: '2025-2026',
    features: ['Open-plan living', 'Bespoke millwork', 'Curated art collection', 'Smart lighting'],
    images: [
      IMG('1600210492493-0946911123ea', 1200),
      IMG('1493663284031-b7e3aefcae8e'),
      IMG('1567016432779-094069958ea5'),
    ],
    dueDate: '2026-08-15',
    createdAt: '2025-06-01',
  },
  {
    id: 'pr2',
    slug: 'kololo-villa-renovation',
    name: 'Kololo Villa Renovation',
    client: 'James Mutua',
    shortDescription: 'Heritage villa restoration with contemporary finishes',
    description: 'Selective renovation of a heritage villa in Kololo, blending period architectural elements with modern comfort and luxury. Included structural assessment, heritage paint restoration, and full furnishing.',
    location: 'Kololo, Kampala',
    status: 'in-progress',
    progress: 72,
    year: '2025-2026',
    features: ['Heritage restoration', 'Period details', 'Modern systems', 'Garden design'],
    images: [
      IMG('1567538096630-e0c55bd6374c', 1200),
      IMG('1506439773649-6e0eb8cfb237'),
    ],
    dueDate: '2026-10-30',
    createdAt: '2025-07-15',
  },
  {
    id: 'pr3',
    slug: 'serena-penthouse-suite',
    name: 'Serena Penthouse Suite',
    client: 'Serena Hotel Group',
    shortDescription: 'Luxury hospitality design for signature hotel penthouse',
    description: 'Complete interior design of a flagship hotel penthouse suite. Project encompassed design concept, specifications, procurement, and installation to deliver an ultra-luxury guest experience.',
    location: 'Serena Hotel, Kampala',
    status: 'completed',
    progress: 100,
    year: '2024-2025',
    features: ['Luxury finishes', 'Custom furnishing', 'Hospitality systems', 'Wellness amenities'],
    images: [
      IMG('1616486338812-3dadae4b4ace', 1200),
      IMG('1617806118233-18e1de247200'),
    ],
    dueDate: '2025-08-20',
    createdAt: '2024-10-01',
  },
  {
    id: 'pr4',
    slug: 'muyenga-heritage-home',
    name: 'Muyenga Heritage Home',
    client: 'Family Trust',
    shortDescription: 'Multi-generational family home with heritage significance',
    description: 'Design of a multi-generational home honoring family heritage while incorporating contemporary living standards. Included phased construction planning, material sourcing, and installation management.',
    location: 'Muyenga, Kampala',
    status: 'on-hold',
    progress: 35,
    year: '2025-2026',
    features: ['Multi-generational spaces', 'Heritage elements', 'Flexible layouts', 'Garden integration'],
    images: [
      IMG('1507003211169-0a1dd7228f2d', 1200),
      IMG('1524484485831-a92ffc0de03f'),
    ],
    dueDate: '2026-11-10',
    createdAt: '2025-09-01',
  },
  {
    id: 'pr5',
    slug: 'pearl-marina-corporate-hq',
    name: 'Pearl Marina Corporate HQ',
    client: 'Corporate Enterprises Ltd',
    shortDescription: 'Executive corporate headquarters with design-led office spaces',
    description: 'Full design and execution of corporate headquarters featuring executive suites, collaborative workspaces, and reception areas. Incorporated biophilic design principles and sustainable materials.',
    location: 'Pearl Marina, Kampala',
    status: 'in-progress',
    progress: 68,
    year: '2025-2026',
    features: ['Executive spaces', 'Collaborative zones', 'Biophilic design', 'Sustainable materials'],
    images: [
      IMG('1631049307264-da0ec9d70304', 1200),
      IMG('1522708323590-d24dbb6b0267'),
    ],
    dueDate: '2026-09-30',
    createdAt: '2025-08-10',
  },
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function getProjectsByStatus(status: Project['status']): Project[] {
  return projects.filter(p => p.status === status)
}

export function getAllProjects(): Project[] {
  return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
