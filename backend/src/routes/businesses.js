const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const prisma = new PrismaClient();
const TYPES = ['HOTEL', 'HOSTEL', 'HOME', 'COMPANY'];

router.use(auth);
router.get('/', async (req, res) => {
  const items = await prisma.business.findMany({ where: { ownerId: req.user.id }, orderBy: { createdAt: 'desc' } });
  res.json(items);
});
router.post('/', async (req, res) => {
  try {
    const { name, type, address } = req.body;
    if (!name?.trim() || !TYPES.includes(type)) return res.status(400).json({ message: 'Business name and valid type are required' });
    const item = await prisma.business.create({ data: { name: name.trim(), type, address: address?.trim() || null, ownerId: req.user.id } });
    res.status(201).json(item);
  } catch { res.status(500).json({ message: 'Could not create business' }); }
});
module.exports = router;
