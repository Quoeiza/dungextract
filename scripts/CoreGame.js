// Test comment
import { NetworkEvents, Intents } from './NetworkEvents.js';
import GridSystem from './GridSystem.js';
import CombatSystem from './CombatSystem.js';
import LootSystem from './LootSystem.js';
import ProjectileSystem from './ProjectileSystem.js';
import AISystem from './AISystem.js';
import fs from 'fs';
import path from 'path';

const readJSON = (file) => JSON.parse(fs.readFileSync(path.resolve('scripts', file)));

const itemsConfig = readJSON('items.json');
const enemiesConfig = readJSON('enemies.json');
const globalConfig = readJSON('global.json');

/**
 * A fixed-step game loop implementation.
 * This class ensures that the game simulation (update logic) runs at a consistent
 * rate.
 */
class Ticker {
    /**
     * @param {function(number): void} updateFn - The function to call for each fixed-step update. It receives the fixed time step (delta time) as an argument.
     * @param {number} [tickRate=20] - The desired number of simulation updates per second.
     */
    constructor(updateFn, tickRate = 20) {
        this.updateFn = updateFn;
        
        /** @type {number} The desired number of simulation updates per second. */
        this.tickRate = tickRate;
        
        /** @type {number} The time in milliseconds per simulation tick. */
        this.timePerTick = 1000 / tickRate;
        if (!Number.isFinite(this.timePerTick) || this.timePerTick < 1) {
            this.timePerTick = 50; // Safety fallback (20 TPS)
        }

        /** @private @type {number} The timestamp of the last loop execution. */
        this.lastTime = 0;
        
        /** @private @type {number} Accumulates elapsed time to determine when to run the next update. */
        this.accumulator = 0;
        
        /** @private @type {boolean} Flag indicating if the loop is currently running. */
        this.isRunning = false;
        
        /** @private @type {?NodeJS.Timeout} The ID of the current timer. */
        this.timerId = null;

        /** @type {number} The current simulation tick count. */
        this.tick = 0;
    }

    /**
     * Starts the game loop.
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = Date.now();
        this.loop();
    }

    /**
     * Stops the game loop.
     */
    stop() {
        this.isRunning = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
        }
        this.timerId = null;
    }

    /**
     * The main loop, driven by setTimeout.
     * @private
     */
    loop() {
        if (!this.isRunning) return;

        const now = Date.now();
        let deltaTime = now - this.lastTime;
        this.lastTime = now;

        // Cap deltaTime to prevent a "spiral of death" if the server is overloaded.
        if (deltaTime > 1000) {
            deltaTime = 1000;
        }
        
        this.accumulator += deltaTime;

        let updates = 0;
        try {
            // Perform a fixed number of updates based on the accumulated time.
            while (this.accumulator >= this.timePerTick) {
                this.tick++;
                this.updateFn(this.timePerTick); // Pass fixed delta time to the update function.
                this.accumulator -= this.timePerTick;
                
                // Safety break to prevent the game from getting stuck in an update spiral on slow devices.
                if (++updates > 10) { 
                    this.accumulator = 0; 
                    break;
                }
            }
        } catch (e) {
            console.error("Ticker Crash Recovered:", e);
        }
        
        // Schedule the next loop iteration.
        const timeToNextTick = Math.max(0, this.timePerTick - (Date.now() - now));
        this.timerId = setTimeout(() => this.loop(), timeToNextTick);
    }
}

export class Game {
    constructor() {
        this.config = {
            items: itemsConfig,
            enemies: enemiesConfig,
            global: globalConfig
        };

        this.ticker = new Ticker(this.update.bind(this), this.config.global.tickRate);
        
        this.gridSystem = new GridSystem(
            this.config.global.dungeonWidth, 
            this.config.global.dungeonHeight, 
            this.config.global.tileSize
        );
        this.combatSystem = new CombatSystem(this.config.enemies);
        this.lootSystem = new LootSystem(this.config.items);
        this.projectileSystem = new ProjectileSystem(this.combatSystem);
        this.combatSystem.setLootSystem(this.lootSystem);
        this.aiSystem = new AISystem(this.gridSystem, this.combatSystem, this.lootSystem);

        this.worldState = {
            projectiles: [],
            gameTime: this.config.global.escapeTimeSeconds,
            escapeOpen: false,
            gameOver: false,
        };
        
        this.deadEntities = []; // { id, despawnTick, isPlayer }
        this.lastSentGridRevision = -1;

        this.onPlayerRemoved = null;
        this.onWorldUpdate = null;
        this.onUnicast = null;

        this.combatSystem.on('death', (data) => this.handleEntityDeath(data));
    }

    startGame() {
        this.lootSystem.clear();
        this.combatSystem.clear();
        this.gridSystem.initializeDungeon();
        this.gridSystem.populate(this.combatSystem, this.lootSystem, this.config);

        this.worldState.gameTime = this.config.global.escapeTimeSeconds;
        this.ticker.start();
    }


    update(dt) {
        if (dt > 100) dt = 100;

        this.worldState.gameTime -= (dt / 1000);

        // Process Player Paths (Mouse Movement)
        for (const [id, stats] of this.combatSystem.stats) {
            if (stats.isPlayer && stats.currentPath && stats.currentPath.length > 0) {
                if (this.ticker.tick >= stats.nextActionTick) {
                    const nextStep = stats.currentPath[0];
                    const pos = this.gridSystem.entities.get(id);
                    if (pos) {
                        const dir = { x: nextStep.x - pos.x, y: nextStep.y - pos.y };
                        // Validate adjacency to prevent teleporting
                        if (Math.abs(dir.x) <= 1 && Math.abs(dir.y) <= 1) {
                            this.processMove(id, dir);
                            stats.currentPath.shift(); // Remove step
                            
                            // Apply Cooldown
                            const cooldownMs = this.combatSystem.calculateCooldown(id, this.config.global.globalCooldownMs || 250);
                            stats.nextActionTick = this.ticker.tick + Math.ceil(cooldownMs / this.ticker.timePerTick);
                        } else {
                            stats.currentPath = null; // Invalid step
                        }
                    }
                }
            }
        }
            
        if (!this.worldState.escapeOpen && this.worldState.gameTime <= 60) {
            this.worldState.escapeOpen = true;
            const pos = this.gridSystem.spawnEscapePortal();
            if (this.onWorldUpdate) {
                this.onWorldUpdate({ type: NetworkEvents.PORTAL_SPAWN, payload: { x: pos.x, y: pos.y } });
            }
        }

        if (!this.worldState.gameOver && this.worldState.gameTime <= 0) {
            this.worldState.gameOver = true;
            if (this.onWorldUpdate) {
                this.onWorldUpdate({ type: NetworkEvents.HUMANS_ESCAPED, payload: { message: "Time Expired - Dungeon Collapsed" } });
            }
        }

        this.projectileSystem.updateProjectiles(dt, this.worldState.projectiles, this.gridSystem);
        this.gridSystem.processLavaDamage(dt, this.combatSystem);
        this.aiSystem.update(this.ticker.tick, this.ticker.timePerTick, (attackerId, targetId) => this.performAttack(attackerId, targetId));
        this.combatSystem.updateBuffs(this.ticker.tick);

        // Process despawns
        for (let i = this.deadEntities.length - 1; i >= 0; i--) {
            const entry = this.deadEntities[i];
            if (this.ticker.tick >= entry.despawnTick) {
                console.log(`[CoreGame] Despawning entity ${entry.id} at tick ${this.ticker.tick}`);
                if (entry.isPlayer) {
                    // Respawn as monster
                    const spawn = this.combatSystem.respawnPlayerAsMonster(entry.id, this.gridSystem);
                    if (this.onWorldUpdate) {
                        this.onWorldUpdate({ 
                            type: NetworkEvents.RESPAWN_MONSTER, 
                            payload: { id: entry.id, ...spawn } 
                        });
                    }
                } else {
                    // Permanently remove monster
                    this.gridSystem.removeEntity(entry.id);
                    this.combatSystem.removeEntity(entry.id);
                }
                this.deadEntities.splice(i, 1);
            }
        }
    }

    handleEntityDeath(data) {
        const { entityId, stats } = data;
        console.log(`[CoreGame] Entity died: ${entityId}`);

        // Disable collision immediately so players can walk through the dying entity
        this.gridSystem.setCollidable(entityId, false);
        
        // Notify clients to play animation
        if (this.onWorldUpdate) {
            this.onWorldUpdate({ 
                type: NetworkEvents.ENTITY_DEATH, 
                payload: { id: entityId } 
            });
        }

        const isPlayer = stats && stats.isPlayer;

        if (isPlayer) {
            // Check if any humans remain
            const humanCount = this.combatSystem.getHumanCount();
            if (humanCount <= 0) {
                // Game Over
                this.worldState.gameOver = true;
                if (this.onWorldUpdate) {
                    this.onWorldUpdate({ 
                        type: NetworkEvents.HUMANS_ESCAPED, 
                        payload: { message: "All Humans Perished" } 
                    });
                }
            }
        }
        
        // Schedule despawn or respawn
        const despawnDelayTicks = Math.ceil(1000 / (this.ticker.timePerTick || 50));
        const despawnTick = this.ticker.tick + despawnDelayTicks;
        console.log(`[CoreGame] Scheduled despawn for ${entityId} at tick ${despawnTick} (current: ${this.ticker.tick})`);
        this.deadEntities.push({ id: entityId, despawnTick, isPlayer });
    }

    stop() {
        this.ticker.stop();
    }

    /**
     * Adds a new player to the game world.
     * @param {string} playerId - The unique identifier for the player.
     * @param {object} playerData - The initial data for the player (e.g., position).
     */
    addPlayer(playerId, playerData) {
        const spawn = this.gridSystem.getSpawnPoint(true);
        this.gridSystem.addEntity(playerId, spawn.x, spawn.y);
        this.combatSystem.registerEntity(playerId, 'player', true, playerData.class || 'Fighter', playerData.name || 'Unknown');
        const stats = this.combatSystem.getStats(playerId);
        if (stats) stats.gold = playerData.gold || 0;

        // Starter Items for Client
        this.lootSystem.addItemToEntity(playerId, 'sword_basic', 1);
        this.lootSystem.addItemToEntity(playerId, 'armor_leather', 1);
        this.sendInventoryUpdate(playerId);
        
        console.log(`Player ${playerId} added.`);
    }

    /**
     * Removes a player from the game world.
     * @param {string} playerId - The unique identifier for the player.
     */
    removePlayer(playerId) {
        this.gridSystem.removeEntity(playerId);
        this.combatSystem.removeEntity(playerId);
        console.log(`Player ${playerId} removed.`);
        if (this.onPlayerRemoved) {
            this.onPlayerRemoved(playerId);
        }
    }

    sendInventoryUpdate(playerId) {
        if (this.onUnicast) {
             const inv = this.lootSystem.getInventory(playerId);
             const equip = this.lootSystem.getEquipment(playerId);
             this.onUnicast(playerId, {
                 type: NetworkEvents.UPDATE_INVENTORY,
                 payload: { inventory: inv, equipment: equip }
             });
        }
    }

    /**
     * Processes an input command from a player.
     * @param {string} playerId - The ID of the player sending the input.
     * @param {object} input - The input data (e.g., { action: 'move', direction: 'up' }).
     */
    handlePlayerInput(playerId, input) {
        // This will be the new entry point for all player actions from the server.
        const { intent } = input;
        if (!intent || !intent.type) return;

        let stats = this.combatSystem.getStats(playerId);
        if (!stats || stats.hp <= 0) return;

        // Allow inventory management off-cooldown
        const isInventoryAction = [Intents.EQUIP_ITEM, Intents.UNEQUIP_ITEM, Intents.DROP_ITEM].includes(intent.type);

        if (!isInventoryAction && this.ticker.tick < stats.nextActionTick) {
            return; // Cooldown not met for non-inventory actions
        }
        
        stats.lastProcessedInputTick = input.tick;

        let cooldown = !isInventoryAction;

        switch (intent.type) {
            case Intents.MOVE:
                stats.currentPath = null; // Interrupt auto-pathing
                this.processMove(playerId, intent.direction);
                break;
            case Intents.TARGET_ACTION:
                {
                    const action = this.gridSystem.determineClickIntent(
                        intent.x, intent.y, playerId, this.combatSystem, this.lootSystem, false, intent.shift
                    );
                    
                    if (action) {
                        if (action.type === 'ATTACK_TARGET') {
                            const result = this.combatSystem.processTargetAction(playerId, action.x, action.y, this.gridSystem, this.lootSystem);
                            if (result) {
                                if (result.type === 'RANGED') {
                                    const pos = this.gridSystem.entities.get(playerId);
                                    const dx = result.target.x - pos.x;
                                    const dy = result.target.y - pos.y;
                                    const proj = this.projectileSystem.createProjectile(playerId, pos.x, pos.y, dx, dy, this.lootSystem);
                                    if (proj) this.spawnProjectile(proj);
                                } else if (result.type === 'MELEE') {
                                    this.performAttack(playerId, result.targetId);
                                }
                            }
                        } else if (action.type === 'MOVE_PATH') {
                            stats.currentPath = action.path;
                            cooldown = false; // Pathing doesn't trigger global cooldown itself
                        }
                    }
                }
                break;
            case Intents.EQUIP_ITEM:
                if (this.lootSystem.equipItem(playerId, intent.itemId, intent.slot)) {
                    this.sendInventoryUpdate(playerId);
                }
                break;
            case Intents.UNEQUIP_ITEM:
                if (this.lootSystem.unequipItem(playerId, intent.slot)) {
                    this.sendInventoryUpdate(playerId);
                }
                break;
            case Intents.DROP_ITEM:
                 if (this.lootSystem.performDrop(playerId, intent.itemId, intent.source, this.gridSystem)) {
                    this.sendInventoryUpdate(playerId);
                }
                break;
            case Intents.INTERACT_LOOT:
                this.processLootInteraction(playerId, { id: intent.lootId });
                break;
            case Intents.USE_ABILITY_SLOT:
                {
                    // Slot is 0-indexed, quick slots are 1-indexed
                    const slotName = `quick${intent.slot + 1}`;
                    const consumable = this.lootSystem.consumeItem(playerId, slotName);
                    if (consumable) {
                        this.combatSystem.applyConsumableEffect(playerId, consumable);
                        this.sendInventoryUpdate(playerId);
                    }
                }
                break;
            case Intents.PICKUP:
                {
                    const pickupTarget = this.lootSystem.getPickupTarget(playerId, this.gridSystem);
                    if (pickupTarget) {
                        if (pickupTarget.type === 'chest') {
                            this.processLootInteraction(playerId, pickupTarget.target);
                        } else if (pickupTarget.type === 'items') {
                            // Pick up all items in the bag
                            pickupTarget.items.forEach(item => this.processLootInteraction(playerId, item));
                        }
                    }
                }
                break;
            case Intents.ABILITY:
                this.combatSystem.useAbility(playerId, this.ticker.tick, this.ticker.timePerTick);
                break;
            case Intents.PRIMARY_ACTION:
                {
                    const pickupTarget = this.lootSystem.getPickupTarget(playerId, this.gridSystem);
                    if (pickupTarget) {
                        if (pickupTarget.type === 'chest') {
                            this.processLootInteraction(playerId, pickupTarget.target);
                        } else if (pickupTarget.type === 'items') {
                            pickupTarget.items.forEach(item => this.processLootInteraction(playerId, item));
                        }
                    } else {
                        const attack = this.combatSystem.processAttackIntent(playerId, this.gridSystem);
                        if (attack && attack.type === 'MELEE') {
                            this.performAttack(playerId, attack.targetId);
                        }
                    }
                }
                break;
        }

        if (cooldown) {
            const cooldownMs = this.combatSystem.calculateCooldown(playerId, this.config.global.globalCooldownMs || 250);
            let cooldownTicks = Math.ceil(cooldownMs / this.ticker.timePerTick);
            stats.nextActionTick = this.ticker.tick + cooldownTicks;
        }
    }

    processMove(playerId, direction) {
        const result = this.gridSystem.resolveMoveIntent(playerId, direction, this.lootSystem, false);

        switch (result.type) {
            case 'MOVED':
                if (this.gridSystem.grid[Math.round(result.y)][Math.round(result.x)] === 9) {
                    this.handleEscape(playerId);
                }
                break;
            case 'BUMP_ENTITY':
                if (!this.combatSystem.isFriendly(playerId, result.targetId)) {
                    this.performAttack(playerId, result.targetId);
                }
                break;
            case 'INTERACT_LOOT':
                this.processLootInteraction(playerId, result.loot);
                break;
        }
    }
    
    performAttack(attackerId, targetId) {
        const result = this.combatSystem.resolveAttack(attackerId, targetId, this.gridSystem, this.lootSystem);
        if (!result) return;

        if (result.type === 'RANGED') {
            const attackerPos = this.gridSystem.entities.get(attackerId);
            const targetPos = this.gridSystem.entities.get(targetId);
            if (!attackerPos || !targetPos) return;

            const dx = targetPos.x - attackerPos.x;
            const dy = targetPos.y - attackerPos.y;

            const proj = this.projectileSystem.createProjectile(attackerId, attackerPos.x, attackerPos.y, dx, dy, this.lootSystem);
            if (proj) this.spawnProjectile(proj);
        } else if (result.type === 'MELEE') {
            this.combatSystem.applyDamage(targetId, result.damage, attackerId, { isCrit: result.isCrit });
            if (this.onWorldUpdate) {
                this.onWorldUpdate({ 
                    type: NetworkEvents.EFFECT, 
                    payload: { type: 'attack', targetId, sourceId: attackerId } 
                });
            }
        }
    }

    spawnProjectile(data) {
        const proj = { 
            id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            ...data 
        };
        this.worldState.projectiles.push(proj);
        if (this.onWorldUpdate) this.onWorldUpdate({ type: NetworkEvents.SPAWN_PROJECTILE, payload: proj });
    }

    processLootInteraction(entityId, loot) {
        const result = this.lootSystem.resolveInteraction(entityId, loot.id);
        if (result) {
            this.sendInventoryUpdate(entityId);
            
            // Notify everyone that loot is opened/gone
            if (this.onWorldUpdate) {
                this.onWorldUpdate({ 
                    type: NetworkEvents.LOOT_OPENED, 
                    payload: { id: loot.id } 
                });
            }
        }
    }

    handleEscape(entityId) {
        console.log(`Processing escape for ${entityId}`);
        // ... logic from GameLoop
    }

    getAuthoritativeState() {
        // Serialize entities
        const entities = [];
        for (const [id, pos] of this.gridSystem.entities) {
            const stats = this.combatSystem.getStats(id);
            if (stats) {
                // [0:id, 1:x, 2:y, 3:facingX, 4:facingY, 5:hp, 6:maxHp, 7:type, 8:team, 9:invisible, 10:nextActionTick, 11:lastProcessedInputTick]
                entities.push([
                    id, 
                    pos.x, 
                    pos.y, 
                    pos.facing.x, 
                    pos.facing.y, 
                    stats.hp, 
                    stats.maxHp, 
                    stats.type, 
                    stats.team, 
                    stats.invisible ? 1 : 0,
                    stats.nextActionTick,
                    stats.lastProcessedInputTick || 0
                ]);
            }
        }

        // Serialize Loot
        const loot = Array.from(this.lootSystem.worldLoot.entries());

        // Send grid if changed OR periodically (every 100 ticks ~ 5 seconds) to sync new clients
        const shouldSendGrid = this.gridSystem.revision !== this.lastSentGridRevision || (this.ticker.tick % 100 === 0);
        
        if (shouldSendGrid) {
            this.lastSentGridRevision = this.gridSystem.revision;
        }

        return {
            t: Date.now(),
            gt: this.worldState.gameTime,
            e: entities,
            p: this.worldState.projectiles,
            l: loot,
            grid: shouldSendGrid ? this.gridSystem.grid : undefined,
            gridRevision: this.gridSystem.revision
        };
    }
}
