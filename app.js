const modal = document.getElementById('modal');
document.getElementById('newOrder').onclick = () => modal.classList.add('show');
document.getElementById('closeModal').onclick = () => modal.classList.remove('show');
modal.onclick = e => { if (e.target === modal) modal.classList.remove('show'); };
document.querySelector('.modal').onsubmit = e => { e.preventDefault(); modal.classList.remove('show'); alert('Pesanan baru berhasil disimpan.'); };
document.getElementById('menuToggle').onclick = () => document.getElementById('sidebar').classList.toggle('open');
document.querySelectorAll('.nav-item').forEach(item => item.onclick = () => { document.querySelector('.nav-item.active').classList.remove('active'); item.classList.add('active'); document.getElementById('pageTitle').textContent = item.textContent.trim().replace(/\d+$/, ''); });
document.getElementById('allOrders').onclick = () => document.querySelector('[data-page="orders"]').click();
