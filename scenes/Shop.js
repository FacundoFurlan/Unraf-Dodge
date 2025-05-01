export default class Shop extends Phaser.Scene {
  constructor() {
    super("shop");
  }

  init(data) {
    this.score = this.registry.get("playerScore");
    this.level = this.registry.get("levelOfGame");
    this.selectedIndex = 0;
    this.purchasedThisVisit = []; // Evita comprar el mismo item más de una vez en esta tienda
  }

  create() {
    this.add.text(400, 30, "TIENDA", {
      fontSize: "32px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.scoreText = this.add.text(150, 30, `Score: ${this.score}`, {
      fontSize: "32px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(650, 30, `Level: ${this.level}`, {
      fontSize: "32px",
      color: "#ffffff",
    }).setOrigin(0.5);

    const shopItems = this.registry.get("shopItems") || [];
    const ownedItems = this.registry.get("ownedItems") || [];

    const shuffledItems = Phaser.Utils.Array.Shuffle(shopItems);
    this.displayedShopItems = shuffledItems.slice(0, 3);

    this.shopText = [];

    this.displayedShopItems.forEach((item, index) => {
      const x = 100 + index * 200;
      const y = 150;

      const owned = ownedItems.find(i => i.id === item.id);
      const level = owned ? owned.lvl + 1 : 1;

      this.add.text(x, y, `${item.name} ${level > 1 ? level : ""}`, {
        fontSize: "24px",
        color: "#ffff00",
      });

      this.add.text(x, y + 100, `${item.cost} puntos`, {
        fontSize: "24px",
        color: "#ffff00",
      });

      const buyText = this.add.text(x, y + 200, `Comprar`, {
        fontSize: "24px",
        color: "#ffff00",
      });

      this.shopText.push(buyText);
    });

    this.highlightItem(this.selectedIndex);

    this.input.keyboard.on("keydown-LEFT", () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.highlightItem(this.selectedIndex);
    });

    this.input.keyboard.on("keydown-RIGHT", () => {
      this.selectedIndex = Math.min(2, this.selectedIndex + 1);
      this.highlightItem(this.selectedIndex);
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      this.buyItem();
    });

    this.add.text(400, 500, "ENTER TO NEXT LEVEL", {
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.input.keyboard.on("keydown-ENTER", () => this.scene.start("game"), this);
  }

  highlightItem(index) {
    this.shopText.forEach((text, i) => {
      const wasBought = this.purchasedThisVisit.includes(this.displayedShopItems[i].id);
      text.setColor(wasBought ? "#00ff00" : "#ffff00");
    });

    const buyText = this.shopText[index];
    const wasBought = this.purchasedThisVisit.includes(this.displayedShopItems[index].id);
    if (!wasBought) {
      buyText.setColor("#ffffff");
    }
  }

  buyItem() {
    const selectedItem = this.displayedShopItems[this.selectedIndex];
    const ownedItems = this.registry.get("ownedItems") || [];

    const alreadyBoughtHere = this.purchasedThisVisit.includes(selectedItem.id);
    if (alreadyBoughtHere) return;

    if(this.score < selectedItem.cost){
      return;
    }

    this.score = this.score - selectedItem.cost;
    this.registry.set("playerScore", this.score);
    this.scoreText.setText(`Score: ${this.score}`)

    const existing = ownedItems.find(i => i.id === selectedItem.id);
    if (existing) {
      existing.lvl = (existing.lvl || 1) + 1;
    } else {
      ownedItems.push({ ...selectedItem, lvl: 1 });
    }

    this.registry.set("ownedItems", ownedItems);
    this.purchasedThisVisit.push(selectedItem.id);

    const buyText = this.shopText[this.selectedIndex];
    buyText.setText("Comprado").setColor("#00ff00");
  }
}