module.exports = function(sprinting) {
  /**
   * A color (of both Sprinting and Sprinting.DRAW) for use by the drawing API or sprinting itself.
   * The `string` property is always equal to the color created in string-form, while `values` is the value of the argument of the same name.
   * Please note that there are no specific RGBA or HSLA, but if using RGB or HSL you can specify a fourth argument to be the alpha.
   *
   * @function Color
   * @memberOf Sprinting
   * @param {Function} type - Either Color.PLAIN, Color.HEX, Color.RGB or Color.HSL.
   * @param {...*} values - Values to specify the color in accordance to the type: see below.
   */
  function Color(type, ...values) {
    if(values.length === 1 && values[0] instanceof Array)
      values = values[0]
    return type.apply(this, values)
  }

  Color.PLAIN = function(plain) {
    return plain
  }
  Color.HEX = function(hex) {
    return hex[0] ===  '#' ? hex : `#${hex}`
  }
  Color.RGB = function(r, g, b, a) {
    return `rgb(${r},${g},${b}` + (typeof a === 'undefined' ? ')' : `,${a})`)
  }
  Color.HSL = function(h, s, l, a) {
    return `hsl(${h},${s},${l}` + (typeof a === 'undefined' ? ')' : `,${a})`)
  }

  sprinting.DEFINE_CONSTANT(Color, 'PLAIN', Color.PLAIN)
  sprinting.DEFINE_CONSTANT(Color, 'HEX', Color.HEX)
  sprinting.DEFINE_CONSTANT(Color, 'RGB', Color.RGB)
  sprinting.DEFINE_CONSTANT(Color, 'HSL', Color.HSL)

  sprinting.DRAW.Color = sprinting.Color = Color

  return sprinting
}
