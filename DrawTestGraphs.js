let id = 0
let pointInfoColour = "#f8f8f8"
/* Inserts a new chart of the given type into the page, and returns a chart
 * pagid: string
 * id: number
 * size: {height: number, widht: number}
 * type: string
 * labels: string
 * dataSets: Array({label: string, data:, backgroundColor: string})
 */
function addChart(pageid, id, size, type, labels, dataSets) {
  function barChart() {
    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: dataSets,
      },
      options: {
        scales: {
          yAxes: [{
             ticks: {
               beginAtZero:false
             }
          }]
        }
      }
    });
  }
  
  function scatterGraph() {
    return new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: dataSets
      },
      options: {
        scales: {
          xAxes: [{
            type: 'linear',
            position: 'bottom'
          }],
        }
      }
    })
  }
  
  /* Prints data of a selected point beneath the chart
  */
  function addPointDataDiv(pointData, chartId) {
    console.log(JSON.stringify(pointData))
    let chartElement = document.getElementById(chartId)
    let testData = pointData.testData
    let dataJson = {
      x: pointData.x,
      y: pointData.y,
      testData: {
        pCorrect: testData.pCorrect,
        noise: testData.noise,
        askedQs: testData.askedQs,
        startLevel: testData.startLevel,
        endLevel: testData.endLevel
      }
    }
    
    let levelString = `startLevel:${testData.startLevel}`
    if (typeof testData.endLevel !== "number") {
      levelString += `|endLevel:${testData.endLevel}`
    }
    
    let stateElement = ""
    if (testData.studentSkills instanceof Map && testData.transcriptState instanceof Map && testData.comparedState instanceof Map) {
      let studentSkills = testData.studentSkills
      let transcriptState = testData.transcriptState
      let comparedState = testData.comparedState
      
      let stateTable = "Tag|Student Skills|Transcript State|Compared State<br/>"
      for (let tag of [...studentSkills.keys()]) {
        stateTable += `${tag}|${studentSkills.get(tag)}|${transcriptState.get(tag)}|${comparedState.get(tag)}<br/>`
      }
      
      stateElement = `<p class="state" style="display: block">${stateTable}</p>`
      
      dataJson.testData.studentSkills = [...testData.studentSkills.entries()]
      dataJson.testData.transcriptState = [...testData.transcriptState.entries()]
      dataJson.testData.comparedState = [...testData.comparedState.entries()]
    } else if (testData.transcriptState instanceof Map && !(testData.studentSkills instanceof Map) && !(testData.comparedState instanceof Map)) {
      let transcriptState = testData.transcriptState
      
      let stateTable = "Tag|Transcript State<br/>"
      for (let tag of [...transcriptState.keys()]) {
        stateTable += `${tag}|${transcriptState.get(tag)}<br/>`
      }
      
      stateElement = `<p class="state" style="display: block">${stateTable}</p>`
      
      dataJson.testData.transcriptState = [...testData.transcriptState.entries()]
    }
    
    let pointDiv = 
        `<div style="background-color: ${pointInfoColour};">
          <p>x:${pointData.x}|y:${pointData.y}|pCorrect:${testData.pCorrect}|pMistake:${testData.noise.pMistake}|pFluke${testData.noise.pFluke}|${levelString}</p>
          <p>askedQs:${String(testData.askedQs).replace(/,/g, ", ")}</p>
          ${stateElement}
        </div>`
    
    chartElement.insertAdjacentHTML('afterend', pointDiv)
    console.log(JSON.stringify(dataJson))
}
  
  if (!(dataSets instanceof Array)) {
    dataSets = []
  }

  let width = size.width
  let height = size.height
  let page = document.getElementById(pageid)
  let chartId = `chart${id}`
  let chart = `<div class="divChart"><canvas id="${chartId}" style="width:${width}px; height:${height}px; margin: 10px;"></canvas>`
  page.insertAdjacentHTML('beforeend', chart)
  
  let ctx = document.getElementById(`${chartId}`).getContext('2d');

  if (type === "bar") {
    return barChart()
  } else if (type === "scatter") {
    let chart = scatterGraph()
    document.getElementById(chartId).onclick = function(evt){
      let datasets = chart.data.datasets
      let point = chart.getElementAtEvent(evt)
      if (point.length > 0) {
        let pointData = datasets[point[0]._datasetIndex].data[point[0]._index]
        let chartId = `chart${point[0]._chart.id}`
        addPointDataDiv(pointData, chartId)
      }
    }
    
    return chart
  }
}

/* Removes all charts from the page
 */
function removeAllCharts() {
  let page = document.getElementById(pageid)
  let divCharts = page.getElementsByClassName("divChart")
  while (divCharts.length > 0 ) {
    divCharts[0].remove()
  }
  
  id = 0
}

/* Adds a dataset to the chart and updates the chart on the page to show the added data
 * chart: Chart
 * label: string
 * data: Array, An object with the correct data in, e.g. scatter graph data has Array({x: number, y: number, testData:, context: string}), bar chart data has Array(number)
 * colour: string
 */
function addDataSet(chart, label, data, colour) {
  let dataSet = {
    label: label, 
    data: data, 
    backgroundColor: colour,
  }
  
  chart.data.datasets.push(dataSet)
  if (chart.config.type === "scatter") {
    chart.options.tooltips = {
      callbacks: {
        label: function(tooltipItem, data) {
          let pointData = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
          let test = pointData.testData
          let label = `${pointData.context}, pCorrect: ${pointData.x}, pMistake: ${test.noise.pMistake}, pFluke: ${test.noise.pFluke}, level: ${test.startLevel}`
          return label;
        }
      }
    }
  }
  chart.update()
}

/* Draws a bar chart of the total number of questions asked for all data in testData
 * testData: Array, This array is created by testStudents() in testSimulator.js 
 * startLevel: number
 * endLevel: number
 * colours: Array(string)
 */
function barChartTotalAsked(testData, startLevel, endLevel, colours) {
  if (!(colours instanceof Array)) {
    colours = []
  }
  while (colours.length < endLevel - startLevel + 1) {
    colours.push('rgba(100, 206, 86, 1)')
  }
  
  let pToNumAsked = new Map()
  let levelsAsked = []
  for (let i = startLevel; i <= endLevel; i++) {
    levelsAsked.push(new Map())
  }
  
  for (let test of testData) {
    if (pToNumAsked.has(test.pCorrect)) {
      pToNumAsked.set(test.pCorrect, pToNumAsked.get(test.pCorrect) + test.askedQs.length)
    } else {
      pToNumAsked.set(test.pCorrect, test.askedQs.length)
    }
    
    let mapToAddTo = levelsAsked[test.startLevel - startLevel]
    if (mapToAddTo.has(test.pCorrect)) {
      mapToAddTo.set(test.pCorrect, mapToAddTo.get(test.pCorrect) + test.askedQs.length)
    } else {
      mapToAddTo.set(test.pCorrect, test.askedQs.length)
    }

  }

  let chart = addChart(pageid, id++, chartSize, "bar", [...pToNumAsked.keys()])

  addDataSet(chart, 'Total number of questions asked over all starting levels', [...pToNumAsked.values()], 'rgba(200, 150, 132, 1)')
  
  for (let i = 0; i < levelsAsked.length; i++) {
    addDataSet(chart, `Total number of questions asked over starting level ${(i + startLevel)}`, [...levelsAsked[i].values()], colours[i])
  }
}

/* Draws a scatter graph of the total number of questions asked for all data in testData
 * testData: Array, This array is created by testStudents() in testSimulator.js 
 * startLevel: number
 * endLevel: number
 * colours: Array(string)
 */
function scatterGraphTotalAsked(testData, startLevel, endLevel, colours) {
  if (!(colours instanceof Array)) {
    colours = []
  }
  while (colours.length < endLevel - startLevel + 1) {
    colours.push('rgba(100, 206, 86, 1)')
  }
  
  let levelsAsked = []
  for (let i = startLevel; i <= endLevel; i++) {
    levelsAsked.push([])
  }
  
  for (let test of testData) {    
    let levelToAddTo = levelsAsked[test.startLevel - startLevel]
    let y = test.askedQs.length
    let data = {
      x: test.pCorrect,
      y: y,
      testData: test,
      context: `Total Qs asked: ${y}`
    }
    
    levelToAddTo.push(data)
  }

  let chart = addChart(pageid, id++, chartSize, "scatter")
  
  for (let i = 0; i < levelsAsked.length; i++) {
    addDataSet(chart, `Total number of questions asked over starting level ${(i + startLevel)}`, levelsAsked[i], colours[i])
  }
}

/* Returns the average level of the questions asked in a test
 * askedQs: Array(string)
 */
function getAverageLevelAsked(askedQs) {
  let totalLevel = 0 
  for (let q of askedQs) {
    totalLevel += parseInt(net.nodesMap.get(q).level, 10)
  }
  return totalLevel / askedQs.length
}

/* Draws a bar chart of the average level of questions asked for all data in testData
 * testData: Array, This array is created by testStudents() in testSimulator.js 
 * startLevel: number
 * endLevel: number
 * colours: Array(string)
 */
function barChartAverageLevelAsked(testData, startLevel, endLevel, colours) {
  if (!(colours instanceof Array)) {
    colours = []
  }
  while (colours.length < endLevel - startLevel + 1) {
    colours.push('rgba(100, 206, 86, 1)')
  }
  
  let pToAverageAsked = new Map()
  let levelsAverageAsked = []
  for (let i = startLevel; i <= endLevel; i++) {
    levelsAverageAsked.push(new Map())
  }
  
  for (let test of testData) {
    if (pToAverageAsked.has(test.pCorrect)) {
      pToAverageAsked.set(test.pCorrect, (pToAverageAsked.get(test.pCorrect) + getAverageLevelAsked(test.askedQs)) / 2)
    } else {
      pToAverageAsked.set(test.pCorrect, getAverageLevelAsked(test.askedQs))
    }
    
    let mapToAddTo = levelsAverageAsked[test.startLevel - startLevel]
    if (mapToAddTo.has(test.pCorrect)) {
      mapToAddTo.set(test.pCorrect, (mapToAddTo.get(test.pCorrect) + getAverageLevelAsked(test.askedQs)) / 2)
    } else {
      mapToAddTo.set(test.pCorrect, getAverageLevelAsked(test.askedQs))
    }

  }

  let chart = addChart(pageid, id++, chartSize, "bar", [...pToAverageAsked.keys()])

  addDataSet(chart, 'Average level of questions asked over all starting levels', [...pToAverageAsked.values()], 'rgba(200, 150, 132, 1)')
  
  for (let i = 0; i < levelsAverageAsked.length; i++) {
    addDataSet(chart, `Average level of questions asked over starting level ${(i + startLevel)}`, [...levelsAverageAsked[i].values()], colours[i])
  }
}

/* Draws a scatter graph of the average level of the questions asked for all data in testData
 * testData: Array, This array is created by testStudents() in testSimulator.js 
 * startLevel: number
 * endLevel: number
 * colours: Array(string)
 */
function scatterGraphAverageLevelAsked(testData, startLevel, endLevel, colours) {
  if (!(colours instanceof Array)) {
    colours = []
  }
  while (colours.length < endLevel - startLevel + 1) {
    colours.push('rgba(100, 206, 86, 1)')
  }
  
  let averageLevelsAsked = []
  for (let i = startLevel; i <= endLevel; i++) {
    averageLevelsAsked.push([])
  }
  
  for (let test of testData) {    
    let levelToAddTo = averageLevelsAsked[test.startLevel - startLevel]
    let y = getAverageLevelAsked(test.askedQs)
    let data = {
      x: test.pCorrect,
      y: y,
      testData: test,
      context: `Average level asked: ${y}`, 
    }
    
    levelToAddTo.push(data)
  }

  let chart = addChart(pageid, id++, chartSize, "scatter")
  
  for (let i = 0; i < averageLevelsAsked.length; i++) {
    addDataSet(chart, `Average level of questions asked over starting level ${(i + startLevel)}`, averageLevelsAsked[i], colours[i])
  }
}

/* Returns the total number of skills diagnosed differently between the pre set student skills and the test results
 * testDifferences: Map(tag -> boolean), A Map of tags to booleans, which are true if the skill is diagnosed the same and false otherwise
 */
function countDifferences(testDifferences) {
  let count = 0
  
  for (let isSame of [...testDifferences.values()]) {
    if (!isSame) {
      count++
    }
  }
  
  return count
}

/* Draws a scatter graph of the total number of questions diagnosed differently between the pre set student skills and the test results in testData
 * testData: Array, This array is created by testStudents() in testSimulator.js 
 * startLevel: number
 * endLevel: number
 * colours: Array(string)
 */
function scatterGraphDiagnosysDifference(testData, startLevel, endLevel, colours) {
  if (!(colours instanceof Array)) {
    colours = []
  }
  while (colours.length < endLevel - startLevel + 1) {
    colours.push('rgba(100, 206, 86, 1)')
  }
  
  let diagnosysDifferences = []
  for (let i = startLevel; i <= endLevel; i++) {
    diagnosysDifferences.push([])
  }
  
  for (let test of testData) {    
    let levelToAddTo = diagnosysDifferences[test.startLevel - startLevel]
    let y = countDifferences(test.comparedState)
    let data = {
      x: test.pCorrect,
      y: y,
      testData: test,
      context: `Number of skills different: ${y}`,
    }
    
    levelToAddTo.push(data)
  }

  let chart = addChart(pageid, id++, chartSize, "scatter")
  
  for (let i = 0; i < diagnosysDifferences.length; i++) {
    addDataSet(chart, `Total number of skill diagnosed differently over starting level ${(i + startLevel)}`, diagnosysDifferences[i], colours[i])
  }
}