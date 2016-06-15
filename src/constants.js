module.exports = function(sprinting) {
  /**
   * ## Constants
  */

  /*!
   * [defineProperty description]
   *
   * @function DEFINE_INTERNAL
   * @param {String} name
   * @param value
   */

  // If only you could define a function by calling itself...
  
  Object.defineProperty(sprinting, 'DEFINE_INTERNAL', {
    configurable: false, enumerable: false,
    value: function(name, value) {
      Object.defineProperty(sprinting, name, {
        configurable: false,
        enumerable: false,
        value,
        writable: false
      })
    },
    writable: false
  })

  /*!
   * Internal key used to unlock & run internal methods.
   *
   * @name INTERNAL_KEY
  */
  sprinting.DEFINE_INTERNAL('INTERNAL_KEY', Symbol('InternalAPI'))

  /*!
   * Internal method for validating a given `key`
   *
   * @function VALIDATE_KEY
   * @param key
   * @returns {Boolean}
  */
  sprinting.DEFINE_INTERNAL('VALIDATE_KEY', function(symbol, err) {
    if(symbol !== sprinting.INTERNAL_KEY)
      throw new Error(err)
  })

  /*!
   * Internal variable with the current version of Sprinting.
   *
   * @name VERSION
  */
  sprinting.DEFINE_INTERNAL('VERSION', '0.0.1')

  return sprinting
}
