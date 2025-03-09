# Cylestio Dashboard

Local security monitoring and observability dashboard for AI agents, providing real-time monitoring of LLM (Large Language Model) interactions, tool usage, and system performance. Built with Python and modern web technologies.

## Features

- **Real-time Monitoring**: Live updates of system metrics and LLM interactions
- **Multiple Data Views**:
  - Overview Dashboard
  - LLM Metrics Analysis
  - Tool Usage Statistics
  - Error Analysis
  - Conversation Flow Tracking
  - Security Monitoring
- **Interactive Charts**: Visualize data with dynamic, responsive charts
- **Dark/Light Mode**: Support for both dark and light themes
- **Responsive Design**: Fully responsive layout that works on desktop and mobile devices
- **Security Features**: Monitor and configure security terms and alerts

## Contact

For any questions or support, please contact us at:
- Technical Support: max@cylestio.com
- Security Issues: security@cylestio.com

## Tech Stack

- Python 3.x (Backend Server)
- HTML5/CSS3
- JavaScript (ES6+)
- Chart.js (Data Visualization)
- DataTables (Table Management)
- Font Awesome (Icons)
- jQuery

## Installation

1. Clone the repository:
```bash
git clone https://github.com/cylestio/cylestio-dashboard.git
cd cylestio-dashboard
```

2. Install the required Python packages:
```bash
pip install -r requirements.txt
```

3. Start the server:
```bash
python3 server.py
```

4. Open your browser and navigate to:
```
http://localhost:5006
```

## Project Structure

```
cylestio-dashboard/
├── server.py              # Python HTTP server
├── index.html            # Main dashboard interface
├── dashboard.js          # Dashboard functionality
├── requirements.txt      # Python dependencies
├── monitoring_dashboard.json  # Sample data file
└── README.md            # Documentation
```

## Configuration

### Security Terms

You can configure alert and block terms through the Security Configuration section in the LLM Metrics tab. These settings are persisted in your browser's local storage.

### Data Refresh Rate

The dashboard automatically refreshes data every 5 seconds. You can modify this in `dashboard.js` by changing the `REFRESH_INTERVAL` constant.

## Features in Detail

### Overview Dashboard
- Total Logs Count
- LLM Calls Statistics
- Average Response Time
- Success Rate
- Event Distribution Charts
- Response Time Trends

### LLM Metrics
- MCP Performance Metrics
- Token Usage Analysis
- Security Incident Tracking
- Common Words Analysis

### Tool Usage
- Tool Performance Statistics
- Success Rate Analysis
- Usage Timeline
- Detailed Usage Logs

### Error Analysis
- Error Type Distribution
- Error Timeline
- Detailed Error Logs

### Conversation Flow
- User-Assistant Interaction Flow
- Intent Distribution
- Conversation Timeline

### Security Monitoring
- Alert Terms Configuration
- Block Terms Management
- Security Incident Tracking
- Risk Distribution Analysis

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Chart.js for data visualization
- DataTables for table management
- Font Awesome for icons
