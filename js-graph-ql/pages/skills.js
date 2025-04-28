import { fetchGraphQLData, queries } from '../api/graphql.js';

export const createSkillsPage = async () => {
    const page = document.createElement('div');
    page.className = 'page skills-page';

    const title = document.createElement('h1');
    title.textContent = 'Skills';

    const content = document.createElement('div');
    content.className = 'skills-content';

    page.appendChild(title);
    page.appendChild(content);

    try {
        const data = await fetchGraphQLData(queries.getSkills);

        // Debug: Log the data to see what we're getting
        // console.log('Skills API response:', data);

        // Check if data structure is valid
        if (!data || !data.transaction || !Array.isArray(data.transaction)) {
            throw new Error('Invalid data structure received from API');
        }

        // Group skills by type to avoid duplicates
        const skillsMap = {};

        // Process each transaction
        data.transaction.forEach(item => {
            // Extract skill name from type, removing 'skill_' prefix if present
            const skillName = item.type.includes('skill_')
                ? item.type.replace('skill_', '')
                : item.type;

            // Use the type as a unique key
            const key = item.type;

            // If we already have this skill, update it only if the amount is higher
            if (skillsMap[key]) {
                if (parseFloat(item.amount) > skillsMap[key].level) {
                    skillsMap[key].level = parseFloat(item.amount) || 0;
                }
            } else {
                // Create a new skill entry
                skillsMap[key] = {
                    name: formatSkillName(skillName),
                    level: parseFloat(item.amount) || 0,
                    category: categorizeSkill(item.type),
                    objectId: item.objectId,
                    type: item.type
                };
            }
        });

        // Debug: Log unique skill types
        // console.log('Unique skill types:', Object.keys(skillsMap));

        // Convert the map to an array
        const skills = Object.values(skillsMap);

        // Function to format skill names for better display
        function formatSkillName(name) {
            // Handle empty or null names
            if (!name) return 'Unknown Skill';

            // Replace underscores and hyphens with spaces
            name = name.replace(/[_-]/g, ' ');

            // Remove any leading/trailing spaces
            name = name.trim();

            // Capitalize first letter of each word
            return name.split(' ')
                .filter(word => word.length > 0) // Remove empty words
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        // Function to categorize skills based on type
        function categorizeSkill(type) {
            const lowerType = type.toLowerCase();

            // Exact matches for specific skill types
            const exactMatches = {
                'skill_go': 'Go',
                'skill_js': 'JavaScript',
                'skill_html': 'HTML',
                'skill_css': 'CSS',
                'skill_dom': 'DOM',
                'skill_sql': 'SQL',
                'skill_rust': 'Rust',
                'skill_python': 'Python',
                'skill_java': 'Java',
                'skill_cpp': 'C++',
                'skill_csharp': 'C#'
            };

            // Check for exact match first
            if (exactMatches[type]) {
                return exactMatches[type];
            }

            // More specific pattern matching
            if (lowerType === 'skill_go' || lowerType.endsWith('_go')) return 'Go';
            if (lowerType === 'skill_js' || lowerType.includes('javascript')) return 'JavaScript';
            if (lowerType === 'skill_html' || lowerType.endsWith('_html')) return 'HTML';
            if (lowerType === 'skill_css' || lowerType.endsWith('_css')) return 'CSS';
            if (lowerType === 'skill_dom' || lowerType.endsWith('_dom')) return 'DOM';
            if (lowerType === 'skill_sql' || lowerType.endsWith('_sql')) return 'SQL';
            if (lowerType === 'skill_rust' || lowerType.endsWith('_rust')) return 'Rust';

            // Broader pattern matching for categories
            if (lowerType.includes('algo')) return 'Algorithms';
            if (lowerType.includes('back')) return 'Backend';
            if (lowerType.includes('front')) return 'Frontend';
            if (lowerType.includes('docker')) return 'DevOps';
            if (lowerType.includes('git')) return 'Version Control';

            // Default category based on first part of the skill name
            const parts = lowerType.split('_');
            if (parts.length > 1) {
                const category = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
                return category;
            }

            // Fallback
            return 'Other';
        }

        if (skills.length === 0) {
            content.innerHTML = '<div class="error-message">No skills data available.</div>';
            return page;
        }

        // Sort skills by level (highest first) and take top 10
        const topSkills = [...skills]
            .sort((a, b) => b.level - a.level)
            .slice(0, 10);

        // Add a heading for the skills
        const skillsHeading = document.createElement('h2');
        skillsHeading.textContent = 'Skills Matrix';
        skillsHeading.className = 'section-heading';
        content.appendChild(skillsHeading);

        // Create a special category for skills
        const skillsCategory = {};
        skillsCategory['Skills'] = topSkills;

        // Create and display skills matrix
        const skillsMatrix = createSkillsMatrix(skillsCategory);
        content.appendChild(skillsMatrix);

        // We're only showing the top skills now, so the 'All Skills by Category' section has been removed

    } catch (error) {
        content.innerHTML = `<div class="error-message">Error loading skills data. Please try again later.</div>`;
        console.error('Skills data fetch error:', error);
    }

    return page;
};

// The groupSkillsByCategory function has been removed as it's no longer needed

const createSkillsMatrix = (skillsByCategory) => {
    const container = document.createElement('div');
    container.className = 'skills-matrix-container';

    // Create a section for each category
    Object.entries(skillsByCategory).forEach(([category, skills]) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'skills-category';

        const categoryTitle = document.createElement('h2');
        categoryTitle.textContent = category;
        categorySection.appendChild(categoryTitle);

        // Create skill bars
        const skillsList = document.createElement('div');
        skillsList.className = 'skills-list';

        skills.forEach((skill, index) => {
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';

            const skillName = document.createElement('div');
            skillName.className = 'skill-name';
            skillName.textContent = skill.name;

            const skillBar = document.createElement('div');
            skillBar.className = 'skill-bar';

            const skillLevel = document.createElement('div');
            skillLevel.className = 'skill-level';

            // Calculate width based on skill level
            // Normalize the level to a percentage between 0-100%
            const normalizedLevel = Math.min(100, Math.max(0, skill.level));

            // Initially set width to 0 for animation
            skillLevel.style.width = '0';

            // Use setTimeout to trigger the animation after a staggered delay
            setTimeout(() => {
                skillLevel.style.width = `${normalizedLevel}%`;
            }, 100 + index * 150); // Stagger the animations based on index

            skillBar.appendChild(skillLevel);
            skillItem.appendChild(skillName);
            skillItem.appendChild(skillBar);
            skillsList.appendChild(skillItem);
        });

        categorySection.appendChild(skillsList);
        container.appendChild(categorySection);
    });

    return container;
};