const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

// When connecting to Supabase pooler on Render, SSL is strictly required.
// pg.Pool does not use SSL by default unless sslmode=require is in the URL.
// We explicitly enable it here to prevent ECONNREFUSED / ECONNRESET errors.
const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
