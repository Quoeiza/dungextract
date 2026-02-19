export default class UISystem {
    constructor(game) {
        this.game = game;
        this.lastTooltipUpdate = 0;
        this.injectCSS();
    }

    injectCSS() {
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@400;700&display=swap');
            :root { --steel-dark: #1a1a1a; --steel-mid: #333333; --steel-light: #555555; --rust: #8b4513; --rust-light: #cd853f; --parchment: #e6d2b5; --parchment-dark: #c2a886; --text-dark: #2b1d0e; --text-light: #e0e0e0; --gold: #ffd700; }
            body { font-family: 'Lato', sans-serif; color: var(--text-light); margin: 0; overflow: hidden; background: #050505; }
            h1, h2, h3, button, .header-font { font-family: 'Cinzel', serif; }
            #ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
            #ui-layer > * { pointer-events: auto; }
            button { background: linear-gradient(180deg, var(--steel-light), var(--steel-mid)); border: 2px solid var(--steel-dark); border-bottom: 4px solid var(--steel-dark); color: var(--parchment); padding: 10px 20px; font-size: 16px; font-weight: bold; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: transform 0.1s, filter 0.1s; box-shadow: 0 4px 6px rgba(0,0,0,0.5); text-shadow: 1px 1px 0 #000; }
            button:hover { filter: brightness(1.2); }
            button:active { transform: translateY(2px); border-bottom-width: 2px; }
            input, select { background: rgba(0, 0, 0, 0.6); border: 1px solid var(--steel-light); color: var(--parchment); padding: 10px; font-family: 'Lato', sans-serif; border-radius: 2px; }
            #lobby-screen { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; background-color: #111; z-index: 100; }
            #lobby-screen h1 { font-size: 4rem; color: var(--rust-light); text-shadow: 0 0 10px var(--rust), 2px 2px 0 #000; margin-bottom: 20px; }
            #player-stats { font-size: 1.2rem; color: var(--gold); margin-bottom: 20px; background: rgba(0,0,0,0.7); padding: 5px 15px; border-radius: 4px; border: 1px solid var(--rust); }
            #btn-inventory-toggle { position: absolute; bottom: 25px !important; right: 25px !important; top: auto !important; left: auto !important; width: 80px; height: 80px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, var(--rust-light), var(--rust)); border: 3px solid #3e2723; box-shadow: 0 5px 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 0; }
            #btn-inventory-toggle svg { width: 40px; height: 40px; color: #f4e4bc; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.8)); }
            #btn-inventory-toggle:hover { transform: scale(1.1) rotate(-5deg); }
            #inventory-modal, #ground-loot-modal { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--parchment); border: 6px solid var(--steel-mid); border-radius: 8px; padding: 20px; color: var(--text-dark); box-shadow: 0 0 0 2px var(--rust), 0 20px 50px rgba(0,0,0,0.9); min-width: 300px; max-width: 90%; }
            #inventory-grid, #ground-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 15px 0; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.2); }
            .inv-slot, .equip-slot { width: 48px; height: 48px; background: rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.3); border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.1s; }
            .inv-slot:hover, .equip-slot:hover { background: rgba(0,0,0,0.25); border-color: var(--rust); }
            #game-timer { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); font-size: 24px; font-family: 'Cinzel', serif; font-weight: bold; text-shadow: 2px 2px 0 #000; background: rgba(0,0,0,0.6); padding: 5px 15px; border: 1px solid var(--steel-light); border-radius: 4px; }
            #room-code-display { position: absolute; top: 20px; right: 20px; font-family: 'Cinzel', serif; color: var(--text-light); padding: 5px 10px; background: transparent !important; }
            #loot-notification { position: absolute; top: 100px; left: 50%; transform: translateX(-50%); font-family: 'Cinzel', serif; color: var(--gold); font-size: 20px; text-shadow: 1px 1px 0 #000; pointer-events: none; transition: opacity 0.5s; opacity: 0; z-index: 20; }
            #stats-bar { position: absolute; top: 20px; left: 20px; display: flex; flex-direction: column; gap: 5px; font-family: 'Cinzel', serif; text-shadow: 1px 1px 0 #000; }
            #quick-slots-hud { position: absolute; bottom: 25px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; }
            .quick-slot-hud-item { width: 56px; height: 56px; background: rgba(0,0,0,0.7); border: 2px solid var(--steel-light); border-radius: 4px; position: relative; display: flex; align-items: center; justify-content: center; }
            .key-label { position: absolute; top: -8px; left: -8px; background: var(--rust); color: white; font-size: 10px; padding: 2px 5px; border-radius: 3px; border: 1px solid #000; }
            .hidden { display: none !important; }
        `;
        document.head.appendChild(style);
    }

    setupLobby() {
        const uiLayer = document.getElementById('ui-layer');
        const lobby = document.createElement('div');
        lobby.id = 'lobby-screen';
        
        lobby.style.backgroundImage = "url('./assets/images/ui/bg.jpg')";
        lobby.style.backgroundSize = "cover";
        lobby.style.backgroundPosition = "center";
        lobby.style.backgroundRepeat = "no-repeat";

        lobby.innerHTML = `
            <h1>Cold Coin</h1>
            <div id="player-stats">Gold: ${this.game.playerData.gold} | Extractions: ${this.game.playerData.extractions || 0}</div>
            <input type="text" id="player-name" placeholder="Enter Name" value="${this.game.playerData.name}" />
            <select id="class-select">
                <option value="Fighter">Fighter (Heal)</option>
                <option value="Rogue">Rogue (Stealth)</option>
                <option value="Barbarian">Barbarian (Rage)</option>
            </select>
            <button id="btn-host">Host Game</button>
            <div style="display:flex; gap:10px;">
                <input type="text" id="room-code-input" placeholder="Room Code" />
                <button id="btn-join">Join Game</button>
            </div>
        `;
        uiLayer.appendChild(lobby);

        document.getElementById('btn-host').onclick = () => {
            this.game.playerData.name = document.getElementById('player-name').value || 'Host';
            this.game.playerData.class = document.getElementById('class-select').value;
            this.game.database.savePlayer({ name: this.game.playerData.name });
            this.game.startGame(true);
        };

        document.getElementById('btn-join').onclick = () => {
            const code = document.getElementById('room-code-input').value;
            if (!code) return alert("Enter a room code");
            this.game.playerData.name = document.getElementById('player-name').value || 'Client';
            this.game.playerData.class = document.getElementById('class-select').value;
            this.game.database.savePlayer({ name: this.game.playerData.name });
            this.game.startGame(false, code);
        };
    }

    setupUI() {
        ['room-code-display'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('hidden');
        });

        const statsBar = document.getElementById('stats-bar');
        const invModal = document.getElementById('inventory-modal');
        if (statsBar && invModal) {
            const grid = document.getElementById('inventory-grid');
            if (grid) invModal.insertBefore(statsBar, grid);
            else invModal.prepend(statsBar);
            
            statsBar.style.position = 'static';
            statsBar.style.flexDirection = 'row';
            statsBar.style.justifyContent = 'space-between';
            statsBar.style.marginBottom = '10px';
            statsBar.style.borderBottom = '1px solid #555';
            statsBar.style.paddingBottom = '5px';
            statsBar.style.width = '100%';
            statsBar.classList.remove('hidden');
        }

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer && !document.getElementById('game-timer')) {
            const timer = document.createElement('div');
            timer.id = 'game-timer';
            uiLayer.appendChild(timer);
        }

        let btnToggle = document.getElementById('btn-inventory-toggle');
        if (!btnToggle) {
            btnToggle = document.createElement('button');
            btnToggle.id = 'btn-inventory-toggle';
        }
        uiLayer.appendChild(btnToggle);
        btnToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;

        const modal = document.getElementById('inventory-modal');
        const btnClose = document.getElementById('btn-inventory-close');

        const toggleInv = () => {
            modal.classList.toggle('hidden');
            if (!modal.classList.contains('hidden')) {
                this.renderInventory();
            }
        };

        if (btnToggle) btnToggle.onclick = toggleInv;
        if (btnClose) btnClose.onclick = toggleInv;

        const btnGroundClose = document.getElementById('btn-ground-close');
        if (btnGroundClose) btnGroundClose.onclick = () => document.getElementById('ground-loot-modal').classList.add('hidden');

        if (!document.getElementById('loot-notification')) {
            const notif = document.createElement('div');
            notif.id = 'loot-notification';
            uiLayer.appendChild(notif);
        }

        if (!document.getElementById('quick-slots-hud')) {
            const hud = document.createElement('div');
            hud.id = 'quick-slots-hud';
            uiLayer.appendChild(hud);
        }

        this.setupCanvasDrop();
        this.setupSlotDrop(document.getElementById('slot-weapon'), 'weapon');
        this.setupSlotDrop(document.getElementById('slot-armor'), 'armor');

        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            document.getElementById('btn-resume').onclick = () => this.toggleSettingsMenu();
            document.getElementById('btn-settings').onclick = () => alert("Settings coming soon!");
            document.getElementById('btn-quit').onclick = () => location.reload();
        }

        this.createInteractionUI();
    }

    createInteractionUI() {
        const uiLayer = document.getElementById('ui-layer') || document.body;

        if (!document.getElementById('game-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.id = 'game-tooltip';
            Object.assign(tooltip.style, {
                position: 'absolute',
                padding: '8px',
                background: 'rgba(10, 10, 10, 0.9)',
                color: '#eee',
                border: '1px solid #444',
                borderRadius: '4px',
                pointerEvents: 'none',
                display: 'none',
                zIndex: '2000',
                fontSize: '12px',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            });
            uiLayer.appendChild(tooltip);
        }

        if (!document.getElementById('game-context-menu')) {
            const menu = document.createElement('div');
            menu.id = 'game-context-menu';
            Object.assign(menu.style, {
                position: 'absolute',
                background: '#1a1a1a',
                border: '1px solid #555',
                minWidth: '140px',
                zIndex: '2001',
                display: 'none',
                flexDirection: 'column',
                boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
            });
            uiLayer.appendChild(menu);

            window.addEventListener('click', () => {
                menu.style.display = 'none';
            });
        }
    }

    setupCanvasDrop() {
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data && data.itemId) {
                this.game.handleDropItem(data.itemId, data.source);
            }
        });
    }

    setupSlotDrop(element, slotName) {
        if (!element) return;
        element.addEventListener('dragover', (e) => e.preventDefault());
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const targetSlot = slotName || element.dataset.slot;
            if (data && data.itemId) {
                this.game.handleEquipItem(data.itemId, targetSlot);
            }
        });
    }

    renderInventory() {
        const grid = document.getElementById('inventory-grid');
        const inv = this.game.lootSystem.getInventory(this.game.state.myId);
        const equip = this.game.lootSystem.getEquipment(this.game.state.myId);

        grid.innerHTML = '';
        for (let i = 0; i < 15; i++) {
            const cell = document.createElement('div');
            cell.className = 'inv-slot';
            
            if (inv[i]) {
                const item = inv[i];
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                const type = this.game.lootSystem.getItemType(item.itemId);
                icon.style.backgroundColor = type === 'weapon' ? '#d65' : type === 'armor' ? '#56d' : '#5d5';
                
                const config = this.game.lootSystem.getItemConfig(item.itemId);
                let tooltip = config ? config.name : item.itemId;
                if (config) {
                    if (config.damage) tooltip += `\nDamage: ${config.damage}`;
                    if (config.defense) tooltip += `\nDefense: ${config.defense}`;
                    if (config.effect) tooltip += `\nEffect: ${config.effect} (${config.value})`;
                }
                icon.title = tooltip;

                if (item.count > 1) {
                    const countEl = document.createElement('span');
                    countEl.className = 'item-count';
                    countEl.innerText = item.count;
                    icon.appendChild(countEl);
                }
                
                cell.draggable = true;
                cell.appendChild(icon);

                cell.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: item.itemId, source: 'inventory' }));
                });
            }
            grid.appendChild(cell);
        }

        const renderSlot = (slotName) => {
            const el = document.getElementById(`slot-${slotName}`);
            el.innerHTML = '';
            const item = equip[slotName];
            if (item) {
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.style.backgroundColor = slotName.startsWith('quick') ? '#5d5' : (slotName === 'weapon' ? '#d65' : '#56d');
                
                const config = this.game.lootSystem.getItemConfig(item.itemId);
                let tooltip = config ? config.name : item.itemId;
                if (config) {
                    if (config.damage) tooltip += `\nDamage: ${config.damage}`;
                    if (config.defense) tooltip += `\nDefense: ${config.defense}`;
                }
                icon.title = tooltip;

                if (item.count > 1) {
                    const countEl = document.createElement('span');
                    countEl.className = 'item-count';
                    countEl.innerText = item.count;
                    icon.appendChild(countEl);
                }

                el.appendChild(icon);
                
                el.draggable = true;
                el.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: item.itemId, source: slotName }));
                });
            } else {
                el.draggable = false;
            }
        };

        renderSlot('weapon');
        renderSlot('armor');
        
        const slotsContainer = document.querySelector('.equipment-slots');
        if (!document.getElementById('slot-quick1')) {
            const quickContainer = document.createElement('div');
            quickContainer.style.display = 'flex';
            quickContainer.style.gap = '5px';
            quickContainer.innerHTML = `
                <div class="slot-container"><div id="slot-quick1" class="equip-slot" data-slot="quick1"></div><span>1</span></div>
                <div class="slot-container"><div id="slot-quick2" class="equip-slot" data-slot="quick2"></div><span>2</span></div>
                <div class="slot-container"><div id="slot-quick3" class="equip-slot" data-slot="quick3"></div><span>3</span></div>
            `;
            slotsContainer.appendChild(quickContainer);
            
            this.setupSlotDrop(document.getElementById('slot-quick1'), 'quick1');
            this.setupSlotDrop(document.getElementById('slot-quick2'), 'quick2');
            this.setupSlotDrop(document.getElementById('slot-quick3'), 'quick3');
        }
        renderSlot('quick1');
        renderSlot('quick2');
        renderSlot('quick3');
    }

    updateQuickSlotUI() {
        const hud = document.getElementById('quick-slots-hud');
        if (!hud) return;
        
        const equip = this.game.lootSystem.getEquipment(this.game.state.myId);
        let html = '';
        
        for (let i = 1; i <= 3; i++) {
            const item = equip[`quick${i}`];
            html += `
                <div class="quick-slot-hud-item">
                    <span class="key-label">${i}</span>
                    ${item ? `<div class="item-icon" style="background-color:#5d5;">${item.count > 1 ? `<span class="item-count">${item.count}</span>` : ''}</div>` : ''}
                </div>`;
        }
        hud.innerHTML = html;
    }

    showGroundLoot(items) {
        const modal = document.getElementById('ground-loot-modal');
        const grid = document.getElementById('ground-grid');
        modal.classList.remove('hidden');
        grid.innerHTML = '';

        items.forEach(loot => {
            const cell = document.createElement('div');
            cell.className = 'inv-slot';
            
            const icon = document.createElement('div');
            icon.className = 'item-icon';
            const type = this.game.lootSystem.getItemType(loot.itemId);
            icon.style.backgroundColor = type === 'weapon' ? '#d65' : type === 'armor' ? '#56d' : '#5d5';
            icon.title = loot.itemId;
            
            cell.onclick = () => {
                this.game.handleInteractWithLoot(loot);
                modal.classList.add('hidden');
            };

            cell.appendChild(icon);
            grid.appendChild(cell);
        });
    }

    showNotification(text) {
        const el = document.getElementById('loot-notification');
        if (el) {
            el.innerText = text;
            el.style.opacity = '1';
            setTimeout(() => { el.style.opacity = '0'; }, 2000);
        }
    }

    updateGoldUI() {
        const el = document.getElementById('gold-val');
        if (el) el.innerText = this.game.playerData.gold;
    }

    updateTooltip(data) {
        const now = Date.now();
        if (this.lastTooltipUpdate && now - this.lastTooltipUpdate < 50) return;
        this.lastTooltipUpdate = now;

        const tooltip = document.getElementById('game-tooltip');
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
            tooltip.style.display = 'none';
        }
    }

    showContextMenu(data) {
        const menu = document.getElementById('game-context-menu');
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
            const el = document.createElement('div');
            el.innerText = item.label;
            Object.assign(el.style, {
                padding: '10px 15px',
                cursor: 'pointer',
                color: '#eee',
                borderBottom: '1px solid #333',
                fontSize: '14px',
                fontFamily: 'sans-serif'
            });
            el.onmouseover = () => el.style.background = '#333';
            el.onmouseout = () => el.style.background = 'transparent';
            el.onclick = (e) => {
                e.stopPropagation();
                item.action();
                menu.style.display = 'none';
            };
            menu.appendChild(el);
        });

        menu.style.left = `${data.x}px`;
        menu.style.top = `${data.y}px`;
        menu.style.display = 'flex';
    }

    hideContextMenu() {
        const ctxMenu = document.getElementById('game-context-menu');
        if (ctxMenu) ctxMenu.style.display = 'none';
    }

    toggleSettingsMenu() {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.toggle('hidden');
    }

    showGameOver(msg) {
        const ui = document.getElementById('ui-layer');

        const screen = document.createElement('div');
        screen.id = 'game-over-screen';
        Object.assign(screen.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '2000',
            color: 'white',
            fontFamily: 'sans-serif',
            pointerEvents: 'auto'
        });

        screen.innerHTML = `
            <h1 style="font-size: 4rem; margin-bottom: 1rem; text-shadow: 0 0 10px #ff0000;">GAME OVER</h1>
            <h2 style="font-size: 2rem; margin-bottom: 2rem; color: #ccc;">${msg}</h2>
            <button id="btn-return-lobby" style="padding: 15px 30px; font-size: 1.2rem; cursor: pointer; background: #444; color: white; border: 1px solid #666;">Return to Lobby</button>
        `;
        
        ui.appendChild(screen);
        
        document.getElementById('btn-return-lobby').onclick = () => location.reload();

        ['room-code-display', 'game-timer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.zIndex = '2001';
                if (window.getComputedStyle(el).position === 'static') {
                    el.style.position = 'relative';
                }
            }
        });

        this.game.gameLoop.stop();
    }
}