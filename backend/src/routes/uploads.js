const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const uploadSchema = z.object({
  dataUrl: z.string().min(1, '缺少图片数据'),
  filename: z.string().max(120).optional(),
});

const MIME_TO_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=]+)$/i;
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');

const getPublicBaseUrl = (req) => process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

router.post('/images', authenticate, async (req, res, next) => {
  try {
    const { dataUrl } = uploadSchema.parse(req.body);
    const match = dataUrl.match(DATA_URL_RE);
    if (!match) {
      return res.status(400).json({ error: '仅支持 PNG/JPEG/WEBP/GIF 图片' });
    }

    const mime = match[1].toLowerCase();
    const ext = MIME_TO_EXT[mime];
    const buffer = Buffer.from(match[2], 'base64');

    if (!buffer.length) {
      return res.status(400).json({ error: '图片内容为空' });
    }
    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ error: '图片过大，请控制在 5MB 以内' });
    }

    const now = new Date();
    const folder = path.join(
      UPLOAD_ROOT,
      'images',
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0')
    );
    await fs.mkdir(folder, { recursive: true });

    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filePath = path.join(folder, fileName);
    await fs.writeFile(filePath, buffer);

    const relativePath = path.relative(UPLOAD_ROOT, filePath).split(path.sep).join('/');
    const publicPath = `/uploads/${relativePath}`;

    res.status(201).json({
      url: `${getPublicBaseUrl(req)}${publicPath}`,
      path: publicPath,
      size: buffer.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '验证失败', details: error.errors });
    }
    next(error);
  }
});

module.exports = router;
