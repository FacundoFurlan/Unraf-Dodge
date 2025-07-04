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
      this.input.keyboard.manager.enabled = true;
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
      this.titleText = this.add.text(400, 100, "TOP 5 SCOREBOARD", {
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
          this.input.keyboard.manager.enabled = false;
          this.selectSound.play();
          this.scene.start("menu");
        }
      });
      // Obtener los puntajes del back-end (API)
      this.fetchScores();
    }
  
  async fetchScores() {
    try {
      const response = await fetch("https://dodge-back.vercel.app/api/scores");
      const data = await response.json();

      this.loading = false;
      this.loadingText.destroy();

      const texts = [];

      // Título (1)
      const title = this.add.text(400, 0, "Top BEST Scores", {
        fontFamily: 'Saira',
        fontSize: "32px",
        fill: "#ffffff",
      }).setOrigin(0.5);
      texts.push(title);

      // Puntajes (máximo 5)
      const maxScores = 5;
      for (let i = 0; i < Math.min(data.length, maxScores); i++) {
        const score = data[i];
        const scoreText = this.add.text(400, 0, `${i + 1}. ${score.name} got ${score.score} and reached ${score.lvl}`, {
          fontFamily: 'Saira',
          fontSize: "24px",
          fill: "#ffffff",
        }).setOrigin(0.5);
        texts.push(scoreText);
      }

      // Menú (7)
      const menuText = this.add.text(400, 0, "[Press ESC to return to menu]", {
        fontFamily: 'Saira',
        fontSize: "16px",
        fill: "#fff",
      }).setOrigin(0.5);
      texts.push(menuText);

      // Distribuir verticalmente según el tamaño real del canvas
      const screenHeight = this.scale.height;
      const screenWidth = this.scale.width;

      const topMargin = 100;
      const bottomMargin = 100;
      const usableHeight = screenHeight - topMargin - bottomMargin;

      const spacing = usableHeight / (texts.length - 1);

      texts.forEach((textObj, index) => {
        const y = topMargin + spacing * index;
        textObj.setPosition(screenWidth / 2, y);
      });

    } catch (error) {
      this.loading = false;
      this.loadingText.destroy();
      console.error("Error fetching scores:", error);
      this.add.text(400, 300, "Error loading scoreboard", {
        fontFamily: 'Saira',
        fontSize: "24px",
        fill: "#ffffff",
      }).setOrigin(0.5);
    }
  }
  }