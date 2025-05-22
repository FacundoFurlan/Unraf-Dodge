import Shop from "./scenes/Shop.js";
import Game from "./scenes/Game.js";
import Menu from "./scenes/Menu.js";
import Scoreboard from "./scenes/Scoreboard.js";

// Create a new Phaser config object
const config = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 800,
      height: 600,
    },
    max: {
      width: 1600,
      height: 1200,
    },
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  dom: {
    createContainer: true      // habilita contenedor DOM dentro del canvas
  },
  // List of scenes to load
  // Only the first scene will be shown
  // Remember to import the scene before adding it to the list
  scene: [Menu, Game, Scoreboard, Shop],
};

// Create a new Phaser game instance
window.game = new Phaser.Game(config);