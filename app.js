// This will be replaced at build time with actual data from GitHub secrets
const USER_DATA_PLACEHOLDER = '<!-- USER_DATA_INJECT -->';

let fullUserData = [];
let processedData = {
    users: [],
    colorCounts: {},
    userColors: {}
};

// Utility: Convert decimal to hex color
function decimalToHex(decimal) {
    return '#' + parseInt(decimal).toString(16).padStart(6, '0').toUpperCase();
}

// Utility: Format username
function formatUsername(user) {
    const name = user.name || '';
    return `${name}#${user.id}`;
}

// Utility: Copy to clipboard
function copyToClipboard(text, message = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary feedback
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Load and process data
async function loadData() {
    try {
        // In production, data will be injected here
        // For now, load from userdata.json
        const response = await fetch('userdata.json');
        fullUserData = await response.json();
        
        processData();
        initializeApp();
    } catch (error) {
        console.error('Error loading data:', error);
        document.querySelector('main').innerHTML = '<div class="error">Failed to load data. Please try again later.</div>';
    }
}

// Process raw data
function processData() {
    processedData.users = fullUserData.map(user => {
        // Map short keys: i=id, n=name, l=level, c=colors
        const colors = user.c ? user.c.split(',').map(c => c.trim()).filter(c => c) : [];
        return {
            id: user.i,
            name: user.n,
            level: user.l,
            colors: colors
        };
    });

    // Count color occurrences
    processedData.colorCounts = {};
    processedData.users.forEach(user => {
        user.colors.forEach(color => {
            processedData.colorCounts[color] = (processedData.colorCounts[color] || 0) + 1;
        });
    });

    // Create user color map
    processedData.userColors = {};
    processedData.users.forEach(user => {
        processedData.userColors[user.id] = new Set(user.colors);
    });
}

// Initialize the application
function initializeApp() {
    setupTabSwitching();
    setupUserModal();
    initTop500();
    initTopPartners();
    initRankings();
}

// Tab switching
function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// User Modal
function setupUserModal() {
    const modal = document.getElementById('userModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Add click handlers for all user names
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('user-name')) {
            const userId = parseInt(e.target.dataset.userId);
            showUserModal(userId);
        }
    });
}

function showUserModal(userId) {
    const user = processedData.users.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('userModal');
    const modalContent = document.getElementById('modalUserInfo');

    modalContent.innerHTML = `
        <h2>${formatUsername(user)}</h2>
        <p><strong>Level:</strong> ${user.level}</p>
        <p><strong>Colors Owned:</strong> ${user.colors.length}</p>
        <div class="guild-tag">
            <strong>Guild Tag:</strong><br>
            💛<span style="display: inline-block; background: linear-gradient(135deg, rgba(213, 45, 0, 1), rgba(239, 118, 39, 1), rgba(255, 255, 255, 1), rgba(209, 98, 164, 1), rgba(181, 86, 144, 1)); box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); font-family: &quot;Press Start 2P&quot;, &quot;Courier New&quot;, monospace; font-size: 24px; font-weight: bold; font-style: italic; letter-spacing: 2px; text-shadow: 3px 3px 4px rgba(0, 0, 0, 0.6); padding: 10px 14px; border-radius: 6px"><span style="color: rgba(25, 130, 196, 1)">PI</span><span style="color: rgba(231, 29, 54, 1)">XEL</span><span style="color: rgba(25, 130, 196, 1)">CONS</span></span>💙
        </div>
    `;

    modal.classList.add('show');
}

// TOP 500 TAB
let colorChart = null;
let currentSort = 'colors'; // 'colors' or 'alpha'
let showDefaultColors = false; // By default, hide the colors everyone has

// The first 29 colors that everyone has by default (from #FFFFFF to #000000)
const DEFAULT_COLORS = [
    '16777215', '16053663', '16763450', '16752412', '16734558', '15146294', '15973314', '16745889',
    '12411773', '13481179', '6966419', '5052749', '11063516', '3065014', '1725276', '7183821',
    '1671876', '10600833', '9095462', '10526880', '7029286', '5263440', '13619320', '1333882',
    '9116964', '12615546', '12884588', '5995292', '0'
];

function initTop500() {
    const graphViewBtn = document.getElementById('graphViewBtn');
    const userViewBtn = document.getElementById('userViewBtn');
    const graphView = document.getElementById('graphView');
    const userView = document.getElementById('userView');
    const sortByColorsBtn = document.getElementById('sortByColorsBtn');
    const sortAlphaBtn = document.getElementById('sortAlphaBtn');
    const showDefaultColorsCheckbox = document.getElementById('showDefaultColors');

    graphViewBtn.addEventListener('click', () => {
        graphViewBtn.classList.add('active');
        userViewBtn.classList.remove('active');
        graphView.classList.remove('hidden');
        userView.classList.add('hidden');
    });

    userViewBtn.addEventListener('click', () => {
        userViewBtn.classList.add('active');
        graphViewBtn.classList.remove('active');
        userView.classList.remove('hidden');
        graphView.classList.add('hidden');
        renderUserGrid();
    });

    sortByColorsBtn.addEventListener('click', () => {
        currentSort = 'colors';
        sortByColorsBtn.classList.add('active');
        sortAlphaBtn.classList.remove('active');
        renderUserGrid();
    });

    sortAlphaBtn.addEventListener('click', () => {
        currentSort = 'alpha';
        sortAlphaBtn.classList.add('active');
        sortByColorsBtn.classList.remove('active');
        renderUserGrid();
    });

    showDefaultColorsCheckbox.addEventListener('change', () => {
        showDefaultColors = showDefaultColorsCheckbox.checked;
        renderUserGrid();
    });

    renderColorChart();
}

function renderColorChart() {
    const ctx = document.getElementById('colorChart').getContext('2d');
    
    // Get top 500 colors sorted by count
    const sortedColors = Object.entries(processedData.colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 500);

    const labels = sortedColors.map(([color]) => decimalToHex(color));
    const data = sortedColors.map(([, count]) => count);
    const backgroundColors = sortedColors.map(([color]) => decimalToHex(color));

    // Update textarea with hex values
    const hexTextarea = document.getElementById('hexTextarea');
    if (hexTextarea) {
        hexTextarea.value = labels.join(', ');
    }

    if (colorChart) {
        colorChart.destroy();
    }

    colorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Owners',
                data: data,
                borderColor: '#5865f2',
                backgroundColor: 'rgba(88, 101, 242, 0.1)',
                borderWidth: 3,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#5865f2',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#5865f2',
                pointHoverBorderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#dcddde'
                    }
                },
                tooltip: {
                    backgroundColor: '#202225',
                    titleColor: '#dcddde',
                    bodyColor: '#dcddde',
                    borderColor: '#5865f2',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return 'Color: ' + context[0].label;
                        },
                        label: function(context) {
                            return 'Owners: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    grid: {
                        color: '#1a1b1e'
                    },
                    ticks: {
                        color: '#b9bbbe'
                    },
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Owners'
                    }
                }
            }
        }
    });
}

function renderUserGrid() {
    const userGrid = document.getElementById('userGrid');
    
    // Get top 500 colors
    let sortedColors = Object.entries(processedData.colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 500);

    // Filter out default colors if checkbox is not checked
    if (!showDefaultColors) {
        sortedColors = sortedColors.filter(([color]) => !DEFAULT_COLORS.includes(color));
    }

    const colors = sortedColors.map(([color]) => color);

    // Sort users based on current sort mode
    let sortedUsers = [...processedData.users];
    if (currentSort === 'colors') {
        // Sort by number of colors owned in top 500 (descending)
        sortedUsers.sort((a, b) => {
            const aCount = a.colors.filter(c => colors.includes(c)).length;
            const bCount = b.colors.filter(c => colors.includes(c)).length;
            return bCount - aCount;
        });
    } else {
        // Sort alphabetically by username
        sortedUsers.sort((a, b) => {
            const nameA = formatUsername(a).toLowerCase();
            const nameB = formatUsername(b).toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }

    // Create table HTML
    let html = '<table class="grid-table"><thead><tr><th>User</th>';
    colors.forEach(color => {
        const hex = decimalToHex(color);
        html += `<th class="color-header" data-hex="${hex}" style="background-color: ${hex}; width: 20px; cursor: pointer;">
            <span class="color-tooltip">${hex}</span>
        </th>`;
    });
    html += '</tr></thead><tbody>';

    sortedUsers.forEach(user => {
        html += `<tr><td class="color-label"><span class="user-name" data-user-id="${user.id}">${formatUsername(user)}</span></td>`;
        colors.forEach(color => {
            const owned = user.colors.includes(color);
            if (owned) {
                html += `<td><div class="grid-cell" style="background-color: ${decimalToHex(color)};"></div></td>`;
            } else {
                html += `<td></td>`;
            }
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    userGrid.innerHTML = html;
    
    // Add click handlers to color headers
    document.querySelectorAll('.color-header').forEach(header => {
        header.addEventListener('click', function() {
            const hex = this.getAttribute('data-hex');
            copyToClipboard(hex, `Copied ${hex}`);
        });
    });
}

// MY TOP PARTNERS TAB
let partnerShowDefault = false;
let partnerComparisonMode = 'most';

function initTopPartners() {
    const userSelect = document.getElementById('partnerUserSelect');
    const showDefaultCheckbox = document.getElementById('partnerShowDefault');
    const mostCommonBtn = document.getElementById('mostCommonBtn');
    const leastCommonBtn = document.getElementById('leastCommonBtn');

    // Populate dropdown alphabetically
    const sorted = [...processedData.users].sort((a, b) =>
        formatUsername(a).toLowerCase().localeCompare(formatUsername(b).toLowerCase())
    );
    sorted.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = formatUsername(user);
        userSelect.appendChild(option);
    });

    userSelect.addEventListener('change', (e) => {
        if (e.target.value) showTopPartners(parseInt(e.target.value));
    });

    showDefaultCheckbox.addEventListener('change', () => {
        partnerShowDefault = showDefaultCheckbox.checked;
        if (userSelect.value) showTopPartners(parseInt(userSelect.value));
    });

    mostCommonBtn.addEventListener('click', () => {
        partnerComparisonMode = 'most';
        mostCommonBtn.classList.add('active');
        leastCommonBtn.classList.remove('active');
        if (userSelect.value) showTopPartners(parseInt(userSelect.value));
    });

    leastCommonBtn.addEventListener('click', () => {
        partnerComparisonMode = 'least';
        leastCommonBtn.classList.add('active');
        mostCommonBtn.classList.remove('active');
        if (userSelect.value) showTopPartners(parseInt(userSelect.value));
    });
}

function showTopPartners(userId) {
    const container = document.getElementById('partnerResults');
    const me = processedData.users.find(u => u.id === userId);
    if (!me) return;

    const myColors = processedData.userColors[userId];
    const comparisons = [];

    processedData.users.forEach(other => {
        if (other.id === userId) return;
        const otherColors = processedData.userColors[other.id];
        let intersection = new Set([...myColors].filter(c => otherColors.has(c)));
        if (!partnerShowDefault) {
            intersection = new Set([...intersection].filter(c => !DEFAULT_COLORS.includes(c)));
        }
        const inCommon = intersection.size;
        const notInCommon = (myColors.size - inCommon) + (otherColors.size - inCommon);
        comparisons.push({
            user: other,
            inCommon: inCommon,
            notInCommon: notInCommon,
            sharedColors: Array.from(intersection)
        });
    });

    // Sort based on mode
    if (partnerComparisonMode === 'most') {
        comparisons.sort((a, b) => b.inCommon - a.inCommon);
    } else {
        comparisons.sort((a, b) => b.notInCommon - a.notInCommon);
    }

    // #1 partner is always the user with most colors in common
    const mostSorted = [...comparisons].sort((a, b) => b.inCommon - a.inCommon);
    const best = mostSorted[0];

    if (!best) {
        container.innerHTML = '<p style="color:#8e9297;">No partner found.</p>';
        return;
    }

    const bestPartnerColors = processedData.userColors[best.user.id];

    // Colors only I own vs best partner
    let onlyMine = [...myColors].filter(c => !bestPartnerColors.has(c));
    let onlyTheirs = [...bestPartnerColors].filter(c => !myColors.has(c));
    if (!partnerShowDefault) {
        onlyMine = onlyMine.filter(c => !DEFAULT_COLORS.includes(c));
        onlyTheirs = onlyTheirs.filter(c => !DEFAULT_COLORS.includes(c));
    }

    function renderColorGrid(colors) {
        if (colors.length === 0) return '<p style="color:#8e9297; margin-top:10px;">None</p>';
        return `<div class="color-samples" style="margin-top:10px;">
            ${colors.map(c =>
                `<div class="color-sample" style="background-color:${decimalToHex(c)};" title="${decimalToHex(c)}"></div>`
            ).join('')}
        </div>`;
    }

    function copyBtnHtml(colors) {
        if (colors.length === 0) return '';
        return `<button class="copy-btn" data-colors="${colors.join(',')}" title="Copy colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 5.5h-8A1.5 1.5 0 0 0 4 7v8a1.5 1.5 0 0 0 1.5 1.5h8A1.5 1.5 0 0 0 15 15V7a1.5 1.5 0 0 0-1.5-1.5z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M3 10.5H2.5A1.5 1.5 0 0 1 1 9V1.5A1.5 1.5 0 0 1 2.5 0h8A1.5 1.5 0 0 1 12 1.5V2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        </button>`;
    }

    let html = '';

    // Hero section for #1 partner (only in "most" mode)
    if (partnerComparisonMode === 'most') {
        html += `
            <div class="partner-hero">
                <div class="partner-label">Your #1 Partner</div>
                <div class="partner-name user-name" data-user-id="${best.user.id}">${formatUsername(best.user)}</div>
                <div class="partner-stat"><strong>${best.inCommon}</strong> colors co-owned</div>
            </div>

            <div class="partner-section">
                <div class="section-header">
                    <h3>Co-Owned Colors (${best.sharedColors.length})</h3>
                    ${copyBtnHtml(best.sharedColors)}
                </div>
                ${renderColorGrid(best.sharedColors)}
            </div>

            <div class="partner-columns">
                <div class="partner-section">
                    <div class="section-header">
                        <h3>Only ${formatUsername(me)} (${onlyMine.length})</h3>
                        ${copyBtnHtml(onlyMine)}
                    </div>
                    ${renderColorGrid(onlyMine)}
                </div>
                <div class="partner-section">
                    <div class="section-header">
                        <h3>Only ${formatUsername(best.user)} (${onlyTheirs.length})</h3>
                        ${copyBtnHtml(onlyTheirs)}
                    </div>
                    ${renderColorGrid(onlyTheirs)}
                </div>
            </div>
        `;
    }

    // Runner-ups / least-common list
    const startIdx = (partnerComparisonMode === 'most') ? 1 : 0;
    const runnersToShow = comparisons.slice(startIdx, startIdx + 19);

    if (runnersToShow.length > 0) {
        const modeLabel = partnerComparisonMode === 'most' ? 'Runner-Ups' : 'Least Colors in Common';
        html += `<h2 class="runner-ups-heading">${modeLabel}</h2>`;

        runnersToShow.forEach(comp => {
            const metric = partnerComparisonMode === 'most' ? comp.inCommon : comp.notInCommon;
            const metricLabel = partnerComparisonMode === 'most' ? 'colors in common' : 'colors NOT in common';

            html += `
                <div class="comparison-result">
                    <div class="result-header">
                        <div class="user-name" data-user-id="${comp.user.id}">${formatUsername(comp.user)}</div>
                        ${partnerComparisonMode === 'most' && comp.sharedColors.length > 0 ? copyBtnHtml(comp.sharedColors) : ''}
                    </div>
                    <div class="stats">
                        <strong>${metric}</strong> ${metricLabel}
                    </div>
                    ${partnerComparisonMode === 'most' && comp.sharedColors.length > 0 ? `
                        <div class="color-samples" id="colors-${comp.user.id}">
                            ${comp.sharedColors.slice(0, 10).map(color =>
                                `<div class="color-sample" style="background-color: ${decimalToHex(color)};" title="${decimalToHex(color)}"></div>`
                            ).join('')}
                        </div>
                        ${comp.sharedColors.length > 10 ? `<span class="show-more" style="cursor: pointer; color: #5865f2; font-size: 0.9em;" data-user-id="${comp.user.id}" data-colors="${comp.sharedColors.map(c => decimalToHex(c)).join(',')}">
                            +${comp.sharedColors.length - 10} more</span>` : ''}
                    ` : ''}
                </div>
            `;
        });
    }

    container.innerHTML = html;

    // Copy button handlers
    container.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const colors = this.getAttribute('data-colors').split(',');
            const hexColors = colors.map(c => decimalToHex(c)).join(', ');
            copyToClipboard(hexColors, `Copied ${colors.length} colors!`);
        });
    });

    // Show-more/show-less handlers
    container.querySelectorAll('.show-more').forEach(span => {
        span.addEventListener('click', function() {
            const uid = this.getAttribute('data-user-id');
            const hexValues = this.getAttribute('data-colors');
            const colorContainer = document.getElementById(`colors-${uid}`);

            if (colorContainer.classList.contains('expanded')) {
                const colors = hexValues.split(',').slice(0, 10);
                colorContainer.innerHTML = colors.map(hex =>
                    `<div class="color-sample" style="background-color: ${hex};" title="${hex}"></div>`
                ).join('');
                colorContainer.classList.remove('expanded');
                this.textContent = `+${hexValues.split(',').length - 10} more`;
            } else {
                const colors = hexValues.split(',');
                colorContainer.innerHTML = colors.map(hex =>
                    `<div class="color-sample" style="background-color: ${hex};" title="${hex}"></div>`
                ).join('');
                colorContainer.classList.add('expanded');
                this.textContent = 'Show less';
            }
        });
    });
}

// RANKINGS TAB
function initRankings() {
    renderMostColorsRanking();
    renderMostSharedRanking();
    renderMostUniqueRanking();
}

function renderMostColorsRanking() {
    const tbody = document.querySelector('#mostColorsTable tbody');
    
    const sorted = [...processedData.users]
        .sort((a, b) => b.colors.length - a.colors.length)
        .slice(0, 50);

    let html = '';
    sorted.forEach((user, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><span class="user-name" data-user-id="${user.id}">${formatUsername(user)}</span></td>
                <td>${user.colors.length}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function renderMostSharedRanking() {
    const tbody = document.querySelector('#mostSharedTable tbody');
    
    // Calculate total shared colors for each user
    const sharedCounts = processedData.users.map(user => {
        let totalShared = 0;
        const userColors = processedData.userColors[user.id];

        processedData.users.forEach(otherUser => {
            if (otherUser.id === user.id) return;
            const otherColors = processedData.userColors[otherUser.id];
            const intersection = [...userColors].filter(c => otherColors.has(c));
            totalShared += intersection.length;
        });

        return {
            user: user,
            totalShared: totalShared
        };
    });

    const sorted = sharedCounts.sort((a, b) => b.totalShared - a.totalShared).slice(0, 50);

    let html = '';
    sorted.forEach((item, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><span class="user-name" data-user-id="${item.user.id}">${formatUsername(item.user)}</span></td>
                <td>${item.totalShared}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function renderMostUniqueRanking() {
    const tbody = document.querySelector('#mostUniqueTable tbody');
    
    // Calculate unique colors for each user
    const uniqueCounts = processedData.users.map(user => {
        const userColors = processedData.userColors[user.id];
        let uniqueColors = 0;

        userColors.forEach(color => {
            if (processedData.colorCounts[color] === 1) {
                uniqueColors++;
            }
        });

        return {
            user: user,
            uniqueColors: uniqueColors
        };
    });

    const sorted = uniqueCounts.sort((a, b) => b.uniqueColors - a.uniqueColors).slice(0, 50);

    let html = '';
    sorted.forEach((item, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><span class="user-name" data-user-id="${item.user.id}">${formatUsername(item.user)}</span></td>
                <td>${item.uniqueColors}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
