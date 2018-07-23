 /*
 init test with set of true/falses generated randomly or randomly generate t/f after every question
 use a constant P(correct) to choose correct or incorrect (this wouldnt be accurate for a student)
 
 for each student for each skill assign p(correct) ( can be done by level and groups)
 also allow some skills to always be correct or incorrect
 
 
 estimate ability of each skill should be close to the actual probabilities per skill for each student
 */

class Student {
  // it may be a good idea to include a variable to control the accuracy of the simulation, e.g all Qs have same P, use sillyMistakes, use levels to affect PofSkills ...

  // pOfSilly mistakes should probably constant for all Qs 
  // probably not true (Qs at or below level should have p(correct) = 1, if start level is true)
  // if pLower, pSame, pHigher or definedPs are not defined default values which create ps between 1 and 0 will be used
  constructor(nodesMap, startLevel, pOfSillyMistakes, definedPs, pLower, pSame, pHigher) {
    if (!(definedPs instanceof Array)) {
      definedPs = []
    }
    if (!(pLower instanceof Number)) {
      pLower = 0
    }
    if (!(pSame instanceof Number)) {
      pSame = pLower
    }
    if (!(pHigher instanceof Number)) {
      pHigher = 1
    }
    
    this.startLevel = startLevel
    this.nodesMap = nodesMap
    this.pOfSillyMistakes = pOfSillyMistakes
    this.pLower = pLower
    this.pSame = pSame
    this.pHigher = pHigher
    this.skillsP = this.assignP(startLevel, definedPs)  // this would be a map from skill tag to p(Correct) for that skill
  }

  // student.assignP can be used again to simulate test at different levels, or change defined Ps
  // this would be equivalent to creating a new student with pOfSillyMistakes, pSame, pLower and pHigher the same
  assignP(startLevel, definedPs) {
    let skillTags = [...this.nodesMap.keys()]
    let skillsP = new Map()
    
    for (let tag of skillTags) {
      let level = this.nodesMap.get(tag).level
      let max = 1
      let min = 0
      
      if (level < startLevel) {
        // p for skill should be at least pLower
        min = this.pLower
      } else if (level > startLevel) {
        // p for skill should be no more than pHigher
        max = this.pHigher
      } else if (level === startLevel) {
        // p for skill should at least pSame
        min = this.pSame
      }
      
      skillsP.set(tag, Math.random() * (max - min) + min)
    }
    
    for (let pair of definedPs) {
      skillsP.set("" + pair[0], pair[1])
    }
    
    return skillsP
  }
  
  isCorrect(tag) {
    let pCorrect = this.skillsP.get(tag) * (1 - this.pOfSillyMistakes)
    return Math.random() <= pCorrect
  }
}
// student can be tested multiple times and new student has different P(Correct) values, and pOfSillyMistakes

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (Math.floor(max - min)) + min)
}

let networkDefs = document.querySelectorAll('script[type="text/network"]')
let size = {height: 1000, width: 1500}
let net = initNetwork(networkDefs[0].textContent)
drawGraph(net, size)

// let student = new Student(net.nodesMap, 1, 0.1, [[101, 1], [402, 0.2]], 0.2, 0.2, 0.02)
// console.log(student)

let students = []
let transcripts = []
let numToTest = 100

for (let i = 0; i < numToTest; i++) {
  let level = getRandomInt(1, 5)
  students.push(new Student(net.nodesMap, level, Math.random()))  
  transcripts.push(simulatedTest(new DiagnosysController(net, [net.groups.get("allSkills")], level), students[i]))
}

for (let i = 0; i < numToTest; i++) {
  students[i].skillsP = [...students[i].skillsP]
  // students[i].nodesMap = [...students[i].nodesMap]
  transcripts[i].state = [...transcripts[i].state]
  transcripts[i].scores = [...transcripts[i].scores]
  
  console.log(students[i], transcripts[i])
}

let t = JSON.stringify(students) + JSON.stringify(transcripts)
console.log(t)

let page = document.getElementById("page")
let div = "<p>" + t + "<p>"
page.insertAdjacentHTML('beforeend', div)