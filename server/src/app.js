import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Routes
import fhirRoutes from './routes/fhir.js';
import terminologyRoutes from './routes/terminology.js';
import translationRoutes from './routes/translation.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import patientsRoutes from './routes/patients.js';
import diagnosisRoutes from './routes/diagnosis.js';
import apiClientsRoutes from './routes/apiClients.js';
import fhirRoutesV1 from './routes/fhirRoutes.js';
import fhirTerminologyRoutes from './routes/fhirTerminology.js';

// Services / utils
import { csvMappingService } from './services/csvMappingService.js';
import { logger } from './utils/logger.js';

dotenv.config();

export function createApp() {
  const app = express();

  // Security / performance middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['*']
      : ['http://localhost:4028', 'http://localhost:3000'],
    credentials: true
  }));

  // Rate limit
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, try later.' }
  });
  app.use('/api/', limiter);

  // Logging
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

  // Body parsing
  app.use(express.json({ limit: '10mb', type: ['application/json', 'application/fhir+json'] }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV });
  });

  // API Mounts
  app.use('/fhir', fhirRoutes);
  app.use('/api/v1/terminology', terminologyRoutes);
  app.use('/api/v1/translation', translationRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/patients', patientsRoutes);
  app.use('/api/v1/diagnosis-sessions', diagnosisRoutes);
  app.use('/api/v1/api-clients', apiClientsRoutes);
  app.use('/api/v1/fhir', fhirRoutesV1);
  app.use('/fhir', fhirTerminologyRoutes);

  // Root
  app.get('/', (req, res) => {
    res.json({
      message: 'MediSync Terminology Service API',
      version: '1.0.0'
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
  });

  // 404
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
  });

  // Post-init (non-blocking) load mappings
  csvMappingService.loadMappings().catch(err => logger.error('Mapping load failed:', err));

  return app;
}

export default createApp();