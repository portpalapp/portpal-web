import * as fs from 'fs';
import * as path from 'path';
import { LOG_FILE } from './config';

// Logger utility - supports both string and no arguments
export function makeLogger(name: string) {
  return (...args: any[]) => {
    let message: string;
    if (args.length === 0) {
      message = `[${name}] operation completed`;
    } else if (typeof args[0] === 'string') {
      message = args[0];
    } else {
      message = String(args[0]);
    }
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${name}] ${message}`;
    
    // Log to console
    console.log(logMessage);
    
    // Log to file (ensure directory exists)
    try {
      const logDir = path.dirname(LOG_FILE);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(LOG_FILE, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  };
}

// Date formatting utility (Vancouver timezone)
export function localDateStr(date: Date): string {
  // Convert to Vancouver timezone (PT/PDT)
  const vancouverDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Vancouver' }));
  const year = vancouverDate.getFullYear();
  const month = String(vancouverDate.getMonth() + 1).padStart(2, '0');
  const day = String(vancouverDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Random delay utility
export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Sleep utility
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Local timestamp utility
export function localStamp(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleString('en-US', { timeZone: 'America/Vancouver' }).replace(/[^\w]/g, '-');
}

// HTTP utilities
export async function httpGet(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

// File download utility
export async function downloadFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  const fs = await import('fs');
  const path = await import('path');
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, Buffer.from(buffer));
}

// Retry utility
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}