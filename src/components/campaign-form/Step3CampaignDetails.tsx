'use client'

import { motion } from 'framer-motion'
import type { ProductBriefData } from '@/lib/types/campaign'

interface StepProps {
  formData: Partial<ProductBriefData>
  errors: Record<string, string>
  onChange: (field: string, value: string) => void
}

export function Step3CampaignDetails({ formData, errors, onChange }: StepProps) {
  const fields = [
    { 
      id: 'marketingGoal', 
      label: 'Marketing Goal', 
      type: 'select', 
      required: true,
      options: [
        { value: '', label: 'Select a marketing goal...' },
        { value: 'Brand Awareness', label: 'Brand Awareness' },
        { value: 'Lead Generation', label: 'Lead Generation' },
        { value: 'Sales Conversion', label: 'Sales Conversion' },
        { value: 'Product Launch', label: 'Product Launch' },
        { value: 'Customer Retention', label: 'Customer Retention' },
        { value: 'Market Expansion', label: 'Market Expansion' }
      ]
    },
    { 
      id: 'launchType', 
      label: 'Launch Type', 
      type: 'select', 
      required: true,
      options: [
        { value: '', label: 'Select launch type...' },
        { value: 'New Product', label: 'New Product' },
        { value: 'Feature Update', label: 'Feature Update' },
        { value: 'Relaunch', label: 'Relaunch' },
        { value: 'Ongoing Campaign', label: 'Ongoing Campaign' }
      ]
    },
    { 
      id: 'desiredCTA', 
      label: 'Desired Call-to-Action', 
      type: 'text', 
      placeholder: 'e.g., Start Free Trial, Book a Demo, Download Now', 
      required: true 
    },
    { 
      id: 'primaryChannel', 
      label: 'Primary Marketing Channel', 
      type: 'select', 
      required: true,
      options: [
        { value: '', label: 'Select primary channel...' },
        { value: 'LinkedIn', label: 'LinkedIn' },
        { value: 'Email', label: 'Email' },
        { value: 'Landing Page', label: 'Landing Page' },
        { value: 'Paid Ads', label: 'Paid Ads' },
        { value: 'Multiple Channels', label: 'Multiple Channels' }
      ]
    },
    { 
      id: 'campaignDuration', 
      label: 'Campaign Duration', 
      type: 'select', 
      required: true,
      options: [
        { value: '', label: 'Select campaign duration...' },
        { value: '1 Week', label: '1 Week' },
        { value: '2 Weeks', label: '2 Weeks' },
        { value: '1 Month', label: '1 Month' },
        { value: '3 Months', label: '3 Months' },
        { value: 'Ongoing', label: 'Ongoing' }
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Details</h2>
        <p className="text-gray-600">Set your campaign goals and execution parameters</p>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          
          {field.type === 'select' ? (
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
