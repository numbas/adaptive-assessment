let networkDefs = document.querySelectorAll('script[type="text/network"]')
let size = {height: 1000, width: 1500}
let net = initNetwork(networkDefs[0].textContent)
let groups = net.groups
console.log("Complete Network", net)
console.log("Strongly Connected Components", findAllSCC(net))
console.log("Cycles", findCycles(net));

// testNetworkFunctions()
testControllers()


let groupsOnTest = [groups.get("allSkills")]

let level = 4
let tags = []
for (let group of groupsOnTest) {
  Array.prototype.push.apply(tags, [...group.tags])
}
tags.sort()
let g = new Group("g", new Set(tags))
let filtered = filterNodes(groupsOnTest, net)
drawGraph(filtered, size)

let diagController = 0
let i = 0

function initTest() {
  i = 0
  // diagController = new DiagnosysController(filtered, groupsOnTest, level)
  diagController = new DiagnosysControllerV1(filtered, groupsOnTest, level, 4, 4, false, false)
  console.clear()
  console.log("currentQ: ", diagController.nextSkillToTest())
}

function giveAnswer(isCorrect) {
  interactiveTest(diagController, isCorrect)
  if (!diagController.isEnd()) {
    console.log(i++, diagController.state, diagController)
    console.log("currentQ: ", diagController.nextSkillToTest())
  } else {
    console.log(diagController.askedQs, interactiveTest(diagController, false))
  }  
}

function testNetworkFunctions() {
  drawGraph(net, size)

  let groupsOnTest = [groups.get("numbers"), groups.get("powers"), groups.get("basic algebra")]
  let filtered = filterNodes(groupsOnTest, net)
  drawGraph(filtered, size)

  let diagController = 0

  let testGroup1 = new Group("testGroup1", new Set(["tut1", 112, 101, 103, 301, 150]))

  filtered = filterNodes([testGroup1, groups.get("numbers"), groups.get("powers"), groups.get("basic algebra")], net)
  console.log("Filtered network", filtered)
  console.log("SCC", findAllSCC(filtered))
  console.log("Cycles", findCycles(filtered))
  drawGraph(filtered, size)

  let levels = [1]
  let level1Group = groupByLevel(levels, net)
  console.log("Levels Group", level1Group)
  let groupedLevels = filterNodes([level1Group], net) 
  console.log("Grouped by Levels", groupedLevels)
  console.log("SCC", findAllSCC(groupedLevels))
  console.log("Cycles", findCycles(groupedLevels))
  drawGraph(groupedLevels, size)

  let collectedGroups = collectGroups([groups.get("numbers"), groups.get("powers"), groups.get("basic algebra")])
  console.log("Collected Groups", collectedGroups)
}

function testControllers() {
  let allCorrect = new Array(97).fill(true)
  let allIncorrect = new Array(97).fill(false)

  let simpleData = prepareSimpleData(net)
  let simpleController = new SimpleController(simpleData)
  let simpleTranscript = test(simpleController, allCorrect)
  console.log("Simple Transcript\n", simpleTranscript.string)

  let mOpt = {
      branches: prepareMapleData(net), // questions grouped by level number
      branchWeights: [1, 2, 3, 4], // weights given to each branch
      startBranch: 0,              // starting level is index of array to start at
      numToClimb: 4,      // number of correct answers to climb to higher level
      numToDrop: 4,        // number of incorrect answers to drop to lower level
      numOfQs: 10,            // number of questions to be asked in the test
      numOfCorrectToEnd: 6,  // number of correct answers to end test
      numOfInorrectToEnd: 6,  // number of incorrect answers to end test
      climbOnTotal: false,    // boolean to choose whether climb happens with total or consecutive correct
      dropOnTotal: false,      // boolean to choose whether drop happens with total or consecutive incorrect
  }
  let mapleController = new MapleController(mOpt.branches, mOpt.branchWeights, mOpt.startBranch, mOpt.numToClimb, mOpt.numToDrop, mOpt.numOfQs, mOpt.numOfCorrectToEnd, mOpt.numOfInorrectToEnd, mOpt.climbOnTotal, mOpt.dropOnTotal)
  let mapleTranscript = test(mapleController, allCorrect)
  console.log("Maple Transcript\n", mapleTranscript.string)

  let dOpt = {
    groupsOnTest: [groups.get("numbers")],
    startLevel: 2,
    levelWeights: new Map([["1", 5], ["2", 1], ["3", 1], ["4", 1]]),
  }
  let diagnosysController = new DiagnosysController(net, dOpt.groupsOnTest, dOpt.startLevel, dOpt.levelWeights)
  let diagnosysTranscript = test(diagnosysController, allCorrect).string
  drawGraph(filterNodes(dOpt.groupsOnTest, net), size)

  let level1C = new DiagnosysController(net, dOpt.groupsOnTest, 1, dOpt.levelWeights)
  let level1I = new DiagnosysController(net, dOpt.groupsOnTest, 1, dOpt.levelWeights)
  let level2C = new DiagnosysController(net, dOpt.groupsOnTest, 2, dOpt.levelWeights)
  let level2I = new DiagnosysController(net, dOpt.groupsOnTest, 2, dOpt.levelWeights)
  let level3C = new DiagnosysController(net, dOpt.groupsOnTest, 3, dOpt.levelWeights)
  let level3I = new DiagnosysController(net, dOpt.groupsOnTest, 3, dOpt.levelWeights)

  let numPowAlgGroups = [groups.get("numbers"), groups.get("powers"), groups.get("basic algebra")]
  let possibleErrorGroups= [new Group("possibleErrorGroup", new Set([203,204,206,304,303]))]
  
  drawGraph(filterNodes(possibleErrorGroups, net), size)
  let numPowAlgC = new DiagnosysController(net, numPowAlgGroups,2, dOpt.levelWeights)
  let numPowAlgI = new DiagnosysController(net, numPowAlgGroups,2, dOpt.levelWeights)

  console.log("level1C\n", test(level1C, allCorrect).string)
  console.log("level2C\n", test(level2C, allCorrect).string)
  console.log("level3C\n", test(level3C, allCorrect).string)
  console.log("level1I\n", test(level1I, allIncorrect).string)
  console.log("level2I\n", test(level2I, allIncorrect).string)
  console.log("level3I\n", test(level3I, allIncorrect).string)
  console.log("numPowAlgC\n", test(numPowAlgC, allCorrect).string)
  console.log("numPowAlgI\n", test(numPowAlgI, allIncorrect).string)


  let errorCaseC = new DiagnosysController(net, possibleErrorGroups,2, dOpt.levelWeights)
  console.log("possibleError\n", test(errorCaseC, allCorrect).string)
}