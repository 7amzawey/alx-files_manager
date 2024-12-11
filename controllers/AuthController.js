/* eslint-disable no-unused-vars */
const crypto = require('crypto');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(request, response) {
    const authHeader = request.headers.authorization;
    /* if (!authHeader.startswith('Basic ')) {
            return
        } */

    const token = authHeader.split(' ')[1];

    const bufferObj = Buffer.from(token, 'base64');

    const decodedString = bufferObj.toString('utf8'); // bob@dylan.com:toto1234!

    const [email, password] = decodedString.split(':');

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const existingUser = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
    if (!existingUser) {
      response.status(401).json({ error: 'Unauthorized' });
    }
    /////
  }
  // getDisconnect
  // getme
}
module.exports = AuthController;
