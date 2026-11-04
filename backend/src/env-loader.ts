import * as fs from 'node:fs';
import * as path from 'node:path';

// Cargar .env de backend o de la raíz antes de que Prisma inicialice
const candidateEnvs = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of candidateEnvs) {
  if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === 'function') {
    try {
      (process as any).loadEnvFile(envPath);
      break;
    } catch {
      // Continuar con el siguiente candidato
    }
  }
}
