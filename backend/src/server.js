require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const initDB   = require('./config/initDB');

const app = express();

app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());
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
