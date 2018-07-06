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

let networkDefs = document.querySelectorAll('script[type="text/network"]');
let size = {height: 500, width: 500}
let caseNo = 0

function testCreateNetwork(caseNo,def) {
  return function(assert) {
    let expectedSets = expectedCycleCheck[caseNo]
    let expectedArray = {SCC: setToArray(expectedSets.SCC), cycles: setToArray(expectedSets.cycles)}
    let net = createNetwork(def.textContent)
    let observed = {SCC: setToArray(findAllSCC(net)), cycles: setToArray(findCycles(net))} 
    
    drawGraph(net, size)
     
    console.log("test case: " + caseNo)    
    console.log('network',net)
    console.log('observed',observed)
    console.log('expected',expectedCycleCheck[caseNo])
    
    assert.deepEqual(observed, expectedArray)
  }
}

function testInitNetwork(caseNo,def) {
  return function(assert) {
    let expected = expectedNetworkFail[caseNo]
    let observed = !expected
    try {
      let net = initNetwork(def.textContent)
      // drawGraph(net, size)
      console.log('network',net)
      observed = false
    } catch (err) {
      observed = true
    }
    
    console.log("test[initNetwork] case: " + caseNo)
    console.log('observed',observed)
    console.log('expected',expectedNetworkFail[caseNo])
    
    assert.equal(observed, expected)
  }
}

for(let def of networkDefs) {
  QUnit.test("Test cycle checking " + caseNo, testCreateNetwork(caseNo,def))
  QUnit.test("Test initNetwork fails " + caseNo, testInitNetwork(caseNo,def))
  caseNo++
}