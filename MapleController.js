/* Defines an exam controller which behaves similarly to the MapleTA system, when a test is run
 * branches: Array(Array(SkillNode)), Each branch is an array of SkillNodes grouped by level
 * branchWeights: Array(number), An array of weights for the corresponding branch index
 * startBranch: number, The index of branch to start with
 * numToClimb: number, The number of correct answers to climb a branch
 * numToDrop: number, The number of incorrect answers to drop from a branch
 * numOfQs: number, The maximum number of questions to be asked for the test to end
 * numOfCorrectToEnd: number, The number of correct answers needed to end the test immediatley
 * numOfInorrectToEnd: number, The number of incorrect answers needed to end the test immediatley
 * climbOnTotal: boolean, Set to false if branches should be climbed when numToClimb number of consecutive questions has been answered correctly, true for total correct answers for the current level
 * dropOnTotal: boolean, Set to false if branches should be dropped from when numToDrop number of consecutive questions has been answered incorrectly, true for total incorrect answers for the current level
 */
class MapleController extends ExamController {
  constructor(branches, branchWeights, startBranch, numToClimb, numToDrop, numOfQs, numOfCorrectToEnd, numOfInorrectToEnd, climbOnTotal, dropOnTotal) {
    super()
    this.branches = branches          // questions grouped by level number
    this.branchWeights = branchWeights// weights given to each branch
    this.startBranch = startBranch    // starting level
    this.numToClimb = numToClimb      // number of correct answers to climb to higher level
    this.numToDrop = numToDrop        // number of incorrect answers to drop to lower level
    this.numOfQs = numOfQs            // number of questions to be asked in the test
    this.numOfCorrectToEnd = numOfCorrectToEnd  // number of correct answers to end test
    this.numOfInorrectToEnd = numOfInorrectToEnd  // number of incorrect answers to end test
    this.climbOnTotal = climbOnTotal    // boolean to choose whether climb happens with total or consecutive correct
    this.dropOnTotal = dropOnTotal      // boolean to choose whether drop happens with total or consecutive incorrect
    this.totalNumOfQs = 0
    let temp = []
    for (let branch of branches) {
      this.totalNumOfQs += branch.length
      temp.push(branch)
    }

    let correctPerLevel = []
    let incorrectPerLevel = []
    let currentQPerBranch = []
    
    for (let i = 0; i < branches.length; i++) {
      currentQPerBranch.push(0)
      correctPerLevel.push(0)
      incorrectPerLevel.push(0)
    }
    
    this.state = {
      branches: temp,
      branchWeights: branchWeights,
      questionNum: 0,
      currentBranch: startBranch,  // this will be the index in the array
      currentQPerBranch: currentQPerBranch,
      correctTotal: 0,
      correctPerLevel: correctPerLevel,
      correctConsecutive: 0,
      incorrectTotal: 0,
      incorrectPerLevel: incorrectPerLevel,
      incorrectConsecutive: 0,
      scores: new Map(),
    }
  }
  
  /* Returns the SkillNode object of the next skill which will be tested
   */
  nextSkillToTest() {
    if (this.isEnd()) {
      return null
    } else {
      let state = this.state
      let question = state.branches[state.currentBranch][state.currentQPerBranch[state.currentBranch]]
      state.currentQPerBranch[state.currentBranch] += 1
      state.questionNum += 1
      return question
    }
  }
    
  /* Updates the state of the current branch being used after a question has been asked
   */
  updateBranch() {
    let state = this.state
    let climbBranch = false
    let dropBranch = false
    
    if (this.climbOnTotal) {
      // this may be incorrect behaviour
      climbBranch = (state.branches.length > state.currentBranch) && (state.correctPerLevel[state.currentBranch] >= this.numToClimb)
    } else {
      climbBranch = (state.branches.length > state.currentBranch) && (state.correctConsecutive >= this.numToClimb)
    }
    
    if (this.dropOnTotal) {
      // this may be incorrect behaviour
      dropBranch = (0 < state.currentBranch) && (state.incorrectPerLevel[state.currentBranch] >= this.numToDrop)
    } else {
      dropBranch = (0 < state.currentBranch) && (state.incorrectConsecutive >= this.numToDrop)
    }

    if (climbBranch) {
      state.correctConsecutive = 0
      state.incorrectConsecutive = 0
      state.currentBranch += 1
    } else if (dropBranch) {
      state.correctConsecutive = 0
      state.incorrectConsecutive = 0
      state.currentBranch -= 1
    }    
  }
  
  /* Sets the score of the given SkillNode
   * question: SkillNode, The SkillNode obbject of the skill which is being answered
   * answerIsCorrect: boolean
   */
  setScore(question, answerIsCorrect) {
    let state = this.state
    let score =  0
    
    if (answerIsCorrect) {
      state.correctTotal += 1
      state.correctConsecutive += 1
      state.correctPerLevel[state.currentBranch] += 1
      state.incorrectConsecutive = 0
      score = state.branchWeights[state.currentBranch]
      
      if (state.currentQPerBranch[state.currentBranch] >= state.branches[state.currentBranch].length) {  // checks if there are any questions left to ask in a branch        
        state.branches.splice(state.currentBranch, 1)
        state.branchWeights.splice(state.currentBranch, 1)
        state.correctConsecutive = 0  // may be incorrect behaviour
        if (state.currentBranch >= state.branches.length) {  // checks if the branch is the last branch
          console.log(state.branches)
          state.currentBranch -= 1

        }
      }
    } else {
      state.incorrectTotal += 1
      state.incorrectConsecutive += 1
      state.incorrectPerLevel[state.currentBranch] += 1
      state.correctConsecutive = 0
      
      if (state.currentQPerBranch[state.currentBranch] >= state.branches[state.currentBranch].length) {  // checks if there are any questions left to ask in a branch
        state.branches.splice(state.currentBranch, 1)
        state.branchWeights.splice(state.currentBranch, 1)
        state.incorrectConsecutive = 0  // may be incorrect behaviour

        if (state.currentBranch !== 0) {  // checks if the branch is the first branch
          state.currentBranch -= 1
        }
      }
    }
        
    this.updateBranch()
    state.scores.set(question, score)    
  }
  
  /* Returns an object of the form {string:, data:, total:},
   * string: string, The transcript info as a readable string
   * data: Map(SkillNode -> number), The final scores map of the examcontrollers state
   * total: number, The sum of scores for all SkillNodes in the scores Map
   */
  transcript() {
    let transcript = "Score|Tag|Description\n"
    let total = 0
    for (let entry of [...this.state.scores.entries()]) {
      total += entry[1]
      transcript += `${entry[1]}|${entry[0].tag}|${entry[0].description}\n`
    }
    transcript += total
    return {string: transcript, data: this.scores, total: total}
  }
  
  /* Returns true if there are no questions left to ask, or the total number of questions specified has been asked, or if the number of in/correct answers to end the test has been met
   */
  isEnd() {
    let state = this.state
    if ((state.branches.length === 0) || (state.questionNum >= this.totalNumOfQs) || (state.questionNum > this.numOfQs) || (state.correctTotal >= this.numOfCorrectToEnd) || (state.incorrectTotal >=this.numOfIncorrectToEnd)) {
      return true
    } else {
      return false
    }
  }
}

/* Prepares data from the given network for use by the maple controller by grouping nodes by level
 * network: SkillNetwork
 */
function prepareMapleData(network) { 
  let nodes = network.nodes
  let groupedNodes = new Map()
  
  for (let node of nodes) {
    if (groupedNodes.has(node.level)) {
      groupedNodes.get(node.level).push(node)
    } else {
      groupedNodes.set(node.level, [node])
    }
  }
  
  // Sort the nodes in each level by the tag
  let array = [...groupedNodes.entries()].sort((x, y) => {
    let a = x[0]
    let b = y[0]
    
    if (a < b) {
      return -1
    } else if (a > b) {
      return 1
    } else {
      return 0
    }
  }) 
  
  let branches = []
  for (let group of array) {
    branches.push(group[1])
  }
  
  return branches  
}

