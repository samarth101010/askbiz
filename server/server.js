const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security Middlewares - allow cross-origin script embedding for widget.js
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
  })
);
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Serve static widget bundle and demo pages
app.use(express.static(path.join(__dirname, 'public')));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'AskBiz Server',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
const authRoutes = require('./src/routes/authRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const knowledgeRoutes = require('./src/routes/knowledgeRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/chatbots', '/chatbots'], chatbotRoutes);
app.use(['/api/knowledge', '/knowledge'], knowledgeRoutes);
app.use(['/api/chat', '/chat'], chatRoutes);

// Catch-all 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[AskBiz Server] Listening on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
