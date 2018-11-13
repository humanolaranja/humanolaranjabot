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

const getAlternatives = (alternatives) => {
  let text = `\nAlternativas:\n`;
  for (let i = 0; i < alternatives.length; i++) {
    let altname = getTitle(alternatives[i]);
    text += `/${alternatives[i]} - ${altname}\n`;
  }
  return text;
}

const getItem = (id) => {
  let [item,text] = [comidas.filter((comida) => comida.id == id), "Desculpe, esse item não existe"];
  if(!item.length) return text; //verifica se o item existe
  text  = `*${item[0].title}*`;
  text += (item[0].description) ? ` - ${item[0].description}\n` : '\n';
  if(item[0].alternatives.length > 0)
    text += getAlternatives(item[0].alternatives);
  // if(item[0].opcoes.length > 0)
    // text += 'teste';
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

bot.hears(['☕ Desjejum', '🍳 Café da manhã', '🍽 Almoço', '🍉 Lanche da tarde', '💪 Pré treino', '🍛 Jantar'], (ctx) => {
  let selected = comidas.filter((comida) => (comida.when == ctx.match && comida.hide == 0));
    selected.forEach(async (item) => {
      await ctx.replyWithMarkdown(getItem(item.id));
    });
});

bot.hears(/\/\d{3}/i, async ctx => {
  let id = ctx.match[0].substr(1);
  await ctx.replyWithMarkdown(getItem(id));
});

//commands
bot.command('about', async ctx => await ctx.reply('Criado por Humano Laranja - http://github.com/humanolaranja/'));

bot.startPolling();
