import Connection from './Connection'
import Line from './Line'
import Stop from './Stop'

class DataProcessor {
  constructor (data) {
    this.data = data

    this.stops = {}
    this._stopsByName = {}
    this.lines = {}
    this.connections = {}
    this.connectionList = []

    this.init()

    // new Positioner(this.stops, this.lines, this.connections).position();
  }

  init () {
    if (this.data.stops) {
      this.data.stops.forEach(stopJson => {
        const stop = new Stop(stopJson)
        this.stops[stop.id] = stop
        this._stopsByName[stop.name] = stop
      })
    }

    if (this.data.lines) {
      this.data.lines.forEach(lineJson => {
        const line = new Line(lineJson)
        this.lines[line.id] = line

        line.branches.forEach(branch => {
          branch.stopIds = branch.stopIds.map((stopIdOrName, index) => {
            let stop = this.stops[stopIdOrName] || this._stopsByName[stopIdOrName]

            if (!stop) {
              stop = Stop.createByName(stopIdOrName)
              this.stops[stop.id] = stop
              this._stopsByName[stop.name] = stop
            }

            if (index === 0 || index === branch.stopIds.length - 1) {
              stop.addTerminatingLineId(line.id)
            } else {
              stop.addPassingLineId(line.id)
            }
            return stop.id
          })
          Connection.addBranchConnectionsToConnections(this.connections, branch.stopIds, line)
        })
      })
    }

    // flatten connections from multidimensional to single dimensional
    this.connectionList = [].concat.apply([], Object.values(this.connections).map(obj => Object.values(obj)))
  }

  usePositionsFromSvg (svgDom) {
    Object.values(this.stops).forEach(stop => {
      const stopDom = svgDom.getElementById(stop.id)
      for (let i = 0; i < stopDom.childNodes.length; i++) {
        const node = stopDom.childNodes[i]

        if (node.tagName === 'ellipse') {
          stop.cx = Number(node.getAttribute('cx'))
          stop.cy = Number(node.getAttribute('cy'))
        }

        if (node.tagName === 'text') {
          stop.tx = Number(node.getAttribute('x'))
          stop.ty = Number(node.getAttribute('y'))
          stop.tAnchor = node.getAttribute('text-anchor')
          stop.tFontFamily = node.getAttribute('font-family')
          stop.tFontSize = node.getAttribute('font-size')
        }
      }
    })
  }
}

export default DataProcessor
