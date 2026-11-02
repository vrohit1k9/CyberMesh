require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { initDatabase, getActiveEngine } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'] : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter (protects server resources)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use('/api', apiLimiter);

// Health & Telemetry Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      engine: getActiveEngine(),
      version: '1.0.0',
      service: 'CyberMesh API Gateway'
    }
  });
});

// Placeholder for router mounts (will mount in upcoming phases)
const authRoutes = require('./routes/auth.routes');
const complaintRoutes = require('./routes/complaint.routes');
const caseRoutes = require('./routes/case.routes');
const networkRoutes = require('./routes/network.routes');
const riskRoutes = require('./routes/risk.routes');
const aiRoutes = require('./routes/ai.routes');
const transactionRoutes = require('./routes/transaction.routes');
const auditRoutes = require('./routes/audit.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/cases', networkRoutes); // Mounts /api/cases/:id/network
app.use('/api/cases', riskRoutes);    // Mounts /api/cases/:id/risk, /api/cases/:id/recalculate-risk
app.use('/api/ai', aiRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Static frontend serving if built
const candidateDistPaths = [
  path.join(__dirname, '..', '..', 'frontend', 'dist'),
  path.join(__dirname, '..', 'frontend', 'dist'),
  path.join(process.cwd(), 'frontend', 'dist'),
  path.join(process.cwd(), '..', 'frontend', 'dist')
];
const frontendDist = candidateDistPaths.find(p => fs.existsSync(p));

if (frontendDist) {
  console.log(`[CyberMesh Server] Serving static frontend from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  console.warn('[CyberMesh Server] Warning: Frontend build dist not found. Static frontend serving disabled.');
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'CyberMesh API Gateway is running. Frontend build not detected in dist directory.',
      apiDocumentation: '/api/health'
    });
  });
}

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Resource not found: ${req.method} ${req.originalUrl}`
    }
  });
});

// Centralized Error Handling Middleware (Section 29 Contract)
app.use((err, req, res, next) => {
  console.error(`[Unhandled Error]`, err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' && status === 500
        ? 'An internal server error occurred' 
        : err.message || 'Unknown server error'
    }
  });
});

// Server Initialization
let server;
async function startServer() {
  try {
    await initDatabase();
    server = app.listen(PORT, () => {
      console.log(`[CyberMesh Server] API Gateway online on port ${PORT}`);
      console.log(`[CyberMesh Server] Database Engine: ${getActiveEngine()}`);
    });
    return server;
  } catch (error) {
    console.error('Failed to initialize server or database:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.TEST_MODE) {
  startServer();
}

module.exports = { app, startServer };
