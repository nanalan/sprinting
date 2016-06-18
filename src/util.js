module.exports = function(sprinting) {

  /*!
   * Internal function used to specify another internal property.
   *
   * @function DEFINE_INTERNAL
   * @param {String} name **Required**.
   * @param {Any} value **Default**: `undefined`.
   */

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

  sprinting.DEFINE_INTERNAL('makeConstructableAndCallable', function(fnClass, name) {
    return function(...args) {
      if(this instanceof fnClass && !(this['name'])) {
        Object.defineProperty(this, name, {
          configurable: false, enumerable: false,
          value: true,
          writable: false
        })
        this.constructor.apply(this, args)
      } else {
        return new fnClass(...args)
      }
    }
  })

  return sprinting
}
