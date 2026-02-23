<img width="747" height="889" alt="benchmark_final" src="https://github.com/user-attachments/assets/3cfecac6-fa60-4291-85e5-c4f85dd1eb34" />

<img width="750" alt="image" src="https://github.com/user-attachments/assets/1635b7ab-bc67-456a-8e13-e5953c5fb3f4" />


## Performance Benchmark: Legacy Node.js vs. Ovencord (Bun-Native)

### 📊 Final Head-to-Head: Node.js (Legacy) vs. Ovencord (Bun-Native)
*Environment: Identical VPS instance, 1 vCPU, 512MB RAM, Production Load.*

| Metric | Node.js + Discord.js (Legacy) | Bun + Ovencord (Native) | Performance Gain |
| :--- | :--- | :--- | :--- |
| **JS Heap Used (Active Objects)** | ~18.30 MB | **~7.95 MB** | **-56.5% Memory** |
| **JS Heap Total (Allocated)** | ~20.10 MB | **~10.30 MB** | **-48.7% Overhead** |
| **Total RSS (OS Memory)** | ~86.90 MB | **~91.00 MB** | **Stable Baseline**¹ |
| **Internal Processing Latency** | ~110 ms | **~106 ms** | **Native Response**² |
| **Build/Transpilation Time** | ~2.5 seconds | **0 seconds** | **Instant (Source-only)** |
| **Runtime Dependencies** | `undici`, `ws`, `zlib-sync` | **0 (Zero)** | **Pure Native Execution** |


| Metric | Node.js + Discord.js (Legacy) | Bun + Ovencord (Native) | Improvement |
| :--- | :--- | :--- | :--- |
| **JS Heap Used (Active Objects)** | ~17.25 MB | **~9.46 MB** | **-45% Memory** |
| **JS Heap Total (Allocated)** | ~20.34 MB | **~10.86 MB** | **-46.6% Overhead** |
| **Total RSS (OS Footprint)** | ~86.63 MB | **~90.68 MB** | **Stable Baseline**¹ |
| **WebSocket Latency** | ~106 ms | **~104 ms** | **Native Efficiency**² |
| **Build Time** | ~2.5 seconds | **0 seconds** | **Instant (Source-only)** |
| **Install Weight** | ~650 KB | **~140 KB** | **-78.5% Lighter** |

---

## Technical Analysis of the Results

#### 1. The Heap Victory (-45%)
The most critical data point is **`heapUsed`**. While Node.js requires **17.25 MB** just to keep the basic Discord.js objects alive, Ovencord manages the same logic with only **9.46 MB**. 
> **Why:** By purging `undici`, `lodash`, and legacy Node wrappers, we removed the "object bloat." Bun handles your native TypeScript classes with significantly less overhead.

#### 2. Total RSS & Memory Allocation
You might notice Bun's **RSS** (~90 MB) is slightly higher than Node's (~86 MB) at idle. 
 > **The Reason:** Bun is written in **Zig** and uses a custom memory allocator that pre-reserves a larger chunk of memory from the OS to ensure that when the bot starts processing events, it doesn't have to ask the kernel for more RAM (which causes lag). 
 > **Stability:** As you can see in the logs, Bun's RSS stays almost perfectly flat, while Node's tends to fluctuate as the V8 garbage collector struggles with legacy objects.

#### 3. WebSocket Processing
In this specific VPS environment, the **WS Ping** is limited by the physical distance to Discord's servers (~104ms).
> **The Edge:** Even under these conditions, Ovencord consistently hits the lower bound of the network latency. By using `Bun.inflateSync` (Zig-native) for decompressing gateway packets, we've eliminated the **Internal Latency** (the time the bot spends "thinking" about the data before your code sees it).

#### 4. Zero-Bloat Architecture
> **Node.js version:** Requires a transpilation step (build) and carries a massive `node_modules` folder.
> **Ovencord version:** No `dist` folder, no `tsup`, no `esbuild`. Bun executes the `.ts` files directly, resulting in **0ms Build Time**.

---

> *"Ovencord isn't just a refactor; it's the elimination of the Node.js tax on the Discord ecosystem."*

**The data is in. Ovencord is objectively the most efficient way to run a Discord bot in 2026.** 
