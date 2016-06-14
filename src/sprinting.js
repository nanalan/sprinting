!function() {
  let sprinting = {}

  /**
   * ## Constants
  */

  /*!
   * Internal key used to unlock & run internal methods.
   *
   * @name INTERNAL_KEY
  */
  Object.defineProperty(sprinting, 'INTERNAL_KEY', {
    configurable: false,
    enumerable: false,
    value: Symbol('InternalAPI'),
    writable: false
  })

  /*!
   * Internal method for validating a given `key`
   *
   * @function VALIDATE_KEY
   * @param key
   * @returns {Boolean}
  */
  Object.defineProperty(sprinting, 'VALIDATE_KEY', {
    configurable: false,
    enumerable: false,
    value: function(symbol, err) {
      if(symbol !== sprinting.INTERNAL_KEY)
        throw new Error(err)
    },
    writable: false
  })

  /*
   * @name version
  */
  Object.defineProperty(sprinting, 'version', {
    configurable: false,
    enumerable: false,
    value: '0.0.1',
    writable: false
  })

  function Color() {
    // TODO
  }
  sprinting.Color = Color

  /**
   * ## The World
  */

  /**
   * The World contains all the Things.
   *
   * ```js
   * let world = new Sprinting.World(document.getElementById('world'))
   * ```
   *
   * @function World
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
   * Adds a [Thing](#things) to the [World](#the-world).
   *
   * ```js
   * world.add(new Sprinting.Square(100), 20, 30)
   * ```
   *
   * @function World.add
   * @param {Thing} something The [thing](#things) to add to [World](#the-world). **Required**.
   * @param {Number} x x-position of Thing. **Default**: `0`.
   * @param {Number} y y-position of Thing. **Default**: `0`.
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

  /*!
   * Draws every [Thing](#things) in the [World](#the-world).
   *
   * @function World._draw
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   */
  World.prototype._draw = function(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'World._draw(): World._draw() is private and should not be called.')

    this.things.forEach(function(thing) {
      thing.inst.draw(thing.x, thing.y)
    })
  }

  sprinting.World = World

  /**
   * ## Things
   */

  /**
   * Something that is contained within the [World](#the-world).
   *
   * @function Thing
   * @param {Symbol} symbol Symbol which, for the constructor to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   */

  function Thing(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'new Thing(): Illegal construction of abstract class Thing.')
  }
  sprinting.Thing = Thing

  /**
   * ## Shapes
   */

  Shape.prototype = new sprinting.Thing(sprinting.INTERNAL_KEY)
  Shape.prototype.constructor = Shape
  Shape.prototype.uber = sprinting.Thing.prototype

  /*!
   * A Shape is a [Thing](#things) with a stroke and fill.
   *
   * @function Shape
   * @see Thing
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   * @param {Color | String} stroke The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**.
   * @param {Color | String} fill   The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**.
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
   * Draws this Shape to the screen.
   *
   * @function Shape._draw
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   */
  Shape._draw = function(symbol) {
    if(!x instanceof Number)
      throw new TypeError('Shape.draw(): arg 2 must be a Number.')
    if(!y instanceof Number)
      throw new TypeError('Shape.draw(): arg 3 must be a Number.')

    sprinting.VALIDATE_KEY(symbol, 'Shape.draw is private and should not be called.')
  }

  sprinting.Shape = Shape

  /**
   * ## Rectangles
   */

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

  /* */

  Object.defineProperty(window, 'Sprinting', {
    configurable: false,
    enumerable: true,
    value: sprinting,
    writable: false
  })
}()
