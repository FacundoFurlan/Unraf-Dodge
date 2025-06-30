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

    updateProgressBar(progress) {
        this.progressBar.clear();

        // Dibujar el borde
        const borderThickness = 2;
        this.progressBar.lineStyle(borderThickness, 0xffffff, 1);
        this.progressBar.strokeRect(this.progressBarX, this.progressBarY, this.progressBarWidth, this.progressBarHeight);

        // Dibujar la barra rellenada
        let fillWidth = Phaser.Math.Clamp((progress / this.maxProgress) * this.progressBarWidth, 0, this.progressBarWidth);
        this.progressBar.fillStyle(0x8a8a8a, 1); // Color del relleno
        this.progressBar.fillRect(this.progressBarX, this.progressBarY, fillWidth, this.progressBarHeight);

        // Dibujar divisiones
        const divisions = 10; // Porque el progreso sube de 10 en 10 hasta 100
        const divisionSpacing = this.progressBarWidth / divisions;

        for (let i = 1; i < divisions; i++) { // Empieza en 1 para no dibujar en el borde izquierdo
            const x = this.progressBarX + i * divisionSpacing;

            this.progressBar.lineBetween(
                x, this.progressBarY,              // Desde el borde superior
                x, this.progressBarY + this.progressBarHeight // Hasta el borde inferior
            );
        }
    }

    getRandomWeighted(ballTypes) {
        let totalWeight = ballTypes.reduce((sum, ball) => sum + ball.weight, 0);
        let random = Phaser.Math.Between(1, totalWeight);
        let runningSum = 0;
        
        for (let ball of ballTypes) {
            runningSum += ball.weight;
            if (random <= runningSum) {
                return ball;
            }
        }
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
        this.bulletSpeed = 150 + this.level * 3;
        this.scaleFactor = 1;
        this.gameOver = false;
        this.isFrozen = false;
        this.scoreThisLvl = 0;
        this.loading = false;
    }

    preload() {
        this.load.plugin('rexcrtpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcrtpipelineplugin.min.js', true);
        this.load.plugin('rexglowfilterpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexglowfilterpipelineplugin.min.js', true);
       
        //Sounds
        this.load.audio("select", "./public/assets/retroSelect.mp3")  
        this.load.audio("coinSound", "./public/assets/retroCoin.mp3")  
        this.load.audio("damageSound", "./public/assets/retroDamage.mp3")  
        this.load.audio("levelMusic", "./public/assets/levelMusic.ogg")  


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
        this.input.keyboard.manager.enabled = true;
        //Sounds
        this.selectSound = this.sound.add("select", {volume: .1}); //con objeto de configuracion para que no me rompa el oido
        this.coinSound = this.sound.add("coinSound", {volume: .1}); //con objeto de configuracion para que no me rompa el oido
        this.damageSound = this.sound.add("damageSound", {volume: .1}); //con objeto de configuracion para que no me rompa el oido
        // Verificamos si ya existe la música global
        if (!this.registry.get("levelMusic")) {
            const music = this.sound.add("levelMusic", { loop: true, volume: 0 });
            music.play();

            // Fade-in
            this.tweens.add({
            targets: music,
            volume: 0.1,
            duration: 5000,
            ease: "Linear"
            });

            this.registry.set("levelMusic", music); // La guardamos para evitar duplicados
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
                intensity: 0.01,
                distance: 20,
                outerStrength: 20,
                innerStrength: 0,
                color: 0xffff00
            });
        });

        // FONDO DEL JUEGO -----------------------------------------------------------------------------
        this.cameras.main.setBackgroundColor('#000000');

        this.currentProgress = this.scoreThisLvl;
        this.maxProgress = 100; // Límite de progreso
        this.progressBar = this.add.graphics();

        // Posición y tamaño de la barra
        this.progressBarX = 570;
        this.progressBarY = 520;
        this.progressBarWidth = 200;
        this.progressBarHeight = 30;
        this.updateProgressBar(this.currentProgress);
        
        // Círculos de colisión en forma de anillo ------------------------------------------------------------
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
        
        const numberOfBalls = Math.min(5 + Math.floor(this.level / 2), 20);
        const pase = 360 / numberOfBalls;
        this.ringGroup = this.physics.add.staticGroup();

        const ballStats = [
            {name: "redWallCircle", unlockedAt: 1, cooldown: 2000},
            {name: "yellowWallCircle", unlockedAt: 5, cooldown: 2000},
            {name: "greenWallCircle", unlockedAt: 10, cooldown: 3000},
            {name: "purpleWallCircle", unlockedAt: 15, cooldown: 500},
            {name: "whiteWallCircle", unlockedAt: 20, cooldown: 1000}
        ]

        let availableBalls = ballStats.filter(ball => this.level >= ball.unlockedAt);
        
        console.log("available: ", availableBalls);
        
        let weightedBallTypes = availableBalls.map(ball => {
            let baseBias = 0;
            
            // Mientras más nuevo el color, más rápido aumenta su probabilidad
            switch (ball.name) {
                case "redWallCircle":
                    baseBias = Math.max(100 - (1 + this.level * 4), 20); // Nunca baja de 20
                    break;
                case "yellowWallCircle":
                    baseBias = Math.max((1 + this.level - ball.unlockedAt) * 4, 0);
                    break;
                case "purpleWallCircle":
                    baseBias = Math.max((1 + this.level - ball.unlockedAt) * 4, 0);
                    break;
                case "greenWallCircle":
                    baseBias = Math.max((1 + this.level - ball.unlockedAt) * 4, 0);
                    break;
                case "whiteWallCircle":
                    baseBias = Math.max((1 + this.level - ball.unlockedAt) * 4, 0);
                    break;
                default:
                    baseBias = 0;
            }
                                    
            return { key: ball.name, weight: baseBias, cooldown: ball.cooldown };
        });
                                
        console.log("weighted: ", weightedBallTypes);
        this.ringCenter = { x: 400, y: 300 };
        this.ringRadius = 250;
        this.ringRotation = 0;

        for (let i = 0; i < numberOfBalls; ++i) {
            const angle = i * pase;
            const radians = Phaser.Math.DegToRad(angle);
            const x = this.ringCenter.x + Math.cos(radians) * this.ringRadius;
            const y = this.ringCenter.y + Math.sin(radians) * this.ringRadius;

            let randomType = this.getRandomWeighted(weightedBallTypes)
            console.log("random type: ", randomType.key, " ", typeof(randomType.key));
            const wall = this.ringGroup.create(x, y, randomType.key);
            wall.baseAngle = radians;
            wall.canShoot = true;
            wall.type = randomType.key;
            wall.cooldown = randomType.cooldown;
        }
        
        // Crear el cuadrado de jugador --------------------------------------------------------------
        const square = this.add.graphics();
        square.fillStyle(0xffffff, 1);
        square.fillRect(0, 0, 32, 32);
        
        // Convertirlo en textura para usarlo con physics
        square.generateTexture('player_square', 32, 32);
        square.destroy(); // ya no necesito el graphics
        this.player = this.physics.add.image(400, this.level === 1 ? 350:300, 'player_square');
        this.player.setCollideWorldBounds(true);


        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
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
                delay: wallBall.cooldown + Phaser.Math.Between(1, 1000), // agrega al cooldown entre 0 y 1 seg de cooldown para que sea mas caotico
                callback: () => {
                    if(!wallBall.canShoot){
                        return
                    }
                    const now = this.time.now;

                    wallBall.lastShotTime = now;
                    
                    // Calcular dirección hacia el jugador
                    const baseDir = new Phaser.Math.Vector2(
                        this.player.x - wallBall.x,
                        this.player.y - wallBall.y
                    ).normalize();

                    if (wallBall.type === 'yellowWallCircle' || wallBall.type === "whiteWallCircle") {
                        // Disparar dos balas en cono
                        const angleOffset = Phaser.Math.DegToRad(15); // 15 grados a cada lado

                        // Primera bala (izquierda)
                        const leftDir = baseDir.clone().rotate(-angleOffset);
                        const bulletLeft = this.enemyBullets.create(wallBall.x, wallBall.y, wallBall.type);
                        bulletLeft.setScale(0.5);
                        bulletLeft.body.onWorldBounds = true;
                        bulletLeft.setCollideWorldBounds(true);
                        bulletLeft.setVelocity(leftDir.x * this.bulletSpeed, leftDir.y * this.bulletSpeed);

                        // Segunda bala (derecha)
                        const rightDir = baseDir.clone().rotate(angleOffset);
                        const bulletRight = this.enemyBullets.create(wallBall.x, wallBall.y, wallBall.type);
                        bulletRight.setScale(0.5);
                        bulletRight.body.onWorldBounds = true;
                        bulletRight.setCollideWorldBounds(true);
                        bulletRight.setVelocity(rightDir.x * this.bulletSpeed, rightDir.y * this.bulletSpeed);

                        if(wallBall.type === "whiteWallCircle"){
                            const bullet = this.enemyBullets.create(wallBall.x, wallBall.y, wallBall.type);
                            bullet.setScale(0.5);
                            bullet.body.onWorldBounds = true;
                            bullet.setCollideWorldBounds(true);
                            bullet.setVelocity(baseDir.x * this.bulletSpeed, baseDir.y * this.bulletSpeed);
                        }

                    } else {
                        // Comportamiento normal para el resto
                        const bullet = this.enemyBullets.create(wallBall.x, wallBall.y, wallBall.type);
                        if(wallBall.type === "greenWallCircle"){
                            bullet.setScale(2);
                        } else {
                            bullet.setScale(0.5);
                        }
                        bullet.body.onWorldBounds = true;
                        bullet.setCollideWorldBounds(true);
                        if(wallBall.type === "greenWallCircle"){
                            bullet.setVelocity(baseDir.x * (this.bulletSpeed - 50), baseDir.y * (this.bulletSpeed - 50));
                        } else {
                            bullet.setVelocity(baseDir.x * this.bulletSpeed, baseDir.y * this.bulletSpeed);
                        }
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
        if(this.level === 1){
            const centerX = this.cameras.main.width / 2;
    
            this.escText = this.add.text(centerX, 200, "ESC TO RETURN", {
                fontFamily: 'Saira',
                fontSize: "24px",
                fill: "#ffffff",
            }).setOrigin(0.5, 0);
    
            this.rText = this.add.text(centerX, 240, "R TO RELOAD", {
                fontFamily: 'Saira',
                fontSize: "24px",
                fill: "#ffffff",
            }).setOrigin(0.5, 0);
    
            this.moveText = this.add.text(centerX, 280, "WASD or ARROWS TO MOVE", {
                fontFamily: 'Saira',
                fontSize: "24px",
                fill: "#ffffff",
            }).setOrigin(0.5, 0);
    
            // Timer para esconderlos después de 5 segundos (5000 ms)
            this.time.delayedCall(5000, () => {
                this.escText.setVisible(false);
                this.rText.setVisible(false);
                this.moveText.setVisible(false);
            });
        }

        this.gameOverText = this.add.text(400,300, `GAME OVER`, {
            fontFamily: 'Saira',
            fontSize: "24px",
            fill: "#fff"
        }).setOrigin(0.5,0.5).setVisible(false);

        this.coinText = this.add.text(30, 16, `Coins: ${this.score}`, {
            fontFamily: 'Saira',
            fontSize: "32px",
            fill: "#fff",
        });
        
        this.levelText = this.add.text(30, 520, `Level: ${this.level}`, {
            fontFamily: 'Saira',
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
            fontFamily: 'Saira',
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
        const sizeItem = this.ownedItems.find(item => item.name === "Size");
        const speedItem = this.ownedItems.find(item => item.name === "Speed");
        const freezeItem = this.ownedItems.find(item => item.name === "Freeze");
        const bombItem = this.ownedItems.find(item => item.name === "Bomba")
        const shieldItem = this.ownedItems.find(item => item.name === "Shield")
        
        
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
        this.loadingText = this.add.text(400,300, `Loading Score...`, {
            fontFamily: 'Saira',
            fontSize: "24px",
            fill: "#fff"
        }).setOrigin(0.5,0.5).setVisible(false);
        //KEYS --------------------------------------------------------------------------
        this.input.keyboard.on('keydown-R', () => {
            if(!this.loading){
                this.cleanMemory();

                this.scene.restart()
            }
            
        }, this); //AL PRESIONAR R RESETEAR
        this.input.keyboard.on('keydown-ESC', () => {
            if(!this.loading){
                Object.values(this.wasd).forEach(key => {
                    this.input.keyboard.removeKey(key.keyCode);
                    this.input.keyboard.manager.enabled = false; // Desactiva el control de teclado global de Phaser
                });

                this.cleanMemory()
                
                this.scene.start("menu")
            }
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
            if (this.cursors.left.isDown || this.wasd.left.isDown) {
            vx = -1;
            } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            vx = 1;
            }

            if (this.cursors.up.isDown || this.wasd.up.isDown) {
            vy = -1;
            } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
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
        }
    }
    
    showFloatingText(text, color, startX, startY, direction = 'up') {
        const floatingText = this.add.text(startX, startY, text, {
            fontFamily: 'Saira',
            fontSize: '24px',
            color: color,
            stroke: "#000",
            strokeThickness: 2
        }).setOrigin(0.5);

        const offset = direction === 'up' ? -30 : 30;

        this.tweens.add({
            targets: floatingText,
            y: startY + offset,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => floatingText.destroy()
        });
    }

    freezeRing() {
        this.isFrozen = true;
    
        // Cambia color a azul y desactiva disparos
        this.ringGroup.children.iterate((ball) => {
            ball.canShoot = false;
            ball.setTexture("blueWallCircle"); // Azul
        });
    }
    unfreezeRing() {
        this.isFrozen = false;
    
        // Cambia color a rojo y reactiva disparos
        this.ringGroup.children.iterate((ball) => {
            ball.setTexture(ball.type); // Rojo
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
        this.coinSound.play({
            detune: Phaser.Math.FloatBetween(-1200,300)
        });
        this.showFloatingText("+30", "#00ff00", this.coinText.x+100 + this.coinText.width / 2, this.coinText.y + 40, "up");
        this.score += 30;
        this.scoreThisLvl += 10;
        this.currentProgress = this.scoreThisLvl; // Sincronizás el progreso con el score
        this.updateProgressBar(this.currentProgress);
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
            this.damageSound.play({
                detune: 2000
            });
            this.shieldActive = false;
            this.showShieldIndicator(false);
            return;
        }

        this.damageSound.play({
            detune: Phaser.Math.FloatBetween(-1200,300)
        });

        this.showFloatingText("-10", "#ff0000", this.coinText.x+100 + this.coinText.width / 2, this.coinText.y, "down");
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
        this.loading = true;
        this.loadingText.setVisible(true)

        fetch("https://dodge-back.vercel.app/api/scores", { // todo esto es para guardar el top en el servidor
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: this.playerName,
                score: this.score,
                lvl: this.level
            })
            })
            .then(async (res) => {
            const message = await res.text(); // Obtener el mensaje enviado desde el servidor
            this.loading = false;
            this.loadingText.setVisible(false);
            this.gameOverText.setText(message)
            this.gameOverText.setVisible(true)
            console.log(message)
            })
            .catch(error => {
            console.error("Error al guardar el puntaje:", error);
            this.loading = false;
            this.loadingText.setVisible(false);
            this.gameOverText.setText("error");
            this.gameOverText.setVisible(true);
        });
    }
}