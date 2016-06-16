module.exports = function(sprinting) {
  /**
   * A Shape has the property `drawFn` set in construction to `fn` with the single parameter `context` of type Sprinting.DRAW.DrawingContext.
   *
   * @class DRAW.Shape
   * @param {Function} fn
   * @private
   */

  function Shape(fn) {
    this.drawFn = fn
  }

  /**
   * Calls `this.drawFn`.
   *
   * @function DRAW.Shape.draw
   * @param  {Sprinting.DRAW.DrawingContext} context The argument to call `this.drawFn` with.
   */
  Shape.prototype.draw = function(context) {
    if(!(context instanceof sprinting.DRAW.DrawingContext))
      throw new TypeError('Shape.draw(): arg 1 must be a Sprinting.DRAW.DrawingContext.')
    this.drawFn(context)
  }

  sprinting.DRAW.Shape = Shape

  return sprinting
}
