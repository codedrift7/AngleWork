import { render, screen } from '@testing-library/react'
import { LaunchCalendarDisplay } from '../LaunchCalendarDisplay'
import { LaunchCalendar } from '@/lib/types/campaign'

describe('LaunchCalendarDisplay', () => {
  const mockCalendar: LaunchCalendar = {
    days: [
      {
        dayNumber: 1,
        date: 'Day 1',
        actions: [
          {
            action: 'Finalize landing page copy',
            stage: 'attention'
          },
          {
            action: 'Publish Attention LinkedIn post',
            stage: 'attention'
          }
        ]
      },
      {
        dayNumber: 2,
        date: 'Day 2',
        actions: [
          {
            action: 'Launch pain-focused ad campaign',
            stage: 'attention'
          }
        ]
      },
      {
        dayNumber: 3,
        date: 'Day 3',
        actions: [
          {
            action: 'Send Interest email to subscribers',
            stage: 'interest'
          },
          {
            action: 'Publish Interest LinkedIn post',
            stage: 'interest'
          }
        ]
      },
      {
        dayNumber: 4,
        date: 'Day 4',
        actions: [
          {
            action: 'Launch outcome-focused ad campaign',
            stage: 'interest'
          }
        ]
      },
      {
        dayNumber: 5,
        date: 'Day 5',
        actions: [
          {
            action: 'Publish Desire LinkedIn post',
            stage: 'desire'
          },
          {
            action: 'Send Desire email highlighting transformation',
            stage: 'desire'
          }
        ]
      },
      {
        dayNumber: 6,
        date: 'Day 6',
        actions: [
          {
            action: 'Launch identity-focused ad campaign',
            stage: 'desire'
          }
        ]
      },
      {
        dayNumber: 7,
        date: 'Day 7',
        actions: [
          {
            action: 'Send Action email with CTA',
            stage: 'action'
          },
          {
            action: 'Publish Action LinkedIn post',
            stage: 'action'
          }
        ]
      }
    ]
  }

  it('renders the component title', () => {
    render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    expect(screen.getByText('Launch Calendar')).toBeInTheDocument()
  })

  it('renders the descriptive text', () => {
    render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    expect(screen.getByText(/Your 7-day execution plan/)).toBeInTheDocument()
  })

  it('renders exactly 7 days', () => {
    render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('Day 2')).toBeInTheDocument()
    expect(screen.getByText('Day 3')).toBeInTheDocument()
    expect(screen.getByText('Day 4')).toBeInTheDocument()
    expect(screen.getByText('Day 5')).toBeInTheDocument()
    expect(screen.getByText('Day 6')).toBeInTheDocument()
    expect(screen.getByText('Day 7')).toBeInTheDocument()
  })

  it('renders actions for each day', () => {
    render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    
    expect(screen.getByText('Finalize landing page copy')).toBeInTheDocument()
    expect(screen.getByText('Publish Attention LinkedIn post')).toBeInTheDocument()
    expect(screen.getByText('Send Interest email to subscribers')).toBeInTheDocument()
    expect(screen.getByText('Send Action email with CTA')).toBeInTheDocument()
  })

  it('displays action count for each day', () => {
    render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    
    // Day 1, 3, 5, 7 have 2 actions; Day 2, 4, 6 have 1 action
    expect(screen.getAllByText('2 actions')).toHaveLength(4) // Days 1, 3, 5, 7
    expect(screen.getAllByText('1 action')).toHaveLength(3) // Days 2, 4, 6
  })

  it('renders stage badges when stage is present', () => {
    render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    
    expect(screen.getAllByText('Attention Stage')).toHaveLength(3) // 2 on Day 1, 1 on Day 2
    expect(screen.getAllByText('Interest Stage')).toHaveLength(3)
    expect(screen.getAllByText('Desire Stage')).toHaveLength(3)
    expect(screen.getAllByText('Action Stage')).toHaveLength(2)
  })

  it('handles actions without stage information', () => {
    const calendarWithoutStages: LaunchCalendar = {
      days: [
        {
          dayNumber: 1,
          actions: [
            {
              action: 'Prepare campaign materials'
            }
          ]
        },
        {
          dayNumber: 2,
          actions: [
            {
              action: 'Review all assets'
            }
          ]
        },
        {
          dayNumber: 3,
          actions: [
            {
              action: 'Launch campaign'
            }
          ]
        },
        {
          dayNumber: 4,
          actions: [
            {
              action: 'Monitor performance'
            }
          ]
        },
        {
          dayNumber: 5,
          actions: [
            {
              action: 'Adjust targeting'
            }
          ]
        },
        {
          dayNumber: 6,
          actions: [
            {
              action: 'Scale successful assets'
            }
          ]
        },
        {
          dayNumber: 7,
          actions: [
            {
              action: 'Analyze results'
            }
          ]
        }
      ]
    }
    
    render(<LaunchCalendarDisplay calendar={calendarWithoutStages} />)
    
    expect(screen.getByText('Prepare campaign materials')).toBeInTheDocument()
    expect(screen.queryByText('Attention Stage')).not.toBeInTheDocument()
  })

  it('renders action numbers correctly', () => {
    const { container } = render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    
    // Each action should have a numbered badge (1, 2, etc.)
    // Day 1 has 2 actions, so numbers 1 and 2
    const actionNumbers = container.querySelectorAll('.w-6.h-6.rounded-full')
    expect(actionNumbers.length).toBeGreaterThan(0)
  })

  it('renders footer note about relative timing', () => {
    render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    
    expect(screen.getByText(/All timing is relative to your launch start date/)).toBeInTheDocument()
  })

  it('handles maximum 3 actions per day', () => {
    const calendarWithMaxActions: LaunchCalendar = {
      days: [
        {
          dayNumber: 1,
          actions: [
            { action: 'Action 1', stage: 'attention' },
            { action: 'Action 2', stage: 'attention' },
            { action: 'Action 3', stage: 'attention' }
          ]
        },
        {
          dayNumber: 2,
          actions: [{ action: 'Action 1' }]
        },
        {
          dayNumber: 3,
          actions: [{ action: 'Action 1' }]
        },
        {
          dayNumber: 4,
          actions: [{ action: 'Action 1' }]
        },
        {
          dayNumber: 5,
          actions: [{ action: 'Action 1' }]
        },
        {
          dayNumber: 6,
          actions: [{ action: 'Action 1' }]
        },
        {
          dayNumber: 7,
          actions: [{ action: 'Action 1' }]
        }
      ]
    }
    
    render(<LaunchCalendarDisplay calendar={calendarWithMaxActions} />)
    
    expect(screen.getByText('3 actions')).toBeInTheDocument()
  })

  it('maintains proper day order from 1 to 7', () => {
    const { container } = render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    
    const dayHeaders = screen.getAllByText(/^Day \d$/)
    expect(dayHeaders).toHaveLength(7)
    
    // Verify sequential order
    expect(dayHeaders[0]).toHaveTextContent('Day 1')
    expect(dayHeaders[1]).toHaveTextContent('Day 2')
    expect(dayHeaders[2]).toHaveTextContent('Day 3')
    expect(dayHeaders[6]).toHaveTextContent('Day 7')
  })

  it('applies correct stage colors to badges', () => {
    const { container } = render(<LaunchCalendarDisplay calendar={mockCalendar} />)
    
    // Check that stage badges have appropriate color classes
    const attentionBadges = screen.getAllByText('Attention Stage')
    expect(attentionBadges[0]).toHaveClass('bg-purple-100', 'text-purple-800')
    
    const interestBadges = screen.getAllByText('Interest Stage')
    expect(interestBadges[0]).toHaveClass('bg-blue-100', 'text-blue-800')
    
    const desireBadges = screen.getAllByText('Desire Stage')
    expect(desireBadges[0]).toHaveClass('bg-green-100', 'text-green-800')
    
    const actionBadges = screen.getAllByText('Action Stage')
    expect(actionBadges[0]).toHaveClass('bg-orange-100', 'text-orange-800')
  })
})
