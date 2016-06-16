module.exports = function(sprinting) {
  /**
   * Something that is contained within the {@link World}.
   *
   * @class Thing
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key).
   * @protected
   */
  function Thing(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'new Thing(): Illegal construction of abstract class Thing.')
  }

  sprinting.Thing = Thing
  return sprinting
}
