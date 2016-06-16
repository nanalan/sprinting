!function() {
  require('traceur/bin/traceur-runtime')

  let sprinting = {}
  sprinting = require('./constants')(sprinting)


  /*!
   * Internal object containing the drawing API used by Sprinting.
   *
   * @name DRAW
   */
  sprinting.DEFINE_INTERNAL('DRAW', {})

  sprinting = require('./draw/world')(sprinting)
  sprinting.DRAW.Shape = require('./draw/shapes')(sprinting.DRAW)

  sprinting = require('./world')(sprinting)
  sprinting = require('./color')(sprinting)
  sprinting = require('./things')(sprinting)
  sprinting = require('./things.shapes')(sprinting)
  sprinting = require('./things.shapes.rectangles')(sprinting)

  Object.defineProperty(window, 'Sprinting', {
    configurable: false,
    enumerable: true,
    value: sprinting,
    writable: false
  })
}()
