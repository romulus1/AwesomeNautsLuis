game.PlayerEntity = me.Entity.extend({
    init: function(x, y, settings) {

        this.setSuper(x, y);
        this.setPlayerTimers();
        this.setAttributes();

        this.type = "PlayerEntity";
        this.setFlags();

        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
        this.addAnimation();
        this.renderable.setCurrentAnimation("idle");
    },
    
    setSuper: function(x, y) {
        this._super(me.Entity, 'init', [x, y, {
                //all dis makes sure that the sprite works
                image: "player",
                width: 64,
                height: 64,
                spritewidth: "64",
                spritheight: "64",
                getShape: function() {
                    return(new me.Rect(0, 0, 64, 64)).toPolygon();//zeros are top corners and the two sixty fours are the width and the height
                }
            }]);
    },
    
    setPlayerTimers: function() {
        this.now = new Date().getTime();
        this.lastHit = this.now;
        this.lastAttack = new Date().getTime(); //Havent used this
    },
    setAttributes: function() {
        this.health = game.data.playerHealth;
        this.body.setVelocity(game.data.playerMoveSpeed, 20);//sets the velocity for the key binded
        this.attack = game.data.playerAttack;
    },
    setFlags: function() {
        //keeps track of what direction your character is going
        this.facing = "right";
        this.dead = false;
        this.attakcing = false;
    },
    addAnimation: function() {
        this.renderable.addAnimation("idle", [78]);
        this.renderable.addAnimation("walk", [117, 118, 119, 120, 121, 123, 124, 125], 80);
        this.renderable.addAnimation("attack", [65, 66, 67, 68, 69, 70, 71, 72], 80);
    },
    update: function(delta) {
        this.now = new Date().getTime();
        this.dead = this.checkIfDead();
        this.checkKeyPressesAndMove();
        this.setAnimation();
        me.collision.check(this, true, this.collideHandler.bind(this), true);
        this.body.update(delta);//updates the isKeyPressed()
        this._super(me.Entity, "update", [delta]);
        return true;
    },
    
    checkIfDead: function() {
        if (this.health <= 0) {
            return true;
            // this.pos.x = 10;
            // this.pos.y = 0;
            // this.health = game.data.playerHealth;
        }
        return false;
    },
    
    checkKeyPressesAndMove: function() {
        if (me.input.isKeyPressed("right")) {
            this.moveRight();
        } else if (me.input.isKeyPressed("left")) {
            this.moveLeft();
        }
        else {
            this.body.vel.x = 0;//makes velocity zero
        }

        if (me.input.isKeyPressed("jump") && !this.body.jumping && !this.body.falling) {
            this.jump();
        }
        this.attacking = me.input.isKeyPressed("attack");
    },
    moveRight: function() {
        //adds to the position of my x by the velocity defined above in setVelocity() and multaplying it by me.timer.tick
        //me.timer.tick makes the movement look smooth
        this.body.vel.x += this.body.accel.x * me.timer.tick;
        this.flipX(true);
        this.facing = "right";
    },
    moveLeft: function() {
        this.facing = "left";
        this.body.vel.x -= this.body.accel.x * me.timer.tick;
        this.flipX(false);
    },
    jump: function() {
        this.body.vel.y = -this.body.accel.y * me.timer.tick;
        this.body.jumping = true;
    },
    setAnimation: function() {
        //two of the attack if/else makes the animation smoother
        if (this.attacking) {
            if (!this.renderable.isCurrentAnimation("attack")) {
                //console.log(!this.renderable.isCurrentAnimation("attack"));
                //sets the current animation to attack and once that is over, goes back to the idle animation 
                this.renderable.setCurrentAnimation("attack", "idle");
                //Makes it so that the next time that we will start this sequence we begin from the first animation, not where ever we left off when we switched to another animation
                this.renderable.setAnimationFrame();
            }
        }

        else if (this.body.vel.x !== 0 && !this.renderable.isCurrentAnimation("attack")) {
            if (!this.renderable.isCurrentAnimation("walk")) {//if it is walk, it sets it to walk
                this.renderable.setCurrentAnimation("walk");
            }
        } else if (!this.renderable.isCurrentAnimation("attack")) {
            this.renderable.setCurrentAnimation("idle");
        }
    },
    
    loseHealth: function(damage) {
        this.health = this.health - damage;
        console.log(this.health);
        if (this.health <= 0) {
            this.dead = true;
            me.game.world.removeChild(this);
        }
    },
    
    collideHandler: function(response) {
        if (response.b.type === 'EnemyBaseEntity') {
            this.collideWithEnemyBase(response);
        } else if (response.b.type === 'EnemyCreep') {
            this.collideWithEnemyCreep(response);
        }
    },
    collideWithEnemyBase: function(response) {
        var ydif = this.pos.y - response.b.pos.y;
        var xdif = this.pos.x - response.b.pos.x;

        if (ydif < -40 && xdif < 70 && xdif > -30) {
            this.body.falling = false;
            this.body.vel.y = -1;
        }
        if (xdif > -35 && this.facing === 'right' && (xdif < 0)) {
            this.body.vel.x = 0;
        } else if (xdif < 70 && this.facing === 'left' && (xdif > 0)) {
            this.body.vel.x = 0;
        }

        if (this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttackTimer) {
            console.log("tower Hit");
            me.save.exp = game.data.exp + 10;
            this.lastHit = this.now;
            response.b.loseHealth(game.data.playerAttack);
        }
    },
    
    collideWithEnemyCreep: function(response) {
        var xdif = this.pos.x - response.b.pos.x;
        var ydif = this.pos.y - response.b.pos.y;

        this.stopMovement(xdif);
        if (this.checkAttack(xdif, ydif)) {
            this.hitCreep(response);
        }
        ;
    },
    
    stopMovement: function(xdif) {
        if (xdif > 0) {
            if (this.facing === "left") {
                this.body.vel.x = 0;
            }
        } else {
            if (this.facing === "right") {
                this.body.vel.x = 0;
            }
        }
    },
    
    checkAttack: function(xdif, ydif) {
        if (this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttackTimer && (Math.abs(ydif) <= 40) && (((xdif > 0) && (this.facing === "left") || ((xdif < 0) && this.facing === "right")))) {
            this.lastHit = this.now;
            return true;
        }
        return false;
    },
    
    hitCreep: function(response) {
        //if the creeps helth is less than our attack, execute code in an if statement
        if (response.b.health <= game.data.playerAttack) {
            //adds one gold for a creep kill
            game.data.gold += 1;
            console.log("Current gold count: " + game.data.gold);
        }
        response.b.loseHealth(game.data.playerAttack);
    }


});