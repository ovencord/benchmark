// register-commands.js
// Esegui una volta sola
// Richiede: DISCORD_TOKEN nel .env o esportato

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
    console.log('Fetching bot client id...');
    const user = await rest.get(Routes.user());
    console.log(`Registering slash commands for client ${user.id}...`);
    await rest.put(
      Routes.applicationCommands(user.id),
      { body: commands },
    );
    console.log('Done.');
  } catch (err) {
    console.error(err);
  }
})();
