import { supabase } from './supabase.js';

// Fallback dataset pre-populated representing Amr Samir Edris's actual portfolio details
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
  titles: ["immersive experiences.", "large-scale productions.", "brand strategies."],
  summary: "Senior Project Manager with 5+ years of experience delivering mega events, large-scale government productions, and digital marketing campaigns across the MENA region.",
  email: "amrsamiredris@gmail.com",
  phone: "+971542191028",
  linkedin: "https://linkedin.com/in/amrsamiredris",
  cv_url: "",
  portfolio_url: ""
};

// Global states
let experiences = [];
let siteContent = {};
let activeTitles = [];
let rotatorTimer = null;

// Initializer
document.addEventListener('DOMContentLoaded', async () => {
  setupHashRouting();
  await loadContent();
  await loadExperiences();
  renderLogoMarquee();
  setupInteractivity();
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
  const wrapper = document.querySelector('.rotating-words-container');
  if (!wrapper) return;

  wrapper.innerHTML = '';
  
  activeTitles.forEach((title, idx) => {
    const span = document.createElement('span');
    span.className = `rotating-word ${idx === 0 ? 'active' : ''}`;
    span.id = `rotator-${idx}`;
    span.textContent = title;
    wrapper.appendChild(span);
  });

  if (rotatorTimer) clearInterval(rotatorTimer);
  
  let currentIdx = 0;
  
  rotatorTimer = setInterval(() => {
    const activeEl = document.getElementById(`rotator-${currentIdx}`);
    if (activeEl) {
      activeEl.className = 'rotating-word exit';
    }
    
    currentIdx = (currentIdx + 1) % activeTitles.length;
    
    const nextEl = document.getElementById(`rotator-${currentIdx}`);
    if (nextEl) {
      nextEl.className = 'rotating-word active';
    }
    
    // Clear exit state classes after transition
    setTimeout(() => {
      activeTitles.forEach((_, idx) => {
        if (idx !== currentIdx) {
          const el = document.getElementById(`rotator-${idx}`);
          if (el) el.className = 'rotating-word';
        }
      });
    }, 400);
    
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
  
  renderExperiences('all');
}

// Render bento layout grid
function renderExperiences(filter = 'all') {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  const filtered = filter === 'all' 
    ? experiences 
    : experiences.filter(exp => exp.category === filter);
    
  filtered.forEach((exp, idx) => {
    const card = document.createElement('div');
    
    // Asymmetric Bento Grid styling distribution
    // Alternate Span-2 and Medium sizes for a dynamic rhythm
    let bentoClass = 'bento-card bento-card-medium';
    if (idx === 0 || idx === 3 || idx === 6) {
      bentoClass = 'bento-card bento-card-large bento-card-span-2';
    }
    
    card.className = bentoClass;
    card.dataset.id = exp.id;
    
    const summaryText = exp.description || '';
    
    card.innerHTML = `
      <div>
        <div class="bento-card-top">
          <span class="bento-card-badge">${exp.category}</span>
          <span class="bento-card-date">${exp.date_range}</span>
        </div>
        <div class="bento-card-content">
          <h3>${exp.role}</h3>
          <div class="bento-card-company">${exp.company}</div>
          <p class="bento-card-desc">${summaryText}</p>
        </div>
      </div>
      
      <div class="bento-card-metrics">
        <div>
          <div class="bento-metric-val">${exp.impact_metrics?.val1 || 'Active'}</div>
          <div class="bento-metric-lbl">${exp.impact_metrics?.lbl1 || 'Status'}</div>
        </div>
        <div>
          <div class="bento-metric-val">${exp.impact_metrics?.val2 || 'N/A'}</div>
          <div class="bento-metric-lbl">${exp.impact_metrics?.lbl2 || 'Metric'}</div>
        </div>
      </div>
    `;
    
    // Add Mouse Glow micro-interactions
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
    
    card.addEventListener('click', () => openDetailModal(exp));
    grid.appendChild(card);
  });
}

// Render infinite brand scrolling marquee
function renderLogoMarquee() {
  const marquee = document.getElementById('logo-marquee');
  if (!marquee) return;
  
  marquee.innerHTML = '';
  
  const logos = FALLBACK_LOGOS;
  // Duplicate three times for seamless visual panning loops
  const tripleLogos = [...logos, ...logos, ...logos];
  
  tripleLogos.forEach(logo => {
    const div = document.createElement('div');
    div.className = 'brand-marquee-item';
    div.innerHTML = `<span>${logo.name}</span>`;
    marquee.appendChild(div);
  });
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
    <span class="bento-card-badge" style="display: inline-block; margin-bottom: 16px;">${exp.category}</span>
    <h2>${exp.role}</h2>
    <div class="modal-subtitle-row">
      <span class="modal-subtitle-company">${exp.company}</span>
      <span>&bull;</span>
      <span>${exp.location || ''}</span>
      <span>&bull;</span>
      <span>${exp.date_range}</span>
    </div>
    
    <div class="modal-grid-layout">
      <div>
        <div class="modal-section">
          <div class="modal-section-title">Operational Scope</div>
          <p class="modal-section-body" style="color: var(--text-secondary); line-height: 1.75;">${exp.description || ''}</p>
        </div>
        
        <div class="modal-section">
          <div class="modal-section-title">Key Execution Deliverables</div>
          <ul class="modal-bullets-list">
            ${bulletsHtml || '<li>Owned end-to-end event planning.</li>'}
          </ul>
        </div>
      </div>
      
      <div class="modal-sidebar-metrics">
        <div class="modal-metric-card">
          <div class="modal-metric-num">${exp.impact_metrics?.val1 || 'Delivered'}</div>
          <div class="modal-metric-desc">${exp.impact_metrics?.lbl1 || 'Result'}</div>
        </div>
        <div class="modal-metric-card">
          <div class="modal-metric-num">${exp.impact_metrics?.val2 || 'Success'}</div>
          <div class="modal-metric-desc">${exp.impact_metrics?.lbl2 || 'Metric'}</div>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Global click wireframes
function setupInteractivity() {
  // Category Filtering
  const filters = document.getElementById('experience-filters');
  if (filters) {
    filters.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag-filter')) {
        filters.querySelectorAll('.tag-filter').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const filterVal = e.target.dataset.filter;
        renderExperiences(filterVal);
      }
    });
  }

  // Close Modals
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

  // Document slide panel drawers
  const cvDrawer = document.getElementById('cv-viewer-section');
  const portDrawer = document.getElementById('portfolio-viewer-section');
  
  document.getElementById('btn-view-cv').addEventListener('click', (e) => {
    const url = e.target.dataset.url;
    const iframe = document.getElementById('cv-iframe');
    if (iframe && !iframe.src) {
      iframe.src = url;
    }
    
    cvDrawer.classList.add('active');
    portDrawer.classList.remove('active');
    cvDrawer.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-close-cv').addEventListener('click', () => {
    cvDrawer.classList.remove('active');
    document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-view-portfolio').addEventListener('click', (e) => {
    const url = e.target.dataset.url;
    const iframe = document.getElementById('portfolio-iframe');
    if (iframe && !iframe.src) {
      iframe.src = url;
    }
    
    portDrawer.classList.add('active');
    cvDrawer.classList.remove('active');
    portDrawer.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-close-portfolio').addEventListener('click', () => {
    portDrawer.classList.remove('active');
    document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
  });
}
