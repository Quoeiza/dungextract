export function getEl(id) {
    return document.getElementById(id);
}

export function createEl(tag, { id, className, content, parent, style }) {
    const el = document.createElement(tag);
    if (id) el.id = id;
    if (className) el.className = className;
    if (content) el.innerHTML = content;
    if (style) Object.assign(el.style, style);
    if (parent) parent.appendChild(el);
    return el;
}

export function hide(el) {
    if (el) el.classList.add('hidden');
}

export function show(el) {
    if (el) el.classList.remove('hidden');
}

export function toggle(el) {
    if (el) el.classList.toggle('hidden');
}
