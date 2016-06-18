Object.assign(window, Sprinting)

let world = new World('#world')

let rect = new Rectangle
rect.stroke = 'transparent'
rect.fill = '#ff0000'
world.add(rect)

world.addLoop(function() {
  console.log('TICK!!!')
})
