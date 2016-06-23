/*!
 * Sprinting JavaScript Library - Release 0.2.1 Alpha
 * https://nanalan.github.io/sprinting/docs/
 */
window.Sprinting = (function(S) {
  require('traceur/bin/traceur-runtime')

  /**
   * @namespace Sprinting
   */

  class World {
    /**
     * Contains {@link Sprinting.Thing|everything}.
     * @class    World
     * @memberof Sprinting
     * @param    {HTMLElement|String} element - (CSS Selector of) element to draw to.
     * @param    {Number} [width=800] - Width, in pixels, of draw window.
     * @param    {Number} [height=600] - Height, in pixels, of draw window.
     * @example
     * let world = new Sprinting.World('#world')
     * world.add(new Sprinting.Square)
     * world.draw()
     */
    constructor(element, width=800, height=600) {
      switch(typeof element) {
        case 'string':
          if(element = document.querySelector(element)) {} else
            throw TypeError('element must be a CSS Selector or an HTMLElement')
          break
        case 'undefined':
            throw TypeError('element must be a CSS Selector or an HTMLElement')
          break
        default:
          if(!element instanceof HTMLElement)
            throw TypeError('element must be a CSS Selector or an HTMLElement')
          break
      }
      if(typeof width !== 'number') throw TypeError('width must be a Number')
      if(typeof height !== 'number') throw TypeError('height must be a Number')

      /**
       * Width, in pixels, of draw window.
       * @name #w
       * @alias #width
       * @memberof Sprinting.World
       * @type Number
       */
      this.width = width

      /**
       * Height, in pixels, of draw window.
       * @name #h
       * @alias #height
       * @memberof Sprinting.World
       * @type Number
       */
      this.height = height

      /**
       * Element.
       * @name #el
       * @alias #canvas
       * @memberof Sprinting.World
       * @type HTMLElement
       */
      this.el = element
      this.el.style.width = this.w + 'px'
      this.el.style.height = this.h + 'px'
      this.el.style.cursor = 'default'
      this.el.style.outline = 'initial'
      this.el.setAttribute('tabindex', 0)

      /**
       * Mouse and touch states/positions are stored here.  
       * <small style='font-size:16px'>Can also be referred to as both `World#mouse` and `World#touch`.</small>
       * @alias Sprinting.World#touch
       * @alias Sprinting.World#mouse
       * @type {Object}
       * @namespace #pointer
       * @memberof Sprinting.World
       */
      this.pointer = this.mouse = this.touch = {
        /**
         * Mouse xpos or last touched x.
         * @type {Number}
         * @name #x
         * @memberOf Sprinting.World#pointer
         * @example
         * let world = new World('#world')
         * console.log(world.mouse.x)
         */
        x: 0,

        /**
         * Mouse ypos or last touched y.
         * @name #y
         * @type {Number}
         * @memberOf Sprinting.World#pointer
         * @example
         * let world = new World('#world')
         * console.log(world.mouse.y)
         */
        y: 0,

        /**
         * Checks to see if `which` is currently down.
         * @type {Object}
         * @param {String} [which='any'] `'left'`, `'right'`, `'touch'`, or `'middle'`. Pass `'any'` to recieve any button or tap/touch.
         * @returns {Boolean} [description]
         * @memberOf Sprinting.World#pointer
         * @function #down
         * @example
         * let world = new Sprinting.World('#world')
         * world.drawLoop(function() {
         *   if(world.pointer.down('any'))
         *     console.log('mouse/touch down')
         * })
         * @todo Implement `touch`
         */
        down: (which='any') => {
          if((which === 'any' || which === 'left')   && this.mouse._down.left)   return true
          if((which === 'any' || which === 'right')  && this.mouse._down.right)  return true
          if((which === 'any' || which === 'middle') && this.mouse._down.middle) return true
          if((which === 'any' || which === 'touch')  && this.touch._down.touch)  return true
                                                                                 return false
        }
      }

      Object.defineProperty(this.pointer, '_down', {
        writable: true,
        value: {}
      })

      window.addEventListener('touchmove', (evt) => {
        this.pointer.x = evt.changedTouches[0].pageX - this.canvas.offsetLeft
        this.pointer.y = evt.changedTouches[0].pageY - this.canvas.offsetTop
        evt.preventDefault()
        evt.stopPropagation()
        return false
      })

      // listen on window allows corners to be moved to
      window.addEventListener('mousemove', (evt) => {
        this.pointer.x = evt.pageX - this.canvas.offsetLeft
        this.pointer.y = evt.pageY - this.canvas.offsetTop
        evt.preventDefault()
        evt.stopPropagation()
        return false
      })

      window.addEventListener('mousedown', e => {
        if(e.button == 0) this.mouse._down.left = true
        if(e.button == 2) this.mouse._down.right = true
        if(e.button == 1) this.mouse._down.middle = true

        e.preventDefault()
        e.stopPropagation()
        return false
      })

      window.addEventListener('mouseup', e => {
        if(e.button == 0) this.mouse._down.left = false
        if(e.button == 2) this.mouse._down.right = false
        if(e.button == 1) this.mouse._down.middle = false

        e.preventDefault()
        e.stopPropagation()
        return false
      })
      
      this.canvas.setAttribute('width', this.w)
      this.canvas.setAttribute('height', this.h)
      //this.canvas.innerHTML = 'Looks like your web browser doesn\'t support the <b>&lt;canvas&gt;</b> tag. <a href="https://browser-update.org/update.html">Update your web browser</a> now!'

      this.el.addEventListener('contextmenu', e => {
        if(!this.focus) return
        e.preventDefault()
        e.stopPropagation()
        return false
      })

      /**
       * Canvas context.
       * @name #ctx
       * @memberof Sprinting.World
       * @type CanvasRenderingContext2D
       */
      this.ctx = this.canvas.getContext('2d', { alpha: true })

      /**
       * Array of {@link Sprinting.Thing|Thing}s that are contained within this World.
       * @name #things
       * @memberof Sprinting.World
       * @type Array
       */
      this.things = []

      /**
       * Array of all sub-loops contained within this World being called each tick.
       *
       * @name #subLoops
       * @memberof Sprinting.World
       * @type Array
       */
      this.subLoops = []

      /**
       * Starts the main loop of in which all the sub-loops are called and draws all it's {@link Sprinting.Thing|things}.
       *
       * @method #initLoop
       * @memberOf Sprinting.World
       * @private
       * @ignore
       */
      Object.defineProperty(this, 'initLoop', {
        value: () => {
          let tick = () => {
            this.draw()
            if(this.focus) this.subLoops.forEach(loop => loop())

            window.setTimeout(() => window.requestAnimationFrame(tick.bind(this)), this.msPerTick)
          }

          tick.call(this)
        }
      })

      this.initLoop()

      /**
       * `true` when the World is in focus. When `false`, the World will enter **debug mode**. Don't modify if you can help it.
       * @name #focus
       * @memberof Sprinting.World
       * @type {Boolean}
       * @protected
       */
      this.el.addEventListener('blur', e => {
        this.focus = false
      })

      this.el.addEventListener('focus', e => {
        this.focus = true

        // hide debug elements
        this.things.forEach(thing => {
          if(thing._el) {
            this.el.removeChild(thing._el)
            delete thing._el

            thing._observer.disconnect()
            delete thing._observer
          }
        })
      })

      this.el.addEventListener('mousemove', e => {
        this.el.focus()
      })

      this.el.addEventListener('touchstart', e => {
        this.el.focus()
      })

      this.el.focus()
    }

    get w() {
      return this.width
    }

    set w(w) {
      this.width = w
    }

    get h() {
      return this.height
    }

    set h(h) {
      this.height = h
    }

    get el() {
      return this.canvas
    }

    set el(el) {
      this.canvas = el
    }

    /**
     * Turns on/off [antialiasing](https://www.wikiwand.com/en/Supersampling).
     * @method #antialias
     * @memberOf Sprinting.World
     * @param {Boolean} on
     * @default true
     * @chainable
     */
    antialias(on=true) {
      on = on === true ? true : false

      if(typeof this.ctx.imageSmoothingEnabled === 'undefined') {
        this.ctx.webkitImageSmoothingEnabled = on
        this.ctx.mozImageSmoothingEnabled = on
      } else {
        this.ctx.imageSmoothingEnabled = on
      }

      return this
    }

    /**
     * Add {@link Sprinting.Thing|something} to this World, which will be drawn when {@link Sprinting.World#draw|World#draw} is called.
     * @method #add
     * @memberOf Sprinting.World
     * @param {Sprinting.Thing} thing
     * @chainable
     */
    add(thing) {
      this.things.push(thing)

      return this
    }

    /**
     * Draw {@link Sprinting.Thing|everything}.
     * @method #draw
     * @memberOf Sprinting.World
     * @chainable
     */
    draw() {
      if(this.focus || this.new) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.things.forEach(thing => {
          world.ctx.save()

          // rotation
          {
            world.ctx.translate(thing.x, thing.y)
            if(thing.r) world.ctx.rotate(thing.r * Math.PI/180)
            world.ctx.translate(-thing.width * thing.rx, -thing.height * thing.ry)
          }

          thing.draw(this)
          world.ctx.restore()
        })

        if(this.new) delete this.new
      } else {
        //this.ctx.fillStyle = 'rgba(0,0,0,0.2)'
        //this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.things.forEach(thing => {
          if(!thing._el) {
            Object.defineProperty(thing, '_el', {
              configurable: true,
              writable: true,
              value: document.createElement(thing.constructor.name)
            })

            Object.defineProperty(thing, '_observer', {
              configurable: true,
              writable: true,
              value: new MutationObserver(mutation => {
                let attr = mutation[0].attributeName
                thing[attr] = thing._el.getAttribute(attr)

                // force a render
                this.new = true
                this.draw()
              })
            })

            let el = thing._el
            let observer = thing._observer

            for(let attr in thing) {
              thing._el.setAttribute(attr, thing[attr])
            }

            world.el.appendChild(thing._el)
            observer.observe(el, { attributes: true })
          }
        })
      }

      return this
    }

    /**
     * Sets the frame-rate of the draw loop.
     *
     * @method #setFrameRate
     * @memberOf Sprinting.World
     * @chainable
     * @param {Number} fps
     */
    setFrameRate(fps) {
      this.msPerTick = 1000 / fps

      return this
    }

    /**
     * Calls `fn` every frame.
     *
     * @method #drawLoop
     * @param {Function} fn Called each frame.
     * @memberOf Sprinting.World
     * @chainable
     */
    drawLoop(fn) {
      this.subLoops.push(fn)

      return this
    }

    /**
     * Automatically scale this World as big as possible (that fits inside the viewport). [Here's an example.](/sprinting/examples/games)
     * 
     * @method #scale
     * @memberOf Sprinting.World
     * @chainable
     */
    scale() {
      /*
      const resize = () => {
        let height = window.innerHeight
        let ratio = this.canvas.width / this.canvas.height
        let width = height * ratio

        this.canvas.style.width = width + 'px'
        this.canvas.style.height = height + 'px'

        this.el.style.width = width + 'px'
        this.el.style.height = height + 'px'
      }

      resize()
      window.addEventListener('resize', resize, false)
      */
     
      this.el.style.width = '100%'
      this.el.style.height = '100%'
      this.el.style.objectFit = 'contain'

      return this
    }
  }

  class Thing {
    /**
     * Things are objects that live within {@link Sprinting.World|Worlds}.
     * **Things should never be constructed directly**, rather, use an extension such as a {@link Sprinting.Square|Square}.
     *
     * @class Thing
     * @memberOf Sprinting
     * @see {@link Sprinting.Shape|Shape}
     * @param {Boolean} [quiet=false] - Whether or not to output the direct construction warning.
     * @private
     */
    constructor(quiet=false) {
      if(!quiet) console.warn('Things should never be constructed directly!')

      /**
       * X position.
       * @name #x
       * @memberof Sprinting.Thing
       * @type {Number}
       */
      this.x = 0

      /**
       * Y position.
       * @name #y
       * @memberof Sprinting.Thing
       * @type {Number}
       */
      this.y = 0

      /**
       * Rotation (in degrees).
       * @name #r
       * @memberof Sprinting.Thing
       * @type {Number}
       */
      this.r = 0

      /**
       * Rotation offset x, from zero to one where zero is no offset (top-left corner) and one is full offset (bottom-right corner).
       * @name #rx
       * @memberof Sprinting.Thing
       * @type {Number}
       */
      this.rx = 0.5

      /**
       * Rotation offset y, from zero to one where zero is no offset (top-left corner) and one is full offset (bottom-right corner).
       * @name #ry
       * @memberof Sprinting.Thing
       * @type {Number}
       */
      this.ry = 0.5
    }

    /**
     * Things may not be drawn unless they are extended.
     * @memberof Sprinting.Thing
     * @ignore
     */
    draw() {
      throw Error('Things cannot be drawn unless extended.')
    }
  }

  class Shape extends Thing {
    /**
     * Shapes are {@link Sprinting.Thing|Things} with both a stroke color and a fill color.
     * **Shapes should never be constructed directly**, rather, use an extension such as a {@link Sprinting.Rectangle|Rectangle}.
     *
     * @class Shape
     * @memberOf Sprinting
     * @see {@link Sprinting.Circle|Circle} {@link Sprinting.Rectangle|Rectangle}
     * @param {String} [stroke='#000'] - Stroke color.
     * @param {String} [fill='transparent'] - Fill color.
     * @param {Number} [strokeWidth=1] - Stroke width in pixels.
     * @param {Boolean} [quiet=false] - Whether or not to output the direct construction warning.
     * @private
     */
    constructor(stroke='#000', fill='transparent', strokeWidth=1, quiet=false) {
      super(true)
      if(!quiet) console.warn('Shapes should never be constructed directly!')

      /**
       * @name #stroke
       * @memberof Sprinting.Shape
       * @type {String}
       */
      if(!stroke instanceof String) throw TypeError('stroke must be a String')
      this.stroke = stroke

      /**
       * @name #fill
       * @memberof Sprinting.Shape
       * @type {String}
       */
      if(!fill instanceof String) throw TypeError('fill must be a String')
      this.fill = fill

      /**
       * @name #strokeWidth
       * @memberof Sprinting.Shape
       * @type {String}
       */
      if(!strokeWidth instanceof Number) throw TypeError('strokeWidth must be a Number')
      this.strokeWidth = strokeWidth
    }

    /**
     * Shapes may not be drawn unless they are extended.
     * @ignore
     */
    draw() {
      throw Error('Shapes cannot be drawn unless extended.')
    }
  }

  class SizedShape extends Shape {
      constructor(width=50, height=50, stroke='#000', fill='transparent', strokeWidth=1, quiet=false) {
        super(stroke, fill, strokeWidth, quiet)

        /**
         * @name #width
         * @memberof Sprinting.SizedShape
         * @type {Number}
         */
        if(!(typeof width === 'number')) throw new TypeError('width must be a Number')
        this.width = width

        /**
         * @name #height
         * @memberof Sprinting.SizedShape
         * @type {Number}
         */
        if(!(typeof height === 'number')) throw new TypeError('height must be a Number')
        this.height = height
      }
  }

  class Rectangle extends SizedShape {
    /**
     * Rectangles are {@link Sprinting.Shape|Shapes} that have a width and height.
     *
     * @class Sprinting.Rectangle
     * @extends Sprinting.Shape
     * @param {Number} [width=75]
     * @param {Number} [height=75]
     * @param {String} [stroke='#000'] - Stroke color.
     * @param {String} [fill='transparent'] - Fill color.
     * @param {Number} [strokeWidth=1] - Stroke width in pixels.
     * @example
     * // draws a 100x75 black-bordered rectangle in the World
     * let world = new World('#world')
     * world.add(new Rectangle).draw()
     */
    constructor(width=100, height=75, stroke='#000', fill='transparent', strokeWidth=1) {
      super(width, height, stroke, fill, strokeWidth, true)
    }

    /**
     * This method is called by the parent World's {@link Sprinting.World#draw|draw()} method (although you can call it on it's own as shown in the example).
     * @example
     * let world = new World('#world')
     * let rect = new Rectangle
     * rect.draw(world)
     * @function #draw
     * @memberof Sprinting.Rectangle
     */
    draw(world) {
      if(!world instanceof World) throw TypeError('world must be a World')

      world.ctx.strokeStyle = this.stroke
      world.ctx.fillStyle = this.fill
      world.ctx.lineWidth = this.strokeWidth
      world.ctx.fillRect(0, 0, this.width, this.height)
      world.ctx.strokeRect(0, 0, this.width, this.height)
    }
  }

  class Circle extends SizedShape {
    /**
     * Circles are {@link Sprinting.Shape|Shapes} that have a radius.
     *
     * @class Sprinting.Circle
     * @extends Sprinting.Shape
     * @param {Number} [width=100]
     * @param {Number} [height=100]
     * @param {String} [stroke='#000'] - Stroke color.
     * @param {String} [fill='transparent'] - Fill color.
     * @param {Number} [strokeWidth=1] - Stroke width in pixels.
     * @example
     * // draws a circle with 100px diameter
     * let world = new World('#world')
     * world.add(new Circle).draw()
     * @example
     * // draws a semicircle with 200px diameter
     * let world = new World('#world')
     * world.add(new Circle(200, 200, 180)).draw()
     */
    constructor(width=100, height=100, stroke='#000', fill='transparent', strokeWidth=1) {
      super(width, height, stroke, fill, strokeWidth, true)
    }

    /**
     * This method is called by the parent World's {@link Sprinting.World#draw|draw()} method.
     * @see Sprinting.Rectangle#draw
     * @function #draw
     * @memberof Sprinting.Circle
     */
    draw(world) {
      if(!world instanceof World) throw TypeError('world must be a World')

      const specialConst = .5522848,
            cpOffsetX    = (this.width / 2)  * specialConst,
            cpOffsetY    = (this.height / 2) * specialConst,
            greatestX    = this.width,
            greatestY    = this.height,
            centerX      = this.width / 2,
            centerY      = this.height / 2

      world.ctx.strokeStyle = this.stroke
      world.ctx.fillStyle = this.fill
      world.ctx.lineWidth = this.strokeWidth

      world.ctx.beginPath()
      world.ctx.moveTo(0, centerY)

      world.ctx.bezierCurveTo(0,centerY - cpOffsetY, centerX - cpOffsetX,0, centerX,0)
      world.ctx.bezierCurveTo(centerX + cpOffsetX,0, greatestX,centerY - cpOffsetY, greatestX,centerY)
      world.ctx.bezierCurveTo(greatestX,centerY+cpOffsetY, centerX+cpOffsetX,greatestY, centerX,greatestY)
      world.ctx.bezierCurveTo(centerX - cpOffsetX,greatestY, 0,centerY+cpOffsetY, 0,centerY)

      world.ctx.fill()
      world.ctx.stroke()
    }
  }

  class Img extends Thing {
    /**
     * Images are {@link Sprinting.Thing|Things} that are drawn with a URI. **Warning: due to browser security, you must use [some kind of webserver](http://www.tecmint.com/python-simplehttpserver-to-create-webserver-or-serve-files-instantly/) to load images correctly**.
     *
     * @class Img
     * @memberOf Sprinting
     * @param {String} src - Image to display.
     * @param {Number|'auto'} [width='auto']
     * @param {Number|'auto'} [height='auto']
     * @example
     * // display an image of Donald Trump (of course)
     * let img = new Sprinting.Img('trump.jpg')
     * world.add(img)
     */
    constructor(src, width='auto', height='auto') {
      super(true)

      /**
       * @name #_src
       * @memberof Sprinting.Img
       * @type {Image}
       * @private
       */
      Object.defineProperty(this, '_src', {
        writable: true,
        value: src
      })

      /**
       * Load this image. Called automatically.
       * @name #load
       * @memberof Sprinting.Img
       * @type {Function}
       */
      Object.defineProperty(this, 'load', {
        value: function() {
          /**
           * @name #img
           * @memberof Sprinting.Img
           * @type {Image}
           * @private
           */
          Object.defineProperty(this, 'img', {
            writable: true,
            value: new Image()
          })

          this.loaded = false
          this.img.addEventListener('load', () => this.loaded = true)
          this.img.src = src

          this._src = src
          this.src = src
        }
      })

      this.load()

      /**
       * @name #src
       * @memberof Sprinting.Img
       * @type {String}
       */
      if(!src instanceof String) throw TypeError('src must be a String')
      this.src = src

      /**
       * `true` once {@link Sprinting.Img#src|src} has loaded.
       * @name #loaded
       * @memberof Sprinting.Img
       * @type {Boolean}
       */
      this.loaded = false

      /**
       * @name #width
       * @memberOf Sprinting.Img
       * @type {Number|'auto'}
       */
      if(typeof width !== 'number' && width !== 'auto')
        throw TypeError('width must be a Number or "auto"')
      Object.defineProperty(this, '_width', { value: width, writable: true })

      /**
       * @name #height
       * @memberOf Sprinting.Img
       * @type {Number|'auto'}
       */
      if(typeof width !== 'number' && height !== 'auto')
        throw TypeError('height must be a Number or "auto"')
      Object.defineProperty(this, '_height', { value: height, writable: true })

      Object.defineProperty(this, 'width', {
        get: () => this._width === 'auto' ? this.img.width : this._width,
        set: w => this._width = w,
        enumerable: true
      })

      Object.defineProperty(this, 'height', {
        get: () => this._height === 'auto' ? this.img.height : this._height,
        set: h => this._height = h,
        enumerable: true
      })
    }

    /**
     * This method is called by the parent World's {@link Sprinting.World#draw|draw()} method.
     * @see Sprinting.Rectangle#draw
     * @function #draw
     * @memberof Sprinting.Img
     */
    draw(world) {
      if(!world instanceof World) throw TypeError('world must be a World')

      if(this._src !== this.src) this.loaded = false

      if(this.loaded) {
        world.ctx.drawImage(
          this.img,
          0, 0,
          this.width,
          this.height
        )
      } else {
        this.load()
      }
    }
  }

  S.World = World
  S.Thing = Thing
  S.Shape = Shape
  S.Rectangle = Rectangle
  S.Circle = Circle
  S.Img = Img
  return S
}({}))
