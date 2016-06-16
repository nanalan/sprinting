module.exports = function(DrawingContext, sprinting) {
  CanvasContext.prototype = new DrawingContext(sprinting.INTERNAL_KEY)
  CanvasContext.prototype.constructor = CanvasContext
  CanvasContext.prototype.uber = DrawingContext.prototype

  /**
   * A CanvasContext is an inheritor of DrawingContext used for drawing with the HTML5 Canvas. It is automatically instanced when a new World is created with the `usage` World.USAGE_CANVAS.
   * It also has the member `canvas`, which is the HTML5 Canvas element, and `ctx`, which is the canvas' context.
   *
   * @class CanvasContext
   * @see DrawingContext
   * @param {DRAW.World} world
   * @memberof DRAW
   * @private
   */
  function CanvasContext(world) {
    this.dcInit(world)
    this.canvas = document.createElement('canvas')
    this.ctx    = this.canvas.getContext('2d')

    this.canvas.setAttribute('width', this.world.width)
    this.canvas.setAttribute('height', this.world.height)

    this.world.element.appendChild(this.canvas)
  }

  /**
   * Method used to draw all it's shapes to the parent World.
   *
   * @function DRAW.CanvasContext.draw
   */
  CanvasContext.prototype.draw = function() {
    this.shapes.forEach(shape => shape.draw(this))
  }

  CanvasContext.prototype.rectangle = function(x, y, w, h, options) {
    options = sprinting.DRAW.DrawingContext.fillOptions(options)
    console.log(options)
    return new sprinting.DRAW.Shape(function(drawingCtx) {
      let ctx = drawingCtx.ctx

      ctx.strokeStyle = options.stroke
      ctx.fillStyle   = options.fill
      ctx.lineWidth   = options.strokeWidth
      // ctx.rotate(options.rotationUnit === sprinting.DRAW.DrawingContext.ROT_DEG ? options.rotation / Math.PI * 180 : options.rotation)

      if(options.doFill) ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)

      console.log('RECTANGLE DRAWN')
    })
  }

  return CanvasContext
}
