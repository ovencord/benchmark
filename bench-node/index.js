import { Client, GatewayIntentBits } from 'discord.js';

// ── Startup time ──────────────────────────────────────────────
const BOOT_AT = Date.now();

// ── Metrics store ─────────────────────────────────────────────
const commandLatencies = [];
let eventCount = 0;
let floodStart = null;

// ── Client ────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
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
    wsPing: client.ws.ping,
    eventCount,
  }));
}, 5000);

// ── Ready ─────────────────────────────────────────────────────
client.on('ready', () => {
  const startupMs = Date.now() - BOOT_AT;
  console.log(JSON.stringify({
    type: 'startup',
    startupMs,
    tag: client.user?.tag,
    bot: 'legacy',
  }));
});

// ── Message flood counter (throughput) ────────────────────────
client.on('messageCreate', () => {
  eventCount++;
  if (!floodStart) floodStart = Date.now();

  if (eventCount % 500 === 0) {
    const elapsed = (Date.now() - floodStart) / 1000;
    console.log(JSON.stringify({
      type: 'throughput',
      bot: 'legacy',
      events: eventCount,
      elapsedSec: elapsed,
      eventsPerSec: (eventCount / elapsed).toFixed(2),
      timestamp: Date.now(),
    }));
  }
});

// ── Command: bench-ping ───────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'bench-ping') {
    const start = process.hrtime.bigint();
    await interaction.reply({ content: 'Pong!', ephemeral: true });
    const durationUs = Number(process.hrtime.bigint() - start) / 1000;

    commandLatencies.push(durationUs);

    if (commandLatencies.length % 10 === 0) {
      const sorted = [...commandLatencies].sort((a, b) => a - b);
      const p = (pct) => sorted[Math.floor(sorted.length * pct / 100)];
      console.log(JSON.stringify({
        type: 'latency_distribution',
        bot: 'legacy',
        samples: sorted.length,
        p50_us: p(50).toFixed(0),
        p95_us: p(95).toFixed(0),
        p99_us: p(99).toFixed(0),
        timestamp: Date.now(),
      }));
    }

    console.log(JSON.stringify({
      type: 'interaction',
      bot: 'legacy',
      command: 'bench-ping',
      duration_us: durationUs,
      timestamp: Date.now(),
    }));
  }

  // ── Command: bench-flood ──────────────────────────────────────
  if (interaction.commandName === 'bench-flood') {
    const N = 1000;
    const memBefore = process.memoryUsage().heapUsed;
    const t0 = Date.now();

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
      bot: 'legacy',
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
