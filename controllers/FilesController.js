const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    if (type === 'folder') {
      const localPath = path.join(folderPath, uuidv4());
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      fileDocument.localPath = localPath;
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json(result.ops[0]);
    }
    const localPath = path.join(folderPath, uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
    fileDocument.localPath = localPath;
    const result = await dbClient.db.collection('files').insertOne(fileDocument);
    return res.status(201).json(result.ops[0]);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: user });
    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }
    await dbClient.db.collection('files').updateOne({ _id: ObjectId(req.params.id) }, { $set: { isPublic: true } });
    return res.status(200).json({ ...fileDocument });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: user });
    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }
    await dbClient.db.collection('files').updateOne({ _id: ObjectId(req.params.id) }, { $set: { isPublic: false } });
    return res.status(200).json({ ...fileDocument });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: user });
    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json({ ...fileDocument });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;
    const files = await dbClient.db.collection('files')
      .find({ parentId: req.params.parentId })
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray();
    return res.status(200).json(files);
  }
}
module.exports = FilesController;
