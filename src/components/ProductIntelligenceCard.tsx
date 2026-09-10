import { ProductIntelligence } from '@/lib/types/campaign'

interface ProductIntelligenceCardProps {
  productIntelligence: ProductIntelligence
}

/**
 * ProductIntelligenceCard displays the AI-generated product intelligence analysis.
 * Shows ICP, pain, outcome, differentiators, objections, emotional drivers, and messaging angle.
 * 
 * Requirements: 2.2, 2.5
 */
export function ProductIntelligenceCard({ productIntelligence }: ProductIntelligenceCardProps) {
  const messagingAngleLabels: Record<string, string> = {
    pain: 'Pain-Focused',
    outcome: 'Outcome-Focused',
    time: 'Time/Effort-Focused'
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Product Intelligence</h2>

      {/* Ideal Customer Profile */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ideal Customer Profile</h3>
        <p className="text-gray-700 leading-relaxed">{productIntelligence.idealCustomerProfile}</p>
      </section>

      {/* Core Problem */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Core Problem</h3>
        <p className="text-gray-700 leading-relaxed">{productIntelligence.coreProblem}</p>
      </section>

      {/* Primary Pain (Customer Language) */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Primary Pain <span className="text-sm font-normal text-gray-500">(customer language)</span>
        </h3>
        <p className="text-gray-700 italic leading-relaxed">"{productIntelligence.primaryPain}"</p>
      </section>

      {/* Desired Outcome */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Desired Outcome</h3>
        <p className="text-gray-700 leading-relaxed">{productIntelligence.desiredOutcome}</p>
      </section>

      {/* Core Promise */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Core Promise</h3>
        <p className="text-gray-700 leading-relaxed">{productIntelligence.corePromise}</p>
      </section>

      {/* Differentiators */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Differentiators</h3>
        <ul className="space-y-2">
          {productIntelligence.differentiators.map((diff, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-600 mr-2 mt-1">✓</span>
              <span className="text-gray-700">{diff}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Emotional Drivers */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Emotional Drivers</h3>
        <ul className="space-y-2">
          {productIntelligence.emotionalDrivers.map((driver, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2 mt-1">→</span>
              <span className="text-gray-700">{driver}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Objections */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Likely Objections</h3>
        <ul className="space-y-2">
          {productIntelligence.objections.map((objection, index) => (
            <li key={index} className="flex items-start">
              <span className="text-orange-600 mr-2 mt-1">?</span>
              <span className="text-gray-700">{objection}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Recommended Messaging Angle */}
      <section className="mb-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommended Messaging Angle</h3>
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <span className="font-medium text-blue-900">
            {messagingAngleLabels[productIntelligence.recommendedMessagingAngle]}
          </span>
        </div>
      </section>
    </div>
  )
}
