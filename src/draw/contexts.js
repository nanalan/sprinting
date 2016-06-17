module.exports = function(sprinting) {

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
    if(!(world instanceof sprinting.DRAW.World))
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
    if(!(shape instanceof sprinting.DRAW.Shape))
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

  /**
   * Fills out an `options` object to include all values used internally.
   *
   * @param  {Object} options
   * @return {Object}         The modified `options` object.
   */
  DrawingContext.fillOptions = function(options = {}) {
    if(typeof options.stroke === 'undefined') options.stroke = '#000000'
    let fill = !(typeof options.fill === 'undefined' || options.fill === 'none' || options.fill === 'transparent')
    if(!fill) options.fill = '#FFFFFF'
    if(typeof options.doFill === 'undefined') {
      if(fill)
        options.doFill = true
      else
        options.doFill = false
    }
    if(typeof options.rotationUnit === 'undefined') options.rotationUnit = DrawingContext.ROT_DEG
    if(typeof options.rotation === 'undefined') options.rotation = options.rotationUnit === DrawingContext.ROT_DEG ? 90 : 1.5707963267948966 /* 90 * Math.PI / 180 */
    if(typeof options.strokeWidth === 'undefined') options.strokeWidth = 1

    return options
  }
  DrawingContext.ROT_DEG = 0
  DrawingContext.ROT_RAD = 1

  sprinting.DRAW.DrawingContext = DrawingContext
  sprinting.DRAW.CanvasContext  = require('./contexts.canvas')(DrawingContext, sprinting)
  sprinting.DRAW.DOMContext     = require('./contexts.dom')(DrawingContext, sprinting)

  return sprinting
}
