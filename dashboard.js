// Global state
let state = {
    charts: {},
    data: {
        totalLogs: 0,
        llmCalls: 0,
        avgResponseTime: 0,
        successRate: 0,
        mcpCalls: 0,
        errorRate: 0,
        securityIncidents: 0,
        dangerousPrompts: 0,
        authFailures: 0
    },
    filters: {
        timeRange: '24H',
        startDate: null,
        endDate: null
    },
    security: {
        alertTerms: [],
        blockTerms: []
    },
    // Add cache for data comparison
    cache: {
        lastLogs: null,
        lastHash: null
    }
};

// Constants
const REFRESH_INTERVAL = 5000;
const CHART_COLORS = {
    blue: 'rgba(54, 162, 235, 0.6)',
    red: 'rgba(255, 99, 132, 0.6)',
    green: 'rgba(75, 192, 192, 0.6)',
    purple: 'rgba(153, 102, 255, 0.6)',
    orange: 'rgba(255, 159, 64, 0.6)',
    yellow: 'rgba(255, 205, 86, 0.6)'
};
const STORAGE_KEYS = {
    ALERT_TERMS: 'cylestio_alert_terms',
    BLOCK_TERMS: 'cylestio_block_terms'
};

// Initialize filters
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    initializeSecurityTerms();
    fetchAndProcessData();
    setInterval(fetchAndProcessData, REFRESH_INTERVAL);
});

function initializeFilters() {
    const filterButtons = document.querySelectorAll('#overview .filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const timeRange = button.textContent.trim();
            if (timeRange === 'Custom') {
                showCustomDatePicker();
            } else {
                state.filters.timeRange = timeRange;
                updateDateRange(timeRange);
                fetchAndProcessData();
            }
        });
    });

    // Initialize refresh button
    const refreshBtn = document.querySelector('#overview .refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('rotating');
            fetchAndProcessData().finally(() => {
                setTimeout(() => refreshBtn.classList.remove('rotating'), 1000);
            });
        });
    }
}

function updateDateRange(timeRange) {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
        case '24H':
            startDate.setHours(startDate.getHours() - 24);
            break;
        case '7D':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '1M':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case '3M':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
    }
    
    state.filters.startDate = startDate;
    state.filters.endDate = now;
}

function showCustomDatePicker() {
    // Implementation for custom date picker dialog
    // This could be implemented with a library like flatpickr or custom modal
    console.log('Custom date picker to be implemented');
}

// Initialize security terms from localStorage
function initializeSecurityTerms() {
    // Load saved terms from localStorage
    const savedAlertTerms = localStorage.getItem(STORAGE_KEYS.ALERT_TERMS);
    const savedBlockTerms = localStorage.getItem(STORAGE_KEYS.BLOCK_TERMS);
    
    state.security.alertTerms = savedAlertTerms ? JSON.parse(savedAlertTerms) : [];
    state.security.blockTerms = savedBlockTerms ? JSON.parse(savedBlockTerms) : [];
    
    // Render the terms lists
    renderTermsList('alert');
    renderTermsList('block');
}

function renderTermsList(type) {
    const listElement = document.getElementById(`${type}TermsList`);
    const terms = state.security[`${type}Terms`];
    
    if (!listElement) return;
    
    listElement.innerHTML = terms.map((term, index) => `
        <div class="term-item">
            <div class="term-text">
                <span>${term.text}</span>
                <div class="term-badges">
                    ${term.isRegex ? '<span class="term-badge">Regex</span>' : ''}
                    ${term.caseSensitive ? '<span class="term-badge">Case Sensitive</span>' : ''}
                </div>
            </div>
            <i class="fas fa-times remove-term" onclick="removeTerm('${type}', ${index})"></i>
        </div>
    `).join('');
}

// Modal handling
let currentTermType = null;

function showAddTermModal(type) {
    currentTermType = type;
    const modal = document.getElementById('addTermModal');
    modal.style.display = 'block';
    
    // Reset form
    document.getElementById('newTermInput').value = '';
    document.getElementById('regexOption').checked = false;
    document.getElementById('caseSensitiveOption').checked = false;
}

function hideAddTermModal() {
    const modal = document.getElementById('addTermModal');
    modal.style.display = 'none';
    currentTermType = null;
}

function saveNewTerm() {
    const input = document.getElementById('newTermInput');
    const isRegex = document.getElementById('regexOption').checked;
    const caseSensitive = document.getElementById('caseSensitiveOption').checked;
    
    if (!input.value.trim()) return;
    
    const newTerm = {
        text: input.value.trim(),
        isRegex,
        caseSensitive
    };
    
    // Add to state
    state.security[`${currentTermType}Terms`].push(newTerm);
    
    // Save to localStorage
    localStorage.setItem(
        currentTermType === 'alert' ? STORAGE_KEYS.ALERT_TERMS : STORAGE_KEYS.BLOCK_TERMS,
        JSON.stringify(state.security[`${currentTermType}Terms`])
    );
    
    // Render updated list
    renderTermsList(currentTermType);
    
    // Close modal
    hideAddTermModal();
}

function removeTerm(type, index) {
    state.security[`${type}Terms`].splice(index, 1);
    
    // Save to localStorage
    localStorage.setItem(
        type === 'alert' ? STORAGE_KEYS.ALERT_TERMS : STORAGE_KEYS.BLOCK_TERMS,
        JSON.stringify(state.security[`${type}Terms`])
    );
    
    // Render updated list
    renderTermsList(type);
}

// Helper function to generate hash from logs
function generateLogsHash(logs) {
    return logs.reduce((hash, log) => {
        return hash + log.timestamp + (log.data?.duration || '') + (log.data?.tokens || '');
    }, '');
}

// Helper function to check if data has changed
function hasDataChanged(logs) {
    if (!logs || !state.cache.lastLogs) return true;
    
    const newHash = generateLogsHash(logs);
    if (newHash === state.cache.lastHash) return false;
    
    state.cache.lastHash = newHash;
    state.cache.lastLogs = logs;
    return true;
}

// Helper function to check if specific metrics have changed
function haveMetricsChanged(newMetrics, oldMetrics) {
    return JSON.stringify(newMetrics) !== JSON.stringify(oldMetrics);
}

// Update the existing fetchAndProcessData function to use filters
async function fetchAndProcessData() {
    try {
        const response = await fetch('monitoring_dashboard.json');
        const text = await response.text();
        const logs = text.split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line))
            .filter(log => {
                if (!state.filters.startDate || !state.filters.endDate) return true;
                const logDate = new Date(log.timestamp);
                return logDate >= state.filters.startDate && logDate <= state.filters.endDate;
            });

        // Check if data has changed before processing
        if (!hasDataChanged(logs)) {
            return;
        }

        // Store current metrics for comparison
        const oldMetrics = { ...state.data };
        
        updateOverviewMetrics(logs);
        updateLLMMetrics(logs);
        updateToolUsageMetrics(logs);
        updateErrorAnalysis(logs);
        updateConversationFlow(logs);
        
        // Only update tables and charts if metrics have changed
        if (haveMetricsChanged(state.data, oldMetrics)) {
            updateCallsData(logs);
            updateCharts(logs);
        }
    } catch (error) {
        console.error('Error fetching/processing data:', error);
    }
}

function updateOverviewMetrics(logs) {
    // Calculate new metrics
    const newMetrics = {
        totalLogs: logs.length,
        llmCalls: logs.filter(log => 
            log.channel === 'LLM' && 
            (log.event === 'LLM_call_start' || log.event === 'LLM_call_finish')
        ).length
    };

    // Calculate Average Response Time
    const llmFinishLogs = logs.filter(log => log.event === 'LLM_call_finish' && log.data?.duration);
    newMetrics.avgResponseTime = llmFinishLogs.length ? 
        llmFinishLogs.reduce((sum, log) => sum + log.data.duration, 0) / llmFinishLogs.length : 0;

    // Calculate Success Rate
    const successfulCalls = llmFinishLogs.filter(log => !log.data?.error).length;
    newMetrics.successRate = newMetrics.llmCalls ? (successfulCalls / (newMetrics.llmCalls / 2) * 100) : 0;

    // Only update UI if values have changed
    if (newMetrics.totalLogs !== state.data.totalLogs) {
        document.getElementById('totalLogs').textContent = newMetrics.totalLogs;
        state.data.totalLogs = newMetrics.totalLogs;
    }
    if (newMetrics.llmCalls !== state.data.llmCalls) {
        document.getElementById('llmCalls').textContent = newMetrics.llmCalls;
        state.data.llmCalls = newMetrics.llmCalls;
    }
    if (newMetrics.avgResponseTime !== state.data.avgResponseTime) {
        document.getElementById('avgLLMDuration').textContent = newMetrics.avgResponseTime.toFixed(1) + 's';
        state.data.avgResponseTime = newMetrics.avgResponseTime;
    }
    if (newMetrics.successRate !== state.data.successRate) {
        document.getElementById('successRate').textContent = newMetrics.successRate.toFixed(1) + '%';
        state.data.successRate = newMetrics.successRate;
    }
}

function updateLLMMetrics(logs) {
    // Calculate new metrics
    const newMetrics = {
        mcpCalls: logs.filter(log => log.channel === 'MCP').length,
        errorRate: (logs.filter(log => log.level === 'ERROR').length / logs.length * 100) || 0,
        securityIncidents: logs.filter(log => 
            log.level === 'WARNING' || 
            (log.data?.alert && ['dangerous', 'suspicious'].includes(log.data.alert))
        ).length,
        dangerousPrompts: logs.filter(log => log.event === 'dangerous_prompt_detected').length,
        authFailures: logs.filter(log => log.event === 'auth_failure').length
    };

    // Only update UI if values have changed
    if (newMetrics.mcpCalls !== state.data.mcpCalls) {
        document.getElementById('mcpCalls').textContent = newMetrics.mcpCalls;
        state.data.mcpCalls = newMetrics.mcpCalls;
    }
    if (newMetrics.errorRate !== state.data.errorRate) {
        document.getElementById('mcpErrorRate').textContent = newMetrics.errorRate.toFixed(1) + '%';
        state.data.errorRate = newMetrics.errorRate;
    }
    if (newMetrics.securityIncidents !== state.data.securityIncidents) {
        document.getElementById('securityIncidents').textContent = newMetrics.securityIncidents;
        state.data.securityIncidents = newMetrics.securityIncidents;
    }
    if (newMetrics.dangerousPrompts !== state.data.dangerousPrompts) {
        document.getElementById('dangerousPrompts').textContent = newMetrics.dangerousPrompts;
        state.data.dangerousPrompts = newMetrics.dangerousPrompts;
    }
    if (newMetrics.authFailures !== state.data.authFailures) {
        document.getElementById('authFailures').textContent = newMetrics.authFailures;
        state.data.authFailures = newMetrics.authFailures;
    }
}

function updateToolUsageMetrics(logs) {
    const toolData = logs
        .filter(log => log.channel === 'MCP' && log.event === 'tool_call')
        .reduce((acc, log) => {
            const tool = log.data?.args?.match(/'([^']+)'/)?.[1] || 'unknown';
            if (!acc[tool]) {
                acc[tool] = {
                    calls: 0,
                    successfulCalls: 0,
                    totalDuration: 0,
                    lastUsed: log.timestamp
                };
            }
            acc[tool].calls++;
            if (!log.data?.error) acc[tool].successfulCalls++;
            if (log.data?.duration) acc[tool].totalDuration += log.data.duration;
            if (new Date(log.timestamp) > new Date(acc[tool].lastUsed)) {
                acc[tool].lastUsed = log.timestamp;
            }
            return acc;
        }, {});

    // Update tool usage table if it exists
    const toolTable = document.getElementById('toolTable');
    if (toolTable) {
        const tableBody = toolTable.getElementsByTagName('tbody')[0];
        if (tableBody) {
            tableBody.innerHTML = '';
            Object.entries(toolData).forEach(([tool, data]) => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${tool}</td>
                    <td>${data.calls}</td>
                    <td>${((data.successfulCalls / data.calls) * 100).toFixed(1)}%</td>
                    <td>${(data.totalDuration / data.calls).toFixed(2)}ms</td>
                    <td>${new Date(data.lastUsed).toLocaleString()}</td>
                `;
            });
        }
    }

    // Update Tool Chart
    createOrUpdateChart('toolChart', {
        type: 'bar',
        data: {
            labels: Object.keys(toolData),
            datasets: [{
                label: 'Tool Usage Count',
                data: Object.values(toolData).map(d => d.calls),
                backgroundColor: CHART_COLORS.purple
            }]
        }
    });
}

function updateErrorAnalysis(logs) {
    const errorLogs = logs.filter(log => log.level === 'ERROR');
    
    // Update error table if it exists
    const errorTable = document.getElementById('errorTable');
    if (errorTable) {
        const tableBody = errorTable.getElementsByTagName('tbody')[0];
        if (tableBody) {
            tableBody.innerHTML = '';
            errorLogs.forEach(log => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.data?.error?.type || 'Unknown'}</td>
                    <td>${log.channel}</td>
                    <td>${log.data?.error?.message || log.data?.message || 'No message'}</td>
                    <td>${log.data?.error?.stack || 'No stack trace'}</td>
                `;
            });
        }
    }

    // Update Error Chart
    const errorTypes = errorLogs.reduce((acc, log) => {
        const type = log.data?.error?.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    createOrUpdateChart('errorChart', {
        type: 'pie',
        data: {
            labels: Object.keys(errorTypes),
            datasets: [{
                data: Object.values(errorTypes),
                backgroundColor: Object.values(CHART_COLORS)
            }]
        }
    });
}

function updateConversationFlow(logs) {
    const conversationLogs = logs.filter(log => 
        log.channel === 'LLM' && 
        (log.event === 'LLM_call_start' || log.event === 'LLM_call_finish')
    );

    // Update conversation table if it exists
    const conversationTable = document.getElementById('conversationTable');
    if (conversationTable) {
        const tableBody = conversationTable.getElementsByTagName('tbody')[0];
        if (tableBody) {
            tableBody.innerHTML = '';
            conversationLogs.forEach(log => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.event === 'LLM_call_start' ? 'User' : 'Assistant'}</td>
                    <td>${log.data?.prompt || log.data?.response || ''}</td>
                    <td>${log.data?.intent || 'N/A'}</td>
                    <td>${log.data?.tools?.join(', ') || 'None'}</td>
                `;
            });
        }
    }

    // Update Flow Chart
    const flowData = conversationLogs.reduce((acc, log) => {
        const type = log.event === 'LLM_call_start' ? 'User' : 'Assistant';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    createOrUpdateChart('flowChart', {
        type: 'pie',
        data: {
            labels: Object.keys(flowData),
            datasets: [{
                data: Object.values(flowData),
                backgroundColor: [CHART_COLORS.blue, CHART_COLORS.green]
            }]
        }
    });

    // Update Intent Chart
    const intentData = conversationLogs
        .filter(log => log.data?.intent)
        .reduce((acc, log) => {
            acc[log.data.intent] = (acc[log.data.intent] || 0) + 1;
            return acc;
        }, {});

    createOrUpdateChart('intentChart', {
        type: 'bar',
        data: {
            labels: Object.keys(intentData),
            datasets: [{
                label: 'Intent Distribution',
                data: Object.values(intentData),
                backgroundColor: CHART_COLORS.purple
            }]
        }
    });
}

function updateCallsData(logs) {
    const callsTable = $('#callsTable').DataTable();
    callsTable.clear();

    logs.forEach(log => {
        const details = formatLogDetails(log);
        callsTable.row.add([
            new Date(log.timestamp).toLocaleString(),
            log.level,
            log.channel,
            log.event,
            log.data?.duration ? log.data.duration.toFixed(2) + 's' : '-',
            log.data?.alert || '-',
            log.data?.tokens || '-',
            details
        ]);
    });

    callsTable.draw();
}

function formatLogDetails(log) {
    let details = '';
    
    if (log.data) {
        if (log.event === 'LLM_call_start') {
            details = `Prompt: ${truncateText(log.data.prompt, 100)}`;
        } else if (log.event === 'LLM_call_finish') {
            details = `Response: ${truncateText(log.data.response, 100)}`;
        } else if (log.event === 'tool_call') {
            details = `Function: ${log.data.function}, Args: ${truncateText(log.data.args, 100)}`;
        } else if (log.event === 'dangerous_prompt_detected') {
            details = `Alert: ${log.data.alert}, Prompt: ${truncateText(log.data.prompt, 100)}`;
        } else if (log.data.error) {
            details = `Error: ${log.data.error.type || 'Unknown'}`;
            if (log.data.error.message) {
                details += ` - ${log.data.error.message}`;
            }
        } else if (log.data.message) {
            details = log.data.message;
        }
    }

    return details || '-';
}

function truncateText(text, maxLength) {
    if (!text) return '';
    text = text.toString();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function updateCharts(logs) {
    // Event Distribution Chart
    const eventCounts = logs.reduce((acc, log) => {
        acc[log.event] = (acc[log.event] || 0) + 1;
        return acc;
    }, {});

    createOrUpdateChart('eventChart', {
        type: 'bar',
        data: {
            labels: Object.keys(eventCounts),
            datasets: [{
                label: 'Event Count',
                data: Object.values(eventCounts),
                backgroundColor: CHART_COLORS.blue
            }]
        }
    });

    // Response Times Chart
    const responseTimes = logs
        .filter(log => log.event === 'LLM_call_finish' && log.data?.duration)
        .map(log => ({
            timestamp: new Date(log.timestamp),
            duration: log.data.duration
        }));

    createOrUpdateChart('durationChart', {
        type: 'line',
        data: {
            labels: responseTimes.map(d => d.timestamp.toLocaleTimeString()),
            datasets: [{
                label: 'Response Time (s)',
                data: responseTimes.map(d => d.duration),
                borderColor: CHART_COLORS.green,
                fill: false
            }]
        }
    });

    // Token Usage Chart
    const tokenData = logs
        .filter(log => log.event === 'LLM_call_finish' && log.data?.tokens)
        .map(log => ({
            timestamp: new Date(log.timestamp),
            tokens: log.data.tokens
        }));
    
    createOrUpdateChart('tokenChart', {
        type: 'line',
        data: {
            labels: tokenData.map(d => d.timestamp.toLocaleTimeString()),
            datasets: [{
                label: 'Token Usage',
                data: tokenData.map(d => d.tokens),
                borderColor: CHART_COLORS.blue,
                fill: false
            }]
        }
    });

    // Common Words Chart
    const words = logs
        .filter(log => log.event === 'LLM_call_start' && log.data?.prompt)
        .flatMap(log => log.data.prompt.toLowerCase().match(/\b\w+\b/g) || [])
        .reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});

    const topWords = Object.entries(words)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    createOrUpdateChart('promptWordsChart', {
        type: 'bar',
        data: {
            labels: topWords.map(([word]) => word),
            datasets: [{
                label: 'Word Frequency',
                data: topWords.map(([,count]) => count),
                backgroundColor: CHART_COLORS.green
            }]
        }
    });

    // Security Risk Distribution
    const riskData = logs
        .filter(log => log.data?.alert)
        .reduce((acc, log) => {
            acc[log.data.alert] = (acc[log.data.alert] || 0) + 1;
            return acc;
        }, {});

    createOrUpdateChart('securityChart', {
        type: 'pie',
        data: {
            labels: Object.keys(riskData),
            datasets: [{
                data: Object.values(riskData),
                backgroundColor: Object.values(CHART_COLORS)
            }]
        }
    });

    // Tool Success Rate Chart
    const toolSuccessData = logs
        .filter(log => log.channel === 'MCP' && log.event === 'tool_call')
        .reduce((acc, log) => {
            const tool = log.data?.args?.match(/'([^']+)'/)?.[1] || 'unknown';
            if (!acc[tool]) acc[tool] = { success: 0, total: 0 };
            acc[tool].total++;
            if (!log.data?.error) acc[tool].success++;
            return acc;
        }, {});

    createOrUpdateChart('toolSuccessChart', {
        type: 'bar',
        data: {
            labels: Object.keys(toolSuccessData),
            datasets: [{
                label: 'Success Rate (%)',
                data: Object.values(toolSuccessData).map(d => (d.success / d.total * 100).toFixed(1)),
                backgroundColor: CHART_COLORS.green
            }]
        }
    });
}

function createOrUpdateChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (state.charts[canvasId]) {
        state.charts[canvasId].data = config.data;
        state.charts[canvasId].update();
    } else {
        state.charts[canvasId] = new Chart(canvas, config);
    }
} 