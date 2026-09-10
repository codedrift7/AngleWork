# ProductIntelligenceCard Component Demo

## Visual Preview

The `ProductIntelligenceCard` component displays Product Intelligence data with the following structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  Product Intelligence                                            │
│                                                                  │
│  Ideal Customer Profile                                          │
│  Freelancers earning $30k-$150k/year who handle their own       │
│  finances                                                        │
│                                                                  │
│  Core Problem                                                    │
│  Freelancers struggle to maintain accurate financial records     │
│  without dedicated accounting support                            │
│                                                                  │
│  Primary Pain (customer language)                                │
│  "I don't know where my money is really going"                   │
│                                                                  │
│  Desired Outcome                                                 │
│  Have clear visibility into business finances without becoming   │
│  an accountant                                                   │
│                                                                  │
│  Core Promise                                                    │
│  Automated bookkeeping that gives you real-time financial        │
│  clarity                                                         │
│                                                                  │
│  Differentiators                                                 │
│  ✓ AI-powered transaction categorization                         │
│  ✓ Proactive tax estimate alerts                                 │
│  ✓ Freelancer-specific expense tracking                          │
│                                                                  │
│  Emotional Drivers                                               │
│  → Fear of tax surprises                                         │
│  → Aspiration to run a professional business                     │
│  → Relief from administrative burden                             │
│                                                                  │
│  Likely Objections                                               │
│  ? Can I trust the AI categorization?                            │
│  ? Is my financial data secure?                                  │
│  ? Will this work with my existing tools?                        │
│                                                                  │
│  Recommended Messaging Angle                                     │
│  ┌────────────────────┐                                          │
│  │  Pain-Focused      │                                          │
│  └────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Color Scheme

- **Differentiators**: Green checkmarks (✓) - `text-green-600`
- **Emotional Drivers**: Blue arrows (→) - `text-blue-600`
- **Objections**: Orange question marks (?) - `text-orange-600`
- **Messaging Angle Badge**: Blue background - `bg-blue-50 border-blue-200 text-blue-900`

## Component Usage

```tsx
import { ProductIntelligenceCard } from '@/components/ProductIntelligenceCard'
import { ProductIntelligence } from '@/lib/types/campaign'

// Example data
const productIntelligence: ProductIntelligence = {
  idealCustomerProfile: 'Freelancers earning $30k-$150k/year',
  coreProblem: 'Struggle to maintain accurate financial records',
  primaryPain: "I don't know where my money is really going",
  desiredOutcome: 'Clear visibility into business finances',
  corePromise: 'Automated bookkeeping with real-time clarity',
  differentiators: [
    'AI-powered transaction categorization',
    'Proactive tax estimate alerts',
    'Freelancer-specific expense tracking'
  ],
  emotionalDrivers: [
    'Fear of tax surprises',
    'Aspiration to run a professional business',
    'Relief from administrative burden'
  ],
  objections: [
    'Can I trust the AI categorization?',
    'Is my financial data secure?',
    'Will this work with my existing tools?'
  ],
  recommendedMessagingAngle: 'pain'
}

// Render the component
<ProductIntelligenceCard productIntelligence={productIntelligence} />
```

## Integration Example

To integrate this component into a campaign page:

```tsx
// src/app/campaign/[id]/page.tsx
import { ProductIntelligenceCard } from '@/components/ProductIntelligenceCard'
import { prisma } from '@/db'

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      strategy: true
    }
  })

  if (!campaign?.strategy) {
    return <div>Product Intelligence not yet generated</div>
  }

  const productIntelligence = campaign.strategy.productIntelligence as ProductIntelligence

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{campaign.name}</h1>
      <ProductIntelligenceCard productIntelligence={productIntelligence} />
    </div>
  )
}
```

## Styling Notes

The component uses Tailwind CSS v4 utility classes:
- Consistent spacing with `mb-6` between sections
- Typography hierarchy: `text-2xl` for title, `text-lg` for section headings
- Semantic colors for different element types
- Flexbox layouts for list items with icons
- Responsive padding and margins
