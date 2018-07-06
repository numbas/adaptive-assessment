class SimpleController extends ExamController {
  constructor(questions) {
    super()
    this.questions = questions
    this.questionNum = 0
    this.scores = new Map()
  }
  
  nextQuestion() {
    if (this.isEnd()) {
      return null
    } else {
      return this.questions[this.questionNum++]
    }
  }
  
  getScore(question, answerIsCorrect) {
    return 1
  }
  
  storeResult(question, score) {
    if (!this.isEnd()) {
      this.scores.set(question, score)
    }
  }
  
  transcript() {
    let transcript = "Score|Tag|Description\n"
    let total = 0
    for (let entry of [...this.scores.entries()]) {
      total += entry[1]
      transcript += entry[1] + "|"+ entry[0].tag + "|" + entry[0].description + "\n"
    }
    transcript += total
    return {string: transcript, data: this.scores, total: total}
  }
  
  isEnd() {
    return this.questionNum > this.questions.length
  }
}

function prepareSimpleData(network) {
  return [...network.nodes]
}