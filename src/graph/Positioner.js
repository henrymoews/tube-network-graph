import {CONNECTION_POINTS, CONNECTION_POINT_OPPOSITES} from './Stop'

export const STOP_DISTANCE_STRAIGHT = 75
const MARGIN_FROM_EDGE = 100

class Positioner {
  constructor (stops, lines, connections) {
    this.stops = stops
    this.lines = lines
    this.connections = connections

    this.sortedStopIds = this._sortStops(stops).map(stop => stop.id)
    this.remainingStopIdsToPosition = []  // will be set in position()
    this.positionedStopIds = []
  }

  position () {
    this.remainingStopIdsToPosition = this.sortedStopIds.slice()   // slice() duplicates the array
    while (this.remainingStopIdsToPosition.length > 0) {
      console.log(`remainingStopIdsToPosition: ${JSON.stringify(this.remainingStopIdsToPosition)}`)
      this._positionNextStop()
    }

    // position stops so all of them are visible
    let minx = null
    let miny = null
    const allStops = Object.values(this.stops)
    allStops.forEach(stop => {
      if (stop.cx === null || stop.cx < minx) {
        minx = stop.cx
      }
      if (stop.cy === null || stop.cy < miny) {
        miny = stop.cy
      }
    })

    console.log({minx, miny})

    allStops.forEach(stop => {
      stop.cx = stop.cx - minx + MARGIN_FROM_EDGE
      stop.cy = stop.cy - miny + MARGIN_FROM_EDGE
    })

    console.log(this.stops)
  }

  _positionNextStop () {
    const stopId = this.remainingStopIdsToPosition[0]
    console.log(`positioning stop with id ${stopId}`)
    let successfullyPositioned = false
    if (this.positionedStopIds.length === 0) {
      this.stops[stopId].setPosition(0, 0)
      successfullyPositioned = true
    } else {
      // check if the next stop is connected to any position one
      let connection = null

      console.log({positionedStopIds: this.positionedStopIds})

      const positionedStopId = this.positionedStopIds.find(positionedStopId => {
        const orderedStopIds = this._orderIds(positionedStopId, stopId)

        connection = this.connections[orderedStopIds.id1] ? this.connections[orderedStopIds.id1][orderedStopIds.id2] : null

        // check if a connection exists
        return Boolean(connection)
      })

      if (positionedStopId) {
        const stop = this.stops[positionedStopId]
        const otherStop = this.stops[stopId]

        let point = stop.getPositionConstraintFor(otherStop)
        if (!point) {
          const otherStopPoint = otherStop.getPositionConstraintFor(stop)
          console.log(`${otherStop.id} is ${otherStopPoint} of ${stop.id}`)
          if (otherStopPoint) {
            point = CONNECTION_POINT_OPPOSITES[otherStopPoint]
            // point = otherStopPoint;
          }
        }
        if (!point) {
          point = stop.getFreeConnectionPoint()
        }
        console.log(`${stop.id} is ${point} of ${otherStop.id}`)

        stop.addConnection(point, connection)
        otherStop.addConnection(CONNECTION_POINT_OPPOSITES[point], connection)

        switch (point) {
          case CONNECTION_POINTS.EAST: otherStop.setPosition(stop.cx - STOP_DISTANCE_STRAIGHT, stop.cy); break
          case CONNECTION_POINTS.WEST: otherStop.setPosition(stop.cx + STOP_DISTANCE_STRAIGHT, stop.cy); break
          case CONNECTION_POINTS.SOUTH: otherStop.setPosition(stop.cx, stop.cy - STOP_DISTANCE_STRAIGHT); break
          case CONNECTION_POINTS.NORTH: otherStop.setPosition(stop.cx, stop.cy + STOP_DISTANCE_STRAIGHT); break
          case CONNECTION_POINTS.NORTHEAST: otherStop.setPosition(stop.cx - STOP_DISTANCE_STRAIGHT, stop.cy + STOP_DISTANCE_STRAIGHT); break
          case CONNECTION_POINTS.NORTHWEST: otherStop.setPosition(stop.cx + STOP_DISTANCE_STRAIGHT, stop.cy + STOP_DISTANCE_STRAIGHT); break
          case CONNECTION_POINTS.SOUTHEAST: otherStop.setPosition(stop.cx - STOP_DISTANCE_STRAIGHT, stop.cy - STOP_DISTANCE_STRAIGHT); break
          case CONNECTION_POINTS.SOUTHWEST: otherStop.setPosition(stop.cx + STOP_DISTANCE_STRAIGHT, stop.cy - STOP_DISTANCE_STRAIGHT); break
          default: break
        }

        successfullyPositioned = true
      }
    }

    if (successfullyPositioned) {
      this.positionedStopIds.push(stopId)
      this.remainingStopIdsToPosition.shift()
    } else {
      this.remainingStopIdsToPosition.push(stopId)
      this.remainingStopIdsToPosition.shift()
    }
  }

  /**
   * Sorts stops by line number count.
   * First sorted by number of passing lines and then by number of passing and terminating lines
   */
  _sortStops (stops) {
    return Object.values(stops).sort((stop1, stop2) => {
      const s1Passing = stop1.getNumberOfPassingLines()
      const s2Passing = stop2.getNumberOfPassingLines()

      if (s1Passing < s2Passing) {
        return 1
      }
      if (s1Passing > s2Passing) {
        return -1
      }

      const s1Total = stop1.getTotalNumberOfLines()
      const s2Total = stop2.getTotalNumberOfLines()

      if (s1Total < s2Total) {
        return 1
      }
      if (s1Total > s2Total) {
        return -1
      }
      return 0
    })
  }

  _orderIds (id1, id2) {
    if (id1 < id2) {
      return {
        id1,
        id2
      }
    }
    return {
      id1: id2,
      id2: id1
    }
  }
}

export default Positioner
