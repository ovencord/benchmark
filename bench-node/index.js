import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { hrtime } from 'process';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Resource monitoring
setInterval(() => {
    const memory = process.memoryUsage();
    console.log(JSON.stringify({
        type: 'metric',
        timestamp: Date.now(),
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        wsPing: client.ws.ping
    }));
}, 5000);

client.on('ready', () => {
    console.log(`Bot A (Legacy) logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bench-ping') {
        const start = hrtime.bigint();
        
        await interaction.reply({ content: 'Pong!', ephemeral: true });
        
        const end = hrtime.bigint();
        const duration = Number(end - start) / 1000; // Nanoseconds to microseconds
        
        console.log(JSON.stringify({
            type: 'interaction',
            command: 'bench-ping',
            duration_us: duration,
            timestamp: Date.now()
        }));
    }
});

client.login(process.env.DISCORD_TOKEN);
