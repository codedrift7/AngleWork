'use client'

import { ProductBriefSchema, type ProductBriefData } from '@/lib/types/campaign'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { z } from 'zod'
import { PipelineProgress } from './PipelineProgress'
import { Step1ProductInfo } from './Step1ProductInfo'
import { Step2CustomerInfo } from './Step2CustomerInfo'
import { Step3CampaignDetails } from './Step3CampaignDetails'
import { Step4Optional } from './Step4Optional'

const TOTAL_STEPS = 4

export function MultiStepCampaignForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPipelineRunning, setIsPipelineRunning] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<Partial<ProductBriefData>>({
    productName: '',
    description: '',
    category: '',
    productType: '',
    targetCustomer: '',
    customerProblem: '',
    customerSophistication: '',
    mainBenefit: '',
    keyDifferentiator: '',
    price: '',
    marketingGoal: '',
    launchType: '',
    desiredCTA: '',
    primaryChannel: '',
    campaignDuration: '',
    competitors: '',
    existingTagline: '',
    brandVoice: '',
    websiteURL: '',
    customerTestimonials: '',
    productDocs: '',
    brandGuidelines: '',
    existingCopy: ''
  })

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateCurrentStep = (): boolean => {
    const stepRequiredFields: Record<number, string[]> = {
      1: ['productName', 'description', 'category', 'productType', 'mainBenefit', 'keyDifferentiator', 'price'],
      2: ['targetCustomer', 'customerProblem', 'customerSophistication'],
      3: ['marketingGoal', 'launchType', 'desiredCTA', 'primaryChannel', 'campaignDuration'],
      4: []
    }

    const fieldsToValidate = stepRequiredFields[currentStep] || []
    const stepErrors: Record<string, string> = {}

    fieldsToValidate.forEach(field => {
      const value = formData[field as keyof ProductBriefData]
      if (!value || value.toString().trim() === '') {
        stepErrors[field] = 'This field is required'
      }
    })

    if (currentStep === 4 && formData.websiteURL && formData.websiteURL.trim() !== '') {
      const urlPattern = /^https?:\/\/.+/
      if (!urlPattern.test(formData.websiteURL)) {
        stepErrors.websiteURL = 'Website URL must be a valid URL (starting with http:// or https://)'
      }
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      ProductBriefSchema.parse(formData)
      setErrors({})
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0] as string
          fieldErrors[fieldName] = issue.message
        })
        setErrors(fieldErrors)
        
        const errorFields = Object.keys(fieldErrors)
        if (errorFields.some(f => ['productName', 'description', 'category', 'productType', 'mainBenefit', 'keyDifferentiator', 'price'].includes(f))) {
          setCurrentStep(1)
        } else if (errorFields.some(f => ['targetCustomer', 'customerProblem', 'customerSophistication'].includes(f))) {
          setCurrentStep(2)
        } else if (errorFields.some(f => ['marketingGoal', 'launchType', 'desiredCTA', 'primaryChannel', 'campaignDuration'].includes(f))) {
          setCurrentStep(3)
        }
        return
      }
    }

    setIsSubmitting(true)
    setIsPipelineRunning(true)

    try {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, value.toString())
        }
      })
      
      const { createCampaignFromBrief } = await import('@/actions/campaign')
      const result = await createCampaignFromBrief(form)
      
      if (!result.success) {
        setIsPipelineRunning(false)
        if (result.fieldErrors) {
          setErrors(result.fieldErrors)
        } else {
          setErrors({ submit: result.error })
        }
      }
      
    } catch (error) {
      console.error('Error submitting form:', error)
      setIsPipelineRunning(false)
      setErrors({ submit: 'Failed to create campaign. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: 'Product Info', description: 'Tell us about your product' },
    { number: 2, title: 'Customer', description: 'Define your target audience' },
    { number: 3, title: 'Campaign', description: 'Set your marketing goals' },
    { number: 4, title: 'Optional', description: 'Add extra details' }
  ]

  return (
    <>
      <AnimatePresence>
        {isPipelineRunning && <PipelineProgress />}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${
                        currentStep >= step.number
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {step.number}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-1 bg-gray-300 mx-2 mb-8 relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-gray-900 transition-transform duration-300"
                        style={{
                          transform: currentStep > step.number ? 'translateX(0)' : 'translateX(-100%)'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 ? (
                <Step1ProductInfo
                  key="step1"
                  formData={formData}
                  errors={errors}
                  onChange={updateFormData}
                />
              ) : currentStep === 2 ? (
                <Step2CustomerInfo
                  key="step2"
                  formData={formData}
                  errors={errors}
                  onChange={updateFormData}
                />
              ) : currentStep === 3 ? (
                <Step3CampaignDetails
                  key="step3"
                  formData={formData}
                  errors={errors}
                  onChange={updateFormData}
                />
              ) : (
                <Step4Optional
                  key="step4"
                  formData={formData}
                  errors={errors}
                  onChange={updateFormData}
                />
              )}
            </AnimatePresence>

            {errors.submit && (
              <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  currentStep === 1
                    ? 'opacity-0 pointer-events-none'
                    : 'border-2 border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                ← Back
              </button>

              <div className="text-sm text-gray-500">
                Step {currentStep} of {TOTAL_STEPS}
              </div>

              {currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isSubmitting ? 'Creating...' : 'Create Campaign 🚀'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
