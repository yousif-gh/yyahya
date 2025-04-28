import { fetchGraphQLData, queries } from '../api/graphql.js';
import { Graph } from '../components/graph.js';

export const createXPPage = async () => {
    const page = document.createElement('div');
    page.className = 'page xp-page';

    const title = document.createElement('h1');
    title.textContent = 'XP Progress';

    const content = document.createElement('div');
    content.className = 'xp-content';

    // Create containers for graph and table
    const graphContainer = document.createElement('div');
    // graphContainer.className = 'xp-graph-container';

    const tableContainer = document.createElement('div');
    tableContainer.className = 'xp-table-container';

    // Create a header container for title only (no refresh button)
    const headerContainer = document.createElement('div');
    headerContainer.className = 'page-header';
    headerContainer.appendChild(title);

    content.appendChild(graphContainer);
    content.appendChild(tableContainer);
    
    page.appendChild(headerContainer);
    page.appendChild(content);

    try {
        const data = await fetchGraphQLData(queries.getXP);

        if (!data || !data.transaction || !Array.isArray(data.transaction)) {
            throw new Error('Invalid data structure received from API');
        }

        // Filter out transactions with paths containing "piscine-js", "checkpoint", or "piscine-rust"
        const filteredTransactions = data.transaction.filter(transaction => {
            // Skip transactions with no path
            if (!transaction.path) return true;

            // Exclude paths containing piscine-js, checkpoint, or piscine-rust
            return !transaction.path.includes("/bahrain/bh-module/piscine-js") &&
                   !transaction.path.includes("/bahrain/bh-module/checkpoint") &&
                   !transaction.path.includes("/bahrain/bh-module/piscine-rust");
        });

        if (filteredTransactions.length === 0) {
            content.innerHTML = '<div class="error-message">No XP data available after filtering.</div>';
            return page;
        }

        // Group transactions by project path to identify unique projects
        const projectGroups = {};
        filteredTransactions.forEach(transaction => {
            if (!projectGroups[transaction.path]) {
                projectGroups[transaction.path] = [];
            }
            projectGroups[transaction.path].push(transaction);
        });

        // Get the latest transaction from each project
        const latestProjectTransactions = Object.values(projectGroups).map(group => {
            return group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        });

        // Sort by date (newest first) and take the 10 latest projects
        const latestProjects = latestProjectTransactions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Add a heading for the latest projects
        const latestHeading = document.createElement('h2');
        latestHeading.textContent = '10 Latest Projects';
        latestHeading.className = 'section-heading';
        content.insertBefore(latestHeading, tableContainer);

        // Create and display graph for only the 10 latest projects
        const graph = new Graph(800, 450);

        // Get all transactions from the 10 latest projects
        const latestProjectPaths = latestProjects.map(project => project.path);
        const transactionsFromLatestProjects = filteredTransactions.filter(transaction =>
            latestProjectPaths.includes(transaction.path)
        );

        // Process the data for the graph
        const graphData = processXPDataForGraph(transactionsFromLatestProjects);
        graph.drawLineGraph(graphData);
        graphContainer.appendChild(graph.getElement());

        // Setup resize observer for responsive graphs
        graph.setupResizeObserver(graphContainer);

        // Create and display table for the 10 latest projects
        const table = createXPTable(latestProjects);
        tableContainer.appendChild(table);
    } catch (error) {
        content.innerHTML = `<div class="error-message">Error loading XP data. Please try again later.</div>`;
        console.error('XP data fetch error:', error);
    }

    return page;
};

const processXPDataForGraph = (transactions) => {
    // Sort transactions by date
    const sortedTransactions = transactions
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calculate cumulative XP over time
    let cumulativeXP = 0;
    return sortedTransactions.map(transaction => {
        cumulativeXP += transaction.amount;
        return {
            date: new Date(transaction.createdAt),
            value: cumulativeXP,
            amount: transaction.amount,
            path: transaction.path
        };
    });
};

// Format XP amount to display in XP or KB for large numbers
const formatXPAmount = (num) => {
    console.log('Formatting XP amount:', num);
    // For numbers less than 1000, just return the number with XP suffix
    if (num < 1000) {
        return num.toString() + ' XP';
    }

    // For numbers 1000 or greater, round to the nearest thousand (K)
    if (num < 1000000) {
        return Math.round(num / 1000) + 'K';
    }

    // For numbers 1,000,000 or greater, round to the nearest million (M)
    return Math.round(num / 1000000) + 'M';
};

const createXPTable = (transactions) => {
    const table = document.createElement('table');
    table.className = 'xp-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Project</th>
            <th>XP Amount</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');

        // Create cells individually
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(transaction.createdAt).toLocaleDateString();

        const pathCell = document.createElement('td');
        pathCell.textContent = transaction.path;

        const amountCell = document.createElement('td');
        const amount = Number(transaction.amount);
        amountCell.textContent = formatXPAmount(amount);

        // Append cells to row
        row.appendChild(dateCell);
        row.appendChild(pathCell);
        row.appendChild(amountCell);

        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
};