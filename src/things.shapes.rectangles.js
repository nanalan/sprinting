module.exports = function(sprinting) {
  Rectangle.prototype = new sprinting.Shape(sprinting.INTERNAL_KEY)
  Rectangle.prototype.constructor = Rectangle
  Rectangle.prototype.uber = sprinting.Shape.prototype

  /**
   * A Rectangle is a [Shape](#shapes) with a width and a height.
   *
   * ```
   * let rect = new Sprinting.Rectangle(100, 100)
   * world.add(rect, 25, 25))
   * ```
   *
   * @see Shape
   * @param {Number} width  **Default**: `50`.
   * @param {Number} height **Default**: `50`.
   * @param {Color}  stroke  The outline color of the Shape. **Default**: `"#000000"`
   * @param {Color}  fill    The inside  color of the Shape. **Default**: `"#FFFFFF"`
   */
  function Rectangle(width = 50, height = 50, stroke, fill) {
    this.uber.constructor(sprinting.INTERNAL_KEY, stroke, fill)
    Object.assign(this, this.uber) // Update our properties to be the same as our uber

    if(!width instanceof Number)
      throw new TypeError('new Rectangle(): arg 1 must be a Number.')
    if(!height instanceof Number)
      throw new TypeError('new Rectangle(): arg 2 must be a Number.')
    this.width = width, this.height = height
  }

  Rectangle.prototype._draw = function(key) {
    uber._draw(key)

    // @TODO
  }

  sprinting.Rectangle = Rectangle


  Square.prototype = new sprinting.Rectangle
  Square.prototype.constructor = Square
  Square.prototype.uber = sprinting.Rectangle.prototype

  /**
  * A Square is a Rectangle but with side length (rather than width and height).
  *
  * ```
  * let mySquare = new Sprinting.Square(100)
  * world.add(mySquare)
  * ```
  *
  * @see Rectangle
  * @param {Number} length **Default**: `50`
  * @param {Color}  stroke **Default**: `#000000`
  * @param {Color}  fill   **Default**: `#FFFFFF`
  */
  function Square(length = 50, stroke, fill) {
    this.uber.constructor(length, length, stroke, fill)
    Object.assign(this, this.uber) // Update our properties to be the same as our uber
  }

  Square.prototype._draw = function(symbol, x, y) {
    this.uber._draw(symbol, x, y)
  }

  sprinting.Square = Square

  return sprinting
}
