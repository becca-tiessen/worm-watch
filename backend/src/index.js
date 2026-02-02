require('dotenv').config();
const express = require('express');
const cors = require('cors');
const reportsRouter = require('./routes/reports');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());                        // allow frontend to call this from any origin
app.use(express.json());                // parse JSON request bodies
app.use('/api/reports', reportsRouter);
app.use('/api/stats', statsRouter);

app.listen(PORT, () => console.log(`🐛 Worm Watch API running on port ${PORT}`));
