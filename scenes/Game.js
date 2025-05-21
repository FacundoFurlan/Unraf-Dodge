    // URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

    export default class Game extends Phaser.Scene {
        constructor() {
        // key of the scene
        // the key will be used to start the scene by other scenes
        super("game");
        }
        
        //AUX FUNCTIONS!!!!--------------------------------------------------------
        calculateCooldown(baseCooldown,lvl, Vmax, Km){
            const effectiveLvl = Math.max(lvl - 1, 0);
            const reduction =  (Vmax * effectiveLvl) / (Km + effectiveLvl);
            return (baseCooldown - reduction);
        }


        cleanMemory(){
            if(this.shieldTimer){this.shieldTimer.remove();}
            if(this.starTime){this.starTime.remove();}
            if(this.timerEvent){this.timerEvent.remove();}

            this.ringGroup.children.iterate((wallBall) => {
                if(wallBall.shotTime) {
                    wallBall.shotTime.remove()
                }
            })
            
            this.registry.set("levelOfGame", 1);
            this.registry.set("playerScore", 0);
            this.registry.set("ownedItems", []);

            this.physics.pause();
        
            this.player.setTint(0xff0000);

            this.gameOver = true;
        }


        init(data) {
        // this is called before the scene is created
        // init variables
        // take data passed from other scenes
        // data object param {}
            this.playerName = this.registry.get("playerName");
            console.log("Name: ", this.playerName);
            this.level = this.registry.get("levelOfGame");
            console.log("lvl: ", this.level);
            this.score = this.registry.get("playerScore");
            console.log("playerScore: ", this.score);
            this.ownedItems = this.registry.get("ownedItems") || [];
            console.log("OwnedItems: ", this.ownedItems);
            this.totalTime = 60;
            this.speed = 160;
            this.scaleFactor = 1;
            this.gameOver = false;
            this.isFrozen = false;
            this.scoreThisLvl = 0;
        }
    
        preload() {
        // load assets
        this.load.image("sky", "./public/assets/sky.png");
        this.load.image("ground", "./public/assets/platform.png");
        this.load.image("star", "./public/assets/star.png");
        this.load.image("bomb", "./public/assets/bomb.png");
        this.load.spritesheet("dude", "./public/assets/dude.png", {
            frameWidth: 32,
            frameHeight: 48,
        });
        }
    
        create() {
        // FONDO DEL JUEGO -----------------------------------------------------------------------------
        this.cameras.main.setBackgroundColor('#000000');
    
        // Círculos de colisión en forma de anillo ------------------------------------------------------------
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(10, 10, 10); // círculo de radio 10 en (10,10)
        graphics.generateTexture("wallCircle", 20, 20); // 20x20 es el tamaño total
        graphics.destroy(); // ya no lo necesitamos


        this.ringGroup = this.physics.add.staticGroup();

        this.ringCenter = { x: 400, y: 300 };
        this.ringRadius = 250;
        this.ringRotation = 0;
        
        for (let angle = 0; angle < 360; angle += 30) {
            const radians = Phaser.Math.DegToRad(angle);
            const x = this.ringCenter.x + Math.cos(radians) * this.ringRadius;
            const y = this.ringCenter.y + Math.sin(radians) * this.ringRadius;
        
            const wall = this.ringGroup.create(x, y, "wallCircle");
            wall.baseAngle = radians;
            wall.canShoot = true;
        }
    
        // Crear el cuadrado de jugador --------------------------------------------------------------
        const square = this.add.graphics();
        square.fillStyle(0xffffff, 1);
        square.fillRect(0, 0, 32, 32);

        // Convertirlo en textura para usarlo con physics
        square.generateTexture('player_square', 32, 32);
        square.destroy(); // ya no necesito el graphics

        this.player = this.physics.add.image(400, 300, 'player_square');
        this.player.setCollideWorldBounds(true);
    
        this.cursors = this.input.keyboard.createCursorKeys();
  
        //ESTRELLAS ------------------------------------------------------------------------------------
        this.stars = this.physics.add.group();
  
      
        this.starTime = this.time.addEvent({
            delay: 3000, // cada 3 segundos
            callback: () => {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const radius = Phaser.Math.FloatBetween(50, this.ringRadius - 20);
        
            const x = this.ringCenter.x + Math.cos(angle) * radius;
            const y = this.ringCenter.y + Math.sin(angle) * radius;
        
            const star = this.stars.create(x, y, "star");
            star.setCollideWorldBounds(false);
            },
            loop: true,
        });
        
        //BALAS ! ----------------------------------------------------------------
        this.enemyBullets = this.physics.add.group();

        this.ringGroup.children.iterate((wallBall) => {
            wallBall.lastShotTime = 0;

            wallBall.shotTime = this.time.addEvent({
                delay: Phaser.Math.Between(0, 10000), // Dispara cada 0 a 10 segundos
                callback: () => {
                    if(!wallBall.canShoot){
                        return
                    }
                    const now = this.time.now;
                    if(now -wallBall.lastShotTime >= 2000){
                        wallBall.lastShotTime = now;

                        const bullet = this.enemyBullets.create(wallBall.x, wallBall.y, "star"); // o podés usar una textura nueva si querés
                        bullet.setScale(0.5);
                        bullet.body.onWorldBounds = true;
                        bullet.setCollideWorldBounds(true); //Colisiona con bordes del mundo para desaparecer
        
                        // Dirección hacia el jugador
                        const dir = new Phaser.Math.Vector2(
                            this.player.x - wallBall.x,
                            this.player.y - wallBall.y
                        ).normalize();
        
                        bullet.setVelocity(dir.x * 150, dir.y * 150);
                    }
                },
                callbackScope: this,
                loop: true,
            });
        });

        this.physics.world.on("worldbounds", (body) => { //desaparecen al colisionar con bordes del mundo
            const bullet = body.gameObject;
            if (this.enemyBullets.contains(bullet)) {
                bullet.destroy();
            }
        });

        // POINTS AND GAME OVER!! -------------------------------------------------------

        this.gameOverText = this.add.text(400,300, `GAME OVER`, {
            fontSize: "24px",
            fill: "#fff"
        }).setOrigin(0.5,0.5).setVisible(false);

        this.scoreText = this.add.text(630, 550, `${this.scoreThisLvl} / 100`, {
            fontSize: "32px",
            fill: "#fff",
        });

        this.coinText = this.add.text(16, 16, `Coins: ${this.score}`, {
            fontSize: "32px",
            fill: "#fff",
        });

        this.levelText = this.add.text(16, 550, `level: ${this.level}`, {
            fontSize: "32px",
            fill: "#fff",
        });
    
        
        //TIMER --------------------------------------------------------------

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    
        this.timerText = this.add.text(630,16, `Time: ${this.totalTime}`, {
            fontSize: "32px",
            fill: "#fff"
        })

        //COLLIDERS! -------------------------------------------------

        this.physics.add.collider(this.player, this.ringGroup);
    
        this.physics.add.overlap(
            this.player,
            this.stars,
            this.collectStar,
            null,
            this
        );
    
        this.physics.add.overlap(
            this.player,
            this.enemyBullets,
            this.hitBullet,
            null,
            this
        );


        //ITEMS!!!! -----------------------------------------------------------------
        const sizeItem = this.ownedItems.find(item => item.name === "Tamaño");
        const speedItem = this.ownedItems.find(item => item.name === "Velocidad");
        const freezeItem = this.ownedItems.find(item => item.name === "Congelar");
        const bombItem = this.ownedItems.find(item => item.name === "Bomba")
        const shieldItem = this.ownedItems.find(item => item.name === "Escudo")


        this.shieldActive = false;            // Empieza inactivo
        
        if (shieldItem) {
            if(this.shieldTimer){
                this.shieldTimer.remove();
            }

            if(this.shieldSprite){
                this.shieldSprite.destroy();
                this.shieldSprite = null;
            }

            this.shieldCooldown = this.calculateCooldown(30000, shieldItem.lvl, 15000, 10)
            this.shieldActive = true;            // lo activo
            this.showShieldIndicator(true);

            this.shieldTimer = this.time.addEvent({
                delay: this.shieldCooldown,
                loop: true,
                callback: () => {
                    // Solo recarga si estaba inactivo
                    if (!this.shieldActive) {
                        this.shieldActive = true;
                        this.showShieldIndicator(true);
                    }
                }
            });
        }


        if (sizeItem) {
            this.scaleFactor = this.calculateCooldown(1,sizeItem.lvl, .9, 10)

            this.scaleFactor = Math.max(this.scaleFactor, 0.1);

            this.player.setScale(this.scaleFactor);
            if(shieldItem){
                this.shieldSprite.setScale(this.scaleFactor);
            }
        }

        if (bombItem) {
            this.bombCooldown = this.calculateCooldown(30000,bombItem.lvl, 15000, 10)

            this.time.addEvent({
                delay: this.bombCooldown,
                callback: this.activateBomb,
                callbackScope: this,
                loop: true
            });
        }

        if (speedItem) {
            const baseSpeed = 160;       // velocidad base
            const Vmax = 200;            // velocidad máxima adicional permitida
            const Km = 10;               // control de escalado
            const lvl = speedItem.lvl;

            const speedBonus = (Vmax * lvl) / (Km + lvl); // fórmula

            this.speed = baseSpeed + speedBonus;
        }

        if (freezeItem) {
            this.freezeCooldown = this.calculateCooldown(30000,freezeItem.lvl, 15000, 10)
            this.isFrozen = false;
            this.freezeDuration = 3000;


            this.time.addEvent({
                delay: this.freezeCooldown, // Cada 20 segundos
                loop: true,
                callback: () => {
                    this.freezeRing();
                    this.time.delayedCall(this.freezeDuration, () => {
                        this.unfreezeRing();
                    });
                }
            });
        }

        //KEYS --------------------------------------------------------------------------
        this.input.keyboard.on('keydown-R', () => {
            this.cleanMemory();

            this.scene.restart()
        }, this); //AL PRESIONAR R RESETEAR
        this.input.keyboard.on('keydown-ESC', () => {
            this.cleanMemory()
            this.scene.start("menu")
        }, this); //AL PRESIONAR ESC SE VA AL MENU
        }
    

        //UPDATE -----------------------------------------------------------------
        update() {
            if(!this.gameOver){
                if(!this.isFrozen){
                    this.ringRotation += 0.003;
                    this.ringGroup.children.iterate((wall) => {
                    const angle = wall.baseAngle + this.ringRotation;
                    const x = this.ringCenter.x + Math.cos(angle) * this.ringRadius;
                    const y = this.ringCenter.y + Math.sin(angle) * this.ringRadius;
    
                    wall.setPosition(x, y);
                    wall.body.updateFromGameObject(); // sincronizar con física
                    });
                }
                
                
                
                //Variables que avisan en que direccion va el pj
                let vx = 0;
                let vy = 0;
                
                //Determino que direccion se toma dependiendo de botones presionados
                if (this.cursors.left.isDown) {
                    vx = -1;
                } else if (this.cursors.right.isDown) {
                    vx = 1;
                }
                
                if (this.cursors.up.isDown) {
                    vy = -1;
                } else if (this.cursors.down.isDown) {
                    vy = 1;
                }
                
                // Hago el pitagoras para movimiento diagonal
                
                const magnitude = Math.hypot(vx, vy); // Equivalente a sqrt(vx^2 + vy^2)
                
                if (magnitude > 0) {
                    vx = (vx / magnitude) * this.speed;
                    vy = (vy / magnitude) * this.speed;
                }
                
                this.player.setVelocity(vx, vy);

                if (this.shieldSprite) {
                    this.shieldSprite.setPosition(this.player.x, this.player.y);
                }
            } else {

            }
        }
    
        freezeRing() {
            this.isFrozen = true;
        
            // Cambia color a azul y desactiva disparos
            this.ringGroup.children.iterate((ball) => {
                ball.canShoot = false;
                ball.setTintFill(0x0000ff); // Azul
            });
        }
        unfreezeRing() {
            this.isFrozen = false;
        
            // Cambia color a rojo y reactiva disparos
            this.ringGroup.children.iterate((ball) => {
                ball.setTintFill(0xff0000); // Rojo
                ball.canShoot = true;
            });
        }

        activateBomb() {
            if (this.enemyBullets) {
                this.enemyBullets.clear(true, true); // Elimina todos los proyectiles del grupo
            }

            // Opcional: Efecto visual o sonido de la bomba
            this.cameras.main.flash(250, 255, 255, 0); // Efecto de pantalla roja
        }

        updateTimer(){
            if(!this.gameOver){
                this.totalTime--;
            
                this.timerText.setText(`Time: ${this.totalTime}`)
            
                if(this.totalTime <= 0){
                    this.finishGame()
                }
            }
        }

        collectStar(player, star) {
            star.disableBody(true, true);
        
            this.score += 1000;
            this.scoreThisLvl += 100;
            this.scoreText.setText(`${this.scoreThisLvl} / 100`);
            this.coinText.setText(`Coins: ${this.score}`);

            if(this.scoreThisLvl >= 100){
                this.registry.set("levelOfGame", this.level+1);
                this.registry.set("playerScore", this.score)
                this.scene.start("shop")
            }
        }
    
        hitBullet(player, bullet) {
            bullet.disableBody(true, true)

            if (this.shieldActive) {
                // Consume el escudo en lugar de restar puntos
                this.shieldActive = false;
                this.showShieldIndicator(false);
                return;
            }

            this.score -= 10;
            this.coinText.setText(`Coins: ${this.score}`);

            if(this.score < 0){
                this.finishGame()
            }
        }

        showShieldIndicator(on) {
            if (on) {
                if (!this.shieldSprite) {
                    const square = this.add.graphics();
                    square.fillStyle(0x34eaed, 1);
                    square.fillRect(0, 0, 40, 40);

                    // Convertirlo en textura para usarlo con physics
                    square.generateTexture('shield', 40, 40);
                    square.destroy(); // ya no necesito el graphics

                    this.shieldSprite = this.add
                    .image(this.player.x, this.player.y, 'shield')
                    .setScale(this.scaleFactor)
                    .setDepth(-1);
                }
                this.shieldSprite.setScale(this.scaleFactor)
                this.shieldSprite.setVisible(true);
            } else if (this.shieldSprite) {
                this.shieldSprite.setVisible(false);
            }
        }


        finishGame(){
            this.cleanMemory()

            fetch("https://dodge-back.vercel.app/api/scores", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  name: this.playerName,
                  score: this.score
                })
              })
              .then(async (res) => {
                const message = await res.text(); // Obtener el mensaje enviado desde el servidor
                this.gameOverText.setText(message)
                this.gameOverText.setVisible(true)
                console.log(message)
              })
              .catch(error => {
                console.error("Error al guardar el puntaje:", error);
                this.gameOverText.setText("error");
                this.gameOverText.setVisible(true);
              });


        }
    }