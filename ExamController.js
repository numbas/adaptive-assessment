class ExamController {
  constuctor() {
    if (new.target === ExamController) {
      throw "ExamController can not be instantiated itself"
    }  
  }
    
  
  nextQuestion() {
    throw "nextQuestion() is undefined"
    // returns next question or END
  }
  
  getScore(question, answerIsCorrect) {
    throw "score() is undefined"
    //modifies State
  }
  
  storeResult(question, score) {
    throw "storeResult() is undefined"
    //modifies State
  }
  
  transcript() {
    throw "transcript() is undefined"
    // returns a transcript of the exam results
  }
  
  isEnd() {
    throw "isEnd() is undefined"
  }
}

function test(examController) {
  console.log(examController)
  let answerIsCorrect = true
  while (!examController.isEnd()) {
    let question = examController.nextQuestion()
    let score = examController.getScore(question, answerIsCorrect)
    examController.storeResult(question, score)
  }
  return examController.transcript()
}

// can add some UI elements which call the function below to progress test
function interactiveTest(examController, answerIsCorrect) {
  if (!examController.isEnd()) {
    let question = examController.nextQuestion()
    let score = examController.getScore(question, answerIsCorrect)
    examController.storeResult(question, score)
  } else {
    return examController.transcript()
  }
}


/* 
Student {
  starting level,    // could be the same as the current level, but at the begnning
  current level, 
  estimate of ability,    // usually current level
  skills being tested, // this shouold be a property of the test
  log of skills state e.g. skill being tested, correct, incorrect, not tested yet, set of next to be chosen
  set of skills correct      // all for diagnosys
                inferred correct    // these may not be needed
                inferred incorrect  // 
                incorrect
                not tested
                next to be chosen
  skill currently being tested 
}
*/