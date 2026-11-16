(function(root){
  const breakfastSizes=[
    {id:'large',name:'Grande',eyebrow:'PARA SORPRENDER A LO GRANDE',description:'Una experiencia completa para empezar un día especial.',includes:['Sándwich especial','Panqueques con huevo','Una bebida a elección','Cajita de frutas','Un dulce a tu gusto'],choice:'Incluye frutas y dulce.',color:'peach'},
    {id:'medium',name:'Mediano',eyebrow:'EL EQUILIBRIO MÁS BONITO',description:'Dos platos, tu bebida y ese acompañamiento que más te gusta.',includes:['Sándwich especial','Panqueques con huevo','Una bebida a elección','Frutas o dulce: elige uno'],choice:'Elige entre frutas y dulce.',color:'lavender'},
    {id:'small',name:'Pequeño',eyebrow:'UN GRAN GESTO EN CADA DETALLE',description:'Elige tu plato favorito y dale un toque personal.',includes:['Sándwich o panqueques con huevo','Una bebida a elección','Frutas o dulce: elige uno'],choice:'Elige un plato y un acompañamiento.',color:'rose'}
  ];
  const drinks=[{id:'soda',name:'Gaseosa',alcohol:false},{id:'beer',name:'Cerveza',alcohol:true},{id:'whisky',name:'Crema de whisky',alcohol:true}];
  const sweets=[{id:'arequipe',name:'Arequipe'},{id:'gummies',name:'Gomitas'},{id:'other',name:'Otro dulce a elección'}];
  const sandwichIngredients=['Pan','Jamón','Queso','Pollo desmechado','Lechuga','Tomate','Salsas'];
  function serviceFor(product){if(product==='Desayuno Amanecer')return 'breakfast';if(product==='Caja de Momentos')return 'gift';if(['Decoración de eventos','Celebración Especial'].includes(product))return 'event';return null;}
  function breakfastLines(b){
    if(!b)return [];
    return [
      'Tamaño: '+(breakfastSizes.find(s=>s.id===b.size)?.name||b.size),
      'Plato: '+(b.main==='both'?'Sándwich especial + panqueques con huevo':b.main==='sandwich'?'Sándwich especial':'Panqueques con huevo'),
      'Acompañamiento: '+(b.side==='both'?'Frutas + dulce':b.side==='fruit'?'Cajita de frutas':'Dulce a elección'),
      'Bebida: '+(drinks.find(d=>d.id===b.drink)?.name||b.drink),
      ...(b.side!=='fruit'?['Dulce: '+(b.sweetPreference==='other'?b.customSweet:sweets.find(s=>s.id===b.sweetPreference)?.name||'Por coordinar')]:[])
    ];
  }
  root.MilfigurasCatalog=Object.freeze({breakfastSizes,drinks,sweets,sandwichIngredients,serviceFor,breakfastLines});
})(globalThis);
