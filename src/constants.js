module.exports = function(sprinting) {
  /*!
   * Internal function used to specify another internal property.
   *
   * @function DEFINE_INTERNAL
   * @param {String} name **Required**.
   * @param {Any} value **Default**: `undefined`.
   */

  // If only you could define a function by calling itself...

  Object.defineProperty(sprinting, 'DEFINE_INTERNAL', {
    configurable: false, enumerable: false,
    value: function(name, value = undefined) {
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
   * Internal function used to specify a constant property.
   *
   * @function DEFINE_CONSTANT
   * @param {Object} object **Required**.
   * @param {String} name **Required**.
   * @param {Any} value **Default**: `undefined`.
   */

   sprinting.DEFINE_INTERNAL('DEFINE_CONSTANT', function(object, name, value = undefined) {
     Object.defineProperty(object, name, {
        configurable: false,
        enumerable: true,
        value,
        writable: false
     })
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
   * @param {Symbol} key
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
