const SHOWCASE_CATALOG=globalThis.MilfigurasCatalog;
const PRESENTATION='/media/milfiguras-presentacion-v1.mp4';
const PRESENTATION_POSTER='/media/milfiguras-poster-v1.webp';
let pendingService=null,showcaseObserver=null;

function breakfastArtwork(size){
  return `<svg viewBox="0 0 280 128" fill="none" aria-hidden="true"><ellipse cx="140" cy="104" rx="94" ry="12" fill="currentColor" opacity=".07"/><ellipse cx="140" cy="74" rx="102" ry="38" fill="var(--paper)" stroke="currentColor" stroke-opacity=".25"/><ellipse cx="140" cy="74" rx="86" ry="29" stroke="currentColor" stroke-opacity=".15"/><path d="m72 84 29-43 30 43Z" fill="#e4b884" stroke="#bc906b" stroke-width="2"/><path d="m78 77 23-33 23 33" stroke="#efce9c" stroke-width="5"/><path d="M76 83h51" stroke="#83a177" stroke-width="4"/><path d="M80 87h42" stroke="#ce8b88" stroke-width="3"/>${size!=='small'?'<ellipse cx="171" cy="83" rx="30" ry="8" fill="#c99d70"/><ellipse cx="171" cy="76" rx="30" ry="8" fill="#dfb989"/><ellipse cx="171" cy="69" rx="30" ry="8" fill="#f0cd9b"/><ellipse cx="171" cy="65" rx="12" ry="8" fill="#fff6dc"/><circle cx="171" cy="64" r="5" fill="#e6b65a"/>':'<path d="M166 52c-13 9-15 27 1 36 15-8 16-26 1-36Z" fill="#dcb4ba"/><path d="M166 49v9m-6-6 6 5 6-5" stroke="#86a484" stroke-width="3"/>'}<path d="M225 35h22l-3 48h-16Z" fill="#f6e1b2" stroke="#d2b37f" stroke-width="2"/><path d="m239 35 6-20" stroke="#b97f8e" stroke-width="3"/><path d="M35 39v51m-6-51v15q6 9 12 0V39" stroke="currentColor" stroke-opacity=".3" stroke-width="2"/></svg>`;
}

function breakfastCards(member=false){
  return `<div class="breakfast-grid">${SHOWCASE_CATALOG.breakfastSizes.map((size,i)=>`<article class="breakfast-card ${size.color}"><div class="breakfast-card-top"><span class="eyebrow">${size.eyebrow}</span><span class="menu-number">0${i+1}</span></div><div class="breakfast-art">${breakfastArtwork(size.id)}</div><div class="breakfast-card-body"><h3>Desayuno <em>${size.name.toLowerCase()}</em></h3><p>${size.description}</p><ul>${size.includes.map(item=>`<li>${icon('check')}<span>${item}</span></li>`).join('')}</ul><div class="breakfast-card-bottom"><span>${size.choice}</span><button type="button" class="btn ${i===0?'':'secondary'} full" ${member?`data-product="Desayuno Amanecer" data-size="${size.id}"`:`data-configure-product="Desayuno Amanecer" data-configure-size="${size.id}"`}>Elegir ${size.name.toLowerCase()} ${icon('arrow')}</button></div></div></article>`).join('')}</div>`;
}

function videoCard(){
  return `<article class="welcome-video"><div class="preview-stage"><video data-showcase-preview data-src="/media/milfiguras-avance-v1.mp4" poster="${PRESENTATION_POSTER}" muted loop playsinline preload="none" aria-label="Vista previa sin sonido de Milfiguras BGA"></video><span class="video-duration">PRESENTACIÓN · 45 S</span><button type="button" class="preview-toggle" data-action="toggle-preview" aria-label="Reproducir o pausar la vista previa">${icon('play')}</button></div><div class="video-card-footer"><div><span class="eyebrow">UN VISTAZO A NUESTRO MUNDO</span><strong>Así nace una sorpresa.</strong></div><button type="button" class="video-open" data-action="watch-video">Ver video completo ${icon('arrow')}</button></div></article>`;
}

function welcomeFeature(mode='public'){
  return `<section class="welcome-feature ${mode==='member'?'welcome-member':''}"><div class="welcome-copy"><span class="eyebrow">HECHO CON CARIÑO EN BUCARAMANGA</span><h1>Mil formas de<br>hacerlo <em>especial.</em></h1><p>Desayunos sorpresa, regalos con intención y decoraciones que cuentan tu historia. Tú eliges los detalles; nosotros cuidamos el momento.</p><div class="welcome-actions"><${mode==='member'?'button type="button" data-page="create"':'a href="#services"'} class="btn">${icon('gift')} Arma tu sorpresa ${icon('arrow')}</${mode==='member'?'button':'a'}><button type="button" class="welcome-watch" data-action="watch-video">${icon('play')} Conoce Milfiguras</button></div><div class="welcome-signature"><span class="signature-heart">♡</span><span>Un detalle para regalar.<br><strong>Un recuerdo para guardar.</strong></span></div></div><div class="welcome-media">${videoCard()}<span class="welcome-handwritten" aria-hidden="true">encanta y sorprende ♡</span></div></section>`;
}

function serviceOverview(member=false){
  return `<section class="service-section" id="${member?'member-services':'services'}"><div class="service-heading"><div><span class="eyebrow">EL TAMAÑO LO ELIGES TÚ. EL CARIÑO VA INCLUIDO.</span><h2>Un desayuno a su medida.</h2></div><p>Grande, mediano o pequeño.<br> Conoce qué incluye cada uno y personaliza el tuyo.</p></div>${breakfastCards(member)}<div class="menu-explained"><details><summary>${icon('box')} El corazón de nuestro sándwich ${icon('chevron')}</summary><p>Pan, jamón, queso, pollo desmechado, lechuga, tomate y salsas. Cuéntanos tus preferencias al coordinar el pedido.</p></details><details><summary>${icon('heart')} Bebidas y pequeños antojos ${icon('chevron')}</summary><p>Puedes elegir gaseosa, cerveza o crema de whisky. Para el dulce: arequipe, gomitas u otro de tu preferencia, sujeto a disponibilidad. Las opciones con alcohol son exclusivas para mayores de edad.</p></details></div><p class="service-footnote">Cada desayuno se personaliza según la ocasión, el regalo y la decoración que tengas en mente. El equipo confirma disponibilidad, presentación y precio contigo.</p></section>`;
}

function extraServices(member=false){
  const action=product=>member?`data-product="${product}"`:`data-configure-product="${product}"`;
  return `<section class="extra-services" id="${member?'member-events':'events'}"><article class="event-feature"><div class="event-drawing" aria-hidden="true"><span class="event-balloon b1"></span><span class="event-balloon b2"></span><span class="event-balloon b3"></span><i>✧</i><b>celebra</b><span class="event-confetti">✦ · ✧</span></div><div><span class="eyebrow">LOS MOMENTOS GRANDES TAMBIÉN SE PERSONALIZAN</span><h2>Tu celebración.<br>Tu forma de contarla.</h2><p>Decoraciones personalizadas para eventos: dinos la ocasión, la temática, los colores y el lugar. Diseñamos la propuesta contigo y coordinamos la cotización.</p><button type="button" class="btn" ${action('Decoración de eventos')}>Personalizar mi evento ${icon('arrow')}</button><a href="https://www.instagram.com/milfiguras_bga/" target="_blank" rel="noopener noreferrer">Ver más ideas en Instagram ↗</a></div></article><article class="gift-feature"><span class="gift-feature-icon">${icon('gift')}</span><span class="eyebrow">PARA ESE «PENSÉ EN TI»</span><h2>Detalles que<br>dicen mucho.</h2><p>Regalos para cumpleaños, aniversarios, grados o simplemente porque sí. Cuéntanos para quién es y cómo quieres sorprender.</p><button type="button" class="btn secondary" ${action('Caja de Momentos')}>Crear un regalo ${icon('arrow')}</button></article></section>`;
}

function publicStorefront(){
  return `<div class="storefront"><header class="storefront-nav">${brand()}<nav aria-label="Explora Milfiguras"><a href="#services">Desayunos</a><a href="#events">Eventos y regalos</a><a href="#account" class="nav-account">Ingresar ${icon('arrow')}</a></nav></header><div class="storefront-content">${welcomeFeature()}<div class="welcome-promise"><span>${icon('gift')} Personalizado para esa persona</span><span>${icon('calendar')} Reserva con al menos 48 horas</span><span>${icon('heart')} Coordina tu pedido por WhatsApp</span></div>${serviceOverview()}${extraServices()}<section class="club-intro"><span class="eyebrow">TU CLUB DE SORPRESAS</span><h2>Los detalles bonitos <em>siempre vuelven.</em></h2><p>Personaliza tu pedido, participa en retos y convierte tus puntos en recompensas. Un motivo más para volver a sorprender.</p><div><span><b>01</b> Crea tu detalle</span><span><b>02</b> Completa retos</span><span><b>03</b> Disfruta tus recompensas</span></div></section></div></div>`;
}

function activateShowcase(){
  showcaseObserver?.disconnect();
  const previews=document.querySelectorAll('[data-showcase-preview]');
  if(!previews.length||typeof IntersectionObserver!=='function')return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||navigator.connection?.saveData)return;
  showcaseObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const video=entry.target;
    if(entry.isIntersecting){if(!video.src)video.src=video.dataset.src;if(!video.dataset.userPaused)video.play()?.catch(()=>{});}
    else video.pause();
  }),{threshold:.35});
  previews.forEach(video=>{for(const event of ['play','pause'])video.addEventListener(event,()=>{const button=video.parentElement.querySelector('.preview-toggle');button.innerHTML=icon(video.paused?'play':'pause');button.setAttribute('aria-label',video.paused?'Reproducir vista previa':'Pausar vista previa');});showcaseObserver.observe(video);});
}

function openPresentation(){
  const chapters=[{time:0,title:'Nuestra marca'},{time:8,title:'Detalles que sorprenden'},{time:16,title:'Cómo funciona el club'},{time:31,title:'Una experiencia que crece'}];
  modal('Así se vive Milfiguras',`<div class="presentation-player"><video id="presentation-video" src="${PRESENTATION}" poster="${PRESENTATION_POSTER}" controls playsinline preload="metadata" aria-label="Presentación completa de Milfiguras BGA"></video></div><div class="presentation-chapters" role="group" aria-label="Explora el video por capítulos">${chapters.map((chapter,i)=>`<button type="button" data-video-time="${chapter.time}" aria-pressed="${i===0}"><span>0${i+1}</span>${chapter.title}</button>`).join('')}</div><p class="video-caption">Presentación de la marca y del Club de Sorpresas. Las pantallas e indicadores del video ilustran la experiencia; no representan resultados del piloto.</p><details class="video-transcript"><summary>¿Qué encontrarás en el video?</summary><p>Milfiguras BGA presenta sus desayunos sorpresa, regalos y decoraciones en Bucaramanga. Muestra cómo personalizar un detalle, recibir retroalimentación, desbloquear recompensas y avanzar en el club. Los tamaños y opciones reales de los desayunos están explicados en el catálogo de esta página.</p></details>`);
  $('#modal').classList.add('video-dialog');
  document.querySelectorAll('[data-showcase-preview]').forEach(video=>video.pause());
  const video=$('#presentation-video');video.play()?.catch(()=>{});
  video.addEventListener('timeupdate',()=>{
    const active=[...chapters].reverse().find(c=>video.currentTime>=c.time)?.time||0;
    document.querySelectorAll('[data-video-time]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.videoTime)===active)));
  });
}

function breakfastDependentFields(size,previous={}){
  const side=previous.side&&['fruit','sweet'].includes(previous.side)?previous.side:'fruit';
  return `<div class="form-grid"><div class="field"><label>${size==='small'?'Elige un plato':'Platos incluidos'}</label>${size==='small'?`<select name="breakfastMain" aria-label="Plato del desayuno pequeño"><option value="sandwich" ${previous.main==='pancakes'?'':'selected'}>Sándwich especial</option><option value="pancakes" ${previous.main==='pancakes'?'selected':''}>Panqueques con huevo</option></select>`:'<input type="hidden" name="breakfastMain" value="both"><div class="included-choice">Sándwich especial<br>+ panqueques con huevo</div>'}</div><div class="field"><label>${size==='large'?'Acompañamientos incluidos':'Elige un acompañamiento'}</label>${size==='large'?'<input type="hidden" name="breakfastSide" value="both"><div class="included-choice">Cajita de frutas<br>+ dulce a elección</div>':`<select name="breakfastSide" aria-label="Acompañamiento del desayuno"><option value="fruit" ${side==='fruit'?'selected':''}>Cajita de frutas</option><option value="sweet" ${side==='sweet'?'selected':''}>Dulce a elección</option></select>`}</div></div>`;
}

function serviceConfigurationFields(product,size='large'){
  const service=SHOWCASE_CATALOG.serviceFor(product);
  if(service==='breakfast')return `<fieldset class="configuration-group"><legend>Tu desayuno, paso a paso</legend><div class="field"><label for="breakfast-size">Tamaño del desayuno</label><select id="breakfast-size" name="breakfastSize">${SHOWCASE_CATALOG.breakfastSizes.map(s=>`<option value="${s.id}" ${s.id===size?'selected':''}>${s.name}</option>`).join('')}</select></div><div id="breakfast-dependent">${breakfastDependentFields(size)}</div><details class="sandwich-details"><summary>¿Qué trae el sándwich?</summary><p>${SHOWCASE_CATALOG.sandwichIngredients.join(', ')}.</p></details><div class="form-grid"><div class="field"><label for="breakfast-drink">Tu bebida</label><select id="breakfast-drink" name="breakfastDrink">${SHOWCASE_CATALOG.drinks.map(d=>`<option value="${d.id}">${d.name}${d.alcohol?' · Con alcohol':''}</option>`).join('')}</select></div><div class="field" id="sweet-choice-field"><label for="breakfast-sweet">Elige tu dulce</label><select id="breakfast-sweet" name="sweetPreference">${SHOWCASE_CATALOG.sweets.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div></div><div class="field" id="custom-sweet-field" hidden><label for="custom-sweet">¿Qué dulce te gustaría?</label><input id="custom-sweet" name="customSweet" minlength="2" maxlength="80" placeholder="Cuéntanos tu favorito"></div><label class="check" id="alcohol-confirmation" hidden><input type="checkbox" name="alcoholConfirmed"><span>Confirmo que tengo 18 años o más. La disponibilidad y entrega de bebidas con alcohol se coordinan con Milfiguras.</span></label><div class="configuration-summary" id="configuration-summary" aria-live="polite"></div></fieldset>`;
  if(service==='event')return `<fieldset class="configuration-group"><legend>Cuéntanos cómo imaginas tu evento</legend><div class="field"><label for="event-theme">Temática o estilo</label><input id="event-theme" name="eventTheme" minlength="2" maxlength="120" required placeholder="Ej. Floral, elegante, personaje favorito…"></div><div class="field"><label for="event-guests">Asistentes aproximados <span class="muted">(opcional)</span></label><input id="event-guests" name="eventGuests" type="number" min="1" max="5000" placeholder="¿Para cuántas personas?"></div><p class="small muted">La propuesta de decoración y el precio se acuerdan con el equipo según la temática y el espacio.</p></fieldset>`;
  return '';
}

function collectServiceOptions(data){
  const service=SHOWCASE_CATALOG.serviceFor(data.product);
  if(service==='breakfast')data.breakfast={size:data.breakfastSize,main:data.breakfastMain,side:data.breakfastSide,drink:data.breakfastDrink,sweetPreference:data.sweetPreference,customSweet:data.customSweet||'',alcoholConfirmed:data.alcoholConfirmed==='on'};
  if(service==='event')data.eventDetails={theme:data.eventTheme,guests:data.eventGuests?Number(data.eventGuests):null};
  for(const key of ['breakfastSize','breakfastMain','breakfastSide','breakfastDrink','sweetPreference','customSweet','alcoholConfirmed','eventTheme','eventGuests'])delete data[key];
  return data;
}

function updateBreakfastConfiguration(form,rebuild=false){
  if(!form?.elements.breakfastSize)return;
  if(rebuild){const previous={main:form.elements.breakfastMain?.value,side:form.elements.breakfastSide?.value};form.querySelector('#breakfast-dependent').innerHTML=breakfastDependentFields(form.elements.breakfastSize.value,previous);}
  const side=form.elements.breakfastSide.value,drink=form.elements.breakfastDrink.value;
  const needsSweet=side!=='fruit',custom=needsSweet&&form.elements.sweetPreference.value==='other',alcohol=SHOWCASE_CATALOG.drinks.find(d=>d.id===drink)?.alcohol;
  form.querySelector('#sweet-choice-field').hidden=!needsSweet;form.elements.sweetPreference.required=needsSweet;
  form.querySelector('#custom-sweet-field').hidden=!custom;form.elements.customSweet.required=custom;
  form.querySelector('#alcohol-confirmation').hidden=!alcohol;form.elements.alcoholConfirmed.required=Boolean(alcohol);
  const b=collectServiceOptions(Object.fromEntries(new FormData(form))).breakfast;
  form.querySelector('#configuration-summary').innerHTML='<strong>Así va tu sorpresa</strong><ul>'+SHOWCASE_CATALOG.breakfastLines(b).map(line=>`<li>${esc(line)}</li>`).join('')+'</ul>';
}

function chooseService(product,size='large'){
  if(state){if(state.user.role==='admin'){toast('Usa un perfil de cliente para crear un pedido.',true);return;}page='create';render();reservationModal(product,size);return;}
  pendingService={product,size};register=true;renderAuth();$('#account')?.scrollIntoView?.({behavior:'smooth',block:'start'});toast('Crea tu cuenta o inicia sesión para guardar tu detalle personalizado.');
}

document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.action==='watch-video'){openPresentation();return;}
  if(button.dataset.action==='toggle-preview'){
    const video=button.closest('.preview-stage').querySelector('video');if(!video.src)video.src=video.dataset.src;
    if(video.paused){delete video.dataset.userPaused;video.play()?.catch(()=>{});button.setAttribute('aria-label','Pausar vista previa');}else{video.dataset.userPaused='true';video.pause();button.setAttribute('aria-label','Reproducir vista previa');}return;
  }
  if(button.dataset.videoTime!==undefined){const video=$('#presentation-video');if(video){video.currentTime=Number(button.dataset.videoTime);video.play()?.catch(()=>{});}return;}
  if(button.dataset.configureProduct)chooseService(button.dataset.configureProduct,button.dataset.configureSize||'large');
});
document.addEventListener('change',event=>{
  const form=event.target.closest('form');
  if(form?.getAttribute('id')==='reservation-form')updateBreakfastConfiguration(form,event.target.name==='breakfastSize');
});
document.querySelector('#modal').addEventListener('close',()=>{
  $('#presentation-video')?.pause();
  document.querySelectorAll('[data-showcase-preview]').forEach(video=>{if(!video.dataset.userPaused&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&typeof IntersectionObserver==='function')video.play()?.catch(()=>{});});
});
