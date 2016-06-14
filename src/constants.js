module.exports = function(sprinting) {
  /**
   * ## Constants
  */

  /*!
   * Internal key used to unlock & run internal methods.
   *
   * @name INTERNAL_KEY
  */
  Object.defineProperty(sprinting, 'INTERNAL_KEY', {
    configurable: false,
    enumerable: false,
    value: Symbol('InternalAPI'),
    writable: false
  })

  /*!
   * Internal method for validating a given `key`
   *
   * @function VALIDATE_KEY
   * @param key
   * @returns {Boolean}
  */
  Object.defineProperty(sprinting, 'VALIDATE_KEY', {
    configurable: false,
    enumerable: false,
    value: function(symbol, err) {
      if(symbol !== sprinting.INTERNAL_KEY)
        throw new Error(err)
    },
    writable: false
  })

  /*
   * @name version
  */
  Object.defineProperty(sprinting, 'version', {
    configurable: false,
    enumerable: false,
    value: '0.0.1',
    writable: false
  })

  return sprinting
}