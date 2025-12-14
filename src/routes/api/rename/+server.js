import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const NOTES_DIR = '/notes';

export async function POST({ request }) {
	try {
		const { oldPath, newName } = await request.json();
		
		console.log('Rename request:', { oldPath, newName, cwd: process.cwd(), notesDir: NOTES_DIR });
		
		if (!oldPath || !newName) {
			return json({ error: 'Old path and new name are required' }, { status: 400 });
		}
		
		// Validate new name (no slashes, etc)
		if (newName.includes('/') || newName.includes('\\')) {
			return json({ error: 'Invalid name: cannot contain slashes' }, { status: 400 });
		}
		
		const oldMdPath = path.join(NOTES_DIR, `${oldPath}.md`);
		const oldFolderPath = path.join(NOTES_DIR, oldPath);
		
		console.log('Looking for note at:', oldMdPath);
		console.log('File exists:', fs.existsSync(oldMdPath));
		
		// Check if note exists
		if (!fs.existsSync(oldMdPath)) {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		
		// Determine new path (same parent, new name)
		const parentDir = path.dirname(oldPath);
		const newPath = parentDir === '.' ? newName : path.join(parentDir, newName);
		const newMdPath = path.join(NOTES_DIR, `${newPath}.md`);
		const newFolderPath = path.join(NOTES_DIR, newPath);
		
		// Check if new name already exists
		if (fs.existsSync(newMdPath)) {
			return json({ error: 'A note with that name already exists' }, { status: 409 });
		}
		
		// Rename the .md file
		fs.renameSync(oldMdPath, newMdPath);
		
		// Rename the folder if it exists
		if (fs.existsSync(oldFolderPath) && fs.statSync(oldFolderPath).isDirectory()) {
			fs.renameSync(oldFolderPath, newFolderPath);
		}
		
		return json({ success: true, newPath, message: 'Note renamed successfully' });
	} catch (error) {
		console.error('Error renaming note:', error);
		return json({ error: 'Failed to rename note' }, { status: 500 });
	}
}
