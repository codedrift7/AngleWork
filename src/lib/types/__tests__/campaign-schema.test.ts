import { describe, it, expect } from 'vitest'
import { ProductBriefSchema } from '../campaign'

describe('ProductBriefSchema', () => {
  const validBaseData = {
    productName: 'Test Product',
    description: 'A comprehensive test product description',
    category: 'Software',
    productType: 'SaaS',
    targetCustomer: 'Small business owners who need better tools',
    customerProblem: 'They struggle with managing their workflow efficiently',
    customerSophistication: 'Solution Aware',
    mainBenefit: 'Saves time and increases productivity significantly',
    keyDifferentiator: 'Unique AI-powered automation that no competitor offers',
    price: '$49/month',
    marketingGoal: 'Lead Generation',
    launchType: 'New Product',
    desiredCTA: 'Start Free Trial',
    primaryChannel: 'LinkedIn',
    campaignDuration: '1 Month',
  }

  describe('websiteURL validation', () => {
    it('should accept valid HTTP URLs', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        websiteURL: 'http://example.com',
      })
      expect(result.success).toBe(true)
    })

    it('should accept valid HTTPS URLs', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        websiteURL: 'https://example.com',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty string for websiteURL', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        websiteURL: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept undefined for websiteURL', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        websiteURL: undefined,
      })
      expect(result.success).toBe(true)
    })

    it('should accept missing websiteURL field', () => {
      const result = ProductBriefSchema.safeParse(validBaseData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URLs without protocol', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        websiteURL: 'example.com',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid URL')
      }
    })

    it('should reject invalid URL formats', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        websiteURL: 'not a url',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid URL')
      }
    })
  })

  describe('required fields validation', () => {
    it('should reject when required fields are empty strings', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        productName: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject when required text fields are too short', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        description: 'short',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 10 characters')
      }
    })
  })

  describe('optional fields', () => {
    it('should accept all optional fields as empty strings', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        competitors: '',
        existingTagline: '',
        brandVoice: '',
        websiteURL: '',
        customerTestimonials: '',
        productDocs: '',
        brandGuidelines: '',
        existingCopy: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept all optional fields as undefined', () => {
      const result = ProductBriefSchema.safeParse({
        ...validBaseData,
        competitors: undefined,
        existingTagline: undefined,
        brandVoice: undefined,
        websiteURL: undefined,
        customerTestimonials: undefined,
        productDocs: undefined,
        brandGuidelines: undefined,
        existingCopy: undefined,
      })
      expect(result.success).toBe(true)
    })
  })
})
