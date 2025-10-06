const express = require('express');
const expressLayout = require('express-ejs-layouts');
const session = require('express-session');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(expressLayout);


//middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'supersecret', // use env var in real app
    resave: false,
    saveUninitialized: true,
  })
);

//routes
app.get('/', (req, res) => {
  res.render('app', { title: 'Home Page' });
});

app.get('/menu', (req, res) => {
  res.render('pages/menu', { layout: 'menuLayout' });
});

app.post('/cart/add', (req, res) => {
  const { id } = req.body;
  const menu = [
    { id: 1, name: 'Special Noodles', price: 35000 },
    { id: 2, name: 'Beef Rice Bowl', price: 45000 },
    { id: 3, name: 'Spring Rolls', price: 20000 },
    { id: 4, name: 'Fried Tofu', price: 15000 },
    { id: 5, name: 'Steamed Dumplings', price: 30000 },
    { id: 6, name: 'Fried Dumplings', price: 32000 },
  ];

  const item = menu.find(m => m.id === parseInt(id));
  if (!item) return res.status(404).send('Item not found');

  if (!req.session.cart) req.session.cart = [];

  const existing = req.session.cart.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    req.session.cart.push({ ...item, quantity: 1 });
  }


  // ✅ Save a flash message
  req.session.flash = `✅ ${item.name} added to your cart!`;

  res.redirect('/cart');
});


// Cart page
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  res.render('pages/cart', { title: 'Your Cart', cart, layout: 'menuLayout' });
});

// WhatsApp checkout
app.get('/checkout', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const message =
    'Hello! I want to order:\n' +
    cart.map((item) => `- ${item.name} (${item.price})`).join('\n') +
    `\n\nTotal: Rp${total.toLocaleString('id-ID')}`;

  const encodedMessage = encodeURIComponent(message);
  const dadNumber = '6281234567890'; // <-- your dad’s WhatsApp number in international format
  const whatsappURL = `https://wa.me/${dadNumber}?text=${encodedMessage}`;

  res.redirect(whatsappURL);
});

app.post('/cart/update', (req, res) => {
  const { id, quantity } = req.body;
  if (!req.session.cart) return res.status(400).json({ error: 'Cart not found' });

  const item = req.session.cart.find(i => i.id == id);
  if (item) item.quantity = parseInt(quantity);
  res.json({ success: true });
});

app.post('/cart/remove', (req, res) => {
  const { id } = req.body;
  if (!req.session.cart) return res.status(400).json({ error: 'Cart not found' });

  req.session.cart = req.session.cart.filter(i => i.id != id);
  res.json({ success: true });
});


// Start the server
app.listen(3000, () => {
  console.log('Server is up on http://localhost:3000');
});
