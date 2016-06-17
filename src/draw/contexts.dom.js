module.exports = function(DrawingContext, sprinting) {
  DOMContext.prototype = new DrawingContext(sprinting.INTERNAL_KEY)
  DOMContext.prototype.constructor = DOMContext
  DOMContext.prototype.uber = DrawingContext.prototype

  /**
   * A DomContext is an inheritor of DrawingContext used for drawing with the DOM. It is automatically instanced when a new World is created with the `usage` World.USAGE_DOM.
   * It has no new public attributes that it doesn't share with DrawingContext.
   *
   * @class DomContext
   * @see DrawingContext
   * @memberOf Sprinting.DRAW
   * @param {Sprinting.DRAW.World} world
   * @private
   */
  function DOMContext(world) {
    this.dcInit(world)
    Object.assign(this, this.uber)

    this._prevShapes = this.shapes
  }

  /**
   * Method used to draw all it's shapes to the parent World.
   *
   * @function draw
   * @memberOf Sprinting.DRAW.DomContext
   * @instance
   */
  DOMContext.prototype.draw = function() {
    if(this._prevShapes !== this.shapes) {
      this._prevShapes = this.shapes

      this.world.element.children.forEach(child => this.world.element.removeChild(child))
      this.shapes.forEach(shape => {
        shape.draw(this)
        this.world.element.appendChild(shape.element)
      })
    }
  }

  return DOMContext
}
