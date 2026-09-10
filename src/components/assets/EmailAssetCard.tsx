'use client'

interface EmailAssetCardProps {
  asset: {
    id: string
    stage: string
    title?: string | null
    content: {
      stage: string
      subjectLine: string
      previewText: string
      body: string
      cta: string
      strategicPurpose: string
    }
    manuallyEdited: boolean
    version: number
  }
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

export function EmailAssetCard({ asset }: EmailAssetCardProps) {
  const { content, stage, manuallyEdited } = asset
  const wordCount = content.body.trim().split(/\s+/).length
  const stageClass =
    stageBadgeClasses[stage] ?? 'bg-gray-100 text-gray-800 border border-gray-200'

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
        {/* Channel badge */}
        <span className="inline-flex items-center rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-medium text-white">
          Email
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

        {/* Word count */}
        <span className="ml-auto text-xs tabular-nums text-gray-400">
          {wordCount} words
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4">
        {/* Subject line */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Subject Line{' '}
            <span className="font-normal normal-case text-gray-400/70">
              ({content.subjectLine.length}/60 chars)
            </span>
          </p>
          <p className="text-sm font-semibold text-gray-900">{content.subjectLine}</p>
        </div>

        {/* Preview text */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Preview Text{' '}
            <span className="font-normal normal-case text-gray-400/70">
              ({content.previewText.length}/90 chars)
            </span>
          </p>
          <p className="text-sm italic text-gray-500">{content.previewText}</p>
        </div>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Body */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Body
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
            {content.body}
          </p>
        </div>

        {/* CTA button preview */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Call to Action
          </p>
          <span className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white select-none pointer-events-none">
            {content.cta}
          </span>
        </div>

        {/* Strategic purpose */}
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Strategic Purpose
          </p>
          <p className="text-xs italic text-gray-500">{content.strategicPurpose}</p>
        </div>
      </div>
    </div>
  )
}
