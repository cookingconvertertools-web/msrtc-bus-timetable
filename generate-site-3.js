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

        // Clean public directory before anything else
        this.cleanPublicDirectory();

        // Ensure directories exist
        [this.templateDir, this.blogsDir, this.imagesDir, this.publicImagesDir, this.urlsDir, this.publicUrlsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Copy images from assets/img to public/assets/images (including subfolders)
        this.copyImagesToPublic();

        // Copy URLs from assets/urls to public/assets/urls
        this.copyUrlsToPublic();

        this.config = this.loadConfig();
        this.content = this.loadContent();
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

        // Google Sheets config (from site-config.json)
        this.googleSheets = this.config.google_sheets || {};
        this.spreadsheetId = this.googleSheets.spreadsheet_id || '';
        this.sheetName = this.googleSheets.sheet_name || 'Sheet1';
        this.apiKey = process.env.GOOGLE_SHEETS_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️  WARNING: GOOGLE_SHEETS_API_KEY environment variable not set. Ads will not work.');
        }
    }

    cleanPublicDirectory() {
        console.log('🧹 Cleaning public directory...');
        if (fs.existsSync(this.publicDir)) {
            fs.rmSync(this.publicDir, { recursive: true, force: true });
            console.log('   ✓ Removed old public directory');
        }
        fs.mkdirSync(this.publicDir, { recursive: true });
        console.log('   ✓ Created fresh public directory');
    }

    copyImagesToPublic() {
        console.log('🖼️  Copying images from assets/img to public/assets/images (recursively)...');
        if (fs.existsSync(this.imagesDir)) {
            // First, copy favicon files to public root (existing behavior)
            const imageFiles = fs.readdirSync(this.imagesDir);
            const faviconFiles = imageFiles.filter(file => {
                const lowerFile = file.toLowerCase();
                return lowerFile.includes('favicon') || lowerFile.includes('icon') || lowerFile.endsWith('.ico');
            });
            faviconFiles.forEach(file => {
                const sourcePath = path.join(this.imagesDir, file);
                const destPath = path.join(this.publicDir, file);
                try {
                    fs.copyFileSync(sourcePath, destPath);
                    console.log(`   ✓ Copied favicon: ${file} → ${file}`);
                } catch (error) {
                    console.error(`   ✗ Error copying favicon ${file}:`, error.message);
                }
            });

            // Recursively copy entire assets/img folder to public/assets/images/
            try {
                if (fs.cpSync) {
                    fs.cpSync(this.imagesDir, this.publicImagesDir, { recursive: true, force: true });
                    console.log(`   ✓ Recursively copied all images (including subfolders) to ${this.publicImagesDir}`);
                } else {
                    this.copyFolderRecursive(this.imagesDir, this.publicImagesDir);
                    console.log(`   ✓ Recursively copied all images (fallback) to ${this.publicImagesDir}`);
                }
            } catch (err) {
                console.error(`   ✗ Error recursively copying images: ${err.message}`);
                imageFiles.forEach(file => {
                    if (faviconFiles.includes(file)) return;
                    const sourcePath = path.join(this.imagesDir, file);
                    const destPath = path.join(this.publicImagesDir, file);
                    try {
                        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].some(ext => file.toLowerCase().endsWith(ext))) {
                            if (!fs.existsSync(this.publicImagesDir)) fs.mkdirSync(this.publicImagesDir, { recursive: true });
                            fs.copyFileSync(sourcePath, destPath);
                            console.log(`   ✓ Copied: ${file} → assets/images/${file}`);
                        }
                    } catch (error) {
                        console.error(`   ✗ Error copying ${file}:`, error.message);
                    }
                });
            }
        } else {
            console.log('   ℹ️  No assets/img directory found');
        }
    }

    copyFolderRecursive(src, dest) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (let entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                this.copyFolderRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
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
                    if (!fs.existsSync(this.publicUrlsDir)) fs.mkdirSync(this.publicUrlsDir, { recursive: true });
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
                    if (Array.isArray(content)) {
                        content.forEach(item => {
                            const depotId = item.depots_id || item.depot_id || item.depot;
                            if (depotId) {
                                if (!relatedDepots[depotId]) relatedDepots[depotId] = [];
                                if (item.related_depots && Array.isArray(item.related_depots)) {
                                    relatedDepots[depotId].push(...item.related_depots.map(related => ({
                                        depot_id: related.depot_id || related.depots_id || related.depot,
                                        division_id: related.division_id || null,
                                        district_id: related.district_id || null,
                                        tehsil_id: related.tehsil_id || null
                                    })));
                                } else if (item.related_depots_id) {
                                    const relatedIds = item.related_depots_id;
                                    if (Array.isArray(relatedIds)) {
                                        relatedDepots[depotId].push(...relatedIds.map(depotId => ({ depot_id: depotId })));
                                    } else if (typeof relatedIds === 'string') {
                                        relatedDepots[depotId].push(...relatedIds.split(',').map(id => id.trim()).map(depotId => ({ depot_id: depotId })));
                                    }
                                }
                            }
                        });
                    } else if (typeof content === 'object') {
                        const depotId = content.depots_id || content.depot_id || content.depot;
                        if (depotId) {
                            relatedDepots[depotId] = [];
                            if (content.related_depots && Array.isArray(content.related_depots)) {
                                relatedDepots[depotId] = content.related_depots.map(related => ({
                                    depot_id: related.depot_id || related.depots_id || related.depot,
                                    division_id: related.division_id || null,
                                    district_id: related.district_id || null,
                                    tehsil_id: related.tehsil_id || null
                                }));
                            } else if (content.related_depots_id) {
                                const relatedIds = content.related_depots_id;
                                if (Array.isArray(relatedIds)) {
                                    relatedDepots[depotId] = relatedIds.map(depotId => ({ depot_id: depotId }));
                                } else if (typeof relatedIds === 'string') {
                                    relatedDepots[depotId] = relatedIds.split(',').map(id => id.trim()).map(depotId => ({ depot_id: depotId }));
                                }
                            }
                        }
                    }
                    console.log(`   ✓ Loaded related depots from: ${file}`);
                } catch (error) {
                    console.error(`   ✗ Error loading related depots file ${file}:`, error.message);
                }
            });
            // Fill missing hierarchy from depot data
            Object.keys(relatedDepots).forEach(depotId => {
                relatedDepots[depotId] = relatedDepots[depotId].map(related => {
                    if (related.division_id && related.district_id && related.tehsil_id) return related;
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
                    return related;
                }).filter(related => related.depot_id);
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
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            // Ensure google_sheets section exists
            if (!config.google_sheets) {
                console.warn('⚠️  No google_sheets section in site-config.json. Ads will be disabled.');
                config.google_sheets = {};
            }
            return config;
        } catch (error) {
            console.error('❌ Error loading site-config.json:', error.message);
            return {
                base_url: 'http://localhost:3000',
                site_name: 'MSRTC Bus Timetable',
                theme: { bg_gradient_start: '#F5F3FF', bg_gradient_end: '#EDE9FE', primary_color: '#493dd5', secondary_color: '#3a2fc1' },
                google_sheets: {}
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
                    maharashtra_darshan_intro: '<p>Discover the beauty of Maharashtra with MSRTC buses!</p>',
                    maharashtra_darshan_bullets: ['🏛️ Explore UNESCO sites', '⛰️ Trek the Sahyadris'],
                    maharashtra_darshan_footer: '<p>Start your journey today!</p>',
                    seo: { title: 'MSRTC Bus Timetable', description: 'Real-time MSRTC bus schedules', keywords: 'MSRTC, bus schedule' }
                }
            };
        }
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
                    if (blogContent.content) blogContent.content = this.processBlogContent(blogContent.content);
                    blogs.push(blogContent);
                    console.log(`   ✓ Loaded blog: ${blogContent.title}`);
                } catch (error) {
                    console.error(`   ✗ Error loading blog ${file}:`, error.message);
                }
            });
        }
        return blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    processBlogContent(content) {
        if (!content) return '';
        let html = content;
        // Convert images: ![alt](url) – leave URL unchanged
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="blog-image" loading="lazy">');
        // Convert links: [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        // Convert headings
        html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
        html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
        html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        // Convert bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        // Convert line breaks
        const paragraphs = html.split(/\n\s*\n/);
        html = paragraphs.map(p => {
            p = p.trim();
            if (!p) return '';
            p = p.replace(/\n/g, '<br>');
            return `<p>${p}</p>`;
        }).join('');
        return html;
    }

    processMarkdown(content) {
        return this.processBlogContent(content);
    }

    renderHeadScripts() {
        return '';
    }

    // Helper: get global Google Sheets script block
    getGoogleSheetsScriptBlock() {
        return `<script>
            window.GOOGLE_SHEETS_API_KEY = "${this.apiKey.replace(/"/g, '\\"')}";
            window.SPREADSHEET_ID = "${this.spreadsheetId.replace(/"/g, '\\"')}";
            window.SHEET_NAME = "${this.sheetName.replace(/"/g, '\\"')}";
        </script>`;
    }

    generateSite() {
        console.log('\n🚀 Starting MSRTC Bus Timetable Site Generation...');
        console.log('==============================================\n');
        this.generateNewHomepage();
        this.generateBusSchedulePage();
        this.generateStaticPages();
        this.generateBlogPages();
        this.generateDepotPages();
        this.generateSitemap();
        this.generateRobotsTxt();
        this.generateSearchIndex();
        this.generateUrlConstantsFile();
        console.log('\n✅ Site generation complete!');
        this.printStats();
    }

    getDepotRelativePath(depot) {
        let tehsil = this.data.tehsils[depot.tehsil_id];
        let district = tehsil ? this.data.districts[tehsil.district_id] : null;
        let division = district ? this.data.divisions[district.division_id] : null;
        const divId = division ? division.id : 'unknown';
        const distId = district ? district.id : 'unknown';
        const tehId = tehsil ? tehsil.id : 'unknown';
        if (!division || !district || !tehsil) {
            console.warn(`   ⚠️  Incomplete hierarchy for depot "${depot.name}" (ID: ${depot.id}). Using fallback path: ${divId}/${distId}/${tehId}/${depot.id}/index.html`);
        }
        return `${divId}/${distId}/${tehId}/${depot.id}/index.html`;
    }

    generateNewHomepage() {
        console.log('📄 Generating new Maharashtra Darshan homepage (index.html)...');
        const homepageContent = this.content.homepage || {};
        const seoContent = homepageContent.seo || {};
        const faviconLinks = this.generateFaviconLinks('.');
        const recentBlogs = this.blogs.slice(0, 6);
        const blogCardsHtml = recentBlogs.length > 0 ? `
            <div class="homepage-blogs">
                <h2>Latest Travel Updates & Guides</h2>
                <div class="blog-grid">
                    ${recentBlogs.map(blog => `
                        <a href="blogs/${blog.id}.html" class="blog-card">
                            <div class="blog-card-content">
                                <h3>${this.escapeHtml(blog.title)}</h3>
                                <div class="blog-card-excerpt">${this.escapeHtml(blog.excerpt || blog.content.substring(0, 120) + '...')}</div>
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
        const maharashtraIntro = homepageContent.maharashtra_darshan_intro || `<p>Discover the beauty of Maharashtra with MSRTC buses!</p>`;
        const bulletPoints = homepageContent.maharashtra_darshan_bullets || ["🏛️ Explore UNESCO sites", "⛰️ Trek the Sahyadris"];
        const bulletsHtml = `<div class="maharashtra-darshan-bullets"><h3>Why choose MSRTC for Maharashtra Darshan?</h3><ul>${bulletPoints.map(point => `<li>${point}</li>`).join('')}</ul></div>`;
        const finalParagraph = homepageContent.maharashtra_darshan_footer || `<p>Start your Maharashtra Darshan today!</p>`;
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(seoContent.title || 'MSRTC Bus Timetable - Maharashtra Darshan')}</title>
    <meta name="description" content="${this.escapeHtml(seoContent.description || 'Plan your Maharashtra Darshan with MSRTC bus schedules.')}">
    <meta name="keywords" content="${this.escapeHtml(seoContent.keywords || 'MSRTC, Maharashtra bus, bus schedule')}">
    ${this.renderHeadScripts()}
    ${faviconLinks}
    <meta property="og:title" content="${this.escapeHtml(seoContent.title || 'MSRTC Bus Timetable')}">
    <meta property="og:description" content="${this.escapeHtml(seoContent.description || 'Real-time bus schedules for Maharashtra Darshan')}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${this.config.base_url}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>${this.getInlineCSS()}</style>
    <script src="assets/urls/url-constants.js"></script>
    ${this.getGoogleSheetsScriptBlock()}
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"${this.config.site_name}","url":"${this.config.base_url}","description":"${this.escapeHtml(seoContent.description || '')}"}</script>
</head>
<body>
    <header class="site-header"><div class="container"><div class="header-content"><div class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></div><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    ${this.renderAdContainer('top')}
    <main class="main-content"><div class="container">
        <h1 class="text-center">${this.escapeHtml(homepageContent.title || 'MSRTC Bus Timetable')}</h1>
        <p class="text-center">${this.escapeHtml(homepageContent.subtitle || 'Your guide to Maharashtra Darshan by bus')}</p>
        <div class="maharashtra-intro">${maharashtraIntro}</div>
        ${blogCardsHtml}
        ${this.renderAdContainer('middle')}
        <div class="maharashtra-details">${bulletsHtml}<div class="final-paragraph">${finalParagraph}</div></div>
    </div></main>
    ${this.renderAdContainer('footer')}
    ${this.renderFooter()}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search divisions, districts, tehsils, depots..."><div class="search-results" id="searchResults"></div></div></div></div>
    <script>${this.getInlineJS()}</script>
</body>
</html>`;
        this.writeFile('index.html', html);
        console.log('   ✓ New homepage (index.html) generated');
    }

    generateBusSchedulePage() {
        console.log('📄 Generating bus schedule page (bus-schedule.html)...');
        const seoContent = { title: 'MSRTC Bus Schedules - Find All Depots', description: 'Search and filter MSRTC bus depots across Maharashtra.', keywords: 'MSRTC schedule, bus timetable, depot list' };
        const faviconLinks = this.generateFaviconLinks('.');
        const divisions = Object.values(this.data.divisions).sort((a, b) => a.name.localeCompare(b.name));
        const districts = Object.values(this.data.districts).sort((a, b) => a.name.localeCompare(b.name));
        const tehsils = Object.values(this.data.tehsils).sort((a, b) => a.name.localeCompare(b.name));
        const depots = Object.values(this.data.depots).sort((a, b) => a.name.localeCompare(b.name));
        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${seoContent.title} - ${this.config.site_name}</title><meta name="description" content="${seoContent.description}"><meta name="keywords" content="${seoContent.keywords}">${this.renderHeadScripts()}${faviconLinks}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"><style>${this.getInlineCSS()}</style><script src="assets/urls/url-constants.js"></script>${this.getGoogleSheetsScriptBlock()}</head>
<body>
    <header class="site-header"><div class="container"><div class="header-content"><a href="index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    <div class="vertical-alphabet-nav" id="verticalAlphabet">${this.renderVerticalAlphabet()}</div>
    ${this.renderAdContainer('top')}
    <main class="main-content"><div class="container">
        <div class="navigation-buttons"><a href="index.html" class="back-btn"><i class="bi bi-house"></i> Home</a></div>
        <h1 class="text-center">All MSRTC Bus Depots</h1><p class="text-center">Find and filter depots across Maharashtra</p>
        <div class="filter-dropdowns"><div class="dropdown-group"><label>Division</label><select id="divisionFilter"><option value="">All Divisions</option></select></div><div class="dropdown-group"><label>District</label><select id="districtFilter"><option value="">All Districts</option></select></div><div class="dropdown-group"><label>Tehsil</label><select id="tehsilFilter"><option value="">All Tehsils</option></select></div><div class="dropdown-group"><label>Depot</label><select id="depotFilter"><option value="">All Depots</option></select></div></div>
        <div class="tab-search-container"><div class="search-bar"><i class="bi bi-search"></i><input type="text" class="search-input" placeholder="Search depots by name..."><button class="clear-search" style="display: none;"><i class="bi bi-x"></i></button></div></div>
        ${this.renderAdContainer('middle')}
        <div class="depot-grid" id="depotsGrid">${this.renderAllDepotCards()}</div>
        <div class="empty-state hidden" id="emptyDepotsState"><i class="bi bi-bus-front"></i><h3>No depots found</h3><p>Try changing your filters or search term</p></div>
    </div></main>
    ${this.renderAdContainer('footer')}
    ${this.renderFooter()}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search divisions, districts, tehsils, depots..."><div class="search-results" id="searchResults"></div></div></div></div>
    <script>window.DIVISIONS_DATA = ${JSON.stringify(divisions)}; window.DISTRICTS_DATA = ${JSON.stringify(districts)}; window.TEHSILS_DATA = ${JSON.stringify(tehsils)}; window.DEPOTS_DATA = ${JSON.stringify(depots)}; ${this.getInlineJS()}</script>
</body>
</html>`;
        this.writeFile('bus-schedule.html', html);
        console.log('   ✓ Bus schedule page (bus-schedule.html) generated');
    }

    renderAllDepotCards() {
        const depots = Object.values(this.data.depots).sort((a, b) => a.name.localeCompare(b.name));
        if (depots.length === 0) return '<div class="empty-state"><i class="bi bi-bus-front"></i><h3>No depots available</h3><p>Add depot data in data/depots/</p></div>';
        return depots.map(depot => {
            const relativePath = this.getDepotRelativePath(depot);
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;
            let busStopCount = 0, busCount = 0;
            if (depot.villages) {
                Object.values(depot.villages).forEach(busStopList => {
                    busStopCount += busStopList.length;
                    busStopList.forEach(busStop => { busCount += busStop.schedule ? busStop.schedule.length : 0; });
                });
            }
            const divisionId = division ? division.id : '';
            const districtId = district ? district.id : '';
            const tehsilId = tehsil ? tehsil.id : '';
            return `<a href="${relativePath}" class="rectangular-card" data-depot-id="${depot.id}" data-division-id="${divisionId}" data-district-id="${districtId}" data-tehsil-id="${tehsilId}">
                <h3>${this.escapeHtml(depot.name)}</h3>
                <div class="card-meta">${tehsil ? this.escapeHtml(tehsil.name) : 'Unknown'}, ${district ? this.escapeHtml(district.name) : 'Unknown'}</div>
                <div class="stats"><span class="stat"><i class="bi bi-signpost"></i> ${busStopCount}</span><span class="stat"><i class="bi bi-bus-front"></i> ${busCount}</span></span></div>
            </a>`;
        }).join('');
    }

    generateFaviconLinks(relativePath = '') {
        const faviconFiles = [];
        if (fs.existsSync(this.imagesDir)) {
            const files = fs.readdirSync(this.imagesDir);
            files.forEach(file => {
                const lowerFile = file.toLowerCase();
                if (lowerFile.includes('favicon') || lowerFile.includes('icon') || lowerFile.endsWith('.ico')) faviconFiles.push(file);
            });
        }
        if (faviconFiles.length === 0 && fs.existsSync(this.publicDir)) {
            const publicFiles = fs.readdirSync(this.publicDir);
            publicFiles.forEach(file => {
                const lowerFile = file.toLowerCase();
                if (lowerFile.includes('favicon') || lowerFile.includes('icon') || lowerFile.endsWith('.ico')) faviconFiles.push(file);
            });
        }
        if (faviconFiles.length === 0) {
            return `\n    <link rel="icon" href="${relativePath ? relativePath + '/' : ''}favicon.ico" type="image/x-icon">\n    <link rel="shortcut icon" href="${relativePath ? relativePath + '/' : ''}favicon.ico" type="image/x-icon">\n    <link rel="apple-touch-icon" href="${relativePath ? relativePath + '/' : ''}assets/images/icon.png">\n    <meta name="msapplication-TileImage" content="${relativePath ? relativePath + '/' : ''}assets/images/icon.png">`;
        }
        const links = [];
        faviconFiles.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            const name = file.toLowerCase();
            if (ext === '.ico') {
                links.push(`<link rel="icon" href="${relativePath ? relativePath + '/' : ''}${file}" type="image/x-icon">`);
                links.push(`<link rel="shortcut icon" href="${relativePath ? relativePath + '/' : ''}${file}" type="image/x-icon">`);
            } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
                if (name.includes('favicon')) links.push(`<link rel="icon" href="${relativePath ? relativePath + '/' : ''}${file}" type="image/${ext === '.png' ? 'png' : 'jpeg'}">`);
                if (name.includes('icon') && !name.includes('favicon')) links.push(`<link rel="apple-touch-icon" href="${relativePath ? relativePath + '/' : ''}${file}">`);
            } else if (ext === '.svg') {
                if (name.includes('favicon') || name.includes('icon')) links.push(`<link rel="icon" href="${relativePath ? relativePath + '/' : ''}${file}" type="image/svg+xml">`);
            }
        });
        if (!links.some(link => link.includes('apple-touch-icon'))) {
            const pngJpgFiles = faviconFiles.filter(f => ['.png','.jpg','.jpeg'].includes(path.extname(f).toLowerCase()));
            if (pngJpgFiles.length > 0) links.push(`<link rel="apple-touch-icon" href="${relativePath ? relativePath + '/' : ''}${pngJpgFiles[0]}">`);
        }
        const pngFiles = faviconFiles.filter(f => path.extname(f).toLowerCase() === '.png');
        if (pngFiles.length > 0) links.push(`<meta name="msapplication-TileImage" content="${relativePath ? relativePath + '/' : ''}${pngFiles[0]}">`);
        return links.join('\n    ');
    }

    renderVerticalAlphabet() {
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => `<button class="alphabet-vertical-btn" data-letter="${letter}">${letter}</button>`).join('');
    }

    generateStaticPages() {
        const pages = ['about', 'contact', 'terms', 'privacy', 'disclaimer'];
        pages.forEach(page => {
            console.log(`📄 Generating ${page} page...`);
            const pageContent = this.content[page] || { title: page.charAt(0).toUpperCase() + page.slice(1), content: `<p>${page} content will be added soon.</p>`, seo: { title: page, description: `Read our ${page} page` } };
            const faviconLinks = this.generateFaviconLinks('.');
            const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${this.escapeHtml(pageContent.seo?.title || page)}</title><meta name="description" content="${this.escapeHtml(pageContent.seo?.description || page)}">${this.renderHeadScripts()}${faviconLinks}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"><script src="assets/urls/url-constants.js"></script>${this.getGoogleSheetsScriptBlock()}<style>${this.getInlineCSS()}</style></head>
<body>
    <header class="site-header"><div class="container"><div class="header-content"><a href="index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    <div class="vertical-alphabet-nav" id="verticalAlphabet">${this.renderVerticalAlphabet()}</div>
    ${this.renderAdContainer('top')}
    <main class="main-content"><div class="container">
        <div class="navigation-buttons"><a href="index.html" class="back-btn"><i class="bi bi-house"></i> Home</a><a href="bus-schedule.html" class="back-btn"><i class="bi bi-bus-front"></i> Back to All Bus Schedule</a></div>
        <div class="tab-search-container"><div class="search-bar"><i class="bi bi-search"></i><input type="text" class="search-input" placeholder="Search depots, tehsils, districts..."><button class="clear-search" style="display: none;"><i class="bi bi-x"></i></button></div></div>
        <h1>${this.escapeHtml(pageContent.title)}</h1><div class="page-content">${pageContent.content}</div>${pageContent.seo_content ? this.renderSEOContent(pageContent.seo_content) : ''}
    </div></main>
    ${this.renderAdContainer('footer')}
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

        // Blog listing page
        const blogListingHTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Blogs & Updates - ${this.config.site_name}</title><meta name="description" content="Latest news, updates, and articles about MSRTC bus services"><link rel="canonical" href="${this.config.base_url}/blogs/index.html">${this.renderHeadScripts()}${faviconLinks}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"><script src="../assets/urls/url-constants.js"></script>${this.getGoogleSheetsScriptBlock()}<style>${this.getInlineCSS()}</style></head>
<body>
    <header class="site-header"><div class="container"><div class="header-content"><a href="../index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    ${this.renderAdContainer('top')}
    <main class="main-content"><div class="container">
        <div class="navigation-buttons"><a href="../index.html" class="back-btn"><i class="bi bi-house"></i> Home</a><a href="../bus-schedule.html" class="back-btn"><i class="bi bi-bus-front"></i> Back to All Bus Schedule</a></div>
        <h1>Blogs & Updates</h1><p>Latest news and articles about MSRTC bus services in Maharashtra</p>
        ${this.blogs.length > 0 ? `<div class="blog-grid">${this.blogs.map(blog => `<a href="${blog.id}.html" class="blog-card"><div class="blog-card-content"><h3>${this.escapeHtml(blog.title)}</h3><div class="blog-card-excerpt">${this.escapeHtml(blog.excerpt || blog.content.substring(0, 120) + '...')}</div><div class="blog-card-meta"><div class="blog-card-date"><i class="bi bi-calendar"></i>${new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div></div></a>`).join('')}</div>` : `<div class="empty-state"><i class="bi bi-newspaper"></i><h3>No blog posts yet</h3><p>Check back soon for updates and articles about MSRTC services.</p></div>`}
    </div></main>
    ${this.renderAdContainer('footer')}
    ${this.renderFooter('../')}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search divisions, districts, tehsils, depots..."><div class="search-results" id="searchResults"></div></div></div></div>
    <script>${this.getInlineJS()}</script>
</body>
</html>`;
        this.writeFile('blogs/index.html', blogListingHTML);
        console.log('   ✓ Blog listing page generated');

        // Individual blog pages
        this.blogs.forEach(blog => {
            console.log(`   📄 Generating blog: ${blog.title}`);

            // Handle related depots if present
            let relatedDepotsHtml = '';
            if (blog.related_depots && Array.isArray(blog.related_depots) && blog.related_depots.length > 0) {
                const depotCards = [];
                for (const depotId of blog.related_depots) {
                    const depot = this.data.depots[depotId];
                    if (!depot) {
                        console.warn(`   ⚠️  Blog "${blog.id}" references unknown depot ID: ${depotId}`);
                        continue;
                    }
                    const tehsil = this.data.tehsils[depot.tehsil_id];
                    const district = tehsil ? this.data.districts[tehsil.district_id] : null;
                    const division = district ? this.data.divisions[district.division_id] : null;
                    if (!division || !district || !tehsil) {
                        console.warn(`   ⚠️  Incomplete hierarchy for depot ${depot.name} (${depot.id})`);
                        continue;
                    }
                    let busStopCount = 0, busCount = 0;
                    if (depot.villages) {
                        Object.values(depot.villages).forEach(busStopList => {
                            busStopCount += busStopList.length;
                            busStopList.forEach(busStop => {
                                busCount += busStop.schedule ? busStop.schedule.length : 0;
                            });
                        });
                    }
                    const depotPath = `/${division.id}/${district.id}/${tehsil.id}/${depot.id}/index.html`;
                    depotCards.push(`<a href="${depotPath}" class="related-depot-card">
                        <h3>${this.escapeHtml(depot.name)}</h3>
                        <p>${busStopCount} bus stops • ${busCount} buses</p>
                        <span class="related-depot-link"><i class="bi bi-arrow-right"></i> View</span>
                    </a>`);
                }
                if (depotCards.length > 0) {
                    relatedDepotsHtml = `<div class="related-links-section mt-3">
                        <h2>Related Depots</h2>
                        <div class="related-links-grid">${depotCards.join('')}</div>
                    </div>`;
                }
            }

            const blogHTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${this.escapeHtml(blog.seo?.title || blog.title)} - ${this.config.site_name}</title><meta name="description" content="${this.escapeHtml(blog.seo?.description || blog.excerpt || blog.content.substring(0, 160))}"><meta name="keywords" content="${this.escapeHtml(blog.seo?.keywords || (blog.tags ? blog.tags.join(', ') : 'MSRTC, bus, Maharashtra'))}"><link rel="canonical" href="${this.config.base_url}/blogs/${blog.id}.html">${this.renderHeadScripts()}${faviconLinks}<meta property="og:title" content="${this.escapeHtml(blog.title)}"><meta property="og:description" content="${this.escapeHtml(blog.excerpt || blog.content.substring(0, 200))}"><meta property="og:type" content="article"><meta property="og:url" content="${this.config.base_url}/blogs/${blog.id}.html"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"><script src="../assets/urls/url-constants.js"></script>${this.getGoogleSheetsScriptBlock()}<style>${this.getInlineCSS()}</style></head>
<body>
    <header class="site-header"><div class="container"><div class="header-content"><a href="../index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    ${this.renderAdContainer('top')}
    <main class="main-content"><div class="container blog-page">
        <div class="navigation-buttons"><a href="../index.html" class="back-btn"><i class="bi bi-house"></i> Home</a><a href="../bus-schedule.html" class="back-btn"><i class="bi bi-bus-front"></i> Back to All Bus Schedule</a></div>
        <div class="blog-header"><h1>${this.escapeHtml(blog.title)}</h1><div class="blog-date"><i class="bi bi-calendar"></i>${new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
        ${blog.author ? `<div class="blog-author"><div class="author-avatar">${this.escapeHtml(blog.author.charAt(0).toUpperCase())}</div><div class="author-info"><h4>${this.escapeHtml(blog.author)}</h4></div></div>` : ''}
        <div class="blog-content">${blog.content}</div>
        ${blog.tags && blog.tags.length > 0 ? `<div class="blog-tags">${blog.tags.map(tag => `<span class="blog-tag">${this.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        ${blog.seo_content ? this.renderSEOContent(blog.seo_content) : ''}
        ${relatedDepotsHtml}
    </div></main>
    ${this.renderAdContainer('footer')}
    ${this.renderFooter('../')}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search bus stops..."><div class="search-results" id="searchResults"></div></div></div></div>
    <script>${this.getInlineJS()}</script>
</body>
</html>`;
            this.writeFile(`blogs/${blog.id}.html`, blogHTML);
        });
    }

    generateDepotPages() {
        console.log('🚌 Generating depot pages (all depots)...');
        const depots = Object.values(this.data.depots);
        for (const depot of depots) {
            console.log(`   📄 Processing depot: ${depot.name} (${depot.id})`);
            const relativePath = this.getDepotRelativePath(depot);
            const fullDir = path.join(this.publicDir, path.dirname(relativePath));
            if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
            let tehsil = this.data.tehsils[depot.tehsil_id];
            let district = tehsil ? this.data.districts[tehsil.district_id] : null;
            let division = district ? this.data.divisions[district.division_id] : null;
            const html = this.renderDepotPage(depot, tehsil, district, division);
            const filePath = path.join(this.publicDir, relativePath);
            fs.writeFileSync(filePath, html, 'utf8');
            console.log(`      ✓ Depot page written: ${relativePath}`);
        }
        console.log(`   ✓ Generated ${depots.length} depot pages`);
    }

    renderDepotPage(depot, tehsil, district, division) {
        const tehsilName = tehsil ? tehsil.name : 'Unknown Tehsil';
        const districtName = district ? district.name : 'Unknown District';
        const divisionName = division ? division.name : 'Unknown Division';
        const villages = depot.villages || {};
        const villageLetters = Object.keys(villages).sort();
        let totalBusStopCount = 0, totalBusCount = 0;
        Object.values(villages).forEach(busStopList => {
            totalBusStopCount += busStopList.length;
            busStopList.forEach(busStop => { totalBusCount += busStop.schedule ? busStop.schedule.length : 0; });
        });
        const seo = depot.seo || {};
        const content = depot.content || {};
        const depotContent = content.about ? this.processMarkdown(content.about) : '';
        const faqs = content.faqs || [];
        const relatedDepots = this.getRelatedDepots(depot.id);
        const fallbackRelatedDepots = relatedDepots.length === 0 ? this.getRelatedDepotsInTehsil(depot.id, depot.tehsil_id) : [];
        const faviconLinks = this.generateFaviconLinks('../../../../');
        return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${this.escapeHtml(seo.title || `${depot.name} Depot - ${tehsilName} - ${this.config.site_name}`)}</title><meta name="description" content="${this.escapeHtml(seo.description || `MSRTC bus schedule for ${depot.name} depot in ${tehsilName}, ${districtName}.`)}"><meta name="keywords" content="${this.escapeHtml(seo.keywords || `${depot.name} bus timing, ${tehsilName} depot`)}">${this.renderHeadScripts()}${faviconLinks}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"><script src="../../../../assets/urls/url-constants.js"></script>${this.getGoogleSheetsScriptBlock()}<style>${this.getInlineCSS()}</style></head>
<body class="depot-page">
    <header class="site-header"><div class="container"><div class="header-content"><a href="../../../../index.html" class="logo"><i class="bi bi-bus-front"></i><span>${this.config.site_name}</span></a><div class="time-display"><span class="current-time"></span></div></div></div></header>
    <div class="header-spacer"></div>
    <div class="vertical-alphabet-nav" id="verticalAlphabet">${this.renderBusStopVerticalAlphabet(villageLetters)}</div>
    ${this.renderAdContainer('top')}
    <main class="main-content"><div class="container">
        <div class="navigation-buttons"><a href="../../../../index.html" class="back-btn"><i class="bi bi-house"></i> Home</a><a href="../../../../bus-schedule.html" class="back-btn"><i class="bi bi-bus-front"></i> Back to All Bus Schedule</a></div>
        <div class="depot-header"><h1>${this.escapeHtml(depot.name)}</h1><p>${this.escapeHtml(depot.address || 'MSRTC Bus Depot')}</p><div class="depot-info">${depot.contact ? `<div class="info-item"><i class="bi bi-telephone"></i><span>${this.escapeHtml(depot.contact)}</span></div>` : ''}<div class="info-item"><i class="bi bi-signpost"></i><span>${totalBusStopCount} Bus Stops</span></div><div class="info-item"><i class="bi bi-bus-front"></i><span>${totalBusCount} Buses</span></div></div></div>
        <div class="depot-search-filters-container"><div class="tab-search-container"><div class="search-bar"><i class="bi bi-search"></i><input type="text" class="search-input" placeholder="Search bus stops in ${this.escapeHtml(depot.name)}..."><button class="clear-search" style="display: none;"><i class="bi bi-x"></i></button></div></div><div class="time-filters"><button class="filter-btn active" data-filter="all">All</button><button class="filter-btn" data-filter="morning">5AM-12PM</button><button class="filter-btn" data-filter="afternoon">12PM-5PM</button><button class="filter-btn" data-filter="evening">5PM-10PM</button><button class="filter-btn" data-filter="night">10PM-5AM</button></div></div>
        ${this.renderAdContainer('middle')}
        <div class="empty-state hidden"><i class="bi bi-search"></i><h3>No buses found</h3><p>Try changing your filters or search term</p></div>
        ${this.renderBusStopSections(villages, villageLetters)}
        ${depotContent ? `<div class="depot-about-section mt-3"><h2>About ${this.escapeHtml(depot.name)} Depot</h2><div class="about-content">${depotContent}</div></div>` : ''}
        ${faqs.length > 0 ? `<div class="faq-section mt-3"><h2>FAQs</h2><div class="faq-container">${faqs.map((faq, idx) => {
            const question = faq.question || faq.q || '';
            const answer = faq.answer || faq.a || '';
            return `<div class="faq-item"><div class="faq-question"><i class="bi bi-question-circle"></i><span>${this.escapeHtml(question.replace(/^\s*[?•\-*]\s*/, ''))}</span></div><div class="faq-answer">${this.processMarkdown(answer)}</div></div>`;
        }).join('')}</div></div>` : ''}
        ${relatedDepots.length > 0 || fallbackRelatedDepots.length > 0 ? `<div class="related-links-section mt-3"><h2>${relatedDepots.length > 0 ? 'Related Depots' : 'Other Depots in ' + this.escapeHtml(tehsilName)}</h2><div class="related-links-grid">${relatedDepots.length > 0 ? relatedDepots.map(rd => this.renderRelatedDepotCard(rd, division ? division.id : 'unknown', district ? district.id : 'unknown', tehsil ? tehsil.id : 'unknown', depot.id)).join('') : fallbackRelatedDepots.map(rd => this.renderRelatedDepotCard(rd, division ? division.id : 'unknown', district ? district.id : 'unknown', tehsil ? tehsil.id : 'unknown', depot.id)).join('')}</div></div>` : ''}
        ${content.seo_content ? this.renderSEOContent(content.seo_content) : ''}
    </div></main>
    ${this.renderAdContainer('footer')}
    ${this.renderFooter('../../../../')}
    <div class="quick-search-modal" id="searchModal"><div class="search-modal-content"><div class="search-modal-header"><h3><i class="bi bi-search"></i> Advanced Search</h3><button class="close-search">&times;</button></div><div class="search-modal-body"><input type="text" class="global-search-input" placeholder="Search bus stops in ${this.escapeHtml(depot.name)}..."><div class="search-results" id="searchResults"></div></div></div></div>
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
        return `<a href="${relativePath}" class="related-depot-card"><h3>${this.escapeHtml(depot.name)}</h3><p>${busStopCount} bus stops • ${busCount} buses</p><span class="related-depot-link"><i class="bi bi-arrow-right"></i> View</span></a>`;
    }

    renderBusStopSections(villages, letters) {
        if (letters.length === 0) return '<div class="empty-state"><i class="bi bi-signpost"></i><h3>No bus stop schedules available</h3><p>Add bus stop data to this depot</p></div>';
        return letters.map(letter => (villages[letter] || []).map(busStop => {
            const schedule = busStop.schedule || [];
            return `<div class="bus-stop-section" id="busstop-${letter}-${busStop.name.toLowerCase().replace(/\s+/g, '-')}" data-letter="${letter.toLowerCase()}" data-busstop="${busStop.name.toLowerCase()}"><div class="bus-stop-header"><h3 class="bus-stop-name">${this.escapeHtml(busStop.name)}</h3><span class="bus-count">${schedule.length}</span></div><div class="schedule-grid">${this.renderTimeBubbles(schedule)}</div></div>`;
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

    renderAdContainer(slotType) {
        // slotType is 'top', 'middle', or 'footer'
        return `<div class="ad-container ${slotType}" data-ad-slot="${slotType}"></div>`;
    }

    renderSEOContent(seoContent) {
        if (!seoContent) return '';
        return `<div class="seo-content">${seoContent.title ? `<h2>${this.escapeHtml(seoContent.title)}</h2>` : ''}${seoContent.content || ''}${seoContent.faqs && seoContent.faqs.length ? `<h3>Frequently Asked Questions</h3>${seoContent.faqs.map(faq => `<div class="faq-item"><div class="faq-question">${this.escapeHtml(faq.question)}</div><div class="faq-answer">${this.processMarkdown(faq.answer)}</div></div>`).join('')}` : ''}</div>`;
    }

    renderFooter(prefix = '') {
        const basePath = prefix || '';
        return `<footer class="site-footer"><div class="container"><div class="footer-content"><div class="footer-section"><h3>Quick Links</h3><div class="footer-links"><a href="${basePath}index.html">Home</a><a href="${basePath}bus-schedule.html">Bus Schedule</a><a href="${basePath}about.html">About</a><a href="${basePath}contact.html">Contact</a><a href="${basePath}blogs/index.html">Blogs</a><a href="${basePath}terms.html">Terms</a><a href="${basePath}privacy.html">Privacy</a></div></div><div class="footer-section"><h3>MSRTC Official</h3><div class="footer-links"><a href="https://msrtc.maharashtra.gov.in" target="_blank" rel="noopener">Official Website</a><a href="https://msrtc.maharashtra.gov.in/booking/ticket_booking.html" target="_blank" rel="noopener">Book Tickets</a><a href="https://msrtc.maharashtra.gov.in/contact_us.html" target="_blank" rel="noopener">Contact MSRTC</a><a href="https://msrtc.maharashtra.gov.in/complaints.html" target="_blank" rel="noopener">Complaints</a></div></div><div class="footer-section"><h3>Useful Links</h3><div class="footer-links"><a href="${basePath}disclaimer.html">Disclaimer</a><a href="${basePath}sitemap.xml">Sitemap</a><a href="${basePath}contact.html#feedback">Feedback</a><a href="${basePath}contact.html#report">Report Issue</a></div></div><div class="copyright">© ${new Date().getFullYear()} ${this.config.site_name}.<br>This is an unofficial timetable portal.<br><small>All bus schedules are for reference only.</small></div></div></div></footer>`;
    }

    generateSearchIndex() {
        console.log('🔍 Generating search index (only depots)...');
        const searchData = { depots: [] };
        Object.values(this.data.depots).forEach(depot => {
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;
            let busStopCount = 0, busCount = 0;
            if (depot.villages) {
                Object.values(depot.villages).forEach(bsl => { busStopCount += bsl.length; bsl.forEach(bs => { busCount += bs.schedule ? bs.schedule.length : 0; }); });
            }
            const divisionName = division ? division.name : 'Unknown';
            const districtName = district ? district.name : 'Unknown';
            const tehsilName = tehsil ? tehsil.name : 'Unknown';
            const relativePath = this.getDepotRelativePath(depot);
            searchData.depots.push({
                id: depot.id, name: depot.name, type: 'Depot', path: relativePath,
                division: divisionName, district: districtName, tehsil: tehsilName,
                busStops: busStopCount, buses: busCount, alphabet: depot.name.charAt(0).toUpperCase()
            });
        });
        const searchIndexPath = path.join(this.publicDir, 'search-index.js');
        fs.writeFileSync(searchIndexPath, `window.searchIndex = ${JSON.stringify(searchData, null, 2)};`, 'utf8');
        console.log(`   ✓ Search index generated with ${searchData.depots.length} depots`);
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

    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
            return c;
        });
    }

    writeFile(filePath, content) {
        const full = path.join(this.publicDir, filePath);
        const dir = path.dirname(full);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(full, content, 'utf8');
    }

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
            const relativePath = this.getDepotRelativePath(depot);
            urls.push({ loc: `${baseUrl}/${relativePath}`, lastmod: today, priority: '0.6', changefreq: 'daily' });
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
        console.log('\n✅ All depot pages now generated – search & alphabet fully functional.');
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

    // ========== CSS (full inline styles) ==========
    getInlineCSS() {
        const theme = this.config.theme || {};
        const primary = theme.primary_color || '#493dd5';
        const secondary = theme.secondary_color || '#3a2fc1';
        const bgStart = theme.bg_gradient_start || '#F5F3FF';
        const bgEnd = theme.bg_gradient_end || '#EDE9FE';
        const textPrimary = '#4C1D95';
        const textSecondary = '#5B21B6';
        const borderLight = '#C4B5FD';
        const borderDark = '#A78BFA';
        return `/* ==========================================================================
       MSRTC BUS TIMETABLE - MOBILE FIRST STYLES
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
    .navigation-buttons { display:flex; gap:0.5rem; margin-bottom:0.8rem; flex-wrap:wrap; width:100%; padding:0; }
    .back-btn { display:inline-flex; align-items:center; gap:0.3rem; padding:0.5rem 0.8rem; background:white; border:1px solid ${borderLight}; border-radius:6px; color:${textPrimary}; font-family:'Inter',sans-serif; font-weight:500; cursor:pointer; transition:all 0.3s; font-size:0.9rem; text-decoration:none; flex-shrink:0; max-width:100%; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; min-height:38px; margin:0; width:auto; }
    .back-btn:hover { background:${bgEnd}; color:${primary}; border-color:${borderDark}; }
    .depot-about-section, .faq-section, .related-links-section { background:white; border-radius:8px; padding:1rem; border:1px solid ${borderLight}; margin-top:1.5rem; width:100%; }
    .faq-container { display:flex; flex-direction:column; gap:1rem; }
    .faq-item { border-bottom:1px solid ${borderLight}; padding-bottom:0.75rem; }
    .faq-question { display:flex; align-items:center; gap:0.5rem; font-weight:700; color:${textSecondary}; font-size:1rem; margin-bottom:0.5rem; }
    .faq-question i { color:${primary}; font-size:1.1rem; }
    .faq-answer { padding-left:1.8rem; color:${textPrimary}; line-height:1.5; }
    .faq-answer p { margin-bottom:0.5rem; }
    .related-links-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:0.8rem; margin-top:0.8rem; }
    .related-depot-card { background:white; border:1px solid ${borderLight}; border-radius:8px; padding:0.8rem; text-decoration:none; transition:all 0.3s; display:block; }
    .related-depot-card:hover { border-color:${primary}; }
    .related-depot-card h3 { color:${textSecondary}; margin-bottom:0.3rem; font-size:1.1rem; }
    .ad-container { margin:1rem 0; text-align:center; width:100%; padding:0; }
    /* Remote ad styles */
    .ad-block { display: flex; flex-direction: row; align-items: center; gap: 1rem; text-decoration: none; color: inherit; width: 100%; }
    .ad-title { flex: 1; font-weight: 600; font-size: 1rem; line-height: 1.3; }
    .ad-image { flex: 2; }
    .ad-image img { width: 100%; height: auto; border-radius: 8px; }
    @media (max-width: 767px) { .ad-block { flex-direction: column; text-align: center; } .ad-title { margin-bottom: 0.5rem; } }
    .filter-dropdowns { display:flex; flex-wrap:wrap; gap:0.8rem; margin:1rem 0; justify-content:space-between; }
    .dropdown-group { flex:1; min-width:150px; }
    .dropdown-group label { display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.2rem; color:${textSecondary}; }
    .dropdown-group select { width:100%; padding:0.5rem; border:1px solid ${borderLight}; border-radius:6px; background:white; font-family:'Inter',sans-serif; font-size:0.9rem; color:${textPrimary}; cursor:pointer; }
    .depot-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:0.6rem; margin:0.8rem 0; width:100%; padding:0; }
    .rectangular-card { background:white; border:1px solid ${borderLight}; border-radius:8px; padding:0.7rem; box-shadow:0 1px 2px rgba(0,0,0,0.03); transition:all 0.3s ease; display:block; cursor:pointer; text-decoration:none; position:relative; overflow:hidden; min-height:75px; display:flex; flex-direction:column; justify-content:space-between; text-align:left; width:100%; }
    .rectangular-card:hover { border-color:${primary}; background:${bgStart}; }
    .rectangular-card h3 { color:${textSecondary} !important; margin-bottom:0.2rem; font-size:1rem; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .card-meta { color:${textPrimary}; font-size:0.8rem; margin-bottom:0.2rem; opacity:0.8; }
    .rectangular-card .stats { display:flex; gap:0.5rem; margin-top:0.2rem; flex-wrap:wrap; }
    .rectangular-card .stat { background:${bgEnd}; padding:0.1rem 0.3rem; border-radius:8px; color:${textSecondary} !important; font-size:0.7rem; font-weight:500; display:flex; align-items:center; gap:0.15rem; border:1px solid ${borderLight}; }
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
    .depot-header { background:white; border-radius:8px; padding:1rem; margin-bottom:1rem; border:1px solid ${borderLight}; text-align:center; width:100%; margin-left:0; margin-right:0; }
    .depot-info { display:flex; justify-content:center; gap:0.8rem; margin-top:0.8rem; flex-wrap:wrap; max-width:100%; overflow:hidden; }
    .info-item { display:flex; align-items:center; gap:0.3rem; color:${textSecondary}; font-size:0.85rem; background:#F8FAFC; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid ${borderLight}; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .time-filters { display:flex; gap:0.4rem; margin:0.5rem 0 1rem 0; overflow-x:auto; padding-bottom:0.3rem; -webkit-overflow-scrolling:touch; white-space:nowrap; width:100%; padding:0; }
    .filter-btn { padding:0.4rem 0.5rem; border:1px solid ${borderLight}; background:white; border-radius:6px; font-family:'Inter',sans-serif; font-size:0.75rem; color:${textPrimary}; cursor:pointer; white-space:nowrap; transition:all 0.3s; flex-shrink:0; font-weight:500; min-width:65px; text-align:center; }
    .filter-btn.active { background:${primary}; color:white; border-color:${primary}; }
    .bus-stop-section { margin-bottom:1rem; scroll-margin-top:150px; background:white; border-radius:8px; overflow:hidden; border:1px solid ${borderLight}; width:100%; }
    .bus-stop-header { display:flex; justify-content:space-between; align-items:center; padding:0.7rem; background:linear-gradient(90deg,${bgEnd} 0%,white 100%); border-bottom:1px solid ${borderLight}; }
    .bus-stop-name { font-family:'Inter',sans-serif; font-weight:500; color:${textSecondary}; font-size:1rem; max-width:70%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .bus-count { background:${primary}; color:white; padding:0.15rem 0.4rem; border-radius:10px; font-size:0.75rem; font-weight:500; min-width:35px; text-align:center; }
    .schedule-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(56px,1fr)); gap:0.3rem; padding:0.5rem; width:100%; }
    .time-bubble { position:relative; padding:0.3rem 0.15rem; border-radius:12px; text-align:center; font-family:'Inter',sans-serif; font-weight:500; cursor:pointer; transition:all 0.3s; min-height:32px; display:flex; flex-direction:column; align-items:center; justify-content:center; user-select:none; font-size:0.7rem; border:1px solid transparent; overflow:visible; margin:0.05rem; }
    .time-bubble.morning { background:#FEF3C7; color:#92400E; border-color:#FBBF24; }
    .time-bubble.afternoon { background:#D1FAE5; color:#065F46; border-color:#10B981; }
    .time-bubble.evening { background:#E0E7FF; color:#3730A3; border-color:#6366F1; }
    .time-bubble.night { background:#F3E8FF; color:#5B21B6; border-color:#8B5CF6; }
    .next-badge { position:absolute; top:-6px; right:-6px; background:${primary}; color:white; font-size:0.6rem; padding:1px 3px; border-radius:8px; font-weight:600; z-index:20; box-shadow:0 1px 2px rgba(0,0,0,0.2); animation:pulse 2s infinite; white-space:nowrap; min-width:28px; text-align:center; border:1px solid white; }
    @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    .site-footer { background:white; border-top:1px solid ${borderLight}; padding:1.5rem 0 2rem 0; margin-top:2rem; min-height:300px; width:100%; }
    .footer-content { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:1.5rem; }
    .footer-section h3 { color:${textSecondary}; font-size:1.1rem; margin-bottom:0.8rem; font-weight:600; }
    .footer-links { display:flex; flex-direction:column; gap:0.4rem; }
    .footer-links a { color:${textPrimary}; font-size:0.9rem; padding:0.2rem 0; transition:all 0.3s; text-decoration:none; line-height:1.4; }
    .footer-links a:hover { color:${primary}; padding-left:0.3rem; }
    .copyright { grid-column:1/-1; text-align:center; color:${textPrimary}; font-size:0.85rem; opacity:0.8; margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid ${borderLight}; line-height:1.5; }
    .blog-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; margin:1.5rem 0; }
    .blog-card { background:white; border:1px solid ${borderLight}; border-radius:8px; overflow:hidden; transition:all 0.3s; text-decoration:none; display:block; padding:0.8rem; }
    .blog-card:hover { border-color:${primary}; }
    .blog-card h3 { color:${textSecondary}; margin-bottom:0.6rem; font-size:1.1rem; line-height:1.3; }
    .blog-card-excerpt { color:#64748B; font-size:0.9rem; line-height:1.4; margin-bottom:0.8rem; }
    .empty-state { text-align:center; padding:2rem 1rem; color:${textSecondary}; background:white; border-radius:8px; border:1px solid ${borderLight}; margin:1.5rem 0; width:100%; }
    .empty-state i { font-size:2.5rem; margin-bottom:0.8rem; color:${borderDark}; }
    .hidden { display:none !important; }
    @media (max-width:767px) { .container { padding-right:calc(0.8rem + 28px); } .depot-grid { grid-template-columns:1fr; } .schedule-grid { grid-template-columns:repeat(auto-fill,minmax(52px,1fr)); } .time-bubble { min-height:30px; font-size:0.7rem; } .vertical-alphabet-nav { width:28px; } .alphabet-vertical-btn { width:24px; height:24px; font-size:0.8rem; } .filter-btn { padding:0.35rem 0.4rem; font-size:0.7rem; min-width:60px; } .blog-grid { grid-template-columns:1fr; } }
    @media (min-width:768px) and (max-width:1024px) { .schedule-grid { grid-template-columns:repeat(auto-fill,minmax(56px,1fr)); } .time-bubble { min-height:34px; font-size:0.75rem; } }
    @media (min-width:1025px) { .schedule-grid { grid-template-columns:repeat(auto-fill,minmax(60px,1fr)); gap:0.4rem; } .time-bubble { min-height:36px; font-size:0.75rem; } }
    @media print { .site-header,.search-bar-container,.vertical-alphabet-nav,.filter-btn,.time-filters,.back-btn,.ad-container,.quick-search-modal { display:none !important; } }
    body,html { overflow-x:hidden; max-width:100%; width:100%; }
    .homepage-buttons { display:flex; justify-content:center; gap:1rem; margin:2rem 0; flex-wrap:wrap; }
    .btn-primary, .btn-secondary { display:inline-block; padding:0.8rem 1.5rem; border-radius:40px; font-weight:600; text-decoration:none; transition:all 0.3s; font-size:1rem; }
    .btn-primary { background:${primary}; color:white; border:2px solid ${primary}; }
    .btn-primary:hover { background:${secondary}; transform:translateY(-2px); }
    .btn-secondary { background:white; color:${primary}; border:2px solid ${primary}; }
    .btn-secondary:hover { background:${bgEnd}; transform:translateY(-2px); }
    .maharashtra-darshan-bullets { background:white; border-radius:16px; padding:1.5rem; margin:2rem 0; border:1px solid ${borderLight}; }
    .maharashtra-darshan-bullets ul { columns:2; column-gap:2rem; list-style:none; padding:0; }
    .maharashtra-darshan-bullets li { margin-bottom:0.8rem; padding-left:0.5rem; break-inside:avoid; }
    @media (max-width:768px) { .maharashtra-darshan-bullets ul { columns:1; } }
    .maharashtra-intro { background:linear-gradient(135deg, ${bgStart}, ${bgEnd}); border-radius:16px; padding:1.5rem; margin:1.5rem 0; text-align:center; }
    .blog-content img {
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        margin: 1rem 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: block;
    }`;
    }

    // ========== JAVASCRIPT (full inline script with Google Sheets ad control) ==========
    getInlineJS() {
        return `// MSRTC Bus Timetable Application - with Google Sheets Ad Control
class BusTimetableApp {
    constructor() {
        this.istOffset = 5.5 * 60 * 60 * 1000;
        this.activeFilter = 'all';
        this.searchTerm = '';
        this.isDepotPage = document.querySelector('.bus-stop-section') !== null;
        this.init();
    }
    async init() {
        console.log('🚌 MSRTC Bus Timetable App Initialized' + (this.isDepotPage ? ' (Depot Page)' : ''));
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
        if (!this.isDepotPage && document.getElementById('divisionFilter')) {
            this.initDropdowns();
        }
        // Load ads from Google Sheets
        await this.loadAdsFromSheets();
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
            searchBox.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                if (this.isDepotPage) {
                    this.filterBusStops();
                } else {
                    this.filterDepotCards();
                }
                updateClear();
            });
            searchBox.addEventListener('keydown', (e) => { if(e.key==='Escape'){ searchBox.value=''; this.searchTerm=''; if(this.isDepotPage) this.filterBusStops(); else this.filterDepotCards(); updateClear(); } if(e.key==='Enter') this.showSearchModal(); });
            updateClear();
        }
        if (clearBtn) clearBtn.addEventListener('click', () => { const sb = document.querySelector('.search-input'); if(sb){ sb.value=''; this.searchTerm=''; if(this.isDepotPage) this.filterBusStops(); else this.filterDepotCards(); clearBtn.style.display='none'; sb.focus(); } });
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
    filterBusStops() {
        const sections = document.querySelectorAll('.bus-stop-section');
        let anyVisible = false;
        sections.forEach(section => {
            const busStopName = section.querySelector('.bus-stop-name').textContent.toLowerCase();
            const match = !this.searchTerm || busStopName.includes(this.searchTerm);
            section.classList.toggle('hidden', !match);
            if(match) anyVisible = true;
        });
        const empty = document.querySelector('.empty-state');
        if(empty) empty.classList.toggle('hidden', anyVisible);
        this.applyFilters();
    }
    updateVerticalAlphabetVisibility() {
        if (this.isDepotPage) {
            const sections = Array.from(document.querySelectorAll('.bus-stop-section')).filter(s => !s.classList.contains('hidden'));
            const letters = new Set(sections.map(s => s.querySelector('.bus-stop-name')?.textContent.charAt(0).toUpperCase()).filter(l=>l));
            document.querySelectorAll('.alphabet-vertical-btn').forEach(btn => {
                if(letters.has(btn.dataset.letter)) btn.classList.remove('disabled');
                else btn.classList.add('disabled');
            });
        } else {
            const visible = Array.from(document.querySelectorAll('#depotsGrid .rectangular-card')).filter(c => c.style.display !== 'none');
            const letters = new Set(visible.map(c => c.querySelector('h3')?.innerText.charAt(0).toUpperCase()).filter(l=>l));
            document.querySelectorAll('.alphabet-vertical-btn').forEach(btn => {
                if(letters.has(btn.dataset.letter)) btn.classList.remove('disabled');
                else btn.classList.add('disabled');
            });
        }
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
        if (this.isDepotPage) {
            const sections = Array.from(document.querySelectorAll('.bus-stop-section')).filter(s => !s.classList.contains('hidden'));
            for (let section of sections) {
                const name = section.querySelector('.bus-stop-name').textContent;
                if (name && name.charAt(0).toUpperCase() === letter.toUpperCase()) {
                    const headerHeight = document.querySelector('.site-header').offsetHeight + 60;
                    const sectionTop = section.getBoundingClientRect().top + window.scrollY - headerHeight;
                    window.scrollTo({ top: sectionTop, behavior: 'smooth' });
                    this.highlightElement(section);
                    break;
                }
            }
        } else {
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
        if (this.isDepotPage) {
            const sections = Array.from(document.querySelectorAll('.bus-stop-section')).filter(s => !s.classList.contains('hidden'));
            if(!sections.length) return;
            let closest=null, closestDist=Infinity, scrollPos=window.scrollY+100;
            sections.forEach(section=>{ const top=section.offsetTop; const dist=Math.abs(scrollPos-top); if(dist<closestDist){ closestDist=dist; closest=section; } });
            if(closest){
                const letter = closest.querySelector('.bus-stop-name')?.textContent.charAt(0).toUpperCase();
                if(letter) document.querySelectorAll('.alphabet-vertical-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.letter===letter));
            }
        } else {
            const cards = Array.from(document.querySelectorAll('#depotsGrid .rectangular-card')).filter(c=>c.style.display!=='none');
            if(!cards.length) return;
            let closest=null, closestDist=Infinity, scrollPos=window.scrollY+100;
            cards.forEach(card=>{ const top=card.offsetTop; const dist=Math.abs(scrollPos-top); if(dist<closestDist){ closestDist=dist; closest=card; } });
            if(closest){
                const letter = closest.querySelector('h3')?.innerText.charAt(0).toUpperCase();
                if(letter) document.querySelectorAll('.alphabet-vertical-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.letter===letter));
            }
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
        this.updateVerticalAlphabetVisibility();
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

    // ==================== GOOGLE SHEETS AD CONTROL ====================
    async loadAdsFromSheets() {
        const apiKey = window.GOOGLE_SHEETS_API_KEY;
        const spreadsheetId = window.SPREADSHEET_ID;
        const sheetName = window.SHEET_NAME;
        if (!apiKey || !spreadsheetId) {
            console.warn('⚠️ Google Sheets API key or spreadsheet ID missing. Ads disabled.');
            this.hideAllAdContainers();
            return;
        }
        const url = \`https://sheets.googleapis.com/v4/spreadsheets/\${spreadsheetId}/values/\${sheetName}?key=\${apiKey}&_t=\${Date.now()}\`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
            const data = await response.json();
            if (!data.values || data.values.length < 2) {
                console.warn('⚠️ No ad data found in spreadsheet.');
                this.hideAllAdContainers();
                return;
            }
            const headers = data.values[0];
            const rows = data.values.slice(1);
            // Find column indices (case-insensitive)
            const getColIndex = (name) => headers.findIndex(h => h && h.toLowerCase() === name.toLowerCase());
            const idIdx = getColIndex('id');
            const topIdx = getColIndex('top');
            const middleIdx = getColIndex('middle');
            const footerIdx = getColIndex('footer');
            const titleIdx = getColIndex('title');
            const mobileIdx = getColIndex('mobile');
            const desktopIdx = getColIndex('desktop');
            if (idIdx === -1) {
                console.warn('⚠️ Spreadsheet missing "id" column. Ads disabled.');
                this.hideAllAdContainers();
                return;
            }
            const pageId = this.getCurrentPageId();
            const adRow = rows.find(row => row[idIdx] && row[idIdx].toString() === pageId);
            if (!adRow) {
                console.log(\`ℹ️ No ad config for page ID "\${pageId}". Ads hidden.\`);
                this.hideAllAdContainers();
                return;
            }
            const parseBool = (val) => {
                if (val === undefined || val === null) return false;
                if (typeof val === 'boolean') return val;
                const str = String(val).toLowerCase();
                return str === 'true' || str === '1' || str === 'yes';
            };
            const getValue = (idx) => (idx !== -1 && adRow[idx]) ? adRow[idx].toString() : '';
            const adConfig = {
                top: { enabled: topIdx !== -1 ? parseBool(adRow[topIdx]) : false, title: getValue(titleIdx), mobile: getValue(mobileIdx), desktop: getValue(desktopIdx) },
                middle: { enabled: middleIdx !== -1 ? parseBool(adRow[middleIdx]) : false, title: getValue(titleIdx), mobile: getValue(mobileIdx), desktop: getValue(desktopIdx) },
                footer: { enabled: footerIdx !== -1 ? parseBool(adRow[footerIdx]) : false, title: getValue(titleIdx), mobile: getValue(mobileIdx), desktop: getValue(desktopIdx) }
            };
            this.renderAds(adConfig);
        } catch (err) {
            console.warn('⚠️ Failed to load ads from Google Sheets:', err);
            this.hideAllAdContainers();
        }
    }

    getCurrentPageId() {
        const path = window.location.pathname;
        // Blog pages: /blogs/xyz.html or /blogs/xyz
        const blogMatch = path.match(/\\/blogs\\/([^\\/]+)(?:\\.html)?$/);
        if (blogMatch) return blogMatch[1];
        // Depot pages: path ends with /depot-id/index.html or /depot-id/
        const depotMatch = path.match(/\\/([a-zA-Z0-9_]+)(?:\\/index\\.html|\\/)?$/);
        if (depotMatch && !path.includes('/blogs/') && !path.includes('/assets/')) {
            const id = depotMatch[1];
            // Ignore known non-depot paths
            if (!['bus-schedule', 'about', 'contact', 'terms', 'privacy', 'disclaimer', 'index', 'blogs'].includes(id)) {
                return id;
            }
        }
        return 'global';
    }

    hideAllAdContainers() {
        document.querySelectorAll('.ad-container').forEach(container => {
            container.style.display = 'none';
        });
    }

    renderAds(config) {
        const slots = ['top', 'middle', 'footer'];
        slots.forEach(slot => {
            const container = document.querySelector(\`.ad-container.\${slot}\`);
            if (!container) return;
            const slotConfig = config[slot];
            if (!slotConfig || !slotConfig.enabled) {
                container.style.display = 'none';
                return;
            }
            container.style.display = 'block';
            this.renderAdInContainer(container, slotConfig);
        });
    }

    renderAdInContainer(container, config) {
        const title = config.title || 'Advertisement';
        const mobileSrc = config.mobile || '';
        const desktopSrc = config.desktop || '';
        const inner = document.createElement('div');
        inner.className = 'ad-content';
        let pictureHtml = '';
        if (mobileSrc && desktopSrc) {
            pictureHtml = \`<picture class="ad-image"><source media="(max-width: 767px)" srcset="\${mobileSrc}"><img src="\${desktopSrc}" alt="\${title}" loading="lazy"></picture>\`;
        } else if (desktopSrc) {
            pictureHtml = \`<img src="\${desktopSrc}" alt="\${title}" class="ad-image" loading="lazy">\`;
        } else if (mobileSrc) {
            pictureHtml = \`<img src="\${mobileSrc}" alt="\${title}" class="ad-image" loading="lazy">\`;
        } else {
            pictureHtml = \`<div class="ad-image"></div>\`;
        }
        const titleHtml = \`<div class="ad-title">\${title}</div>\`;
        const full = \`<div class="ad-block">\${titleHtml}\${pictureHtml}</div>\`;
        inner.innerHTML = full;
        container.innerHTML = '';
        container.appendChild(inner);
    }
}
document.addEventListener('DOMContentLoaded', () => { window.busApp = new BusTimetableApp(); });`;
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