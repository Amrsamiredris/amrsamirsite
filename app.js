import { supabase } from './supabase.js';

// Pre-populated experiences representing Amr Samir Edris's actual portfolio as a fallback
const FALLBACK_EXPERIENCES = [
  {
    id: "def-game-expo-2026",
    role: "Projects Manager",
    company: "Zawaya Group (DEF GameExpo 2026)",
    location: "Dubai, UAE",
    date_range: "2026",
    category: "Gaming & Esports",
    description: "Main Project Lead for the Dubai Esports & Games Festival (DET / Visit Dubai). Managed full event lifecycle including production planning and vendor coordination.",
    details: [
      "Led production planning, weekly alignment with DET, Eventify, Gamers Hub, and Tech X Hub.",
      "Built Run-of-Show, activities/tournaments workbook, and talent scheduling across hosts.",
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
    company: "Zawaya Group (EA Sports FC Ramadan)",
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
    date_range: "Aug 2021 – Apr 2022",
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
    date_range: "Jun 2022 – Sep 2024",
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
    date_range: "Multiple Editions",
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
  { name: "COP28 Dubai", isPlaceholder: true },
  { name: "Expo 2020 Dubai", isPlaceholder: true },
  { name: "Formula 1 Abu Dhabi", isPlaceholder: true },
  { name: "DET Visit Dubai", isPlaceholder: true },
  { name: "Louvre Abu Dhabi", isPlaceholder: true },
  { name: "EA Sports", isPlaceholder: true },
  { name: "Sony", isPlaceholder: true },
  { name: "Emaar", isPlaceholder: true },
  { name: "FP7 McCann", isPlaceholder: true },
  { name: "McDonald's", isPlaceholder: true }
];

const FALLBACK_CONTENT = {
  name: "Amr Samir Edris",
  titles: ["Project Manager", "Marketing Strategist", "AI & Tech Consultant"],
  summary: "Senior Project Manager with 5+ years of experience delivering mega events, large-scale government productions, and digital marketing campaigns across the MENA region.",
  email: "amrsamiredris@gmail.com",
  phone: "+971542191028",
  linkedin: "https://linkedin.com/in/amrsamiredris",
  cv_url: "", // will fallback to assets folder if empty
  portfolio_url: ""
};

// Global State
let experiences = [];
let siteContent = {};
let activeTitles = [];
let rotatorTimer = null;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  setupHashRouting();
  await loadContent();
  await loadExperiences();
  renderLogoMarquee();
  setupInteractivity();
});

// Listen to Hash Changes (Single-Page App routing)
window.addEventListener('hashchange', setupHashRouting);

function setupHashRouting() {
  const hash = window.location.hash;
  if (hash === '#admin' || hash.startsWith('#admin/')) {
    document.body.classList.add('admin-mode');
    // Trigger admin check from admin.js if exists
    if (window.initializeAdminPanel) {
      window.initializeAdminPanel();
    }
  } else {
    document.body.classList.remove('admin-mode');
  }
}

// Fetch general content from Supabase
async function loadContent() {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('site_content')
      .select('*');
      
    if (error || !data || data.length === 0) {
      siteContent = FALLBACK_CONTENT;
    } else {
      // Map key-values from database table
      siteContent = {};
      data.forEach(item => {
        siteContent[item.key] = item.value;
      });
      // Merge defaults for missing fields
      siteContent = { ...FALLBACK_CONTENT, ...siteContent };
    }
  } catch (err) {
    siteContent = FALLBACK_CONTENT;
  }
  
  // Render General Info
  document.getElementById('client-name').textContent = siteContent.name;
  document.getElementById('client-summary').textContent = siteContent.summary;
  
  const emailEl = document.getElementById('client-email');
  emailEl.textContent = siteContent.email;
  emailEl.href = `mailto:${siteContent.email}`;
  
  document.getElementById('client-phone').textContent = siteContent.phone;
  
  const linkedinEl = document.getElementById('client-linkedin');
  linkedinEl.textContent = siteContent.linkedin.replace('https://', '').replace('www.', '');
  linkedinEl.href = siteContent.linkedin;

  // Setup rotating job titles
  activeTitles = Array.isArray(siteContent.titles) ? siteContent.titles : siteContent.titles.split(',').map(t => t.trim());
  setupTitleRotator();

  // Set file download URLs
  setupFileLinks();
}

// Set URLs for CV and Portfolio downloads
async function setupFileLinks() {
  let cvUrl = siteContent.cv_url;
  let portfolioUrl = siteContent.portfolio_url;

  // If Supabase Storage is configured, fetch live URLs from "assets" bucket
  try {
    if (supabase && (!cvUrl || !portfolioUrl)) {
      const { data: cvData } = supabase.storage.from('assets').getPublicUrl('cv.pdf');
      const { data: portData } = supabase.storage.from('assets').getPublicUrl('portfolio.pdf');
      
      if (cvData?.publicUrl) cvUrl = cvData.publicUrl;
      if (portData?.publicUrl) portfolioUrl = portData.publicUrl;
    }
  } catch (e) {
    console.log("Could not fetch storage URLs directly, falling back to local files.");
  }

  // Fallback to local files if Supabase urls not loaded
  const finalCvUrl = cvUrl || './assets/cv.pdf';
  const finalPortUrl = portfolioUrl || './assets/portfolio.pdf';

  // Set download hrefs
  document.getElementById('btn-download-cv').href = finalCvUrl;
  document.getElementById('btn-download-portfolio').href = finalPortUrl;
  
  // Set mobile viewer hrefs
  document.getElementById('cv-mobile-link').href = finalCvUrl;
  document.getElementById('portfolio-mobile-link').href = finalPortUrl;

  // Pre-load iframes (will load only when toggled to save initial page load time)
  document.getElementById('btn-view-cv').dataset.url = finalCvUrl;
  document.getElementById('btn-view-portfolio').dataset.url = finalPortUrl;
}

// Setup Rotating Titles Animation
function setupTitleRotator() {
  const wrapper = document.querySelector('.rotating-text-wrapper');
  if (!wrapper) return;

  // Clear existing items
  wrapper.innerHTML = '';
  
  activeTitles.forEach((title, idx) => {
    const el = document.createElement('div');
    el.className = `rotating-text ${idx === 0 ? 'active' : ''}`;
    el.id = `rotator-${idx}`;
    el.textContent = title;
    wrapper.appendChild(el);
  });

  if (rotatorTimer) clearInterval(rotatorTimer);
  
  let currentIdx = 0;
  
  rotatorTimer = setInterval(() => {
    const activeEl = document.getElementById(`rotator-${currentIdx}`);
    if (activeEl) {
      activeEl.className = 'rotating-text exit';
    }
    
    currentIdx = (currentIdx + 1) % activeTitles.length;
    
    const nextEl = document.getElementById(`rotator-${currentIdx}`);
    if (nextEl) {
      nextEl.className = 'rotating-text active';
    }
    
    // Cleanup exit animations after animation completes
    setTimeout(() => {
      activeTitles.forEach((_, idx) => {
        if (idx !== currentIdx) {
          const el = document.getElementById(`rotator-${idx}`);
          if (el) el.className = 'rotating-text';
        }
      });
    }, 500);
    
  }, 3000);
}

// Fetch experience cards from Supabase
async function loadExperiences() {
  try {
    if (!supabase) throw new Error('Supabase not initialized');
    
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
  
  renderExperiences('all');
}

// Render experience grid
function renderExperiences(filter = 'all') {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  const filtered = filter === 'all' 
    ? experiences 
    : experiences.filter(exp => exp.category === filter);
    
  filtered.forEach(exp => {
    const card = document.createElement('div');
    card.className = 'project-card glass';
    card.dataset.id = exp.id;
    
    const bulletText = exp.description || (exp.details && exp.details[0]) || '';
    
    card.innerHTML = `
      <div class="project-card-header">
        <span class="project-tag">${exp.category}</span>
        <span class="project-date">${exp.date_range}</span>
      </div>
      <h3>${exp.role}</h3>
      <div class="project-company">${exp.company}</div>
      <p class="project-description">${bulletText}</p>
      
      <div class="project-metrics">
        <div class="metric-box">
          <div class="metric-val">${exp.impact_metrics?.val1 || 'Active'}</div>
          <div class="metric-lbl">${exp.impact_metrics?.lbl1 || 'Status'}</div>
        </div>
        <div class="metric-box">
          <div class="metric-val">${exp.impact_metrics?.val2 || 'N/A'}</div>
          <div class="metric-lbl">${exp.impact_metrics?.lbl2 || 'Metric'}</div>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => openDetailModal(exp));
    grid.appendChild(card);
  });
}

// Render dynamic sliding logo marquee
function renderLogoMarquee() {
  const marquee = document.getElementById('logo-marquee');
  if (!marquee) return;
  
  marquee.innerHTML = '';
  
  // Render two copies for seamless infinite scroll loops
  const logos = FALLBACK_LOGOS; // Can query from DB/Storage in future
  
  const doubleLogos = [...logos, ...logos, ...logos]; // Repeat enough times to fill screen width
  
  doubleLogos.forEach(logo => {
    const div = document.createElement('div');
    div.className = 'logo-item';
    
    // For now, render high-end glassmorphic placeholders with text
    div.innerHTML = `<span style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; opacity: 0.7;">${logo.name}</span>`;
    
    // If we have actual image files loaded later, we can do:
    // div.innerHTML = `<img src="${logo.url}" alt="${logo.name}">`;
    
    marquee.appendChild(div);
  });
}

// Open detail modal with project case study details
function openDetailModal(exp) {
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('modal-body-content');
  if (!modal || !content) return;
  
  const detailsList = Array.isArray(exp.details) 
    ? exp.details 
    : (typeof exp.details === 'string' ? JSON.parse(exp.details) : []);

  let bulletsHtml = '';
  detailsList.forEach(bullet => {
    // strip leading dash if present
    const clean = bullet.replace(/^-\s*/, '');
    bulletsHtml += `<li>${clean}</li>`;
  });
  
  content.innerHTML = `
    <span class="section-tag" style="margin-bottom: 12px;">${exp.category}</span>
    <h2>${exp.role}</h2>
    <div class="modal-subtitle">
      <span>${exp.company}</span>
      <span>&bull;</span>
      <span>${exp.location || ''}</span>
      <span>&bull;</span>
      <span>${exp.date_range}</span>
    </div>
    
    <div class="modal-section">
      <h4>Brief & Scope</h4>
      <p>${exp.description || 'Managing full project lifecycles covering concept development, client briefings, budget allocations, vendor logistics, and production delivery.'}</p>
    </div>
    
    <div class="modal-section">
      <h4>Key Execution & Responsibilities</h4>
      <ul class="modal-bullets">
        ${bulletsHtml || '<li>Owned end-to-end client relationship management and vendor delivery pipelines.</li><li>Managed budget metrics and project schedules.</li>'}
      </ul>
    </div>
    
    <div class="modal-section" style="border-top: 1px solid var(--border-color); padding-top: 24px; margin-top: 24px;">
      <h4>Impact & Results</h4>
      <div style="display: flex; gap: 32px; flex-wrap: wrap;">
        <div>
          <div style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: #fff;">${exp.impact_metrics?.val1 || 'Delivered'}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">${exp.impact_metrics?.lbl1 || 'Impact'}</div>
        </div>
        <div>
          <div style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: #fff;">${exp.impact_metrics?.val2 || 'Success'}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">${exp.impact_metrics?.lbl2 || 'Metric'}</div>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // prevent page scrolling background
}

// Setup Event Listeners
function setupInteractivity() {
  // Category Filters
  const filters = document.getElementById('experience-filters');
  if (filters) {
    filters.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        // Toggle active
        filters.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const filterVal = e.target.dataset.filter;
        renderExperiences(filterVal);
      }
    });
  }

  // Modals close
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
    portSec.classList.remove('active'); // toggle off other
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
    cvSec.classList.remove('active'); // toggle off other
    portSec.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-close-portfolio').addEventListener('click', () => {
    portSec.classList.remove('active');
    document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
  });
}
