import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b-2 border-gray-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Anglework
          </Link>
          <Link
            href="/campaign/new"
            className="px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
          Transform product info into
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            complete marketing campaigns
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          AI-powered marketing strategist that generates positioning, AIDA strategy, 
          and channel-specific assets—all from one product brief.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/campaign/new"
            className="px-8 py-4 rounded-full bg-gray-900 text-white text-lg font-semibold hover:bg-gray-800"
          >
            Create Your First Campaign
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-full border-2 border-gray-300 text-gray-900 text-lg font-semibold hover:bg-gray-50"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three simple steps to a complete, ready-to-execute marketing campaign
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative p-8 rounded-2xl border-2 border-gray-200 bg-white hover:shadow-2xl hover:border-blue-500 transition-all">
            <div className="text-5xl mb-4">📝</div>
            <div className="absolute top-4 right-4 text-7xl font-bold text-gray-100">01</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3 relative z-10">
              Product Brief
            </h3>
            <p className="text-gray-600 relative z-10">
              Tell us about your product, target customer, and marketing goals
            </p>
          </div>

          <div className="relative p-8 rounded-2xl border-2 border-gray-200 bg-white hover:shadow-2xl hover:border-blue-500 transition-all">
            <div className="text-5xl mb-4">🤖</div>
            <div className="absolute top-4 right-4 text-7xl font-bold text-gray-100">02</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3 relative z-10">
              AI Pipeline
            </h3>
            <p className="text-gray-600 relative z-10">
              6-stage AI system generates strategy, positioning, AIDA plan, and assets
            </p>
          </div>

          <div className="relative p-8 rounded-2xl border-2 border-gray-200 bg-white hover:shadow-2xl hover:border-blue-500 transition-all">
            <div className="text-5xl mb-4">🚀</div>
            <div className="absolute top-4 right-4 text-7xl font-bold text-gray-100">03</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3 relative z-10">
              Ready Campaign
            </h3>
            <p className="text-gray-600 relative z-10">
              Get LinkedIn posts, emails, landing page, ads, and a 7-day launch calendar
            </p>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What You Get
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A complete, structured campaign backed by AI strategy
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Intelligence</h3>
            <p className="text-gray-600 text-sm">ICP, pain points, differentiators, emotional drivers</p>
          </div>

          <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Positioning Strategy</h3>
            <p className="text-gray-600 text-sm">Category, value prop, 3 messaging angles to choose from</p>
          </div>

          <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AIDA Strategy</h3>
            <p className="text-gray-600 text-sm">4-stage persuasion plan (Attention, Interest, Desire, Action)</p>
          </div>

          <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">LinkedIn Posts</h3>
            <p className="text-gray-600 text-sm">4 posts aligned to AIDA stages</p>
          </div>

          <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Sequences</h3>
            <p className="text-gray-600 text-sm">4 emails with subject lines and CTAs</p>
          </div>

          <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Landing Page</h3>
            <p className="text-gray-600 text-sm">Structured copy with headlines, benefits, objection handling</p>
          </div>

          <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ad Concepts</h3>
            <p className="text-gray-600 text-sm">Multiple ad variations (pain, outcome, identity angles)</p>
          </div>

          <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Launch Calendar</h3>
            <p className="text-gray-600 text-sm">7-day execution plan with daily actions</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to build your campaign?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start with a product brief. Get a complete marketing campaign in minutes.
          </p>
          <Link
            href="/campaign/new"
            className="inline-block px-8 py-4 rounded-full bg-gray-900 text-white text-lg font-semibold hover:bg-gray-800"
          >
            Create Campaign →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-gray-200 py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-600 text-sm">
          © 2024 Anglework. AI-powered marketing campaigns.
        </div>
      </footer>
    </div>
  )
}
