/* This class defines the Student object used to simulate tests, with constant probabilities, probabilities of a fluke/mistake, pre defined probabilities if defined and bounded probabilities for higher/lower levels
 * nodesMap: Map(string -> SkillNode)
 * startLevel: number, This defines the level the student starts the exams on and is also used to asign probabilities for skills which are higher/lower leveled
 * pCorrect: number
 * noise: {pFluke: number, pMistake: number}, This adds a chance that the student would answer correctly when tested on a skill they do not have, as well as answering incorrectly for a skill they do have
 * pLower: number, The lower bound for the probability of knowing a lower leveled skill
 * pHigher: number, The upper bound for the probability of knowing a higher leveled skill
 * definedPs: Map(String -> number), A Map of skill tag to probability of answering correctly
 */
class Student {
  constructor(nodesMap, startLevel, pCorrect, noise, pLower, pHigher, definedPs) {
    if (!(definedPs instanceof Map)) {
      definedPs = new Map()
    }
    if (typeof pLower !== "number") {
      pLower = 0
    }
    if (typeof pHigher !== "number") {
      pHigher = 1
    }
    
    this.pCorrect = pCorrect
    this.startLevel = startLevel
    this.noise = noise
    this.pLower = pLower
    this.pHigher = pHigher
    this.definedPs = definedPs
  }
  
  /* Returns a Map of skill tag to true/false used to represent skills known
   * A random skill is chosen and set as true/false based on its probability, and then inferences are made using the network to mark linked skills correctly
   * startLevel: number, Currently it is not used, but it could be used by chooseSkill()
   */
  assignSkillsCorrect(startLevel) {
    function removeTag(tag, from) {
      from = from.splice(from.indexOf(tag), 1)
    }
    
    /* Recursivley marks pre requisite skills as true
     */
    function markYes(tag) {
      if (![...skillsCorrect.keys()].includes(tag)) {
        skillsCorrect.set(tag, true)
        removeTag(tag, skillTags)
      } else {
        return
      }
      
      for (let blink of nodesMap.get(tag).backwardsLink) {
        markYes(blink)
      }
    }
    
    /* Recursivley marks forward linked skills as false
     */
    function markNo(tag) {
      if (![...skillsCorrect.keys()].includes(tag)) {
        skillsCorrect.set(tag, false)
        removeTag(tag, skillTags)
      } else {
        return
      }
      
      for (let flink of nodesMap.get(tag).forwardsLink) {
        markNo(flink)
      }
    }
    
    /* Returns a randomly chosen skill tag which has not been marked yet
     */
    function chooseSkill() {
      return skillTags[Math.floor(Math.random() * (skillTags.length - 1))]
    }
    
    let nodesMap = net.nodesMap
    let skillTags = [...nodesMap.keys()]
    let skillsCorrect = new Map()
    
    while (skillTags.length !== 0) {
      let tag = chooseSkill()
      if (this.isCorrect(tag)) {
        markYes("" + tag)
      } else {
        markNo("" + tag)
      }
    }

    return new Map([...skillsCorrect.entries()].sort())
  }
  
  /* Returns true for the given tag with the probability defined
   * tag: string
   */
  isCorrect(tag) {
    if ([...this.definedPs.keys()].includes(tag)) {
      return Math.random() <= this.definedPs.get(tag)
    }
    
    let nodeLevel = net.nodesMap.get(tag).level
    let p = this.pCorrect
    
    if (nodeLevel < this.startLevel && this.pLower !== 0) {
      p = this.pLower
    } else if (nodeLevel > this.startLevel && this.pHigher !== 1) {
      p = this.higher
    }
    
    let pCorrect = p
    return Math.random() <= pCorrect
  }
}