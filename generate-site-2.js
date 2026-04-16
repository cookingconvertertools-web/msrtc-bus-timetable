const fs = require('fs');
const path = require('path');

class SiteGenerator {
    constructor() {
        this.baseDir = __dirname;
        this.dataDir = path.join(this.baseDir, 'data');
        this.publicDir = path.join(this.baseDir, 'public');
        this.templateDir = path.join(this.baseDir, 'templates');
        this.blogsDir = path.join(this.dataDir, 'blogs');
        this.assetsDir = path.join(this.baseDir, 'assets');
        this.imagesDir = path.join(this.assetsDir, 'img');
        this.publicImagesDir = path.join(this.publicDir, 'assets', 'images');
        this.urlsDir = path.join(this.assetsDir, 'urls');
        this.publicUrlsDir = path.join(this.publicDir, 'assets', 'urls');

        // Ensure directories exist
        [this.templateDir, this.blogsDir, this.imagesDir, this.publicImagesDir, this.urlsDir, this.publicUrlsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Copy images from assets/img to public/assets/images (including favicon)
        this.copyImagesToPublic();

        // Copy URLs from assets/urls to public/assets/urls
        this.copyUrlsToPublic();

        this.config = this.loadConfig();
        this.content = this.loadContent();
        this.ads = this.loadAds();
        this.blogs = this.loadBlogs();
        this.data = {
            divisions: {},
            districts: {},
            tehsils: {},
            depots: {}
        };

        // Load related depots data
        this.relatedDepotsData = this.loadRelatedDepots();

        // Load URL constants
        this.urlConstants = this.loadUrlConstants();

        // Load all data
        this.loadAllData();
    }

    copyImagesToPublic() {
        console.log('🖼️  Copying images from assets to public folder...');

        if (fs.existsSync(this.imagesDir)) {
            const imageFiles = fs.readdirSync(this.imagesDir);

            // First, clean up old favicon files from public directory
            if (fs.existsSync(this.publicDir)) {
                const publicFiles = fs.readdirSync(this.publicDir);

                // Define favicon patterns to look for
                const faviconPatterns = [
                    'favicon', 'icon', 'favicon-v', 'favicon_', 'favicon.'
                ];

                // Find and remove old favicon files
                publicFiles.forEach(file => {
                    const lowerFile = file.toLowerCase();
                    const isFavicon = faviconPatterns.some(pattern =>
                        lowerFile.includes(pattern)
                    ) || lowerFile.endsWith('.ico');

                    if (isFavicon) {
                        const filePath = path.join(this.publicDir, file);
                        try {
                            fs.unlinkSync(filePath);
                            console.log(`   🗑️  Removed old favicon: ${file}`);
                        } catch (error) {
                            console.error(`   ✗ Error removing old favicon ${file}:`, error.message);
                        }
                    }
                });
            }

            // First, look for favicon images in CURRENT assets directory
            const faviconFiles = imageFiles.filter(file => {
                const lowerFile = file.toLowerCase();
                return lowerFile.includes('favicon') ||
                       lowerFile.includes('icon') ||
                       lowerFile.endsWith('.ico');
            });

            // Copy favicon images to root of public directory
            faviconFiles.forEach(file => {
                const sourcePath = path.join(this.imagesDir, file);
                const destPath = path.join(this.publicDir, file);

                try {
                    // Ensure destination directory exists
                    if (!fs.existsSync(this.publicDir)) {
                        fs.mkdirSync(this.publicDir, { recursive: true });
                    }

                    fs.copyFileSync(sourcePath, destPath);
                    console.log(`   ✓ Copied favicon: ${file} → ${file}`);
                } catch (error) {
                    console.error(`   ✗ Error copying favicon ${file}:`, error.message);
                }
            });

            // Then copy regular images to assets/images
            imageFiles.forEach(file => {
                const sourcePath = path.join(this.imagesDir, file);
                const destPath = path.join(this.publicImagesDir, file);

                // Skip if already processed as favicon
                if (faviconFiles.includes(file)) {
                    return;
                }

                try {
                    // Only copy if it's an image file
                    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].some(ext =>
                        file.toLowerCase().endsWith(ext))) {

                        // Ensure destination directory exists
                        if (!fs.existsSync(this.publicImagesDir)) {
                            fs.mkdirSync(this.publicImagesDir, { recursive: true });
                        }

                        fs.copyFileSync(sourcePath, destPath);
                        console.log(`   ✓ Copied: ${file} → assets/images/${file}`);
                    }
                } catch (error) {
                    console.error(`   ✗ Error copying ${file}:`, error.message);
                }
            });

            console.log(`   Images copied to: ${this.publicImagesDir}`);

            // Report favicon status
            if (faviconFiles.length > 0) {
                console.log(`   ✅ Favicon files copied to root: ${faviconFiles.join(', ')}`);
            } else {
                console.log('   ℹ️  No favicon files found in assets/img directory');
                console.log('   💡 Tip: Add favicon.ico, favicon.png, or icon.png to assets/img/');
            }
        } else {
            console.log('   ℹ️  No assets/img directory found');
        }
    }

    copyUrlsToPublic() {
        console.log('🔗 Copying URL constants from assets/urls to public folder...');

        if (fs.existsSync(this.urlsDir)) {
            const urlFiles = fs.readdirSync(this.urlsDir);

            urlFiles.forEach(file => {
                const sourcePath = path.join(this.urlsDir, file);
                const destPath = path.join(this.publicUrlsDir, file);

                try {
                    // Ensure destination directory exists
                    if (!fs.existsSync(this.publicUrlsDir)) {
                        fs.mkdirSync(this.publicUrlsDir, { recursive: true });
                    }

                    fs.copyFileSync(sourcePath, destPath);
                    console.log(`   ✓ Copied URL file: ${file}`);
                } catch (error) {
                    console.error(`   ✗ Error copying URL file ${file}:`, error.message);
                }
            });

            console.log(`   URL constants copied to: ${this.publicUrlsDir}`);
        } else {
            console.log('   ℹ️  No assets/urls directory found');
        }
    }

    loadUrlConstants() {
        console.log('📂 Loading URL constants...');
        const urlConstants = {};

        if (fs.existsSync(this.urlsDir)) {
            const urlFiles = fs.readdirSync(this.urlsDir).filter(f => f.endsWith('.js'));

            urlFiles.forEach(file => {
                try {
                    const filePath = path.join(this.urlsDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');

                    // Extract constants from JavaScript file
                    const constantRegex = /const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g;
                    let match;

                    while ((match = constantRegex.exec(content)) !== null) {
                        const [, constantName, constantValue] = match;
                        urlConstants[constantName] = constantValue;
                        console.log(`   ✓ Loaded URL constant: ${constantName} = ${constantValue}`);
                    }
                } catch (error) {
                    console.error(`   ✗ Error loading URL file ${file}:`, error.message);
                }
            });
        }

        console.log(`   Loaded ${Object.keys(urlConstants).length} URL constants`);
        return urlConstants;
    }

    loadAllData() {
        console.log('📂 Loading data files...');

        const dataTypes = ['divisions', 'districts', 'tehsils', 'depots'];
        dataTypes.forEach(type => {
            const typeDir = path.join(this.dataDir, type);
            if (fs.existsSync(typeDir)) {
                const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.json'));
                files.forEach(file => {
                    try {
                        const filePath = path.join(typeDir, file);
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        this.data[type][content.id] = content;
                        console.log(`   ✓ Loaded ${type.slice(0, -1)}: ${content.name || content.id}`);
                    } catch (error) {
                        console.error(`   ✗ Error loading ${file}:`, error.message);
                    }
                });
            }
        });

        console.log(`✅ Loaded data: ${Object.keys(this.data.divisions).length} divisions, ${Object.keys(this.data.districts).length} districts, ${Object.keys(this.data.tehsils).length} tehsils, ${Object.keys(this.data.depots).length} depots, ${this.blogs.length} blogs, ${Object.keys(this.urlConstants).length} URL constants`);
    }

    loadRelatedDepots() {
        const relatedDepotsDir = path.join(this.dataDir, 'related-depots');
        const relatedDepots = {};

        if (fs.existsSync(relatedDepotsDir)) {
            const files = fs.readdirSync(relatedDepotsDir).filter(f => f.endsWith('.json'));

            console.log('📂 Loading related depots data...');

            files.forEach(file => {
                try {
                    const filePath = path.join(relatedDepotsDir, file);
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                    // Support both formats:
                    // 1. New format with full hierarchy
                    // 2. Old format with just depot IDs

                    if (Array.isArray(content)) {
                        content.forEach(item => {
                            const depotId = item.depots_id || item.depot_id || item.depot;
                            if (depotId) {
                                // Initialize array if not exists
                                if (!relatedDepots[depotId]) {
                                    relatedDepots[depotId] = [];
                                }

                                // Check if it's the new format (with hierarchy)
                                if (item.related_depots && Array.isArray(item.related_depots)) {
                                    // New format: array of objects with hierarchy
                                    relatedDepots[depotId].push(...item.related_depots.map(related => {
                                        // Ensure all required fields
                                        return {
                                            depot_id: related.depot_id || related.depots_id || related.depot,
                                            division_id: related.division_id || null,
                                            district_id: related.district_id || null,
                                            tehsil_id: related.tehsil_id || null
                                        };
                                    }));
                                } else if (item.related_depots_id) {
                                    // Old format: just array of depot IDs
                                    const relatedIds = item.related_depots_id;
                                    if (Array.isArray(relatedIds)) {
                                        relatedDepots[depotId].push(...relatedIds.map(depotId => ({
                                            depot_id: depotId
                                            // hierarchy will be looked up later
                                        })));
                                    } else if (typeof relatedIds === 'string') {
                                        // Handle comma-separated string
                                        relatedDepots[depotId].push(
                                            ...relatedIds.split(',').map(id => id.trim()).map(depotId => ({
                                                depot_id: depotId
                                            }))
                                        );
                                    }
                                }
                            }
                        });
                    } else if (typeof content === 'object') {
                        // Single object format
                        const depotId = content.depots_id || content.depot_id || content.depot;
                        if (depotId) {
                            relatedDepots[depotId] = [];

                            if (content.related_depots && Array.isArray(content.related_depots)) {
                                // New format
                                relatedDepots[depotId] = content.related_depots.map(related => ({
                                    depot_id: related.depot_id || related.depots_id || related.depot,
                                    division_id: related.division_id || null,
                                    district_id: related.district_id || null,
                                    tehsil_id: related.tehsil_id || null
                                }));
                            } else if (content.related_depots_id) {
                                // Old format
                                const relatedIds = content.related_depots_id;
                                if (Array.isArray(relatedIds)) {
                                    relatedDepots[depotId] = relatedIds.map(depotId => ({
                                        depot_id: depotId
                                    }));
                                } else if (typeof relatedIds === 'string') {
                                    relatedDepots[depotId] = relatedIds.split(',').map(id => id.trim()).map(depotId => ({
                                        depot_id: depotId
                                    }));
                                }
                            }
                        }
                    }

                    console.log(`   ✓ Loaded related depots from: ${file}`);
                } catch (error) {
                    console.error(`   ✗ Error loading related depots file ${file}:`, error.message);
                }
            });

            // Now, for any related depots that don't have hierarchy info,
            // try to find it from the actual depot data
            Object.keys(relatedDepots).forEach(depotId => {
                relatedDepots[depotId] = relatedDepots[depotId].map(related => {
                    // If already has full hierarchy, return as-is
                    if (related.division_id && related.district_id && related.tehsil_id) {
                        return related;
                    }

                    // Try to find the depot and get its hierarchy
                    const depot = this.data.depots[related.depot_id];
                    if (depot) {
                        const tehsil = this.data.tehsils[depot.tehsil_id];
                        const district = tehsil ? this.data.districts[tehsil.district_id] : null;
                        const division = district ? this.data.divisions[district.division_id] : null;

                        return {
                            depot_id: related.depot_id,
                            division_id: division ? division.id : null,
                            district_id: district ? district.id : null,
                            tehsil_id: tehsil ? tehsil.id : null
                        };
                    }

                    // If depot not found, return with null hierarchy
                    return related;
                }).filter(related => related.depot_id); // Remove any null depot IDs
            });

            // Remove duplicates
            Object.keys(relatedDepots).forEach(depotId => {
                const unique = [];
                const seen = new Set();
                relatedDepots[depotId].forEach(related => {
                    const key = `${related.depot_id}-${related.division_id}-${related.district_id}-${related.tehsil_id}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(related);
                    }
                });
                relatedDepots[depotId] = unique;
            });

            console.log(`   Loaded related depots for ${Object.keys(relatedDepots).length} depots`);
        }

        return relatedDepots;
    }

    loadConfig() {
        const configPath = path.join(this.baseDir, 'site-config.json');
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.error('❌ Error loading site-config.json:', error.message);
            return {
                base_url: 'http://localhost:3000',
                site_name: 'MSRTC Bus Timetable',
                ads: { top_ad: { enabled: false }, middle_ad: { enabled: false }, footer_ad: { enabled: false } }
            };
        }
    }

    loadContent() {
        const contentPath = path.join(this.baseDir, 'content.json');
        try {
            return JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        } catch (error) {
            console.error('❌ Error loading content.json:', error.message);
            return {
                homepage: {
                    title: 'MSRTC Bus Timetable',
                    subtitle: 'Find accurate bus schedules across Maharashtra',
                    content: '<p>Welcome to the official MSRTC bus timetable portal.</p>',
                    seo: {
                        title: 'MSRTC Bus Timetable - Maharashtra State Transport',
                        description: 'Real-time MSRTC bus schedules and timetables',
                        keywords: 'MSRTC, Maharashtra bus, bus schedule'
                    }
                }
            };
        }
    }

    loadAds() {
        console.log('📢 Loading ads configuration...');

        // Try multiple possible locations: data/ads.json, data/ads/ads.json
        const possiblePaths = [
            path.join(this.dataDir, 'ads.json'),
            path.join(this.dataDir, 'ads', 'ads.json')
        ];

        for (const adsPath of possiblePaths) {
            if (fs.existsSync(adsPath)) {
                try {
                    const adsData = JSON.parse(fs.readFileSync(adsPath, 'utf8'));
                    if (Array.isArray(adsData)) {
                        console.log(`   ✓ Loaded ${adsData.length} ads from ${path.relative(this.baseDir, adsPath)}`);
                        return adsData;
                    } else {
                        console.warn(`   ⚠️  Ads file exists but is not an array: ${adsPath}`);
                    }
                } catch (error) {
                    console.error(`   ✗ Error loading ads from ${adsPath}:`, error.message);
                }
            }
        }

        console.log('   ℹ️  No ads.json found, proceeding without ads');
        return [];
    }

    loadBlogs() {
        const blogs = [];
        if (fs.existsSync(this.blogsDir)) {
            const blogFiles = fs.readdirSync(this.blogsDir).filter(f => f.endsWith('.json'));
            blogFiles.forEach(file => {
                try {
                    const blogPath = path.join(this.blogsDir, file);
                    const blogContent = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
                    blogContent.id = file.replace('.json', '');

                    // Process blog content - convert markdown to HTML
                    if (blogContent.content) {
                        blogContent.content = this.processBlogContent(blogContent.content);
                    }

                    blogs.push(blogContent);
                    console.log(`   ✓ Loaded blog: ${blogContent.title}`);
                } catch (error) {
                    console.error(`   ✗ Error loading blog ${file}:`, error.message);
                }
            });
        }
        return blogs.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
    }

    processBlogContent(content) {
        let html = content;

        // Handle code blocks
        const codeBlocks = [];
        html = html.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
            const id = `codeblock-${codeBlocks.length}`;
            codeBlocks.push({
                id: id,
                content: `<pre><code>${this.escapeHtml(codeContent.trim())}</code></pre>`
            });
            return `###CODEBLOCK###${id}###CODEBLOCK###`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Headers
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$6</h6>');

        // Bold and Italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(?!\*)(.*?)(?<!\*)\*/g, '<em>$1</em>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // Tables
        html = this.processTables(html);

        // Lists
        html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
        html = this.processLists(html);

        // Links - make them clickable with URL constants
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, linkUrl) => {
            // Check if it's a relative image path
            if (linkUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                // Handle image links
                return this.processImageLink(linkText, linkUrl);
            } else {
                // Handle regular links - check if it's a URL constant
                const constantMatch = linkUrl.match(/^([A-Z0-9]+)$/);
                if (constantMatch) {
                    const constantName = constantMatch[1];
                    // Create a link that will be handled by JavaScript
                    return `<a href="javascript:void(0);" class="blog-link" data-constant="${constantName}">${linkText}</a>`;
                } else {
                    // Handle regular URLs
                    return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="blog-link">${linkText}</a>`;
                }
            }
        });

        // Blockquotes
        html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

        // Horizontal rules
        html = html.replace(/^\s*---\s*$/gm, '<hr>');
        html = html.replace(/^\s*\*\*\*\s*$/gm, '<hr>');
        html = html.replace(/^\s*___\s*$/gm, '<hr>');

        // Images - handle both markdown syntax and plain image tags
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, altText, imageUrl) => {
            return this.processImage(altText, imageUrl);
        });

        // Also handle plain HTML image tags if they exist in markdown
        html = html.replace(/<img\s+src="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+title="([^"]*)")?\s*\/?>/gi, (match, imageUrl, altText, title) => {
            return this.processImage(altText || '', imageUrl, title);
        });

        // Line breaks
        html = html.replace(/  \n/g, '<br>\n');

        // Restore code blocks
        html = html.replace(/###CODEBLOCK###(codeblock-\d+)###CODEBLOCK###/g, (match, id) => {
            const codeBlock = codeBlocks.find(cb => cb.id === id);
            return codeBlock ? codeBlock.content : match;
        });

        return html;
    }

    processImageLink(linkText, linkUrl) {
        // If linkText is provided, use it as alt text, otherwise use filename
        const altText = linkText || path.basename(linkUrl, path.extname(linkUrl));

        // Process the image URL
        return this.processImage(altText, linkUrl);
    }

    processImage(altText, imageUrl, title = '') {
        // Check if imageUrl is a relative path
        let finalImageUrl = imageUrl;

        // If it's a relative path starting with ./, ../, or just a filename
        if (imageUrl.startsWith('./') || imageUrl.startsWith('../') ||
            !imageUrl.includes('://') && !imageUrl.startsWith('/')) {

            // Check if the image exists in our assets directory
            const imageName = path.basename(imageUrl);
            const localImagePath = path.join(this.publicImagesDir, imageName);

            if (fs.existsSync(localImagePath)) {
                // Use the public path
                finalImageUrl = `/assets/images/${imageName}`;
            } else {
                // Check if it's in the original assets directory
                const sourceImagePath = path.join(this.imagesDir, imageName);
                if (fs.existsSync(sourceImagePath)) {
                    // Copy it to public directory
                    try {
                        fs.copyFileSync(sourceImagePath, localImagePath);
                        finalImageUrl = `/assets/images/${imageName}`;
                        console.log(`   📸 Copied blog image: ${imageName}`);
                    } catch (error) {
                        console.error(`   ✗ Error copying blog image ${imageName}:`, error.message);
                    }
                }
            }
        }

        // Build image HTML with responsive classes
        const titleAttr = title ? ` title="${title}"` : '';
        return `<div class="blog-image-container">
            <img src="${finalImageUrl}" alt="${altText || 'Blog image'}"${titleAttr} class="blog-image" loading="lazy">
            ${altText ? `<div class="blog-image-caption">${altText}</div>` : ''}
        </div>`;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    processTables(html) {
        const lines = html.split('\n');
        let processedLines = [];
        let inTable = false;
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line.trim());

                if (i === lines.length - 1 ||
                    !lines[i + 1].trim().startsWith('|') ||
                    lines[i + 1].trim().match(/^\|[-:\s|]+\|$/)) {

                    if (tableRows.length >= 2 && tableRows[1].match(/^\|[-:\s|]+\|$/)) {
                        const headers = tableRows[0].split('|').filter(cell => cell.trim() !== '');
                        const alignments = this.parseTableAlignments(tableRows[1]);
                        const dataRows = tableRows.slice(2);

                        let tableHtml = '<table class="blog-table">\n<thead>\n<tr>\n';
                        headers.forEach((header, index) => {
                            const align = alignments[index] || 'left';
                            tableHtml += `<th style="text-align: ${align}">${header.trim()}</th>\n`;
                        });

                        tableHtml += '</tr>\n</thead>\n<tbody>\n';
                        dataRows.forEach(row => {
                            const cells = row.split('|').filter(cell => cell.trim() !== '');
                            tableHtml += '<tr>\n';
                            cells.forEach((cell, index) => {
                                const align = alignments[index] || 'left';
                                tableHtml += `<td style="text-align: ${align}">${cell.trim()}</td>\n`;
                            });
                            tableHtml += '</tr>\n';
                        });

                        tableHtml += '</tbody>\n</table>';
                        processedLines.push(tableHtml);
                    } else {
                        let tableHtml = '<table class="blog-table">\n<tbody>\n';
                        tableRows.forEach(row => {
                            const cells = row.split('|').filter(cell => cell.trim() !== '');
                            tableHtml += '<tr>\n';
                            cells.forEach(cell => {
                                tableHtml += `<td>${cell.trim()}</td>\n`;
                            });
                            tableHtml += '</tr>\n';
                        });
                        tableHtml += '</tbody>\n</table>';
                        processedLines.push(tableHtml);
                    }

                    inTable = false;
                    tableRows = [];
                }
            } else {
                if (inTable) {
                    if (tableRows.length > 0) {
                        let tableHtml = '<table class="blog-table">\n<tbody>\n';
                        tableRows.forEach(row => {
                            const cells = row.split('|').filter(cell => cell.trim() !== '');
                            tableHtml += '<tr>\n';
                            cells.forEach(cell => {
                                tableHtml += `<td>${cell.trim()}</td>\n`;
                            });
                            tableHtml += '</tr>\n';
                        });
                        tableHtml += '</tbody>\n<tr>';
                        processedLines.push(tableHtml);
                        inTable = false;
                        tableRows = [];
                    }
                }
                processedLines.push(line);
            }
        }

        return processedLines.join('\n');
    }

    parseTableAlignments(separatorRow) {
        const cells = separatorRow.split('|').filter(cell => cell.trim() !== '');
        const alignments = [];
        cells.forEach(cell => {
            const content = cell.trim();
            if (content.startsWith(':') && content.endsWith(':')) {
                alignments.push('center');
            } else if (content.endsWith(':')) {
                alignments.push('right');
            } else if (content.startsWith(':')) {
                alignments.push('left');
            } else {
                alignments.push('left');
            }
        });
        return alignments;
    }

    processLists(html) {
        const lines = html.split('\n');
        let processedLines = [];
        let inList = false;
        let listType = null;
        let listItems = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isListItem = line.match(/^\s*<li>.*<\/li>\s*$/);

            if (isListItem) {
                if (!inList) {
                    inList = true;
                    const originalLine = this.getOriginalLineIfAvailable(lines, i);
                    if (originalLine && originalLine.match(/^\s*\d+\./)) {
                        listType = 'ol';
                    } else {
                        listType = 'ul';
                    }
                }
                listItems.push(line);

                if (i === lines.length - 1 || !lines[i + 1].match(/^\s*<li>.*<\/li>\s*$/)) {
                    if (listItems.length > 0) {
                        processedLines.push(`<${listType}>`);
                        listItems.forEach(item => processedLines.push(item));
                        processedLines.push(`</${listType}>`);
                    }
                    inList = false;
                    listType = null;
                    listItems = [];
                }
            } else {
                if (inList && listItems.length > 0) {
                    processedLines.push(`<${listType}>`);
                    listItems.forEach(item => processedLines.push(item));
                    processedLines.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                    listItems = [];
                }
                processedLines.push(line);
            }
        }

        return processedLines.join('\n');
    }

    getOriginalLineIfAvailable(lines, index) {
        return lines[index];
    }

    renderHeadScripts() {
        if (!this.ads || !Array.isArray(this.ads)) return '';

        const enabledAds = this.ads.filter(ad => ad.show === true);
        if (enabledAds.length === 0) return '';

        return enabledAds.map(ad => {
            // Add a comment with the ad name for clarity
            return `    <!-- Ad: ${ad.name} -->\n    ${ad.script}`;
        }).join('\n');
    }

    generateSite() {
        console.log('\n🚀 Starting MSRTC Bus Timetable Site Generation...');
        console.log('==============================================\n');

        // Create public directory
        if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
        }

        // Generate HTML pages
        this.generateNewHomepage();       // NEW: index.html (Maharashtra Darshan focused)
        this.generateBusSchedulePage();   // NEW: bus-schedule.html (depot grid + dropdowns)
        this.generateStaticPages();
        this.generateBlogPages();
        this.generateDepotPages();

        // Generate sitemap and robots.txt
        this.generateSitemap();
        this.generateRobotsTxt();

        // Generate search index
        this.generateSearchIndex();

        // Generate URL constants file for client-side use
        this.generateUrlConstantsFile();

        console.log('\n✅ Site generation complete!');
        this.printStats();
    }

    // NEW: Maharashtra Darshan focused homepage
    generateNewHomepage() {
        console.log('📄 Generating new Maharashtra Darshan homepage (index.html)...');

        const homepageContent = this.content.homepage || {};
        const seoContent = homepageContent.seo || {};

        // Get favicon links
        const faviconLinks = this.generateFaviconLinks('.');

        // Prepare blog cards (latest 6)
        const recentBlogs = this.blogs.slice(0, 6);
        const blogCardsHtml = recentBlogs.length > 0 ? `
            <div class="homepage-blogs">
                <h2>Latest Travel Updates & Guides</h2>
                <div class="blog-grid">
                    ${recentBlogs.map(blog => `
                        <a href="blogs/${blog.id}.html" class="blog-card">
                            <div class="blog-card-content">
                                <h3>${blog.title}</h3>
                                <div class="blog-card-excerpt">${blog.excerpt || blog.content.substring(0, 120) + '...'}</div>
                                <div class="blog-card-meta">
                                    <div class="blog-card-date">
                                        <i class="bi bi-calendar"></i>
                                        ${new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
                <div class="homepage-buttons">
                    <a href="blogs/index.html" class="btn-primary">Read All Blogs</a>
                    <a href="bus-schedule.html" class="btn-secondary">View All Bus Schedule</a>
                </div>
            </div>
        ` : '';

        // Maharashtra Darshan intro (customizable via content.json)
        const maharashtraIntro = homepageContent.maharashtra_darshan_intro || `
            <p>Discover the beauty of Maharashtra with MSRTC buses! From the majestic forts of Pune to the serene beaches of Konkan,
            MSRTC connects you to every corner of the state. Whether you're planning a pilgrimage to Shirdi, a weekend getaway to Mahabaleshwar,
            or exploring the Ajanta‑Ellora caves, our buses offer safe, affordable, and comfortable travel. Experience the true spirit of
            <strong>Maharashtra Darshan</strong> with the most extensive bus network in the state.</p>
        `;

        // 10 bullet points
        const bulletPoints = homepageContent.maharashtra_darshan_bullets || [
            "🏛️ Explore UNESCO World Heritage Sites like Ajanta & Ellora Caves",
            "⛰️ Trek the majestic Sahyadri ranges – forts of Shivaji Maharaj",
            "🌊 Relax on the pristine beaches of Konkan – Ganpatipule, Tarkarli",
            "🙏 Pilgrimage to Shirdi, Tuljapur, Pandharpur, and Kolhapur",
            "🍽️ Savor authentic Maharashtrian cuisine – Vada Pav, Puran Poli, Misal Pav",
            "🛕 Visit the grand Ganpatipule Temple and Ashtavinayak circuit",
            "🌳 Experience wildlife at Tadoba, Melghat, and Bhimashankar",
            "🎭 Witness vibrant festivals – Ganesh Chaturthi, Pune Festival",
            "🚌 Travel hassle‑free with MSRTC’s ‘Shivneri’, ‘Shivshahi’, and ‘Hirkani’ buses",
            "📅 Plan your journey with our up‑to‑date bus timetables and travel tips"
        ];
        const bulletsHtml = `<div class="maharashtra-darshan-bullets">
            <h3>Why choose MSRTC for Maharashtra Darshan?</h3>
            <ul>
                ${bulletPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </div>`;

        // Final paragraph
        const finalParagraph = homepageContent.maharashtra_darshan_footer || `
            <p>Start your Maharashtra Darshan today! Use the button above to view all bus schedules,
            check real‑time timings, and plan your route with confidence. Our timetable is regularly updated
            to ensure you never miss a bus. Book your ticket online or at the depot – a memorable journey awaits!</p>
        `;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoContent.title || 'MSRTC Bus Timetable - Maharashtra Darshan'}</title>
    <meta name="description" content="${seoContent.description || 'Plan your Maharashtra Darshan with MSRTC bus schedules, travel tips, and guides.'}">
    <meta name="keywords" content="${seoContent.keywords || 'MSRTC, Maharashtra bus, bus schedule, Maharashtra Darshan, travel guide'}">

    <!-- Ads scripts -->
    ${this.renderHeadScripts()}

    <!-- Favicon -->
    ${faviconLinks}

    <!-- Open Graph -->
    <meta property="og:title" content="${seoContent.title || 'MSRTC Bus Timetable'}">
    <meta property="og:description" content="${seoContent.description || 'Real-time bus schedules for Maharashtra Darshan'}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${this.config.base_url}">

    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
        /* Additional styles for homepage buttons */
        .homepage-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        .btn-primary, .btn-secondary {
            display: inline-block;
            padding: 0.8rem 1.5rem;
            border-radius: 40px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s;
            font-size: 1rem;
        }
        .btn-primary {
            background: ${this.config.theme?.primary_color || '#493dd5'};
            color: white;
            border: 2px solid ${this.config.theme?.primary_color || '#493dd5'};
        }
        .btn-primary:hover {
            background: ${this.config.theme?.secondary_color || '#3a2fc1'};
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: white;
            color: ${this.config.theme?.primary_color || '#493dd5'};
            border: 2px solid ${this.config.theme?.primary_color || '#493dd5'};
        }
        .btn-secondary:hover {
            background: ${this.config.theme?.bg_end || '#EDE9FE'};
            transform: translateY(-2px);
        }
        .maharashtra-darshan-bullets {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            margin: 2rem 0;
            border: 1px solid #C4B5FD;
        }
        .maharashtra-darshan-bullets ul {
            columns: 2;
            column-gap: 2rem;
            list-style: none;
            padding: 0;
        }
        .maharashtra-darshan-bullets li {
            margin-bottom: 0.8rem;
            padding-left: 0.5rem;
            break-inside: avoid;
        }
        @media (max-width: 768px) {
            .maharashtra-darshan-bullets ul {
                columns: 1;
            }
        }
        .maharashtra-intro {
            background: linear-gradient(135deg, #F5F3FF, #EDE9FE);
            border-radius: 16px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            text-align: center;
        }
    </style>

    <!-- Load URL constants -->
    <script src="assets/urls/url-constants.js"></script>

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "${this.config.site_name}",
        "url": "${this.config.base_url}",
        "description": "${seoContent.description || 'MSRTC bus schedules for Maharashtra Darshan'}",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "${this.config.base_url}/bus-schedule.html#search",
            "query-input": "required name=search_term"
        }
    }
    </script>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </div>
                <div class="time-display">
                    <span class="current-time"></span>
                </div>
            </div>
        </div>
    </header>

    <div class="header-spacer"></div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <main class="main-content">
        <div class="container">
            <h1 class="text-center">${homepageContent.title || 'MSRTC Bus Timetable'}</h1>
            <p class="text-center">${homepageContent.subtitle || 'Your guide to Maharashtra Darshan by bus'}</p>

            <div class="maharashtra-intro">
                ${maharashtraIntro}
            </div>

            <!-- Blog Cards Section -->
            ${blogCardsHtml}

            <!-- Middle Ad -->
            ${this.renderAd('middle_ad')}

            <!-- Bullet points and final paragraph -->
            <div class="maharashtra-details">
                ${bulletsHtml}
                <div class="final-paragraph">
                    ${finalParagraph}
                </div>
            </div>
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter()}

    <!-- Quick Search Modal (for global search) -->
    <div class="quick-search-modal" id="searchModal">
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3><i class="bi bi-search"></i> Advanced Search</h3>
                <button class="close-search">&times;</button>
            </div>
            <div class="search-modal-body">
                <input type="text" class="global-search-input" placeholder="Search divisions, districts, tehsils, depots...">
                <div class="search-results" id="searchResults"></div>
            </div>
        </div>
    </div>

    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;

        this.writeFile('index.html', html);
        console.log('   ✓ New homepage (index.html) generated with Maharashtra Darshan content');
    }

    // NEW: Bus schedule page with depot grid and cascading dropdowns
    generateBusSchedulePage() {
        console.log('📄 Generating bus schedule page (bus-schedule.html)...');

        const seoContent = {
            title: 'MSRTC Bus Schedules - Find All Depots',
            description: 'Search and filter MSRTC bus depots across Maharashtra. View schedules, bus stops, and timings.',
            keywords: 'MSRTC schedule, bus timetable, depot list'
        };

        const faviconLinks = this.generateFaviconLinks('.');

        // Prepare data for dropdowns
        const divisions = Object.values(this.data.divisions).sort((a, b) => a.name.localeCompare(b.name));
        const districts = Object.values(this.data.districts).sort((a, b) => a.name.localeCompare(b.name));
        const tehsils = Object.values(this.data.tehsils).sort((a, b) => a.name.localeCompare(b.name));
        const depots = Object.values(this.data.depots).sort((a, b) => a.name.localeCompare(b.name));

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoContent.title} - ${this.config.site_name}</title>
    <meta name="description" content="${seoContent.description}">
    <meta name="keywords" content="${seoContent.keywords}">

    <!-- Ads scripts -->
    ${this.renderHeadScripts()}

    <!-- Favicon -->
    ${faviconLinks}

    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>

    <!-- Load URL constants -->
    <script src="assets/urls/url-constants.js"></script>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="index.html" class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </a>
                <div class="time-display">
                    <span class="current-time"></span>
                </div>
            </div>
        </div>
    </header>

    <div class="header-spacer"></div>

    <div class="vertical-alphabet-nav" id="verticalAlphabet">
        ${this.renderVerticalAlphabet()}
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <main class="main-content">
        <div class="container">
            <div class="navigation-buttons">
                <a href="index.html" class="back-btn">
                    <i class="bi bi-house"></i> Home
                </a>
            </div>

            <h1 class="text-center">All MSRTC Bus Depots</h1>
            <p class="text-center">Find and filter depots across Maharashtra</p>

            <!-- Cascading Dropdowns -->
            <div class="filter-dropdowns">
                <div class="dropdown-group">
                    <label>Division</label>
                    <select id="divisionFilter">
                        <option value="">All Divisions</option>
                        ${divisions.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                    </select>
                </div>
                <div class="dropdown-group">
                    <label>District</label>
                    <select id="districtFilter">
                        <option value="">All Districts</option>
                    </select>
                </div>
                <div class="dropdown-group">
                    <label>Tehsil</label>
                    <select id="tehsilFilter">
                        <option value="">All Tehsils</option>
                    </select>
                </div>
                <div class="dropdown-group">
                    <label>Depot</label>
                    <select id="depotFilter">
                        <option value="">All Depots</option>
                    </select>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="tab-search-container">
                <div class="search-bar">
                    <i class="bi bi-search"></i>
                    <input type="text" class="search-input" placeholder="Search depots by name...">
                    <button class="clear-search" style="display: none;" aria-label="Clear search">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>

            <!-- Middle Ad -->
            ${this.renderAd('middle_ad')}

            <!-- Depots Grid -->
            <div class="depot-grid" id="depotsGrid">
                ${this.renderAllDepotCards()}
            </div>

            <div class="empty-state hidden" id="emptyDepotsState">
                <i class="bi bi-bus-front"></i>
                <h3>No depots found</h3>
                <p>Try changing your filters or search term</p>
            </div>
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter()}

    <!-- Quick Search Modal -->
    <div class="quick-search-modal" id="searchModal">
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3><i class="bi bi-search"></i> Advanced Search</h3>
                <button class="close-search">&times;</button>
            </div>
            <div class="search-modal-body">
                <input type="text" class="global-search-input" placeholder="Search divisions, districts, tehsils, depots...">
                <div class="search-results" id="searchResults"></div>
            </div>
        </div>
    </div>

    <script>
        window.DIVISIONS_DATA = ${JSON.stringify(divisions)};
        window.DISTRICTS_DATA = ${JSON.stringify(districts)};
        window.TEHSILS_DATA = ${JSON.stringify(tehsils)};
        window.DEPOTS_DATA = ${JSON.stringify(depots)};
        ${this.getInlineJS()}
    </script>
</body>
</html>`;

        this.writeFile('bus-schedule.html', html);
        console.log('   ✓ Bus schedule page (bus-schedule.html) generated with depot grid and dropdowns');
    }

    // Existing method for depot cards (used in bus-schedule.html)
    renderAllDepotCards() {
        const depots = Object.values(this.data.depots).sort((a, b) => a.name.localeCompare(b.name));
        if (depots.length === 0) {
            return '<div class="empty-state"><i class="bi bi-bus-front"></i><h3>No depots available</h3><p>Add depot data in data/depots/</p></div>';
        }

        return depots.map(depot => {
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;

            let busStopCount = 0;
            let busCount = 0;
            if (depot.villages) {
                Object.values(depot.villages).forEach(busStopList => {
                    busStopCount += busStopList.length;
                    busStopList.forEach(busStop => {
                        busCount += busStop.schedule ? busStop.schedule.length : 0;
                    });
                });
            }

            const path = `${division ? division.id + '/' : ''}${district ? district.id + '/' : ''}${tehsil ? tehsil.id + '/' : ''}${depot.id}/index.html`;

            return `<a href="${path}" class="rectangular-card" data-depot-id="${depot.id}" data-division-id="${division ? division.id : ''}" data-district-id="${district ? district.id : ''}" data-tehsil-id="${tehsil ? tehsil.id : ''}">
                <h3>${depot.name}</h3>
                <div class="card-meta">${tehsil ? tehsil.name : ''}, ${district ? district.name : ''}</div>
                <div class="stats">
                    <span class="stat"><i class="bi bi-signpost"></i> ${busStopCount}</span>
                    <span class="stat"><i class="bi bi-bus-front"></i> ${busCount}</span>
                </div>
            </a>`;
        }).join('');
    }

    generateFaviconLinks(relativePath = '') {
        // (unchanged from original)
        const faviconFiles = [];
        if (fs.existsSync(this.imagesDir)) {
            const files = fs.readdirSync(this.imagesDir);
            files.forEach(file => {
                const lowerFile = file.toLowerCase();
                if (lowerFile.includes('favicon') || lowerFile.includes('icon') || lowerFile.endsWith('.ico')) {
                    faviconFiles.push(file);
                }
            });
        }
        if (faviconFiles.length === 0 && fs.existsSync(this.publicDir)) {
            const publicFiles = fs.readdirSync(this.publicDir);
            publicFiles.forEach(file => {
                const lowerFile = file.toLowerCase();
                if (lowerFile.includes('favicon') || lowerFile.includes('icon') || lowerFile.endsWith('.ico')) {
                    faviconFiles.push(file);
                }
            });
        }
        if (faviconFiles.length === 0) {
            return `
    <link rel="icon" href="${relativePath ? relativePath + '/' : ''}favicon.ico" type="image/x-icon">
    <link rel="shortcut icon" href="${relativePath ? relativePath + '/' : ''}favicon.ico" type="image/x-icon">
    <link rel="apple-touch-icon" href="${relativePath ? relativePath + '/' : ''}assets/images/icon.png">
    <meta name="msapplication-TileImage" content="${relativePath ? relativePath + '/' : ''}assets/images/icon.png">`;
        }
        const links = [];
        faviconFiles.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            const name = file.toLowerCase();
            if (ext === '.ico') {
                links.push(`<link rel="icon" href="${relativePath ? relativePath + '/' : ''}${file}" type="image/x-icon">`);
                links.push(`<link rel="shortcut icon" href="${relativePath ? relativePath + '/' : ''}${file}" type="image/x-icon">`);
            } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
                if (name.includes('favicon')) {
                    links.push(`<link rel="icon" href="${relativePath ? relativePath + '/' : ''}${file}" type="image/${ext === '.png' ? 'png' : 'jpeg'}">`);
                }
                if (name.includes('icon') && !name.includes('favicon')) {
                    links.push(`<link rel="apple-touch-icon" href="${relativePath ? relativePath + '/' : ''}${file}">`);
                }
            } else if (ext === '.svg') {
                if (name.includes('favicon') || name.includes('icon')) {
                    links.push(`<link rel="icon" href="${relativePath ? relativePath + '/' : ''}${file}" type="image/svg+xml">`);
                }
            }
        });
        const hasAppleTouchIcon = links.some(link => link.includes('apple-touch-icon'));
        if (!hasAppleTouchIcon) {
            const pngJpgFiles = faviconFiles.filter(f => {
                const ext = path.extname(f).toLowerCase();
                return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
            });
            if (pngJpgFiles.length > 0) {
                links.push(`<link rel="apple-touch-icon" href="${relativePath ? relativePath + '/' : ''}${pngJpgFiles[0]}">`);
            }
        }
        const pngFiles = faviconFiles.filter(f => path.extname(f).toLowerCase() === '.png');
        if (pngFiles.length > 0) {
            links.push(`<meta name="msapplication-TileImage" content="${relativePath ? relativePath + '/' : ''}${pngFiles[0]}">`);
        }
        return links.join('\n    ');
    }

    renderVerticalAlphabet() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        return alphabet.map(letter => `
            <button class="alphabet-vertical-btn" data-letter="${letter}">${letter}</button>
        `).join('');
    }

    generateStaticPages() {
        const pages = ['about', 'contact', 'terms', 'privacy', 'disclaimer'];
        pages.forEach(page => {
            console.log(`📄 Generating ${page} page...`);
            const pageContent = this.content[page] || {
                title: page.charAt(0).toUpperCase() + page.slice(1),
                content: `<p>${page} content will be added soon.</p>`,
                seo: { title: page.charAt(0).toUpperCase() + page.slice(1), description: `Read our ${page} page` }
            };
            const faviconLinks = this.generateFaviconLinks('.');
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageContent.seo?.title || page}</title>
    <meta name="description" content="${pageContent.seo?.description || page}">
    ${this.renderHeadScripts()}
    ${faviconLinks}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <script src="assets/urls/url-constants.js"></script>
    <style>${this.getInlineCSS()}</style>
</head>
<body>
    <header class="site-header"><div class="container"><div class="header-content"><a href="index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    <div class="vertical-alphabet-nav" id="verticalAlphabet">${this.renderVerticalAlphabet()}</div>
    ${this.renderAd('top_ad')}
    <main class="main-content"><div class="container">
        <div class="navigation-buttons"><a href="index.html" class="back-btn"><i class="bi bi-house"></i> Home</a></div>
        <div class="tab-search-container"><div class="search-bar"><i class="bi bi-search"></i><input type="text" class="search-input" placeholder="Search depots, tehsils, districts..."><button class="clear-search" style="display: none;"><i class="bi bi-x"></i></button></div></div>
        <h1>${pageContent.title}</h1>
        <div class="page-content">${pageContent.content}</div>
        ${pageContent.seo_content ? this.renderSEOContent(pageContent.seo_content) : ''}
    </div></main>
    ${this.renderAd('footer_ad')}
    ${this.renderFooter()}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search divisions, districts, tehsils, depots..."><div class="search-results" id="searchResults"></div></div></div></div>
    <script>${this.getInlineJS()}</script>
</body>
</html>`;
            this.writeFile(`${page}.html`, html);
            console.log(`   ✓ ${page} page generated`);
        });
    }

    generateBlogPages() {
        console.log('📝 Generating blog pages...');
        const blogsPublicDir = path.join(this.publicDir, 'blogs');
        if (!fs.existsSync(blogsPublicDir)) fs.mkdirSync(blogsPublicDir, { recursive: true });
        const faviconLinks = this.generateFaviconLinks('..');
        const blogListingHTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Blogs & Updates - ${this.config.site_name}</title><meta name="description" content="Latest news, updates, and articles about MSRTC bus services"><link rel="canonical" href="${this.config.base_url}/blogs/index.html">${this.renderHeadScripts()}${faviconLinks}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"><script src="../assets/urls/url-constants.js"></script><style>${this.getInlineCSS()}</style></head>
<body>
    <header class="site-header"><div class="container"><div class="header-content"><a href="../index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    ${this.renderAd('top_ad')}
    <main class="main-content"><div class="container">
        <div class="navigation-buttons"><a href="../index.html" class="back-btn"><i class="bi bi-house"></i> Home</a></div>
        <h1>Blogs & Updates</h1><p>Latest news and articles about MSRTC bus services in Maharashtra</p>
        ${this.blogs.length > 0 ? `<div class="blog-grid">${this.blogs.map(blog => `<a href="${blog.id}.html" class="blog-card"><div class="blog-card-content"><h3>${blog.title}</h3><div class="blog-card-excerpt">${blog.excerpt || blog.content.substring(0, 120) + '...'}</div><div class="blog-card-meta"><div class="blog-card-date"><i class="bi bi-calendar"></i>${new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div></div></a>`).join('')}</div>` : `<div class="empty-state"><i class="bi bi-newspaper"></i><h3>No blog posts yet</h3><p>Check back soon for updates and articles about MSRTC services.</p></div>`}
    </div></main>
    ${this.renderAd('footer_ad')}
    ${this.renderFooter('../')}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search divisions, districts, tehsils, depots..."><div class="search-results" id="searchResults"></div></div></div></div>
    <script>${this.getInlineJS()}</script>
</body>
</html>`;
        this.writeFile('blogs/index.html', blogListingHTML);
        console.log('   ✓ Blog listing page generated');

        this.blogs.forEach(blog => {
            console.log(`   📄 Generating blog: ${blog.title}`);
            const blogHTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${blog.seo?.title || blog.title} - ${this.config.site_name}</title><meta name="description" content="${blog.seo?.description || blog.excerpt || blog.content.substring(0, 160)}"><meta name="keywords" content="${blog.seo?.keywords || blog.tags?.join(', ') || 'MSRTC, bus, Maharashtra, transport'}"><link rel="canonical" href="${this.config.base_url}/blogs/${blog.id}.html">${this.renderHeadScripts()}${faviconLinks}<meta property="og:title" content="${blog.title}"><meta property="og:description" content="${blog.excerpt || blog.content.substring(0, 200)}"><meta property="og:type" content="article"><meta property="og:url" content="${this.config.base_url}/blogs/${blog.id}.html"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"><script src="../assets/urls/url-constants.js"></script><style>${this.getInlineCSS()}</style></head>
<body>
    <header class="site-header"><div class="container"><div class="header-content"><a href="../index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    ${this.renderAd('top_ad')}
    <main class="main-content"><div class="container blog-page">
        <div class="navigation-buttons"><a href="index.html" class="back-btn"><i class="bi bi-arrow-left"></i> Back to Blogs</a><a href="../index.html" class="back-btn"><i class="bi bi-house"></i> Home</a></div>
        <div class="blog-header"><h1>${blog.title}</h1><div class="blog-date"><i class="bi bi-calendar"></i>${new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
        ${blog.author ? `<div class="blog-author"><div class="author-avatar">${blog.author.charAt(0).toUpperCase()}</div><div class="author-info"><h4>${blog.author}</h4></div></div>` : ''}
        <div class="blog-content">${blog.content}</div>
        ${blog.tags && blog.tags.length > 0 ? `<div class="blog-tags">${blog.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}</div>` : ''}
        ${blog.seo_content ? this.renderSEOContent(blog.seo_content) : ''}
    </div></main>
    ${this.renderAd('footer_ad')}
    ${this.renderFooter('../')}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search bus stops..."><div class="search-results" id="searchResults"></div></div></div></div>
    <script>${this.getInlineJS()}</script>
</body>
</html>`;
            this.writeFile(`blogs/${blog.id}.html`, blogHTML);
        });
    }

    generateDepotPages() {
        Object.values(this.data.depots).forEach(depot => {
            console.log(`🚌 Generating depot: ${depot.name}`);
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;
            if (!tehsil || !district || !division) {
                console.log(`   ✗ Skipping ${depot.name} - hierarchy incomplete`);
                return;
            }
            const html = this.renderDepotPage(depot, tehsil, district, division);
            const depotDir = path.join(this.publicDir, division.id, district.id, tehsil.id, depot.id);
            if (!fs.existsSync(depotDir)) fs.mkdirSync(depotDir, { recursive: true });
            this.writeFile(`${division.id}/${district.id}/${tehsil.id}/${depot.id}/index.html`, html);
            console.log(`   ✓ Depot page: ${depot.name}`);
        });
    }

    renderDepotPage(depot, tehsil, district, division) {
        const villages = depot.villages || {};
        const villageLetters = Object.keys(villages).sort();
        let totalBusStopCount = 0, totalBusCount = 0;
        Object.values(villages).forEach(busStopList => {
            totalBusStopCount += busStopList.length;
            busStopList.forEach(busStop => { totalBusCount += busStop.schedule ? busStop.schedule.length : 0; });
        });
        const seo = depot.seo || {};
        const content = depot.content || {};
        const depotContent = content.about || '';
        const faqs = content.faqs || [];
        const relatedDepots = this.getRelatedDepots(depot.id);
        const fallbackRelatedDepots = relatedDepots.length === 0 ? this.getRelatedDepotsInTehsil(depot.id, tehsil.id) : [];
        const faviconLinks = this.generateFaviconLinks('../../../../');
        return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${seo.title || `${depot.name} Depot - ${tehsil.name} - ${this.config.site_name}`}</title><meta name="description" content="${seo.description || `MSRTC bus schedule for ${depot.name} depot in ${tehsil.name}, ${district.name}.`}"><meta name="keywords" content="${seo.keywords || `${depot.name} bus timing, ${tehsil.name} depot`}">${this.renderHeadScripts()}${faviconLinks}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"><script src="../../../../assets/urls/url-constants.js"></script><style>${this.getInlineCSS()}</style></head>
<body class="depot-page">
    <header class="site-header"><div class="container"><div class="header-content"><a href="../../../../index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    <div class="vertical-alphabet-nav" id="verticalAlphabet">${this.renderBusStopVerticalAlphabet(villageLetters)}</div>
    ${this.renderAd('top_ad')}
    <main class="main-content"><div class="container">
        <div class="navigation-buttons"><a href="../index.html" class="back-btn"><i class="bi bi-arrow-left"></i> Back to ${tehsil.name}</a><a href="../../../../index.html" class="back-btn"><i class="bi bi-house"></i> Home</a></div>
        <div class="depot-header"><h1>${depot.name}</h1><p>${depot.address || 'MSRTC Bus Depot'}</p><div class="depot-info">${depot.contact ? `<div class="info-item"><i class="bi bi-telephone"></i><span>${depot.contact}</span></div>` : ''}<div class="info-item"><i class="bi bi-signpost"></i><span>${totalBusStopCount} Bus Stops</span></div><div class="info-item"><i class="bi bi-bus-front"></i><span>${totalBusCount} Buses</span></div></div></div>
        <div class="depot-search-filters-container"><div class="tab-search-container"><div class="search-bar"><i class="bi bi-search"></i><input type="text" class="search-input" placeholder="Search bus stops in ${depot.name}..."><button class="clear-search" style="display: none;"><i class="bi bi-x"></i></button></div></div><div class="time-filters"><button class="filter-btn active" data-filter="all">All</button><button class="filter-btn" data-filter="morning">5AM-12PM</button><button class="filter-btn" data-filter="afternoon">12PM-5PM</button><button class="filter-btn" data-filter="evening">5PM-10PM</button><button class="filter-btn" data-filter="night">10PM-5AM</button></div></div>
        ${this.renderAd('middle_ad')}
        <div class="empty-state hidden"><i class="bi bi-search"></i><h3>No buses found</h3><p>Try changing your filters or search term</p></div>
        ${this.renderBusStopSections(villages, villageLetters)}
        ${depotContent ? `<div class="depot-about-section mt-3"><h2>About ${depot.name} Depot</h2><div class="about-content">${depotContent}</div></div>` : ''}
        ${faqs.length > 0 ? `<div class="faq-section mt-3"><h2>FAQs</h2><div class="faq-container">${faqs.map((faq, idx) => `<div class="faq-item"><div class="faq-question"><i class="bi bi-question-circle"></i><span>${(faq.question || faq.q || '').replace(/^\s*[?•\-\*]\s*/, '')}</span></div><div class="faq-answer">${faq.answer || faq.a || ''}</div></div>`).join('')}</div></div>` : ''}
        ${relatedDepots.length > 0 || fallbackRelatedDepots.length > 0 ? `<div class="related-links-section mt-3"><h2>${relatedDepots.length > 0 ? 'Related Depots' : 'Other Depots in ' + tehsil.name}</h2><div class="related-links-grid">${relatedDepots.length > 0 ? relatedDepots.map(rd => this.renderRelatedDepotCard(rd, division.id, district.id, tehsil.id, depot.id)).join('') : fallbackRelatedDepots.map(rd => this.renderRelatedDepotCard(rd, division.id, district.id, tehsil.id, depot.id)).join('')}</div></div>` : ''}
        ${content.seo_content ? this.renderSEOContent(content.seo_content) : ''}
    </div></main>
    ${this.renderAd('footer_ad')}
    ${this.renderFooter('../../../../')}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search bus stops in ${depot.name}..."><div class="search-results" id="searchResults"></div></div></div></div>
    <script>${this.getInlineJS()}</script>
</body>
</html>`;
    }

    renderBusStopVerticalAlphabet(busStopLetters) {
        const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const busStopLettersUpper = busStopLetters.map(l => l.toUpperCase());
        return allLetters.map(letter => {
            const hasBusStop = busStopLettersUpper.includes(letter);
            const actualLetter = hasBusStop ? busStopLetters[busStopLettersUpper.indexOf(letter)] : letter.toLowerCase();
            return `<button class="alphabet-vertical-btn ${hasBusStop ? '' : 'disabled'}" data-letter="${actualLetter}">${letter}</button>`;
        }).join('');
    }

    getRelatedDepots(depotId) {
        const relatedDepotItems = this.relatedDepotsData[depotId] || [];
        const relatedDepots = [];
        relatedDepotItems.forEach(relatedItem => {
            const relatedDepot = this.data.depots[relatedItem.depot_id];
            if (relatedDepot) {
                const tehsilId = relatedItem.tehsil_id || relatedDepot.tehsil_id;
                const tehsil = tehsilId ? this.data.tehsils[tehsilId] : null;
                const districtId = relatedItem.district_id || (tehsil ? tehsil.district_id : null);
                const district = districtId ? this.data.districts[districtId] : null;
                const divisionId = relatedItem.division_id || (district ? district.division_id : null);
                const division = divisionId ? this.data.divisions[divisionId] : null;
                if (division && district && tehsil) relatedDepots.push({ depot: relatedDepot, hierarchy: { division, district, tehsil } });
                else console.warn(`   ⚠️  Incomplete hierarchy for related depot: ${relatedDepot.name}`);
            } else console.warn(`   ⚠️  Related depot not found: ${relatedItem.depot_id}`);
        });
        return relatedDepots;
    }

    getRelatedDepotsInTehsil(depotId, tehsilId) {
        return Object.values(this.data.depots).filter(d => d.tehsil_id === tehsilId && d.id !== depotId).map(depot => {
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;
            return { depot: depot, hierarchy: { division, district, tehsil } };
        }).slice(0, 4);
    }

    renderRelatedDepotCard(relatedData, currentDivisionId, currentDistrictId, currentTehsilId, currentDepotId) {
        if (!relatedData || !relatedData.depot || !relatedData.hierarchy) return '';
        const { depot, hierarchy } = relatedData;
        const { division, district, tehsil } = hierarchy;
        if (depot.id === currentDepotId) return '';
        if (!division || !district || !tehsil) return '';
        let busStopCount = 0, busCount = 0;
        if (depot.villages) {
            Object.values(depot.villages).forEach(bsl => { busStopCount += bsl.length; bsl.forEach(bs => { busCount += bs.schedule ? bs.schedule.length : 0; }); });
        }
        const relativePath = `../../../../${division.id}/${district.id}/${tehsil.id}/${depot.id}/index.html`;
        return `<a href="${relativePath}" class="related-depot-card"><h3>${depot.name}</h3><p>${busStopCount} bus stops • ${busCount} buses</p><span class="related-depot-link"><i class="bi bi-arrow-right"></i> View</span></a>`;
    }

    renderBusStopSections(villages, letters) {
        if (letters.length === 0) return '<div class="empty-state"><i class="bi bi-signpost"></i><h3>No bus stop schedules available</h3><p>Add bus stop data to this depot</p></div>';
        return letters.map(letter => (villages[letter] || []).map(busStop => {
            const schedule = busStop.schedule || [];
            return `<div class="bus-stop-section" id="busstop-${letter}-${busStop.name.toLowerCase().replace(/\s+/g, '-')}" data-letter="${letter.toLowerCase()}" data-busstop="${busStop.name.toLowerCase()}"><div class="bus-stop-header"><h3 class="bus-stop-name">${busStop.name}</h3><span class="bus-count">${schedule.length}</span></div><div class="schedule-grid">${this.renderTimeBubbles(schedule)}</div></div>`;
        }).join('')).join('');
    }

    renderTimeBubbles(schedule) {
        if (schedule.length === 0) return '<div class="time-bubble" style="grid-column:1/-1;background:#F8FAFC;color:#64748B;border:1px dashed #CBD5E1;">No schedule</div>';
        const morning = schedule.filter(t => { let [h] = t.split(':').map(Number); return h>=5 && h<12; });
        const afternoon = schedule.filter(t => { let [h] = t.split(':').map(Number); return h>=12 && h<17; });
        const evening = schedule.filter(t => { let [h] = t.split(':').map(Number); return h>=17 && h<22; });
        const night = schedule.filter(t => { let [h] = t.split(':').map(Number); return h>=22 || h<5; });
        const sortTimes = (arr) => arr.sort((a,b) => { let [ha,ma]=a.split(':').map(Number), [hb,mb]=b.split(':').map(Number); return (ha*60+ma)-(hb*60+mb); });
        const allTimes = [...sortTimes(morning), ...sortTimes(afternoon), ...sortTimes(evening), ...sortTimes(night)];
        return allTimes.map(time => {
            let [h,m] = time.split(':').map(Number);
            let cat = 'morning';
            if (h>=5 && h<12) cat='morning';
            else if (h>=12 && h<17) cat='afternoon';
            else if (h>=17 && h<22) cat='evening';
            else cat='night';
            const hour12 = h%12||12;
            const ampm = h>=12?'PM':'AM';
            const display = `${hour12}:${m.toString().padStart(2,'0')}${ampm}`;
            return `<div class="time-bubble ${cat}" data-time="${time}" title="${display}">${display}</div>`;
        }).join('');
    }

    renderAd(adType) {
        if (!this.config.ads || !this.config.ads[adType] || !this.config.ads[adType].enabled) return '';
        const ad = this.config.ads[adType];
        const isMobile = adType !== 'footer_ad';
        let adCode = '';
        if (isMobile && ad.mobile_code && ad.desktop_code) adCode = `<div class="ad-mobile">${ad.mobile_code}</div><div class="ad-desktop">${ad.desktop_code}</div>`;
        else if (ad.code) adCode = ad.code;
        else if (ad.mobile_code) adCode = ad.mobile_code;
        else adCode = `<div class="ad-placeholder"><span>${ad.label || 'Ad'}</span></div>`;
        return `<div class="ad-container ${adType}"><div class="ad-content">${adCode}</div></div>`;
    }

    renderSEOContent(seoContent) {
        if (!seoContent) return '';
        return `<div class="seo-content">${seoContent.title ? `<h2>${seoContent.title}</h2>` : ''}${seoContent.content || ''}${seoContent.faqs && seoContent.faqs.length ? `<h3>Frequently Asked Questions</h3>${seoContent.faqs.map(faq => `<div class="faq-item"><div class="faq-question">${faq.question}</div><div class="faq-answer">${faq.answer}</div></div>`).join('')}` : ''}</div>`;
    }

    renderFooter(prefix = '') {
        const basePath = prefix || '';
        return `<footer class="site-footer"><div class="container"><div class="footer-content"><div class="footer-section"><h3>Quick Links</h3><div class="footer-links"><a href="${basePath}index.html">Home</a><a href="${basePath}bus-schedule.html">Bus Schedule</a><a href="${basePath}about.html">About</a><a href="${basePath}contact.html">Contact</a><a href="${basePath}blogs/index.html">Blogs</a><a href="${basePath}terms.html">Terms</a><a href="${basePath}privacy.html">Privacy</a></div></div><div class="footer-section"><h3>MSRTC Official</h3><div class="footer-links"><a href="https://msrtc.maharashtra.gov.in" target="_blank" rel="noopener">Official Website</a><a href="https://msrtc.maharashtra.gov.in/booking/ticket_booking.html" target="_blank" rel="noopener">Book Tickets</a><a href="https://msrtc.maharashtra.gov.in/contact_us.html" target="_blank" rel="noopener">Contact MSRTC</a><a href="https://msrtc.maharashtra.gov.in/complaints.html" target="_blank" rel="noopener">Complaints</a></div></div><div class="footer-section"><h3>Useful Links</h3><div class="footer-links"><a href="${basePath}disclaimer.html">Disclaimer</a><a href="${basePath}sitemap.xml">Sitemap</a><a href="${basePath}contact.html#feedback">Feedback</a><a href="${basePath}contact.html#report">Report Issue</a></div></div><div class="copyright">© ${new Date().getFullYear()} ${this.config.site_name}.<br>This is an unofficial timetable portal.<br><small>All bus schedules are for reference only.</small></div></div></div></footer>`;
    }

    generateSearchIndex() {
        console.log('🔍 Generating search index...');
        const searchData = { depots: [], divisions: [], districts: [], tehsils: [] };
        Object.values(this.data.divisions).forEach(division => {
            const districtCount = this.getDistrictsForDivision(division.id).length;
            const depotCount = this.getDepotCountForDivision(division.id);
            searchData.divisions.push({ id: division.id, name: division.name, type: 'Division', path: `${division.id}/index.html`, districts: districtCount, depots: depotCount, alphabet: division.alphabet || division.name.charAt(0).toUpperCase() });
        });
        Object.values(this.data.districts).forEach(district => {
            const division = this.data.divisions[district.division_id];
            const tehsilCount = this.getTehsilsForDistrict(district.id).length;
            const depotCount = this.getDepotCountForDistrict(district.id);
            if (division) searchData.districts.push({ id: district.id, name: district.name, type: 'District', path: `${division.id}/${district.id}/index.html`, division: division.name, tehsils: tehsilCount, depots: depotCount, alphabet: district.alphabet || district.name.charAt(0).toUpperCase() });
        });
        Object.values(this.data.tehsils).forEach(tehsil => {
            const district = this.data.districts[tehsil.district_id];
            const division = district ? this.data.divisions[district.division_id] : null;
            const depotCount = this.getDepotsForTehsil(tehsil.id).length;
            if (division && district) searchData.tehsils.push({ id: tehsil.id, name: tehsil.name, type: 'Tehsil', path: `${division.id}/${district.id}/${tehsil.id}/index.html`, division: division.name, district: district.name, depots: depotCount, alphabet: tehsil.alphabet || tehsil.name.charAt(0).toUpperCase() });
        });
        Object.values(this.data.depots).forEach(depot => {
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;
            if (division && district && tehsil) {
                let busStopCount = 0, busCount = 0;
                if (depot.villages) {
                    Object.values(depot.villages).forEach(bsl => { busStopCount += bsl.length; bsl.forEach(bs => { busCount += bs.schedule ? bs.schedule.length : 0; }); });
                }
                searchData.depots.push({ id: depot.id, name: depot.name, type: 'Depot', path: `${division.id}/${district.id}/${tehsil.id}/${depot.id}/index.html`, division: division.name, district: district.name, tehsil: tehsil.name, busStops: busStopCount, buses: busCount, alphabet: depot.name.charAt(0).toUpperCase() });
            }
        });
        const searchIndexPath = path.join(this.publicDir, 'search-index.js');
        fs.writeFileSync(searchIndexPath, `window.searchIndex = ${JSON.stringify(searchData, null, 2)};`, 'utf8');
        console.log('   ✓ Search index generated');
    }

    generateUrlConstantsFile() {
        console.log('🔗 Generating URL constants file...');
        const urlConstantsPath = path.join(this.publicDir, 'assets', 'urls', 'url-constants.js');
        const dir = path.dirname(urlConstantsPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const jsConstants = `window.URL_CONSTANTS = ${JSON.stringify(this.urlConstants, null, 2)};\nwindow.getUrlFromConstant = function(c){ return window.URL_CONSTANTS[c] || '#'; };\nwindow.handleBlogLinkClick = function(e){ const c = e.currentTarget.dataset.constant; if(c){ const url = window.getUrlFromConstant(c); if(url && url!=='#'){ window.open(url, '_blank', 'noopener,noreferrer'); e.preventDefault(); return false; } } return true; };\ndocument.addEventListener('DOMContentLoaded', function(){ document.querySelectorAll('.blog-link[data-constant]').forEach(function(link){ link.addEventListener('click', window.handleBlogLinkClick); }); console.log('URL constants initialized with', Object.keys(window.URL_CONSTANTS || {}).length, 'constants'); });`;
        fs.writeFileSync(urlConstantsPath, jsConstants, 'utf8');
        console.log('   ✓ URL constants file generated');
    }

    getInlineCSS() {
        const theme = this.config.theme || {};
        const primary = '#493dd5';
        const secondary = '#3a2fc1';
        const bgStart = theme.bg_gradient_start || '#F5F3FF';
        const bgEnd = theme.bg_gradient_end || '#EDE9FE';
        const textPrimary = '#4C1D95';
        const textSecondary = '#5B21B6';
        const borderLight = '#C4B5FD';
        const borderDark = '#A78BFA';

        return `/* ==========================================================================
       MSRTC BUS TIMETABLE - MOBILE FIRST STYLES WITH FIXED ALIGNMENT
       ========================================================================== */

    * { margin:0; padding:0; box-sizing:border-box; }
    html { font-size:14px; scroll-behavior:smooth; }
    body { font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; font-weight:400; background:linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%); color:${textPrimary}; line-height:1.4; min-height:100vh; -webkit-tap-highlight-color:transparent; padding-bottom:40px; overflow-x:hidden; max-width:100%; }
    .header-spacer { height:50px; }
    h1,h2,h3,h4,h5,h6 { font-family:'Inter',sans-serif; font-weight:600; color:${textSecondary}; margin-bottom:0.5rem; }
    h1 { font-size:1.5rem; line-height:1.2; }
    h2 { font-size:1.3rem; }
    h3 { font-size:1.2rem; font-weight:500; }
    p { margin-bottom:0.8rem; line-height:1.5; font-size:1rem; }
    a { color:${primary}; text-decoration:none; transition:color 0.2s; }
    a:hover { color:${secondary}; }
    .container { width:100%; max-width:1200px; margin:0 auto; padding:0 0.8rem; padding-right:calc(0.8rem + 28px); position:relative; }
    .text-center { text-align:center; }
    .mt-2 { margin-top:0.5rem; }
    .mt-3 { margin-top:1rem; }
    .site-header { background:white; box-shadow:0 1px 3px rgba(73,61,213,0.05); position:fixed; top:0; left:0; right:0; z-index:200; padding:0.3rem 0; border-bottom:1px solid ${borderLight}; height:50px; }
    .header-content { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.3rem; padding:0.1rem 0; height:100%; }
    .logo { font-family:'Inter',sans-serif; font-weight:600; font-size:1rem; color:${textSecondary} !important; display:flex; align-items:center; gap:0.3rem; text-decoration:none; }
    .logo i { color:${primary} !important; font-size:1.1rem; }
    .time-display { font-family:'Orbitron',monospace; font-weight:500; font-size:0.9rem; padding:0.2rem 0.5rem; border-radius:6px; background:#0F172A; border:1px solid ${borderDark}; letter-spacing:1px; box-shadow:0 2px 4px rgba(0,0,0,0.1); color:#00FF00 !important; text-shadow:0 0 5px rgba(0,255,0,0.5); }
    .tab-search-container { margin:0.8rem 0; padding:0; width:100%; }
    .depot-search-filters-container { margin:0.8rem 0; width:100%; padding:0; }
    .depot-search-filters-container .tab-search-container { margin:0 0 0.5rem 0; }
    .depot-search-filters-container .time-filters { margin:0.5rem 0 1rem 0; }
    .search-bar { display:flex; align-items:center; background:white; border:1px solid ${borderLight}; border-radius:6px; padding:0.6rem 0.8rem; box-shadow:0 1px 2px rgba(0,0,0,0.03); width:100%; margin:0; }
    .search-bar i { color:${primary}; margin-right:0.5rem; font-size:1rem; flex-shrink:0; }
    .search-input { flex:1; border:none; background:transparent; font-family:'Inter',sans-serif; font-size:0.95rem; color:${textPrimary}; outline:none; width:100%; min-width:0; padding:0; }
    .search-input::placeholder { color:#94A3B8; font-size:0.9rem; }
    .clear-search { background:none; border:none; color:#94A3B8; font-size:1.1rem; cursor:pointer; padding:0; width:20px; height:20px; display:flex; align-items:center; justify-content:center; margin-left:0.3rem; flex-shrink:0; transition:color 0.2s; }
    .clear-search:hover { color:${textSecondary}; }
    .vertical-alphabet-nav { position:fixed; right:0; top:110px; bottom:0; width:32px; z-index:180; background:rgba(255,255,255,0.95); backdrop-filter:blur(5px); border-left:1px solid ${borderLight}; display:flex; flex-direction:column; align-items:center; overflow-y:auto; overflow-x:hidden; scrollbar-width:none; -ms-overflow-style:none; padding:0.5rem 0; }
    .vertical-alphabet-nav::-webkit-scrollbar { display:none; width:0; height:0; }
    .alphabet-vertical-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; background:transparent; color:${textSecondary}; font-family:'Inter',sans-serif; font-weight:500; cursor:pointer; transition:all 0.3s; font-size:0.85rem; padding:0; touch-action:manipulation; border:none; border-radius:4px; margin:0.05rem 0; min-width:28px; min-height:28px; }
    .alphabet-vertical-btn:hover { background:${bgEnd}; color:${primary}; transform:scale(1.1); }
    .alphabet-vertical-btn.disabled { opacity:0.3; cursor:not-allowed; background:transparent; }
    .alphabet-vertical-btn.disabled:hover { background:transparent; transform:none; }
    .navigation-buttons { display:flex; gap:0.5rem; margin-bottom:0.8rem; flex-wrap:wrap; width:100%; padding:0; }
    .back-btn { display:inline-flex; align-items:center; gap:0.3rem; padding:0.5rem 0.8rem; background:white; border:1px solid ${borderLight}; border-radius:6px; color:${textPrimary}; font-family:'Inter',sans-serif; font-weight:500; cursor:pointer; transition:all 0.3s; font-size:0.9rem; text-decoration:none; flex-shrink:0; max-width:100%; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; min-height:38px; margin:0; width:auto; }
    .back-btn:hover { background:${bgEnd}; color:${primary}; border-color:${borderDark}; }
    .back-btn i { font-size:0.9rem; }
    .depot-about-section, .faq-section, .related-links-section { background:white; border-radius:8px; padding:1rem; border:1px solid ${borderLight}; margin-top:1.5rem; width:100%; }
    .depot-about-section h2, .faq-section h2, .related-links-section h2 { color:${textSecondary}; margin-bottom:0.8rem; font-size:1.3rem; }
    .about-content, .faq-answer { color:#4B5563; font-size:1rem; line-height:1.5; }
    .faq-container { margin-top:0.8rem; }
    .faq-item { margin-bottom:0.8rem; padding:0.8rem; background:#F8FAFC; border-radius:6px; border:1px solid ${borderLight}; }
    .faq-question { color:${textSecondary}; font-weight:500; margin-bottom:0.6rem; font-size:1rem; display:flex; align-items:center; gap:0.4rem; }
    .faq-question i { color:${primary}; font-size:0.9rem; }
    .faq-answer { padding-left:1.5rem; }
    .related-links-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:0.8rem; margin-top:0.8rem; }
    .related-depot-card { background:white; border:1px solid ${borderLight}; border-radius:8px; padding:0.8rem; text-decoration:none; transition:all 0.3s; display:block; }
    .related-depot-card:hover { border-color:${primary}; }
    .related-depot-card h3 { color:${textSecondary}; margin-bottom:0.3rem; font-size:1.1rem; }
    .related-depot-card p { color:${textPrimary}; font-size:0.9rem; opacity:0.8; margin-bottom:0.5rem; }
    .related-depot-link { display:flex; align-items:center; gap:0.3rem; color:${primary}; font-weight:500; font-size:0.9rem; }
    .ad-container { margin:1rem 0; text-align:center; width:100%; padding:0; }
    .ad-content { background:white; border:1px solid ${borderLight}; border-radius:6px; padding:0.8rem; min-height:70px; display:flex; align-items:center; justify-content:center; width:100%; margin:0; }
    @media (min-width:1025px) { .ad-content { padding:1rem; } }
    .ad-desktop { display:none; }
    .ad-mobile { display:flex; align-items:center; justify-content:center; gap:0.8rem; width:100%; }
    .ad-placeholder { color:${textPrimary}; display:flex; flex-direction:column; align-items:center; gap:0.3rem; }
    .ad-placeholder span { font-size:0.85rem; color:#64748B; }
    .filter-dropdowns { display:flex; flex-wrap:wrap; gap:0.8rem; margin:1rem 0; justify-content:space-between; }
    .dropdown-group { flex:1; min-width:150px; }
    .dropdown-group label { display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.2rem; color:${textSecondary}; }
    .dropdown-group select { width:100%; padding:0.5rem; border:1px solid ${borderLight}; border-radius:6px; background:white; font-family:'Inter',sans-serif; font-size:0.9rem; color:${textPrimary}; cursor:pointer; }
    .division-grid, .district-grid, .tehsil-grid, .depot-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:0.6rem; margin:0.8rem 0; width:100%; padding:0; }
    .rectangular-card { background:white; border:1px solid ${borderLight}; border-radius:8px; padding:0.7rem; box-shadow:0 1px 2px rgba(0,0,0,0.03); transition:all 0.3s ease; display:block; cursor:pointer; text-decoration:none; position:relative; overflow:hidden; min-height:75px; display:flex; flex-direction:column; justify-content:space-between; text-align:left; width:100%; }
    .rectangular-card:hover { border-color:${primary}; background:${bgStart}; }
    .rectangular-card h3 { color:${textSecondary} !important; margin-bottom:0.2rem; font-size:1rem; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .card-meta { color:${textPrimary}; font-size:0.8rem; margin-bottom:0.2rem; opacity:0.8; }
    .rectangular-card .stats { display:flex; gap:0.5rem; margin-top:0.2rem; flex-wrap:wrap; }
    .rectangular-card .stat { background:${bgEnd}; padding:0.1rem 0.3rem; border-radius:8px; color:${textSecondary} !important; font-size:0.7rem; font-weight:500; display:flex; align-items:center; gap:0.15rem; border:1px solid ${borderLight}; }
    .rectangular-card .stat i { color:${primary} !important; font-size:0.7rem; }
    .quick-search-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:1001; align-items:center; justify-content:center; }
    .search-modal-content { background:white; border-radius:8px; width:90%; max-width:500px; max-height:80vh; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.15); }
    .search-modal-header { display:flex; justify-content:space-between; align-items:center; padding:0.8rem 1rem; background:${primary}; color:white; }
    .search-modal-header h3 { margin:0; color:white; font-size:1.1rem; }
    .close-search { background:none; border:none; color:white; font-size:1.5rem; cursor:pointer; line-height:1; touch-action:manipulation; }
    .search-modal-body { padding:1rem; }
    .global-search-input { width:100%; padding:0.8rem; border:1px solid ${borderLight}; border-radius:6px; font-size:1rem; margin-bottom:0.8rem; }
    .global-search-input:focus { outline:none; border-color:${primary}; }
    .search-results { max-height:250px; overflow-y:auto; }
    .search-result-item { padding:0.7rem; border-bottom:1px solid ${borderLight}; cursor:pointer; transition:background 0.3s; }
    .search-result-item:hover { background:${bgEnd}; }
    .search-result-item h4 { margin:0 0 0.2rem 0; color:${textSecondary}; font-size:1rem; }
    .search-result-item p { margin:0; color:${textPrimary}; font-size:0.85rem; opacity:0.8; }
    .depot-header { background:white; border-radius:8px; padding:1rem; margin-bottom:1rem; border:1px solid ${borderLight}; text-align:center; width:100%; margin-left:0; margin-right:0; }
    .depot-info { display:flex; justify-content:center; gap:0.8rem; margin-top:0.8rem; flex-wrap:wrap; max-width:100%; overflow:hidden; }
    .info-item { display:flex; align-items:center; gap:0.3rem; color:${textSecondary}; font-size:0.85rem; background:#F8FAFC; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid ${borderLight}; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .info-item i { color:${primary}; font-size:0.85rem; }
    .time-filters { display:flex; gap:0.4rem; margin:0.5rem 0 1rem 0; overflow-x:auto; padding-bottom:0.3rem; -webkit-overflow-scrolling:touch; white-space:nowrap; width:100%; padding:0; }
    .time-filters::-webkit-scrollbar { height:3px; }
    .filter-btn { padding:0.4rem 0.5rem; border:1px solid ${borderLight}; background:white; border-radius:6px; font-family:'Inter',sans-serif; font-size:0.75rem; color:${textPrimary}; cursor:pointer; white-space:nowrap; transition:all 0.3s; flex-shrink:0; font-weight:500; min-width:65px; text-align:center; }
    .filter-btn:hover { border-color:${primary}; color:${primary}; }
    .filter-btn.active { background:${primary}; color:white; border-color:${primary}; font-weight:500; }
    .bus-stop-section { margin-bottom:1rem; scroll-margin-top:150px; background:white; border-radius:8px; overflow:hidden; border:1px solid ${borderLight}; width:100%; margin-left:0; margin-right:0; padding:0; }
    .bus-stop-header { display:flex; justify-content:space-between; align-items:center; padding:0.7rem; background:linear-gradient(90deg,${bgEnd} 0%,white 100%); border-bottom:1px solid ${borderLight}; }
    .bus-stop-name { font-family:'Inter',sans-serif; font-weight:500; color:${textSecondary}; font-size:1rem; max-width:70%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .bus-count { background:${primary}; color:white; padding:0.15rem 0.4rem; border-radius:10px; font-size:0.75rem; font-weight:500; min-width:35px; text-align:center; }
    .schedule-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(56px,1fr)); gap:0.3rem; padding:0.5rem; width:100%; }
    .time-bubble { position:relative; padding:0.3rem 0.15rem; border-radius:12px; text-align:center; font-family:'Inter',sans-serif; font-weight:500; cursor:pointer; transition:all 0.3s; min-height:32px; display:flex; flex-direction:column; align-items:center; justify-content:center; user-select:none; font-size:0.7rem; border:1px solid transparent; overflow:visible; margin:0.05rem; }
    .time-bubble.morning { background:#FEF3C7; color:#92400E; border-color:#FBBF24; }
    .time-bubble.afternoon { background:#D1FAE5; color:#065F46; border-color:#10B981; }
    .time-bubble.evening { background:#E0E7FF; color:#3730A3; border-color:#6366F1; }
    .time-bubble.night { background:#F3E8FF; color:#5B21B6; border-color:#8B5CF6; }
    .time-bubble:hover { transform:scale(1.02); }
    .next-badge { position:absolute; top:-6px; right:-6px; background:${primary}; color:white; font-size:0.6rem; padding:1px 3px; border-radius:8px; font-weight:600; z-index:20; box-shadow:0 1px 2px rgba(0,0,0,0.2); animation:pulse 2s infinite; white-space:nowrap; min-width:28px; text-align:center; border:1px solid white; }
    @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    .next-bus-sparkle { position:absolute; top:0; left:0; right:0; bottom:0; border-radius:12px; border:1px solid #FFA500; animation:sparkle 2s infinite; pointer-events:none; opacity:0; box-shadow:0 0 8px rgba(255,165,0,0.7); z-index:5; }
    @keyframes sparkle { 0%,100%{opacity:0.5;border-color:#FFA500;box-shadow:0 0 8px rgba(255,165,0,0.7)} 50%{opacity:1;border-color:#FFD700;box-shadow:0 0 12px rgba(255,215,0,0.9)} }
    .site-footer { background:white; border-top:1px solid ${borderLight}; padding:1.5rem 0 2rem 0; margin-top:2rem; min-height:300px; width:100%; }
    .footer-content { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:1.5rem; }
    .footer-section h3 { color:${textSecondary}; font-size:1.1rem; margin-bottom:0.8rem; font-weight:600; }
    .footer-links { display:flex; flex-direction:column; gap:0.4rem; }
    .footer-links a { color:${textPrimary}; font-size:0.9rem; padding:0.2rem 0; transition:all 0.3s; text-decoration:none; line-height:1.4; }
    .footer-links a:hover { color:${primary}; padding-left:0.3rem; }
    .copyright { grid-column:1/-1; text-align:center; color:${textPrimary}; font-size:0.85rem; opacity:0.8; margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid ${borderLight}; line-height:1.5; }
    .seo-content { background:white; border-radius:8px; padding:1rem; margin-top:1.5rem; border:1px solid ${borderLight}; width:100%; margin-left:0; margin-right:0; }
    .seo-content h2 { color:${textSecondary}; margin-bottom:1rem; font-size:1.3rem; }
    .seo-content h3 { color:${textPrimary}; margin:1rem 0 0.8rem; font-size:1.1rem; }
    .blog-page { max-width:800px; margin:0 auto; padding:0 1rem; }
    .blog-header { text-align:center; margin-bottom:1.5rem; }
    .blog-date { color:#94A3B8; font-size:0.9rem; margin:0.3rem 0 1rem; }
    .blog-author { display:flex; align-items:center; gap:0.6rem; margin-bottom:1.5rem; padding:0.8rem; background:#F8FAFC; border-radius:6px; border:1px solid ${borderLight}; }
    .author-avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,${primary},${borderDark}); display:flex; align-items:center; justify-content:center; color:white; font-weight:600; font-size:1.2rem; }
    .author-info h4 { margin-bottom:0.2rem; color:${textPrimary}; font-size:1rem; }
    .blog-content { font-size:1rem; line-height:1.6; padding:0 0.6rem; }
    .blog-link { color:${primary}; text-decoration:none; font-weight:500; border-bottom:1px dotted ${primary}; transition:all 0.2s; cursor:pointer; }
    .blog-link:hover { color:${secondary}; border-bottom:2px solid ${secondary}; }
    .blog-image-container { margin:1.5rem 0; text-align:center; max-width:100%; overflow:hidden; border-radius:8px; border:1px solid ${borderLight}; background:white; padding:0.8rem; }
    .blog-image { max-width:100%; height:auto; border-radius:6px; display:block; margin:0 auto; transition:transform 0.3s; }
    .blog-image:hover { transform:scale(1.01); }
    .blog-image-caption { font-size:0.9rem; color:#64748B; margin-top:0.5rem; font-style:italic; text-align:center; }
    .blog-tags { display:flex; gap:0.4rem; flex-wrap:wrap; margin:1rem 0; }
    .blog-tag { background:${bgEnd}; color:${primary}; padding:0.2rem 0.6rem; border-radius:12px; font-size:0.8rem; font-weight:500; }
    .blog-table { width:100%; border-collapse:collapse; margin:1rem 0; border:1px solid #E2E8F0; border-radius:6px; overflow:hidden; }
    .blog-table th { background:linear-gradient(135deg,#493dd5,#3a2fc1); color:white; font-weight:500; padding:0.6rem; text-align:left; border-bottom:1px solid #E2E8F0; }
    .blog-table td { padding:0.6rem; border-bottom:1px solid #E2E8F0; vertical-align:top; }
    .blog-table tr:last-child td { border-bottom:none; }
    .blog-table tr:nth-child(even) { background:#F8FAFC; }
    pre { background:#2D3748; color:#E2E8F0; padding:0.8rem; border-radius:6px; overflow-x:auto; margin:1rem 0; font-family:'Courier New',monospace; font-size:0.9rem; border-left:3px solid #493dd5; }
    code { background:#EDF2F7; padding:0.1rem 0.3rem; border-radius:3px; font-family:'Courier New',monospace; font-size:0.9em; color:#2D3748; }
    pre code { background:transparent; padding:0; color:inherit; }
    blockquote { border-left:3px solid #493dd5; padding:0.8rem 1rem; margin:1rem 0; background:linear-gradient(90deg,#F8FAFC,#FFFFFF); border-radius:0 6px 6px 0; font-style:italic; color:#4A5568; }
    hr { border:none; border-top:2px solid #E2E8F0; margin:1.5rem auto; width:80%; }
    .blog-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; margin:1.5rem 0; }
    .blog-card { background:white; border:1px solid ${borderLight}; border-radius:8px; overflow:hidden; transition:all 0.3s; text-decoration:none; display:block; padding:0.8rem; }
    .blog-card:hover { border-color:${primary}; }
    .blog-card h3 { color:${textSecondary}; margin-bottom:0.6rem; font-size:1.1rem; line-height:1.3; }
    .blog-card-excerpt { color:#64748B; font-size:0.9rem; line-height:1.4; margin-bottom:0.8rem; }
    .blog-card-meta { display:flex; justify-content:space-between; align-items:center; color:#94A3B8; font-size:0.8rem; }
    .empty-state { text-align:center; padding:2rem 1rem; color:${textSecondary}; background:white; border-radius:8px; border:1px solid ${borderLight}; margin:1.5rem 0; width:100%; }
    .empty-state i { font-size:2.5rem; margin-bottom:0.8rem; color:${borderDark}; }
    .empty-state h3 { margin-bottom:0.6rem; color:${textSecondary}; font-size:1.3rem; }
    .hidden { display:none !important; }
    @media (max-width:767px) {
        html { font-size:14px; }
        .container { padding:0 0.8rem; padding-right:calc(0.8rem + 28px); }
        .division-grid,.district-grid,.tehsil-grid,.depot-grid { grid-template-columns:1fr; gap:0.5rem; }
        .rectangular-card { padding:0.7rem; min-height:75px; width:calc(100% - 5px); }
        .back-btn { padding:0.5rem 0.8rem; font-size:0.9rem; gap:0.25rem; max-width:100%; min-height:38px; }
        .search-bar { width:100%; padding:0.5rem 0.6rem; }
        .schedule-grid { grid-template-columns:repeat(auto-fill,minmax(52px,1fr)); gap:0.25rem; padding:0.4rem; }
        .time-bubble { min-height:30px; padding:0.2rem 0.1rem; font-size:0.7rem; border-radius:10px; }
        .vertical-alphabet-nav { top:110px; width:28px; background:rgba(255,255,255,0.98); }
        .alphabet-vertical-btn { width:24px; height:24px; font-size:0.8rem; margin:0.03rem 0; }
        .footer-content { grid-template-columns:1fr 1fr; gap:1.5rem; }
        .footer-section:nth-child(3) { grid-column:1/-1; }
        .ad-desktop { display:none !important; }
        .ad-mobile { display:flex !important; }
        .dropdown-group { min-width:120px; }
        .filter-dropdowns { gap:0.5rem; }
        .depot-header { width:100%; padding:0.8rem; }
        .info-item { max-width:130px; font-size:0.8rem; }
        .time-filters { width:100%; gap:0.3rem; }
        .filter-btn { padding:0.35rem 0.4rem; font-size:0.7rem; min-width:60px; }
        .bus-stop-section { width:100%; }
        .bus-stop-name { max-width:65%; font-size:1rem; }
        .related-links-grid { grid-template-columns:1fr; }
        .navigation-buttons { flex-direction:column; gap:0.6rem; }
        .back-btn { width:100%; justify-content:flex-start; }
        .blog-page { padding:0 1rem; }
        .blog-content { padding:0 0.8rem; font-size:1rem; }
        .blog-image-container { margin:1rem 0; padding:0.6rem; }
        .blog-image-caption { font-size:0.85rem; }
        .ad-content { width:100%; }
    }
    @media (min-width:768px) and (max-width:1024px) {
        html { font-size:15px; }
        .container { padding-right:calc(0.8rem + 30px); }
        .division-grid { grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); }
        .district-grid,.tehsil-grid { grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); }
        .schedule-grid { grid-template-columns:repeat(auto-fill,minmax(56px,1fr)); padding:0.5rem; }
        .blog-grid { grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); }
        .vertical-alphabet-nav { width:30px; top:110px; }
        .alphabet-vertical-btn { width:26px; height:26px; font-size:0.85rem; }
        .ad-desktop { display:none !important; }
        .ad-mobile { display:flex !important; }
        .related-links-grid { grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); }
        .back-btn { padding:0.5rem 0.8rem; font-size:0.9rem; max-width:100%; min-height:40px; }
        .search-bar { width:100%; }
        .depot-header { width:100%; }
        .time-filters { width:100%; }
        .bus-stop-section { width:100%; }
        .ad-content { width:100%; }
        .time-bubble { min-height:34px; font-size:0.75rem; }
        .blog-page { padding:0 0.8rem; }
        .blog-content { padding:0 0.6rem; }
        .blog-image-container { margin:1.2rem 0; padding:0.8rem; }
    }
    @media (min-width:1025px) {
        html { font-size:16px; }
        .container { padding-right:calc(0.8rem + 32px); }
        .division-grid { grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); }
        .district-grid,.tehsil-grid { grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); }
        .blog-grid { grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); }
        .vertical-alphabet-nav { width:32px; top:110px; }
        .alphabet-vertical-btn { width:28px; height:28px; font-size:0.9rem; }
        .ad-desktop { display:flex !important; align-items:center; justify-content:center; gap:1rem; width:100%; }
        .ad-mobile { display:none !important; }
        .related-links-grid { grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); }
        .back-btn { padding:0.6rem 1rem; font-size:1rem; gap:0.4rem; max-width:100%; min-height:42px; }
        .search-bar { width:100%; }
        .depot-header { width:100%; }
        .time-filters { width:100%; }
        .bus-stop-section { width:100%; }
        .ad-content { width:100%; }
        .schedule-grid { grid-template-columns:repeat(auto-fill,minmax(60px,1fr)); gap:0.4rem; padding:0.5rem; }
        .time-bubble { min-height:36px; font-size:0.75rem; }
        .blog-page { padding:0 1rem; }
        .blog-content { padding:0 0.8rem; }
        .blog-image-container { margin:1.5rem 0; }
    }
    @media print {
        .site-header,.search-bar-container,.vertical-alphabet-nav,.filter-btn,.time-filters,.back-btn,.ad-container,.quick-search-modal { display:none !important; }
        body { background:white; color:black; padding:0; font-size:11pt; }
        .time-bubble { break-inside:avoid; border:1px solid #ccc !important; background:white !important; color:black !important; }
    }
    @media (max-width:1000px) {
        .alphabet-vertical-btn,.filter-btn,.close-search,.clear-search { min-height:38px; min-width:38px; padding:5px 7px; }
    }
    body,html { overflow-x:hidden; max-width:100%; width:100%; }
    .container,.tabs-header,.time-filters { max-width:100%; overflow-x:hidden; }
    @media (max-width:380px) {
        .container { padding-right:calc(0.8rem + 28px); }
        .schedule-grid { grid-template-columns:repeat(auto-fill,minmax(48px,1fr)); gap:0.15rem; padding:0.3rem; }
        .time-bubble { min-height:28px; padding:0.18rem 0.08rem; font-size:0.68rem; border-radius:8px; }
        .bus-stop-name { font-size:0.95rem; }
        .time-filters { gap:0.15rem; width:100%; }
        .filter-btn { padding:0.3rem 0.35rem; font-size:0.65rem; min-width:55px; }
        .vertical-alphabet-nav { width:26px; }
        .alphabet-vertical-btn { width:22px; height:22px; font-size:0.75rem; }
        .footer-content { grid-template-columns:1fr; gap:1.2rem; }
        .footer-section:nth-child(3) { grid-column:1; }
        .division-grid,.district-grid,.tehsil-grid,.depot-grid { grid-template-columns:1fr; gap:0.4rem; }
        .rectangular-card { padding:0.6rem; min-height:70px; width:calc(100% - 5px); }
        .rectangular-card h3 { font-size:0.95rem; }
        .rectangular-card .stat { font-size:0.65rem; padding:0.06rem 0.2rem; }
        .back-btn { padding:0.45rem 0.7rem; font-size:0.85rem; max-width:100%; min-height:36px; }
        .back-btn i { font-size:0.85rem; }
        .search-bar { width:100%; padding:0.4rem 0.5rem; }
        .search-input { font-size:0.9rem; }
        .blog-content { padding:0 0.4rem; font-size:0.95rem; }
        .blog-page { padding:0 0.8rem; }
        .depot-header { width:100%; }
        .info-item { max-width:110px; font-size:0.75rem; }
        .bus-stop-section { width:100%; }
        .ad-content { width:100%; }
    }`;
    }

    getInlineJS() {
        return `// MSRTC Bus Timetable Application - with Cascading Dropdowns
class BusTimetableApp {
    constructor() {
        this.istOffset = 5.5 * 60 * 60 * 1000;
        this.activeFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        console.log('🚌 MSRTC Bus Timetable App Initialized');
        if (typeof window.getUrlFromConstant === 'undefined') console.warn('URL constants not loaded yet');
        this.updateTimeDisplay();
        setInterval(() => this.updateTimeDisplay(), 1000);
        this.initSearch();
        this.initAlphabetNavigation();
        if (document.querySelector('.time-filters')) {
            this.initFilters();
            this.initTimeClick();
            setTimeout(() => { this.highlightNextBus(); this.applyFilters(); }, 100);
        }
        this.initScrollHighlighting();
        this.preventHorizontalScroll();
        this.mobileOptimizations();
        this.initBlogLinks();
        this.initDropdowns();
    }

    updateTimeDisplay() {
        const now = new Date();
        const istTime = new Date(now.getTime() + this.istOffset);
        let hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const displayHours = hours.toString().padStart(2, '0');
        document.querySelectorAll('.current-time').forEach(el => el.textContent = \`\${displayHours}:\${minutes} \${ampm}\`);
        if (document.querySelector('.time-filters') && now.getSeconds() % 30 === 0) this.highlightNextBus();
    }

    initSearch() {
        const searchBox = document.querySelector('.search-input');
        const clearBtn = document.querySelector('.clear-search');
        if (searchBox) {
            const updateClear = () => { if(clearBtn) clearBtn.style.display = searchBox.value ? 'flex' : 'none'; };
            searchBox.addEventListener('input', (e) => { this.searchTerm = e.target.value.toLowerCase().trim(); this.filterDepotCards(); updateClear(); });
            searchBox.addEventListener('keydown', (e) => { if(e.key==='Escape'){ searchBox.value=''; this.searchTerm=''; this.filterDepotCards(); updateClear(); } if(e.key==='Enter') this.showSearchModal(); });
            updateClear();
        }
        if (clearBtn) clearBtn.addEventListener('click', () => { const sb = document.querySelector('.search-input'); if(sb){ sb.value=''; this.searchTerm=''; this.filterDepotCards(); clearBtn.style.display='none'; sb.focus(); } });
        const searchIcon = document.querySelector('.search-bar i');
        if (searchIcon) searchIcon.addEventListener('click', () => this.showSearchModal());
    }

    filterDepotCards() {
        const cards = document.querySelectorAll('#depotsGrid .rectangular-card');
        let anyVisible = false;
        const divVal = document.getElementById('divisionFilter')?.value || '';
        const distVal = document.getElementById('districtFilter')?.value || '';
        const tehVal = document.getElementById('tehsilFilter')?.value || '';
        const depotVal = document.getElementById('depotFilter')?.value || '';
        cards.forEach(card => {
            let match = true;
            if(divVal && card.dataset.divisionId !== divVal) match=false;
            if(match && distVal && card.dataset.districtId !== distVal) match=false;
            if(match && tehVal && card.dataset.tehsilId !== tehVal) match=false;
            if(match && depotVal && card.dataset.depotId !== depotVal) match=false;
            if(match && this.searchTerm) {
                const name = card.querySelector('h3')?.innerText.toLowerCase() || '';
                if(!name.includes(this.searchTerm)) match=false;
            }
            card.style.display = match ? 'flex' : 'none';
            if(match) anyVisible=true;
        });
        const empty = document.getElementById('emptyDepotsState');
        if(empty) empty.classList.toggle('hidden', anyVisible);
        this.updateVerticalAlphabetVisibility();
    }

    updateVerticalAlphabetVisibility() {
        const visible = Array.from(document.querySelectorAll('#depotsGrid .rectangular-card')).filter(c => c.style.display !== 'none');
        const letters = new Set(visible.map(c => c.querySelector('h3')?.innerText.charAt(0).toUpperCase()).filter(l=>l));
        document.querySelectorAll('.alphabet-vertical-btn').forEach(btn => {
            if(letters.has(btn.dataset.letter)) btn.classList.remove('disabled');
            else btn.classList.add('disabled');
        });
    }

    initDropdowns() {
        const divSel = document.getElementById('divisionFilter');
        const distSel = document.getElementById('districtFilter');
        const tehSel = document.getElementById('tehsilFilter');
        const depotSel = document.getElementById('depotFilter');
        if(!divSel) return;
        const updateDistrict = () => {
            const selected = divSel.value;
            distSel.innerHTML = '<option value="">All Districts</option>';
            tehSel.innerHTML = '<option value="">All Tehsils</option>';
            depotSel.innerHTML = '<option value="">All Depots</option>';
            const filtered = selected ? window.DISTRICTS_DATA.filter(d=>d.division_id===selected) : window.DISTRICTS_DATA;
            filtered.forEach(d=>{ const opt=document.createElement('option'); opt.value=d.id; opt.textContent=d.name; distSel.appendChild(opt); });
            this.filterDepotCards();
        };
        const updateTehsil = () => {
            const selDiv = divSel.value;
            const selDist = distSel.value;
            tehSel.innerHTML = '<option value="">All Tehsils</option>';
            depotSel.innerHTML = '<option value="">All Depots</option>';
            let filtered = window.TEHSILS_DATA;
            if(selDist) filtered = filtered.filter(t=>t.district_id===selDist);
            else if(selDiv) filtered = filtered.filter(t=>{ const d=window.DISTRICTS_DATA.find(ds=>ds.id===t.district_id); return d && d.division_id===selDiv; });
            filtered.forEach(t=>{ const opt=document.createElement('option'); opt.value=t.id; opt.textContent=t.name; tehSel.appendChild(opt); });
            this.filterDepotCards();
        };
        const updateDepot = () => {
            const selDiv = divSel.value;
            const selDist = distSel.value;
            const selTeh = tehSel.value;
            depotSel.innerHTML = '<option value="">All Depots</option>';
            let filtered = window.DEPOTS_DATA;
            if(selTeh) filtered = filtered.filter(d=>d.tehsil_id===selTeh);
            else if(selDist) filtered = filtered.filter(d=>{ const t=window.TEHSILS_DATA.find(tt=>tt.id===d.tehsil_id); return t && t.district_id===selDist; });
            else if(selDiv) filtered = filtered.filter(d=>{ const t=window.TEHSILS_DATA.find(tt=>tt.id===d.tehsil_id); if(!t) return false; const dt=window.DISTRICTS_DATA.find(ds=>ds.id===t.district_id); return dt && dt.division_id===selDiv; });
            filtered.forEach(d=>{ const opt=document.createElement('option'); opt.value=d.id; opt.textContent=d.name; depotSel.appendChild(opt); });
            this.filterDepotCards();
        };
        divSel.addEventListener('change',()=>{ updateDistrict(); updateTehsil(); updateDepot(); });
        distSel.addEventListener('change',()=>{ updateTehsil(); updateDepot(); });
        tehSel.addEventListener('change',()=>{ updateDepot(); });
        depotSel.addEventListener('change',()=>this.filterDepotCards());
        window.DIVISIONS_DATA.forEach(d=>{ const opt=document.createElement('option'); opt.value=d.id; opt.textContent=d.name; divSel.appendChild(opt); });
        updateDistrict(); updateTehsil(); updateDepot();
    }

    showSearchModal() {
        const modal = document.getElementById('searchModal');
        if(!modal) return;
        modal.style.display = 'flex';
        modal.querySelector('.global-search-input').focus();
        const close = modal.querySelector('.close-search');
        close.addEventListener('click',()=>modal.style.display='none');
        close.addEventListener('touchstart',(e)=>{e.preventDefault(); modal.style.display='none';});
        modal.addEventListener('click',(e)=>{if(e.target===modal) modal.style.display='none';});
        document.addEventListener('keydown',(e)=>{if(e.key==='Escape' && modal.style.display==='flex') modal.style.display='none';});
        this.initGlobalSearch();
    }

    initGlobalSearch() {
        const input = document.querySelector('.global-search-input');
        const results = document.getElementById('searchResults');
        if(!input || !results) return;
        if(typeof window.searchIndex === 'undefined'){
            const script = document.createElement('script');
            script.src = 'search-index.js';
            script.onload = () => this.performGlobalSearch(input, results);
            document.head.appendChild(script);
        } else this.performGlobalSearch(input, results);
    }

    performGlobalSearch(input, results) {
        input.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            if(q.length<1){ results.innerHTML='<div class="search-result-item"><p>Type to search...</p></div>'; return; }
            const all = [];
            if(window.searchIndex?.divisions) all.push(...window.searchIndex.divisions.filter(i=>i.name.toLowerCase().includes(q)||i.type.toLowerCase().includes(q)||(i.alphabet&&i.alphabet.toLowerCase()===q)));
            if(window.searchIndex?.districts) all.push(...window.searchIndex.districts.filter(i=>i.name.toLowerCase().includes(q)||i.division.toLowerCase().includes(q)||i.type.toLowerCase().includes(q)||(i.alphabet&&i.alphabet.toLowerCase()===q)));
            if(window.searchIndex?.tehsils) all.push(...window.searchIndex.tehsils.filter(i=>i.name.toLowerCase().includes(q)||i.division.toLowerCase().includes(q)||i.district.toLowerCase().includes(q)||i.type.toLowerCase().includes(q)||(i.alphabet&&i.alphabet.toLowerCase()===q)));
            if(window.searchIndex?.depots) all.push(...window.searchIndex.depots.filter(i=>i.name.toLowerCase().includes(q)||i.division.toLowerCase().includes(q)||i.district.toLowerCase().includes(q)||i.tehsil.toLowerCase().includes(q)||i.type.toLowerCase().includes(q)||(i.alphabet&&i.alphabet.toLowerCase()===q)));
            all.sort((a,b)=>{ const aEx=a.name.toLowerCase()===q, bEx=b.name.toLowerCase()===q; if(aEx&&!bEx) return -1; if(!aEx&&bEx) return 1; return a.name.localeCompare(b.name); });
            const filtered = all.slice(0,25);
            if(filtered.length===0) results.innerHTML='<div class="search-result-item"><p>No results found</p></div>';
            else {
                results.innerHTML = filtered.map(item => {
                    let desc = \`\${item.type}\`;
                    if(item.division) desc += \` • \${item.division}\`;
                    if(item.district) desc += \` • \${item.district}\`;
                    if(item.tehsil) desc += \` • \${item.tehsil}\`;
                    if(item.busStops) desc += \` • \${item.busStops} stops\`;
                    if(item.buses) desc += \` • \${item.buses} buses\`;
                    return \`<div class="search-result-item" data-url="\${item.path}"><h4>\${item.name}</h4><p>\${desc}</p></div>\`;
                }).join('');
                results.querySelectorAll('.search-result-item').forEach(el=>el.addEventListener('click',()=>{ window.location.href=el.dataset.url; document.getElementById('searchModal').style.display='none'; }));
            }
        });
        input.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ const first=results.querySelector('.search-result-item'); if(first) first.click(); } if(e.key==='Escape') document.getElementById('searchModal').style.display='none'; });
    }

    initAlphabetNavigation() {
        document.querySelectorAll('.alphabet-vertical-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { if(btn.classList.contains('disabled')) return; this.jumpToLetter(btn.dataset.letter); this.highlightAlphabetButton(btn); });
            btn.addEventListener('touchstart', (e)=>{ e.preventDefault(); btn.click(); });
        });
    }

    highlightAlphabetButton(clicked) { document.querySelectorAll('.alphabet-vertical-btn').forEach(btn=>btn.classList.remove('active')); clicked.classList.add('active'); }

    jumpToLetter(letter) {
        const cards = Array.from(document.querySelectorAll('#depotsGrid .rectangular-card')).filter(c=>c.style.display!=='none');
        for(let card of cards){
            const title = card.querySelector('h3')?.innerText;
            if(title && title.charAt(0).toUpperCase()===letter.toUpperCase()){
                const headerHeight = document.querySelector('.site-header').offsetHeight + 60;
                const cardTop = card.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top: cardTop, behavior: 'smooth' });
                this.highlightElement(card);
                break;
            }
        }
    }

    highlightElement(el) {
        const originalBoxShadow = el.style.boxShadow;
        const originalBg = el.style.backgroundColor;
        el.style.boxShadow = '0 0 0 2px rgba(73,61,213,0.3)';
        el.style.backgroundColor = 'rgba(237,233,254,0.5)';
        setTimeout(()=>{ el.style.boxShadow=originalBoxShadow; el.style.backgroundColor=originalBg; },1000);
    }

    initScrollHighlighting() {
        let timeout;
        window.addEventListener('scroll', ()=>{ clearTimeout(timeout); timeout=setTimeout(()=>this.updateActiveAlphabet(),50); });
        setTimeout(()=>this.updateActiveAlphabet(),200);
    }

    updateActiveAlphabet() {
        const cards = Array.from(document.querySelectorAll('#depotsGrid .rectangular-card')).filter(c=>c.style.display!=='none');
        if(!cards.length) return;
        let closest=null, closestDist=Infinity, scrollPos=window.scrollY+100;
        cards.forEach(card=>{ const top=card.offsetTop; const dist=Math.abs(scrollPos-top); if(dist<closestDist){ closestDist=dist; closest=card; } });
        if(closest){
            const letter = closest.querySelector('h3')?.innerText.charAt(0).toUpperCase();
            if(letter) document.querySelectorAll('.alphabet-vertical-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.letter===letter));
        }
    }

    initFilters() {
        const btns = document.querySelectorAll('.filter-btn');
        btns.forEach(btn=>btn.addEventListener('click',(e)=>{ e.preventDefault(); btns.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); this.activeFilter=btn.dataset.filter; this.applyFilters(); }));
    }

    applyFilters() {
        const sections = document.querySelectorAll('.bus-stop-section');
        let hasVisible = false;
        sections.forEach(section => {
            const busStopName = section.querySelector('.bus-stop-name').textContent.toLowerCase();
            const bubbles = section.querySelectorAll('.time-bubble');
            let visibleCount = 0;
            if(this.searchTerm && !busStopName.includes(this.searchTerm)){ section.classList.add('hidden'); return; }
            bubbles.forEach(bubble => {
                const cat = this.getTimeCategory(bubble.dataset.time);
                if(this.activeFilter==='all' || cat===this.activeFilter){ bubble.classList.remove('hidden'); visibleCount++; }
                else bubble.classList.add('hidden');
            });
            if(visibleCount>0){ section.classList.remove('hidden'); hasVisible=true; }
            else section.classList.add('hidden');
            const countSpan = section.querySelector('.bus-count');
            if(countSpan) countSpan.textContent = visibleCount;
        });
        const empty = document.querySelector('.empty-state');
        if(empty) empty.classList.toggle('hidden', hasVisible);
        setTimeout(()=>this.highlightNextBus(),50);
        setTimeout(()=>this.updateActiveAlphabet(),100);
    }

    getTimeCategory(timeStr) {
        const [h] = timeStr.split(':').map(Number);
        if(h>=5 && h<12) return 'morning';
        if(h>=12 && h<17) return 'afternoon';
        if(h>=17 && h<22) return 'evening';
        return 'night';
    }

    highlightNextBus() {
        document.querySelectorAll('.next-badge').forEach(b=>b.remove());
        document.querySelectorAll('.time-bubble.next-bus').forEach(b=>{ b.classList.remove('next-bus'); const s=b.querySelector('.next-bus-sparkle'); if(s) s.remove(); });
        const now = new Date();
        const curTotal = now.getHours()*60+now.getMinutes();
        const all = Array.from(document.querySelectorAll('.time-bubble:not(.hidden)'));
        const upcoming = [];
        all.forEach(bubble=>{
            const [h,m] = bubble.dataset.time.split(':').map(Number);
            let diff = (h*60+m) - curTotal;
            if(diff<0) diff+=24*60;
            if(diff>=0 && diff<=60) upcoming.push({bubble, diff});
        });
        upcoming.sort((a,b)=>a.diff-b.diff);
        upcoming.forEach((bus,idx)=>{
            const badge = document.createElement('div');
            badge.className = 'next-badge';
            badge.textContent = idx===0 ? 'NEXT' : \`+\${bus.diff}m\`;
            bus.bubble.classList.add('next-bus');
            const sparkle = document.createElement('div');
            sparkle.className = 'next-bus-sparkle';
            bus.bubble.appendChild(sparkle);
            bus.bubble.style.position = 'relative';
            bus.bubble.appendChild(badge);
        });
    }

    initTimeClick() {
        document.addEventListener('click',(e)=>{
            const bubble = e.target.closest('.time-bubble');
            if(bubble){
                const time = bubble.dataset.time;
                const stop = bubble.closest('.bus-stop-section').querySelector('.bus-stop-name').textContent;
                this.showBusDetails(time, stop);
            }
        });
    }

    showBusDetails(time, stop) {
        const [h,m] = time.split(':').map(Number);
        const cat = this.getTimeCategory(time);
        const catNames = { morning:'🌅 Morning', afternoon:'☀️ Afternoon', evening:'🌇 Evening', night:'🌙 Night' };
        const hour12 = h%12||12;
        const ampm = h>=12?'PM':'AM';
        const display = \`\${hour12}:\${m.toString().padStart(2,'0')}\${ampm}\`;
        const period = catNames[cat];
        const now = new Date();
        const busTime = new Date(now); busTime.setHours(h,m,0,0);
        if(busTime<now) busTime.setDate(busTime.getDate()+1);
        const diff = Math.floor((busTime-now)/(1000*60));
        let msg = '';
        if(diff<60) msg = \`in \${diff} min\`;
        else { const hh = Math.floor(diff/60); const mm = diff%60; msg = \`in \${hh}h \${mm}m\`; }
        alert(\`🚌 Bus Details\\n\\n📍 Stop: \${stop}\\n🕐 Time: \${display}\\n⏰ \${period} (\${msg})\\n\\n💡 Arrive 10-15 min before\`);
    }

    initBlogLinks() {
        setTimeout(()=>{
            if(typeof window.handleBlogLinkClick !== 'undefined')
                document.querySelectorAll('.blog-link[data-constant]').forEach(link=>link.addEventListener('click',window.handleBlogLinkClick));
        },500);
    }

    mobileOptimizations() { if('ontouchstart' in window) document.documentElement.style.setProperty('--transition-speed','0.2s'); }
    preventHorizontalScroll() { document.body.style.overflowX='hidden'; document.documentElement.style.overflowX='hidden'; window.addEventListener('resize',()=>{ document.body.style.overflowX='hidden'; document.documentElement.style.overflowX='hidden'; }); }
}

document.addEventListener('DOMContentLoaded', () => { window.busApp = new BusTimetableApp(); });`;
    }

    getDistrictsForDivision(divisionId) { return Object.values(this.data.districts).filter(d => d.division_id === divisionId); }
    getTehsilsForDistrict(districtId) { return Object.values(this.data.tehsils).filter(t => t.district_id === districtId); }
    getDepotsForTehsil(tehsilId) { return Object.values(this.data.depots).filter(d => d.tehsil_id === tehsilId); }
    getDepotCountForDivision(divisionId) { const dists = this.getDistrictsForDivision(divisionId); return dists.reduce((c,d)=>c+this.getDepotCountForDistrict(d.id),0); }
    getDepotCountForDistrict(districtId) { const tehs = this.getTehsilsForDistrict(districtId); return tehs.reduce((c,t)=>c+this.getDepotsForTehsil(t.id).length,0); }
    getDefaultSEOContent(type) { return { title: '', content: '' }; }
    writeFile(filePath, content) { const full = path.join(this.publicDir, filePath); const dir = path.dirname(full); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(full, content, 'utf8'); }

    generateSitemap() {
        console.log('🗺️  Generating sitemap.xml...');
        const baseUrl = this.config.base_url;
        const today = new Date().toISOString().split('T')[0];
        const urls = [
            { loc: `${baseUrl}/`, lastmod: today, priority: '1.0', changefreq: 'daily' },
            { loc: `${baseUrl}/bus-schedule.html`, lastmod: today, priority: '0.9', changefreq: 'daily' },
            ...['about','contact','terms','privacy','disclaimer'].map(p => ({ loc: `${baseUrl}/${p}.html`, lastmod: today, priority: '0.8', changefreq: 'monthly' })),
            { loc: `${baseUrl}/blogs/index.html`, lastmod: today, priority: '0.9', changefreq: 'weekly' },
            ...this.blogs.map(b => ({ loc: `${baseUrl}/blogs/${b.id}.html`, lastmod: new Date(b.date).toISOString().split('T')[0], priority: '0.7', changefreq: 'monthly' }))
        ];
        Object.values(this.data.depots).forEach(depot => {
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;
            if (division && district && tehsil) urls.push({ loc: `${baseUrl}/${division.id}/${district.id}/${tehsil.id}/${depot.id}/index.html`, lastmod: today, priority: '0.6', changefreq: 'daily' });
        });
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `    <url>\n        <loc>${u.loc}</loc>\n        <lastmod>${u.lastmod}</lastmod>\n        <changefreq>${u.changefreq}</changefreq>\n        <priority>${u.priority}</priority>\n    </url>`).join('\n')}\n</urlset>`;
        this.writeFile('sitemap.xml', sitemap);
        console.log('   ✓ Sitemap generated');
    }

    generateRobotsTxt() {
        console.log('🤖 Generating robots.txt...');
        this.writeFile('robots.txt', `User-agent: *\nAllow: /\nDisallow: /data/\nSitemap: ${this.config.base_url}/sitemap.xml`);
        console.log('   ✓ Robots.txt generated');
    }

    printStats() {
        console.log('\n📊 GENERATION STATISTICS');
        console.log('=======================');
        console.log(`🏛️  Divisions: ${Object.keys(this.data.divisions).length}`);
        console.log(`📍 Districts: ${Object.keys(this.data.districts).length}`);
        console.log(`🏘️  Tehsils: ${Object.keys(this.data.tehsils).length}`);
        console.log(`🚌 Depots: ${Object.keys(this.data.depots).length}`);
        console.log(`📝 Blogs: ${this.blogs.length}`);
        console.log(`🔗 Related Depots Data: ${Object.keys(this.relatedDepotsData).length} depots have related depots`);
        console.log(`🔗 URL Constants: ${Object.keys(this.urlConstants).length} constants loaded`);
        console.log(`📢 Ads: ${this.ads ? this.ads.length : 0} ads loaded`);
        let totalBusStops = 0, totalBuses = 0;
        Object.values(this.data.depots).forEach(depot => {
            if (depot.villages) Object.values(depot.villages).forEach(bsl => { totalBusStops += bsl.length; bsl.forEach(bs => { totalBuses += bs.schedule ? bs.schedule.length : 0; }); });
        });
        console.log(`📍 Bus Stops: ${totalBusStops}`);
        console.log(`🕐 Total Bus Schedules: ${totalBuses}`);
        const htmlCount = this.countHTMLFiles(this.publicDir);
        console.log(`📁 Pages Generated: ${htmlCount}`);
        if (fs.existsSync(this.publicImagesDir)) {
            const imgCount = fs.readdirSync(this.publicImagesDir).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f)).length;
            console.log(`🖼️  Images in public/assets/images/: ${imgCount}`);
        }
        const faviconFiles = [];
        if (fs.existsSync(this.publicDir)) {
            const pubFiles = fs.readdirSync(this.publicDir);
            const favNames = ['favicon.ico','favicon.png','favicon.jpg','favicon.jpeg','favicon.svg','icon.png','icon.jpg','icon.jpeg','icon.ico','icon.svg'];
            favNames.forEach(n => { if(pubFiles.includes(n)) faviconFiles.push(n); });
        }
        console.log(`🌟 Favicon files in public root: ${faviconFiles.length > 0 ? faviconFiles.join(', ') : 'None found'}`);
        console.log('\n✅ All features work including new homepage and bus schedule page.');
    }

    countHTMLFiles(dir) {
        let count = 0;
        if (!fs.existsSync(dir)) return 0;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        items.forEach(item => {
            const itemPath = path.join(dir, item.name);
            if (item.isDirectory()) count += this.countHTMLFiles(itemPath);
            else if (item.isFile() && item.name.endsWith('.html')) count++;
        });
        return count;
    }
}

if (require.main === module) {
    try {
        const generator = new SiteGenerator();
        generator.generateSite();
    } catch (error) {
        console.error('❌ Error generating site:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

module.exports = SiteGenerator;