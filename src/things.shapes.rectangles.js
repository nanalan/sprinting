module.exports = function(sprinting) {
  Rectangle.prototype = new sprinting.Shape(sprinting.INTERNAL_KEY)
  Rectangle.prototype.uber = sprinting.Shape.prototype

  Rectangle.prototype.constructor = function(x, y, width = 50, height = 50, stroke, fill) {
    this.uber.constructor(sprinting.INTERNAL_KEY, x, y, stroke, fill)
    this.stroke = this.uber.stroke, this.fill = this.uber.fill,
    this.x = this.uber.x, this.y = this.uber.y

    if(!(typeof width === 'number'))
      throw new TypeError('new Rectangle(): arg 1 must be a Number.')
    if(!(typeof width === 'number'))
      throw new TypeError('new Rectangle(): arg 2 must be a Number.')
    this.width = width, this.height = height
  }

  /**
   * A Rectangle is a {@link Shape} with a width and a height.
   *
   * @example
   * let rect = new Sprinting.Rectangle(100, 100)
   * rect.x = 24
   * rect.y = 42
   * world.add(rect)
   * @extends Sprinting.Shape
   * @class Rectangle
   * @memberOf Sprinting
   * @param {Number} [width=50]
   * @param {Number} [height=50]
   * @param {Color}  [stroke=#000] The outline color of the Shape.
   * @param {Color}  [stroke=#fff] The inside color of the Shape.
   */
  function Rectangle() {
    if(!Rectangle.constructableAndCallable)
      Rectangle.constructableAndCallable = sprinting.makeConstructableAndCallable(Rectangle, '__rectangle__')

    return Rectangle.constructableAndCallable.apply(this, arguments)
  }

  Rectangle.prototype._draw = function(key) {
    uber._draw(key)

    // @TODO
  }

  sprinting.Rectangle = Rectangle

  Square.prototype = new sprinting.Rectangle
  Square.prototype.uber = sprinting.Rectangle.prototype
  Square.prototype.constructor = function(x, y, length = 50, stroke, fill) {
    this.uber.constructor(x, y, length, length, stroke, fill)
    this.width = this.uber.width, this.height = this.uber.height,
    this.stroke = this.uber.stroke, this.fill = this.uber.fill,
    this.x = this.uber.x, this.y = this.uber.y
  }

  /**
   * A Square is a Rectangle but with side length (rather than width and height).
   *
   * @example
   * let mySquare = new Sprinting.Square(100)
   * world.add(mySquare)
   * @extends Sprinting.Rectangle
   * @class Square
   * @memberOf Sprinting
   * @param {Number} [length=50]
   * @param {Color}  [stroke=#000000]
   * @param {Color}  [fill=#FFFFFF]
   */
  function Square() {
    if(!Square.constructableAndCallable)
      Square.constructableAndCallable = sprinting.makeConstructableAndCallable(Square, '__square__')
    return Square.constructableAndCallable.apply(this, arguments)
  }

  Square.prototype._draw = function(symbol) {
    this.uber._draw(symbol)
  }

  sprinting.Square = Square

  return sprinting
}
