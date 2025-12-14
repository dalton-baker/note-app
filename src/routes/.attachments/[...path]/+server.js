import fs from 'fs';
import path from 'path';

const ATTACHMENTS_DIR = '/notes/.attachments';

export async function GET({ params }) {
	const filePath = path.join(ATTACHMENTS_DIR, params.path);
	
	try {
		// Check if file exists
		if (!fs.existsSync(filePath)) {
			return new Response('File not found', { status: 404 });
		}
		
		// Read the file
		const fileBuffer = fs.readFileSync(filePath);
		
		// Determine content type based on extension
		const ext = path.extname(filePath).toLowerCase();
		const contentTypes = {
			'.png': 'image/png',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
			'.svg': 'image/svg+xml'
		};
		const contentType = contentTypes[ext] || 'application/octet-stream';
		
		return new Response(fileBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000'
			}
		});
	} catch (error) {
		console.error('Error serving attachment:', error);
		return new Response('Error serving file', { status: 500 });
	}
}
