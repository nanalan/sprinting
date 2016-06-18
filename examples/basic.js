Object.assign(window, Sprinting)

let world = new World('#world')

let rect = new Rectangle
rect.stroke = 'transparent'
rect.fill = '#ff0000'
rect.y = 50

world.add(rect)

let i = 0
world.drawLoop(function() {
  i++
  rect.x = Math.sin(i * 0.05) * 200 + 300
})
