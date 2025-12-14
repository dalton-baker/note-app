import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const NOTES_DIR = '/notes';

export function load({ params }) {
	const notePath = params.path;
	
	// Construct the full file path - always just .md file
	let fullPath = path.join(NOTES_DIR, notePath);
	if (!fullPath.endsWith('.md')) {
		fullPath += '.md';
	}
	
	try {
		if (!fs.existsSync(fullPath)) {
			return {
				error: 'Note not found',
				content: '',
				htmlContent: '',
				title: 'Not Found',
				path: notePath
			};
		}
		
		const content = fs.readFileSync(fullPath, 'utf-8');
		
		// Extract title from filename or first heading
		const fileName = path.basename(notePath);
		let title = fileName;
		
		// Try to extract title from first # heading
		const headingMatch = content.match(/^#\s+(.+)$/m);
		if (headingMatch) {
			title = headingMatch[1];
		}

		return {
			content,
			htmlContent: marked(content),
			title,
			path: notePath,
			fullPath
		};
	} catch (error) {
		console.error('Error reading note:', error);
		return {
			error: 'Error reading note: ' + error.message,
			content: '',
			htmlContent: '',
			title: 'Error',
			path: notePath
		};
	}
}
