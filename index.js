const env = (process.env.NODE_ENV !== 'production') ? require('dotenv').config().parsed : process.env;
const http = require('http');
const port = (process.env.PORT || 5000);
const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const bot = new Telegraf(env.token);
const moment = require('moment');
const fs = require("fs");
const comidasJson = fs.readFileSync("comidas.json");
const substituicoesJson = fs.readFileSync("substituicoes.json");
const [comidas, substituicoes] = [JSON.parse(comidasJson), JSON.parse(substituicoesJson)];
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
  let text = '\n_Alternativas:_\n';
  alternatives.forEach((alternative) => {
    text += `/${alternative} - ${getTitle(alternative)}\n`;
  });
  return text;
}

const getReplacement = (replacements) => {
  let text = `\n*${replacements.title}*\n`;
  replacements.options.forEach((replacement) => {
    text += `  - ${replacement}\n`;
  });
  return text;
}

const getItemText = (id) => {
  let [item,text] = [comidas.filter((comida) => comida.id == id), "Desculpe, esse item não existe"];
  if(!item.length) return text;
  text  = `*${item[0].title}*`;
  text += (item[0].description) ? ` - ${item[0].description}\n` : '\n';
  if(item[0].alternatives.length > 0)
    text += getAlternatives(item[0].alternatives);
  return text;
}

const getItem = (id) => {
  let [item,text] = [comidas.filter((comida) => comida.id == id), "Desculpe, esse item não existe"];
  if(!item.length) return text;
  return item;
}

const botoesOpcoes = (item) => {
  return (item[0].opcao) ? Extra.markup(Markup.inlineKeyboard([Markup.callbackButton(item[0].opcao, item[0].opcao)], { columns: 1 })) : null;
}

bot.start(async (ctx) => {
  const from = ctx.update.message.from;
  if(from.id == env.UserId) {
    await ctx.reply(`Seja bem vindo,  ${from.first_name} ${from.last_name}!`);
    await ctx.reply(`Qual refeição você gostaria de verificar?`, tecladoStart);
  }
  else {
    await ctx.reply(`Desculpe, mas eu fui feito apenas para o @${from.username}`);
  }
});

bot.hears(['☕ Desjejum', '🍳 Café da manhã', '🍽 Almoço', '🍉 Lanche da tarde', '💪 Pré treino', '🍛 Jantar'], async (ctx) => {
  let selected = comidas.filter((comida) => (comida.when == ctx.match && comida.hide == 0));
  for (let i = 0; i < selected.length; i++) {
    await ctx.replyWithMarkdown(getItemText(selected[i].id), botoesOpcoes(getItem(selected[i].id)));
  }
});

bot.action(['Vegetais A', 'Vegetais B', 'Carnes'], async (ctx) => {
  let selected = substituicoes.filter((replacement) => (replacement.type == ctx.match));
  for (let i = 0; i < selected.length; i++) {
    await ctx.replyWithMarkdown(getReplacement(selected[i]));
  }
});

bot.hears(/\/\d{3}/i, async ctx => {
  let id = ctx.match[0].substr(1);
  await ctx.replyWithMarkdown(getItemText(id));
});

bot.command('about', async ctx => await ctx.reply('Criado por Humano Laranja - http://github.com/humanolaranja/'));

bot.startPolling();
