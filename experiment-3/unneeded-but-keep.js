

/**
 * Adjust viewport so the canvas stays clear even if window resolution changes.
 Now it's not really needed but it can be.
 */

function adjustViewport() {
    let width = parseInt(window.innerWidth * window.devicePixelRatio);
    let height = parseInt(window.innerHeight * window.devicePixelRatio);
  
    canvas.width = width;
    canvas.height = height;
  
    aspect = width / height;
  
    gl.viewport(0, 0, width, height);
  
    // Flag to prevent trigger another render while being renderedContinuously
    // thus creating two render() function running simultaneously.
    if (!isRenderedContinuously) {
      render();
    }
  }