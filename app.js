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
    initColorSharing();
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

// COLOR SHARING TAB
function initColorSharing() {
    const userSelect = document.getElementById('userSelect');
    const mostCommonBtn = document.getElementById('mostCommonBtn');
    const leastCommonBtn = document.getElementById('leastCommonBtn');

    // Populate user dropdown
    processedData.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = formatUsername(user);
        userSelect.appendChild(option);
    });

    let comparisonMode = 'most'; // 'most' or 'least'

    mostCommonBtn.addEventListener('click', () => {
        comparisonMode = 'most';
        mostCommonBtn.classList.add('active');
        leastCommonBtn.classList.remove('active');
        if (userSelect.value) {
            showColorSharing(parseInt(userSelect.value), comparisonMode);
        }
    });

    leastCommonBtn.addEventListener('click', () => {
        comparisonMode = 'least';
        leastCommonBtn.classList.add('active');
        mostCommonBtn.classList.remove('active');
        if (userSelect.value) {
            showColorSharing(parseInt(userSelect.value), comparisonMode);
        }
    });

    userSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            showColorSharing(parseInt(e.target.value), comparisonMode);
        }
    });
}

function showColorSharing(userId, mode) {
    const results = document.getElementById('sharingResults');
    const selectedUser = processedData.users.find(u => u.id === userId);
    if (!selectedUser) return;

    const selectedColors = processedData.userColors[userId];
    const comparisons = [];

    processedData.users.forEach(user => {
        if (user.id === userId) return;

        const userColors = processedData.userColors[user.id];
        const intersection = new Set([...selectedColors].filter(c => userColors.has(c)));
        const inCommon = intersection.size;
        
        // Calculate colors NOT in common
        const notInCommon = (selectedColors.size - inCommon) + (userColors.size - inCommon);

        comparisons.push({
            user: user,
            inCommon: inCommon,
            notInCommon: notInCommon,
            sharedColors: Array.from(intersection)
        });
    });

    // Sort based on mode
    if (mode === 'most') {
        comparisons.sort((a, b) => b.inCommon - a.inCommon);
    } else {
        comparisons.sort((a, b) => b.notInCommon - a.notInCommon);
    }

    // Display top 20
    let html = '';
    comparisons.slice(0, 20).forEach(comp => {
        const metric = mode === 'most' ? comp.inCommon : comp.notInCommon;
        const metricLabel = mode === 'most' ? 'colors in common' : 'colors NOT in common';
        
        html += `
            <div class="comparison-result">
                <div class="result-header">
                    <div class="user-name" data-user-id="${comp.user.id}">${formatUsername(comp.user)}</div>
                    ${mode === 'most' && comp.sharedColors.length > 0 ? `
                        <button class="copy-btn" data-colors="${comp.sharedColors.join(',')}" title="Copy shared colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13.5 5.5h-8A1.5 1.5 0 0 0 4 7v8a1.5 1.5 0 0 0 1.5 1.5h8A1.5 1.5 0 0 0 15 15V7a1.5 1.5 0 0 0-1.5-1.5z" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M3 10.5H2.5A1.5 1.5 0 0 1 1 9V1.5A1.5 1.5 0 0 1 2.5 0h8A1.5 1.5 0 0 1 12 1.5V2" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="stats">
                    <strong>${metric}</strong> ${metricLabel}
                </div>
                ${mode === 'most' && comp.sharedColors.length > 0 ? `
                    <div class="color-samples">
                        ${comp.sharedColors.slice(0, 20).map(color => 
                            `<div class="color-sample" style="background-color: ${decimalToHex(color)};" title="${decimalToHex(color)}"></div>`
                        ).join('')}
                        ${comp.sharedColors.length > 20 ? `<span>+${comp.sharedColors.length - 20} more</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    });

    results.innerHTML = html;
    
    // Add click handlers for copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const colors = this.getAttribute('data-colors').split(',');
            const hexColors = colors.map(c => decimalToHex(c)).join(', ');
            copyToClipboard(hexColors, `Copied ${colors.length} colors!`);
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
