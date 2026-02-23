#!/usr/bin/env node
// analyze.js — Legge i log JSON dei due bot e produce un report comparativo
// Uso: node analyze.js bench-native.log bench-legacy.log

const fs = require('fs');

const [,, nativeLog, legacyLog] = process.argv;
if (!nativeLog || !legacyLog) {
  console.error('Usage: node analyze.js <native.log> <legacy.log>');
  process.exit(1);
}

function parseLog(file) {
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

function analyze(entries, label) {
  const metrics     = entries.filter(e => e.type === 'metric');
  const startup     = entries.find(e => e.type === 'startup');
  const latencies   = entries.filter(e => e.type === 'interaction').map(e => e.duration_us);
  const throughputs = entries.filter(e => e.type === 'throughput');
  const floods      = entries.filter(e => e.type === 'flood_sim');

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const sorted = [...latencies].sort((a, b) => a - b);
  const p = pct => sorted.length ? sorted[Math.floor(sorted.length * pct / 100)] : null;

  const heapUsedAvg = avg(metrics.map(m => m.heapUsed));
  const rssAvg      = avg(metrics.map(m => m.rss));
  const wsPingAvg   = avg(metrics.filter(m => m.wsPing > 0).map(m => m.wsPing));
  const lastThroughput = throughputs[throughputs.length - 1];
  const lastFlood      = floods[floods.length - 1];

  return {
    label,
    startup_ms:       startup?.startupMs ?? 'N/A',
    heap_used_avg_mb: heapUsedAvg ? (heapUsedAvg / 1024 / 1024).toFixed(2) : 'N/A',
    rss_avg_mb:       rssAvg ? (rssAvg / 1024 / 1024).toFixed(2) : 'N/A',
    ws_ping_avg_ms:   wsPingAvg ? wsPingAvg.toFixed(1) : 'N/A',
    latency_samples:  latencies.length,
    p50_us:           p(50)?.toFixed(0) ?? 'N/A',
    p95_us:           p(95)?.toFixed(0) ?? 'N/A',
    p99_us:           p(99)?.toFixed(0) ?? 'N/A',
    throughput_eps:   lastThroughput?.eventsPerSec ?? 'N/A',
    flood_ms:         lastFlood?.elapsedMs ?? 'N/A',
    flood_eps:        lastFlood?.eventsPerSec ?? 'N/A',
    flood_heap_kb:    lastFlood?.heapDeltaKb ?? 'N/A',
  };
}

const native = analyze(parseLog(nativeLog), 'Native (ovencord)');
const legacy = analyze(parseLog(legacyLog), 'Legacy (discord.js)');

const col = (s, w) => String(s).padEnd(w);
const row = (k, a, b) => `  ${col(k, 30)} ${col(a, 20)} ${col(b, 20)}`;

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║           BENCHMARK REPORT — Native vs Legacy           ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log(row('Metric', native.label, legacy.label));
console.log('  ' + '─'.repeat(68));
console.log(row('Startup time (ms)',          native.startup_ms,       legacy.startup_ms));
console.log(row('Heap used avg (MB)',          native.heap_used_avg_mb, legacy.heap_used_avg_mb));
console.log(row('RSS avg (MB)',                native.rss_avg_mb,       legacy.rss_avg_mb));
console.log(row('WS Ping avg (ms)',            native.ws_ping_avg_ms,   legacy.ws_ping_avg_ms));
console.log(row('Cmd latency p50 (μs)',        native.p50_us,           legacy.p50_us));
console.log(row('Cmd latency p95 (μs)',        native.p95_us,           legacy.p95_us));
console.log(row('Cmd latency p99 (μs)',        native.p99_us,           legacy.p99_us));
console.log(row('Throughput (events/sec)',     native.throughput_eps,   legacy.throughput_eps));
console.log(row('Flood sim (ms / 1000 evt)',   native.flood_ms,         legacy.flood_ms));
console.log(row('Flood throughput (evt/sec)',  native.flood_eps,        legacy.flood_eps));
console.log(row('Flood heap delta (KB)',       native.flood_heap_kb,    legacy.flood_heap_kb));
console.log();

// Emette anche JSON per poter generare grafici
const output = { native, legacy, generated_at: new Date().toISOString() };
fs.writeFileSync('benchmark-results.json', JSON.stringify(output, null, 2));
console.log('  → benchmark-results.json written\n');
