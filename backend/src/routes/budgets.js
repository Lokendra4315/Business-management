const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const { getBusinessAccess, canEditBusiness, isValidAmount } = require('../business-access');
const prisma = new PrismaClient();

function isValidMonth(month) {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return false;
  const year = Number(month.slice(0, 4));
  return year >= 2000 && year <= 9999;
}

router.use(auth);

router.get('/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    if (!isValidMonth(month)) return res.status(400).json({ message: 'Month must use YYYY-MM format' });
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const [budgets, expenses] = await Promise.all([
      prisma.budget.findMany({ where: { businessId: access.business.id, month }, orderBy: { category: 'asc' } }),
      prisma.transaction.findMany({
        where: { businessId: access.business.id, type: 'EXPENSE', deletedAt: null, date: { gte: start, lt: end } },
        select: { category: true, amount: true },
      }),
    ]);
    const spent = new Map();
    for (const expense of expenses) {
      const key = expense.category.toLowerCase();
      spent.set(key, (spent.get(key) || 0) + Number(expense.amount));
    }
    res.json(budgets.map(budget => {
      const amountSpent = spent.get(budget.category.toLowerCase()) || 0;
      const limit = Number(budget.limit);
      return { ...budget, limit, spent: amountSpent, percent: Math.round(amountSpent / limit * 100) };
    }));
  } catch (error) {
    console.error('Could not load budgets:', error);
    res.status(500).json({ message: 'Could not load budgets' });
  }
});

router.post('/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canEditBusiness(access.role)) return res.status(403).json({ message: 'You do not have permission to change this business' });
    const { category, month, limit } = req.body;
    const parsedLimit = Number(limit);
    if (typeof category !== 'string' || !category.trim() || category.trim().length > 100 ||
        !isValidMonth(month) || !isValidAmount(limit))
      return res.status(400).json({ message: 'A category, YYYY-MM month, and positive budget limit are required' });

    const budget = await prisma.budget.upsert({
      where: {
        businessId_category_month: {
          businessId: access.business.id,
          category: category.trim(),
          month,
        },
      },
      create: {
        businessId: access.business.id,
        category: category.trim(),
        month,
        limit: parsedLimit,
      },
      update: { limit: parsedLimit },
    });
    res.status(201).json(budget);
  } catch (error) {
    console.error('Could not save budget:', error);
    res.status(500).json({ message: 'Could not save budget' });
  }
});

module.exports = router;
