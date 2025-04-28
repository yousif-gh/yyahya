import { fetchGraphQLData, queries } from '../api/graphql.js';
import { Graph } from '../components/graph.js';

export const createAuditsPage = async () => {
    const page = document.createElement('div');
    page.className = 'page audits-page';

    const header = document.createElement('div');
    header.className = 'page-header';

    const title = document.createElement('h1');
    title.textContent = 'Audit History';

    
    const content = document.createElement('div');
    content.className = 'audits-content';

    // Create graph container without card styling
    const graphContainer = document.createElement('div');
    // graphContainer.className = 'audit-graph-container';

    const graphTitle = document.createElement('h2');
    graphTitle.textContent = 'Audit Points Over Time';
    graphTitle.className = 'section-title';
    graphContainer.appendChild(graphTitle);

    // Create table container with card styling
    const tableContainer = document.createElement('div');
    tableContainer.className = 'audit-table-container card';

    const tableTitle = document.createElement('h2');
    tableTitle.textContent = 'Detailed Audit History';
    tableTitle.className = 'section-title';
    tableContainer.appendChild(tableTitle);

    content.appendChild(graphContainer);
    content.appendChild(tableContainer);
    page.appendChild(header);
    page.appendChild(content);

    // Add CSS styles specific to this page
    const style = document.createElement('style');
    style.textContent = `
        .audits-page {
            padding: 2rem;
            max-width: 1200px;
        }

        .page-header {
            margin-bottom: 2rem;
        }

        .page-header h1 {
            font-size: 2rem;
            color: #2c3e50;
            margin: 0;
        }

        .audits-content {
            display: grid;
            gap: 2rem;
            grid-template-columns: 1fr;
            width: 100%;
        }

        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 1.5rem;
        }

        .section-title {
            font-size: 1.25rem;
            color: #2c3e50;
            margin: 0 0 1rem 0;
        }

        /* Dark mode styles removed */

        .audit-graph-container {
            min-height: 400px;
            margin-bottom: 1rem;
            background: transparent;
            box-shadow: none;
        }

        .audit-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }

        .audit-table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #2c3e50;
            border-bottom: 2px solid #e9ecef;
        }

        .audit-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            color: #495057;
        }

        .audit-table tr:hover {
            background: #f8f9fa;
        }

        /* Dark mode styles removed */

        /* Dashboard widgets styling */
        .widgets-container {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 2rem;
            width: 100%;
        }

        .widget {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 1.5rem;
            flex: 1;
            min-width: 200px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .widget-title {
            font-size: 0.875rem;
            color: #6c757d;
            margin-bottom: 0.5rem;
        }

        .widget-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2c3e50;
        }

        /* Dark mode styles removed */

        @media (max-width: 768px) {
            .audits-page {
                padding: 1rem;
            }

            .widgets-container {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);

    try {
        // Fetch audit data
        const auditData = await fetchGraphQLData(queries.getAudits);

        if (!auditData || !auditData.transaction || !Array.isArray(auditData.transaction)) {
            content.innerHTML = '<div class="card">Invalid audit data structure.</div>';
            return page;
        }

        // Filter out audits with paths containing "piscine-js", "checkpoint", or "piscine-rust"
        const audits = auditData.transaction.filter(audit => {
            // Skip audits with no path
            if (!audit.path) return true;

            // Exclude paths containing piscine-js, checkpoint, or piscine-rust
            return !audit.path.includes("/bahrain/bh-module/piscine-js") &&
                   !audit.path.includes("/bahrain/bh-module/checkpoint") &&
                   !audit.path.includes("/bahrain/bh-module/piscine-rust");
        });

        if (audits.length === 0) {
            content.innerHTML = '<div class="card">No audit data available after filtering.</div>';
            return page;
        }

        // We no longer need to hardcode a username since we're not showing it in the table

        // Add widgets
        const widgetsContainer = document.createElement('div');
        widgetsContainer.className = 'widgets-container';

        // Calculate total audits
        const totalAudits = audits.length;
        const totalWidget = createWidget('Total Audits', totalAudits);

        // Calculate total points
        const totalPoints = audits.reduce((sum, audit) => sum + audit.amount, 0);
        const pointsWidget = createWidget('Total Points', totalPoints);

        // Get most recent audit date
        const mostRecentDate = new Date(
            Math.max(...audits.map(a => new Date(a.createdAt).getTime()))
        ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const dateWidget = createWidget('Latest Audit', mostRecentDate);

        widgetsContainer.appendChild(totalWidget);
        widgetsContainer.appendChild(pointsWidget);
        widgetsContainer.appendChild(dateWidget);

        // Insert widgets between header and content
        page.insertBefore(widgetsContainer, content);

        // Group audits by project path to identify unique projects
        const projectGroups = {};
        audits.forEach(audit => {
            if (!projectGroups[audit.path]) {
                projectGroups[audit.path] = [];
            }
            projectGroups[audit.path].push(audit);
        });

        // Get the latest audit from each project
        const latestProjectAudits = Object.values(projectGroups).map(group => {
            return group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        });

        // Sort by date (newest first) and take the 10 latest projects
        const latestAudits = latestProjectAudits
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Update the table title to reflect we're showing latest projects
        tableTitle.textContent = '10 Latest Audit Projects';

        // Create and display graph for only the 10 latest projects
        const graph = new Graph(800, 450);

        // We're using only the 10 latest projects directly
        // No need to filter all audits

        // Update the graph title to reflect we're showing latest projects
        graphTitle.textContent = 'Audit Points for 10 Latest Projects';

        // Process the data for the graph - use only the 10 latest projects
        const graphData = processAuditDataForGraph(latestAudits);
        graph.drawLineGraph(graphData);
        graphContainer.appendChild(graph.getElement());

        // Setup resize observer for responsive graphs
        graph.setupResizeObserver(graphContainer);

        // Create and display table for only the latest projects
        const table = createAuditTable(latestAudits);
        tableContainer.appendChild(table);
    } catch (error) {
        console.error('Audit data fetch error:', error);
        content.innerHTML = `
            <div class="card error-message">
                <p>Error loading audit data. Please try again later.</p>
                <small>${error.message}</small>
            </div>
        `;
    }

    return page;
};

// Format audit amount to display in points or KB for large numbers
const formatAuditAmount = (num) => {
    console.log('Formatting audit amount:', num);
    // For numbers less than 1000, just return the number with points suffix
    if (num < 1000) {
        return num.toString() + ' pts';
    }

    // For numbers 1000 or greater, round to the nearest thousand (K)
    if (num < 1000000) {
        return Math.round(num / 1000) + 'K';
    }

    // For numbers 1,000,000 or greater, round to the nearest million (M)
    return Math.round(num / 1000000) + 'M';
};

// Helper function to create widgets
const createWidget = (title, value) => {
    const widget = document.createElement('div');
    widget.className = 'widget';

    const titleElem = document.createElement('div');
    titleElem.className = 'widget-title';
    titleElem.textContent = title;

    const valueElem = document.createElement('div');
    valueElem.className = 'widget-value';

    // Format the value if it's the Total Points widget
    if (title === 'Total Points' && typeof value === 'number') {
        valueElem.textContent = formatAuditAmount(value);
    } else {
        valueElem.textContent = value;
    }

    widget.appendChild(titleElem);
    widget.appendChild(valueElem);

    return widget;
};

const processAuditDataForGraph = (audits) => {
    return audits
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map(audit => ({
            date: new Date(audit.createdAt),
            value: audit.amount
        }));
};

const createAuditTable = (audits) => {
    const table = document.createElement('table');
    table.className = 'audit-table';

    // Add debug log
    // console.log('Creating table with username:', username);

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Project</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');
    audits.reverse();
    audits.forEach(audit => {
        const row = document.createElement('tr');
        const formattedDate = new Date(audit.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const projectPath = audit.path.split('/').pop(); // Get the last part of the path

        // Note: We're not using the username in the table anymore

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formatAuditAmount(audit.amount)}</td>
            <td title="${audit.path}">${projectPath}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
};