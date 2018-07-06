let networkDefs = document.querySelectorAll('script[type="text/network"]')
let size = {height: 1000, width: 1500}
let net = initNetwork(networkDefs[0].textContent)

console.log("Complete Network", net)
console.log("Strongly Connected Components", findAllSCC(net))
console.log("Cycles", findCycles(net));
drawGraph(net, size)

let testGroup1 = new Group("testGroup1", new Set(["tut1", 112, 101, 103, 301, 150]))
let groups = net.groups

let filtered = filterNodes([testGroup1, groups.get("numbers"), groups.get("powers"), groups.get("basic algebra")], net)
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

let simpleData = prepareSimpleData(net)
let simpleController = new SimpleController(simpleData)
let simpleTranscript = test(simpleController)
console.log("Simple Transcript\n", simpleTranscript.string)

let mOpt = {
    branches: prepareMapleData(net), // questions grouped by level number
    branchWeights: [1, 2, 3, 4], // weights given to each branch
    startBranch: 0,              // starting level is index of array to start at
    numToClimb: 2,      // number of correct answers to climb to higher level
    numToDrop: 2,        // number of incorrect answers to drop to lower level
    numOfQs: 10,            // number of questions to be asked in the test
    numOfCorrectToEnd: 4,  // number of correct answers to end test
    numOfInorrectToEnd: 4,  // number of incorrect answers to end test
    climbOnTotal: false,    // boolean to choose whether climb happens with total or consecutive correct
    dropOnTotal: false,      // boolean to choose whether drop happens with total or consecutive incorrect
}
// let mapleData = prepareMapleData(net)
// may be better to have default setting and apply only different settings
let mapleController = new MapleController(mOpt.branches, mOpt.branchWeights, mOpt.startBranch, mOpt.numToClimb, mOpt.numToDrop, mOpt.numOfQs, mOpt.numOfCorrectToEnd, mOpt.numOfInorrectToEnd, mOpt.climbOnTotal, mOpt.dropOnTotal)
let mapleTranscript = test(mapleController)
console.log("Maple Transcript\n", mapleTranscript.string)
