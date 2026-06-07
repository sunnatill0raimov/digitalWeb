const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Avtorizatsiya talab etiladi' });

  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' });
  }
};

const role = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ message: "Ruxsat yo'q" });
  next();
};

module.exports = { auth, role };
