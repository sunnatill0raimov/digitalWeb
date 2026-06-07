const router   = require('express').Router();
const { auth, role } = require('../middleware/auth');
const upload   = require('../middleware/upload');

const authC      = require('../controllers/auth.controller');
const userC      = require('../controllers/user.controller');
const customerC  = require('../controllers/customer.controller');
const categoryC  = require('../controllers/category.controller');
const productC   = require('../controllers/product.controller');
const orderC     = require('../controllers/order.controller');
const inventoryC = require('../controllers/inventory.controller');
const dashboardC = require('../controllers/dashboard.controller');

// Auth
router.post('/auth/login', authC.login);
router.get ('/auth/me',    auth, authC.me);

// Dashboard
router.get('/dashboard', auth, dashboardC.stats);

// Users  (admin only)
router.get   ('/users',     auth, role('admin'), userC.list);
router.post  ('/users',     auth, role('admin'), userC.create);
router.put   ('/users/:id', auth, role('admin'), userC.update);
router.delete('/users/:id', auth, role('admin'), userC.remove);

// Customers
router.get   ('/customers',     auth, customerC.list);
router.get   ('/customers/:id', auth, customerC.get);
router.post  ('/customers',     auth, role('admin','manager'), customerC.create);
router.put   ('/customers/:id', auth, role('admin','manager'), customerC.update);
router.delete('/customers/:id', auth, role('admin'),           customerC.remove);

// Categories
router.get   ('/categories',     auth, categoryC.list);
router.post  ('/categories',     auth, role('admin','manager'), categoryC.create);
router.put   ('/categories/:id', auth, role('admin','manager'), categoryC.update);
router.delete('/categories/:id', auth, role('admin'),           categoryC.remove);

// Products
router.get   ('/products',     auth, productC.list);
router.get   ('/products/:id', auth, productC.get);
router.post  ('/products',     auth, role('admin','manager'), upload.single('image'), productC.create);
router.put   ('/products/:id', auth, role('admin','manager'), upload.single('image'), productC.update);
router.delete('/products/:id', auth, role('admin'),                                    productC.remove);

// Orders
router.get   ('/orders',           auth, orderC.list);
router.get   ('/orders/:id',       auth, orderC.get);
router.post  ('/orders',           auth, role('admin','manager'),    orderC.create);
router.patch ('/orders/:id/status',auth, role('admin','manager'),    orderC.updateStatus);
router.delete('/orders/:id',       auth, role('admin'),              orderC.remove);

// Inventory
router.get ('/inventory/logs', auth, inventoryC.logs);
router.post('/inventory/in',   auth, role('admin','manager','warehouse'), inventoryC.stockIn);
router.post('/inventory/out',  auth, role('admin','manager'),             inventoryC.stockOut);

module.exports = router;
