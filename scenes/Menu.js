export default class Menu extends Phaser.Scene {
    constructor() {
      super("menu");
    }
  

    
    preload() {
      this.load.audio("select", "./public/assets/retroSelect.mp3")
      this.load.audio("menuMusic", "./public/assets/menuMusic.ogg")
      this.load.plugin('rexcrtpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcrtpipelineplugin.min.js', true);
      this.load.plugin('rexglowfilterpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexglowfilterpipelineplugin.min.js', true);    
    }

    create() {
      //SFX
      this.selectSound = this.sound.add("select", {volume: .1}); //con objeto de configuracion para que no me rompa el oido
      if(this.registry.get("levelMusic")){
        const music = this.registry.get("levelMusic");
        if (music && music.isPlaying) {
          music.stop();
          this.registry.remove("levelMusic"); // Para que pueda reproducirse otra vez si volvemos
        }
      }
      // Verificamos si ya existe la música global
      if (!this.registry.get("menuMusic")) {
        const music = this.sound.add("menuMusic", { loop: true, volume: 0 });
        music.play();

        // Fade-in
        this.tweens.add({
          targets: music,
          volume: 0.1,
          duration: 5000,
          ease: "Linear"
        });

        this.registry.set("menuMusic", music); // La guardamos para evitar duplicados
      }
      
      //EFFECTS
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

      this.nameInput = this.add.dom(400, 275, 'input', {
        type: 'text',
        placeholder: 'Name',
        fontSize: '24px',
        padding: '10px',
        width: '200px',
        textAlign: 'center'
      });
      
      // Detectar tecla SPACE solo si hay un nombre
      this.nameInput.node.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          const playerName = this.nameInput.node.value.trim();
          if (playerName) {
            this.nameInput.destroy();              
            this.registry.set("playerName", playerName);
            this.registry.set("levelOfGame", 1);
            this.registry.set("playerScore", 0);
            this.selectSound.play();

            const shopItems = [
              { id: 1, name: "Shield", cost: 150, description: "Te protege del próximo hit" },
              { id: 2, name: "Freeze", cost: 150, description: "Automáticamente congela a los círculos durante 0.5s cada 5s" },
              { id: 3, name: "Speed", cost: 150, description: "Aumenta ligeramente la velocidad del cuadrado" },
              { id: 4, name: "Size", cost: 150, description: "Reduce ligeramente el tamaño del cuadrado" },
              { id: 5, name: "Bomba", cost: 150, description: "Elimina todos los proyectiles del mapa" }
            ];
            this.registry.set("shopItems", shopItems);
            this.registry.set("ownedItems", []);

            const music = this.registry.get("menuMusic");
            if (music && music.isPlaying) {
              music.stop();
              this.registry.remove("menuMusic");
            }
            window.removeEventListener('keydown', this.handleEscape);
            this.scene.start("game");
          } else {
            this.selectSound.play();
            alert("Please, enter a name.");
          }
        }
      });
      this.handleEscape = (event) => {
        if (event.key === 'Escape') {
          if (this.nameInput && !this.nameInput.destroyed) {
            this.selectSound.play();
            this.nameInput.destroy();
            window.removeEventListener('keydown', this.handleEscape);
            this.scene.start("scoreboard");
          }
        }
      };
      window.addEventListener('keydown', this.handleEscape);

      //BALAS DECORATIVAS
      let graphicsRed = this.make.graphics({ x: 0, y: 0, add: false });
      graphicsRed.fillStyle(0xff0000, 1);
      graphicsRed.fillCircle(10, 10, 10); // círculo de radio 10 en (10,10)
      graphicsRed.generateTexture("redWallCircle", 20, 20); // 20x20 es el tamaño total
      graphicsRed.destroy(); // ya no lo necesitamos
      let graphicsYellow = this.make.graphics({ x: 0, y: 0, add: false });
      graphicsYellow.fillStyle(0xffff00, 1);
      graphicsYellow.fillCircle(10, 10, 10); // círculo de radio 10 en (10,10)
      graphicsYellow.generateTexture("yellowWallCircle", 20, 20); // 20x20 es el tamaño total
      graphicsYellow.destroy(); // ya no lo necesitamos
      let graphicsGreen = this.make.graphics({ x: 0, y: 0, add: false });
      graphicsGreen.fillStyle(0x00ff00, 1);
      graphicsGreen.fillCircle(10, 10, 10); // círculo de radio 10 en (10,10)
      graphicsGreen.generateTexture("greenWallCircle", 20, 20); // 20x20 es el tamaño total
      graphicsGreen.destroy(); // ya no lo necesitamos
      let graphicsPurple = this.make.graphics({ x: 0, y: 0, add: false });
      graphicsPurple.fillStyle(0xaa00ff, 1);
      graphicsPurple.fillCircle(10, 10, 10); // círculo de radio 10 en (10,10)
      graphicsPurple.generateTexture("purpleWallCircle", 20, 20); // 20x20 es el tamaño total
      graphicsPurple.destroy(); // ya no lo necesitamos
      let graphicsWhite = this.make.graphics({ x: 0, y: 0, add: false });
      graphicsWhite.fillStyle(0xffffff, 1);
      graphicsWhite.fillCircle(10, 10, 10); // círculo de radio 10 en (10,10)
      graphicsWhite.generateTexture("whiteWallCircle", 20, 20); // 20x20 es el tamaño total
      graphicsWhite.destroy(); // ya no lo necesitamos
      let graphicsBlue = this.make.graphics({ x: 0, y: 0, add: false });
      graphicsBlue.fillStyle(0x0000ff, 1);
      graphicsBlue.fillCircle(10, 10, 10); // círculo de radio 10 en (10,10)
      graphicsBlue.generateTexture("blueWallCircle", 20, 20); // 20x20 es el tamaño total
      graphicsBlue.destroy(); // ya no lo necesitamos

      this.menuBullets = this.physics.add.group();

      this.time.addEvent({
        delay: 500,
        callback: () => {
          const bullet = this.spawnMenuBullet();
        },
        callbackScope: this,
        loop: true
      });

      //textos
      this.add.text(400, 200, "DODGE", {
        fontFamily: 'Saira',
        fontSize: "64px",
        fill: "#ffffff",
      }).setOrigin(0.5);
  
      this.add.text(400, 350, "ENTER TO START", {
        fontFamily: 'Saira',
        fontSize: "24px",
        fill: "#ffffff",
      }).setOrigin(0.5);
      this.add.text(400, 420, "ESC TO SCOREBOARD", {
        fontFamily: 'Saira',
        fontSize: "24px",
        fill: "#ffffff",
      }).setOrigin(0.5);


    }
    shutdown() {
      // Se ejecuta cuando la escena se apaga (por ejemplo al cambiar de escena)
      window.removeEventListener('keydown', this.handleEscape);
    }

    destroy() {
      // Se ejecuta cuando la escena se destruye completamente
      window.removeEventListener('keydown', this.handleEscape);
    }

    spawnMenuBullet() {
      const side = Phaser.Math.Between(0, 3);
      let x, y, dirX, dirY;

      switch (side) {
        case 0: // top
          x = Phaser.Math.Between(0, 800);
          y = -10;
          dirX = Phaser.Math.FloatBetween(-0.5, 0.5);
          dirY = 1;
          break;
        case 1: // bottom
          x = Phaser.Math.Between(0, 800);
          y = 610;
          dirX = Phaser.Math.FloatBetween(-0.5, 0.5);
          dirY = -1;
          break;
        case 2: // left
          x = -10;
          y = Phaser.Math.Between(0, 600);
          dirX = 1;
          dirY = Phaser.Math.FloatBetween(-0.5, 0.5);
          break;
        case 3: // right
          x = 810;
          y = Phaser.Math.Between(0, 600);
          dirX = -1;
          dirY = Phaser.Math.FloatBetween(-0.5, 0.5);
          break;
      }

        // Lista de nombres de texturas
        const textures = [
          "redWallCircle",
          "yellowWallCircle",
          "greenWallCircle",
          "purpleWallCircle",
          "whiteWallCircle",
          "blueWallCircle"
        ];

      const randomTexture = Phaser.Utils.Array.GetRandom(textures);

      const bullet = this.menuBullets.create(x, y, randomTexture);
      bullet.setScale(1);
      bullet.setAlpha(0.6);
      bullet.setVelocity(dirX * 100, dirY * 100);
      bullet.setDepth(-1); // Detrás del texto
      bullet.body.allowGravity = false;

      // Auto-destruir después de 10 segundos para no llenar memoria
      this.time.delayedCall(10000, () => {
        if (bullet && bullet.active) bullet.destroy();
      });

      return bullet;
    }
  }