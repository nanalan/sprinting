module.exports = function(sprinting) {
  Shape.prototype = new sprinting.Thing(sprinting.INTERNAL_KEY)
  Shape.prototype.constructor = Shape
  Shape.prototype.uber = sprinting.Thing.prototype

  /**
   * A Shape is a {@link Thing} with a stroke and fill.
   *
   * @class Shape
   * @extends Sprinting.Thing
   * @memberOf Sprinting
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   * @param {Sprinting.Color|String} [stroke=#000000] The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string.
   * @param {Sprinting.Color|String} [fill=#ffffff]   The fill (inside) color of the Shape. Instance of sprinting.Color or hex string.
   */
  function Shape(symbol, x, y, stroke = '#000000', fill = '#FFFFFF') {
    sprinting.VALIDATE_KEY(symbol, 'new Shape(): Illegal construction of abstract class Shape.')

    this.uber.constructor(symbol, x, y)
    this.x = this.uber.x, this.y = this.uber.y

    if(!(stroke instanceof sprinting.Color || typeof stroke === 'string'))
      throw new TypeError('new Shape(): arg 2 must be a Sprinting.Color or string')
    if(!(fill instanceof sprinting.Color || typeof fill === 'string'))
      throw new TypeError('new Shape(): arg 3 must be a Sprinting.Color or string')
    this.stroke = stroke, this.fill = fill
  }

  /**
   * Draws this Shape to the screen.
   *
   * @function _draw
   * @memberOf Shape
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key).
   * @private
   */
  Shape._draw = function(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'Shape.draw is private and should not be called.')
  }

  sprinting.Shape = Shape
  return sprinting
}
