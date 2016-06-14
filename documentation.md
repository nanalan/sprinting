# API Documentation
> Unless otherwise stated, everything is under the scope of `Sprinting`.

<!-- Start src\sprinting.js -->

## World(element)

> A World is a general container for all Things.

```
let world = new Sprinting.World(document.getElementById('world'))
```

### Params:

* **HTMLElement** *element* DOM element to draw to. **Required**.

## World.add(something, x, y)(something, x, y)

> Adds a Thing to the World.

```
world.add(new Sprinting.Square(100), 20, 30)
```

### Params:

* **Sprinting.Thing** *something* Thing to add to World. **Required**.
* **Number** *x* x-position of Thing. **Defaults to `0`**.
* **Number** *y* y-position of Thing. **Defaults to `0`**.

## **private** World._draw()(symbol)

> Draws each one of this.things.

### Params:

* **Symbol** *symbol* Symbol which, for the function to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.

## **abstract** Thing()

> Class from which anything addable to a World inherits.

### Params:

* **Symbol** *symbol* Symbol which, for the constructor to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.

## **abstract** Shape(stroke, fill) *extends Thing*

> A Shape is a Thing with a stroke and a fill.

### Params:

* **Symbol** *symbol* Symbol which, for the constructor to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
* **Sprinting.Color** *stroke* The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**.
* **Sprinting.Color** *fill* The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**.

## **abstract**, **private** Shape._draw()(symbol, x, y)

> Draws the shape to the screen at a specified x and y.

### Params:

* **Symbol** *symbol* Symbol which, for the function to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
* **Number** *x* x-position at which to draw the Shape.
* **Number** *y* y-position at which to draw the Shape.

## Rectangle(width, height, stroke, fill)

> A Rectangle is a Shape with a width and a height.

```
let myRectangle = new Rectangle(100, 100)
world.add(myRectangle, 0, 0)
```

### Params:

* **Number** *width* The width of the Rectangle. **Defaults to `50`**.
* **Number** *height* The height of the Rectangle. **Defaults to `50`**.
* **Sprinting.Color** *stroke* The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**
* **Sprinting.Color** *fill* The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**

## **private** Rectangle._draw()(symbol, x, y)

> Draws the Rectangle to the screen at a specified x and y.

### Params:

* **Symbol** *symbol* Symbol which, for the function to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
* **Number** *x* x-position at which to draw the Shape.
* **Number** *y* y-position at which to draw the Shape.

## Square(size, stroke, fill)

> A Square is a Rectangle but with a constructor specifying only size, not both width and height.

```
let mySquare = new Square(100)
world.add(mySquare, 0, 0)
```

### Params:

* **Number** *size* The size of the Square. **Defaults to 50**.
* **sprinting.Color** *stroke* The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**
* **sprinting.Color** *fill* The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**

## **private** Square._draw()(symbol, x, y)

> Draws the Square to the screen at a specified x and y.

### Params:

* **Symbol** *symbol* Symbol which, for the function to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.
* **Number** *x* x-position at which to draw the Shape.
* **Number** *y* y-position at which to draw the Shape.

<!-- End src\sprinting.js -->

