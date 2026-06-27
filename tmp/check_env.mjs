
import dotenv from 'dotenv';
dotenv.config({ path: 'apps/backend/.env' });

console.log('S3_ENDPOINT:', process.env.S3_ENDPOINT);
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
console.log('S3_FORCE_PATH_STYLE:', process.env.S3_FORCE_PATH_STYLE);
process.exit();
