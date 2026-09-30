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

    marked.use({ mangle: false, headerIds: false });

    const tasks = [loadConfig(), ...sectionNames.map(loadMarkdown)];
    await Promise.allSettled(tasks);

    if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise().catch((error) => console.error(error));
    }
});


