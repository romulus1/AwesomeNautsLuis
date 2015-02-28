game.PlayerEntity = me.Entity.extend({
    init: function(x, y, settings) {
        this.setSuper();
        this.setPlayerTimers();
        this.setAttributes();  
        this.type = "PlayerEntity";
        this.setFlags();

        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);

        this.addAnimations();
        
        this.renderable.setCurrentAnimation("idle");
    },
    
    setSuper: function(){
        this._super(me.Entity, 'init', [x, y, {
                //all this makes sure that the sprite works
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
    
    setPlayerTimers: function(){
        this.now = new Date().getTime();
        this.lastHit = this.now;
        this.lastAttack = new Date().getTime();
    },
    
    setAttributes: function(){
        this.health = game.data.playerHealth;
        this.body.setVelocity(game.data.playerMoveSpeed, 20);//sets the velocity for the key binded
        this.attack = game.data.playerAttack;
    },
    
    setFlags: function(){      
        //keeps track of what direction your character is going
        this.facing = "right";
        this.dead = false;
    },
    
    addAnimations: function(){             
        this.renderable.addAnimation("idle", [78]);
        this.renderable.addAnimation("walk", [117, 118, 119, 120, 121, 123, 124, 125], 80);
        this.renderable.addAnimation("attack", [65, 66, 67, 68, 69, 70, 71, 72], 80);
    },
    
    update: function(delta) {
        this.now = new Date().getTime();
        
        this.dead = checkIfDead();
        
        if (this.health <= 0) {
            this.dead = true;
            // this.pos.x = 10;
            // this.pos.y = 0;
            // this.health = game.data.playerHealth;
        }
        if (me.input.isKeyPressed("right")) {
            //adds to the position of my x by the velocity defined above in setVelocity() and multaplying it by me.timer.tick
            //me.timer.tick makes the movement look smooth
            this.body.vel.x += this.body.accel.x * me.timer.tick;
            this.flipX(true);
            this.facing = "right";
        } else if (me.input.isKeyPressed("left")) {
            this.facing = "left";
            this.body.vel.x -= this.body.accel.x * me.timer.tick;
            this.flipX(false);
        }
        else {
            this.body.vel.x = 0;//makes velocity zero
        }

        if (me.input.isKeyPressed("jump") && !this.body.jumping && !this.body.falling) {
            this.body.vel.y = -this.body.accel.y * me.timer.tick;
            this.body.jumping = true;
        }

//two of the attack if/else makes the animation smoother
        if (me.input.isKeyPressed("attack")) {
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

        me.collision.check(this, true, this.collideHandler.bind(this), true);

        this.body.update(delta);//updates the isKeyPressed()

        this._super(me.Entity, "update", [delta]);
        return true;

    },
    
    checkIfDead: function(){
        if(this.health <= 0){
            this.dead = true;
        }
    },
    
    loseHealth: function(damage) {
        this.health = this.health - damage;
        console.log(this.health);
        if (this.health <= 0) {
            if (confirm("You died, retry?") == true) {
                this.dead = true;
                me.game.world.removeChild(this);
            } else {
                window.alert("3:");
            }
        }
        // if(this.health <= 0){
        // 	this.dead = true;
        // 	me.game.world.removeChild(this);
        // }
        //console.log(xdif);
    },
    collideHandler: function(response) {
        if (response.b.type === 'EnemyBaseEntity') {
            var ydif = this.pos.y - response.b.pos.y;
            var xdif = this.pos.x - response.b.pos.x;

            if (ydif < -40 && xdif < 70 && xdif > -30) {
                this.body.falling = false;
                this.body.vel.y = -1;
            }
            if (xdif > -35 && this.facing === 'right' && (xdif < 0)) {
                this.body.vel.x = 0;
                // this.pos.x = this.pos.x -1;
            } else if (xdif < 70 && this.facing === 'left' && (xdif > 0)) {
                this.body.vel.x = 0;
                //this.pos.x = this.pos.x +1;
            }

            if (this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttackTimer) {
                console.log("tower Hit");
                this.lastHit = this.now;
                response.b.loseHealth(game.data.playerAttack);
            }
        } else if (response.b.type === 'EnemyCreep') {
            var xdif = this.pos.x - response.b.pos.x;
            var ydif = this.pos.y - response.b.pos.y;

            if (xdif > 0) {
                //this.pos.x = this.pos.x + 1;
                if (this.facing === "left") {
                    this.body.vel.x = 0;
                }
            } else {
                //this.pos.x = this.pos.x - 1;
                if (this.facing === "right") {
                    this.body.vel.x = 0;
                }
            }
            if (this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttackTimer && (Math.abs(ydif) <= 40) && (((xdif > 0) && (this.facing === "left") || ((xdif < 0) && this.facing === "right")))) {
                this.lastHit = this.now;
                //if the creeps helth is less than our attack, execute code in an if statement
                if (response.b.health <= game.data.playerAttack) {
                    //adds one gold for a creep kill
                    game.data.gold += 1;
                    console.log("Current gold count: " + game.data.gold);
                }
                response.b.loseHealth(game.data.playerAttack);
            }
        }
    }

});

game.MyCreep = me.Entity.extend({
    init: function(x, y, settings) {
        this._super(me.Entity, 'init', [x, y, {
                image: "creep2",
                width: 100,
                height: 85,
                spritewidth: "100",
                spriteheight: "85",
                getShape: function() {
                    return (new me.Rect(0, 0, 100, 85)).toPolygon();
                }
            }]);
        this.health = game.data.myCreepHealth;
        this.alwaysUpdate = true;
        //this.attacking lets us know if the enemy is currently attacking
        this.attacking = false;
        //keeps track of when our creep last attacked anyting
        this.lastAttacking = new Date().getTime();
        this.lastHit = new Date().getTime();
        this.now = new Date().getTime();
        this.body.setVelocity(3, 20);

        this.type = "MyCreep";

        this.renderable.addAnimation("walk", [0, 1, 2, 3, 4], 80);
        this.renderable.setCurrentAnimation("walk");
    },
    loseHealth: function(damage) {
        this.health = this.health - damage;
        if (this.health <= 0) {
            me.game.world.removeChild(this);
        }
    },
    update: function(delta) {
        if (this.health <= 0) {
            me.game.world.removeChild(this);
        }
        this.now = new Date().getTime();
        this.body.vel.x += this.body.accel.x * me.timer.tick;
        me.collision.check(this, true, this.collideHandler.bind(this), true);
        this.body.update(delta);//updates the isKeyPressed()
        this.flipX(true);

        this._super(me.Entity, "update", [delta]);
        return true;

    },
    collideHandler: function(response) {
        if (response.b.type === 'EnemyBaseEntity') {
            this.attacking = true;
            //this.lastAttacking = this.now;
            this.body.vel.x = 0;
            //keeps moving the creep to the right to maintain its position
            this.pos.x = this.pos.x + 1;
            //checks that it has been at least 1 second since this creep hit a base
            if ((this.now - this.lastHit >= 1000)) {
                //updates the last hit timer
                this.lastHit = this.now;
                //makes the player base call its loseHealth	function and passes it a damage of 1
                response.b.loseHealth(game.data.myCreepAttack);
            }
        } else if (response.b.type === 'EnemyCreep') {
            var xdif = this.pos.x - response.b.pos.x;
            this.attacking = true;
            //this.lastAttacking = this.now;
            //this.body.vel.x = 0;
            //keeps moving the creep to the right to maintain its position
            if (xdif > 0) {
                //console.log(xdif);
                //keeps moving the creep to the right to maintain its position
                this.pos.x = this.pos.x + 1;
                this.body.vel.x = 0;
            }
            //checks that it has been at least 1 second since this creep hit something
            if ((this.now - this.lastHit >= 1000 && xdif > 0)) {
                //updates the last hit timer
                this.lastHit = this.now;
                //makes the player call its loseHealth	function and passes it a damage of 1
                response.b.loseHealth(game.data.myCreepAttack);
            }
        }
    }

});