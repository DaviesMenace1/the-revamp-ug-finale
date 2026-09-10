export type EditorialSectionKind = 'story' | 'image_text' | 'gallery' | 'quote' | 'rich_text' | 'callout'

export type EditorialSection = {
  id?: string
  kind: EditorialSectionKind
  eyebrow?: string
  title?: string
  body?: string
  quote?: string
  attribution?: string
  image?: string
  images?: string[]
  imagePosition?: 'left' | 'right' | 'full'
  caption?: string
}

export type ServiceContentTemplate = {
  visionStatement?: string
  whatWeSolve?: string
  approach?: string
  deliverables: string[]
  sections: EditorialSection[]
  processSteps: Array<{ title: string; description: string }>
  faqs: Array<{ question: string; answer: string }>
  relatedServices: string[]
  relatedProjects: string[]
}

export type JournalContentTemplate = {
  introduction?: string
  sections: EditorialSection[]
  pullQuotes: Array<{ quote: string; attribution?: string }>
  relatedArticles: string[]
  relatedServices: string[]
  relatedProjects: string[]
}

export type ProjectContentTemplate = {
  overview?: string
  clientBrief?: string
  designPhilosophy?: string
  materials: string[]
  servicesInvolved: string[]
  sections: EditorialSection[]
  relatedProjects: string[]
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()) : []
}

export function normalizeEditorialSections(value: unknown): EditorialSection[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return []
    const section = entry as Record<string, unknown>
    const title = typeof section.title === 'string' ? section.title.trim() : ''
    const body = typeof section.body === 'string' ? section.body.trim() : typeof section.content === 'string' ? section.content.trim() : ''
    const quote = typeof section.quote === 'string' ? section.quote.trim() : ''
    const image = typeof section.image === 'string' ? section.image.trim() : ''
    const images = stringList(section.images)
    if (!title && !body && !quote && !image && images.length === 0) return []
    const kind = section.kind === 'quote' || section.kind === 'gallery' || section.kind === 'rich_text' || section.kind === 'callout' || section.kind === 'image_text' ? section.kind : 'story'
    const imagePosition = section.imagePosition === 'right' || section.imagePosition === 'full' ? section.imagePosition : 'left'
    return [{
      id: typeof section.id === 'string' ? section.id : `section-${index + 1}`,
      kind,
      eyebrow: typeof section.eyebrow === 'string' ? section.eyebrow.trim() : undefined,
      title: title || undefined,
      body: body || undefined,
      quote: quote || undefined,
      attribution: typeof section.attribution === 'string' ? section.attribution.trim() : undefined,
      image: image || undefined,
      images: images.length ? images : undefined,
      imagePosition,
      caption: typeof section.caption === 'string' ? section.caption.trim() : undefined,
    }]
  })
}

export function serviceTemplateFromRecord(record: Record<string, unknown>): ServiceContentTemplate {
  return {
    visionStatement: typeof record.visionStatement === 'string' ? record.visionStatement : undefined,
    whatWeSolve: typeof record.whatWeSolve === 'string' ? record.whatWeSolve : undefined,
    approach: typeof record.approach === 'string' ? record.approach : undefined,
    deliverables: stringList(record.deliverables),
    sections: normalizeEditorialSections(record.storySections),
    processSteps: Array.isArray(record.processSteps) ? record.processSteps.filter((step): step is { title: string; description: string } => Boolean(step && typeof step === 'object' && typeof (step as Record<string, unknown>).title === 'string' && typeof (step as Record<string, unknown>).description === 'string')) : [],
    faqs: Array.isArray(record.faqs) ? record.faqs.filter((faq): faq is { question: string; answer: string } => Boolean(faq && typeof faq === 'object' && typeof (faq as Record<string, unknown>).question === 'string' && typeof (faq as Record<string, unknown>).answer === 'string')) : [],
    relatedServices: stringList(record.relatedServices),
    relatedProjects: stringList(record.relatedProjects),
  }
}

export function projectTemplateFromRecord(record: Record<string, unknown>): ProjectContentTemplate {
  return {
    overview: typeof record.shortDescription === 'string' ? record.shortDescription : undefined,
    clientBrief: typeof record.clientBrief === 'string' ? record.clientBrief : undefined,
    designPhilosophy: typeof record.designPhilosophy === 'string' ? record.designPhilosophy : undefined,
    materials: stringList(record.materials),
    servicesInvolved: stringList(record.servicesInvolved),
    sections: normalizeEditorialSections(record.storySections),
    relatedProjects: stringList(record.relatedProjects),
  }
}

export function journalTemplateFromRecord(record: Record<string, unknown>): JournalContentTemplate {
  return {
    introduction: typeof record.introduction === 'string' ? record.introduction : undefined,
    sections: normalizeEditorialSections(record.storySections),
    pullQuotes: Array.isArray(record.pullQuotes) ? record.pullQuotes.filter((quote): quote is { quote: string; attribution?: string } => Boolean(quote && typeof quote === 'object' && typeof (quote as Record<string, unknown>).quote === 'string')).map((quote) => ({ quote: quote.quote, attribution: quote.attribution })) : [],
    relatedArticles: stringList(record.relatedArticles),
    relatedServices: stringList(record.relatedServices),
    relatedProjects: stringList(record.relatedProjects),
  }
}
