export default class Menu extends Phaser.Scene {
    constructor() {
      super("menu");
    }
  
    preload() {
    }
  
    create() {

        // Crear el input en HTML
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "Name";
        nameInput.style.position = "absolute";
        nameInput.style.top = "45%";
        nameInput.style.left = "50%";
        nameInput.style.textAlign = "center";
        nameInput.style.transform = "translate(-50%, -50%)";
        nameInput.style.fontSize = "24px";
        document.body.appendChild(nameInput);

        // Detectar tecla SPACE solo si hay un nombre
        this.input.keyboard.on("keydown-ENTER", () => {
        const playerName = nameInput.value.trim();
        if (playerName.length > 0) {
            nameInput.remove(); // Eliminar el input del DOM
            this.registry.set("playerName", playerName);
            this.registry.set("levelOfGame", 1);
            this.registry.set("playerScore", 0);
            // Objetos disponibles en la tienda
            const shopItems = [
              { id: 1, name: "Dash", cost: 200, description: "Te permite dashear con iframes cada 3s" },
              { id: 2, name: "Escudo", cost: 30, description: "Te protege del próximo hit" },
              { id: 3, name: "Congelar", cost: 100, description: "Automáticamente congela a los círculos durante 0.5s cada 5s" },
              { id: 4, name: "Velocidad", cost: 50, description: "Aumenta ligeramente la velocidad del cuadrado" },
              { id: 5, name: "Tamaño", cost: 100, description: "Reduce ligeramente el tamaño del cuadrado" },
              { id: 6, name: "Bomba", cost: 30, description: "Elimina todos los proyectiles del mapa" }
            ];

            this.registry.set("shopItems", shopItems);
            this.registry.set("ownedItems", []); // Al principio, el jugador no tiene nada
            this.scene.start("game"); // pasar el nombre a la escena
        } else {
            alert("Por favor, ingresá tu nombre.");
        }
        });


      this.add.text(400, 200, "DODGE", {
        fontSize: "64px",
        fill: "#ffffff",
      }).setOrigin(0.5);
  
      this.add.text(400, 330, "ENTER TO START", {
        fontSize: "24px",
        fill: "#ffffff",
      }).setOrigin(0.5);
      this.add.text(400, 400, "SPACE TO SCOREBOARD", {
        fontSize: "24px",
        fill: "#ffffff",
      }).setOrigin(0.5);

      this.input.keyboard.on("keydown-SPACE", () => {
        nameInput.remove(); // Eliminar el input del DOM
        this.scene.start("scoreboard");
      });
    }
  }