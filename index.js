const env = require('dotenv').config().parsed;
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

bot.start(async (ctx) => {
  const from = ctx.update.message.from;
  if(from.id === 169949340) {
    await ctx.reply(`Seja bem vindo,  ${from.first_name} ${from.last_name}!`);
    await ctx.reply(`Qual refeição você gostaria de verificar?`, tecladoStart);
    console.log(comidas);
  }
  else {
    await ctx.reply(`Desculpe, mas eu fui feito apenas para o @HumanoLaranja`);
  }
});

bot.hears(/foco/i, (ctx) => ctx.reply('Você consegue! 💪'));

bot.command('about', async ctx => await ctx.reply('Criado por Humano Laranja - http://github.com/humanolaranja/'));

// bot.hears(['Suco', 'Refrigerante'], (ctx) => ctx.reply(`Você respondeu: ${ctx.match}`))

bot.startPolling();
