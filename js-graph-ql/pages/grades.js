import { fetchGraphQLData, queries } from '../api/graphql.js';
import { GradesGraph } from '../components/gradesGraph.js';

export const createGradesPage = async () => {
    const page = document.createElement('div');
    page.className = 'page grades-page';

    const title = document.createElement('h1');
    title.textContent = 'Grades Overview';

    const content = document.createElement('div');
    content.className = 'grades-content';

    // Create containers for graph and table
    const graphContainer = document.createElement('div');
    // graphContainer.className = 'grades-graph-container';

    const tableContainer = document.createElement('div');
    tableContainer.className = 'grades-table-container';

    content.appendChild(graphContainer);
    content.appendChild(tableContainer);
    page.appendChild(title);
    page.appendChild(content);

    try {
        const data = await fetchGraphQLData(queries.getGrades);

        // Check if data and progress exist
        if (!data || !data.progress || !Array.isArray(data.progress)) {
            throw new Error('Invalid data structure received from API');
        }

        // Filter out grades with paths containing "piscine-js", "checkpoint", or "piscine-rust"
        const filteredGrades = data.progress.filter(grade => {
            // Skip grades with no path
            if (!grade.path) return true;

            // Exclude paths containing piscine-js, checkpoint, or piscine-rust
            return !grade.path.includes("/bahrain/bh-module/piscine-js") &&
                   !grade.path.includes("/bahrain/bh-module/checkpoint") &&
                   !grade.path.includes("/bahrain/bh-module/piscine-rust");
        });

        if (filteredGrades.length === 0) {
            content.innerHTML = '<div class="error-message">No grades data available after filtering.</div>';
            return page;
        }

        // Group grades by project path to identify unique projects
        const projectGroups = {};
        filteredGrades.forEach(grade => {
            const projectKey = grade.path;
            if (!projectGroups[projectKey]) {
                projectGroups[projectKey] = [];
            }
            projectGroups[projectKey].push(grade);
        });

        // Get the latest grade from each project
        const latestProjectGrades = Object.values(projectGroups).map(group => {
            return group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        });

        // Sort by date (newest first) and take the 10 latest projects
        const latestGrades = latestProjectGrades
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Add a heading for the latest projects
        const latestHeading = document.createElement('h2');
        latestHeading.textContent = '10 Latest Projects';
        latestHeading.className = 'section-heading';
        content.insertBefore(latestHeading, tableContainer);

        // Create and display graph for only the 10 latest projects
        const graph = new GradesGraph(800, 450);

        // Process the data for the graph - use only the 10 latest projects
        const graphData = processGradesDataForGraph(latestGrades);
        graph.drawLineGraph(graphData);
        graphContainer.appendChild(graph.getElement());

        // Setup resize observer for responsive graphs
        graph.setupResizeObserver(graphContainer);

        // Create and display table for only the latest projects
        const table = createGradesTable(latestGrades);
        tableContainer.appendChild(table);
    } catch (error) {
        content.innerHTML = `<div class="error-message">Error loading grades data. Please try again later.</div>`;
        console.error('Grades data fetch error:', error);
    }

    return page;
};

const processGradesDataForGraph = (grades) => {
    return grades
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map(grade => {
            // Convert grade to a number and ensure it's a valid value
            let gradeValue = parseFloat(grade.grade);
            if (isNaN(gradeValue)) gradeValue = 0;

            return {
                date: new Date(grade.createdAt),
                value: gradeValue,
                project: grade.object && grade.object.name ? grade.object.name : grade.path
            };
        });
};

const createGradesTable = (grades) => {
    const table = document.createElement('table');
    table.className = 'grades-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Project</th>
            <th>Grade</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');

    // Sort grades by date (newest first)
    const sortedGrades = [...grades].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    sortedGrades.forEach(grade => {
        const row = document.createElement('tr');
        const projectName = grade.object && grade.object.name ? grade.object.name : grade.path;

        row.innerHTML = `
            <td>${new Date(grade.createdAt).toLocaleDateString()}</td>
            <td>${projectName}</td>
            <td>${Number(grade.grade).toFixed(1)}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
};