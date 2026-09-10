'use client'

interface LandingPageDisplayProps {
  asset: {
    id: string
    stage: string
    title?: string | null
    content: {
      headline: string
      subheadline: string
      primaryCTA: string
      problemSection: string
      whyCurrentSolutionsFail: string
      productSolution: string
      benefits: string[]
      howItWorks: Array<{ step: string; description: string }>
      objectionHandling: Array<{ objection: string; response: string }>
      socialProof: string
      faq: Array<{ question: string; answer: string }>
      finalCTA: string
    }
    manuallyEdited: boolean
    version: number
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-gray-100">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 select-none">
        <span>{title}</span>
        <svg
          className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  )
}

export function LandingPageDisplay({ asset }: LandingPageDisplayProps) {
  const { content, manuallyEdited } = asset

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
        {/* Channel badge */}
        <span className="inline-flex items-center rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-medium text-white">
          Landing Page
        </span>

        {/* Stage badge */}
        <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          Multi-Stage
        </span>

        {/* Manually modified indicator */}
        {manuallyEdited && (
          <span className="inline-flex items-center rounded-full bg-yellow-50 border border-yellow-300 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Manually Modified
          </span>
        )}
      </div>

      {/* Hero preview */}
      <div className="px-4 py-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4 space-y-2">
          <h2 className="text-base font-bold text-gray-900">{content.headline}</h2>
          <p className="text-sm text-gray-600">{content.subheadline}</p>
          <span className="inline-block rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white select-none pointer-events-none mt-1">
            {content.primaryCTA}
          </span>
        </div>
      </div>

      {/* Collapsible sections */}
      <Section title="Problem Section">
        <p className="text-sm leading-relaxed text-gray-800">{content.problemSection}</p>
      </Section>

      <Section title="Why Current Solutions Fail">
        <p className="text-sm leading-relaxed text-gray-800">{content.whyCurrentSolutionsFail}</p>
      </Section>

      <Section title="Product Solution">
        <p className="text-sm leading-relaxed text-gray-800">{content.productSolution}</p>
      </Section>

      <Section title={`Benefits (${content.benefits.length})`}>
        <ul className="space-y-1.5">
          {content.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
              <span className="mt-0.5 shrink-0 font-bold text-green-600">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={`How It Works (${content.howItWorks.length} steps)`}>
        <ol className="space-y-3">
          {content.howItWorks.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-gray-900">{item.step}</p>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={`Objection Handling (${content.objectionHandling.length})`}>
        <div className="space-y-3">
          {content.objectionHandling.map((item, i) => (
            <div key={i} className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm space-y-1">
              <p className="font-medium text-gray-900">❓ {item.objection}</p>
              <p className="text-gray-600">💬 {item.response}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Social Proof">
        <p className="text-sm italic leading-relaxed text-gray-800">{content.socialProof}</p>
      </Section>

      <Section title={`FAQ (${content.faq.length} questions)`}>
        <div className="space-y-3">
          {content.faq.map((item, i) => (
            <div key={i} className="text-sm space-y-1">
              <p className="font-medium text-gray-900">Q: {item.question}</p>
              <p className="pl-3 text-gray-600">A: {item.answer}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Final CTA">
        <span className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white select-none pointer-events-none">
          {content.finalCTA}
        </span>
      </Section>
    </div>
  )
}
