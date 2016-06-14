# API Documentation

## Constants

### Sprinting.**INTERNAL_KEY**  

Internal key used to unlock & run internal methods.

###  Sprinting.**VALIDATE_KEY**(_key_) 

Internal method for validating a given `key`

**Returns**  _Boolean_ 

#### Arguments

 `key` 

### Sprinting.**version**  

## The World

###  *internal*  Sprinting.**World**(_element_) 

The World contains all the Things.

```js
let world = new Sprinting.World(document.getElementById('world'))
```

#### Arguments

 *HTMLElement* `element` DOM element to draw to. **Required**.

###  *internal*  Sprinting.**World.add**(_something, x, y_) 

Adds a [Thing](#things) to the [World](#the-world).

```js
world.add(new Sprinting.Square(100), 20, 30)
```

#### Arguments

 *Thing* `something` The [thing](#things) to add to [World](#the-world). **Required**.
 *Number* `x` x-position of Thing. **Default**: `0`.
 *Number* `y` y-position of Thing. **Default**: `0`.

###  Sprinting.**World._draw**(_key_) 

Draws every [Thing](#things) in the [World](#the-world).

#### Arguments

 *Symbol* `key` [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.

## Things

###  *internal*  Sprinting.**Thing**(_symbol_) 

Something that is contained within the [World](#the-world).

#### Arguments

 *Symbol* `symbol` Symbol which, for the constructor to be callable, must be the hidden Sprinting.INTERNAL_KEY. **Required**.

### Sprinting.**prototype**  

## Shapes

###  Sprinting.**Shape**(_key, stroke, fill_)  _extends Thing_ 

A Shape is a [Thing](#things) with a stroke and fill.

#### Arguments

 *Symbol* `key` [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.
 *Color|String* `stroke` The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#000000"`**.
 *Color|String* `fill` The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Defaults to `"#FFFFFF"`**.

###  *internal*  Sprinting.**Shape._draw**(_key_) 

Draws this Shape to the screen.

#### Arguments

 *Symbol* `key` [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.

### Sprinting.**prototype**  

## Rectangles

###  *internal*  Sprinting.**Rectangle**(_width, height, stroke, fill_) 

A Rectangle is a [Shape](#shapes) with a width and a height.

```
let rect = new Sprinting.Rectangle(100, 100)
world.add(rect, 25, 25))
```

#### Arguments

 *Number* `width` **Default**: `50`.
 *Number* `height` **Default**: `50`.
 *Color* `stroke` The outline color of the Shape. **Default**: `"#000000"`
 *Color* `fill` The inside color of the Shape. **Default**: `"#FFFFFF"`

###  *internal*  Sprinting.**Square**(_length, stroke, fill_)  _extends Rectangle_ 

A Square is a Rectangle but with side length (rather than width and height).

```
let mySquare = new Sprinting.Square(100)
world.add(mySquare)
```

#### Arguments

 *Number* `length` **Default**: `50`
 *Color* `stroke` **Default**: `#000000`
 *Color* `fill` **Default**: `#FFFFFF`

