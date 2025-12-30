#!/usr/bin/env node

/**
 * Script para atualizar shopify_store_name na tabela clients
 * 
 * Uso:
 *   node scripts/update-shopify-store-name.mjs
 *   node scripts/update-shopify-store-name.mjs --shop big-store-575881.myshopify.com
 *   node scripts/update-shopify-store-name.mjs --client-id abc-123 --shop big-store.myshopify.com
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import readline from "readline";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Função auxiliar para fazer perguntas no terminal
function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Parse argumentos da linha de comando
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--shop" && args[i + 1]) {
      parsed.shop = args[i + 1];
      i++;
    } else if (args[i] === "--client-id" && args[i + 1]) {
      parsed.clientId = args[i + 1];
      i++;
    }
  }

  return parsed;
}

async function main() {
  console.log("🔧 Atualizar shopify_store_name na tabela clients");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const args = parseArgs();

  // ═══════════════════════════════════════════════════════════════════════════════
  // PASSO 1: Listar clientes existentes
  // ═══════════════════════════════════════════════════════════════════════════════

  console.log("📋 PASSO 1: Listando clientes...\n");

  const { data: clients, error: listError } = await supabase
    .from("clients")
    .select("id, shopify_store_name, nome_empresa, brand_color, logo_url")
    .order("created_at", { ascending: false })
    .limit(10);

  if (listError) {
    console.error("❌ Erro ao listar clientes:", listError.message);
    process.exit(1);
  }

  if (!clients || clients.length === 0) {
    console.log("⚠️  Nenhum cliente encontrado na tabela clients");
    process.exit(0);
  }

  console.log("Clientes encontrados:\n");
  console.table(
    clients.map((c, i) => ({
      "#": i + 1,
      ID: c.id.substring(0, 8) + "...",
      "Shop Name": c.shopify_store_name || "(não definido)",
      "Nome Empresa": c.nome_empresa || "(não definido)",
      "Brand Color": c.brand_color || "❌",
      "Logo": c.logo_url ? "✅" : "❌",
    }))
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // PASSO 2: Selecionar cliente
  // ═══════════════════════════════════════════════════════════════════════════════

  console.log("\n📋 PASSO 2: Selecionar cliente\n");

  let selectedClient = null;

  if (args.clientId) {
    // Client ID fornecido via argumento
    selectedClient = clients.find((c) => c.id === args.clientId);
    if (!selectedClient) {
      console.error(`❌ Cliente com ID '${args.clientId}' não encontrado`);
      process.exit(1);
    }
    console.log(`✅ Cliente selecionado (via --client-id):`);
  } else {
    // Perguntar ao usuário
    const clientNumber = await question("Digite o número do cliente (#) que deseja atualizar: ");
    const index = parseInt(clientNumber) - 1;

    if (isNaN(index) || index < 0 || index >= clients.length) {
      console.error("❌ Número inválido");
      process.exit(1);
    }

    selectedClient = clients[index];
    console.log("\n✅ Cliente selecionado:");
  }

  console.log(`   ID: ${selectedClient.id}`);
  console.log(`   Shop atual: ${selectedClient.shopify_store_name || "(não definido)"}`);
  console.log(`   Nome: ${selectedClient.nome_empresa || "(não definido)"}\n`);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PASSO 3: Novo shopify_store_name
  // ═══════════════════════════════════════════════════════════════════════════════

  console.log("📋 PASSO 3: Novo shopify_store_name\n");

  let newShopName = args.shop;

  if (!newShopName) {
    newShopName = await question(
      "Digite o novo shopify_store_name (ex: big-store-575881.myshopify.com): "
    );
  }

  newShopName = newShopName.trim();

  if (!newShopName) {
    console.error("❌ Shop name não pode estar vazio");
    process.exit(1);
  }

  // Validação básica
  if (!newShopName.includes("myshopify.com") && !newShopName.includes(".")) {
    console.log(`\n⚠️  O shop name fornecido não contém '.myshopify.com'`);
    const addDomain = await question(`   Adicionar '.myshopify.com'? (s/n): `);
    if (addDomain.toLowerCase() === "s" || addDomain.toLowerCase() === "y") {
      newShopName = `${newShopName}.myshopify.com`;
    }
  }

  console.log(`\n✅ Novo shop name: ${newShopName}`);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PASSO 4: Confirmar e atualizar
  // ═══════════════════════════════════════════════════════════════════════════════

  console.log("\n📋 PASSO 4: Confirmar atualização\n");

  console.log("Resumo da atualização:");
  console.log(`   Cliente: ${selectedClient.nome_empresa || selectedClient.id}`);
  console.log(`   Shop atual: ${selectedClient.shopify_store_name || "(não definido)"}`);
  console.log(`   Shop novo: ${newShopName}`);
  console.log("");

  const confirm = await question("Confirma a atualização? (s/n): ");

  if (confirm.toLowerCase() !== "s" && confirm.toLowerCase() !== "y") {
    console.log("❌ Atualização cancelada");
    process.exit(0);
  }

  console.log("\n⏳ Atualizando...\n");

  const { data: updated, error: updateError } = await supabase
    .from("clients")
    .update({ shopify_store_name: newShopName })
    .eq("id", selectedClient.id)
    .select("id, shopify_store_name, nome_empresa");

  if (updateError) {
    console.error("❌ Erro ao atualizar:", updateError.message);
    process.exit(1);
  }

  console.log("✅ Atualização concluída com sucesso!\n");
  console.log("Dados atualizados:");
  console.table(updated);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PASSO 5: Testar
  // ═══════════════════════════════════════════════════════════════════════════════

  console.log("\n📋 PASSO 5: Testar\n");
  console.log("Execute o diagnóstico para verificar:");
  console.log(`   bash scripts/diagnose-branding-issue.sh ${newShopName}\n`);
  console.log("Ou teste diretamente no navegador:");
  console.log(`   https://${newShopName}/apps/resolution\n`);
}

main().catch((error) => {
  console.error("❌ Erro:", error.message);
  process.exit(1);
});
