document.addEventListener('DOMContentLoaded', () => {
    const passwordOverlay = document.getElementById('password-overlay');
    const mainDashboard = document.getElementById('main-dashboard');
    const passwordInput = document.getElementById('password-input');
    const passwordBtn = document.getElementById('password-btn');
    const passwordError = document.getElementById('password-error');

    // Handle Password
    function checkPassword() {
        if (passwordInput.value === '7730') {
            passwordOverlay.style.display = 'none';
            mainDashboard.style.display = 'block';
            fetchData();
        } else {
            passwordError.classList.remove('hidden');
        }
    }

    passwordBtn.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });

    const refreshBtn = document.getElementById('refresh-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const writersTbody = document.getElementById('writers-tbody');
    const headers = document.querySelectorAll('th[data-sort]');
    
    let currentData = [];
    let currentSortColumn = 'name';
    let sortAscending = true;

    async function fetchData() {
        showLoading(true);
        try {
            const res = await fetch('/api/kpi');
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();
            
            if (data.writers && data.writers.length > 0) {
                currentData = data.writers;
                updateSummary(data.writers);
                renderTable();
                updateLastUpdated();
            }
        } catch (error) {
            console.error(error);
            alert('Error fetching KPI data. Please ensure the backend is running and the service account is configured correctly.');
        } finally {
            showLoading(false);
        }
    }

    function updateSummary(writers) {
        let totalTarget = 0;
        let totalTillNow = 0;
        let onTrack = 0;
        let behind = 0;

        writers.forEach(w => {
            totalTarget += Number(w.target || 0);
            totalTillNow += Number(w.tillNow || 0);
            if (w.status === 'ON TRACK') {
                onTrack++;
            } else {
                behind++;
            }
        });

        const overallPercent = totalTarget > 0 ? ((totalTillNow / totalTarget) * 100).toFixed(1) : 0;

        document.getElementById('total-target').textContent = totalTarget.toLocaleString();
        document.getElementById('total-till-now').textContent = totalTillNow.toLocaleString();
        document.getElementById('overall-achieved').textContent = overallPercent + '%';
        document.getElementById('count-on-track').textContent = onTrack;
        document.getElementById('count-behind').textContent = behind;
    }

    function renderTable() {
        writersTbody.innerHTML = '';
        
        // Sort data
        const sortedData = [...currentData].sort((a, b) => {
            let valA = a[currentSortColumn];
            let valB = b[currentSortColumn];

            if (currentSortColumn !== 'name' && currentSortColumn !== 'status') {
                valA = valA === '-' ? -9999 : Number(valA);
                valB = valB === '-' ? -9999 : Number(valB);
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return sortAscending ? -1 : 1;
            if (valA > valB) return sortAscending ? 1 : -1;
            return 0;
        });

        // Update sorting icons
        headers.forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (th.dataset.sort === currentSortColumn) {
                icon.textContent = sortAscending ? '↑' : '↓';
                icon.style.opacity = '1';
            } else {
                icon.textContent = '↕';
                icon.style.opacity = '0.4';
            }
        });

        // Render rows
        sortedData.forEach(writer => {
            const tr = document.createElement('tr');
            if (writer.status === 'BEHIND') {
                tr.classList.add('row-behind');
            }

            const pillClass = writer.status === 'ON TRACK' ? 'on-track' : 'behind';

            tr.innerHTML = `
                <td><div class="writer-name">${writer.name}</div></td>
                <td>${writer.target}</td>
                <td>${writer.achievedToday}</td>
                <td>${writer.tillNow}</td>
                <td>${writer.totalWordcount.toLocaleString()}</td>
                <td>${writer.avgWordcount}</td>
                <td>${writer.currentRunRate}</td>
                <td>${writer.requiredRunRate}</td>
                <td><span class="status-pill ${pillClass}">${writer.status}</span></td>
            `;
            writersTbody.appendChild(tr);
        });
    }

    function updateLastUpdated() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        document.getElementById('last-updated').textContent = `Last updated: ${timeStr}`;
    }

    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }

    refreshBtn.addEventListener('click', fetchData);

    headers.forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (currentSortColumn === col) {
                sortAscending = !sortAscending;
            } else {
                currentSortColumn = col;
                sortAscending = true;
            }
            renderTable();
        });
    });

    // Do not call fetchData initially, it will be called after login.
});
