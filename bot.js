const { Client, Intents } = require('discord.js');
const parser = require("discord-command-parser");
var unirest = require("unirest");
const blizzard = require('blizzard.js')
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const { encode, decode, FormatType } = require('deckstrings');
const { metadata } = require('blizzard.js/dist/resources/hs');
const dataurl = "https://api.hearthstonejson.com/v1/latest/zhTW/cards.collectible.json";

let cardDB = [];
const prefix = "!";
const modeNames = new Map([
    [FormatType.FT_WILD, '開放'],
    [FormatType.FT_STANDARD, '標準'],
    [FormatType.FT_CLASSIC, '經典']
]);

const classNames = new Map([
    ['MAGE', '法師'],
    ['DRUID', '德魯伊'],
    ['PALADIN', '聖騎士'],
    ['ROGUE', '盜賊'],
    ['WARLOCK', '術士'],
    ['PRIEST', '牧師'],
    ['DEMONHUNTER', '惡魔獵人'],
    ['WARRIOR', '戰士'],
    ['SHAMAN', '薩滿'],
    ['HUNTER', '獵人']
]);

const shortcuts = {
    '德': 'druid',
    '德魯伊': 'druid',

    '戰': 'warrior',
    '戰士': 'warrior',

    '術': 'warlock',
    '術士': 'warlock',

    '牧': 'priest',
    '牧師': 'priest',

    '賊': 'rogue',
    '盜賊': 'rogue',

    '薩': 'shaman',
    '薩滿': 'shaman',

    'DH': 'demonhunter',
    'dh': 'demonhunter',
    '惡魔獵人': 'demonhunter',

    '聖': 'paladin',
    '聖騎士': 'paladin',

    '法': 'mage',
    '法師': 'mage',

    '獵人': 'hunter',
    '獵': 'hunter',

    '中立': 'neutral',
    '無': 'neutral',
    '中': 'neutral'

}
const classIDs = new Map();
const setIDs = new Map();

const classEmoji = [];
let hsClient;

client.on('ready', async () => {
    var req = unirest("GET", dataurl);

    await req.end(function (res) {
        cardDB = res.body;
    });

    try {
        hsClient = await blizzard.hs.createInstance({
            key: process.env.BLIZZARD_CLIENT_ID,
            secret: process.env.BLIZZARD_CLIENT_SECRET
        });
    } catch (error) { console.log(error); }
    const resp = await hsClient.metadata({
        origin: 'tw',
        locale: 'zh_TW'
    });
    resp.data.classes.forEach(classdata => {
        classIDs.set(classdata.id, classdata.name);
        classEmoji[classdata.id] = client.emojis.cache.find(emoji => emoji.name === classdata.slug);
    });

    resp.data.sets.forEach(setdata => {
        setIDs.set(setdata.id, setdata.name);
        if (setdata.aliasSetIds) {
            setdata.aliasSetIds.forEach(id => {
                setIDs.set(id, setdata.name);
            });

        }
    });

    console.log("start!");


});


async function getcard(id) {
    let resp = await hsClient.card({
        id: id,
        origin: 'tw',
        locale: 'zh_TW'
    });
    return resp.data;
}

async function getbgcard(id) {
    try {

        let resp = await hsClient.card({
            id: id,
            origin: 'tw',
            locale: 'zh_TW',
            gameMode: 'battlegrounds'
        });
        return resp.data;
    }
    catch (e) {
        console.log(e);
        return null;
    }

}

async function outputcard(card, message, mode = 0) {
    try {
        flavor = ""

        const cardEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(card.name)
            .setURL(`https://playhearthstone.com/zh-tw/cards/${card.slug}`);

        if (card.flavorText) {
            flavor = card.flavorText.replace(/<i>/g, "*").replace(/<\/i>/g, "*").replace(/(<([^>]+)>)/gi, "").replace(/\\n/gi, "\n");
            cardEmbed.setDescription(flavor);
        }
        //bg card
        if (mode == 1) {
            cardEmbed.setImage(card.battlegrounds.image);
            cardEmbed.setURL(`https://playhearthstone.com/zh-tw/battlegrounds/${card.slug}`);
            if (card.battlegrounds.hero) {
                let heropower = await getbgcard(card.childIds[0]);

                let heropowertext = heropower.text.replace(/<b>/g, "**").replace(/<\/b>/g, "**").replace(/<i>/g, "*").replace(/<\/i>/g, "*").replace(/(<([^>]+)>)/gi, "").replace(/\\n/gi, "\n");
                cardEmbed.setDescription(heropowertext);
                cardEmbed.setThumbnail(heropower.image);
            }
            else {
                let goldcard = await getbgcard(card.battlegrounds.upgradeId);
                if (goldcard) cardEmbed.setThumbnail(goldcard.battlegrounds.imageGold);
            }
        }
        else if (mode == 2) {
            cardEmbed.setURL(`https://playhearthstone.com/zh-tw/mercenaries/${card.slug}`);
            cardEmbed.setImage(card.image);
            setName = setIDs.get(card.cardSetId);
        }
        else {
            cardEmbed.setImage(card.image);
            setName = setIDs.get(card.cardSetId);
            if (typeof setName !== 'undefined' && setName !== null) {
                // do stuff
                cardEmbed.setFooter(setIDs.get(card.cardSetId));
            }
        }
        await message.channel.send({ embeds: [cardEmbed] });
    }
    catch (e) {
        console.log(e);
    }
}

function cardstoembedd(cards, totalcards) {

    const cardEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle("搜尋結果")
        .setDescription(`共有${totalcards}張:`);
    let cols = Math.ceil(cards.length / 5);
    let resultstring = Array(cols).fill('');
    cards.forEach(function (card, i) {
        if (card.multiClassIds.length > 0) {
            resultstring[Math.floor(i / 5)] += (`[${classEmoji[card.multiClassIds[0]]}${classEmoji[card.multiClassIds[1]]}${card.name}](https://playhearthstone.com/zh-tw/cards/${card.slug})\n`);

        }
        else {
            resultstring[Math.floor(i / 5)] += (`[${classEmoji[card.classId]}${card.name}](https://playhearthstone.com/zh-tw/cards/${card.slug})\n`);

        }
    });
    resultstring.forEach(substring => {
        if (substring != "")
            cardEmbed.addField('\u200b', substring, true);
    });
    return cardEmbed;
}

async function outputcards(cards, message) {


    await message.channel.send({ embeds: [cardstoembedd(cards, cards.length)] });


}

async function card_to_message(cards, message, mode = 0) {
    if (cards.length === 0) {
        return message.reply("找不到這張卡片");
    }
    if (cards.length > 60) {
        return message.reply(`符合的卡片過多(${cards.length}張)`);
    }

    else if (cards.length > 3) {

        await message.channel.send({ embeds: [cardstoembedd(cards, cards.length)] });
    }
    else {
        cards.forEach(async card => {
            outputcard(card, message, mode);
        });
    }

}


client.on('messageCreate', async message => {
    const parsed = parser.parse(message, prefix);
    if (!parsed.success) return;

    if (parsed.command === "hshelp") {
        const cardEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('機器人指令一覽 ')
            .addField('`!card 關鍵字` ->查構築模式卡片 可只輸入部分名稱', '例如: !card 油切\n 標準模式: !card 油切 s \n 經典模式: !card 炸雞 c')
            .addField('`!bgcard 關鍵字` ->查英雄戰場卡片 可只輸入部分名稱', '例如: !bgcard 米歐')
            .addField('`!duelcard 關鍵字` ->查決鬥擂台卡片 可只輸入部分名稱', '例如: !duelcard 錢幣')
            .addField('`!minion 消耗/攻擊力/生命 職業` ->查手下', '例如: !minion 5/1/1 DH')
            .addField('`!weapon 消耗/攻擊力/耐久 職業` ->查武器', '例如: !weapon 3/3/2 戰')
            .addField('`!deck 牌組代碼`', '例如: !deck AAAA');

        await message.channel.send({ embeds: [cardEmbed] });

    }
    else if (parsed.command === "updatedb") {

        var req = unirest("GET", dataurl);

        await req.end(function (res) {
            cardDB = res.body;
        });
        await message.channel.send('hearthstonjson db updated');
    }
    else if (parsed.command === "minion") {
        let filter = {
            origin: 'tw',
            locale: 'zh_TW',
            collectible: 1,
            set: 'wild',
            type: 'minion'
        };
        let states = parsed.arguments[0].split('/');
        let classinput = '';

        if (states.length === 3) {
            filter['health'] = states[2];
            filter['manaCost'] = states[0];
            filter['attack'] = states[1];
            if (parsed.arguments[1]) {
                classinput = parsed.arguments[1];
                if (shortcuts.hasOwnProperty(classinput)) {
                    classinput = shortcuts[classinput];
                }
                filter['class'] = classinput;
            }
            let resp = await hsClient.cardSearch(filter);
            cards = resp.data.cards;

            if (resp.data.pageCount > 1) {
                await message.channel.send('結果過多 請告訴我你要找的職業(戰/賊/牧/術/賊/薩/獵/DH/無):');
                const collected = await message.channel.awaitMessages(m => m.author.id == message.author.id, { max: 1, time: 30000, errors: ['time'] })
                    .catch(collected => {
                        message.channel.send('時間內無回應 請重新搜尋');
                    });
                classinput = collected.first().content;
                if (shortcuts.hasOwnProperty(classinput)) {
                    classinput = shortcuts[classinput];
                }
                filter['class'] = classinput;

                resp = await hsClient.cardSearch(filter);
                cards = resp.data.cards;
            }
            cards = cards.filter(card =>
                card.health == states[2] &&
                card.manaCost == states[0] &&
                card.attack == states[1]

            );

            card_to_message(cards, message);
        }


    }

    else if (parsed.command === "weapon") {


        let states = parsed.arguments[0].split('/');
        let classinput = '';
        if (parsed.arguments[1]) {
            classinput = parsed.arguments[1];

            if (shortcuts.hasOwnProperty(classinput)) {
                classinput = shortcuts[classinput];
            }
        }
        if (states.length === 3) {
            let resp = await hsClient.cardSearch({
                origin: 'tw',
                locale: 'zh_TW',
                collectible: 1,
                set: 'wild',
                manaCost: states[0],
                attack: states[1],
                type: 'weapon',
                class: classinput
            });
            cards = resp.data.cards;
            cards = cards.filter(card => card.durability == states[2]);

            card_to_message(cards, message);
        }
    }

    else if (parsed.command === "spell") {
        let states = parsed.arguments[0];

        if (!states) return;
        if (parseInt(states)>9) 
        {
            return message.reply(`沒有符合的卡片！`);
        }
        let filter = {
            origin: 'tw',
            locale: 'zh_TW',
            collectible: 1,
            set: 'wild',
            manaCost: states[0],
            type: 'spell',
            page: 1
        };

        let resp = await hsClient.cardSearch(filter);
        pages = [];
        cards = resp.data.cards;
        let cardEmbed = cardstoembedd(cards, resp.data.cardCount);


        if (resp.data.pageCount > 1) {

            let options = [];
            for (let p = 1; p <= resp.data.pageCount; p++) {
                options.push(
                    {
                        label: '第' + p + '頁',
                        value: '' + p,
                    });
            }

            const menu = new MessageSelectMenu()
                .setCustomId('SELECT_MENU')
                .setPlaceholder('第' + resp.data.page +'頁')
                .addOptions(options);

            const row = new MessageActionRow().addComponents(menu);
            cardEmbed.setDescription(`第1/${resp.data.pageCount}頁 共有${resp.data.cardCount}張:`);
            const msg = await message.channel.send({ components: [row], embeds: [cardEmbed] });
            

            const collector = message.channel.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 60000 });

            collector.on("collect", async (i) => {
                await i.deferUpdate();
                filter.page = i.values[0];
                resp = await hsClient.cardSearch(filter);
                cards = resp.data.cards;
                cardEmbed = cardstoembedd(cards, resp.data.cardCount);
                cardEmbed.setDescription(`第${resp.data.page}/${resp.data.pageCount}頁 共有${resp.data.cardCount}張:`);
                await i.editReply({embeds:[cardEmbed], components: [row]});
                collector.resetTimer();
            });
            collector.on('end', async () =>{
                await msg.edit({embeds:[cardEmbed], components: []});

            })
        }
        else {

            await message.channel.send({ embeds: [cardstoembedd(cards, resp.data.cardCount)] });

        }

    }
    else if (parsed.command === "card") {
        let text = parsed.arguments[0];
        let set = 'wild';
        if (parsed.arguments[1]) {
            if (parsed.arguments[1] === 'c') set = 'classic-cards';
            else if (parsed.arguments[1] === 's') set = 'standard';
        }
        let resp = await hsClient.cardSearch({
            textFilter: text,
            origin: 'tw',
            locale: 'zh_TW',
            collectible: 1,
            set: set

        });
        cards = resp.data.cards;
        cards = cards.filter(card => card.name.includes(text));

        card_to_message(cards, message);
    }

    else if (parsed.command === "token") {
        let text = parsed.arguments[0];
        let set = 'wild';
        if (parsed.arguments[1]) {
            if (parsed.arguments[1] === 'c') set = 'classic-cards';
            else if (parsed.arguments[1] === 's') set = 'standard';
        }
        let resp = await hsClient.cardSearch({
            textFilter: text,
            origin: 'tw',
            locale: 'zh_TW',
            collectible: 0,
            set: set

        });
        cards = resp.data.cards;
        cards = cards.filter(card => card.name.includes(text));

        card_to_message(cards, message);
    }

    else if (parsed.command === "bgcard") {
        let text = parsed.arguments[0];

        let resp = await hsClient.cardSearch({
            gameMode: 'battlegrounds',
            textFilter: text,
            origin: 'tw',
            locale: 'zh_TW'
        });
        cards = resp.data.cards;
        cards = cards.filter(card => card.name.includes(text));
        card_to_message(cards, message, 1);

    }

    else if (parsed.command === "mcard") {
        let text = parsed.arguments[0];

        let resp = await hsClient.cardSearch({
            gameMode: 'mercenaries',
            textFilter: text,
            origin: 'tw',
            locale: 'zh_TW'
        });
        cards = resp.data.cards;
        cards = cards.filter(card => card.name.includes(text));
        card_to_message(cards, message, 2);
        // console.log(cards);
    }

    else if (parsed.command === "duelcard") {
        let text = parsed.arguments[0];

        let resp = await hsClient.cardSearch({
            gameMode: 'duels',
            textFilter: text,
            origin: 'tw',
            locale: 'zh_TW'
        });
        cards = resp.data.cards;
        cards = cards.filter(card => card.name.includes(text));
        card_to_message(cards, message);

    }
    else if (parsed.command === "deck") {
        try {
            let decoded = decode(parsed.arguments[0]);
            hero = cardDB.find(card => card.dbfId == decoded.heroes[0]);
            const cardEmbed = new MessageEmbed()
                .setTitle(modeNames.get(decoded.format) + " " + classNames.get(hero.cardClass) + " 牌組")
                .setColor('#0099ff')
                .setDescription("[在官網檢視牌組](https://playhearthstone.com/zh-tw/deckbuilder?deckcode=" + encodeURIComponent(parsed.arguments[0]) + ")");
            let deck = [];
            decoded.cards.forEach(carddbf => {
                card = cardDB.find(card => card.dbfId == carddbf[0]);
                card.count = carddbf[1];
                deck.push(card);
            });

            deck.sort((a, b) => a.cost - b.cost);

            let neutrals = deck.filter(card => (card.cardClass == "NEUTRAL" && card.hasOwnProperty('multiClassGroup') == false));
            let neutralsouput = "";
            neutrals.forEach(card => {
                console.log(card);
                neutralsouput += card.count + ' × (' + card.cost + ')**' + card.name + "**\n";
            });

            let classes = deck.filter(card => (neutrals.indexOf(card) < 0));

            let classesouput = "";
            classes.forEach(card => {
                classesouput += card.count + ' × (' + card.cost + ')**' + card.name + "**\n";
            });
            if (neutralsouput.length > 0)
                cardEmbed.addField("中立", neutralsouput, true);
            if (classesouput.length > 0)
                cardEmbed.addField("職業", classesouput, true);

            await message.channel.send({ embeds: [cardEmbed] });

        }
        catch (e) {
            console.log(e);
            return message.reply(`牌組代碼有誤！`);
        }

    }

});




// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);