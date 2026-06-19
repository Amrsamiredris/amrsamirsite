import { supabase } from './supabase.js';

// Generate a random session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('ase_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('ase_session_id', sessionId);
  }
  return sessionId;
}

const sessionId = getSessionId();

// Helper to log event
export async function logEvent(type, label = '', duration = 0) {
  try {
    // Avoid tracking admin activities
    if (type !== 'contact_inquiry' && (window.location.hash.startsWith('#admin') || localStorage.getItem('admin_role'))) {
      return;
    }
    
    // Fallback if supabase isn't initialized yet
    if (!supabase) return;

    await supabase.from('analytics_events').insert([
      {
        session_id: sessionId,
        event_type: type,
        event_label: label,
        duration: Math.round(duration)
      }
    ]);
  } catch (error) {
    console.warn('Analytics logging failed:', error);
  }
}

// Track session init (referrer, device class, country)
async function logSessionInit() {
  try {
    // Check if session has already been initialized in this session to prevent duplicate logs on refresh
    const isFirstTime = !sessionStorage.getItem('ase_session_initialized');
    if (!isFirstTime) return;
    
    sessionStorage.setItem('ase_session_initialized', 'true');
    
    // 1. Get Referrer
    const ref = document.referrer;
    let referrerHost = 'Direct / Bookmark';
    if (ref) {
      try {
        const url = new URL(ref);
        referrerHost = url.hostname;
        // Clean up common referrer hosts
        if (referrerHost.includes('google.')) referrerHost = 'Google Search';
        else if (referrerHost.includes('bing.')) referrerHost = 'Bing Search';
        else if (referrerHost.includes('linkedin.')) referrerHost = 'LinkedIn';
        else if (referrerHost.includes('github.')) referrerHost = 'GitHub';
      } catch (e) {
        referrerHost = ref;
      }
    }
    
    // 2. Get Device Class
    let deviceClass = 'Desktop';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      deviceClass = 'Tablet';
    } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
      deviceClass = 'Mobile';
    }
    
    // 3. Get Location
    let country = 'Unknown';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        country = data.country_name || data.country || 'Unknown';
      }
    } catch (e) {
      const lang = navigator.language || navigator.userLanguage;
      if (lang) country = `Unknown (${lang})`;
    }
    
    const info = {
      referrer: referrerHost,
      device: deviceClass,
      country: country,
      screen: `${window.screen.width}x${window.screen.height}`
    };
    
    // Delay slightly to let main thread finish DOM operations
    setTimeout(() => {
      logEvent('session_init', JSON.stringify(info));
    }, 500);
  } catch (err) {
    console.warn('Session initialization logging failed:', err);
  }
}

// Track page load
window.addEventListener('DOMContentLoaded', () => {
  logEvent('pageview', window.location.pathname);
  logSessionInit();
  setupSectionTracking();
  setupClickTracking();
});

// Section visibility tracker using IntersectionObserver
let visibleSections = {};

function setupSectionTracking() {
  const sectionsToTrack = [
    { selector: '.hero', name: 'Hero / Contact Card' },
    { selector: '#experience-section', name: 'Experiences Grid' },
    { selector: '#cv-viewer-section', name: 'CV Viewer' },
    { selector: '#portfolio-viewer-section', name: 'Portfolio Viewer' }
  ];

  const observerOptions = {
    root: null,
    threshold: 0.3 // Trigger when 30% of the section is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const targetName = entry.target.dataset.trackName;
      if (entry.isIntersecting) {
        // Section became visible
        visibleSections[targetName] = Date.now();
      } else {
        // Section became invisible, calculate duration and log
        if (visibleSections[targetName]) {
          const durationMs = Date.now() - visibleSections[targetName];
          const durationSec = durationMs / 1000;
          if (durationSec > 1) { // Only track if spent more than 1 second
            logEvent('section_view', targetName, durationSec);
          }
          delete visibleSections[targetName];
        }
      }
    });
  }, observerOptions);

  sectionsToTrack.forEach(sec => {
    const el = document.querySelector(sec.selector);
    if (el) {
      el.dataset.trackName = sec.name;
      observer.observe(el);
    }
  });

  // Flush remaining visible sections before unload
  window.addEventListener('beforeunload', () => {
    for (const [name, startTime] of Object.entries(visibleSections)) {
      const durationSec = (Date.now() - startTime) / 1000;
      if (durationSec > 1) {
        // Use keepalive fetch if native navigator.sendBeacon is not customized,
        // but since we call Supabase, we do a quick async log (will fire asynchronously, best-effort)
        logEvent('section_view', name, durationSec);
      }
    }
  });
}

// Track button clicks
function setupClickTracking() {
  const trackMap = [
    { id: 'btn-view-cv', type: 'pdf_view', label: 'CV' },
    { id: 'btn-download-cv', type: 'pdf_download', label: 'CV' },
    { id: 'btn-view-portfolio', type: 'pdf_view', label: 'Portfolio' },
    { id: 'btn-download-portfolio', type: 'pdf_download', label: 'Portfolio' },
    { id: 'cv-mobile-link', type: 'pdf_view_mobile', label: 'CV' },
    { id: 'portfolio-mobile-link', type: 'pdf_view_mobile', label: 'Portfolio' },
    { id: 'client-email', type: 'click_email', label: 'Hero Email' },
    { id: 'client-phone', type: 'click_phone', label: 'Hero Phone' },
    { id: 'client-linkedin', type: 'click_linkedin', label: 'Hero LinkedIn' },
    { id: 'footer-email-btn', type: 'click_email', label: 'Footer Email' },
    { id: 'footer-linkedin-btn', type: 'click_linkedin', label: 'Footer LinkedIn' },
    { id: 'btn-download-vcard', type: 'click_vcard', label: 'vCard Download' },
    { id: 'btn-qr-download-vcard', type: 'click_vcard', label: 'QR vCard Download' },
    { id: 'btn-show-qr', type: 'click_qr_modal', label: 'Show QR Code' }
  ];

  trackMap.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.addEventListener('click', () => {
        logEvent(item.type, item.label);
      });
    }
  });
}
