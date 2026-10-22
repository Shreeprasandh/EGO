# EGO: Master Production Blueprint & Engineering Architecture Specification
*Web-First 360° Infinite Kinetic Flight Simulator & Procedural Skimming Runner*

---

> **CONFIDENTIAL ARCHITECTURAL SPECIFICATION**  
> **Project Identifier**: `EGO`  
> **Lead Architect & Custodian**: Luna (AI Executive Assistant to Sir)  
> **Platform Target**: Web-First (Vite + Three.js r160+ + TypeScript), Desktop via Tauri v2, Mobile (PWA/Touch)  
> **Target Refresh Rates**: 60 Hz baseline, 120 Hz ProMotion / High-Refresh Native  
> **Status**: Production-Approved (The Five Monks Council Verdict: `PROCEED`, Risk: 3/10, Upside: 9.5/10)  

---

## Table of Contents
1. [Section 1: Executive Summary & Game Philosophy](#section-1-executive-summary--game-philosophy)
2. [Section 2: Complete Game Design Document (GDD)](#section-2-complete-game-design-document-gdd)
3. [Section 3: World Architecture & Procedural Generation](#section-3-world-architecture--procedural-generation)
4. [Section 4: Physics Engine — Full Mathematical Specification](#section-4-physics-engine--full-mathematical-specification)
5. [Section 5: Rendering Architecture & Shader Specifications](#section-5-rendering-architecture--shader-specifications)
6. [Section 6: Celestial Engine & Dynamic Lighting](#section-6-celestial-engine--dynamic-lighting)
7. [Section 7: Audio Architecture — Procedural Web Audio Engine](#section-7-audio-architecture--procedural-web-audio-engine)
8. [Section 8: Input Architecture — All Platforms](#section-8-input-architecture--all-platforms)
9. [Section 9: Camera System — Full Specification](#section-9-camera-system--full-specification)
10. [Section 10: HUD & UI Design — Complete Specification](#section-10-hud--ui-design--complete-specification)
11. [Section 11: Authentication & User System](#section-11-authentication--user-system)
12. [Section 12: Complete Supabase Database Schema](#section-12-complete-supabase-database-schema)
13. [Section 13: Shop & Economy System — Balance Specification](#section-13-shop--economy-system--balance-specification)
14. [Section 14: Performance Budget & Optimization Strategy](#section-14-performance-budget--optimization-strategy)
15. [Section 15: Security & Anti-Cheat](#section-15-security--anti-cheat)
16. [Section 16: Complete Tech Stack & Project File Structure](#section-16-complete-tech-stack--project-file-structure)
17. [Section 17: Package.json Dependencies](#section-17-packagejson-dependencies)
18. [Section 18: Environment Variables](#section-18-environment-variables)
19. [Section 19: Asset Gap Analysis — What Sir Still Needs to Provide](#section-19-asset-gap-analysis--what-sir-still-needs-to-provide)
20. [Section 20: Phased Implementation Roadmap](#section-20-phased-implementation-roadmap)

---

# Section 1: Executive Summary & Game Philosophy

### 1.1 Full Vision Statement
**EGO** is a high-speed, 360-degree open-world kinetic skimming and flight experience engineered to eliminate artificial constraints—timers, fuel tanks, track boundaries, and forced forward rails—in favor of pure kinematic mastery.

The player pilots an ultra-sleek, ground-effect solar glider skimming precisely **0.5 meters** above an infinite, procedurally generated alien surface. The craft runs on perpetual solar and lunar resonance: the sun never sets to kill the pilot, and the world offers no finish line. The sole determinant of life or death is physical impact with the terrain and its ancient lithic obstacles. 

EGO captures the visceral trance of hyper-velocity flight: the razor-thin margin between godlike flow and catastrophic disintegration.

```
       +-------------------------------------------------------------+
       |                       THE SKY (Safe)                        |
       | Altitude: > 50m | EGO Mult: x1.0 | Speed: 30 m/s (Crawl)    |
       | Points: Stagnant | Audio: Muted Wind | Atmosphere: Boring   |
       +-------------------------------------------------------------+
                                      |
                     [GRAVITATIONAL & SCORE PRESSURE]
                                      v
       +-------------------------------------------------------------+
       |                 THE GROUND POCKET (Danger)                  |
       | Altitude: 0.5m | EGO Mult: x50.0 | Speed: 120 m/s (Hypersonic)|
       | Points: Millions/min | Audio: Roaring Engine | Near-Miss Sparks|
       +-------------------------------------------------------------+
```

### 1.2 The EGO Paradox: Infinite Life, Ego Kills You
In traditional endless runners (*Race the Sun*, *Temple Run*, *Subway Surfers*), the player dies because the environment or clock forces their demise (sunset, chasing monster, shrinking boundary). 

**In EGO, mortality is entirely self-inflicted.**
* The player is provided infinite life: fly 100 meters above the dunes and they can glide forever without crashing.
* However, high-altitude flight is penalized ruthlessly: velocity throttles to a crawl ($30\text{ m/s}$), the score multiplier drops to $1.0\times$, the audio pad thins to a faint hiss, and currency accumulation halts.
* To achieve legendary scores and unlock craft tiers, the pilot is psychologically enticed to dive back down into the jagged terrain pocket—skimming $0.5\text{ m}$ off dune ridges, carving through narrow slot canyons, and threading needle-eye monolith ruins.
* **The Paradox**: The player does not die because the game forced a mistake; they die because their own pride, greed, and audacity (*their EGO*) drove them to hug an obstacle too close at $120\text{ m/s}$.

### 1.3 Target Audience & Platforms
* **Audience**: High-reflex racing enthusiasts, speedrunners, procedural flight sim fans, and competitive arcade purists who appreciate flow-state mechanics (*Wipeout*, *F-Zero*, *Trackmania*, *Race the Sun*, *Exo One*).
* **Target Platforms**:
  1. **Web-First (Primary)**: Standard WebGL2/WebGPU browsers (Chrome, Edge, Safari, Firefox) on desktop and laptop hardware targeting 60fps to 120fps.
  2. **Desktop Native**: Tauri v2 desktop application bundling the Vite client into a featherweight (<15MB installer) native binary with low-latency Gamepad API and direct display synchronization.
  3. **Mobile Web & Native PWA**: Responsive touch controls, adaptive dynamic resolution scaling, and responsive UI layouts for iOS (Safari) and Android (Chrome).

### 1.4 What Makes EGO Different From Every Other Runner
| Feature | Traditional Runners | EGO |
| :--- | :--- | :--- |
| **Directional Freedom** | 1D forward rails or 3 fixed lanes | **True 360° Omnidirectional Freedom**: Fly North, South, East, or West at any yaw angle. |
| **Session Clock** | Sunset timer or chasing enemy countdown | **Zero Artificial Timers**: Day/Night cycle is perpetual, dynamic, and aesthetic. |
| **Flight Envelope** | Fixed elevation or arbitrary jumping | **Aerodynamic Ground Effect (Wieselsberger Model)**: Soft hover at 0.5m with parabolic crest launches off ramps and dunes. |
| **Risk/Reward Scaling** | Passive coin collection | **Dynamic Spatial Proximity Multiplier**: Multiplier scales exponentially with terrain and obstacle closeness ($1\times \to 50\times$). |
| **World Continuity** | Discrete repetitive levels | **Seamless Infinite Biome Streaming**: Multi-octave Simplex noise streaming via chunk rings with zero loading screens. |
| **Restart Friction** | Ads, menus, 5-second countdowns | **Sub-50ms Instant Rebirth**: One keypress or screen tap re-anchors the ship onto the dunes instantly. |

---

# Section 2: Complete Game Design Document (GDD)

### 2.1 Core Game Loop (Moment-to-Moment Gameplay)
```
                                 [LAUNCH / RESPAWN]
                                         |
                                         v
                         +-------------------------------+
                         |   Low-Altitude Cruise (0.5m)  |
                         | Forward Acceleration: 30->120 |
                         +-------------------------------+
                                         |
                     +-------------------+-------------------+
                     |                                       |
                     v                                       v
          [Encounter Obstacle]                     [Hit Terrain Ramp]
          - Steer Left/Right                       - Parabolic Launch
          - Near-Miss Grazing (<2m)                - Aerial Gliding
          - +Sparks / Multiplier Burst             - Wieselsberger Re-acquisition
                     |                                       |
                     +-------------------+-------------------+
                                         |
                                         v
                         +-------------------------------+
                         | Collect Solar Fragments (Orbs)|
                         | Activate Powers (1-5)         |
                         | Discover Biome Regions        |
                         +-------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                [Impact Obstacle]                  [Continue Flow State]
                       |                                   |
                 Shield Active?                            |
                /              \                           |
             YES                NO                         |
              |                  v                         |
       Absorb & Flash     [Catastrophic Crash]             |
              |           - Hull Disintegration            |
              +---------> - Score Finalization             |
                          - 50ms Rebirth Prompt <----------+
```

### 2.2 Session Flow
1. **Boot**: Loads lightweight assets (<15MB compressed), pre-allocates object pools, authenticates Supabase session (or creates Guest UUID).
2. **Main Menu**: Interactive 3D cinematic camera tracking the selected ship cruising through an endless loop of procedural dunes at twilight.
3. **Run Initiation**: Smooth camera blend (0.6s) behind the ship; instantaneous throttle engagement without countdown counters.
4. **Active Flight**: Continuous 60/120Hz physics simulation, procedural audio feedback, EGO multiplier scaling, near-miss spark generation, and region transitions.
5. **Crash Event**: Continuous swept-sphere collision detects impact; time scales to 20% slow motion; ship hull shatters into procedural geometric shards; camera pulls back with aerodynamic damping; score and telemetry signature finalize.
6. **Rebirth**: Pressing `Spacebar`, `Gamepad Cross/A`, or tapping the screen executes an instantaneous 50ms reset: pools reset, seed shifts or restarts, and the ship accelerates into the dunes.

### 2.3 The EGO Multiplier
The core scoring engine is driven by the dynamic **EGO Multiplier** ($M_{\text{EGO}} \in [1.0, 50.0]$).

#### Mathematical Formulation:
$$M_{\text{EGO}}(t) = \text{clamp}\left( M_{\text{altitude}}(h) \cdot M_{\text{proximity}}(d) \cdot M_{\text{speed}}(v) \cdot M_{\text{surge}}, \, 1.0, \, 50.0 \right)$$

1. **Altitude Component ($M_{\text{altitude}}$)**:
   $$M_{\text{altitude}}(h) = 1.0 + 49.0 \cdot \exp\left( -2.5 \cdot \max(0, h - h_{\text{target}}) \right)$$
   * At $h = h_{\text{target}} = 0.5\text{ m}$: $M_{\text{altitude}} = 50.0$.
   * At $h = 5.0\text{ m}$: $M_{\text{altitude}} = 1.0003 \approx 1.0$.
   * At $h \ge 50.0\text{ m}$: $M_{\text{altitude}} = 1.0$.

2. **Obstacle Proximity Component ($M_{\text{proximity}}$)**:
   $$M_{\text{proximity}}(d) = 1.0 + \sum_{i=1}^{N} \frac{k_{\text{prox}}}{(d_i + 0.1)^{1.5}}$$
   Where $d_i$ is the distance to obstacle $i$ within an 8-meter detection sphere, and $k_{\text{prox}} = 0.4$.

3. **Speed Ratio ($M_{\text{speed}}$)**:
   $$M_{\text{speed}}(v) = 0.5 + 0.5 \cdot \left( \frac{v - v_{\min}}{v_{\max} - v_{\min}} \right)$$

4. **Surge Modifier ($M_{\text{surge}}$)**:
   $$M_{\text{surge}} = \begin{cases} 2.0 & \text{if EGO Surge power active} \\ 1.0 & \text{otherwise} \end{cases}$$

#### Sensory Feedback:
* **Visual**: Hull aura shader shifts dynamically: Ice White ($1\times$) $\to$ Electric Cyan ($10\times$) $\to$ Saffron Gold ($25\times$) $\to$ Ultraviolet Violet ($40\times$) $\to$ Radiant Supernova Amber ($50\times$).
* **Audio**: Engine synthesizer harmonic stack un-mutes 3 additional upper sawtooth harmonics and pitch-bends up by 1.2 octaves as the multiplier climbs.

### 2.4 Scoring Formula (Option E Specification)
$$\text{Final Score} = \left( D \cdot k_1 \right) \cdot \overline{M}_{\text{EGO}} + \left( R \cdot k_2 \right) + \left( S_{\text{near}} \cdot k_3 \right) + \left( C_{\text{frag}} \cdot k_4 \right)$$

Where:
* $D$: Total cumulative distance traversed in world units (meters). Coefficient $k_1 = 0.1$.
* $\overline{M}_{\text{EGO}}$: Time-weighted arithmetic average EGO Multiplier across the entire duration of the run:
  $$\overline{M}_{\text{EGO}} = \frac{1}{T} \int_{0}^{T} M_{\text{EGO}}(t) \, dt$$
* $R$: Total unique biomes/regions discovered during the run. Coefficient $k_2 = 5000$.
* $S_{\text{near}}$: Total near-miss spark events triggered. Coefficient $k_3 = 250$.
* $C_{\text{frag}}$: Total Solar Fragments collected. Coefficient $k_4 = 1.0$.

### 2.5 Near-Miss Spark System
* **Detection Envelope**: An invisible concentric bounding sphere of radius $R_{\text{near}} = 2.0\text{ m}$ extending beyond the ship's physical collision hull ($R_{\text{hull}} = 1.2\text{ m}$).
* **Trigger Condition**: When an obstacle boundary penetrates $R_{\text{near}}$ while remaining strictly outside $R_{\text{hull}}$, a valid near-miss graze is evaluated.
* **Grace Window & Cooldown**: A grace window of $\Delta t_{\text{grace}} = 0.30\text{ s}$ prevents a single obstacle from re-triggering multiple near-miss events in consecutive frames.
* **Spark Count Formula**:
  $$N_{\text{sparks}} = \text{round}\left( 15 + 35 \cdot \left( 1.0 - \frac{d_{\min} - R_{\text{hull}}}{R_{\text{near}} - R_{\text{hull}}} \right) \right)$$
  Grazing an obstacle within $0.05\text{ m}$ spawns 50 GPU billboard spark particles emitting along the tangential impact normal.
* **Streak Counter**: Consecutive near-misses within $3.0\text{ s}$ increment a streak multiplier ($1\times \to 2\times \to 3\times \dots 10\times$), awarding exponential burst points and instant haptic rumble.

### 2.6 Region Discovery System
* The 360° terrain grid is partitioned into Voronoi macro-cells representing distinct ecological zones.
* **Boundary Triggers**: Invisible Voronoi partition crossings (spaced every $\approx 2500\text{ m}$) detect region transitions.
* **Cinematic Arrival**:
  * Screen-space letterboxing slides in (0.4s).
  * A minimalist, elegant typographic title card fades in center-screen:
    ```
    — OBSIDIAN FISSURE —
    Depth: -120m | Elevation Variance: Extreme
    ```
  * Awards $+5000$ flat score bonus ($R \cdot k_2$).
  * Triggers a resonant 4-note ascending brass chord via Web Audio.

### 2.7 Power System (5 Core Powers)
To prevent arcade clutter while ensuring deep tactical decision-making, EGO features exactly 5 balanced kinetic abilities:

```
+--------------------------------------------------------------------------------------------------+
| POWER              | DURATION | COOLDOWN | PICKUP BEHAVIOR      | VISUAL / AUDIO SIGNATURE       |
+--------------------+----------+----------+----------------------+--------------------------------+
| 1. Boost Burst     | 3.0s     | 12.0s    | Blue Plasma Orb      | Blue hyper-drive streak lines; |
|                    |          |          | Velocity = 1.8x base | Air-horn shockwave blast       |
+--------------------+----------+----------+----------------------+--------------------------------+
| 2. Ground Shatter  | 4.0s     | 15.0s    | Amber Geo Orb        | Shockwave ring around hull;    |
|                    |          |          | Destroys thin rocks  | Explosive seismic rock crack   |
+--------------------+----------+----------+----------------------+--------------------------------+
| 3. Time Warp       | 3.0s     | 20.0s    | Violet Chrono Orb    | World chromatic aberration;    |
|                    |          |          | World slows to 40%   | Pitch-bend audio down 50%      |
+--------------------+----------+----------+----------------------+--------------------------------+
| 4. Shield Bubble   | Until Hit| 25.0s    | Emerald Aegis Orb    | Iridescent hexagonal bubble;   |
|                    | (1 hit)  |          | Absorbs 1 crash      | Resonant glass bell ring       |
+--------------------+----------+----------+----------------------+--------------------------------+
| 5. EGO Surge       | 10.0s    | 30.0s    | Golden Solar Orb     | Radiant solar flare wings;     |
|                    |          |          | 2x EGO multiplier    | Harmonic choir crescendo       |
+--------------------+----------+----------+----------------------+--------------------------------+
```

* **Inventory Capacity**: The craft can store up to 3 power pickups in sequential queues.
* **Activation Rules**: Powered via `Spacebar`, `Gamepad Cross/A`, or Mobile Power Button. Powers do not stack identical types; activating a duplicate resets the active duration timer. Compatible powers (e.g., Boost Burst + Shield Bubble) execute concurrently.

### 2.8 Currency System (Solar Fragments)
* **Orb Placement**: Solar Fragments spawn in smooth bezier ribbons of 5 to 12 orbs floating $0.5\text{ m}$ to $2.0\text{ m}$ above dune crests, encouraging risk-taking lines.
* **Earn Rate Scaling**:
  * Tier 1 ($M_{\text{EGO}} \in [1, 10)$): 1 Fragment / second baseline.
  * Tier 2 ($M_{\text{EGO}} \in [10, 25)$): 3 Fragments / second.
  * Tier 3 ($M_{\text{EGO}} \in [25, 50)$): 8 Fragments / second.
  * Tier 4 ($M_{\text{EGO}} = 50$ Peak Flow): 20 Fragments / second.
* **Near-Miss Bonus**: Each near-miss spark streak deposits bonus fragments: $\text{Streak Count} \times 2$ Fragments.

### 2.9 Progression & Achievement System
* **Player XP**: Calculated at run termination:
  $$\text{XP Earned} = \frac{\text{Final Score}}{100} + \left( D \cdot 0.05 \right)$$
* **Player Levels (1 to 100)**: Exponential curve:
  $$\text{XP}_{\text{required}}(\text{Level}) = 1000 \cdot (\text{Level})^{1.65}$$
* **Core Achievement Tiers**:
  * `SKIMMER_NOVICE`: Survive 1000m without exceeding 2.0m altitude.
  * `APEX_AUDACITY`: Maintain $50.0\times$ EGO multiplier continuously for 30 seconds.
  * `CANYON_NEEDLE`: Thread 10 consecutive slot canyon arches at speeds $>100\text{ m/s}$.
  * `SOLAR_ASCENDANT`: Accumulate 10,000 Solar Fragments in a single unbroken flight.
  * `LUNAR_DRIFTER`: Complete 3 full Day/Night cycles (30 minutes) in a single run.

---

# Section 3: World Architecture & Procedural Generation

### 3.1 360° Infinite Open World Architecture Overview
Unlike constrained runners that generate terrain along a positive Z-axis strip, EGO uses an **omnidirectional chunk grid**. The player can orient their velocity vector $\vec{v}$ toward any heading angle $\theta \in [0, 2\pi)$. 

Terrain chunks stream dynamically centered around the player's world coordinate $(P_x, P_z)$.

```
   [-1, +1]      [ 0, +1]      [+1, +1]     Outer Cache Ring (LOD 2/3)
       +-------------+-------------+-------------+
       |             |             |             |
       | Chunk (x-1) | Chunk (x)   | Chunk (x+1) |
       | (z+1)       | (z+1)       | (z+1)       |
       +-------------+-------------+-------------+
   [-1,  0]      [ 0,  0]      [+1,  0]     Active 3x3 Simulation Ring (LOD 0/1)
       | Chunk (x-1) |   PLAYER    | Chunk (x+1) |
       | (z)         | (Active 0,0)| (z)         |
       +-------------+-------------+-------------+
   [-1, -1]      [ 0, -1]      [+1, -1]
       | Chunk (x-1) | Chunk (x)   | Chunk (x+1) |
       | (z-1)       | (z-1)       | (z-1)       |
       +-------------+-------------+-------------+
```

### 3.2 Chunk System & Streaming Metrics
* **Chunk Dimensions**: $256\text{ m} \times 256\text{ m}$ world units.
* **Active Simulation Ring**: $3 \times 3$ grid ($768\text{ m} \times 768\text{ m}$ footprint) with active collision BVH.
* **LOD Streaming Outer Ring**: $5 \times 5$ grid ($1280\text{ m} \times 1280\text{ m}$ footprint) loaded as visual terrain meshes.
* **LOD Tiers**:
  * **LOD 0 (0 – 128m)**: $128 \times 128$ vertex grid ($16,384$ quads, $32,768$ triangles). Full heightmap evaluation, micro-displacement, and dynamic grass instances.
  * **LOD 1 (128 – 256m)**: $64 \times 64$ vertex grid ($4,096$ quads, $8,192$ triangles). Full heightmap, simplified normal calculation.
  * **LOD 2 (256 – 512m)**: $32 \times 32$ vertex grid ($1,024$ quads, $2,048$ triangles). Low-frequency heightmap octaves only.
  * **LOD 3 (> 512m)**: $16 \times 16$ vertex grid ($256$ quads, $512$ triangles). Base macro-frequency noise only.

### 3.3 Terrain Heightmap Generation: Multi-Octave Simplex Noise
Terrain height $H(x, z)$ is computed deterministically via fractional Brownian motion (fBm) over Simplex noise functions parameterized by biome weightings:

$$H(x, z) = \sum_{b=1}^{3} W_b(x, z) \cdot H_b(x, z)$$

Where $W_b(x, z)$ is the normalized blend weight of Biome $b$ ($\sum W_b = 1.0$), and $H_b(x, z)$ is the biome's elevation function:

$$H_b(x, z) = A_0 + \sum_{k=0}^{O_b - 1} A_k \cdot \text{Simplex2D}\left( x \cdot f_k + \delta_{x,k}, \, z \cdot f_k + \delta_{z,k} \right)$$
With lacunarity $\lambda$ and persistence $\rho$:
$$f_k = f_0 \cdot \lambda^k, \quad A_k = A_0 \cdot \rho^k$$

#### Biome Parameter Table:
| Parameter | Biome 1: Saffron Ridges | Biome 2: Obsidian Fissure | Biome 3: Monolith Graveyard |
| :--- | :--- | :--- | :--- |
| **Octaves ($O_b$)** | 4 | 6 (Ridged Multifractal) | 5 |
| **Base Amplitude ($A_0$)** | $35.0\text{ m}$ | $140.0\text{ m}$ | $45.0\text{ m}$ |
| **Base Frequency ($f_0$)** | $0.0035$ (Wavelength $\approx 285\text{ m}$) | $0.006$ (Wavelength $\approx 166\text{ m}$) | $0.004$ (Wavelength $\approx 250\text{ m}$) |
| **Lacunarity ($\lambda$)** | $2.15$ | $2.05$ | $2.20$ |
| **Persistence ($\rho$)** | $0.38$ | $0.55$ | $0.42$ |
| **Terrain Profile** | Sweeping, wind-carved longitudinal dunes | Sheer vertical slot canyons ($|\nabla H| > 2.5$) | Terraced plateaus with crumbling lithic steps |

### 3.4 Biome Specifications

#### Biome 1: Saffron Ridges (Desert Dunes)
* **Elevation Range**: $+0\text{ m}$ to $+45\text{ m}$.
* **Wavelength**: $250\text{ m} – 400\text{ m}$ sinusoidal rolling swells with sharp leeward crests.
* **Palette**: Warm ochre (`#D9822B`), deep saffron (`#B85D19`), burnt amber shadows (`#381A08`).
* **Prop Density**: Sparse. Desert scrub (`grass1.glb`, `grass2.glb`) along valleys; dried deadwood (`brokenbranch1.glb`) clustered in depressions; smoothed boulders (`stone1.glb`, `stone4.glb`).
* **Atmosphere**: Low-altitude heat shimmer (thermal vertex displacement), warm golden fog ($\text{density} = 0.0012$).

#### Biome 2: Obsidian Fissure (Slot Canyons)
* **Elevation Range**: $-120\text{ m}$ canyon floor to $+60\text{ m}$ rim towers.
* **Slot Width**: $8\text{ m} – 25\text{ m}$ narrow flight corridors forcing precision rolls.
* **Canyon Wall Angle**: $75^\circ – 88^\circ$ sheer cliffs with jagged basalt columns.
* **Palette**: Volcanic obsidian (`#121317`), wet charcoal (`#22252C`), bioluminescent cyan veins (`#00F5D4`).
* **Prop Density**: High wall obstacles. Overhanging jagged basalt formations (`stone2.glb`, `stone5.glb`, `stone7.glb`), fallen monolithic pillars bridging canyon rims.

#### Biome 3: Monolith Graveyard (Ruins)
* **Elevation Range**: $+10\text{ m}$ to $+80\text{ m}$ stepped megaliths.
* **Architecture**: Massive cyclopean arches, shattered ring-gates (`ruin1.glb`), decaying stone pillars arranged in concentric astronomical circles.
* **Palette**: Weathered limestone gray (`#8A8D91`), pale sandstone (`#C2B69D`), shadowed slate (`#2A2D34`).
* **Prop Density**: Heavy architectural props (`ruin1.glb`, `stone3.glb`, `stone6.glb`, `tree1.glb`, `tree6.glb`). High risk of head-on collisions.

### 3.5 Biome Blending Algorithm
Macro-biome distribution is mapped via a low-frequency 2D Voronoi cellular diagram modulated by Simplex noise:
$$\text{Cell ID}(x, z) = \text{Voronoi}\left( \frac{x}{L_{\text{biome}}} + 0.1 \cdot \text{Noise}(x), \, \frac{z}{L_{\text{biome}}} + 0.1 \cdot \text{Noise}(z) \right)$$
Where $L_{\text{biome}} = 2500\text{ m}$. Across the boundary zone ($D_{\text{blend}} = 200\text{ m}$), the blend weight $W_b$ smoothly interpolates using the Hermite smoothstep function:
$$W_b = \text{smoothstep}\left( 0.0, 1.0, \frac{d - d_{\min}}{D_{\text{blend}}} \right)$$

### 3.6 Object Placement Algorithms (Poisson Disc Sampling)
Props are placed using **Bridson's Poisson Disc Sampling** algorithm extended to 2D terrain heightmaps:
* **Minimum Radius ($r_{\min}$)**:
  * Trees: $12.0\text{ m}$ clearance.
  * Large Rocks/Monoliths: $8.0\text{ m}$ clearance.
  * Grass / Shrub instances: $1.5\text{ m}$ clearance.
* **Flight Corridor Safety Guarantee**: To ensure every seed is flyable and eliminate unavoidable "wall of death" spawns, an algorithm applies a **Vector Safety Buffer**:
  * Any generated obstacle within $5.0\text{ m}$ of the direct forward corridor vector of a ramp or high-speed lane is culled or shifted laterally by $\pm 6.0\text{ m}$.

### 3.7 Ramp Placement & Aerial Ingestion
* **Guaranteed Frequency**: Exactly 1 kinetic ramp (`ramp1.glb`) placed every $800\text{ m} – 1200\text{ m}$ along procedural trajectory clusters.
* **Ramp Incline Angle**: $22.5^\circ$ to $35.0^\circ$ pitch upward.
* **Approach Buffer**: $40\text{ m}$ upstream flat clearance guaranteed by flattening local terrain vertices along the approach vector:
  $$H_{\text{approach}}(u, v) = \text{lerp}\left( H(u, v), \, H_{\text{ramp\_base}}, \, \text{smoothstep}(0, 40, u) \right)$$

### 3.8 Pond & Water Feature Placement
* The asset `environment/small pond with trees.glb` is placed within low-elevation biome depressions (local height minimums where $\nabla H \approx 0$ and $H < 5.0\text{ m}$).
* The terrain mesh is flattened to a planar water table shelf ($H_{\text{water}} = 2.0\text{ m}$) across a $45\text{ m}$ radius, seamlessly embedding the pond asset without geometry clipping.

### 3.9 Performance Budgets Per Chunk
* **Maximum Triangles**: $\le 35,000$ triangles per active LOD0 chunk (terrain mesh).
* **Maximum Draw Calls**: $\le 12$ draw calls per chunk (all grass, rocks, and trees batched via `THREE.InstancedMesh`).
* **Maximum Texture Footprint**: $\le 32\text{ MB}$ VRAM per chunk (shared global texture atlas for all prop instances).

---

# Section 4: Physics Engine — Full Mathematical Specification

### 4.1 Hover Height Control System (PID Flight Model)
The glider maintains its soft hover altitude $h_{\text{target}} = 0.5\text{ m}$ above the terrain surface using a continuous Proportional-Integral-Derivative (PID) altitude controller simulating the Wieselsberger aerodynamic ground effect.

```
       [Craft Origin (x, y, z)]
                 |
      +----------+----------+
      |  5-Point Terrain Ray Grid
      v          v          v
   Ray FL      Ray FR    Ray C (Center)    Ray RL      Ray RR
   (-0.8,+1.2) (+0.8,+1.2)   (0,0)         (-0.8,-1.2) (+0.8,-1.2)
      |          |          |                 |          |
      +----------+----------+-----------------+----------+
                            |
                 Weighted Average Ground Height:
             h_ground = 0.4*h_C + 0.15*(FL+FR+RL+RR)
                            |
                 Current Altitude: h = y - h_ground
                            |
                 PID Error: e(t) = h_target - h
                            |
       +--------------------+--------------------+
       |                                         |
       v                                         v
   [h <= 2.5m (Ground Effect)]            [h > 2.5m (Airborne Flight)]
   F_hover = Kp*e + Ki*∫e + Kd*(de/dt)    PID Disengaged;
   Add Ground Spring: F_wieselsberger     F_vertical = -m * g (9.81 m/s²)
```

#### PID Coefficients:
* **Proportional Gain ($K_p$)**: $150.0\text{ N/m}$
* **Integral Gain ($K_i$)**: $0.0\text{ N/(m}\cdot\text{s)}$ (avoid integral windup over undulating dunes)
* **Derivative Gain ($K_d$)**: $35.0\text{ N}\cdot\text{s/m}$ (critically damped oscillation prevention)

#### Mathematical Ground-Effect Spring Equation:
When $h \le b$ ($b = \text{wingspan} = 2.4\text{ m}$), ground-effect lift amplifies non-linearly:
$$F_{\text{ground\_effect}} = m \cdot g \cdot \left[ 1.0 + \frac{16 \cdot (h / b)^2}{1.0 + 16 \cdot (h / b)^2} \right]$$
Total vertical force applied to craft:
$$F_y = \begin{cases} 
F_{\text{hover}} + F_{\text{ground\_effect}} - m \cdot g & \text{if } h \le h_{\text{threshold}} \, (2.5\text{ m}) \\
-m \cdot g & \text{if } h > h_{\text{threshold}} \text{ (Airborne)}
\end{cases}$$

### 4.2 Forward Velocity Model
Forward velocity $v(t)$ accelerates toward an asymptotic terminal velocity modulated by ground proximity:
$$v_{\text{target}} = v_{\text{base}} + (v_{\max} - v_{\text{base}}) \cdot \left( \frac{M_{\text{EGO}} - 1.0}{49.0} \right)$$
* $v_{\text{base}} = 30.0\text{ m/s}$ ($108\text{ km/h}$)
* $v_{\max} = 120.0\text{ m/s}$ ($432\text{ km/h}$)
* Acceleration equation:
  $$\frac{dv}{dt} = a_{\text{engine}} \cdot \left( 1.0 - \frac{v}{v_{\text{target}}} \right) - C_d \cdot v^2$$
  Where $a_{\text{engine}} = 18.0\text{ m/s}^2$ and aerodynamic drag $C_d = 0.00085$.

### 4.3 Lateral Steering & Angular Velocity Model
* **Yaw Angular Acceleration**:
  $$\frac{d\omega_{\text{yaw}}}{dt} = \tau_{\text{steer}} \cdot I_{\text{yaw}}^{-1} \cdot u_{\text{steer}} - k_{\text{damp}} \cdot \omega_{\text{yaw}}$$
  Where $u_{\text{steer}} \in [-1.0, 1.0]$ is smoothed analog input, and steering torque scales inversely with velocity to prevent instantaneous oversteer at $120\text{ m/s}$:
  $$\tau_{\text{steer}}(v) = \tau_0 \cdot \sqrt{\frac{v_{\text{base}}}{v}}$$
* **Turn Radius ($R_{\text{turn}}$)**:
  $$R_{\text{turn}} = \frac{v}{\omega_{\text{yaw}}} \implies \begin{cases} 45.0\text{ m} & \text{at } 30\text{ m/s} \\ 180.0\text{ m} & \text{at } 120\text{ m/s} \end{cases}$$

### 4.4 Bank & Roll Physics
Visual roll is coupled directly to steering input with dynamic spring dampening:
$$\theta_{\text{roll\_target}} = \text{clamp}\left( -u_{\text{steer}} \cdot \theta_{\max}, \, -35.0^\circ, \, 35.0^\circ \right)$$
$$\frac{d^2\theta_{\text{roll}}}{dt^2} = -k_{\text{spring}} \cdot (\theta_{\text{roll}} - \theta_{\text{roll\_target}}) - c_{\text{damp}} \cdot \frac{d\theta_{\text{roll}}}{dt}$$
Where $k_{\text{spring}} = 45.0$ and $c_{\text{damp}} = 12.0$.

### 4.5 Ramp Launch Physics & Trajectory Integration
When encountering a ramp inclined at angle $\alpha_{\text{ramp}}$:
1. **Launch Velocity Vector**:
   $$\vec{v}_{\text{launch}} = v \cdot \begin{pmatrix} \cos \alpha_{\text{ramp}} \cdot \sin \theta_{\text{yaw}} \\ \sin \alpha_{\text{ramp}} \cdot 1.15 \\ \cos \alpha_{\text{ramp}} \cdot \cos \theta_{\text{yaw}} \end{pmatrix}$$
2. **Airborne State**: PID hover is disabled immediately upon vertical separation exceeding $h > 2.5\text{ m}$.
3. **Parabolic Trajectory Integration**:
   $$\vec{P}(t + \Delta t) = \vec{P}(t) + \vec{v}(t) \cdot \Delta t + \frac{1}{2} \vec{g} \cdot (\Delta t)^2$$
4. **Ground Re-acquisition**:
   When raycast distance to terrain falls below $h \le 2.5\text{ m}$ with negative vertical velocity ($v_y < 0$), the PID controller smoothly re-engages using a half-cosine blend over $0.25\text{ s}$ to absorb impact without bouncing or clipping.

### 4.6 Continuous Swept-Sphere Collision Detection
Discrete bounding box checks fail at $120\text{ m/s}$ because the craft travels $\Delta s = 120 \cdot 0.0083 = 1.0\text{ m}$ per frame, enabling it to tunnel through $0.5\text{ m}$ pillars.

EGO implements **Continuous Swept-Sphere Volume Traversal**:
```
Frame N: Sphere Center P_0 (Radius = 1.2m)
    +-------+
    |   o   |===========================> Sweep Capsule
    +-------+                             +-------+
                                          |   o   | Frame N+1: Sphere Center P_1
                                          +-------+
       \                                     /
        \--------- Obstacle Polygon --------/
               Collision Time: t_hit in [0, 1]
```
* **Capsule Definition**: Capsule with endpoints $P_0$ (start position) and $P_1 = P_0 + \vec{v} \cdot \Delta t$, with radius $R = 1.2\text{ m}$.
* **BVH Traversal**: The swept capsule is tested against the chunk's static obstacle AABB tree. If an intersection occurs at normalized parametric time $t_{\text{hit}} \in [0, 1]$:
  1. If **Shield Bubble** is active: Shield shatters, impulse rebounds craft along collision normal, game time pauses for $0.05\text{ s}$ (hit-stop), and run continues.
  2. If **Ground Shatter** is active and obstacle is classified `DESTRUCTIBLE_LITHIC`: Obstacle fractures into debris, and ship sustains forward velocity without damage.
  3. Otherwise: **Catastrophic Crash Triggered**.

### 4.7 Terrain Conformity (5-Ray Downward Pattern)
Five downward raycasts are evaluated every physics tick:
* $R_C$: Origin $(0, 0, 0)$ [Center]
* $R_{FL}$: Origin $(-0.8, 0, +1.2)$ [Forward Left Wingtip]
* $R_{FR}$: Origin $(+0.8, 0, +1.2)$ [Forward Right Wingtip]
* $R_{RL}$: Origin $(-0.8, 0, -1.2)$ [Rear Left Stabilizer]
* $R_{RR}$: Origin $(+0.8, 0, -1.2)$ [Rear Right Stabilizer]

The terrain normal $\vec{n}_{\text{terrain}}$ is derived from the cross product of surface tangent vectors:
$$\vec{u} = \vec{P}_{FR} - \vec{P}_{FL}, \quad \vec{w} = \vec{P}_{FC} - \vec{P}_{RC}$$
$$\vec{n}_{\text{terrain}} = \frac{\vec{u} \times \vec{w}}{\|\vec{u} \times \vec{w}\|}$$
The craft's orientation quaternion spherically interpolates (SLERP) toward $\vec{n}_{\text{terrain}}$ with damping constant $\alpha_{\text{terrain}} = 0.12$, causing the ship to gracefully bank into the contours of dunes and canyon walls.

---

# Section 5: Rendering Architecture & Shader Specifications

### 5.1 Three.js r160+ WebGL2 Pipeline Overview
* **Renderer**: `THREE.WebGLRenderer` configured with `powerPreference: "high-performance"`, `antialias: false` (FXAA handled in post-processing pass), `stencil: false`, `depth: true`.
* **Color Space**: `THREE.SRGBColorSpace` with linear tone mapping (`THREE.ACESFilmicToneMapping`, exposure: $1.15$).
* **Scene Graph Structure**:
```
Scene Root
 ├── Camera Rig (SpringArm -> PerspectiveCamera)
 ├── Dynamic DirectionalLight (Sun/Moon Shadow Caster)
 ├── Hemispherical Sky/Ground AmbientLight
 ├── StarField Particles (2000 Sprites)
 ├── Celestial Sun & Moon Discs
 ├── World Terrain Root
 │    ├── Chunk_LOD_Pool (9 active meshes)
 │    └── Instanced Prop Batches (InstancedMesh: Rocks, Trees, Grass)
 ├── Dynamic Entity Root
 │    ├── Player Craft Hierarchy (ship[N].glb + landing struts)
 │    ├── Wing Trail Ribbons (Dynamic BufferGeometry)
 │    ├── Near-Miss Spark Particle Pool (500 Instanced Quads)
 │    └── Solar Fragment Orbs (InstancedMesh)
 └── Screen-Space Post-Processing Pipeline
```

### 5.2 Custom GLSL Shaders

#### a. Terrain Surface PBR Shader (`terrain_frag.glsl`)
Blends sand and rock textures dynamically based on terrain normal slope angle and biome weights.

```glsl
precision highp float;

uniform sampler2D uSandAlbedo;
uniform sampler2D uSandNormal;
uniform sampler2D uRockAlbedo;
uniform sampler2D uRockNormal;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform float uBiomeIndex; // 0: Saffron, 1: Obsidian, 2: Monolith

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
    // 1. Slope determination: slope = 1.0 (flat), slope = 0.0 (vertical cliff)
    float slope = clamp(dot(normalize(vNormal), vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
    float rockBlend = smoothstep(0.70, 0.45, slope); // Sheer slopes turn to rock

    // 2. Texture Sampling with Triplanar Mapping coordinates
    vec2 triUv = vWorldPosition.xz * 0.05;
    vec4 sandColor = texture2D(uSandAlbedo, triUv);
    vec4 rockColor = texture2D(uRockAlbedo, triUv * 2.0);

    // 3. Biome Color Grading
    if (uBiomeIndex > 0.5 && uBiomeIndex < 1.5) {
        // Obsidian Fissure: Darken rock, introduce basalt specular
        rockColor.rgb *= vec3(0.25, 0.28, 0.35);
        sandColor.rgb *= vec3(0.40, 0.42, 0.48);
    }

    vec4 baseColor = mix(sandColor, rockColor, rockBlend);

    // 4. Directional Lighting with Half-Lambert diffuse
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDirection);
    float NdotL = max(0.0, dot(N, L) * 0.5 + 0.5); // Half-Lambert for soft dune lighting
    vec3 diffuse = baseColor.rgb * (uSunColor * NdotL + uAmbientColor);

    gl_FragColor = vec4(diffuse, 1.0);
}
```

#### b. Atmospheric Sky Shader (`sky_frag.glsl`)
Computes realistic Rayleigh and Mie atmospheric scattering approximations across the day/night cycle.

```glsl
precision highp float;

uniform vec3 uSunPosition;
uniform vec3 uMoonPosition;
uniform float uSunElevation; // Angle in radians
uniform vec3 uDayZenithColor;
uniform vec3 uDayHorizonColor;
uniform vec3 uNightZenithColor;
uniform vec3 uNightHorizonColor;

varying vec3 vWorldDirection;

void main() {
    vec3 dir = normalize(vWorldDirection);
    float heightFactor = clamp(dir.y, 0.0, 1.0);

    // Sun Mie Scattering Flare
    float cosThetaSun = max(0.0, dot(dir, normalize(uSunPosition)));
    float sunFlare = pow(cosThetaSun, 128.0) * 1.5;

    // Day/Night Atmospheric Transition Parameter
    float dayFactor = smoothstep(-0.15, 0.20, sin(uSunElevation));

    vec3 currentZenith = mix(uNightZenithColor, uDayZenithColor, dayFactor);
    vec3 currentHorizon = mix(uNightHorizonColor, uDayHorizonColor, dayFactor);

    vec3 skyColor = mix(currentHorizon, currentZenith, pow(heightFactor, 0.6));
    skyColor += vec3(1.0, 0.85, 0.5) * sunFlare * dayFactor;

    gl_FragColor = vec4(skyColor, 1.0);
}
```

#### c. God Rays / Crepuscular Light Shader (`godrays_post.glsl`)
Screen-space post-process performing radial decay blur centered on projected sun screen coordinates.

```glsl
precision highp float;

uniform sampler2D tDiffuse;
uniform vec2 uSunScreenPos;
uniform float uDensity;
uniform float uWeight;
uniform float uDecay;
uniform float uExposure;

varying vec2 vUv;

const int NUM_SAMPLES = 64;

void main() {
    vec2 deltaTextCoord = (vUv - uSunScreenPos);
    deltaTextCoord *= 1.0 / float(NUM_SAMPLES) * uDensity;

    vec2 coord = vUv;
    float illuminationDecay = 1.0;
    vec4 fragColor = vec4(0.0);

    for(int i = 0; i < NUM_SAMPLES; i++) {
        coord -= deltaTextCoord;
        vec4 sampleCol = texture2D(tDiffuse, coord);
        sampleCol *= illuminationDecay * uWeight;
        fragColor += sampleCol;
        illuminationDecay *= uDecay;
    }

    fragColor *= uExposure;
    vec4 original = texture2D(tDiffuse, vUv);
    gl_FragColor = original + fragColor;
}
```

#### d. Bioluminescent Canyon Vein Shader (`bioluminescent_vein.glsl`)
Night-only pulse shader applied to obsidian wall crevices using procedural 3D noise.

```glsl
precision highp float;

uniform float uTime;
uniform float uNightAlpha; // 1.0 at midnight, 0.0 at midday
uniform vec3 uVeinColor; // Neon cyan: vec3(0.0, 0.96, 0.83)

varying vec3 vWorldPosition;
varying vec3 vNormal;

// Simplex-style pseudo noise
float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
    if (uNightAlpha <= 0.01) discard;

    float pulse = sin(uTime * 2.5 + vWorldPosition.y * 0.1) * 0.5 + 0.5;
    float noiseVal = hash(floor(vWorldPosition * 0.25));

    // Veins trace narrow crevices where noise is concentrated
    float veinMask = smoothstep(0.75, 0.82, noiseVal);
    vec3 emission = uVeinColor * veinMask * (0.8 + 0.4 * pulse) * uNightAlpha * 3.0;

    gl_FragColor = vec4(emission, veinMask * uNightAlpha);
}
```

#### e. Speed Trail / Wing Ribbon Shader (`wing_ribbon.glsl`)
Ribbon geometry trailing wingtips with alpha decay and speed-based hue shifts.

```glsl
precision highp float;

uniform vec3 uColorHead;
uniform vec3 uColorTail;
uniform float uVelocityRatio; // 0.0 to 1.0

varying vec2 vUv; // x: 0 (head/wingtip) to 1 (tail), y: 0 to 1 across width

void main() {
    // Fade alpha along ribbon length
    float alpha = pow(1.0 - vUv.x, 1.8) * smoothstep(0.0, 0.15, vUv.x);
    // Taper edges across width
    alpha *= sin(vUv.y * 3.141592);

    vec3 trailColor = mix(uColorHead, uColorTail, vUv.x);
    // Overdrive brightness at high speed for post-processing bloom
    trailColor *= (1.0 + uVelocityRatio * 2.5);

    gl_FragColor = vec4(trailColor, alpha);
}
```

#### f. EGO Aura Shader (`ego_aura.glsl`)
Proximity-reactive hull Fresnel glow scaling with active EGO Multiplier.

```glsl
precision highp float;

uniform float uEgoMultiplier; // 1.0 to 50.0
uniform vec3 uViewPosition;

varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
    vec3 V = normalize(uViewPosition - vWorldPosition);
    vec3 N = normalize(vNormal);

    // Fresnel rim effect
    float fresnel = 1.0 - max(0.0, dot(N, V));
    fresnel = pow(fresnel, 3.0);

    float normEgo = clamp((uEgoMultiplier - 1.0) / 49.0, 0.0, 1.0);

    // Color gradient: Ice Blue (0.0) -> Gold (0.5) -> Violet/White Supernova (1.0)
    vec3 lowColor = vec3(0.2, 0.6, 1.0);
    vec3 midColor = vec3(1.0, 0.7, 0.1);
    vec3 highColor = vec3(0.9, 0.2, 1.0);

    vec3 auraColor = normEgo < 0.5 ? mix(lowColor, midColor, normEgo * 2.0) 
                                   : mix(midColor, highColor, (normEgo - 0.5) * 2.0);

    float intensity = fresnel * (normEgo * 2.5 + 0.2);
    gl_FragColor = vec4(auraColor * intensity, intensity);
}
```

### 5.3 Post-Processing Pipeline
Post-processing executes sequentially via `EffectComposer`:
1. **UnrealBloomPass**: `threshold: 0.85`, `strength: 1.25`, `radius: 0.4`. Creates intense glow on wing trails, near-miss sparks, and the EGO aura without washing out desert geometry.
2. **Speed-Scaled Chromatic Aberration Shader**: Radial dispersion shifts RGB color channels outward based on velocity:
   $$\delta_{\text{color}} = \left( \frac{v - v_{\text{base}}}{v_{\max} - v_{\text{base}}} \right)^2 \cdot 0.006$$
3. **VignettePass**: Subtle edge shading (`darkness: 0.95`, `offset: 1.1`) focusing vision along the high-speed forward horizon.
4. **FXAAPass**: Fast Approximate Anti-Aliasing pass smoothing jagged high-frequency dune geometry edges with sub-millisecond overhead.

### 5.4 GPU Instancing Strategy
All non-terrain static geometry is rendered using `THREE.InstancedMesh`:
* **Grass Patches**: 50,000 instances per active chunk mapped to a single draw call. Micro-sway animated in vertex shader using vertex displacement:
  $$x_{\text{offset}} = \sin(uTime \cdot 3.0 + \text{position.x} \cdot 0.5) \cdot 0.15 \cdot \text{uv.y}$$
* **Rocks & Megaliths**: 5,000 instances per chunk categorized into 3 size-tiered instanced batches.
* **Trees / Shrubbery**: 500 instances per chunk with instance matrix transforms uploaded to GPU once on chunk activation.

### 5.5 Cascaded Shadow Maps (CSM)
To render razor-sharp shadows directly beneath the craft at $0.5\text{ m}$ hover while maintaining distant dune ridgeline shadow silhouettes without VRAM blowup:
* **Cascade 0 (0 – 30m)**: $2048 \times 2048$ shadow resolution. Renders craft landing gear, wingtips, and micro-terrain shadows with PCF soft filtering.
* **Cascade 1 (30 – 150m)**: $2048 \times 2048$ shadow resolution. Renders nearby monoliths and rock arches.
* **Cascade 2 (150 – 500m)**: $1024 \times 1024$ shadow resolution. Renders sweeping canyon ridge horizons.

---

# Section 6: Celestial Engine & Dynamic Lighting

### 6.1 Sun & Moon Orbit Simulation
The celestial engine simulates perpetual orbital movement over a continuous 10-minute real-time day/night loop ($T_{\text{cycle}} = 600.0\text{ s}$):
$$\theta_{\text{celestial}}(t) = 2\pi \cdot \left( \frac{t \pmod{T_{\text{cycle}}}}{T_{\text{cycle}}} \right)$$

#### Vector Coordinates:
$$\vec{S}_{\text{sun}}(t) = \begin{pmatrix} \cos(\theta_{\text{celestial}}) \cdot \cos(25^\circ) \\ \sin(\theta_{\text{celestial}}) \\ \cos(\theta_{\text{celestial}}) \cdot \sin(25^\circ) \end{pmatrix}, \quad \vec{M}_{\text{moon}}(t) = -\vec{S}_{\text{sun}}(t)$$
Where $25^\circ$ is the solar axial tilt off-axis, ensuring shadows sweep diagonally across dune ridges rather than tracking a flat vertical trajectory.

```
       [MIDDAY] (Elevation = +90 deg, 5500K Sunlight, Crisp Vertical Shadows)
            \
             \
  [DAWN / DUSK] (Elevation = ~0 deg, 2700K Amber Golden Hour, Infinite Horizon Shadows)
       \       /
        \     /
         +---+  <--- HORIZON (Elevation = 0 deg)
        /     \
       /       \
  [MIDNIGHT] (Elevation = -90 deg, 4100K Silver Moonlight, Cyan Bioluminescence Active)
```

### 6.2 Dynamic Lighting & Color Temperature Interpolation
The main directional light dynamically interpolates color temperature and intensity across four keyframe phases:

| Phase | Elevation ($\phi$) | Directional Color (Hex) | Color Temp | Intensity | Ambient Light (Sky / Ground) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Midday** | $+30^\circ \to +90^\circ$ | `#FFF4E0` | 5500K | 2.8 lux | Sky: `#B8D5E5`, Ground: `#C49A6C` |
| **Golden Hour** | $+5^\circ \to +30^\circ$ | `#FF9E43` | 2700K | 3.6 lux | Sky: `#FFAA5A`, Ground: `#8A4A1C` |
| **Twilight** | $-5^\circ \to +5^\circ$ | `#9B4F96` | 3200K | 1.2 lux | Sky: `#4A2559`, Ground: `#2A1B30` |
| **Midnight** | $-90^\circ \to -5^\circ$ | `#6BB5FF` | 4100K (Moon) | 0.8 lux | Sky: `#0F1726`, Ground: `#080B12` |

### 6.3 Dynamic Subsystem Triggers
1. **Bioluminescence Activation**: When $\vec{S}_{\text{sun}} \cdot \hat{y} < 0.0$, the uniform `uNightAlpha` transitions from $0.0 \to 1.0$ via a $30\text{-second}$ smooth hermite curve, activating neon cyan canyon veins.
2. **Wing Trail Color Shift**: Solar phase emits golden-amber particles (`#FFB300`), which smoothly shift to radiant cyan-silver (`#00E5FF`) under lunar illumination.
3. **Star Field Visibility**: 2000 point sprites fade in when solar elevation drops below $-5^\circ$, reaching full brightness at $-15^\circ$.

---

# Section 7: Audio Architecture — Procedural Web Audio Engine

### 7.1 Master Audio Graph Structure
EGO generates 100% of its runtime soundscape procedurally using the native Web Audio API, eliminating massive static audio downloads while providing zero-latency parameter modulation.

```
 [Speed Parameter v]           [EGO Multiplier M]         [Near-Miss / Event Triggers]
          |                            |                               |
          v                            v                               v
 +------------------+         +------------------+           +-------------------+
 |  Sawtooth Engine |         | Ambient Pad Synths|          | Procedural SFX    |
 |  OscillatorNode  |         | 3x Detuned Sines  |          | Metallic Ping /   |
 |  (80Hz -> 200Hz) |         | (Reverb / LFO)   |          | Sub-Bass Thuds    |
 +------------------+         +------------------+           +-------------------+
          |                            |                               |
          v                            v                               v
 +------------------+         +------------------+           +-------------------+
 |  White Noise Gen |         | Dynamic Lowpass  |           | Spatial Panner    |
 |  Wind Roar Filter|         | Multiplier Filter|           | PannerNode (3D)   |
 +------------------+         +------------------+           +-------------------+
          \                            |                              /
           \                           |                             /
            +--------------------------+----------------------------+
                                       |
                                       v
                           +-----------------------+
                           | DynamicsCompressorNode|
                           | Threshold: -18dB      |
                           | Ratio: 4:1            |
                           +-----------------------+
                                       |
                                       v
                             +-------------------+
                             |  MasterGainNode   |
                             +-------------------+
                                       |
                                       v
                             +-------------------+
                             | AudioDestination  |
                             | (Hardware Output) |
                             +-------------------+
```

### 7.2 Procedural Audio Node Specifications

#### 1. Engine Hum (Sawtooth Frequency Modulation):
* **Source**: `OscillatorNode` with type `"sawtooth"`.
* **Frequency Transfer Function**:
  $$f_{\text{engine}}(v) = 80.0\text{ Hz} + \left( \frac{v - v_{\text{base}}}{v_{\max} - v_{\text{base}}} \right) \cdot 120.0\text{ Hz} \implies [80\text{ Hz} \to 200\text{ Hz}]$$
* **Distortion / WaveShaper**: Mild saturation curve giving the hover engine a physical, snarling aerodynamic bite.

#### 2. Atmospheric Wind Roar:
* **Source**: AudioBuffer containing $2.0\text{ s}$ of looping pseudo-random White Noise.
* **Filter**: `BiquadFilterNode` (`type: "bandpass"`, $Q = 2.0$).
* **Frequency Modulation**:
  $$f_{\text{wind}}(v) = 400.0\text{ Hz} + \left( \frac{v - v_{\text{base}}}{v_{\max} - v_{\text{base}}} \right)^2 \cdot 3600.0\text{ Hz} \implies [400\text{ Hz} \to 4000\text{ Hz}]$$
* **Gain**: Modulated by $v^2$ to create an overwhelming rush of air at $120\text{ m/s}$.

#### 3. Near-Miss Spark Sound:
* **Synthesis**: Dual high-frequency sine oscillators ($f_1 = 2000\text{ Hz}, f_2 = 3850\text{ Hz}$).
* **Envelope**: Attack $= 0.002\text{ s}$, Decay $= 0.078\text{ s}$ (total duration: $80\text{ ms}$) using `exponentialRampToValueAtTime`. Yields an electrifying, crisp metallic air-slice ping.

#### 4. Catastrophic Crash Impact:
* **Low-End Thud**: Sub-bass sine wave ($40\text{ Hz}$) decaying over $500\text{ ms}$.
* **High-End Shatter**: White noise burst passed through a high-pass filter ($3000\text{ Hz}$) decaying over $350\text{ ms}$.

#### 5. Currency Pickup Chime (Ascending Pentatonic):
* Ascending arpeggio ($C_5 = 523.25\text{ Hz}$, $E_5 = 659.25\text{ Hz}$, $G_5 = 783.99\text{ Hz}$). Three sine bursts sequenced $30\text{ ms}$ apart with $100\text{ ms}$ exponential decay.

#### 6. Power Activation Signatures:
* **Boost Burst**: Compressed air-horn blast combined with a pitch-rising square wave ($150\text{ Hz} \to 600\text{ Hz}$).
* **Ground Shatter**: Dual frequency sub-drop ($80\text{ Hz} \to 30\text{ Hz}$) layered with a granular crunch.
* **Time Warp**: Master audio playback rate ramps down to $40\%$ pitch using a lowpass cutoff drop to $600\text{ Hz}$.
* **Shield Bubble**: Resonant glass bell chime with long stereo chorus delay ($880\text{ Hz}$).
* **EGO Surge**: Lush harmonic major-ninth chord pad swelling over $1.5\text{ s}$.

#### 7. Adaptive Ambient Pad:
* Three detuned sine oscillators ($f = 110\text{ Hz}, 110.5\text{ Hz}, 164.8\text{ Hz}$) routed through a stereo feedback convolver reverb.
* As the EGO multiplier rises from $1\times \to 50\times$, a dynamic resonant filter opens from $400\text{ Hz} \to 8000\text{ Hz}$, transforming a faint background hum into an exhilarating sonic roar.

---

# Section 8: Input Architecture — All Platforms

### 8.1 Unified Input Matrix
EGO abstracts raw physical inputs into a unified `InputState` interface:

```typescript
export interface InputState {
  steer: number;        // Continuous analog [-1.0 (full left), +1.0 (full right)]
  throttle: number;     // Continuous [0.0 (idle), 1.0 (full thrust)]
  brake: number;        // Continuous [0.0 to 1.0]
  pitchLook: number;    // Look-around camera pitch [-1.0 to +1.0]
  yawLook: number;      // Look-around camera yaw [-1.0 to +1.0]
  activatePower: boolean; // True on leading-edge trigger
  toggleCamera: boolean;  // True on leading-edge trigger
  togglePause: boolean;   // True on leading-edge trigger
}
```

### 8.2 Input Filtering & Smoothing
To eliminate sharp keyboard transitions and provide weight to steering inputs, all analog axes pass through an **Exponential Moving Average (EMA)** filter:
$$u_{\text{smoothed}}(t) = u_{\text{smoothed}}(t - \Delta t) + \alpha_{\text{input}} \cdot \left( u_{\text{raw}}(t) - u_{\text{smoothed}}(t - \Delta t) \right)$$
Where $\alpha_{\text{input}} = 0.15$ at $60\text{ Hz}$ ($\tau \approx 0.055\text{ s}$).

### 8.3 Platform-Specific Mappings

#### 1. Keyboard & Mouse (Desktop Web / Tauri):
* `W` or `Arrow Up`: Forward Thrust ($1.0$).
* `S` or `Arrow Down`: Aerodynamic Airbrake.
* `A` / `D` or `Arrow Left` / `Arrow Right`: Lateral Steering ($-1.0 / +1.0$).
* `Mouse X`: Camera Orbit Yaw (relative delta when Pointer Locked).
* `Mouse Y`: Camera Orbit Pitch (clamped $-15^\circ \to +45^\circ$).
* `Spacebar`: Activate Primary Power.
* `V`: Toggle 1st Person / 3rd Person Camera.
* `Tab`: Open In-Game Telemetry & Regional Map Overlay.
* `Escape`: Pause / Settings Menu.

#### 2. Gamepad API (Xbox / PlayStation / Generic Controllers):
* **Left Stick X**: Steering ($[-1.0, 1.0]$, radial deadzone $= 0.12$).
* **Left Stick Y**: Throttle / Brake.
* **Right Stick X / Y**: Free Look Orbit.
* **Right Trigger (RT / R2)**: Analog Throttle ($0.0 \to 1.0$).
* **Left Trigger (LT / L2)**: Analog Brake.
* **Button South (A / Cross)**: Activate Stored Power.
* **Button East (B / Circle)**: Toggle Camera (1st/3rd Person).
* **Start / Options**: Pause.
* **Dual-Motor Haptics**:
  * Near-miss spark: Weak motor $0.35$ intensity, $80\text{ ms}$.
  * Sonic barrier break: Strong motor $0.60$ intensity, $150\text{ ms}$.
  * Catastrophic impact: Both motors $1.00$ intensity, $500\text{ ms}$.

#### 3. Mobile Touch UI (Responsive PWA / Tauri Mobile):
* **Left Floating Virtual Joystick**: Touch-drag provides directional steering and forward throttle.
* **Right Touch Drag Surface**: Camera yaw and pitch look-around.
* **Action Buttons**:
  * Giant circular **Power Button** (bottom center-right): Tap to fire active power.
  * **Camera Toggle Icon** (top right).
  * **Pause Button** (top left).
* **Customizable Touch Layout**: Players can drag and reposition buttons in Settings; coordinates are serialized to `localStorage` and Supabase player profile.

---

# Section 9: Camera System — Full Specification

### 9.1 3rd Person Spring-Arm Chase Camera (Default)
The primary chase camera simulates an aerodynamic spring-arm with physical mass and velocity-dependent lag.

```
                  [LOOK-AT TARGET]
                  (Ship Center + Forward Lead Vector)
                          ^
                         /
                        / Spring-Arm Length L(v) = 8.0m -> 11.5m
                       /  Pitch Elevation = 2.5m
                      /
            [CAMERA POSITION]
            (Lags behind craft by 0.12s)
```

#### Mathematical Specification:
1. **Target Position Evaluation**:
   $$\vec{P}_{\text{cam\_ideal}} = \vec{P}_{\text{ship}} - \vec{D}_{\text{forward}} \cdot L(v) + \hat{y} \cdot H(v)$$
   * $L(v) = 8.0\text{ m} + 3.5\text{ m} \cdot \left( \frac{v - v_{\text{base}}}{v_{\max} - v_{\text{base}}} \right)$
   * $H(v) = 2.5\text{ m} + 0.8\text{ m} \cdot \left( \frac{v - v_{\text{base}}}{v_{\max} - v_{\text{base}}} \right)$
2. **Spring Dampening Integration**:
   $$\vec{P}_{\text{cam}}(t) = \text{lerp}\left( \vec{P}_{\text{cam}}(t - \Delta t), \, \vec{P}_{\text{cam\_ideal}}, \, 1.0 - \exp(-\alpha_{\text{spring}} \cdot \Delta t) \right)$$
   Where $\alpha_{\text{spring}} = 8.5\text{ s}^{-1}$ (yields $\approx 0.12\text{ s}$ lag behind high-speed maneuvers).
3. **Dynamic Speed Field of View (FOV)**:
   $$\text{FOV}(v) = 65^\circ + 25^\circ \cdot \left( \frac{v - v_{\text{base}}}{v_{\max} - v_{\text{base}}} \right) \implies [65^\circ \to 90^\circ]$$
4. **Camera Banking**:
   Camera rolls in the direction of the turn to accentuate centrifugal force:
   $$\theta_{\text{cam\_roll}} = 0.5 \cdot \theta_{\text{ship\_roll}}$$
5. **Terrain Collision Occlusion Protection**:
   A raycast tests the vector between $\vec{P}_{\text{ship}}$ and $\vec{P}_{\text{cam}}$. If terrain or rock geometry is intersected, the arm compresses along the ray:
   $$L_{\text{effective}} = \max\left( 2.0\text{ m}, \, \|\vec{P}_{\text{hit}} - \vec{P}_{\text{ship}}\| - 0.3\text{ m} \right)$$

### 9.2 1st Person Cockpit View
* **Mount Point**: Rigidly anchored $0.3\text{ m}$ above the ship nose centerline along the forward aerodynamic chord.
* **FOV**: Base $85^\circ \to 105^\circ$ at hypersonic speed.
* **Roll Authority**: Matches ship banking angle $1:1$ without lag.
* **Kinematic Head Bob**: Sinusoidal micro-oscillation simulating aerodynamic flutter:
  $$y_{\text{bob}} = \sin\left( 2\pi \cdot t \cdot \frac{v}{25.0} \right) \cdot 0.02\text{ m}$$

### 9.3 Camera Transition Mechanics
* Pressing `V` or tapping Camera Toggle initiates a $0.4\text{-second}$ smooth Hermite cross-blend between positions and FOVs.
* Camera toggle is locked during crash disintegration to ensure debris tracking remains cinematic and readable.

---

# Section 10: HUD & UI Design — Complete Specification

### 10.1 In-Game HUD Layout
```
 [Solar Frags: 1,420]                        [EGO: 42.5x]                      [Score: 842,910]
 [Icon + Fragment Count]                    (Center Top Glow)                  (Top Right Monospace)
 +--------------------------------------------------------------------------------------------------+
 |                                                                                                  |
 |                                                                                                  |
 |                                                                                                  |
 |                                   [-- OBSIDIAN FISSURE --]                                       |
 |                                      (Cinematic Card)                                            |
 |                                                                                                  |
 |                                                                                                  |
 |                                                                             [Near-Miss Streak x4]|
 |                                                                                                  |
 |                                                                                                  |
 +--------------------------------------------------------------------------------------------------+
 [Speed: 108 m/s (Arc Gauge)]             [Active Power: BOOST]                [Distance: 12,480m]
 [Altitude: 0.52m (Bar)]                  [Slot 1] [Slot 2] [Slot 3]           [Sun/Moon Orbit Icon]
```

### 10.2 Aesthetic Design Language
* **Theme**: Minimalist, human-crafted glassmorphism.
* **Surfaces**: Frosted glass panels (`backdrop-filter: blur(16px)`), paper-thin borders (`1px solid rgba(255, 255, 255, 0.15)`), organic rounded corners (`border-radius: 12px`).
* **Palette**: Monochromatic deep slate base with high-contrast glowing accents: Ice Cyan (`#00F5D4`), Solar Saffron (`#FFB703`), Supernova Amber (`#FB8500`).
* **Screen Area Budget**: HUD elements occupy $< 12\%$ of total active viewport area to preserve peripheral visual field.

### 10.3 Menu System

#### 1. Main Menu:
* Real-time 3D interactive background: The active ship glides through procedural dunes during sunset.
* Minimalist vertical menu: `PLAY`, `DAILY RUN`, `LEADERBOARDS`, `SHIP HANGAR`, `SETTINGS`, `SIGN IN`.

#### 2. Settings Menu:
* **Graphics**: Resolution Scale ($0.5\times \to 1.5\times$), Post-Processing Preset (`Low`, `Medium`, `High`, `Ultra`), Shadow Quality (`Off`, `Medium`, `CSM High`), Target Frame Rate (`60`, `120`, `Unlimited`).
* **Audio**: Master, Engine, SFX, Ambient Pad volume sliders.
* **Controls**: Invert Y-Axis, Mouse Sensitivity, Gamepad Deadzone, Mobile Touch Layout Editor.

#### 3. Shop & Ship Hangar UI:
* 3D rotating turntable showcasing ship models (`ship1.glb` through `ship10.glb`).
* Tabs: `SHIPS`, `ENGINE TRAILS`, `DECALS`, `POWER SKINS`.
* Item card: Model preview, aerodynamic specs, Solar Fragment price, `PURCHASE` / `EQUIP` button.

#### 4. Crash Screen & Rebirth:
* **Zero Annoying Popups**: No full-screen banners, no interstitial loading, no modal dialogs.
* Time slows; camera tracks disintegrating hull.
* Minimalist stat card fades in from bottom viewport:
  ```
  SCORE: 1,482,900  |  DISTANCE: 18.4 km  |  MAX EGO: 50.0x  |  FRAGMENTS: +480
  [PRESS SPACE / TAP SCREEN TO REBIRTH]
  ```
* Rebirth executes in $< 50\text{ ms}$.

---

# Section 11: Authentication & User System

### 11.1 Supabase Auth Pipeline
* **Supported Methods**:
  1. Email + Password with cryptographic salt.
  2. Google OAuth 2.0 (one-click browser login).
  3. Instant Guest Mode (zero friction).
* **Guest Mode to Registered Account Migration**:
  * Unauthenticated players receive a persistent client-side UUID stored in `localStorage`.
  * Local high scores, acquired currency, and unlocked ships are cached in IndexedDB.
  * Upon registering or signing in via OAuth, an automated Supabase database function merges guest achievements and currency into the permanent account profile without data loss.

---

# Section 12: Complete Supabase Database Schema

Below is the complete, production-grade SQL script implementing all 7 required tables, foreign keys, constraints, Row Level Security (RLS) policies, and performance indexes.

```sql
-- ============================================================================
-- EGO DATABASE MASTER SCHEMA & SECURITY SPECIFICATION
-- Database Target: Supabase (PostgreSQL 15+)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid unique references auth.users(id) on delete cascade,
    callsign text unique not null check (char_length(callsign) >= 3 and char_length(callsign) <= 24),
    level integer not null default 1 check (level >= 1 and level <= 100),
    xp bigint not null default 0 check (xp >= 0),
    solar_fragments bigint not null default 0 check (solar_fragments >= 0),
    selected_ship_id text not null default 'ship1',
    selected_trail_id text not null default 'trail_amber',
    settings_json jsonb not null default '{
        "graphics": {"quality": "high", "fov": 75, "shadows": true},
        "audio": {"master": 0.8, "engine": 0.7, "sfx": 0.9, "pad": 0.6},
        "controls": {"sensitivity": 1.0, "invertY": false}
    }'::jsonb,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- 2. EGO RUNS TABLE (Telemetry & Leaderboard Verification)
create table if not exists public.ego_runs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(user_id) on delete set null,
    score bigint not null check (score >= 0),
    distance_meters double precision not null check (distance_meters >= 0.0),
    max_ego_multiplier numeric(5,2) not null check (max_ego_multiplier >= 1.0 and max_ego_multiplier <= 50.0),
    avg_ego_multiplier numeric(5,2) not null check (avg_ego_multiplier >= 1.0 and avg_ego_multiplier <= 50.0),
    regions_discovered integer not null default 1 check (regions_discovered >= 1),
    near_miss_count integer not null default 0 check (near_miss_count >= 0),
    powers_used_json jsonb not null default '[]'::jsonb,
    solar_fragments_earned integer not null default 0 check (solar_fragments_earned >= 0),
    run_seed text not null,
    celestial_cycle_count integer not null default 0,
    time_survived_seconds double precision not null check (time_survived_seconds > 0.0),
    validation_hash text not null, -- HMAC-SHA256 signature
    created_at timestamp with time zone not null default now()
);

-- 3. LEADERBOARD DAILY TABLE
create table if not exists public.leaderboard_daily (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references public.ego_runs(id) on delete cascade,
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    callsign text not null,
    score bigint not null,
    day_seed text not null, -- Format: YYYY-MM-DD
    rank integer,
    created_at timestamp with time zone not null default now(),
    unique(user_id, day_seed) -- 1 entry per user per day (retains best score)
);

-- 4. LEADERBOARD ALL-TIME TABLE
create table if not exists public.leaderboard_alltime (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references public.ego_runs(id) on delete cascade,
    user_id uuid unique not null references public.profiles(user_id) on delete cascade,
    callsign text not null,
    score bigint not null,
    created_at timestamp with time zone not null default now()
);

-- 5. SHOP ITEMS TABLE
create table if not exists public.shop_items (
    id text primary key, -- e.g. 'ship7', 'trail_cyan'
    category text not null check (category in ('ship', 'trail', 'decal', 'power_skin')),
    name text not null,
    description text not null,
    price integer not null check (price >= 0),
    asset_reference text not null,
    rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
    is_available boolean not null default true,
    created_at timestamp with time zone not null default now()
);

-- 6. PLAYER INVENTORY TABLE
create table if not exists public.player_inventory (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    shop_item_id text not null references public.shop_items(id) on delete cascade,
    acquired_at timestamp with time zone not null default now(),
    unique(user_id, shop_item_id)
);

-- 7. ACHIEVEMENTS TABLE
create table if not exists public.achievements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    achievement_key text not null,
    achieved_at timestamp with time zone not null default now(),
    metadata_json jsonb not null default '{}'::jsonb,
    unique(user_id, achievement_key)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.ego_runs enable row level security;
alter table public.leaderboard_daily enable row level security;
alter table public.leaderboard_alltime enable row level security;
alter table public.shop_items enable row level security;
alter table public.player_inventory enable row level security;
alter table public.achievements enable row level security;

-- PROFILES Policies
create policy "Profiles are viewable by everyone" 
    on public.profiles for select using (true);
create policy "Users can insert their own profile" 
    on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own profile" 
    on public.profiles for update using (auth.uid() = user_id);

-- EGO_RUNS Policies
create policy "Runs are viewable by everyone" 
    on public.ego_runs for select using (true);
create policy "Authenticated users can submit runs" 
    on public.ego_runs for insert with check (auth.uid() = user_id);

-- LEADERBOARD Policies (Read Public, Write via Serverless Edge Function)
create policy "Daily leaderboard readable by all" 
    on public.leaderboard_daily for select using (true);
create policy "All-time leaderboard readable by all" 
    on public.leaderboard_alltime for select using (true);

-- SHOP Policies
create policy "Shop items readable by all" 
    on public.shop_items for select using (true);
create policy "Inventory viewable by owner" 
    on public.player_inventory for select using (auth.uid() = user_id);
create policy "Users can buy items for self" 
    on public.player_inventory for insert with check (auth.uid() = user_id);

-- ACHIEVEMENTS Policies
create policy "Achievements viewable by everyone" 
    on public.achievements for select using (true);
create policy "Users can insert own achievements" 
    on public.achievements for insert with check (auth.uid() = user_id);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

create index idx_profiles_user_id on public.profiles(user_id);
create index idx_runs_score on public.ego_runs(score desc);
create index idx_runs_user_id on public.ego_runs(user_id);
create index idx_leaderboard_daily_seed_score on public.leaderboard_daily(day_seed, score desc);
create index idx_leaderboard_alltime_score on public.leaderboard_alltime(score desc);
create index idx_inventory_user_id on public.player_inventory(user_id);
create index idx_achievements_user_id on public.achievements(user_id);
```

---

# Section 13: Shop & Economy System — Balance Specification

### 13.1 Economy Formula & In-Game Earning Balance
Solar Fragments are balanced to ensure rewarding progression without runaway hyperinflation:

```
[Skim Terrain at 0.5m] -> [EGO x50 Multiplier] -> [20 Frags/sec Earn Rate]
                               |
                        10-Minute Flight
                               |
                               v
                     ~12,000 Solar Fragments
                               |
               +---------------+---------------+
               |                               |
               v                               v
    Buy Mid-Tier Ship (5,000)      Unlock Rare Wing Trail (2,500)
```

### 13.2 Catalog Pricing & Tier Matrix
* **Ships (from provided 10 models)**:
  * `ship1.glb`: Starter Craft (Free / Default).
  * `ship2.glb` – `ship4.glb`: Lightweight Skimmers ($500 – 1,500$ Fragments).
  * `ship5.glb` – `ship7.glb`: Aerodynamic Interceptors ($3,000 – 6,000$ Fragments).
  * `ship8.glb` – `ship10.glb`: Apex Exotic Solar Gliders ($10,000 – 25,000$ Fragments).
* **Wing Trail Cosmetics**:
  * Solar Amber (Default).
  * Ion Cyan ($500$ Fragments).
  * Emerald Plasma ($1,200$ Fragments).
  * Ultraviolet Void ($3,000$ Fragments).
  * Chromatic Prismatic ($5,000$ Fragments).
* **Decals & Hull Liveries**: 10 distinct patterns ($100 – 2,000$ Fragments).
* **Power Skins**: Purely cosmetic visual overrides ($500 – 3,000$ Fragments).
* **Daily First-Flight Bonus**: Award $+50$ Solar Fragments on the first completed run of each calendar day.

---

# Section 14: Performance Budget & Optimization Strategy

### 14.1 Target Frame Budgets
* **60 Hz Target**: $16.67\text{ ms}$ total frame time budget.
* **120 Hz ProMotion Target**: $8.33\text{ ms}$ total frame time budget.

#### CPU & GPU Budget Breakdown (at 120 Hz / 8.33ms):
```
+-------------------------------------------------------------------------+
| CPU EXECUTION (Target: <= 3.2 ms)                                       |
|  - Physics Engine & PID Hover Tick: 0.8 ms                              |
|  - Chunk Streaming & Frustum Culling: 1.1 ms                            |
|  - Input Polling & Camera Integration: 0.4 ms                           |
|  - Audio Parameter Modulation: 0.3 ms                                   |
|  - Three.js Matrix Updates: 0.6 ms                                      |
+-------------------------------------------------------------------------+
| GPU EXECUTION (Target: <= 4.8 ms)                                       |
|  - Cascaded Shadow Pass (CSM 3-Tier): 1.2 ms                            |
|  - Terrain Deferred/Forward PBR Draw: 1.6 ms                            |
|  - Instanced Prop Batches (Rocks, Trees, Grass): 0.9 ms                 |
|  - Post-Processing (Bloom + FXAA + Chromatic Aberration): 1.1 ms        |
+-------------------------------------------------------------------------+
```

### 14.2 Asset Optimization & Draco Compression Plan
The raw GLB assets currently in `/Users/shreeprasandhk/shree_projects/ego/` exhibit critical file bloat that must be compressed prior to production deployment:

```bash
# Automated Draco Compression Script using gltf-transform
# Install: npm install -g @gltf-transform/cli

# 1. Rename ship8 missing extension
mv "/Users/shreeprasandhk/shree_projects/ego/model/ship8" "/Users/shreeprasandhk/shree_projects/ego/model/ship8.glb"

# 2. Compress Critical Tree Asset (115MB -> <2MB Target)
gltf-transform draco "/Users/shreeprasandhk/shree_projects/ego/single item/tree5.glb" "/Users/shreeprasandhk/shree_projects/ego/public/assets/single-item/tree5.glb" --method edgebreaker

# 3. Compress tree4.glb (33MB -> <1MB Target)
gltf-transform draco "/Users/shreeprasandhk/shree_projects/ego/single item/tree4.glb" "/Users/shreeprasandhk/shree_projects/ego/public/assets/single-item/tree4.glb"

# 4. Compress environment pond asset (51MB -> <5MB Target)
gltf-transform draco "/Users/shreeprasandhk/shree_projects/ego/environment/small pond with trees.glb" "/Users/shreeprasandhk/shree_projects/ego/public/assets/environment/small_pond.glb"

# 5. Compress stone5.glb (16MB -> <500KB Target)
gltf-transform draco "/Users/shreeprasandhk/shree_projects/ego/single item/stone5.glb" "/Users/shreeprasandhk/shree_projects/ego/public/assets/single-item/stone5.glb"

# 6. Batch compress remaining ships and single-item props
for f in /Users/shreeprasandhk/shree_projects/ego/model/*.glb; do
  gltf-transform optimize "$f" "/Users/shreeprasandhk/shree_projects/ego/public/assets/models/$(basename "$f")" --compress draco
done
```

### 14.3 Zero-Allocation Render Loop Mandate
* To guarantee **zero Garbage Collection (GC) pauses**, all vector, quaternion, matrix, and raycast calculations inside the `requestAnimationFrame` loop use pre-allocated static scratch objects:

```typescript
// Scratch mathematical primitives pre-allocated at module scope
const SCRATCH_VEC3_A = new THREE.Vector3();
const SCRATCH_VEC3_B = new THREE.Vector3();
const SCRATCH_QUAT_A = new THREE.Quaternion();
const SCRATCH_RAY = new THREE.Ray();
```
* **Strict Rule**: No `new THREE.Vector3()` or `new THREE.Matrix4()` may exist within any method invoked per frame.

---

# Section 15: Security & Anti-Cheat

### 15.1 Cryptographic Run Verification Pipeline
To prevent malicious players from posting fake scores ($999,999,999$) via modified network payloads:
1. **Keyframe Telemetry Hashing**:
   Every $5.0\text{ s}$, the client records a condensed telemetry hash:
   $$H_k = \text{SHA256}(P_x, P_z, v, \text{score}, M_{\text{EGO}}, t)$$
2. **Final Run Signature**:
   Upon crash, the client packages the run telemetry and generates an HMAC-SHA256 signature using a dynamic ephemeral token negotiated at run start:
   $$\text{Signature} = \text{HMAC-SHA256}\left( \text{Seed} \,\|\, \text{Score} \,\|\, \text{Distance} \,\|\, \text{TelemetryDigest}, \, \text{SecretKey} \right)$$
3. **Server-Side Validation (Supabase Edge Function)**:
   The Edge Function `submit-run` verifies:
   * **Kinematic Plausibility**: $\text{Distance} \le v_{\max} \cdot \text{Time}$.
   * **Score Ceiling**: $\text{Score} \le (\text{Distance} \cdot 0.1) \cdot 50.0 + \text{Bonuses}$.
   * **Rate Limiting**: Maximum 10 submitted runs per hour per IP / user UUID.

---

# Section 16: Complete Tech Stack & Project File Structure

### 16.1 Technology Stack Architecture
* **Frontend Engine**: Vite 5 + Three.js r160+ + TypeScript 5.4.
* **Physics / Simulation**: Custom TypeScript Wieselsberger aerodynamic PID controller + continuous swept-sphere collision.
* **State Management**: Zustand 4.5.
* **UI Layer**: React 19 / HTML5 Canvas / Tailwind CSS v4 / Framer Motion.
* **Backend & Persistence**: Supabase (PostgreSQL 15, Auth, RLS, Edge Functions).
* **Desktop Runtime**: Tauri v2 (Rust backend wrapping WebGL2 viewport).

### 16.2 Complete Project File Structure
Below is the exhaustive file tree for `ego/` with a one-line description for every file:

```
/Users/shreeprasandhk/shree_projects/ego/
├── .env.example                               # Template for required environment variables
├── .gitignore                                 # Git exclusion rules (node_modules, dist, study notebooks)
├── index.html                                 # HTML5 entry point and Canvas container
├── package.json                               # npm dependencies and build scripts
├── tsconfig.json                              # TypeScript strict compiler configuration
├── vite.config.ts                             # Vite build configuration with GLSL shader plugin
├── tailwind.config.ts                         # Tailwind CSS styling configuration
├── src-tauri/                                 # Tauri v2 desktop runtime configuration
│   ├── Cargo.toml                             # Rust crate dependencies
│   ├── tauri.conf.json                        # Desktop window properties and permissions
│   └── src/
│       └── main.rs                            # Native Tauri window bootstrap
├── public/
│   ├── favicon.ico                            # Application icon
│   ├── assets/
│   │   ├── models/                            # Draco-compressed ship models (ship1.glb to ship10.glb)
│   │   ├── single-item/                       # Draco-compressed props (rocks, trees, grass, ramps)
│   │   └── environment/                       # Draco-compressed small pond with trees environment
│   └── textures/
│       ├── sand_albedo.webp                   # 2K desert sand diffuse texture
│       ├── sand_normal.webp                   # 2K desert sand normal map
│       ├── rock_albedo.webp                   # 2K basalt rock diffuse texture
│       └── rock_normal.webp                   # 2K basalt rock normal map
├── supabase/
│   ├── config.toml                            # Local Supabase CLI configuration
│   ├── migrations/
│   │   └── 20261021000000_init_schema.sql     # Complete SQL schema, RLS, and indexes
│   └── functions/
│       └── submit-run/
│           └── index.ts                       # Edge Function for cryptographic score verification
└── src/
    ├── main.ts                                # Application bootstrap and loop trigger
    ├── core/
    │   ├── Engine.ts                          # Master Three.js render loop and clock coordinator
    │   ├── SceneManager.ts                    # Graph node lifecycle and scene hierarchy manager
    │   └── GameState.ts                       # Zustand state store for active runs and scores
    ├── physics/
    │   ├── HoverController.ts                 # PID ground-effect Wieselsberger flight controller
    │   ├── SweptSphereCollision.ts            # Continuous collision detection and BVH traversal
    │   └── Kinematics.ts                      # Velocity, acceleration, roll, and gravity integration
    ├── world/
    │   ├── ChunkManager.ts                    # 3x3 active chunk streaming and pool coordinator
    │   ├── TerrainGenerator.ts                # Multi-octave Simplex noise heightmap generator
    │   ├── BiomeSystem.ts                     # Saffron Ridges, Obsidian Fissure, and Monolith logic
    │   ├── ObjectPlacer.ts                    # Poisson disc sampling and safety corridor clearing
    │   └── RampPlacer.ts                      # Kinetic launch ramp spawning and approach smoothing
    ├── player/
    │   ├── ShipController.ts                  # Ship model mesh loading and thruster animation
    │   ├── CameraManager.ts                   # 3rd person aerodynamic spring-arm and cockpit view
    │   └── InputManager.ts                    # Keyboard, Gamepad API, and mobile touch dispatcher
    ├── systems/
    │   ├── EgoSystem.ts                       # Dynamic EGO proximity multiplier calculation
    │   ├── ScoringSystem.ts                   # Option E score formula accumulator
    │   ├── PowerSystem.ts                     # The 5 powers (Boost, Shatter, Warp, Shield, Surge)
    │   ├── CelestialEngine.ts                 # 10-minute Sun/Moon orbit and lighting coordinator
    │   └── AudioEngine.ts                     # Procedural Web Audio API soundscape generator
    ├── rendering/
    │   ├── PostProcessPipeline.ts             # Bloom, Chromatic Aberration, Vignette, FXAA passes
    │   ├── InstancedPropBatcher.ts            # GPU InstancedMesh rendering for rocks, trees, grass
    │   ├── ShadowManager.ts                   # Cascaded Shadow Maps (CSM) coordinator
    │   └── shaders/
    │       ├── TerrainShader.ts               # Slope-dependent sand/rock PBR shader
    │       ├── SkyShader.ts                   # Rayleigh/Mie atmospheric scattering shader
    │       ├── GodRaysShader.ts               # Radial screen-space crepuscular ray post-process
    │       ├── BioluminescentVeinShader.ts    # Night canyon emissive crevice pulse shader
    │       ├── WingRibbonShader.ts            # Aerodynamic wingtip speed ribbon shader
    │       └── EgoAuraShader.ts               # Proximity hull Fresnel glow shader
    ├── ui/
    │   ├── HUD.tsx                            # React/HTML5 Canvas HUD (Multiplier, Speed, Score)
    │   ├── MainMenu.tsx                       # Full-screen animated 3D start menu
    │   ├── SettingsMenu.tsx                   # Audio, graphics, and control sensitivity sliders
    │   ├── ShopUI.tsx                         # 3D turntable ship hangar and cosmetic store
    │   ├── LeaderboardUI.tsx                  # Daily seed and all-time global leaderboard
    │   ├── CrashScreen.tsx                    # Sub-50ms instant rebirth and telemetry card
    │   └── MobileTouchOverlay.tsx             # Virtual joystick and customizable touch buttons
    ├── db/
    │   ├── supabaseClient.ts                  # Supabase JS client instantiation
    │   ├── authService.ts                     # Login, register, OAuth, and guest account linking
    │   └── runService.ts                      # Secure run submission and leaderboard queries
    ├── types/
    │   ├── game.ts                            # Core game loop and state interfaces
    │   ├── physics.ts                         # PID parameters, vectors, and collision shapes
    │   ├── world.ts                           # Biome definitions, chunk coordinates, and LOD tiers
    │   └── database.ts                        # Supabase generated database types
    └── utils/
        ├── MathUtils.ts                       # Linear interpolation, damping, and vector math
        ├── ObjectPool.ts                      # Generic high-performance object pooling utility
        ├── SimplexNoise.ts                    # 2D/3D fractional Brownian motion noise functions
        └── Constants.ts                       # Fixed gameplay coefficients (k1, k2, k3, k4, speeds)
```

---

# Section 17: Package.json Dependencies

Below is the complete `package.json` specification:

```json
{
  "name": "ego",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.42.0",
    "clsx": "^2.1.0",
    "framer-motion": "^11.1.7",
    "lucide-react": "^0.368.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "simplex-noise": "^4.0.1",
    "tailwind-merge": "^2.2.2",
    "three": "^0.163.0",
    "three-stdlib": "^2.29.4",
    "zod": "^3.22.4",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@tauri-apps/api": "^2.0.0-rc.0",
    "@tauri-apps/cli": "^2.0.0-rc.0",
    "@types/node": "^20.12.7",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.163.0",
    "@typescript-eslint/eslint-plugin": "^7.6.0",
    "@typescript-eslint/parser": "^7.6.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "draco3d": "^1.5.7",
    "eslint": "^8.57.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5",
    "vite": "^5.2.8",
    "vite-plugin-glsl": "^1.3.0"
  }
}
```

---

# Section 18: Environment Variables

Below is the complete `.env.example` file specification required for both web and desktop runtimes:

```ini
# =============================================================================
# EGO ENVIRONMENT CONFIGURATION
# =============================================================================

# Public Supabase Connection (Browser Safe)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Secret Supabase Key (For Local Node Seed Scripts / Admin Migrations ONLY - Never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Client-Side Security & Verification
VITE_RUN_SIGNATURE_SALT=ego_kinetic_secret_salt_2026_production

# Target Environment Mode
VITE_APP_ENV=development
```

---

# Section 19: Asset Gap Analysis — What Sir Still Needs to Provide

While the core ship models (`ship1.glb` to `ship10.glb`) and basic environment items are in place, the following **production assets are missing** and must be provided or generated:

1. **Terrain PBR Texture Sets (2K WebP/PNG)**:
   * **Desert Sand**: Diffuse Albedo, Normal Map, Roughness Map, Ambient Occlusion.
   * **Obsidian / Basalt Rock**: Sheer cliff face Diffuse, Normal Map, Roughness Map.
   * **Limestone / Ruin Stone**: Weathered ancient stone Diffuse and Normal Map.
2. **Skybox & Atmospheric Assets**:
   * Equirectangular High Dynamic Range (HDR) sky maps for midday, golden hour, and starry midnight (or rely exclusively on our custom procedural `SkyShader.ts`).
3. **Typography & UI Fonts**:
   * Ultra-clean monospace font (e.g., `JetBrains Mono` or `Space Mono`) for high-speed HUD telemetry.
   * Geometric sans-serif display font (e.g., `Orbitron`, `Syne`, or `Cabinet Grotesk`) for the title card and region discovery banners.
4. **Power-Up Visual Geometry**:
   * Floating pickup meshes for the 5 powers (currently specified as procedural glowing icosahedrons with orbiting particle rings; custom 3D glyph orbs would enhance tactile polish).
5. **Asset Correction Tasks (Luna Action Plan)**:
   * `ship8`: File is missing `.glb` extension; must be renamed to `ship8.glb`.
   * `tree5.glb` ($115\text{ MB}$), `tree4.glb` ($33\text{ MB}$), `environment/small pond with trees.glb` ($51\text{ MB}$), and `stone5.glb` ($16\text{ MB}$): Must be Draco-compressed down to $< 5\text{ MB}$ total before bundle ingestion.

---

# Section 20: Phased Implementation Roadmap

The execution of EGO is divided into 5 clear, sequentially verifiable phases:

```
+----------------------------------------------------------------------------------------------------+
| PHASE 1: Engine Foundation & Kinetic Flight Prototype                                              |
|  - Vite + Three.js pipeline, ship model loader, basic terrain grid, 120Hz PID hover controller     |
+----------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+----------------------------------------------------------------------------------------------------+
| PHASE 2: Core Gameplay Loop & Dynamic Scoring                                                      |
|  - Swept-sphere collision, EGO multiplier engine, Option E scoring, 10-minute celestial lighting   |
+----------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+----------------------------------------------------------------------------------------------------+
| PHASE 3: Infinite World Streaming & Procedural Biomes                                              |
|  - 3x3 chunk streaming, Saffron/Obsidian/Monolith biomes, Poisson prop placer, launch ramps       |
+----------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+----------------------------------------------------------------------------------------------------+
| PHASE 4: Systems, Economy & Audio Architecture                                                     |
|  - Procedural Web Audio synth, 5 powers, Supabase Auth & RLS, shop economy, glassmorphic HUD       |
+----------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+----------------------------------------------------------------------------------------------------+
| PHASE 5: Platform Polish, Optimization & Launch                                                    |
|  - Mobile touch UI, Tauri v2 native desktop build, Draco asset compression, anti-cheat signature   |
+----------------------------------------------------------------------------------------------------+
```

---

### Phase 1: Engine Foundation & Kinetic Flight Prototype

#### 1. Task List:
* Initialize Vite + Three.js r160+ + TypeScript project structure.
* Build `Engine.ts` with fixed-timestep physics loop decoupling ($120\text{ Hz}$ physics, variable display refresh).
* Implement `ShipController.ts` loading `ship1.glb` using `GLTFLoader` with `DRACOLoader` support.
* Build `HoverController.ts` with 5-point downward terrain raycasting and the Wieselsberger PID model ($K_p = 150, K_d = 35$).
* Implement `CameraManager.ts` featuring the 3rd-person aerodynamic spring-arm with velocity lag.
* Implement `InputManager.ts` mapping WASD keyboard inputs with exponential moving average smoothing.

#### 2. Files to Create:
* `src/main.ts`
* `src/core/Engine.ts`
* `src/player/ShipController.ts`
* `src/player/CameraManager.ts`
* `src/player/InputManager.ts`
* `src/physics/HoverController.ts`
* `src/physics/Kinematics.ts`
* `src/types/physics.ts`
* `src/types/game.ts`

#### 3. Key Functions to Implement:
* `Engine.start()`: Initializes WebGL2 renderer and manages requestAnimationFrame clock.
* `HoverController.update(craftPos, craftQuat, dt)`: Executes 5-ray ground test and applies PID forces.
* `CameraManager.update(targetPos, targetQuat, velocity, dt)`: Calculates spring-arm lag and speed FOV.
* `InputManager.poll()`: Returns smoothed `InputState`.

#### 4. Acceptance Criteria:
* Player can steer `ship1.glb` across a test planar surface with responsive banking.
* Craft hovers consistently at $0.5\text{ m}$ height without sinking, jittering, or bouncing.
* Frame rate maintains rock-solid $60\text{ fps} / 120\text{ fps}$ with zero garbage collection allocations.

---

### Phase 2: Core Gameplay Loop & Dynamic Scoring

#### 1. Task List:
* Implement `SweptSphereCollision.ts` preventing high-speed tunneling through obstacles.
* Implement `EgoSystem.ts` evaluating terrain altitude and obstacle closeness to compute $M_{\text{EGO}} \in [1.0, 50.0]$.
* Implement `ScoringSystem.ts` accumulating score via Option E with coefficients $k_1 = 0.1, k_2 = 5000, k_3 = 250, k_4 = 1.0$.
* Implement near-miss spark particle generator ($R_{\text{near}} = 2.0\text{ m}$).
* Implement `CelestialEngine.ts` simulating the 10-minute day/night cycle with dynamic directional and ambient light interpolation.
* Implement sub-50ms instant rebirth mechanism on obstacle impact.

#### 2. Files to Create:
* `src/physics/SweptSphereCollision.ts`
* `src/systems/EgoSystem.ts`
* `src/systems/ScoringSystem.ts`
* `src/systems/CelestialEngine.ts`
* `src/rendering/shaders/EgoAuraShader.ts`
* `src/rendering/shaders/SkyShader.ts`
* `src/utils/Constants.ts`

#### 3. Key Functions to Implement:
* `SweptSphereCollision.checkSweep(p0, p1, radius)`: Detects collision along motion capsule.
* `EgoSystem.calculateMultiplier(altitude, nearestObstacleDist, speed)`: Returns instant multiplier.
* `ScoringSystem.tick(distanceDelta, dt)`: Accumulates real-time score.
* `CelestialEngine.update(realtimeSeconds)`: Rotates Sun/Moon vectors and updates color temperatures.

#### 4. Acceptance Criteria:
* Skimming $0.5\text{ m}$ off dune crests pushes the EGO multiplier to $50.0\times$; climbing to $50\text{ m}$ drops it to $1.0\times$.
* Grazing an obstacle within $2.0\text{ m}$ triggers metallic near-miss sparks and streak increments.
* Crashing at $120\text{ m/s}$ triggers slow-motion hull separation, and pressing Spacebar resets the craft in $< 50\text{ ms}$.

---

### Phase 3: Infinite World Streaming & Procedural Biomes

#### 1. Task List:
* Implement `TerrainGenerator.ts` using multi-octave Simplex noise with fractional Brownian motion.
* Build `ChunkManager.ts` managing a reusable pool of 9 active simulation chunks ($256\text{ m} \times 256\text{ m}$).
* Implement the 3 biomes: Saffron Ridges (desert), Obsidian Fissure (slot canyons), Monolith Graveyard (ruins).
* Implement `ObjectPlacer.ts` with Poisson disc sampling and safe flight corridor buffers.
* Implement `RampPlacer.ts` placing launch ramps every $800 – 1200\text{ m}$ with flattened approach terrain.
* Implement custom slope-dependent terrain surface PBR shader (`TerrainShader.ts`).

#### 2. Files to Create:
* `src/world/ChunkManager.ts`
* `src/world/TerrainGenerator.ts`
* `src/world/BiomeSystem.ts`
* `src/world/ObjectPlacer.ts`
* `src/world/RampPlacer.ts`
* `src/rendering/shaders/TerrainShader.ts`
* `src/rendering/InstancedPropBatcher.ts`
* `src/utils/SimplexNoise.ts`
* `src/utils/ObjectPool.ts`

#### 3. Key Functions to Implement:
* `ChunkManager.update(playerX, playerZ)`: Determines required chunk coordinates and recycles distant chunks.
* `TerrainGenerator.sampleHeight(x, z)`: Returns deterministic elevation using biome noise parameters.
* `ObjectPlacer.populateChunk(chunk)`: Spawns instanced rocks, trees, and grass with Poisson disc spacing.
* `RampPlacer.injectRamp(chunk)`: Evaluates trajectory and flattens terrain approach path.

#### 4. Acceptance Criteria:
* Player can fly continuously in any 360° direction for 100,000+ meters with seamless chunk streaming.
* Biome transitions blend smoothly without vertical geometry tears or popped normals.
* Memory usage remains flat; no memory leaks during continuous chunk creation and recycling.

---

### Phase 4: Systems, Economy & Audio Architecture

#### 1. Task List:
* Implement `AudioEngine.ts` procedurally synthesizing engine hum, wind roar, spark pings, and adaptive pads.
* Implement `PowerSystem.ts` supporting the 5 core powers (Boost, Shatter, Warp, Shield, Surge).
* Scaffold Supabase database tables (`profiles`, `ego_runs`, `leaderboards`, `shop_items`, `inventory`).
* Build `ShopUI.tsx` and hangar showcase turntable with Solar Fragment economy balance.
* Build responsive glassmorphic HUD (`HUD.tsx`) displaying real-time multiplier, score, speed, and region cards.
* Implement guest mode and Supabase Auth with Google OAuth.

#### 2. Files to Create:
* `src/systems/AudioEngine.ts`
* `src/systems/PowerSystem.ts`
* `src/db/supabaseClient.ts`
* `src/db/authService.ts`
* `src/db/runService.ts`
* `src/ui/HUD.tsx`
* `src/ui/ShopUI.tsx`
* `src/ui/MainMenu.tsx`
* `src/ui/CrashScreen.tsx`
* `src/ui/LeaderboardUI.tsx`
* `supabase/migrations/20261021000000_init_schema.sql`

#### 3. Key Functions to Implement:
* `AudioEngine.setSpeed(v)`: Modulates engine oscillator frequency and wind bandpass cutoff.
* `PowerSystem.activatePower(slotIndex)`: Dispatches active power effects and timers.
* `runService.submitRun(runData)`: Signs run telemetry and submits to Supabase.
* `authService.linkGuestAccount(email, password)`: Migrates guest scores to registered user account.

#### 4. Acceptance Criteria:
* Audio operates purely procedurally with zero external WAV/MP3 files loaded over the network.
* All 5 powers activate reliably, render their signature visual/audio effects, and obey cooldown constraints.
* High scores and daily runs save to Supabase and render in real-time on global leaderboards.

---

### Phase 5: Platform Polish, Optimization & Launch

#### 1. Task List:
* Implement `MobileTouchOverlay.tsx` with floating virtual joysticks and customizable button positions.
* Integrate Tauri v2 desktop shell producing cross-platform native binaries (macOS, Windows, Linux).
* Execute batch Draco compression pipeline across all 3D GLB assets in `/public/assets/`.
* Rename `ship8` to `ship8.glb` and verify complete 10-ship hangar roster.
* Implement Supabase Edge Function `submit-run` with HMAC-SHA256 signature verification and rate limiting.
* Execute full-spectrum Seven Shadows pre-flight audit and verify 60fps/120fps performance targets.

#### 2. Files to Create:
* `src/ui/MobileTouchOverlay.tsx`
* `src/rendering/PostProcessPipeline.ts`
* `src/rendering/ShadowManager.ts`
* `src-tauri/tauri.conf.json`
* `src-tauri/Cargo.toml`
* `src-tauri/src/main.rs`
* `supabase/functions/submit-run/index.ts`

#### 3. Key Functions to Implement:
* `MobileTouchOverlay.handleTouch(e)`: Translates multitouch gestures to virtual analog axes.
* `PostProcessPipeline.render(delta)`: Sequentially executes Bloom, Chromatic Aberration, and FXAA passes.
* `submit-run/index.ts`: Validates HMAC signature and kinematic feasibility server-side.

#### 4. Acceptance Criteria:
* Game runs smoothly on mobile touch devices with responsive virtual controls and zero viewport clipping.
* Tauri desktop app builds successfully into a $< 15\text{ MB}$ native executable.
* Total initial network payload for web game is $< 10\text{ MB}$ after Draco compression.
* Client passes all TypeScript strict type checks (`npx tsc --noEmit`) and ESLint audits with zero errors.

---

### End of Master Plan
*Signed and Approved for Execution,*  
**Luna**  
*Executive Assistant to Sir & Chief Engineering Custodian, Project EGO*
