/*
TODO complete tests on groups in the complete diagnosys skills network
*/
let expectedCycleCheck = [
  {SCC: new Set([new Set(["1"])]), cycles: new Set()},
  {SCC: new Set([new Set(["1"])]), cycles: new Set([new Set(["1"])])},
  {SCC: new Set([new Set(["1"]), new Set(["2"])]), cycles: new Set()},
  {SCC: new Set([new Set(["1", "2"])]), cycles: new Set([new Set(["1", "2"])])},
  {SCC: new Set([new Set(["1", "2", "3"])]), cycles: new Set([new Set(["1", "2", "3"])])},
  {SCC: new Set([new Set(["1", "2", "3", "4"])]), cycles: new Set([new Set(["1", "2", "3", "4"])])},
  {SCC: new Set([new Set(["1", "2", "3", "4"])]), cycles: new Set([new Set(["1", "2", "3", "4"])])},
  {SCC: new Set([new Set(["1"]), new Set(["2"]), new Set(["3"]), new Set(["4"])]), cycles: new Set()},
  {SCC: new Set([new Set(["1", "2" ]), new Set(["3", "4"])]), cycles: new Set([new Set(["1", "2" ]), new Set(["3", "4"])])},
]
let expectedNetworkFail = [
  false,
  true,
  false,
  true,
  true,
  true,
  true,
  false,
  true,
]
let size = {height: 500, width: 500}
let levelWeights = []
let allCorrect = new Array(97).fill(true)

let cycleNetworkDefs = document.querySelectorAll('script[type="text/cycle"]')
let simpleDianosysTranscriptDefs = document.querySelectorAll('script[type="text/simpleDiagnosysTranscript"]')
let simpleNetworkDefs = document.querySelectorAll('script[type="text/simpleNetwork"]')
let completeNetDef = document.querySelectorAll('script[type="text/completeNetwork"]')[0]
// let diagnosysTestCaseDefs = document.querySelectorAll('script[type="text/diagnosysTestCases"]')
let dianosysTranscriptDefs = document.querySelectorAll('script[type="text/diagnosysTranscript"]')

let completeNet = initNetwork(completeNetDef.textContent)
let diagnosysTranscripts = parseDiagnosysFeedback(dianosysTranscriptDefs)
let simpleDianosysTranscripts = parseDiagnosysFeedback(simpleDianosysTranscriptDefs)
//loop to run tests
runTests()

function runTests() {
  for (let caseNo = 0; caseNo < cycleNetworkDefs.length; caseNo++) {
    QUnit.test("Test cycle checking " + caseNo, testCreateNetwork(caseNo, cycleNetworkDefs))
    QUnit.test("Test initNetwork fails " + caseNo, testInitNetwork(caseNo, cycleNetworkDefs))
    caseNo++
  }

  for (let caseNo = 0; caseNo < simpleNetworkDefs.length; caseNo++) {
    QUnit.test("Test DiagnosysController on simple networks " + caseNo, testDiagnosysControllerWithSimpleNets(caseNo, simpleDianosysTranscripts, simpleNetworkDefs))
  }
  
  for (let caseNo = 0; caseNo < dianosysTranscriptDefs.length; caseNo++) {
    QUnit.test("Test DiagnosysController on complete network " + caseNo, testDiagnosysControllerWithFullNet(caseNo, diagnosysTranscripts))
  }
}

function testCreateNetwork(caseNo,defs) {
  return function(assert) {
    let expectedSets = expectedCycleCheck[caseNo]
    let expectedArray = {SCC: setToArray(expectedSets.SCC), cycles: setToArray(expectedSets.cycles)}
    let net = createNetwork(defs[caseNo].textContent)
    let observed = {SCC: setToArray(findAllSCC(net)), cycles: setToArray(findCycles(net))} 
    
    drawGraph(net, size)
     
    // console.log("test case: " + caseNo)    
    // console.log('network',net)
    // console.log('observed',observed)
    // console.log('expected',expectedCycleCheck[caseNo])
    
    assert.deepEqual(observed, expectedArray)
  }
}

function testInitNetwork(caseNo,defs) {
  return function(assert) {
    let expected = expectedNetworkFail[caseNo]
    let observed = !expected
    try {
      let net = initNetwork(defs[caseNo].textContent)
      // // drawGraph(net, size)
      // console.log('network',net)
      observed = false
    } catch (err) {
      observed = true
    }
    
    // console.log("test[initNetwork] case: " + caseNo)
    // console.log('observed',observed)
    // console.log('expected',expectedNetworkFail[caseNo])
    
    assert.equal(observed, expected)
  }
}

// may be able to use this for the full network test as well, 
function testDiagnosysControllerWithSimpleNets(caseNo, transcripts, netDefs) {
  return function(assert) {
    let netDef = netDefs[caseNo].textContent
    let net = initNetwork(netDef)
    let transcriptData = transcripts[caseNo]
    let level = transcriptData.startLevel    // start level is determined by the start level used in Diagnosys
    let diagnosysController = new DiagnosysController(net, [net.groups.get("allSkills")], level, levelWeights)
    let testData = test(diagnosysController, allCorrect)
    let expected = {
      skillState: transcriptData.skillState,
      askedQs: transcriptData.askedQs,
      numAsked: transcriptData.numAsked, 
      numCorrect: transcriptData.numCorrect
    }
    
    drawGraph(net, size)
    
    let observed = {
      skillState: [...testData.state.entries()],
      askedQs: testData.askedQs,
      numAsked: testData.askedQs.length, 
      numCorrect: [...testData.state.values()].filter(word => word === "yes").length,
    }
    
    assert.deepEqual(observed, expected)
  }
}

function testDiagnosysControllerWithFullNet(caseNo, transcripts) {
  return function(assert) {
    let transcriptData = transcripts[caseNo]
    let level = transcriptData.startLevel    // start level is determined by the start level used in Diagnosys
    let answers = transcriptData.answers
    let groups = []
    for (let group of transcriptData.groupNames) {
      groups.push(completeNet.groups.get(group))
    }
    let diagnosysController = new DiagnosysController(completeNet, groups, level, levelWeights)
    let testData = test(diagnosysController, answers)
    
    let expected = {
      skillState: transcriptData.skillState,
      askedQs: transcriptData.askedQs,
      numAsked: transcriptData.numAsked, 
      numCorrect: transcriptData.numCorrect,
      answers: transcriptData.answers,
    }    
    
    drawGraph(filterNodes(groups, completeNet), size)
    
    let observed = {
      skillState: [...testData.state.entries()],
      askedQs: testData.askedQs,
      numAsked: testData.askedQs.length, 
      numCorrect: [...testData.state.values()].filter(word => word === "yes").length,
      answers: transcriptData.answers,
    }
    
    assert.deepEqual(observed, expected)
  }
}

// may need to also store start level and groups
function parseDiagnosysFeedback(defs) {
  let transcripts = []
  
  for (let def of defs) {
    transcripts.push(readTranscript(def.textContent.split("\n")))
  }
  
  return transcripts
  
  function readTranscript(lines) {
    let skillState = []
    let askedQs = []
    let answers = []
    let numAsked = 0
    let numCorrect = 0
    let startLevel = 0
    let groupNames = []
    for (let line of lines) {
      let array = line.split(";")
      array[0] = array[0].replace(/\s/g, "")
      
      switch (array[0]) {
        case "intro":
          if (array[1] === "asked") {
            numAsked = array[2]
          } else if (array[1] === "correct") {
            numCorrect = array[2]
          } else if (array[1] === "startlevel") {
            startLevel = Number(array[2])
          }
          break
        case "skill":
          skillState.push([array[1], array[2]])
          break
        case "manswer":
          let score = -1
          numAsked++
          if (array[3] === "correct") {
            answers.push(true)
            numCorrect++
            score = 1
          } else if (array[3].includes("incorrect")) {    // questions with dont know are marked "dkincorrect" and not "incorrect"
            answers.push(false)
            score = 0
          }
          askedQs.push(array[1].replace(/[a-zA-Z]/g, ""))
          break
        case "marea":
          groupNames.push(array[1])
        }
    }

    return {
      answers: answers,
      askedQs: askedQs,
      skillState: skillState,
      startLevel: startLevel,
      numAsked: numAsked, 
      numCorrect: numCorrect,
      groupNames: groupNames,
    }
  }
}