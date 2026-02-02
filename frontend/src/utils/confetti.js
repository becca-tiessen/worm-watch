export function fireConfetti() {
  const colors = ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f', '#ff6600'];
  const count = 60;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      top: -10px;
      left: ${Math.random() * 100}vw;
      width: ${6 + Math.random() * 6}px;
      height: ${6 + Math.random() * 6}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      pointer-events: none;
      z-index: 9999;
      animation: confetti-fall ${1.5 + Math.random()}s ease-in forwards;
    `;
    document.body.appendChild(el);
    // Clean up after animation finishes
    el.addEventListener('animationend', () => el.remove());
  }
}

// Add this keyframe to App.css:
// @keyframes confetti-fall {
//   0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
//   100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
// }
