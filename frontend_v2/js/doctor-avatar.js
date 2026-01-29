(() => {
  const avatar = document.getElementById("docAvatar");
  const head = document.getElementById("docHead");
  const pupilL = document.getElementById("pupilL");
  const pupilR = document.getElementById("pupilR");

  if (!avatar || !head || !pupilL || !pupilR) return;

  let tx = 0, ty = 0;     // target
  let x = 0, y = 0;       // current

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  window.addEventListener("mousemove", (e) => {
    const r = avatar.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    tx = clamp(dx / 35, -10, 10);   // rotateY
    ty = clamp(dy / 45, -8, 8);     // rotateX
  });

  function frame() {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;

    head.style.transform = `rotateX(${ -y }deg) rotateY(${ x }deg)`;

    const px = clamp(x * 0.55, -4, 4);
    const py = clamp(y * 0.55, -3, 3);

    pupilL.style.transform = `translate(${px}px, ${py}px)`;
    pupilR.style.transform = `translate(${px}px, ${py}px)`;

    requestAnimationFrame(frame);
  }
  frame();
})();
