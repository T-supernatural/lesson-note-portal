# Rich Text Editor Setup Guide

## Supabase Storage Bucket Setup

To enable image and file uploads in the rich text editor, you need to create a storage bucket in Supabase:

### Step 1: Create the Storage Bucket
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name it: `lesson-content`
5. Set it as **Public** (so URLs are directly accessible)
6. Click **Create bucket**

### Step 2: Set Storage Policies (if needed)
If automatic policies don't work, add these policies to the bucket:

**For SELECT (reading files):**
- Policy Name: Public Select
- Definition: `true`

**FOR INSERT (uploading files):**
- Policy Name: Teachers Can Upload
- Definition: `auth.role() = 'authenticated'`

> Note: If you see Supabase upload errors such as `new row violates row-level security policy`, this usually means the bucket policies are not allowing authenticated inserts. Confirm the bucket is public and INSERT is permitted for authenticated users.

### Step 3: Verify Upload Functionality
1. Create a new lesson note
2. In the "Main Lesson Content" editor, click the image icon in the toolbar
3. Select an image to upload
4. Confirm the image appears in the editor

## Features Enabled

The rich text editor now supports:

✅ **Text Formatting**
- Bold, Italic, Underline, Strikethrough
- Headings (H1, H2)
- Blockquotes and Code blocks

✅ **Lists**
- Ordered (numbered) lists
- Unordered (bullet) lists

✅ **Advanced Formatting**
- Text alignment (left, center, right, justify)
- Text colors and highlighting
- Links with custom URLs

✅ **Content**
- Image uploads (PNG, JPG, GIF, etc.)
- File attachments (PDF, DOCX)
- Tables (currently disabled due to compatibility issues)

✅ **Copy/Paste**
- Microsoft Word formatting is preserved
- HTML formatting is auto-converted to editor format

✅ **Display & Export**
- All formatting is preserved when saved
- Formatting displays in teacher preview
- Formatting displays in admin review
- PDF export preserves all formatting

## Known Issues

- **Table Support**: Table functionality is currently disabled due to compatibility issues with the quill-table module. This will be addressed in a future update.

## Backwards Compatibility

✅ Existing plain text lesson notes will still load and display normally
✅ Old notes can be edited and new formatting can be added
✅ No database changes required
✅ No breaking changes

## Usage Examples

### Teachers Can Now:
1. Create formatted lesson content with rich text
2. Insert images directly in lesson content
3. Use numbered and bullet lists
4. Add headings and subheadings
5. Attach PDF documents and Word files
6. Apply text colors for emphasis
7. Add blockquotes for important notes

### Example Lesson Note Structure (with rich content):

**Title:** Fractions in Everyday Life

**Main Lesson Content:**
- H2 Heading: "Learning Objectives"
  - Bullet list of objectives
- H2 Heading: "Introduction Activity"
  - Formatted text with images
- H2 Heading: "Teaching Methods"
  - Numbered list of steps

## Troubleshooting

### Images won't upload
- Check that the `lesson-content` bucket exists in Supabase Storage
- Verify bucket is set to "Public"
- Check browser console for error messages

### Formatting disappears when saving
- This shouldn't happen - please report if it occurs
- Quill editor stores formatting in HTML format

### Old notes show as plain text
- This is normal and expected
- They will display correctly, just without rich formatting
- You can re-edit them to add rich formatting

## Support

For questions or issues, refer to:
- [Quill Editor Documentation](https://quilljs.com/)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [React Quill Docs](https://react-quill.js.org/)
