/**
 * SOCIAL MEDIA CONTENT PREVIEW PAGE
 *
 * View all templates at different sizes
 * Export to PNG using html-to-image
 */

import { useState, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { Download, ChevronLeft, ChevronRight, Grid, Monitor } from 'lucide-react'

// Import templates - REVISED (no salary amounts)
import {
  PayAccuracy_Slide1,
  PayAccuracy_Slide2,
  PayAccuracy_Slide3,
  PayAccuracy_Slide4,
  PayAccuracy_Slide5,
  PeaceOfMind_Slide1,
  PeaceOfMind_Slide2,
  PeaceOfMind_Slide3,
  PeaceOfMind_Slide4,
  TimeSavings_Slide1,
  TimeSavings_Slide2,
  TimeSavings_Slide3,
  TimeSavings_Slide4,
  DiscrepancyCatch_TikTok,
  ProgressCheck_TikTok,
} from './templates/RevisedCarousels'

type ContentSet = {
  name: string
  slides: React.ComponentType<any>[]
  props?: any
  format: 'instagram' | 'tiktok'
}

const contentSets: ContentSet[] = [
  {
    name: 'Is Your Pay Right?',
    slides: [
      PayAccuracy_Slide1,
      PayAccuracy_Slide2,
      PayAccuracy_Slide3,
      PayAccuracy_Slide4,
      PayAccuracy_Slide5,
    ],
    format: 'instagram',
  },
  {
    name: 'Peace of Mind (Goal Progress)',
    slides: [
      PeaceOfMind_Slide1,
      PeaceOfMind_Slide2,
      PeaceOfMind_Slide3,
      PeaceOfMind_Slide4,
    ],
    format: 'instagram',
  },
  {
    name: 'Time Savings',
    slides: [
      TimeSavings_Slide1,
      TimeSavings_Slide2,
      TimeSavings_Slide3,
      TimeSavings_Slide4,
    ],
    format: 'instagram',
  },
  {
    name: 'TikTok - Discrepancy Catch',
    slides: [DiscrepancyCatch_TikTok],
    format: 'tiktok',
  },
  {
    name: 'TikTok - Progress Check',
    slides: [ProgressCheck_TikTok],
    format: 'tiktok',
  },
]

export function SocialPreview() {
  const [selectedSet, setSelectedSet] = useState(0)
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const slideRef = useRef<HTMLDivElement>(null)

  const currentSet = contentSets[selectedSet]
  const CurrentSlide = currentSet.slides[selectedSlide]

  const scale = currentSet.format === 'instagram' ? 0.4 : 0.35

  const handleExport = useCallback(async () => {
    if (!slideRef.current) return

    try {
      const dataUrl = await toPng(slideRef.current, {
        quality: 1,
        pixelRatio: 2,
        width: currentSet.format === 'instagram' ? 1080 : 1080,
        height: currentSet.format === 'instagram' ? 1350 : 1920,
      })

      const link = document.createElement('a')
      link.download = `portpal-${currentSet.name.toLowerCase().replace(/\s+/g, '-')}-slide-${selectedSlide + 1}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [currentSet, selectedSlide])

  const handleExportAll = useCallback(async () => {
    for (let i = 0; i < currentSet.slides.length; i++) {
      setSelectedSlide(i)
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100))
      await handleExport()
    }
  }, [currentSet, handleExport])

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">PORTPAL Social Content</h1>
            <p className="text-slate-400 text-sm">Preview and export social media templates</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('single')}
                className={`p-2 rounded ${viewMode === 'single' ? 'bg-slate-700' : ''}`}
              >
                <Monitor size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-700' : ''}`}
              >
                <Grid size={20} />
              </button>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-500"
            >
              <Download size={18} />
              Export Slide
            </button>

            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-600"
            >
              <Download size={18} />
              Export All
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Content Set Selector */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Content Set</label>
          <div className="flex flex-wrap gap-2">
            {contentSets.map((set, i) => (
              <button
                key={set.name}
                onClick={() => {
                  setSelectedSet(i)
                  setSelectedSlide(0)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedSet === i
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {set.name}
                <span className="ml-2 text-xs opacity-60">
                  ({set.slides.length} slides, {set.format})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        {viewMode === 'single' ? (
          <div className="flex items-center justify-center gap-8">
            {/* Nav Left */}
            <button
              onClick={() => setSelectedSlide(Math.max(0, selectedSlide - 1))}
              disabled={selectedSlide === 0}
              className="p-3 bg-slate-800 rounded-full disabled:opacity-30"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Slide Preview */}
            <div className="relative">
              <div
                className="overflow-hidden rounded-xl shadow-2xl"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  marginBottom: currentSet.format === 'instagram' ? -810 : -1248,
                }}
              >
                <div ref={slideRef}>
                  <CurrentSlide />
                </div>
              </div>

              {/* Slide indicator */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {currentSet.slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlide(i)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      selectedSlide === i ? 'bg-blue-500 w-6' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Nav Right */}
            <button
              onClick={() => setSelectedSlide(Math.min(currentSet.slides.length - 1, selectedSlide + 1))}
              disabled={selectedSlide === currentSet.slides.length - 1}
              className="p-3 bg-slate-800 rounded-full disabled:opacity-30"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentSet.slides.map((SlideComponent, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedSlide(i)
                  setViewMode('single')
                }}
                className="cursor-pointer hover:ring-2 ring-blue-500 rounded-lg overflow-hidden transition-all"
              >
                <div
                  style={{
                    transform: 'scale(0.2)',
                    transformOrigin: 'top left',
                    width: currentSet.format === 'instagram' ? 216 : 216,
                    height: currentSet.format === 'instagram' ? 270 : 384,
                  }}
                >
                  <SlideComponent />
                </div>
                <div className="bg-slate-800 p-2 text-center text-sm">
                  Slide {i + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-12 bg-slate-800/50 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Export Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-400">Format</div>
              <div className="font-medium capitalize">{currentSet.format}</div>
            </div>
            <div>
              <div className="text-slate-400">Dimensions</div>
              <div className="font-medium">
                {currentSet.format === 'instagram' ? '1080 × 1350' : '1080 × 1920'}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Aspect Ratio</div>
              <div className="font-medium">
                {currentSet.format === 'instagram' ? '4:5' : '9:16'}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Total Slides</div>
              <div className="font-medium">{currentSet.slides.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
