export default class Scoreboard extends Phaser.Scene {
    constructor() {
      super("scoreboard");
    }
  
    preload() {
      // Aquí puedes cargar recursos si es necesario
    }
  
    create() {
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
        let yPosition = 200;
        data.forEach((score, index) => {
          this.add.text(400, yPosition, `${index + 1}. ${score.name}: ${score.score}`, {
            fontSize: "24px",
            fill: "#ffffff",
          }).setOrigin(0.5);
          yPosition += 50;
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