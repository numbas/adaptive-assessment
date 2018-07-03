class Group {
  constructor(name, tags) {
    this.tags = new Set()
    for (let tag of tags) {
      this.tags.add(String(tag).replace(space, ""))
    }
    this.name = name
  }

  toString() {
    return this.name + ", nodes: " +  [...this.tags]
  }
}
