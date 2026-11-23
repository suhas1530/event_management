import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOME_CATALOG } from '@/lib/catalog'
import {
  HOME_SERVICE_GALLERY,
  HOME_SERVICE_PHOTOS,
  HOME_SERVICE_SLIDES,
  homeServiceGallery,
  homeServicePhoto,
  serviceDetailHref,
} from '@/lib/home-service-images'

const photoFiles = new Set(
  readFileSync(resolve('docs/PHOTO_CREDITS.md'), 'utf8')
    .split('\n')
    .filter(line => line.startsWith('| `') )
    .map(line => line.split('`')[1]),
)

function expectLocalImage(src: string) {
  expect(src, `image path ${src}`).toMatch(/^\/images\/[a-z0-9/-]+\.webp$/)
  expect(existsSync(resolve('public', src.replace(/^\//, ''))), `missing asset ${src}`).toBe(true)
}

describe('home-services photography registry', () => {
  it('gives every catalog group a real, local lead image', () => {
    for (const group of HOME_CATALOG) {
      const lead = homeServicePhoto(group.id)
      expect(lead.alt.length, `${group.id} alt text`).toBeGreaterThan(8)
      expectLocalImage(lead.src)
    }
  })

  it('maps each catalog group to a stable, unique lead collection where one exists', () => {
    const leads = Object.values(HOME_SERVICE_PHOTOS).map(set => set.lead.src)
    expect(new Set(leads).size, 'two groups sharing a lead photo').toBe(leads.length)
  })

  it('keeps every detail gallery populated with existing files', () => {
    for (const group of HOME_CATALOG) {
      const gallery = homeServiceGallery(group.id)
      expect(gallery.length, `${group.id} gallery`).toBeGreaterThan(0)
      for (const item of gallery) {
        expect(item.alt.length).toBeGreaterThan(8)
        expectLocalImage(item.src)
      }
    }
  })

  it('drives the six hero slides from real catalog groups and local photos', () => {
    expect(HOME_SERVICE_SLIDES.length).toBeGreaterThanOrEqual(6)
    for (const slide of HOME_SERVICE_SLIDES) {
      expect(HOME_CATALOG.some(group => group.id === slide.category), slide.category).toBe(true)
      expectLocalImage(slide.image.src)
      expect(serviceDetailHref(slide.category)).toBe(`/home-services/${slide.category}`)
    }
  })

  it('labels every gallery tile with a real service and an existing image', () => {
    expect(HOME_SERVICE_GALLERY.length).toBeGreaterThanOrEqual(7)
    for (const tile of HOME_SERVICE_GALLERY) {
      expect(HOME_CATALOG.some(group => group.id === tile.category), tile.category).toBe(true)
      expectLocalImage(tile.image.src)
    }
  })

  it('resolves deterministically so cards never flicker between photos', () => {
    for (const group of HOME_CATALOG) {
      expect(homeServicePhoto(group.id).src).toBe(homeServicePhoto(group.id).src)
    }
  })

  it('records provenance for every downloaded image', () => {
    expect(photoFiles.size).toBeGreaterThanOrEqual(45)
  })
})
