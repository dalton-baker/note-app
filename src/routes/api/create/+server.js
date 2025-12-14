import fs from 'fs';
import path from 'path';

const NOTES_DIR = '/notes';

export async function POST({ request }) {
	try {
		const { path: itemPath, parentPath } = await request.json();

		if (!itemPath || !itemPath.trim()) {
			return new Response(JSON.stringify({ 
				success: false, 
				error: 'Name is required' 
			}), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		let fullPath;
		let resultPath;
		
		if (parentPath) {
			// Creating a child note under a parent
			// Parent structure: parent.md and parent/ folder
			const parentNotePath = path.join(NOTES_DIR, parentPath + '.md');
			const parentFolderPath = path.join(NOTES_DIR, parentPath);
			
			// Ensure parent note exists
			if (!fs.existsSync(parentNotePath)) {
				return new Response(JSON.stringify({ 
					success: false, 
					error: 'Parent note does not exist' 
				}), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			
			// Create parent folder if it doesn't exist
			if (!fs.existsSync(parentFolderPath)) {
				fs.mkdirSync(parentFolderPath, { recursive: true });
			}
			
			// Create child note inside parent folder
			fullPath = path.join(parentFolderPath, itemPath + '.md');
			resultPath = path.join(parentPath, itemPath);
		} else {
			// Creating a root-level note
			fullPath = path.join(NOTES_DIR, itemPath + '.md');
			resultPath = itemPath;
		}

		if (fs.existsSync(fullPath)) {
			return new Response(JSON.stringify({ 
				success: false, 
				error: 'Note already exists' 
			}), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Ensure parent directory exists
		const dir = path.dirname(fullPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// Create note file with template
		const template = `# ${itemPath}\n\nStart writing your note here...\n`;
		fs.writeFileSync(fullPath, template, 'utf-8');

		return new Response(JSON.stringify({ 
			success: true,
			path: resultPath
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Error creating note:', error);
		return new Response(JSON.stringify({ 
			success: false, 
			error: error.message 
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
