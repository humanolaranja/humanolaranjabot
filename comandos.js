const env = require('./.env');
const Telegraf = require('telegraf');
const bot = new Telegraf(env.token);

bot.start(async (ctx) => {
  const from = ctx.update.message.from;
  if(from.id === 169949340) {
    await ctx.reply(`Seja bem vindo,  ${from.first_name} ${from.last_name}!`);
  }
  else {
    await ctx.reply(`Desculpe, mas eu fui feito apenas para o @HumanoLaranja`);
  }
});
