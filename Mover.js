var Mover = function (entity)
{
	this.entity = entity;
};

pc.script.create("mover", function(app){return Mover;});

pc.script.attribute('speed', 'number', 1.5);

Mover.prototype.initialize = function()
{
	
};

Mover.prototype.update = function(dt)
{
	var position = this.entity.getPosition();
	position.x += dt * this.speed;
	this.entity.setPosition(position);
};

