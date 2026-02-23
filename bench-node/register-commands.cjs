// register-commands.js
// Esegui una volta sola: node register-commands.js
// Richiede: DISCORD_TOKEN e CLIENT_ID nel .env

require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'bench-ping',
    description: 'Misura la latency di risposta al comando (p50/p95/p99)',
  },
  {
    name: 'bench-flood',
    description: 'Simula l\'elaborazione di 1000 eventi gateway e misura throughput + heap delta',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Done.');
  } catch (err) {
    console.error(err);
  }
})();
