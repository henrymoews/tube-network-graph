#! /usr/bin/env node

import getStdin from 'get-stdin'
import shell from 'shelljs'

import DataProcessor from './graph/DataProcessor'

// the babel requires are necessary for async/await
require('babel-core/register')
require('babel-polyfill')
const jsxml = require('node-jsxml')

const GRAPHVIZ_COMMAND = 'neato'

window.printJson = (json) => {
  console.log(JSON.stringify(json, null, 4))
}

const checkGraphviz = async () => {
  const graphvizCheck = shell.exec(`which ${GRAPHVIZ_COMMAND}`, {silent: true})
  if (graphvizCheck.code !== 0) {
    return Promise.reject(new Error(`Couldn't find command '${GRAPHVIZ_COMMAND}'. Is Graphviz installed and in $PATH?`))
  }
  return Promise.resolve()
}

const getInput = async () => {
  let input
  // check if tube file is given as parameter or stdin
  // if there is a param, use that file
  if (process.argv.length >= 3) {
    // read from file
    const catResult = shell.cat(process.argv[2])

    if (catResult.code !== 0) {
      return Promise.reject(catResult.stderr)
    }

    input = catResult.stdout
  } else {
    // read from stdin
    input = await getStdin()
  }

  // remove comments (lines beginning with # or // )
  input = input.replace(/\r?\n|\r/g, '\n').split('\n').filter(line => {
    const trimmed = line.trim().replace('\\r', '')
    return !trimmed.startsWith('//') && !trimmed.startsWith('#')
  }).join('')

  return Promise.resolve(JSON.parse(input))
}

const makeDotFileText = (processedData, includeStopPosition, includeStopSize) => {
  if (includeStopPosition || includeStopSize) {
    throw new Error('not yet implemented')
  }

  const dotLines = [
    'graph G {',
    'graph [splines="true"];',
    'node [shape="point"];',
    'edge [len="0.7"];'
  ]

  // add stops
  Object.values(processedData.stops).forEach(stop => {
    dotLines.push(`${stop.id} [id="${stop.id}", xlabel="${stop.name}"];`)
  })

  // add connections
  processedData.connectionList.forEach(connection => {
    connection.lines.forEach(line => {
      dotLines.push(`${connection.from} -- ${connection.to} [color="${line.color}"];`)
    })
  })

  // finish file text
  dotLines.push('}')

  return dotLines
}

const run = async () => {
  try {
    await checkGraphviz()
    const json = await getInput()
    const processedData = new DataProcessor(json)

    const dotFileText = makeDotFileText(processedData, false, false)

    console.log(dotFileText)

    const svg = new shell.ShellString(dotFileText).exec('neato -Tsvg').stdout

    console.log(svg)

    const svgParsed = new jsxml.XML(svg)
    console.log(svgParsed.toString())
  } catch (error) {
    console.error(error)
  }
}

run()
