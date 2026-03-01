require('dotenv').config();
const { Client, GatewayIntentBits, Partials, AttachmentBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const CANAL_ID = "1477447506089607248";

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CANAL_ID) return;

  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();

    if (!attachment.name.endsWith(".mp3")) {
      return message.reply("❌ Solo se permiten archivos MP3.");
    }

    try {
      await message.reply("⏳ Subiendo archivo...");

      const response = await axios.get(attachment.url, {
        responseType: 'arraybuffer'
      });

      const file = new AttachmentBuilder(response.data, {
        name: attachment.name
      });

      await message.channel.send({
        content: "✅ Aquí está tu archivo:",
        files: [file]
      });

    } catch (error) {
      console.error(error);
      await message.reply("❌ Error al subir el archivo.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);