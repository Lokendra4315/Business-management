const router = require('express').Router();
const { randomBytes } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const { getBusinessAccess, canEditBusiness, isValidAmount } = require('../business-access');
const prisma = new PrismaClient();

router.use(auth);

router.get('/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    const invoices = await prisma.invoice.findMany({
      where: { businessId: access.business.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    console.error('Could not load invoices:', error);
    res.status(500).json({ message: 'Could not load invoices' });
  }
});

router.post('/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canEditBusiness(access.role)) return res.status(403).json({ message: 'You do not have permission to change this business' });

    const { customerName, customerEmail, description, amount, dueDate } = req.body;
    const parsedAmount = Number(amount);
    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    if (typeof customerName !== 'string' || !customerName.trim() || customerName.trim().length > 150 ||
        typeof description !== 'string' || !description.trim() || description.trim().length > 500 ||
        !isValidAmount(amount) ||
        (customerEmail && (typeof customerEmail !== 'string' || customerEmail.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()))) ||
        (dueDate && Number.isNaN(parsedDueDate.getTime())))
      return res.status(400).json({ message: 'A customer, description, positive amount, and valid due date are required' });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`,
        businessId: access.business.id,
        customerName: customerName.trim(),
        customerEmail: typeof customerEmail === 'string' ? customerEmail.trim() || null : null,
        description: description.trim(),
        amount: parsedAmount,
        dueDate: parsedDueDate,
      },
    });
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Could not create invoice:', error);
    res.status(500).json({ message: 'Could not create invoice' });
  }
});

router.patch('/:businessId/:invoiceId/status', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canEditBusiness(access.role)) return res.status(403).json({ message: 'You do not have permission to change this business' });
    if (!['SENT', 'PAID'].includes(req.body.status))
      return res.status(400).json({ message: 'Status must be SENT or PAID' });

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.invoiceId, businessId: access.business.id },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'PAID' && req.body.status !== 'PAID')
      return res.status(409).json({ message: 'A paid invoice cannot be reopened' });

    const updated = await prisma.$transaction(async tx => {
      const saved = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: req.body.status },
      });
      if (req.body.status === 'PAID') {
        await tx.transaction.upsert({
          where: { invoiceId: invoice.id },
          create: {
            invoiceId: invoice.id,
            businessId: invoice.businessId,
            createdById: req.user.id,
            type: 'INCOME',
            category: 'Invoice payment',
            amount: invoice.amount,
            description: `${invoice.invoiceNumber} · ${invoice.customerName}`,
          },
          update: {},
        });
      }
      return saved;
    });
    res.json(updated);
  } catch (error) {
    console.error('Could not update invoice status:', error);
    res.status(500).json({ message: 'Could not update invoice status' });
  }
});

module.exports = router;
