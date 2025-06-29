export default class Scoreboard extends Phaser.Scene {
    constructor() {
      super("scoreboard");
    }
  
    preload() {
      this.load.audio("select", "./public/assets/retroSelect.mp3")
      this.load.plugin('rexcrtpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcrtpipelineplugin.min.js', true);
      this.load.plugin('rexglowfilterpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexglowfilterpipelineplugin.min.js', true);    
    }
  
    create() {
      this.selectSound = this.sound.add("select", {volume: .1}); //con objeto de configuracion para que no me rompa el oido

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
      
      
      this.loading = true;
        // Texto de "Cargando..."
      this.loadingText = this.add.text(400, 300, "Loading scores...", {
        fontFamily: 'Saira',
        fontSize: "24px",
        fill: "#aaaaaa",
      }).setOrigin(0.5);

      // Título
      this.titleText = this.add.text(400, 100, "TOP 3 SCOREBOARD", {
        fontFamily: 'Saira',
        fontSize: "32px",
        fill: "#ffffff",
      }).setOrigin(0.5).setVisible(false);
  
      // Botón para volver al menú
      this.menuText = this.add.text(400, 500, "ESC TO MENU", {
        fontFamily: 'Saira',
        fontSize: "24px",
        fill: "#ffffff",
      }).setOrigin(0.5).setVisible(false);
  
      this.input.keyboard.on("keydown-ESC", () => {
        if(!this.loading){
          this.selectSound.play();
          this.scene.start("menu");
        }
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
          this.add.text(400, yPosition, `${index + 1}. ${score.name} got ${score.score} and reached ${score.lvl}`, {
            fontFamily: 'Saira',
            fontSize: "24px",
            fill: "#ffffff",
          }).setOrigin(0.5);
          yPosition += 70;
        });
        this.loading = false;
        this.loadingText.destroy(); // Oculta mensaje de carga
        this.titleText.setVisible(true);
        this.menuText.setVisible(true);
      } catch (error) {
        this.loading = false;
        this.loadingText.destroy(); // Oculta mensaje de carga
        console.error("Error fetching scores:", error);
        this.add.text(400, 300, "Error loading scoreboard", {
          fontFamily: 'Saira',
          fontSize: "24px",
          fill: "#ffffff",
        }).setOrigin(0.5);
      }
    }
  }