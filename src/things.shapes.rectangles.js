module.exports = function(sprinting) {
  Rectangle.prototype = new sprinting.Shape(sprinting.INTERNAL_KEY)
  Rectangle.prototype.constructor = Rectangle
  Rectangle.prototype.uber = sprinting.Shape.prototype

  /**
   * A Rectangle is a {@link Shape} with a width and a height.
   *
   * ```
   * let rect = new Sprinting.Rectangle(100, 100)
   * rect.x = 24
   * rect.y = 32
   * world.add(rect))
   * ```
   *
   * @extends Shape
   * @class Rectangle
   * @param {Number} [width=50]
   * @param {Number} [height=50]
   * @param {Color}  [stroke=#000] The outline color of the Shape.
   * @param {Color}  [stroke=#fff] The inside color of the Shape.
   */
  function Rectangle(width, height, stroke, fill) {
    if(!width && !height && !stroke && !fill) return

    width = typeof width === 'undefined' ? 50 : width
    height = typeof height === 'undefined' ? 50 : height

    this.uber.constructor(sprinting.INTERNAL_KEY, stroke, fill)
    Object.assign(this, this.uber)

    if(!(width instanceof Number))
      throw new TypeError('new Rectangle(): arg 1 must be a Number.')
    if(!(height instanceof Number))
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
   * @extends Rectangle
   * @class Square
   * @param {Number} [length=50]
   * @param {Color}  [stroke=#000000]
   * @param {Color}  [fill=#FFFFFF]
   */
  function Square(length = 50, stroke, fill) {
    this.uber.constructor(length, length, stroke, fill)
    Object.assign(this, this.uber)
  }

  Square.prototype._draw = function(symbol, x, y) {
    this.uber._draw(symbol, x, y)
  }

  sprinting.Square = Square

  return sprinting
}
