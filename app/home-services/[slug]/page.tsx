import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  IndianRupee,
  Wrench,
} from 'lucide-react'
import ServiceGallery from './ServiceGallery'
import { HOME_CATALOG, homeGroupById } from '@/lib/catalog'
import { HOME_STEPS } from '@/lib/home-content'
import { homeServiceGallery, homeServicePhoto, serviceDetailHref } from '@/lib/home-service-images'
import { SUPPORTED_CITY } from '@/lib/service-area'

interface DetailProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return HOME_CATALOG.map(group => ({ slug: group.id }))
}

export async function generateMetadata({ params }: DetailProps): Promise<Metadata> {
  const { slug } = await params
  const group = homeGroupById(slug)
  if (!group) return { title: 'Home service' }
  const image = homeServicePhoto(slug)
  return {
    title: `${group.name} at Home`,
    description: group.blurb,
    alternates: { canonical: serviceDetailHref(slug) },
    openGraph: { title: `${group.name} at Home | Heptome`, description: group.blurb, images: [image.src] },
  }
}

export default async function HomeServiceDetailPage({ params }: DetailProps) {
  const { slug } = await params
  const group = homeGroupById(slug)
  if (!group) notFound()

  const photos = homeServiceGallery(group.id)
  const hero = photos[0]
  const gallery = photos.slice(1, 7)
  const related = HOME_CATALOG.filter(item => item.id !== group.id && item.tags.some(tag => group.tags.includes(tag))).slice(0, 3)
  const bookableHref = group.bookingCategory
    ? `/book/technician?category=${group.bookingCategory}`
    : '/contact'

  return (
    <main className="surface-ivory">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="px-5 pb-12 pt-10 sm:px-10 lg:pb-16">
        <div className="mx-auto max-w-[1380px]">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link href="/home-services" className="hover:text-primary">Home services</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-foreground">{group.shortName}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Home service</p>
              <h1 className="mt-4 font-display text-[clamp(2.3rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
                {group.name}
              </h1>
              <p className="surface-ivory-muted mt-5 max-w-xl text-base leading-7">{group.blurb}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={bookableHref}
                  className="btn-heptome inline-flex min-h-12 items-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-primary-foreground focus-ring-ivory"
                >
                  {group.bookingCategory ? 'Book Now' : 'Enquire'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="#gallery"
                  className="surface-ivory-muted inline-flex min-h-12 items-center gap-2 text-sm font-medium hover:text-primary focus-ring-ivory"
                >
                  View photo gallery
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-xs text-muted-foreground">
                <li className="inline-flex items-center gap-2"><BadgeCheck className="size-4 text-primary" aria-hidden="true" /> Profiles reviewed before listing</li>
                <li className="inline-flex items-center gap-2"><CalendarCheck className="size-4 text-primary" aria-hidden="true" /> Two-hour windows to choose from</li>
                <li className="inline-flex items-center gap-2"><IndianRupee className="size-4 text-primary" aria-hidden="true" /> Amount itemised before work starts</li>
              </ul>
            </div>

            <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-border bg-muted">
              <Image
                src={hero.src}
                alt={hero.alt}
                fill
                priority
                loading="eager"
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover object-center"
              />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#111114]/45 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery ────────────────────────────────────────────────── */}
      <section id="gallery" className="scroll-mt-24 px-5 pb-16 sm:px-10">
        <div className="mx-auto max-w-[1380px]">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            A closer look at {group.shortName.toLowerCase()}
          </h2>
          <p className="surface-ivory-muted mt-2 max-w-2xl text-sm leading-6">
            Representative photography for this trade. Individual jobs vary — the scope and price are
            agreed with you before work begins.
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
            <ServiceGallery photos={[hero, ...gallery]} title={group.name} />
            <div className="space-y-4">
              {photos.slice(1, 4).map((item, i) => (
                <div key={`${item.src}-side-${i}`} className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted">
                  <Image src={item.src} alt={item.alt} fill loading="lazy" sizes="(min-width: 1024px) 34vw, 100vw" className="object-cover object-center" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services & process ─────────────────────────────────────── */}
      <section className="border-t border-border px-5 py-16 sm:px-10">
        <div className="mx-auto grid max-w-[1380px] gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">What is included</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Available {group.shortName.toLowerCase()} services
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {group.services.map(service => (
                <li key={service.name} className="panel-ivory flex items-start gap-3 rounded-xl p-4 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {service.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">How it works</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">Four simple steps</h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {HOME_STEPS.map(step => (
                <li key={step.step} className="panel-ivory rounded-xl p-5">
                  <p aria-hidden="true" className="font-display text-2xl font-semibold text-primary/60">{step.step}</p>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="surface-ivory-muted mt-1.5 text-xs leading-5">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Booking availability + benefits ────────────────────────── */}
      <section className="border-t border-border px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-[1380px]">
          <div className="panel-ivory flex flex-wrap items-center justify-between gap-8 rounded-2xl p-7">
            <div className="max-w-xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Booking availability</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {group.bookingCategory ? 'Choose a slot that suits you.' : 'Tell us what you need.'}
              </h2>
              <p className="surface-ivory-muted mt-3 text-sm leading-6">
                {group.bookingCategory
                  ? `Doorstep coverage in ${SUPPORTED_CITY}. The wizard verifies your pincode, shows the live service price and itemises the visit charge and taxes before you confirm.`
                  : 'This service line is handled by appointment. Share your requirements and the team will confirm how we can help.'}
              </p>
            </div>
            <Link
              href={bookableHref}
              className="btn-heptome inline-flex min-h-12 items-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-primary-foreground focus-ring-ivory"
            >
              {group.bookingCategory ? `Book a ${group.shortName.toLowerCase()} professional` : 'Enquire now'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ClipboardCheck, text: 'Scope is agreed before work starts, so you know exactly what is being done.' },
              { icon: Wrench, text: 'The right trade for the job — every category maps to a real booking service.' },
              { icon: BadgeCheck, text: 'Pay after the work is done, with the amount itemised in your booking.' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.text} className="flex items-start gap-3 text-sm leading-6">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="surface-ivory-muted">{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Related services ───────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="border-t border-border px-5 py-16 sm:px-10">
          <div className="mx-auto max-w-[1380px]">
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Related home services</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(item => {
                const photo = homeServicePhoto(item.id)
                return (
                  <Link
                    key={item.id}
                    href={serviceDetailHref(item.id)}
                    className="group overflow-hidden rounded-2xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <Image src={photo.src} alt={photo.alt} fill loading="lazy" sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover object-center transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-semibold text-foreground">{item.shortName}</h3>
                      <p className="surface-ivory-muted mt-1.5 line-clamp-2 text-sm leading-6">{item.blurb}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
