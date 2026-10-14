import express from 'express';
import cors from 'cors';
import { env, cloudinaryEnabled } from './config/env.js';
import { connectDb } from './config/db.js';
import { api } from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

app.set('trust proxy', 1);
app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients, configured origins, and Vercel preview deployments.
      if (!origin || env.clientUrls.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
        return cb(null, true);
      }
      cb(null, false);
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

app.use('/api', api);
app.use(notFound);
app.use(errorHandler);

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}/api`);
      console.log(`Image storage: ${cloudinaryEnabled ? 'Cloudinary' : 'MongoDB (fallback)'}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
