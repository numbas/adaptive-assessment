class SkillNode {
  constructor(tag, description, level) {
    this.tag = tag.replace(space, "")
    this.description = description
    this.level = level.replace(space, "")
    this.forwardsLink = new Set()
    this.backwardsLink = new Set()
  }

  toString() {
    let info = this.tag + ", " + this.description + ", " + this.level

    if (this.forwardsLink.size > 0) {
      info += ", forwardsLinks: " + [...this.forwardsLink]
    }

    if (this.backwardsLink.size > 0) {
      info += ", backwardsLinks: " + [...this.backwardsLink]
    }

    return info
  }
}
