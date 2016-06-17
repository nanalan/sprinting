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
   * @memberof Sprinting.DRAW
   * @private
   */
  function CanvasContext(world) {
    this.dcInit(world)
    this.canvas = document.createElement('canvas')
    this.ctx    = this.canvas.getContext('2d')

    this.canvas.setAttribute('width',  this.world.element.style.width  || 100)
    this.canvas.setAttribute('height', this.world.element.style.height || 100)

    this.world.element.appendChild(this.canvas)
  }

  CanvasContext.TWO_PI = 2 * Math.PI

  CanvasContext.reactToOptions = function(options, ctx) {
    ctx.strokeStyle = options.stroke
    ctx.fillStyle   = options.fill
    ctx.lineWidth   = options.strokeWidth
    ctx.rotation    = options.rotationUnit === sprinting.DRAW.DrawingContext.ROT_DEG ? options.rotation * Math.PI / 180 : options.rotation
    console.log(ctx.rotation, options.rotation)

    return ctx
  }

  CanvasContext.generalShapeFunction = function(paramDefaults, code) {
    return function(...args) {
      let nonRequiredArgs = paramDefaults.map((param, index) => typeof args[index] === 'undefined' ? param : args[index])
      console.log(args, paramDefaults.length + 1)
      let options = sprinting.DRAW.DrawingContext.fillOptions(args[paramDefaults.length] || {})// There's one non-paramDefault args, but as arrays are 0-indexed we don't have to add anything.

      return new sprinting.DRAW.Shape(function(drawingCtx) {
        let ctx = CanvasContext.reactToOptions(options, drawingCtx.ctx)
        ctx.save()
        code(ctx, ...nonRequiredArgs, options)
        ctx.restore()
      })
    }
  }

  /**
   * Method used to draw all of the CanvasContext's Things to the parent World.
   *
   * @function draw
   * @memberof Sprinting.DRAW.CanvasContext
   * @instance
   */
  CanvasContext.prototype.draw = function() {
    this.shapes.forEach(shape => shape.draw(this))
  }

  CanvasContext.prototype.rectangle = CanvasContext.generalShapeFunction([0, 0, 50, 50], function(ctx, x, y, w, h, options) {
    ctx.translate(x, y)
    ctx.rotate(ctx.rotation)
    if(options.doFill) ctx.fillRect(0, 0, w, h)
    ctx.strokeRect(0, 0, w, h)
  })

  CanvasContext.prototype.ellipse = CanvasContext.generalShapeFunction([0, 0, 50, 50], function(ctx, x, y, w, h, options) {
    ctx.translate(x, y)
    ctx.rotate(ctx.rotation)
    ctx.beginPath()
    ctx.arc(0, 0, w, h, DrawingContext.TWO_PI)
    if(options.doFill) ctx.fill()
    ctx.stroke()
    ctx.closePath()
  })

  CanvasContext.prototype.polygon = CanvasContext.generalShapeFunction([[], []], function(ctx, xPoints, yPoints, options) {
    ctx.translate(xPoints[0] || 0, yPoints[0] || 0)
    ctx.rotate(ctx.rotation)
    ctx.beginPath()
    xPoints.forEach(x, i => {
      let y = yPoints[i]
      ctx.lineTo(xPoints[0] - x, yPoints[0] - y)
    })
    if(options.doFill) ctx.fill()
    ctx.stroke()
    ctx.closePath()
  })

  CanvasContext.prototype.line = CanvasContext.generalShapeFunction([0, 0, 50, 50], function(ctx, x1, y1, x2, y2, options) {
      ctx.translate(x1, y1)
      ctx.rotate(ctx.rotation)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(x2 - x1, y2 - y1)
      ctx.stroke()
      ctx.closePath()
  })

  return CanvasContext
}
