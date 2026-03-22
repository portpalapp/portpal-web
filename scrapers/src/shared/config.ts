import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from scrapers root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));
export const LOG_FILE = path.join(DATA_DIR, 'scraper.log');

export const BCMEA_BASE_URL = process.env.BCMEA_BASE_URL || 'https://mybcmea.bcmea.com';

export const ACCOUNT_BOARD = {
  id: process.env.BCMEA_ACCOUNT_BOARD_ID || '48064',
  password: process.env.BCMEA_ACCOUNT_BOARD_PASSWORD || 'lampoon91',
};

export const ACCOUNT_WORKINFO = {
  id: process.env.BCMEA_ACCOUNT_WORKINFO_ID || '39955',
  password: process.env.BCMEA_ACCOUNT_WORKINFO_PASSWORD || 'c340g1',
};

export const FORCE_RUN = !!process.env.PORTPAL_FORCE_RUN;

// Supabase (for pushing scraped data to the app database)
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
