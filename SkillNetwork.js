let regex = /\$?(marea|skill)\{([^}]+)\}/
let groupRowTag = "marea"
let skillRowTag = "skill"

class SkillNetwork {

  constructor(net) {
    this.name = net.name
    this.nodes = net.nodes
    this.groups = net.groups
    this.nodesMap = net.nodesMap
    this.subGroups = SkillNetwork.findSubGroups(net)
  }

  static initNetwork() {
    let lines = String(document.getElementById('input').innerHTML).split("\n")
    let net = this.createNetwork(lines)
    net.name = "Complete Network" // could also be read in from elsewhere
    return net
  }

  static createNetwork(inputArray) {
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
            node.forwardsLink = SkillNetwork.addForwardsLinks(node, rowData.slice(3), linksMap)
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
  }

  // returns a set of forward links, and adds current nodes tag as a back link in the other nodes
  static addForwardsLinks(node, linksArray, linksMap) {
    let tag = node.tag
    let forwardsLink = new Set()
    let i = 0

    while (i < linksArray.length) {
      let link = linksArray[i]
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

  static findSubGroups(network) {
      let nodes = network.nodes
      let nodesMap = network.nodesMap
      let subGroups = new Set()
      let nodesVisited = new Set()

      for (let node of nodes) {
        if (nodes.has(node) && !nodesVisited.has(node.tag)) {
          let subGroup = new Set()
          SkillNetwork.makeSubGroup(node, subGroup, nodesMap, nodesVisited)
          subGroups.add(subGroup)
        }
      }

      return subGroups
    }

    static makeSubGroup(node, subGroup, nodesMap, nodesVisited) {
      if (nodesVisited.has(node.tag)) {
        return
      }

      SkillNetwork.collect(subGroup, node.backwardsLink)
      SkillNetwork.collect(subGroup, node.forwardsLink)

      subGroup.add(node.tag)
      nodesVisited.add(node.tag)

      for (let tag of subGroup) {
        if (tag !== node.tag && nodesMap.has(tag)) {
          SkillNetwork.makeSubGroup(nodesMap.get(tag), subGroup, nodesMap, nodesVisited)
        }

        //DEBUG can be used to report missing nodes
        if (!nodesMap.has(tag)) {
          console.log("node: " + tag + " is missing ")
        }
      }
    }

    // not the same as union because it mutates the first parameter
    static collect(s1, s2) {
      for (let elem of s2) {
          s1.add(elem);
      }
    }

    // returns a new SkillNetwork containing only nodes in the groups given
    static filterNodes(groups, network) {
      let nodesMap = network.nodesMap
      let name = ""
      let newGroups = new Map()
      let newNodesMap = new Map()

      console.log(groups);

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

    // alternate method of finding cycles, also incompletes
    // static findCycles(net) {
    //   let subGroups = net.subGroups
    //   let map = net.nodesMap
    //
    //   for (let g of subGroups) {
    //     let nodeCanReach = new Map()
    //     // let visited = new Set()
    //
    //     for (let n of g) {
    //       if (map.has(n) && !nodeCanReach.has(n)) {
    //         SkillNetwork.getCycleInfo(map, nodeCanReach, n)
    //       }
    //     }
    //     console.log(nodeCanReach);
    //   }
    // }
    //
    //
    // static getCycleInfo(map, nodeCanReach, tag) {
    //   let current = map.get(tag)
    //   if (map.has(tag) && !nodeCanReach.has(tag)) {
    //     nodeCanReach.set(tag, current.forwardsLink)
    //   }
    //
    //   // else if (map.has(tag) && nodeCanReach.has(tag)) {
    //   //   console.log(nodeCanReach.get(tag));
    //   //   nodeCanReach.set(tag, SkillNetwork.collect(current.forwardsLink, nodeCanReach.get(tag)))
    //   //   console.log(nodeCanReach.get(tag));
    //   // }
    //
    //   for (let flink of current.forwardsLink) {
    //     if (map.has(flink) && nodeCanReach.has(flink)) {
    //       console.log(nodeCanReach);
    //       console.log(current);
    //       console.log(flink);
    //       console.log(nodeCanReach.get(flink));
    //       nodeCanReach.set(tag, SkillNetwork.collect(nodeCanReach.get(tag), nodeCanReach.get(flink)))
    //     } else if (map.has(flink) && !nodeCanReach.has(flink)) {
    //       SkillNetwork.getCycleInfo(map, nodeCanReach, flink)
    //       nodeCanReach.set(tag, SkillNetwork.collect(nodeCanReach.get(tag), nodeCanReach.get(flink)))
    //     }
    //   }
    //
    //   for (let blink of current.backwardsLink) {
    //     // console.log(nodeCanReach.has(blink));
    //     if (nodeCanReach.has(blink)) {
    //       console.log("cycle has " + blink)
    //     } else {
    //       if (map.has(blink)) {
    //         SkillNetwork.getCycleInfo(map, nodeCanReach, blink)
    //       }
    //     }
    //   }
    // }

    // Does not work correctly and the Tarjan algorithm does not
    static tarjan(net) {
      let graph = net.getGraph()
      let verticies = graph.verticies
      let edges = graph.edges  // gives a list of link objects with from and to fields
      let map = net.nodesMap
      // let verticies = map.keys()

      let allStrong = new Set()

      let index = {i: 0}  //object so changes to i persists after calls to strong connected
      let s = []
      let visited = new Map()   // visited maps tag to object with info like index, lowindex and onstack

      for (let v of verticies) {
        if (!visited.has(v)) {
          allStrong.add(SkillNetwork.strongConnected(map, edges, visited, v, s, index))
        }
      }

      console.log(allStrong);
      // console.log(s);

      console.log(visited);
      return allStrong
    }

    static min(n, m) {
      return (n < m) ? n : m
    }

    static strongConnected(map, edges, visited, current, s, index) {
      visited.set(current, {index: index.i, lowlink: index.i, onStack: true})
      index.i = index.i + 1
      s.push(current)

      for (let edge of edges) {
        // may need if edge if from or too current
        if (edge.from === current && map.has(edge.to)) {      // may need to add if node with tag to is in verticies
          let from = edge.from   // same as current
          let to = edge.to
          // console.log(from + " -> " + to);
          // console.log(s);

          if (!visited.has(to)) {
            SkillNetwork.strongConnected(map, edges, visited, to, s, index)
            visited.get(from).lowlink = SkillNetwork.min(visited.get(from).lowlink, visited.get(to).lowlink)
          } else if (s.includes(to)) {
            visited.get(from).lowlink = SkillNetwork.min(visited.get(from).lowlink, visited.get(to).index)
          }
        }
      }

      if (visited.get(current).lowlink === visited.get(current).index) {
        // new strongly connected component
        let stronglyConnected = new Set()
        // let i = s.length - 1
        // console.log(s);
        let w = s[s.length - 1]
        do {
          w = s.pop()
          visited.get(w).onStack = false
          stronglyConnected.add(w)
          // i--
        } while (w != current)
          // add w to strongly connected component
        return stronglyConnected
        //return the strongly connected component
      }
    }
}
