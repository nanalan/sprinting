module.exports = function(sprinting) {
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
   * @param {HTMLElement|String} element DOM element to draw to. **Required**.
   */
  function World(element) {
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
  return sprinting
}
