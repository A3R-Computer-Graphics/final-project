"use strict"

let ModuleUtil = {
  getBasenameAndDuplicateCounterFromName: function (name) {
    let match = name.match(/(.+)\.([\d]+)$/)
    let baseName = name
    let counter = -1

    if (match) {
      baseName = match[1]
      counter = parseInt(match[2])
    }

    return {
      baseName, counter
    }
  },

  getRandomName: function () {
    let NAME_COUNT = 10
    let strings = new Array(NAME_COUNT)

    for (let i = 0; i < NAME_COUNT; i++) {
      // Generate unique string from a (64) to z (64 + 25)
      let charCode = 97 + Math.floor(26 * Math.random())
      strings[i] = String.fromCharCode(charCode)
    }

    // Add hypens to ease spelling
    strings[3] += '-'
    strings[7] += '-'
    return strings.join('')
  },

  getNameFromBasenameAndDuplicateCounter: function (baseName, counter) {
    if (counter < 0) {
      return baseName
    } else {
      return baseName + '.' + zfill(counter, 3)
    }
  },

  getNextUniqueNameFromDict: function (name, dict) {
    let { baseName, counter } = this.getBasenameAndDuplicateCounterFromName(name)
    let newName = this.getNameFromBasenameAndDuplicateCounter(baseName, counter)
    while (dict.hasOwnProperty(newName)) {
      counter++
      newName = this.getNameFromBasenameAndDuplicateCounter(baseName, counter)
    }
    return newName
  }
}