let networkDefs = document.querySelectorAll('script[type="text/network"]');
let size = {height: 500, width: 500}
let caseNo = 0

for(let def of networkDefs) {
  console.log("test case: " + caseNo)
  let net = initNetwork(def.textContent)
  drawGraph(net, size)
  console.log(net)
  console.log(findAllSCC(net))
  console.log(findCycles(net));
  networkNo++
}
