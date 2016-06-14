module.exports = function(sprinting) {
  /**
   * ## Things
   */

  /**
   * Something that is contained within the [World](#the-world).
   *
   * @function Thing
   * @param {Symbol} symbol Symbol which, for the constructor to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
   */
  function Thing(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'new Thing(): Illegal construction of abstract class Thing.')
  }

  sprinting.Thing = Thing
  return sprinting
}