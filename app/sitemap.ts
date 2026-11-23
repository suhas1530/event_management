import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { HOME_CATALOG } from '@/lib/catalog'
import { serviceDetailHref } from '@/lib/home-service-images'

/**
 * Public, indexable routes only. Authenticated dashboards, booking review
 * screens and admin areas are intentionally absent and are also disallowed in
 * robots.txt.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const routes: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/event-management', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/events', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/venues', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/home-services', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/services', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/plan-event', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/book/technician', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/event-design-assistant', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/about', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/help', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/careers', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/become-a-professional', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/become-an-event-partner', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ]

  for (const group of HOME_CATALOG) {
    routes.push({
      path: serviceDetailHref(group.id),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return routes.map(route => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
