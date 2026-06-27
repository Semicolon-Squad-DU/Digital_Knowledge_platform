
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";

const s3Client = new S3Client({
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'dkp_minio_user',
        secretAccessKey: 'dkp_minio_password',
    },
    forcePathStyle: true,
});

async function main() {
    const command = new GetObjectCommand({
        Bucket: 'dkp-files',
        Key: 'research/test.pdf',
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    fs.writeFileSync('tmp/url.txt', url);
}

main();
