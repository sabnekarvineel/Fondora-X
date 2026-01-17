# TODO: Add Reply Comments Feature

## Backend Changes
- [ ] Modify backend/models/Post.js: Add `parentComment` field to commentSchema
- [ ] Modify backend/controllers/postController.js: Update addComment to handle parentComment

## Frontend Changes
- [ ] Modify frontend/src/components/PostCard.jsx: Add reply UI and logic (Reply button, reply form, indented display)

## Testing
- [ ] Test reply functionality: Create posts, add comments, reply to comments
- [ ] Verify replies display correctly
- [ ] Ensure no breaking changes to existing functionality
