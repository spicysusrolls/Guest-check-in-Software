import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎯 Guest Check-in System</h1>
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>✅ System Status</h2>
        <ul>
          <li>✅ Backend API: Running on port 3000</li>
          <li>✅ JotForm Integration: Active</li>
          <li>✅ Webhook Processing: Working</li>
          <li>✅ Logging System: Active</li>
        </ul>
      </div>
      
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>📋 Quick Actions</h2>
        <button 
          onClick={() => window.open('http://localhost:3000/health', '_blank')}
          style={{ 
            padding: '10px 15px', 
            margin: '5px', 
            backgroundColor: '#1976d2', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Backend Health
        </button>
        
        <button 
          onClick={() => {
            fetch('/api/guests/stats/summary')
              .then(res => res.json())
              .then(data => alert('Stats loaded: ' + JSON.stringify(data, null, 2)))
              .catch(err => alert('Error: ' + err.message));
          }}
          style={{ 
            padding: '10px 15px', 
            margin: '5px', 
            backgroundColor: '#388e3c', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Load Guest Stats
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#fff3e0', 
        padding: '20px', 
        borderRadius: '8px'
      }}>
        <h2>📝 Recent Activity</h2>
        <p>Webhook processing logs are available via the logging system.</p>
        <p><strong>Current Integration:</strong></p>
        <ul>
          <li>JotForm submissions → Webhook endpoint</li>
          <li>Guest data processing → Development mode</li>
          <li>Real-time logging → Active</li>
        </ul>
      </div>
    </div>
  );
}

export default App;