import { getToken, clearToken } from './jwt.js';
import { getAuthenticatedUser } from '../auth/user.js';

// Use local mock endpoint instead of the real one
const GRAPHQL_ENDPOINT = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

export const fetchGraphQLData = async (query, variables = {}) => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        // First, check for HTTP errors
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error ${response.status}: ${errorText}`);
        }

        // Then parse the JSON
        const result = await response.json();

        // Check for GraphQL errors
        if (result.errors) {
            console.error('GraphQL Errors:', result.errors);
            throw new Error(result.errors[0].message);
        }

        // Debug logging (optional)
        // console.log('GraphQL Response:', {
        //     query,
        //     variables,
        //     data: result.data
        // });

        return result.data;

    } catch (error) {
        console.error('Request Failed:', error);
        if (error.message.includes('jwt') || error.message.includes('token')) {
            clearToken();
            window.location.href = '/';
        }
        throw error;
    }
};

// Common GraphQL Queries
export const queries = {
    getXP: `
        query {
            transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
                id
                type
                amount
                objectId
                createdAt
                path
            }
        }
    `,
    getGrades: `
        query {
            progress {
                path
                grade
                createdAt
                object {
                    name
                }
            }
        }
    `,
    getAudits: `
        query {
            transaction(where: {type: {_eq: "up"}}, order_by: {createdAt: asc}) {
                id
                type
                amount
                objectId
                createdAt
                path
            }
        }
    `,
    getSkills: `
    query {
        transaction(where: { type: { _regex: "skill" } }) {
            amount
            type
            objectId
        }
    }
    `,
    getUserProfile: `
        query GetUserProfile($userId: Int!) {
            user(where: { id: { _eq: $userId } }) {
                login
                firstName
                lastName
                auditRatio
                totalUp
                totalDown
                email
                attrs
                campus
                id
            }
            event_user(where: { userId: { _eq: $userId }, eventId: { _in: [20, 72, 250] } }) {
                level

            }
        }
    `
};
