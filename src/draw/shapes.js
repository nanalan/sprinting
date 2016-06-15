module.exports = function(draw) {
  /**
   * ## Shapes
   */


  /**
   * A Shape has the property `drawFn` set in construction to `fn` with the single parameter `world`.
   *
   * @param {Function} fn
   */

  function Shape(fn) {
    this.drawFn = fn
  }

  /**
   * Calls `this.drawFn`.
   *
   * @param  {sprinting.DRAW.World} world The argument to call `this.drawFn` with.
   */
  Shape.prototype.draw = function(world) {
    if(!world instanceof draw.WORLD)
      throw new TypeError('Shape.draw(): arg 1 must be a sprinting.DRAW.World.')
    this.drawFn(world)
  }
}
