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

  // Traverse the whole tree and render every visited node
  render(gl) {
    this.model.render(gl);
    this.children.forEach(child => child.render(gl));
  }

  updateTransformations() {
    this.model.updateMatrices();
    this.children.forEach(children => {
      children.updateTransformations()
    });
  }
}
