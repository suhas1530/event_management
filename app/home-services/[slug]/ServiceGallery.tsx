'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ServicePhoto } from '@/lib/home-service-images'
import { cn } from '@/lib/utils'

/** Accessible before/after-style gallery for one service's photo collection. */
export default function ServiceGallery({ photos, title }: { photos: ServicePhoto[]; title: string }) {
  const [index, setIndex] = useState(0)
  if (photos.length === 0) return null
  const go = (next: number) => setIndex(((next % photos.length) + photos.length) % photos.length)

  return (
    <section aria-label={`${title} photo gallery`} className="min-w-0">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={photos[index].src}
          alt={photos[index].alt}
          fill
          priority
          sizes="(min-width: 1024px) 900px, 100vw"
          className="object-cover object-center"
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto pb-1" aria-label="Choose a photo">
        {photos.map((photo, i) => (
          <li key={`${photo.src}-${i}`} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}: ${photo.alt}`}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'relative block h-20 w-28 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                i === index ? 'border-primary' : 'border-transparent hover:border-border',
              )}
            >
              <Image src={photo.src} alt="" fill sizes="112px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
