import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkFiles() {
  console.log("🔍 Verificando arquivos do proxy no Supabase Storage...\n");

  const files = ["proxy/proxy-index.js", "proxy/proxy-index.css"];

  for (const filePath of files) {
    try {
      // Obtém informações do arquivo
      const { data, error } = await supabase.storage
        .from("assets")
        .list("proxy", {
          search: filePath.split("/").pop(),
        });

      if (error) {
        console.error(`❌ Erro ao verificar ${filePath}:`, error.message);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`⚠️  ${filePath} não encontrado no Storage`);
        continue;
      }

      const file = data[0];
      const publicUrl = supabase.storage.from("assets").getPublicUrl(filePath).data.publicUrl;

      console.log(`📄 ${filePath}:`);
      console.log(`   Tamanho: ${(file.metadata?.size || 0 / 1024).toFixed(2)} KB`);
      console.log(`   Última modificação: ${file.updated_at || file.created_at || "N/A"}`);
      console.log(`   URL pública: ${publicUrl}`);
      console.log("");
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    }
  }

  // Verifica se os arquivos locais existem
  console.log("📁 Verificando arquivos locais em dist/...\n");
  const fs = await import("fs/promises");
  const path = await import("path");
  const { fileURLToPath } = await import("url");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const ROOT = path.resolve(__dirname, "..");
  const DIST_DIR = path.join(ROOT, "dist");

  const localFiles = ["proxy-index.js", "proxy-index.css"];

  for (const fileName of localFiles) {
    const localPath = path.join(DIST_DIR, fileName);
    try {
      const stats = await fs.stat(localPath);
      console.log(`📄 ${fileName}:`);
      console.log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Última modificação: ${stats.mtime.toISOString()}`);
      console.log("");
    } catch (error) {
      console.log(`⚠️  ${fileName} não encontrado localmente em dist/`);
      console.log(`   Execute 'npm run build:proxy' primeiro\n`);
    }
  }

  console.log("💡 Dica: Se os arquivos no Storage estão desatualizados:");
  console.log("   1. Execute: npm run deploy:proxy");
  console.log("   2. Aguarde alguns segundos");
  console.log("   3. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)");
  console.log("   4. Teste novamente em /apps/resolution");
}

checkFiles().catch(console.error);


