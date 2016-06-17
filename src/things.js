module.exports = function(sprinting) {
  /**
   * Something that is contained within the {@link Sprinting.World|World}. **This shouldn't be constructed directly**; rather, use a {@link Sprinting.Shape|Shape}, such as a {@link Sprinting.Square|Square}.
   *
   * @class Thing
   * @param {Symbol} key {@link Sprinting.INTERNAL_KEY}.
   * @memberOf Sprinting
   * @see Sprinting.Shape
   * @protected
   * @example
   * let myThing = new Sprinting.Thing(Sprinting.INTERNAL_KEY)
   */
  function Thing(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'new Thing(): Illegal construction of abstract class Thing.')
  }

  sprinting.Thing = Thing
  return sprinting
}
