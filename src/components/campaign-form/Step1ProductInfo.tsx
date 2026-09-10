'use client'

import { motion } from 'framer-motion'
import type { ProductBriefData } from '@/lib/types/campaign'

interface StepProps {
  formData: Partial<ProductBriefData>
  errors: Record<string, string>
  onChange: (field: string, value: string) => void
}

export function Step1ProductInfo({ formData, errors, onChange }: StepProps) {
  const fields = [
    { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., TaskFlow Pro', required: true },
    { id: 'description', label: 'Product Description', type: 'textarea', placeholder: 'Describe what your product does and who it is for...', rows: 4, required: true },
    { id: 'category', label: 'Product Category', type: 'text', placeholder: 'e.g., Project Management Software', required: true },
    { 
      id: 'productType', 
      label: 'Product Type', 
      type: 'select', 
      required: true,
      options: [
        { value: '', label: 'Select a product type...' },
        { value: 'SaaS', label: 'SaaS' },
        { value: 'Physical Product', label: 'Physical Product' },
        { value: 'Digital Product', label: 'Digital Product' },
        { value: 'Service', label: 'Service' },
        { value: 'Mobile App', label: 'Mobile App' },
        { value: 'Platform', label: 'Platform' },
        { value: 'Other', label: 'Other' }
      ]
    },
    { id: 'mainBenefit', label: 'Main Benefit', type: 'textarea', placeholder: 'What is the primary benefit your product delivers?', rows: 3, required: true },
    { id: 'keyDifferentiator', label: 'Key Differentiator', type: 'textarea', placeholder: 'What makes your product different from alternatives?', rows: 3, required: true },
    { id: 'price', label: 'Price or Pricing Model', type: 'text', placeholder: 'e.g., $49/month, $999 one-time, Freemium', required: true }
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Information</h2>
        <p className="text-gray-600">Tell us about your product and what makes it unique</p>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          
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
