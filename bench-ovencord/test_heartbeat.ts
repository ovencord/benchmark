import { Client, GatewayIntentBits } from '@ovencord/discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('clientReady', () => {
  console.log('Ready!');
  setInterval(() => {
    console.log('ws.ping:', client.ws.ping);
    console.log('client.ping:', client.ping);
    console.log('pings size:', client.pings.size);
  }, 2000);
});

client.ws.on('heartbeat', (data, shardId) => {
  console.log('HEARTBEAT EVENT RECEIVED!', data, shardId);
});

client.login(process.env.DISCORD_TOKEN);
