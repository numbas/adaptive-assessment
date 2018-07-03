let networkDefs = document.querySelectorAll('script[type="text/network"]')
let size = {height: 1000, width: 1500}
let net = initNetwork(networkDefs[0].textContent)

console.log(net)
console.log(findAllSCC(net))
console.log(findCycles(net));
drawGraph(net, size)

let testGroup1 = new Group("testGroup1", new Set(["tut1", 112, 101, 103, 301, 150]))
let groups = net.groups

net = filterNodes([testGroup1, groups.get("numbers"), groups.get("powers"), groups.get("basic algebra")], net)
console.log(net)
console.log(findAllSCC(net))
console.log(findCycles(net));
drawGraph(net, size)
