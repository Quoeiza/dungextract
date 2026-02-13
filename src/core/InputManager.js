import EventEmitter from './EventEmitter.js';

export default class InputManager extends EventEmitter {
    constructor(globalConfig) {
        super();
        this.keys = {};
        
        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleInput(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mobile / UI Button bindings
        const bindBtn = (id, code) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleInput(code);
                });
                el.addEventListener('click', (e) => {
                    this.handleInput(code);
                });
            }
        };

        bindBtn('btn-up', 'ArrowUp');
        bindBtn('btn-down', 'ArrowDown');
        bindBtn('btn-left', 'ArrowLeft');
        bindBtn('btn-right', 'ArrowRight');
        bindBtn('btn-attack', 'Space');
        bindBtn('btn-pickup', 'KeyR');
        bindBtn('btn-ability', 'KeyF');
    }

    handleInput(code) {
        let intent = null;

        switch(code) {
            // Movement & Attack:
            // We restore the event-based triggers here to ensure instant response to single taps.
            // The polling in main.js will handle the "held" state for continuous movement.
            case 'ArrowUp':
            case 'KeyW':
            case 'Numpad8':
                intent = { type: 'MOVE', direction: { x: 0, y: -1 } };
                break;
            case 'ArrowDown':
            case 'KeyS':
            case 'Numpad2':
                intent = { type: 'MOVE', direction: { x: 0, y: 1 } };
                break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'Numpad4':
                intent = { type: 'MOVE', direction: { x: -1, y: 0 } };
                break;
            case 'ArrowRight':
            case 'KeyD':
            case 'Numpad6':
                intent = { type: 'MOVE', direction: { x: 1, y: 0 } };
                break;
            // Diagonals
            case 'Numpad7':
                intent = { type: 'MOVE', direction: { x: -1, y: -1 } };
                break;
            case 'Numpad9':
                intent = { type: 'MOVE', direction: { x: 1, y: -1 } };
                break;
            case 'Numpad1':
                intent = { type: 'MOVE', direction: { x: -1, y: 1 } };
                break;
            case 'Numpad3':
                intent = { type: 'MOVE', direction: { x: 1, y: 1 } };
                break;
            case 'Space':
            case 'Enter':
                intent = { type: 'ATTACK' };
                break;
            
            case 'KeyR':
                intent = { type: 'PICKUP' };
                break;
            case 'KeyF':
                intent = { type: 'ABILITY' };
                break;
            case 'Digit1':
                intent = { type: 'USE_ITEM', slot: 'quick1' };
                break;
            case 'Digit2':
                intent = { type: 'USE_ITEM', slot: 'quick2' };
                break;
            case 'Digit3':
                intent = { type: 'USE_ITEM', slot: 'quick3' };
                break;
            case 'Escape':
                intent = { type: 'TOGGLE_MENU' };
                break;
        }

        if (intent) {
            this.emit('intent', intent);
        }
    }

    getMovementIntent() {
        let x = 0;
        let y = 0;

        if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Numpad8']) y -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['Numpad2']) y += 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['Numpad4']) x -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['Numpad6']) x += 1;
        
        // Diagonals
        if (this.keys['Numpad7']) { x -= 1; y -= 1; }
        if (this.keys['Numpad9']) { x += 1; y -= 1; }
        if (this.keys['Numpad1']) { x -= 1; y += 1; }
        if (this.keys['Numpad3']) { x += 1; y += 1; }
        
        // Clamp to ensure valid direction vector (-1, 0, 1)
        const dir = { x: Math.sign(x), y: Math.sign(y) };

        if (dir.x !== 0 || dir.y !== 0) {
            return { type: 'MOVE', direction: dir };
        }
        return null;
    }

    getAttackIntent() {
        if (this.keys['Space'] || this.keys['Enter']) {
            return { type: 'ATTACK' };
        }
        return null;
    }
}