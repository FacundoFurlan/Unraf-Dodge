export default class Shop extends Phaser.Scene {
  constructor() {
    super("shop");
  }

  init(data) {
    this.score = this.registry.get("playerScore");
    this.level = this.registry.get("levelOfGame");
    this.selectedIndex = 0;
    this.purchasedThisVisit = [];
  }

  preload() {
    this.load.plugin('rexcrtpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcrtpipelineplugin.min.js', true);
    this.load.plugin('rexglowfilterpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexglowfilterpipelineplugin.min.js', true);    
  }

  create() {
    const postFxPlugin = this.plugins.get('rexcrtpipelineplugin');
    const glowPlugin  = this.plugins.get('rexglowfilterpipelineplugin');

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

    this.add.text(400, 60, "SHOP", {
      fontFamily: 'Saira',
      fontSize: "32px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.scoreText = this.add.text(150, 60, `Coins: ${this.score}`, {
      fontFamily: 'Saira',
      fontSize: "32px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(650, 60, `Level: ${this.level}`, {
      fontFamily: 'Saira',
      fontSize: "32px",
      color: "#ffffff",
    }).setOrigin(0.5);

    const shopItems = this.registry.get("shopItems") || [];
    const ownedItems = this.registry.get("ownedItems") || [];

    const shuffledItems = Phaser.Utils.Array.Shuffle(shopItems);
    this.displayedShopItems = shuffledItems.slice(0, 3);
    this.shopText = [];

    this.displayedShopItems.forEach((item, index) => {
      const x = 200 + index * 200;
      const y = 200;

      const owned = ownedItems.find(i => i.id === item.id);
      const level = owned ? owned.lvl + 1 : 1;

      this.add.text(x, y, `${item.name} ${level > 1 ? `Lv ${level}` : ""}`, {
        fontFamily: 'Saira',
        fontSize: "24px",
        color: "#ffffff",
      }).setOrigin(.5);

      this.add.text(x, y + 100, `${item.cost} points`, {
        fontFamily: 'Saira',
        fontSize: "24px",
        color: "#ffffff",
      }).setOrigin(.5);

      const buyText = this.add.text(x, y + 200, `Buy`, {
        fontFamily: 'Saira',
        fontSize: "24px",
        color: "#ffffff",
      }).setOrigin(.5);

      this.shopText.push(buyText);
    });

    this.highlightItem(this.selectedIndex);

    // 🟡 Movimiento DRY: Flechas o A/D
    const moveSelection = (direction) => {
      const maxIndex = this.displayedShopItems.length - 1;
      this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex + direction, 0, maxIndex);
      this.highlightItem(this.selectedIndex);
    };

    this.input.keyboard.on("keydown-LEFT", () => moveSelection(-1));
    this.input.keyboard.on("keydown-A", () => moveSelection(-1));
    this.input.keyboard.on("keydown-RIGHT", () => moveSelection(1));
    this.input.keyboard.on("keydown-D", () => moveSelection(1));

    this.input.keyboard.on("keydown-ENTER", () => {
      this.buyItem();
    });

    this.add.text(400, 530, "ESC TO NEXT LEVEL", {
      fontFamily: 'Saira',
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.input.keyboard.on("keydown-ESC", () => this.scene.start("game"), this);
  }

  highlightItem(index) {
    this.shopText.forEach((text, i) => {
      const wasBought = this.purchasedThisVisit.includes(this.displayedShopItems[i].id);
      text.setColor(wasBought ? "#00ff00" : "#ffffff");
    });

    const buyText = this.shopText[index];
    const wasBought = this.purchasedThisVisit.includes(this.displayedShopItems[index].id);
    if (!wasBought) {
      buyText.setColor("#ffff00");
    }
  }

  buyItem() {
    const selectedItem = this.displayedShopItems[this.selectedIndex];
    const ownedItems = this.registry.get("ownedItems") || [];

    const alreadyBoughtHere = this.purchasedThisVisit.includes(selectedItem.id);
    if (alreadyBoughtHere) return;

    if (this.score < selectedItem.cost) {
      return;
    }

    this.score = this.score - selectedItem.cost;
    this.registry.set("playerScore", this.score);
    this.scoreText.setText(`Coins: ${this.score}`);

    const existing = ownedItems.find(i => i.id === selectedItem.id);
    if (existing) {
      existing.lvl = existing.lvl + 1;
    } else {
      ownedItems.push({ ...selectedItem, lvl: 1 });
    }

    this.registry.set("ownedItems", ownedItems);
    this.purchasedThisVisit.push(selectedItem.id);

    const buyText = this.shopText[this.selectedIndex];
    buyText.setText("Bought").setColor("#00ff00");
  }
}
