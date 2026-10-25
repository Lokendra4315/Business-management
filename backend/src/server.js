require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const transactionRoutes = require('./routes/transactions');
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api/dashboard/:businessId', require('./middleware/auth').auth, async (req, res) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, ownerId: req.user.id } });
    if (!business) return res.status(404).json({ message: 'Business not found' });
    const rows = await prisma.transaction.findMany({ where: { businessId: business.id } });
    const income = rows.filter(x => x.type === 'INCOME').reduce((s, x) => s + Number(x.amount), 0);
    const expenses = rows.filter(x => x.type === 'EXPENSE').reduce((s, x) => s + Number(x.amount), 0);
    res.json({ business, income, expenses, balance: income - expenses, transactionCount: rows.length });
  } catch { res.status(500).json({ message: 'Could not load dashboard' }); }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
