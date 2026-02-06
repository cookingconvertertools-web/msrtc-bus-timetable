const fs = require('fs');
const path = require('path');

class SiteGenerator {
    constructor() {
        this.baseDir = __dirname;
        this.dataDir = path.join(this.baseDir, 'data');
        this.publicDir = path.join(this.baseDir, 'public');
        this.templateDir = path.join(this.baseDir, 'templates');
        this.blogsDir = path.join(this.dataDir, 'blogs');

        // Ensure directories exist
        [this.templateDir, this.blogsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

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

        // Load all data
        this.loadAllData();
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

        console.log(`✅ Loaded data: ${Object.keys(this.data.divisions).length} divisions, ${Object.keys(this.data.districts).length} districts, ${Object.keys(this.data.tehsils).length} tehsils, ${Object.keys(this.data.depots).length} depots, ${this.blogs.length} blogs`);
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

                    // Support both single object and array of objects
                    if (Array.isArray(content)) {
                        content.forEach(item => {
                            const depotId = item.depots_id || item.depot_id || item.depot;
                            if (depotId) {
                                // Initialize array if not exists
                                if (!relatedDepots[depotId]) {
                                    relatedDepots[depotId] = [];
                                }

                                // Add related depot IDs
                                const relatedIds = item.related_depots_id || item.related_depots || item.related || [];
                                if (Array.isArray(relatedIds)) {
                                    relatedDepots[depotId].push(...relatedIds);
                                } else if (typeof relatedIds === 'string') {
                                    // Handle comma-separated string
                                    relatedDepots[depotId].push(...relatedIds.split(',').map(id => id.trim()));
                                }
                            }
                        });
                    } else if (typeof content === 'object') {
                        // Single object format
                        const depotId = content.depots_id || content.depot_id || content.depot;
                        if (depotId) {
                            relatedDepots[depotId] = content.related_depots_id || content.related_depots || content.related || [];
                            if (!Array.isArray(relatedDepots[depotId])) {
                                // Convert to array if it's a string
                                relatedDepots[depotId] = typeof relatedDepots[depotId] === 'string'
                                    ? [relatedDepots[depotId]]
                                    : [];
                            }
                        }
                    }

                    console.log(`   ✓ Loaded related depots from: ${file}`);
                } catch (error) {
                    console.error(`   ✗ Error loading related depots file ${file}:`, error.message);
                }
            });

            // Remove duplicates from each depot's related list
            Object.keys(relatedDepots).forEach(depotId => {
                relatedDepots[depotId] = [...new Set(relatedDepots[depotId])];
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
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');

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

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Blockquotes
        html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

        // Horizontal rules
        html = html.replace(/^\s*---\s*$/gm, '<hr>');
        html = html.replace(/^\s*\*\*\*\s*$/gm, '<hr>');
        html = html.replace(/^\s*___\s*$/gm, '<hr>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="blog-image">');

        // Line breaks
        html = html.replace(/  \n/g, '<br>\n');

        // Restore code blocks
        html = html.replace(/###CODEBLOCK###(codeblock-\d+)###CODEBLOCK###/g, (match, id) => {
            const codeBlock = codeBlocks.find(cb => cb.id === id);
            return codeBlock ? codeBlock.content : match;
        });

        return html;
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
                        tableHtml += '</tbody>\n</table>';
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

    generateSite() {
        console.log('\n🚀 Starting MSRTC Bus Timetable Site Generation...');
        console.log('==============================================\n');

        // Create public directory
        if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
        }

        // Generate HTML pages
        this.generateHomepage();
        this.generateStaticPages();
        this.generateBlogPages();
        this.generateDivisionPages();
        this.generateDistrictPages();
        this.generateTehsilPages();
        this.generateDepotPages();

        // Generate sitemap and robots.txt
        this.generateSitemap();
        this.generateRobotsTxt();

        // Generate search index
        this.generateSearchIndex();

        console.log('\n✅ Site generation complete!');
        this.printStats();
    }

    generateHomepage() {
        console.log('📄 Generating homepage...');

        const homepageContent = this.content.homepage || {};
        const seoContent = homepageContent.seo || {};

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoContent.title || 'MSRTC Bus Timetable - Maharashtra State Transport'}</title>
    <meta name="description" content="${seoContent.description || 'Real-time MSRTC bus schedules and timetables for Maharashtra State Road Transport Corporation'}">
    <meta name="keywords" content="${seoContent.keywords || 'MSRTC, Maharashtra bus, bus schedule, bus timing, state transport'}">

    <!-- Open Graph -->
    <meta property="og:title" content="${seoContent.title || 'MSRTC Bus Timetable'}">
    <meta property="og:description" content="${seoContent.description || 'Real-time bus schedules'}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${this.config.base_url}">

    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Poppins:wght@600;700&family=Orbitron:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "${this.config.site_name}",
        "url": "${this.config.base_url}",
        "description": "${seoContent.description || 'MSRTC bus schedules'}",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "${this.config.base_url}/#search",
            "query-input": "required name=search_term"
        }
    }
    </script>
</head>
<body>
    <!-- Header -->
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </div>
                <div class="time-display digital-clock">
                    <span class="digital-hours">00</span>:<span class="digital-minutes">00</span>:<span class="digital-seconds">00</span>
                    <span class="digital-ampm">AM</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Quick Jump Navigation - FIXED PADDING -->
    <div class="quick-jump-nav">
        <div class="container">
            <div class="quick-jump-content">
                <a href="#divisions" class="quick-jump-btn active" data-tab="divisions" data-hash="divisions">
                    <i class="bi bi-buildings"></i>
                    <span>Divisions</span>
                </a>
                <a href="#districts" class="quick-jump-btn" data-tab="districts" data-hash="districts">
                    <i class="bi bi-map"></i>
                    <span>Districts</span>
                </a>
                <a href="#tehsils" class="quick-jump-btn" data-tab="tehsils" data-hash="tehsils">
                    <i class="bi bi-building"></i>
                    <span>Tehsils</span>
                </a>
                <a href="#depots" class="quick-jump-btn" data-tab="depots" data-hash="depots">
                    <i class="bi bi-bus-front"></i>
                    <span>Depots</span>
                </a>
                <button class="quick-jump-btn alphabet-trigger">
                    <i class="bi bi-sort-alpha-down"></i>
                    <span>A-Z</span>
                </button>
                <button class="quick-jump-btn search-trigger">
                    <i class="bi bi-search"></i>
                    <span>Search</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            <h1 class="text-center">${homepageContent.title || 'MSRTC Bus Timetable'}</h1>
            <p class="text-center">${homepageContent.subtitle || 'Find accurate bus schedules across Maharashtra'}</p>

            <div class="homepage-content mt-3">
                ${homepageContent.content || '<p>Welcome to the official MSRTC bus timetable portal.</p>'}
            </div>

            <!-- Middle Ad -->
            ${this.renderAd('middle_ad')}

            <!-- Tab Navigation -->
            <div class="tabs-container">
                <div class="tabs-header">
                    <button class="tab-btn active" data-tab="divisions" data-hash="divisions">
                        <span>Divisions</span>
                        <span class="tab-count">${Object.keys(this.data.divisions).length}</span>
                    </button>
                    <button class="tab-btn" data-tab="districts" data-hash="districts">
                        <span>Districts</span>
                        <span class="tab-count">${Object.keys(this.data.districts).length}</span>
                    </button>
                    <button class="tab-btn" data-tab="tehsils" data-hash="tehsils">
                        <span>Tehsils</span>
                        <span class="tab-count">${Object.keys(this.data.tehsils).length}</span>
                    </button>
                    <button class="tab-btn" data-tab="depots" data-hash="depots">
                        <span>Depots</span>
                        <span class="tab-count">${Object.keys(this.data.depots).length}</span>
                    </button>
                </div>

                <!-- Tab Contents -->
                <div class="tab-content active" id="divisions-tab">
                    <div class="alphabet-quick-access">
                        <h3>Quick Jump to Divisions</h3>
                        <div class="alphabet-mini-grid">
                            ${this.renderAlphabetForType('divisions')}
                        </div>
                    </div>
                    <div class="division-grid mt-3">
                        ${this.renderDivisionTab()}
                    </div>
                </div>

                <div class="tab-content" id="districts-tab">
                    <div class="alphabet-quick-access">
                        <h3>Quick Jump to Districts</h3>
                        <div class="alphabet-mini-grid">
                            ${this.renderAlphabetForType('districts')}
                        </div>
                    </div>
                    <div class="district-grid mt-3">
                        ${this.renderDistrictTab()}
                    </div>
                </div>

                <div class="tab-content" id="tehsils-tab">
                    <div class="alphabet-quick-access">
                        <h3>Quick Jump to Tehsils</h3>
                        <div class="alphabet-mini-grid">
                            ${this.renderAlphabetForType('tehsils')}
                        </div>
                    </div>
                    <div class="tehsil-grid mt-3">
                        ${this.renderTehsilTab()}
                    </div>
                </div>

                <div class="tab-content" id="depots-tab">
                    <div class="alphabet-quick-access">
                        <h3>Quick Jump to Depots</h3>
                        <div class="alphabet-mini-grid">
                            ${this.renderAlphabetForType('depots')}
                        </div>
                    </div>
                    <div class="depot-grid mt-3">
                        ${this.renderDepotTab()}
                    </div>
                </div>
            </div>

            <!-- SEO Content -->
            ${homepageContent.seo_content ? this.renderSEOContent(homepageContent.seo_content) : this.renderSEOContent(this.getDefaultSEOContent('homepage'))}
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    <!-- Footer -->
    ${this.renderFooter('')}

    <!-- Quick Search Modal -->
    <div class="quick-search-modal" id="searchModal">
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3><i class="bi bi-search"></i> Quick Search Amravati Division & Districts</h3>
                <button class="close-search">&times;</button>
            </div>
            <div class="search-modal-body">
                <input type="text" class="global-search-input" placeholder="Type to search divisions, districts, tehsils, depots...">
                <div class="search-results" id="searchResults"></div>
            </div>
        </div>
    </div>

    <!-- Alphabet Quick View (Fixed at bottom on mobile) - FIXED Z-INDEX AND TOUCH -->
    <div class="alphabet-quick-view" id="alphabetView">
        <div class="alphabet-view-header">
            <h4>Jump to Letter</h4>
            <button class="close-alphabet">&times;</button>
        </div>
        <div class="alphabet-view-grid">
            ${this.renderAlphabetButtons()}
        </div>
    </div>

    <!-- Inline JavaScript -->
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;

        this.writeFile('index.html', html);
        console.log('   ✓ Homepage generated with enhanced navigation');
    }

    generateStaticPages() {
        const pages = ['about', 'contact', 'terms', 'privacy', 'disclaimer'];

        pages.forEach(page => {
            console.log(`📄 Generating ${page} page...`);

            const pageContent = this.content[page] || {
                title: page.charAt(0).toUpperCase() + page.slice(1),
                content: `<p>${page} content will be added soon.</p>`,
                seo: {
                    title: page.charAt(0).toUpperCase() + page.slice(1),
                    description: `Read our ${page} page`
                }
            };

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageContent.seo?.title || page}</title>
    <meta name="description" content="${pageContent.seo?.description || page}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Poppins:wght@600;700&family=Orbitron:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="index.html" class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </a>
                <div class="time-display digital-clock">
                    <span class="digital-hours">00</span>:<span class="digital-minutes">00</span>:<span class="digital-seconds">00</span>
                    <span class="digital-ampm">AM</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Quick Jump Navigation -->
    <div class="quick-jump-nav">
        <div class="container">
            <div class="quick-jump-content">
                <a href="index.html#divisions" class="quick-jump-btn" data-tab="divisions" data-hash="divisions">
                    <i class="bi bi-buildings"></i>
                    <span>Divisions</span>
                </a>
                <a href="index.html#districts" class="quick-jump-btn" data-tab="districts" data-hash="districts">
                    <i class="bi bi-map"></i>
                    <span>Districts</span>
                </a>
                <a href="index.html#tehsils" class="quick-jump-btn" data-tab="tehsils" data-hash="tehsils">
                    <i class="bi bi-building"></i>
                    <span>Tehsils</span>
                </a>
                <a href="index.html#depots" class="quick-jump-btn" data-tab="depots" data-hash="depots">
                    <i class="bi bi-bus-front"></i>
                    <span>Depots</span>
                </a>
                <button class="quick-jump-btn alphabet-trigger">
                    <i class="bi bi-sort-alpha-down"></i>
                    <span>A-Z</span>
                </button>
                <button class="quick-jump-btn search-trigger">
                    <i class="bi bi-search"></i>
                    <span>Search</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <main class="main-content">
        <div class="container">
            <div class="navigation-buttons">
                <a href="index.html" class="back-btn">
                    <i class="bi bi-house"></i> Back to Bus Schedule
                </a>
            </div>

            <h1>${pageContent.title}</h1>
            <div class="page-content">
                ${pageContent.content}
            </div>

            <!-- SEO Content if available -->
            ${pageContent.seo_content ? this.renderSEOContent(pageContent.seo_content) : ''}
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter('')}

    <!-- Inline JavaScript -->
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;

            this.writeFile(`${page}.html`, html);
            console.log(`   ✓ ${page} page generated`);
        });
    }

    generateBlogPages() {
        console.log('📝 Generating blog pages...');

        // Create blogs directory
        const blogsPublicDir = path.join(this.publicDir, 'blogs');
        if (!fs.existsSync(blogsPublicDir)) {
            fs.mkdirSync(blogsPublicDir, { recursive: true });
        }

        // Generate blog listing page - FIXED URL
        const blogListingHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blogs & Updates - ${this.config.site_name}</title>
    <meta name="description" content="Latest news, updates, and articles about MSRTC bus services, schedule changes, and transportation in Maharashtra">
    <meta name="keywords" content="MSRTC blog, bus news, Maharashtra transport updates, schedule changes">
    <link rel="canonical" href="${this.config.base_url}/blogs/index.html">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Poppins:wght@600;700&family=Orbitron:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Blogs & Updates",
        "description": "Latest news and articles about MSRTC bus services",
        "url": "${this.config.base_url}/blogs/index.html"
    }
    </script>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="../index.html" class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </a>
                <div class="time-display digital-clock">
                    <span class="digital-hours">00</span>:<span class="digital-minutes">00</span>:<span class="digital-seconds">00</span>
                    <span class="digital-ampm">AM</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Quick Jump Navigation -->
    <div class="quick-jump-nav">
        <div class="container">
            <div class="quick-jump-content">
                <a href="../index.html#divisions" class="quick-jump-btn" data-tab="divisions" data-hash="divisions">
                    <i class="bi bi-buildings"></i>
                    <span>Divisions</span>
                </a>
                <a href="../index.html#districts" class="quick-jump-btn" data-tab="districts" data-hash="districts">
                    <i class="bi bi-map"></i>
                    <span>Districts</span>
                </a>
                <a href="../index.html#tehsils" class="quick-jump-btn" data-tab="tehsils" data-hash="tehsils">
                    <i class="bi bi-building"></i>
                    <span>Tehsils</span>
                </a>
                <a href="../index.html#depots" class="quick-jump-btn" data-tab="depots" data-hash="depots">
                    <i class="bi bi-bus-front"></i>
                    <span>Depots</span>
                </a>
                <button class="quick-jump-btn alphabet-trigger">
                    <i class="bi bi-sort-alpha-down"></i>
                    <span>A-Z</span>
                </button>
                <button class="quick-jump-btn search-trigger">
                    <i class="bi bi-search"></i>
                    <span>Search</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <main class="main-content">
        <div class="container">
            <div class="navigation-buttons">
                <a href="index.html" class="back-btn">
                    <i class="bi bi-arrow-left"></i> Back to Blogs
                </a>
                <a href="../index.html" class="back-btn">
                    <i class="bi bi-house"></i> Back to Bus Schedule
                </a>
            </div>

            <h1>Blogs & Updates</h1>
            <p>Latest news and articles about MSRTC bus services in Maharashtra</p>

            ${this.blogs.length > 0 ? `
                <div class="blog-grid">
                    ${this.blogs.map(blog => `
                        <a href="${blog.id}.html" class="blog-card">
                            <div class="blog-card-image">
                                <i class="bi bi-newspaper"></i>
                            </div>
                            <div class="blog-card-content">
                                <h3>${blog.title}</h3>
                                <div class="blog-card-excerpt">${blog.excerpt || blog.content.substring(0, 150) + '...'}</div>
                                <div class="blog-card-meta">
                                    <div class="blog-card-date">
                                        <i class="bi bi-calendar"></i>
                                        ${new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div class="blog-card-readtime">
                                        <i class="bi bi-clock"></i>
                                        ${blog.read_time || '5 min'} read
                                    </div>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <i class="bi bi-newspaper"></i>
                    <h3>No blog posts yet</h3>
                    <p>Check back soon for updates and articles about MSRTC services.</p>
                </div>
            `}
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter('../')}

    <!-- Inline JavaScript -->
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;

        this.writeFile('blogs/index.html', blogListingHTML);
        console.log('   ✓ Blog listing page generated');

        // Generate individual blog pages
        this.blogs.forEach(blog => {
            console.log(`   📄 Generating blog: ${blog.title}`);

            const blogHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blog.seo?.title || blog.title} - ${this.config.site_name}</title>
    <meta name="description" content="${blog.seo?.description || blog.excerpt || blog.content.substring(0, 160)}">
    <meta name="keywords" content="${blog.seo?.keywords || blog.tags?.join(', ') || 'MSRTC, bus, Maharashtra, transport'}">
    <link rel="canonical" href="${this.config.base_url}/blogs/${blog.id}.html">

    <!-- Open Graph -->
    <meta property="og:title" content="${blog.title}">
    <meta property="og:description" content="${blog.excerpt || blog.content.substring(0, 200)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${this.config.base_url}/blogs/${blog.id}.html">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Poppins:wght@600;700&family=Orbitron:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "${blog.title}",
        "description": "${blog.excerpt || blog.content.substring(0, 200)}",
        "datePublished": "${blog.date}",
        "dateModified": "${blog.updated || blog.date}",
        "author": {
            "@type": "Person",
            "name": "${blog.author || 'MSRTC Admin'}"
        },
        "publisher": {
            "@type": "Organization",
            "name": "${this.config.site_name}",
            "logo": {
                "@type": "ImageObject",
                "url": "${this.config.base_url}/logo.png"
            }
        }${blog.tags && blog.tags.length > 0 ? `,
        "keywords": "${blog.tags.join(', ')}"` : ''}
    }
    </script>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="../index.html" class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </a>
                <div class="time-display digital-clock">
                    <span class="digital-hours">00</span>:<span class="digital-minutes">00</span>:<span class="digital-seconds">00</span>
                    <span class="digital-ampm">AM</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Quick Jump Navigation -->
    <div class="quick-jump-nav">
        <div class="container">
            <div class="quick-jump-content">
                <a href="../index.html#divisions" class="quick-jump-btn" data-tab="divisions" data-hash="divisions">
                    <i class="bi bi-buildings"></i>
                    <span>Divisions</span>
                </a>
                <a href="../index.html#districts" class="quick-jump-btn" data-tab="districts" data-hash="districts">
                    <i class="bi bi-map"></i>
                    <span>Districts</span>
                </a>
                <a href="../index.html#tehsils" class="quick-jump-btn" data-tab="tehsils" data-hash="tehsils">
                    <i class="bi bi-building"></i>
                    <span>Tehsils</span>
                </a>
                <a href="../index.html#depots" class="quick-jump-btn" data-tab="depots" data-hash="depots">
                    <i class="bi bi-bus-front"></i>
                    <span>Depots</span>
                </a>
                <button class="quick-jump-btn alphabet-trigger">
                    <i class="bi bi-sort-alpha-down"></i>
                    <span>A-Z</span>
                </button>
                <button class="quick-jump-btn search-trigger">
                    <i class="bi bi-search"></i>
                    <span>Search</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <main class="main-content">
        <div class="container blog-page">
            <div class="navigation-buttons">
                <a href="index.html" class="back-btn">
                    <i class="bi bi-arrow-left"></i> Back to Blogs
                </a>
                <a href="../index.html" class="back-btn">
                    <i class="bi bi-house"></i> Back to Bus Schedule
                </a>
            </div>

            <div class="blog-header">
                <h1>${blog.title}</h1>
                <div class="blog-date">
                    <i class="bi bi-calendar"></i>
                    ${new Date(blog.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            ${blog.author ? `
                <div class="blog-author">
                    <div class="author-avatar">
                        ${blog.author.charAt(0).toUpperCase()}
                    </div>
                    <div class="author-info">
                        <h4>${blog.author}</h4>
                        <p>${blog.author_role || 'MSRTC Official'}</p>
                    </div>
                </div>
            ` : ''}

            <div class="blog-content">
                ${blog.content}
            </div>

            ${blog.tags && blog.tags.length > 0 ? `
                <div class="blog-tags">
                    ${blog.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}

            <!-- Blog SEO Content -->
            ${blog.seo_content ? this.renderSEOContent(blog.seo_content) : ''}
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter('../')}

    <!-- Inline JavaScript -->
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;

            this.writeFile(`blogs/${blog.id}.html`, blogHTML);
        });
    }

    generateDivisionPages() {
        Object.values(this.data.divisions).forEach(division => {
            console.log(`🏛️  Generating division: ${division.name}`);

            const html = this.renderDivisionPage(division);
            const divisionDir = path.join(this.publicDir, division.id);

            if (!fs.existsSync(divisionDir)) {
                fs.mkdirSync(divisionDir, { recursive: true });
            }

            this.writeFile(`${division.id}/index.html`, html);
            console.log(`   ✓ Division page: ${division.name}`);
        });
    }

    generateDistrictPages() {
        Object.values(this.data.districts).forEach(district => {
            console.log(`📍 Generating district: ${district.name}`);

            const division = this.data.divisions[district.division_id];
            if (!division) {
                console.log(`   ✗ Skipping ${district.name} - no division found`);
                return;
            }

            const html = this.renderDistrictPage(district, division);
            const districtDir = path.join(this.publicDir, division.id, district.id);

            if (!fs.existsSync(districtDir)) {
                fs.mkdirSync(districtDir, { recursive: true });
            }

            this.writeFile(`${division.id}/${district.id}/index.html`, html);
            console.log(`   ✓ District page: ${district.name}`);
        });
    }

    generateTehsilPages() {
        Object.values(this.data.tehsils).forEach(tehsil => {
            console.log(`🏘️  Generating tehsil: ${tehsil.name}`);

            const district = this.data.districts[tehsil.district_id];
            const division = district ? this.data.divisions[district.division_id] : null;

            if (!district || !division) {
                console.log(`   ✗ Skipping ${tehsil.name} - no district/division found`);
                return;
            }

            const html = this.renderTehsilPage(tehsil, district, division);
            const tehsilDir = path.join(this.publicDir, division.id, district.id, tehsil.id);

            if (!fs.existsSync(tehsilDir)) {
                fs.mkdirSync(tehsilDir, { recursive: true });
            }

            this.writeFile(`${division.id}/${district.id}/${tehsil.id}/index.html`, html);
            console.log(`   ✓ Tehsil page: ${tehsil.name}`);
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

            if (!fs.existsSync(depotDir)) {
                fs.mkdirSync(depotDir, { recursive: true });
            }

            this.writeFile(`${division.id}/${district.id}/${tehsil.id}/${depot.id}/index.html`, html);
            console.log(`   ✓ Depot page: ${depot.name}`);
        });
    }

    renderDivisionPage(division) {
        const districts = this.getDistrictsForDivision(division.id);
        const depotCount = this.getDepotCountForDivision(division.id);
        const seo = division.seo || {};
        const content = division.content || {};

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seo.title || `${division.name} Division - ${this.config.site_name}`}</title>
    <meta name="description" content="${seo.description || `MSRTC bus schedules for ${division.name} division covering ${districts.length} districts in Maharashtra`}">
    <meta name="keywords" content="${seo.keywords || `MSRTC, ${division.name} division, bus schedule, Maharashtra transport`}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Poppins:wght@600;700&family=Orbitron:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="../index.html" class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </a>
                <div class="time-display digital-clock">
                    <span class="digital-hours">00</span>:<span class="digital-minutes">00</span>:<span class="digital-seconds">00</span>
                    <span class="digital-ampm">AM</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Quick Jump Navigation -->
    <div class="quick-jump-nav">
        <div class="container">
            <div class="quick-jump-content">
                <a href="../index.html#divisions" class="quick-jump-btn" data-tab="divisions" data-hash="divisions">
                    <i class="bi bi-buildings"></i>
                    <span>Divisions</span>
                </a>
                <a href="../index.html#districts" class="quick-jump-btn" data-tab="districts" data-hash="districts">
                    <i class="bi bi-map"></i>
                    <span>Districts</span>
                </a>
                <a href="../index.html#tehsils" class="quick-jump-btn" data-tab="tehsils" data-hash="tehsils">
                    <i class="bi bi-building"></i>
                    <span>Tehsils</span>
                </a>
                <a href="../index.html#depots" class="quick-jump-btn" data-tab="depots" data-hash="depots">
                    <i class="bi bi-bus-front"></i>
                    <span>Depots</span>
                </a>
                <button class="quick-jump-btn alphabet-trigger">
                    <i class="bi bi-sort-alpha-down"></i>
                    <span>A-Z</span>
                </button>
                <button class="quick-jump-btn search-trigger">
                    <i class="bi bi-search"></i>
                    <span>Search</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <nav class="breadcrumb">
        <div class="container">
            <a href="../index.html">Home</a>
            <span>→</span>
            <span>${division.name}</span>
        </div>
    </nav>

    <main class="main-content">
        <div class="container">
            <div class="navigation-buttons">
                <a href="../index.html" class="back-btn">
                    <i class="bi bi-house"></i> Back to Bus Schedule
                </a>
            </div>

            <div class="depot-header">
                <h1>${division.name}</h1>
                <p>${content.description || 'MSRTC bus schedules division'}</p>
                <div class="depot-info">
                    <div class="info-item">
                        <i class="bi bi-buildings"></i>
                        <span>${districts.length} Districts</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-bus-front"></i>
                        <span>${depotCount} Depots</span>
                    </div>
                </div>
            </div>

            <!-- Middle Ad -->
            ${this.renderAd('middle_ad')}

            <!-- Alphabet Quick Access for Districts -->
            <div class="alphabet-quick-access">
                <h3>Quick Jump to Districts</h3>
                <div class="alphabet-mini-grid">
                    ${this.renderDistrictAlphabet(districts)}
                </div>
            </div>

            <!-- Districts Grid -->
            <div class="district-grid">
                ${this.renderDistrictCards(districts, division.id)}
            </div>

            <!-- SEO Content -->
            ${content.seo_content ? this.renderSEOContent(content.seo_content) : ''}
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter('../')}

    <!-- Quick Search Modal -->
    <div class="quick-search-modal" id="searchModal">
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3><i class="bi bi-search"></i> Quick Search ${division.name} Division</h3>
                <button class="close-search">&times;</button>
            </div>
            <div class="search-modal-body">
                <input type="text" class="global-search-input" placeholder="Type to search districts in ${division.name}...">
                <div class="search-results" id="searchResults"></div>
            </div>
        </div>
    </div>

    <!-- Alphabet Quick View -->
    <div class="alphabet-quick-view" id="alphabetView">
        <div class="alphabet-view-header">
            <h4>Jump to District</h4>
            <button class="close-alphabet">&times;</button>
        </div>
        <div class="alphabet-view-grid">
            ${this.renderAlphabetButtons()}
        </div>
    </div>

    <!-- Inline JavaScript -->
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;
    }

    renderDistrictPage(district, division) {
        const tehsils = this.getTehsilsForDistrict(district.id);
        const depotCount = this.getDepotCountForDistrict(district.id);
        const seo = district.seo || {};
        const content = district.content || {};

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seo.title || `${district.name} District - ${division.name} - ${this.config.site_name}`}</title>
    <meta name="description" content="${seo.description || `MSRTC bus schedules for ${district.name} district in ${division.name} division`}">
    <meta name="keywords" content="${seo.keywords || `MSRTC, ${district.name} district, ${division.name} division, bus schedule`}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Poppins:wght@600;700&family=Orbitron:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="../../index.html" class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </a>
                <div class="time-display digital-clock">
                    <span class="digital-hours">00</span>:<span class="digital-minutes">00</span>:<span class="digital-seconds">00</span>
                    <span class="digital-ampm">AM</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Quick Jump Navigation -->
    <div class="quick-jump-nav">
        <div class="container">
            <div class="quick-jump-content">
                <a href="../../index.html#divisions" class="quick-jump-btn" data-tab="divisions" data-hash="divisions">
                    <i class="bi bi-buildings"></i>
                    <span>Divisions</span>
                </a>
                <a href="../../index.html#districts" class="quick-jump-btn" data-tab="districts" data-hash="districts">
                    <i class="bi bi-map"></i>
                    <span>Districts</span>
                </a>
                <a href="../../index.html#tehsils" class="quick-jump-btn" data-tab="tehsils" data-hash="tehsils">
                    <i class="bi bi-building"></i>
                    <span>Tehsils</span>
                </a>
                <a href="../../index.html#depots" class="quick-jump-btn" data-tab="depots" data-hash="depots">
                    <i class="bi bi-bus-front"></i>
                    <span>Depots</span>
                </a>
                <button class="quick-jump-btn alphabet-trigger">
                    <i class="bi bi-sort-alpha-down"></i>
                    <span>A-Z</span>
                </button>
                <button class="quick-jump-btn search-trigger">
                    <i class="bi bi-search"></i>
                    <span>Search</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <nav class="breadcrumb">
        <div class="container">
            <a href="../../index.html">Home</a>
            <span>→</span>
            <a href="../index.html">${division.name}</a>
            <span>→</span>
            <span>${district.name}</span>
        </div>
    </nav>

    <main class="main-content">
        <div class="container">
            <div class="navigation-buttons">
                <a href="../index.html" class="back-btn">
                    <i class="bi bi-arrow-left"></i> Back to ${division.name}
                </a>
                <a href="../../index.html" class="back-btn">
                    <i class="bi bi-house"></i> Back to Bus Schedule
                </a>
            </div>

            <div class="depot-header">
                <h1>${district.name}</h1>
                <p>${content.description || 'MSRTC bus schedules district'}</p>
                <div class="depot-info">
                    <div class="info-item">
                        <i class="bi bi-geo-alt"></i>
                        <span>${division.name} Division</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-building"></i>
                        <span>${tehsils.length} Tehsils</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-bus-front"></i>
                        <span>${depotCount} Depots</span>
                    </div>
                </div>
            </div>

            <!-- Middle Ad -->
            ${this.renderAd('middle_ad')}

            <!-- Alphabet Quick Access for Tehsils -->
            <div class="alphabet-quick-access">
                <h3>Quick Jump to Tehsils</h3>
                <div class="alphabet-mini-grid">
                    ${this.renderTehsilAlphabet(tehsils)}
                </div>
            </div>

            <!-- Tehsils Grid -->
            <div class="tehsil-grid">
                ${this.renderTehsilCards(tehsils, division.id, district.id)}
            </div>

            <!-- SEO Content -->
            ${content.seo_content ? this.renderSEOContent(content.seo_content) : ''}
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter('../../')}

    <!-- Quick Search Modal -->
    <div class="quick-search-modal" id="searchModal">
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3><i class="bi bi-search"></i> Quick Search ${district.name} District</h3>
                <button class="close-search">&times;</button>
            </div>
            <div class="search-modal-body">
                <input type="text" class="global-search-input" placeholder="Type to search tehsils in ${district.name}...">
                <div class="search-results" id="searchResults"></div>
            </div>
        </div>
    </div>

    <!-- Alphabet Quick View -->
    <div class="alphabet-quick-view" id="alphabetView">
        <div class="alphabet-view-header">
            <h4>Jump to Tehsil</h4>
            <button class="close-alphabet">&times;</button>
        </div>
        <div class="alphabet-view-grid">
            ${this.renderAlphabetButtons()}
        </div>
    </div>

    <!-- Inline JavaScript -->
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;
    }

    renderTehsilPage(tehsil, district, division) {
        const depots = this.getDepotsForTehsil(tehsil.id);
        const seo = tehsil.seo || {};
        const content = tehsil.content || {};

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seo.title || `${tehsil.name} Tehsil - ${district.name} - ${this.config.site_name}`}</title>
    <meta name="description" content="${seo.description || `MSRTC bus schedules for ${tehsil.name} tehsil in ${district.name} district`}">
    <meta name="keywords" content="${seo.keywords || `MSRTC, ${tehsil.name} tehsil, ${district.name} district, bus schedule`}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Poppins:wght@600;700&family=Orbitron:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="../../../index.html" class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </a>
                <div class="time-display digital-clock">
                    <span class="digital-hours">00</span>:<span class="digital-minutes">00</span>:<span class="digital-seconds">00</span>
                    <span class="digital-ampm">AM</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Quick Jump Navigation -->
    <div class="quick-jump-nav">
        <div class="container">
            <div class="quick-jump-content">
                <a href="../../../index.html#divisions" class="quick-jump-btn" data-tab="divisions" data-hash="divisions">
                    <i class="bi bi-buildings"></i>
                    <span>Divisions</span>
                </a>
                <a href="../../../index.html#districts" class="quick-jump-btn" data-tab="districts" data-hash="districts">
                    <i class="bi bi-map"></i>
                    <span>Districts</span>
                </a>
                <a href="../../../index.html#tehsils" class="quick-jump-btn" data-tab="tehsils" data-hash="tehsils">
                    <i class="bi bi-building"></i>
                    <span>Tehsils</span>
                </a>
                <a href="../../../index.html#depots" class="quick-jump-btn" data-tab="depots" data-hash="depots">
                    <i class="bi bi-bus-front"></i>
                    <span>Depots</span>
                </a>
                <button class="quick-jump-btn alphabet-trigger">
                    <i class="bi bi-sort-alpha-down"></i>
                    <span>A-Z</span>
                </button>
                <button class="quick-jump-btn search-trigger">
                    <i class="bi bi-search"></i>
                    <span>Search</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <nav class="breadcrumb">
        <div class="container">
            <a href="../../../index.html">Home</a>
            <span>→</span>
            <a href="../../index.html">${division.name}</a>
            <span>→</span>
            <a href="../index.html">${district.name}</a>
            <span>→</span>
            <span>${tehsil.name}</span>
        </div>
    </nav>

    <main class="main-content">
        <div class="container">
            <div class="navigation-buttons">
                <a href="../index.html" class="back-btn">
                    <i class="bi bi-arrow-left"></i> Back to ${district.name}
                </a>
                <a href="../../../index.html" class="back-btn">
                    <i class="bi bi-house"></i> Back to Bus Schedule
                </a>
            </div>

            <div class="depot-header">
                <h1>${tehsil.name}</h1>
                <p>${content.description || 'MSRTC bus schedules tehsil'}</p>
                <div class="depot-info">
                    <div class="info-item">
                        <i class="bi bi-geo-alt"></i>
                        <span>${district.name} District</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-bus-front"></i>
                        <span>${depots.length} Depots</span>
                    </div>
                </div>
            </div>

            <!-- Middle Ad -->
            ${this.renderAd('middle_ad')}

            <!-- Alphabet Quick Access for Depots -->
            <div class="alphabet-quick-access">
                <h3>Quick Jump to Depots</h3>
                <div class="alphabet-mini-grid">
                    ${this.renderDepotAlphabet(depots)}
                </div>
            </div>

            <!-- Depots Grid -->
            <div class="depot-grid">
                ${this.renderDepotCards(depots, division.id, district.id, tehsil.id)}
            </div>

            <!-- SEO Content -->
            ${content.seo_content ? this.renderSEOContent(content.seo_content) : ''}
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter('../../../')}

    <!-- Quick Search Modal -->
    <div class="quick-search-modal" id="searchModal">
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3><i class="bi bi-search"></i> Quick Search ${tehsil.name} Tehsil</h3>
                <button class="close-search">&times;</button>
            </div>
            <div class="search-modal-body">
                <input type="text" class="global-search-input" placeholder="Type to search depots in ${tehsil.name}...">
                <div class="search-results" id="searchResults"></div>
            </div>
        </div>
    </div>

    <!-- Alphabet Quick View -->
    <div class="alphabet-quick-view" id="alphabetView">
        <div class="alphabet-view-header">
            <h4>Jump to Depot</h4>
            <button class="close-alphabet">&times;</button>
        </div>
        <div class="alphabet-view-grid">
            ${this.renderAlphabetButtons()}
        </div>
    </div>

    <!-- Inline JavaScript -->
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;
    }

    renderDepotPage(depot, tehsil, district, division) {
        const villages = depot.villages || {};
        const villageLetters = Object.keys(villages).sort();

        // Calculate total bus stops and buses
        let totalBusStopCount = 0;
        let totalBusCount = 0;
        Object.values(villages).forEach(busStopList => {
            totalBusStopCount += busStopList.length;
            busStopList.forEach(busStop => {
                totalBusCount += busStop.schedule ? busStop.schedule.length : 0;
            });
        });

        // Load content from JSON
        const seo = depot.seo || {};
        const content = depot.content || {};
        const depotContent = content.about || '';
        const faqs = content.faqs || [];

        // Get related depots from the data
        const relatedDepots = this.getRelatedDepots(depot.id);

        // If no specific related depots, get other depots in the same tehsil
        const fallbackRelatedDepots = relatedDepots.length === 0 ? this.getRelatedDepotsInTehsil(depot.id, tehsil.id) : [];

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seo.title || `${depot.name} Depot - ${tehsil.name} - ${this.config.site_name}`}</title>
    <meta name="description" content="${seo.description || `MSRTC bus schedule for ${depot.name} depot in ${tehsil.name}, ${district.name}. Find bus timings to bus stops from ${depot.name}.`}">
    <meta name="keywords" content="${seo.keywords || `${depot.name} bus timing, ${tehsil.name} depot, ${district.name} MSRTC, bus schedule ${depot.name}`}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Poppins:wght@600;700&family=Orbitron:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- Inline CSS -->
    <style>
        ${this.getInlineCSS()}
    </style>

    <!-- Schema.org -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BusStation",
        "name": "${depot.name}",
        "description": "MSRTC Bus Depot in ${tehsil.name}, ${district.name}",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "${tehsil.name}",
            "addressRegion": "${district.name}",
            "addressCountry": "IN"
        },
        "openingHours": "Mo-Su 05:00-23:00",
        "department": {
            "@type": "Organization",
            "name": "${division.name} Division"
        }
    }
    </script>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="../../../../index.html" class="logo">
                    <i class="bi bi-bus-front"></i>
                    <span>${this.config.site_name}</span>
                </a>
                <div class="time-display digital-clock">
                    <span class="digital-hours">00</span>:<span class="digital-minutes">00</span>:<span class="digital-seconds">00</span>
                    <span class="digital-ampm">AM</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Quick Jump Navigation -->
    <div class="quick-jump-nav">
        <div class="container">
            <div class="quick-jump-content">
                <a href="../../../../index.html#divisions" class="quick-jump-btn" data-tab="divisions" data-hash="divisions">
                    <i class="bi bi-buildings"></i>
                    <span>Divisions</span>
                </a>
                <a href="../../../../index.html#districts" class="quick-jump-btn" data-tab="districts" data-hash="districts">
                    <i class="bi bi-map"></i>
                    <span>Districts</span>
                </a>
                <a href="../../../../index.html#tehsils" class="quick-jump-btn" data-tab="tehsils" data-hash="tehsils">
                    <i class="bi bi-building"></i>
                    <span>Tehsils</span>
                </a>
                <a href="../../../../index.html#depots" class="quick-jump-btn" data-tab="depots" data-hash="depots">
                    <i class="bi bi-bus-front"></i>
                    <span>Depots</span>
                </a>
                <button class="quick-jump-btn bus-stop-alphabet-trigger active">
                    <i class="bi bi-sort-alpha-down"></i>
                    <span>Bus Stops</span>
                </button>
                <button class="quick-jump-btn search-trigger">
                    <i class="bi bi-search"></i>
                    <span>Search</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Top Ad -->
    ${this.renderAd('top_ad')}

    <nav class="breadcrumb">
        <div class="container">
            <a href="../../../../index.html">Home</a>
            <span>→</span>
            <a href="../../../index.html">${division.name}</a>
            <span>→</span>
            <a href="../../index.html">${district.name}</a>
            <span>→</span>
            <a href="../index.html">${tehsil.name}</a>
            <span>→</span>
            <span>${depot.name}</span>
        </div>
    </nav>

    <main class="main-content">
        <div class="container">
            <div class="navigation-buttons">
                <a href="../index.html" class="back-btn">
                    <i class="bi bi-arrow-left"></i> Back to ${tehsil.name}
                </a>
                <a href="../../../../index.html" class="back-btn">
                    <i class="bi bi-house"></i> Back to Bus Schedule
                </a>
            </div>

            <div class="depot-header">
                <h1>${depot.name}</h1>
                <p>${depot.address || 'MSRTC Bus Depot'}</p>
                <div class="depot-info">
                    ${depot.contact ? `<div class="info-item">
                        <i class="bi bi-telephone"></i>
                        <span>${depot.contact}</span>
                    </div>` : ''}
                    <div class="info-item">
                        <i class="bi bi-signpost"></i>
                        <span>${totalBusStopCount} Bus Stops</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-bus-front"></i>
                        <span>${totalBusCount} Bus Schedules</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-geo-alt"></i>
                        <span>${tehsil.name}</span>
                    </div>
                </div>
            </div>

            <!-- Middle Ad -->
            ${this.renderAd('middle_ad')}

            <!-- Floating Bus Stop Letters (Always Visible) -->
            <div class="floating-bus-stop-letters">
                <div class="floating-letters-header">
                    <h3>Jump to Bus Stop</h3>
                    <span class="bus-stop-count">${totalBusStopCount} bus stops</span>
                </div>
                <div class="floating-letters-grid">
                    ${this.renderBusStopAlphabetButtons(villageLetters)}
                </div>
            </div>

            <!-- Search -->
            <div class="search-container">
                <input type="text" class="search-box" placeholder="🔍 Search for bus stops..." id="search-box">
            </div>

            <!-- Time Filters -->
            <div class="time-filters">
                <button class="filter-btn active" data-filter="all">All Day</button>
                <button class="filter-btn" data-filter="morning">🌅 Morning (5AM-12PM)</button>
                <button class="filter-btn" data-filter="afternoon">☀️ Afternoon (12PM-5PM)</button>
                <button class="filter-btn" data-filter="evening">🌇 Evening (5PM-10PM)</button>
                <button class="filter-btn" data-filter="night">🌙 Night (10PM-5AM)</button>
            </div>

            <!-- Empty State -->
            <div class="empty-state hidden">
                <i class="bi bi-search"></i>
                <h3>No buses found</h3>
                <p>Try changing your filters or search term</p>
            </div>

            <!-- Bus Stops Schedule -->
            ${this.renderBusStopSections(villages, villageLetters)}

            <!-- Depot About Section -->
            ${depotContent ? `
                <div class="depot-about-section mt-4">
                    <h2>About ${depot.name} Depot</h2>
                    <div class="about-content">
                        ${depotContent}
                    </div>
                </div>
            ` : ''}

            <!-- FAQ Section -->
            ${faqs.length > 0 ? `
                <div class="faq-section mt-4">
                    <h2>Frequently Asked Questions</h2>
                    <div class="faq-container">
                        ${faqs.map((faq, index) => {
                            const question = faq.question || faq.q || '';
                            const answer = faq.answer || faq.a || '';
                            const cleanQuestion = question.replace(/^\s*[?•\-\*]\s*/, '');
                            return `
                            <div class="faq-item">
                                <div class="faq-question">
                                    <i class="bi bi-question-circle"></i>
                                    <span>${cleanQuestion}</span>
                                </div>
                                <div class="faq-answer">
                                    ${answer}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Related Links Section -->
            ${relatedDepots.length > 0 || fallbackRelatedDepots.length > 0 ? `
                <div class="related-links-section mt-4">
                    <h2>${relatedDepots.length > 0 ? 'Related Depots' : 'Other Depots in ' + tehsil.name}</h2>
                    <div class="related-links-grid">
                        ${relatedDepots.length > 0 ? relatedDepots.map(relatedDepot => this.renderRelatedDepotCard(relatedDepot, division.id, district.id, tehsil.id)).join('') : ''}
                        ${relatedDepots.length === 0 ? fallbackRelatedDepots.map(relatedDepot => this.renderRelatedDepotCard(relatedDepot, division.id, district.id, tehsil.id)).join('') : ''}
                    </div>
                </div>
            ` : ''}

            <!-- SEO Content -->
            ${content.seo_content ? this.renderSEOContent(content.seo_content) : ''}
        </div>
    </main>

    <!-- Footer Ad -->
    ${this.renderAd('footer_ad')}

    ${this.renderFooter('../../../../')}

    <!-- Quick Search Modal -->
    <div class="quick-search-modal" id="searchModal">
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3><i class="bi bi-search"></i> Quick Search ${depot.name} Depot</h3>
                <button class="close-search">&times;</button>
            </div>
            <div class="search-modal-body">
                <input type="text" class="global-search-input" placeholder="Type to search bus stops in ${depot.name}...">
                <div class="search-results" id="searchResults"></div>
            </div>
        </div>
    </div>

    <!-- Inline JavaScript -->
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;
    }

    getRelatedDepots(depotId) {
        const relatedDepotIds = this.relatedDepotsData[depotId] || [];
        const relatedDepots = [];

        relatedDepotIds.forEach(relatedDepotId => {
            const relatedDepot = this.data.depots[relatedDepotId];
            if (relatedDepot) {
                relatedDepots.push(relatedDepot);
            }
        });

        return relatedDepots;
    }

    getRelatedDepotsInTehsil(depotId, tehsilId) {
        // Get other depots in the same tehsil (excluding the current depot)
        return Object.values(this.data.depots).filter(d =>
            d.tehsil_id === tehsilId && d.id !== depotId
        ).slice(0, 4); // Limit to 4 depots
    }

    renderRelatedDepotCard(relatedDepot, divisionId, districtId, tehsilId) {
        if (!relatedDepot) return '';

        const relatedTehsil = this.data.tehsils[relatedDepot.tehsil_id];
        const relatedDistrict = relatedTehsil ? this.data.districts[relatedTehsil.district_id] : null;
        const relatedDivision = relatedDistrict ? this.data.divisions[relatedDistrict.division_id] : null;

        if (!relatedTehsil || !relatedDistrict || !relatedDivision) return '';

        // Calculate stats for the related depot
        let busStopCount = 0;
        let busCount = 0;
        if (relatedDepot.villages) {
            Object.values(relatedDepot.villages).forEach(busStopList => {
                busStopCount += busStopList.length;
                busStopList.forEach(busStop => {
                    busCount += busStop.schedule ? busStop.schedule.length : 0;
                });
            });
        }

        // Build the correct path
        const path = `${relatedDivision.id}/${relatedDistrict.id}/${relatedTehsil.id}/${relatedDepot.id}/index.html`;

        return `<a href="${path}" class="related-depot-card">
            <h3>${relatedDepot.name}</h3>
            <p>${busStopCount} bus stops • ${busCount} bus schedules</p>
            <p class="related-depot-location">${relatedTehsil.name}, ${relatedDistrict.name}</p>
            <span class="related-depot-link">
                <i class="bi bi-arrow-right"></i> View Schedule
            </span>
        </a>`;
    }

    renderDivisionTab() {
        const divisions = Object.values(this.data.divisions).sort((a, b) => {
            if (a.alphabet && b.alphabet) {
                return a.alphabet.localeCompare(b.alphabet);
            }
            return a.name.localeCompare(b.name);
        });

        if (divisions.length === 0) {
            return '<div class="empty-state"><i class="bi bi-buildings"></i><h3>No divisions available</h3><p>Add division data in data/divisions/</p></div>';
        }

        return divisions.map(division => {
            const districtCount = this.getDistrictsForDivision(division.id).length;
            const depotCount = this.getDepotCountForDivision(division.id);

            return `<a href="${division.id}/index.html" class="rectangular-card" data-alphabet="${division.alphabet || division.name.charAt(0).toUpperCase()}">
                <h3>${division.name}</h3>
                <div class="stats">
                    <span class="stat"><i class="bi bi-map"></i> ${districtCount} districts</span>
                    <span class="stat"><i class="bi bi-bus-front"></i> ${depotCount} depots</span>
                </div>
            </a>`;
        }).join('');
    }

    renderDistrictTab() {
        const districts = Object.values(this.data.districts).sort((a, b) => {
            if (a.alphabet && b.alphabet) {
                return a.alphabet.localeCompare(b.alphabet);
            }
            return a.name.localeCompare(b.name);
        });

        if (districts.length === 0) {
            return '<div class="empty-state"><i class="bi bi-map"></i><h3>No districts available</h3><p>Add district data in data/districts/</p></div>';
        }

        return districts.map(district => {
            const division = this.data.divisions[district.division_id];
            const tehsilCount = this.getTehsilsForDistrict(district.id).length;
            const depotCount = this.getDepotCountForDistrict(district.id);

            return `<a href="${division ? division.id + '/' : ''}${district.id}/index.html" class="rectangular-card" data-alphabet="${district.alphabet || district.name.charAt(0).toUpperCase()}">
                <h3>${district.name}</h3>
                <div class="card-meta">${division ? division.name : ''}</div>
                <div class="stats">
                    <span class="stat"><i class="bi bi-building"></i> ${tehsilCount} tehsils</span>
                    <span class="stat"><i class="bi bi-bus-front"></i> ${depotCount} depots</span>
                </div>
            </a>`;
        }).join('');
    }

    renderTehsilTab() {
        const tehsils = Object.values(this.data.tehsils).sort((a, b) => {
            if (a.alphabet && b.alphabet) {
                return a.alphabet.localeCompare(b.alphabet);
            }
            return a.name.localeCompare(b.name);
        });

        if (tehsils.length === 0) {
            return '<div class="empty-state"><i class="bi bi-building"></i><h3>No tehsils available</h3><p>Add tehsil data in data/tehsils/</p></div>';
        }

        return tehsils.map(tehsil => {
            const district = this.data.districts[tehsil.district_id];
            const division = district ? this.data.divisions[district.division_id] : null;
            const depotCount = this.getDepotsForTehsil(tehsil.id).length;

            return `<a href="${division ? division.id + '/' : ''}${district ? district.id + '/' : ''}${tehsil.id}/index.html" class="rectangular-card" data-alphabet="${tehsil.alphabet || tehsil.name.charAt(0).toUpperCase()}">
                <h3>${tehsil.name}</h3>
                <div class="card-meta">${district ? district.name : ''}</div>
                <div class="stats">
                    <span class="stat"><i class="bi bi-bus-front"></i> ${depotCount} depots</span>
                </div>
            </a>`;
        }).join('');
    }

    renderDepotTab() {
        const depots = Object.values(this.data.depots).sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        if (depots.length === 0) {
            return '<div class="empty-state"><i class="bi bi-bus-front"></i><h3>No depots available</h3><p>Add depot data in data/depots/</p></div>';
        }

        return depots.map(depot => {
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;

            // Calculate total bus stops and buses
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

            return `<a href="${division ? division.id + '/' : ''}${district ? district.id + '/' : ''}${tehsil ? tehsil.id + '/' : ''}${depot.id}/index.html" class="rectangular-card" data-alphabet="${depot.name.charAt(0).toUpperCase()}">
                <h3>${depot.name}</h3>
                <div class="card-meta">${tehsil ? tehsil.name : ''}</div>
                <div class="stats">
                    <span class="stat"><i class="bi bi-signpost"></i> ${busStopCount} bus stops</span>
                    <span class="stat"><i class="bi bi-bus-front"></i> ${busCount} schedules</span>
                </div>
            </a>`;
        }).join('');
    }

    renderAlphabetForType(type) {
        const items = Object.values(this.data[type]);
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const itemLetters = new Set();
        items.forEach(item => {
            const letter = item.alphabet || item.name.charAt(0).toUpperCase();
            itemLetters.add(letter);
        });

        return `${alphabet.map(letter => {
            const hasItem = itemLetters.has(letter);
            return `<button class="alphabet-mini-btn ${hasItem ? '' : 'disabled'}" data-letter="${letter}">${letter}</button>`;
        }).join('')}`;
    }

    renderDistrictCards(districts, divisionId) {
        const sortedDistricts = districts.sort((a, b) => {
            if (a.alphabet && b.alphabet) {
                return a.alphabet.localeCompare(b.alphabet);
            }
            return a.name.localeCompare(b.name);
        });

        if (sortedDistricts.length === 0) {
            return '<div class="empty-state"><i class="bi bi-map"></i><h3>No districts available</h3><p>Add district data for this division</p></div>';
        }

        return sortedDistricts.map(district => {
            const tehsils = this.getTehsilsForDistrict(district.id);
            const depotCount = this.getDepotCountForDistrict(district.id);

            return `<a href="${district.id}/index.html" class="rectangular-card" data-alphabet="${district.alphabet || district.name.charAt(0).toUpperCase()}">
                <h3>${district.name}</h3>
                <div class="stats">
                    <span class="stat"><i class="bi bi-building"></i> ${tehsils.length} tehsils</span>
                    <span class="stat"><i class="bi bi-bus-front"></i> ${depotCount} depots</span>
                </div>
            </a>`;
        }).join('');
    }

    renderTehsilCards(tehsils, divisionId, districtId) {
        const sortedTehsils = tehsils.sort((a, b) => {
            if (a.alphabet && b.alphabet) {
                return a.alphabet.localeCompare(b.alphabet);
            }
            return a.name.localeCompare(b.name);
        });

        if (sortedTehsils.length === 0) {
            return '<div class="empty-state"><i class="bi bi-building"></i><h3>No tehsils available</h3><p>Add tehsil data for this district</p></div>';
        }

        return sortedTehsils.map(tehsil => {
            const depots = this.getDepotsForTehsil(tehsil.id);

            return `<a href="${tehsil.id}/index.html" class="rectangular-card" data-alphabet="${tehsil.alphabet || tehsil.name.charAt(0).toUpperCase()}">
                <h3>${tehsil.name}</h3>
                <div class="stats">
                    <span class="stat"><i class="bi bi-bus-front"></i> ${depots.length} depots</span>
                </div>
            </a>`;
        }).join('');
    }

    renderDepotCards(depots, divisionId, districtId, tehsilId) {
        const sortedDepots = depots.sort((a, b) => a.name.localeCompare(b.name));

        if (sortedDepots.length === 0) {
            return '<div class="empty-state"><i class="bi bi-bus-front"></i><h3>No depots available</h3><p>Add depot data for this tehsil</p></div>';
        }

        return sortedDepots.map(depot => {
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

            return `<a href="${depot.id}/index.html" class="rectangular-card" data-alphabet="${depot.name.charAt(0).toUpperCase()}">
                <h3>${depot.name}</h3>
                <div class="stats">
                    <span class="stat"><i class="bi bi-bus-front"></i> ${busCount} schedules</span>
                    <span class="stat"><i class="bi bi-signpost"></i> ${busStopCount} bus stops</span>
                </div>
            </a>`;
        }).join('');
    }

    renderBusStopSections(villages, letters) {
        if (letters.length === 0) {
            return '<div class="empty-state"><i class="bi bi-signpost"></i><h3>No bus stop schedules available</h3><p>Add bus stop data to this depot</p></div>';
        }

        return letters.map(letter => {
            const busStopList = villages[letter] || [];

            return busStopList.map(busStop => {
                const schedule = busStop.schedule || [];
                const busStopId = `busstop-${letter}-${busStop.name.toLowerCase().replace(/\s+/g, '-')}`;

                return `<div class="bus-stop-section" id="${busStopId}" data-letter="${letter.toLowerCase()}" data-busstop="${busStop.name.toLowerCase()}">
                    <div class="bus-stop-header">
                        <h3 class="bus-stop-name">${busStop.name}</h3>
                        <span class="bus-count">${busStop.bus_count || schedule.length} buses</span>
                    </div>
                    <div class="schedule-grid">
                        ${this.renderTimeBubbles(schedule)}
                    </div>
                </div>`;
            }).join('');
        }).join('');
    }

    renderTimeBubbles(schedule) {
        if (schedule.length === 0) {
            return '<div class="time-bubble" style="grid-column: 1/-1; background: #F8FAFC; color: #64748B; border: 2px dashed #CBD5E1;">No schedule</div>';
        }

        // Group schedule by time of day
        const morning = schedule.filter(time => {
            const [hours] = time.split(':').map(Number);
            return hours >= 5 && hours < 12;
        });
        const afternoon = schedule.filter(time => {
            const [hours] = time.split(':').map(Number);
            return hours >= 12 && hours < 17;
        });
        const evening = schedule.filter(time => {
            const [hours] = time.split(':').map(Number);
            return hours >= 17 && hours < 22;
        });
        const night = schedule.filter(time => {
            const [hours] = time.split(':').map(Number);
            return hours >= 22 || hours < 5;
        });

        const sortTimes = (times) => times.sort((a, b) => {
            const [ha, ma] = a.split(':').map(Number);
            const [hb, mb] = b.split(':').map(Number);
            return (ha * 60 + ma) - (hb * 60 + mb);
        });

        const allTimes = [
            ...sortTimes(morning),
            ...sortTimes(afternoon),
            ...sortTimes(evening),
            ...sortTimes(night)
        ];

        return allTimes.map(time => {
            const [hours, minutes] = time.split(':').map(Number);
            let timeCategory = 'morning';

            if (hours >= 5 && hours < 12) timeCategory = 'morning';
            else if (hours >= 12 && hours < 17) timeCategory = 'afternoon';
            else if (hours >= 17 && hours < 22) timeCategory = 'evening';
            else timeCategory = 'night';

            // Convert to 12-hour format
            const hour12 = hours % 12 || 12;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;

            return `<div class="time-bubble ${timeCategory}" data-time="${time}" title="${displayTime}">
                ${displayTime}
            </div>`;
        }).join('');
    }

    renderAlphabetButtons() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        return `${alphabet.map(letter => {
            return `<button class="alphabet-btn" data-letter="${letter}">${letter}</button>`;
        }).join('')}`;
    }

    renderDistrictAlphabet(districts) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const districtLetters = new Set();
        districts.forEach(d => {
            const letter = d.alphabet || d.name.charAt(0).toUpperCase();
            districtLetters.add(letter);
        });

        return `${alphabet.map(letter => {
            const hasDistrict = districtLetters.has(letter);
            return `<button class="alphabet-mini-btn ${hasDistrict ? '' : 'disabled'}" data-letter="${letter}">${letter}</button>`;
        }).join('')}`;
    }

    renderTehsilAlphabet(tehsils) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const tehsilLetters = new Set();
        tehsils.forEach(t => {
            const letter = t.alphabet || t.name.charAt(0).toUpperCase();
            tehsilLetters.add(letter);
        });

        return `${alphabet.map(letter => {
            const hasTehsil = tehsilLetters.has(letter);
            return `<button class="alphabet-mini-btn ${hasTehsil ? '' : 'disabled'}" data-letter="${letter}">${letter}</button>`;
        }).join('')}`;
    }

    renderDepotAlphabet(depots) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const depotLetters = new Set(depots.map(d => d.name.charAt(0).toUpperCase()));

        return `${alphabet.map(letter => {
            const hasDepot = depotLetters.has(letter);
            return `<button class="alphabet-mini-btn ${hasDepot ? '' : 'disabled'}" data-letter="${letter}">${letter}</button>`;
        }).join('')}`;
    }

    renderBusStopAlphabetButtons(busStopLetters) {
        const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const busStopLettersUpper = busStopLetters.map(letter => letter.toUpperCase());

        return `${allLetters.map(letter => {
            const hasBusStop = busStopLettersUpper.includes(letter);
            const actualLetter = hasBusStop ? busStopLetters[busStopLettersUpper.indexOf(letter)] : letter.toLowerCase();
            return `<button class="floating-letter-btn ${hasBusStop ? '' : 'disabled'}" data-letter="${actualLetter}">${letter}</button>`;
        }).join('')}`;
    }

    renderAd(adType) {
        if (!this.config.ads || !this.config.ads[adType] || !this.config.ads[adType].enabled) {
            return '';
        }

        const ad = this.config.ads[adType];
        const isMobile = adType !== 'footer_ad';

        let adCode = '';
        if (isMobile && ad.mobile_code && ad.desktop_code) {
            adCode = `
                <div class="ad-mobile">${ad.mobile_code}</div>
                <div class="ad-desktop">${ad.desktop_code}</div>
            `;
        } else if (ad.code) {
            adCode = ad.code;
        } else if (ad.mobile_code) {
            adCode = ad.mobile_code;
        } else {
            adCode = `<div class="ad-placeholder">
                <span>${ad.label || 'Advertisement'}</span>
                <p>${ad.name || 'Ad Space'}</p>
            </div>`;
        }

        return `<div class="ad-container ${adType}">
            <div class="ad-content">
                ${adCode}
            </div>
        </div>`;
    }

    renderSEOContent(seoContent) {
        if (!seoContent) return '';

        return `<div class="seo-content">
            ${seoContent.title ? `<h2>${seoContent.title}</h2>` : ''}
            ${seoContent.content || ''}

            ${seoContent.faqs && seoContent.faqs.length > 0 ? `
                <h3>Frequently Asked Questions</h3>
                ${seoContent.faqs.map(faq => `
                    <div class="faq-item">
                        <div class="faq-question">${faq.question}</div>
                        <div class="faq-answer">${faq.answer}</div>
                    </div>
                `).join('')}
            ` : ''}
        </div>`;
    }

    renderFooter(prefix = '') {
        return `<footer class="site-footer">
            <div class="container">
                <div class="footer-content">
                    <!-- Quick Links -->
                    <div class="footer-section">
                        <h3>Quick Links</h3>
                        <div class="footer-links">
                            <a href="${prefix}index.html">Home</a>
                            <a href="${prefix}about.html">About Us</a>
                            <a href="${prefix}contact.html">Contact</a>
                            <a href="${prefix}blogs/index.html">Blogs & Updates</a>
                            <a href="${prefix}terms.html">Terms of Service</a>
                            <a href="${prefix}privacy.html">Privacy Policy</a>
                            <a href="${prefix}disclaimer.html">Disclaimer</a>
                        </div>
                    </div>

                    <!-- MSRTC Info -->
                    <div class="footer-section">
                        <h3>MSRTC Information</h3>
                        <div class="footer-links">
                            <a href="https://msrtc.maharashtra.gov.in" target="_blank" rel="noopener">Official MSRTC Website</a>
                            <a href="https://msrtc.maharashtra.gov.in/booking/ticket_booking.html" target="_blank" rel="noopener">Online Ticket Booking</a>
                            <a href="https://msrtc.maharashtra.gov.in/contact_us.html" target="_blank" rel="noopener">Contact MSRTC</a>
                            <a href="https://msrtc.maharashtra.gov.in/complaints.html" target="_blank" rel="noopener">Lodge Complaint</a>
                        </div>
                    </div>

                    <!-- Copyright -->
                    <div class="copyright">
                        © ${new Date().getFullYear()} ${this.config.site_name}. All rights reserved.<br>
                        This is an unofficial timetable portal. For official schedules, please visit <a href="https://msrtc.maharashtra.gov.in" target="_blank" rel="noopener">msrtc.maharashtra.gov.in</a>
                    </div>
                </div>
            </div>
        </footer>`;
    }

    generateSearchIndex() {
        console.log('🔍 Generating search index...');

        const searchData = {
            depots: [],
            divisions: [],
            districts: [],
            tehsils: []
        };

        // Collect division data
        Object.values(this.data.divisions).forEach(division => {
            const districtCount = this.getDistrictsForDivision(division.id).length;
            const depotCount = this.getDepotCountForDivision(division.id);

            searchData.divisions.push({
                id: division.id,
                name: division.name,
                type: 'Division',
                path: `${division.id}/index.html`,
                districts: districtCount,
                depots: depotCount,
                alphabet: division.alphabet || division.name.charAt(0).toUpperCase()
            });
        });

        // Collect district data
        Object.values(this.data.districts).forEach(district => {
            const division = this.data.divisions[district.division_id];
            const tehsilCount = this.getTehsilsForDistrict(district.id).length;
            const depotCount = this.getDepotCountForDistrict(district.id);

            if (division) {
                searchData.districts.push({
                    id: district.id,
                    name: district.name,
                    type: 'District',
                    path: `${division.id}/${district.id}/index.html`,
                    division: division.name,
                    tehsils: tehsilCount,
                    depots: depotCount,
                    alphabet: district.alphabet || district.name.charAt(0).toUpperCase()
                });
            }
        });

        // Collect tehsil data
        Object.values(this.data.tehsils).forEach(tehsil => {
            const district = this.data.districts[tehsil.district_id];
            const division = district ? this.data.divisions[district.division_id] : null;
            const depotCount = this.getDepotsForTehsil(tehsil.id).length;

            if (division && district) {
                searchData.tehsils.push({
                    id: tehsil.id,
                    name: tehsil.name,
                    type: 'Tehsil',
                    path: `${division.id}/${district.id}/${tehsil.id}/index.html`,
                    division: division.name,
                    district: district.name,
                    depots: depotCount,
                    alphabet: tehsil.alphabet || tehsil.name.charAt(0).toUpperCase()
                });
            }
        });

        // Collect depot data
        Object.values(this.data.depots).forEach(depot => {
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;

            if (division && district && tehsil) {
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

                searchData.depots.push({
                    id: depot.id,
                    name: depot.name,
                    type: 'Depot',
                    path: `${division.id}/${district.id}/${tehsil.id}/${depot.id}/index.html`,
                    division: division.name,
                    district: district.name,
                    tehsil: tehsil.name,
                    busStops: busStopCount,
                    buses: busCount,
                    alphabet: depot.name.charAt(0).toUpperCase()
                });
            }
        });

        // Write search index to file
        const searchIndexPath = path.join(this.publicDir, 'search-index.js');
        const jsContent = `// Auto-generated search index
window.searchIndex = ${JSON.stringify(searchData, null, 2)};`;

        fs.writeFileSync(searchIndexPath, jsContent, 'utf8');
        console.log('   ✓ Search index generated');
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

        // Theme colors for digital watch
        const watchBg = '#0a0e17';
        const watchNumbers = '#ffffff';
        const watchGlow = '#4ecdc4';
        const watchBorder = '#1e293b';

        return `/* ==========================================================================
       MSRTC BUS TIMETABLE - INLINE STYLES
       ========================================================================== */

    /* Reset & Base */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    html {
        font-size: 14px;
        scroll-behavior: smooth;
    }

    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 300;
        background: linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%);
        color: ${textPrimary};
        line-height: 1.5;
        min-height: 100vh;
        -webkit-tap-highlight-color: transparent;
        padding-bottom: 60px;
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        color: ${textSecondary};
        margin-bottom: 0.75rem;
    }

    h1 {
        font-size: 1.6rem;
        font-weight: 700;
        line-height: 1.2;
    }

    h2 {
        font-size: 1.4rem;
    }

    h3 {
        font-size: 1.2rem;
    }

    p {
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    a {
        color: ${primary};
        text-decoration: none;
        transition: color 0.2s;
    }

    a:hover {
        color: ${secondary};
    }

    /* Layout */
    .container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
    }

    .text-center {
        text-align: center;
    }

    .mt-3 { margin-top: 1rem; }
    .mt-4 { margin-top: 1.5rem; }

    /* Header */
    .site-header {
        background: white;
        box-shadow: 0 2px 10px rgba(73, 61, 213, 0.08);
        position: sticky;
        top: 0;
        z-index: 200;
        padding: 0.4rem 0;
        border-bottom: 2px solid ${primary} !important;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.2rem 0;
    }

    .logo {
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        font-size: 1.2rem;
        color: ${textSecondary} !important;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        text-decoration: none;
    }

    .logo i {
        color: ${primary} !important;
        font-size: 1.3rem;
    }

    /* Digital Clock - THEME COLORS */
    .time-display.digital-clock {
        font-family: 'Orbitron', monospace;
        font-weight: 600;
        font-size: 1.1rem;
        background: linear-gradient(145deg, ${watchBg} 0%, #1a1f2e 100%);
        color: ${watchNumbers} !important;
        padding: 0.4rem 0.8rem;
        border-radius: 10px;
        min-width: 120px;
        text-align: center;
        border: 2px solid ${watchBorder} !important;
        text-shadow: 0 0 5px ${watchGlow}, 0 0 10px rgba(78, 205, 196, 0.5);
        letter-spacing: 1px;
        box-shadow:
            inset 0 1px 3px rgba(0, 0, 0, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(78, 205, 196, 0.1);
        position: relative;
        overflow: hidden;
    }

    .time-display.digital-clock::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg,
            rgba(78, 205, 196, 0.1) 0%,
            rgba(78, 205, 196, 0.05) 50%,
            rgba(78, 205, 196, 0) 100%);
        z-index: 1;
        pointer-events: none;
    }

    .digital-hours,
    .digital-minutes,
    .digital-seconds {
        color: ${watchNumbers} !important;
        font-weight: 800;
        position: relative;
        z-index: 2;
        text-shadow:
            0 0 5px ${watchGlow},
            0 0 8px rgba(78, 205, 196, 0.7),
            0 0 12px rgba(78, 205, 196, 0.3);
    }

    .digital-ampm {
        font-size: 0.85rem;
        color: ${watchNumbers} !important;
        margin-left: 0.2rem;
        font-weight: 700;
        position: relative;
        z-index: 2;
        text-shadow:
            0 0 3px ${watchGlow},
            0 0 5px rgba(78, 205, 196, 0.5);
    }

    /* Quick Jump Navigation - FIXED PADDING & NO SCROLL */
    .quick-jump-nav {
        position: sticky;
        top: 48px;
        z-index: 190;
        background: white;
        border-bottom: 2px solid ${borderLight};
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        padding: 0.3rem 0;
        overflow: hidden;
    }

    .quick-jump-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0;
        width: 100%;
        overflow-x: hidden;
        -webkit-overflow-scrolling: auto;
        flex-wrap: nowrap;
    }

    /* Remove scrollbar completely */
    .quick-jump-content::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
        background: transparent;
    }

    .quick-jump-content {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    /* Quick Jump Buttons - COMPACT DESIGN */
    .quick-jump-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.1rem;
        padding: 0.35rem 0.5rem;
        background: white;
        border: 1px solid ${borderLight};
        border-radius: 6px;
        color: ${textPrimary};
        font-size: 0.7rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        min-width: 60px;
        max-width: 70px;
        text-decoration: none;
        flex-shrink: 0;
        border: none;
        font-family: inherit;
        flex: 1;
        height: 55px;
    }

    .quick-jump-btn i {
        font-size: 0.9rem;
        color: ${primary};
    }

    .quick-jump-btn:hover {
        background: ${bgEnd};
        border-color: ${borderDark};
        transform: translateY(-2px);
    }

    .quick-jump-btn.active {
        background: ${primary};
        color: white;
        border-color: ${primary};
    }

    .quick-jump-btn.active i {
        color: white;
    }

    /* Search button specific styling to prevent overflow */
    .quick-jump-btn.search-trigger {
        min-width: 65px;
        max-width: 75px;
    }

    /* Navigation Buttons Container - TWO BUTTONS SIDE BY SIDE */
    .navigation-buttons {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }

    /* Back Buttons - SAME STYLE FOR ALL */
    .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.8rem 1.2rem;
        background: white;
        border: 2px solid ${borderLight};
        border-radius: 8px;
        color: ${textPrimary};
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.9rem;
        text-decoration: none;
        flex-shrink: 0;
        border: 2px solid ${borderLight} !important;
    }

    .back-btn:hover {
        background: ${bgEnd};
        color: ${primary};
        border-color: ${borderDark} !important;
        transform: translateX(-3px);
    }

    .back-btn i {
        font-size: 1rem;
        transition: transform 0.3s;
    }

    .back-btn:hover i {
        transform: translateX(-2px);
    }

    /* Depot About Section */
    .depot-about-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        border: 2px solid ${borderLight};
        margin-top: 2rem;
    }

    .depot-about-section h2 {
        color: ${textSecondary};
        margin-bottom: 1rem;
        position: relative;
        padding-bottom: 0.5rem;
    }

    .depot-about-section h2::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, ${primary}, ${borderDark});
        border-radius: 3px;
    }

    .about-content {
        color: #4B5563;
        font-size: 0.95rem;
        line-height: 1.7;
    }

    .about-content p {
        margin-bottom: 1rem;
    }

    /* FAQ Section */
    .faq-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        border: 2px solid ${borderLight};
        margin-top: 2rem;
    }

    .faq-section h2 {
        color: ${textSecondary};
        margin-bottom: 1rem;
        position: relative;
        padding-bottom: 0.5rem;
    }

    .faq-section h2::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, ${primary}, ${borderDark});
        border-radius: 3px;
    }

    .faq-container {
        margin-top: 1rem;
    }

    .faq-item {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #F8FAFC;
        border-radius: 8px;
        border: 1px solid ${borderLight};
    }

    .faq-question {
        color: ${textSecondary};
        font-weight: 600;
        margin-bottom: 0.8rem;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .faq-question i {
        color: ${primary};
    }

    .faq-answer {
        color: #4B5563;
        font-size: 0.95rem;
        line-height: 1.6;
        padding-left: 1.8rem;
    }

    /* FAQ FIX: Ensure question marks don't show as bullets */
    .faq-question span::before {
        content: none !important;
    }

    .faq-question span {
        display: inline-block;
        margin-left: 0 !important;
        padding-left: 0 !important;
    }

    /* Related Links Section */
    .related-links-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        border: 2px solid ${borderLight};
        margin-top: 2rem;
    }

    .related-links-section h2 {
        color: ${textSecondary};
        margin-bottom: 1rem;
        position: relative;
        padding-bottom: 0.5rem;
    }

    .related-links-section h2::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, ${primary}, ${borderDark});
        border-radius: 3px;
    }

    .related-links-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .related-depot-card {
        background: white;
        border: 2px solid ${borderLight};
        border-radius: 10px;
        padding: 1.2rem;
        text-decoration: none;
        transition: all 0.3s;
        display: block;
    }

    .related-depot-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 12px rgba(73, 61, 213, 0.15);
        border-color: ${primary};
    }

    .related-depot-card h3 {
        color: ${textSecondary};
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
    }

    .related-depot-card p {
        color: ${textPrimary};
        font-size: 0.9rem;
        opacity: 0.8;
        margin-bottom: 0.5rem;
    }

    .related-depot-location {
        color: ${textPrimary};
        font-size: 0.85rem;
        opacity: 0.7;
        margin-bottom: 0.8rem !important;
    }

    .related-depot-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: ${primary};
        font-weight: 600;
        font-size: 0.9rem;
    }

    .related-depot-link i {
        transition: transform 0.3s;
    }

    .related-depot-card:hover .related-depot-link i {
        transform: translateX(3px);
    }

    /* Advertising */
    .ad-container {
        margin: 1.5rem 0;
        text-align: center;
    }

    .ad-content {
        background: white;
        border: 2px solid ${borderLight} !important;
        border-radius: 8px;
        padding: 1rem;
        min-height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .ad-desktop {
        display: none;
    }

    .ad-mobile {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        width: 100%;
    }

    .ad-placeholder {
        color: ${textPrimary};
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .ad-placeholder span {
        font-size: 0.8rem;
        color: #64748B;
    }

    .ad-btn {
        background: ${primary};
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.3s;
    }

    .ad-btn:hover {
        background: ${secondary};
    }

    /* Tab Navigation */
    .tabs-container {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid ${borderLight} !important;
        margin: 1.5rem 0;
    }

    .tabs-header {
        display: flex;
        background: ${bgEnd};
        border-bottom: 2px solid ${borderLight} !important;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .tabs-header::-webkit-scrollbar {
        height: 4px;
    }

    .tabs-header::-webkit-scrollbar-track {
        background: ${borderLight};
        border-radius: 2px;
    }

    .tabs-header::-webkit-scrollbar-thumb {
        background: ${primary};
        border-radius: 2px;
    }

    .tab-btn {
        flex: 1;
        min-width: 100px;
        padding: 0.7rem 0.3rem;
        background: none;
        border: none;
        border-right: 1px solid ${borderLight} !important;
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        color: ${textPrimary};
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        transition: all 0.3s;
        position: relative;
    }

    .tab-btn:last-child {
        border-right: none !important;
    }

    .tab-btn:hover {
        background: rgba(73, 61, 213, 0.05);
    }

    .tab-btn.active {
        background: ${primary};
        color: white;
    }

    .tab-count {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.1rem 0.4rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .tab-btn.active .tab-count {
        background: rgba(255, 255, 255, 0.3);
    }

    .tab-content {
        display: none;
        padding: 1.2rem;
    }

    .tab-content.active {
        display: block;
    }

    /* RECTANGULAR CARDS */
    .division-grid, .district-grid, .tehsil-grid, .depot-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 0.8rem;
        margin: 1rem 0;
    }

    .rectangular-card {
        background: white;
        border: 2px solid ${borderLight} !important;
        border-radius: 10px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        display: block;
        cursor: pointer;
        text-decoration: none;
        position: relative;
        overflow: hidden;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
    }

    .rectangular-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(73, 61, 213, 0.1);
        border-color: ${primary} !important;
        background: ${bgStart};
    }

    .rectangular-card h3 {
        color: ${textSecondary} !important;
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .card-meta {
        color: ${textPrimary};
        font-size: 0.8rem;
        margin-bottom: 0.5rem;
        opacity: 0.8;
    }

    .rectangular-card .stats {
        display: flex;
        gap: 0.8rem;
        margin-top: 0.5rem;
        flex-wrap: wrap;
    }

    .rectangular-card .stat {
        background: ${bgEnd};
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        color: ${textSecondary} !important;
        font-size: 0.75rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        border: 1px solid ${borderLight} !important;
    }

    .rectangular-card .stat i {
        color: ${primary} !important;
        font-size: 0.8rem;
    }

    /* Alphabet Quick Access */
    .alphabet-quick-access {
        background: white;
        border: 2px solid ${borderLight};
        border-radius: 10px;
        padding: 1rem;
        margin: 1.5rem 0;
    }

    .alphabet-quick-access h3 {
        margin-bottom: 0.8rem;
        font-size: 1rem;
        color: ${textSecondary};
    }

    .alphabet-mini-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
        gap: 0.5rem;
    }

    .alphabet-mini-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid ${borderLight};
        background: white;
        color: ${textSecondary};
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.9rem;
        padding: 0;
        touch-action: manipulation;
    }

    .alphabet-mini-btn:hover {
        background: ${bgEnd};
        border-color: ${borderDark};
        transform: translateY(-1px);
    }

    .alphabet-mini-btn.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: #F8FAFC;
    }

    .alphabet-mini-btn.disabled:hover {
        transform: none;
        background: #F8FAFC;
        border-color: ${borderLight};
    }

    /* Floating Bus Stop Letters */
    .floating-bus-stop-letters {
        position: sticky;
        top: 100px;
        z-index: 180;
        background: white;
        border: 2px solid ${primary};
        border-radius: 10px;
        padding: 1rem;
        margin: 1.5rem 0;
        box-shadow: 0 4px 12px rgba(73, 61, 213, 0.1);
    }

    .floating-letters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
    }

    .floating-letters-header h3 {
        margin: 0;
        font-size: 1rem;
        color: ${textSecondary};
    }

    .bus-stop-count {
        background: ${primary};
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .floating-letters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 0.4rem;
    }

    .floating-letter-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid ${borderLight};
        background: white;
        color: ${textSecondary};
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.9rem;
        padding: 0;
        touch-action: manipulation;
    }

    .floating-letter-btn:hover {
        background: ${bgEnd};
        border-color: ${borderDark};
        transform: translateY(-1px);
    }

    .floating-letter-btn.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: #F8FAFC;
    }

    .floating-letter-btn.disabled:hover {
        transform: none;
        background: #F8FAFC;
        border-color: ${borderLight};
    }

    /* Quick Search Modal */
    .quick-search-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1001;
        align-items: center;
        justify-content: center;
    }

    .search-modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }

    .search-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: ${primary};
        color: white;
    }

    .search-modal-header h3 {
        margin: 0;
        color: white;
    }

    .close-search {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
        touch-action: manipulation;
    }

    .search-modal-body {
        padding: 1.5rem;
    }

    .global-search-input {
        width: 100%;
        padding: 1rem;
        border: 2px solid ${borderLight};
        border-radius: 8px;
        font-size: 1rem;
        margin-bottom: 1rem;
    }

    .global-search-input:focus {
        outline: none;
        border-color: ${primary};
    }

    .search-results {
        max-height: 300px;
        overflow-y: auto;
    }

    .search-result-item {
        padding: 0.8rem;
        border-bottom: 1px solid ${borderLight};
        cursor: pointer;
        transition: background 0.3s;
    }

    .search-result-item:hover {
        background: ${bgEnd};
    }

    .search-result-item h4 {
        margin: 0 0 0.3rem 0;
        color: ${textSecondary};
        font-size: 1rem;
    }

    .search-result-item p {
        margin: 0;
        color: ${textPrimary};
        font-size: 0.85rem;
        opacity: 0.8;
    }

    /* Alphabet Quick View - FIXED FOR 100% ZOOM */
    .alphabet-quick-view {
        display: none;
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: white;
        border-top: 3px solid ${primary};
        border-radius: 12px 12px 0 0;
        z-index: 1002;
        max-height: 70vh;
        overflow: hidden;
        touch-action: manipulation;
    }

    .alphabet-view-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: ${primary};
        color: white;
        touch-action: manipulation;
    }

    .alphabet-view-header h4 {
        margin: 0;
        color: white;
    }

    .close-alphabet {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
        touch-action: manipulation;
        z-index: 1003;
        position: relative;
    }

    .alphabet-view-grid {
        padding: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
        gap: 0.8rem;
        max-height: 50vh;
        overflow-y: auto;
        touch-action: manipulation;
    }

    .alphabet-btn {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${borderLight};
        background: white;
        color: ${textSecondary};
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 1.1rem;
        padding: 0;
        touch-action: manipulation;
    }

    .alphabet-btn:hover {
        background: ${bgEnd};
        border-color: ${borderDark};
        transform: translateY(-2px);
    }

    .alphabet-btn.active {
        background: ${primary};
        color: white;
        border-color: ${primary};
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(73, 61, 213, 0.2);
    }

    /* Depot Header */
    .depot-header {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 2px solid ${borderLight};
        text-align: center;
    }

    .depot-info {
        display: flex;
        justify-content: center;
        gap: 1.2rem;
        margin-top: 1rem;
        flex-wrap: wrap;
    }

    .info-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: ${textSecondary};
        font-size: 0.85rem;
        background: #F8FAFC;
        padding: 0.4rem 1rem;
        border-radius: 8px;
        border: 1px solid ${borderLight};
    }

    .info-item i {
        color: ${primary};
        font-size: 0.9rem;
    }

    /* Search Box */
    .search-container {
        margin: 1.5rem 0;
    }

    .search-box {
        width: 100%;
        padding: 0.8rem 1.2rem;
        border: 2px solid ${borderLight};
        border-radius: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        background: white;
        transition: all 0.3s;
    }

    .search-box:focus {
        outline: none;
        border-color: ${primary};
        box-shadow: 0 0 0 3px rgba(73, 61, 213, 0.1);
    }

    /* Time Filters */
    .time-filters {
        display: flex;
        gap: 0.5rem;
        margin: 1.5rem 0;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        -webkit-overflow-scrolling: touch;
    }

    .time-filters::-webkit-scrollbar {
        height: 4px;
    }

    .time-filters::-webkit-scrollbar-track {
        background: ${borderLight};
        border-radius: 2px;
    }

    .time-filters::-webkit-scrollbar-thumb {
        background: ${primary};
        border-radius: 2px;
    }

    .filter-btn {
        padding: 0.6rem 1rem;
        border: 2px solid ${borderLight};
        background: white;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        color: ${textPrimary};
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.3s;
        flex-shrink: 0;
        font-weight: 500;
    }

    .filter-btn:hover {
        border-color: ${primary};
        color: ${primary};
    }

    .filter-btn.active {
        background: ${primary};
        color: white;
        border-color: ${primary};
        font-weight: 600;
    }

    /* Bus Stop Sections */
    .bus-stop-section {
        margin-bottom: 1.5rem;
        scroll-margin-top: 130px;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid ${borderLight};
    }

    .bus-stop-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.2rem;
        background: linear-gradient(90deg, ${bgEnd} 0%, white 100%);
        border-bottom: 1px solid ${borderLight};
    }

    .bus-stop-name {
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        color: ${textSecondary};
        font-size: 1.1rem;
    }

    .bus-count {
        background: ${primary};
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        min-width: 70px;
        text-align: center;
    }

    /* Schedule Grid - ADJUSTED FOR BADGES */
    .schedule-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 0.8rem;
        padding: 1.2rem;
    }

    /* Time Bubbles - ONLY NEXT BUS SPARKLES */
    .time-bubble {
        position: relative;
        padding: 0.8rem 0.5rem;
        border-radius: 8px;
        text-align: center;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        min-height: 58px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        user-select: none;
        font-size: 0.9rem;
        border: 2px solid transparent;
        overflow: visible;
        margin: 0.1rem;
    }

    .time-bubble.morning {
        background: #FEF3C7;
        color: #92400E;
        border-color: #FBBF24;
    }

    .time-bubble.afternoon {
        background: #D1FAE5;
        color: #065F46;
        border-color: #10B981;
    }

    .time-bubble.evening {
        background: #E0E7FF;
        color: #3730A3;
        border-color: #6366F1;
    }

    .time-bubble.night {
        background: #F3E8FF;
        color: #5B21B6;
        border-color: #8B5CF6;
    }

    .time-bubble:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    /* Ensure time bubble has enough space for badge */
    .time-bubble.next-bus {
        margin-top: 5px;
        margin-right: 5px;
    }

    /* Next Bus Badge - FIXED POSITIONING */
    .next-badge {
        position: absolute;
        top: -10px;
        right: -10px;
        background: ${primary};
        color: white;
        font-size: 0.65rem;
        padding: 2px 5px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 20;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        animation: pulse 2s infinite;
        white-space: nowrap;
        min-width: 35px;
        text-align: center;
        border: 1px solid white;
    }

    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(73, 61, 213, 0.7);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 3px rgba(73, 61, 213, 0);
        }
    }

    /* Next Bus Sparkle Effect - ONLY FOR NEXT BUS */
    .next-bus-sparkle {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 8px;
        border: 2px solid transparent;
        animation: sparkle 2s infinite;
        pointer-events: none;
        opacity: 0;
    }

    @keyframes sparkle {
        0%, 100% {
            opacity: 0;
            border-color: transparent;
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
        }
        50% {
            opacity: 1;
            border-color: #FFD700;
            box-shadow: 0 0 10px 3px rgba(255, 215, 0, 0.7);
        }
    }

    .time-bubble.next-bus .next-bus-sparkle {
        opacity: 1;
    }

    /* Alphabet First Match Highlight */
    .alphabet-highlight-first {
        position: relative;
    }

    .alphabet-highlight-first::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 3px;
        background: ${primary};
        border-radius: 3px;
        animation: highlightPulse 1.5s infinite;
    }

    @keyframes highlightPulse {
        0%, 100% {
            opacity: 0.7;
            width: 20px;
        }
        50% {
            opacity: 1;
            width: 25px;
        }
    }

    /* Footer */
    .site-footer {
        background: white;
        border-top: 2px solid ${borderLight};
        padding: 2rem 0;
        margin-top: 2rem;
    }

    .footer-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }

    .footer-section h3 {
        color: ${textSecondary};
        font-size: 1.1rem;
        margin-bottom: 1rem;
    }

    .footer-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .footer-links a {
        color: ${textPrimary};
        font-size: 0.9rem;
        padding: 0.3rem 0;
        transition: all 0.3s;
        text-decoration: none;
    }

    .footer-links a:hover {
        color: ${primary};
        padding-left: 0.5rem;
    }

    .copyright {
        grid-column: 1 / -1;
        text-align: center;
        color: ${textPrimary};
        font-size: 0.85rem;
        opacity: 0.8;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid ${borderLight};
    }

    .copyright a {
        color: ${primary};
        text-decoration: underline;
    }

    /* Breadcrumb */
    .breadcrumb {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        padding: 0.6rem 1rem;
        border-bottom: 1px solid ${borderLight};
        font-size: 0.85rem;
        margin-bottom: 1rem;
    }

    .breadcrumb a {
        color: ${textSecondary};
        font-weight: 500;
        text-decoration: none;
    }

    .breadcrumb span {
        color: ${primary};
        margin: 0 0.3rem;
        font-weight: 600;
    }

    /* SEO Content Section */
    .seo-content {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-top: 2rem;
        border: 2px solid ${borderLight};
    }

    .seo-content h2 {
        color: ${textSecondary};
        margin-bottom: 1.5rem;
        font-size: 1.3rem;
        position: relative;
        padding-bottom: 0.5rem;
    }

    .seo-content h2::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, ${primary}, ${borderDark});
        border-radius: 3px;
    }

    .seo-content h3 {
        color: ${textPrimary};
        margin: 1.5rem 0 1rem;
        font-size: 1.1rem;
    }

    .seo-content p {
        color: #4B5563;
        font-size: 0.95rem;
        line-height: 1.7;
    }

    .seo-content ul, .seo-content ol {
        color: #4B5563;
        line-height: 1.7;
        padding-left: 1.5rem;
        margin: 1rem 0;
    }

    .seo-content li {
        margin-bottom: 0.5rem;
    }

    .seo-content strong {
        color: ${textSecondary};
        font-weight: 600;
    }

    .seo-content a {
        color: ${primary};
        text-decoration: underline;
        font-weight: 500;
    }

    .faq-item {
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid ${borderLight};
    }

    .faq-item:last-child {
        border-bottom: none;
    }

    .faq-question {
        color: ${textSecondary};
        font-weight: 600;
        margin-bottom: 0.8rem;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .faq-question::before {
        content: '❓';
        font-size: 0.9rem;
    }

    .faq-answer {
        color: #4B5563;
        font-size: 0.95rem;
        line-height: 1.7;
        padding-left: 1.5rem;
    }

    /* Blog Page Styles */
    .blog-page {
        max-width: 800px;
        margin: 0 auto;
    }

    .blog-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .blog-date {
        color: #94A3B8;
        font-size: 0.9rem;
        margin: 0.5rem 0 1.5rem;
    }

    .blog-author {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 2rem;
        padding: 1rem;
        background: #F8FAFC;
        border-radius: 8px;
        border: 2px solid ${borderLight};
    }

    .author-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${primary}, ${borderDark});
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
    }

    .author-info h4 {
        margin-bottom: 0.3rem;
        color: ${textPrimary};
    }

    .author-info p {
        color: #94A3B8;
        font-size: 0.85rem;
        margin: 0;
    }

    .blog-content {
        font-size: 1rem;
        line-height: 1.8;
        padding: 0 0.5rem;
    }

    .blog-content img {
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        margin: 1.5rem 0;
    }

    .blog-content h1,
    .blog-content h2,
    .blog-content h3,
    .blog-content h4,
    .blog-content h5,
    .blog-content h6 {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }

    .blog-content p {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }

    .blog-content ul,
    .blog-content ol {
        padding-left: 2rem;
        padding-right: 0.5rem;
    }

    .blog-content table {
        margin-left: 0.5rem;
        margin-right: 0.5rem;
    }

    .blog-tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin: 1.5rem 0;
    }

    .blog-tag {
        background: ${bgEnd};
        color: ${primary};
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    /* Blog specific styles - Markdown elements */
    .blog-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        border: 2px solid #E2E8F0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .blog-table th {
        background: linear-gradient(135deg, #493dd5, #3a2fc1);
        color: white;
        font-weight: 600;
        padding: 0.8rem;
        text-align: left;
        border-bottom: 2px solid #E2E8F0;
    }

    .blog-table td {
        padding: 0.8rem;
        border-bottom: 1px solid #E2E8F0;
        vertical-align: top;
    }

    .blog-table tr:last-child td {
        border-bottom: none;
    }

    .blog-table tr:nth-child(even) {
        background: #F8FAFC;
    }

    .blog-table tr:hover {
        background: #EDF2F7;
    }

    pre {
        background: #2D3748;
        color: #E2E8F0;
        padding: 1.2rem;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1.5rem 0;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        line-height: 1.5;
        border-left: 4px solid #493dd5;
    }

    code {
        background: #EDF2F7;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        color: #2D3748;
    }

    pre code {
        background: transparent;
        padding: 0;
        border-radius: 0;
        color: inherit;
        font-size: inherit;
    }

    blockquote {
        border-left: 4px solid #493dd5;
        padding: 1rem 1.5rem;
        margin: 1.5rem 0;
        background: linear-gradient(90deg, #F8FAFC, #FFFFFF);
        border-radius: 0 8px 8px 0;
        font-style: italic;
        color: #4A5568;
        position: relative;
    }

    blockquote::before {
        content: '"';
        font-size: 3rem;
        color: #493dd5;
        opacity: 0.2;
        position: absolute;
        top: -1rem;
        left: 0.5rem;
    }

    hr {
        border: none;
        border-top: 3px solid #E2E8F0;
        margin: 2.5rem auto;
        width: 80%;
    }

    /* Blog Listing */
    .blog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }

    .blog-card {
        background: white;
        border: 2px solid ${borderLight};
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s;
        text-decoration: none;
        display: block;
    }

    .blog-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(73, 61, 213, 0.12);
        border-color: ${primary};
    }

    .blog-card-image {
        height: 180px;
        background: linear-gradient(135deg, ${bgEnd}, ${borderLight});
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${primary};
        font-size: 3rem;
    }

    .blog-card-content {
        padding: 1.5rem;
    }

    .blog-card h3 {
        color: ${textSecondary};
        margin-bottom: 0.8rem;
        font-size: 1.1rem;
        line-height: 1.4;
    }

    .blog-card-excerpt {
        color: #64748B;
        font-size: 0.9rem;
        line-height: 1.6;
        margin-bottom: 1rem;
    }

    .blog-card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #94A3B8;
        font-size: 0.8rem;
    }

    .blog-card-date {
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: ${textSecondary};
        background: white;
        border-radius: 12px;
        border: 2px solid ${borderLight};
        margin: 2rem 0;
    }

    .empty-state i {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: ${borderDark};
    }

    .empty-state h3 {
        margin-bottom: 0.8rem;
        color: ${textSecondary};
    }

    .empty-state p {
        color: ${textPrimary};
        opacity: 0.8;
        max-width: 400px;
        margin: 0 auto;
    }

    /* Utility Classes */
    .hidden {
        display: none !important;
    }

    /* Responsive Design */
    @media (max-width: 767px) {
        .division-grid,
        .district-grid,
        .tehsil-grid,
        .depot-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 0.7rem;
        }

        .rectangular-card {
            padding: 0.8rem;
            min-height: 90px;
        }

        .rectangular-card h3 {
            font-size: 1rem;
        }

        .schedule-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
            gap: 0.7rem;
            padding: 1rem;
        }

        .time-bubble {
            min-height: 55px;
            padding: 0.7rem 0.4rem;
            font-size: 0.85rem;
        }

        .next-badge {
            font-size: 0.6rem;
            padding: 1px 3px;
            top: -8px;
            right: -8px;
            min-width: 30px;
        }

        .floating-bus-stop-letters {
            top: 90px;
        }

        .footer-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .seo-content {
            padding: 1.2rem;
        }

        .ad-desktop {
            display: none !important;
        }

        .ad-mobile {
            display: flex !important;
        }

        .tab-btn {
            min-width: 80px;
            padding: 0.6rem 0.2rem;
            font-size: 0.8rem;
        }

        .tab-count {
            font-size: 0.7rem;
            padding: 0.1rem 0.3rem;
        }

        /* Mobile: Even more compact quick jump */
        .quick-jump-btn {
            min-width: 55px;
            max-width: 65px;
            padding: 0.3rem 0.4rem;
            font-size: 0.65rem;
            height: 50px;
        }

        .quick-jump-btn i {
            font-size: 0.8rem;
        }

        .quick-jump-btn.search-trigger {
            min-width: 60px;
            max-width: 70px;
        }

        .alphabet-view-grid {
            grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
            gap: 0.6rem;
        }

        .alphabet-btn {
            width: 40px;
            height: 40px;
            font-size: 1rem;
        }

        .related-links-grid {
            grid-template-columns: 1fr;
        }

        /* Mobile digital clock adjustments */
        .time-display.digital-clock {
            font-size: 1rem;
            min-width: 110px;
            padding: 0.3rem 0.6rem;
        }

        /* Mobile blog content padding */
        .blog-content {
            padding: 0 1rem;
        }

        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
            padding-left: 1rem;
            padding-right: 1rem;
        }

        .blog-content p {
            padding-left: 1rem;
            padding-right: 1rem;
        }

        .blog-content ul,
        .blog-content ol {
            padding-left: 2.5rem;
            padding-right: 1rem;
        }

        .blog-content table {
            margin-left: 1rem;
            margin-right: 1rem;
        }

        /* Mobile navigation buttons */
        .navigation-buttons {
            flex-direction: column;
            gap: 0.8rem;
        }

        .back-btn {
            width: 100%;
            justify-content: center;
        }
    }

    @media (min-width: 768px) and (max-width: 1024px) {
        .division-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }

        .district-grid,
        .tehsil-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }

        .schedule-grid {
            grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
        }

        .blog-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }

        .ad-desktop {
            display: none !important;
        }

        .ad-mobile {
            display: flex !important;
        }

        .tab-btn {
            min-width: 90px;
        }

        /* Tablet: Compact quick jump */
        .quick-jump-btn {
            min-width: 60px;
            max-width: 70px;
            padding: 0.4rem 0.5rem;
            font-size: 0.75rem;
            height: 60px;
        }

        .quick-jump-btn i {
            font-size: 0.9rem;
        }

        .related-links-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }

        /* Tablet blog content padding */
        .blog-content {
            padding: 0 1.5rem;
        }

        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }

        .blog-content p {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }

        .blog-content ul,
        .blog-content ol {
            padding-left: 3rem;
            padding-right: 1.5rem;
        }

        .blog-content table {
            margin-left: 1.5rem;
            margin-right: 1.5rem;
        }
    }

    @media (min-width: 1025px) {
        html {
            font-size: 15px;
        }

        .division-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .district-grid,
        .tehsil-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }

        .blog-grid {
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }

        .ad-desktop {
            display: flex !important;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            width: 100%;
        }

        .ad-mobile {
            display: none !important;
        }

        .tab-btn {
            min-width: 100px;
            padding: 0.8rem 0.3rem;
            font-size: 0.9rem;
        }

        /* Desktop: Normal quick jump buttons */
        .quick-jump-btn {
            min-width: 70px;
            max-width: 80px;
            padding: 0.5rem 0.6rem;
            font-size: 0.75rem;
            height: 65px;
        }

        .quick-jump-btn i {
            font-size: 1rem;
        }

        .related-links-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        /* Desktop digital clock enhancements */
        .time-display.digital-clock {
            font-size: 1.2rem;
            min-width: 140px;
        }

        /* Desktop blog content padding */
        .blog-content {
            padding: 0 2rem;
        }

        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
            padding-left: 2rem;
            padding-right: 2rem;
        }

        .blog-content p {
            padding-left: 2rem;
            padding-right: 2rem;
        }

        .blog-content ul,
        .blog-content ol {
            padding-left: 3.5rem;
            padding-right: 2rem;
        }

        .blog-content table {
            margin-left: 2rem;
            margin-right: 2rem;
        }

        /* Desktop: Larger back buttons */
        .back-btn {
            padding: 1rem 1.5rem;
            font-size: 1rem;
            gap: 0.6rem;
        }

        .back-btn i {
            font-size: 1.1rem;
        }
    }

    /* Print Styles */
    @media print {
        .site-header,
        .quick-jump-nav,
        .floating-bus-stop-letters,
        .filter-btn,
        .search-container,
        .time-filters,
        .back-btn,
        .ad-container,
        .quick-search-modal,
        .alphabet-quick-view {
            display: none !important;
        }

        body {
            background: white;
            color: black;
            padding: 0;
            font-size: 12pt;
        }

        .time-bubble {
            break-inside: avoid;
            border: 1px solid #ccc !important;
            background: white !important;
            color: black !important;
        }
    }

    /* Fix for 100% zoom - ensure buttons are clickable */
    @media (max-width: 1000px) {
        .quick-jump-btn,
        .alphabet-btn,
        .alphabet-mini-btn,
        .floating-letter-btn,
        .filter-btn,
        .tab-btn,
        .close-search,
        .close-alphabet {
            min-height: 44px;
            min-width: 44px;
            padding: 8px 12px;
        }

        /* Ensure alphabet drawer opens properly */
        .alphabet-quick-view {
            z-index: 1002 !important;
            touch-action: pan-y !important;
        }

        .alphabet-view-header,
        .alphabet-view-grid {
            touch-action: manipulation !important;
        }
    }

    /* Force no horizontal scroll on any zoom level */
    body, html {
        overflow-x: hidden;
        max-width: 100%;
        width: 100%;
    }

    .container, .quick-jump-content, .tabs-header, .time-filters {
        max-width: 100%;
        overflow-x: hidden;
    }`;
    }

    getInlineJS() {
        return `// MSRTC Bus Timetable Application
class BusTimetableApp {
    constructor() {
        this.istOffset = 5.5 * 60 * 60 * 1000;
        this.activeFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        console.log('🚌 MSRTC Bus Timetable App Initialized');

        // Handle hash navigation on page load
        if (window.location.hash) {
            setTimeout(() => {
                this.handleHashNavigation();
            }, 100);
        }

        // Update digital clock display with IST time
        this.updateDigitalClock();
        setInterval(() => this.updateDigitalClock(), 1000);

        // Initialize tabs
        this.initAllTabs();

        // Initialize quick jump navigation
        this.initQuickJump();

        // Initialize alphabet navigation - FIXED FOR 100% ZOOM
        this.initAlphabetNavigation();

        // Initialize search functionality
        this.initSearch();

        // Initialize depot-specific features
        if (document.querySelector('.time-filters')) {
            this.initFilters();
            this.initTimeClick();
            setTimeout(() => {
                this.highlightNextBus();
                this.applyFilters();
            }, 100);
        }

        // Initialize back button
        this.initBackButton();

        // Initialize scroll highlighting
        if (document.querySelector('.bus-stop-section') || document.querySelector('.rectangular-card')) {
            this.initScrollHighlighting();
        }

        // Initialize blog navigation if on blog page
        if (document.querySelector('.blog-grid')) {
            this.initBlogNavigation();
        }

        // Initialize bus stop alphabet navigation
        this.initBusStopAlphabetNavigation();

        // Highlight first matching alphabet
        setTimeout(() => this.highlightFirstAlphabetMatch(), 300);

        // Prevent horizontal scroll
        this.preventHorizontalScroll();
    }

    preventHorizontalScroll() {
        // Ensure no horizontal scroll
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';

        window.addEventListener('resize', () => {
            document.body.style.overflowX = 'hidden';
            document.documentElement.style.overflowX = 'hidden';
        });
    }

    handleHashNavigation() {
        // If we're on homepage and have a hash, switch to appropriate tab
        if (window.location.pathname.endsWith('index.html') ||
            window.location.pathname.endsWith('/')) {
            const hash = window.location.hash.replace('#', '');
            if (hash && ['divisions', 'districts', 'tehsils', 'depots'].includes(hash)) {
                // Find and click the tab button
                const tabButton = document.querySelector(\`.tab-btn[data-tab="\${hash}"]\`);
                if (tabButton) {
                    tabButton.click();
                }
            }
        }
    }

    highlightFirstAlphabetMatch() {
        // Highlight the first visible alphabet button
        const alphabetButtons = document.querySelectorAll('.alphabet-mini-btn:not(.disabled), .alphabet-btn:not(.disabled), .floating-letter-btn:not(.disabled)');
        if (alphabetButtons.length > 0) {
            // Remove any existing highlights
            document.querySelectorAll('.alphabet-highlight-first').forEach(el => {
                el.classList.remove('alphabet-highlight-first');
            });

            // Add highlight to first matching button
            alphabetButtons[0].classList.add('alphabet-highlight-first');
        }
    }

    updateDigitalClock() {
        // Get current IST time
        const now = new Date();
        const istTime = new Date(now.getTime() + this.istOffset);

        let hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes().toString().padStart(2, '0');
        const seconds = istTime.getUTCSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        // Convert to 12-hour format
        hours = hours % 12 || 12;
        const displayHours = hours.toString().padStart(2, '0');

        document.querySelectorAll('.digital-clock').forEach(clock => {
            const hoursSpan = clock.querySelector('.digital-hours');
            const minutesSpan = clock.querySelector('.digital-minutes');
            const secondsSpan = clock.querySelector('.digital-seconds');
            const ampmSpan = clock.querySelector('.digital-ampm');

            if (hoursSpan) hoursSpan.textContent = displayHours;
            if (minutesSpan) minutesSpan.textContent = minutes;
            if (secondsSpan) secondsSpan.textContent = seconds;
            if (ampmSpan) ampmSpan.textContent = ampm;
        });

        // Update next bus highlight every 30 seconds
        if (document.querySelector('.time-filters') && now.getSeconds() % 30 === 0) {
            this.highlightNextBus();
        }
    }

    initAllTabs() {
        // Handle main tabs (content tabs)
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;

                // Update main tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Show corresponding tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === \`\${tabId}-tab\`) {
                        content.classList.add('active');
                    }
                });

                // Update top navigation buttons
                document.querySelectorAll('.quick-jump-btn[data-tab]').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.tab === tabId) {
                        btn.classList.add('active');
                    }
                });

                // Update URL hash for bookmarking
                if (window.location.pathname.endsWith('index.html') ||
                    window.location.pathname.endsWith('/')) {
                    window.history.replaceState(null, null, \`#\${tabId}\`);
                }

                // Store active tab in localStorage
                localStorage.setItem('activeTab', tabId);

                // Re-highlight first alphabet match
                setTimeout(() => this.highlightFirstAlphabetMatch(), 100);
            });
        });

        // Restore active tab from localStorage
        const savedTab = localStorage.getItem('activeTab') || 'divisions';
        const savedButton = document.querySelector(\`.tab-btn[data-tab="\${savedTab}"]\`);
        if (savedButton) {
            savedButton.click();
        }
    }

    initQuickJump() {
        // Search trigger
        document.querySelectorAll('.search-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSearchModal();
            });
        });

        // Alphabet trigger - FIXED FOR 100% ZOOM
        document.querySelectorAll('.alphabet-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAlphabetView();
            });
        });

        // Bus stop alphabet trigger (specific for depot pages)
        document.querySelectorAll('.bus-stop-alphabet-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToBusStopSection('A');
            });
        });

        // Handle top navigation tab clicks
        document.querySelectorAll('.quick-jump-btn[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = btn.dataset.tab;
                const hash = btn.dataset.hash || tabId;

                // Check if we're on homepage
                const isHomepage = window.location.pathname.endsWith('index.html') ||
                                  window.location.pathname.endsWith('/');

                if (isHomepage) {
                    // On homepage, just switch tabs
                    const mainTabButton = document.querySelector(\`.tab-btn[data-tab="\${tabId}"]\`);
                    if (mainTabButton) {
                        mainTabButton.click();

                        // Scroll to tabs section
                        setTimeout(() => {
                            const tabsSection = document.querySelector('.tabs-container');
                            if (tabsSection) {
                                const headerHeight = document.querySelector('.site-header').offsetHeight +
                                                   document.querySelector('.quick-jump-nav').offsetHeight;
                                const sectionTop = tabsSection.offsetTop - headerHeight - 20;

                                window.scrollTo({
                                    top: sectionTop,
                                    behavior: 'smooth'
                                });
                            }
                        }, 100);
                    }
                } else {
                    // Not on homepage, navigate to homepage with correct tab hash
                    window.location.href = \`index.html#\${hash}\`;
                }
            });
        });
    }

    initAlphabetNavigation() {
        // Initialize all alphabet buttons - FIXED FOR TOUCH/CLICK
        const alphabetButtons = document.querySelectorAll('.alphabet-btn, .alphabet-mini-btn');
        alphabetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.classList.contains('disabled')) {
                    e.preventDefault();
                    return;
                }

                const letter = button.dataset.letter;
                this.jumpToLetter(letter);

                // Update active state
                alphabetButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.classList.remove('alphabet-highlight-first');
                    if (btn.dataset.letter === letter) {
                        btn.classList.add('active');
                    }
                });

                // Close alphabet view if open
                this.hideAlphabetView();
            });

            // Add touch events for better mobile support
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.click();
            });
        });
    }

    initBusStopAlphabetNavigation() {
        const floatingButtons = document.querySelectorAll('.floating-letter-btn');
        floatingButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.classList.contains('disabled')) {
                    e.preventDefault();
                    return;
                }

                const letter = button.dataset.letter;
                this.scrollToBusStopSection(letter);

                // Update active state
                floatingButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.classList.remove('alphabet-highlight-first');
                    if (btn.dataset.letter === letter) {
                        btn.classList.add('active');
                    }
                });
            });

            // Add touch events for better mobile support
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.click();
            });
        });
    }

    scrollToBusStopSection(letter) {
        // Convert to lowercase for lookup
        const lookupLetter = letter.toLowerCase();

        // Try all bus stop sections with this letter
        const busStopSections = document.querySelectorAll(\`.bus-stop-section[data-letter="\${lookupLetter}"]\`);

        if (busStopSections.length > 0) {
            const headerHeight = document.querySelector('.site-header').offsetHeight +
                               document.querySelector('.quick-jump-nav').offsetHeight + 20;
            const sectionTop = busStopSections[0].offsetTop - headerHeight;

            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });

            // Highlight briefly
            this.highlightElement(busStopSections[0]);
            return true;
        }

        // Try by bus stop name first letter (case-insensitive)
        const allSections = document.querySelectorAll('.bus-stop-section');
        for (const section of allSections) {
            const busStopName = section.querySelector('.bus-stop-name')?.textContent.trim();
            if (busStopName && busStopName.charAt(0).toLowerCase() === lookupLetter) {
                const headerHeight = document.querySelector('.site-header').offsetHeight +
                                   document.querySelector('.quick-jump-nav').offsetHeight + 20;
                const sectionTop = section.offsetTop - headerHeight;

                window.scrollTo({
                    top: sectionTop,
                    behavior: 'smooth'
                });

                this.highlightElement(section);
                return true;
            }
        }

        return false;
    }

    jumpToLetter(letter) {
        // Try bus stop sections first (for depot pages)
        if (this.scrollToBusStopSection(letter)) {
            return;
        }

        // Try cards (for division/district/tehsil/depot pages)
        const cards = document.querySelectorAll('.rectangular-card');
        for (const card of cards) {
            const cardAlphabet = card.dataset.alphabet;
            const cardTitle = card.querySelector('h3');
            if ((cardAlphabet && cardAlphabet.toUpperCase() === letter.toUpperCase()) ||
                (cardTitle && cardTitle.textContent.trim().charAt(0).toUpperCase() === letter.toUpperCase())) {
                const headerHeight = document.querySelector('.site-header').offsetHeight +
                                   document.querySelector('.quick-jump-nav').offsetHeight + 20;
                const cardTop = card.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: cardTop,
                    behavior: 'smooth'
                });

                this.highlightElement(card);
                return;
            }
        }

        // Try headings
        const headings = document.querySelectorAll('h1, h2, h3, h4');
        for (const heading of headings) {
            if (heading.textContent.trim().charAt(0).toUpperCase() === letter.toUpperCase()) {
                const headerHeight = document.querySelector('.site-header').offsetHeight +
                                   document.querySelector('.quick-jump-nav').offsetHeight + 20;
                const headingTop = heading.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: headingTop,
                    behavior: 'smooth'
                });

                this.highlightElement(heading);
                return;
            }
        }
    }

    highlightElement(element) {
        const originalBoxShadow = element.style.boxShadow;
        const originalBackground = element.style.backgroundColor;

        element.style.boxShadow = '0 0 0 3px rgba(73, 61, 213, 0.3)';
        element.style.backgroundColor = 'rgba(237, 233, 254, 0.5)';

        setTimeout(() => {
            element.style.boxShadow = originalBoxShadow;
            element.style.backgroundColor = originalBackground;
        }, 1500);
    }

    showSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.querySelector('.global-search-input').focus();

            // Close button
            const closeBtn = modal.querySelector('.close-search');
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Add touch event for mobile
            closeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                modal.style.display = 'none';
            });

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });

            // Initialize search functionality
            this.initGlobalSearch();
        }
    }

    initGlobalSearch() {
        const searchInput = document.querySelector('.global-search-input');
        const searchResults = document.getElementById('searchResults');

        if (!searchInput || !searchResults) return;

        // Load search index if available
        if (typeof window.searchIndex === 'undefined') {
            // Try to load search index
            const script = document.createElement('script');
            script.src = 'search-index.js';
            script.onload = () => this.performGlobalSearch(searchInput, searchResults);
            document.head.appendChild(script);
        } else {
            this.performGlobalSearch(searchInput, searchResults);
        }
    }

    performGlobalSearch(searchInput, searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            if (query.length < 1) {
                searchResults.innerHTML = '<div class="search-result-item"><p>Type to search...</p></div>';
                return;
            }

            // Search across all data types from search-index.js
            const allResults = [];

            // Search divisions
            if (window.searchIndex && window.searchIndex.divisions) {
                window.searchIndex.divisions.forEach(item => {
                    if (item.name.toLowerCase().includes(query) ||
                        item.type.toLowerCase().includes(query) ||
                        (item.alphabet && item.alphabet.toLowerCase() === query)) {
                        allResults.push(item);
                    }
                });
            }

            // Search districts
            if (window.searchIndex && window.searchIndex.districts) {
                window.searchIndex.districts.forEach(item => {
                    if (item.name.toLowerCase().includes(query) ||
                        item.division.toLowerCase().includes(query) ||
                        item.type.toLowerCase().includes(query) ||
                        (item.alphabet && item.alphabet.toLowerCase() === query)) {
                        allResults.push(item);
                    }
                });
            }

            // Search tehsils
            if (window.searchIndex && window.searchIndex.tehsils) {
                window.searchIndex.tehsils.forEach(item => {
                    if (item.name.toLowerCase().includes(query) ||
                        item.division.toLowerCase().includes(query) ||
                        item.district.toLowerCase().includes(query) ||
                        item.type.toLowerCase().includes(query) ||
                        (item.alphabet && item.alphabet.toLowerCase() === query)) {
                        allResults.push(item);
                    }
                });
            }

            // Search depots
            if (window.searchIndex && window.searchIndex.depots) {
                window.searchIndex.depots.forEach(item => {
                    if (item.name.toLowerCase().includes(query) ||
                        item.division.toLowerCase().includes(query) ||
                        item.district.toLowerCase().includes(query) ||
                        item.tehsil.toLowerCase().includes(query) ||
                        item.type.toLowerCase().includes(query) ||
                        (item.alphabet && item.alphabet.toLowerCase() === query)) {
                        allResults.push(item);
                    }
                });
            }

            // Sort results by relevance (exact matches first, then partial matches)
            allResults.sort((a, b) => {
                const aExact = a.name.toLowerCase() === query;
                const bExact = b.name.toLowerCase() === query;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                return a.name.localeCompare(b.name);
            });

            // Display results (limit to 30)
            const filteredItems = allResults.slice(0, 30);

            if (filteredItems.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item"><p>No results found</p></div>';
            } else {
                searchResults.innerHTML = filteredItems.map(item => {
                    let description = \`\${item.type}\`;
                    if (item.division) description += \` • \${item.division}\`;
                    if (item.district) description += \` • \${item.district}\`;
                    if (item.tehsil) description += \` • \${item.tehsil}\`;
                    if (item.busStops) description += \` • \${item.busStops} bus stops\`;
                    if (item.buses) description += \` • \${item.buses} bus schedules\`;
                    if (item.districts) description += \` • \${item.districts} districts\`;
                    if (item.depots) description += \` • \${item.depots} depots\`;
                    if (item.tehsils) description += \` • \${item.tehsils} tehsils\`;

                    return \`
                    <div class="search-result-item" data-url="\${item.path}">
                        <h4>\${item.name}</h4>
                        <p>\${description}</p>
                    </div>
                    \`;
                }).join('');

                // Add click handlers
                searchResults.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const url = item.dataset.url;
                        if (url) {
                            // FIX: Handle blog URLs correctly
                            if (url.includes('/blogs/')) {
                                window.location.href = url;
                            } else {
                                window.location.href = url;
                            }
                            document.getElementById('searchModal').style.display = 'none';
                        }
                    });
                });
            }
        });

        // Enter key to select first result
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstResult = searchResults.querySelector('.search-result-item');
                if (firstResult) {
                    firstResult.click();
                }
            }
        });

        // Escape key to close modal
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('searchModal').style.display = 'none';
            }
        });
    }

    showAlphabetView() {
        const view = document.getElementById('alphabetView');
        if (view) {
            view.style.display = 'block';

            // Close button - FIXED FOR 100% ZOOM
            const closeBtn = view.querySelector('.close-alphabet');
            closeBtn.addEventListener('click', () => {
                this.hideAlphabetView();
            });

            // Add touch event for mobile
            closeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.hideAlphabetView();
            });

            // Close on outside click
            view.addEventListener('click', (e) => {
                if (e.target === view) {
                    this.hideAlphabetView();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && view.style.display === 'block') {
                    this.hideAlphabetView();
                }
            });

            // Ensure alphabet buttons are clickable
            setTimeout(() => {
                this.initAlphabetNavigation();
            }, 100);
        }
    }

    hideAlphabetView() {
        const view = document.getElementById('alphabetView');
        if (view) {
            view.style.display = 'none';
        }
    }

    initSearch() {
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });

            searchBox.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchBox.value = '';
                    this.searchTerm = '';
                    this.applyFilters();
                }
            });
        }
    }

    initBackButton() {
        // Handle blog navigation
        const blogBackBtn = document.querySelector('.back-btn[href="index.html"]');
        if (blogBackBtn && window.location.pathname.includes('/blogs/')) {
            blogBackBtn.href = 'index.html';
        }
    }

    initFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.activeFilter = button.dataset.filter;
                this.applyFilters();
            });
        });
    }

    initScrollHighlighting() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveAlphabet();
            }, 50);
        });

        setTimeout(() => this.updateActiveAlphabet(), 200);
    }

    updateActiveAlphabet() {
        // Check for bus stop sections
        const busStopSections = document.querySelectorAll('.bus-stop-section:not(.hidden)');
        if (busStopSections.length > 0) {
            let currentLetter = '';
            const scrollPosition = window.scrollY + 150;

            for (const section of busStopSections) {
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                    currentLetter = section.dataset.letter;
                    break;
                }
            }

            if (currentLetter) {
                this.updateAlphabetActiveState(currentLetter);
            }
            return;
        }

        // Check for cards
        const cards = document.querySelectorAll('.rectangular-card');
        let closestCard = null;
        let closestDistance = Infinity;
        const scrollPosition = window.scrollY + 100;

        cards.forEach(card => {
            const cardTop = card.offsetTop;
            const cardBottom = cardTop + card.offsetHeight;

            if (scrollPosition >= cardTop && scrollPosition <= cardBottom) {
                const distance = Math.abs(scrollPosition - cardTop);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestCard = card;
                }
            }
        });

        if (closestCard) {
            const cardAlphabet = closestCard.dataset.alphabet || closestCard.querySelector('h3').textContent.trim().charAt(0).toUpperCase();
            this.updateAlphabetActiveState(cardAlphabet);
        }
    }

    updateAlphabetActiveState(letter) {
        // Update all alphabet buttons
        document.querySelectorAll('.alphabet-btn, .alphabet-mini-btn, .floating-letter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.letter.toLowerCase() === letter.toLowerCase()) {
                btn.classList.add('active');
            }
        });
    }

    applyFilters() {
        const sections = document.querySelectorAll('.bus-stop-section');
        let hasVisibleContent = false;

        sections.forEach(section => {
            const busStopName = section.querySelector('.bus-stop-name').textContent.toLowerCase();
            const timeBubbles = section.querySelectorAll('.time-bubble');
            let visibleBubbles = 0;

            // Filter by search term
            if (this.searchTerm && !busStopName.includes(this.searchTerm)) {
                section.classList.add('hidden');
                return;
            }

            // Filter by time category
            timeBubbles.forEach(bubble => {
                const time = bubble.dataset.time;
                const timeCategory = this.getTimeCategory(time);

                if (this.activeFilter === 'all' || timeCategory === this.activeFilter) {
                    bubble.classList.remove('hidden');
                    visibleBubbles++;
                } else {
                    bubble.classList.add('hidden');
                }
            });

            if (visibleBubbles > 0) {
                section.classList.remove('hidden');
                hasVisibleContent = true;
            } else {
                section.classList.add('hidden');
            }

            // Update bus count display
            const busCount = section.querySelector('.bus-count');
            if (busCount) {
                busCount.textContent = \`\${visibleBubbles} bus\${visibleBubbles !== 1 ? 'es' : ''}\`;
            }
        });

        // Show/hide empty state
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.classList.toggle('hidden', hasVisibleContent);
        }

        // Update floating bus stop letters visibility
        this.updateFloatingLettersVisibility();

        setTimeout(() => this.highlightNextBus(), 50);
        setTimeout(() => this.updateActiveAlphabet(), 100);
    }

    updateFloatingLettersVisibility() {
        const floatingButtons = document.querySelectorAll('.floating-letter-btn');
        const visibleLetters = new Set();

        document.querySelectorAll('.bus-stop-section:not(.hidden)').forEach(section => {
            const letter = section.dataset.letter;
            if (letter) visibleLetters.add(letter.toLowerCase());
        });

        floatingButtons.forEach(btn => {
            const letter = btn.dataset.letter.toLowerCase();
            if (visibleLetters.has(letter)) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        });
    }

    getTimeCategory(timeString) {
        const [hours] = timeString.split(':').map(Number);
        if (hours >= 5 && hours < 12) return 'morning';
        if (hours >= 12 && hours < 17) return 'afternoon';
        if (hours >= 17 && hours < 22) return 'evening';
        return 'night';
    }

    highlightNextBus() {
        document.querySelectorAll('.next-badge').forEach(badge => badge.remove());
        document.querySelectorAll('.time-bubble.next-bus').forEach(bubble => {
            bubble.classList.remove('next-bus');
            const sparkle = bubble.querySelector('.next-bus-sparkle');
            if (sparkle) sparkle.remove();
        });

        // Get current IST time
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        const allBubbles = Array.from(document.querySelectorAll('.time-bubble:not(.hidden)'));
        const upcomingBubbles = [];

        allBubbles.forEach(bubble => {
            const [hours, minutes] = bubble.dataset.time.split(':').map(Number);
            const bubbleTotalMinutes = hours * 60 + minutes;

            let timeDiff = bubbleTotalMinutes - currentTotalMinutes;
            if (timeDiff < 0) {
                timeDiff += 24 * 60;
            }

            if (timeDiff >= 0 && timeDiff <= 360) {
                upcomingBubbles.push({
                    bubble,
                    timeDiff,
                    bubbleTotalMinutes
                });
            }
        });

        upcomingBubbles.sort((a, b) => a.timeDiff - b.timeDiff);

        if (upcomingBubbles.length > 0) {
            const nextBus = upcomingBubbles[0].bubble;
            const badge = document.createElement('div');
            badge.className = 'next-badge';
            badge.textContent = 'NEXT';
            badge.title = 'Next upcoming bus';

            // Add sparkle effect to next bus bubble
            nextBus.classList.add('next-bus');

            const sparkle = document.createElement('div');
            sparkle.className = 'next-bus-sparkle';
            nextBus.appendChild(sparkle);

            nextBus.style.position = 'relative';
            nextBus.appendChild(badge);
        }
    }

    initTimeClick() {
        document.addEventListener('click', (e) => {
            const timeBubble = e.target.closest('.time-bubble');
            if (timeBubble) {
                const time = timeBubble.dataset.time;
                const busStop = timeBubble.closest('.bus-stop-section').querySelector('.bus-stop-name').textContent;
                this.showBusDetails(time, busStop);
            }
        });
    }

    showBusDetails(time, busStop) {
        const [hours, minutes] = time.split(':').map(Number);
        const timeCategory = this.getTimeCategory(time);

        const categoryNames = {
            morning: '🌅 Morning Bus',
            afternoon: '☀️ Afternoon Bus',
            evening: '🌇 Evening Bus',
            night: '🌙 Night Bus'
        };

        // Convert to 12-hour format for display
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedTime = \`\${hour12}:\${minutes.toString().padStart(2, '0')} \${ampm}\`;

        const period = categoryNames[timeCategory];

        // Get current IST time
        const now = new Date();
        const busTime = new Date(now);
        busTime.setHours(hours, minutes, 0, 0);

        if (busTime < now) {
            busTime.setDate(busTime.getDate() + 1);
        }

        const timeDiff = Math.floor((busTime - now) / (1000 * 60));
        let timeMessage = '';
        if (timeDiff < 60) {
            timeMessage = \`in \${timeDiff} minutes\`;
        } else {
            const hoursLeft = Math.floor(timeDiff / 60);
            const minutesLeft = timeDiff % 60;
            timeMessage = \`in \${hoursLeft}h \${minutesLeft}m\`;
        }

        const message = \`🚌 **Bus Details**\\n\\n📍 **Bus Stop:** \${busStop}\\n🕐 **Time:** \${formattedTime}\\n⏰ **\${period}** (\${timeMessage})\\n\\n💡 *Please arrive 10-15 minutes before departure*\`;

        alert(message);
    }

    initBlogNavigation() {
        console.log('📝 Blog page initialized');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.busApp = new BusTimetableApp();
});`;
    }

    getDistrictsForDivision(divisionId) {
        return Object.values(this.data.districts).filter(d => d.division_id === divisionId);
    }

    getTehsilsForDistrict(districtId) {
        return Object.values(this.data.tehsils).filter(t => t.district_id === districtId);
    }

    getDepotsForTehsil(tehsilId) {
        return Object.values(this.data.depots).filter(d => d.tehsil_id === tehsilId);
    }

    getDepotCountForDivision(divisionId) {
        const districts = this.getDistrictsForDivision(divisionId);
        return districts.reduce((count, district) => {
            return count + this.getDepotCountForDistrict(district.id);
        }, 0);
    }

    getDepotCountForDistrict(districtId) {
        const tehsils = this.getTehsilsForDistrict(districtId);
        return tehsils.reduce((count, tehsil) => {
            return count + this.getDepotsForTehsil(tehsil.id).length;
        }, 0);
    }

    getDefaultSEOContent(type) {
        const baseContent = {
            title: '',
            content: ''
        };

        return baseContent;
    }

    writeFile(filePath, content) {
        const fullPath = path.join(this.publicDir, filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content, 'utf8');
    }

    generateSitemap() {
        console.log('🗺️  Generating sitemap.xml...');

        const urls = [];
        const baseUrl = this.config.base_url;
        const today = new Date().toISOString().split('T')[0];

        // Homepage
        urls.push({
            loc: `${baseUrl}/`,
            lastmod: today,
            priority: '1.0',
            changefreq: 'daily'
        });

        // Static pages
        ['about', 'contact', 'terms', 'privacy', 'disclaimer'].forEach(page => {
            urls.push({
                loc: `${baseUrl}/${page}.html`,
                lastmod: today,
                priority: '0.8',
                changefreq: 'monthly'
            });
        });

        // Blog pages
        urls.push({
            loc: `${baseUrl}/blogs/index.html`,
            lastmod: today,
            priority: '0.9',
            changefreq: 'weekly'
        });

        this.blogs.forEach(blog => {
            urls.push({
                loc: `${baseUrl}/blogs/${blog.id}.html`,
                lastmod: new Date(blog.date).toISOString().split('T')[0],
                priority: '0.7',
                changefreq: 'monthly'
            });
        });

        // Division pages
        Object.values(this.data.divisions).forEach(division => {
            urls.push({
                loc: `${baseUrl}/${division.id}/index.html`,
                lastmod: today,
                priority: '0.9',
                changefreq: 'weekly'
            });
        });

        // District pages
        Object.values(this.data.districts).forEach(district => {
            const division = this.data.divisions[district.division_id];
            if (division) {
                urls.push({
                    loc: `${baseUrl}/${division.id}/${district.id}/index.html`,
                    lastmod: today,
                    priority: '0.8',
                    changefreq: 'weekly'
                });
            }
        });

        // Tehsil pages
        Object.values(this.data.tehsils).forEach(tehsil => {
            const district = this.data.districts[tehsil.district_id];
            const division = district ? this.data.divisions[district.division_id] : null;

            if (division && district) {
                urls.push({
                    loc: `${baseUrl}/${division.id}/${district.id}/${tehsil.id}/index.html`,
                    lastmod: today,
                    priority: '0.7',
                    changefreq: 'weekly'
                });
            }
        });

        // Depot pages
        Object.values(this.data.depots).forEach(depot => {
            const tehsil = this.data.tehsils[depot.tehsil_id];
            const district = tehsil ? this.data.districts[tehsil.district_id] : null;
            const division = district ? this.data.divisions[district.division_id] : null;

            if (division && district && tehsil) {
                urls.push({
                    loc: `${baseUrl}/${division.id}/${district.id}/${tehsil.id}/${depot.id}/index.html`,
                    lastmod: today,
                    priority: '0.6',
                    changefreq: 'daily'
                });
            }
        });

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `    <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

        this.writeFile('sitemap.xml', sitemap);
        console.log('   ✓ Sitemap generated');
    }

    generateRobotsTxt() {
        console.log('🤖 Generating robots.txt...');

        const robots = `User-agent: *
Allow: /
Disallow: /data/
Sitemap: ${this.config.base_url}/sitemap.xml

# Crawl-delay: 10
# Allow bots from search engines

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /`;

        this.writeFile('robots.txt', robots);
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

        let totalBusStops = 0;
        let totalBuses = 0;

        Object.values(this.data.depots).forEach(depot => {
            if (depot.villages) {
                Object.values(depot.villages).forEach(busStopList => {
                    totalBusStops += busStopList.length;
                    busStopList.forEach(busStop => {
                        totalBuses += busStop.schedule ? busStop.schedule.length : 0;
                    });
                });
            }
        });

        console.log(`📍 Bus Stops: ${totalBusStops}`);
        console.log(`🕐 Total Bus Schedules: ${totalBuses}`);

        // Count HTML files
        const htmlCount = this.countHTMLFiles(this.publicDir);
        console.log(`📁 Pages Generated: ${htmlCount}`);

        console.log('\n✅ ALL FEATURES INCLUDED:');
        console.log('1. ✅ RELATED DEPOTS FEATURE: Added support for related depots from JSON files');
        console.log('2. ✅ REDUCED PADDING: Top navigation is now more compact');
        console.log('3. ✅ NO SCROLL BAR: Quick jump navigation hides scrollbar completely');
        console.log('4. ✅ SEARCH ICON POSITION: Search button stays properly positioned');
        console.log('5. ✅ ALPHABET DRAWER FIX: Opens reliably at 100% zoom');
        console.log('6. ✅ BETTER TOUCH SUPPORT: Added touch-action for mobile devices');
        console.log('7. ✅ Z-INDEX FIXES: Alphabet drawer has higher z-index than modal');
        console.log('8. ✅ NO HORIZONTAL SCROLL: Body overflow-x hidden on all devices');
        console.log('9. ✅ BACK BUTTON MARGIN: Navigation buttons have proper spacing');
        console.log('10. ✅ ADDED "BACK TO BUS SCHEDULE" BUTTON: Same style as Back to Blogs');
        console.log('11. ✅ FIXED BLOG NAVIGATION: Both buttons (Back to Blogs + Back to Bus Schedule)');
        console.log('12. ✅ ONLY NEXT BUS SPARKLES: Removed sparkles from all times, only next bus sparkles');
        console.log('13. ✅ ADDED HOME BUTTON TO ALL PAGES: All pages now have "Back to Bus Schedule" button');
        console.log('14. ✅ SAME BUTTON STYLE: Back to Bus Schedule now looks same as Back to Blogs');
        console.log('15. ✅ SEPARATE FROM NAVIGATION: Buttons look distinct from top navigation border');
        console.log('16. ✅ RESPONSIVE BUTTONS: Larger on desktop, compact on mobile');

        console.log('\n🔧 KEY IMPROVEMENTS:');
        console.log('• Header padding: Reduced from 0.6rem to 0.4rem');
        console.log('• Quick jump padding: Reduced from 0.5rem to 0.3rem');
        console.log('• Button sizes: Compact design with fixed heights');
        console.log('• Scroll prevention: overflow-x: hidden on body');
        console.log('• Touch targets: Minimum 44px for touch devices');
        console.log('• Alphabet drawer: z-index 1002 to appear above modals');
        console.log('• Search button: "Quick Search" changed to "Search" for space');
        console.log('• Navigation buttons: Added 2rem margin from top');
        console.log('• Two buttons in blogs: "Back to Blogs" + "Back to Bus Schedule"');
        console.log('• Sparkle effect: Only next bus has sparkle animation');
        console.log('• Button styling: Both buttons now have same white background with border');
        console.log('• Desktop enhancement: Buttons are larger on desktop screens');
        console.log('• Related depots: Loads from data/related-depots/ directory');
        console.log('• Multiple JSON files: Supports multiple JSON files in related-depots directory');
        console.log('• Flexible format: Supports array of objects or single object format');
        console.log('• Fallback: Shows other depots in same tehsil if no related depots specified');
        console.log('• Error handling: Gracefully handles missing depots or invalid data');
    }

    countHTMLFiles(dir) {
        let count = 0;

        if (!fs.existsSync(dir)) return 0;

        const items = fs.readdirSync(dir, { withFileTypes: true });

        items.forEach(item => {
            const itemPath = path.join(dir, item.name);

            if (item.isDirectory()) {
                count += this.countHTMLFiles(itemPath);
            } else if (item.isFile() && item.name.endsWith('.html')) {
                count++;
            }
        });

        return count;
    }
}

// Run generator
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