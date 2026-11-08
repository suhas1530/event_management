'use client'

import SiteShell from '@/components/layout/SiteShell'
import SearchParamsBoundary from '@/components/layout/SearchParamsBoundary'
import EventDesignAssistant from '@/components/ai/EventDesignAssistant'

export default function EventDesignAssistantPage() {
  return (
    <SiteShell>
      <SearchParamsBoundary>
        <EventDesignAssistant />
      </SearchParamsBoundary>
    </SiteShell>
  )
}
