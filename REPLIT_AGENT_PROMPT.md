# Replit Agent Prompt Pack: Browser NFS-Style Game (Three.js + Vite)

Use this with Replit Agent to build your game in stable stages.

## Stage 1 — Playable Prototype (Driving + Garage + Economy)

Create a 3D browser racing and economy game using **Three.js + Vite + JavaScript**.

### Requirements
- Start player money at **$22,000**.
- Add a drivable car with **WASD + Arrow keys**.
- Create a small low-poly city (roads, simple buildings, barriers).
- Add collision detection so the car cannot pass through buildings.
- Add a **Garage hub** with a UI panel for buying/selling cars.
- Use fictional car names only (no trademarks), such as:
  - Swift GT
  - Apex Predator
  - Neon Vortex
  - Iron Pulse
- Add basic car stats for each vehicle:
  - Top speed
  - Acceleration
  - Handling
  - Price
- Allow players to switch owned cars from the garage.
- Save and load game data from localStorage:
  - cash
  - owned cars
  - selected car

### Performance / Low-End Devices
- Add a Settings menu with:
  - **Low Graphics toggle**
  - Shadow toggle
  - Resolution scale (1.0 / 0.75 / 0.5)
- In Low Graphics mode:
  - disable shadows
  - reduce post-processing
  - set resolution scale to 0.5
- Use low-poly meshes and avoid heavy textures.

### UI
- HUD should show:
  - Speed
  - Current cash
  - Current car
- Pause menu with Resume / Settings / Garage / Reset Save.

---

## Stage 2 — Racing Mission System

Extend the project with a mission system.

### Mission Requirements
- Add 3 mission types:
  1. **Sprint**: point A to B against a timer
  2. **Checkpoint Race**: pass sequential checkpoints before time ends
  3. **Time Trial**: complete one lap with best time tracking
- Add mission rewards:
  - cash payout
  - optional car unlock token
- Add mission difficulty levels (Easy / Medium / Hard) that scale:
  - time limits
  - AI speed (if AI exists)
  - reward amount
- Add mission board UI in garage/city hub:
  - list available missions
  - show target time and reward
  - start button
- Save mission progress (completed missions, best times) in localStorage.

---

## Stage 3 — Car Tuning Menu

Add a tuning shop UI where players can buy upgrades per car.

### Tuning Requirements
- Upgrade categories:
  - Engine (acceleration)
  - Turbo (top speed)
  - Tires (handling)
  - Brakes (stopping distance)
  - Nitrous capacity (if nitrous exists)
- Each category has levels 0–5 with increasing cost.
- Costs scale non-linearly (e.g., exponential or curve-based).
- Upgrades must:
  - deduct cash
  - apply immediate stat changes
  - persist per-car in save data
- Add a “Reset Build” option for current car with partial refund.
- Show before/after stat bars in tuning UI.

---

## Stage 4 — Polish and Safety Rules

- Keep all branding fictional (cars, logos, badges).
- Avoid copying NFS names, logos, music, or map designs.
- Use placeholder low-poly cars if no GLTF models are available.
- Keep code modular:
  - `src/game/` (scene, physics, camera)
  - `src/systems/` (economy, missions, tuning, save)
  - `src/ui/` (hud, menus)
- Add comments explaining each system.

---

## Optional Stretch Goals
- AI traffic cars and simple opponents.
- Mini-map.
- Day/night cycle toggle.
- Controller support (Gamepad API).
- Basic sound effects and music volume sliders.

