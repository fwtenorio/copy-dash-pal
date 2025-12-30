import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");

// Mapeamento de extensões para content types
const CONTENT_TYPES = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

// Função recursiva para listar todos os arquivos
async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Recursivamente busca arquivos em subdiretórios
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      files.push({
        localPath: fullPath,
        relativePath: relativePath.replace(/\\/g, "/"), // Normaliza para Unix path
      });
    }
  }

  return files;
}

function ensureEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      [
        `Missing environment variable: ${key}`,
        "Create a .env file in the project root with:",
        "SUPABASE_URL=your-url",
        "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key",
      ].join("\n"),
    );
  }
  return value;
}

async function uploadFile(client, localPath, remotePath, contentType, useTimestamp = false) {
  const fileName = path.basename(localPath);
  console.log(`🚀 Enviando ${fileName}...`);
  
  const data = await fs.readFile(localPath);
  
  // Se useTimestamp, adiciona timestamp ao nome do arquivo
  let finalRemotePath = remotePath;
  if (useTimestamp) {
    const ext = path.extname(remotePath);
    const base = path.basename(remotePath, ext);
    const dir = path.dirname(remotePath);
    const timestamp = Date.now();
    finalRemotePath = `${dir}/${base}-${timestamp}${ext}`;
    console.log(`📌 Versão com timestamp: ${finalRemotePath}`);
  }
  
  // Garantir que contentType está explícito no objeto de opções
  // cacheControl: "0" = sem cache, sempre busca versão mais recente
  // upsert: true = sobrescreve arquivo existente
  const uploadOptions = {
    contentType: contentType,
    cacheControl: "no-cache, no-store, must-revalidate",
    upsert: true,
  };
  
  const { error } = await client.storage.from("assets").upload(finalRemotePath, data, uploadOptions);
  
  if (error) {
    throw new Error(`Falha ao enviar ${finalRemotePath}: ${error.message}`);
  }
  
  console.log(`✅ ${fileName} enviado com sucesso!`);
  if (useTimestamp) {
    console.log(`   URL: ${client.storage.from("assets").getPublicUrl(finalRemotePath).data.publicUrl}`);
  }
  
  return finalRemotePath;
}

async function main() {
  const SUPABASE_URL = ensureEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = ensureEnv("SUPABASE_SERVICE_ROLE_KEY");
  
  // Verifica se deve usar timestamp (--timestamp ou -t)
  const useTimestamp = process.argv.includes("--timestamp") || process.argv.includes("-t");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // LIMPA a pasta dist antes de fazer upload para evitar arquivos antigos
  console.log("🧹 Limpando arquivos antigos do Supabase Storage...");
  try {
    // Lista arquivos existentes no bucket proxy/
    const { data: existingFiles, error: listError } = await supabase.storage
      .from("assets")
      .list("proxy", { limit: 1000 });
    
    if (!listError && existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(file => `proxy/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from("assets")
        .remove(filesToDelete);
      
      if (deleteError) {
        console.warn("⚠️  Aviso: Não foi possível limpar arquivos antigos:", deleteError.message);
      } else {
        console.log(`✅ ${existingFiles.length} arquivo(s) antigo(s) removido(s) do Storage`);
      }
    }
  } catch (error) {
    console.warn("⚠️  Aviso ao limpar arquivos antigos:", error.message);
  }

  // Verifica se a pasta dist existe
  try {
    await fs.access(DIST_DIR);
  } catch (error) {
    throw new Error(`Pasta dist não encontrada. Execute 'npm run build:proxy' primeiro.`);
  }

  console.log("📁 Escaneando arquivos em dist/...");
  
  // Busca todos os arquivos recursivamente
  const allFiles = await getAllFiles(DIST_DIR);
  
  // Filtra apenas arquivos relevantes (JS, CSS, imagens, fonts)
  const relevantExtensions = [".js", ".mjs", ".css", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".woff", ".woff2", ".ttf"];
  const filesToUpload = allFiles.filter(file => {
    const ext = path.extname(file.localPath).toLowerCase();
    return relevantExtensions.includes(ext);
  });

  console.log(`📦 Encontrados ${filesToUpload.length} arquivos para upload\n`);

  const uploadedFiles = [];
  
  for (const file of filesToUpload) {
    try {
      // Determina o caminho remoto mantendo a estrutura de pastas
      const remotePath = `proxy/${file.relativePath}`;
      const contentType = getContentType(file.localPath);
      
      const finalPath = await uploadFile(
        supabase,
        file.localPath,
        remotePath,
        contentType,
        useTimestamp
      );
      
      uploadedFiles.push({ 
        name: file.relativePath, 
        path: finalPath,
        contentType 
      });
    } catch (error) {
      console.error(`❌ Erro ao enviar ${file.relativePath}:`, error.message);
      // Continua com os outros arquivos mesmo se um falhar
    }
  }
  
  console.log(`\n✅ Upload concluído: ${uploadedFiles.length}/${filesToUpload.length} arquivos enviados`);
  
  // Mostra as URLs públicas dos arquivos principais
  const mainFiles = uploadedFiles.filter(f => 
    f.name === "proxy-index.js" || f.name === "proxy-index.css"
  );
  
  if (mainFiles.length > 0) {
    console.log("\n🔗 URLs públicas dos arquivos principais:");
    mainFiles.forEach(f => {
      const publicUrl = supabase.storage.from("assets").getPublicUrl(f.path).data.publicUrl;
      console.log(`   ${f.name}: ${publicUrl}`);
    });
  }
  
  if (useTimestamp) {
    console.log("\n📋 Arquivos versionados enviados:");
    uploadedFiles.forEach(f => {
      const publicUrl = supabase.storage.from("assets").getPublicUrl(f.path).data.publicUrl;
      console.log(`   ${f.name}: ${publicUrl}`);
    });
    console.log("\n⚠️  Atualize os links na função app-proxy-render para usar as novas URLs!");
  } else {
    console.log("\n✅ URLs devem corresponder a:");
    console.log(`   CSS: ${supabase.storage.from("assets").getPublicUrl("proxy/proxy-index.css").data.publicUrl}`);
    console.log(`   JS: ${supabase.storage.from("assets").getPublicUrl("proxy/proxy-index.js").data.publicUrl}`);
  }
}

main().catch((err) => {
  console.error("Erro no upload para Supabase:", err.message);
  process.exit(1);
});
