game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {
        game.data.score = 0;//resets the score

        me.levelDirector.loadLevel("level01");//loaded level

        this.resetPlayer(0, 420);

        //var player = me.pool.pull("player", 0, 420);//pulling player to the pool
        //me.game.world.addChild(player, 5);//adding the player to the world	

        var gameTimerManager = me.pool.pull("GameTimerManager", 0, 0, {});
        me.game.world.addChild(gameTimerManager, 0);

        var heroDeathManager = me.pool.pull("HeroDeathManager", 0, 0, {});
        me.game.world.addChild(heroDeathManager, 0);

        var experienceManager = me.pool.pull("ExperienceManager", 0, 0, {});
        me.game.world.addChild(experienceManager, 0);

        me.input.bindKey(me.input.KEY.D, "right");//this binds the right key
        me.input.bindKey(me.input.KEY.A, "left");//this binds the left key
        me.input.bindKey(me.input.KEY.F, "attack");
        me.input.bindKey(me.input.KEY.W, "jump");
        me.input.bindKey(me.input.KEY.ENTER, "enter");

        // add our HUD to the game world
        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD);
    },
    
    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() {
        // remove the HUD from the game world
        me.game.world.removeChild(this.HUD);
    },
    
    resetPlayer: function(x, y) {
        game.data.player = me.pool.pull("player", x, y, {});//pulling player to the pool
        me.game.world.addChild(game.data.player, 5);//adding the player to the world	
    }
});