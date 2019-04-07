const env           = (process.env.NODE_ENV !== 'production') ? require('dotenv').config().parsed : process.env;
const port          = (process.env.PORT || 5000);
const Telegraf      = require('telegraf');
const Telegram      = require('telegraf/telegram');
const Markup        = require('telegraf/markup');
const Extra         = require('telegraf/extra');
const http          = require('http');
const fs            = require('fs');
const schedule      = require('node-schedule');
const moment        = require('moment');
const bot           = new Telegraf(env.token);
const telegram      = new Telegram(env.token);
const axios         = require('axios')
const cardapioJson  = fs.readFileSync("cardapio.json");
const cardapio      = JSON.parse(cardapioJson);
const tecladoStart  = Markup.keyboard([
  ['☕ Desjejum', '🍳 Café da manhã'],
  ['🍽 Almoço', '🍉 Lanche da tarde'],
  ['💪 Pré treino', '🍛 Jantar']
]).resize().extra();
const triggers = {
  desjejum: { hour: "07", minute: "10" },
  cafe:     { hour: "08", minute: "00" },
  almoco:   { hour: "12", minute: "30" },
  lanche:   { hour: "16", minute: "00" },
  treino:   { hour: "17", minute: "00" },
  janta:    { hour: "20", minute: "50" },
}

http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.write(JSON.stringify({name: 'HumanoLaranjaBot'}));
  res.end();
}).listen(port);

setInterval(() => {
  http.get(env.herokuUrl);
}, 300000);

var notify = true;

const getTitle = (id) => {
  let temp = cardapio.comidas.filter((comida) => comida.id == id);
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
  let [item,text] = [cardapio.comidas.filter((comida) => comida.id == id), "Desculpe, esse item não existe"];
  if(!item.length) return text;
  text  = `*${item[0].title}*`;
  text += (item[0].description) ? ` - ${item[0].description}\n` : '\n';
  if(item[0].alternatives.length > 0) text += getAlternatives(item[0].alternatives);
  return text;
}

const getItem = (id) => {
  let [item,text] = [cardapio.comidas.filter((comida) => comida.id == id), "Desculpe, esse item não existe"];
  if(!item.length) return text;
  return item;
}

const botoesOpcoes = (item) => {
  return (item[0].opcao) ? Extra.markup(Markup.inlineKeyboard([Markup.callbackButton(item[0].opcao, item[0].opcao)], { columns: 1 })) : null;
}

const notificar = async (when) => {
  let selected = cardapio.comidas.filter((comida) => (comida.when == when && comida.hide == 0));
  if(selected.length > 0) await telegram.sendMessage(env.userId, `É hora desta refeição: ${selected[0].when}`);
  for (let i = 0; i < selected.length; i++) {
    await axios.get(`${env.apiUrl}/sendMessage?chat_id=${env.userId}&text=${encodeURI(getItemText(selected[i].id))}&parse_mode=Markdown&reply_markup=`);
    if(botoesOpcoes(getItem(selected[i].id)) != null) await telegram.sendMessage(env.userId, 'Clique abaixo para ver as opções ⬇', botoesOpcoes(getItem(selected[i].id)));
  }
}

const verificarUsuario = (ctx, next) => {
  const mesmoIDMsg = ctx.update.message && ctx.update.message.from.id == env.userId;
  const mesmoIDCallback = ctx.update.callback_query && ctx.update.callback_query.from.id == env.userId;
  if (mesmoIDMsg || mesmoIDCallback) next();
  else ctx.reply(`Desculpe, mas eu fui feito apenas para o @HumanoLaranja`);
}

var desjejum;
var cafe;
var almoco;
var lanche;
var treino;
var janta;

if(notify) {
  desjejum = new schedule.scheduleJob(triggers.desjejum, () => { notificar('☕ Desjejum') });
  cafe = new schedule.scheduleJob(triggers.cafe, () => { notificar('🍳 Café da manhã') });
  almoco = new schedule.scheduleJob(triggers.almoco, () => { notificar('🍽 Almoço') });
  lanche = new schedule.scheduleJob(triggers.lanche, () => { notificar('🍉 Lanche da tarde') });
  treino = new schedule.scheduleJob(triggers.treino, () => { notificar('💪 Pré treino') });
  janta = new schedule.scheduleJob(triggers.janta, () => { notificar('🍛 Jantar') });
}

bot.start(verificarUsuario, async (ctx) => {
  await ctx.reply(`Seja bem vindo,  Humano Laranja! `);
  await ctx.reply(`O serviço de notificações foi ativado, caso queira, também é possível fazer uma consulta agora mesmo =D`, tecladoStart);
  notify = true;
  desjejum.nextInvocation(); cafe.nextInvocation(); almoco.nextInvocation(); lanche.nextInvocation(); treino.nextInvocation(); janta.nextInvocation();
});

bot.hears(['☕ Desjejum', '🍳 Café da manhã', '🍽 Almoço', '🍉 Lanche da tarde', '💪 Pré treino', '🍛 Jantar'], verificarUsuario, async (ctx) => {
  let selected = cardapio.comidas.filter((comida) => (comida.when == ctx.match && comida.hide == 0));
  for (let i = 0; i < selected.length; i++) {
    await ctx.replyWithMarkdown(getItemText(selected[i].id));
    if(botoesOpcoes(getItem(selected[i].id)) != null) await telegram.sendMessage(env.userId, 'Clique abaixo para ver as opções ⬇', botoesOpcoes(getItem(selected[i].id)));
  }
});

bot.action(['Vegetais A', 'Vegetais B', 'Carnes'], verificarUsuario, async (ctx) => {
  let selected = cardapio.substituicoes.filter((replacement) => (replacement.type == ctx.match));
  for (let i = 0; i < selected.length; i++) {
    await ctx.replyWithMarkdown(getReplacement(selected[i]));
  }
});

bot.hears(/\/\d{3}/i, verificarUsuario, async ctx => {
  let id = ctx.match[0].substr(1);
  await ctx.replyWithMarkdown(getItemText(id));
});

bot.command('about', async (ctx) => await ctx.reply('Criado por Humano Laranja - http://github.com/humanolaranja/'));

bot.command('stop', verificarUsuario, async (ctx) => {
  notify = false;
  await ctx.reply('As notificações foram paradas, digite /start para iniciar novamente o serviço');
  desjejum.cancel(); cafe.cancel(); almoco.cancel(); lanche.cancel(); treino.cancel(); janta.cancel();
});

bot.on('message', async ctx => {
  await ctx.reply('Oi, eu sou o bot do @HumanoLaranja =D');
});

bot.startPolling();
