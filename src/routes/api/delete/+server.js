import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const NOTES_DIR = '/notes';

export async function POST({ request }) {
	try {
		const { notePath } = await request.json();
		
		if (!notePath) {
			return json({ error: 'Note path is required' }, { status: 400 });
		}

		const mdFilePath = path.join(NOTES_DIR, `${notePath}.md`);
		const folderPath = path.join(NOTES_DIR, notePath);
		
		// Check if note exists
		if (!fs.existsSync(mdFilePath)) {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		
		// Delete the .md file
		fs.unlinkSync(mdFilePath);
		
		// Delete the folder if it exists (cascade delete children)
		if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
			fs.rmSync(folderPath, { recursive: true, force: true });
		}
		
		return json({ success: true, message: 'Note deleted successfully' });
	} catch (error) {
		console.error('Error deleting note:', error);
		return json({ error: 'Failed to delete note' }, { status: 500 });
	}
}
