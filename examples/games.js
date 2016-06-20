Object.assign(window, Sprinting)

let world = new World('#world', 534, 401)

let bg = new Img('darth-vader.jpg')
bg.stroke = 'transparent'
bg.fill = '#44cc00'

bg.rx = 0
bg.ry = 0
bg.width = world.width
bg.height = world.height

world.scale().antialias(false).add(bg)