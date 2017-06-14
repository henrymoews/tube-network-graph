export const CONNECTION_POINTS = {
  NORTH: 'NORTH',
  EAST: 'EAST',
  SOUTH: 'SOUTH',
  WEST: 'WEST',
  NORTHEAST: 'NORTHEAST',
  NORTHWEST: 'NORTHWEST',
  SOUTHEAST: 'SOUTHEAST',
  SOUTHWEST: 'SOUTHWEST'
}

export const CONNECTION_POINT_ORDER = [
  CONNECTION_POINTS.EAST,
  CONNECTION_POINTS.WEST,
  CONNECTION_POINTS.NORTH,
  CONNECTION_POINTS.SOUTH,
  CONNECTION_POINTS.NORTHEAST,
  CONNECTION_POINTS.SOUTHWEST,
  CONNECTION_POINTS.SOUTHEAST,
  CONNECTION_POINTS.NORTHWEST
]

export const CONNECTION_POINT_OPPOSITES = {
  NORTH: CONNECTION_POINTS.SOUTH,
  SOUTH: CONNECTION_POINTS.NORTH,
  EAST: CONNECTION_POINTS.WEST,
  WEST: CONNECTION_POINTS.EAST,
  NORTHEAST: CONNECTION_POINTS.SOUTHWEST,
  NORTHWEST: CONNECTION_POINTS.SOUTHEAST,
  SOUTHWEST: CONNECTION_POINTS.NORTHEAST,
  SOUTHEAST: CONNECTION_POINTS.NORTHWEST
}

let idCounter = 0

class Stop {
  static createByName (name) {
    return new Stop({name})
  }

  /**
   *
   * @param json {{id: string, name: string, northof: string, eastof: string, westof: string, southof: string, northeastof: string, southeastof: string, northwestof: string, southwestof: string}}
   */
  constructor (json) {
    this.name = json.name
    this.id = json.id || `stop_id_${idCounter++}`

    this.westof = json.westof
    this.eastof = json.eastof
    this.northof = json.northof
    this.southof = json.southof
    this.northeastof = json.northeastof
    this.southeastof = json.southeastof
    this.northwestof = json.northwestof
    this.southwestof = json.southwestof

    this.passingLineIds = []
    this.terminatingLineIds = []

    this.cx = null
    this.cy = null

    this.connectionsByConnectionPoint = {}
    CONNECTION_POINT_ORDER.forEach(point => {
      this.connectionsByConnectionPoint[point] = []
    })
  }

  addConnection (point, connection) {
    this.connectionsByConnectionPoint[point].push(connection)
  }

  addPassingLineId (id) {
    this.passingLineIds = this.passingLineIds.concat(id)
  }

  addTerminatingLineId (id) {
    this.terminatingLineIds = this.terminatingLineIds.concat(id)
  }

  getFreeConnectionPoint () {
    let allowedCount = 0
    let point = null
    while (point === null) {
      point = CONNECTION_POINT_ORDER.find(point => {
        return this.connectionsByConnectionPoint[point].length <= allowedCount
      })
    }
    return point
  }

  getNumberOfPassingLines () {
    return this.passingLineIds.length
  }

  getPositionConstraintFor (otherStop) {
    if (this.northof === otherStop.id) {
      return CONNECTION_POINTS.NORTH
    }
    if (this.southof === otherStop.id) {
      return CONNECTION_POINTS.SOUTH
    }
    if (this.eastof === otherStop.id) {
      return CONNECTION_POINTS.EAST
    }
    if (this.westof === otherStop.id) {
      return CONNECTION_POINTS.WEST
    }
    if (this.northeastof === otherStop.id) {
      return CONNECTION_POINTS.NORTHEAST
    }
    if (this.southeastof === otherStop.id) {
      return CONNECTION_POINTS.SOUTHEAST
    }
    if (this.southwestof === otherStop.id) {
      return CONNECTION_POINTS.SOUTHWEST
    }
    if (this.northwestof === otherStop.id) {
      return CONNECTION_POINTS.NORTHWEST
    }
    return null
  }

  getTotalNumberOfLines () {
    return this.passingLineIds.length + this.terminatingLineIds.length
  }

  setPosition (cx, cy) {
    this.cx = cx
    this.cy = cy
  }
}

export default Stop
