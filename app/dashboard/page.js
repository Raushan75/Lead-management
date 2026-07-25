'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import PipelineBoard from '@/components/pipeline-board'
import { Sparkles, LogOut, Users, TrendingUp, Trophy, XCircle, Layers, Loader2 } from 'lucide-react'

const STATUS_STYLES = {
  NEW: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CONTACTED: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  QUALIFIED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  PROPOSAL_SENT: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  WON: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  LOST: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadAll = async () => {
    const [meRes, leadsRes, statsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/leads'),
      fetch('/api/stats'),
    ])
    if (leadsRes.status === 401) {
      router.push('/login')
      return
    }
    const me = await meRes.json()
    if (!me.user) { router.push('/login'); return }
    setUser(me.user)
    const l = await leadsRes.json()
    setLeads(l.items || [])
    setStats(await statsRes.json())
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Signed out')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* TOP BAR */}
      <header className="border-b bg-background sticky top-0 z-30">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            LeadHub
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Here is what is happening with your pipeline today.</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Layers className="h-4 w-4" />} label="Total Leads" value={stats?.total ?? 0} tone="text-foreground" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="New" value={stats?.new ?? 0} tone="text-blue-600" />
          <StatCard icon={<Trophy className="h-4 w-4" />} label="Won" value={stats?.won ?? 0} tone="text-emerald-600" />
          <StatCard icon={<XCircle className="h-4 w-4" />} label="Lost" value={stats?.lost ?? 0} tone="text-rose-600" />
        </div>

        {/* TABS */}
        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="list">All leads</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-6">
            {leads.length === 0 ? (
              <EmptyState />
            ) : (
              <PipelineBoard initialLeads={leads} />
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All leads ({leads.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <Th>Name</Th><Th>Company</Th><Th>Email</Th><Th>Phone</Th><Th>Status</Th><Th>Created</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l) => (
                        <tr key={l.id} className="border-t hover:bg-muted/30">
                          <Td className="font-medium">{l.name}</Td>
                          <Td>{l.company}</Td>
                          <Td className="text-muted-foreground">{l.email}</Td>
                          <Td className="text-muted-foreground">{l.phone}</Td>
                          <Td>
                            <Badge variant="outline" className={STATUS_STYLES[l.status]}>{l.status}</Badge>
                          </Td>
                          <Td className="text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</Td>
                        </tr>
                      ))}
                      {leads.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No leads yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, tone }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon} {label}
        </div>
        <div className={`mt-2 text-3xl font-bold ${tone}`}>{value}</div>
      </CardContent>
    </Card>
  )
}
function Th({ children }) { return <th className="text-left px-4 py-3 font-medium">{children}</th> }
function Td({ children, className = '' }) { return <td className={`px-4 py-3 ${className}`}>{children}</td> }
function EmptyState() {
  return (
    <div className="text-center py-16 border border-dashed rounded-lg">
      <Users className="h-10 w-10 mx-auto text-muted-foreground" />
      <h3 className="mt-3 font-semibold">No leads yet</h3>
      <p className="text-sm text-muted-foreground mt-1">Submit the public form on the landing page to see them appear here.</p>
      <Link href="/"><Button variant="outline" className="mt-4">Go to landing page</Button></Link>
    </div>
  )
}
