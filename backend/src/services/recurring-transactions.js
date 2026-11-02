const MAX_CATCH_UP = 240;

function nextOccurrence(date, frequency, dayOfMonth) {
  const next = new Date(date);
  if (frequency === 'WEEKLY') {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }
  const day = dayOfMonth || next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

async function processRecurringTransactions(prisma, now = new Date()) {
  const rules = await prisma.recurringRule.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    orderBy: { nextRunAt: 'asc' },
    take: 200,
  });
  let processedRules = 0;

  for (const rule of rules) {
    let occurrence = rule.nextRunAt;
    let processed = 0;
    while (occurrence <= now && processed < MAX_CATCH_UP) {
      await prisma.transaction.upsert({
        where: {
          recurringRuleId_recurringDate: {
            recurringRuleId: rule.id,
            recurringDate: occurrence,
            createdById: rule.createdById,
          },
        },
        create: {
          businessId: rule.businessId,
          type: rule.type,
          category: rule.category,
          amount: rule.amount,
          description: rule.description,
          date: occurrence,
          recurringRuleId: rule.id,
          recurringDate: occurrence,
        },
        update: {},
      });
      occurrence = nextOccurrence(occurrence, rule.frequency, rule.dayOfMonth);
      processed += 1;
    }

    if (processed > 0) {
      await prisma.recurringRule.updateMany({
        where: { id: rule.id, nextRunAt: rule.nextRunAt, active: true },
        data: { nextRunAt: occurrence },
      });
      processedRules += 1;
    }
  }
  return processedRules;
}

module.exports = { processRecurringTransactions, nextOccurrence };
