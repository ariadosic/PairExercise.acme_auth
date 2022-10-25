const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const JWT = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const Note = conn.define('note', {
    text: STRING
})

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.hasMany(Note)
Note.belongsTo(User)

User.byToken = async(token)=> {
  try {
    const payload = JWT.verify(token, process.env.JWT)
    const user = await User.findByPk(payload.userId);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username
    }
  });

  const token = JWT.sign({userId: user.id}, process.env.JWT)
  if(user && await bcrypt.compare(password, user.password)){
    return token
  }

  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate(async(user) => {
    user.password = await bcrypt.hash(user.password, 10)
})

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );

const notes = []
for(let i = 0; i < 100; i++){
    notes.push({text: "asdlfjals;dfnams,.anf;ascjivanermk;qnhf'ipzjfdopdaomgl;hapid'japerjrvaekni" })
}

await Promise.all(notes.map( note => Note.create(note)));

const allNotes = await Note.findAll();

await Promise.all (allNotes.map((note) => {
    const id = Math.floor(Math.random() * (3 - 1 + 1) + 1)
    note.setUser(id)
}))

  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};