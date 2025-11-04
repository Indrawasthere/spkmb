import { spawn } from "child_process";
import ngrok from "@ngrok/ngrok";
import open from "open";
import chalk from "chalk";

// 💡 Konfigurasi dasar
const FRONTEND_PORT = 5173;
const BACKEND_PORT = 3001;

// Jalankan backend & frontend secara paralel
console.log(chalk.cyan("🚀 Starting SIP-KPBJ demo environment...\n"));

// Start Backend (ts-node)
const backend = spawn("npm", ["run", "server"], { stdio: "pipe", shell: true });

// Start Frontend (Vite)
const frontend = spawn("npm", ["run", "dev"], { stdio: "pipe", shell: true });

// Forward logs biar tetap tampil di terminal
backend.stdout.on("data", (data) => process.stdout.write(chalk.blue("[Backend] ") + data.toString()));
backend.stderr.on("data", (data) => process.stderr.write(chalk.red("[Backend Error] ") + data.toString()));

frontend.stdout.on("data", (data) => process.stdout.write(chalk.green("[Frontend] ") + data.toString()));
frontend.stderr.on("data", (data) => process.stderr.write(chalk.red("[Frontend Error] ") + data.toString()));

// Fungsi buat mulai ngrok setelah Vite siap
async function startNgrok() {
  console.log(chalk.cyan("\n🌍 Starting ngrok tunnel for frontend..."));

  try {
    // Pastikan lo udah login ke ngrok dulu sebelumnya: `ngrok config add-authtoken <token>`
    const listener = await ngrok.connect({
      addr: FRONTEND_PORT,
      authtoken: process.env.NGROK_AUTHTOKEN || "2bx4IXw1K7q2agtUJhevH2EiLHz_6T2Wmbp7AxQQyw5x7VgG",
    });

    const publicUrl = listener.url();
    console.log(chalk.green(`✅ Ngrok public URL detected: ${publicUrl}`));

    // Auto buka browser ke URL demo
    await open(publicUrl);

    console.log(chalk.yellow("\n✨ Everything is ready!"));
    console.log(chalk.bold(`➡️  Share this link with your client: ${publicUrl}\n`));
  } catch (error) {
    console.error(chalk.red("❌ Failed to start ngrok tunnel:"), error);
  }
}

// Delay biar Vite sempat siap dulu
setTimeout(startNgrok, 3000);
