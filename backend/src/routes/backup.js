const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const { getBusinessAccess } = require('../business-access');
const prisma = new PrismaClient();
const MAX_ROWS_PER_TABLE = 50000;

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        transactions: true,
        recurringRules: true,
        invoices: true,
        budgets: true,
      },
    });
    res.json({
      format: 'business-manager-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      businesses: businesses.map(({ ownerId, ...business }) => business),
    });
  } catch (error) {
    console.error('Could not create business backup:', error);
    res.status(500).json({ message: 'Could not create data backup' });
  }
});

router.get('/csv/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    const where = { businessId: access.business.id };
    if (req.query.createdById !== undefined && typeof req.query.createdById !== 'string')
      return res.status(400).json({ message: 'Creator filter must be a single member ID' });
    if (req.query.createdById === 'UNKNOWN') where.createdById = null;
    else if (typeof req.query.createdById === 'string' && req.query.createdById) {
      const members = await prisma.businessMembership.findMany({
        where: { businessId: access.business.id },
        select: { userId: true },
      });
      if (![access.business.ownerId, ...members.map(member => member.userId)].includes(req.query.createdById))
        return res.status(400).json({ message: 'The selected creator is not a member of this business' });
      where.createdById = req.query.createdById;
    }
    if (req.query.fromDate || req.query.toDate) {
      if ((req.query.fromDate && typeof req.query.fromDate !== 'string') ||
          (req.query.toDate && typeof req.query.toDate !== 'string'))
        return res.status(400).json({ message: 'Date filters must be ISO date strings' });
      const start = req.query.fromDate ? new Date(req.query.fromDate) : null;
      const end = req.query.toDate ? new Date(req.query.toDate) : null;
      if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime())))
        return res.status(400).json({ message: 'Date filters must be valid ISO dates' });
      if (start && end && start > end)
        return res.status(400).json({ message: 'Start date must be on or before end date' });
      where.date = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };
    }
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        createdBy: { select: { name: true, email: true } },
        deletedBy: { select: { name: true, email: true } },
      },
    });
    const rows = [
      ['Date', 'Type', 'Category', 'Amount', 'Description', 'Status', 'Added by', 'Deleted by'],
      ...transactions.map(item => [
        item.date.toISOString(),
        item.type,
        item.category,
        item.amount,
        item.description,
        item.deletedAt ? 'Deleted' : 'Active',
        item.createdBy?.name || 'Unknown',
        item.deletedBy?.name || '',
      ]),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${access.business.id}.csv"`);
    res.send(`\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`);
  } catch (error) {
    console.error('Could not export transactions:', error);
    res.status(500).json({ message: 'Could not export transactions' });
  }
});

router.post('/restore', async (req, res) => {
  const backup = req.body;
  if (!backup || backup.format !== 'business-manager-backup' || backup.version !== 1 ||
      !Array.isArray(backup.businesses) ||
      backup.businesses.some(business =>
        !business || typeof business.id !== 'string' ||
        !Array.isArray(business.transactions) || !Array.isArray(business.recurringRules) ||
        !Array.isArray(business.invoices) || !Array.isArray(business.budgets) ||
        business.transactions.length > MAX_ROWS_PER_TABLE ||
        business.recurringRules.length > MAX_ROWS_PER_TABLE ||
        business.invoices.length > MAX_ROWS_PER_TABLE ||
        business.budgets.length > MAX_ROWS_PER_TABLE))
    return res.status(400).json({ message: 'This is not a supported Business Manager backup file' });

  try {
    const restored = await prisma.$transaction(async tx => {
      const counts = { businesses: 0, transactions: 0, recurringRules: 0, invoices: 0, budgets: 0 };
      for (const source of backup.businesses) {
        if (typeof source.name !== 'string' || typeof source.type !== 'string' || source.type.length > 64)
          continue;
        const existing = await tx.business.findUnique({ where: { id: source.id } });
        if (existing && existing.ownerId !== req.user.id) continue;
        const business = existing || await tx.business.create({
          data: {
            id: source.id,
            name: source.name,
            type: source.type,
            address: source.address || null,
            ownerId: req.user.id,
            ...(source.createdAt ? { createdAt: new Date(source.createdAt) } : {}),
          },
        });
        if (!existing) counts.businesses += 1;

        const recurringIds = new Map();
        for (const rule of source.recurringRules) {
          if (!rule || typeof rule.id !== 'string') continue;
          const found = await tx.recurringRule.findUnique({ where: { id: rule.id } });
          if (found) {
            if (found.businessId === business.id) recurringIds.set(rule.id, found.id);
            continue;
          }
          const created = await tx.recurringRule.create({
            data: {
              id: rule.id,
              businessId: business.id,
              type: rule.type,
              category: rule.category,
              amount: Number(rule.amount),
              description: rule.description || null,
              frequency: rule.frequency,
              nextRunAt: new Date(rule.nextRunAt),
              dayOfMonth: rule.dayOfMonth || null,
              active: Boolean(rule.active),
              createdById: req.user.id,
              ...(rule.createdAt ? { createdAt: new Date(rule.createdAt) } : {}),
            },
          });
          recurringIds.set(rule.id, created.id);
          counts.recurringRules += 1;
        }

        const invoiceIds = new Map();
        for (const invoice of source.invoices) {
          if (!invoice || typeof invoice.id !== 'string') continue;
          const found = await tx.invoice.findUnique({ where: { id: invoice.id } });
          if (found) {
            if (found.businessId === business.id) invoiceIds.set(invoice.id, found.id);
            continue;
          }
          const numberExists = await tx.invoice.findUnique({ where: { invoiceNumber: invoice.invoiceNumber } });
          const created = await tx.invoice.create({
            data: {
              id: invoice.id,
              invoiceNumber: numberExists
                ? `RESTORE-${invoice.id}-${Date.now()}`
                : invoice.invoiceNumber,
              businessId: business.id,
              customerName: invoice.customerName,
              customerEmail: invoice.customerEmail || null,
              description: invoice.description,
              amount: Number(invoice.amount),
              dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
              status: invoice.status,
              ...(invoice.createdAt ? { createdAt: new Date(invoice.createdAt) } : {}),
            },
          });
          invoiceIds.set(invoice.id, created.id);
          counts.invoices += 1;
        }

        for (const transaction of source.transactions) {
          if (!transaction || typeof transaction.id !== 'string') continue;
          if (await tx.transaction.findUnique({ where: { id: transaction.id } })) continue;
          await tx.transaction.create({
            data: {
              id: transaction.id,
              businessId: business.id,
              type: transaction.type,
              category: transaction.category,
              amount: Number(transaction.amount),
              description: transaction.description || null,
              date: new Date(transaction.date),
              recurringRuleId: recurringIds.get(transaction.recurringRuleId) || null,
              recurringDate: transaction.recurringDate ? new Date(transaction.recurringDate) : null,
              invoiceId: invoiceIds.get(transaction.invoiceId) || null,
              deletedAt: transaction.deletedAt ? new Date(transaction.deletedAt) : null,
              createdById: req.user.id,
              ...(transaction.createdAt ? { createdAt: new Date(transaction.createdAt) } : {}),
            },
          });
          counts.transactions += 1;
        }

        for (const budget of source.budgets) {
          if (!budget || typeof budget.id !== 'string') continue;
          if (await tx.budget.findUnique({ where: { id: budget.id } })) continue;
          const duplicate = await tx.budget.findUnique({
            where: {
              businessId_category_month: {
                businessId: business.id,
                category: budget.category,
                month: budget.month,
              },
            },
          });
          if (duplicate) continue;
          await tx.budget.create({
            data: {
              id: budget.id,
              businessId: business.id,
              category: budget.category,
              month: budget.month,
              limit: Number(budget.limit),
              ...(budget.createdAt ? { createdAt: new Date(budget.createdAt) } : {}),
            },
          });
          counts.budgets += 1;
        }
      }
      return counts;
    });
    res.json({ message: 'Backup merged without replacing existing data', restored });
  } catch (error) {
    console.error('Could not restore business backup:', error);
    res.status(500).json({ message: 'Could not restore this backup. No changes were applied.' });
  }
});

module.exports = router;
