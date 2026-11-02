async function getBusinessAccess(prisma, businessId, userId) {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      OR: [
        { ownerId: userId },
        { memberships: { some: { userId } } },
      ],
    },
    include: { memberships: { where: { userId }, select: { role: true } } },
  });
  if (!business) return null;
  return {
    business,
    role: business.ownerId === userId ? 'OWNER' : business.memberships[0].role,
  };
}

function canEditBusiness(role) {
  return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';
}

function canManageMembers(role) {
  return role === 'OWNER' || role === 'ADMIN';
}

function isValidAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 && amount <= 9999999999.99 &&
    Number(amount.toFixed(2)) === amount;
}

module.exports = { getBusinessAccess, canEditBusiness, canManageMembers, isValidAmount };
