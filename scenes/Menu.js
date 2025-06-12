export default class Menu extends Phaser.Scene {
    constructor() {
      super("menu");
    }
  
    preload() {
      this.load.audio("select", "./public/assets/retroSelect.mp3")
      this.load.plugin('rexcrtpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcrtpipelineplugin.min.js', true);
      this.load.plugin('rexglowfilterpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexglowfilterpipelineplugin.min.js', true);    
    }
  
    create() {
      //SFX
      this.selectSound = this.sound.add("select", {volume: .1}); //con objeto de configuracion para que no me rompa el oido
      
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
      this.input.keyboard.on("keydown-ENTER", () => {
        const playerName = this.nameInput.node.value.trim();
      if (playerName) {
          this.nameInput.destroy();              // quita el DOM Element
          this.registry.set("playerName", playerName);
          this.registry.set("levelOfGame", 1);
          this.registry.set("playerScore", 0);
          this.selectSound.play();
          // Objetos disponibles en la tienda
          const shopItems = [
            { id: 1, name: "Shield", cost: 150, description: "Te protege del próximo hit" },
            { id: 2, name: "Freeze", cost: 100, description: "Automáticamente congela a los círculos durante 0.5s cada 5s" },
            { id: 3, name: "Speed", cost: 150, description: "Aumenta ligeramente la velocidad del cuadrado" },
            { id: 4, name: "Size", cost: 150, description: "Reduce ligeramente el tamaño del cuadrado" },
            { id: 5, name: "Bomba", cost: 100, description: "Elimina todos los proyectiles del mapa" }
          ];

          this.registry.set("shopItems", shopItems);
          this.registry.set("ownedItems", []); // Al principio, el jugador no tiene nada
          this.scene.start("game"); // pasar el nombre a la escena
      } else {
          alert("Please, enter a name.");
      }
      });


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

      this.input.keyboard.on("keydown-ESC", () => {
        this.selectSound.play();
        this.nameInput.destroy();              // quita el DOM Element
        this.scene.start("scoreboard");
      });
    }
  }