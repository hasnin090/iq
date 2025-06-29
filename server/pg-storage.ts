import { MemStorage } from './storage';

// Temporary implementation using MemStorage as base to fix deployment
export class PgStorage extends MemStorage {
  constructor() {
    super();
    console.log('Using MemStorage implementation for PgStorage temporarily');
  }
}

export const pgStorage = new PgStorage();