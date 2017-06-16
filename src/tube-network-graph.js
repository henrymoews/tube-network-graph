#! /usr/bin/env node

import getStdin from 'get-stdin'
import shell from 'shelljs'

import DataProcessor from './graph/DataProcessor'

// the babel requires are necessary for async/await
require('babel-core/register')
require('babel-polyfill')
const DomParser = require('xmldom').DOMParser

const GRAPHVIZ_COMMAND = 'neato'

JSON.prettyPrint = (json) => {
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

const outputSvg = (dataProcessor, viewBox, width, height, outerGroup) => {

  const gTransform = outerGroup.getAttribute('transform')

  const svg = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"',
    ' "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n',
    `<svg viewBox="${viewBox}" width="${width}" height="${height}"`,
    ' xmlns="http://www.w3.org/2000/svg"',
    ' xmlns:xlink="http://www.w3.org/1999/xlink">\n',
    ` <g transform="${gTransform}">`,
    Object.values(dataProcessor.stops).map(stop => stop.toSvg()).join(''),
    ' </g>',
    '</svg>'
  ].join('')

  return svg
}

const run = async () => {
  try {
    await checkGraphviz()
    const json = await getInput()
    const dataProcessor = new DataProcessor(json)
    const dotFileText = makeDotFileText(dataProcessor, false, false)

    // const svg = new shell.ShellString(dotFileText).exec('neato -Tsvg', {silent: true}).stdout
    const svg = new shell.ShellString(dotFileText).exec('neato -Tsvg', {silent: true}).stdout

    const svgDom = new DomParser().parseFromString(svg)
    dataProcessor.usePositionsFromSvg(svgDom)

    const svgDomRoot = svgDom.getElementsByTagName('svg')[0]
    const svgViewBox = svgDomRoot.getAttribute('viewBox')
    const svgWidth = svgDomRoot.getAttribute('width')
    const svgHeight = svgDomRoot.getAttribute('height')

    const outerGroup = svgDom.getElementById('graph0')

    if (outerGroup.getAttribute('id') !== 'graph0') {
      throw new Error('Unexpected svg layout! Did not find <g> with id "graph0" in graphviz generated SVG.')
    }

    const svgOutput = outputSvg(dataProcessor, svgViewBox, svgWidth, svgHeight, outerGroup)
    console.log(svgOutput)
  } catch (error) {
    console.error(error)
  }
}

run()
