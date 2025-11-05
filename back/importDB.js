// back/importDB.js
import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.base' });


async function main() {
    try {
        const sql = fs.readFileSync('./mcdonalds_bbdd.sql', 'utf8');
        const conn = await mysql.createConnection({
            host: process.env.DB_PUBLIC_HOST || process.env.DB_HOST || process.env.MYSQLHOST || 'shinkansen.proxy.rlwy.net',
            port: process.env.DB_PUBLIC_PORT || process.env.DB_PORT || process.env.MYSQLPORT || 20865,
            user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
            password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'cCXzjyvaZgCzQAieqPYHYxgfPRPSBhgN',
            database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway',
            multipleStatements: true
        });

        console.log('Conectando a la DB pública...');
        await conn.query(sql);
        console.log('🎉 Importación finalizada.');
        await conn.end();
    } catch (err) {
        console.error('Error importando:', err);
        process.exit(1);
    }
}

main();
