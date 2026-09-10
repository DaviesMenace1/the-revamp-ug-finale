type ServicePageContent = {
  offerLabel: string
  offerItems: string[]
  process: { step: string; title: string; description: string }[]
  faqs: { question: string; answer: string }[]
  inquiryLabel: string
}

const DEFAULT_CONTENT: ServicePageContent = {
  offerLabel: 'What this conversation can cover',
  offerItems: [
    'A review of your space, brief, or project stage',
    'A considered direction for the decisions in front of you',
    'A scope and next-step conversation shaped around your needs',
    'Clearer information for planning, approval, and delivery',
  ],
  process: [
    { step: '01', title: 'Understand', description: 'We review the context, priorities, constraints, and the decisions that need attention.' },
    { step: '02', title: 'Shape', description: 'We develop a direction, shortlist, or scope that responds to the brief and the way the space will be used.' },
    { step: '03', title: 'Coordinate', description: 'Where the work proceeds, the relevant design, sourcing, procurement, or delivery conversations are brought together.' },
    { step: '04', title: 'Review', description: 'The next stage is confirmed with the information, responsibilities, and approvals required for the project.' },
  ],
  faqs: [
    { question: 'Can I start with a consultation?', answer: 'Yes. A consultation is a useful starting point when the brief, scope, or next step is still being shaped.' },
    { question: 'Can this service be discussed virtually?', answer: 'Virtual and in-person options can be discussed through the consultation and inquiry flows.' },
    { question: 'Can you work with an existing team or supplier?', answer: 'The brief can include an existing architect, contractor, supplier, or project team so the appropriate working relationship can be discussed.' },
  ],
  inquiryLabel: 'Request a conversation',
}

const CONTENT_BY_KEYWORD: { keywords: string[]; content: Partial<ServicePageContent> }[] = [
  {
    keywords: ['architecture', 'architectural', 'new build'],
    content: {
      offerItems: ['Concept and design direction for a new build, renovation, or extension', 'Floor-plan, facade, spatial, and material conversations', '3D visualisation and presentation support where appropriate', 'Coordination questions for the wider design and delivery team'],
      inquiryLabel: 'Discuss an architecture brief',
    },
  },
  {
    keywords: ['sourcing', 'procurement', 'custom furniture', 'manufacturing', 'millwork'],
    content: {
      offerItems: ['Furniture, lighting, materials, finishes, and custom-piece research', 'Specifications, quantities, dimensions, and finish direction', 'Supplier, procurement, inspection, and logistics conversations', 'A route for made-to-order or customised pieces'],
      inquiryLabel: 'Start a sourcing brief',
    },
  },
  {
    keywords: ['visualisation', '3d', 'render', 'walkthrough'],
    content: {
      offerItems: ['Photorealistic stills and spatial visualisation direction', 'Material, lighting, and moodboard references', 'Walkthrough or presentation requirements', 'A review of the files and decisions needed for the next stage'],
      inquiryLabel: 'Discuss visualisation needs',
    },
  },
  {
    keywords: ['renovation', 'construction', 'turnkey', 'fit-out', 'project management'],
    content: {
      offerItems: ['Scope review for renovation, fit-out, or delivery work', 'Project coordination, supervision, and quality questions', 'Material, contractor, and finishing decisions', 'Handover, installation, and next-stage planning'],
      inquiryLabel: 'Discuss a delivery brief',
    },
  },
  {
    keywords: ['styling', 'luxury living', 'art curation', 'creative direction'],
    content: {
      offerItems: ['Objects, art, textiles, lighting, and finishing direction', 'A visual language for a home, property, or hospitality setting', 'Furniture placement and final-layer decisions', 'A practical route from references to installation planning'],
      inquiryLabel: 'Discuss a styling brief',
    },
  },
]

export function getServicePageContent(serviceName: string, categoryName: string): ServicePageContent {
  const searchable = `${categoryName} ${serviceName}`.toLowerCase()
  const match = CONTENT_BY_KEYWORD.find(({ keywords }) => keywords.some((keyword) => searchable.includes(keyword)))
  return {
    ...DEFAULT_CONTENT,
    ...(match?.content || {}),
  }
}
