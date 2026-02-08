// URL Constants - Auto-generated from assets/urls/
window.URL_CONSTANTS = {
  "CHANDRAPURBUSSTAND": "https://msrtcbusinfo.org/nagpur_div/chandrapur_dist/chandrapur_teh/chandrapur_bus_stand_depot/",
  "GHUGUSBUSSTAND": "https://msrtcbusinfo.org/nagpur_div/chandrapur_dist/chandrapur_teh/ghugus_bus_stand_depot/",
  "BALLARPURBUSSTAND": "https://msrtcbusinfo.org/nagpur_div/chandrapur_dist/ballarpur_teh/ballarpur_bus_stand_depot/",
  "NAGPURBUSSTAND": "https://msrtcbusinfo.org/nagpur_div/nagpur_dist/nagpur_teh/nagpur_bus_stand_depot/",
  "MSRTCOFFICIAL": "https://msrtc.maharashtra.gov.in",
  "MSRTCBOOKING": "https://msrtc.maharashtra.gov.in/booking/ticket_booking.html",
  "MSRTCCONTACT": "https://msrtc.maharashtra.gov.in/contact_us.html"
};

// Function to get URL from constant
window.getUrlFromConstant = function(constantName) {
    if (window.URL_CONSTANTS && window.URL_CONSTANTS[constantName]) {
        return window.URL_CONSTANTS[constantName];
    }
    console.warn('URL constant not found:', constantName);
    return '#';
};

// Function to handle blog link clicks
window.handleBlogLinkClick = function(event) {
    const link = event.currentTarget;
    const constantName = link.dataset.constant;

    if (constantName) {
        const url = window.getUrlFromConstant(constantName);
        if (url && url !== '#') {
            window.open(url, '_blank', 'noopener,noreferrer');
            event.preventDefault();
            return false;
        }
    }
    return true;
};

// Initialize blog links after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to all blog links with data-constant attribute
    document.querySelectorAll('.blog-link[data-constant]').forEach(function(link) {
        link.addEventListener('click', window.handleBlogLinkClick);
    });

    console.log('URL constants initialized with', Object.keys(window.URL_CONSTANTS || {}).length, 'constants');
});