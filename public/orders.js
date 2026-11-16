function orderConfigurationLines(order){
 const lines=[];
 if(order.breakfast){lines.push(...globalThis.MilfigurasCatalog.breakfastLines(order.breakfast));if(order.breakfast.main!=='pancakes')lines.push('Sándwich: '+globalThis.MilfigurasCatalog.sandwichIngredients.join(', ')+'.');}
 if(order.eventDetails){lines.push('Temática: '+order.eventDetails.theme);if(order.eventDetails.guests)lines.push('Asistentes aproximados: '+order.eventDetails.guests);}
 if(order.giftDetails)lines.push('Regalo y decoración: '+order.giftDetails);
 return lines;
}
function orderDetailsMarkup(order){return orderConfigurationLines(order).map(line=>`<small class="order-configuration">${esc(line)}</small>`).join('');}
const ORDER_WHATSAPP='573044817781';
function orderReference(order){return order.reference||'MFG-'+order.id.slice(0,8).toUpperCase();}
function orderMessage(order,user){
  const delivery=new Intl.DateTimeFormat('es-CO',{dateStyle:'full',timeStyle:'short',timeZone:'America/Bogota'}).format(new Date(order.delivery));
  return [
    '¡Hola, Milfiguras BGA! Quisiera coordinar este pedido que registré en el Club de Sorpresas. 🎁',
    '', '*RESUMEN DEL PEDIDO*',
    '*Referencia:* '+orderReference(order),
    '*Cliente:* '+(user?.name||order.customer||'Cliente del club'),
    '*Celular de contacto:* '+(order.contactPhone||'Por confirmar'),
    '*Detalle:* '+order.product,
    ...orderConfigurationLines(order),
    '*Ocasión:* '+order.occasion,
    '*Para:* '+order.recipient,
    '*Fecha y hora (Colombia):* '+delivery,
    '*Color:* '+order.color,
    '*Entrega:* '+(order.deliveryMethod==='pickup'?'Recogida coordinada con Milfiguras':'Domicilio · '+(order.address||'Dirección por confirmar')),
    (order.service==='event'?'*Observaciones:* ':'*Mensaje de la tarjeta:* ')+order.message,
    '', '*Estado en el club:* '+({pending:'Solicitud pendiente de confirmación',confirmed:'Reserva confirmada',cancelled:'Solicitud cancelada'}[order.status]||order.status),
    'Por favor, confirmemos el precio final, la disponibilidad y los detalles de entrega. ¡Gracias!'
  ].join('\n');
}
function orderWhatsAppLink(order,user){return 'https://wa.me/'+ORDER_WHATSAPP+'?text='+encodeURIComponent(orderMessage(order,user));}
function orderSummaryModal(order){
  const message=orderMessage(order,state.user);
  modal('Tu pedido está registrado',`<div class="notice success">Referencia <strong>${esc(orderReference(order))}</strong>. El equipo podrá revisarla desde administración.</div><p class="small muted">Continúa por WhatsApp con el equipo de pedidos al <strong>304 481 7781</strong>. Se abrirá el chat con este mensaje; revísalo y pulsa <strong>Enviar</strong> en WhatsApp.</p><pre class="order-message">${esc(message)}</pre><div class="order-share-actions"><a class="btn whatsapp-btn" href="${esc(orderWhatsAppLink(order,state.user))}" target="_blank" rel="noopener noreferrer">Abrir pedido en WhatsApp ${icon('arrow')}</a><button type="button" class="btn secondary" data-copy-order="${esc(order.id)}">${icon('copy')} Copiar resumen</button></div><p class="tiny muted" style="line-height:1.7;margin:16px 0 0">El precio y la entrega se acuerdan con Milfiguras. Abrir o copiar este resumen no confirma que el mensaje haya sido enviado. También puedes volver a abrirlo desde Mis reservas.</p>`);
}

document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  const id=button.dataset.shareOrder||button.dataset.copyOrder;if(!id||!state)return;
  const order=state.reservations.find(r=>r.id===id);if(!order){toast('No encontramos esta reserva. Actualiza la página.',true);return;}
  if(button.dataset.shareOrder){orderSummaryModal(order);return;}
  try{await navigator.clipboard.writeText(orderMessage(order,state.user));toast('Resumen copiado. Puedes pegarlo en WhatsApp.');}catch{toast('Puedes seleccionar y copiar el texto del resumen.',true);}
});
document.addEventListener('change',event=>{
  if(event.target.id!=='delivery-method')return;
  const delivery=event.target.value==='delivery';const field=$('#delivery-address-field'),input=$('#delivery-address');
  if(field)field.hidden=!delivery;if(input)input.required=delivery;
});
