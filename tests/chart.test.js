/**
 * @jest-environment jsdom
 */

const { loadApp } = require("./loader");

describe("chart.js", () => {
  let ctxSpy;

  beforeEach(() => {
    // Replace getContext with a spy each test so we can introspect calls.
    ctxSpy = {
      lineWidth: 0,
      strokeStyle: "",
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      stroke: jest.fn(),
    };
    HTMLCanvasElement.prototype.getContext = function () {
      return ctxSpy;
    };
    localStorage.clear();
    loadApp();
  });

  test("appends a 50x50 canvas to the .chart container", () => {
    const canvas = document.querySelector(".chart canvas");
    expect(canvas).not.toBeNull();
    expect(canvas.width).toBe(50);
    expect(canvas.height).toBe(50);
  });

  test("exposes updateChart on window for cross-script access", () => {
    expect(typeof window.updateChart).toBe("function");
  });

  test("updateChart clears the canvas and draws two arcs", () => {
    // Reset call history from the initial updateChart invocation triggered
    // by budget.js loading.
    ctxSpy.clearRect.mockClear();
    ctxSpy.beginPath.mockClear();
    ctxSpy.arc.mockClear();
    ctxSpy.stroke.mockClear();

    window.updateChart(100, 50);

    expect(ctxSpy.clearRect).toHaveBeenCalledWith(0, 0, 50, 50);
    // Two drawCircle() calls, each issues beginPath / arc / stroke once.
    expect(ctxSpy.beginPath).toHaveBeenCalledTimes(2);
    expect(ctxSpy.arc).toHaveBeenCalledTimes(2);
    expect(ctxSpy.stroke).toHaveBeenCalledTimes(2);
  });

  test("draws white anticlockwise arc and red clockwise arc", () => {
    ctxSpy.arc.mockClear();

    window.updateChart(80, 20);
    // Two arc() calls; verify each receives the canvas centre (25, 25) and
    // the right anticlockwise flag for the income arc (true) vs the outcome
    // arc (false).
    const [firstArcCall, secondArcCall] = ctxSpy.arc.mock.calls;
    expect(firstArcCall.slice(0, 4)).toEqual([25, 25, 20, 0]);
    expect(firstArcCall[5]).toBe(true);
    expect(secondArcCall[5]).toBe(false);
  });
});
