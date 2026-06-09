require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const initDB   = require('./config/initDB');

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', require('./routes/index'));

app.get('/health', (_, res) => res.json({ ok: true, time: new Date() }));
app.use((_, res) => res.status(404).json({ message: 'Route topilmadi' }));
app.use((err, _, res, __) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server xatosi' });
});

const PORT = process.env.PORT || 3000;

initDB()
  .then(() => app.listen(PORT, () =>
    console.log(`🚀 Server: http://localhost:${PORT}`)
  ))
  .catch(err => { console.error(err); process.exit(1); });
