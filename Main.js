
function main() {
  let net = SkillNetwork.initNetwork()
  console.log(net)
  let testGroup1 = new Group("testGroup1", new Set(["tut1", 112, 101, 103, 301, 150]))
  let groups = net.groups
  // net = SkillNetwork.filterNodes([testGroup1, groups.get("numbers"), groups.get("powers"), groups.get("basic algebra")], net)
  console.log(net)
  drawGraph(net)
  console.log(SkillNetwork.tarjan(net))
}
