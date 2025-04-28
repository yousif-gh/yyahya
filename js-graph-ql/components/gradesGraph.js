export class GradesGraph {
    constructor(width = 1000, height = 1000, margin = { top: 20, right: 30, bottom: 30, left: 60 }) {
        this.width = width;
        this.height = height;
        this.margin = margin;
        this.element = this.createSVG();
        this.resizeObserver = null;
        this.data = null;
    }

    createSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('class', 'graph');
        return svg;
    }

    drawLineGraph(data) {
        if (!data || data.length === 0) {
            this.element.innerHTML = '<text x="50%" y="50%" text-anchor="middle">No data available</text>';
            return;
        }

        // Store the data for redrawing on resize
        this.data = data;

        // Clear any existing content
        this.element.innerHTML = '';

        // Dark mode has been removed
        const axisColor = '#666';
        const textColor = '#000';

        // Get date range for x-axis scaling
        const firstDate = data[0].date;
        const lastDate = data[data.length - 1].date;
        const timeRange = lastDate.getTime() - firstDate.getTime();

        // Calculate scales with padding
        const maxValue = Math.max(...data.map(d => d.value)) * 1.1; // Add 10% padding
        const yScale = (this.height - this.margin.top - this.margin.bottom) / maxValue;

        // Create path for the line
        let pathD = '';
        data.forEach((point, i) => {
            // Calculate x position based on date
            const datePosition = (point.date.getTime() - firstDate.getTime()) / timeRange;
            const x = this.margin.left + (datePosition * (this.width - this.margin.left - this.margin.right));
            const y = this.height - this.margin.bottom - (point.value * yScale);
            pathD += (i === 0 ? 'M' : 'L') + `${x},${y}`;
        });

        // Create and append path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('stroke', '#3498db');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');

        // Create axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        xAxis.setAttribute('d', `M${this.margin.left},${this.height - this.margin.bottom}H${this.width - this.margin.right}`);
        xAxis.setAttribute('stroke', axisColor);
        xAxis.setAttribute('stroke-width', '1');

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        yAxis.setAttribute('d', `M${this.margin.left},${this.margin.top}V${this.height - this.margin.bottom}`);
        yAxis.setAttribute('stroke', axisColor);
        yAxis.setAttribute('stroke-width', '1');

        // Add Y-axis labels
        const yLabels = [];
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue * i / 5).toFixed(1);
            const y = this.height - this.margin.bottom - (value * yScale);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', this.margin.left - 10);
            label.setAttribute('y', y);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('dominant-baseline', 'middle');
            label.setAttribute('font-size', '12px');
            label.setAttribute('fill', textColor);
            label.textContent = value;
            yLabels.push(label);

            // Add tick mark
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', this.margin.left - 5);
            tick.setAttribute('y1', y);
            tick.setAttribute('x2', this.margin.left);
            tick.setAttribute('y2', y);
            tick.setAttribute('stroke', axisColor);
            tick.setAttribute('stroke-width', '1');
            yLabels.push(tick);
        }

        // Add X-axis labels (dates)
        const xLabels = [];
        const numXLabels = 5; // Number of date labels to show

        for (let i = 0; i <= numXLabels; i++) {
            const ratio = i / numXLabels;
            const dateTime = firstDate.getTime() + (timeRange * ratio);
            const date = new Date(dateTime);
            const x = this.margin.left + (ratio * (this.width - this.margin.left - this.margin.right));

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', this.height - this.margin.bottom + 20);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12px');
            label.setAttribute('fill', textColor);
            label.textContent = date.toLocaleDateString();
            xLabels.push(label);

            // Add tick mark
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', x);
            tick.setAttribute('y1', this.height - this.margin.bottom);
            tick.setAttribute('x2', x);
            tick.setAttribute('y2', this.height - this.margin.bottom + 5);
            tick.setAttribute('stroke', axisColor);
            tick.setAttribute('stroke-width', '1');
            xLabels.push(tick);
        }

        // Add data points
        const points = data.map(point => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

            // Calculate x position based on date
            const datePosition = (point.date.getTime() - firstDate.getTime()) / timeRange;
            const x = this.margin.left + (datePosition * (this.width - this.margin.left - this.margin.right));
            const y = this.height - this.margin.bottom - (point.value * yScale);

            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#3498db');

            // Add tooltip on hover
            circle.addEventListener('mouseover', (e) => {
                const tooltip = this.createTooltip(point);
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY - 10}px`;
                document.body.appendChild(tooltip);
            });

            circle.addEventListener('mouseout', () => {
                const tooltip = document.querySelector('.graph-tooltip');
                if (tooltip) tooltip.remove();
            });

            return circle;
        });

        // Append all elements
        this.element.appendChild(xAxis);
        this.element.appendChild(yAxis);

        // Append labels
        yLabels.forEach(label => this.element.appendChild(label));
        xLabels.forEach(label => this.element.appendChild(label));

        // Append path and points
        this.element.appendChild(path);
        points.forEach(point => this.element.appendChild(point));
    }

    createTooltip(data) {
        const tooltip = document.createElement('div');
        tooltip.className = 'graph-tooltip';

        // Format the tooltip content with grade information
        let content = `<strong>Date:</strong> ${data.date.toLocaleDateString()}<br>`;
        content += `<strong>Grade:</strong> ${data.value.toFixed(1)}<br>`;

        // Add project name if available
        if (data.project) {
            content += `<strong>Project:</strong> ${data.project}`;
        }

        tooltip.innerHTML = content;

        // Dark mode has been removed
        tooltip.style.backgroundColor = '#fff';
        tooltip.style.color = '#333';
        tooltip.style.border = '1px solid #ccc';
        tooltip.style.borderRadius = '4px';
        tooltip.style.padding = '8px';
        tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '1000';
        tooltip.style.fontSize = '12px';

        return tooltip;
    }

    getElement() {
        return this.element;
    }

    setupResizeObserver(container) {
        if (!container) return;

        // Clean up any existing observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Create a new resize observer
        this.resizeObserver = new ResizeObserver(() => {
            // Only redraw if we have data
            if (this.data && this.data.length > 0) {
                this.drawLineGraph(this.data);
            }
        });

        // Start observing the container
        this.resizeObserver.observe(container);
    }

    cleanup() {
        // Clean up the resize observer when no longer needed
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
}
