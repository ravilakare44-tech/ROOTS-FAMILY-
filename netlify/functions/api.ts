import serverless from 'serverless-http';
import { createApiApp } from '../../src/server/createApp.ts';

const { app } = createApiApp({ serverless: true });

export const handler = serverless(app);
