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
            this.scene.start("game", { playerName }); // pasar el nombre a la escena
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