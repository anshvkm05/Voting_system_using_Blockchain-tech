// Chart management module
class ChartManager {
    constructor() {
        this.votingChart = null;
        this.regionalChart = null;
        this.timelineChart = null;
    }

    initializeCharts() {
        // Initialize empty charts
        this.updateVotingChart();
        this.updateAnalytics();
    }

    updateVotingChart() {
        const ctx = document.getElementById('votingChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.votingChart && typeof this.votingChart.destroy === 'function') {
            this.votingChart.destroy();
        }
        
        this.votingChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: window.app.parties.map(p => p.name),
                datasets: [{
                    data: window.app.parties.map(p => p.votes || 0),
                    backgroundColor: [
                        '#667eea',
                        '#48bb78',
                        '#ed8936',
                        '#9f7aea',
                        '#38b2ac'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Vote Distribution'
                    },
                    legend: {
                        display: window.app.parties.some(p => p.votes > 0)
                    }
                }
            }
        });
    }

    updateAnalytics() {
        // Regional Chart (mock data)
        const regionalCtx = document.getElementById('regionalChart').getContext('2d');
        if (this.regionalChart && typeof this.regionalChart.destroy === 'function') {
            this.regionalChart.destroy();
        }
        
        this.regionalChart = new Chart(regionalCtx, {
            type: 'bar',
            data: {
                labels: ['North', 'South', 'East', 'West', 'Central'],
                datasets: [{
                    label: 'Votes',
                    data: [45, 38, 52, 41, 33],
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Timeline Chart (mock data)
        const timelineCtx = document.getElementById('timelineChart').getContext('2d');
        if (this.timelineChart && typeof this.timelineChart.destroy === 'function') {
            this.timelineChart.destroy();
        }
        
        this.timelineChart = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: ['9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
                datasets: [{
                    label: 'Votes Cast',
                    data: [12, 25, 38, 45, 52],
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}