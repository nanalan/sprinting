/*!
 * Sprinting JavaScript Library - Release 0.2.0 Alpha
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
       * @memberof Sprinting.World
       * @type Number
       */
      this.w = width

      /**
       * Height, in pixels, of draw window.
       * @name #h
       * @memberof Sprinting.World
       * @type Number
       */
      this.h = height

      /**
       * Element container for this World.
       * @name #el
       * @memberof Sprinting.World
       * @type HTMLElement
       */
      this.el = element
      this.el.style.width = this.w + 'px'
      this.el.style.height = this.h + 'px'
      this.el.style.cursor = 'default'
      this.el.style.outline = 'initial'
      this.el.setAttribute('tabindex', 0)
      this.el.addEventListener('contextmenu', e => {
        if(!this.focus) return
        e.preventDefault()
        e.stopPropagation()
        return false
      })

      /**
       * Canvas that is being drawn to.
       * @name #canvas
       * @memberof Sprinting.World
       * @type HTMLElement
       */
      this.canvas = element.appendChild(document.createElement('canvas'))
      this.canvas.setAttribute('width', this.w)
      this.canvas.setAttribute('height', this.h)
      this.canvas.innerHTML = 'Looks like your web browser doesn\'t support the <b>&lt;canvas&gt;</b> tag. <a href="https://browser-update.org/update.html">Update your web browser</a> now!'
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'

      /**
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

      this.initLoop()

      /**
       * `true` when the World is in focus. When `false`, the World will enter **debug mode**.
       * @name #focus
       * @memberof Sprinting.World
       * @type {Boolean}
       */
      this.focus = false
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

      this.new = true // will be deleted after one draw
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
     * @todo A draw loop
     */
    draw() {
      if(this.focus || this.new) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.things.forEach(thing => thing.draw(this))

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

            thing._el.style.display = 'none'
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
     * Starts the main loop of in which all the sub-loops are called and draws all it's {@link Sprinting.Thing|things}.
     *
     * @method #initLoop
     * @memberOf Sprinting.World
     * @private
     * @ignore
     */
    initLoop() {
      let tick = function() {
        this.draw()
        if(this.focus) this.subLoops.forEach(loop => loop())

        window.setTimeout(() => window.requestAnimationFrame(tick.bind(this)), this.msPerTick)
      }

      tick.call(this)
    }

    /**
     * Sets the frame-rate of the main loop.
     *
     * @method #setFrameRate
     * @memberOf Sprinting.World
     * @chainable
     */
     setFrameRate(fps) {
       this.msPerTick = 1000 / fps

       return this
     }

     /**
      * Pushes a loop called each tick.
      *
      * @method #drawLoop
      * @memberOf Sprinting.World
      * @chainable
      */

     drawLoop(fn) {
       this.subLoops.push(fn)

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
       * @name #x
       * @memberof Sprinting.Thing
       * @type {Number}
       */
      this.x = 0

      /**
       * @name #y
       * @memberof Sprinting.Thing
       * @type {Number}
       */
      this.y = 0
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
     * **Shapes should never be constructed directly**, rather, use an extension such as a {@link Sprinting.Square|Square}.
     *
     * @class Shape
     * @memberOf Sprinting
     * @see {@link Sprinting.Square|Square} {@link Sprinting.Rectangle|Rectangle}
     * @param {String} [stroke='#000'] - Stroke color.
     * @param {String} [fill='transparent'] - Fill color.
     * @param {Boolean} [quiet=false] - Whether or not to output the direct construction warning.
     * @private
     */
    constructor(stroke='#000', fill='transparent', quiet=false) {
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
    }

    /**
     * Shapes may not be drawn unless they are extended.
     * @ignore
     */
    draw() {
      throw Error('Shapes cannot be drawn unless extended.')
    }
  }

  class Rectangle extends Shape {
    /**
     * Rectangles are {@link Sprinting.Shape|Shapes} that have a width and height.
     *
     * @class Sprinting.Rectangle
     * @extends Sprinting.Shape
     * @param {Number} [width=75]
     * @param {Number} [height=75]
     * @param {String} [stroke='#000'] - Stroke color.
     * @param {String} [fill='transparent'] - Fill color.
     * @example
     * // draws a 100x75 black-bordered rectangle in the World
     * let world = new World('#world')
     * world.add(new Rectangle).draw()
     */
    constructor(width=100, height=75, stroke='#000', fill='transparent') {
      super(stroke, fill, true)

      /**
       * @name #width
       * @memberof Sprinting.Rectangle
       * @type {Number}
       */
      if(!width instanceof Number) throw TypeError('width must be a Number')
      this.width = width

      /**
       * @name #height
       * @memberof Sprinting.Rectangle
       * @type {Number}
       */
      if(!height instanceof Number) throw TypeError('height must be a Number')
      this.height = height
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

      if(!this.width instanceof Number) throw TypeError('width must be a Number')
      if(this.width < 0) throw TypeError('width must be positive')

      if(!this.height instanceof Number) throw TypeError('height must be a Number')
      if(this.height < 0) throw TypeError('height must be positive')

      world.ctx.strokeStyle = this.stroke
      world.ctx.fillStyle = this.fill
      world.ctx.fillRect(this.x, this.y, this.width, this.height)
      world.ctx.strokeRect(this.x, this.y, this.width, this.height)
    }
  }

  S.World = World
  S.Thing = Thing
  S.Shape = Shape
  S.Rectangle = Rectangle
  return S
}({}))
