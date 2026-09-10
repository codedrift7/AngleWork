'use client'

interface LinkedInPostCardProps {
  asset: {
    id: string
    stage: string
    title?: string | null
    content: {
      stage: string
      content: string
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

export function LinkedInPostCard({ asset }: LinkedInPostCardProps) {
  const { content, stage, manuallyEdited } = asset
  const charCount = content.content.length
  const stageClass =
    stageBadgeClasses[stage] ?? 'bg-gray-100 text-gray-800 border border-gray-200'

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
        {/* Channel badge */}
        <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
          LinkedIn
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

        {/* Character count */}
        <span className="ml-auto text-xs tabular-nums text-gray-400">
          {charCount.toLocaleString()} / 3,000 chars
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4">
        {/* Post content — preserve newlines */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
          {content.content}
        </p>

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
