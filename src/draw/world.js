module.exports = function(sprinting) {
  sprinting.DEFINE_CONSTANT(World, 'USAGE_CANVAS', 0)
  sprinting.DEFINE_CONSTANT(World, 'USAGE_DOM',    1)

  /**
   * A World by itself is not very useful, but -- similar to HTML5 Canvas -- it has a `context` property which provides drawing functions and inherits from DrawingContext.
   *
   * ```
   * let canvas = new Sprinting.DRAW.World(document.body, Sprinting.DRAW.World.USAGE_CANVAS)
   * let ctx    = canvas.context
   * ```
   *
   * @class DRAW.World
   * @param {HTMLElement|String} element DOM element to draw to. **Required**.
   * @param {Number} usage Either DRAW.World.USAGE_CANVAS or DRAW.World.USAGE_DOM. **Required**.
   */

  // A World creates an instance of either CanvasContext or DomContext, both of which inherit from DrawingContext and sets it's property `context` to this instance.

  function World(element, usage) {
    if(!(element instanceof HTMLElement || typeof element === 'string'))
      throw new TypeError('new DRAW.World(): arg 1 must be an HTMLElement or string.')
    if(!usage instanceof Number)
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

  sprinting.DRAW.World = World

  // DrawingContext contains the functions shared between both CanvasContext and DomContext.

  /*!
   * An inheritor of DrawingContext provides drawing functions for a specific usage. They should not be constructed on their own but rather through `Sprinting.DRAW.World`.
   *
   * @class DRAW.DrawingContext
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   */
  function DrawingContext(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'new SubWorld(): Illegal construction of abstract class SubWorld.')
  }

  /*!
   * The constructor used by inheritors of DrawingContext.
   *
   * @function DRAW.DrawingContext.dcInit
   * @param {Sprinting.DRAW.World} world The World that the DrawingContext belongs in.
   */
  DrawingContext.prototype.dcInit = function(world) {
    if(!(world instanceof World))
      throw new TypeError('new DRAW.DrawingContext(): arg 2 must be a sprinting.DRAW.World.')

    this.world  = world
    this.shapes = []
  }

  /**
   * Pushes a sprinting.DRAW.Shape onto itself, making it visible in the parent World on the next call to `draw`.
   *
   * @function DRAW.DrawingContext.putShape
   * @param  {Sprinting.DRAW.Shape} shape
   */
  DrawingContext.prototype.putShape = function(shape) {
    if(!shape instanceof Shape)
      throw new TypeError('DrawingContext.putShape(): arg 1 must be a sprinting.DRAW.Shape.')

    this.shapes.push(shape)
  }

  /**
   * Completely deletes all shapes.
   *
   * @function DRAW.DrawingContext.clear
   */

  DrawingContext.prototype.clear = function() {
    this.shapes = []
  }

  sprinting.DRAW.DrawingContext = DrawingContext
  sprinting.DRAW.CanvasContext  = require('./canvas')(DrawingContext, sprinting)
  sprinting.DRAW.DOMContext     = require('./dom')(DrawingContext, sprinting)

  return sprinting
}
