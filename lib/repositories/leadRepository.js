import { getDb, COLLECTIONS } from '../db';

export const LeadRepository = {
  async create(lead) {
    const db = await getDb();
    await db.collection(COLLECTIONS.LEADS).insertOne(lead);
    return lead;
  },
  async list({ status, search, sort = '-createdAt', page = 1, limit = 100 } = {}) {
    const db = await getDb();
    const q = {};
    if (status) q.status = status;
    if (search) {
      q.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    const dir = sort.startsWith('-') ? -1 : 1;
    const field = sort.replace(/^-/, '');
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      db.collection(COLLECTIONS.LEADS).find(q).sort({ [field]: dir }).skip(skip).limit(limit).toArray(),
      db.collection(COLLECTIONS.LEADS).countDocuments(q),
    ]);
    return { items, total, page, limit };
  },
  async findById(id) {
    const db = await getDb();
    return db.collection(COLLECTIONS.LEADS).findOne({ id });
  },
  async update(id, patch) {
    const db = await getDb();
    await db.collection(COLLECTIONS.LEADS).updateOne({ id }, { $set: { ...patch, updatedAt: new Date() } });
    return this.findById(id);
  },
  async stats() {
    const db = await getDb();
    const col = db.collection(COLLECTIONS.LEADS);
    const [total, byStatus] = await Promise.all([
      col.countDocuments({}),
      col.aggregate([{ $group: { _id: '$status', c: { $sum: 1 } } }]).toArray(),
    ]);
    const map = Object.fromEntries(byStatus.map((x) => [x._id, x.c]));
    return {
      total,
      new: map.NEW || 0,
      contacted: map.CONTACTED || 0,
      qualified: map.QUALIFIED || 0,
      proposal: map.PROPOSAL_SENT || 0,
      won: map.WON || 0,
      lost: map.LOST || 0,
    };
  },
};
