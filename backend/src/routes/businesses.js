const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(auth);
router.get('/', async (req, res) => {
  try {
    const items = await prisma.business.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { memberships: { some: { userId: req.user.id } } },
        ],
      },
      include: { memberships: { where: { userId: req.user.id }, select: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items.map(({ memberships, ...business }) => ({
      ...business,
      role: business.ownerId === req.user.id ? 'OWNER' : memberships[0].role,
    })));
  } catch (error) {
    console.error('Could not load businesses:', error);
    res.status(500).json({ message: 'Could not load businesses' });
  }
});
router.post('/', async (req, res) => {
  try {
    const { name, type, address } = req.body;
    const businessType = typeof type === 'string' ? type.trim() : '';
    if (!name?.trim() || !businessType || businessType.length > 64)
      return res.status(400).json({ message: 'Business name and a business type of 64 characters or fewer are required' });
    const item = await prisma.business.create({ data: { name: name.trim(), type: businessType, address: address?.trim() || null, ownerId: req.user.id } });
    res.status(201).json(item);
  } catch (error) {
    console.error('Could not create business:', error);
    res.status(500).json({ message: 'Could not create business' });
  }
});
module.exports = router;
