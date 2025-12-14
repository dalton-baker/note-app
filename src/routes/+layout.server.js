import fs from 'fs';
import path from 'path';

const NOTES_DIR = '/notes';

function readNotesDirectory(dirPath, relativeTo = NOTES_DIR) {
	try {
		// Check if directory exists
		if (!fs.existsSync(dirPath)) {
			console.log('Notes directory does not exist:', dirPath);
			return [];
		}

		const items = fs.readdirSync(dirPath, { withFileTypes: true });
		const result = [];
		const filesWithFolders = new Set();
		
		// First pass: identify all .md files that have matching folders
		for (const item of items) {
			if (item.isFile() && item.name.endsWith('.md')) {
				const baseName = item.name.replace(/\.md$/, '');
				const childFolder = path.join(dirPath, baseName);
				
				if (fs.existsSync(childFolder) && fs.statSync(childFolder).isDirectory()) {
					filesWithFolders.add(baseName);
				}
			}
		}

		// Second pass: build the result
		for (const item of items) {
			// Skip hidden files
			if (item.name.startsWith('.')) continue;

			const fullPath = path.join(dirPath, item.name);
			const relativePath = path.relative(relativeTo, fullPath);

			if (item.isFile() && item.name.endsWith('.md')) {
				const baseName = item.name.replace(/\.md$/, '');
				const hasChildren = filesWithFolders.has(baseName);
				
				let children = [];
				if (hasChildren) {
					const childFolder = path.join(dirPath, baseName);
					children = readNotesDirectory(childFolder, relativeTo);
				}

				result.push({
					name: baseName,
					path: relativePath.replace(/\.md$/, ''),
					hasChildren: hasChildren,
					children: children
				});
			} else if (item.isDirectory() && !filesWithFolders.has(item.name)) {
				// Orphaned folder without a parent .md file
				const children = readNotesDirectory(fullPath, relativeTo);
				
				if (children.length > 0) {
					result.push({
						name: item.name,
						path: relativePath,
						hasChildren: true,
						children: children,
						isOrphan: true
					});
				}
			}
		}

		return result;
	} catch (error) {
		console.error('Error reading notes directory:', error);
		return [];
	}
}

export function load() {
	const notes = readNotesDirectory(NOTES_DIR);
	
	return {
		notes
	};
}
