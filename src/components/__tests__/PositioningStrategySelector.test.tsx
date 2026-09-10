/**
 * Tests for PositioningStrategySelector component
 * 
 * These tests verify:
 * - Component renders with 3 messaging angles
 * - Each angle displays tagline, core message, and rationale
 * - Selection highlights the chosen angle
 * - Selection is disabled after choice is made
 * - Server action is called on selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PositioningStrategySelector } from '../PositioningStrategySelector'
import { MessagingAngle } from '@/lib/types/campaign'
import * as campaignActions from '@/actions/campaign'

// Mock the server action
vi.mock('@/actions/campaign', () => ({
  selectMessagingAngle: vi.fn()
}))

describe('PositioningStrategySelector', () => {
  const mockAngles: MessagingAngle[] = [
    {
      type: 'pain',
      tagline: 'Stop guessing where your money went',
      coreMessage: 'Address the frustration of financial uncertainty head-on',
      rationale: 'Freelancers earning $30k-$150k often struggle with knowing their real financial position'
    },
    {
      type: 'outcome',
      tagline: 'Know your real numbers without becoming an accountant',
      coreMessage: 'Focus on the transformation from confusion to clarity',
      rationale: 'This angle emphasizes the desired state without requiring expertise'
    },
    {
      type: 'time',
      tagline: 'Take bookkeeping off your Sunday-night to-do list',
      coreMessage: 'Highlight the time savings and efficiency gains',
      rationale: 'Time is precious for freelancers who would rather work on their craft'
    }
  ]

  const mockCampaignId = 'test-campaign-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all three messaging angles', () => {
    render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={null}
        campaignId={mockCampaignId}
      />
    )

    // Check that all taglines are rendered
    expect(screen.getByText(/Stop guessing where your money went/i)).toBeInTheDocument()
    expect(screen.getByText(/Know your real numbers without becoming an accountant/i)).toBeInTheDocument()
    expect(screen.getByText(/Take bookkeeping off your Sunday-night to-do list/i)).toBeInTheDocument()
  })

  it('displays type labels for each angle', () => {
    render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={null}
        campaignId={mockCampaignId}
      />
    )

    expect(screen.getByText('Pain-Focused')).toBeInTheDocument()
    expect(screen.getByText('Outcome-Focused')).toBeInTheDocument()
    expect(screen.getByText('Time/Effort-Focused')).toBeInTheDocument()
  })

  it('displays core message and rationale for each angle', () => {
    render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={null}
        campaignId={mockCampaignId}
      />
    )

    // Check core messages
    expect(screen.getByText(/Address the frustration of financial uncertainty/i)).toBeInTheDocument()
    expect(screen.getByText(/Focus on the transformation from confusion to clarity/i)).toBeInTheDocument()
    expect(screen.getByText(/Highlight the time savings and efficiency gains/i)).toBeInTheDocument()

    // Check rationales
    expect(screen.getByText(/Freelancers earning \$30k-\$150k often struggle/i)).toBeInTheDocument()
    expect(screen.getByText(/This angle emphasizes the desired state/i)).toBeInTheDocument()
    expect(screen.getByText(/Time is precious for freelancers/i)).toBeInTheDocument()
  })

  it('highlights selected angle when selectedAngleIndex is provided', () => {
    const { container } = render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={1}
        campaignId={mockCampaignId}
      />
    )

    // The second angle (outcome) should be selected
    const buttons = container.querySelectorAll('button')
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls selectMessagingAngle server action when angle is clicked', async () => {
    const mockSelectAction = vi.mocked(campaignActions.selectMessagingAngle)
    mockSelectAction.mockResolvedValue({ success: true, data: { success: true } })

    render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={null}
        campaignId={mockCampaignId}
      />
    )

    // Click the first angle (pain-focused)
    const painButton = screen.getByLabelText(/Select Pain-Focused messaging angle/i)
    fireEvent.click(painButton)

    await waitFor(() => {
      expect(mockSelectAction).toHaveBeenCalledWith(mockCampaignId, 0)
    })
  })

  it('disables selection after an angle is chosen', async () => {
    render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={1}
        campaignId={mockCampaignId}
      />
    )

    // All buttons should be disabled when a selection is made
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('displays error message when selection fails', async () => {
    const mockSelectAction = vi.mocked(campaignActions.selectMessagingAngle)
    mockSelectAction.mockResolvedValue({ 
      success: false, 
      error: 'Failed to save selection' 
    })

    render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={null}
        campaignId={mockCampaignId}
      />
    )

    const painButton = screen.getByLabelText(/Select Pain-Focused messaging angle/i)
    fireEvent.click(painButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to save selection/i)).toBeInTheDocument()
    })
  })

  it('shows success message after selection', async () => {
    const mockSelectAction = vi.mocked(campaignActions.selectMessagingAngle)
    mockSelectAction.mockResolvedValue({ success: true, data: { success: true } })

    render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={null}
        campaignId={mockCampaignId}
      />
    )

    const outcomeButton = screen.getByLabelText(/Select Outcome-Focused messaging angle/i)
    fireEvent.click(outcomeButton)

    await waitFor(() => {
      expect(screen.getByText(/Messaging angle selected! Building your AIDA strategy/i)).toBeInTheDocument()
    })
  })

  it('validates that exactly 3 angles are provided', () => {
    const { container } = render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={null}
        campaignId={mockCampaignId}
      />
    )

    const buttons = container.querySelectorAll('button[aria-label*="messaging angle"]')
    expect(buttons).toHaveLength(3)
  })

  it('displays "Why This Angle?" section for each angle', () => {
    render(
      <PositioningStrategySelector
        messagingAngles={mockAngles}
        selectedAngleIndex={null}
        campaignId={mockCampaignId}
      />
    )

    const whyThisAngleHeadings = screen.getAllByText('Why This Angle?')
    expect(whyThisAngleHeadings).toHaveLength(3)
  })
})
