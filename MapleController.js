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
    for (let branch of branches) {
      this.totalNumOfQs += branch.length
    }
    
    let correctPerLevel = []
    let incorrectPerLevel = []
    let currentQPerBranch = []
    let skipBranches = []
    
    for (let i = 0; i < branches.length; i++) {
      currentQPerBranch.push(0)
      correctPerLevel.push(0)
      incorrectPerLevel.push(0)
      skipBranches.push(false)
    }
    
    for (let b of this.branches) {
      console.log(b)
    }
    
    this.state = {
      branches: branches,
      branchWeights: branchWeights,
      questionNum: 0,
      currentBranch: startBranch,  // this will be the index in the array
      currentQPerBranch: currentQPerBranch,
      skipBranches: skipBranches,    // true if all questions have already been answered in branch
      correctTotal: 0,
      correctPerLevel: correctPerLevel,
      correctConsecutive: 0,
      incorrectTotal: 0,
      incorrectPerLevel: incorrectPerLevel,
      incorrectConsecutive: 0,
      scores: new Map(),
    }
  }
  
  nextQuestion() { 
    if (this.isEnd()) {
      return null
    } else {
      let state = this.state
      // need condition to check if there are enough questions in a level before climbing or dropping
      // (state.currentQPerBranch[state.currentBranch] < this.branches[state.curentBranch].length)
      let question = state.branches[state.currentBranch][state.currentQPerBranch[state.currentBranch]]
      state.currentQPerBranch[state.currentBranch] += 1
      // console.log(question)
      // if (state.currentQPerBranch[state.currentBranch] >= this.branches[state.curentBranch].length) {
      //   state.skipBranches[state.currentBranch] = true
      // }
      state.questionNum += 1
      return question
    }
  }
    
  
  // will not work with non consecutive branch levels
  updateBranch() {
    let state = this.state
    let climbBranch = false
    let dropBranch = false
    
    if (this.climbOnTotal) {
      // this may be incorrect behaviour
      climbBranch = (this.branches.length > state.currentBranch) && (state.correctPerLevel[state.currentBranch] >= this.numToClimb)
    } else {
      climbBranch = (this.branches.length > state.currentBranch) && (state.correctConsecutive >= this.numToClimb)
    }
    
    if (this.dropOnTotal) {
      // this may be incorrect behaviour
      dropBranch = (0 < state.currentBranch) && (state.incorrectPerLevel[state.currentBranch] >= this.numToDrop)
    } else {
      state.
      dropBranch = (0 < state.currentBranch) && (state.incorrectConsecutive >= this.numToDrop)
    }
    
    // if (this.hasLevelToReach(climbBranch, false)) {
    //   state.currentBranch += 1
    // } else if (this.hasLevelToReach(false, dropBranch)) {  // maybe wrong // also either climb or drop branch, cant do both
    //   state.currentBranch -= 1
    // }
    if (climbBranch) {
      state.correctConsecutive = 0
      state.currentBranch += 1
    } else if (dropBranch) {
      state.incorrectConsecutive = 0
      state.currentBranch -= 1
    }
    
    // console.log(state)
  }
  
  // used to solve the problem of running out of questions to ask in branch or which branch to jump to next
  // could be easier to remove branch from potential questions to ask and update currentBranch accordinglys
  // hasLevelToReach(planToClimb, planToDrop) {
  //   let state = this.state
  //   // from current branch search whether you can move up or down
  //   if (planToClimb) {
  //     let i = state.currentBranch
  //     while (i < state.skipBranches.length && state.skipBranches[i]) {
  //       i++
  //     }
  //     if (i === state.skipBranches.length) {
  //       // climb down because there are no questions above or stay on current level if not all Qs have been answered
  //       return false
  //     } else {
  //       return true
  //     }
  //   } else if (planToDrop) {
  //     let i = state.currentBranch
  //     while (i > state.skipBranches.length && state.skipBranches[i]) {
  //       i--
  //     }
  //     if (i === 0) {
  //       // climb up because there are no questions below or stay on current level if not all Qs have been answered
  //       return false
  //     } else {
  //       return true
  //     }
  //   }
  // }
  
  getScore(question, answerIsCorrect) {
    let state = this.state
    let score =  0
    
    if (answerIsCorrect) {
      state.correctTotal += 1
      state.correctConsecutive += 1
      state.correctPerLevel[state.currentBranch] += 1
      state.incorrectConsecutive = 0
      score = state.branchWeights[state.currentBranch]
      
      // if (state.currentQPerBranch[state.currentBranch] >= this.branches[state.curentBranch].length) {
      if (state.currentQPerBranch[state.currentBranch] >= state.branches[state.currentBranch].length) {  // checks if there are any questions left to ask in a branch
        state.branches.splice(state.currentBranch)
        state.branchWeights.splice(state.currentBranch)
        if (state.currentBranch >= state.branches.length) {  // checks if the branch is the last branch
          state.currentBranch -= 1
        }
      }
    } else {
      state.incorrectTotal += 1
      state.incorrectConsecutive += 1
      state.incorrectPerLevel[state.currentBranch] += 1
      state.correctConsecutive = 0
      
      if (state.currentQPerBranch[state.currentBranch] >= state.branches[state.currentBranch].length) {  // checks if there are any questions left to ask in a branch
        state.branches.splice(state.currentBranch)
        state.branchWeights.splice(state.currentBranch)
        if (state.currentBranch !== 0) {  // checks if the branch is the last branch
          state.currentBranch -= 1
        }
      }
    }
        
    this.updateBranch()
    
    return score
  }
   
  storeResult(question, score) {
    let scores = this.state.scores
    scores.set(question, score)    // may be better to define score in storeResult
  }
  
  transcript() {
    let transcript = "Score|Tag|Description\n"
    let total = 0
    for (let entry of [...this.state.scores.entries()]) {
      total += entry[1]
      transcript += entry[1] + "|"+ entry[0].tag + "|" + entry[0].description + "\n"
    }
    transcript += total
    return {string: transcript, data: this.scores, total: total}
  }
  
  isEnd() {
    let state = this.state
    
    // console.log(state.questionNum)
    // currently incorrect because the student will still be asked the last question but its answer will not be recorded
    if ((state.branches.length === 0) || (state.questionNum >= this.totalNumOfQs) || (state.questionNum > this.numOfQs) || (state.correctTotal >= this.numOfCorrectToEnd) || (state.incorrectTotal >=this.numOfIncorrectToEnd)) {
      return true
    } else {
      return false
    }
  }
}

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

