const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const dir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, dir),
  filename:    (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `img_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    /jpeg|jpg|png|webp/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Faqat rasm fayllari ruxsat etilgan'));
  }
});

module.exports = upload;
