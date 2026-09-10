import { render, screen } from '@testing-library/react'
import { AidaStrategyDisplay } from '../AidaStrategyDisplay'
import { AidaStrategy } from '@/lib/types/campaign'

describe('AidaStrategyDisplay', () => {
  const mockAidaStrategy: AidaStrategy = {
    attention: {
      stage: 'attention',
      objective: 'Hook the reader with the primary pain point',
      contentDirection: 'Lead with financial uncertainty and the hidden costs of guessing',
      keyPoints: [
        'Your bank balance isn\'t the same as knowing how much money you have',
        'Manual bookkeeping creates blind spots'
      ],
      proofRequirements: ['[STAT]', '[TESTIMONIAL]']
    },
    interest: {
      stage: 'interest',
      objective: 'Build credibility and explain why current solutions fail',
      contentDirection: 'Show the cost of the unsolved problem and why traditional tools don\'t work',
      keyPoints: [
        'Spreadsheets require constant maintenance',
        'Generic accounting software is built for accountants, not freelancers',
        'Manual tracking breaks down as soon as you get busy'
      ]
    },
    desire: {
      stage: 'desire',
      objective: 'Paint the picture of the transformed state',
      contentDirection: 'Show the shift from uncertainty to clarity and confidence',
      keyPoints: [
        'Know your real numbers without becoming an accountant',
        'Stop spending Sunday nights sorting receipts',
        'Make decisions based on actual profit, not guesses'
      ],
      proofRequirements: ['[CASE_STUDY]']
    },
    action: {
      stage: 'action',
      objective: 'Drive the primary CTA with clear next steps',
      contentDirection: 'Remove friction and reinforce the core promise',
      keyPoints: [
        'Start your free trial today',
        'No credit card required'
      ]
    }
  }

  it('renders the component title', () => {
    render(<AidaStrategyDisplay aidaStrategy={mockAidaStrategy} />)
    expect(screen.getByText('AIDA Strategy')).toBeInTheDocument()
  })

  it('renders all four AIDA stages', () => {
    render(<AidaStrategyDisplay aidaStrategy={mockAidaStrategy} />)
    
    expect(screen.getByText('Attention')).toBeInTheDocument()
    expect(screen.getByText('Interest')).toBeInTheDocument()
    expect(screen.getByText('Desire')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('renders objectives for each stage', () => {
    render(<AidaStrategyDisplay aidaStrategy={mockAidaStrategy} />)
    
    expect(screen.getByText('Hook the reader with the primary pain point')).toBeInTheDocument()
    expect(screen.getByText('Build credibility and explain why current solutions fail')).toBeInTheDocument()
    expect(screen.getByText('Paint the picture of the transformed state')).toBeInTheDocument()
    expect(screen.getByText('Drive the primary CTA with clear next steps')).toBeInTheDocument()
  })

  it('renders content directions for each stage', () => {
    render(<AidaStrategyDisplay aidaStrategy={mockAidaStrategy} />)
    
    expect(screen.getByText('Lead with financial uncertainty and the hidden costs of guessing')).toBeInTheDocument()
    expect(screen.getByText(/Show the cost of the unsolved problem/)).toBeInTheDocument()
  })

  it('renders key points for each stage', () => {
    render(<AidaStrategyDisplay aidaStrategy={mockAidaStrategy} />)
    
    expect(screen.getByText(/Your bank balance isn't the same/)).toBeInTheDocument()
    expect(screen.getByText('Manual bookkeeping creates blind spots')).toBeInTheDocument()
    expect(screen.getByText('Spreadsheets require constant maintenance')).toBeInTheDocument()
    expect(screen.getByText('Start your free trial today')).toBeInTheDocument()
  })

  it('renders proof requirements when present', () => {
    render(<AidaStrategyDisplay aidaStrategy={mockAidaStrategy} />)
    
    // Attention stage has proof requirements
    const proofElements = screen.getAllByText(/\[STAT\]|\[TESTIMONIAL\]|\[CASE_STUDY\]/)
    expect(proofElements.length).toBeGreaterThan(0)
    
    expect(screen.getByText('[STAT]')).toBeInTheDocument()
    expect(screen.getByText('[TESTIMONIAL]')).toBeInTheDocument()
    expect(screen.getByText('[CASE_STUDY]')).toBeInTheDocument()
  })

  it('does not render proof requirements section when not present', () => {
    const strategyWithoutProof: AidaStrategy = {
      ...mockAidaStrategy,
      interest: {
        ...mockAidaStrategy.interest,
        proofRequirements: undefined
      }
    }
    
    render(<AidaStrategyDisplay aidaStrategy={strategyWithoutProof} />)
    
    // Interest section should not have "Proof Requirements" header
    const allProofHeaders = screen.queryAllByText('Proof Requirements')
    // Should have 2 (attention and desire), not 3
    expect(allProofHeaders.length).toBe(2)
  })

  it('renders multiple key points correctly', () => {
    render(<AidaStrategyDisplay aidaStrategy={mockAidaStrategy} />)
    
    // Interest stage has 3 key points
    expect(screen.getByText('Spreadsheets require constant maintenance')).toBeInTheDocument()
    expect(screen.getByText(/Generic accounting software is built for accountants/)).toBeInTheDocument()
    expect(screen.getByText('Manual tracking breaks down as soon as you get busy')).toBeInTheDocument()
  })

  it('maintains proper visual hierarchy with section headers', () => {
    const { container } = render(<AidaStrategyDisplay aidaStrategy={mockAidaStrategy} />)
    
    // Check that section headers exist
    const objectiveHeaders = screen.getAllByText('Objective')
    const contentDirectionHeaders = screen.getAllByText('Content Direction')
    const keyPointsHeaders = screen.getAllByText('Key Points')
    
    expect(objectiveHeaders.length).toBe(4) // One per stage
    expect(contentDirectionHeaders.length).toBe(4)
    expect(keyPointsHeaders.length).toBe(4)
  })
})
