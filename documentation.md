# Documentation

### Sprinting.**Color**  

A color (of both sprinting and sprinting.DRAW) for use by the drawing API or sprinting itself.
The `string` property is always equal to the color created in string-form, while `values` is the value of the argument of the same name.
Please note that there are no specific RGBA or HSLA, but if using RGB or HSL you can specify a fourth argument to be the alpha.

#### Arguments

 *Function* `type` Either Color.PLAIN, Color.HEX, Color.RGB or Color.HSL.  
 *Any* `...values` Values to specify the color in accordance to the type.  




###  *internal*  Sprinting.**DEFINE_INTERNAL**(_name, value_) 

Internal function used to specify another internal property.

#### Arguments

 *String* `name` **Required**.  
 *Any* `value` **Default**: `undefined`.  

###  *internal*  Sprinting.**DEFINE_CONSTANT**(_object, name, value_) 

Internal function used to specify a constant property.

#### Arguments

 *Object* `object` **Required**.  
 *String* `name` **Required**.  
 *Any* `value` **Default**: `undefined`.  

### Sprinting.**INTERNAL_KEY**  

Internal key used to unlock & run internal methods.

###  *internal*  Sprinting.**VALIDATE_KEY**(_key_) 

Internal method for validating a given `key`

**Returns**  _Boolean_ 

#### Arguments

 *Symbol* `key`   

### Sprinting.**VERSION**  

Internal variable with the current version of Sprinting.




### Sprinting.**DRAW**  

Internal object containing the drawing API used by Sprinting.




###  Sprinting.**Thing**(_key_) 

Something that is contained within the [World](#the-world).

#### Arguments

 *Symbol* `key` [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.  




### Sprinting.**Shape**   _Extends Thing_ 

A Shape is a [Thing](#things) with a stroke and fill.

#### Arguments

 *Symbol* `key` [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.  
 *Color|String* `stroke` The stroke (outline) color of the Shape. Instance of sprinting.Color or hex string. **Default**: `"#000000"`.  
 *Color|String* `fill` The fill (inside) color of the Shape. Instance of sprinting.Color or hex string. **Default**: `"#FFFFFF"`.  

###  Sprinting.**Shape._draw**(_key_) 

Draws this Shape to the screen.

#### Arguments

 *Symbol* `key` [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.  




###  Sprinting.**Rectangle**(_width, height, stroke, fill_) 

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

###  Sprinting.**Square**(_length, stroke, fill_)  _extends Rectangle_ 

A Square is a Rectangle but with side length (rather than width and height).

```
let mySquare = new Sprinting.Square(100)
world.add(mySquare)
```

#### Arguments

 *Number* `length` **Default**: `50`  
 *Color* `stroke` **Default**: `#000000`  
 *Color* `fill` **Default**: `#FFFFFF`  







### Sprinting.**World**  

The World contains all the Things.

```js
let world = new Sprinting.World(document.getElementById('world'))
```

#### Arguments

 *HTMLElement|String* `element` DOM element to draw to. **Required**.  

###  Sprinting.**World.add**(_something, x, y_) 

Adds a [Thing](#things) to the [World](#the-world).

```js
world.add(new Sprinting.Square(100), 20, 30)
```

#### Arguments

 *Sprinting.Thing* `something` The [thing](#things) to add to [World](#the-world). **Required**.  
 *Number* `x` x-position of Thing. **Default**: `0`.  
 *Number* `y` y-position of Thing. **Default**: `0`.  

###  *internal*  Sprinting.**World._draw**(_key_) 

Draws every [Thing](#things) in the [World](#the-world).

#### Arguments

 *Symbol* `key` [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.  




### Sprinting.**DRAW.CanvasContext**   _Extends DrawingContext_ 

A CanvasContext is an inheritor of DrawingContext used for drawing with the HTML5 Canvas. It is automatically instanced when a new World is created with the `usage` World.USAGE_CANVAS.
It has no new public attributes that it doesn't share with DrawingContext.

#### Arguments

 *Sprinting.DRAW.World* `world`   

###  Sprinting.**DRAW.CanvasContext.draw**(__) 

Method used to draw all it's shapes to the parent World.




### Sprinting.**DRAW.DomContext**   _Extends DrawingContext_ 

A DomContext is an inheritor of DrawingContext used for drawing with the DOM. It is automatically instanced when a new World is created with the `usage` World.USAGE_DOM.
It has no new public attributes that it doesn't share with DrawingContext.

#### Arguments

 *Sprinting.DRAW.World* `world`   

###  Sprinting.**DRAW.DomContext.draw**(__) 

Method used to draw all it's shapes to the parent World.




### Sprinting.**DRAW.Shape**  

A Shape has the property `drawFn` set in construction to `fn` with the single parameter `world`.

#### Arguments

 *Function* `fn`   

###  Sprinting.**DRAW.Shape.draw**(_world_) 

Calls `this.drawFn`.

#### Arguments

 *sprinting.DRAW.World* `world` The argument to call `this.drawFn` with.  




### Sprinting.**DRAW.World**  

A World by itself is not very useful, but -- similar to HTML5 Canvas -- it has a `context` property which provides drawing functions and inherits from DrawingContext.

```
let canvas = new Sprinting.DRAW.World(document.body, Sprinting.DRAW.World.USAGE_CANVAS)
let ctx    = canvas.context
```

#### Arguments

 *HTMLElement|String* `element` DOM element to draw to. **Required**.  
 *Number* `usage` Either DRAW.World.USAGE_CANVAS or DRAW.World.USAGE_DOM. **Required**.  

### Sprinting.**DRAW.DrawingContext**  

An inheritor of DrawingContext provides drawing functions for a specific usage. They should not be constructed on their own but rather through `Sprinting.DRAW.World`.

#### Arguments

 *Symbol* `key` [Sprinting.INTERNAL_KEY](#sprintinginternal_key). **Required**.  

###  *internal*  Sprinting.**DRAW.DrawingContext.dcInit**(_world_) 

The constructor used by inheritors of DrawingContext.

#### Arguments

 *Sprinting.DRAW.World* `world` The World that the DrawingContext belongs in.  

###  Sprinting.**DRAW.DrawingContext.putShape**(_shape_) 

Pushes a sprinting.DRAW.Shape onto itself, making it visible in the parent World on the next call to `draw`.

#### Arguments

 *Sprinting.DRAW.Shape* `shape`   

###  Sprinting.**DRAW.DrawingContext.clear**(__) 

Completely deletes all shapes.

