!function() {
  require('traceur/bin/traceur-runtime')

  let sprinting = {}
  sprinting = require('./constants')(sprinting)
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
