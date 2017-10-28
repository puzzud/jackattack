var LevelManager = function(entity)
{
    this.app = entity._app;
	this.entity = entity;
};

pc.script.create("levelManager", function(app){return LevelManager;});

pc.script.attribute("cycleTimeLength", "number", 0.125);

pc.script.attribute("marquee", "entity");
pc.script.attribute("marqueeColorDefault", "rgb");
pc.script.attribute("marqueeColorDeath", "rgb");

pc.script.attribute("levelNumberField", "entity");
pc.script.attribute("levelNameField", "entity");

pc.script.attribute("jack", "entity");
pc.script.attribute("blockPrefab", "entity");
pc.script.attribute("balloonPrefab", "entity");

LevelManager.prototype.endTurnCauseText =
[
    "Jack Died",
    "Enemies Defeated"
];

LevelManager.prototype.initialize = function()
{   
    this.map = [];
    //this.tileXOffset = 0;
    this.movers = [];
    this.deadMovers = [];
    
    this.runningTime = 0.0;
    this.cycleCount = 0;
    
    this.levelNumber = 1;
    
    //this.jack = null;
    this.blocks = [];
    this.balloons = [];
    
    this.initializeEvents();
};

LevelManager.prototype.swap = function(old)
{
    this.map = old.map;
    //this.tileXOffset = old.tileXOffset;
    this.movers = old.movers;
    this.deadMovers = old.deadMovers;
    
    this.runningTime = old.runningTime;
    this.cycleCount = old.cycleCount;
    
    this.levelNumber = old.levelNumber;
    
    //this.jack = old.jack;
    this.blocks = old.blocks;
    this.balloons = old.balloons;
    
    this.initializeEvents(old);
};

LevelManager.prototype.postInitialize = function()
{
    this.startTurn();
};

LevelManager.prototype.initializeEvents = function(old)
{
    if(old !== undefined)
    {
        this.app.off("start_turn", old.onStartTurn, old);
        this.app.off("end_turn", old.onEndTurn, old);
    }
    
    this.app.on("start_turn", this.onStartTurn, this);
    this.app.on("end_turn", this.onEndTurn, this);
    
    this.initializeKeyboard(old);
};

LevelManager.prototype.initializeKeyboard = function(old)
{
    if(old !== undefined)
    {
        this.app.keyboard.off(pc.EVENT_KEYDOWN, old.onKeyDown, old);
        this.app.keyboard.off(pc.EVENT_KEYUP, old.onKeyUp, old);
    }
    
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
};

LevelManager.prototype.update = function(dt)
{
    this.runningTime += dt;
    
    var numberOfCycles = this.runningTime / this.cycleTimeLength;
    if(numberOfCycles < 1.0)
    {
        return;
    }
    
    var numberOfWholeCycles = numberOfCycles | 0;
    
    for(var i = 0; i < numberOfWholeCycles; ++i)
    {
        this.cycle();
    }
    
    this.runningTime -= numberOfWholeCycles * this.cycleTimeLength;
};

LevelManager.prototype.cycle = function()
{
    ++this.cycleCount;
    
    var numberOfColumns = this.map[0].length; // NOTE: Assumes at least one row.
    var numberOfRows = this.map.length;
    
    var mover = null;
    var row = null;
    var x = 0;
    var y = 0;
    
    if((this.cycleCount & 1) === 1)
    {
        for(var i = 0; i < this.movers.length; ++i)
        {
            mover = this.movers[i];

            if(mover !== null)
            {
                mover.move();
            }
        }
    }
    else
    {
        for(y = 0; y < numberOfRows; ++y)
        {
            row = this.map[y];

            for(x = 0; x < numberOfColumns; ++x)
            {
                mover = row[x];

                if(mover !== null && mover.faller)
                {
                    mover.fall();
                }
            }
        }
    }
};

LevelManager.prototype.toTilePosition = function(position, tilePosition)
{
    tilePosition.x = Math.floor((position.x + 0.0));// | 0;
    tilePosition.y = Math.floor((position.y + 0.0));// | 0;
    
    //tilePosition.x += this.tileXOffset;
};

LevelManager.prototype.fromTilePosition = function(tilePosition, position)
{
    position.x = tilePosition.x;// - (this.tileXOffset);
    position.y = tilePosition.y;
};

LevelManager.prototype.isOutOfHorizontalBounds = function(tilePositionX)
{
    var numberOfColumns = this.map[0].length; // NOTE: Assumes at least one row.
    
    if(tilePositionX < 0 || tilePositionX >= numberOfColumns)
    {
        return true;
    }
    
    return false;
};

LevelManager.prototype.isOutOfVerticalBounds = function(tilePositionY)
{
    var numberOfRows = this.map.length;
    
    if(tilePositionY < 0 || tilePositionY >= numberOfRows)
    {
        return true;
    }
    
    return false;
};

LevelManager.prototype.isOutOfBounds = function(tilePosition)
{
    return this.isOutOfHorizontalBounds(tilePosition.x) || this.isOutOfVerticalBounds(tilePosition.y);
};

LevelManager.prototype.clearMap = function()
{
    var numberOfRows = this.map.length;
    
    for(var y = 0; y < numberOfRows; ++y)
    {
        var row = this.map[y];
        var numberOfColumns = row.length;
        row.fill(null, 0, numberOfColumns);
    }
};

LevelManager.prototype.loadLevel = function()
{
    var levelFileName = "Level" + this.levelNumber + ".txt";
    var level = null;
    level = this.app.assets.find(levelFileName);
    if(level === undefined)
    {
        this.levelNumber = 1;
        return this.loadLevel();
    }
    
    var rows = level.resource.split("\n");
    rows = rows.filter(function(row){return row.length !== 0;});
    var levelName = rows[0];
    rows.splice(0, 1);
    rows.reverse();
    rows.splice(0, 1); // NOTE: Remove first element for bottom of map. TODO: Account for this better.
    
    // Dimension the map.
    var numberOfColumns = rows[0].length;
    var numberOfRows = rows.length;
    
    this.map = [];
    
    for(var y = 0; y < numberOfRows; ++y)
    {
        var row = [];
        row.length = numberOfColumns;
        row.fill(null, 0, numberOfColumns);
        
        this.map.push(row);
    }
    
    // Populate map.
    this.blockPrefab.enabled = true;
    this.balloonPrefab.enabled = true;
    
    this.movers = this.deadMovers.concat(this.movers);
    this.disableMovers(this.movers);
    this.deadMovers = [];
    this.movers = [];
    
    for(var y = 0; y < numberOfRows; ++y)
    {
        var cells = rows[y].split("");
        
        var row = this.map[y];
        
        for(var x = 0; x < numberOfColumns; ++x)
        {
            var cellType = cells[x];
            
            if(cellType === ".")
            {
                cellType = 0;
            }
            
            cellType = parseInt(cellType);
            
            var mover = this.getAvailableMoverByType(cellType);
            
            if(mover !== null)
            {
                mover.entity.model.enabled = true;
                mover.entity.script.enabled = true;
                mover.entity.enabled = true;
                mover.alive = true;
                
                var tilePosition = mover.tilePosition;
                tilePosition.x = x;
                tilePosition.y = y;
                
                //row[x] = mover;
                this.addMover(mover);
                mover.performMove(tilePosition);
            }
        }
    }
    
    /*
    var mover = null;
    for(var i = 0; i < this.movers.length; ++i)
    {
        mover = this.movers[i];
    }
    */
    
    this.blockPrefab.enabled = false;
    this.balloonPrefab.enabled = false;
    
    this.updateLevelFields(this.levelNumber, levelName);
};

LevelManager.prototype.reloadLevel = function()
{
    var numberOfColumns = this.map[0].length; // NOTE: Assumes at least one row.
    var numberOfRows = this.map.length;
    
    this.movers = this.deadMovers.concat(this.movers);
    this.deadMovers = [];
    
    this.clearMap();
    
    var mover = null;
    for(var i = 0; i < this.movers.length; ++i)
    {
        mover = this.movers[i];
        
        var existingMover = null;
        
        var x = 0;
        var y = 0;
        do
        {
            x = pc.math.random(0, numberOfColumns) | 0;
            y = pc.math.random(0, numberOfRows) | 0;
            
            //var position = mover.entity.getLocalPosition();
            mover.tilePosition.x = x;
            mover.tilePosition.y = y;
            
            existingMover = this.getMover(mover.tilePosition);
        }
        while(existingMover !== null);
        
        mover.performMove(mover.tilePosition);
        
        mover.entity.enabled = true;
        mover.entity.model.enabled = true;
        mover.entity.script.enabled = true;
        mover.alive = true;
    }
    
    this.updateLevelFields(this.levelNumber, levelName);
};

LevelManager.prototype.addMover = function(mover)
{
    if(this.isOutOfBounds(mover.tilePosition))
    {
        return false;
    }
    
    this.map[mover.tilePosition.y][mover.tilePosition.x] = mover;
    
    this.movers.push(mover);
    
    return true;
};

LevelManager.prototype.removeMover = function(mover)
{
    var index = this.movers.indexOf(mover);
    if(index > -1)
    {
        this.movers.splice(index, 1);
        
        this.map[mover.tilePosition.y][mover.tilePosition.x] = null;
        
        // TODO: This function is not really intended for killing.
        this.deadMovers.push(mover);
        
        return true;
    }
    
    return false;
};

LevelManager.prototype.getMover = function(tilePosition)
{
    if(this.isOutOfBounds(tilePosition))
    {
        return null;
    }
    
    return this.map[tilePosition.y][tilePosition.x];
};

LevelManager.prototype.getAvailableMoverByType = function(type)
{
    var mover = null;
    
    /*
    if(type === 0)
    {
        
    }
    */
    
    if(type === 1)
    {
        mover = this.getAvailableMover(this.blocks, this.blockPrefab);
    }
    
    if(type === 2)
    {
        mover = this.jack;
    }
    
    if(type === 3)
    {
        mover = this.getAvailableMover(this.balloons, this.balloonPrefab);
    }
    
    //console.error("LevelManager::getAvailableMoverByType");
    
    if(mover !== null)
    {
        mover = mover.script.mover;
    }
    
    return mover;
};

LevelManager.prototype.getAvailableMover = function(movers, prefab)
{
    var mover = null;
    for(var i = 0; i < movers.length; ++i)
    {
        mover = movers[i];
        
        if(!mover.enabled)
        {
            return mover;
        }
    }
    
    // Clone a new one from prefab.
    mover = prefab.clone();
    //mover.entity.enabled = true;
    prefab.parent.addChild(mover);
    
    movers.push(mover);
    
    return mover;
};

LevelManager.prototype.disableMovers = function(movers)
{
    var mover = null;
    for(var i = 0; i < movers.length; ++i)
    {
        mover = movers[i];
        
        mover.entity.enabled = false;
    }
};

LevelManager.prototype.move = function(mover, tilePosition)
{
    this.map[mover.tilePosition.y][mover.tilePosition.x] = null;
    this.map[tilePosition.y][tilePosition.x] = mover;
};

LevelManager.prototype.checkTurnEndConditions = function()
{
    var numberOfJacks = 0;
    var numberOfEnemies = 0;
    
    var mover = null;
    for(var i = 0; i < this.movers.length; ++i)
    {
        mover = this.movers[i];
        
        numberOfJacks += (mover.entity.name === "Jack") ? 1 : 0;
        numberOfEnemies += (mover.entity.name === "Balloon") ? 1 : 0;
    }
    
    var endable = (numberOfJacks < 1 || numberOfEnemies < 1);
    
    if(endable)
    {
        this.app.fire("end_turn", numberOfJacks < 1 ? 0 : 1);
    }
    
    return endable;
};

LevelManager.prototype.startTurn = function()
{
    this.loadLevel();
    
    this.setMarquee("Jack Attack", this.marqueeColorDefault);
    
    this.app.fire("start_turn");
};

LevelManager.prototype.onStartTurn = function()
{
    this.entity.sound.play("Start Turn");
};

LevelManager.prototype.onEndTurn = function(cause)
{
    var endTurnCauseText = this.endTurnCauseText[cause];
    
    this.setMarquee(endTurnCauseText, cause === 0 ? this.marqueeColorDeath : this.marqueeColorDefault);
    
    console.log("End Turn" + ": " + endTurnCauseText);
    
    //var doNextFunction = null;
    if(cause === 0)
    {
        // Jack died.
        //doNextFunction = this.startTurn;
    }
    else if(cause === 1)
    {
        // Enemies defeated.
        ++this.levelNumber;
        //doNextFunction = this.startTurn;
    }
    
    /*
    if(doNextFunction === null)
    {
        console.error("Unhandled end turn event.");
        return;
    }
    */
    
    // Set tween timer for starting event.
    // TODO: prototype 'complete' function.
    var temp = 0;
    this.entity
        .tween(temp)
        .to(1, 1.0, pc.Linear)
        .on("complete", this.startTurn, this)
        .start();
};

LevelManager.prototype.setMarquee = function(text, color)
{
    this.marquee.element.text = text.toUpperCase();
    
    var marqueeColor = this.marquee.element.color;
    marqueeColor.set(color.r, color.g, color.b, 1.0);
};

LevelManager.prototype.updateLevelFields = function(levelNumber, levelName)
{
    this.levelNumberField.element.text = "LEVEL: " + levelNumber;
    
    this.levelNameField.element.text = levelName.toUpperCase();
};

LevelManager.prototype.onKeyDown = function(event)
{
    switch(event.key)
    {
        case pc.KEY_DELETE:
        {
            this.startTurn();
            break;
        }
        
        case pc.KEY_TAB:
        {
            ++this.levelNumber;
            this.startTurn();
            
            event.event.preventDefault();
            break;
        }
        
        case pc.KEY_F1:
        case pc.KEY_F2:
        case pc.KEY_F3:
        case pc.KEY_F4:
        case pc.KEY_F5:
        case pc.KEY_F6:
        case pc.KEY_F7:
        case pc.KEY_F8:
        case pc.KEY_F9:
        case pc.KEY_F10:
        case pc.KEY_F11:
        case pc.KEY_F12:
        {
            break;
        }
        
        default:
        {
            event.event.preventDefault();
        }
    }
};

LevelManager.prototype.onKeyUp = function(event)
{
    
};
