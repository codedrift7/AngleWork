'use client'

interface AdConceptCardProps {
  asset: {
    id: string
    stage: string
    title?: string | null
    content: {
      angle: string
      headline: string
      primaryText: string
      cta: string
      targetAudience: string
      stage: string
      rationale: string
    }
    manuallyEdited: boolean
    version: number
  }
}

const angleBadgeClasses: Record<string, string> = {
  pain:     'bg-orange-100 text-orange-800 border border-orange-200',
  outcome:  'bg-green-100 text-green-800 border border-green-200',
  identity: 'bg-blue-100 text-blue-800 border border-blue-200',
}

const angleLabels: Record<string, string> = {
  pain:     'Pain',
  outcome:  'Outcome',
  identity: 'Identity',
}

const stageBadgeClasses: Record<string, string> = {
  attention: 'bg-orange-100 text-orange-800 border border-orange-200',
  interest:  'bg-blue-100 text-blue-800 border border-blue-200',
  desire:    'bg-purple-100 text-purple-800 border border-purple-200',
  action:    'bg-green-100 text-green-800 border border-green-200',
}

const stageLabels: Record<string, string> = {
  attention: 'Attention',
  interest:  'Interest',
  desire:    'Desire',
  action:    'Action',
}

export function AdConceptCard({ asset }: AdConceptCardProps) {
  const { content, stage, manuallyEdited } = asset
  const angleClass =
    angleBadgeClasses[content.angle] ?? 'bg-gray-100 text-gray-800 border border-gray-200'
  const stageClass =
    stageBadgeClasses[stage] ?? 'bg-gray-100 text-gray-800 border border-gray-200'

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
        {/* Channel badge */}
        <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white">
          Ad
        </span>

        {/* Angle badge */}
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${angleClass}`}>
          {angleLabels[content.angle] ?? content.angle} Angle
        </span>

        {/* AIDA stage badge */}
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stageClass}`}>
          {stageLabels[stage] ?? stage}
        </span>

        {/* Manually modified indicator */}
        {manuallyEdited && (
          <span className="inline-flex items-center rounded-full bg-yellow-50 border border-yellow-300 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Manually Modified
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4">
        {/* Simulated ad preview */}
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4 space-y-2">
          <p className="text-base font-bold leading-snug text-gray-900">
            {content.headline}
          </p>
          <p className="text-sm leading-relaxed text-gray-700">
            {content.primaryText}
          </p>
          <div className="pt-1">
            <span className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white select-none pointer-events-none">
              {content.cta}
            </span>
          </div>
        </div>

        {/* Target audience */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Target Audience
          </p>
          <p className="text-sm text-gray-800">{content.targetAudience}</p>
        </div>

        {/* Rationale */}
        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Rationale
          </p>
          <p className="text-xs italic leading-relaxed text-gray-500">
            {content.rationale}
          </p>
        </div>
      </div>
    </div>
  )
}
