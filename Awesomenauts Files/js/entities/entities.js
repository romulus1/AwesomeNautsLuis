game.PlayerEntity = me.Entity.extend({
//constructor function for sprite. 
    init: function(x, y, settings) {
        this._super(me.Entity, 'init', [x, y, {
                image: "player",
                width: 64,
                height: 64, //height and width has to always be the same
                spritewidth: "64",
                spriteheight: "64",
                //basic player class
                getShape: function() {
                    return(new me.Rect(0, 0, 64, 64)).toPolygon();
                }
            }]);
        
        this.type = 'PlayerEntity';
        this.health = game.data.playerHealth;
        //represents current position of the player
        //the "5" represents the player moving 5 units to the right
        this.body.setVelocity(game.data.playerMoveSpeed, 20);
        //keeps track of which direction your character is going
        this.facing = "right";
        //keeps track of the time in the game
        this.now = new Date().getTime();
        this.lastHit = this.now;
        this.dead = false;
        this.lastAttack = new Date().getTime(); //Havent used the attacked variable yet
        //the screen follows where the player moves
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
        //adding animations
        this.renderable.addAnimation("idle", [78]);
        this.renderable.addAnimation("walk", [117, 118, 119, 120, 121, 122, 123, 124, 125], 80);
        this.renderable.addAnimation("attack", [65, 66, 67, 68, 69, 70, 71, 72], 80);

        this.renderable.setCurrentAnimation("idle");
    },
    
    update: function(delta) {
        //keeps the timer up to date
        this.now = new Date().getTime();
        //if health goes below zero then the player will die
        if (this.health <= 0) {
            this.dead = true;
        }

        if (me.input.isKeyPressed("right")) {
            //adds to the position of my x by the velocity defind above
            //in setVelocity() and multiplying it by me.timer.tick
            //me.timer.tick makes the movement look smooth
            this.body.vel.x += this.body.accel.x * me.timer.tick;
            this.flipX(true);
            this.facing = "right";
        } else if (me.input.isKeyPressed("left")) {
            this.facing = "left";
            this.body.vel.x -= this.body.accel.x * me.timer.tick;
            this.flipX(false);
        } else {
            this.body.vel.x = 0;
        }

        if (me.input.isKeyPressed("jump") && !this.body.jumpig && !this.body.falling) {
            this.body.jumping = true;
            this.body.vel.y -= this.body.accel.y * me.timer.tick;
        }

        if (me.input.isKeyPressed("attack")) {
            if (!this.renderable.isCurrentAnimation("attack")) {
                console.log(!this.renderable.isCurrentAnimation("attack"));
                //sets the current animation to attack and once that is over it 
                //goes back to the idle animation
                this.renderable.setCurrentAnimation("attack", "idle");
                //Makes it so that the nect time we start this sequence we begin
                //from the first animation no thwerever we left off 
                //when we switched to another animation
                this.renderable.setAnimationFrame();
            }
        }

        //player will not start walking when you load the map
        else if (this.body.vel.x !== 0 && !this.renderable.isCurrentAnimation("attack")) {
            if (!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
            }
        } else if (!this.renderable.isCurrentAnimation("attack")) {
            this.renderable.setCurrentAnimation("idle");
        }

        me.collision.check(this, true, this.collideHandler.bind(this), true);
        //delta is the time changed
        this.body.update(delta);

        this._super(me.Entity, "update", [delta]);
        return true;
    },
    
    loseHealth: function(damage) {
        this.health = this.health - damage;
    },
    
    collideHandler: function(response) {
        if (response.b.type === 'EnemyBaseEntity') {
            var ydif = this.pos.y - response.b.pos.y;
            var xdif = this.pos.x - response.b.pos.x;

            if (ydif < -40 && xdif < 70 && xdif > -35) {
                this.body.falling = false;
                this.body.vel.y = -1;
            }
            else if (xdif > -35 && this.facing === 'right' && (xdif < 0)) {
                this.body.vel.x = 0;
                // this.pos.x = this.pos.x -1;
            } else if (xdif < 70 && this.facing === 'left' && xdif > 0) {
                this.body.vel.x = 0;
                //this.pos.x = this.pos.x +1;
            }
            //if its in contact with the base and if its attacking the player
            //will lose its health
            //also is checking to see if the base has been hit in the last 400 seconds so it doesnt happen
            //over and over again
            //once its done its going to put the new time in the variable
            if (this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttack) {
                console.log("tower Hit");
                this.lastHit = this.now;

                response.b.loseHealth(game.data.playerAttack);
            }
        } else if (response.b.type === 'EnemyCreep') {
            var xdif = this.pos.x - response.b.pos.x;
            var ydif = this.pos.y - response.b.pos.y;

            if (xdif > 0) {
                //this.pos.x =this.pos.x + 1;
                //does not let you attack if you're attacking left
                if (this.facing === "left") {
                    this.body.vel.x = 0;
                }
            } else {
                //this.pos.x = this.pos.x + 1;
                //does not let you attack if youre facing right
                if (this.facing === "right") {
                    this.body.vel.x = 0;
                }
            }
            //Loses health when attacked, takes 10 attacks to kill the creep
            if (this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttackTimer
                    && (Math.abs(ydif) <= 40 &&
                            ((xdif > 0) && this.facing === "left") || ((xdif < 0) && this.facing === "right"))
                    ) {
                this.lastHit = this.now;
                response.b.loseHealth(game.data.playerAttack);
            }
        }
    }
});


game.PlayerBaseEntity = me.Entity.extend({
    init: function(x, y, settings) {
        this._super(me.Entity, 'init', [x, y, {
                image: "tower",
                width: 100,
                height: 100,
                spritewidth: "100",
                spriteheight: "100",
                getShape: function() {
                    return (new me.Rect(0, 0, 100, 70)).toPolygon();
                }
            }]);
        this.broken = false;
        this.health = game.data.playerBaseHealth;
        this.alwaysUpdate = true;
        this.body.onCollision = this.onCollision.bind(this);
        this.type = "PlayerBase"; //removes the burning animation from the tower
        this.renderable.addAnimation("idle", [0]);
        this.renderable.addAnimation("broken", [1]);
        this.renderable.setCurrentAnimation("idle");

    },
    
    update: function(delta) {
        if (this.health <= 0) {
            this.broken = true;
            this.renderable.setCurrentAnimation("broken");
        }
        this.body.update(delta);

        this._super(me.Entity, "update", [delta]);
        return true;
    },
    
    loseHealth: function(damage) {
        this.health = this.health - damage; //makes the base lose health when it is attacked
    },
    
    onCollision: function() {

    }
});

game.EnemyBaseEntity = me.Entity.extend({
    init: function(x, y, settings) {
        this._super(me.Entity, 'init', [x, y, {
                image: "tower",
                width: 100,
                height: 100,
                spritewidth: "100",
                spriteheight: "100",
                getShape: function() {
                    return (new me.Rect(0, 0, 100, 70)).toPolygon();
                }
            }]);
        this.broken = false;
        this.health = game.data.enemyBaseHealth;
        this.alwaysUpdate = true;
        this.body.onCollision = this.onCollision.bind(this);

        this.type = "EnemyBaseEntity";
        this.renderable.addAnimation("idle", [0]);
        this.renderable.addAnimation("broken", [1]);
        this.renderable.setCurrentAnimation("idle");
    },
    
    update: function(delta) {
        if (this.health <= 0) {
            this.broken = true;
            this.renderable.setCurrentAnimation("broken");
        }
        this.body.update(delta);

        this._super(me.Entity, "update", [delta]);
        return true;
    },
    
    onCollision: function() {

    },
    //detects collisons consistently
    loseHealth: function() {
        this.health--;
    }
    
});

game.EnemyCreep = me.Entity.extend({
    init: function(x, y, settings) {
        this._super(me.Entity, 'init', [x, y, {
                image: "creep1",
                width: 32,
                height: 64,
                spritewidth: "32",
                spriteheight: "64",
                getShape: function() {
                    return (new me.Rect(0, 0, 32, 64)).toPolygon();
                }
            }]);
        this.health = game.data.enemyCreepHealth;
        this.alwaysUpdate = true;
        //this.attacking lets us know if the enemy is currently attacking
        this.attacking = false;
        //keeps track of when our creep last atacked anything
        this.lastAttacking = new Date().getTime();
        //keeps track of the last time our creep hit anything
        this.lastHit = new Date().getTime();
        this.now = new Date().getTime();
        this.body.setVelocity(3, 20);

        this.type = "EnemyCreep";

        this.renderable.addAnimation("walk", [3, 4, 5], 80);
        this.renderable.setCurrentAnimation("walk");

    },
    
    //makes enemy creep killable
    loseHealth: function(damage) {
        this.heath = this.health - damage;
    },
    
    update: function(delta) {
        console.log(this.health);
        //kills the creep when it is attacked
        if (this.health <= 0) {
            me.game.world.removeChild(this);
        }
        //this will allow the function to refresh 
        this.now = new Date().getTime();

        this.body.vel.x -= this.body.accel.x * me.timer.tick;

        me.collision.check(this, true, this.collideHandler.bind(this), true);

        this.body.update(delta);

        this._super(me.Entity, "update", [delta]);

        return true;
    },
    
    collideHandler: function(response) {
        if (response.b.type === 'PlayerBase') {
            this.attacking = true;
            //this.lastAttacking=this.now;
            this.body.vel.x = 0;
            //keeps moving the creep to the right to maintain its position
            this.pos.x = this.pos.x + 1;
            //check another timer when the last time the palyer attacked the base
            //checks that it fas been at least 1 second since this creep hit a base
            if ((this.now - this.lastHit >= 1000)) {
                //reseting the timer to now
                //updates the lasthit timer
                this.lastHit = this.now;
                //makes the player base call its loseHealth function and pastes it a 
                //damge of 1.
                //calling a function to make the player lose
                response.b.loseHealth(game.data.enemyCreepAttack);
            }
        } else if (response.b.type === 'PlayerEntity') {
            var xdif = this.pos.x - response.b.pos.x;


            this.attacking = true;
            //this.lastAttacking=this.now;

            if (xdif > 0) {
                console.log(xdif);
                //keeps moving the creep to the right to maintain its position
                this.pos.x = this.pos.x + 1;
                this.body.vel.x = 0;
            }
            //check another timer when the last time the palyer attacked the base
            //checks that it fas been at least 1 second since this creep hit a base
            if ((this.now - this.lastHit >= 1000) && xdif > 0) {
                //reseting the timer to now
                //updates the lasthit timer
                this.lastHit = this.now;
                //makes the player call its loseHealth function and pastes it a 
                //damge of 1.
                //calling a function to make the player lose
                response.b.loseHealth(game.data.enemyCreepAttack);
            }
        }
    }

});

game.GameManager = Object.extend({
    init: function(x, y, settings) {
        this.now = new Date().getTime();
        this.lastCreep = new Date().getTime();

        this.alwaysUpdate = true;
    },
    
    update: function() {
        this.now = new Date().getTime();

        if (game.data.player.dead) {
            me.game.world.removeChild(game.data.player);
            me.state.current().resetPlayer(10, 0);
        }

        //mod checks if you have a multiple of 10
        //makes sure that its not spawning over and over again
        if (Math.round(this.now / 1000) % 10 === 0 && (this.now - this.lastCreep >= 1000)) {
            this.lastCreep = this.now;
            var creepe = me.pool.pull("EnemyCreep", 1000, 0, {});
            //adding creep to the world
            me.game.world.addChild(creepe, 5);
        }

        return true;
    }
});