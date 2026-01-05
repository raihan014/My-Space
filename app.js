/* ---------- Utilities & UI refs ---------- */
const $ = id => document.getElementById(id);

// auth elements
const authArea = $('auth-area');
const loginForm = $('login-form');
const registerForm = $('register-form');
const forgotForm = $('forgot-form');
const verifyForm = $('verify-form');
const resetForm = $('reset-form');

const loginMsg = $('login-msg');
const regMsg = $('reg-msg');
const forgotMsg = $('forgot-msg');
const verifyMsg = $('verify-msg');
const resetMsg = $('reset-msg');

const btnLogin = $('btn-login');
const btnRegister = $('btn-register');
const btnAdd = $('btn-add');
const btnLogout = $('btn-logout');

const btnShowLogin = $('show-login');
const linkShowRegister = $('link-show-register');
const linkForgot = $('link-forgot');

const movieInput = $('movie-title');
const appArea = $('app-area');
const welcomeUser = $('welcome-user');
const appStatus = $('app-status');

const verifyCodeInput = $('verify-code');
const verifyBtn = $('btn-verify');
const resendCode = $('resend-code');
const cancelVerify = $('cancel-verify');

const listsContainer = $('lists-container');
const currentListName = $('current-list-name');
const currentListSub = $('current-list-sub');
const taskListEl = $('task-list');

const btnExportJson = $('btn-export-json');
const btnExportCsv = $('btn-export-csv');

const modalBackdrop = $('task-modal-backdrop');
const modalTitle = $('modal-title');
const modalList = $('modal-list');
const modalDeadline = $('modal-deadline');
const modalTags = $('modal-tags');
const modalNotes = $('modal-notes');
const modalStar = $('modal-star');
const modalCancel = $('modal-cancel');
const modalSave = $('modal-save');
const modalDelete = $('modal-delete');


let sessionUser = null;
let pendingUserObj = null;
let selectedList = 'All';
let expandedTasks = {}; 
let modalOpenIndex = null; // index of task being edited

const USERS_KEY = 'demo_users_v1';
const SESS_KEY = 'demo_session_v1';

function readUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch(e){ return {}; } }
function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

async function hashText(text){
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function genCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }
function sendSimulation(email, subject, code){
  alert(`(SIMULATED EMAIL)\nTo: ${email}\nSubject: ${subject}\nCode: ${code}`);
  console.log('SIMULATED EMAIL ->', {email, subject, code});
}

function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }
function clearMsgs(){ loginMsg.textContent=''; regMsg.textContent=''; forgotMsg.textContent=''; verifyMsg.textContent=''; resetMsg.textContent=''; appStatus.textContent=''; }
function clearForm(form){ form.querySelectorAll('input').forEach(i => i.value = '');}
function showLogin(){ clearMsgs(); show(loginForm); hide(registerForm); hide(forgotForm); hide(verifyForm); hide(resetForm); }
function showRegister(){ clearMsgs(); clearForm(loginForm); hide(loginForm); show(registerForm); hide(forgotForm); hide(verifyForm); hide(resetForm); }
function showForgot(){ clearMsgs(); clearForm(loginForm); hide(loginForm); hide(registerForm); show(forgotForm); hide(verifyForm); hide(resetForm); }
function showVerify(){ clearMsgs(); clearForm(loginForm); hide(loginForm); hide(registerForm); hide(forgotForm); show(verifyForm); hide(resetForm); }
function showReset(){ clearMsgs(); clearForm(loginForm); hide(loginForm); hide(registerForm); hide(forgotForm); hide(verifyForm); show(resetForm); }

/* ---------- Session ---------- */
function setSession(username){
  sessionUser = username;
  localStorage.setItem(SESS_KEY, username);
  welcomeUser.textContent = `Welcome, ${username}`;
  hide(btnShowLogin);   // ✅ ADD THIS LINE
  hide(authArea);
  show(appArea);
  const users = readUsers();
  const u = users[username];
  if(!u.lists || !Array.isArray(u.lists) || u.lists.length === 0){
    u.lists = [
      { id:'Series Download', name:'Series Download' },
      { id:'Movies', name:'Movies' },
      { id:'Drama', name:'Drama' },
      { id:'Download', name:'Download' },
    ];
    u.movies = (u.movies||[]).map(m => ({ ...m, listId: m.listId || 'Movies', subtasks: m.subtasks || [], deadline: m.deadline||null, notes: m.notes||'', tags: m.tags||[] }));
    users[username] = u;
    saveUsers(users);
  }
  renderLists();
  renderTasksForSelectedList();
}

function clearSession(){
  sessionUser = null;
  localStorage.removeItem(SESS_KEY);
  show(btnShowLogin);   // ✅ ADD THIS LINE
  hide(appArea);
  show(authArea);
  showLogin();
}

/* ---------- Init ---------- */
(function init(){
  showLogin();
  const storedSession = localStorage.getItem(SESS_KEY);
  if(storedSession){
    const users = readUsers();
    if(users[storedSession] && users[storedSession].verified){
      setSession(storedSession);
    } else {
      clearSession();
    }
  }
  attachEvents();
})();

/* ---------- Events ---------- */
function attachEvents(){
  btnShowLogin.addEventListener('click', () => { showLogin(); show(authArea); hide(appArea); });
  const togglePwd = $('toggle-password');
  const pwdInput = $('login-password');

  if(togglePwd){
  togglePwd.addEventListener('click', () => {
    const hidden = pwdInput.type === 'password';
    pwdInput.type = hidden ? 'text' : 'password';
    togglePwd.textContent = hidden ? '🙈' : '🙉';
  });
  }

  linkShowRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
  linkForgot.addEventListener('click', (e) => { e.preventDefault(); showForgot(); });

  // LOGOUT handler (fixed)
  btnLogout.addEventListener('click', () => {
    $('login-password').value = ''; // ✅ clear only password
    clearSession();
    appStatus.textContent = 'Logged out.';
  });
  /* ---------- Theme toggle ---------- */
const themeToggle = document.getElementById('theme-toggle');

if(themeToggle){
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');

    // optional: change icon
    themeToggle.textContent =
      document.body.classList.contains('dark') ? '☀️' : '🌙';
  });
}


  // REGISTER
  $('btn-register').addEventListener('click', async function(){
    regMsg.textContent='';
    const uname = $('reg-username').value.trim();
    const email = $('reg-email').value.trim().toLowerCase();
    const p1 = $('reg-password').value;
    const p2 = $('reg-password2').value;

    if(!uname || !email || !p1 || !p2){ regMsg.textContent='All fields are required.'; return; }
    if(p1 !== p2){ regMsg.textContent='Passwords do not match.'; return; }

    const users = readUsers();
    if(users[uname]){ regMsg.textContent='Username already exists.'; return; }
    if(Object.values(users).some(u=>u.email === email)){ regMsg.textContent='Email already used.'; return; }

    const pwHash = await hashText(p1);
    const code = genCode();
    pendingUserObj = { username: uname, email, passwordHash: pwHash, verified:false, movies:[], lists: [] };
    sendSimulation(email, 'Verify your account - Demo', code);
    sessionStorage.setItem('demo_verif_code', code);
    sessionStorage.setItem('demo_verif_username', uname);
    sessionStorage.setItem('demo_verif_flow','register');
    showVerify();
    verifyMsg.textContent = 'A verification code was sent to your email (simulated). Enter it here.';
  });

  // VERIFY
  verifyBtn.addEventListener('click', function(){
    const codeEntered = verifyCodeInput.value.trim();
    const storedCode = sessionStorage.getItem('demo_verif_code');
    const flow = sessionStorage.getItem('demo_verif_flow');
    const users = readUsers();

    if(!codeEntered){ verifyMsg.textContent='Please enter code.'; return; }
    if(codeEntered !== storedCode){ verifyMsg.textContent='Invalid code.'; return; }

    if(flow === 'register'){
      const temp = pendingUserObj;
      if(!temp){ verifyMsg.textContent='No pending registration found.'; return; }
      temp.verified = true;
      temp.movies = temp.movies || [];
      temp.lists = temp.lists && temp.lists.length ? temp.lists : [
        { id:'Series Download', name:'Series Download' },
        { id:'Movies', name:'Movies' },
        { id:'Drama', name:'Drama' },
        { id:'Download', name:'Download' },
      ];
      users[temp.username] = temp;
      saveUsers(users);
      sessionStorage.removeItem('demo_verif_code');
      sessionStorage.removeItem('demo_verif_flow');
      setSession(temp.username);
      verifyMsg.textContent = 'Registration successful! You are now logged in.';
    } else if(flow === 'reset'){
      sessionStorage.setItem('demo_reset_verified','1');
      verifyMsg.textContent = 'Code verified. Please set a new password.';
      showReset();
    }
  });

  resendCode.addEventListener('click', function(e){
    e.preventDefault();
    const flow = sessionStorage.getItem('demo_verif_flow');
    if(!flow){ verifyMsg.textContent='Nothing to resend.'; return; }
    const code = genCode();
    sessionStorage.setItem('demo_verif_code', code);
    if(flow === 'register' && pendingUserObj){
      sendSimulation(pendingUserObj.email, 'Resend verification code', code);
    } else if(flow === 'reset'){
      const email = sessionStorage.getItem('demo_reset_email');
      sendSimulation(email, 'Password reset code - resend', code);
    }
    verifyMsg.textContent = 'Code resent (simulated). Check alert/console.';
  });

  cancelVerify.addEventListener('click', function(e){
    e.preventDefault();
    sessionStorage.removeItem('demo_verif_code');
    sessionStorage.removeItem('demo_verif_flow');
    pendingUserObj = null;
    showLogin();
  });

  // LOGIN
  btnLogin.addEventListener('click', async function(){
    loginMsg.textContent='';
    const id = $('login-username').value.trim();
    const p = $('login-password').value;
    if(!id || !p){ loginMsg.textContent='Provide username/email and password.'; return; }

    const users = readUsers();
    const userEntry = users[id] ? users[id] : Object.values(users).find(u => u.email === id);
    if(!userEntry){ loginMsg.textContent='No such user.'; return; }
    const pHash = await hashText(p);
    if(pHash !== userEntry.passwordHash){ loginMsg.textContent='Incorrect password.'; return; }
    if(!userEntry.verified){ loginMsg.textContent='Email not verified. Please verify first.'; return; }

    setSession(userEntry.username);
    loginMsg.textContent = 'Logged in.';
  });

  // FORGOT
  $('btn-forgot').addEventListener('click', function(){
    forgotMsg.textContent = '';
    const email = $('forgot-email').value.trim().toLowerCase();
    if(!email){ forgotMsg.textContent='Enter your email.'; return; }
    const users = readUsers();
    const user = Object.values(users).find(u => u.email === email);
    if(!user){ forgotMsg.textContent='No account for that email.'; return; }

    const code = genCode();
    sessionStorage.setItem('demo_verif_code', code);
    sessionStorage.setItem('demo_verif_flow','reset');
    sessionStorage.setItem('demo_reset_email', email);
    sendSimulation(email, 'Password reset code - Demo', code);
    verifyMsg.textContent = 'Reset code sent (simulated).';
    showVerify();
  });

  // RESET
  $('btn-reset').addEventListener('click', async function(){
    resetMsg.textContent = '';
    const pw1 = $('reset-password').value;
    const pw2 = $('reset-password2').value;
    if(!pw1 || !pw2){ resetMsg.textContent='Enter and confirm password.'; return; }
    if(pw1 !== pw2){ resetMsg.textContent='Passwords do not match.'; return; }
    const email = sessionStorage.getItem('demo_reset_email');
    if(!sessionStorage.getItem('demo_reset_verified') && sessionStorage.getItem('demo_verif_flow') !== 'reset'){ resetMsg.textContent='Not verified.'; return; }
    const users = readUsers();
    const user = Object.values(users).find(u => u.email === email);
    if(!user){ resetMsg.textContent='User not found.'; return; }
    user.passwordHash = await hashText(pw1);
    users[user.username] = user;
    saveUsers(users);
    resetMsg.textContent = 'Password updated. You may login now.';
    sessionStorage.removeItem('demo_verif_code');
    sessionStorage.removeItem('demo_verif_flow');
    sessionStorage.removeItem('demo_reset_email');
    sessionStorage.removeItem('demo_reset_verified');
    showLogin();
  });

  // CANCELS
  $('btn-cancel-register').addEventListener('click', () => showLogin());
  $('btn-cancel-reset').addEventListener('click', () => showLogin());

  // Add Task
  btnAdd.addEventListener('click', function(){
    if(!sessionUser) return;
    const title = movieInput.value.trim();
    if(!title){ appStatus.textContent = 'Enter a title.'; return; }
    const users = readUsers();
    const u = users[sessionUser];
    let listId = 'Movies';
    if(selectedList && selectedList !== 'All' && selectedList !== 'Completed'){
      listId = selectedList;
    }
    addMovieForUser(sessionUser, title, listId);
    movieInput.value = '';
    renderLists();
    renderTasksForSelectedList();
    appStatus.textContent = `Added: ${title} (${listId})`;
  });

  // Export JSON
  btnExportJson.addEventListener('click', function(){
    if(!sessionUser) return;
    const users = readUsers();
    const u = users[sessionUser];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(u, null, 2));
    const dl = document.createElement('a'); dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `${sessionUser}_movies.json`); document.body.appendChild(dl); dl.click(); dl.remove();
  });

  // Export CSV (Excel)
  btnExportCsv.addEventListener('click', function(){
    if(!sessionUser) return;
    const rows = [];
    rows.push(['Title','List','Added At','Completed','Starred','Deadline','Tags','Notes','SubtaskCount','SubtaskDoneCount']);
    const users = readUsers();
    const u = users[sessionUser];
    const movies = u.movies || [];
    let filtered = movies;
    if(selectedList === 'Completed') filtered = movies.filter(m=>m.completed);
    else if(selectedList !== 'All') filtered = movies.filter(m=>m.listId === selectedList);
    filtered.forEach(m=>{
      const subCount = (m.subtasks||[]).length;
      const doneCount = (m.subtasks||[]).filter(s=>s.done).length;
      rows.push([
        m.title,
        m.listId || '',
        m.addedAt,
        m.completed ? 'Yes':'No',
        m.starred ? 'Yes':'No',
        m.deadline || '',
        (m.tags||[]).join(';'),
        (m.notes||'').replace(/\n/g,' '),
        subCount,
        doneCount
      ]);
    });
    const csv = rows.map(r => r.map(cell => `"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dl = document.createElement('a'); dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `${sessionUser}_${selectedList || 'list'}_export.csv`);
    document.body.appendChild(dl); dl.click(); dl.remove();
  });

  // Delegated click inside task list
  taskListEl.addEventListener('click', function(e){
    if(!sessionUser) return;
    const t = e.target;
    // star toggle
    if(t.classList.contains('star')){
      const idx = Number(t.dataset.index);
      toggleStar(sessionUser, idx);
      renderLists(); renderTasksForSelectedList();
      return;
    }
    // main check
    if(t.classList.contains('check-circle')){
      const idx = Number(t.dataset.index);
      toggleMovieCompleted(sessionUser, idx);
      renderLists(); renderTasksForSelectedList();
      return;
    }
    // status badge toggle (Watched / Pending)
    if(t.classList.contains('status-badge')){
      const idx = Number(t.dataset.index);
      toggleMovieCompleted(sessionUser, idx);
      renderLists(); renderTasksForSelectedList();
      return;
    }
    // title click -> expand subtasks
    if(t.classList.contains('task-title')){
      const key = t.dataset.key;
      expandedTasks[key] = !expandedTasks[key];
      renderTasksForSelectedList();
      return;
    }
    // subtask actions
    if(t.classList.contains('subcheck')){
      const idx = Number(t.dataset.index);
      const sidx = Number(t.dataset.sindex);
      toggleSubtask(sessionUser, idx, sidx);
      renderTasksForSelectedList(); renderLists(); return;
    }
    if(t.classList.contains('del-sub')){
      const idx = Number(t.dataset.index);
      const sidx = Number(t.dataset.sindex);
      deleteSubtask(sessionUser, idx, sidx);
      renderTasksForSelectedList(); renderLists(); return;
    }
    if(t.classList.contains('add-sub-btn')){
      const idx = Number(t.dataset.index);
      const input = document.querySelector(`#sub-input-${idx}`);
      if(input && input.value.trim()){
        addSubtask(sessionUser, idx, input.value.trim());
        input.value = '';
        renderTasksForSelectedList(); renderLists();
      }
      return;
    }
    // edit/delete buttons: open modal for edit
    const btn = t.closest('button');
    if(btn && btn.dataset){
      const act = btn.dataset.action;
      const idx = Number(btn.dataset.index);
      if(act === 'delete'){ if(confirm('Delete task?')){ deleteMovie(sessionUser, idx); renderLists(); renderTasksForSelectedList(); } }
      if(act === 'edit'){ openTaskModal(idx); }
    }
  });

  // Drag & Drop
  taskListEl.addEventListener('dragstart', function(e){
    const tr = e.target.closest('.task-row');
    if(!tr) return;
    const idx = tr.dataset.index;
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  });

  listsContainer.addEventListener('dragover', function(e){
    e.preventDefault();
    const li = e.target.closest('.list-item');
    if(li) li.classList.add('dragover');
    e.dataTransfer.dropEffect = 'move';
  });
  listsContainer.addEventListener('dragleave', function(e){
    const li = e.target.closest('.list-item');
    if(li) li.classList.remove('dragover');
  });
  listsContainer.addEventListener('drop', function(e){
    e.preventDefault();
    const li = e.target.closest('.list-item');
    if(!li) return;
    li.classList.remove('dragover');
    const idx = Number(e.dataTransfer.getData('text/plain'));
    if(isNaN(idx)) return;
    const targetId = li.dataset.listId || li.dataset.special;
    if(targetId && sessionUser){
      editMovieTitleAndList(sessionUser, idx, null, targetId);
      renderLists(); renderTasksForSelectedList();
    }
  });

  window.addEventListener('mouseup', ()=> document.querySelectorAll('.list-item.dragover').forEach(n=>n.classList.remove('dragover')) );

  // modal actions
  modalCancel.addEventListener('click', closeTaskModal);
  modalSave.addEventListener('click', function(){
    if(modalOpenIndex === null) return;
    const users = readUsers(); const u = users[sessionUser];
    const idx = modalOpenIndex;
    const movie = u.movies[idx];
    movie.title = modalTitle.value.trim() || movie.title;
    movie.listId = modalList.value;
    movie.deadline = modalDeadline.value || null;
    movie.notes = modalNotes.value || '';
    movie.tags = modalTags.value.split(',').map(s=>s.trim()).filter(Boolean);
    movie.starred = modalStar.checked;
    users[sessionUser] = u; saveUsers(users);
    closeTaskModal();
    renderLists(); renderTasksForSelectedList();
  });
  modalDelete.addEventListener('click', function(){
    if(modalOpenIndex === null) return;
    if(!confirm('Delete task?')) return;
    deleteMovie(sessionUser, modalOpenIndex);
    closeTaskModal();
    renderLists(); renderTasksForSelectedList();
  });

  // auto logout on close
  window.addEventListener('beforeunload', ()=> clearSession());
  window.addEventListener('pagehide', ()=> clearSession());
}

/* ---------- Task & list ops ---------- */
function addMovieForUser(username, title, listId){
  const users = readUsers();
  const u = users[username];
  const item = {
    title,
    addedAt: new Date().toISOString(),
    completed:false,
    starred:false,
    subtasks:[],
    listId: listId || 'Movies',
    deadline: null,
    notes: '',
    tags: []
  };
  u.movies.unshift(item);
  users[username] = u; saveUsers(users);
}

function toggleMovieCompleted(username, idx){
  const users = readUsers(); const u = users[username];
  if(!u || !u.movies[idx]) return;
  u.movies[idx].completed = !u.movies[idx].completed;
  users[username] = u; saveUsers(users);
}

function toggleStar(username, idx){
  const users = readUsers(); const u = users[username];
  if(!u || !u.movies[idx]) return;
  u.movies[idx].starred = !u.movies[idx].starred;
  users[username] = u; saveUsers(users);
}

function deleteMovie(username, idx){
  const users = readUsers(); const u = users[username];
  if(!u || typeof u.movies[idx] === 'undefined') return;
  u.movies.splice(idx,1);
  users[username] = u; saveUsers(users);
}

function editMovieTitleAndList(username, idx, newTitle, newListId){
  const users = readUsers(); const u = users[username];
  if(!u || !u.movies[idx]) return;
  if(newTitle) u.movies[idx].title = newTitle;
  if(newListId) u.movies[idx].listId = newListId;
  users[username] = u; saveUsers(users);
}

function getMovie(username, idx){
  const users = readUsers();
  return users[username].movies[idx];
}

/* Subtasks */
function addSubtask(username, idx, text){
  const users = readUsers(); const u = users[username];
  if(!u || !u.movies[idx]) return;
  u.movies[idx].subtasks = u.movies[idx].subtasks || [];
  u.movies[idx].subtasks.push({ title: text, done: false });
  users[username] = u; saveUsers(users);
}
function toggleSubtask(username, idx, sidx){
  const users = readUsers(); const u = users[username];
  if(!u || !u.movies[idx] || !u.movies[idx].subtasks) return;
  const s = u.movies[idx].subtasks[sidx]; if(!s) return;
  s.done = !s.done; users[username] = u; saveUsers(users);
}
function deleteSubtask(username, idx, sidx){
  const users = readUsers(); const u = users[username];
  if(!u || !u.movies[idx] || !u.movies[idx].subtasks) return;
  u.movies[idx].subtasks.splice(sidx,1); users[username] = u; saveUsers(users);
}

/* ---------- Rendering ---------- */
function renderLists(){
  if(!sessionUser) return;
  const users = readUsers(); const u = users[sessionUser];
  listsContainer.innerHTML = '';

  // create list input
  const addWrap = document.createElement('div'); addWrap.style.marginBottom='10px';
  addWrap.innerHTML = `<div style="display:flex;gap:6px">
    <input id="new-list-name" class="input-inline" placeholder="New list name" style="flex:1"/>
    <button id="create-list-btn" class="small-action">Create</button>
  </div>`;
  listsContainer.appendChild(addWrap);
  addWrap.querySelector('#create-list-btn').addEventListener('click', ()=>{
    const name = addWrap.querySelector('#new-list-name').value.trim();
    if(!name){ alert('Enter a name'); return; }
    if(u.lists.some(l=>l.id.toLowerCase()===name.toLowerCase())){ alert('List exists'); return; }
    u.lists.push({ id:name, name }); users[sessionUser]=u; saveUsers(users);
    addWrap.querySelector('#new-list-name').value=''; selectedList=name; renderLists(); renderTasksForSelectedList();
  });

  // All
  const allCount = (u.movies||[]).length;
  const allDiv = document.createElement('div');
  allDiv.className = 'list-item'+(selectedList==='All'?' selected':'');
  allDiv.dataset.special='All';
  allDiv.innerHTML = `<div><div class="list-title">All</div><div class="count-muted">${allCount} items</div></div>`;
  allDiv.addEventListener('click', ()=>{ selectedList='All'; renderLists(); renderTasksForSelectedList(); });
  listsContainer.appendChild(allDiv);

  // persisted lists
  u.lists.forEach(list=>{
    const cnt = (u.movies||[]).filter(m=>m.listId===list.id).length;
    const div = document.createElement('div');
    div.className = 'list-item'+(selectedList===list.id?' selected':'');
    div.dataset.listId = list.id;
    div.innerHTML = `<div><div class="list-title">${escapeHtml(list.name)}</div><div class="count-muted">${cnt} items</div></div>
      <div style="display:flex;gap:6px">
        <button title="Rename" class="small-action" data-act="rename" data-id="${escapeHtml(list.id)}">Rename</button>
        <button title="Delete" class="small-action" data-act="delete" data-id="${escapeHtml(list.id)}">Delete</button>
      </div>`;
    div.addEventListener('click', (ev)=>{ if(ev.target.tagName.toLowerCase() === 'button') return; selectedList=list.id; renderLists(); renderTasksForSelectedList(); });
    // drag drop
    div.addEventListener('dragover', function(e){ e.preventDefault(); div.classList.add('dragover'); e.dataTransfer.dropEffect='move'; });
    div.addEventListener('dragleave', ()=> div.classList.remove('dragover'));
    div.addEventListener('drop', function(e){ e.preventDefault(); div.classList.remove('dragover'); const idx=Number(e.dataTransfer.getData('text/plain')); if(isNaN(idx)) return; editMovieTitleAndList(sessionUser, idx, null, list.id); renderLists(); renderTasksForSelectedList(); });
    listsContainer.appendChild(div);
    div.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const act = b.dataset.act; const id = b.dataset.id;
        if(act === 'rename'){
          const newName = prompt('New list name:', id); if(!newName) return;
          u.lists = u.lists.map(l=>l.id===id?{id:newName,name:newName}:l); u.movies = (u.movies||[]).map(m=>m.listId===id?{...m,listId:newName}:m); users[sessionUser]=u; saveUsers(users);
          selectedList=newName; renderLists(); renderTasksForSelectedList();
        } else if(act === 'delete'){
          if(!confirm(`Delete list '${id}'? Tasks will move to 'Movies'.`)) return;
          u.lists = u.lists.filter(l=>l.id!==id); u.movies = (u.movies||[]).map(m=>m.listId===id?{...m,listId:'Movies'}:m); users[sessionUser]=u; saveUsers(users);
          selectedList='All'; renderLists(); renderTasksForSelectedList();
        }
      });
    });
  });

  // Completed
  const completedCount = (u.movies||[]).filter(m=>m.completed).length;
  const compDiv = document.createElement('div');
  compDiv.className = 'list-item'+(selectedList==='Completed'?' selected':'');
  compDiv.dataset.special='Completed';
  compDiv.innerHTML = `<div><div class="list-title">Completed</div><div class="count-muted">${completedCount} completed</div></div>`;
  compDiv.addEventListener('click', ()=>{ selectedList='Completed'; renderLists(); renderTasksForSelectedList(); });
  compDiv.addEventListener('dragover', function(e){ e.preventDefault(); compDiv.classList.add('dragover'); e.dataTransfer.dropEffect='move'; });
  compDiv.addEventListener('dragleave', ()=> compDiv.classList.remove('dragover'));
  compDiv.addEventListener('drop', function(e){ e.preventDefault(); compDiv.classList.remove('dragover'); const idx=Number(e.dataTransfer.getData('text/plain')); if(isNaN(idx)) return; editMovieTitleAndList(sessionUser, idx, null, 'Movies'); toggleMovieCompleted(sessionUser, idx); renderLists(); renderTasksForSelectedList(); });
  listsContainer.appendChild(compDiv);
}

// ================================
// PENDING / DONE SECTION RENDERING
// ================================

function renderTasksForSelectedList(){
  if(!sessionUser) return;
  const users = readUsers(); const u = users[sessionUser];
  const movies = u.movies || [];
  // ================================
// FILTER BASED ON SELECTED LIST
// ================================

let baseList = [];

if(selectedList === 'All'){
  baseList = movies;
  currentListName.textContent = 'All';
}
else if(selectedList === 'Completed'){
  baseList = movies.filter(m => m.completed);
  currentListName.textContent = 'Completed';
}
else{
  baseList = movies.filter(m => m.listId === selectedList);
  currentListName.textContent = selectedList;
}

// ================================
// SPLIT INTO PENDING & DONE
// ================================
const pendingItems = baseList.filter(m => !m.completed);
const doneItems = baseList.filter(m => m.completed);

currentListSub.textContent =
  `${pendingItems.length} pending · ${doneItems.length} done`;

taskListEl.innerHTML = '';

/* =================================
   PENDING SECTION
================================= */
if(pendingItems.length){
  const h = document.createElement('div');
  h.className = 'section-header';
  h.innerHTML = `<strong>Pending</strong><span>${pendingItems.length}</span>`;
  taskListEl.appendChild(h);

  pendingItems.forEach((m, idxInFiltered)=>{
    renderSingleRow(m, idxInFiltered);
  });
}

/* =================================
   DONE SECTION
================================= */
if(doneItems.length){
  const h = document.createElement('div');
  h.className = 'section-header';
  h.innerHTML = `<strong>Done</strong><span>${doneItems.length}</span>`;
  taskListEl.appendChild(h);

  doneItems.forEach((m, idxInFiltered)=>{
    renderSingleRow(m, idxInFiltered);
  });
}


}

// =====================================
// TASK SECTION RENDER (Pending / Done)
// =====================================
function renderTaskSection(title, items, isDone){
  if(items.length === 0) return;

  const section = document.createElement('div');
  section.className = 'task-section';

  section.innerHTML = `
    <div class="section-header">
      <strong>${title}</strong>
      <span class="count-muted">${items.length}</span>
    </div>
  `;

  items.forEach((m, idxInFiltered) => {
    const originalIndex = findMovieIndex(sessionUser, m);
    if(originalIndex < 0) return;

    // ⬇️ REUSE YOUR EXISTING TASK ROW CODE
    const taskRow = createTaskRow(m, originalIndex, idxInFiltered + 1);
    section.appendChild(taskRow);
  });

  taskListEl.appendChild(section);
}


// =====================================
// RENDER SINGLE TASK ROW (ORIGINAL CODE)
// =====================================
function renderSingleRow(m, idxInFiltered){
  const originalIndex = findMovieIndex(sessionUser, m);
  if(originalIndex < 0) return;

  const row = document.createElement('div');
  row.className = 'task-row'+(m.completed?' completed':'');
  row.setAttribute('draggable','true');
  row.dataset.index = originalIndex;

  const key = encodeURIComponent(m.addedAt+'|'+m.title);
  const expanded = !!expandedTasks[key];
  const subCount = (m.subtasks||[]).length;
  const doneCount = (m.subtasks||[]).filter(s=>s.done).length;
  const pct = subCount===0?0:Math.round((doneCount/subCount)*100);
  const serial = idxInFiltered + 1;

  const statusText = m.completed ? 'Done' : 'Pending';
  const statusClass = m.completed ? 'status-badge watched' : 'status-badge pending';

  row.innerHTML = `
    <div class="task-main">
      <div class="task-left">
        <div class="check-circle ${m.completed?'checked':''}" data-index="${originalIndex}">
          ${m.completed?'✔':''}
        </div>
        <div style="display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="font-weight:700;width:28px;text-align:center">#${serial}</div>
            <div class="task-title" data-key="${key}">${escapeHtml(m.title)}</div>
          </div>
          <div class="task-meta">
            ${new Date(m.addedAt).toLocaleString()}
            ${ subCount>0 ? ' · ' + subCount + ' steps' : '' }
            · ${escapeHtml(m.listId||'Movies')}
          </div>
          <div class="progress-wrap" style="display:${subCount>0?'block':'none'}">
            <div class="progress-bar" style="width:${pct}%"></div>
          </div>
        </div>
      </div>

      <div class="right-actions">
        <div class="star ${m.starred?'on':''}" data-index="${originalIndex}">
          ${m.starred?'★':'☆'}
        </div>
        <div class="${statusClass}" data-index="${originalIndex}">
          ${statusText}
        </div>
        <div>
          <button data-action="edit" data-index="${originalIndex}">Edit</button>
          <button data-action="delete" data-index="${originalIndex}" class="danger">Delete</button>
        </div>
      </div>
    </div>

    <div class="subtasks" style="display:${expanded?'block':'none'}">
      ${(m.subtasks||[]).map((s,si)=>`
        <div class="subtask-row">
          <div class="subcheck" data-index="${originalIndex}" data-sindex="${si}">
            ${s.done?'✔':''}
          </div>
          <div class="subtask-title" style="${s.done?'text-decoration:line-through;color:#8897a4':''}">
            ${escapeHtml(s.title)}
          </div>
          <button class="del-sub small-action" data-index="${originalIndex}" data-sindex="${si}">
            Del
          </button>
        </div>
      `).join('')}
      <div style="display:flex;gap:8px;margin-top:8px">
        <input id="sub-input-${originalIndex}" class="input-inline" placeholder="Add step..." />
        <button class="add-sub-btn small-action" data-index="${originalIndex}">Add</button>
      </div>
    </div>
  `;

  taskListEl.appendChild(row);
}




function findMovieIndex(username, movieObj){
  const users = readUsers(); const u = users[username];
  if(!u || !u.movies) return -1;
  return u.movies.findIndex(m => m.addedAt === movieObj.addedAt && m.title === movieObj.title);
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------- Modal ---------- */
function openTaskModal(idx){
  if(!sessionUser) return;
  const users = readUsers(); const u = users[sessionUser];
  const movie = u.movies[idx];
  if(!movie) return;
  modalOpenIndex = idx;
  modalTitle.value = movie.title;
  modalList.innerHTML = '';
  const lists = (u.lists||[]).slice();
  if(!lists.some(l=>l.id==='Movies')) lists.unshift({id:'Movies',name:'Movies'});
  lists.forEach(l => { const opt = document.createElement('option'); opt.value = l.id; opt.textContent = l.name; if(movie.listId===l.id) opt.selected = true; modalList.appendChild(opt); });
  modalDeadline.value = movie.deadline || '';
  modalTags.value = (movie.tags||[]).join(', ');
  modalNotes.value = movie.notes || '';
  modalStar.checked = !!movie.starred;
  show(modalBackdrop);
}
function closeTaskModal(){ modalOpenIndex = null; hide(modalBackdrop); }
