Object.assign(window, Sprinting)

let world = new World('#world')

let rect = new Rectangle
rect.stroke = 'transparent'
rect.fill = '#ffaa00'
rect.y = 50

let circ = new Circle(100, 100)
circ.stroke = 'transparent'
circ.fill = '#00aaff'
circ.x = 100
circ.y = 100

let trump = new Img('trump.jpg')
trump.x = 240
trump.y = 240
trump.r = 90

world.add(rect)
world.add(circ)
world.add(trump)

let i = 0
world.drawLoop(function() {
  i++
  rect.x = Math.sin(i * 0.05) * 200 + 300
})
