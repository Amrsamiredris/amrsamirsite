import { supabase } from './supabase.js';
import Chart from 'chart.js/auto';

// Global variables for dashboard
let activeTab = 'panel-analytics';
let visitsChart = null;
let durationsChart = null;
let currentExperiences = [];

// Attach function to window so app.js can trigger it on hash routing
window.initializeAdminPanel = checkAuthAndInit;

// DOM Ready inside admin module
document.addEventListener('DOMContentLoaded', () => {
  setupAdminListeners();
});

// Setup listeners for admin page controls
function setupAdminListeners() {
  // Login Form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Sidebar Menu Tabs
  const menuButtons = document.querySelectorAll('.sidebar-menu .menu-btn');
  menuButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      switchTab(target);
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // CMS General Settings Form submission
  const generalForm = document.getElementById('cms-general-form');
  if (generalForm) {
    generalForm.addEventListener('submit', saveGeneralSettings);
  }

  // Add Experience Card Button
  const addExpBtn = document.getElementById('btn-add-experience');
  if (addExpBtn) {
    addExpBtn.addEventListener('click', () => openExperienceModal(null));
  }

  // Close Experience Modal
  const closeExpModalBtn = document.getElementById('btn-close-experience-modal');
  if (closeExpModalBtn) {
    closeExpModalBtn.addEventListener('click', closeExperienceModal);
  }

  // Experience Form submission
  const expForm = document.getElementById('experience-form');
  if (expForm) {
    expForm.addEventListener('submit', saveExperience);
  }

  // File Upload Handlers
  const cvInput = document.getElementById('input-cv');
  if (cvInput) {
    cvInput.addEventListener('change', (e) => uploadAsset(e.target.files[0], 'cv.pdf', 'cv-upload-status'));
  }

  const portInput = document.getElementById('input-portfolio');
  if (portInput) {
    portInput.addEventListener('change', (e) => uploadAsset(e.target.files[0], 'portfolio.pdf', 'portfolio-upload-status'));
  }

  const logoInput = document.getElementById('input-logo');
  if (logoInput) {
    logoInput.addEventListener('change', (e) => uploadLogo(e.target.files[0]));
  }
}

// Check session and display appropriate panel
async function checkAuthAndInit() {
  try {
    if (!supabase) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const loginPanel = document.getElementById('admin-login-panel');
    const dashboardPanel = document.getElementById('admin-dashboard-panel');
    
    if (session) {
      // User is authenticated
      loginPanel.style.display = 'none';
      dashboardPanel.style.display = 'flex';
      
      // Load dashboard components
      loadAnalyticsData();
      loadGeneralSettingsCMS();
      loadExperiencesCMS();
      loadAssetsCMS();
    } else {
      // User is not authenticated
      loginPanel.style.display = 'flex';
      dashboardPanel.style.display = 'none';
    }
  } catch (err) {
    console.error('Auth check failed:', err);
  }
}

// Handle Login Form Submission
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Auth success: reload panel
    await checkAuthAndInit();
  } catch (err) {
    alert('Login failed: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
  }
}

// Handle Logout
async function handleLogout() {
  try {
    await supabase.auth.signOut();
    window.location.hash = ''; // back to home
    await checkAuthAndInit();
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// Switch between dashboard panels (Tabs)
function switchTab(panelId) {
  activeTab = panelId;
  
  // Update menu active states
  const menuButtons = document.querySelectorAll('.sidebar-menu .menu-btn');
  menuButtons.forEach(btn => {
    if (btn.dataset.target === panelId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle visible dashboard tab panel
  const panels = document.querySelectorAll('.dash-panel');
  panels.forEach(p => {
    if (p.id === panelId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  // Set page heading title
  const titles = {
    'panel-analytics': 'Analytics',
    'panel-content': 'General Site Content',
    'panel-experiences': 'Experience Cards Manager',
    'panel-assets': 'Document & Logo Assets'
  };
  document.getElementById('panel-title').textContent = titles[panelId] || 'Dashboard';
}

// ==========================================================================
// Analytics Dashboard Logic
// ==========================================================================
async function loadAnalyticsData() {
  try {
    if (!supabase) return;
    
    // Fetch all analytics events
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Compute Statistics
    const uniqueSessions = new Set(events.map(e => e.session_id));
    const totalVisits = uniqueSessions.size;
    const pageviews = events.filter(e => e.event_type === 'pageview').length;
    
    const cvViews = events.filter(e => e.event_type === 'pdf_view' && e.event_label === 'CV').length;
    const cvDowns = events.filter(e => e.event_type === 'pdf_download' && e.event_label === 'CV').length;
    
    const portViews = events.filter(e => e.event_type === 'pdf_view' && e.event_label === 'Portfolio').length;
    const portDowns = events.filter(e => e.event_type === 'pdf_download' && e.event_label === 'Portfolio').length;
    
    // Set text statistics
    document.getElementById('stat-visitors').textContent = totalVisits;
    document.getElementById('stat-pageviews').textContent = pageviews;
    document.getElementById('stat-cv').textContent = `${cvViews} / ${cvDowns}`;
    document.getElementById('stat-portfolio').textContent = `${portViews} / ${portDowns}`;

    // Render charts
    renderVisitsChart(events);
    renderDurationsChart(events);
    renderSectionsTable(events);
    
  } catch (err) {
    console.warn('Could not load analytics stats:', err.message);
  }
}

// Group pageviews by Date for time series chart
function renderVisitsChart(events) {
  const ctx = document.getElementById('chart-visits');
  if (!ctx) return;

  // Extract dates (YYYY-MM-DD)
  const views = events.filter(e => e.event_type === 'pageview');
  
  const countsByDate = {};
  views.forEach(v => {
    const d = new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    countsByDate[d] = (countsByDate[d] || 0) + 1;
  });
  
  const labels = Object.keys(countsByDate);
  const data = Object.values(countsByDate);

  if (visitsChart) visitsChart.destroy();

  visitsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        label: 'Daily Page Views',
        data: data.length > 0 ? data : [0],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// Group section viewing times
function renderDurationsChart(events) {
  const ctx = document.getElementById('chart-durations');
  if (!ctx) return;

  const sectionViews = events.filter(e => e.event_type === 'section_view');
  
  const totalDuration = {};
  const occurrences = {};
  
  sectionViews.forEach(v => {
    const section = v.event_label;
    totalDuration[section] = (totalDuration[section] || 0) + v.duration;
    occurrences[section] = (occurrences[section] || 0) + 1;
  });
  
  const labels = Object.keys(totalDuration);
  const averages = labels.map(sec => Math.round(totalDuration[sec] / occurrences[sec]));

  if (durationsChart) durationsChart.destroy();

  durationsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        label: 'Avg Duration',
        data: averages.length > 0 ? averages : [0],
        backgroundColor: '#06b6d4',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// Build table detailing section views
function renderSectionsTable(events) {
  const tbody = document.getElementById('table-sections-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const sectionViews = events.filter(e => e.event_type === 'section_view');
  const totals = {};
  const counts = {};
  
  sectionViews.forEach(v => {
    const sec = v.event_label;
    totals[sec] = (totals[sec] || 0) + v.duration;
    counts[sec] = (counts[sec] || 0) + 1;
  });
  
  if (Object.keys(totals).length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No activity recorded yet.</td></tr>`;
    return;
  }
  
  for (const sec in totals) {
    const totalSec = totals[sec];
    const cnt = counts[sec];
    const avg = Math.round(totalSec / cnt);
    
    // Format visual total time (e.g. 5m 23s)
    let formattedTotal = `${totalSec}s`;
    if (totalSec > 60) {
      formattedTotal = `${Math.floor(totalSec / 60)}m ${totalSec % 60}s`;
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${sec}</strong></td>
      <td>${formattedTotal}</td>
      <td>${avg} seconds</td>
      <td>${cnt} times</td>
    `;
    tbody.appendChild(row);
  }
}

// ==========================================================================
// Site Content CMS Logic
// ==========================================================================
async function loadGeneralSettingsCMS() {
  try {
    if (!supabase) return;
    
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) throw error;
    
    // Set fields
    const contentMap = {};
    data.forEach(item => {
      contentMap[item.key] = item.value;
    });

    document.getElementById('cms-name').value = contentMap.name || '';
    
    // Titles array to string
    const titleArr = contentMap.titles || [];
    document.getElementById('cms-titles').value = Array.isArray(titleArr) ? titleArr.join(', ') : titleArr;
    
    document.getElementById('cms-summary').value = contentMap.summary || '';
    document.getElementById('cms-email').value = contentMap.email || '';
    document.getElementById('cms-phone').value = contentMap.phone || '';
    document.getElementById('cms-linkedin').value = contentMap.linkedin || '';
  } catch (err) {
    console.warn('Could not populate general settings forms:', err.message);
  }
}

async function saveGeneralSettings(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  const name = document.getElementById('cms-name').value;
  const titles = document.getElementById('cms-titles').value.split(',').map(t => t.trim());
  const summary = document.getElementById('cms-summary').value;
  const email = document.getElementById('cms-email').value;
  const phone = document.getElementById('cms-phone').value;
  const linkedin = document.getElementById('cms-linkedin').value;

  const updates = [
    { key: 'name', value: name },
    { key: 'titles', value: titles },
    { key: 'summary', value: summary },
    { key: 'email', value: email },
    { key: 'phone', value: phone },
    { key: 'linkedin', value: linkedin }
  ];

  try {
    if (!supabase) throw new Error('Supabase not connected');

    // Upsert individual settings keys
    for (const item of updates) {
      const { error } = await supabase
        .from('site_content')
        .upsert(item, { onConflict: 'key' });
      if (error) throw error;
    }

    alert('General settings saved successfully!');
    
    // Reload local variables on site
    if (window.location.hash !== '#admin') {
      window.location.reload();
    }
  } catch (err) {
    alert('Saving failed: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save General Settings';
  }
}

// ==========================================================================
// Experience Cards CMS Logic
// ==========================================================================
async function loadExperiencesCMS() {
  const container = document.getElementById('experiences-list-container');
  if (!container) return;

  container.innerHTML = 'Loading experiences...';

  try {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    currentExperiences = data;

    container.innerHTML = '';
    if (data.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted);">No experiences found. Create one now!</p>';
      return;
    }

    data.forEach(exp => {
      const div = document.createElement('div');
      div.className = 'experience-list-item';
      
      div.innerHTML = `
        <div>
          <h4>${exp.role} @ ${exp.company}</h4>
          <p>${exp.category} | ${exp.date_range}</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary btn-small btn-edit" data-id="${exp.id}">Edit</button>
          <button class="btn btn-danger btn-small btn-delete" data-id="${exp.id}">Delete</button>
        </div>
      `;

      // Wire up buttons
      div.querySelector('.btn-edit').addEventListener('click', () => openExperienceModal(exp));
      div.querySelector('.btn-delete').addEventListener('click', () => deleteExperience(exp.id));

      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = '<p style="color: #ef4444;">Failed to load experiences list: ' + err.message + '</p>';
  }
}

// Open experience add/edit overlay modal
function openExperienceModal(exp = null) {
  const modal = document.getElementById('experience-edit-modal');
  const title = document.getElementById('exp-modal-title');
  if (!modal) return;

  if (exp) {
    // Edit mode
    title.textContent = 'Edit Experience Card';
    document.getElementById('exp-id').value = exp.id;
    document.getElementById('exp-role').value = exp.role;
    document.getElementById('exp-company').value = exp.company;
    document.getElementById('exp-location').value = exp.location || '';
    document.getElementById('exp-date').value = exp.date_range;
    document.getElementById('exp-category').value = exp.category;
    document.getElementById('exp-description').value = exp.description || '';
    
    const details = Array.isArray(exp.details) ? exp.details.join('\n') : exp.details;
    document.getElementById('exp-details').value = details || '';
    
    document.getElementById('exp-metric-1-val').value = exp.impact_metrics?.val1 || '';
    document.getElementById('exp-metric-1-lbl').value = exp.impact_metrics?.lbl1 || '';
    document.getElementById('exp-metric-2-val').value = exp.impact_metrics?.val2 || '';
    document.getElementById('exp-metric-2-lbl').value = exp.impact_metrics?.lbl2 || '';
  } else {
    // Add mode
    title.textContent = 'Add Experience Card';
    document.getElementById('experience-form').reset();
    document.getElementById('exp-id').value = '';
  }

  modal.classList.add('active');
}

function closeExperienceModal() {
  document.getElementById('experience-edit-modal').classList.remove('active');
}

// Create or update experience card
async function saveExperience(e) {
  e.preventDefault();
  
  const id = document.getElementById('exp-id').value;
  const role = document.getElementById('exp-role').value;
  const company = document.getElementById('exp-company').value;
  const location = document.getElementById('exp-location').value;
  const date_range = document.getElementById('exp-date').value;
  const category = document.getElementById('exp-category').value;
  const description = document.getElementById('exp-description').value;
  
  const detailsRaw = document.getElementById('exp-details').value;
  // Convert lines into an array
  const details = detailsRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const val1 = document.getElementById('exp-metric-1-val').value;
  const lbl1 = document.getElementById('exp-metric-1-lbl').value;
  const val2 = document.getElementById('exp-metric-2-val').value;
  const lbl2 = document.getElementById('exp-metric-2-lbl').value;

  const payload = {
    role,
    company,
    location,
    date_range,
    category,
    description,
    details,
    impact_metrics: { val1, lbl1, val2, lbl2 }
  };

  try {
    if (!supabase) throw new Error('Supabase not connected');
    
    if (id) {
      // Edit existing
      const { error } = await supabase
        .from('experiences')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    } else {
      // Create new
      // Calculate order index
      const nextIndex = currentExperiences.length;
      payload.order_index = nextIndex;
      
      const { error } = await supabase
        .from('experiences')
        .insert([payload]);
      if (error) throw error;
    }

    closeExperienceModal();
    loadExperiencesCMS();
  } catch (err) {
    alert('Saving experience failed: ' + err.message);
  }
}

// Delete experience card
async function deleteExperience(id) {
  if (!confirm('Are you sure you want to delete this experience card?')) return;

  try {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { error } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id);

    if (error) throw error;
    loadExperiencesCMS();
  } catch (err) {
    alert('Deletion failed: ' + err.message);
  }
}

// ==========================================================================
// Storage Document & Logo CMS Logic
// ==========================================================================
async function loadAssetsCMS() {
  const container = document.getElementById('admin-logos-list');
  if (!container) return;

  container.innerHTML = 'Loading logos...';

  try {
    if (!supabase) throw new Error('Supabase not connected');
    
    // List logo files in assets bucket under 'logos/'
    const { data: files, error } = await supabase.storage.from('assets').list('logos');
    
    if (error) throw error;
    
    container.innerHTML = '';
    if (!files || files.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); grid-column: span 3;">No custom logos uploaded.</p>';
      return;
    }

    files.forEach(file => {
      // Skip folders
      if (file.name === '.emptyFolderPlaceholder') return;
      
      const fileUrl = supabase.storage.from('assets').getPublicUrl(`logos/${file.name}`).data.publicUrl;
      
      const div = document.createElement('div');
      div.className = 'glass';
      div.style.padding = '12px';
      div.style.textAlign = 'center';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      div.style.gap = '8px';
      
      div.innerHTML = `
        <div style="height: 40px; display:flex; align-items:center; justify-content:center;">
          <img src="${fileUrl}" style="max-height:30px; max-width:80px; object-fit:contain; opacity:0.8;">
        </div>
        <div style="font-size:0.7rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; width:100%; white-space:nowrap;" title="${file.name}">
          ${file.name}
        </div>
        <button class="btn btn-danger btn-small" style="padding: 2px 6px; font-size: 0.7rem; width:100%;" data-name="${file.name}">
          Delete
        </button>
      `;

      div.querySelector('button').addEventListener('click', () => deleteLogo(file.name));
      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = '<p style="color: #ef4444; grid-column: span 3;">Failed to load brand logos list: ' + err.message + '</p>';
  }
}

// Upload CV/Portfolio PDF document
async function uploadAsset(file, bucketFilename, statusElId) {
  const statusEl = document.getElementById(statusElId);
  if (!file) return;

  statusEl.textContent = 'Uploading file...';

  try {
    if (!supabase) throw new Error('Supabase not connected');
    
    // Upload file directly to assets bucket (overwriting via upsert)
    const { error } = await supabase.storage.from('assets').upload(bucketFilename, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) throw error;
    
    statusEl.textContent = 'Upload completed! File updated on live site.';
    statusEl.style.color = 'var(--accent)';
  } catch (err) {
    statusEl.textContent = 'Upload failed: ' + err.message;
    statusEl.style.color = '#ef4444';
  }
}

// Upload Brand Logo PNG/SVG
async function uploadLogo(file) {
  const statusEl = document.getElementById('logo-upload-status');
  if (!file) return;

  statusEl.textContent = 'Uploading logo...';

  // Sanitize filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filepath = `logos/${cleanName}`;

  try {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { error } = await supabase.storage.from('assets').upload(filepath, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) throw error;
    
    statusEl.textContent = 'Logo uploaded successfully!';
    statusEl.style.color = 'var(--accent)';
    
    loadAssetsCMS();
  } catch (err) {
    statusEl.textContent = 'Upload failed: ' + err.message;
    statusEl.style.color = '#ef4444';
  }
}

// Delete Brand Logo file
async function deleteLogo(filename) {
  if (!confirm(`Are you sure you want to delete logo "${filename}"?`)) return;

  try {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { error } = await supabase.storage.from('assets').remove([`logos/${filename}`]);
    if (error) throw error;

    loadAssetsCMS();
  } catch (err) {
    alert('Deletion failed: ' + err.message);
  }
}
