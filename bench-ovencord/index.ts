import { Client, GatewayIntentBits } from '@ovencord/discord.js';

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
        wsPing: (client.ws as any).ping ?? (client.ws as any).shards?.first()?.ping ?? -1
    }));
}, 5000);

client.on('ready', () => {
    console.log(`Bot B (Native) logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', async (interaction: any) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bench-ping') {
        const start = Bun.nanoseconds();
        
        await interaction.reply({ content: 'Pong!', ephemeral: true });
        
        const end = Bun.nanoseconds();
        const duration = (end - start) / 1000; // Nanoseconds to microseconds
        
        console.log(JSON.stringify({
            type: 'interaction',
            command: 'bench-ping',
            duration_us: duration,
            timestamp: Date.now()
        }));
    }
});

client.login(process.env.DISCORD_TOKEN);
