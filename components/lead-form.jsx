'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(6, 'Phone is too short'),
  company: z.string().min(1, 'Company is required'),
  message: z.string().min(5, 'Please tell us a little more'),
})

export default function LeadForm() {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Something went wrong')
      }
      toast.success('Thanks! We\'ll be in touch shortly.')
      setSubmitted(true)
      reset()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-4 text-xl font-semibold">You are on the list</h3>
        <p className="mt-2 text-muted-foreground">A team member will reach out within 24 hours.</p>
        <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
          Submit another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border bg-card p-6 md:p-8 shadow-lg space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Full name" error={errors.name?.message}>
          <Input placeholder="Jane Cooper" {...register('name')} />
        </Field>
        <Field label="Work email" error={errors.email?.message}>
          <Input type="email" placeholder="jane@acme.com" {...register('email')} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input placeholder="+1 555 123 4567" {...register('phone')} />
        </Field>
        <Field label="Company" error={errors.company?.message}>
          <Input placeholder="Acme Inc." {...register('company')} />
        </Field>
      </div>
      <Field label="How can we help?" error={errors.message?.message}>
        <Textarea rows={4} placeholder="Tell us a bit about your goals..." {...register('message')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'Submitting...' : 'Talk to sales'}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        By submitting you agree to our terms & privacy policy.
      </p>
    </form>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
