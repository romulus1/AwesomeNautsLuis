game.TitleScreen = me.ScreenObject.extend({
	/**	
	 *  action to perform on state change
	 */
	onResetEvent: function() {	
		me.game.world.addChild(new me.Sprite(0, 0, me.loader.getImage('title-screen')), -10); // TODO
		
                me.input.bindKey(me.input.KEY.ENTER, "start"); //binds "ENTER" key with start function
                
                me.game.world.addChild(new (me.Renderable.extend({
                    init: function(){
                        this._super(me.Renderable, 'init', [510, 30, me.game.viewport.width, me.game.viewport.height]);
                        this.font = new me.Font("Arial", 46, "white"); //chooses font, size and color
                    },
                    
                    draw: function(renderer){
                        this.font.draw(renderer.getContext(), "Awesomenauts!", 350, 130); //shows text "awesomenauts!"
                        this.font.draw(renderer.getContext(), "Press ENTER to play!", 290, 400);
                    }
                })));
                
                this.handler = me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge){//event handler listens for when someone presses the enter button
                    if(action === "start"){
                        me.state.change(me.state.PLAY);
                    }
                }); 

	},
	
	
	/**	
	 *  action to perform when leaving this screen (state change)
	 */
	onDestroyEvent: function() {
            me.input.unbindKey(me.input.KEY.ENTER); //unbinds "ENTER" key so it doesn't restart the game
            me.event.unsubscribe(this.handler);
	}
});