/**
 * Generate avatar URL for user
 * Uses uploaded profile photo if available, otherwise generates avatar from initials
 * @param {string} profilePhoto - User's profile photo URL
 * @param {string} name - User's name or company name
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (profilePhoto, name = 'User') => {
  if (profilePhoto) {
    return profilePhoto;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200`;
};
