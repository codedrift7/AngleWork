import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssetEditor } from '../AssetEditor'
import { updateAsset } from '@/actions/campaign'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the server action
vi.mock('@/actions/campaign', () => ({
  updateAsset: vi.fn()
}))

describe('AssetEditor', () => {
  const mockUpdateAsset = updateAsset as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LinkedIn Post Asset', () => {
    const linkedInAsset = {
      id: 'asset_linkedin_1',
      channel: 'linkedin',
      stage: 'attention',
      assetType: 'post',
      title: 'Attention Post',
      content: {
        stage: 'attention',
        content: 'This is a LinkedIn post about our product.',
        strategicPurpose: 'Hook the audience with a compelling pain point'
      },
      manuallyEdited: false,
      version: 1
    }

    it('should render edit button initially', () => {
      render(<AssetEditor asset={linkedInAsset} />)
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    it('should show edit fields when edit button is clicked', () => {
      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByLabelText(/post content/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/strategic purpose/i)).toBeInTheDocument()
    })

    it('should populate edit fields with current content', () => {
      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const contentInput = screen.getByLabelText(/post content/i) as HTMLTextAreaElement
      expect(contentInput.value).toBe(linkedInAsset.content.content)
    })

    it('should show save and cancel buttons in edit mode', () => {
      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
    })

    it('should update content when typing in textarea', () => {
      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const contentInput = screen.getByLabelText(/post content/i) as HTMLTextAreaElement
      fireEvent.change(contentInput, { target: { value: 'Updated content' } })

      expect(contentInput.value).toBe('Updated content')
    })

    it('should call updateAsset when save is clicked', async () => {
      mockUpdateAsset.mockResolvedValue({ success: true, data: { success: true } })

      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const contentInput = screen.getByLabelText(/post content/i)
      fireEvent.change(contentInput, { target: { value: 'Updated content' } })

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockUpdateAsset).toHaveBeenCalledWith(
          linkedInAsset.id,
          expect.stringContaining('Updated content')
        )
      })
    })

    it('should show success message after successful save', async () => {
      mockUpdateAsset.mockResolvedValue({ success: true, data: { success: true } })

      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/changes saved successfully/i)).toBeInTheDocument()
      })
    })

    it('should show error message on save failure', async () => {
      mockUpdateAsset.mockResolvedValue({ success: false, error: 'Save failed' })

      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/save failed/i)).toBeInTheDocument()
      })
    })

    it('should exit edit mode on successful save', async () => {
      mockUpdateAsset.mockResolvedValue({ success: true, data: { success: true } })

      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
      })
    })

    it('should cancel edit and reset content', () => {
      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const contentInput = screen.getByLabelText(/post content/i) as HTMLTextAreaElement
      fireEvent.change(contentInput, { target: { value: 'Changed content' } })
      expect(contentInput.value).toBe('Changed content')

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      // Should exit edit mode
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.queryByLabelText(/post content/i)).not.toBeInTheDocument()

      // Content should be reset if we enter edit mode again
      fireEvent.click(screen.getByRole('button', { name: /edit/i }))
      const resetInput = screen.getByLabelText(/post content/i) as HTMLTextAreaElement
      expect(resetInput.value).toBe(linkedInAsset.content.content)
    })

    it('should show character count for post content', () => {
      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByText(/3,000 characters/i)).toBeInTheDocument()
    })

    it('should disable buttons during save', async () => {
      mockUpdateAsset.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ success: true, data: { success: true } }), 100)
      }))

      render(<AssetEditor asset={linkedInAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const saveButton = screen.getByRole('button', { name: /save/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      
      fireEvent.click(saveButton)

      // Buttons should be disabled during save
      expect(saveButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument()
    })
  })

  describe('Email Asset', () => {
    const emailAsset = {
      id: 'asset_email_1',
      channel: 'email',
      stage: 'interest',
      assetType: 'email',
      title: 'Interest Email',
      content: {
        stage: 'interest',
        subjectLine: 'Test Subject',
        previewText: 'Test Preview',
        body: 'Test email body content',
        cta: 'Learn More',
        strategicPurpose: 'Build interest through education'
      },
      manuallyEdited: false,
      version: 1
    }

    it('should render all email edit fields', () => {
      render(<AssetEditor asset={emailAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByLabelText(/subject line/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/preview text/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^body$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/call to action/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/strategic purpose/i)).toBeInTheDocument()
    })

    it('should populate email fields with current content', () => {
      render(<AssetEditor asset={emailAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const subjectInput = screen.getByLabelText(/subject line/i) as HTMLInputElement
      const previewInput = screen.getByLabelText(/preview text/i) as HTMLInputElement
      const bodyInput = screen.getByLabelText(/^body$/i) as HTMLTextAreaElement
      const ctaInput = screen.getByLabelText(/call to action/i) as HTMLInputElement

      expect(subjectInput.value).toBe(emailAsset.content.subjectLine)
      expect(previewInput.value).toBe(emailAsset.content.previewText)
      expect(bodyInput.value).toBe(emailAsset.content.body)
      expect(ctaInput.value).toBe(emailAsset.content.cta)
    })

    it('should update all email fields', () => {
      render(<AssetEditor asset={emailAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const subjectInput = screen.getByLabelText(/subject line/i) as HTMLInputElement
      fireEvent.change(subjectInput, { target: { value: 'New Subject' } })
      expect(subjectInput.value).toBe('New Subject')

      const previewInput = screen.getByLabelText(/preview text/i) as HTMLInputElement
      fireEvent.change(previewInput, { target: { value: 'New Preview' } })
      expect(previewInput.value).toBe('New Preview')

      const bodyInput = screen.getByLabelText(/^body$/i) as HTMLTextAreaElement
      fireEvent.change(bodyInput, { target: { value: 'New Body' } })
      expect(bodyInput.value).toBe('New Body')
    })

    it('should show character limits for subject and preview', () => {
      render(<AssetEditor asset={emailAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByText(/60 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/90 characters/i)).toBeInTheDocument()
    })

    it('should show word count for email body', () => {
      render(<AssetEditor asset={emailAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByText(/words/i)).toBeInTheDocument()
    })
  })

  describe('Ad Asset', () => {
    const adAsset = {
      id: 'asset_ad_1',
      channel: 'ads',
      stage: 'attention',
      assetType: 'ad',
      title: 'Pain-focused Ad',
      content: {
        angle: 'pain',
        headline: 'Still struggling with bookkeeping?',
        primaryText: 'You don\'t need to be an accountant to know your numbers.',
        cta: 'Try Free',
        targetAudience: 'Freelancers earning $30k-$150k',
        stage: 'attention',
        rationale: 'Leads with pain point'
      },
      manuallyEdited: false,
      version: 1
    }

    it('should render all ad edit fields', () => {
      render(<AssetEditor asset={adAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByLabelText(/^headline$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/primary text/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/call to action/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/target audience/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/rationale/i)).toBeInTheDocument()
    })

    it('should populate ad fields with current content', () => {
      render(<AssetEditor asset={adAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const headlineInput = screen.getByLabelText(/^headline$/i) as HTMLInputElement
      const primaryTextInput = screen.getByLabelText(/primary text/i) as HTMLTextAreaElement

      expect(headlineInput.value).toBe(adAsset.content.headline)
      expect(primaryTextInput.value).toBe(adAsset.content.primaryText)
    })
  })

  describe('Landing Page Asset', () => {
    const landingPageAsset = {
      id: 'asset_landing_1',
      channel: 'landing_page',
      stage: 'multi-stage',
      assetType: 'page_section',
      title: 'Landing Page',
      content: {
        headline: 'Your Financial Clarity Starts Here',
        subheadline: 'AI-powered bookkeeping for freelancers',
        primaryCTA: 'Get Started Free',
        problemSection: 'Not knowing where your money goes creates stress',
        productSolution: 'Our AI handles categorization automatically',
        whyCurrentSolutionsFail: 'Manual bookkeeping takes hours',
        benefits: ['Save time', 'Reduce errors', 'Gain insights'],
        howItWorks: [],
        objectionHandling: [],
        socialProof: '[Insert testimonial]',
        faq: [],
        finalCTA: 'Start Today'
      },
      manuallyEdited: false,
      version: 1
    }

    it('should render landing page edit fields', () => {
      render(<AssetEditor asset={landingPageAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByLabelText(/^headline$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subheadline/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/primary cta/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/problem section/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/product solution/i)).toBeInTheDocument()
    })

    it('should show note about landing page complexity', () => {
      render(<AssetEditor asset={landingPageAsset} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByText(/landing pages have many fields/i)).toBeInTheDocument()
    })
  })

  describe('Callback behavior', () => {
    it('should call onSaveSuccess after successful save', async () => {
      mockUpdateAsset.mockResolvedValue({ success: true, data: { success: true } })
      
      const onSaveSuccess = vi.fn()
      const asset = {
        id: 'asset_1',
        channel: 'linkedin',
        stage: 'attention',
        assetType: 'post',
        content: { stage: 'attention', content: 'Test', strategicPurpose: 'Test' },
        manuallyEdited: false,
        version: 1
      }

      render(<AssetEditor asset={asset} onSaveSuccess={onSaveSuccess} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onSaveSuccess).toHaveBeenCalled()
      })
    })
  })
})
