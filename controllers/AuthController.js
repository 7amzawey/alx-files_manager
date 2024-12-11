/* eslint-disable no-unused-vars */
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(request, response) {
    const authHeader = request.headers.authorization;
    /* if (!authHeader.startswith('Basic ')) {
            return
        } */

    const AuthToken = authHeader.split(' ')[1];

    const bufferObj = Buffer.from(AuthToken, 'base64');

    const decodedString = bufferObj.toString('utf8'); // bob@dylan.com:toto1234!

    const [email, password] = decodedString.split(':');

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const existingUser = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
    if (!existingUser) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const token = uuidv4();
    const key = `auth_<${token}>}`;
    redisClient.set(key, existingUser._id.toString(), 86400);
    response.status(200).json({ token });
  }

  static async getDisconnect(request, response) {
    const xToken = request.headers['x-token'];
    const user = await redisClient.get(`auth_<${xToken}>}`);

    if (!user) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await redisClient.del(`auth_<${xToken}>}`);
    response.status(204).send();
  }
}
module.exports = AuthController;
