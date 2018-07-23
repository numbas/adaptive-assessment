/*
TODO
score with weights
max time allowed would also be a parameter
*/
class DiagnosysController extends ExamController {
  constructor(network, groupsOnTest, startLevel, levelWeights) {
    super()
    this.network = filterNodes(groupsOnTest, network)  // This network contains only the skills to be tested
    this.startLevel = startLevel
    this.weights = levelWeights  // weights may not be neccassary, but if needed it could be better to use a map
    this.nodesMap = this.network.nodesMap
    
    // Diagnosys does not sort the skills, they are actually ordered in the list in the order they are defined
    // but because of the way the skills are numbered I have ordered them to correct the ordering of the questions asked
    let listOfSkills = orderNodes(groupsOnTest)   

    let state = new Map()
    for (let skill of listOfSkills) {
      let node = this.nodesMap.get(skill)
      if (node.level <= startLevel) {
        state.set(node.tag, "possibly")
      } else if (node.level > startLevel) {  //  not just else to prevent undefined nodes from being added
        state.set(node.tag, "unasked")
      }
    }
    
    this.askedQs = []
    
    this.state = state
    this.listOfSkills = listOfSkills
    this.scores = new Map()
  }
  
  // returns the tag of the furthest skill reachable in possibly from the given tag
  // possibly contains only questions at and below the starting level, so the highest leveled question in a chain would be chosen here
  getFurthestSkillPossible(nodeTag) {
    let state = this.state
    let nodesMap = this.nodesMap
    return furthestSkill(nodeTag, 0).tag

    
    function furthestSkill(tag, distance) {
      tag += ""
      let distances = [distance]
      let tags = [tag]
      let node = nodesMap.get(tag)
      for (let flink of [...node.forwardsLink]) {
        if (state.get(flink) === "possibly") {

          let tagDistance = furthestSkill(flink, distance + 1)
          tags.push(tagDistance.tag)
          distances.push(tagDistance.distance)
        }
      }
      let i = distances.indexOf(Math.max(...distances))      
      return {
        tag: tags[i], 
        distance: distances[i],
      }
    }
  }
  
    getClosestEndSkillPossible(nodeTag) {
    let state = this.state
    let nodesMap = this.nodesMap
    return closestEnd(nodeTag)
    
    function closestEnd(tag) {
      tag += ""
      let tags = [tag]
      let node = nodesMap.get(tag)
      if (node.forwardsLink.size === 0) {  // no forwards links
        return tag
      } else {
        for (let flink of [...node.forwardsLink]) {
          if (state.get(flink) === "possibly") {    // forwards links are possible
            return closestEnd(flink)
          }
        }
      }
      return tag   // all forwad links are unAksed
    }
  }
  
  // should find next skill in current group in the same level
  nextQuestion() {
    let nodesMap = this.nodesMap
    let state = this.state
    let i = 0
    let questionSelected = false
    while (!questionSelected) {
      // let currentQ = this.getFurthestSkillPossible(this.listOfSkills[i])
      let currentQ = this.listOfSkills[i]
      // if this is done like this then current Qs state remains possibly unitl scored
      let flinks = [...nodesMap.get(currentQ).forwardsLink]
      let j = 0
      while (j < flinks.length && state.get(flinks[j]) !== "possibly" ) {
        j++
      }
      if (j < flinks.length) {
        i++
      } else {
        questionSelected = true
      }
    }
    this.askedQs.push(this.getClosestEndSkillPossible(this.listOfSkills[i]))
    return this.getClosestEndSkillPossible(this.listOfSkills[i])
  }
  
  getScore(question, answerIsCorrect) {
    let state = this.state
    let listOfSkills = this.listOfSkills
    let scores = this.scores
    let nodesMap = this.nodesMap
    let node = nodesMap.get(question)
    let score = 0
    
    function markPYes(tag) {
      if (state.get(tag) === "possibly") {
        state.set(tag, "pyes")
        removeTag(tag, listOfSkills)
      } else if (state.get(tag) === "unasked") {
        removeTag(tag, listOfSkills)
        listOfSkills.push(tag)
      }
      else {
        return
      }
      
      scores.set(tag, 1)    // there may be no need for a storeResult method

      for (let blink of nodesMap.get(tag).backwardsLink) {
        if (state.get(blink) === "possibly") {
          markPYes(blink)
        }
      }
    }
    
    function markPNo(tag) {
      if (state.get(tag) === "unasked") {
        state.set(tag, "pno")
        removeTag(tag, listOfSkills)
      }
      else {
        return
      }
      
      scores.set(tag, 0)    // there may be no need for a storeResult method

      for (let flink of nodesMap.get(tag).forwardsLink) {
        if (state.get(flink) === "unasked") {
          markPNo(flink)
        }
      }
    }
    
    if (answerIsCorrect) {
      score = 1
      state.set(question, "yes")
      removeTag(question, listOfSkills)

      for (let flink of node.forwardsLink) {
        if (state.get(flink) === "unasked") {
          state.set(flink, "possibly")
        }
      }
      
      for (let blink of node.backwardsLink) {
        markPYes(blink)
      }
    } else {
      state.set(question, "no")
      removeTag(question, listOfSkills)
      
      for (let flink of node.forwardsLink) {    // only direct flinks are added to pNo
        if (state.get(flink) === "unasked") {
          markPNo(flink)
        }
      }
      
      for (let blink of node.backwardsLink) {
        if (state.get(blink) === "unasked") {
          state.set(blink, "possibly")
        }
      }
    }
    
    return score
  }
  
  storeResult(question, score) {
    // score weigthing could be done here
    this.scores.set(question, score)
  }
  
  // use of timer would need an event based exam ending condition as well as the normal conditions
  isEnd() {
    if (this.listOfSkills.length === 0) {  // or timer runs out
      return true
    } else {
      return false
    }
  }
 
  /*
  number of qs answered
  final level/ estimated ability
  questions answered
  
  this should return the same sort of information dyagnosis does
  */
  transcript() {
    let scores = this.scores
    let state = this.state
    let nodesMap = this.nodesMap
    let abilityEstimate = 0
    let transcript = "Number of Questions Answered: "
    // let askedQs = []
    
    let scoresText = "Score|Tag|Description\n"
    for (let entry of [...scores.entries()]) {
      let tag = entry[0]
      abilityEstimate += entry[1]
      if (state.get(tag) === "no" || state.get(tag) === "yes") {
        let node = nodesMap.get(tag)
        // askedQs.push(tag)
        scoresText += entry[1] + "|"+ tag + "|" + node.description +"\n"
      }

    }

    let stateText = "Tag|State\n"
    for (let entry of [...state.entries()].sort()) {
      stateText += entry[0] + "|" + entry[1] + "\n"
    }
    
    transcript +=  this.askedQs.length + "\nAbility Estimate: " + abilityEstimate + "\n\n" + scoresText + "\n" + stateText

    return {
      string: transcript, 
      scores: scores,
      state: state, 
      total: abilityEstimate,
      askedQs: this.askedQs,
      startLevel: this.startLevel
    }
  }
}

// when changing to state, pYes, pNo
function removeTag(tag, from) {
  from = from.splice(from.indexOf(tag), 1)
}

function orderNodes(groupsOnTest) {
  let tags = []
  for (let group of groupsOnTest) {
    Array.prototype.push.apply(tags, [...group.tags])
  }
  tags.sort()
  
  return tags
}