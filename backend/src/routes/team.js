const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const { getBusinessAccess, canManageMembers } = require('../business-access');
const prisma = new PrismaClient();
const ROLES = ['ADMIN', 'EDITOR', 'VIEWER'];

router.use(auth);

router.get('/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    const members = await prisma.businessMembership.findMany({
      where: { businessId: access.business.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({
      owner: await prisma.user.findUnique({
        where: { id: access.business.ownerId },
        select: { id: true, name: true, email: true },
      }),
      members,
    });
  } catch (error) {
    console.error('Could not load business team:', error);
    res.status(500).json({ message: 'Could not load business team' });
  }
});

router.post('/:businessId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canManageMembers(access.role)) return res.status(403).json({ message: 'Only an owner or admin can manage team members' });
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const role = req.body.role;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !ROLES.includes(role))
      return res.status(400).json({ message: 'A valid registered email and role are required' });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return res.status(404).json({ message: 'Create an account for this email before inviting them' });
    if (user.id === access.business.ownerId)
      return res.status(409).json({ message: 'The business owner already has access' });
    const existing = await prisma.businessMembership.findUnique({
      where: { businessId_userId: { businessId: access.business.id, userId: user.id } },
    });
    if (existing) return res.status(409).json({ message: 'This user is already on the team' });
    const member = await prisma.businessMembership.create({
      data: { businessId: access.business.id, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  } catch (error) {
    console.error('Could not add business team member:', error);
    res.status(500).json({ message: 'Could not add team member' });
  }
});

router.patch('/:businessId/:membershipId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canManageMembers(access.role)) return res.status(403).json({ message: 'Only an owner or admin can manage team members' });
    if (!ROLES.includes(req.body.role)) return res.status(400).json({ message: 'A valid team role is required' });
    const updated = await prisma.businessMembership.updateMany({
      where: { id: req.params.membershipId, businessId: access.business.id },
      data: { role: req.body.role },
    });
    if (!updated.count) return res.status(404).json({ message: 'Team member not found' });
    const member = await prisma.businessMembership.findUnique({
      where: { id: req.params.membershipId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(member);
  } catch (error) {
    console.error('Could not update team member:', error);
    res.status(500).json({ message: 'Could not update team member' });
  }
});

router.delete('/:businessId/:membershipId', async (req, res) => {
  try {
    const access = await getBusinessAccess(prisma, req.params.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canManageMembers(access.role)) return res.status(403).json({ message: 'Only an owner or admin can manage team members' });
    const removed = await prisma.businessMembership.deleteMany({
      where: { id: req.params.membershipId, businessId: access.business.id },
    });
    if (!removed.count) return res.status(404).json({ message: 'Team member not found' });
    res.status(204).end();
  } catch (error) {
    console.error('Could not remove team member:', error);
    res.status(500).json({ message: 'Could not remove team member' });
  }
});

module.exports = router;
