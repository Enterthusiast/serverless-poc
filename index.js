// index.js

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');

const USERS_TABLE = process.env.USERS_TABLE;

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:4300'
  })
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
};

app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

// Create User endpoint
app.post('/users', function (req, res) {
  const { userId, name } = req.body;
  if (typeof userId !== 'string') {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create user' });
    }
    res.json({ userId, name });
  });
})

// Read List User endpoint
app.get('/users', function (req, res) {
  const params = {
    TableName: USERS_TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get user list' });
    }
    if (result.Items) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "User list not found" });
    }
  });
})

// Read User endpoint
app.get('/users/:userId', function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get user' });
    }
    if (result.Item) {
      const {userId, name} = result.Item;
      res.json({ userId, name });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
})

// Update User endpoint
app.put('/users/:userId', function (req, res) {
  const { userId } = req.params;
  const { name } = req.body;
  if (typeof userId !== 'string') {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId,
    },
    ProjectionExpression: '#n',
    ExpressionAttributeNames: {
      "#n": "name",
    },
    UpdateExpression: 'set #n= :n',
    ExpressionAttributeValues: {
        ":n": name,
    },
    ReturnValues:"UPDATED_NEW"
  };

  dynamoDb.update(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not update user' });
    }
    res.json({ userId, name });
  });
})

// Delete User endpoint
app.delete('/users/:userId', function (req, res) {
  const { userId } = req.params;
  if (typeof userId !== 'string') {
    res.status(400).json({ error: '"userId" must be a string' });
  }

  console.log(userId);

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId,
    },
  }

  dynamoDb.delete(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not delete user' });
    }
    res.json({ userId });
  });
})

module.exports.handler = serverless(app);