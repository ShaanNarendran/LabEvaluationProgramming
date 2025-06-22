// server/util/logAction.js
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'activity.log');

/**
 * Logs an action performed by a user.
 * @param {object} logData - An object containing log details.
 * @param {string} logData.user_id - The user's ID.
 * @param {string} logData.action - The action being performed.
 * @param {string} logData.details - A detailed message.
 * @param {string} [logData.ip] - The user's IP address.
 * @param {string} [logData.system_id] - The user's system identifier.
 */
function logAction(logData) {
  const timestamp = new Date().toISOString();
  
  // Destructure with default values
  const { 
    user_id = 'anonymous', 
    action = 'unknown', 
    details = '', 
    ip = '', 
    system_id = '' 
  } = logData;

  const logMessage = `[${timestamp}] user: ${user_id}, action: ${action}, details: "${details}"${ip ? `, ip: ${ip}` : ''}${system_id ? `, system: "${system_id}"` : ''}`;

  // Log to console
  console.log(logMessage);

  // Optional: Log to file
  // fs.appendFileSync(logFile, logMessage + '\n');
}

module.exports = logAction;