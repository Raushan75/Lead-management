import Link from 'next/link'
import { Button } from '@/components/ui/button'
import LeadForm from '@/components/lead-form'
import { ArrowRight, Sparkles, Users, TrendingUp, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="border-b bg-background/70 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            LeadHub
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Open dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
        </div>
        <div className="container mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-3 py-1 text-xs font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Now open to early customers
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Turn every visitor into a <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">closed deal</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              LeadHub captures leads from your site, routes them to your team, and moves them through a visual pipeline — so nothing slips through the cracks.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#capture">
                <Button size="lg" className="gap-2">Get started free <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">Try the demo dashboard</Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <Stat icon={<Users className="h-4 w-4" />} label="Teams" value="1.2k+" />
              <Stat icon={<TrendingUp className="h-4 w-4" />} label="Won this month" value="38%" />
              <Stat icon={<Zap className="h-4 w-4" />} label="Avg. response" value="< 2h" />
            </div>
          </div>

          <div id="capture" className="lg:pl-8">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">Book a demo</h2>
              <p className="text-muted-foreground">We'll reach out within a day.</p>
            </div>
            <LeadForm />
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
          <Feature title="Public lead capture" desc="Beautiful, validated forms that plug into any website in minutes." />
          <Feature title="Visual pipeline" desc="Drag leads through NEW → CONTACTED → QUALIFIED → WON stages." />
          <Feature title="Role-based access" desc="Admins see everything. Members see only what is assigned to them." />
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  )
}
function Feature({ title, desc }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}
