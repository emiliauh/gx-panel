module.exports = {
  apps: [{
    name: 'gx-portal',
    script: 'server.js',
    cwd: './.next/standalone',
    interpreter: 'bun',
    instances: 1,
    exec_mode: 'fork',
    
    // Environment configuration
    env: {
      NODE_ENV: 'production',
      PORT: 9205,
      HOSTNAME: '0.0.0.0',
    },
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto-restart configuration
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Resource limits
    max_memory_restart: '500M',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
  }]
}
