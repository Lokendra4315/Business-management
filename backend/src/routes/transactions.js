const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const { randomUUID } = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { auth } = require('../middleware/auth');
const { getBusinessAccess, canEditBusiness, isValidAmount } = require('../business-access');
const prisma = new PrismaClient();
const attachmentDirectory = path.join(__dirname, '..', '..', 'storage', 'transaction-attachments');
const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif']);
const extensionsByMimeType = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/avif': '.avif',
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only PDF, JPEG, PNG, WebP, HEIC, and AVIF files are allowed');
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

function isValidAttachment(file) {
  const bytes = file.buffer;
  if (file.mimetype === 'application/pdf') return bytes.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === 'image/png') return bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  if (file.mimetype === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (['image/heic', 'image/heif', 'image/avif'].includes(file.mimetype))
    return bytes.toString('ascii', 4, 8) === 'ftyp' &&
      /^(heic|heix|hevc|hevx|mif1|msf1|avif|avis)$/.test(bytes.toString('ascii', 8, 12));
  return false;
}

function safeFileName(name) {
  return path.basename(String(name || 'attachment').replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, 255) || 'attachment';
}

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (typeof businessId !== 'string' || !businessId)
      return res.status(400).json({ message: 'businessId is required' });
    const access = await getBusinessAccess(prisma, businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });

    const where = { businessId: access.business.id };
    if (req.query.createdById !== undefined && typeof req.query.createdById !== 'string')
      return res.status(400).json({ message: 'Creator filter must be a single member ID' });
    if (req.query.createdById === 'UNKNOWN') where.createdById = null;
    else if (typeof req.query.createdById === 'string' && req.query.createdById) {
      const memberIds = [
        access.business.ownerId,
        ...(await prisma.businessMembership.findMany({
          where: { businessId: access.business.id },
          select: { userId: true },
        })).map(member => member.userId),
      ];
      if (!memberIds.includes(req.query.createdById))
        return res.status(400).json({ message: 'The selected creator is not a member of this business' });
      where.createdById = req.query.createdById;
    }
    if (req.query.fromDate || req.query.toDate) {
      const start = req.query.fromDate ? new Date(req.query.fromDate) : null;
      const end = req.query.toDate ? new Date(req.query.toDate) : null;
      if ((req.query.fromDate && typeof req.query.fromDate !== 'string') ||
          (req.query.toDate && typeof req.query.toDate !== 'string') ||
          (start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime())))
        return res.status(400).json({ message: 'Date filters must be valid ISO dates' });
      if (start && end && start > end)
        return res.status(400).json({ message: 'Start date must be on or before end date' });
      where.date = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };
    }

    const rows = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        deletedBy: { select: { id: true, name: true, email: true } },
        attachments: { select: { id: true, fileName: true, mimeType: true, size: true } },
      },
    });
    res.json(rows);
  } catch (error) {
    console.error('Could not load transactions:', error);
    res.status(500).json({ message: 'Could not load transactions' });
  }
});

router.post('/', (req, res, next) => {
  upload.array('attachments', 5)(req, res, error => {
    if (!error) return next();
    const status = error instanceof multer.MulterError ? 400 : error.status || 500;
    return res.status(status).json({
      message: error.code === 'LIMIT_FILE_SIZE'
        ? 'Each attachment must be 10 MB or smaller'
        : error.code === 'LIMIT_FILE_COUNT'
          ? 'You can attach up to 5 files'
          : error.message || 'Could not receive attachments',
    });
  });
}, async (req, res) => {
  const storedPaths = [];
  try {
    const { businessId, type, category, amount, description, date } = req.body;
    const transactionDate = date ? new Date(date) : null;
    const files = req.files || [];
    if (!businessId || !['INCOME', 'EXPENSE'].includes(type) ||
        typeof category !== 'string' || !category.trim() || category.trim().length > 191 ||
        !isValidAmount(amount) ||
        (description !== undefined && description !== null &&
          (typeof description !== 'string' || description.length > 191)) ||
        (date && Number.isNaN(transactionDate.getTime())) ||
        files.some(file => !isValidAttachment(file)))
      return res.status(400).json({ message: 'Enter valid transaction details and attach only supported, unmodified PDF or image files' });
    const access = await getBusinessAccess(prisma, businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Business not found' });
    if (!canEditBusiness(access.role)) return res.status(403).json({ message: 'You do not have permission to change this business' });

    await fs.mkdir(attachmentDirectory, { recursive: true });
    const attachmentData = files.map(file => {
      const storageKey = `${randomUUID()}${extensionsByMimeType[file.mimetype]}`;
      const storagePath = path.join(attachmentDirectory, storageKey);
      storedPaths.push(storagePath);
      return {
        storageKey,
        storagePath,
        fileName: safeFileName(file.originalname),
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      };
    });
    const writes = await Promise.allSettled(
      attachmentData.map(item => fs.writeFile(item.storagePath, item.buffer, { flag: 'wx' })),
    );
    const writeFailure = writes.find(result => result.status === 'rejected');
    if (writeFailure) throw writeFailure.reason;

    const row = await prisma.transaction.create({
      data: {
        businessId: access.business.id,
        type,
        category: category.trim(),
        amount: Number(amount),
        description: typeof description === 'string' ? description.trim() || null : null,
        createdById: req.user.id,
        ...(transactionDate ? { date: transactionDate } : {}),
        attachments: {
          create: attachmentData.map(({ storageKey, fileName, mimeType, size }) => ({
            storageKey,
            fileName,
            mimeType,
            size,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        attachments: { select: { id: true, fileName: true, mimeType: true, size: true } },
      },
    });
    res.status(201).json(row);
  } catch (error) {
    await Promise.all(storedPaths.map(async filePath => {
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT')
          console.error('Could not remove incomplete transaction attachment:', cleanupError);
      }
    }));
    console.error('Could not save transaction:', error);
    res.status(500).json({ message: 'Could not save transaction and attachments' });
  }
});

router.get('/attachments/:attachmentId', async (req, res) => {
  try {
    const attachment = await prisma.transactionAttachment.findUnique({
      where: { id: req.params.attachmentId },
      include: { transaction: { select: { businessId: true } } },
    });
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
    const access = await getBusinessAccess(prisma, attachment.transaction.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Attachment not found' });
    const storagePath = path.join(attachmentDirectory, attachment.storageKey);
    res.download(storagePath, attachment.fileName, error => {
      if (error && !res.headersSent) {
        if (error.code === 'ENOENT') return res.status(404).json({ message: 'Attachment file is no longer available' });
        console.error('Could not download transaction attachment:', error);
        res.status(500).json({ message: 'Could not download attachment' });
      }
    });
  } catch (error) {
    console.error('Could not load transaction attachment:', error);
    res.status(500).json({ message: 'Could not load attachment' });
  }
});

router.delete('/:transactionId', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.transactionId },
      select: {
        id: true,
        businessId: true,
        invoiceId: true,
        deletedAt: true,
        deletedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    const access = await getBusinessAccess(prisma, transaction.businessId, req.user.id);
    if (!access) return res.status(404).json({ message: 'Transaction not found' });
    if (!canEditBusiness(access.role))
      return res.status(403).json({ message: 'You do not have permission to delete this transaction' });
    if (transaction.deletedAt)
      return res.json({ deletedAt: transaction.deletedAt, deletedBy: transaction.deletedBy });
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { deletedAt: new Date(), deletedById: req.user.id },
      include: { deletedBy: { select: { id: true, name: true, email: true } } },
    });
    res.json({
      deletedAt: updatedTransaction.deletedAt,
      deletedBy: updatedTransaction.deletedBy,
    });
  } catch (error) {
    console.error('Could not delete transaction:', error);
    res.status(500).json({ message: 'Could not delete transaction' });
  }
});

module.exports = router;
