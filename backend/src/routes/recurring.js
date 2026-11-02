const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const { getBusinessAccess, canEditBusiness, isValidAmount } = require('../business-access');
const { processRecurringTransactions } = require('../services/recurring-transactions');
const prisma = new PrismaClient();

router.use(auth);

router.get('/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    await processRecurringTransactions(prisma);
    const rules = await prisma.recurringRule.findMany({
      where: { businessId: access.business.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rules);
  } catch (error) {
    console.error('Could not load recurring transactions:', error);
    res.status(500).json({ message: 'Could not load recurring transactions' });
  }
});

router.post('/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canEditBusiness(access.role)) return res.status(403).json({ message: 'You do not have permission to change this business' });

    const { type, category, amount, description, frequency, nextRunAt } = req.body;
    const runDate = new Date(nextRunAt);
    if (!['INCOME', 'EXPENSE'].includes(type) || typeof category !== 'string' || !category.trim() || category.trim().length > 191 ||
        !isValidAmount(amount) ||
        !['WEEKLY', 'MONTHLY'].includes(frequency) || !nextRunAt || Number.isNaN(runDate.getTime()) ||
        (description && (typeof description !== 'string' || description.length > 191)))
      return res.status(400).json({ message: 'Valid transaction details, frequency, and first run date are required' });

    const rule = await prisma.recurringRule.create({
      data: {
        businessId: access.business.id,
        type,
        category: category.trim(),
        amount: Number(amount),
        description: typeof description === 'string' ? description.trim() || null : null,
        frequency,
        nextRunAt: runDate,
        dayOfMonth: frequency === 'MONTHLY' ? runDate.getUTCDate() : null,
        createdById: req.user.id,
      },
    });
    res.status(201).json(rule);
  } catch (error) {
    console.error('Could not create recurring transaction:', error);
    res.status(500).json({ message: 'Could not create recurring transaction' });
  }
});

router.patch('/:businessId/:ruleId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canEditBusiness(access.role)) return res.status(403).json({ message: 'You do not have permission to change this business' });
    if (typeof req.body.active !== 'boolean')
      return res.status(400).json({ message: 'Active must be true or false' });
    const result = await prisma.recurringRule.updateMany({
      where: { id: req.params.ruleId, businessId: access.business.id },
      data: { active: req.body.active },
    });
    if (!result.count) return res.status(404).json({ message: 'Recurring transaction not found' });
    const rule = await prisma.recurringRule.findUnique({ where: { id: req.params.ruleId } });
    res.json(rule);
  } catch (error) {
    console.error('Could not update recurring transaction:', error);
    res.status(500).json({ message: 'Could not update recurring transaction' });
  }
});

module.exports = router;
