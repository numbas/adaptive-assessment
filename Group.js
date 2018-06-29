class Group {
  constructor(name, tags) {
    this.name = name
    this.tags = tags
  }

  toString() {
    return this.name + ", nodes: " +  [...this.tags]
  }
}
