const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');
const JWT = require('jsonwebtoken')


app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

const requireToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization
        const user = await User.byToken(token)
        req.user = user
        next()
    } catch (ex) {
        next(ex)
    }
}

app.get('/api/users/:id/notes', requireToken, async(req, res, next)=> {
    try {
    const userWithNotes = await User.findOne({
        include: {model: Note},
        where: {id: req.user.id}
    })

    if(userWithNotes){
        const notes = userWithNotes.notes
        res.send(notes);
    } else {
        res.status(401)
    }
    
    }
    catch(ex){
      next(ex);
    }
  });

app.post('/api/auth', async(req, res, next)=> {
  try {
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next)=> {
  try {
    res.send(await User.byToken(req.headers.authorization));
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;