const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const healthRoutes = require('./routes/healthRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const queueRoutes = require('./routes/queueRoutes');
const jobRoutes = require('./routes/jobRoutes');
const { attachSocketServer } = require('./realtime/socketHub');
require('./workerManagerInstance');

const app = express();
const httpServer = http.createServer(app);
const uploadsDirectory = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

attachSocketServer(httpServer);

app.set('trust proxy', 1);
app.use(cors({
  origin: config.corsOrigin
}));
app.use(express.json());

app.get('/', function (req, res) {
  res.json({
    status: 'ok',
    service: 'binaire-queue-api'
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/jobs', jobRoutes);

httpServer.listen(config.PORT, config.HOST, function () {
  console.log('Server running on http://' + config.HOST + ':' + config.PORT);
});
