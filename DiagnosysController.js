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
    this.nodes = [...this.network.nodes].sort()  // may need sorting

    let state = new Map()
    for (let node of this.nodes) {
      if (node.level <= startLevel) {
        state.set(node.tag, "possible")
      } else if (node.level > startLevel) {  //  not just else to prevent undefined nodes from being added
        state.set(node.tag, "unasked")
      }
    }
    
    this.askedQs = []
    
    this.state = state
    this.scores = new Map()
  }
  
  // should find next skill in current group in the same level
  nextQuestion() {
    let nodes = this.nodes
    let nodesMap = this.nodesMap
    let state = this.state
    for (let node of nodes) {
      let isQFound = true
      // dont choose something with possible forwards links
      if (state.get(node.tag) === "possible") {
        for (let flink of [...node.forwardsLink]) {
          if (state.get(flink) === "possible") {
            isQFound = false
            break
          }
        }
        
        if (isQFound) {
          this.askedQs.push(node.tag)
          return node.tag
        }
      }
    }
    
    for (let node of nodes) {
      if (state.get(node.tag) === "unasked") {
        let isQFound = true
        for   (let blink of [...node.backwardsLink]) {
          if (state.get(blink) === "unasked") {
            isQFound = false
            break
          }
        }
        
        if (isQFound) {
          this.askedQs.push(node.tag)
          return node.tag
        }
      }
    }
  }
  
  getScore(question, answerIsCorrect) {
    let state = this.state
    let scores = this.scores
    let nodesMap = this.nodesMap
    let node = nodesMap.get(question)
    let score = 0
    
    function markPYes(tag) {
      if (state.get(tag) === "possible") {
        state.set(tag, "pyes")
      } else {
        return
      }
      
      scores.set(tag, 1)    // there may be no need for a storeResult method

      for (let blink of nodesMap.get(tag).backwardsLink) {
        if (state.get(blink) === "possible") {
          markPYes(blink)
        }
      }
    }
    
    function markPNo(tag) {
      if (state.get(tag) === "unasked") {
        state.set(tag, "pno")
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

      for (let flink of node.forwardsLink) {
        if (state.get(flink) === "unasked") {
          state.set(flink, "possible")
        }
      }
      
      for (let blink of node.backwardsLink) {
        markPYes(blink)
      }
    } else {
      state.set(question, "no")
      
      for (let flink of node.forwardsLink) {    // only direct flinks are added to pNo
        if (state.get(flink) === "unasked") {
          markPNo(flink)
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
    let isQFound = false
    for (let node of this.nodes) {
      if (this.state.get(node.tag) === "unasked" || this.state.get(node.tag) === "possible") {
        isQFound = true
      }
    }
    
    if (isQFound) {
      return false
    } else {
      return true
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
    
    let scoresText = "Score|Tag|Description\n"
    for (let entry of [...scores.entries()]) {
      let tag = entry[0]
      abilityEstimate += entry[1]
      if (state.get(tag) === "no" || state.get(tag) === "yes") {
        let node = nodesMap.get(tag)
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