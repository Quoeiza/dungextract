import { Lobby } from './Lobby.js';
import { InventoryUI } from './InventoryUI.js';
import { getEl, createEl, show, toggle, hide } from './domUtils.js';
import SettingsModal from './SettingsModal.js';

export default class UISystem {
    constructor(game) {
        this.game = game;
        this.lastTooltipUpdate = 0;
        this.inventoryUI = new InventoryUI(this.game.lootSystem);
        this.settingsModal = new SettingsModal(this);
        this.inventoryUI.setCallbacks(
            (itemId, slot) => this.game.handleEquipItem(itemId, slot),
            (slot) => this.game.handleUnequipItem(slot)
        );
    }

    setupLobby() {
        const uiLayer = getEl('ui-layer');
        new Lobby(
            uiLayer,
            this.game.playerData,
            (name, cls, isLocal) => {
                this.game.playerData.name = name || 'Traveler';
                this.game.playerData.class = cls;
                this.game.database.savePlayer({ name: this.game.playerData.name });
                
                if (isLocal) {
                    this.game.connectToGame('127.0.0.1', 56100, 'DEBUG');
                } else {
                    this.game.startQuickJoin();
                }
            },
            this // Pass the UISystem instance to the Lobby
        );

        // Attempt immediate fullscreen only on first session access
        if (!sessionStorage.getItem('theoathless_fs')) {
            this.enableFullscreen();
            // Ensure fullscreen on first interaction (browsers often block immediate fullscreen)
            const fsHandler = () => {
                this.enableFullscreen();
                sessionStorage.setItem('theoathless_fs', 'true');
            };
            document.addEventListener('click', fsHandler, { once: true });
            document.addEventListener('touchstart', fsHandler, { once: true });
        }
    }

    setupLobbySettings() {
        const btn = getEl('btn-lobby-settings');
        if (btn) btn.onclick = () => this.toggleSettingsMenu();
    }

    toggleInventory() {
        const modal = getEl('inventory-modal');
        if (modal) {
            toggle(modal);
            if (!modal.classList.contains('hidden')) {
                this.renderInventory();
            }
        }
    }

    setupUI() {
        show(getEl('room-code-display'));

        const statsBar = getEl('stats-bar');
        const invModal = getEl('inventory-modal');
        if (statsBar && invModal) {
            const grid = getEl('inventory-grid');
            if (grid) invModal.insertBefore(statsBar, grid);
            else invModal.prepend(statsBar);
            
            Object.assign(statsBar.style, {
                position: 'static',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: '10px',
                borderBottom: '1px solid #555',
                paddingBottom: '5px',
                width: '100%'
            });
            show(statsBar);
        }

        const uiLayer = getEl('ui-layer');
        if (uiLayer && !getEl('game-timer')) {
            createEl('div', { id: 'game-timer', parent: uiLayer });
        }

        let btnToggle = getEl('btn-inventory-toggle');
        if (!btnToggle) {
            btnToggle = createEl('button', { id: 'btn-inventory-toggle', parent: uiLayer });
        }
        btnToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;

        let btnSettings = getEl('btn-settings-toggle');
        if (!btnSettings) {
            btnSettings = createEl('button', {
                id: 'btn-settings-toggle',
                parent: uiLayer,
                content: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
            });
        }
        btnSettings.onclick = () => this.toggleSettingsMenu();

        if (btnToggle) btnToggle.onclick = () => this.toggleInventory();
        const btnClose = getEl('btn-inventory-close');
        if (btnClose) btnClose.onclick = () => this.toggleInventory();

        this.inventoryUI.init();

        const btnGroundClose = getEl('btn-ground-close');
        if (btnGroundClose) btnGroundClose.onclick = () => hide(getEl('ground-loot-modal'));

        if (!getEl('loot-notification')) {
            createEl('div', { id: 'loot-notification', parent: uiLayer });
        }
        if (!getEl('quick-slots-hud')) {
            createEl('div', { id: 'quick-slots-hud', parent: uiLayer });
        }

        this.setupCanvasDrop();

        this.createInteractionUI();
    }

    createInteractionUI() {
        const uiLayer = document.body;
        if (!getEl('game-tooltip')) {
            createEl('div', {
                id: 'game-tooltip',
                parent: uiLayer,
                style: {
                    position: 'absolute', padding: '8px', background: 'rgba(10, 10, 10, 0.9)', color: '#eee',
                    border: '1px solid #444', borderRadius: '4px', pointerEvents: 'none', display: 'none',
                    zIndex: '2000', fontSize: '12px', fontFamily: '"Germania One", cursive',
                    whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }
            });
        }
        if (!getEl('game-context-menu')) {
            const menu = createEl('div', {
                id: 'game-context-menu',
                parent: uiLayer,
                style: {
                    position: 'absolute', background: '#1a1a1a', border: '1px solid #555',
                    minWidth: '140px', zIndex: '2001', display: 'none', flexDirection: 'column',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                }
            });
            window.addEventListener('click', () => hide(menu));
        }
    }

    setupCanvasDrop() {
        const canvas = getEl('game-canvas');
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data && data.itemId) {
                this.game.handleDropItem(data.itemId, data.source);
            }
        });
    }

    renderInventory() {
        this.inventoryUI.renderInventory(this.game.state.myId);
    }

    updateQuickSlotUI() {
        this.inventoryUI.updateQuickSlotUI(this.game.state.myId);
    }

    showGroundLoot(items) {
        const modal = getEl('ground-loot-modal');
        const grid = getEl('ground-grid');
        show(modal);
        grid.innerHTML = '';

        items.forEach(loot => {
            const cell = createEl('div', { className: 'inv-slot', parent: grid });
            const type = this.game.lootSystem.getItemType(loot.itemId);
            createEl('div', {
                className: 'item-icon',
                parent: cell,
                title: loot.itemId,
                style: { backgroundColor: type === 'weapon' ? '#d65' : type === 'armor' ? '#56d' : '#5d5' }
            });
            cell.onclick = () => {
                this.game.handleInteractWithLoot(loot);
                hide(modal);
            };
        });
    }

    showNotification(text) {
        const el = getEl('loot-notification');
        if (el) {
            el.innerText = text;
            el.style.opacity = '1';
            setTimeout(() => { el.style.opacity = '0'; }, 2000);
        }
    }

    updateGoldUI() {
        const el = getEl('gold-val');
        if (el) el.innerText = this.game.playerData.gold;
    }

    updateLobbyStatus(message) {
        const el = getEl('lobby-status');
        if (el) el.innerText = message;
    }

    updateTimer(seconds) {
        const el = getEl('game-timer');
        if (el) {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            el.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        }
    }

    updateTooltip(data) {
        const now = Date.now();
        if (this.lastTooltipUpdate && now - this.lastTooltipUpdate < 50) return;
        this.lastTooltipUpdate = now;

        const tooltip = getEl('game-tooltip');
        if (!tooltip) return;

        const cam = this.game.renderSystem.camera;
        const ts = this.game.config.global.tileSize || 64;
        const scale = this.game.renderSystem.scale || 1;
        const gridX = Math.floor(((data.x / scale) + cam.x) / ts);
        const gridY = Math.floor(((data.y / scale) + cam.y) / ts);

        let content = [];

        const entityId = this.game.gridSystem.getEntityAt(gridX, gridY);
        if (entityId) {
            const stats = this.game.combatSystem.getStats(entityId);
            if (stats) {
                const name = stats.name || stats.type;
                const hpPercent = stats.maxHp > 0 ? Math.floor((stats.hp / stats.maxHp) * 100) : 0;
                const color = stats.team === 'monster' ? '#ff5555' : (entityId === this.game.state.myId ? '#55ff55' : '#55aaff');
                content.push(`<div style="font-weight:bold; color:${color}">${name}</div>`);
                content.push(`<div>HP: ${Math.ceil(stats.hp)}/${stats.maxHp} (${hpPercent}%)</div>`);
            }
        }

        const items = this.game.lootSystem.getItemsAt(gridX, gridY);
        if (items.length > 0) {
            if (content.length > 0) content.push('<div style="height:1px; background:#444; margin:4px 0;"></div>');
            items.forEach(item => {
                const config = this.game.lootSystem.getItemConfig(item.itemId);
                const name = config ? config.name : item.itemId;
                content.push(`<div style="color:#ffd700">📦 ${name} ${item.count > 1 ? `x${item.count}` : ''}</div>`);
            });
        }

        if (content.length > 0) {
            tooltip.innerHTML = content.join('');
            tooltip.style.display = 'block';
            tooltip.style.left = `${data.x + 16}px`;
            tooltip.style.top = `${data.y + 16}px`;
        } else {
            hide(tooltip);
        }
    }

    showContextMenu(data) {
        const menu = getEl('game-context-menu');
        if (!menu) return;

        menu.innerHTML = '';
        const cam = this.game.renderSystem.camera;
        const ts = this.game.config.global.tileSize || 48;
        const scale = this.game.renderSystem.scale || 1;
        const gridX = Math.floor(((data.x / scale) + cam.x) / ts);
        const gridY = Math.floor(((data.y / scale) + cam.y) / ts);

        const actions = [];

        const entityId = this.game.gridSystem.getEntityAt(gridX, gridY);
        if (entityId && entityId !== this.game.state.myId) {
            actions.push({
                label: '⚔️ Attack',
                action: () => this.game.handleInput({ type: 'TARGET_ACTION', x: gridX, y: gridY })
            });
        }

        if (this.game.gridSystem.isWalkable(gridX, gridY)) {
            actions.push({
                label: '👣 Move Here',
                action: () => {
                    const pos = this.game.gridSystem.entities.get(this.game.state.myId);
                    if (pos) {
                        const path = this.game.gridSystem.findPath(pos.x, pos.y, gridX, gridY);
                        if (path) this.game.state.autoPath = path;
                    }
                }
            });
        }

        if (actions.length === 0) return;

        actions.forEach(item => {
            const el = createEl('div', {
                content: item.label,
                parent: menu,
                style: {
                    padding: '10px 15px', cursor: 'pointer', color: '#eee',
                    borderBottom: '1px solid #333', fontSize: '14px', fontFamily: '"Germania One", cursive'
                }
            });
            el.onmouseover = () => el.style.background = '#333';
            el.onmouseout = () => el.style.background = 'transparent';
            el.onclick = (e) => {
                e.stopPropagation();
                item.action();
                hide(menu);
            };
        });

        menu.style.left = `${data.x}px`;
        menu.style.top = `${data.y}px`;
        show(menu);
    }

    hideContextMenu() {
        hide(getEl('game-context-menu'));
    }

    toggleSettingsMenu() {
        this.settingsModal.toggle();
    }

    showHumansEscaped(msg) {
        if (getEl('game-over-screen')) return;
        const ui = getEl('ui-layer');

        const screen = createEl('div', {
            id: 'game-over-screen',
            parent: ui,
            style: {
                position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', zIndex: '2000', textAlign: 'center',
                color: 'white', fontFamily: '"Germania One", cursive', pointerEvents: 'auto'
            }
        });

        screen.innerHTML = `
            <h1 style="font-size: 4rem; margin-bottom: -3rem; text-shadow: 0 0 10px #ff0000;">THE</h1>
            <h1 style="font-size: 4rem; margin-bottom: -3rem; text-shadow: 0 0 10px #ff0000;">DUNGEON</h1>
            <h1 style="font-size: 4rem; margin-bottom: 0rem; text-shadow: 0 0 10px #ff0000;">SLEEPS</h1>
            <h2 style="font-size: 2rem; margin-bottom: 2rem; color: #ccc;">${msg}</h2>
            <button id="btn-return-lobby" style="padding: 15px 30px; font-size: 1.2rem; cursor: pointer; background: #444; color: white; border: 1px solid #666;">Return to Lobby</button>
        `;
        
        const btn = screen.querySelector('#btn-return-lobby');
        if (btn) btn.onclick = () => this.game.returnToLobby();

        ['room-code-display', 'game-timer'].forEach(id => {
            const el = getEl(id);
            if (el) {
                el.style.zIndex = '2001';
                if (window.getComputedStyle(el).position === 'static') {
                    el.style.position = 'relative';
                }
            }
        });

        this.game.ticker.stop();
    }

    enableFullscreen() {
        if (window.location.host === '127.0.0.1:5500') return;

        const el = document.documentElement;
        const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (rfs) {
            rfs.call(el).catch(e => console.log("Fullscreen request failed:", e));
        }
    }
}