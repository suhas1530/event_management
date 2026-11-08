import { test, expect } from '@playwright/test'

/**
 * Search metadata is part of the product surface, not an afterthought. These
 * checks run against the rendered HTML so a page that silently loses its
 * title, description or canonical fails the same suite as a broken booking.
 */
const PUBLIC_PAGES = [
  '/',
  '/event-management',
  '/events',
  '/venues',
  '/home-services',
  '/services',
  '/event-design-assistant',
  '/plan-event',
  '/book/technician',
  '/about',
  '/contact',
  '/help',
  '/careers',
  '/become-a-professional',
  '/become-an-event-partner',
  '/privacy',
  '/terms',
]

function match(html: string, pattern: RegExp): string | undefined {
  return html.match(pattern)?.[1]?.trim()
}

test.describe('search metadata', () => {
  test('every public page has a unique title, description and self-canonical', async ({ request }) => {
    test.setTimeout(180_000)

    const titles = new Map<string, string>()
    const descriptions = new Map<string, string>()

    for (const path of PUBLIC_PAGES) {
      const response = await request.get(path)
      expect(response.status(), `${path} should render`).toBe(200)
      expect(response.headers()['content-type'], `${path} should be HTML`).toContain('text/html')

      const html = await response.text()
      const title = match(html, /<title>([^<]+)<\/title>/i)
      const description = match(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i)
      const canonical = match(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)

      expect(title, `${path} is missing a title`).toBeTruthy()
      expect(description, `${path} is missing a description`).toBeTruthy()
      expect(canonical, `${path} is missing a canonical`).toBeTruthy()

      const canonicalPath = new URL(canonical!).pathname.replace(/\/$/, '') || '/'
      expect(canonicalPath, `${path} points its canonical at ${canonicalPath}`).toBe(path.replace(/\/$/, '') || '/')

      expect(titles.has(title!), `${path} duplicates the title from ${titles.get(title!)}`).toBe(false)
      expect(descriptions.has(description!), `${path} duplicates the description from ${descriptions.get(description!)}`).toBe(false)
      titles.set(title!, path)
      descriptions.set(description!, path)
    }
  })

  test('the homepage publishes organisation, website and service structured data', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(
      block => block[1],
    )
    expect(blocks.length).toBeGreaterThan(0)

    const types = blocks
      .map(block => {
        try {
          const parsed = JSON.parse(block) as
            | { '@type'?: string | string[] }
            | Array<{ '@type'?: string | string[] }>
          const nodes = Array.isArray(parsed) ? parsed : [parsed]
          return nodes.map(node => node['@type'])
        } catch {
          return []
        }
      })
      .flat(2)

    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
    expect(types).toContain('Service')
  })

  test('sitemap and robots advertise the same public routes', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    const sitemapBody = await sitemap.text()
    for (const path of PUBLIC_PAGES) {
      expect(sitemapBody, `${path} is missing from the sitemap`).toContain(`<loc>${new URL(path, 'http://localhost:3000').toString()}</loc>`)
    }

    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    const robotsBody = await robots.text()
    expect(robotsBody).toContain('Disallow: /admin/')
    expect(robotsBody).toContain('Disallow: /dashboard/')
    expect(robotsBody).toContain('Sitemap:')
  })
})
