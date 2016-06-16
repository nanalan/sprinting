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

  return sprinting
}
