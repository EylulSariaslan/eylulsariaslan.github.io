(() => {
    const supportsCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!supportsCustomCursor.matches) return;

    const dot = document.createElement('span');
    const ring = document.createElement('span');
    dot.className = 'custom-cursor-dot';
    ring.className = 'custom-cursor-ring';
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    document.body.append(dot, ring);
    document.documentElement.classList.add('custom-cursor-enabled');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interactiveSelector = 'a, button, input, textarea, select, label, [role="button"], .project-image-container, .certificate-image-link';
    let pointerX = -100;
    let pointerY = -100;
    let ringX = -100;
    let ringY = -100;

    const positionElement = (element, x, y) => {
        element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const render = () => {
        const ease = reducedMotion ? 1 : 0.16;
        ringX += (pointerX - ringX) * ease;
        ringY += (pointerY - ringY) * ease;
        positionElement(ring, ringX, ringY);
        window.requestAnimationFrame(render);
    };

    document.addEventListener('pointermove', event => {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        positionElement(dot, pointerX, pointerY);
        dot.classList.add('custom-cursor-visible');
        ring.classList.add('custom-cursor-visible');

        const isInteractive = Boolean(event.target.closest(interactiveSelector));
        dot.classList.toggle('is-hovering', isInteractive);
        ring.classList.toggle('is-hovering', isInteractive);
    }, { passive: true });

    document.addEventListener('pointerdown', event => {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        dot.classList.add('is-clicking');
        ring.classList.add('is-clicking');
    });

    document.addEventListener('pointerup', () => {
        dot.classList.remove('is-clicking');
        ring.classList.remove('is-clicking');
    });

    document.documentElement.addEventListener('mouseleave', () => {
        dot.classList.remove('custom-cursor-visible');
        ring.classList.remove('custom-cursor-visible');
    });

    document.documentElement.addEventListener('mouseenter', () => {
        dot.classList.add('custom-cursor-visible');
        ring.classList.add('custom-cursor-visible');
    });

    window.requestAnimationFrame(render);
})();
