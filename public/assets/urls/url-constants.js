window.URL_CONSTANTS = {
  "CHANDRAPURBUSSTAND": "https://msrtcbusinfo.org/nagpur_div/chandrapur_dist/chandrapur_teh/chandrapur_bus_stand_depot/",
  "GHUGUSBUSSTAND": "https://msrtcbusinfo.org/nagpur_div/chandrapur_dist/chandrapur_teh/ghugus_bus_stand_depot/",
  "BALLARPURBUSSTAND": "https://msrtcbusinfo.org/nagpur_div/chandrapur_dist/ballarpur_teh/ballarpur_bus_stand_depot/",
  "NAGPURBUSSTAND": "https://msrtcbusinfo.org/nagpur_div/nagpur_dist/nagpur_teh/nagpur_bus_stand_depot/",
  "MSRTCOFFICIAL": "https://msrtc.maharashtra.gov.in",
  "MSRTCBOOKING": "https://msrtc.maharashtra.gov.in/booking/ticket_booking.html",
  "MSRTCCONTACT": "https://msrtc.maharashtra.gov.in/contact_us.html"
};
window.getUrlFromConstant = function(c){ return window.URL_CONSTANTS[c] || '#'; };
window.handleBlogLinkClick = function(e){ const c = e.currentTarget.dataset.constant; if(c){ const url = window.getUrlFromConstant(c); if(url && url!=='#'){ window.open(url, '_blank', 'noopener,noreferrer'); e.preventDefault(); return false; } } return true; };
document.addEventListener('DOMContentLoaded', function(){ document.querySelectorAll('.blog-link[data-constant]').forEach(function(link){ link.addEventListener('click', window.handleBlogLinkClick); }); console.log('URL constants initialized with', Object.keys(window.URL_CONSTANTS || {}).length, 'constants'); });