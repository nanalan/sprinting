module.exports = function(sprinting) {
  /**
   * Something that is contained within the {@link Sprinting.World|World}. **This shouldn't be constructed directly**; rather, use a {@link Sprinting.Shape|Shape}, such as a {@link Sprinting.Square|Square}.
   * A Thing has an x and a y.
   *
   * @class Thing
   * @param {Symbol} key {@link Sprinting.INTERNAL_KEY}.
   * @memberOf Sprinting
   * @see Sprinting.Shape
   * @protected
   * @example
   * let myThing = new Sprinting.Thing(Sprinting.INTERNAL_KEY)
   */
  function Thing(symbol, x = 0, y = 0) {
    sprinting.VALIDATE_KEY(symbol, 'new Thing(): Illegal construction of abstract class Thing.')

    if(!(typeof x === 'number'))
      throw new TypeError('new Thing(): arg 2 must be a Number.')
    if(!(typeof y === 'number'))
      throw new TypeError('new Thing(): arg 3 must be a Number.')

    this.x = x, this.y = y
  }
  sprinting.Thing = Thing

  return sprinting
}
