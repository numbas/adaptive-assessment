/* A simple example of an exam controller which iterates over a list of skills and tests all skills in order
 * questions: Array(SkillNode)
 */
class SimpleController extends ExamController {
  constructor(questions) {
    super()
    this.questions = questions
    this.questionNum = 0
    this.scores = new Map()
  }
  
  /* Returns the SkillNode object of the next skill to test
   */
  nextSkillToTest() {
    if (this.isEnd()) {
      return null
    } else {
      return this.questions[this.questionNum++]
    }
  }
  
  /* Sets the score of the given SkillNode
   * question: SkillNode
   * answerIsCorrect: boolean
   */
  setScore(question, answerIsCorrect) {
    this.scores.set(question, 1)
  }
  
  /* Returns an object of the form {string:, data:, total:},
   * string: string, The transcript info as a readable string
   * data: Map(SkillNode -> number), The final scores map of the examcontrollers state
   * total: number, The sum of scores for all SkillNodes in the scores Map
   */
  transcript() {
    let transcript = "Score|Tag|Description\n"
    let total = 0
    for (let entry of [...this.scores.entries()]) {
      total += entry[1]
      transcript += `${entry[1]}|${entry[0].tag}|${entry[0].description}\n`
    }
    transcript += total
    return {string: transcript, data: this.scores, total: total}
  }
  
  /* Returns true if there are no skills left to test
   */
  isEnd() {
    return this.questionNum >= this.questions.length
  }
}

/* Returns a list of SkillNodes for the simple controller to use
 * network: SkillNetwork
 */
function prepareSimpleData(network) {
  return [...network.nodes]
}