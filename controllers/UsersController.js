const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Already exist' });

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

    const newUser = await dbClient.db.collection('users').findOne({ _id: result.insertedId });
    return res.status(201).json({ id: newUser._id, email: newUser.email });
  }

  static async getMe(request, response) {
    const xToken = request.headers['x-token'];
    if (!xToken) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userID = await redisClient.get(`auth_<${xToken}>}`);

    if (!userID) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userID) });
    if (user) {
      response.status(200).json({ id: user._id, email: user.email });
    } else {
      response.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = UsersController;
