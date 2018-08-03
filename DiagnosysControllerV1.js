/* Defines an exam controller based on the Diagnosys system, which is modified to allow the level of the student to change during the test
 * network: SkillNetwork
 * groupsOnTest: Array(Group)
 * startLevel: number
 * numToClimb: number, The number of consecutively correct answers needed to move up a level
 * numToDrop: number, The number of consecutively incorrect answers needed to move down a level
 * levelWeights: Map(number -> number), A map of level to weight and missing levels will be automatically added with a weight of 1
 */
class DiagnosysControllerV1 extends ExamController {
  constructor(network, groupsOnTest, startLevel, numToClimb, numToDrop, levelWeights) {
    super()
    this.network = filterNodes(groupsOnTest, network)  // This network contains only the skills to be tested
    this.startLevel = startLevel
    this.nodesMap = this.network.nodesMap
    this.nodes = [...this.network.nodes].sort()
    this.numToClimb = numToClimb
    this.numToDrop = numToDrop
    
    let weights = new Map()
    if (levelWeights instanceof Map) {
      weights = levelWeights
    }
    
    let state = new Map()
    for (let node of this.nodes) {
      if (!weights.has(node.level)) {
        weights.set(node.level, 1)
      }
      if (node.level <= startLevel) {
        state.set(node.tag, "possible")
      } else if (node.level > startLevel) {  //  not just else to prevent undefined nodes from being added
        state.set(node.tag, "unasked")
      }
    }
    
    this.weights = weights
    this.consecutiveCorrect = 0
    this.consecutiveIncorrect = 0
    this.askedQs = []
    this.currentLevel = startLevel
    this.state = state
    this.scores = new Map()
  }
  
  /* Returns the tag to the next skill which will be tested
   */
  nextSkillToTest() {
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
          return node.tag
        }
      }
    }
    
    for (let node of nodes) {
      if (state.get(node.tag) === "unasked") {
        let isQFound = true
        for (let blink of [...node.backwardsLink]) {
          if (state.get(blink) === "unasked") {
            isQFound = false
            break
          }
        }
        
        if (isQFound) {
          return node.tag
        }
      }
    }
  }
  
  /* Updates the current level based on the the number of consecutive questions answered in/correctly
   */
  updateLevel() {
    let state = this.state
    let climbLevel = (this.consecutiveCorrect >= this.numToClimb)
    let dropLevel = (this.consecutiveIncorrect >= this.numToDrop)
    let isMaxLevel = this.currentLevel > 4
    let isMinLevel = this.currentLevel < 1

    if (climbLevel) {
      this.correctConsecutive = 0
      this.consecutiveIncorrect = 0
      if (!isMaxLevel) {
        this.currentLevel += 1

        // only higher levels become possible, unless already asked
        for (let skill of [...state.keys()]) {
          let level = this.nodesMap.get(skill).level
          if (level <= this.currentLevel && state.get(skill) === "unasked") {
            state.set(skill, "possible")
          }
        }
      }
    } else if (dropLevel) {
      this.correctConsecutive = 0
      this.consecutiveIncorrect = 0
      if (!isMinLevel) {
        this.currentLevel -= 1

        // higher levels become unasked unless they were previously asked
        for (let skill of [...state.keys()]) {
          let level = this.nodesMap.get(skill).level
          if (level > this.currentLevel && state.get(skill) === "possible") {
            state.set(skill, "unasked")
          }
        }
      }
    }    
  }
  
  /* Sets the score of the given skills tag
   * tag: string
   * answerIsCorrect: boolean
   */
  setScore(tag, answerIsCorrect) {
    this.askedQs.push(tag)
    let weights = this.weights
    let state = this.state
    let scores = this.scores
    let nodesMap = this.nodesMap
    let node = nodesMap.get(tag)
    let score = 0
    
    /* Recursivley marks skills which are pre requisites to the skill with the given tag, as pyes, if the skill is already marked possible
     */
    function markPYes(tag) {
      if (state.get(tag) === "possible") {
        state.set(tag, "pyes")
      } else {
        return
      }
      
      scores.set(tag, weights.get(nodesMap.get(tag).level))    // there may be no need for a storeResult method

      for (let blink of nodesMap.get(tag).backwardsLink) {
        if (state.get(blink) === "possible") {
          markPYes(blink)
        }
      }
    }
    
    /* Recursivley marks skills which are pre requisites to the skill with the given tag, as pno, if the skill is already marked unasked
     */
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
      score = weights.get(nodesMap.get(tag).level)
      state.set(tag, "yes")
      this.consecutiveCorrect++
      this.consecutiveIncorrect = 0
      
      for (let flink of node.forwardsLink) {
        if (state.get(flink) === "unasked") {
          state.set(flink, "possible")
        }
      }
      
      for (let blink of node.backwardsLink) {
        markPYes(blink)
      }
    } else {
      state.set(tag, "no")
      this.consecutiveIncorrect++
      this.consecutiveCorrect = 0
      
      for (let flink of node.forwardsLink) {    // only direct flinks are added to pNo
        if (state.get(flink) === "unasked") {
          markPNo(flink)
        }
      }
    }
    
    this.updateLevel()
    this.scores.set(tag, score)
  }
  
  /* Returns true if there are no skills with their state as possible or unasked
  */
  isEnd() {
    let isQFound = false
    for (let node of this.nodes) {
      if (this.state.get(node.tag) === "unasked" || this.state.get(node.tag) === "possible") {
        isQFound = true
      }
    }
    
    return !isQFound
  }
 
  /* Returns an object containing
   * string: string, The transcript as a readable string
   * scores: Map(string -> number), A map of tags to their scores
   * state: Map(string -> string), A map of tags to their state
   * total: number, The total score
   * askedQs: Array(string), An array of the tags of the skills tested
   * startLevel: number
   * endLevel: number, The current level of the student at the end of the exam
   */
  transcript() {
    let scores = this.scores
    let state = this.state
    let nodesMap = this.nodesMap
    let abilityEstimate = 0
    
    let scoresText = "Score|Tag|Description\n"
    for (let entry of [...scores.entries()]) {
      let tag = entry[0]
      abilityEstimate += entry[1]
      if (state.get(tag) === "no" || state.get(tag) === "yes") {
        let node = nodesMap.get(tag)
        scoresText += `${entry[1]}|${tag}|${node.description}\n`
      }

    }

    let stateText = "Tag|State\n"
    for (let entry of [...state.entries()].sort()) {
      stateText += `${entry[0]}|${entry[1]}\n`
    }
    
    let transcript =  `Number of Questions Answered: ${this.askedQs.length}\nAbility Estimate: ${abilityEstimate}\n\n${scoresText}\n${stateText}`
    return {
      string: transcript, 
      scores: scores,
      state: state, 
      total: abilityEstimate,
      askedQs: this.askedQs,
      startLevel: this.startLevel,
      endLevel: this.currentLevel
    }
  }
}