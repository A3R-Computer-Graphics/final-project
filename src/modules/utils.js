function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

function cartesianToSphere(x, y, z) {
  let r = Math.sqrt(x * x + y * y + z * z)
  let phi = Math.atan2(y, x)
  let theta = Math.atan2(Math.sqrt(x * x + y * y), z)
  return [r, phi, theta]
}

function sphereToCartesian(r, phi, theta) {
  let sin_t = Math.sin(theta)
  let sin_p = Math.sin(phi)
  let cos_t = Math.cos(theta)
  let cos_p = Math.cos(phi)

  let x = r * sin_t * cos_p
  let y = r * sin_t * sin_p
  let z = r * cos_t
  return [x, y, z]
}

/**
 * Compute simple ease out using cubic function
 * as outlined in this graph:
 * https://www.desmos.com/calculator/7dcarjojfl
 * 
 * @param {Number} progress value from 0 to 1 
 */

function easeOut(x) {
  return -1 * Math.pow(1 - x, 3) + 1
}

/**
 * Compute simple ease in and out using cubic function
 * as outlined in this graph:
 * https://www.desmos.com/calculator/7dcarjojfl
 * 
 * @param {Number} progress value from 0 to 1 
 */

function easeInOut(x) {
  let a = x < 1 / 2 ? 1 : -1
  let b = (1 - a) / 2
  return b + a * Math.pow(2 * (b + a * x), 3) / 2
}

function translateThenScaleTileCoordinates(points, posX, posY, scale) {
  points.forEach(point => {
    point[0] += posX
    point[1] += posY
    point[0] *= scale
    point[1] *= scale
  })
  return points
}

/**
 * Convert property name in format of string into
 * dictionary. Supported properties are position, rotation
 * and scale. If string does not match the format, this returns
 * undefined.
 * 
 * Examples:
 * `head.rotation.x` returns { modelName: "head", propertyName: "rotation", axisId: 0 }.
 * 
 * @param {String} stringPropertyName 
 */
function parsePropertyString(stringPropertyName) {
  const matches = stringPropertyName.match(/^([a-zA-Z_.0-9]+)\.(position|rotation|scale)\.(x|y|z)$/);
  if (!matches) {
    return
  }

  return {
    modelName: matches[1],
    propertyName: matches[2],
    axisId: ['x', 'y', 'z'].indexOf(matches[3])
  }
}

function interpolateExponentially(start, end, t) {
  let multiplier = Math.log(end / start);
  return start * Math.exp(multiplier * (t - start) / (end - start));
}

function interpolateLogarithmatically(start, end, t) {
  let multiplier = Math.log(end / start);
  return Math.log(t / start) / multiplier * (end - start) + start;
}

function cloneUsingJSON(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function throttle(func, limit) {
  let lastFunc
  let lastRan

  return function () {
    const context = this
    const args = arguments
    if (!lastRan) {
      func.apply(context, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function () {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

function zfill(string, count) {
  string = string.toString()
  let fillCount = Math.max(count - string.length, 0)
  if (fillCount > 0) {
    return (new Array(fillCount + 1)).join('0') + string
  }
  return string
}