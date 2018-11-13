const env = (process.env.NODE_ENV !== 'production') ? require('dotenv').config().parsed : process.env;
const http = require('http');
const port = (process.env.PORT || 5000);
const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const bot = new Telegraf(env.token);
const moment = require('moment');
const fs = require("fs");
const comidasJson = fs.readFileSync("comidas.json");
const comidas = JSON.parse(comidasJson);
const tecladoStart = Markup.keyboard([
    ['☕ Desjejum', '🍳 Café da manhã'],
    ['🍽 Almoço', '🍉 Lanche da tarde'],
    ['💪 Pré treino', '🍛 Jantar']
]).resize().extra();

http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.write(JSON.stringify({name: 'HumanoLaranjaBot'}));
  res.end();
}).listen(port);

const getTitle = (id) => {
  let temp = comidas.filter((comida) => comida.id == id);
  return (temp.length > 0) ? temp[0].title : "";
}

const getItem = (id) => {
  let item = comidas.filter((comida) => comida.id == id);
  if(item.length > 0) {
    item = item[0];
  }
  else {
    return "Desculpe, esse item não existe";
  }
  let text = `*${item.title}*`;
  text += (item.description) ? ` - ${item.description}\n` : '\n';
  if(item.alternatives.length > 0) {
    text += `\nAlternativas:\n`;
    for (let i = 0; i < item.alternatives.length; i++) {
      let altname = getTitle(item.alternatives[i]);
      text += `/${item.alternatives[i]} - ${altname}\n`;
    }
  }
  return text;
}

bot.start(async (ctx) => {
  const from = ctx.update.message.from;
  if(from.id === 169949340) {
    await ctx.reply(`Seja bem vindo,  ${from.first_name} ${from.last_name}!`);
    await ctx.reply(`Qual refeição você gostaria de verificar?`, tecladoStart);
  }
  else {
    await ctx.reply(`Desculpe, mas eu fui feito apenas para o @HumanoLaranja`);
  }
});

//hears
bot.hears(/foco/i, (ctx) => ctx.reply('Você consegue! 💪'));

bot.hears('☕ Desjejum', (ctx) => {
  let desjejum = comidas.filter((comida) => (comida.when == ctx.match && comida.hide == 0));
    desjejum.forEach(async (item) => {
      await ctx.replyWithMarkdown(getItem(item.id));
    });
});

bot.hears('🍳 Café da manhã', (ctx) => {
});

bot.hears(/\/\d{3}/i, async ctx => {
  let id = ctx.match[0].substr(1);
  await ctx.replyWithMarkdown(getItem(id));
});


//commands
bot.command('about', async ctx => await ctx.reply('Criado por Humano Laranja - http://github.com/humanolaranja/'));

bot.startPolling();
