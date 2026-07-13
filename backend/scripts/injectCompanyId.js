import fs from 'fs';
import path from 'path';

const MODELS_DIR = path.join(process.cwd(), 'src', 'models');
const QUOTATION_DIR = path.join(MODELS_DIR, 'quotation');

// Files that should NOT receive the companyId injection
const EXCLUSION_LIST = [
    'company.model.js',
    'city.model.js',
    'state.model.js',
    'country.model.js',
    'day.model.js',       // Embedded schema
    'policy.js'           // It's in common/ maybe, but just in case
];

// Files we know are already updated or don't need it
const ALREADY_UPDATED = [
    'lead.model.js',
    'package.model.js'
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Process subdirectories
            processDirectory(fullPath);
        } else if (file.endsWith('.js')) {
            if (EXCLUSION_LIST.includes(file) || ALREADY_UPDATED.includes(file)) {
                console.log(`Skipping: ${file}`);
                continue;
            }

            injectCompanyId(fullPath, file);
        }
    }
}

function injectCompanyId(filePath, fileName) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if companyId already exists to avoid duplicates
    if (content.includes('companyId:')) {
        console.log(`Already has companyId: ${fileName}`);
        return;
    }

    // Regex to find the start of the Schema definition
    // Matches: new mongoose.Schema({ OR new Schema({
    const schemaRegex = /new\s+(?:mongoose\.)?Schema\s*\(\s*\{/;
    const match = content.match(schemaRegex);

    if (match) {
        const injectionPoint = match.index + match[0].length;
        
        const injectedString = `\n    companyId: { \n      type: mongoose.Schema.Types.ObjectId, \n      ref: 'Company', \n      required: true \n    },`;
        
        const newContent = content.slice(0, injectionPoint) + injectedString + content.slice(injectionPoint);
        
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Injected companyId into: ${fileName}`);
    } else {
        console.log(`⚠️ Could not find Schema definition in: ${fileName}`);
    }
}

console.log("Starting CompanyId Injection Script...");
processDirectory(MODELS_DIR);
console.log("Finished successfully!");
