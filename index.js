require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { Octokit } = require("@octokit/rest");
const axios = require("axios");
const http = require("http");

// Servidor pequeño para que Render no lo duerma
http.createServer((req, res) => {
  res.write("Bot activo");
  res.end();
}).listen(3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const ALLOWED_CHANNEL = "1477447506089607248";

// Set para evitar procesar el mismo mensaje dos veces
const processedMessages = new Set();

client.once("ready", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;
  if (message.attachments.size === 0) return;

  // Evitar duplicados
  if (processedMessages.has(message.id)) return;
  processedMessages.add(message.id);
  setTimeout(() => processedMessages.delete(message.id), 10000);

  const attachment = message.attachments.first();

  if (!attachment.name.toLowerCase().endsWith(".mp3")) {
    return message.reply("❌ Solo se permiten archivos MP3.");
  }

  try {
    await message.reply("⏳ Subiendo archivo...");

    const response = await axios.get(attachment.url, {
      responseType: "arraybuffer"
    });

    const content = Buffer.from(response.data).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: `audios/${attachment.name}`,
      message: `Subiendo ${attachment.name}`,
      content: content
    });

    const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/audios/${attachment.name}`;

    await message.reply(`✅ Subido correctamente!\n🔗 ${rawUrl}`);

  } catch (error) {
    console.error(error);
    message.reply("❌ Error al subir el archivo.");
  }
});

client.login(process.env.DISCORD_TOKEN);