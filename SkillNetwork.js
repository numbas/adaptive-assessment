let groupRowTag = "marea"
let skillRowTag = "skill"
// let regex = /\$?(marea|skill)\{([^}]+)\}/
let regex = new RegExp("\\$?(" + groupRowTag + "|" + skillRowTag + ")\{([^}]+)\}")
let space = /\s/g

class SkillNetwork {

  constructor(net) {
    this.name = net.name
    this.nodes = net.nodes
    this.groups = net.groups
    this.nodesMap = net.nodesMap
    this.subGroups = findSubGroups(net)
  }


  // returns a set of verticies and edges which make the graph
  getGraph() {
    let nodes = this.nodes
    let edges = new Set()

    for (let node of nodes) {
      for (let flink of node.forwardsLink) {
        edges.add({
          from: node.tag,
          to: flink
         })
      }
    }

    return {
      verticies: new Set(this.nodesMap.keys()),
      edges: edges,
    }
  }
}

function initNetwork(defenitions) {
  let lines = defenitions.split("\n")
  let net = createNetwork(lines)
  net.name = "Complete Network"
  return net
}

function createNetwork(inputArray) {
  let nodes = new Set()
  let groups = new Map()
  let nodesMap = new Map()
  let linksMap = new Map()    // used to complete back links without re iterating over nodes.

  for (let i = 0; i < inputArray.length; i++) {
    let stringMatch = regex.exec(inputArray[i])
    if (stringMatch !== null && stringMatch.length > 1) {
      let rowType = stringMatch[1]
      let rowData = stringMatch[2].split(",")

      switch (rowType) {
        case skillRowTag:
        let node = new SkillNode(rowData[0], rowData[1], rowData[2])
        node.forwardsLink = addForwardsLinks(node, rowData.slice(3))
        nodes.add(node)
        break
        case groupRowTag:
        let group = new Group(rowData[0], new Set(rowData.slice(1)))
        groups.set(group.name, group)
        break
      }
    }
  }

  // fills back links and maps tags to nodes
  for (let node of nodes) {
    if (linksMap.has(node.tag)) {
      node.backwardsLink = linksMap.get(node.tag)
    }

    nodesMap.set(node.tag, node)
  }

  return new SkillNetwork ({
    nodes: nodes,
    nodesMap: nodesMap,
    groups: groups,   // used to filter network
  })

  function addForwardsLinks(node, linksArray) {
    let tag = node.tag
    let forwardsLink = new Set()
    let i = 0

    while (i < linksArray.length) {
      let link = linksArray[i].replace(space, "")   // removes spaces from tags
      forwardsLink.add(link)

      if (linksMap.has(link)) {
        linksMap.set(link, linksMap.get(link).add(tag))
      } else {
        linksMap.set(link, new Set([tag]))
      }
      i++
    }

    return forwardsLink
  }
}

// not the same as union because it mutates the first parameter
function collect(s1, s2) {
  for (let elem of s2) {
      s1.add(elem);
  }
}

function findSubGroups(network) {
  let nodes = network.nodes
  let nodesMap = network.nodesMap
  let subGroups = new Set()
  let nodesVisited = new Set()

  for (let node of nodes) {
    if (nodes.has(node) && !nodesVisited.has(node.tag)) {
      let subGroup = new Set()
      makeSubGroup(node, subGroup)
      subGroups.add(subGroup)
    }
  }

  return subGroups

  function makeSubGroup(node, subGroup) {
    if (nodesVisited.has(node.tag)) {
      return
    }

    collect(subGroup, node.backwardsLink)
    collect(subGroup, node.forwardsLink)

    subGroup.add(node.tag)
    nodesVisited.add(node.tag)

    for (let tag of subGroup) {
      if (tag !== node.tag && nodesMap.has(tag)) {
        makeSubGroup(nodesMap.get(tag), subGroup)
      }

      //DEBUG can be used to report missing nodes
      if (!nodesMap.has(tag)) {
        console.log("node: " + tag + " is missing ")
      }
    }
  }
}

  // returns a new SkillNetwork containing only nodes in the groups given
function filterNodes(groups, network) {
  let nodesMap = network.nodesMap
  let name = ""
  let newGroups = new Map()
  let newNodesMap = new Map()

  for (let group of groups) {
    name += "[" + group.name + "]+"
    newGroups.set(group.name, group)

    for (let tag of group.tags) {
      if (nodesMap.has(tag)) {
        newNodesMap.set(tag, nodesMap.get(tag))
      }
      // DEBUG can be used to repoort nodes not in network
      else {
        console.log("no node with tag: " + tag)
      }
    }
  }

  name = name.substring(0, name.length - 1)

  return new SkillNetwork({
    name: name,
    nodes: new Set(newNodesMap.values()),
    nodesMap: newNodesMap,
    groups: newGroups,
  })
}

// if a cycle contains smaller cycles, they will not be found
function findCycles(net) {
  let SCCs = findAllSCC(net)
  let cycles = new Set()
  let map = net.nodesMap

  for (let set of SCCs) {
    if (set.size > 1) {
      cycles.add(set)
    } else {
      let tag = [...set][0]
      let node = map.get(tag)
      if (node.forwardsLink.has(tag)) {
        cycles.add(set)
      }
    }
  }

  return cycles
}

// implementation of tarjans strongly connected components algorithm
function findAllSCC(net) {
  let graph = net.getGraph()
  let verticies = graph.verticies
  let edges = graph.edges
  let map = net.nodesMap

  let allStrong = new Set()

  let i = 0
  let stack = []
  let visited = new Map()   // visited maps tag to object with info like index, lowindex and onstack


  for (let v of verticies) {
    if (!visited.has(v)) {
      findSCC(v)
    }
  }

  return allStrong

  function findSCC(current) {
    visited.set(current, {index: i, lowlink: i, onStack: true})
    i++
    stack.push(current)

    for (let edge of edges) {
      if (edge.from === current && map.has(edge.to)) {
        let from = edge.from   // same as current
        let to = edge.to

        if (!visited.has(to)) {
          findSCC(to)
          visited.get(from).lowlink = Math.min(visited.get(from).lowlink, visited.get(to).lowlink)
        } else if (stack.includes(to)) {
          visited.get(from).lowlink = Math.min(visited.get(from).lowlink, visited.get(to).index)
        }
      }
    }

    if (visited.get(current).lowlink === visited.get(current).index) {
      let stronglyConnected = new Set()

      let w = stack[stack.length - 1]
      do {
        w = stack.pop()
        visited.get(w).onStack = false
        stronglyConnected.add(w)
      } while (w != current)

      allStrong.add(stronglyConnected)
    }
  }
}
