/**
 * Brevo Setup Script
 * Initializes all Brevo folders, contact lists, and email template folders
 * 
 * Usage: pnpm tsx scripts/brevo-setup.ts
 */

// Load environment variables before any imports that use them
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  const envFiles = ['.env.development.local', '.env.local', '.env'];
  for (const file of envFiles) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
      break;
    } catch {}
  }
}
loadEnv();

import BrevoClient from '../lib/brevo/client';
import { BREVO_FOLDERS, BREVO_LISTS, BREVO_EMAIL_TEMPLATE_FOLDERS } from '../lib/brevo/config';

const client = new BrevoClient();

interface FolderMapping {
  [key: string]: number;
}

let folderIdMap: FolderMapping = {};
let listIdMap: { [key: string]: number } = {};

async function setupFolders(): Promise<void> {
  console.log('\n📁 Setting up Brevo folders...\n');

  try {
    const existing = await client.getFolders();
    console.log(`Found ${existing.folders.length} existing folders`);

    for (const [key, folder] of Object.entries(BREVO_FOLDERS)) {
      // Skip disabled folders unless explicitly needed
      if ('isEnabled' in folder && !folder.isEnabled) {
        console.log(`⊘ Skipping disabled folder: ${folder.name}`);
        continue;
      }

      // Check if folder already exists
      const existingFolder = existing.folders.find(
        (f) => f.name === folder.name
      );

      if (existingFolder) {
        console.log(`✓ Folder exists: ${folder.name} (ID: ${existingFolder.id})`);
        folderIdMap[key] = existingFolder.id;
      } else {
        try {
          const created = await client.createFolder(folder.name);
          console.log(`✓ Created folder: ${folder.name} (ID: ${created.id})`);
          folderIdMap[key] = created.id;
        } catch (error) {
          console.error(`✗ Failed to create folder ${folder.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to set up folders:', error);
    throw error;
  }
}

async function setupContactLists(): Promise<void> {
  console.log('\n📋 Setting up Brevo contact lists...\n');

  try {
    const existing = await client.getLists();
    console.log(`Found ${existing.lists.length} existing lists`);

    for (const [key, list] of Object.entries(BREVO_LISTS)) {
      const folderKey = list.folder as keyof typeof BREVO_FOLDERS;
      const folderId = folderIdMap[folderKey];

      // Check if list already exists
      const existingList = existing.lists.find((l) => l.name === list.name);

      if (existingList) {
        console.log(`✓ List exists: ${list.name} (ID: ${existingList.id})`);
        listIdMap[key] = existingList.id;
      } else {
        try {
          const created = await client.createList(list.name, folderId?.toString());
          console.log(`✓ Created list: ${list.name} (ID: ${created.id})`);
          listIdMap[key] = created.id;
        } catch (error) {
          console.error(`✗ Failed to create list ${list.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to set up contact lists:', error);
    throw error;
  }
}

async function setupEmailTemplateFolders(): Promise<void> {
  console.log('\n📧 Note: Email template folders should be created manually in Brevo UI\n');

  const folders = BREVO_EMAIL_TEMPLATE_FOLDERS;
  console.log('Create the following template folders in Brevo:');
  folders.forEach((folder, index) => {
    console.log(`  ${index + 1}. ${folder}`);
  });

  console.log(
    '\nThese folders will organize your email templates by category.'
  );
}

async function saveMappings(): Promise<void> {
  console.log('\n💾 Saving ID mappings...\n');

  const mappings = {
    folders: folderIdMap,
    lists: listIdMap,
    createdAt: new Date().toISOString(),
  };

  // Store in environment or database for runtime reference
  console.log('ID Mappings (save these for reference):');
  console.log(JSON.stringify(mappings, null, 2));

  // In production, you'd store this in your database or environment
  // For now, just log it
}

async function main(): Promise<void> {
  console.log('🚀 Starting Brevo setup...\n');

  try {
    // Verify API key
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error(
        'BREVO_API_KEY environment variable is not set. Please set it before running this script.'
      );
    }
    console.log('✓ BREVO_API_KEY found\n');

    // Run setup in sequence
    await setupFolders();
    await setupContactLists();
    await setupEmailTemplateFolders();
    await saveMappings();

    console.log('\n✅ Brevo setup completed successfully!\n');
    console.log(
      'Next steps:\n' +
        '1. Create email template folders in Brevo UI\n' +
        '2. Create email templates in Brevo\n' +
        '3. Set up automation workflows\n' +
        '4. Store ID mappings in your database or environment\n'
    );
  } catch (error) {
    console.error('\n❌ Brevo setup failed:', error);
    process.exit(1);
  }
}

main();
