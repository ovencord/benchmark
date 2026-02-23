import { Client, GatewayIntentBits } from '@ovencord/discord.js';

// ── Startup time ──────────────────────────────────────────────
const BOOT_AT = Date.now();

// ── Metrics store ─────────────────────────────────────────────
const commandLatencies: number[] = [];
let eventCount = 0;
let floodStart: number | null = null;

// ── Client ────────────────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// ── Resource monitoring (ogni 5s) ─────────────────────────────
setInterval(() => {
  const memory = process.memoryUsage();
  console.log(JSON.stringify({
    type: 'metric',
    timestamp: Date.now(),
    rss: memory.rss,
    heapTotal: memory.heapTotal,
    heapUsed: memory.heapUsed,
    wsPing: (client.ws as any).ping ?? (client.ws as any).shards?.first()?.ping ?? -1,
    eventCount,
  }));
}, 5000);

// ── Ready ─────────────────────────────────────────────────────
client.on('clientReady', () => {
  const startupMs = Date.now() - BOOT_AT;
  console.log(JSON.stringify({
    type: 'startup',
    startupMs,
    tag: client.user?.tag,
    bot: 'native',
  }));
});

// ── Message flood counter (throughput) ────────────────────────
client.on('messageCreate', () => {
  eventCount++;
  if (!floodStart) floodStart = Date.now();

  // Log throughput ogni 500 eventi
  if (eventCount % 500 === 0) {
    const elapsed = (Date.now() - floodStart) / 1000;
    console.log(JSON.stringify({
      type: 'throughput',
      bot: 'native',
      events: eventCount,
      elapsedSec: elapsed,
      eventsPerSec: (eventCount / elapsed).toFixed(2),
      timestamp: Date.now(),
    }));
  }
});

// ── Command: bench-ping (latency distribution) ────────────────
client.on('interactionCreate', async (interaction: any) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'bench-ping') {
    const start = Bun.nanoseconds();
    await interaction.reply({ content: 'Pong!', ephemeral: true });
    const durationUs = (Bun.nanoseconds() - start) / 1000;

    commandLatencies.push(durationUs);

    // Calcola percentili ogni 10 campioni
    if (commandLatencies.length % 10 === 0) {
      const sorted = [...commandLatencies].sort((a, b) => a - b);
      const p = (pct: number) => sorted[Math.floor(sorted.length * pct / 100)];
      console.log(JSON.stringify({
        type: 'latency_distribution',
        bot: 'native',
        samples: sorted.length,
        p50_us: p(50).toFixed(0),
        p95_us: p(95).toFixed(0),
        p99_us: p(99).toFixed(0),
        timestamp: Date.now(),
      }));
    }

    // Log singolo campione sempre
    console.log(JSON.stringify({
      type: 'interaction',
      bot: 'native',
      command: 'bench-ping',
      duration_us: durationUs,
      timestamp: Date.now(),
    }));
  }

  // ── Command: bench-flood (simula elaborazione di N eventi) ───
  if (interaction.commandName === 'bench-flood') {
    const N = 1000;
    const memBefore = process.memoryUsage().heapUsed;
    const t0 = Date.now();

    // Simula parsing di N payload gateway-like
    const results = [];
    for (let i = 0; i < N; i++) {
      results.push({
        id: `${i}`,
        content: `message ${i}`,
        author: { id: '123', username: 'user' },
        timestamp: new Date().toISOString(),
      });
    }

    const elapsed = Date.now() - t0;
    const memAfter = process.memoryUsage().heapUsed;

    console.log(JSON.stringify({
      type: 'flood_sim',
      bot: 'native',
      events: N,
      elapsedMs: elapsed,
      eventsPerSec: (N / (elapsed / 1000)).toFixed(0),
      heapDeltaKb: ((memAfter - memBefore) / 1024).toFixed(1),
      timestamp: Date.now(),
    }));

    await interaction.reply({
      content: `Processed ${N} events in ${elapsed}ms`,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
