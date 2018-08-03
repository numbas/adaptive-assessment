/* The defenition of an exam controller, which must contain the following methods
 * nextSkillToTest(), getScore(tag, answerIsCorrect), transcript() and isEnd()
 * An object can not be instantiated from this class, another class must which extends this class must be created, with the defined methods
 */
class ExamController {
  constuctor() {
    if (new.target === ExamController) {
      throw "ExamController can not be instantiated itself"
    }  
  }
  
  /* Should return the tag or SkillNode object of the next skill to test, if using the skill nodes defined
   */
  nextSkillToTest() {
    throw "nextSkillToTest() is undefined"
  }
  
  /* Should update the state of the examController based on the in/correct answer
   * tag: string, Can be any type as long as it is the same as the return type of nextSkillToTest(), but 
   * answerIsCorrect: boolean
   */
  setScore(tag, answerIsCorrect) {
    throw "score() is undefined"
  }
  
  /* Should return transcript of the exam state and the results
   */
  transcript() {
    throw "transcript() is undefined"
  }
  
  /* Should return true when the conditions defining the end of the exam are met and false otherwise
   */
  isEnd() {
    throw "isEnd() is undefined"
  }
}

/* This function can be used to run through an exam, using buttons, at the end of the exam the transcript is returned
 * examController: ExamController, An object of a type which is extended from ExamController
 * answerIsCorrect: boolean
 */
function interactiveTest(examController, answerIsCorrect) {
  if (!examController.isEnd()) {
    let tag = examController.nextSkillToTest()
    examController.setScore(tag, answerIsCorrect)
  } else {
    return examController.transcript()
  }
}

/* Returns a transcript of an exam where the correctness of the answers is given by the boolean array
 * examController: ExamController, An object of a type which is extended from ExamController
 * array: [boolean, ...], Index i of the array determines whether to answer the (i + 1)th question correctly or not
 */
function test(examController, array) {
  let transcript = 0
  let i = 0
  while (!examController.isEnd() && (i < array.length)) {
    let tag = examController.nextSkillToTest()
    examController.setScore(tag, array[i])
    i++
  }
  
  return examController.transcript()
}

/* Returns a transcript of an exam when ran with the given student, and a map of skills which are definitley known, if it is given
 * examController: ExamController, An object of a type which is extended from ExamController
 * student: Student, An object used to simulate a non perfect student answering questions in an exam
 * skillsCorrect: Map, A Map of skills tags to true/false, used to determine whether the student has a skill or not
 */
function simulatedTest(examController, student, skillsCorrect) {
  while (!examController.isEnd()) { 
    let tag = examController.nextSkillToTest()
    let isCorrect = false
    if (skillsCorrect instanceof Map) {
      isCorrect = skillsCorrect.get(tag)
    } else {
      isCorrect = student.isCorrect(tag)
    }
    // CLP's line to add in random noise
    //isCorrect = Math.random() <= (isCorrect ? 0.9 : 0);
    isCorrect = Math.random() <= (isCorrect ? (1 - student.noise.pMistake) : student.noise.pFluke)
    examController.setScore(tag, isCorrect)
  }
  return examController.transcript()
}