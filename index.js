const fs = require('fs');
const { Composer, Markup, Extra } = require('micro-bot');
const app = new Composer();


startNewGame = (ctx) => {
  if (currentGame.active) {
    ctx.reply('Игра уже идет.');
    return mainMenu(ctx);
  }
  currentGame.active = true;
  currentGame.playersCount = ctx.match[1];
  currentGame.spyNum = Math.floor(Math.random() * currentGame.playersCount) + 1;
  const randomLocationNum = Math.floor(Math.random() * currentGame.locations.length);
  currentGame.location = currentGame.locations[randomLocationNum];
  
  console.log(currentGame.location);
  joinGame(ctx);
};

joinGame = (ctx) => {
  if (!currentGame.playersCount) {
    ctx.reply('Нет активной игры, начните новую!');
    return mainMenu(ctx);
  }
  let message = ctx.update.message || ctx.update.callback_query.message;
  console.log(message);
  let alreadyIn = currentGame.players.find((user) => user.id === message.from.id);
  if (alreadyIn) {
    return ctx.reply('Вы уже в игре');
  }
  currentGame.players.push({
    id: message.from.id,
    username: message.from.username
  });
  if (currentGame.players.length === currentGame.spyNum) {
    return ctx.reply('Поздравляю, вы - шпион, удачи.').catch(err => console.log(err));
  }
  if (currentGame.players.length == currentGame.playersCount) {
    finishGame();
  }
  return ctx.reply(currentGame.location).catch(err => console.log(err));
};

getLocationList = () => {
  return JSON.parse(fs.readFileSync('locations.json', 'utf8'));
};

mainMenu = (ctx) => {
  ctx.reply('Чего желаете?', Markup
    .inlineKeyboard([
      Markup.callbackButton('New game', 'new_game'),
      Markup.callbackButton('Join', 'join_game'),
      Markup.callbackButton('Finish current', 'finish_game')
    ]).extra()
  )
};

finishGame = () => {
  currentGame = {
    active: false,
    playersCount: 0,
    players: [],
    spyNum: 0,
    spyPlayer: 0,
    locations: getLocationList(),
    location: ''
  };
};

const locationCount = 5;

let currentGame = {
  active: false,
  playersCount: 0,
  players: [],
  spyNum: 0,
  spyPlayer: 0,
  locations: getLocationList(),
  location: ''
};

app.command('start', (ctx) => {
  mainMenu(ctx);
});

app.command('finish_game', (ctx) => {
  finishGame();
});

app.action('new_game', (ctx, next) => {
  return ctx.reply('How many players?', Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      m.callbackButton('3', 'create_game 3'),
      m.callbackButton('4', 'create_game 4'),
      m.callbackButton('5', 'create_game 5'),
      m.callbackButton('6', 'create_game 6'),
      m.callbackButton('7', 'create_game 7'),
      m.callbackButton('8', 'create_game 8'),
      m.callbackButton('9', 'create_game 9')
    ]))).then(next)
});

app.action(/create_game (.+)/, (ctx) => {
  ctx.answerCallbackQuery('Go!');
  startNewGame(ctx);
});

app.command('join_game', (ctx) => {
  joinGame(ctx);
});

app.command('/locations', (ctx) => {
  const locs = getLocationList();
  console.log(locs);
  ctx.reply(locs.join(', '));
});

app.on('sticker', ({ reply }) => reply('👍'));


module.exports = app;
