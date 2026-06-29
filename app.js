
const PASSWORD = 'TIPA2026';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = (n, d=2) => Number.isFinite(+n) ? (+n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}) : '-';
const pctToNumber = v => { let n=parseFloat(String(v).replace('%','')); if(!Number.isFinite(n)) return 0.25; return n>1?n/100:n; };
const eur = n => '€' + fmt(n); const usd = n => '$' + fmt(n); const kg = n => fmt(n)+' kg';
const data = window.TIPA_DATA || {};

function unique(arr, key){ return [...new Set(arr.map(x=>x[key]).filter(Boolean).map(String))]; }
function makeOptions(values, selected){ return values.map(v=>`<option ${String(v)===String(selected)?'selected':''}>${v}</option>`).join(''); }

function login(){
  const ok = $('#password').value === PASSWORD;
  if(ok){ $('#login').classList.add('hidden'); $('#app').classList.remove('hidden'); }
  else $('#loginError').textContent='Wrong password';
}
$('#loginBtn').onclick=login; $('#password').addEventListener('keydown',e=>{if(e.key==='Enter')login()});

$$('.tab').forEach(b=>b.onclick=()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); $$('.panel').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active'); });

let deferredPrompt; window.addEventListener('beforeinstallprompt', e=>{e.preventDefault(); deferredPrompt=e; $('#installBtn').classList.remove('hidden')});
$('#installBtn').onclick=async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; }};
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }

function filmDefaults(){ return data.filmRecords?.[0] || {}; }
function renderFilms(){
  const films=unique(data.filmRecords||[], 'Film Type'); const ship=unique(data.filmRecords||[], 'Shiping Destination').concat((data.shipping||[]).map(x=>x.route)).filter(Boolean);
  const suppliers=unique(data.filmRecords||[], 'Supplier');
  $('#films').innerHTML = `<div class="grid"><div class="card wide"><h2>Films Calculator <span class="badge">Excel aligned</span></h2><p class="note">Margin is displayed as percent. Film sell price follows the workbook gross-profit logic when matching total cost is found.</p></div>${[1,2,3].map(i=>filmCard(i, films, ship, suppliers)).join('')}<div class="card wide"><h3>Film pricing source rows</h3><div class="tablewrap">${table(data.filmRecords, ['Film Type','Width (mm)','Thickness (µ)','Weight (Kg)','Supplier','Shiping Destination','Total Cost','Margin','Sell Price'])}</div></div></div>`;
  [1,2,3].forEach(calcFilm);
}
function filmCard(i, films, ship, suppliers){ const d=data.filmRecords?.[i-1]||filmDefaults(); return `<div class="card" id="filmCard${i}"><h3>Film ${i}</h3>
  ${field('Film Type',`<select id="f_type_${i}">${makeOptions(films,d['Film Type'])}</select>`)}
  ${field('Width (mm)',`<input id="f_width_${i}" type="number" value="${d['Width (mm)']||515}">`)}
  ${field('Thickness (µ)',`<input id="f_thick_${i}" type="number" value="${d['Thickness (µ)']||60}">`)}
  ${field('Density',`<input id="f_density_${i}" type="number" step="0.01" value="${d['Density']||1.25}">`)}
  ${field('Weight (Kg)',`<input id="f_weight_${i}" type="number" value="${d['Weight (Kg)']||1000}">`)}
  ${field('Shipping',`<select id="f_ship_${i}">${makeOptions([...new Set(ship)],d['Shiping Destination'])}</select>`)}
  ${field('Supplier',`<select id="f_supplier_${i}">${makeOptions(suppliers,d['Supplier'])}</select>`)}
  ${field('Margin',`<input id="f_margin_${i}" value="25%">`)}
  <div class="results"><div class="result"><b>Length</b><span id="f_len_${i}">-</span></div><div class="result"><b>Total Cost/Kg</b><span id="f_cost_${i}">-</span></div><div class="result big"><b>SELL PRICE</b><span id="f_sell_${i}">-</span></div><div class="result"><b>USD</b><span id="f_usd_${i}">-</span></div></div></div>`; }
function calcFilm(i){ ['type','width','thick','density','weight','ship','supplier','margin'].forEach(x=>$('#f_'+x+'_'+i)?.addEventListener('input',()=>calcFilm(i)));
  const type=$('#f_type_'+i).value, width=+$('#f_width_'+i).value, thick=+$('#f_thick_'+i).value, density=+$('#f_density_'+i).value, weight=+$('#f_weight_'+i).value, margin=pctToNumber($('#f_margin_'+i).value);
  if(data.filmDensity?.[type]) $('#f_density_'+i).value=data.filmDensity[type];
  const row=(data.filmRecords||[]).find(r=>String(r['Film Type'])===type && +r['Width (mm)']===width && +r['Thickness (µ)']===thick && +r['Weight (Kg)']===weight) || (data.filmRecords||[]).find(r=>String(r['Film Type'])===type);
  const len = (weight*1000000)/(width*thick*density);
  let cost = row && Number.isFinite(+row['Total Cost']) && +row['Total Cost']>0 ? +row['Total Cost'] : (row && +row['RM cost in 1 Kg'] ? +row['RM cost in 1 Kg']+2.6 : 0);
  const sell = cost/(1-margin); // workbook film gross-profit logic
  $('#f_len_'+i).textContent=fmt(len,0)+' m'; $('#f_cost_'+i).textContent=eur(cost); $('#f_sell_'+i).textContent=eur(sell); $('#f_usd_'+i).textContent=usd(sell*(data.exchangeRate||1.16));
}

function renderLaminates(){
  const lams=unique(data.laminateRecords||[], 'Laminate').concat(data.uniqueLaminates||[]).filter(Boolean); const ship=(data.shipping||[]).map(x=>x.route); const suppliers=['Bastin','Marma'];
  $('#laminates').innerHTML = `<div class="grid"><div class="card wide"><h2>Laminates Calculator <span class="badge">3 side-by-side options</span></h2><p class="note">Sell price uses cost/kg × (1 + margin%), matching the Laminates sheet examples.</p></div>${[1,2,3].map(i=>lamCard(i,lams,ship,suppliers)).join('')}<div class="card wide"><h3>Laminates source rows</h3><div class="tablewrap">${table(data.laminateRecords, ['Amount','Laminate','Laminate structure','Width of reel','PR/ NonPR','No of colors','Supplier','Total Cost per KG','Cost Per KG (€)'])}</div></div></div>`;
  [1,2,3].forEach(calcLam);
}
function lamCard(i,lams,ship,suppliers){ const d=data.laminateRecords?.[(i-1)*4]||{}; return `<div class="card"><h3>Laminate ${i}</h3>
${field('Laminate',`<select id="l_lam_${i}">${makeOptions([...new Set(lams)],d['Laminate']||'428')}</select>`)}
${field('Width of reel',`<input id="l_width_${i}" type="number" value="${d['Width of reel']||760}">`)}
${field('Amount (Kg)',`<input id="l_amount_${i}" type="number" value="${d['Amount']||5000}">`)}
${field('PR / NonPR',`<select id="l_pr_${i}"><option>Not Printed</option><option>Printed</option></select>`)}
${field('No of colors',`<select id="l_colors_${i}"><option>0</option><option>1-2</option><option>3-4</option><option>5-8</option></select>`)}
${field('Shipment',`<select id="l_ship_${i}">${makeOptions([...new Set(ship)],d['Shipment Destination'])}</select>`)}
${field('Supplier',`<select id="l_supplier_${i}">${makeOptions(suppliers,d['Supplier']||'Bastin')}</select>`)}
${field('Margin',`<input id="l_margin_${i}" value="25%">`)}
<div class="results"><div class="result"><b>Length</b><span id="l_len_${i}">-</span></div><div class="result"><b>Cost/Kg</b><span id="l_cost_${i}">-</span></div><div class="result big"><b>SELL PRICE</b><span id="l_sell_${i}">-</span></div><div class="result"><b>USD</b><span id="l_usd_${i}">-</span></div></div></div>`; }
function calcLam(i){ ['lam','width','amount','pr','colors','ship','supplier','margin'].forEach(x=>$('#l_'+x+'_'+i)?.addEventListener('input',()=>calcLam(i)));
  const lam=$('#l_lam_'+i).value, width=+$('#l_width_'+i).value, amount=+$('#l_amount_'+i).value, margin=pctToNumber($('#l_margin_'+i).value);
  if($('#l_pr_'+i).value==='Not Printed') $('#l_colors_'+i).value='0';
  const row=(data.laminateRecords||[]).find(r=>String(r['Laminate'])===lam && +r['Width of reel']===width && +r['Amount']===amount) || (data.laminateRecords||[]).find(r=>String(r['Laminate'])===lam);
  const cost = row && (+row['Total Cost per KG'] || +row['Cost Per KG (€)']) ? (+row['Total Cost per KG'] || +row['Cost Per KG (€)']) : 0;
  const length = row && +row['Laminate length (m) width asked'] ? +row['Laminate length (m) width asked'] : (amount*12.15);
  const sell=cost*(1+margin); $('#l_len_'+i).textContent=fmt(length,0)+' m'; $('#l_cost_'+i).textContent=eur(cost); $('#l_sell_'+i).textContent=eur(sell); $('#l_usd_'+i).textContent=usd(sell*(data.exchangeRate||1.16));
}

function renderMarma(){
  $('#marma').innerHTML = `<div class="grid"><div class="card wide"><h2>Marma / Bastin Rates</h2><p class="note">Quick reference for lamination, printing, slitting and converting rates extracted from the workbook.</p></div><div class="card wide"><h3>Lamination & Printing Rates</h3><div class="tablewrap">${rateTable('Lmntn & Prntng- Marma & Bastin')}</div></div><div class="card wide"><h3>Converting Rates</h3><div class="tablewrap">${rateTable('Converting- Marma & Bastin')}</div></div></div>`;
}
function rateTable(name){ const rows=(data.rates||[]).filter(x=>x.sheet===name).map(x=>x.row); return `<table>${rows.map(r=>`<tr>${r.map(c=>`<td>${c??''}</td>`).join('')}</tr>`).join('')}</table>`; }
function field(label, html){ return `<div class="field"><label>${label}</label>${html}</div>`; }
function table(rows, cols){ if(!rows?.length) return '<p class="note">No rows found.</p>'; return `<table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c]??''}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }

renderFilms(); renderLaminates(); renderMarma();
