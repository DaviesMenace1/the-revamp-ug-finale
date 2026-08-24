import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateProjectSchema } from '@/lib/seo/schema-generator'
import LikeButton from '@/components/like-button'
import { getProjectBySlug, getPublishedProjects } from '@/lib/db/queries'

function imageUrls(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
}

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    return {
      title: 'Project Not Found',
      description: 'This project could not be found',
    }
  }

  const heroImage = imageUrls(project.images)[0] || ''

  return {
    title: `${project.title} | The Revamp UG`,
    description: project.shortDescription || project.description,
    openGraph: {
      title: project.title,
      description: project.shortDescription || project.description || undefined,
      type: 'website',
      images: heroImage ? [{ url: heroImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.shortDescription || project.description || undefined,
      images: heroImage ? [heroImage] : [],
    },
  }
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const allProjects = await getPublishedProjects(4, 0)
  const relatedProjects = allProjects.filter((item) => item.slug !== slug).slice(0, 2)

  const heroImage = imageUrls(project.images)[0] || 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=85&auto=format&fit=crop'
  const galleryImages = imageUrls(project.images)

  const projectSchema = generateProjectSchema({
    name: project.title,
    description: project.description || '',
    image: heroImage,
    location: project.location,
    startDate: project.createdAt ? new Date(project.createdAt).toISOString() : new Date().toISOString(),
  })

  return (
    <>
      <SchemaScript schema={projectSchema} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* 1. HERO SECTION */}
        <section className="relative">
          <div className="relative h-[65vh] md:h-[80vh] w-full overflow-hidden bg-muted">
            <Image
              src={heroImage}
              alt={project.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>

          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-5xl px-6 md:px-8 pb-12 md:pb-16 z-10">
              <div className="space-y-4">
                <Link
                  href="/portfolio"
                  className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Portfolio
                </Link>
                <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground">{project.title}</h1>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-light">
                  <span>Client: {project.client}</span>
                  <span>•</span>
                  <span>{project.location}</span>
                  <span>•</span>
                  <span>{project.year}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. OVERVIEW */}
        <section className="border-b border-border/20 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-light text-foreground">Project Overview</h2>
                <p className="text-lg text-muted-foreground font-light leading-relaxed">{project.description}</p>
              </div>
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-3">Project Status</p>
                  <p className="text-muted-foreground font-light capitalize">{project.status} ({project.progress}% Complete)</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-3">Target Completion</p>
                  <p className="text-muted-foreground font-light">{project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-UG') : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. VISUAL GALLERY */}
        {galleryImages.length > 0 && (
          <section className="border-b border-border/20 py-16 md:py-20">
            <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-8">
              <h2 className="font-serif text-3xl font-light text-foreground">Space Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="relative h-64 md:h-80 rounded-lg overflow-hidden group">
                    <Image
                      src={img}
                      alt={`${project.title} view ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. RELATED PROJECTS */}
        {relatedProjects.length > 0 && (
          <section className="border-b border-border/20 py-16 md:py-20">
            <div className="mx-auto max-w-5xl px-6 md:px-8">
              <h2 className="font-serif text-3xl font-light text-foreground mb-12">Related Projects</h2>
              <div className="grid gap-8 md:grid-cols-2">
                {relatedProjects.map((rel) => {
                  const relImg = imageUrls(rel.images)[0] || 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800'
                  return (
                    <Link key={rel.slug} href={`/portfolio/${rel.slug}`} className="group">
                      <article className="space-y-4 cursor-pointer">
                        <div className="relative w-full h-60 rounded-lg overflow-hidden group-hover:opacity-80 transition-opacity bg-muted">
                          <Image
                            src={relImg}
                            alt={rel.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">
                            {rel.status}
                          </span>
                          <h3 className="font-serif text-xl font-light text-foreground group-hover:text-primary transition-colors">
                            {rel.title}
                          </h3>
                          <p className="text-sm text-muted-foreground font-light">{rel.location}</p>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ENGAGEMENT */}
        <section className="py-12 border-b border-border/20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <LikeButton initial={147} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}




// import { SiteHeader } from '@/components/site-header'
// import { SiteFooter } from '@/components/site-footer'
// import Image from 'next/image'
// import Link from 'next/link'
// import { notFound } from 'next/navigation'
// import type { Metadata } from 'next'
// import { SchemaScript } from '@/components/seo/schema-script'
// import { generateProjectSchema } from '@/lib/seo/schema-generator'
// import LikeButton from '@/components/like-button'

// interface ProjectPageProps {
//   params: Promise<{ slug: string }>
// }

// interface HighlightItem {
//   title: string
//   description?: string
//   imageUrl?: string
// }

// interface TimelineItem {
//   phase: string
//   duration: string
//   description?: string
//   mediaUrl?: string
//   mediaType?: 'image' | 'video'
// }

// interface ProjectDetail {
//   slug: string
//   title: string
//   category: string
//   location: string
//   year: string
//   heroImage: string
//   heroVideo?: string
//   galleryImages: string[]
//   description: string
//   challenge: string
//   solution: string
//   highlights: HighlightItem[]
//   timeline: TimelineItem[]
//   services: string[]
// }

// const projectDetails: Record<string, ProjectDetail> = {
//   'nakasero-residence': {
//     slug: 'nakasero-residence',
//     title: 'The Nakasero Residence',
//     category: 'Residential Interior',
//     location: 'Kampala, Uganda',
//     year: '2024',
//     heroImage: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//     // Example: add heroVideo if available
//     // heroVideo: 'https://assets.mixkit.co/videos/preview/mixkit-interior-design-of-a-modern-living-room-41551-large.mp4',
//     galleryImages: [
//       'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//       'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//       'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//     ],
//     description:
//       'A full interior design of a hillside family residence in Nakasero, balancing warm materiality with contemporary restraint and framing panoramic city views.',
//     challenge: 'Unifying a large multi-level home into one calm, cohesive design language.',
//     solution:
//       'We developed a layered neutral palette, custom joinery, and curated lighting that flows seamlessly across every level of the home.',
//     highlights: [
//       {
//         title: 'Bespoke joinery throughout',
//         description: 'Custom-milled African hardwood cabinetry tailored to exact structural dimensions.',
//         imageUrl: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//       },
//       {
//         title: 'Curated statement lighting',
//         description: 'Handcrafted pendant lights strategically anchored in high-ceiling living zones.',
//         imageUrl: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//       },
//       {
//         title: 'Warm, tactile material palette',
//         description: 'Natural stone, linen drapery, and brushed brass details.',
//         imageUrl: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//       },
//       {
//         title: 'View-framing living spaces',
//         description: 'Floor-to-ceiling glass paneling framing the hills of Kampala.',
//         imageUrl: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//       },
//     ],
//     timeline: [
//       {
//         phase: 'Consultation & Concept',
//         duration: '3 weeks',
//         description: 'Initial site walkthrough, moodboarding, and material sample selection.',
//         mediaUrl: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//         mediaType: 'image',
//       },
//       {
//         phase: 'Design Development',
//         duration: '8 weeks',
//         description: 'Full 3D modeling, spatial rendering, and architectural drawing sign-off.',
//         mediaUrl: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//         mediaType: 'image',
//       },
//       {
//         phase: 'Sourcing & Procurement',
//         duration: '10 weeks',
//         description: 'Custom furniture fabrication, textile importing, and stone selection.',
//         mediaUrl: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//         mediaType: 'image',
//       },
//       {
//         phase: 'Installation & Styling',
//         duration: '3 weeks',
//         description: 'Final assembly, art placement, site curation, and lighting calibration.',
//         mediaUrl: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg',
//         mediaType: 'image',
//       },
//     ],
//     services: ['Interior Design', 'Furniture Sourcing', 'Installation'],
//   },
// }

// export async function generateStaticParams() {
//   return Object.keys(projectDetails).map((slug) => ({ slug }))
// }

// export async function generateMetadata({
//   params,
// }: ProjectPageProps): Promise<Metadata> {
//   const { slug } = await params
//   const project = projectDetails[slug]

//   if (!project) {
//     return {
//       title: 'Project Not Found',
//       description: 'This project could not be found',
//     }
//   }

//   return {
//     title: `${project.title} | The Revamp UG`,
//     description: project.description,
//     openGraph: {
//       title: project.title,
//       description: project.description,
//       type: 'website',
//       images: [
//         {
//           url: project.heroImage || `https://therevampug.com/api/og?title=${encodeURIComponent(project.title)}`,
//           width: 1200,
//           height: 630,
//         },
//       ],
//     },
//     twitter: {
//       card: 'summary_large_image',
//       title: project.title,
//       description: project.description,
//       images: project.heroImage ? [project.heroImage] : [],
//     },
//   }
// }

// export default async function ProjectDetailPage({ params }: ProjectPageProps) {
//   const { slug } = await params
//   const project = projectDetails[slug]

//   if (!project) {
//     notFound()
//   }

//   // Related Projects
//   const allProjects = Object.values(projectDetails)
//   const relatedProjects = allProjects
//     .filter((item) => item.slug !== slug)
//     .slice(0, 2)

//   const parsedYear = parseInt(project.year, 10)
//   const validStartDate = !isNaN(parsedYear)
//     ? new Date(parsedYear, 0, 1).toISOString()
//     : new Date().toISOString()

//   const projectSchema = generateProjectSchema({
//     name: project.title,
//     description: project.description,
//     image: project.heroImage || `https://therevampug.com/api/og?title=${encodeURIComponent(project.title)}`,
//     location: project.location,
//     startDate: validStartDate,
//   })

//   return (
//     <>
//       <SchemaScript schema={projectSchema} />
//       <SiteHeader />
//       <main className="min-h-screen bg-background">
//         {/* 1. HERO SECTION (Supports Background Video or Hero Image) */}
//         <section className="relative">
//           <div className="relative h-[65vh] md:h-[80vh] w-full overflow-hidden bg-muted">
//             {project.heroVideo ? (
//               <video
//                 src={project.heroVideo}
//                 autoPlay
//                 loop
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               project.heroImage && (
//                 <Image
//                   src={project.heroImage}
//                   alt={project.title}
//                   fill
//                   priority
//                   className="object-cover"
//                   sizes="100vw"
//                 />
//               )
//             )}
//             <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
//           </div>

//           <div className="absolute inset-0 flex items-end">
//             <div className="mx-auto w-full max-w-5xl px-6 md:px-8 pb-12 md:pb-16 z-10">
//               <div className="space-y-4">
//                 <Link
//                   href="/portfolio"
//                   className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
//                 >
//                   <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
//                   </svg>
//                   Back to Portfolio
//                 </Link>
//                 <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground">{project.title}</h1>
//                 <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-light">
//                   <span>{project.category}</span>
//                   <span>•</span>
//                   <span>{project.location}</span>
//                   <span>•</span>
//                   <span>{project.year}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* 2. OVERVIEW */}
//         <section className="border-b border-border/20 py-16 md:py-20">
//           <div className="mx-auto max-w-5xl px-6 md:px-8">
//             <div className="grid md:grid-cols-2 gap-12">
//               <div className="space-y-6">
//                 <h2 className="font-serif text-3xl font-light text-foreground">Project Overview</h2>
//                 <p className="text-lg text-muted-foreground font-light leading-relaxed">{project.description}</p>
//               </div>
//               <div className="space-y-8">
//                 <div>
//                   <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-3">Challenge</p>
//                   <p className="text-muted-foreground font-light">{project.challenge}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-3">Solution</p>
//                   <p className="text-muted-foreground font-light">{project.solution}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* 3. VISUAL GALLERY (Showcases key spaces) */}
//         {project.galleryImages && project.galleryImages.length > 0 && (
//           <section className="border-b border-border/20 py-16 md:py-20">
//             <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-8">
//               <h2 className="font-serif text-3xl font-light text-foreground">Space Gallery</h2>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {project.galleryImages.map((img, idx) => (
//                   <div key={idx} className="relative h-64 md:h-80 rounded-lg overflow-hidden group">
//                     <Image
//                       src={img}
//                       alt={`${project.title} view ${idx + 1}`}
//                       fill
//                       className="object-cover group-hover:scale-105 transition-transform duration-500"
//                       sizes="(max-width: 768px) 100vw, 33vw"
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </section>
//         )}

//         {/* 4. HIGHLIGHTS (Visual Cards) */}
//         <section className="border-b border-border/20 py-16 md:py-20 bg-muted/5">
//           <div className="mx-auto max-w-5xl px-6 md:px-8">
//             <h2 className="font-serif text-3xl font-light text-foreground mb-12">Project Highlights</h2>
//             <div className="grid md:grid-cols-2 gap-8">
//               {project.highlights.map((highlight, idx) => (
//                 <div key={idx} className="border border-border/20 rounded-xl overflow-hidden bg-background/50 flex flex-col">
//                   {highlight.imageUrl && (
//                     <div className="relative h-48 w-full">
//                       <Image
//                         src={highlight.imageUrl}
//                         alt={highlight.title}
//                         fill
//                         className="object-cover"
//                         sizes="(max-width: 768px) 100vw, 50vw"
//                       />
//                     </div>
//                   )}
//                   <div className="p-6 space-y-2 flex-1">
//                     <div className="flex items-center gap-3">
//                       <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-xs font-medium text-primary">✓</span>
//                       <h3 className="font-medium text-foreground">{highlight.title}</h3>
//                     </div>
//                     {highlight.description && (
//                       <p className="text-sm text-muted-foreground font-light pl-8">{highlight.description}</p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* 5. PHASES & TIMELINE (With Stage Media) */}
//         <section className="border-b border-border/20 py-16 md:py-20">
//           <div className="mx-auto max-w-5xl px-6 md:px-8">
//             <h2 className="font-serif text-3xl font-light text-foreground mb-12">Project Timeline & Phases</h2>
//             <div className="space-y-12">
//               {project.timeline.map((item, idx) => (
//                 <div key={idx} className="grid md:grid-cols-3 gap-6 items-center pb-8 border-b border-border/20 last:border-0">
//                   <div className="space-y-1">
//                     <p className="text-xs font-medium uppercase tracking-wider text-primary">{item.duration}</p>
//                     <h3 className="font-serif text-xl text-foreground font-light">{item.phase}</h3>
//                   </div>
//                   <div className="md:col-span-1">
//                     <p className="text-sm text-muted-foreground font-light leading-relaxed">{item.description}</p>
//                   </div>
//                   {item.mediaUrl && (
//                     <div className="relative h-40 w-full rounded-lg overflow-hidden bg-muted">
//                       {item.mediaType === 'video' ? (
//                         <video
//                           src={item.mediaUrl}
//                           autoPlay
//                           loop
//                           muted
//                           playsInline
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <Image
//                           src={item.mediaUrl}
//                           alt={item.phase}
//                           fill
//                           className="object-cover"
//                           sizes="(max-width: 768px) 100vw, 33vw"
//                         />
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* 6. SERVICES */}
//         <section className="border-b border-border/20 py-16 md:py-20 bg-muted/5">
//           <div className="mx-auto max-w-5xl px-6 md:px-8">
//             <h2 className="font-serif text-3xl font-light text-foreground mb-8">Services Provided</h2>
//             <div className="flex flex-wrap gap-3">
//               {project.services.map((service: string) => (
//                 <span
//                   key={service}
//                   className="px-4 py-2 rounded-full bg-primary/10 text-primary font-light text-sm"
//                 >
//                   {service}
//                 </span>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* 7. RELATED PROJECTS */}
//         {relatedProjects.length > 0 && (
//           <section className="border-b border-border/20 py-16 md:py-20">
//             <div className="mx-auto max-w-5xl px-6 md:px-8">
//               <h2 className="font-serif text-3xl font-light text-foreground mb-12">Related Projects</h2>
//               <div className="grid gap-8 md:grid-cols-2">
//                 {relatedProjects.map((rel) => (
//                   <Link key={rel.slug} href={`/portfolio/${rel.slug}`} className="group">
//                     <article className="space-y-4 cursor-pointer">
//                       <div className="relative w-full h-60 rounded-lg overflow-hidden group-hover:opacity-80 transition-opacity">
//                         <Image
//                           src={rel.heroImage}
//                           alt={rel.title}
//                           fill
//                           className="object-cover"
//                           sizes="(max-width: 768px) 100vw, 50vw"
//                         />
//                       </div>
//                       <div className="space-y-1">
//                         <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">
//                           {rel.category}
//                         </span>
//                         <h3 className="font-serif text-xl font-light text-foreground group-hover:text-primary transition-colors">
//                           {rel.title}
//                         </h3>
//                         <p className="text-sm text-muted-foreground font-light">{rel.location}</p>
//                       </div>
//                     </article>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           </section>
//         )}

//         {/* ENGAGEMENT */}
//         <section className="py-12 border-b border-border/20">
//           <div className="mx-auto max-w-5xl px-6 md:px-8">
//             <div className="flex items-center gap-8">
//               <LikeButton initial={147} />
//             </div>
//           </div>
//         </section>

//         {/* CTA */}
//         <section className="py-20 md:py-24">
//           <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
//             <div className="space-y-4">
//               <h2 className="font-serif text-4xl font-light text-foreground">
//                 Ready to transform your space?
//               </h2>
//               <p className="text-lg text-muted-foreground font-light">
//                 Let's discuss how we can bring your vision to life
//               </p>
//             </div>
//             <Link
//               href="/book-consultation"
//               className="inline-block px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light transition-colors"
//             >
//               Book a Consultation
//             </Link>
//           </div>
//         </section>
//       </main>
//       <SiteFooter />
//     </>
//   )
//           }

