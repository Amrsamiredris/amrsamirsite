import { supabase } from './supabase.js';
import Chart from 'chart.js/auto';

// Global variables for dashboard
let activeTab = 'panel-analytics';
let visitsChart = null;
let durationsChart = null;
let currentExperiences = [];
let vercelHookUrl = '';
let siteContent = {};
let currentPitches = [];
let invitedAdmins = [];
let pendingChanges = [];

const FALLBACK_CREW = [
  { id: "1", role: "Project Director", name: "Amr Samir Edris", level: 1 },
  { id: "2", role: "Event Ops Manager", name: "Sarah Collins", level: 2 },
  { id: "3", role: "Technical Director", name: "Marcus Vance", level: 2 },
  { id: "4", role: "Stage Manager", name: "Elena Rostova", level: 3 },
  { id: "5", role: "Backstage Lead", name: "Tariq Mahmood", level: 3 },
  { id: "6", role: "Logistics Lead", name: "Yuki Tanaka", level: 3 }
];

// Expose routing function for app.js hash router
window.initializeAdminPanel = checkAuthAndInit;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  setupAdminListeners();
});

// Setup admin dashboard event handlers
function setupAdminListeners() {
  // Login form submit
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Sidebar navigation tabs
  const navButtons = document.querySelectorAll('.dashboard-sidebar .sidebar-nav-btn');
  navButtons.forEach(btn => {
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

  // General configuration form submit
  const generalForm = document.getElementById('cms-general-form');
  if (generalForm) {
    generalForm.addEventListener('submit', saveGeneralSettings);
  }

  // Analytics configuration form submit
  const analyticsForm = document.getElementById('cms-analytics-form');
  if (analyticsForm) {
    analyticsForm.addEventListener('submit', saveAnalyticsIntegration);
  }

  // Add experience record trigger
  const addExpBtn = document.getElementById('btn-add-experience');
  if (addExpBtn) {
    addExpBtn.addEventListener('click', () => openExperienceModal(null));
  }

  // Close experience modal
  const closeExpModalBtn = document.getElementById('btn-close-experience-modal');
  if (closeExpModalBtn) {
    closeExpModalBtn.addEventListener('click', closeExperienceModal);
  }

  // Experience form submit
  const expForm = document.getElementById('experience-form');
  if (expForm) {
    expForm.addEventListener('submit', saveExperience);
  }

  // PDF asset file input changes
  const cvInput = document.getElementById('input-cv');
  if (cvInput) {
    cvInput.addEventListener('change', (e) => uploadAsset(e.target.files[0], 'cv.pdf', 'cv-upload-status'));
  }

  const portInput = document.getElementById('input-portfolio');
  if (portInput) {
    portInput.addEventListener('change', (e) => uploadAsset(e.target.files[0], 'portfolio.pdf', 'portfolio-upload-status'));
  }

  // Brand logo file input change
  const logoInput = document.getElementById('input-logo');
  if (logoInput) {
    logoInput.addEventListener('change', (e) => uploadLogo(e.target.files[0]));
  }

  // Vercel Webhook form submit
  const vercelForm = document.getElementById('vercel-hook-form');
  if (vercelForm) {
    vercelForm.addEventListener('submit', saveVercelHook);
  }

  // Invite Team form submit
  const inviteForm = document.getElementById('invite-team-form');
  if (inviteForm) {
    inviteForm.addEventListener('submit', handleInviteSubmit);
  }

  // Accept Invite form submit
  const acceptInviteForm = document.getElementById('accept-invite-form');
  if (acceptInviteForm) {
    acceptInviteForm.addEventListener('submit', handleAcceptInviteSubmit);
  }

  // Vercel trigger redeploy button click
  const triggerRedeployBtn = document.getElementById('btn-trigger-redeploy');
  if (triggerRedeployBtn) {
    triggerRedeployBtn.addEventListener('click', triggerVercelRedeploy);
  }

  // CSV Exporter button
  const exportBtn = document.getElementById('btn-export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportAnalyticsToCSV);
  }

  // Calendar save button
  const saveCalBtn = document.getElementById('btn-save-calendar');
  if (saveCalBtn) {
    saveCalBtn.addEventListener('click', saveCalendarStatus);
  }

  // Crew Structure actions
  const addCrewBtn = document.getElementById('btn-add-crew-node');
  if (addCrewBtn) {
    addCrewBtn.addEventListener('click', () => {
      const currentCrew = getCrewFromCMSInputs();
      currentCrew.push({ id: String(currentCrew.length + 1), role: '', name: '', level: 3 });
      renderCrewCMS(currentCrew);
    });
  }

  const saveCrewBtn = document.getElementById('btn-save-crew');
  if (saveCrewBtn) {
    saveCrewBtn.addEventListener('click', saveCrewStructure);
  }

  // Pitches actions
  const addPitchBtn = document.getElementById('btn-add-pitch');
  if (addPitchBtn) {
    addPitchBtn.addEventListener('click', () => openPitchModal(null));
  }

  const closePitchModalBtn = document.getElementById('btn-close-pitch-modal');
  if (closePitchModalBtn) {
    closePitchModalBtn.addEventListener('click', closePitchModal);
  }

  const pitchForm = document.getElementById('pitch-form');
  if (pitchForm) {
    pitchForm.addEventListener('submit', savePitch);
  }
}

// Apply UI controls and text changes based on user roles
function applyRoleUI() {
  const role = localStorage.getItem('admin_role');
  
  const teamBtn = document.getElementById('sidebar-btn-team');
  const approvalsBtn = document.getElementById('sidebar-btn-approvals');
  
  if (teamBtn) {
    teamBtn.style.display = role === 'superadmin' ? 'block' : 'none';
  }
  if (approvalsBtn) {
    approvalsBtn.style.display = role === 'superadmin' ? 'block' : 'none';
  }
  
  const existingBanner = document.getElementById('role-alert-banner');
  if (existingBanner) existingBanner.remove();

  const existingBypassBanner = document.getElementById('bypass-alert-banner');
  if (existingBypassBanner) existingBypassBanner.remove();
  
  const header = document.querySelector('.console-panel-header');

  if (localStorage.getItem('admin_email') === 'amr') {
    const banner = document.createElement('div');
    banner.id = 'bypass-alert-banner';
    banner.className = 'readonly-alert-banner';
    banner.style.background = 'rgba(255, 69, 58, 0.15)';
    banner.style.color = '#ff453a';
    banner.style.border = '1px solid rgba(255, 69, 58, 0.3)';
    banner.style.borderRadius = '12px';
    banner.style.padding = '12px 16px';
    banner.style.marginBottom = '24px';
    banner.style.fontSize = '0.85rem';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.gap = '10px';
    banner.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px; height:18px; flex-shrink:0;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <span><strong>Offline / Bypass mode:</strong> You logged in with the local bypass. Supabase database writes and uploads will fail. To edit, please create an admin user in your Supabase Auth dashboard and sign in with that email.</span>
    `;
    if (header) header.parentNode.insertBefore(banner, header.nextSibling);
  }
  
  if (role === 'readonly') {
    const banner = document.createElement('div');
    banner.id = 'role-alert-banner';
    banner.className = 'readonly-alert-banner';
    banner.style.background = 'rgba(255, 159, 10, 0.15)';
    banner.style.color = '#ff9f0a';
    banner.style.border = '1px solid rgba(255, 159, 10, 0.3)';
    banner.style.borderRadius = '12px';
    banner.style.padding = '12px 16px';
    banner.style.marginBottom = '24px';
    banner.style.fontSize = '0.85rem';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.gap = '10px';
    banner.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px; height:18px; flex-shrink:0;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <span><strong>Read-Only Access:</strong> You can inspect settings and view logs, but changes cannot be saved.</span>
    `;
    if (header) header.parentNode.insertBefore(banner, header.nextSibling);
    
    setTimeout(() => {
      document.querySelectorAll('#admin-dashboard-panel input, #admin-dashboard-panel select, #admin-dashboard-panel textarea, #admin-dashboard-panel button').forEach(el => {
        if (el.id !== 'btn-logout' && !el.classList.contains('sidebar-nav-btn') && el.id !== 'btn-export-csv') {
          el.disabled = true;
        }
      });
    }, 100);
    
  } else if (role === 'confirmation') {
    const banner = document.createElement('div');
    banner.id = 'role-alert-banner';
    banner.className = 'readonly-alert-banner';
    banner.style.background = 'rgba(10, 132, 255, 0.15)';
    banner.style.color = '#0a84ff';
    banner.style.border = '1px solid rgba(10, 132, 255, 0.3)';
    banner.style.borderRadius = '12px';
    banner.style.padding = '12px 16px';
    banner.style.marginBottom = '24px';
    banner.style.fontSize = '0.85rem';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.gap = '10px';
    banner.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px; height:18px; flex-shrink:0;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <span><strong>Restricted Editor Access:</strong> Modifications will be queued for Super Admin approval.</span>
    `;
    if (header) header.parentNode.insertBefore(banner, header.nextSibling);
    
    setTimeout(() => {
      document.querySelectorAll('#admin-dashboard-panel input, #admin-dashboard-panel select, #admin-dashboard-panel textarea, #admin-dashboard-panel button').forEach(el => {
        if (el.id !== 'btn-logout' && !el.classList.contains('sidebar-nav-btn')) {
          el.disabled = false;
        }
      });
      
      const saveGeneralBtn = document.querySelector('#cms-general-form button[type="submit"]');
      if (saveGeneralBtn) saveGeneralBtn.textContent = 'Submit General Profile for Approval';
      
      const saveCalBtn = document.getElementById('btn-save-calendar');
      if (saveCalBtn) saveCalBtn.textContent = 'Submit Calendar for Approval';
      
      const saveCrewBtn = document.getElementById('btn-save-crew');
      if (saveCrewBtn) saveCrewBtn.textContent = 'Submit Crew Blueprint for Approval';
      
      const saveExpBtn = document.querySelector('#experience-form button[type="submit"]');
      if (saveExpBtn) saveExpBtn.textContent = 'Submit Card for Approval';
      
      const savePitchBtn = document.querySelector('#pitch-form button[type="submit"]');
      if (savePitchBtn) savePitchBtn.textContent = 'Submit Pitch for Approval';
      
      document.querySelectorAll('#upload-cv-area input, #upload-portfolio-area input, #upload-logo-area input, #vercel-hook-form input, #vercel-hook-form button').forEach(el => {
        el.disabled = true;
      });
    }, 100);
  } else {
    setTimeout(() => {
      document.querySelectorAll('#admin-dashboard-panel input, #admin-dashboard-panel select, #admin-dashboard-panel textarea, #admin-dashboard-panel button').forEach(el => {
        if (el.id !== 'btn-logout' && !el.classList.contains('sidebar-nav-btn')) {
          el.disabled = false;
        }
      });
      
      const saveGeneralBtn = document.querySelector('#cms-general-form button[type="submit"]');
      if (saveGeneralBtn) saveGeneralBtn.textContent = 'Save general settings';
      
      const saveCalBtn = document.getElementById('btn-save-calendar');
      if (saveCalBtn) saveCalBtn.textContent = 'Save Calendar Status';
      
      const saveCrewBtn = document.getElementById('btn-save-crew');
      if (saveCrewBtn) saveCrewBtn.textContent = 'Save Crew Structure';
      
      const saveExpBtn = document.querySelector('#experience-form button[type="submit"]');
      if (saveExpBtn) saveExpBtn.textContent = 'Save Experience Card';
      
      const savePitchBtn = document.querySelector('#pitch-form button[type="submit"]');
      if (savePitchBtn) savePitchBtn.textContent = 'Save Pitch';
    }, 100);
  }
}

// Authenticate session and render views
async function checkAuthAndInit() {
  try {
    await checkInviteToken();
    
    const loginPanel = document.getElementById('admin-login-panel');
    const dashboardPanel = document.getElementById('admin-dashboard-panel');
    
    const role = localStorage.getItem('admin_role');
    const email = localStorage.getItem('admin_email');
    
    let isAuthed = false;
    
    if (role && email) {
      isAuthed = true;
    } else if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        let invites = [];
        try {
          const { data, error } = await supabase
            .from('site_content')
            .select('*')
            .eq('key', 'invited_admins')
            .single();
          if (!error && data && data.value) {
            invites = data.value;
          }
        } catch (e) {
          console.warn('Could not fetch invites, assuming empty:', e);
        }

        // Bootstrap: If no admins are invited, automatically make the first user a Super Admin
        if (invites.length === 0) {
          console.log('No registered admins found. Bootstrapping user:', session.user.email);
          invites = [{
            email: session.user.email,
            role: 'superadmin',
            status: 'accepted',
            token: 'bootstrap'
          }];
          await supabase
            .from('site_content')
            .upsert({ key: 'invited_admins', value: invites }, { onConflict: 'key' });
        }
        
        const userInvite = invites.find(i => i.email.toLowerCase() === session.user.email.toLowerCase());
        
        if (userInvite && userInvite.status === 'accepted') {
          localStorage.setItem('admin_role', userInvite.role);
          localStorage.setItem('admin_email', session.user.email);
          isAuthed = true;
        } else {
          await supabase.auth.signOut();
          isAuthed = false;
        }
      }
    }
    
    if (isAuthed) {
      loginPanel.style.display = 'none';
      dashboardPanel.style.display = 'flex';
      
      applyRoleUI();
      
      loadAnalyticsData();
      loadGeneralSettingsCMS();
      loadExperiencesCMS();
      loadAssetsCMS();
      loadVercelSettings();
      
      if (activeTab === 'panel-team') loadTeamCMS();
      if (activeTab === 'panel-approvals') loadApprovalsCMS();
      if (activeTab === 'panel-inbox') loadInboxCMS();
    } else {
      loginPanel.style.display = 'flex';
      dashboardPanel.style.display = 'none';
    }
  } catch (err) {
    console.error('Session verification error:', err);
  }
}

// Handle Admin login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying Credentials...';

  try {
    if (email === 'amr' && password === 'amr') {
      localStorage.setItem('admin_role', 'superadmin');
      localStorage.setItem('admin_email', 'amr');
      await checkAuthAndInit();
      return;
    }

    if (!supabase) throw new Error('Supabase client unavailable');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    let invites = [];
    try {
      const { data: inviteData, error: inviteError } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', 'invited_admins')
        .single();
      if (!inviteError && inviteData && inviteData.value) {
        invites = inviteData.value;
      }
    } catch (e) {
      console.warn('Could not fetch invites, assuming empty:', e);
    }
      
    // Bootstrap: If no admins are invited, automatically make the first user a Super Admin
    if (invites.length === 0) {
      console.log('No registered admins found. Bootstrapping user:', email);
      const bootstrapAdmin = {
        email: email,
        role: 'superadmin',
        status: 'accepted',
        token: 'bootstrap'
      };
      invites = [bootstrapAdmin];
      await supabase
        .from('site_content')
        .upsert({ key: 'invited_admins', value: invites }, { onConflict: 'key' });
    }

    const matchedInvite = invites.find(i => i.email.toLowerCase() === email.toLowerCase());
    
    if (matchedInvite && matchedInvite.status === 'accepted') {
      localStorage.setItem('admin_role', matchedInvite.role);
      localStorage.setItem('admin_email', email);
      await checkAuthAndInit();
    } else {
      await supabase.auth.signOut();
      throw new Error('Unauthorized Access. You must be invited by a Super Admin to access this console.');
    }
  } catch (err) {
    alert('Authentication Failed: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Authorize Session';
  }
}

// Terminate auth session
async function handleLogout() {
  try {
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_email');
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.hash = '';
    await checkAuthAndInit();
  } catch (err) {
    console.error('Logout request failed:', err);
  }
}

// Switch dashboard tabs
function switchTab(panelId) {
  activeTab = panelId;
  
  const navButtons = document.querySelectorAll('.dashboard-sidebar .sidebar-nav-btn');
  navButtons.forEach(btn => {
    if (btn.dataset.target === panelId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const panels = document.querySelectorAll('.console-tab-panel, .dashboard-tab-panel');
  panels.forEach(p => {
    if (p.id === panelId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  if (panelId === 'panel-inbox') loadInboxCMS();
  if (panelId === 'panel-team') loadTeamCMS();
  if (panelId === 'panel-approvals') loadApprovalsCMS();

  const headingTitles = {
    'panel-analytics': 'Analytics Overview',
    'panel-content': 'General Profile Settings',
    'panel-experiences': 'Experience Registry',
    'panel-assets': 'Document & Media Assets',
    'panel-pitches': 'Curated Client Pitches',
    'panel-inbox': 'Inquiries Inbox',
    'panel-team': 'Team & Invites',
    'panel-approvals': 'Approvals Queue'
  };
  document.getElementById('panel-title').textContent = headingTitles[panelId] || 'Admin Panel';
}

// Helper to submit change requests for confirmation workflow
async function submitChangeRequest(type, payload, summary) {
  try {
    if (!supabase) throw new Error('Supabase client unavailable');

    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'pending_changes')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const queue = data ? data.value : [];
    
    const newRequest = {
      id: 'change_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      editor: localStorage.getItem('admin_email') || 'editor',
      timestamp: new Date().toLocaleString(),
      type: type,
      payload: payload,
      summary: summary
    };

    queue.push(newRequest);

    const { error: upsertError } = await supabase
      .from('site_content')
      .upsert({ key: 'pending_changes', value: queue }, { onConflict: 'key' });

    if (upsertError) throw upsertError;

    alert('Your updates have been submitted to the approvals queue. A Super Admin will review and publish them.');
  } catch (err) {
    alert('Failed to submit change request: ' + err.message);
  }
}

// Check for and process invitation token parameter
async function checkInviteToken() {
  const hash = window.location.hash;
  if (hash.includes('invite?token=')) {
    const token = hash.split('token=')[1]?.split('&')[0];
    if (token) {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('key', 'invited_admins')
          .single();
          
        if (error) throw error;
        
        const invites = data ? data.value : [];
        const invite = invites.find(i => i.token === token);
        
        if (invite && invite.status === 'pending') {
          document.getElementById('login-form').style.display = 'none';
          document.getElementById('accept-invite-form').style.display = 'block';
          
          document.getElementById('invite-email').value = invite.email;
          document.getElementById('invite-token-hidden').value = token;
          
          const head = document.querySelector('.login-widget-head');
          if (head) {
            head.querySelector('h2').textContent = 'Join the Team';
            head.querySelector('p').textContent = `Set access credentials for ${invite.email}`;
          }
        } else {
          alert('Invitation is invalid, expired, or has already been accepted.');
          window.location.hash = '#admin';
        }
      } catch (err) {
        console.error('Error verifying invite token:', err);
      }
    }
  }
}

// Submit invitation generation form
async function handleInviteSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('invite-member-email');
  const roleSelect = document.getElementById('invite-member-role');
  
  if (!emailInput || !roleSelect) return;
  
  const email = emailInput.value.trim().toLowerCase();
  const role = roleSelect.value;
  
  const token = 'invite_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  
  const newInvite = {
    email: email,
    role: role,
    token: token,
    status: 'pending'
  };
  
  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    if (invitedAdmins.some(a => a.email.toLowerCase() === email.toLowerCase())) {
      alert('This email address has already been invited.');
      return;
    }
    
    invitedAdmins.push(newInvite);
    
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: 'invited_admins', value: invitedAdmins }, { onConflict: 'key' });
      
    if (error) throw error;
    
    const inviteLink = window.location.origin + window.location.pathname + '#admin/invite?token=' + token;
    
    const resultContainer = document.getElementById('invite-result-container');
    const outputInput = document.getElementById('invite-link-output');
    const copyBtn = document.getElementById('btn-copy-invite');
    const mailBtn = document.getElementById('btn-mail-invite');
    
    if (resultContainer && outputInput) {
      outputInput.value = inviteLink;
      resultContainer.style.display = 'block';
      
      copyBtn.onclick = () => {
        outputInput.select();
        document.execCommand('copy');
        alert('Invitation link copied to clipboard!');
      };
      
      const mailtoSubject = encodeURIComponent("Administrative invitation to Amr Samir Edris site");
      const mailtoBody = encodeURIComponent(`Hello,\n\nYou have been invited as a ${role} editor on Amr Samir Edris's website console.\n\nPlease activate your access by clicking this link:\n${inviteLink}\n\nBest regards,\nWorkspace Administrator`);
      mailBtn.href = `mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`;
    }
    
    emailInput.value = '';
    loadTeamCMS();
  } catch (err) {
    alert('Failed to generate invite: ' + err.message);
  }
}

// Submit registration form to accept invite
async function handleAcceptInviteSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('invite-email').value;
  const password = document.getElementById('invite-password').value;
  const token = document.getElementById('invite-token-hidden').value;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Activating access...';
  
  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) throw signUpError;
    
    const { data: fetchInvites, error: fetchError } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'invited_admins')
      .single();
      
    if (fetchError) throw fetchError;
    
    const invites = fetchInvites ? fetchInvites.value : [];
    const inviteIndex = invites.findIndex(i => i.token === token);
    if (inviteIndex !== -1) {
      invites[inviteIndex].status = 'accepted';
    }
    
    const { error: updateError } = await supabase
      .from('site_content')
      .upsert({ key: 'invited_admins', value: invites }, { onConflict: 'key' });
      
    if (updateError) throw updateError;
    
    alert('Access activated successfully! Logging you in...');
    
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    
    localStorage.setItem('admin_role', invites[inviteIndex].role);
    localStorage.setItem('admin_email', email);
    
    window.location.hash = '#admin';
    await checkAuthAndInit();
  } catch (err) {
    alert('Failed to accept invitation: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Accept Invitation';
  }
}

// Fetch and render contact inbox submissions
async function loadInboxCMS() {
  const tbody = document.getElementById('inbox-messages-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Scanning inbox events...</td></tr>';

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_type', 'contact_inquiry')
      .order('created_at', { ascending: false });

    if (error) throw error;

    tbody.innerHTML = '';
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Inbox is empty. No messages received yet.</td></tr>';
      return;
    }

    data.forEach(event => {
      let payload = {};
      try {
        payload = JSON.parse(event.event_label);
      } catch (err) {
        payload = { message: event.event_label };
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 0.72rem; white-space: nowrap;">
          ${new Date(event.created_at).toLocaleString()}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); font-weight: 500; color: var(--text-primary);">
          ${escapeHtml(payload.name || 'Anonymous')}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color);">
          <a href="mailto:${escapeHtml(payload.email)}" style="color: var(--accent); text-decoration: none;">${escapeHtml(payload.email || 'N/A')}</a>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); font-weight: 500;">
          ${escapeHtml(payload.subject || 'Inquiry')}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); max-width: 300px; word-wrap: break-word;">
          ${escapeHtml(payload.message || '')}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading inbox:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ff453a;">Failed to load inbox: ${err.message}</td></tr>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Fetch and render admin invitations / team lists
async function loadTeamCMS() {
  const tbody = document.getElementById('team-list-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Fetching team configuration...</td></tr>';

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'invited_admins')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    invitedAdmins = data ? data.value : [];
    tbody.innerHTML = '';

    const ownerTr = document.createElement('tr');
    ownerTr.innerHTML = `
      <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); font-weight: 500; color: var(--text-primary);">amr (Owner)</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color);"><span class="badge-role superadmin">Super Admin</span></td>
      <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color);"><span style="color: #30d158; font-weight:500;">Active</span></td>
      <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); text-align: right; color: var(--text-muted); font-size: 0.75rem;">System Account</td>
    `;
    tbody.appendChild(ownerTr);

    invitedAdmins.forEach((member, idx) => {
      const tr = document.createElement('tr');
      const roleBadge = member.role === 'superadmin' ? 'Super Admin' : (member.role === 'confirmation' ? 'Read & Edit (Confirmation)' : 'Read-Only');
      const statusBadge = member.status === 'accepted' ? '<span style="color: #30d158; font-weight:500;">Accepted</span>' : '<span style="color: #ff9f0a; font-weight:500;">Pending Acceptance</span>';
      
      tr.innerHTML = `
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); font-weight: 500; color: var(--text-primary);">${escapeHtml(member.email)}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color);">${roleBadge}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color);">${statusBadge}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); text-align: right;">
          <button class="btn-apple btn-apple-outline btn-delete-member" data-index="${idx}" style="padding: 4px 8px; font-size: 0.72rem; border-color:#ff3b30; color:#ff3b30;">Remove</button>
        </td>
      `;
      
      tr.querySelector('.btn-delete-member').addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        deleteTeamMember(index);
      });

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading team:', err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ff453a;">Failed to load team list: ${err.message}</td></tr>`;
  }
}

async function deleteTeamMember(index) {
  if (!confirm('Are you sure you want to revoke access for this admin member?')) return;
  
  invitedAdmins.splice(index, 1);
  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: 'invited_admins', value: invitedAdmins }, { onConflict: 'key' });

    if (error) throw error;
    alert('Access revoked successfully.');
    loadTeamCMS();
  } catch (err) {
    alert('Failed to revoke access: ' + err.message);
  }
}

// Fetch and render pending approvals queue
async function loadApprovalsCMS() {
  const container = document.getElementById('approvals-list-container');
  if (!container) return;
  container.innerHTML = '<p style="text-align: center; padding: 20px;">Scanning pending changes queue...</p>';

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'pending_changes')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    pendingChanges = data ? data.value : [];
    container.innerHTML = '';

    if (pendingChanges.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 12px;">Approvals queue is clear. No pending changes.</div>';
      return;
    }

    pendingChanges.forEach((change, idx) => {
      const card = document.createElement('div');
      card.className = 'approval-card-item';
      
      let payloadHtml = '';
      if (change.type === 'general_settings') {
        payloadHtml = `
          <table class="approval-diff-table">
            <thead>
              <tr style="color:var(--text-primary); font-weight:600;"><td style="width:120px;">Key</td><td>New Proposed Value</td></tr>
            </thead>
            <tbody>
              ${change.payload.map(p => `<tr><td class="approval-diff-label">${p.key}</td><td class="approval-diff-new">${typeof p.value === 'object' ? JSON.stringify(p.value) : escapeHtml(String(p.value))}</td></tr>`).join('')}
            </tbody>
          </table>
        `;
      } else if (change.type === 'experience_save') {
        const exp = change.payload;
        payloadHtml = `
          <div style="font-weight: 500; margin-bottom: 4px; color: var(--text-primary);">Save Project Card:</div>
          <table class="approval-diff-table">
            <tr><td class="approval-diff-label">Role</td><td class="approval-diff-new">${escapeHtml(exp.role)}</td></tr>
            <tr><td class="approval-diff-label">Company</td><td class="approval-diff-new">${escapeHtml(exp.company)}</td></tr>
            <tr><td class="approval-diff-label">Location</td><td class="approval-diff-new">${escapeHtml(exp.location)}</td></tr>
            <tr><td class="approval-diff-label">Date Range</td><td class="approval-diff-new">${escapeHtml(exp.date_range)}</td></tr>
            <tr><td class="approval-diff-label">Description</td><td class="approval-diff-new">${escapeHtml(exp.description)}</td></tr>
          </table>
        `;
      } else if (change.type === 'experience_delete') {
        payloadHtml = `<div style="color:#ff3b30; font-weight:500;">Action: Delete Project Card with ID: ${change.payload}</div>`;
      } else {
        payloadHtml = `<pre style="font-size:0.75rem; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; overflow-x:auto;">${escapeHtml(JSON.stringify(change.payload, null, 2))}</pre>`;
      }

      card.innerHTML = `
        <div class="approval-card-header">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">${change.summary || 'Pending Edit'}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Submitted by: <strong>${escapeHtml(change.editor)}</strong> on ${change.timestamp}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-apple btn-apple-solid btn-approve-change" data-index="${idx}" style="padding: 6px 12px; font-size:0.75rem;">Approve & Publish</button>
            <button class="btn-apple btn-apple-outline btn-reject-change" data-index="${idx}" style="padding: 6px 12px; font-size:0.75rem; border-color:#ff3b30; color:#ff3b30;">Reject</button>
          </div>
        </div>
        <div class="approval-card-body">
          ${payloadHtml}
        </div>
      `;

      card.querySelector('.btn-approve-change').addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        approvePendingChange(index);
      });

      card.querySelector('.btn-reject-change').addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        rejectPendingChange(index);
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading approvals queue:', err);
    container.innerHTML = `<p style="color: #ff453a; text-align: center; padding: 20px;">Failed to load approvals: ${err.message}</p>`;
  }
}

async function approvePendingChange(index) {
  const change = pendingChanges[index];
  if (!confirm(`Are you sure you want to approve and publish changes submitted by ${change.editor}?`)) return;

  try {
    if (!supabase) throw new Error('Supabase client unavailable');

    if (change.type === 'general_settings') {
      for (const item of change.payload) {
        const { error } = await supabase
          .from('site_content')
          .upsert(item, { onConflict: 'key' });
        if (error) throw error;
      }
    } else if (change.type === 'experience_save') {
      const { error } = await supabase
        .from('experiences')
        .upsert(change.payload, { onConflict: 'id' });
      if (error) throw error;
    } else if (change.type === 'experience_delete') {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', change.payload);
      if (error) throw error;
    } else if (change.type === 'calendar_status') {
      const { error } = await supabase
        .from('site_content')
        .upsert({ key: 'calendar_status', value: change.payload }, { onConflict: 'key' });
      if (error) throw error;
    } else if (change.type === 'crew_structure') {
      const { error } = await supabase
        .from('site_content')
        .upsert({ key: 'crew_structure', value: change.payload }, { onConflict: 'key' });
      if (error) throw error;
    } else if (change.type === 'pitch_save') {
      const { error } = await supabase
        .from('site_content')
        .upsert({ key: 'pitches', value: change.payload }, { onConflict: 'key' });
      if (error) throw error;
    }

    pendingChanges.splice(index, 1);
    const { error: queueError } = await supabase
      .from('site_content')
      .upsert({ key: 'pending_changes', value: pendingChanges }, { onConflict: 'key' });
    if (queueError) throw queueError;

    alert('Change approved and published live successfully!');
    loadApprovalsCMS();
    
    if (change.type === 'general_settings') {
      loadGeneralSettingsCMS();
    }
  } catch (err) {
    alert('Approving failed: ' + err.message);
  }
}

async function rejectPendingChange(index) {
  const change = pendingChanges[index];
  if (!confirm(`Are you sure you want to reject and discard edits from ${change.editor}?`)) return;

  try {
    if (!supabase) throw new Error('Supabase client unavailable');

    pendingChanges.splice(index, 1);
    const { error: queueError } = await supabase
      .from('site_content')
      .upsert({ key: 'pending_changes', value: pendingChanges }, { onConflict: 'key' });
    if (queueError) throw queueError;

    alert('Change rejected and removed from queue.');
    loadApprovalsCMS();
  } catch (err) {
    alert('Rejecting failed: ' + err.message);
  }
}

// ==========================================================================
// Analytics Dashboard Logic
// ==========================================================================
async function loadAnalyticsData() {
  try {
    if (!supabase) return;
    
    // Fetch analytics events from db
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Compute KPI metrics
    const sessionsList = new Set(events.map(e => e.session_id));
    const totalVisitors = sessionsList.size;
    const pageviews = events.filter(e => e.event_type === 'pageview').length;
    
    const cvViews = events.filter(e => e.event_type === 'pdf_view' && e.event_label === 'CV').length;
    const cvDownloads = events.filter(e => e.event_type === 'pdf_download' && e.event_label === 'CV').length;
    
    const portfolioViews = events.filter(e => e.event_type === 'pdf_view' && e.event_label === 'Portfolio').length;
    const portfolioDownloads = events.filter(e => e.event_type === 'pdf_download' && e.event_label === 'Portfolio').length;
    
    // Render text metrics
    document.getElementById('stat-visitors').textContent = totalVisitors;
    document.getElementById('stat-pageviews').textContent = pageviews;
    document.getElementById('stat-cv').textContent = `${cvViews} / ${cvDownloads}`;
    document.getElementById('stat-portfolio').textContent = `${portfolioViews} / ${portfolioDownloads}`;

    // Render Chart.js visual assets
    renderVisitsChart(events);
    renderDurationsChart(events);
    renderSectionsTable(events);
    renderSessionInitTables(events);
    
  } catch (err) {
    console.warn('Analytics retrieval error:', err.message);
  }
}

// Render line chart representing views progression
function renderVisitsChart(events) {
  const ctx = document.getElementById('chart-visits');
  if (!ctx) return;

  const views = events.filter(e => e.event_type === 'pageview');
  
  const visitsByDate = {};
  views.forEach(v => {
    const dateFormatted = new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    visitsByDate[dateFormatted] = (visitsByDate[dateFormatted] || 0) + 1;
  });
  
  const labels = Object.keys(visitsByDate);
  const datasetValues = Object.values(visitsByDate);

  if (visitsChart) visitsChart.destroy();

  // Dynamic Theme Styling configurations for Chart
  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? '#86868b' : '#515154';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const accentColor = isDark ? '#2997ff' : '#0071e3';
  const accentGlow = isDark ? 'rgba(41, 151, 255, 0.03)' : 'rgba(0, 113, 227, 0.02)';

  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  Chart.defaults.color = textColor;

  visitsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['No Logs'],
      datasets: [{
        label: 'Views',
        data: datasetValues.length > 0 ? datasetValues : [0],
        borderColor: accentColor,
        backgroundColor: accentGlow,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: accentColor,
        pointHoverBackgroundColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          grid: { color: gridColor },
          border: { dash: [4, 4] }
        },
        x: { 
          grid: { color: gridColor },
          border: { dash: [4, 4] }
        }
      }
    }
  });
}

// Render bar chart representing average stay duration per section
function renderDurationsChart(events) {
  const ctx = document.getElementById('chart-durations');
  if (!ctx) return;

  const sectionViews = events.filter(e => e.event_type === 'section_view');
  
  const sectionTotalTimes = {};
  const sectionCounts = {};
  
  sectionViews.forEach(v => {
    const labelName = v.event_label;
    sectionTotalTimes[labelName] = (sectionTotalTimes[labelName] || 0) + v.duration;
    sectionCounts[labelName] = (sectionCounts[labelName] || 0) + 1;
  });
  
  const labels = Object.keys(sectionTotalTimes);
  const averagesList = labels.map(sec => Math.round(sectionTotalTimes[sec] / sectionCounts[sec]));

  if (durationsChart) durationsChart.destroy();

  const isDark = document.body.classList.contains('dark-theme');
  const accentColor = isDark ? '#2997ff' : '#0071e3';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  durationsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['No Logs'],
      datasets: [{
        label: 'Seconds',
        data: averagesList.length > 0 ? averagesList : [0],
        backgroundColor: accentColor,
        borderRadius: 4,
        barThickness: 20
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          grid: { color: gridColor },
          border: { dash: [4, 4] }
        },
        x: { 
          grid: { display: false }
        }
      }
    }
  });
}

// Render details list table for durations
function renderSectionsTable(events) {
  const tbody = document.getElementById('table-sections-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const sectionViews = events.filter(e => e.event_type === 'section_view');
  const totals = {};
  const hitCounts = {};
  
  sectionViews.forEach(v => {
    const sec = v.event_label;
    totals[sec] = (totals[sec] || 0) + v.duration;
    hitCounts[sec] = (hitCounts[sec] || 0) + 1;
  });
  
  if (Object.keys(totals).length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No sections visibility recorded yet.</td></tr>`;
    return;
  }
  
  for (const sec in totals) {
    const accumTime = totals[sec];
    const hits = hitCounts[sec];
    const avgVal = Math.round(accumTime / hits);
    
    let timeStr = `${accumTime}s`;
    if (accumTime > 60) {
      timeStr = `${Math.floor(accumTime / 60)}m ${accumTime % 60}s`;
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${sec}</strong></td>
      <td>${timeStr}</td>
      <td>${avgVal}s</td>
      <td>${hits} entries</td>
    `;
    tbody.appendChild(tr);
  }
}

// Render referrers and countries tables from session_init events
function renderSessionInitTables(events) {
  const refTbody = document.getElementById('table-referrers-body');
  const countryTbody = document.getElementById('table-countries-body');
  
  if (!refTbody || !countryTbody) return;
  
  refTbody.innerHTML = '';
  countryTbody.innerHTML = '';
  
  const initEvents = events.filter(e => e.event_type === 'session_init');
  
  const referrers = {};
  const countries = {};
  
  initEvents.forEach(e => {
    try {
      const data = JSON.parse(e.event_label);
      if (data.referrer) {
        referrers[data.referrer] = (referrers[data.referrer] || 0) + 1;
      }
      if (data.country) {
        countries[data.country] = (countries[data.country] || 0) + 1;
      }
    } catch (err) {
      // Ignore parsing errors for malformed legacy labels
    }
  });
  
  // Sort and render referrers
  const sortedReferrers = Object.entries(referrers).sort((a, b) => b[1] - a[1]);
  if (sortedReferrers.length === 0) {
    refTbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted); padding: 12px 8px;">No referrer data recorded yet.</td></tr>`;
  } else {
    sortedReferrers.forEach(([ref, count]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color);"><strong>${escapeHtml(ref)}</strong></td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); text-align: right; color: var(--accent); font-weight: 500;">${count} sessions</td>
      `;
      refTbody.appendChild(tr);
    });
  }
  
  // Sort and render countries
  const sortedCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]);
  if (sortedCountries.length === 0) {
    countryTbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted); padding: 12px 8px;">No country data recorded yet.</td></tr>`;
  } else {
    sortedCountries.forEach(([country, count]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color);"><strong>${escapeHtml(country)}</strong></td>
        <td style="padding: 12px 8px; border-bottom: 1px solid var(--border-color); text-align: right; color: var(--accent); font-weight: 500;">${count} sessions</td>
      `;
      countryTbody.appendChild(tr);
    });
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
    
    const siteSettings = {};
    data.forEach(item => {
      siteSettings[item.key] = item.value;
    });
    
    siteContent = siteSettings; // Save globally in admin.js

    document.getElementById('cms-name').value = siteSettings.name || '';
    document.getElementById('cms-status').value = siteSettings.status_badge || 'Available for Projects';
    
    const titlesArray = siteSettings.titles || [];
    document.getElementById('cms-titles').value = Array.isArray(titlesArray) ? titlesArray.join(', ') : titlesArray;
    
    document.getElementById('cms-summary').value = siteSettings.summary || '';
    document.getElementById('cms-email').value = siteSettings.email || '';
    document.getElementById('cms-phone').value = siteSettings.phone || '';
    document.getElementById('cms-linkedin').value = siteSettings.linkedin || '';
    
    const gaEl = document.getElementById('cms-ga-id');
    if (gaEl) gaEl.value = siteSettings.google_analytics_id || '';

    const clarityEl = document.getElementById('cms-clarity-id');
    if (clarityEl) clarityEl.value = siteSettings.clarity_id || '';

    const pixelEl = document.getElementById('cms-pixel-id');
    if (pixelEl) pixelEl.value = siteSettings.fb_pixel_id || '';

    const umamiEl = document.getElementById('cms-umami-id');
    if (umamiEl) umamiEl.value = siteSettings.umami_website_id || '';
    
    // Chain-load interactive features panels
    loadCalendarCMS();
    loadCrewCMSInit();
    loadPitchesCMS();
  } catch (err) {
    console.warn('CMS general config initialization failed:', err.message);
  }
}

async function saveGeneralSettings(e) {
  e.preventDefault();
  
  const role = localStorage.getItem('admin_role');
  if (role === 'readonly') {
    alert('Permission Denied: Read-only accounts cannot modify settings.');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = role === 'confirmation' ? 'Submitting request...' : 'Saving configuration...';

  const nameVal = document.getElementById('cms-name').value;
  const statusVal = document.getElementById('cms-status').value;
  const titlesList = document.getElementById('cms-titles').value.split(',').map(t => t.trim());
  const summaryVal = document.getElementById('cms-summary').value;
  const emailVal = document.getElementById('cms-email').value;
  const phoneVal = document.getElementById('cms-phone').value;
  const linkedinVal = document.getElementById('cms-linkedin').value;

  const payloads = [
    { key: 'name', value: nameVal },
    { key: 'status_badge', value: statusVal },
    { key: 'titles', value: titlesList },
    { key: 'summary', value: summaryVal },
    { key: 'email', value: emailVal },
    { key: 'phone', value: phoneVal },
    { key: 'linkedin', value: linkedinVal }
  ];

  if (role === 'confirmation') {
    try {
      await submitChangeRequest('general_settings', payloads, 'Update profile information (Name, status, bio, contacts)');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit for Approval';
    }
    return;
  }

  try {
    if (!supabase) throw new Error('Supabase client unavailable');

    for (const item of payloads) {
      const { error } = await supabase
        .from('site_content')
        .upsert(item, { onConflict: 'key' });
      if (error) throw error;
    }

    alert('General settings committed successfully!');
    if (window.location.hash !== '#admin') {
      window.location.reload();
    }
  } catch (err) {
    alert('CMS Update Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Commit Configuration';
  }
}

async function saveAnalyticsIntegration(e) {
  e.preventDefault();
  
  const role = localStorage.getItem('admin_role');
  if (role === 'readonly') {
    alert('Permission Denied: Read-only accounts cannot modify settings.');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = role === 'confirmation' ? 'Submitting request...' : 'Saving...';

  const gaVal = document.getElementById('cms-ga-id').value.trim();
  const clarityVal = document.getElementById('cms-clarity-id').value.trim();
  const pixelVal = document.getElementById('cms-pixel-id').value.trim();
  const umamiVal = document.getElementById('cms-umami-id').value.trim();

  const payloads = [
    { key: 'google_analytics_id', value: gaVal },
    { key: 'clarity_id', value: clarityVal },
    { key: 'fb_pixel_id', value: pixelVal },
    { key: 'umami_website_id', value: umamiVal }
  ];

  if (role === 'confirmation') {
    try {
      await submitChangeRequest('general_settings', payloads, 'Update third-party analytics integrations');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit for Approval';
    }
    return;
  }

  try {
    if (!supabase) throw new Error('Supabase client unavailable');

    for (const item of payloads) {
      const { error } = await supabase
        .from('site_content')
        .upsert(item, { onConflict: 'key' });
      if (error) throw error;
    }

    alert('Analytics integrations saved successfully!');
  } catch (err) {
    alert('Analytics Update Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Analytics Integration';
  }
}

// ==========================================================================
// Experiences CMS Logic
// ==========================================================================
async function loadExperiencesCMS() {
  const container = document.getElementById('experiences-list-container');
  if (!container) return;

  container.innerHTML = 'Retrieving credentials...';

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { data: list, error } = await supabase
      .from('experiences')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    currentExperiences = list;

    container.innerHTML = '';
    if (list.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No active cards. Click Add above to create.</p>';
      return;
    }

    list.forEach(exp => {
      const row = document.createElement('div');
      row.className = 'console-cms-list-row';
      
      row.innerHTML = `
        <div>
          <h4>${exp.role} @ ${exp.company}</h4>
          <p>${exp.category} | ${exp.date_range}</p>
        </div>
        <div class="console-row-actions">
          <button class="btn-apple btn-apple-outline btn-mini-action btn-edit" data-id="${exp.id}">Edit</button>
          <button class="btn-apple btn-mini-action-danger btn-mini-action btn-delete" data-id="${exp.id}">Delete</button>
        </div>
      `;

      row.querySelector('.btn-edit').addEventListener('click', () => openExperienceModal(exp));
      row.querySelector('.btn-delete').addEventListener('click', () => deleteExperience(exp.id));

      container.appendChild(row);
    });

  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; font-size: 0.85rem;">Load Failure: ${err.message}</p>`;
  }
}

function openExperienceModal(exp = null) {
  const modal = document.getElementById('experience-edit-modal');
  const modalHeading = document.getElementById('exp-modal-title');
  if (!modal) return;

  if (exp) {
    modalHeading.textContent = 'Edit Experience Card';
    document.getElementById('exp-id').value = exp.id;
    document.getElementById('exp-role').value = exp.role;
    document.getElementById('exp-company').value = exp.company;
    document.getElementById('exp-location').value = exp.location || '';
    document.getElementById('exp-date').value = exp.date_range;
    document.getElementById('exp-category').value = exp.category;
    document.getElementById('exp-description').value = exp.description || '';
    document.getElementById('exp-budget').value = exp.budget_usd || 0;
    
    const detailsTxt = Array.isArray(exp.details) ? exp.details.join('\n') : exp.details;
    document.getElementById('exp-details').value = detailsTxt || '';
    
    document.getElementById('exp-metric-1-val').value = exp.impact_metrics?.val1 || '';
    document.getElementById('exp-metric-1-lbl').value = exp.impact_metrics?.lbl1 || '';
    document.getElementById('exp-metric-2-val').value = exp.impact_metrics?.val2 || '';
    document.getElementById('exp-metric-2-lbl').value = exp.impact_metrics?.lbl2 || '';
  } else {
    modalHeading.textContent = 'Add Experience Card';
    document.getElementById('experience-form').reset();
    document.getElementById('exp-id').value = '';
    document.getElementById('exp-budget').value = 0;
  }

  modal.classList.add('active');
}

function closeExperienceModal() {
  document.getElementById('experience-edit-modal').classList.remove('active');
}

async function saveExperience(e) {
  e.preventDefault();
  
  const role = localStorage.getItem('admin_role');
  if (role === 'readonly') {
    alert('Permission Denied: Read-only accounts cannot modify settings.');
    return;
  }
  
  const idValue = document.getElementById('exp-id').value;
  const roleVal = document.getElementById('exp-role').value;
  const companyVal = document.getElementById('exp-company').value;
  const locationVal = document.getElementById('exp-location').value;
  const dateVal = document.getElementById('exp-date').value;
  const catVal = document.getElementById('exp-category').value;
  const descVal = document.getElementById('exp-description').value;
  const budgetVal = parseFloat(document.getElementById('exp-budget').value) || 0;
  
  const detailsList = document.getElementById('exp-details').value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const metricVal1 = document.getElementById('exp-metric-1-val').value;
  const metricLbl1 = document.getElementById('exp-metric-1-lbl').value;
  const metricVal2 = document.getElementById('exp-metric-2-val').value;
  const metricLbl2 = document.getElementById('exp-metric-2-lbl').value;

  const payload = {
    role: roleVal,
    company: companyVal,
    location: locationVal,
    date_range: dateVal,
    category: catVal,
    description: descVal,
    budget_usd: budgetVal,
    details: detailsList,
    impact_metrics: { val1: metricVal1, lbl1: metricLbl1, val2: metricVal2, lbl2: metricLbl2 }
  };

  if (role === 'confirmation') {
    const approvalPayload = { ...payload };
    approvalPayload.id = idValue || 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    if (!idValue) {
      approvalPayload.order_index = currentExperiences.length;
    }
    await submitChangeRequest('experience_save', approvalPayload, `Save project card: "${roleVal} @ ${companyVal}"`);
    closeExperienceModal();
    return;
  }

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    if (idValue) {
      const { error } = await supabase
        .from('experiences')
        .update(payload)
        .eq('id', idValue);
      if (error) throw error;
    } else {
      payload.order_index = currentExperiences.length;
      const { error } = await supabase
        .from('experiences')
        .insert([payload]);
      if (error) throw error;
    }

    closeExperienceModal();
    loadExperiencesCMS();
  } catch (err) {
    alert('Failed to save project card: ' + err.message);
  }
}

async function deleteExperience(id) {
  const role = localStorage.getItem('admin_role');
  if (role === 'readonly') {
    alert('Permission Denied: Read-only accounts cannot modify settings.');
    return;
  }

  if (!confirm('Are you sure you want to delete this card?')) return;

  if (role === 'confirmation') {
    const exp = currentExperiences.find(e => e.id === id);
    const title = exp ? `"${exp.role} @ ${exp.company}"` : `ID ${id}`;
    await submitChangeRequest('experience_delete', id, `Delete project card: ${title}`);
    return;
  }

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id);

    if (error) throw error;
    loadExperiencesCMS();
  } catch (err) {
    alert('Deletion Request Failed: ' + err.message);
  }
}

// ==========================================================================
// Assets & Vercel Webhook CMS Logic
// ==========================================================================
async function loadVercelSettings() {
  try {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'vercel_hook')
      .single();
      
    if (!error && data) {
      vercelHookUrl = data.value;
      document.getElementById('vercel-hook-input').value = vercelHookUrl;
      document.getElementById('btn-trigger-redeploy').disabled = !vercelHookUrl;
    }
  } catch (err) {
    console.log('No vercel hook configured yet.');
  }
}

async function saveVercelHook(e) {
  e.preventDefault();
  
  const role = localStorage.getItem('admin_role');
  if (role !== 'superadmin') {
    alert('Permission Denied: Only Super Admins can save webhook URLs.');
    return;
  }

  const input = document.getElementById('vercel-hook-input').value.trim();
  
  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: 'vercel_hook', value: input }, { onConflict: 'key' });
      
    if (error) throw error;
    
    vercelHookUrl = input;
    document.getElementById('btn-trigger-redeploy').disabled = !vercelHookUrl;
    
    const statusEl = document.getElementById('vercel-deploy-status');
    statusEl.textContent = 'Deploy hook URL saved successfully!';
    statusEl.style.color = '#34c759'; // Green
  } catch (err) {
    alert('Failed to save webhook URL: ' + err.message);
  }
}

// Trigger production rebuild in Vercel
async function triggerVercelRedeploy() {
  const role = localStorage.getItem('admin_role');
  if (role !== 'superadmin') {
    alert('Permission Denied: Only Super Admins can trigger production redeployments.');
    return;
  }

  if (!vercelHookUrl) return;
  
  const statusEl = document.getElementById('vercel-deploy-status');
  const btn = document.getElementById('btn-trigger-redeploy');
  
  statusEl.textContent = 'Triggering production rebuild...';
  statusEl.style.color = 'var(--accent)';
  btn.disabled = true;

  try {
    const response = await fetch(vercelHookUrl, {
      method: 'POST'
    });
    
    if (response.ok) {
      statusEl.textContent = 'Build webhook triggered successfully! Vercel is compiling...';
      statusEl.style.color = '#34c759'; // Green
    } else {
      throw new Error(`Server returned status: ${response.status}`);
    }
  } catch (err) {
    statusEl.textContent = 'Failed to trigger rebuild: ' + err.message;
    statusEl.style.color = '#ff3b30'; // Red
  } finally {
    setTimeout(() => {
      btn.disabled = false;
    }, 5000);
  }
}

async function loadAssetsCMS() {
  const container = document.getElementById('admin-logos-list');
  if (!container) return;

  container.innerHTML = 'Loading active marks...';

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { data: files, error } = await supabase.storage.from('assets').list('logos');
    if (error) throw error;
    
    container.innerHTML = '';
    if (!files || files.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); grid-column: span 4; font-size: 0.82rem;">No custom marks uploaded yet.</p>';
      return;
    }

    files.forEach(file => {
      if (file.name === '.emptyFolderPlaceholder') return;
      
      const fileUrl = supabase.storage.from('assets').getPublicUrl(`logos/${file.name}`).data.publicUrl;
      
      const card = document.createElement('div');
      card.className = 'console-cms-list-row';
      card.style.padding = '12px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
      card.style.gap = '8px';
      
      card.innerHTML = `
        <div style="height: 36px; display: flex; align-items: center; justify-content: center;">
          <span style="font-family: var(--font-sans); font-size: 0.8rem; font-weight: 500;">${file.name}</span>
        </div>
        <button class="btn-apple btn-mini-action-danger btn-mini-action" style="width: 100%;" data-name="${file.name}">
          Delete
        </button>
      `;

      card.querySelector('button').addEventListener('click', () => deleteLogo(file.name));
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p style="color: #ff3b30; grid-column: span 4; font-size: 0.82rem;">Listing Fail: ${err.message}</p>`;
  }
}

// Upload PDF assets
async function uploadAsset(file, bucketFilename, statusElId) {
  const role = localStorage.getItem('admin_role');
  if (role !== 'superadmin') {
    alert('Permission Denied: Only Super Admins can upload document assets.');
    return;
  }

  const statusIndicator = document.getElementById(statusElId);
  if (!file) return;

  statusIndicator.textContent = 'Uploading asset...';

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase.storage.from('assets').upload(bucketFilename, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) throw error;
    
    statusIndicator.textContent = 'Upload complete! Live file updated.';
    statusIndicator.style.color = '#34c759'; // Green
  } catch (err) {
    statusIndicator.textContent = 'Upload failed: ' + err.message;
    statusIndicator.style.color = '#ff3b30'; // Red
  }
}

// Upload Logo images
async function uploadLogo(file) {
  const role = localStorage.getItem('admin_role');
  if (role !== 'superadmin') {
    alert('Permission Denied: Only Super Admins can upload brand logos.');
    return;
  }

  const statusIndicator = document.getElementById('logo-upload-status');
  if (!file) return;

  statusIndicator.textContent = 'Uploading new mark...';

  const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const bucketFilepath = `logos/${cleanFilename}`;

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase.storage.from('assets').upload(bucketFilepath, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) throw error;
    
    statusIndicator.textContent = 'Mark added successfully!';
    statusIndicator.style.color = '#34c759'; // Green
    
    loadAssetsCMS();
  } catch (err) {
    statusIndicator.textContent = 'Upload failed: ' + err.message;
    statusIndicator.style.color = '#ff3b30'; // Red
  }
}

// Delete Logo images
async function deleteLogo(filename) {
  const role = localStorage.getItem('admin_role');
  if (role !== 'superadmin') {
    alert('Permission Denied: Only Super Admins can delete brand logos.');
    return;
  }

  if (!confirm(`Confirm removal of logo mark: "${filename}"?`)) return;

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase.storage.from('assets').remove([`logos/${filename}`]);
    if (error) throw error;

    loadAssetsCMS();
  } catch (err) {
    alert('Removal request failed: ' + err.message);
  }
}

// ==========================================================================
// Calendar Availability CMS Logic
// ==========================================================================
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

function loadCalendarCMS() {
  const container = document.getElementById('cms-calendar-months');
  if (!container) return;
  
  container.innerHTML = '';
  const months = getUpcomingMonths();
  const dbStatus = siteContent.calendar_status || {};
  
  months.forEach(month => {
    const status = dbStatus[month] || 'Available';
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.marginBottom = '10px';
    div.style.borderBottom = '1px solid var(--border-color)';
    div.style.paddingBottom = '8px';
    
    div.innerHTML = `
      <span style="font-size: 0.88rem; font-weight: 500; color: #fff;">${month}</span>
      <select class="text-input-field cms-calendar-select" data-month="${month}" style="width: 140px; margin-bottom: 0; padding: 6px 12px;">
        <option value="Available" ${status === 'Available' ? 'selected' : ''}>Available</option>
        <option value="Fully Booked" ${status === 'Fully Booked' ? 'selected' : ''}>Fully Booked</option>
        <option value="Tentative" ${status === 'Tentative' ? 'selected' : ''}>Tentative</option>
      </select>
    `;
    container.appendChild(div);
  });
}

async function saveCalendarStatus() {
  const role = localStorage.getItem('admin_role');
  if (role === 'readonly') {
    alert('Permission Denied: Read-only accounts cannot modify settings.');
    return;
  }

  const container = document.getElementById('cms-calendar-months');
  if (!container) return;
  
  const selects = container.querySelectorAll('.cms-calendar-select');
  const statusObj = {};
  
  selects.forEach(sel => {
    statusObj[sel.dataset.month] = sel.value;
  });
  
  const saveBtn = document.getElementById('btn-save-calendar');
  saveBtn.disabled = true;
  saveBtn.textContent = role === 'confirmation' ? 'Submitting request...' : 'Saving...';
  
  if (role === 'confirmation') {
    try {
      await submitChangeRequest('calendar_status', statusObj, 'Update calendar availability status');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Submit for Approval';
    }
    return;
  }
  
  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: 'calendar_status', value: statusObj }, { onConflict: 'key' });
      
    if (error) throw error;
    alert('Calendar availability saved successfully!');
  } catch (err) {
    alert('Failed to save calendar status: ' + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Calendar Status';
  }
}

// ==========================================================================
// Crew Structure CMS Logic
// ==========================================================================
function loadCrewCMSInit() {
  const crew = siteContent.crew_structure || FALLBACK_CREW;
  renderCrewCMS(crew);
}

function renderCrewCMS(crew) {
  const container = document.getElementById('cms-crew-members-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  crew.forEach((node, idx) => {
    const div = document.createElement('div');
    div.className = 'cms-crew-node-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.alignItems = 'center';
    
    div.innerHTML = `
      <input type="text" class="text-input-field role-input" style="flex: 2; margin-bottom: 0;" placeholder="Role (e.g. Stage Manager)" value="${node.role || ''}" required>
      <input type="text" class="text-input-field name-input" style="flex: 2; margin-bottom: 0;" placeholder="Name (e.g. Elena)" value="${node.name || ''}" required>
      <select class="text-input-field level-select" style="flex: 1; margin-bottom: 0; padding: 10px 8px;">
        <option value="1" ${parseInt(node.level) === 1 ? 'selected' : ''}>Lvl 1 (Top)</option>
        <option value="2" ${parseInt(node.level) === 2 ? 'selected' : ''}>Lvl 2 (Mid)</option>
        <option value="3" ${parseInt(node.level) === 3 ? 'selected' : ''}>Lvl 3 (Base)</option>
      </select>
      <button type="button" class="btn-apple btn-mini-action-danger btn-delete-crew-node" style="padding: 10px 14px;" data-idx="${idx}">&times;</button>
    `;
    
    div.querySelector('.btn-delete-crew-node').addEventListener('click', () => {
      const currentCrew = getCrewFromCMSInputs();
      currentCrew.splice(idx, 1);
      renderCrewCMS(currentCrew);
    });
    
    container.appendChild(div);
  });
}

function getCrewFromCMSInputs() {
  const container = document.getElementById('cms-crew-members-container');
  if (!container) return [];
  
  const rows = container.querySelectorAll('.cms-crew-node-row');
  const crew = [];
  
  rows.forEach((row, idx) => {
    const role = row.querySelector('.role-input').value.trim();
    const name = row.querySelector('.name-input').value.trim();
    const level = parseInt(row.querySelector('.level-select').value) || 3;
    
    crew.push({ id: String(idx + 1), role, name, level });
  });
  
  return crew;
}

async function saveCrewStructure() {
  const role = localStorage.getItem('admin_role');
  if (role === 'readonly') {
    alert('Permission Denied: Read-only accounts cannot modify settings.');
    return;
  }

  const crew = getCrewFromCMSInputs();
  const saveBtn = document.getElementById('btn-save-crew');
  saveBtn.disabled = true;
  saveBtn.textContent = role === 'confirmation' ? 'Submitting request...' : 'Saving...';
  
  if (role === 'confirmation') {
    try {
      await submitChangeRequest('crew_structure', crew, 'Update production crew structure blueprint');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Submit for Approval';
    }
    return;
  }

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: 'crew_structure', value: crew }, { onConflict: 'key' });
      
    if (error) throw error;
    alert('Crew structure saved successfully!');
  } catch (err) {
    alert('Failed to save crew structure: ' + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Crew Structure';
  }
}

// ==========================================================================
// Curated Client Pitches CMS Logic
// ==========================================================================
async function loadPitchesCMS() {
  const container = document.getElementById('pitches-list-container');
  if (!container) return;

  container.innerHTML = 'Retrieving pitches...';

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'pitches')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    currentPitches = (data && data.value) ? data.value : [];

    container.innerHTML = '';
    if (currentPitches.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No active client pitches. Click Create above to generate one.</p>';
      return;
    }

    currentPitches.forEach((pitch, idx) => {
      const row = document.createElement('div');
      row.className = 'console-cms-list-row';
      
      const shareUrl = `${window.location.origin}/#pitch/${pitch.slug}`;
      
      row.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 0.92rem;">${pitch.title}</h4>
          <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            Route: <code style="background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; color: var(--accent);">${shareUrl}</code>
          </p>
          <p style="margin: 0; font-size: 0.72rem; color: var(--text-muted);">${pitch.project_ids ? pitch.project_ids.length : 0} projects selected</p>
        </div>
        <div class="console-row-actions">
          <button class="btn-apple btn-apple-outline btn-mini-action btn-copy-link" data-url="${shareUrl}">Copy Link</button>
          <button class="btn-apple btn-apple-outline btn-mini-action btn-edit-pitch" data-idx="${idx}">Edit</button>
          <button class="btn-apple btn-mini-action-danger btn-mini-action btn-delete-pitch" data-idx="${idx}">Delete</button>
        </div>
      `;

      row.querySelector('.btn-copy-link').addEventListener('click', (e) => {
        navigator.clipboard.writeText(e.target.dataset.url);
        e.target.textContent = 'Copied!';
        setTimeout(() => { e.target.textContent = 'Copy Link'; }, 2000);
      });

      row.querySelector('.btn-edit-pitch').addEventListener('click', () => openPitchModal(pitch, idx));
      row.querySelector('.btn-delete-pitch').addEventListener('click', () => deletePitch(idx));

      container.appendChild(row);
    });

  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; font-size: 0.85rem;">Load Failure: ${err.message}</p>`;
  }
}

function openPitchModal(pitch = null, index = null) {
  const modal = document.getElementById('pitch-edit-modal');
  const form = document.getElementById('pitch-form');
  const title = document.getElementById('pitch-modal-title');
  const selector = document.getElementById('pitch-projects-selector');
  
  if (!modal || !form || !selector) return;

  selector.innerHTML = '';
  if (currentExperiences.length === 0) {
    selector.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem; margin:0;">No projects available. Create projects first.</p>';
  } else {
    currentExperiences.forEach(exp => {
      const isChecked = pitch && pitch.project_ids && pitch.project_ids.includes(exp.id);
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '8px';
      div.style.marginBottom = '6px';
      
      div.innerHTML = `
        <input type="checkbox" id="pitch-proj-${exp.id}" class="pitch-project-checkbox" value="${exp.id}" ${isChecked ? 'checked' : ''}>
        <label for="pitch-proj-${exp.id}" style="font-size: 0.82rem; color: #eee; cursor: pointer; user-select: none;">${exp.role} @ ${exp.company}</label>
      `;
      selector.appendChild(div);
    });
  }

  if (pitch) {
    title.textContent = 'Edit Curated Pitch';
    document.getElementById('pitch-id').value = index !== null ? index : '';
    document.getElementById('pitch-title').value = pitch.title;
    document.getElementById('pitch-slug').value = pitch.slug;
    document.getElementById('pitch-greeting').value = pitch.greeting;
    document.getElementById('pitch-passcode').value = pitch.passcode || '';
  } else {
    title.textContent = 'Create Curated Pitch Link';
    form.reset();
    document.getElementById('pitch-id').value = '';
    document.getElementById('pitch-passcode').value = '';
  }

  modal.classList.add('active');
}

function closePitchModal() {
  const modal = document.getElementById('pitch-edit-modal');
  if (modal) modal.classList.remove('active');
}

async function savePitch(e) {
  e.preventDefault();
  
  const role = localStorage.getItem('admin_role');
  if (role === 'readonly') {
    alert('Permission Denied: Read-only accounts cannot modify settings.');
    return;
  }
  
  const indexVal = document.getElementById('pitch-id').value;
  const titleVal = document.getElementById('pitch-title').value.trim();
  const slugVal = document.getElementById('pitch-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const greetingVal = document.getElementById('pitch-greeting').value.trim();
  const passcodeVal = document.getElementById('pitch-passcode').value.trim();
  
  const checkedCheckboxes = document.querySelectorAll('.pitch-project-checkbox:checked');
  const projectIds = Array.from(checkedCheckboxes).map(cb => cb.value);

  const payload = {
    title: titleVal,
    slug: slugVal,
    greeting: greetingVal,
    project_ids: projectIds,
    passcode: passcodeVal
  };

  const newPitches = [...currentPitches];
  if (indexVal !== '') {
    newPitches[parseInt(indexVal)] = payload;
  } else {
    if (newPitches.some(p => p.slug === slugVal)) {
      alert('A pitch link with this slug already exists. Please choose a different slug.');
      return;
    }
    newPitches.push(payload);
  }

  if (role === 'confirmation') {
    await submitChangeRequest('pitch_save', newPitches, `Save curated pitch link for client: "${titleVal}"`);
    closePitchModal();
    return;
  }

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: 'pitches', value: newPitches }, { onConflict: 'key' });

    if (error) throw error;
    
    closePitchModal();
    loadPitchesCMS();
  } catch (err) {
    alert('Failed to save pitch: ' + err.message);
  }
}

async function deletePitch(index) {
  const role = localStorage.getItem('admin_role');
  if (role === 'readonly') {
    alert('Permission Denied: Read-only accounts cannot modify settings.');
    return;
  }

  if (!confirm('Are you sure you want to delete this pitch?')) return;

  const newPitches = [...currentPitches];
  newPitches.splice(index, 1);

  if (role === 'confirmation') {
    const pitch = currentPitches[index];
    const title = pitch ? `"${pitch.title}"` : `index ${index}`;
    await submitChangeRequest('pitch_save', newPitches, `Delete curated pitch link: ${title}`);
    return;
  }

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: 'pitches', value: newPitches }, { onConflict: 'key' });

    if (error) throw error;
    loadPitchesCMS();
  } catch (err) {
    alert('Deletion Request Failed: ' + err.message);
  }
}

// ==========================================================================
// CSV Analytics Exporter
// ==========================================================================
async function exportAnalyticsToCSV() {
  const exportBtn = document.getElementById('btn-export-csv');
  exportBtn.disabled = true;
  exportBtn.textContent = 'Exporting...';

  try {
    if (!supabase) throw new Error('Supabase client unavailable');
    
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!events || events.length === 0) {
      alert('No analytics data available to export.');
      return;
    }

    const headers = ['ID', 'Session ID', 'Event Type', 'Event Label', 'Duration (s)', 'Timestamp'];
    const csvRows = [headers.join(',')];

    events.forEach(e => {
      const row = [
        e.id,
        `"${e.session_id || ''}"`,
        `"${e.event_type || ''}"`,
        `"${e.event_label || ''}"`,
        e.duration || 0,
        `"${e.created_at || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `amrsamirsite_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    alert('Export Failed: ' + err.message);
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = 'Export logs to CSV';
  }
}
