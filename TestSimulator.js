let networkDefs = document.querySelectorAll('script[type="text/network"]')
let size = {height: 1000, width: 1500}
let net = initNetwork(networkDefs[0].textContent)
let pageid = "page"
let chartSize = {width: 400, height: 300}
let colours = [
  'rgba(255, 99, 132, 0.4)',
  'rgba(54, 162, 235, 0.4)',
  'rgba(255, 206, 86, 0.4)',
  'rgba(75, 192, 192, 0.4)',
  'rgba(153, 102, 255, 0.4)',
  'rgba(255, 159, 64, 0.4)'
  ]
let sLevel = 1
let eLevel = 4
let students = []
let tests = []

/* Returns a random integer from min to max inclusivley
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (Math.floor(max - min)) + min)
}

/* Returns a decimal number rounded to the nearest numOfDps
 * numOfDps: number
 * x: number
 */
function roundToNearest(numOfDps, x) {
  let factor = Math.pow(10, numOfDps)
  return Math.round(factor * x) / factor
}

/* Appends Student objects, covering all intervals between all probabilities and levels, to the student array in this file
 * startLevel: number
 * endLevel: number
 * pCorrectStart: number
 * pCorrectEnd: number
 * pCorrectInterval: number
 * pMistakeStart: number
 * pMistakeEnd: number
 * pMistakeInterval: number
 * pFlukeStart: number
 * pFlukeEnd: number
 * pFlukeInterval: number
 */
function generateStudents(startLevel, endLevel, pCorrectStart, pCorrectEnd, pCorrectInterval, pMistakeStart, pMistakeEnd, pMistakeInterval, pFlukeStart, pFlukeEnd, pFlukeInterval) {
  let students = []
  let numOfDps = 10    // so floats are correct to 10dp
  if (typeof pCorrectInterval !== "number" || pCorrectInterval === 0) {    // infinite loop if 0
    pCorrectInterval = 0.1
  }
  if (typeof pMistakeStart !== "number") {
    pMistakeStart = 0
  }
  if (typeof pMistakeEnd !== "number") {
    pMistakeEnd = 0
  }
  if (typeof pMistakeInterval !== "number" || pMistakeInterval === 0) {   // infinite loop if 0
    pMistakeInterval = 0.1
  }
  if (typeof pFlukeStart !== "number") {
    pFlukeStart = 0
  }
  if (typeof pFlukeEnd !== "number") {
    pFlukeEnd = 0
  }
  if (typeof pFlukeInterval !== "number" || pFlukeInterval === 0) {   // infinite loop if 0
    pFlukeInterval = 0.1
  }
  
  for (let level = startLevel; level <= endLevel; level++) {
    let pCorrect = pCorrectStart

    while (pCorrect <= pCorrectEnd) {
      let pMistake = pMistakeStart

      while (pMistake <= pMistakeEnd) {
        let pFluke = pFlukeStart
        
        while (pFluke <= pFlukeEnd) {
          students.push(new Student(net.nodesMap, level, pCorrect, {pMistake: pMistake, pFluke: pFluke}))
          
          pFluke = roundToNearest(numOfDps, pFluke + pFlukeInterval)
        }
 
        pMistake = roundToNearest(numOfDps, pMistake + pMistakeInterval)
      }

      pCorrect = roundToNearest(numOfDps, pCorrect + pCorrectInterval)
    }
  }
  
  return students
}

/* Returns test data based on the type of test and controller used for all students each numOfStudentsPerTest times
 * numOfStudentsPerTest: number, The number of times to test the student, to increase the amount of test data on the same students
 * students: Array(Student)
 * controllerName: string, Used to choose the exam controller the tests should use, currently "diagnosys" or "diagnosysV1"
 * testType: string, Used to choose the what student data to use to complete a test, currrently "constantP", which uses the students probabilities, and "determinedAns", which uses the networks inferences as well
 */
function testStudents(numOfStudentsPerTest, students, controllerName, testType) {
  /* Returns an exam controller named for the given student
   * controllerName: string, Used to choose the exam controller the tests should use, currently "diagnosys" or "diagnosysV1"
   * student: Student
   */
  function getExamController(controllerName, student) {
    let examController = null
    switch (controllerName) {
      case "diagnosys":
        examController = new DiagnosysController(net, [net.groups.get("allSkills")], student.startLevel)
        break
      case "diagnosysV1":
        examController = new DiagnosysControllerV1(net, [net.groups.get("allSkills")], student.startLevel, 4, 4)
        break
    }
    
    return examController
  }
  
  /* Returns test data on students when student answers questions correctly with the probabilities defined in their Student object
   * The test data is of the form {
   *  pCorrect: number 
   *  noise: {
   *    pFluke: number
   *    pMistake: number
   *  }, 
   *  askedQs: Array(string)
   *  startLevel: number
   *  endLevel: number
   *  transcriptState: Map(string -> string)
   * }
   */
  function constantPTest() {
    let testData = []
    
    for (let student of students) {
      let numOfStudentsTested = 0
      while (numOfStudentsTested < numOfStudentsPerTest) {

        let transcript = simulatedTest(getExamController(controllerName, student), student)
        
        testData.push({
          pCorrect: student.pCorrect,
          noise: student.noise,
          askedQs: transcript.askedQs,
          startLevel: student.startLevel,
          endLevel: transcript.endLevel,
          transcriptState: transcript.state,
        })
        
        numOfStudentsTested++
      }
    }
    
    return testData
  }
  
   /* Returns test data on students when student answers questions correctly based on the inferences made if they know a skill, e.g. if a skill is present infer that its pre requisites are also present, if not then infer that forward linked skills are also not present
   * The test data is of the form {
   *  pCorrect: number 
   *  noise: {
   *    pFluke: number
   *    pMistake: number
   *  }, 
   *  askedQs: Array(string)
   *  startLevel: number
   *  endLevel: number
   *  comparedState: Map(string -> boolean), A Map of skills tags to true/false, which are true if the skills states in the transcript match the infered skills present in studentSkills
   *  transcriptState: Map(string -> string)
   *  studentSkills: Map(string -> boolean), A Map of skills tags to true/false, created by assignSkillsCorrect in Student.js, which indicates a student has a skill if true
   * }
   */
  function determinedAnswerTest() {
    let testData = []

    for (let student of students) {
      let numOfStudentsTested = 0  // doesnt make sense to do this here, because skills Y/N is set and unchanged
      while (numOfStudentsTested < numOfStudentsPerTest) {
        let comparedState = new Map()
        let skillsCorrect = student.assignSkillsCorrect(student.startLevel)
        let transcript = simulatedTest(getExamController(controllerName, student), student, skillsCorrect)
        let state = transcript.state
        
        
        for (let tag of [...skillsCorrect.keys()]) {
          let stateTag = state.get(tag)
          let skillState = false
          
          if (stateTag === "pyes" || stateTag === "yes") {
            skillState = true
          } else if (stateTag === "pno" || stateTag === "no") {
            skillState = false
          }
          
          comparedState.set(tag, skillState === skillsCorrect.get(tag))
        }
        
        
        testData.push({
          pCorrect: student.pCorrect,
          noise: student.noise,
          askedQs: transcript.askedQs,
          startLevel: student.startLevel,
          endLevel: transcript.endLevel,
          comparedState: comparedState,
          transcriptState: transcript.state,
          studentSkills: skillsCorrect,
        })
        
        numOfStudentsTested++
      }
    }
    
    return testData
  }
  
  if (testType === "constantP") {
    return constantPTest()
  } else if (testType === "determinedAns") {
    return determinedAnswerTest() 
  }
}

/* Resets student data
 * Used for UI button
 */
function resetStudentData() {
  students = []
  alert("student data reset")
}

/* Resets test data
 * Used for UI button
 */
function resetTestData() {
  tests = []
  alert("test data reset")
}

/* Generates student data
 * Used for UI button
 */
function addStudentData() {
  let startLevel = Number(document.getElementById("startLevel").value)
  let endLevel = Number(document.getElementById("endLevel").value)
  let pCorrectStart = Number(document.getElementById("pCorrectStart").value)
  let pCorrectEnd = Number(document.getElementById("pCorrectEnd").value)
  let pCorrectInterval = Number(document.getElementById("pCorrectInterval").value)
  let pMistakeStart = Number(document.getElementById("pMistakeStart").value)
  let pMistakeEnd = Number(document.getElementById("pMistakeEnd").value)
  let pMistakeInterval = Number(document.getElementById("pMistakeInterval").value)
  let pFlukeStart = Number(document.getElementById("pFlukeStart").value)
  let pFlukeEnd = Number(document.getElementById("pFlukeEnd").value)
  let pFlukeInterval = Number(document.getElementById("pFlukeInterval").value)

  Array.prototype.push.apply(students, generateStudents(startLevel, endLevel, pCorrectStart, pCorrectEnd, pCorrectInterval, pMistakeStart, pMistakeEnd, pMistakeInterval, pFlukeStart, pFlukeEnd, pFlukeInterval))
  alert("Student data added")
}

/* Generates test data
 * Used for user input
 */
function runTests() {
  let testType = document.getElementById("testType").value
  let controllerName = document.getElementById("controllerName").value
  let nTests = document.getElementById("numberOfTests").value
  Array.prototype.push.apply(tests, testStudents(nTests, students, controllerName, testType))
  alert("Tests complete")
}

/* Generates charts
 * Used for user input
 */
function drawTestGraphs() {
  if (tests.length  === 0) {
    return 
  }
  
  let div = document.getElementById("drawGraphs")
  let inputs = div.getElementsByTagName("input")
  
  for (let input of inputs) {
    if (input.checked) {
      switch (input.value) {
        case "barTotalAsked":
          barChartTotalAsked(tests, sLevel, eLevel, colours)
          break
        case "barAverageAsked":
          barChartAverageLevelAsked(tests, sLevel, eLevel, colours)
          break
        case "scatterTotalAsked":
          scatterGraphTotalAsked(tests, sLevel, eLevel, colours)
          break
        case "scatterAverageAsked":
          scatterGraphAverageLevelAsked(tests, sLevel, eLevel, colours)
          break
        case "scatterDiff":
          scatterGraphDiagnosysDifference(tests, sLevel, eLevel, colours)
          break
      }
    }
  }
}