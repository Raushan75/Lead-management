'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Building2, Mail, Phone, ArrowLeft, ArrowRight } from 'lucide-react'

const COLUMNS = [
  { key: 'NEW', label: 'New', color: 'bg-blue-500' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-indigo-500' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-500' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-amber-500' },
  { key: 'WON', label: 'Won', color: 'bg-emerald-500' },
  { key: 'LOST', label: 'Lost', color: 'bg-rose-500' },
]

export default function PipelineBoard({ initialLeads = [] }) {
  const [leads, setLeads] = useState(initialLeads)

  const move = async (lead, direction) => {
    const idx = COLUMNS.findIndex((c) => c.key === lead.status)
    const nextIdx = idx + direction
    if (nextIdx < 0 || nextIdx >= COLUMNS.length) return
    const newStatus = COLUMNS[nextIdx].key
    const prev = leads
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)))
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(`Moved to ${COLUMNS[nextIdx].label}`)
    } catch (e) {
      setLeads(prev)
      toast.error(e.message)
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((col) => {
          const items = leads.filter((l) => l.status === col.key)
          return (
            <div key={col.key} className="w-72 flex-shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                </div>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px] p-2 rounded-lg bg-muted/40">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No leads</p>
                )}
                {items.map((l) => (
                  <Card key={l.id} className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{l.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Building2 className="h-3 w-3" /> {l.company}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" /> {l.email}</p>
                      <p className="flex items-center gap-1 truncate"><Phone className="h-3 w-3" /> {l.phone}</p>
                    </div>
                    {l.message && (
                      <p className="mt-2 text-xs bg-muted/60 rounded p-2 line-clamp-2">{l.message}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1">
                      <button
                        onClick={() => move(l, -1)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border bg-background hover:bg-accent px-2 py-1 text-xs disabled:opacity-40"
                        disabled={COLUMNS.findIndex((c) => c.key === l.status) === 0}
                        title="Move back"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => move(l, 1)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border bg-primary text-primary-foreground hover:opacity-90 px-2 py-1 text-xs disabled:opacity-40"
                        disabled={COLUMNS.findIndex((c) => c.key === l.status) === COLUMNS.length - 1}
                        title="Move forward"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
