const S = Sprinting

window.world = new S.World('#world')

let mySquare = new S.Square(50)
mySquare.x = 20
mySquare.y = 20
world.add(mySquare)

world.add(new S.Rectangle(50, 50))
