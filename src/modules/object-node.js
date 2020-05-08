class ObjectNode {

  constructor({ key }) {
    this.key = key;
    this.parent = null;
    this.children = [];
    this.model = null;
  }

  updateWith({ model, parent }) {
    if (!!model) {
      this.model = model;
      model.node = this;
    }
    if (!!parent) this.updateParent(parent);
    return this;
  }

  updateParent(parent) {
    this.parent = parent;
    if (parent.children.indexOf(this) == -1) parent.children.push(this);
  }

  get hasParent() {
   return !!this.parent; 
  }

  get parentNameList() {
    let parents = []
    let node = this
    while (node.parent) {
      node = node.parent
      parents.push(node.key)
    }
    return parents
  }

  updateTransformations() {
    this.model.updateMatrices();
    this.children.forEach(children => {
      children.updateTransformations()
    });
  }
}
