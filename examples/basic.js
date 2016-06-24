Object.assign(window, Sprinting)

let world = new World('#world')

let rect = new Rectangle
rect.stroke = 'transparent'
rect.fill = '#ffaa00'
rect.y = 450
rect.x = 450
rect.width = 10
rect.height = 10

let circ = new Circle(100, 100)
circ.stroke = 'transparent'
circ.fill = '#00aaff'
circ.x = 100
circ.y = 100

let trump = new Img('trump.jpg')
trump.width = 200
trump.height = 150
trump.x = 450
trump.y = 450
trump.rx = 1
trump.ry = 1

let i = 0
world
  .neverStop()
  .add(rect)
  .add(circ)
  .add(trump)
  .drawLoop(function() {
    i++
    trump.r++
  })