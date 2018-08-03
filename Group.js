 
/* The defenition of a group which skills may non exclusively belong to, 
 * defined by a group name and the tags of the skills it contains
 * name: string, The name of the group
 * tags: Set(string), The set of tags in the group
 */
class Group {
  constructor(name, tags) {
    this.tags = new Set()
    for (let tag of tags) {
      this.tags.add(String(tag).replace(space, ""))
    }
    this.name = name
  }

  toString() {
    return `name: ${this.name}, nodes: ${[...this.tags]}`
  }
}
