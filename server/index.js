const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/residents', require('./routes/residents'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/finances', require('./routes/finances'));
app.use('/api/violations', require('./routes/violations'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/architectural', require('./routes/architectural'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/parking', require('./routes/parking'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🏠 HOA Manager API running on port ${PORT}`);
});
