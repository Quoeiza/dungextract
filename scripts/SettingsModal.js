import { getEl, createEl, show, hide } from './domUtils.js';

export default class SettingsModal {
    constructor(uiSystem) {
        this.uiSystem = uiSystem;
        this.game = uiSystem.game;
        this.modal = null;
    }

    toggle() {
        if (!this.modal) {
            this.modal = createEl('div', { id: 'settings-modal', className: 'hidden', parent: getEl('ui-layer') || document.body });
        }
        
        if (this.modal.classList.contains('hidden')) {
            show(this.modal);
            this.renderContent();
        } else {
            hide(this.modal);
        }
    }

    renderContent() {
        const s = this.game.settings;
        
        this.modal.innerHTML = `
            <div class="modal-header">
                <h3>Settings</h3>
                <button id="btn-settings-close" style="padding:2px 8px;">X</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; text-align:left; padding-top:10px;">
                <div>
                    <label style="display:block; margin-bottom:4px;">Master Volume</label>
                    <input type="range" min="0" max="1" step="0.1" value="${s.masterVolume}" id="set-vol-master" style="width:100%; display:block;">
                </div>
                <div>
                    <label style="display:block; margin-bottom:4px;">Music Volume</label>
                    <input type="range" min="0" max="1" step="0.1" value="${s.musicVolume}" id="set-vol-music" style="width:100%; display:block;">
                </div>
                <div>
                    <label style="display:block; margin-bottom:4px;">SFX Volume</label>
                    <input type="range" min="0" max="1" step="0.1" value="${s.sfxVolume}" id="set-vol-sfx" style="width:100%; display:block;">
                </div>
                <hr style="width:100%; border:0; border-top:1px solid #555;">
                <label><input type="checkbox" id="set-lights" ${s.dynamicLights ? 'checked' : ''}> Dynamic Lighting</label>
                <label><input type="checkbox" id="set-shadows" ${s.shadows ? 'checked' : ''} ${!s.dynamicLights ? 'disabled' : ''}> Enable Shadows</label>
                <label><input type="checkbox" id="set-particles" ${s.particles ? 'checked' : ''}> Enable Particles</label>
                <hr style="width:100%; border:0; border-top:1px solid #555;">
                <button id="btn-quit-match">Quit to Lobby</button>
            </div>
        `;

        const update = () => {
            const lightsCb = getEl('set-lights');
            const shadowsCb = getEl('set-shadows');
            
            if (!lightsCb.checked) {
                shadowsCb.checked = false;
                shadowsCb.disabled = true;
            } else {
                shadowsCb.disabled = false;
            }

            this.game.updateSettings({
                masterVolume: parseFloat(getEl('set-vol-master').value),
                musicVolume: parseFloat(getEl('set-vol-music').value),
                sfxVolume: parseFloat(getEl('set-vol-sfx').value),
                shadows: shadowsCb.checked,
                particles: getEl('set-particles').checked,
                dynamicLights: lightsCb.checked
            });
        };

        this.modal.querySelectorAll('input').forEach(el => el.onchange = update);

        getEl('btn-settings-close').onclick = () => hide(this.modal);
        
        const quitBtn = getEl('btn-quit-match');
        if (this.game.client && this.game.client.myId) {
            quitBtn.onclick = () => this.game.returnToLobby();
        } else {
            hide(quitBtn);
        }
    }
}
