module.exports = function(sprinting) {
  sprinting.DEFINE_CONSTANT(World, 'USAGE_CANVAS', 0)
  sprinting.DEFINE_CONSTANT(World, 'USAGE_DOM',    1)

  /**
   * A World by itself is not very useful, but -- similar to HTML5 Canvas -- it has a `context` property which provides drawing functions and inherits from DrawingContext.
   *
   * @example
   * let canvas = new Sprinting.DRAW.World(document.body, Sprinting.DRAW.World.USAGE_CANVAS)
   * let ctx    = canvas.context
   * @class World
   * @private
   * @param {HTMLElement|String} element DOM element to draw to.
   * @param {Number} usage Either DRAW.World.USAGE_CANVAS or DRAW.World.USAGE_DOM.
   * @memberOf Sprinting.DRAW
   */

  // A World creates an instance of either CanvasContext or DomContext, both of which inherit from DrawingContext and sets it's property `context` to this instance.

  function World(element, usage) {
    if(!(element instanceof HTMLElement || typeof element === 'string'))
      throw new TypeError('new DRAW.World(): arg 1 must be an HTMLElement or string.')
    if(!(typeof usage === 'number'))
      throw new TypeError('new DRAW.World(): arg 2 must be a Number.')
    if(!(usage === World.USAGE_CANVAS || usage === World.USAGE_DOM))
      throw new Error('new DRAW.World(): arg 2 must be DRAW.World.USAGE_CANVAS or DRAW.World.USAGE_DOM.')

    this.element = typeof element === 'string' ? document.querySelector(element) : element
    this.context = null

    switch(usage) {
    case World.USAGE_CANVAS:
      this.context = new sprinting.DRAW.CanvasContext(this)
      break
    case World.USAGE_DOM:
      this.context = new sprinting.DRAW.DOMContext(this)
      break
    }
  }

  World.prototype.setWidth = function(w) {
    this.element.style.width = w
    if(this.context.canvas && this.context.canvas instanceof HTMLElement)
      this.context.canvas.setAttribute('width', w)
  }
  World.prototype.setHeight = function(h) {
    this.element.style.height = h
    if(this.context.canvas && this.context.canvas instanceof HTMLElement)
      this.context.canvas.setAttribute('height', h)
  }
  World.prototype.getWidth = function()  { return this.element.style.width  }
  World.prototype.getHeight = function() { return this.element.style.height }

  sprinting.DRAW.World = World

  return sprinting
}
