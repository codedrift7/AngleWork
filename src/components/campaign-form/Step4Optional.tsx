'use client'

import { motion } from 'framer-motion'
import type { ProductBriefData } from '@/lib/types/campaign'

interface StepProps {
  formData: Partial<ProductBriefData>
  errors: Record<string, string>
  onChange: (field: string, value: string) => void
}

export function Step4Optional({ formData, errors, onChange }: StepProps) {
  const fields = [
    { id: 'competitors', label: 'Known Competitors', type: 'textarea', placeholder: 'e.g., CompetitorA, CompetitorB', rows: 2 },
    { id: 'existingTagline', label: 'Existing Tagline (if any)', type: 'text', placeholder: 'e.g., Work smarter, not harder' },
    { id: 'brandVoice', label: 'Brand Voice & Tone', type: 'textarea', placeholder: 'e.g., Professional yet approachable, witty but not sarcastic', rows: 2 },
    { id: 'websiteURL', label: 'Website URL', type: 'url', placeholder: 'https://www.yourproduct.com' },
    { 
      id: 'customerTestimonials', 
      label: 'Customer Testimonials', 
      type: 'textarea', 
      placeholder: 'Include any existing customer testimonials (one per line)', 
      rows: 3,
      helpText: 'Testimonials will be preserved character-for-character in your campaign assets.'
    },
    { id: 'productDocs', label: 'Product Documentation or Key Details', type: 'textarea', placeholder: 'Any technical specs, features list, or documentation you want included', rows: 3 },
    { id: 'brandGuidelines', label: 'Brand Guidelines', type: 'textarea', placeholder: 'Any brand guidelines, dos and donts, or style preferences', rows: 3 },
    { id: 'existingCopy', label: 'Existing Marketing Copy', type: 'textarea', placeholder: 'Any existing marketing copy you would like to reference or build on', rows: 3 }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Optional Information</h2>
        <p className="text-gray-600">
          These fields are optional but will help improve your campaign quality
        </p>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
          </label>
          
          {field.helpText && (
            <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
          )}
          
          {field.type === 'textarea' ? (
            <textarea
              id={field.id}
              value={formData[field.id as keyof ProductBriefData] as string || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              rows={field.rows}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                errors[field.id]
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              } bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all`}
            />
          ) : (
            <input
              type={field.type}
              id={field.id}
              value={formData[field.id as keyof ProductBriefData] as string || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                errors[field.id]
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              } bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all`}
            />
          )}
          
          {errors[field.id] && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
            >
              {errors[field.id]}
            </motion.p>
          )}
        </div>
      ))}
    </motion.div>
  )
}
