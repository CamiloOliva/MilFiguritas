let currentTheme='light';
try { const saved=localStorage.getItem('milfiguras-theme'); if(saved==='dark'||saved==='light')currentTheme=saved; } catch {}
document.documentElement.dataset.theme=currentTheme;

function avatarMarkup(user,extraClass='') {
  return `<span class="avatar ${extraClass}">${user.avatar?`<img src="${esc(user.avatar)}" alt="">`:esc(user.name.split(' ').slice(0,2).map(n=>n[0]).join(''))}</span>`;
}

function profileControl(user) {
  return `<div class="profile-control"><button type="button" class="profile-trigger" id="profile-trigger" data-action="profile-menu" aria-label="Abrir opciones del perfil" aria-expanded="false" aria-controls="profile-dropdown">${avatarMarkup(user)}<span class="profile-trigger-copy"><strong>${esc(user.name.split(' ')[0])}</strong><small>${roleName(user.role)}</small></span>${icon('chevron')}</button><section class="profile-dropdown" id="profile-dropdown" aria-label="Opciones de tu perfil" hidden><div class="profile-summary">${avatarMarkup(user)}<div><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span><small>${roleName(user.role)}</small></div></div><button type="button" class="profile-option" data-action="edit-profile">${icon('settings')} Modificar perfil</button><button type="button" class="profile-option" data-action="change-password">${icon('shield')} Cambiar contraseña</button><div class="theme-setting"><span>Apariencia</span><div class="theme-options" role="group" aria-label="Modo de apariencia"><button type="button" data-theme-choice="light" aria-pressed="${currentTheme==='light'}"><span aria-hidden="true">☀</span> Claro</button><button type="button" data-theme-choice="dark" aria-pressed="${currentTheme==='dark'}"><span aria-hidden="true">☾</span> Oscuro</button></div></div><button type="button" class="profile-option profile-signout" data-action="logout">${icon('logout')} Cerrar sesión</button></section></div>`;
}

function closeProfileMenu(restoreFocus=false) {
  const menu=$('#profile-dropdown'),trigger=$('#profile-trigger');
  if(menu)menu.hidden=true;
  if(trigger){trigger.setAttribute('aria-expanded','false');if(restoreFocus)trigger.focus();}
}

function setTheme(theme) {
  if(!['light','dark'].includes(theme))return;
  currentTheme=theme;
  document.documentElement.dataset.theme=theme;
  try {localStorage.setItem('milfiguras-theme',theme);}catch {}
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#201b20':'#ad485d');
}

let profileAvatar=null,photoLoading=false,photoRequest=0,profileSaving=false;
function profileModal() {
  closeProfileMenu();
  profileAvatar=state.user.avatar||null;
  photoLoading=false;
  photoRequest++;
  modal('Tu perfil, a tu manera',`<form id="profile-form"><div class="profile-photo-row"><div id="profile-photo-preview">${avatarMarkup(state.user,'avatar-large')}</div><div><label class="btn secondary photo-picker" for="profile-photo">${icon('camera')} Subir foto desde el equipo</label><input class="visually-hidden" id="profile-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp"><button type="button" class="btn ghost" data-action="remove-avatar" ${profileAvatar?'':'hidden'}>Quitar foto</button><p class="photo-help">JPG, PNG o WebP · Hasta 5 MB.<br>La imagen se ajusta a un retrato cuadrado.</p><p id="photo-status" class="small muted" role="status"></p></div></div><div class="field"><label for="profile-name">Nombre</label><input id="profile-name" name="name" required minlength="2" maxlength="80" autocomplete="name" value="${esc(state.user.name)}"></div><div class="field"><label for="profile-email">Correo electrónico</label><input id="profile-email" name="email" type="email" required maxlength="120" autocomplete="email" value="${esc(state.user.email)}"><small>Usarás este correo para iniciar sesión.</small></div><p class="modal-error" role="alert"></p><div class="profile-form-actions"><button type="button" class="btn secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Guardar cambios ${icon('check')}</button></div></form>`);
}

async function prepareProfilePhoto(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Selecciona una imagen JPG, PNG o WebP.');
  if(file.size>5*1024*1024)throw new Error('La foto supera los 5 MB. Selecciona una imagen más pequeña.');
  if(!file.size)throw new Error('El archivo está vacío. Selecciona otra foto.');
  const bitmap=await createImageBitmap(file).catch(()=>{throw new Error('No pudimos abrir esta imagen. Selecciona otra foto.');});
  try {
    if(!bitmap.width||!bitmap.height)throw new Error('La imagen no es válida.');
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('No pudimos preparar la foto. Intenta con otro navegador.');
    const side=Math.min(bitmap.width,bitmap.height);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,256,256);
    ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);
    return canvas.toDataURL('image/jpeg',.86);
  } finally {bitmap.close();}
}

document.addEventListener('click',event=>{
  const target=event.target.closest('button');
  if(target?.dataset.action==='profile-menu') {
    const menu=$('#profile-dropdown');const opening=menu.hidden;menu.hidden=!opening;
    target.setAttribute('aria-expanded',String(opening));
    if(opening)menu.querySelector('button')?.focus();
    return;
  }
  if(!event.target.closest('.profile-control'))closeProfileMenu();
  if(target?.dataset.action==='edit-profile'&&state)profileModal();
  if(target?.dataset.themeChoice)setTheme(target.dataset.themeChoice);
  if(target?.dataset.action==='remove-avatar') {
    photoRequest++;profileAvatar=null;photoLoading=false;
    const form=$('#profile-form');form.elements.photo.value='';
    $('#profile-photo-preview').innerHTML=avatarMarkup({...state.user,avatar:null},'avatar-large');
    target.hidden=true;$('#photo-status').textContent='La foto se quitará al guardar los cambios.';
    form.querySelector('button[type="submit"]').disabled=false;
  }
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&$('#profile-dropdown')&&!$('#profile-dropdown').hidden){closeProfileMenu(true);event.preventDefault();}
});
document.addEventListener('focusin',event=>{if(!event.target.closest('.profile-control'))closeProfileMenu();});

document.addEventListener('change',async event=>{
  if(event.target.id!=='profile-photo')return;
  const file=event.target.files[0];if(!file)return;
  const request=++photoRequest,form=$('#profile-form'),button=form.querySelector('button[type="submit"]');
  photoLoading=true;button.disabled=true;$('#photo-status').textContent='Preparando tu foto…';form.querySelector('.modal-error').textContent='';
  try {
    const photo=await prepareProfilePhoto(file);
    if(request!==photoRequest||!form.isConnected)return;
    profileAvatar=photo;
    $('#profile-photo-preview').innerHTML=avatarMarkup({...state.user,avatar:photo},'avatar-large');
    form.querySelector('[data-action="remove-avatar"]').hidden=false;
    $('#photo-status').textContent='Foto lista. Guarda los cambios para aplicarla.';
  }catch(error){if(request===photoRequest&&form.isConnected){formError(form,error);$('#photo-status').textContent='';event.target.value='';}}
  finally {if(request===photoRequest){photoLoading=false;if(form.isConnected)button.disabled=false;}}
});

document.addEventListener('submit',async event=>{
  const form=event.target;if(form.getAttribute('id')!=='profile-form')return;event.preventDefault();
  if(profileSaving||photoLoading)return;
  profileSaving=true;const button=form.querySelector('button[type="submit"]');button.disabled=true;
  try {
    const result=await api('profile',{name:form.elements.name.value,email:form.elements.email.value,avatar:profileAvatar});
    state.user=result.user;closeModal();await refresh();toast(result.message);
  }catch(error){formError(form,error);}
  finally {profileSaving=false;button.disabled=false;}
});
setTheme(currentTheme);

document.addEventListener('click',event=>{
  if(event.target.closest('button')?.dataset.action!=='change-password'||!state)return;
  closeProfileMenu();
  modal('Protege tu cuenta',`<form id="password-form"><p class="security-note">Usa una contraseña de al menos 12 caracteres con mayúsculas, minúsculas y números. Al cambiarla se cerrarán tus otras sesiones.</p><div class="field"><label for="current-password">Contraseña actual</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" minlength="10" maxlength="120" required></div><div class="field"><label for="new-password">Nueva contraseña</label><input id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="120" required></div><div class="field"><label for="confirm-password">Confirma la nueva contraseña</label><input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="120" required></div><p class="modal-error" role="alert"></p><button type="submit" class="btn full">Actualizar contraseña ${icon('shield')}</button></form>`);
});
document.addEventListener('submit',async event=>{
  const form=event.target;if(form.getAttribute('id')!=='password-form')return;event.preventDefault();if(profileSaving)return;
  if(form.elements.newPassword.value!==form.elements.confirmPassword.value){formError(form,new Error('Las contraseñas nuevas no coinciden.'));return;}
  profileSaving=true;const button=form.querySelector('button[type="submit"]');button.disabled=true;
  try{const result=await api('account/password',{currentPassword:form.elements.currentPassword.value,newPassword:form.elements.newPassword.value});closeModal();toast(result.message);}
  catch(error){formError(form,error);}finally{profileSaving=false;button.disabled=false;}
});
