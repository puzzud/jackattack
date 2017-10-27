// Mover.js
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
