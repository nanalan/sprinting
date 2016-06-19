Object.assign(window, Sprinting)

let world = new World('#world')

let rect = new Rectangle
rect.stroke = 'transparent'
rect.fill = '#ffaa00'
rect.width = 20
rect.height = 20

world
  .add(rect)
  .drawLoop(function() {
    rect.x = world.pointer.x
    rect.y = world.pointer.y
  })
