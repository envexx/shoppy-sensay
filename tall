warning: in the working copy of 'src/server/index.ts', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/src/server/index.ts b/src/server/index.ts[m
[1mindex b96f948..4cc6a20 100644[m
[1m--- a/src/server/index.ts[m
[1m+++ b/src/server/index.ts[m
[36m@@ -7,7 +7,7 @@[m [mimport { prisma } from './database';[m
 dotenv.config();[m
 [m
 const app = express();[m
[31m-const PORT = process.env.PORT || 3001;[m
[32m+[m[32mconst PORT = parseInt(process.env.PORT || '3001', 10);[m
 [m
 // Middleware[m
 app.use(cors({[m
[36m@@ -101,7 +101,7 @@[m [masync function startServer() {[m
   try {[m
     await connectDatabase();[m
     [m
[31m-    app.listen(PORT, '0.0.0.0', () => {[m
[32m+[m[32m    app.listen(Number(PORT), '0.0.0.0', () => {[m
       console.log(`🚀 Shoppy Sensay API Server running on port ${PORT}`);[m
       console.log(`📱 API Base URL: http://localhost:${PORT}/api`);[m
       console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);[m
