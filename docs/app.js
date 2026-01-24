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

// Utility: Show copy notification
function showCopyNotification(text = 'Copied to clipboard!') {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = text;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Utility: Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopyNotification('Copied to clipboard!');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showCopyNotification('Copied to clipboard!');
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

function initTop500() {
    const copyTop500Icon = document.getElementById('copyTop500Icon');
    const copyUserColorsIcon = document.getElementById('copyUserColorsIcon');

    copyTop500Icon.addEventListener('click', () => {
        const sortedColors = Object.entries(processedData.colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 500);
        const hexValues = sortedColors.map(([color]) => decimalToHex(color)).join(',');
        copyToClipboard(hexValues);
    });

    copyUserColorsIcon.addEventListener('click', () => {
        // Get all unique colors from all users
        const colors = [];
        processedData.users.forEach(user => {
            user.colors.forEach(color => {
                if (!colors.includes(color)) {
                    colors.push(color);
                }
            });
        });
        const hexValues = colors.map(color => decimalToHex(color)).join(',');
        copyToClipboard(hexValues);
    });

    renderColorChart();
    renderUserGrid();
}

function renderColorChart() {
    const ctx = document.getElementById('colorChart').getContext('2d');
    
    // Get top 500 colors sorted by count
    const sortedColors = Object.entries(processedData.colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 500);

    const labels = sortedColors.map(([color]) => decimalToHex(color));
    const data = sortedColors.map(([, count]) => count);

    // Update textarea with hex values
    const hexTextarea = document.getElementById('hexTextarea');
    hexTextarea.value = labels.join(',');

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
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
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
                        color: '#e0e0e0'
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return 'Color: ' + context[0].label;
                        },
                        label: function(context) {
                            return 'Owners: ' + context.parsed.y;
                        }
                    },
                    backgroundColor: '#1a2d4d',
                    titleColor: '#4ecdc4',
                    bodyColor: '#e0e0e0',
                    borderColor: '#4ecdc4',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        color: '#b0b0b0',
                        maxRotation: 65,
                        minRotation: 45,
                        font: {
                            size: 9
                        },
                        callback: function(value, index) {
                            if (index % Math.ceil(labels.length / 20) === 0) {
                                return labels[index];
                            }
                            return '';
                        }
                    },
                    grid: {
                        color: '#265073'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Owners',
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#b0b0b0'
                    },
                    grid: {
                        color: '#265073'
                    }
                }
            }
        }
    });
}

function renderUserGrid() {
    const userGrid = document.getElementById('userGrid');
    
    // Get top 500 colors
    const sortedColors = Object.entries(processedData.colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 500);

    const colors = sortedColors.map(([color]) => color);

    // Create table HTML
    let html = '<table class="grid-table"><thead><tr><th>User</th>';
    colors.forEach(color => {
        html += `<th style="background-color: ${decimalToHex(color)}; width: 30px;" title="${decimalToHex(color)}"></th>`;
    });
    html += '</tr></thead><tbody>';

    processedData.users.forEach(user => {
        html += `<tr><td class="color-label"><span class="user-name" data-user-id="${user.id}">${formatUsername(user)}</span></td>`;
        colors.forEach(color => {
            const owned = user.colors.includes(color);
            const bgColor = owned ? decimalToHex(color) : '#cccccc';
            const opacity = owned ? '1' : '0.1';
            const hex = decimalToHex(color);
            html += `<td class="color-grid-cell" data-hex="${hex}" onclick="copyColorCell(event)" style="cursor: pointer; position: relative; height: 30px;">
                <div class="grid-cell ${owned ? 'owned' : 'not-owned'}" style="width: 100%; height: 100%; background-color: ${bgColor}; opacity: ${opacity};" title="${hex}"></div>
                ${owned ? `<div class="hex-value" style="display: none;">${hex}</div>` : ''}
            </td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    userGrid.innerHTML = html;

    // Add hover effects
    document.querySelectorAll('.color-grid-cell').forEach(cell => {
        cell.addEventListener('mouseenter', function() {
            const hexValue = this.querySelector('.hex-value');
            if (hexValue) {
                hexValue.style.display = 'block';
            }
        });
        cell.addEventListener('mouseleave', function() {
            const hexValue = this.querySelector('.hex-value');
            if (hexValue) {
                hexValue.style.display = 'none';
            }
        });
    });
}

function copyColorCell(event) {
    const cell = event.currentTarget;
    const hex = cell.dataset.hex;
    if (hex) {
        copyToClipboard(hex);
    }
}

// COLOR SHARING TAB
let currentSharingData = [];

function initColorSharing() {
    const userSelect = document.getElementById('userSelect');
    const mostCommonBtn = document.getElementById('mostCommonBtn');
    const leastCommonBtn = document.getElementById('leastCommonBtn');
    const copySharingIcon = document.getElementById('copySharingIcon');

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

    copySharingIcon.addEventListener('click', () => {
        if (currentSharingData.length > 0) {
            const allSharedColors = [];
            currentSharingData.forEach(comp => {
                comp.sharedColors.forEach(color => {
                    if (!allSharedColors.includes(color)) {
                        allSharedColors.push(color);
                    }
                });
            });
            const hexValues = allSharedColors.map(color => decimalToHex(color)).join(',');
            copyToClipboard(hexValues);
        }
    });
}

function showColorSharing(userId, mode) {
    const results = document.getElementById('sharingResults');
    const copySharingIcon = document.getElementById('copySharingIcon');
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

    // Store current sharing data
    currentSharingData = comparisons;
    copySharingIcon.style.display = comparisons.some(c => c.sharedColors.length > 0) ? 'inline-block' : 'none';

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
        const displayColors = comp.sharedColors.slice(0, 10);
        const hasMore = comp.sharedColors.length > 10;
        
        html += `
            <div class="comparison-result">
                <div class="user-name" data-user-id="${comp.user.id}">${formatUsername(comp.user)}</div>
                <div class="stats">
                    <strong>${metric}</strong> ${metricLabel}
                </div>
                ${mode === 'most' && comp.sharedColors.length > 0 ? `
                    <div class="color-samples" id="colors-${comp.user.id}">
                        ${displayColors.map(color => 
                            `<div class="color-sample" style="background-color: ${decimalToHex(color)};" title="${decimalToHex(color)}" onclick="copyColorCell(event)" data-hex="${decimalToHex(color)}"></div>`
                        ).join('')}
                    </div>
                    ${hasMore ? `<span class="show-more" onclick="toggleExpandColors(${comp.user.id}, '${comp.sharedColors.map(c => decimalToHex(c)).join(',')}')">+${comp.sharedColors.length - 10} more</span>` : ''}
                ` : ''}
            </div>
        `;
    });

    results.innerHTML = html;
}

function toggleExpandColors(userId, hexValues) {
    const container = document.getElementById(`colors-${userId}`);
    const showMore = container.nextElementSibling;
    
    if (container.classList.contains('expanded')) {
        // Collapse
        const colors = hexValues.split(',').slice(0, 10);
        container.innerHTML = colors.map(hex => 
            `<div class="color-sample" style="background-color: ${hex};" title="${hex}" onclick="copyColorCell(event)" data-hex="${hex}"></div>`
        ).join('');
        container.classList.remove('expanded');
        if (showMore) {
            showMore.textContent = `+${hexValues.split(',').length - 10} more`;
        }
    } else {
        // Expand
        const colors = hexValues.split(',');
        container.innerHTML = colors.map(hex => 
            `<div class="color-sample" style="background-color: ${hex};" title="${hex}" onclick="copyColorCell(event)" data-hex="${hex}"></div>`
        ).join('');
        container.classList.add('expanded');
        if (showMore) {
            showMore.textContent = 'Show less';
        }
    }
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
