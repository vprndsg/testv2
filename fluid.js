import webGLFluidEnhanced from 'webgl-fluid-enhanced';

/**
 * Initialise the fluid simulation on the given canvas.
 * Returns an object with a convenience splat(x,y,dx,dy,color) method.
 */
export function initFluid(canvas) {
  const sim = webGLFluidEnhanced.simulation(canvas, {
    SIM_RESOLUTION: 256,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 0.94,
    VELOCITY_DISSIPATION: 0.93,
    PRESSURE_ITERATIONS: 30,
    BLOOM: true,
  });

  function splat(x, y, dx, dy, threeColor) {
    sim.addSplat(x, y, dx, dy, [threeColor.r, threeColor.g, threeColor.b]);
  }
  return { splat };
}
