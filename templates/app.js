// MSRTC Bus Timetable Application
class BusTimetableApp {
    constructor() {
        this.currentTime = new Date();
        this.istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        this.activeFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        console.log('🚌 MSRTC Bus Timetable App Initialized');

        // Update time display
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);

        // Initialize event listeners if on depot page
        if (document.querySelector('.time-filters')) {
            this.initFilters();
            this.initSearch();
            this.initAlphabetNav();
            this.highlightNextBus();
            this.initTimeClick();
            console.log('📍 Depot page features initialized');
        }

        // Initialize back button
        this.initBackButton();
    }

    updateTime() {
        const now = new Date();
        const istTime = new Date(now.getTime() + this.istOffset);

        const timeString = istTime.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const timeElements = document.querySelectorAll('.time-display');
        timeElements.forEach(el => {
            el.textContent = timeString;
        });

        this.currentTime = istTime;

        // Update next bus highlights every 30 seconds
        if (document.querySelector('.time-bubble') && now.getSeconds() % 30 === 0) {
            this.highlightNextBus();
        }
    }

    initFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();

                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to clicked button
                button.classList.add('active');

                // Update active filter
                this.activeFilter = button.dataset.filter;

                // Apply filters
                this.applyFilters();
            });
        });
    }

    initSearch() {
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });

            // Clear search on escape
            searchBox.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchBox.value = '';
                    this.searchTerm = '';
                    this.applyFilters();
                }
            });
        }
    }

    initAlphabetNav() {
        const letterButtons = document.querySelectorAll('.letter-btn');
        letterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const letter = button.dataset.letter;
                this.scrollToLetter(letter);

                // Update active state
                letterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        // Highlight active letter based on scroll
        window.addEventListener('scroll', () => {
            this.highlightActiveLetter();
        });

        // Initial highlight
        setTimeout(() => this.highlightActiveLetter(), 100);
    }

    scrollToLetter(letter) {
        const section = document.getElementById(`letter-${letter}`);
        if (section) {
            const headerHeight = document.querySelector('.site-header').offsetHeight + 20;
            const sectionTop = section.offsetTop - headerHeight;

            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        } else {
            // If letter not found, show message
            this.showNotification(`No villages starting with ${letter}`);
        }
    }

    highlightActiveLetter() {
        const sections = document.querySelectorAll('.village-section');
        const letters = document.querySelectorAll('.letter-btn');

        let currentLetter = '';

        sections.forEach(section => {
            if (section.classList.contains('hidden')) return;

            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                currentLetter = section.id.replace('letter-', '');
            }
        });

        if (currentLetter) {
            letters.forEach(letterBtn => {
                letterBtn.classList.remove('active');
                if (letterBtn.dataset.letter === currentLetter) {
                    letterBtn.classList.add('active');
                }
            });
        }
    }

    applyFilters() {
        const sections = document.querySelectorAll('.village-section');
        let hasVisibleContent = false;

        sections.forEach(section => {
            const villageName = section.querySelector('.village-name').textContent.toLowerCase();
            const timeBubbles = section.querySelectorAll('.time-bubble');
            let visibleBubbles = 0;

            // Filter by search term
            if (this.searchTerm && !villageName.includes(this.searchTerm)) {
                section.classList.add('hidden');
                return;
            }

            // Filter by time
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

            // Show/hide village section based on visible buses
            if (visibleBubbles > 0) {
                section.classList.remove('hidden');
                hasVisibleContent = true;
            } else {
                section.classList.add('hidden');
            }

            // Update bus count display
            const busCount = section.querySelector('.bus-count');
            if (busCount) {
                busCount.textContent = `${visibleBubbles} bus${visibleBubbles !== 1 ? 'es' : ''}`;
            }
        });

        // Show empty state if no content
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            if (hasVisibleContent) {
                emptyState.classList.add('hidden');
            } else {
                emptyState.classList.remove('hidden');
                emptyState.innerHTML = `
                    <i class="bi bi-search"></i>
                    <h3>No buses found</h3>
                    <p>Try changing your filters or search term</p>
                `;
            }
        }

        // Update active letter highlight after filtering
        setTimeout(() => this.highlightActiveLetter(), 100);
    }

    getTimeCategory(timeString) {
        const [hours] = timeString.split(':').map(Number);

        if (hours >= 5 && hours < 12) return 'morning';
        if (hours >= 12 && hours < 17) return 'afternoon';
        if (hours >= 17 && hours < 22) return 'evening';
        return 'night';
    }

    highlightNextBus() {
        const currentIST = this.currentTime;
        const currentHours = currentIST.getHours();
        const currentMinutes = currentIST.getMinutes();

        // Remove existing "NEXT" badges
        document.querySelectorAll('.next-badge').forEach(badge => badge.remove());

        const allBubbles = Array.from(document.querySelectorAll('.time-bubble:not(.hidden)'));
        const upcomingBubbles = [];

        allBubbles.forEach(bubble => {
            const [hours, minutes] = bubble.dataset.time.split(':').map(Number);
            const bubbleTime = new Date();
            bubbleTime.setHours(hours, minutes, 0, 0);

            // If bubble time is in the future
            if (bubbleTime > currentIST) {
                upcomingBubbles.push({
                    bubble,
                    time: bubbleTime,
                    timeDiff: bubbleTime - currentIST
                });
            }
        });

        // Sort by time difference
        upcomingBubbles.sort((a, b) => a.timeDiff - b.timeDiff);

        // Add "NEXT" badge to the earliest upcoming bus
        if (upcomingBubbles.length > 0) {
            const nextBus = upcomingBubbles[0].bubble;
            const badge = document.createElement('div');
            badge.className = 'next-badge';
            badge.textContent = 'NEXT';
            nextBus.appendChild(badge);

            // Announce next bus
            const [hours, minutes] = nextBus.dataset.time.split(':');
            const village = nextBus.closest('.village-section').querySelector('.village-name').textContent;
            console.log(`🚍 Next bus: ${village} at ${hours}:${minutes}`);
        }
    }

    initTimeClick() {
        document.addEventListener('click', (e) => {
            const timeBubble = e.target.closest('.time-bubble');
            if (timeBubble) {
                const time = timeBubble.dataset.time;
                const village = timeBubble.closest('.village-section').querySelector('.village-name').textContent;
                this.showBusDetails(time, village);
            }
        });
    }

    showBusDetails(time, village) {
        const [hours, minutes] = time.split(':').map(Number);
        const timeCategory = this.getTimeCategory(time);

        const categoryNames = {
            morning: '🌅 Morning',
            afternoon: '☀️ Afternoon',
            evening: '🌇 Evening',
            night: '🌙 Night'
        };

        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const period = categoryNames[timeCategory];

        const message = `🚌 **Bus Details**\n\n📍 **Village:** ${village}\n🕐 **Time:** ${formattedTime}\n${period}\n\n💡 *Please arrive 15 minutes before departure*\n✅ *Seats available on first-come basis*`;

        alert(message);
    }

    initBackButton() {
        const backButton = document.querySelector('.back-btn');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = 'index.html';
                }
            });
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: #DB2777;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 2000;
                animation: slideIn 0.3s ease;
                font-family: 'Poppins', sans-serif;
                font-weight: 600;
            ">
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.busApp = new BusTimetableApp();

    // Add notification style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translate(-50%, -20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translate(-50%, 0);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -20px);
            }
        }
    `;
    document.head.appendChild(style);
});

// Service Worker for offline functionality
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}