
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://dkp_user:dkp_password@localhost:5432/dkp_db'
});

async function main() {
    try {
        const res = await pool.query('SELECT file_url FROM research_outputs LIMIT 10');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

main();
