'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { aiApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/app/providers'
import type { AIDesign } from '@/lib/api'
import {
  Sparkles, ArrowRight, Send, RotateCcw, Save, BookOpen,
  Loader2, ChevronDown, ChevronUp, X, Check, IndianRupee
} from 'lucide-react'
import SearchParamsBoundary from '@/components/layout/SearchParamsBoundary'
import SiteShell from '@/components/layout/SiteShell'

const QUICK_PROMPTS = [
  'Luxury black and gold birthday party for 40 guests, ₹1,00,000 budget',
  'Romantic garden wedding for 150 guests in Mumbai, ₹5,00,000',
  'Kids unicorn theme party for 25 children, ₹30,000',
  'Corporate product launch for 200 people, professional and modern',
  'Intimate engagement ceremony for 50 guests, pastel colors',
]

const REFINE_SUGGESTIONS = [
  'Make it more luxurious', 'Reduce the budget by 20%', 'Change theme to floral',
  'Add live music', 'Remove catering', 'Make it more intimate',
  'Add photography', 'Use outdoor venue', 'Make it more colourful',
]

type Phase = 'input' | 'generating' | 'result'

function formatCurrency(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`
  return `₹${n}`
}

function AIEventDesignerResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [phase, setPhase] = useState<Phase>('input')
  const [prompt, setPrompt] = useState('')
  const [design, setDesign] = useState<AIDesign | null>(null)
  const [aiData, setAiData] = useState<Record<string, unknown>>({})
  const [refineInput, setRefineInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showBudget, setShowBudget] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load existing design from URL param
  useEffect(() => {
    const designId = searchParams.get('design')
    if (designId && isAuthenticated) {
      aiApi.design(designId).then(d => {
        setDesign(d)
        setAiData(d.aiResponse)
        setPhase('result')
      }).catch(() => {})
    }
  }, [searchParams, isAuthenticated])

  async function handleGenerate() {
    if (!prompt.trim()) return
    if (!isAuthenticated) { router.push('/login'); return }
    setLoading(true)
    setPhase('generating')
    try {
      const res = await aiApi.generateDesign({ prompt })
      setDesign(res.design)
      setAiData(res.aiResponse)
      setPhase('result')
      setSaved(false)
    } catch (err: unknown) {
      toast((err as { error?: string })?.error ?? 'Generation failed. Please try again.', 'error')
      setPhase('input')
    } finally { setLoading(false) }
  }

  async function handleRefine() {
    if (!design || !refineInput.trim()) return
    setLoading(true)
    try {
      const res = await aiApi.refineDesign({ designId: design.id, prompt: refineInput })
      setDesign(res.design)
      setAiData(res.aiResponse)
      setRefineInput('')
      toast('Design updated!', 'success')
    } catch (err: unknown) {
      toast((err as { error?: string })?.error ?? 'Refinement failed', 'error')
    } finally { setLoading(false) }
  }

  async function handleSave() {
    if (!design || saved) return
    setSaving(true)
    try {
      await aiApi.saveDesign(design.id)
      setSaved(true)
      toast('Design saved to your account!', 'success')
    } catch { toast('Failed to save design', 'error') }
    finally { setSaving(false) }
  }

  async function handleBookDesign() {
    if (!design) return
    if (!isAuthenticated) { router.push('/login'); return }
    router.push(`/events?aiDesign=${design.id}`)
  }

  function reset() {
    setPhase('input')
    setPrompt('')
    setDesign(null)
    setAiData({})
    setSaved(false)
  }

  const colors = (aiData.colorPalette as Array<{ hex: string; name: string; usage: string }>) ?? []
  const budgetBreakdown = (aiData.budgetBreakdown as Record<string, number>) ?? {}
  const recommendations = (aiData.recommendations as string[]) ?? []
  const timeline = (aiData.timelineRecommendation as Array<{ time: string; activity: string }>) ?? []
  const decor = (aiData.decor as string[]) ?? []
  const entertainment = (aiData.entertainment as string[]) ?? []
  const food = (aiData.food as string[]) ?? []

  return (
    <>
      {/* Design actions live in their own strip above the canvas so they stay
          reachable while the global navbar scrolls away. */}
      {design && (
        <div className="sticky top-16 z-30 border-b border-border-subtle bg-background/95 backdrop-blur-md sm:top-[72px]">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-5 py-3">
            <button type="button" onClick={reset} className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-200 hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <RotateCcw className="size-3" aria-hidden="true" /> New design
            </button>
            <button type="button" onClick={handleSave} disabled={saving || saved}
              className={`flex items-center gap-1.5 border px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition ${saved ? 'border-success text-success' : 'border-gold text-gold-text hover:bg-gold hover:text-gold-foreground'}`}>
              {saved ? <><Check className="size-3" aria-hidden="true" /> Saved</> : saving ? 'Saving…' : <><Save className="size-3" aria-hidden="true" /> Save</>}
            </button>
          </div>
        </div>
      )}

      {/* ── INPUT PHASE ── */}
      {phase === 'input' && (
        <div className="mx-auto max-w-3xl px-5 py-16">
          <div className="text-center mb-12">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center border border-gold/30 bg-gold/10">
              <Sparkles className="size-7 text-gold-text" />
            </div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-gold-text">AI event designer</p>
            <h1 className="font-serif text-5xl tracking-tight text-foreground lg:text-6xl">
              Tell me about<br /><em className="font-light text-gold-text">your dream event.</em>
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Describe what you're imagining — our AI will design a complete event concept with themes,
              décor, services, and a detailed cost estimate.
            </p>
          </div>

          <Link
            href="/event-design-assistant"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-muted-foreground transition hover:border-gold/50"
          >
            <span className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-text" aria-hidden="true" />
              Prefer a guided start? Explore three personalised design directions with images and real catalog services.
            </span>
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-gold-text">
              Open the design assistant <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          </Link>

          <div className="border border-border bg-card p-6">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate() }}
              placeholder="e.g. I want a luxury black and gold birthday party for 40 guests with a ₹1,00,000 budget. Include decoration, photography, cake, and DJ. Outdoor venue in Mumbai."
              rows={5}
              className="w-full bg-transparent text-sm leading-7 text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              aria-label="Describe your event"
            />
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-[10px] text-muted-foreground">Ctrl+Enter to generate</p>
              <button type="button" onClick={handleGenerate} disabled={!prompt.trim()}
                className="group flex items-center gap-2 bg-gold px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-gold-foreground transition hover:bg-gold-soft disabled:opacity-40">
                <Sparkles className="size-4" /> Generate design <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Quick prompts */}
          <div className="mt-8">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Try these</p>
            <div className="flex flex-col gap-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button type="button" key={i} onClick={() => setPrompt(p)}
                  className="border border-border-subtle bg-muted/60 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-gold/30 hover:text-foreground/90">
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── GENERATING PHASE ── */}
      {phase === 'generating' && (
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-5">
          <Loader2 className="mb-6 size-12 animate-spin text-gold-text" />
          <p className="font-serif text-3xl text-foreground">Designing your event…</p>
          <p className="mt-3 text-sm text-muted-foreground">Our AI is crafting a complete concept just for you</p>
          <div className="mt-8 max-w-sm text-center">
            <p className="text-xs italic text-muted-foreground">&ldquo;{prompt.slice(0, 120)}{prompt.length > 120 ? '…' : ''}&rdquo;</p>
          </div>
        </div>
      )}

      {/* ── RESULT PHASE ── */}
      {phase === 'result' && design && (
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
          {/* Header */}
          <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Your event vision</p>
              <h1 className="mt-2 font-serif text-5xl text-foreground">{design.theme}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {design.eventType.replace(/_/g, ' ')} · {design.guestCount} guests · {formatCurrency(design.estimatedCost)}
              </p>
              {(aiData.mood as string) && (
                <p className="mt-1 text-sm italic text-gold-text">{aiData.mood as string}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleBookDesign}
                className="flex items-center gap-2 bg-gold px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-gold-foreground hover:bg-gold-soft">
                <BookOpen className="size-4" /> Book this design
              </button>
              <button type="button" onClick={handleSave} disabled={saving || saved}
                className={`flex items-center gap-2 border px-5 py-3 text-[10px] uppercase tracking-[0.18em] transition ${saved ? 'border-success text-success' : 'border-gold text-gold-text hover:bg-gold/10'}`}>
                {saved ? <><Check className="size-3" /> Saved</> : <><Save className="size-3" /> {saving ? 'Saving…' : 'Save design'}</>}
              </button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content — left 2 cols */}
            <div className="space-y-6 lg:col-span-2">
              {/* Color palette */}
              {colors.length > 0 && (
                <Card title="Colour palette">
                  <div className="flex gap-4">
                    {colors.map((c, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="size-14 border border-border shadow-lg" style={{ background: c.hex }} />
                        <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{c.name}</p>
                        <p className="text-[9px] text-muted-foreground">{c.hex}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Decoration */}
              {decor.length > 0 && (
                <Card title="Decoration & ambience">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {decor.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                        <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-gold" />{d}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Food */}
              {food.length > 0 && (
                <Card title="Food & beverages">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {food.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm text-foreground/80"><span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-gold" />{f}</li>)}
                  </ul>
                </Card>
              )}

              {/* Entertainment */}
              {entertainment.length > 0 && (
                <Card title="Entertainment">
                  <div className="flex flex-wrap gap-2">
                    {entertainment.map((e, i) => (
                      <span key={i} className="border border-border px-3 py-1.5 text-xs text-muted-foreground">{e}</span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Photography */}
              {(aiData.photography as any)?.style && (
                <Card title="Photography & videography">
                  <p className="text-sm text-foreground/90">{(aiData.photography as any).style}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{(aiData.photography as any).hours} hours coverage</p>
                  {(aiData.photography as any).deliverables && (
                    <ul className="mt-3 space-y-1">
                      {((aiData.photography as any).deliverables as string[]).map((d, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="size-3 text-gold-text" />{d}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}

              {/* Event day timeline */}
              {timeline.length > 0 && (
                <Card title="Event day timeline">
                  <ol className="relative border-l border-border pl-5 space-y-4">
                    {timeline.map((t, i) => (
                      <li key={i}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-gold-text">{t.time}</p>
                        <p className="mt-0.5 text-sm text-foreground/90">{t.activity}</p>
                      </li>
                    ))}
                  </ol>
                </Card>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <Card title="Our recommendations">
                  <ul className="space-y-2">
                    {recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 text-gold-text">→</span>{r}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Right — cost + refine */}
            <div className="space-y-6">
              {/* Budget breakdown */}
              <div className="border border-border bg-card p-5">
                <button type="button" onClick={() => setShowBudget(!showBudget)}
                  className="flex w-full items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Estimated cost</p>
                  {showBudget ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                </button>
                <p className="mt-2 font-serif text-4xl text-gold-text">{formatCurrency(design.estimatedCost)}</p>
                <p className="text-xs text-muted-foreground">Indicative estimate</p>

                {showBudget && Object.keys(budgetBreakdown).length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    {Object.entries(budgetBreakdown).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-foreground/90">{formatCurrency(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Services list */}
              {design.services.length > 0 && (
                <div className="border border-border bg-card p-5">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Included services</p>
                  <div className="flex flex-wrap gap-2">
                    {design.services.map((s, i) => (
                      <span key={i} className="bg-gold/10 px-2 py-1 text-[10px] text-gold-text">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Refine panel */}
              <div className="border border-border bg-card p-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-gold-text">Refine this design</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {REFINE_SUGGESTIONS.slice(0, 6).map((s, i) => (
                    <button type="button" key={i} onClick={() => setRefineInput(s)}
                      className="border border-border px-2.5 py-1 text-[9px] text-muted-foreground transition hover:border-gold/40 hover:text-gold-text">
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={refineInput} onChange={e => setRefineInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRefine()}
                    placeholder="E.g. reduce budget by 20%…"
                    className="flex-1 border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none" />
                  <button type="button" onClick={handleRefine} disabled={loading || !refineInput.trim()}
                    className="flex items-center gap-1 border border-gold px-3 py-2.5 text-gold-text hover:bg-gold hover:text-gold-foreground disabled:opacity-40">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
              </div>

              {/* CTA */}
              <button type="button" onClick={handleBookDesign}
                className="w-full bg-gold py-4 text-[10px] uppercase tracking-[0.25em] text-gold-foreground hover:bg-gold-soft">
                Book this design →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

/**
 * Reads the query string via `useSearchParams()`, so it must render inside a
 * Suspense boundary to stay statically prerenderable.
 *
 * SiteShell is mounted outside the boundary so the navbar still ships with the
 * server-rendered HTML; only the designer waits on the client.
 */
export default function AIEventDesignerPage() {
  return (
    <SiteShell>
      <SearchParamsBoundary>
        <AIEventDesignerResults />
      </SearchParamsBoundary>
    </SiteShell>
  )
}
