let groupRowTag = "marea"
let skillRowTag = "skill"
// let regex = new RegExp("\\$?(" + groupRowTag + "|" + skillRowTag + ")\{([^}]+)\}")
let regex = new RegExp(`\\$?(${groupRowTag}|${skillRowTag})\{([^}]+)\}`)

let space = /\s/g  // Used to remove spaces from tags in nodes and in groups

/* The defnition of a network given an object in the form {name:, nodes:, groups:, nodesMap:}
 * name: string, The name of the network
 * nodes: Set(SkillNode), A set of SkillNode objects
 * groups: Map(string -> Group), A map of group names to groups, to easily access groups for filtering the network
 * nodesMap: Map(string -> SkillNode), A map of node tags to SkillNode objects
 */
class SkillNetwork {
  constructor(net) {
    this.name = net.name
    this.nodes = net.nodes
    this.groups = net.groups
    this.nodesMap = net.nodesMap
    this.subGroups = findSubGroups(net)
  }
  
  /* Returns an object of the form {verticies:, edges:}
   * verticies: Set(string), The set of tags of all nodes in the network
   * edges: Set({from:, to:}), A set of objects of the form {to:, from:} describing all forwards links in the network
   */
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

/* Initialises and returns a network given a string defining the networks nodes and groups
 * An error is thrown if the network defenition contains any cycles
 * definitions: string, A string of all skills defined in Diagnosys' KBASE file
 */
function initNetwork(definitions) {
  let net = createNetwork(definitions)
  net.name = "Complete Network"
  let cycles = findCycles(net)
  if (cycles.size !== 0) {
    console.log(cycles)
    throw "cycles"
  }
  return net
}

/* Parses the network definition from Diagnosys and returns a SkillNetwork object it defines
 * definitions: string, A string of all skills defined in Diagnosys' KBASE file
 */
function createNetwork(definitions) {
  let input = definitions.split("\n")
  let nodes = new Set()
  let groups = new Map()
  let nodesMap = new Map()
  let linksMap = new Map()    // used to complete back links without re iterating over nodes.
  
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
  
  for (let i = 0; i < input.length; i++) {
    let stringMatch = regex.exec(input[i])
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

  // fills back links and maps tags to nodes and creates all skills group
  let allSkills = new Set()
  for (let node of nodes) {
    allSkills.add(node.tag)
    
    if (linksMap.has(node.tag)) {
      node.backwardsLink = linksMap.get(node.tag)
    }

    nodesMap.set(node.tag, node)
  }
  
  groups.set("allSkills", new Group("allSkills", allSkills))
  
  return new SkillNetwork ({
    nodes: nodes,
    nodesMap: nodesMap,
    groups: groups,   // used to filter network
  })
}

/* Collects elements in s2 and s1 into the set s1
 * This is not the same as a union operation because it mutates s1
 * s1: Set
 * s2: Set
 */
function collect(s1, s2) {
  for (let elem of s2) {
      s1.add(elem);
  }
}

/* Returns a set of subgroups a given network contains, where a subgroup is defined by a set of connected nodes
 * network: SKillNetwork
 */
function findSubGroups(network) {
  let nodes = network.nodes
  let nodesMap = network.nodesMap
  let subGroups = new Set()
  let nodesVisited = new Set()
  let missingNodes = new Set()

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
        missingNodes.add(tag)
      }
    }
  }
  
  for (let node of nodes) {
    if (nodes.has(node) && !nodesVisited.has(node.tag)) {
      let subGroup = new Set()
      makeSubGroup(node, subGroup)
      subGroups.add(subGroup)
    }
  }
  
  if (missingNodes.size > 0) {
    console.log("Missing nodes: ", JSON.stringify([...missingNodes]))
  }
  
  return subGroups
}

/* Returns a new group which contains all tags defined in all groups in the given array of groups
 * groups: Array(Group)
 */
function collectGroups(groups) {
  let name = ""
  let tags = new Set()
  for (let group of groups) {
    name += `[${group.name}]+`
    collect(tags, group.tags)
  }

  name = name.substring(0, name.length - 1)
  
  return new Group(name, tags)
}

/* Returns a new group containing tags of nodes which are at the levels in the levels array given, in the network given
 * levels: Array(number)
 * network: SkillNetwork
 */
function groupByLevel(levels, network) {
  let tags = new Set()
  let nodes = network.nodes
  
  for (let node of nodes) {
    if (levels.includes(Number(node.level))) {
      tags.add(node.tag)
    }
  }
  
  return new Group(`levels ${levels}`, tags)
}

/* Returns a new SkillNetwork containing only nodes from the groups in the given groups array
 * groups: Array(Group)
 * network: SkillNetwork
 */
function filterNodes(groups, network) {
  let nodesMap = network.nodesMap
  let name = ""
  let newGroups = new Map()
  let newNodesMap = new Map()
  let missingNodes = new Map()
  
  for (let group of groups) {
    name += `[${group.name}]+`
    newGroups.set(group.name, group)

    for (let tag of group.tags) {
      if (nodesMap.has(tag)) {
        newNodesMap.set(tag, nodesMap.get(tag))
      }
      // DEBUG can be used to repoort nodes not in network
      else {
        if (missingNodes.has(group.name)) {
          missingNodes.get(group.name).push(tag)
        } else {
          missingNodes.set(group.name, [tag])
        }
      }
    }
  }
  
  if (missingNodes.size > 0) {
    console.log("Group contains non-existent nodes", JSON.stringify([...missingNodes]))
  }
  
  name = name.substring(0, name.length - 1)

  return new SkillNetwork({
    name: name,
    nodes: new Set(newNodesMap.values()),
    nodesMap: newNodesMap,
    groups: newGroups,
  })
}

/* Returns a set of cycles contained in the given network
 * net: SkillNetwork
 */
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

/* Returns a set containing all sets of strongly connected components in the network given
 * This is an implementation of tarjans strongly connected components algorithm
 * net: SkillNetwork
 */
function findAllSCC(net) {
  let graph = net.getGraph()
  let verticies = graph.verticies
  let edges = graph.edges
  let map = net.nodesMap
  let allStrong = new Set()
  let i = 0
  let stack = []
  let visited = new Map()   // visited maps tag to object with info like index, lowindex and onstack

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

  for (let v of verticies) {
    if (!visited.has(v)) {
      findSCC(v)
    }
  }

  return allStrong
}

/* Returns a sorted array of a all items in the given set
 * set: Set
 */
function setToArray(set) {
  let array = []
  
  for (let item of set) {
    if (item instanceof Set) {
      array.push(setToArray(item))
    } else {
      array.push(item)
    }
  }
  
  return array.sort()
}