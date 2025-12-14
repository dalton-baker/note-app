import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

const ATTACHMENTS_DIR = '/notes/.attachments';

export async function POST({ request }) {
	console.log('Upload image request received');
	console.log('Content-Type:', request.headers.get('content-type'));
	
	try {
		const formData = await request.formData();
		console.log('FormData parsed');
		
		const file = formData.get('image');
		console.log('File from formData:', file ? 'exists' : 'null', file instanceof File);
		
		if (!file || !(file instanceof File)) {
			console.log('No valid file found');
			return json({ error: 'No image file provided' }, { status: 400 });
		}
		
		console.log('File details:', { name: file.name, type: file.type, size: file.size });
		
		// Ensure attachments directory exists
		if (!fs.existsSync(ATTACHMENTS_DIR)) {
			console.log('Creating attachments directory');
			fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
		}
		
		// Get file extension
		const ext = path.extname(file.name) || '.png';
		const filename = `image-${randomUUID()}${ext}`;
		const filePath = path.join(ATTACHMENTS_DIR, filename);
		
		// Convert file to buffer and save
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		fs.writeFileSync(filePath, buffer);
		
		// Return the attachment path
		return json({ 
			success: true, 
			path: `/.attachments/${filename}`,
			filename 
		});
	} catch (error) {
		console.error('Error uploading image:', error);
		return json({ error: 'Failed to upload image' }, { status: 500 });
	}
}
