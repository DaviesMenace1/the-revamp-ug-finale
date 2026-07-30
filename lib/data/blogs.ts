// Shared blog/journal articles. Mirrors DB `blogs` schema for easy API swap.

export interface BlogArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  category: 'design-tips' | 'project-showcase' | 'trends' | 'sustainability' | 'craftsmanship'
  tags: string[]
  image: string
  status: 'draft' | 'published'
  publishedAt: string
  createdAt: string
  updatedAt: string
}

const IMG = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=85&auto=format&fit=crop`

export const blogs: BlogArticle[] = [
  {
    id: 'b1',
    slug: 'designing-for-wellness-in-home-spaces',
    title: 'Designing for Wellness: Creating Sanctuaries in Home Spaces',
    excerpt: 'Discover how thoughtful design can transform your home into a wellness sanctuary. From natural light to curated textures, learn the principles of restorative interior design.',
    content: `In today's fast-paced world, our homes have become more than just places to sleep—they are sanctuaries where we recharge and find peace. The Revamp UG believes that good design should support your well-being, not just look beautiful.

Wellness-focused design integrates several key principles:

**Natural Light and Views**
The quality of light in your space directly impacts your mood and circadian rhythm. We prioritize large windows, light-diffusing window treatments, and strategic placement of reflective surfaces to maximize natural illumination.

**Material Selection**
Natural, breathable materials like linen, wool, and solid wood create a more grounded, calm environment compared to synthetic alternatives. These materials also age beautifully, developing character over time.

**Color Palette**
Soft, nature-inspired colors promote relaxation. We often recommend warm neutrals, soft greens, and muted blues that echo natural environments.

**Spatial Flow**
Thoughtful spatial planning ensures movement through your home feels intuitive and uncluttered. Open sightlines and strategic furniture placement reduce mental friction.

**Sensory Elements**
We consider texture, acoustics, and even scent when designing spaces. Layered textiles, sound-absorbing materials, and carefully chosen finishes all contribute to a multi-sensory experience.

At The Revamp UG, we believe that every element in your space should serve both aesthetic and functional wellness purposes.`,
    author: 'Faridah Nakayiwa A.',
    category: 'design-tips',
    tags: ['wellness', 'home-design', 'mental-health', 'sanctuary'],
    image: IMG('1600210492493-0946911123ea'),
    status: 'published',
    publishedAt: '2026-07-20',
    createdAt: '2026-07-15',
    updatedAt: '2026-07-20',
  },
  {
    id: 'b2',
    slug: 'spotlight-on-east-african-craftsmanship',
    title: 'Spotlight on East African Craftsmanship: Celebrating Local Artisans',
    excerpt: 'Explore how we collaborate with local craftspeople to bring authentic East African artistry into contemporary interiors. A celebration of heritage and skill.',
    content: `The Revamp UG is deeply committed to showcasing the exceptional talent of East African craftspeople. Every project is an opportunity to weave local artistry into modern design narratives.

**Our Maker Partnerships**
We work directly with workshops across Uganda, Kenya, and beyond to source one-of-a-kind pieces. These partnerships ensure fair compensation and preserve traditional techniques that might otherwise be lost.

**Bespoke Woodworking**
Our collaborators create custom millwork, doors, and architectural elements that reflect contemporary design while honoring traditional joinery methods. Each piece tells the story of the craftsperson's skill.

**Textile Weaving**
Local weavers produce stunning rugs, wall hangings, and upholstery textiles using natural fibers and traditional looms. These pieces add warmth and authenticity to any space.

**Ceramic and Glass**
East African artisans create stunning ceramics and hand-blown glass that serve as both functional and sculptural elements in our interiors.

**The Impact**
By prioritizing local makers, we support artisan livelihoods, preserve cultural techniques, and create interiors with genuine soul. This isn't just good design—it's conscious commerce.

When you work with The Revamp UG, you're not just investing in beautiful spaces; you're supporting thriving creative communities.`,
    author: 'Davis Musinguzi',
    category: 'craftsmanship',
    tags: ['artisans', 'local-makers', 'sustainability', 'east-africa'],
    image: IMG('1493663284031-b7e3aefcae8e'),
    status: 'published',
    publishedAt: '2026-07-10',
    createdAt: '2026-07-01',
    updatedAt: '2026-07-10',
  },
  {
    id: 'b3',
    slug: 'sustainable-luxury-the-future-of-interior-design',
    title: 'Sustainable Luxury: The Future of Interior Design',
    excerpt: 'How premium materials and ethical sourcing come together to create interiors that are both luxurious and responsible.',
    content: `Luxury doesn't have to come at the cost of sustainability. At The Revamp UG, we believe the future of high-end interior design lies in conscious material selection and ethical partnerships.

**Premium, Responsible Materials**
We source solid hardwoods from certified suppliers, natural linens from ethical manufacturers, and reclaimed materials wherever possible. These choices ensure longevity—luxury pieces that last decades, not seasons.

**Timeless Design Over Trends**
Our aesthetic celebrates enduring beauty over fleeting trends. This philosophy reduces the need for frequent replacements and minimizes waste.

**Local Sourcing**
Whenever possible, we prioritize locally-available materials and craftspeople. This reduces carbon footprint while supporting regional economies.

**Transparency**
Every specification sheet includes information about material sourcing, manufacturing practices, and end-of-life recyclability. We believe clients deserve to know the story behind what fills their homes.

**Investment Pieces**
Sustainable luxury is about investing in pieces that appreciate in character and value over time. A beautifully crafted solid wood table is a legacy item, not a disposable commodity.

The Revamp UG is pioneering a new standard in luxury interior design—one where responsibility and beauty walk hand in hand.`,
    author: 'Faridah Nakayiwa A.',
    category: 'sustainability',
    tags: ['sustainability', 'luxury', 'ethics', 'materials'],
    image: IMG('1567016432779-094069958ea5'),
    status: 'published',
    publishedAt: '2026-06-28',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-28',
  },
  {
    id: 'b4',
    slug: 'color-trends-2026-moving-beyond-neutral',
    title: 'Color Trends 2026: Moving Beyond Neutral',
    excerpt: 'A fresh look at color for 2026. Discover how to introduce sophisticated color into your interiors while maintaining timelessness.',
    content: `While warm neutrals remain foundational, 2026 is inviting a subtle but meaningful shift toward carefully considered color. The Revamp UG explores the color palette shaping luxury interiors this year.

**Warm, Muted Greens**
Sage, celadon, and khaki greens continue to dominate, evoking nature while feeling contemporary. These tones pair beautifully with warm woods and natural fibers.

**Deeper Jewel Tones**
Emerald, sapphire, and rich burgundy are appearing in accent pieces, upholstery, and architectural details. Used sparingly, they add sophistication and depth.

**Warm Grays**
Moving away from cool grays, the palette has shifted toward warmer, more complex grays with undertones of green or terracotta.

**Earth Tones with Depth**
Clay, ochre, and rust are being reinterpreted through a luxury lens—less rustic, more refined.

**How to Incorporate**
- Use color in architectural elements (wall paneling, millwork)
- Introduce color through curated artwork and textiles
- Consider color in less permanent pieces first to test your palette
- Balance with substantial neutral walls and natural materials

The key to 2026 color trends is intentionality. Every hue should serve a purpose and reflect your personal narrative.`,
    author: 'Davis Musinguzi',
    category: 'trends',
    tags: ['color', 'trends', '2026', 'design-trends'],
    image: IMG('1556909114-f6e7ad7d3b4f'),
    status: 'published',
    publishedAt: '2026-06-15',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-15',
  },
  {
    id: 'b5',
    slug: 'the-art-of-layering-textures-in-interior-spaces',
    title: 'The Art of Layering Textures in Interior Spaces',
    excerpt: 'Master the technique of texture layering to create depth, interest, and warmth in your home.',
    content: `A monochromatic, minimalist space can feel cold and sterile. The Revamp UG secrets its visual and tactile warmth through expert texture layering.

**Understanding Texture**
Texture refers to both the visual appearance and tactile quality of materials. Smooth surfaces reflect light and feel sleek; rough surfaces absorb light and feel organic.

**The Layering Principle**
Begin with a base texture (often large-scale, like wall finishes or flooring). Layer complementary textures at different scales: a woven rug, linen upholstery, ceramic vase, wooden beam, soft throw, and metallic accent.

**Creating Cohesion**
While textures should vary, they should feel intentional. Group materials by warmth—warm woods pair with warm metals; cool concrete pairs with cool glass.

**Texture Variety**
- **Soft**: Linens, wools, leather, boucle
- **Hard**: Wood, stone, ceramic, metal
- **Smooth**: Polished concrete, lacquered wood, glass
- **Rough**: Raw brick, textured plaster, woven wool

**The Balance**
A sophisticated interior typically balances rough and smooth, matte and glossy, warm and cool. This interplay creates visual movement and depth that engages the eye and hand.

Texture is often the secret ingredient in interiors that feel both designed and lived-in. Master this, and your space will transcend trends.`,
    author: 'Faridah Nakayiwa A.',
    category: 'design-tips',
    tags: ['texture', 'layering', 'depth', 'interior-design'],
    image: IMG('1578500494198-246f612d3b3d'),
    status: 'published',
    publishedAt: '2026-05-30',
    createdAt: '2026-05-20',
    updatedAt: '2026-05-30',
  },
]

export function getBlogBySlug(slug: string): BlogArticle | undefined {
  return blogs.find((b) => b.slug === slug)
}

export function getPublishedBlogs(): BlogArticle[] {
  return blogs.filter(b => b.status === 'published').sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export function getBlogsByCategory(category: BlogArticle['category']): BlogArticle[] {
  return blogs.filter(b => b.category === category && b.status === 'published')
}

export function getAllBlogs(): BlogArticle[] {
  return blogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
