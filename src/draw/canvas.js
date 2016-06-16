module.exports = function(DrawingContext, sprinting) {
  CanvasContext.prototype = new DrawingContext(sprinting.INTERNAL_KEY)
  CanvasContext.prototype.constructor = CanvasContext
  CanvasContext.prototype.uber = DrawingContext.prototype

  /**
   * A CanvasContext is an inheritor of DrawingContext used for drawing with the HTML5 Canvas. It is automatically instanced when a new World is created with the `usage` World.USAGE_CANVAS.
   * It has no new public attributes that it doesn't share with DrawingContext.
   *
   * @class DRAW.CanvasContext
   * @see DrawingContext
   * @param {Sprinting.DRAW.World} world
   */
  function CanvasContext(world) {
    this.dcInit(world)
  }

  /**
   * Method used to draw all it's shapes to the parent World.
   *
   * @function DRAW.CanvasContext.draw
   */
  CanvasContext.prototype.draw = function() {
    this.shapes.forEach(shape => shape.draw())
  }

  return CanvasContext
}
