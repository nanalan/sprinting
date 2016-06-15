module.exports = function(DrawingContext, sprinting) {
  DOMContext.prototype = new DrawingContext(sprinting.INTERNAL_KEY)
  DOMContext.prototype.constructor = DOMContext
  DOMContext.prototype.uber = DrawingContext.prototype

  function DOMContext(world) {
    this.dcInit(world)

    this._prevShapes = this.shapes
  }

  DOMContext.prototype.draw = function() {
    if(this._prevShapes !== this.shapes) {
      this._prevShapes = this.shapes

      this.world.element.children.forEach(child => this.world.element.removeChild(child))
      this.shapes.forEach(shape => this.world.element.appendChild(shape.element))
    }
  }

  return DOMContext
}
