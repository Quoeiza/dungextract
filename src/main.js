import Game from './core/GameLoop.js';

const game = new Game();
window.game = game;
window.onload = () => game.init();