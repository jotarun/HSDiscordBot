var unirest = require("unirest");
const blizzard = require('blizzard.js')

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
const typeIDs = new Map();
const spellIDs = new Map();
const rarityIDs = new Map();
const classEmoji = [];
let hsClient;


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
    }

}

async function test() {

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
    


    let result = await hsClient.cardSearch({
        origin: 'tw',
        locale: 'zh_TW',
        tier: 'hero',
        gameMode: 'battlegrounds',
        page: 2

    });
    cards = result.data.cards;



    cards.forEach(async card => {

        let buddy = await getbgcard(card.battlegrounds.companionId);
        let goldenbuddy = await getbgcard(buddy.battlegrounds.upgradeId);
        console.log(card.name);
        console.log('-----');
        if (buddy) {
            console.log(buddy.name);
            console.log(buddy.text.replace(/<b>/g, "**").replace(/<\/b>/g, "**").replace(/<i>/g, "*").replace(/<\/i>/g, "*").replace(/(<([^>]+)>)/gi, "").replace(/\\n/gi, "\n"));
        }
        if (goldenbuddy) {
            console.log('金卡');
            console.log(goldenbuddy.text.replace(/<b>/g, "**").replace(/<\/b>/g, "**").replace(/<i>/g, "*").replace(/<\/i>/g, "*").replace(/(<([^>]+)>)/gi, "").replace(/\\n/gi, "\n"));
        }


        // console.log(goldenbuddy.text);
        // console.log(buddy.battlegrounds.image);
        // console.log(goldenbuddy.battlegrounds.imageGold);

        console.log('');

    });


}

test();