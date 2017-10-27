// Mover.js
/*
var Mover = pc.createScript('mover');

Mover.prototype.initialize = function()
{
  
};

Mover.prototype.update = function(dt)
{
  var position = this.entity.getPosition();
  position.x += dt * 0.15;
  this.entity.setPosition(position);
};
*/

function Mover(app)
{
	var ScriptObject = function(entity)
	{
			this.entity = entity;
	};

	return ScriptObject;
};

Mover.prototype.initialize = function()
{
  
};

Mover.prototype.update = function(dt)
{
	var position = this.entity.getPosition();
	position.x += dt * 0.15;
	this.entity.setPosition(position);
};

pc.script.create("mover", Mover);
