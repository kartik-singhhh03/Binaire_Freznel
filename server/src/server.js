const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const queueRoutes = require('./routes/queueRoutes');
const jobRoutes = require('./routes/jobRoutes');
require('./workerManagerInstance');

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDirectory = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/jobs', jobRoutes);

app.listen(PORT, function () {
  console.log('Server running on http://localhost:' + PORT);
});
