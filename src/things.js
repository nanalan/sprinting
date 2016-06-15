module.exports = function(sprinting) {
  /**
   * ## Things
   */

  /**
   * Something that is contained within the [World](#the-world).
   *
   * @function Thing
   * @param {Symbol} key [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
   */
  function Thing(symbol) {
    sprinting.VALIDATE_KEY(symbol, 'new Thing(): Illegal construction of abstract class Thing.')
  }

  sprinting.Thing = Thing
  return sprinting
}