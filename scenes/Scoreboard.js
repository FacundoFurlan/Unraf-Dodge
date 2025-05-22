export default class Scoreboard extends Phaser.Scene {
    constructor() {
      super("scoreboard");
    }
  
    preload() {
      this.load.plugin('rexcrtpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcrtpipelineplugin.min.js', true);
      this.load.plugin('rexglowfilterpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexglowfilterpipelineplugin.min.js', true);    
    }
  
    create() {
      const postFxPlugin = this.plugins.get('rexcrtpipelineplugin');
      const glowPlugin  = this.plugins.get('rexglowfilterpipelineplugin');

      // Espera al evento prerender de la escena, que ocurre justo antes del primer dibujado
      this.events.once('prerender', () => {
          postFxPlugin.add(this.cameras.main, {
              warpX: 0.75,
              warpY: 0.75,
              scanLineStrength: 0.2,
              scanLineWidth: 1100
          });
          glowPlugin.add(this.cameras.main, {
              intensity: 0.02,
              distance: 20,
              outerStrength: 2,
              innerStrength: 0,
              color: 0xffff00
          });
      });



      // Título
      this.add.text(400, 100, "TOP 3 SCOREBOARD", {
          fontSize: "32px",
          fill: "#ffffff",
      }).setOrigin(0.5);
  
      // Botón para volver al menú
      this.add.text(400, 500, "ESC TO MENU", {
      fontSize: "24px",
      fill: "#ffffff",
      }).setOrigin(0.5);
  
      this.input.keyboard.on("keydown-ESC", () => {
          this.scene.start("menu");
      });
      // Obtener los puntajes del back-end (API)
      this.fetchScores();
    }
  
    async fetchScores() {
      try {
        const response = await fetch("https://dodge-back.vercel.app/api/scores"); // Cambia esta URL por la de tu servidor
        const data = await response.json();
        console.log(data)
  
        // Mostrar los puntajes
        let yPosition = 225;
        data.forEach((score, index) => {
          this.add.text(400, yPosition, `${index + 1}. ${score.name}: ${score.score}`, {
            fontSize: "24px",
            fill: "#ffffff",
          }).setOrigin(0.5);
          yPosition += 70;
        });
      } catch (error) {
        console.error("Error fetching scores:", error);
        this.add.text(400, 300, "Error loading scoreboard", {
          fontSize: "24px",
          fill: "#ffffff",
        }).setOrigin(0.5);
      }
    }
  }