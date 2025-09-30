#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorizeLevel(level) {
  switch (level) {
    case 'error': return colors.red + level + colors.reset;
    case 'warn': return colors.yellow + level + colors.reset;
    case 'info': return colors.green + level + colors.reset;
    case 'debug': return colors.cyan + level + colors.reset;
    default: return level;
  }
}

function formatLogEntry(entry) {
  try {
    const log = JSON.parse(entry);
    const timestamp = new Date(log.timestamp).toLocaleString();
    const level = colorizeLevel(log.level);
    const message = log.message;
    const context = log.context ? ` [${log.context}]` : '';
    
    let output = `${colors.bright}${timestamp}${colors.reset} ${level}${context}: ${message}`;
    
    if (log.error) {
      output += `\n  ${colors.red}Error: ${log.error}${colors.reset}`;
    }
    
    if (log.guestId) {
      output += `\n  ${colors.blue}Guest ID: ${log.guestId}${colors.reset}`;
    }
    
    if (log.guestName) {
      output += `\n  ${colors.blue}Guest: ${log.guestName}${colors.reset}`;
    }
    
    if (log.ip) {
      output += `\n  ${colors.cyan}IP: ${log.ip}${colors.reset}`;
    }
    
    return output;
  } catch (e) {
    return entry; // Return as-is if not JSON
  }
}

function tailLog(filename, lines = 50) {
  const filepath = path.join(logsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`${colors.red}Log file not found: ${filepath}${colors.reset}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const logLines = content.trim().split('\n').slice(-lines);
    
    console.log(`${colors.bright}=== Last ${lines} lines of ${filename} ===${colors.reset}\n`);
    
    logLines.forEach(line => {
      if (line.trim()) {
        console.log(formatLogEntry(line));
      }
    });
  } catch (error) {
    console.error(`${colors.red}Error reading log file:${colors.reset}`, error.message);
  }
}

function watchLog(filename) {
  const filepath = path.join(logsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`${colors.red}Log file not found: ${filepath}${colors.reset}`);
    return;
  }
  
  console.log(`${colors.bright}=== Watching ${filename} (Press Ctrl+C to stop) ===${colors.reset}\n`);
  
  // Show last 10 lines first
  tailLog(filename, 10);
  console.log(`\n${colors.bright}--- Live updates ---${colors.reset}`);
  
  fs.watchFile(filepath, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      const content = fs.readFileSync(filepath, 'utf8');
      const lines = content.trim().split('\n');
      const newLines = lines.slice(-1); // Get last line only
      
      newLines.forEach(line => {
        if (line.trim()) {
          console.log(formatLogEntry(line));
        }
      });
    }
  });
}

function listLogs() {
  if (!fs.existsSync(logsDir)) {
    console.log(`${colors.red}Logs directory not found: ${logsDir}${colors.reset}`);
    return;
  }
  
  const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
  
  console.log(`${colors.bright}Available log files:${colors.reset}`);
  files.forEach((file, index) => {
    const filepath = path.join(logsDir, file);
    const stats = fs.statSync(filepath);
    const size = (stats.size / 1024).toFixed(1) + ' KB';
    const modified = stats.mtime.toLocaleString();
    
    console.log(`  ${index + 1}. ${colors.cyan}${file}${colors.reset} (${size}, modified: ${modified})`);
  });
}

// Main CLI logic
const command = process.argv[2];
const filename = process.argv[3];
const lines = parseInt(process.argv[4]) || 50;

switch (command) {
  case 'tail':
    if (!filename) {
      console.log('Usage: node log-viewer.js tail <filename> [lines]');
      listLogs();
      break;
    }
    tailLog(filename, lines);
    break;
    
  case 'watch':
    if (!filename) {
      console.log('Usage: node log-viewer.js watch <filename>');
      listLogs();
      break;
    }
    watchLog(filename);
    break;
    
  case 'list':
    listLogs();
    break;
    
  default:
    console.log(`${colors.bright}Guest Check-in System Log Viewer${colors.reset}\n`);
    console.log('Usage:');
    console.log('  node log-viewer.js list                    - List all log files');
    console.log('  node log-viewer.js tail <file> [lines]    - Show last N lines (default: 50)');
    console.log('  node log-viewer.js watch <file>           - Watch file for new entries');
    console.log('\nExamples:');
    console.log('  node log-viewer.js tail combined.log 100');
    console.log('  node log-viewer.js watch webhooks.log');
    console.log('  node log-viewer.js tail error.log');
    listLogs();
}