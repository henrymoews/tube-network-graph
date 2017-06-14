class Connection {
  static addBranchConnectionsToConnections (existingConnections, stopIds, line) {
    let lastStopId = null
    stopIds.forEach(stopId => {
      if (lastStopId !== null) {
        const orderedIds = Connection._orderIds(lastStopId, stopId)

        // find if such a connection already exists
        if (existingConnections[orderedIds.id1] && existingConnections[orderedIds.id1][orderedIds.id2]) {
          /**
           * @type {Connection}
           */
          const connection = existingConnections[orderedIds.id1][orderedIds.id2]
          connection.addLine(line)
          lastStopId = stopId
          return
        }
        if (!existingConnections[orderedIds.id1]) {
          existingConnections[orderedIds.id1] = {}
        }
        existingConnections[orderedIds.id1][orderedIds.id2] = new Connection(orderedIds.id1, orderedIds.id2, line)
      }
      lastStopId = stopId
    })
  }

  static _orderIds (id1, id2) {
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

  constructor (stop1Id, stop2Id, line) {
    const lineToAdd = Object.assign({}, line)
    delete lineToAdd.branches

    const orderedIds = Connection._orderIds(stop1Id, stop2Id)
    this.from = orderedIds.id1
    this.to = orderedIds.id2
    this.lines = [lineToAdd]
  }

  addLine (lineId) {
    this.lines.push(lineId)
  }
}

export default Connection
