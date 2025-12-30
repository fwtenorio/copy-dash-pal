import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const PROXY_JS = path.join(DIST_DIR, "proxy-index.js");
const PROXY_CSS = path.join(DIST_DIR, "proxy-index.css");

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  return fs
    .readFile(envPath, "utf-8")
    .then((raw) => {
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .forEach((line) => {
          const idx = line.indexOf("=");
          if (idx === -1) return;
          const key = line.slice(0, idx).trim();
          let value = line.slice(idx + 1).trim();
          // Remove aspas se o usuário definiu SUPABASE_URL="..."
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        });
    })
    .catch(() => {
      // Silencia se .env não existir; confiar em variáveis já exportadas
    });
}

function ensureEnv(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  }
  return val;
}

async function uploadFile(client, localPath, storagePath, contentType) {
  const data = await fs.readFile(localPath);
  const { error } = await client.storage
    .from("assets")
    .upload(storagePath, data, { contentType, upsert: true });
  if (error) {
    throw new Error(`Falha ao fazer upload de ${storagePath}: ${error.message}`);
  }
}

async function main() {
  console.log("Carregando variáveis de ambiente...");
  await loadDotEnv();

  const SUPABASE_URL = ensureEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = ensureEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log("Limpando dist e buildando o proxy com cache forçado...");
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  execSync("npm run build:proxy", { cwd: ROOT, stdio: "inherit" });

  console.log("Lendo assets do proxy...");
  const jsPath = PROXY_JS;
  const cssPath = PROXY_CSS;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Enviando proxy-index.js para storage (bucket assets/proxy)...");
  await uploadFile(supabase, jsPath, "proxy/proxy-index.js", "application/javascript");

  console.log("Enviando proxy-index.css para storage (bucket assets/proxy)...");
  await uploadFile(supabase, cssPath, "proxy/proxy-index.css", "text/css");

  if (process.argv.includes("--deploy-function")) {
    console.log("Deploy da função app-proxy-render...");
    execSync("supabase functions deploy app-proxy-render", { cwd: ROOT, stdio: "inherit" });
  } else {
    console.log("Pulei deploy da função (use --deploy-function para habilitar).");
  }

  console.log(
    `Deploy do proxy finalizado. Arquivos finais em: ${PROXY_JS} e ${PROXY_CSS}`,
  );
}

main().catch((err) => {
  console.error("Erro no deploy do proxy:", err.message);
  process.exit(1);
});
