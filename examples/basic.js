Object.assign(window, Sprinting)

let world = new World('#world')

let rect = new Rectangle
rect.stroke = 'transparent'
rect.fill = '#ffaa00'
rect.y = 50

world.add(rect)

let circ = new Circle(100, 180)
circ.stroke = 'transparent'
circ.fill = '#00aaff'
circ.x = 200
circ.y = 200

world.add(circ)

let i = 0
world.drawLoop(function() {
  i++
  rect.x = Math.sin(i * 0.05) * 200 + 300
  circ.r++
})
