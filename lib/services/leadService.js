import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { LeadRepository } from '../repositories/leadRepository';

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];

export const leadCreateSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone is too short').max(30),
  company: z.string().min(1, 'Company is required').max(120),
  message: z.string().min(5, 'Please add a short message').max(2000),
});

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
});

export const LeadService = {
  async createFromPublic(input) {
    const parsed = leadCreateSchema.parse(input);
    const now = new Date();
    const lead = {
      id: uuidv4(),
      ...parsed,
      status: 'NEW',
      assignedTo: null,
      source: 'website',
      createdAt: now,
      updatedAt: now,
    };
    return LeadRepository.create(lead);
  },
  async list(query) {
    return LeadRepository.list(query);
  },
  async updateStatus(id, status) {
    if (!LEAD_STATUSES.includes(status)) throw new Error('Invalid status');
    return LeadRepository.update(id, { status });
  },
  async stats() {
    return LeadRepository.stats();
  },
};
