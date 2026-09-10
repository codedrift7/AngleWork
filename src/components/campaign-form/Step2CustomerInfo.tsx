'use client'

import { motion } from 'framer-motion'
import type { ProductBriefData } from '@/lib/types/campaign'

interface StepProps {
  formData: Partial<ProductBriefData>
  errors: Record<string, string>
  onChange: (field: string, value: string) => void
}

export function Step2CustomerInfo({ formData, errors, onChange }: StepProps) {
  const fields = [
    { 
      id: 'targetCustomer', 
      label: 'Target Customer', 
      type: 'textarea', 
      placeholder: 'e.g., Freelancers earning $30k-$150k/year who struggle with financial tracking', 
      rows: 3, 
      required: true,
      helpText: 'Be specific about demographics, income level, and current situation'
    },
    { 
      id: 'customerProblem', 
      label: 'Customer Problem', 
      type: 'textarea', 
      placeholder: 'What problem does your customer face?', 
      rows: 3, 
      required: true,
      helpText: 'Describe the pain point your product solves'
    },
    { 
      id: 'customerSophistication', 
      label: 'Customer Sophistication Level', 
      type: 'select', 
      required: true,
      helpText: 'How aware are they of the problem and available solutions?',
      options: [
        { value: '', label: 'Select sophistication level...' },
        { value: 'Unaware', label: 'Unaware - Do not know they have this problem' },
        { value: 'Problem Aware', label: 'Problem Aware - Know the problem exists' },
        { value: 'Solution Aware', label: 'Solution Aware - Know solutions exist' },
        { value: 'Product Aware', label: 'Product Aware - Know about your product' },
        { value: 'Most Aware', label: 'Most Aware - Ready to buy' }
      ]
    }
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Information</h2>
        <p className="text-gray-600">Define your ideal customer and their pain points</p>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
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
          ) : field.type === 'select' ? (
            <select
              id={field.id}
              value={formData[field.id as keyof ProductBriefData] as string || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                errors[field.id]
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              } bg-white text-gray-900 focus:outline-none transition-all`}
            >
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : null}
          
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
