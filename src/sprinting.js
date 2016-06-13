const Sprinting = {
  World: class {
    /**
     * > Construct a *whole new World*; a general container for all Things.
     *
     * ```
     * let world = new Sprinting.World(document.getElementById('world'))
     * ```
     *
     * @class World(element)
     * @param {HTMLElement} element **Required.** DOM element to draw to.
     * @api public
     */
    constructor(element) {
      if(!document.body instanceof HTMLElement)
        throw 'new World(element) must be an HTMLElement'
      
      this._element = element

      return this
    }

    /**
     * > Adds a Thing to the World.
     *
     * ```
     * world.add(new Sprinting.Square(100), 20, 30)
     * ```
     *
     * @function World.add(something, x, y)
     * @param {Thing} something **Required.** Thing to add to World.
     * @param {Thing} x x position of Thing. **Defaults to `0`**
     * @param {Thing} y y position of Thing. **Defaults to `0`**
     */
    add(something, x = 0, y = 0) {
      if(!something instanceof Thing)
        throw 'World.add(something) must be a Thing'

      if(!x instanceof Number)
        throw 'World.add(x) must be a Number'

      if(!y instanceof Number)
        throw 'World.add(y) must be a Number'

      this._Things.push([something, x, y])
    }
  },

  Thing: class {
    constructor() {

    }
  },

  Shape: class extends Thing {

  },

  Square: class extends Shape {
    /**
     * > Construct a *whole new World*; a general container for all Things.
     *
     * ```
     * let world = new Sprinting.World()
     * ```
     *
     * @class Square(length) _extends Shape_
     * @param {Number} length **Required.** Side length.
     * @api public
     */
    constructor(length) {
      super().width = length
    }
  }
}