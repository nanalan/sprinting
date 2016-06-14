!function() { 'use strict'
  let sprinting = {}

  Object.defineProperty(sprinting, 'INTERNAL_KEY', {
    configurable: false,
    enumerable: false,
    value: Symbol('InternalAPI'),
    writable: false
  })

  Object.defineProperty(sprinting, 'VALIDATE_KEY', {
    configurable: false,
    enumerable: false,
    value: function(symbol, err) {
      if(symbol != sprinting.INTERNAL_KEY)
        throw new Error(err)
    },
    writable: false
  })

  function Color() {
    // TODO
  }
  sprinting.Color = Color

  /**
   * > A World is a general container for all Things.
   *
   * ```
   * let world = new Sprinting.World(document.getElementById('world'))
   * ```
   *
   * @class World(element)
   * @param {HTMLElement} element DOM element to draw to. **Required**.
   */
  function World(element) {
    console.log(typeof element)

    if(!(element instanceof HTMLElement || typeof element === 'string'))
      throw new TypeError('new World(): arg 1 must be an HTMLElement or string.')

    this.element = typeof element === 'string' ? document.querySelector(element) : element
    this.things  = []
  }

  /**
   * > Adds a Thing to the World.
   *
   * ```
   * world.add(new Sprinting.Square(100), 20, 30)
   * ```
   *
   * @function World.add(something, x, y)
   * @param {Sprinting.Thing} something Thing to add to World. **Required**.
   * @param {Number} x x-position of Thing. **Defaults to `0`**.
   * @param {Number} y y-position of Thing. **Defaults to `0`**.
   */
  World.prototype.add = function(something, x = 0, y = 0) {
    if(!something instanceof sprinting.Thing)
      throw new TypeError('World.add(): arg 1 must be a Sprinting.Thing.')
    if(!x instanceof Number)
      throw new TypeError('World.add(): arg 2 must be a Number.')
    if(!y instanceof Number)
      throw new TypeError('World.add(): arg 3 must be a Number.')

    this.things.push({inst: something, x, y})
  }

  /**
   * > Draws each one of this.things.
   *
   * @param {Symbol} symbol Symbol which, for the function to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   * @function **private** World._draw()
   *
   */
  World.prototype._draw = function(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'World._draw(): World._draw() is private and should not be called.')

    this.things.forEach(function(thing) {
      thing.inst.draw(thing.x, thing.y)
    })
  }

  sprinting.World = World

  /**
   * > Class from which anything addable to a World inherits.
   *
   * @class **abstract** Thing()
   * @param {Symbol} symbol Symbol which, for the constructor to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   */

  function Thing(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'new Thing(): Illegal construction of abstract class Thing.')
  }
  sprinting.Thing = Thing

  Shape.prototype = new sprinting.Thing(sprinting.INTERNAL_KEY)
  Shape.prototype.constructor = Shape
  Shape.prototype.uber = sprinting.Thing.prototype

  /**
   * > A Shape is a Thing with a stroke and a fill.
   *
   * @class **abstract** Shape(stroke, fill) *extends Thing*
   * @param {Symbol} symbol Symbol which, for the constructor to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   * @param {Sprinting.Color} stroke The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**.
   * @param {Sprinting.Color} fill   The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**.
   */
  function Shape(symbol, stroke = '#000000', fill = '#FFFFFF') {
    sprinting.VALIDATE_KEY(symbol, 'new Shape(): Illegal construction of abstract class Shape.')

    if(!(stroke instanceof sprinting.Color || typeof stroke === 'string'))
      throw new TypeError('new Shape(): arg 2 must be a Sprinting.Color or string')
    if(!(fill instanceof sprinting.Color || typeof fill === 'string'))
      throw new TypeError('new Shape(): arg 3 must be a Sprinting.Color or string')
    this.stroke = stroke, this.fill = fill
  }

  /**
   * > Draws the shape to the screen at a specified x and y.
   *
   * @function **abstract**, **private** Shape._draw()
   * @param {Symbol} symbol Symbol which, for the function to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   * @param {Number} x x-position at which to draw the Shape.
   * @param {Number} y y-position at which to draw the Shape.
   */
  Shape._draw = function(symbol, x, y) {
    if(!x instanceof Number)
      throw new TypeError('Shape.draw(): arg 2 must be a Number.')
    if(!y instanceof Number)
      throw new TypeError('Shape.draw(): arg 3 must be a Number.')

    sprinting.VALIDATE_KEY(symbol, 'Shape.draw is private and should not be called.')
  }

  sprinting.Shape = Shape

  Rectangle.prototype = new sprinting.Shape(sprinting.INTERNAL_KEY)
  Rectangle.prototype.constructor = Rectangle
  Rectangle.prototype.uber = sprinting.Shape.prototype

  /**
   * > A Rectangle is a Shape with a width and a height.
   *
   * ```
   * let myRectangle = new Rectangle(100, 100)
   * world.add(myRectangle, 0, 0)
   * ```
   *
   * @param {Number} width The width of the Rectangle. **Defaults to `50`**.
   * @param {Number} height The height of the Rectangle. **Defaults to `50`**.
   * @param {Sprinting.Color} stroke The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**
   * @param {Sprinting.Color} fill   The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**
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

  /**
   * > Draws the Rectangle to the screen at a specified x and y.
   *
   * @function **private** Rectangle._draw()
   * @param {Symbol} symbol Symbol which, for the function to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   * @param {Number} x x-position at which to draw the Shape.
   * @param {Number} y y-position at which to draw the Shape.
   */
  Rectangle.prototype._draw = function(symbol, x, y) {
    uber._draw(symbol, x, y)

    // @TODO
  }

  sprinting.Rectangle = Rectangle

  Square.prototype = new sprinting.Rectangle
  Square.prototype.constructor = Square
  Square.prototype.uber = sprinting.Rectangle.prototype

 /**
  * > A Square is a Rectangle but with a constructor specifying only size, not both width and height.
  *
  * ```
  * let mySquare = new Square(100)
  * world.add(mySquare, 0, 0)
  * ```
  *
  * @param {Number} size The size of the Square. **Defaults to 50**.
  * @param {sprinting.Color} stroke The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**
  * @param {sprinting.Color} fill   The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**
  */
 function Square(size = 50, stroke, fill) {
    this.uber.constructor(size, size, stroke, fill)
    Object.assign(this, this.uber) // Update our properties to be the same as our uber
  }

  /**
   * > Draws the Square to the screen at a specified x and y.
   *
   * @function **private** Square._draw()
   * @param {Symbol} symbol Symbol which, for the function to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   * @param {Number} x x-position at which to draw the Shape.
   * @param {Number} y y-position at which to draw the Shape.
   */
  Square.prototype._draw = function(symbol, x, y) {
    this.uber._draw(symbol, x, y)
  }

  sprinting.Square = Square

  Object.defineProperty(window, 'Sprinting', {
    configurable: false,
    enumerable: true,
    value: sprinting,
    writable: false
  })
}()
