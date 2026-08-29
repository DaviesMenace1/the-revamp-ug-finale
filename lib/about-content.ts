export type AboutEmployee = { name: string; role: string; bio: string; image: string }
export type AboutReference = { title: string; category: string; description: string; image: string }
export type AboutCapability = { title: string; description: string }
export type AboutContent = {
  heroTitle: string; heroIntro: string; heroImage: string
  storyTitle: string; story: string; storyImage: string
  founderTitle: string; founderStory: string; founderImage: string
  capabilities: AboutCapability[]; references: AboutReference[]; employees: AboutEmployee[]
}

export const DEFAULT_ABOUT: AboutContent = {
  heroTitle: 'About Revamp UG', heroIntro: 'Transforming spaces and lives through thoughtful design, architecture, and global curation', heroImage: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785658769/file_0000000044ec71f48458614b2de85725_l4eeso.png',
  storyTitle: 'Our Story', story: 'Revamp UG was founded with a simple mission: to bring world-class design and architecture to East Africa. What started as a dream in Kampala has grown into a broader design studio for residential, commercial, hospitality, and sourcing briefs.\n\nWe believe exceptional design is made through context, craft, and care. Every project deserves thoughtful design, quality materials, and meticulous execution.', storyImage: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785658769/file_0000000044ec71f48458614b2de85725_l4eeso.png',
  founderTitle: 'A point of view, made in East Africa', founderStory: 'The studio began with a belief that East African spaces deserve a confident design language of their own: rooted in place, open to the world, and attentive to the way people actually live.', founderImage: '/team/faridah-nakayiwa.webp',
  capabilities: [{ title: 'Spaces', description: 'Interior design, architecture, renovation, and project direction shaped around how people live and work.' }, { title: 'Objects', description: 'Furniture, lighting, art, textiles, and custom pieces selected or developed for the room.' }, { title: 'Sourcing', description: 'A considered route through materials, makers, procurement, and the practical details behind a brief.' }, { title: 'Perspective', description: 'An East African point of view with room for global references, local collaboration, and individual expression.' }],
  references: [], employees: [{ name: 'Faridah Nakayiwa A', role: 'Founder & Creative Director', bio: 'The visionary behind The Revamp UG, bringing together an East African point of view, considered spaces, and a wider design perspective.', image: '/team/faridah-nakayiwa.webp' }, { name: 'Davis Musinguzi', role: 'Technical Lead', bio: 'Coordinates technical projects, platform maintenance, and developer workflows.', image: '/team/davis-musinguzi.jpg' }],
}
