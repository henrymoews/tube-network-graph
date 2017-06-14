import LineBranch from './LineBranch'

export const COLORS = [
  'red',
  'blue',
  'orange',
  'brown',
  'black',
  'purple',
  'yellow'
]

class ColorGenerator {
  constructor () {
    this.colorIndex = -1
  }

  getNextColor () {
    this.colorIndex += 1
    return COLORS[this.colorIndex % COLORS.length]
  }
}

const colorGenerator = new ColorGenerator()

let idCounter = 0

class Line {
  /**
   *
   * @param json {{id: string, name: string, color: string, branches: Array<{stops: [string]}>}}
   */
  constructor (json) {
    this.name = json.name
    this.id = json.id || json.name
    this.graphvizId = `line_id_${idCounter++}`
    this.color = json.color || colorGenerator.getNextColor()

    /**
     *
     * @type {Array<LineBranch>}
     */
    this.branches = json.branches.map(branchJson => new LineBranch(branchJson))
  }
}

export default Line
