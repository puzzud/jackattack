var JackController = function(entity)
{
	this.entity = entity;
};

pc.script.create("jackController", function(app){return JackController;});

pc.script.attribute("levelManager","entity");

JackController.prototype.initialize = function()
{
    this.horizontalDirection = 0;
    this.up = false;
    
    //this.grabbing = false;
    
    this.initializeEvents();
};

JackController.prototype.swap = function(old)
{
    this.horizontalDirection = old.horizontalDirection;
    this.up = old.up;
    
    //this.grabbing = old.grabbing;
    
    this.initializeEvents(old);
};

JackController.prototype.initializeEvents = function(old)
{
    this.initializeKeyboard(old);
};

JackController.prototype.initializeKeyboard = function(old)
{
    if(old !== undefined)
    {
        this.app.keyboard.off(pc.EVENT_KEYDOWN, old.onKeyDown, old);
        this.app.keyboard.off(pc.EVENT_KEYUP, old.onKeyUp, old);
    }
    
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
};

JackController.prototype.update = function(dt)
{
    /*
    var newHorizontalDirection = 0;
    
    if(this.app.keyboard.isPressed(pc.KEY_LEFT))
    {
        newHorizontalDirection += -1;
    }
    else if(this.app.keyboard.isPressed(pc.KEY_RIGHT))
    {
        newHorizontalDirection += 1;
    }
    
    if(newHorizontalDirection !== this.horizontalDirection)
    {
        this.horizontalDirection = newHorizontalDirection;
        this.getMover().setHorizontalDirection(newHorizontalDirection);
    }
    */
    
    /*
    if(this.app.keyboard.isPressed(pc.KEY_UP))
    {
        this.jumping = true;
    }
    
    // TODO: Do something with grabbing.
    this.grabbing = this.app.keyboard.isPressed(pc.KEY_SPACE);
    */
    /* 
    if(this.horizontalDirection === 0)
    {
        return;
    }
    
    var mover = this.entity.script.mover;
    if(mover !== undefined)
    {
        mover.move(this.horizontalDirection);
    }
    */
    /*
    if(this.up)
    {
        this.getMover().setUp(this.up);
    }
    */
};

JackController.prototype.onKeyDown = function(event)
{
    switch(event.key)
    {
        case pc.KEY_LEFT:
        {
            this.horizontalDirection = -1;
            this.getMover().setHorizontalDirection(this.horizontalDirection);
            break;
        }
        
        case pc.KEY_RIGHT:
        {
            this.horizontalDirection = 1;
            this.getMover().setHorizontalDirection(this.horizontalDirection);
            break;
        }
        
        case pc.KEY_UP:
        {
            this.up = true;
            this.getMover().setUp(this.up);
            break;
        }
            
        case pc.KEY_SPACE:
        {
            this.setGrabbing(true);
            return;
        }
            
        default:
        {
        }
    }
    
    /*
    if(this.horizontalDirection !== 0)
    {
        var mover = this.getMover();
        mover.move(this.horizontalDirection);

        this.horizontalDirection = 0;
    }
    */
};

JackController.prototype.onKeyUp = function(event)
{
    switch(event.key)
    {
        case pc.KEY_LEFT:
        case pc.KEY_RIGHT:
        {
            if(!this.app.keyboard.isPressed(pc.KEY_LEFT) && !this.app.keyboard.isPressed(pc.KEY_RIGHT))
            {
                this.horizontalDirection = 0;
                this.getMover().setHorizontalDirection(this.horizontalDirection);
            }
            
            break;
        }
        
        case pc.KEY_UP:
        {
            this.up = false;
            this.getMover().setUp(this.up);
            break;
        }
        
        case pc.KEY_SPACE:
        {
            this.setGrabbing(false);
            break;
        }
    }
};

JackController.prototype.getMover = function()
{
    var mover = this.entity.script.mover;
    if(mover === undefined)
    {
        return null;
    }
    
    return mover;
};

JackController.prototype.setGrabbing = function(grabbing)
{
    var mover = this.entity.script.mover;
    if(mover !== undefined)
    {
        mover.pusher = grabbing;
        mover.puller = grabbing;
    }
};
