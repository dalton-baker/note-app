import fs from 'fs';
import path from 'path';

const NOTES_DIR = path.join(process.cwd(), 'notes');

export async function POST({ request, params }) {
	const notePath = params.path;
	
	// Always just write to the .md file
	let fullPath = path.join(NOTES_DIR, notePath);
	if (!fullPath.endsWith('.md')) {
		fullPath += '.md';
	}

	try {
		const { content } = await request.json();

		// Ensure directory exists
		const dir = path.dirname(fullPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// Write the file
		fs.writeFileSync(fullPath, content, 'utf-8');

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Error saving note:', error);
		return new Response(JSON.stringify({ 
			success: false, 
			error: error.message 
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}

export async function DELETE({ params }) {
	const notePath = params.path;
	
	const mdFilePath = path.join(NOTES_DIR, `${notePath}.md`);
	const folderPath = path.join(NOTES_DIR, notePath);
	
	try {
		// Check if note exists
		if (!fs.existsSync(mdFilePath)) {
			return new Response(JSON.stringify({ 
				success: false, 
				error: 'Note not found' 
			}), {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}
		
		// Delete the .md file
		fs.unlinkSync(mdFilePath);
		
		// Delete the folder if it exists (cascade delete children)
		if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
			fs.rmSync(folderPath, { recursive: true, force: true });
		}
		
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Error deleting note:', error);
		return new Response(JSON.stringify({ 
			success: false, 
			error: error.message 
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}
