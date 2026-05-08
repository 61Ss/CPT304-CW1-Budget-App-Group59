// Polyfill HTMLCanvasElement.getContext for jsdom (jsdom returns null by default).
// chart.js calls ctx.lineWidth / ctx.beginPath etc. on the returned context, so
// we provide a tiny stub so the script can load without throwing.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function () {
    const noop = function () {};
    return {
      lineWidth: 0,
      strokeStyle: "",
      clearRect: noop,
      beginPath: noop,
      arc: noop,
      stroke: noop,
    };
  };
}
