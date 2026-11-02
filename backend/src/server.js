require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const transactionRoutes = require('./routes/transactions');
const recurringRoutes = require('./routes/recurring');
const invoiceRoutes = require('./routes/invoices');
const budgetRoutes = require('./routes/budgets');
const teamRoutes = require('./routes/team');
const backupRoutes = require('./routes/backup');
const { getBusinessAccess } = require('./business-access');
const { processRecurringTransactions } = require('./services/recurring-transactions');
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/backup', backupRoutes);

app.get('/api/dashboard/:businessId', require('./middleware/auth').auth, async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    const now = new Date();
    const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const [totals, transactionCount, rows] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where: { businessId: access.business.id, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: { businessId: access.business.id, deletedAt: null } }),
      prisma.transaction.findMany({
        where: { businessId: access.business.id, deletedAt: null, date: { gte: firstMonth } },
        select: { type: true, amount: true, date: true },
      }),
    ]);
    const income = Number(totals.find(item => item.type === 'INCOME')?._sum.amount || 0);
    const expenses = Number(totals.find(item => item.type === 'EXPENSE')?._sum.amount || 0);
    const months = Array.from({ length: 6 }, (_value, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
      const key = date.toISOString().slice(0, 7);
      return {
        month: key,
        label: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        income: 0,
        expenses: 0,
      };
    });
    const monthsByKey = new Map(months.map(month => [month.month, month]));
    for (const row of rows) {
      const month = monthsByKey.get(row.date.toISOString().slice(0, 7));
      if (month) month[row.type === 'INCOME' ? 'income' : 'expenses'] += Number(row.amount);
    }
    res.json({
      business: { ...access.business, role: access.role },
      income,
      expenses,
      balance: income - expenses,
      transactionCount,
      monthlyInsights: months,
    });
  } catch (error) {
    console.error('Could not load dashboard:', error);
    res.status(500).json({ message: 'Could not load dashboard' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => console.log(`API listening on port ${port} on all network interfaces`));

async function runRecurringTransactions() {
  try {
    const processedRules = await processRecurringTransactions(prisma);
    if (processedRules) console.log(`Checked ${processedRules} recurring transaction rule(s)`);
  } catch (error) {
    console.error('Recurring transaction scheduler failed:', error);
  }
}

runRecurringTransactions();
const recurringTimer = setInterval(runRecurringTransactions, 60_000);
recurringTimer.unref();
