const steps = [
  {
    number: '01',
    title: 'Discovery',
    description:
      'We begin with a deep consultation , understanding your lifestyle, aesthetic, and vision before a single line is drawn.',
  },
  {
    number: '02',
    title: 'Concept & Design',
    description:
      'Our designers craft detailed concept boards, 3D visualisations, and material palettes tailored exclusively to you.',
  },
  {
    number: '03',
    title: 'Global Sourcing',
    description:
      'We source the finest pieces worldwide, working with artisans, studios, and suppliers across Europe, Asia, and beyond.',
  },
  {
    number: '04',
    title: 'Installation',
    description:
      'Our white-glove team handles every detail of delivery and installation, ensuring a flawless final handover.',
  },
]

export function ProcessSection() {
  return (
    <section className="section-pad bg-foreground text-background overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: image collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              <div
                className="aspect-[3/8] bg-cover bg-center"
                style={{ backgroundImage: "url(https://res.cloudinary.com/r8epy5mg/image/upload/v1785487074/L3D124S57ENDOVL3H5YUWLUFALUFX7Y65OA8_4000x3000_qj0lbk.jpg)" }}
                role="img"
                aria-label="Interior design process"
              />
              <div className="flex flex-col gap-3">
                <div
                  className="aspect-[3/4] bg-cover bg-center"
                  style={{ backgroundImage: "url(https://res.cloudinary.com/r8epy5mg/image/upload/v1785487028/5f5c41f087539fc2821a6f05e55eed_lxumef.jpg)" }}
                  role="img"
                  aria-label="Furniture selection"
                />
                <div
                  className="aspect-square flex-1 bg-cover bg-center"
                  style={{ backgroundImage: "url(https://res.cloudinary.com/r8epy5mg/image/upload/v1785487065/IMG_3841_1_datflu.jpg)" }}
                  role="img"
                  aria-label="Global sourcing"
                />
              </div>
            </div>
            {/* Floating gold label */}
            <div className="absolute -bottom-4 -right-4 bg-gold text-obsidian px-6 py-4">
              <div className="font-serif text-3xl font-light">12+</div>
              <div className="font-sans text-xs tracking-widest uppercase mt-0.5">Years Excellence</div>
            </div>
          </div>

          {/* Right: content */}
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl md:text-5xl font-light text-background leading-tight mb-6">
              Our Process,<br />
              <span className="italic text-gold">Refined</span>
            </h2>
            <p className="font-sans text-background/60 text-sm leading-relaxed mb-12">
              Every Revamp UG project follows a meticulous four-phase process built to deliver
              extraordinary results while keeping you informed and inspired at every step.
            </p>

            {/* Steps */}
            <div className="flex flex-col">
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className="flex gap-6 py-6 border-b border-background/10 last:border-0 group"
                >
                  <div className="font-serif text-3xl font-light text-gold/40 group-hover:text-gold transition-colors min-w-[2.5rem]">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-light text-background mb-1 group-hover:text-gold transition-colors">
                      {step.title}
                    </h3>
                    <p className="font-sans text-background/50 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
