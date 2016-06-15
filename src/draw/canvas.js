module.exports = function(DrawingContext, sprinting) {
  CanvasContext.prototype = new DrawingContext(sprinting.INTERNAL_KEY)
  CanvasContext.prototype.constructor = CanvasContext
  CanvasContext.prototype.uber = DrawingContext.prototype

  function CanvasContext(world) {
    this.dcInit(world)
  }

  CanvasContext.prototype.draw = function() {
    this.shapes.forEach(shape => shape.draw())
  }

  return CanvasContext
}
