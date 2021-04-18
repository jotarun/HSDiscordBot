const Discord = require('discord.js');
const parser = require("discord-command-parser");
var unirest = require("unirest");
const { encode, decode, FormatType } = require('deckstrings');
const dataurl = "https://api.hearthstonejson.com/v1/77662/zhTW/cards.collectible.json";

let cardDB = [];
const prefix = "!";
const modeNames = new Map([
    [FormatType.FT_WILD, '開放'],
    [FormatType.FT_STANDARD, '標準'],
    [FormatType.FT_CLASSIC, '經典']
]);

const classNames = new Map([
    ['MAGE', '法師'],
    ['DRUID','德魯伊'],
    ['PALADIN','聖騎士'],
    ['ROGUE','盜賊'],
    ['WARLOCK','術士'],
    ['PRIEST','牧師'],
    ['DEMONHUNTER','惡魔獵人'],
    ['WARRIOR','戰士'],
    ['SHAMAN','薩滿'],
    ['HUNTER','獵人']
]);

const client = new Discord.Client();


client.on('ready', async () => {
    var req = unirest("GET", dataurl);

    await req.end(function (res) {
        cardDB = res.body;
    });
    console.log("start!");


});


async function searchcard(cardname, message) {

    var req = unirest("GET", "https://omgvamp-hearthstone-v1.p.rapidapi.com/cards/search/" + encodeURIComponent(cardname));

    req.query({
        "collectible": "1",
        "locale": "zhTW"
    });

    req.headers({
        "x-rapidapi-key": process.env.HSAPI_KEY,
        "x-rapidapi-host": "omgvamp-hearthstone-v1.p.rapidapi.com",
        "useQueryString": true
    });


    req.end(function (res) {
        if (res.error || res.body.length == 0) {
            return message.reply("找不到這張卡片");
        }
        else {
            outputcards(res.body, message);
        }
    });


}

function outputcards(cards, message) {
    cards = cards.filter(card=> card.cardSet!="Hero Skins");
    if (cards.length > 60) {
        return message.reply(`符合的卡片過多(${cards.length}張)`);
    }

    else if (cards.length > 5) {
        let cols = Math.ceil(cards.length / 5);
        let resultstring = Array(cols).fill('');
        cards.forEach(function (card, i) {
            resultstring[Math.floor(i / 5)] += (`[${card.name}](${card.img})\n`);
        });
        const cardEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle("搜尋結果")
            .setDescription(`共有${cards.length}張:`)
        try {
            resultstring.forEach(substring => {
                if (substring != "")
                    cardEmbed.addField('\u200b', substring, true);
            });
            message.channel.send(cardEmbed);
        }
        catch (e) {
            console.log(e);
        }

    }
    else {
        cards.forEach(card => {
            try {
                flavor = ""
                if (card.flavor) {
                    flavor = card.flavor.replace(/<i>/g, "*").replace(/<\/i>/g, "*").replace(/(<([^>]+)>)/gi, "").replace(/\\n/gi, "\n");
                }
                const cardEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(card.name)
                    .setDescription(flavor)
                    .setImage(card.img);
                message.channel.send(cardEmbed);
            }
            catch (e) {
                console.log(e);
            }
        });
    }

}



client.on('message', message => {
    const parsed = parser.parse(message, prefix);
    if (!parsed.success) return;

    if (parsed.command === "card") {
        searchcard(parsed.arguments[0], message)

    }
    else if (parsed.command === "help") {
        const cardEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('機器人指令一覽 ')
            .addField('!card 關鍵字 可只輸入部分名稱', '例如: !card 油切');

        message.channel.send(cardEmbed);

    }
    else if (parsed.command === "deck") {
        try {
            let decoded = decode(parsed.arguments[0]);
            hero = cardDB.find(card =>card.dbfId == decoded.heroes[0]);
            const cardEmbed = new Discord.MessageEmbed()
            .setTitle(modeNames.get(decoded.format)+ " " +classNames.get(hero.cardClass) + " 牌組")
            .setColor('#0099ff')
            .setDescription("[在官網檢視牌組](https://playhearthstone.com/zh-tw/deckbuilder?deckcode="+encodeURIComponent(parsed.arguments[0])+")");
            let deck = [];
            decoded.cards.forEach(carddbf => {
             card = cardDB.find(card => card.dbfId == carddbf[0]);
             card.count = carddbf[1];
             deck.push(card);
            });
       
            deck.sort((a,b)=>a.cost-b.cost);
            
            let neutrals = deck.filter(card=> (card.cardClass=="NEUTRAL" && card.hasOwnProperty('multiClassGroup')== false) );
            let neutralsouput ="";
            neutrals.forEach(card=>{
             neutralsouput += card.count + ' × ('+ card.cost+')**' +card.name + "**\n";
            });
       
            let classes = deck.filter( card=> ( neutrals.indexOf( card ) < 0) );
               
            let classesouput ="";
            classes.forEach(card=>{
             classesouput += card.count + ' × ('+ card.cost+')**' +card.name + "**\n";
            });
            if (neutralsouput.length>0)
            cardEmbed.addField("中立", neutralsouput, true);
            if (classesouput.length>0)
            cardEmbed.addField("職業", classesouput, true);
           
            message.channel.send(cardEmbed);

        }
        catch (e) {
            console.log(e);
            return message.reply(`牌組代碼有誤！`);
        }

    }

});



// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);