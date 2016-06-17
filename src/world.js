module.exports = function(sprinting) {
  /**
   * The World contains every Thing; it is the container of your program.
   *
   * @example
   * let world = new Sprinting.World(document.getElementById('world'))
   * @class World
   * @param {HTMLElement|String} element - DOM element to draw to.
   * @param {Number} [width=800]
   * @param {Number} [height=600]
   */
  function World(element, width, height) {
    if(!(element instanceof HTMLElement || typeof element === 'string'))
      throw new TypeError('new World(): arg 1 must be an HTMLElement or string.')

    this.element = typeof element === 'string' ? document.querySelector(element) : element
    this.things  = []
    this.width = width || 800
    this.height = height || 600
  }

  /**
   * Adds a [Thing](#things) to the [World](#the-world).
   *
   * @example
   * world.add(new Sprinting.Square(100), 20, 30)
   * @function World.add
   * @param {Sprinting.Thing} something The [thing](#things) to add to [World](#the-world). **Required**.
   * @param {Number} x x-position of Thing. **Default**: `0`.
   * @param {Number} y y-position of Thing. **Default**: `0`.
   */
  World.prototype.add = function(something, x = 0, y = 0) {
    if(!(something instanceof sprinting.Thing))
      throw new TypeError('World.add(): arg 1 must be a Sprinting.Thing.')
    if(!(x instanceof Number))
      throw new TypeError('World.add(): arg 2 must be a Number.')
    if(!(y instanceof Number))
      throw new TypeError('World.add(): arg 3 must be a Number.')

    this.things.push({inst: something, x, y})
  }

  /**
   * Draws every [Thing](#things) in the [World](#the-world).
   *
   * @function _draw
   * @memberOf World
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key).
   * @private
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
