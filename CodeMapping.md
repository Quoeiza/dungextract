<FolderAllocation policy="New folders are permissible, but validate against these first.">
    <Path="assets/audio/..." purpose="All audio asset files. Includes sub-folders." />
    <Path="assets/images/..." purpose="All image asset files. Includes sub-folders." />
    <Path="scripts/..." purpose="Root directory for all game source code, configuration, and styles." />
</FolderAllocation>
<FileAllocation policy="New scripts are permissible, but validate against these first.">
    <Path="scripts/AISystem.js" purpose="Handles state machines for monsters (Idle, Chase, Attack, Flee, etc)." />
    <Path="scripts/AssetSystem.js" purpose="Asynchronously loads and caches game assets." />
    <Path="scripts/AudioSystem.js" purpose="Manages audio context, spatial sound, and procedural audio." />
    <Path="scripts/CombatSystem.js" purpose="Processes damage, health, stats, and combat interactions." />
    <Path="scripts/Database.js" purpose="Handles local persistence of player data." />
    <Path="scripts/enemies.json" purpose="Defines enemy stats, sprites, and behaviours." />
    <Path="scripts/EventEmitter.js" purpose="Implements the observer pattern for event dispatching." />
    <Path="scripts/GameLoop.js" purpose="Controls the update cycle and render interpolation." />
    <Path="scripts/global.json" purpose="Global constants for game mechanics and engine settings." />
    <Path="scripts/GridSystem.js" purpose="Handles dungeon generation, spatial queries, and pathfinding." />
    <Path="scripts/InputManager.js" purpose="Translates raw DOM events into abstract game intents." />
    <Path="scripts/items.json" purpose="Definitions for all items, equipment, and loot tables." />
    <Path="scripts/LootSystem.js" purpose="Manages inventory, equipment, and item interactions." />
    <Path="scripts/main.css" purpose="Global styles for the game container, UI overlays, and menus." />
    <Path="scripts/main.js" purpose="Application entry point; initializes systems and manages global state." />
    <Path="scripts/networking.json" purpose="Configuration for PeerJS connection and STUN servers." />
    <Path="scripts/PeerClient.js" purpose="Abstraction layer for WebRTC peer-to-peer connections." />
    <Path="scripts/RenderSystem.js" purpose="Renders the game world, lighting, and visual effects to the canvas." />
    <Path="scripts/SyncManager.js" purpose="Manages state snapshots and interpolation for network sync." />
    <Path="scripts/Ticker.js" purpose="Controls tick rate and global time system." />
    <Path="scripts/TileMapSystem.js" purpose="Handles tile-based rendering logic and auto-tiling rules." />
    <Path="scripts/UISystem.js" purpose="Handles DOM manipulation (inventory rendering, health bars, menus, etc)." />
</FileAllocation>