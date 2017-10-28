var Mover = function(entity)
{
    this.app = entity._app;
	this.entity = entity;
};

pc.script.create("mover", function(app){return Mover;});

pc.script.attribute("levelManager","entity");
pc.script.attribute("type", "number");
pc.script.attribute("pusher", "boolean", false);
pc.script.attribute("pushable", "boolean", true);
pc.script.attribute("puller", "boolean", false);
pc.script.attribute("faller", "boolean", true);
pc.script.attribute("crushable", "boolean", false);
pc.script.attribute("jumpHeight", "number", 0);

pc.script.attribute("xElement", "entity");
pc.script.attribute("txElement", "entity");
pc.script.attribute("tyElement", "entity");
pc.script.attribute("targetTxElement", "entity");
pc.script.attribute("targetTyElement", "entity");

Mover.prototype.initialize = function()
{
    this.tilePosition = new pc.Vec3();
    this.targetPosition = new pc.Vec3();
    this.targetTilePosition = new pc.Vec3();
    this.canMoveTilePosition = new pc.Vec3();
    this.canPullTilePosition = new pc.Vec3();
    this.belowTilePosition = new pc.Vec3();
    
    this.up = false;
    this.horizontalDirection = 0;
    
    this.moveTween = this.entity.tween();
    
    this.alive = true;
    this.falling = false;
    this.distanceFallen = 0;
    this.jumping = false;
    this.distanceJumped = 0;
    this.moving = false;
    //this.moveDirection = 0;
    this.pushed = null;
    this.pulled = null;
    
    this.updateTilePosition();
};

Mover.prototype.swap = function(old)
{
    this.tilePosition = old.tilePosition;
    this.targetPosition = old.targetPosition;
    this.targetTilePosition = old.targetTilePosition;
    this.canMoveTilePosition = old.canMoveTilePosition;
    this.canPullTilePosition = old.canPullTilePosition;
    this.belowTilePosition = old.belowTilePosition;
    
    this.up = old.up;
    this.horizontalDirection = old.horizontalDirection;
    
    this.moveTween = old.moveTween;
    
    this.alive = old.alive;
    this.falling = old.falling;
    this.distanceFallen = old.distanceFallen;
    this.jumping = old.jumping;
    this.distanceJumped = old.distanceJumped;
    this.moving = old.moving;
    //this.moveDirection = old.moveDirection;
    this.pushed = old.pushed;
    this.pulled = old.pulled;
};

Mover.prototype.postInitialize = function()
{
    //this.getLevelManager().addMover(this);
};

Mover.prototype.update = function(dt)
{
    /*
    if(this.faller)
    {
        this.fall();
    }
    */
    
    /*
    if(this.xElement !== null)
    {
        this.xElement.element.text = "X: " + this.entity.getLocalPosition().x;
    }
    */
};

Mover.prototype.setHorizontalDirection = function(direction)
{
    this.horizontalDirection = direction;
};

Mover.prototype.canMove = function(direction)
{
    this.pushed = null;
    
    if(!this.entity.enabled)
    {
        return false;
    }
    
    if(this.falling)
    {
        return false;
    }
    
    this.canMoveTilePosition.copy(this.tilePosition).x += direction;
    
    var levelManager = this.getLevelManager();
    
    if(levelManager.isOutOfBounds(this.canMoveTilePosition))
    {
        return false;
    }
    else
    {
        var mover = levelManager.getMover(this.canMoveTilePosition);
        if(mover !== null)
        {
            if(this.jumping)
            {
                return false;
            }
            if(this.type === 2 && mover.crushable)
            {
                return false;
            }
            else
            if(this.pusher && mover.pushable && !this.jumping && !this.falling && mover.canMove(direction))
            {
                this.pushed = mover;
            }
            else
            {
                return false;
            }
            
            /*
            if(this.pusher && mover.pushable && !this.jumping && !this.falling)
            {
                if(mover.canMove(direction))
                {
                    this.pushed = mover;
                }
                else
                {
                    if(this.type !== 2 && mover.crushable && !mover.canMove(direction))
                    {
                        // Not Jack pushing something that can be crushed.
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }
            }
            else
            {
                return false;
            }
            */
        }
    }
    
    return true;
};

Mover.prototype.move = function(direction)
{
    if(!this.alive)
    {
        //console.log("dead!");
        return false;
    }
    
    if(direction === undefined)
    {
        direction = this.horizontalDirection;
    }
    
    if(this.jump())
    {
        return false;
    }
    
    if(direction === 0)
    {
        return false;
    }
    
    if(this.distanceFallen > 0)
    {
        return false;
    }
    
    /*
    if(this.moving)
    {
        this.moving = direction !== 0;
        return;
    }
    */ 
    
    this.moving = direction !== 0;
    //this.moveDirection = direction;
    
    if(!this.moving)
    {
        return false;
    }

    this.targetTilePosition.copy(this.tilePosition).x += direction;
    this.updateTargetTilePosition();

    /*
    this.moveTween = this.entity
        .tween(this.entity.getLocalScale())
        .to(this.targetPosition)
        .on("complete", function(){this.stopMoing();})
        .start();
    */
    
    this.pushed = null;
    this.pulled = null;

    if(!this.canMove(direction))
    {
        //console.log("blocked");
        //this.stopMoving();
        
        return false;
    }
    
    var levelManager = this.getLevelManager();
    
    if(this.pushed !== null)
    {
        if(this.type === 2 && this.pushed.crushable)
        {
            this.pushed = null;
        }
        /*
        if(this.type === 1 && this.pushed.crushable && !this.pushed.canMove(direction)) // Block
        {
            this.pushed.die();
        }
        */
        else
        {
            this.pushed.move(direction);
            //this.pushed = null;

            if(this.type === 2) // Jack
            {
                this.entity.sound.play("Block Push");
            }
        }
        
    }
    
    if(this.puller && this.pushed === null)
    {
        // Check if we can pull.
        this.canPullTilePosition.copy(this.tilePosition).x -= direction;
        this.pulled = levelManager.getMover(this.canPullTilePosition);
    }
    
    this.performMove(this.targetTilePosition);
    
    if(this.pulled !== null)
    {
        if(this.type === 2 && this.pulled.crushable)
        {
            this.pulled = null;
        }
        else
        {
            this.pulled.move(direction);
            //this.pulled = null;

            if(this.type === 2) // Jack
            {
                this.entity.sound.play("Block Push");
            }
        }
    }
    
    this.jumping = false;

    return true;
};

/*
Mover.prototype.stopMoving = function()
{
    this.move(0);
};
*/

Mover.prototype.canFall = function()
{
    if(!this.entity.enabled)
    {
        return false;
    }
    
    /*
    if(this.falling)
    {
        return false;
    }
    */
    
    this.belowTilePosition.copy(this.tilePosition).y += -1;
    
    var levelManager = this.getLevelManager();
    
    if(levelManager.isOutOfVerticalBounds(this.belowTilePosition.y))
    {
        return false;
    }
    else
    {
        var mover = levelManager.getMover(this.belowTilePosition);
        if(mover !== null)
        {
            // Ensure mover below is grounded.
            return mover.faller && mover.crushable && !mover.canFall();
        }
    }
    
    return true;
};

Mover.prototype.fall = function()
{
    if(!this.alive)
    {
        return false;
    }
    
    if(this.jumping)
    {
        this.distanceFallen = 0;
        this.falling = false;
        return false;
    }
    
    /*
    if(!this.falling && this.jumping)
    {
        this.jump();
        
        return false;
    }
    */
    
    var levelManager = this.getLevelManager();
    
    this.belowTilePosition.copy(this.tilePosition).y += -1;
    
    if(levelManager.isOutOfVerticalBounds(this.belowTilePosition.y))
    {
        this.falling = false;
        this.distanceFallen = 0;
        return false;
    }

    // Check if crushing something.
    var moverBelow = levelManager.getMover(this.belowTilePosition);
    if(moverBelow !== null)
    {
        if(!moverBelow.crushable || moverBelow.canFall())
        {
            this.falling = false;
            this.distanceFallen = 0;
            return false;
        }
        else
        {
            moverBelow.die();
        }
    }
    
    this.falling = true;
    ++this.distanceFallen;
    
    this.performMove(this.belowTilePosition);
    
    return true;
};

Mover.prototype.setUp = function(up)
{
    this.up = up;
    
    /*
    if(!up)
    {
        this.jumping = false;
        
        return false;
    }
    
    if(up && this.falling)
    {
        this.jumping = false;
        
        return false;
    }
    
    this.jumping = true;
    */
    
    return true;
};

Mover.prototype.jump = function()
{
    if(this.falling)
    {
        this.jumping = false;
        this.distanceJumped = 0;
        
        return false;
    }
    
    if(!this.up)
    {
        this.jumping = false;
        this.distanceJumped = 0;
        
        return false;
    }
    
    if(!this.jumping && this.canFall())
    {
        return false;
    }
    
    if(this.distanceJumped >= this.jumpHeight)
    {
        this.jumping = false;
        
        return false;
    }
    
    var levelManager = this.getLevelManager();
    
    // TODO: This variable name is inaccurate.
    this.belowTilePosition.copy(this.tilePosition).y += 1;
    
    if(levelManager.isOutOfVerticalBounds(this.belowTilePosition.y))
    {
        this.jumping = false;
        this.distanceJumped = 0;
        
        return false;
    }

    // Check if crushing something.
    var moverBelow = levelManager.getMover(this.belowTilePosition);
    if(moverBelow !== null)
    {
        this.jumping = false;
        this.distanceJumped = 0;
        
        return false;
    }
    
    this.jumping = true;

    this.performMove(this.belowTilePosition);
    
    ++this.distanceJumped;
    
    return true;
};

Mover.prototype.performMove = function(tilePosition)
{
    var levelManager = this.getLevelManager();
    
    var position = this.entity.getLocalPosition();
    levelManager.fromTilePosition(tilePosition, position);
    this.entity.setLocalPosition(position);

    levelManager.move(this.entity.script.mover, tilePosition);

    this.tilePosition.copy(tilePosition);

    this.updateTilePosition();
};

Mover.prototype.updateTilePosition = function()
{
    this.getLevelManager().toTilePosition(this.entity.getLocalPosition(), this.tilePosition);
    
    if(this.txElement !== null)
    {
        this.txElement.element.text = "TX: " + this.tilePosition.x;
        this.tyElement.element.text = "TY: " + this.tilePosition.y;
    }
};

Mover.prototype.updateTargetTilePosition = function(moveDirection)
{
    if(this.targetTxElement !== null)
    {
        this.targetTxElement.element.text = "TTX: " + this.targetTilePosition.x;
        this.targetTyElement.element.text = "TTY: " + this.targetTilePosition.y;
    }
};

Mover.prototype.getLevelManager = function()
{
    return this.levelManager.script.levelManager;
};

Mover.prototype.die = function()
{
    var thisMover = this.entity.script.mover;
    
    var levelManager = this.getLevelManager();
    
    levelManager.removeMover(thisMover);

    thisMover.entity.sound.play("Squashed");

    thisMover.entity.model.enabled = false;
    thisMover.entity.script.enabled = false;
    thisMover.alive = false;
    //thisMover.jumping = false;
    //thisMover.falling = false;

    levelManager.checkTurnEndConditions();
};
