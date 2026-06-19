import { supabase } from './supabase.js';

// Fallback dataset representing Amr Samir Edris's actual portfolio details
const FALLBACK_EXPERIENCES = [
  {
    id: "def-game-expo-2026",
    role: "Projects Manager",
    company: "Zawaya Group (DEF GameExpo 2026)",
    location: "Dubai, UAE",
    date_range: "2026",
    category: "Gaming & Esports",
    description: "Main Project Lead for the Dubai Esports & Games Festival (DET / Visit Dubai). Directed full event lifecycle covering concept development, client briefings, budget allocations, and vendor logistics.",
    details: [
      "Led production planning and weekly alignment with government client DET, Eventify, Gamers Hub, and Tech X Hub.",
      "Built Run-of-Show, activities workbook, and talent scheduling across hosts.",
      "Managed stage, technical production crew, and vendor coordination across 4+ partner agencies.",
      "Author of the original proposal, concept deck, and BOQ."
    ],
    impact_metrics: { val1: "50K+", lbl1: "Projected Attendees", val2: "4+", lbl2: "Partner Agencies" },
    order_index: 0
  },
  {
    id: "mefcc-gaming-arena-2025",
    role: "Projects Manager",
    company: "Zawaya Group (MEFCC Gaming Arena 2025)",
    location: "Abu Dhabi, UAE",
    date_range: "2025",
    category: "Gaming & Esports",
    description: "Project Lead and Stage Manager for a 3-day live gaming stage at Abu Dhabi's largest pop-culture event, Middle East Film & Comic Con.",
    details: [
      "Designed and ran the full activities program: trivia, Tekken Showdown, Nations Cup, Mario Kart, and Class Warfare.",
      "Managed international esports talent, hosts, and stage content across 3 days.",
      "Delivered 28 hours of live stage content with zero downtime."
    ],
    impact_metrics: { val1: "25K+", lbl1: "Footfall", val2: "1K+", lbl2: "Esports Players" },
    order_index: 1
  },
  {
    id: "ea-sports-fc-2025",
    role: "Project Lead & Content Manager",
    company: "Zawaya Group (EA Sports FC)",
    location: "KSA & UAE",
    date_range: "2025",
    category: "Gaming & Esports",
    description: "Flagship MENA Ramadan IP for EA Sports FC. Owned the full project lifecycle, influencer campaign, marketing, and broadcast delivery.",
    details: [
      "Directed final studio broadcast and managed remote production team.",
      "Coordinated content strategy and influencer collaborations for top regional creators.",
      "Oversaw tournament hosting with over 25,000 active participants."
    ],
    impact_metrics: { val1: "25K+", lbl1: "Players", val2: "AED 10M+", lbl2: "Social Budget Value" },
    order_index: 2
  },
  {
    id: "expo-2020-dubai",
    role: "Event Manager",
    company: "Expo 2020 Dubai",
    location: "Dubai, UAE",
    date_range: "2021 - 2022",
    category: "Government & Cultural",
    description: "Managed end-to-end event coordination across 100+ live concerts and cultural events over six months at the world's largest Expo.",
    details: [
      "Supervised logistics, staffing, VIP and protocol guest management for government and diplomatic attendees.",
      "Ensured full compliance with HSE, venue regulations, and security standards.",
      "Managed real-time operational troubleshooting for high-profile daily events with zero incidents."
    ],
    impact_metrics: { val1: "100+", lbl1: "Live Concerts", val2: "192", lbl2: "Country Pavilions" },
    order_index: 3
  },
  {
    id: "fp7-mccann-senior-manager",
    role: "Senior Account Manager Digital & Events",
    company: "FP7 McCann",
    location: "Cairo & Dubai",
    date_range: "2022 - 2024",
    category: "Government & Cultural",
    description: "Managed 10+ major brand accounts simultaneously, presenting strategies and performance analytics reports to C-level stakeholders.",
    details: [
      "Handled Egypt's Ministry of Tourism & Antiquities (Experience Egypt) global campaign account across 13 languages.",
      "Oversaw media and campaign budgets exceeding $10M USD across multi-industry accounts.",
      "Produced analytics reports using Talkwalker, Brandwatch, HubSpot, and Google Analytics."
    ],
    impact_metrics: { val1: "$10M+", lbl1: "Campaign Budget", val2: "13", lbl2: "Languages Managed" },
    order_index: 4
  },
  {
    id: "el-gouna-film-festival",
    role: "Event Operations Support",
    company: "El Gouna Film Festival",
    location: "El Gouna, Egypt",
    date_range: "2021",
    category: "Film Festivals",
    description: "Supported festival-scale logistics, artist hospitality, and on-ground venue operations for one of MENA's flagship international film festivals.",
    details: [
      "Coordinated guest logistics and hospitality operations for international filmmakers and VIPs.",
      "Supported backstage stage coordination and program execution schedules.",
      "Ensured smooth flow of attendees across multiple screening venues."
    ],
    impact_metrics: { val1: "10K+", lbl1: "Festival Guests", val2: "15+", lbl2: "Screening Venues" },
    order_index: 5
  },
  {
    id: "gha-meeting-kuwait",
    role: "Content & Stage Manager",
    company: "Zawaya Events (15th GHA Meeting)",
    location: "Kuwait",
    date_range: "2024",
    category: "Medical & Healthcare",
    description: "Annual cardiology conference for the Gulf region, in collaboration with KHF, managing international speakers and professional medical program.",
    details: [
      "Owned conference content development, speech scheduling, and live stage management.",
      "Managed speaker registration and cross-border travel logistics.",
      "Delivered professional medical tone and protocol alignment throughout the event."
    ],
    impact_metrics: { val1: "500+", lbl1: "Medical Delegates", val2: "100%", lbl2: "Protocol Compliance" },
    order_index: 6
  }
];

const FALLBACK_LOGOS = [
  { name: "COP28 Dubai" },
  { name: "Expo 2020 Dubai" },
  { name: "Formula 1 Abu Dhabi" },
  { name: "DET Visit Dubai" },
  { name: "Louvre Abu Dhabi" },
  { name: "EA Sports" },
  { name: "Sony" },
  { name: "Emaar" },
  { name: "FP7 McCann" },
  { name: "McDonald's" }
];

const FALLBACK_CONTENT = {
  name: "Amr Samir Edris",
  titles: ["immersive experiences.", "large-scale productions.", "brand campaigns."],
  summary: "Senior Project Manager with 5+ years of experience delivering mega events, large-scale government productions, and digital marketing campaigns across the MENA region.",
  email: "amrsamiredris@gmail.com",
  phone: "+971542191028",
  linkedin: "https://linkedin.com/in/amrsamiredris",
  cv_url: "",
  portfolio_url: "",
  status_badge: "Available for Projects"
};

// Global states
let experiences = [];
let siteContent = {};
let activeTitles = [];
let rotatorTimer = null;
let activeFilterCategory = 'all';
let activeFilterYear = 'all';
let activeFilterBudget = 0;
let activePitch = null;

const FALLBACK_CREW = [
  { id: "1", role: "Project Director", name: "Amr Samir Edris", level: 1 },
  { id: "2", role: "Event Ops Manager", name: "Sarah Collins", level: 2 },
  { id: "3", role: "Technical Director", name: "Marcus Vance", level: 2 },
  { id: "4", role: "Stage Manager", name: "Elena Rostova", level: 3 },
  { id: "5", role: "Backstage Lead", name: "Tariq Mahmood", level: 3 },
  { id: "6", role: "Logistics Lead", name: "Yuki Tanaka", level: 3 }
];

// Initializer
document.addEventListener('DOMContentLoaded', async () => {
  initializeTheme();
  await loadContent();
  await loadExperiences();
  setupHashRouting();
  renderLogoMarquee();
  setupInteractivity();
  setupvCardAndQR();
  setupTimelineSlider();
  setupBudgetSlider();
  renderAvailabilityCalendar();
  renderCrewStructure();
  setupScrollTop();
});

window.addEventListener('hashchange', setupHashRouting);

function setupHashRouting() {
  const hash = window.location.hash;
  if (hash === '#admin' || hash.startsWith('#admin/')) {
    document.body.classList.add('admin-mode');
    if (window.initializeAdminPanel) {
      window.initializeAdminPanel();
    }
  } else {
    document.body.classList.remove('admin-mode');
    
    if (hash.startsWith('#pitch/')) {
      const slug = hash.substring('#pitch/'.length);
      const pitches = siteContent.pitches || [];
      const pitch = pitches.find(p => p.slug === slug);
      
      if (pitch) {
        activePitch = pitch;
        const bannerContainer = document.getElementById('pitch-banner-container');
        if (bannerContainer) {
          bannerContainer.innerHTML = `
            <div class="pitch-banner-card">
              <div class="pitch-banner-content">
                <h4>Welcome, ${pitch.title} Team</h4>
                <p>${pitch.greeting}</p>
              </div>
              <button class="pitch-close-btn" id="btn-close-pitch-banner" style="font-size: 1.5rem; color: var(--text-muted);">&times;</button>
            </div>
          `;
          bannerContainer.style.display = 'block';
          
          document.getElementById('btn-close-pitch-banner').addEventListener('click', () => {
            activePitch = null;
            bannerContainer.style.display = 'none';
            window.location.hash = '';
            filterAndRenderExperiences();
          });
        }
      } else {
        activePitch = null;
        const bannerContainer = document.getElementById('pitch-banner-container');
        if (bannerContainer) bannerContainer.style.display = 'none';
      }
    } else {
      activePitch = null;
      const bannerContainer = document.getElementById('pitch-banner-container');
      if (bannerContainer) bannerContainer.style.display = 'none';
    }
    
    filterAndRenderExperiences();
  }
}

// Light & Dark theme toggle controller
function initializeTheme() {
  const savedTheme = localStorage.getItem('apple-portfolio-theme');
  const toggleBtn = document.getElementById('btn-theme-toggle');
  
  // Default to dark theme if not set
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.add('dark-theme');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('apple-portfolio-theme', 'light');
      } else {
        document.body.classList.add('dark-theme');
        localStorage.setItem('apple-portfolio-theme', 'dark');
      }
    });
  }
}

// Fetch database site settings
async function loadContent() {
  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { data, error } = await supabase
      .from('site_content')
      .select('*');
      
    if (error || !data || data.length === 0) {
      siteContent = FALLBACK_CONTENT;
    } else {
      siteContent = {};
      data.forEach(item => {
        siteContent[item.key] = item.value;
      });
      siteContent = { ...FALLBACK_CONTENT, ...siteContent };
    }
  } catch (err) {
    siteContent = FALLBACK_CONTENT;
  }
  
  // Render general profile texts
  document.getElementById('client-summary').textContent = siteContent.summary;
  
  const emailEl = document.getElementById('client-email');
  emailEl.querySelector('span').textContent = siteContent.email;
  emailEl.href = `mailto:${siteContent.email}`;
  
  document.getElementById('client-phone').querySelector('span').textContent = siteContent.phone;
  
  const linkedinEl = document.getElementById('client-linkedin');
  linkedinEl.querySelector('span').textContent = siteContent.linkedin.replace('https://', '').replace('www.', '');
  linkedinEl.href = siteContent.linkedin;

  // Render Availability Status badge
  const statusBadgeVal = siteContent.status_badge || 'Available for Projects';
  document.getElementById('status-badge-text').textContent = statusBadgeVal;
  
  const statusDot = document.getElementById('status-badge-dot');
  if (statusBadgeVal === 'Fully Booked') {
    statusDot.style.backgroundColor = '#ff3b30'; // red
  } else if (statusBadgeVal === 'Open for Hiring') {
    statusDot.style.backgroundColor = '#ff9500'; // orange
  } else {
    statusDot.style.backgroundColor = '#34c759'; // green
  }

  // Setup rotating text words
  activeTitles = Array.isArray(siteContent.titles) ? siteContent.titles : siteContent.titles.split(',').map(t => t.trim());
  setupTitleRotator();

  // Load document PDF links
  setupFileLinks();
}

async function setupFileLinks() {
  let cvUrl = siteContent.cv_url;
  let portfolioUrl = siteContent.portfolio_url;

  try {
    if (supabase && (!cvUrl || !portfolioUrl)) {
      const { data: cvData } = supabase.storage.from('assets').getPublicUrl('cv.pdf');
      const { data: portData } = supabase.storage.from('assets').getPublicUrl('portfolio.pdf');
      
      if (cvData?.publicUrl) cvUrl = cvData.publicUrl;
      if (portData?.publicUrl) portfolioUrl = portData.publicUrl;
    }
  } catch (e) {
    console.log("Supabase storage error, using local assets folder fallbacks.");
  }

  const finalCvUrl = cvUrl || './assets/cv.pdf';
  const finalPortUrl = portfolioUrl || './assets/portfolio.pdf';

  document.getElementById('btn-download-cv').href = finalCvUrl;
  document.getElementById('btn-download-portfolio').href = finalPortUrl;
  
  document.getElementById('cv-mobile-link').href = finalCvUrl;
  document.getElementById('portfolio-mobile-link').href = finalPortUrl;

  document.getElementById('btn-view-cv').dataset.url = finalCvUrl;
  document.getElementById('btn-view-portfolio').dataset.url = finalPortUrl;
}

// Subtitle Rotating words controller
function setupTitleRotator() {
  const wrapper = document.querySelector('.hero-rotating-wrap');
  if (!wrapper) return;

  wrapper.innerHTML = '';
  
  activeTitles.forEach((title, idx) => {
    const div = document.createElement('div');
    div.className = `rotating-item ${idx === 0 ? 'active' : ''}`;
    div.id = `rotator-${idx}`;
    div.textContent = title;
    wrapper.appendChild(div);
  });

  if (rotatorTimer) clearInterval(rotatorTimer);
  
  let currentIdx = 0;
  
  rotatorTimer = setInterval(() => {
    const activeEl = document.getElementById(`rotator-${currentIdx}`);
    if (activeEl) {
      activeEl.className = 'rotating-item exit';
    }
    
    currentIdx = (currentIdx + 1) % activeTitles.length;
    
    const nextEl = document.getElementById(`rotator-${currentIdx}`);
    if (nextEl) {
      nextEl.className = 'rotating-item active';
    }
    
    // Clear exit state classes after transition
    setTimeout(() => {
      activeTitles.forEach((_, idx) => {
        if (idx !== currentIdx) {
          const el = document.getElementById(`rotator-${idx}`);
          if (el) el.className = 'rotating-item';
        }
      });
    }, 350);
    
  }, 3200);
}

// Load experiences grid
async function loadExperiences() {
  try {
    if (!supabase) throw new Error('Supabase connection unavailable');
    
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .order('order_index', { ascending: true });
      
    if (error || !data || data.length === 0) {
      experiences = FALLBACK_EXPERIENCES;
    } else {
      experiences = data;
    }
  } catch (err) {
    experiences = FALLBACK_EXPERIENCES;
  }
  
  filterAndRenderExperiences();
}

// Multi-dimensional filtering logic (Category + Year range slider + Budget Scale)
function filterAndRenderExperiences() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Filter list
  const filtered = experiences.filter(exp => {
    // Pitch Mode check
    if (activePitch && activePitch.project_ids) {
      if (!activePitch.project_ids.includes(exp.id)) {
        return false;
      }
    }
    
    // 1. Category check
    const matchesCategory = activeFilterCategory === 'all' || exp.category === activeFilterCategory;
    
    // 2. Year check
    let matchesYear = true;
    if (activeFilterYear !== 'all') {
      matchesYear = exp.date_range.includes(activeFilterYear) || 
                    (activeFilterYear === '2023' && exp.date_range.includes('2022 - 2024')) ||
                    (activeFilterYear === '2023' && exp.id === 'fp7-mccann-senior-manager');
    }
    
    // 3. Budget check
    const budgetLimit = activeFilterBudget;
    const expBudget = parseFloat(exp.budget_usd) || 0;
    const matchesBudget = expBudget >= budgetLimit;
    
    return matchesCategory && matchesYear && matchesBudget;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 48px; color: var(--text-muted); font-size: 0.95rem;">No projects active matching these criteria.</div>`;
    return;
  }

  filtered.forEach((exp, idx) => {
    const card = document.createElement('div');
    
    // Apple Bento grid layout spans
    let bentoClass = 'apple-bento-cell';
    if (idx === 0 || idx === 3 || idx === 6) {
      bentoClass = 'apple-bento-cell apple-bento-cell-full';
    }
    
    card.className = bentoClass;
    card.dataset.id = exp.id;
    
    const summaryText = exp.description || '';
    
    card.innerHTML = `
      <div>
        <div class="cell-header-row">
          <span class="cell-badge">${exp.category}</span>
          <span class="cell-date">${exp.date_range}</span>
        </div>
        <div class="cell-body">
          <h3>${exp.role}</h3>
          <div class="cell-company">${exp.company}</div>
          <p class="cell-desc">${summaryText}</p>
        </div>
      </div>
      
      <div class="cell-metrics-box">
        <div class="cell-metric-item">
          <span class="cell-metric-number">${exp.impact_metrics?.val1 || 'Active'}</span>
          <span class="cell-metric-name">${exp.impact_metrics?.lbl1 || 'Status'}</span>
        </div>
        <div class="cell-metric-item">
          <span class="cell-metric-number">${exp.impact_metrics?.val2 || 'N/A'}</span>
          <span class="cell-metric-name">${exp.impact_metrics?.lbl2 || 'Metric'}</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => openDetailModal(exp));
    grid.appendChild(card);
  });
}

// Render infinite brand marquee
function renderLogoMarquee() {
  const marquee = document.getElementById('logo-marquee');
  if (!marquee) return;
  
  marquee.innerHTML = '';
  
  const logos = FALLBACK_LOGOS;
  const tripleLogos = [...logos, ...logos, ...logos];
  
  tripleLogos.forEach(logo => {
    const div = document.createElement('div');
    div.className = 'marquee-tag';
    div.innerHTML = `<span>${logo.name}</span>`;
    marquee.appendChild(div);
  });
}

// Helper to compute months dynamically
function getUpcomingMonths() {
  const months = [];
  const d = new Date();
  for (let i = 0; i < 4; i++) {
    const next = new Date(d.getFullYear(), d.getMonth() + i, 1);
    const label = next.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push(label);
  }
  return months;
}

// Render live availability calendar
function renderAvailabilityCalendar() {
  const grid = document.getElementById('calendar-widget-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  const months = getUpcomingMonths();
  const dbStatus = siteContent.calendar_status || {};
  
  months.forEach(month => {
    const status = dbStatus[month] || 'Available';
    const statusClass = status.toLowerCase().replace(' ', '-');
    let cssClass = 'available';
    if (statusClass.includes('booked')) cssClass = 'booked';
    else if (statusClass.includes('tentative')) cssClass = 'tentative';
    
    const item = document.createElement('div');
    item.className = `calendar-month-item ${cssClass}`;
    item.innerHTML = `
      <div class="calendar-month-name">${month}</div>
      <div class="calendar-month-status">${status}</div>
    `;
    grid.appendChild(item);
  });
}

// Render Crew hierarchy tree chart
function renderCrewStructure() {
  const root = document.getElementById('crew-tree-root');
  if (!root) return;
  
  root.innerHTML = '';
  const crew = siteContent.crew_structure || FALLBACK_CREW;
  
  // Group by level
  const levels = {};
  crew.forEach(node => {
    const lvl = parseInt(node.level) || 3;
    if (!levels[lvl]) levels[lvl] = [];
    levels[lvl].push(node);
  });
  
  // Sort levels ascending
  const sortedLevelKeys = Object.keys(levels).sort((a, b) => a - b);
  
  sortedLevelKeys.forEach((lvlKey, idx) => {
    const levelDiv = document.createElement('div');
    levelDiv.className = 'crew-tree-level';
    if (idx > 0) {
      levelDiv.classList.add('crew-tree-level-children');
    }
    
    levels[lvlKey].forEach(node => {
      const nodeDiv = document.createElement('div');
      nodeDiv.className = 'crew-tree-node';
      nodeDiv.innerHTML = `
        <div class="crew-node-role">${node.role}</div>
        <div class="crew-node-name">${node.name}</div>
      `;
      levelDiv.appendChild(nodeDiv);
    });
    
    root.appendChild(levelDiv);
  });
}

// Dynamic vCard generator and QR modal handler
function setupvCardAndQR() {
  const downloadBtn = document.getElementById('btn-download-vcard');
  const qrDownloadBtn = document.getElementById('btn-qr-download-vcard');
  const showQrBtn = document.getElementById('btn-show-qr');
  const closeQrBtn = document.getElementById('btn-close-qr-modal');
  const qrModal = document.getElementById('qr-modal');
  const qrImg = document.getElementById('qr-code-img');
  
  function getVCardContent() {
    const name = siteContent.name || 'Amr Samir Edris';
    const email = siteContent.email || 'amrsamiredris@gmail.com';
    const phone = siteContent.phone || '+971542191028';
    const linkedin = siteContent.linkedin || 'https://linkedin.com/in/amrsamiredris';
    
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${name}
ORG:Zawaya Group
TITLE:Senior Project Manager
TEL;TYPE=CELL,VOICE:${phone}
EMAIL;TYPE=PREF,INTERNET:${email}
URL:${window.location.origin}
X-SOCIALPROFILE;TYPE=linkedin:${linkedin}
END:VCARD`;
  }
  
  function triggerDownload() {
    const vcardData = getVCardContent();
    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Amr_Samir_Edris.vcf';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', triggerDownload);
  }
  
  if (qrDownloadBtn) {
    qrDownloadBtn.addEventListener('click', triggerDownload);
  }
  
  if (showQrBtn && qrModal && qrImg) {
    showQrBtn.addEventListener('click', () => {
      const vcard = getVCardContent();
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(vcard)}`;
      qrImg.src = qrUrl;
      qrModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (closeQrBtn && qrModal) {
    closeQrBtn.addEventListener('click', () => {
      qrModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
  
  if (qrModal) {
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) {
        qrModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
}

// Interactive Apple timeline slider
function setupTimelineSlider() {
  const slider = document.getElementById('timeline-range-input');
  const sliderVal = document.getElementById('timeline-slider-val');
  const ticksContainer = document.getElementById('timeline-ticks-container');
  
  if (!slider || !sliderVal || !ticksContainer) return;
  
  // Listen to slider shifts
  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    updateTimelineSelection(val);
  });
  
  // Listen to label clicks
  ticksContainer.addEventListener('click', (e) => {
    const tick = e.target.closest('.timeline-tick-label');
    if (tick) {
      const year = tick.dataset.year;
      if (year === 'all') {
        slider.value = 2020;
        updateTimelineSelection(2020);
      } else {
        slider.value = parseInt(year);
        updateTimelineSelection(parseInt(year));
      }
    }
  });

  function updateTimelineSelection(val) {
    // Reset active tick labels
    const labels = ticksContainer.querySelectorAll('.timeline-tick-label');
    labels.forEach(lbl => lbl.classList.remove('active'));
    
    if (parseInt(val) === 2020) {
      activeFilterYear = 'all';
      sliderVal.textContent = 'All Operations';
      ticksContainer.querySelector('[data-year="all"]').classList.add('active');
    } else {
      activeFilterYear = val.toString();
      sliderVal.textContent = `Operations in ${val}`;
      const matchingTick = ticksContainer.querySelector(`[data-year="${val}"]`);
      if (matchingTick) {
        matchingTick.classList.add('active');
      }
    }
    
    filterAndRenderExperiences();
  }
}

// Budget Filter Slider
function setupBudgetSlider() {
  const slider = document.getElementById('budget-range-input');
  const sliderVal = document.getElementById('budget-slider-val');
  const ticksContainer = document.getElementById('budget-ticks-container');
  
  if (!slider || !sliderVal || !ticksContainer) return;
  
  slider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    updateBudgetSelection(val);
  });
  
  ticksContainer.addEventListener('click', (e) => {
    const tick = e.target.closest('.timeline-tick-label');
    if (tick) {
      const budget = parseFloat(tick.dataset.budget);
      slider.value = budget;
      updateBudgetSelection(budget);
    }
  });

  function updateBudgetSelection(val) {
    const labels = ticksContainer.querySelectorAll('.timeline-tick-label');
    labels.forEach(lbl => lbl.classList.remove('active'));
    
    activeFilterBudget = val;
    
    // Find closest tick label to highlight
    let closestTick = null;
    let minDiff = Infinity;
    labels.forEach(lbl => {
      const tickVal = parseFloat(lbl.dataset.budget);
      const diff = Math.abs(tickVal - val);
      if (diff < minDiff) {
        minDiff = diff;
        closestTick = lbl;
      }
    });
    if (closestTick) {
      closestTick.classList.add('active');
    }

    if (val === 0) {
      sliderVal.textContent = 'Show All Budgets';
    } else if (val >= 10) {
      sliderVal.textContent = 'Mega Budgets (>$10M USD)';
    } else {
      sliderVal.textContent = `Budgets >$${val}M USD`;
    }
    
    filterAndRenderExperiences();
  }
}

// Modal popups for Case details
function openDetailModal(exp) {
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('modal-body-content');
  if (!modal || !content) return;
  
  const detailsList = Array.isArray(exp.details) 
    ? exp.details 
    : (typeof exp.details === 'string' ? JSON.parse(exp.details) : []);

  let bulletsHtml = '';
  detailsList.forEach(bullet => {
    bulletsHtml += `<li>${bullet.replace(/^-\s*/, '')}</li>`;
  });
  
  content.innerHTML = `
    <span class="cell-badge" style="display: inline-block; margin-bottom: 16px;">${exp.category}</span>
    <h2>${exp.role}</h2>
    <div class="modal-metadata-line">
      <span class="modal-company-title">${exp.company}</span>
      <span>&bull;</span>
      <span>${exp.location || ''}</span>
      <span>&bull;</span>
      <span>${exp.date_range}</span>
      ${parseFloat(exp.budget_usd) > 0 ? `<span>&bull;</span> <span>$${exp.budget_usd}M Budget</span>` : ''}
    </div>
    
    <div class="modal-grid-cols">
      <div>
        <div class="modal-content-section">
          <div class="modal-section-eyebrow">Operational Scope</div>
          <p class="modal-section-body" style="color: var(--text-secondary); line-height: 1.6;">${exp.description || ''}</p>
        </div>
        
        <div class="modal-content-section">
          <div class="modal-section-eyebrow">Key Execution Deliverables</div>
          <ul class="modal-bullets-list">
            ${bulletsHtml || '<li>Owned end-to-end event planning.</li>'}
          </ul>
        </div>
      </div>
      
      <div class="modal-sidebar">
        <div class="modal-sidebar-card">
          <div class="modal-sidebar-card-val">${exp.impact_metrics?.val1 || 'Delivered'}</div>
          <div class="modal-sidebar-card-lbl">${exp.impact_metrics?.lbl1 || 'Result'}</div>
        </div>
        <div class="modal-sidebar-card">
          <div class="modal-sidebar-card-val">${exp.impact_metrics?.val2 || 'Success'}</div>
          <div class="modal-sidebar-card-lbl">${exp.impact_metrics?.lbl2 || 'Metric'}</div>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Global click listeners
function setupInteractivity() {
  // Category tags filtering
  const filters = document.getElementById('experience-filters');
  if (filters) {
    filters.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag-filter')) {
        filters.querySelectorAll('.tag-filter').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        activeFilterCategory = e.target.dataset.filter;
        filterAndRenderExperiences();
      }
    });
  }

  // Close modals
  const modal = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('btn-close-modal');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // PDF Previews toggle
  const cvSec = document.getElementById('cv-viewer-section');
  const portSec = document.getElementById('portfolio-viewer-section');
  
  document.getElementById('btn-view-cv').addEventListener('click', (e) => {
    const url = e.target.dataset.url;
    const iframe = document.getElementById('cv-iframe');
    if (iframe && !iframe.src) {
      iframe.src = url;
    }
    
    cvSec.classList.add('active');
    portSec.classList.remove('active');
    cvSec.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-close-cv').addEventListener('click', () => {
    cvSec.classList.remove('active');
    document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-view-portfolio').addEventListener('click', (e) => {
    const url = e.target.dataset.url;
    const iframe = document.getElementById('portfolio-iframe');
    if (iframe && !iframe.src) {
      iframe.src = url;
    }
    
    portSec.classList.add('active');
    cvSec.classList.remove('active');
    portSec.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-close-portfolio').addEventListener('click', () => {
    portSec.classList.remove('active');
    document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
  });
}

function setupScrollTop() {
  const btn = document.getElementById('btn-scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
