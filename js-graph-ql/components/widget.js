export class Widget {
    constructor(title, initialValue = 'Loading...') {
        this.element = this.createWidget(title, initialValue);
    }

    createWidget(title, value) {
        const widget = document.createElement('div');
        widget.className = 'widget';

        const titleElement = document.createElement('h2');
        titleElement.textContent = title;

        const valueElement = document.createElement('div');
        valueElement.className = 'widget-value';
        valueElement.textContent = value;

        widget.appendChild(titleElement);
        widget.appendChild(valueElement);

        return widget;
    }

    updateValue(value) {
        this.element.querySelector('.widget-value').textContent = value;
    }

    setClickHandler(handler) {
        this.element.addEventListener('click', handler);
        this.element.style.cursor = 'pointer';
    }

    getElement() {
        return this.element;
    }
}