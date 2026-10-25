const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const prisma = new PrismaClient();
router.use(auth);

router.get('/', async (req, res) => {
  const { businessId } = req.query;
  if (!businessId) return res.status(400).json({ message: 'businessId is required' });
  const owned = await prisma.business.findFirst({ where: { id: businessId, ownerId: req.user.id } });
  if (!owned) return res.status(404).json({ message: 'Business not found' });
  const rows = await prisma.transaction.findMany({ where: { businessId }, orderBy: { date: 'desc' } });
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { businessId, type, category, amount, description, date } = req.body;
    if (!businessId || !['INCOME', 'EXPENSE'].includes(type) || !category?.trim() ||
        !Number.isFinite(Number(amount)) || Number(amount) <= 0)
      return res.status(400).json({ message: 'Business, type, category and positive amount are required' });
    const owned = await prisma.business.findFirst({ where: { id: businessId, ownerId: req.user.id } });
    if (!owned) return res.status(404).json({ message: 'Business not found' });
    const row = await prisma.transaction.create({ data: {
      businessId, type, category: category.trim(), amount: Number(amount),
      description: description?.trim() || null, ...(date ? { date: new Date(date) } : {})
    }});
    res.status(201).json(row);
  } catch { res.status(500).json({ message: 'Could not save transaction' }); }
});
module.exports = router;
