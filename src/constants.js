module.exports = function(sprinting) {
  /**
   * Internal key used to unlock & run internal methods.
   *
   * @name INTERNAL_KEY
   * @memberOf Sprinting
   * @protected
   */
  sprinting.DEFINE_INTERNAL('INTERNAL_KEY', Symbol('InternalAPI'))

  /**
   * Current version.
   * @name version
   * @memberOf Sprinting
   */
  sprinting.DEFINE_INTERNAL('version', '0.0.1')

  return sprinting
}
