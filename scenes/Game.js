    // URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

    export default class Game extends Phaser.Scene {
        constructor() {
        // key of the scene
        // the key will be used to start the scene by other scenes
        super("game");
        }
    
        init() {
        // this is called before the scene is created
        // init variables
        // take data passed from other scenes
        // data object param {}
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
                const now = this.time.now;
                if(now -wallBall.lastShotTime >= 2000){
                    wallBall.lastShotTime = now;

                    const bullet = this.enemyBullets.create(wallBall.x, wallBall.y, "star"); // o podés usar una textura nueva si querés
                    bullet.setScale(0.5);
                    bullet.setCollideWorldBounds(false);
                    bullet.setBounce(1);
    
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

        //BOMBS, POINTS AND GAME OVER!! -------------------------------------------------------

        this.bombs = this.physics.add.group();
    
        this.score = 0;

        this.gameOver = false;

        this.gameOverText = this.add.text(400,300, `GAME OVER`, {
            fontSize: "64px",
            fill: "#fff"
        }).setOrigin(0.5,0.5).setVisible(false);

        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: "32px",
            fill: "#fff",
        });
    
        
        //TIMER --------------------------------------------------------------
        this.totalTime = 90;

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

        this.input.keyboard.on('keydown-R', () => this.scene.restart(), this); //AL PRESIONAR R RESETEAR
        }
    
        update() {
            if(!this.gameOver){

                this.ringRotation += 0.003;

                this.ringGroup.children.iterate((wall) => {
                const angle = wall.baseAngle + this.ringRotation;
                const x = this.ringCenter.x + Math.cos(angle) * this.ringRadius;
                const y = this.ringCenter.y + Math.sin(angle) * this.ringRadius;

                wall.setPosition(x, y);
                wall.body.updateFromGameObject(); // sincronizar con física
                });




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
                const speed = 160;
                const magnitude = Math.hypot(vx, vy); // Equivalente a sqrt(vx^2 + vy^2)
        
                if (magnitude > 0) {
                vx = (vx / magnitude) * speed;
                vy = (vy / magnitude) * speed;
                }
            
                this.player.setVelocity(vx, vy);
            } else {
                this.gameOverText.setVisible(true);
            }
        }
    
        updateTimer(){
            if(!this.gameOver){
            this.totalTime--;
        
            this.timerText.setText(`Time: ${this.totalTime}`)
        
            if(this.totalTime <= 0){
                this.timerEvent.remove();
                this.starTime.remove();
                this.ringGroup.children.iterate((wallBall) => {
                    if(wallBall.shotTime) {
                        wallBall.shotTime.remove()
                    }
                })

                this.physics.pause();
        
                this.player.setTint(0xb00000);

                this.gameOverText.setVisible(true);
        
                this.gameOver = true
            }
            }
        }

        collectStar(player, star) {
            star.disableBody(true, true);
        
            this.score += 10;
            this.scoreText.setText(`Score: ${this.score}`);
        }
    
        hitBullet(player, bullet) {
            bullet.disableBody(true, true)

            this.score -= 10;
            this.scoreText.setText(`Score: ${this.score}`);

            if(this.score < 0){
                this.timerEvent.remove();
                this.starTime.remove();
                this.ringGroup.children.iterate((wallBall) => {
                    if(wallBall.shotTime) {
                        wallBall.shotTime.remove()
                    }
                })

                this.physics.pause();
            
                this.player.setTint(0xff0000);

                this.gameOver = true;
            }
        }
    }