import { queries } from '../api/graphql.js';
import { getAuthenticatedUser } from '../auth/user.js';

export const createProfilePage = async () => {
    const page = document.createElement('div');
    page.className = 'page profile-page';

    try {
        const userData = await getAuthenticatedUser(queries.getUserProfile);
        // console.log('User Profile Data:', userData);

        // Create profile content
        const profileContent = document.createElement('div');
        // profileContent.className = 'profile-container';

        // Create profile section
        const profileSection = document.createElement('div');
        profileSection.className = 'profile-section';

        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'profile-image-container';

        // Create and setup profile image
        if (userData.attrs && userData.attrs['pro-picUploadId']) {
            const img = document.createElement('img');
            img.src = `https://learn.reboot01.com/api/storage?token=${localStorage.getItem("jwt_token")}&fileId=${userData.attrs['pro-picUploadId']}`;
            img.alt = "Profile Image";
            img.className = 'profile-image';
            imageContainer.appendChild(img);
        } else {
            // Default avatar if no image
            const defaultAvatar = document.createElement('div');
            defaultAvatar.className = 'default-avatar';
            defaultAvatar.textContent = userData.login ? userData.login[0].toUpperCase() : '?';
            imageContainer.appendChild(defaultAvatar);
        }

        // Create user info container
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';

        // Add username
        const userName = document.createElement('h1');
        userName.className = 'user-name';
        // userName.textContent = userData.login || 'User';

        // Add full name if available
        if (userData.firstName || userData.lastName) {
            const fullName = document.createElement('div');
            fullName.className = 'user-full-name';
            fullName.textContent = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            userInfo.appendChild(fullName);
        }

        // Level feature has been removed

        // Add profile info
        const profileInfo = document.createElement('div');
        profileInfo.className = 'profile-info';
        profileInfo.innerHTML = `
            <p><strong>Username:</strong> ${userData.login || 'N/A'}</p>
            <p><strong>Full Name:</strong> ${userData.firstName || 'N/A'} ${userData.lastName || ''}</p>
            <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
            <p><strong>Country:</strong> ${userData.attrs?.country || 'N/A'}</p>
            <p><strong>Audit Ratio:</strong> ${userData.auditRatio?.toFixed(1) || '0'}</p>
            <p><strong>Total XP:</strong> ${userData.totalUp ? Math.round(userData.totalUp / 1000) + 'k' : '0'}</p>
            <p><strong>CPR Number:</strong> ${userData.attrs?.CPRnumber || 'N/A'}</p>
            <p><strong>Phone Number:</strong> ${userData.attrs?.PhoneNumber || 'N/A'}</p>
            <p><strong>Gender:</strong> ${userData.attrs?.genders || 'N/A'}</p>
            <p><strong>Address:</strong> ${userData.attrs?.addressCity || 'N/A'}</p>
            <p><strong>Birthday:</strong> ${userData.attrs?.placeOfBirth || 'N/A'}</p>
        `;



        // Assemble the components
        userInfo.appendChild(userName);
        userInfo.appendChild(profileInfo);

        profileSection.appendChild(imageContainer);
        profileSection.appendChild(userInfo);
        profileContent.appendChild(profileSection);
        page.appendChild(profileContent);

    } catch (error) {
        console.error('Error creating profile page:', error);
        page.innerHTML = '<p class="error">Error loading profile data</p>';
    }

    return page;
};

export default createProfilePage;