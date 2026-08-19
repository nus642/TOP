// Canvas-based signature pad for match result confirmation.
// Mirrors Legacy referee.html signature board (refereeSigCanvas).
// Used for dispute resolution — signed results cannot be submitted without a signature.
(function expose(factory) {
  const pad = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = pad;
  if (typeof window !== "undefined") window.SignaturePad = pad;
})(function createModule() {
  function createSignaturePad(canvas) {
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let drawn = false;
    let lastX = 0;
    let lastY = 0;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    function getPosition(event) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (event.touches && event.touches.length > 0) {
        return {
          x: (event.touches[0].clientX - rect.left),
          y: (event.touches[0].clientY - rect.top)
        };
      }
      return {
        x: (event.clientX - rect.left),
        y: (event.clientY - rect.top)
      };
    }

    function startDraw(event) {
      event.preventDefault();
      drawing = true;
      drawn = true;
      const pos = getPosition(event);
      lastX = pos.x;
      lastY = pos.y;
    }

    function draw(event) {
      if (!drawing) return;
      event.preventDefault();
      const pos = getPosition(event);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }

    function stopDraw() {
      drawing = false;
    }

    function clear() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      drawn = false;
    }

    function isEmpty() {
      return !drawn;
    }

    function toDataURL() {
      return canvas.toDataURL("image/jpeg", 0.8);
    }

    // Initialize
    resizeCanvas();
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseout", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    return { clear, isEmpty, toDataURL, resizeCanvas };
  }

  return { createSignaturePad };
});
