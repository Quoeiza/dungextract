import GameLoop from './GameLoop.js';

const game = new GameLoop();
window.game = game;
window.onload = () => game.init();