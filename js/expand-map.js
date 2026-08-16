/**
 * EXPANDABLE 3D LOCATION CARD COMPONENT
 * Interactive 3D tilt physics & spring expansion
 */

class ExpandableLocationMap {
  constructor(containerId = "expandable-map-card") {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.card = this.container.querySelector(".expand-map-inner");
    this.isExpanded = false;
    this.isHovered = false;

    this.mouseX = 0;
    this.mouseY = 0;
    this.currentRotateX = 0;
    this.currentRotateY = 0;
    this.targetRotateX = 0;
    this.targetRotateY = 0;
    this.animationFrame = null;

    this.initEvents();
    this.startPhysicsLoop();
  }

  initEvents() {
    // Mouse movement para inclinação 3D no desktop
    this.container.addEventListener("mousemove", (e) => {
      const rect = this.container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      // Limitar inclinação entre -10deg e +10deg
      this.targetRotateY = Math.max(-10, Math.min(10, deltaX * 10));
      this.targetRotateX = Math.max(-10, Math.min(10, -deltaY * 10));
      this.isHovered = true;
    });

    this.container.addEventListener("mouseleave", () => {
      this.targetRotateX = 0;
      this.targetRotateY = 0;
      this.isHovered = false;
    });

    // Toggle expandir / recolher ao clicar ou tocar
    this.container.addEventListener("click", (e) => {
      // Se clicou em um link de rota, deixa abrir normalmente
      if (e.target.closest("a") || e.target.closest("button")) {
        return;
      }
      this.toggleExpand();
    });
  }

  // Loop de física com amortecimento suave (Spring Physics)
  startPhysicsLoop() {
    const update = () => {
      const damping = 0.12;
      this.currentRotateX += (this.targetRotateX - this.currentRotateX) * damping;
      this.currentRotateY += (this.targetRotateY - this.currentRotateY) * damping;

      if (this.card) {
        this.card.style.transform = `rotateX(${this.currentRotateX.toFixed(2)}deg) rotateY(${this.currentRotateY.toFixed(2)}deg)`;
      }

      this.animationFrame = requestAnimationFrame(update);
    };
    update();
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      this.container.classList.add("expanded");
      // Reinicia as animações das ruas em SVG
      const paths = this.container.querySelectorAll(".map-animated-street");
      paths.forEach(p => {
        p.style.animation = "none";
        p.offsetHeight; // reflow
        p.style.animation = "";
      });
    } else {
      this.container.classList.remove("expanded");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.expandableLocationMapInstance = new ExpandableLocationMap("expandable-map-card");
});
