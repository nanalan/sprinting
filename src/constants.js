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
   * Internal method for validating a given `key`
   *
   * @function VALIDATE_KEY
   * @param {Symbol} key
   * @returns {Boolean}
   * @memberOf Sprinting
   * @private
   */
  sprinting.DEFINE_INTERNAL('VALIDATE_KEY', function(symbol, err) {
    if(symbol !== sprinting.INTERNAL_KEY)
      throw new Error(err)
  })

  /**
   * Current version.
   * @name version
   * @memberOf Sprinting
   */
  sprinting.DEFINE_INTERNAL('version', '0.0.1')

  return sprinting
}
