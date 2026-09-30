const contentDirectory = 'contents/';
const configFile = 'config.yml';
const sectionNames = ['home', 'research', 'education', 'activities', 'publications', 'awards'];

function setConfigValue(key, value) {
    const element = document.getElementById(key);
    if (!element) return;

    element.textContent = value;

    if (key === 'title') document.title = value;
    if (key === 'email') {
        element.setAttribute('href', `mailto:${value}`);
    }
}

async function loadConfig() {
    const response = await fetch(contentDirectory + configFile);
    if (!response.ok) throw new Error(`Unable to load ${configFile}`);

    const config = jsyaml.load(await response.text());
    Object.entries(config).forEach(([key, value]) => setConfigValue(key, value));

    const emailLink = document.getElementById('primary-email-link');
    if (emailLink && config.email) emailLink.href = `mailto:${config.email}`;
}

function groupResearchCards(container) {
    const children = Array.from(container.children);
    const fragment = document.createDocumentFragment();
    let card = null;
    let count = 0;

    children.forEach((child) => {
        if (child.tagName === 'H3') {
            count += 1;
            card = document.createElement('article');
            card.className = 'research-card';

            const number = document.createElement('span');
            number.className = 'research-card-number';
            number.textContent = String(count).padStart(2, '0');

            card.append(number, child);
            fragment.appendChild(card);
        } else if (card) {
            card.appendChild(child);
        }
    });

    if (count > 0) container.replaceChildren(fragment);
}

function groupActivityCards(container) {
    const children = Array.from(container.children);
    const fragment = document.createDocumentFragment();
    let card = null;
    let count = 0;

    children.forEach((child) => {
        if (child.tagName === 'H3') {
            count += 1;
            card = document.createElement('article');
            card.className = 'activity-card';

            const number = document.createElement('span');
            number.className = 'activity-card-number';
            number.textContent = String(count).padStart(2, '0');

            card.append(number, child);
            fragment.appendChild(card);
        } else if (card) {
            card.appendChild(child);
        }
    });

    if (count > 0) container.replaceChildren(fragment);
}

function setupCarousel() {
    const carousel = document.querySelector('[data-carousel]');
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const previousButton = carousel.querySelector('.carousel-previous');
    const nextButton = carousel.querySelector('.carousel-next');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const captionKicker = document.querySelector('[data-carousel-kicker]');
    const caption = document.querySelector('[data-carousel-caption]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dots = [];
    let activeIndex = 0;
    let timer = null;
    let pointerInside = false;
    let focusInside = false;

    if (slides.length < 2 || !previousButton || !nextButton || !dotsContainer) return;

    const stopAutoplay = () => {
        if (timer) window.clearInterval(timer);
        timer = null;
    };

    const startAutoplay = () => {
        stopAutoplay();
        if (reducedMotion.matches || document.hidden || pointerInside || focusInside) return;
        timer = window.setInterval(() => showSlide(activeIndex + 1), 5600);
    };

    const showSlide = (index) => {
        activeIndex = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', String(!isActive));
            dots[slideIndex]?.classList.toggle('is-active', isActive);
            dots[slideIndex]?.setAttribute('aria-current', isActive ? 'true' : 'false');
        });

        const activeSlide = slides[activeIndex];
        if (captionKicker) captionKicker.textContent = activeSlide.dataset.kicker || '';
        if (caption) caption.textContent = activeSlide.dataset.caption || '';
    };

    slides.forEach((slide, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show photo ${index + 1} of ${slides.length}`);
        dot.addEventListener('click', () => showSlide(index));
        dotsContainer.appendChild(dot);
        dots.push(dot);
    });

    previousButton.addEventListener('click', () => showSlide(activeIndex - 1));
    nextButton.addEventListener('click', () => showSlide(activeIndex + 1));

    carousel.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        showSlide(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });

    carousel.addEventListener('mouseenter', () => {
        pointerInside = true;
        stopAutoplay();
    });

    carousel.addEventListener('mouseleave', () => {
        pointerInside = false;
        startAutoplay();
    });

    carousel.addEventListener('focusin', () => {
        focusInside = true;
        stopAutoplay();
    });

    carousel.addEventListener('focusout', () => {
        window.setTimeout(() => {
            focusInside = carousel.contains(document.activeElement);
            startAutoplay();
        }, 0);
    });

    document.addEventListener('visibilitychange', startAutoplay);
    reducedMotion.addEventListener?.('change', startAutoplay);

    showSlide(0);
    startAutoplay();
}

async function loadMarkdown(name) {
    const container = document.getElementById(`${name}-md`);
    if (!container) return;

    try {
        const response = await fetch(`${contentDirectory}${name}.md`);
        if (!response.ok) throw new Error(`Unable to load ${name}.md`);

        container.innerHTML = marked.parse(await response.text(), {
            mangle: false,
            headerIds: false
        });

        if (name === 'research') groupResearchCards(container);
        if (name === 'activities') groupActivityCards(container);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p>Content is temporarily unavailable.</p>';
    }
}

function setupNavigation() {
    const header = document.getElementById('mainNav');
    const toggle = document.querySelector('.nav-toggle');
    const navigation = document.getElementById('primary-navigation');
    const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));

    const closeNavigation = () => {
        toggle.setAttribute('aria-expanded', 'false');
        navigation.classList.remove('is-open');
        document.body.classList.remove('nav-open');
    };

    toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!isOpen));
        navigation.classList.toggle('is-open', !isOpen);
        document.body.classList.toggle('nav-open', !isOpen);
    });

    links.forEach((link) => link.addEventListener('click', closeNavigation));

    const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const sections = links
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((link) => {
                    link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
                });
            });
        }, { rootMargin: '-30% 0px -60% 0px' });

        sections.forEach((section) => observer.observe(section));
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupCarousel();

    marked.use({ mangle: false, headerIds: false });

    const tasks = [loadConfig(), ...sectionNames.map(loadMarkdown)];
    await Promise.allSettled(tasks);

    if (window.MathJax?.typesetPromise) {
        try {
            await window.MathJax.typesetPromise();
        } catch (error) {
            console.error(error);
        }
    }

    const initialTarget = document.getElementById(window.location.hash.slice(1));
    if (initialTarget) {
        window.requestAnimationFrame(() => initialTarget.scrollIntoView({ block: 'start' }));
    }
});


