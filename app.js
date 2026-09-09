const $=s=>document.querySelector(s);
const api=async(p,o={})=>{const r=await fetch('/api/'+p,o);if(!r.ok){let m='Terjadi kesalahan';try{m=(await r.json()).error||m}catch(_){}throw new Error(m)}return r.status===204?null:r.json()};
const esc=v=>String(v??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const money=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const num=v=>Number(v).toLocaleString('id-ID',{maximumFractionDigits:2});
const chip=s=>`<span class="chip ${({'Menunggu diambil':'Menunggu','Belum Lunas':'Belum'}[s]||s)}">${esc(s)}</span>`;
const av=n=>String(n||'').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const person=(n,sub)=>`<div class="person"><span class="avatar">${esc(av(n))}</span><span><b>${esc(n)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span></div>`;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2500)};

const names={dashboard:'Dashboard',orders:'Pesanan',customers:'Pelanggan',services:'Layanan & Harga',payments:'Pembayaran',reports:'Laporan',staff:'Karyawan',settings:'Pengaturan'};
let current='dashboard';

// Navigasi
const navLinks=[...document.querySelectorAll('#side nav a[data-p]')];
$('#hamb').onclick=()=>$('#side').classList.toggle('open');
navLinks.forEach(a=>a.onclick=()=>{const act=navLinks.find(x=>x.classList.contains('active'));if(act)act.classList.remove('active');a.classList.add('active');$('#side').classList.remove('open');page(a.dataset.p)});

// Modal tambah data
const modal=$('#modal'),form=modal.querySelector('form');
let modalType=null;
function openModal(type,title,fields){modalType=type;$('#formTitle').textContent=title;$('#fields').innerHTML=fields;modal.classList.add('show')}
function closeModal(){modal.classList.remove('show');modalType=null}
$('#close').onclick=closeModal;
modal.onclick=e=>{if(e.target===modal)closeModal()};
form.onsubmit=async e=>{e.preventDefault();const body={};for(const el of form.elements)if(el.name)body[el.name]=el.value;
try{await api(modalType,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});closeModal();form.reset();toast('Data berhasil disimpan');page(current)}catch(x){toast(x.message)}};
async function orderFields(){const[cs,ss]=await Promise.all([api('customers'),api('services')]);
return `<label class="field">Pelanggan<select name="customer_id" required>${cs.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>`
+`<label class="field">Layanan<select name="service_id" required>${ss.map(s=>`<option value="${s.id}">${esc(s.name)} — ${money(s.price)}/kg</option>`).join('')}</select></label>`
+`<label class="field">Berat (kg)<input name="weight" type="number" min="0.5" step="0.5" value="1" required></label>`}
$('#add').onclick=async()=>{openModal('orders','Pesanan Baru','<p class="muted">Memuat pilihan...</p>');try{$('#fields').innerHTML=await orderFields()}catch(x){toast(x.message)}};
const F=(n,l)=>`<label class="field">${l}<input name="${n}" required></label>`;
function openAdd(type){
if(type==='orders')return $('#add').click();
if(type==='customers')return openModal(type,'Tambah Pelanggan',F('name','Nama')+F('phone','Telepon')+F('address','Alamat'));
if(type==='services')return openModal(type,'Tambah Layanan',F('name','Nama layanan')+`<label class="field">Harga (Rp/kg)<input name="price" type="number" min="0" required></label>`+F('duration','Durasi'));
if(type==='staff')return openModal(type,'Tambah Karyawan',F('name','Nama')+F('role','Peran')+F('phone','Telepon'))}

// Dashboard
function days7(orders){const out=[];for(let i=6;i>=0;i--){const a=new Date();a.setHours(0,0,0,0);a.setDate(a.getDate()-i);const b=new Date(a);b.setDate(b.getDate()+1);
out.push({label:['Min','Sen','Sel','Rab','Kam','Jum','Sab'][a.getDay()],total:orders.filter(o=>{const c=new Date(o.created_at);return c>=a&&c<b}).reduce((n,o)=>n+Number(o.total),0)})}return out}
function lineSvg(d){const max=Math.max(...d.map(x=>x.total),1),W=700,H=190;
const line=d.map((x,i)=>[i*(W/(d.length-1)),H-12-(H-34)*(x.total/max)].map(n=>n.toFixed(1)).join(',')).join(' ');
return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#7054ed" stop-opacity=".25"/><stop offset="1" stop-color="#7054ed" stop-opacity="0"/></linearGradient></defs><polygon points="0,${H} ${line} ${W},${H}" fill="url(#g)"/><polyline points="${line}" fill="none" stroke="#7054ed" stroke-width="3"/></svg>`}
async function dashboard(){const d=await api('dashboard');const s=d.summary;
const p1=s.orders?Math.round(100*s.process/s.orders):0,p2=p1+(s.orders?Math.round(100*s.waiting/s.orders):0);
$('#badge').textContent=s.process+s.waiting;
$('#app').innerHTML=`<div class="top"><div><p>Ringkasan operasional laundry Anda hari ini.</p></div><button class="primary" id="ref">↻ Muat ulang</button></div>
<div class="stats">
<div class="card stat"><i>▣</i><div><span>Total Pesanan</span><h2>${s.orders}</h2></div></div>
<div class="card stat"><i>◌</i><div><span>Dalam Proses</span><h2>${s.process}</h2></div></div>
<div class="card stat"><i>♙</i><div><span>Pelanggan</span><h2>${s.customers}</h2></div></div>
<div class="card stat"><i>Rp</i><div><span>Pendapatan Lunas</span><h2>${money(s.revenue)}</h2></div></div>
</div>
<div class="grid">
<section class="panel"><div class="panelhead"><div><h3>Nilai Pesanan 7 Hari Terakhir</h3><p>Berdasarkan tanggal masuk pesanan.</p></div></div><div class="chart">${lineSvg(days7(d.orders))}</div></section>
<section class="panel"><div class="panelhead"><div><h3>Status Pesanan</h3><p>Sebaran semua pesanan.</p></div></div>
<div class="ringwrap"><div class="ring" style="background:conic-gradient(#6650ca 0 ${p1}%,#c87b2d ${p1}% ${p2}%,#2b9865 ${p2}% 100%)"><div><b>${s.orders}</b><span>Pesanan</span></div></div>
<div class="legend"><div>Diproses<b>${s.process}</b></div><div>Menunggu diambil<b>${s.waiting}</b></div><div>Selesai<b>${s.done}</b></div></div></div></section>
</div>
<section class="panel" style="margin-top:16px"><div class="panelhead"><div><h3>Pesanan Terbaru</h3><p>Pesanan yang baru masuk.</p></div><button class="filter" data-go="orders">Lihat semua →</button></div>
<div class="tablewrap"><table><thead><tr><th>KODE</th><th>PELANGGAN</th><th>LAYANAN</th><th>BERAT</th><th>TOTAL</th><th>STATUS</th><th>PEMBAYARAN</th></tr></thead><tbody>
${d.orders.slice(0,5).map(o=>`<tr><td><b>${esc(o.code)}</b></td><td>${person(o.customer,o.phone)}</td><td>${esc(o.service)}</td><td>${num(o.weight)} kg</td><td><b>${money(o.total)}</b></td><td>${chip(o.status)}</td><td>${chip(o.payment_status)}</td></tr>`).join('')}
</tbody></table></div></section>`;
$('#ref').onclick=()=>page('dashboard');
goLinks()}
function goLinks(){document.querySelectorAll('#app [data-go]').forEach(b=>b.onclick=()=>{const l=navLinks.find(a=>a.dataset.p===b.dataset.go);if(l)l.click()})}

// Halaman daftar data
const STATUSES=['Diproses','Menunggu diambil','Selesai'];
const statusCell=x=>x.status==='Selesai'?`<span class="chip Selesai">Selesai ✓ terkunci</span>`:`<select class="sel" data-id="${x.id}">${STATUSES.map(s=>`<option ${s===x.status?'selected':''}>${s}</option>`).join('')}</select>`;
const payCell=x=>x.payment_status==='Lunas'?`<span class="chip Lunas">Lunas ✓ terkunci</span>`:`<button class="act pay" data-id="${x.id}">Setor</button>`;
function bindRowActions(reload){
document.querySelectorAll('#rows .sel').forEach(s=>s.onchange=async()=>{const old=s.value;try{await api('orders/'+s.dataset.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s.value})});toast('Status pesanan diperbarui');reload()}catch(e){s.value=old;toast(e.message)}});
document.querySelectorAll('#rows .pay').forEach(b=>b.onclick=async()=>{if(!confirm('Catat pembayaran pesanan ini sebagai Lunas?\nSetelah dicatat, tidak dapat diubah kembali.'))return;try{await api('orders/'+b.dataset.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_status:'Lunas'})});toast('Pembayaran dicatat — otomatis masuk pendapatan laporan');reload()}catch(e){toast(e.message)}})}
const listMeta={
orders:{cols:['KODE','PELANGGAN','LAYANAN','BERAT','TOTAL','STATUS','PEMBAYARAN'],row:x=>`<td><b>${esc(x.code)}</b></td><td>${person(x.customer,x.phone)}</td><td>${esc(x.service)}</td><td>${num(x.weight)} kg</td><td><b>${money(x.total)}</b></td><td>${statusCell(x)}</td><td>${payCell(x)}</td>`},
customers:{cols:['PELANGGAN','TELEPON','ALAMAT','PESANAN'],aksi:x=>`<button class="act" data-view="${x.id}">Lihat</button> `,row:x=>`<td>${person(x.name,x.phone)}</td><td>${esc(x.phone)}</td><td>${esc(x.address||'-')}</td><td>${x.order_count}</td>`},
services:{cols:['LAYANAN','HARGA/KG','DURASI'],row:x=>`<td>${esc(x.name)}</td><td><b>${money(x.price)}</b></td><td>${esc(x.duration)}</td>`},
staff:{cols:['NAMA','PERAN','TELEPON'],row:x=>`<td>${person(x.name)}</td><td>${esc(x.role)}</td><td>${esc(x.phone)}</td>`},
payments:{cols:['KODE','PELANGGAN','TOTAL','METODE','STATUS'],row:x=>`<td><b>${esc(x.code)}</b></td><td>${person(x.customer)}</td><td><b>${money(x.total)}</b></td><td>${esc(x.payment_method)}</td><td>${payCell(x)}</td>`}};
function list(type){const m=listMeta[type];
$('#app').innerHTML=`<div class="top"><div><p>Kelola data ${names[type].toLowerCase()}.</p></div><button class="primary" id="addData">＋ Tambah ${names[type]}</button></div>
<section class="panel"><div class="panelhead"><div><h3>Data ${names[type]}</h3><p>Tambahkan data baru atau hapus data yang sudah tidak aktif.</p></div><button class="filter" id="ref">↻ Muat ulang</button></div>
<div class="tablewrap"><table><thead><tr>${m.cols.map(c=>`<th>${c}</th>`).join('')}<th>AKSI</th></tr></thead><tbody id="rows"><tr><td colspan="8">Memuat...</td></tr></tbody></table></div></section>`;
$('#ref').onclick=()=>page(type);
$('#addData').onclick=()=>openAdd(type);
api(type).then(data=>{$('#rows').innerHTML=data.map(x=>`<tr>${m.row(x)}<td>${m.aksi?m.aksi(x):''}<button class="act del" data-id="${x.id}">Hapus</button></td></tr>`).join('')||'<tr><td colspan="8">Belum ada data.</td></tr>';
bindRowActions(()=>page(type));
document.querySelectorAll('#rows .act[data-view]').forEach(b=>b.onclick=()=>customerDetail(b.dataset.view));
document.querySelectorAll('#rows .act.del').forEach(b=>b.onclick=async()=>{if(!confirm('Hapus data ini?'))return;
try{await api(type+'/'+b.dataset.id,{method:'DELETE'});toast('Data dihapus');page(type)}catch(e){toast(e.message)}})}).catch(e=>{$('#rows').innerHTML=`<tr><td colspan="8">${esc(e.message)}</td></tr>`})}
async function customerDetail(cid){
$('#title').textContent='Pelanggan';
$('#app').innerHTML=`<div class="top"><div><p>Detail pesanan pelanggan — ubah status atau catat pembayaran.</p></div><button class="filter" id="back">← Kembali ke Pelanggan</button></div>
<section class="panel"><div class="panelhead"><div><h3 id="cdName">Memuat...</h3><p>Pilih status pesanan atau tandai Lunas.</p></div></div>
<div class="tablewrap"><table><thead><tr><th>KODE</th><th>LAYANAN</th><th>TOTAL</th><th>STATUS</th><th>PEMBAYARAN</th><th>TANGGAL</th></tr></thead><tbody id="rows"><tr><td colspan="6">Memuat...</td></tr></tbody></table></div></section>`;
$('#back').onclick=()=>page('customers');
try{
const d=await api('customers/'+cid+'/orders');
$('#cdName').textContent=d.customer.name+' — '+d.customer.phone;
$('#rows').innerHTML=d.orders.map(x=>`<tr><td><b>${esc(x.code)}</b></td><td>${esc(x.service)} (${num(x.weight)} kg)</td><td><b>${money(x.total)}</b></td><td>${statusCell(x)}</td><td>${payCell(x)}</td><td>${esc(x.created_at.slice(0,10))}</td></tr>`).join('')||'<tr><td colspan="6">Belum ada pesanan.</td></tr>';
bindRowActions(()=>customerDetail(cid));
}catch(e){$('#rows').innerHTML=`<tr><td colspan="6">${esc(e.message)}</td></tr>`}}

// Laporan & pengaturan
async function reports(){const d=await api('dashboard');const by={};
d.orders.forEach(o=>{by[o.service]=(by[o.service]||0)+Number(o.total)});
$('#app').innerHTML=`<div class="top"><div><p>Laporan ringkas berdasarkan data saat ini.</p></div></div>
<div class="report">
<div class="card"><span class="muted">PENDAPATAN LUNAS</span><h2>${money(d.summary.revenue)}</h2><p class="muted">${d.payments.filter(p=>p.payment_status==='Lunas').length} pesanan dibayar</p></div>
<div class="card"><span class="muted">TOTAL PESANAN</span><h2>${d.summary.orders}</h2><p class="muted">${d.summary.done} pesanan selesai</p></div>
<div class="card"><span class="muted">PELANGGAN</span><h2>${d.summary.customers}</h2><p class="muted">${d.orders.length} pesanan tercatat</p></div>
</div>
<section class="panel" style="margin-top:16px"><div class="panelhead"><div><h3>Nilai Pesanan per Layanan</h3><p>Total nilai semua pesanan per jenis layanan.</p></div></div>
<div class="tablewrap"><table><thead><tr><th>LAYANAN</th><th>PESANAN</th><th>TOTAL</th></tr></thead><tbody>
${Object.entries(by).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${d.orders.filter(o=>o.service===k).length}</td><td><b>${money(v)}</b></td></tr>`).join('')||'<tr><td colspan="3">Belum ada data.</td></tr>'}
</tbody></table></div></section>`}
async function settings(){const d=await api('dashboard');const a=d.staff.find(s=>/admin/i.test(s.role||''))||d.staff[0]||{};
$('#app').innerHTML=`<section class="setting">
<div class="setrow"><div><b>Laundry Bersih</b><p>Workspace aktif</p></div><span class="chip Lunas">Aktif</span></div>
<div class="setrow"><div><b>${esc(a.name||'-')}</b><p>${esc(a.role||'-')}</p></div><span class="muted">${esc(a.phone||'')}</span></div>
<div class="setrow"><div><b>${d.services.length} layanan</b><p>Layanan yang terdaftar</p></div><button class="filter" data-go="services">Kelola →</button></div>
<div class="setrow"><div><b>${d.customers.length} pelanggan</b><p>Pelanggan terdaftar</p></div><button class="filter" data-go="customers">Kelola →</button></div>
<div class="setrow"><div><b>${d.staff.length} karyawan</b><p>Tim yang terdaftar</p></div><button class="filter" data-go="staff">Kelola →</button></div>
</section>`;goLinks()}

// Entry point
async function page(type){current=type;$('#title').textContent=names[type]||type;
try{if(type==='dashboard')return await dashboard();if(type==='reports')return await reports();if(type==='settings')return await settings();return list(type)}
catch(e){$('#app').innerHTML=`<div class="top"><p class="muted">${esc(e.message)}</p></div>`}}
page('dashboard');
