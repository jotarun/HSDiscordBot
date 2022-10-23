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
const typeIDs= new Map();
const spellIDs = new Map();
const rarityIDs = new Map();
const classEmoji = [];
let hsClient;

async function  test()
{

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
    
    
    console.log("start!");
    
    let meta = await hsClient.metadata({
        origin: 'tw',
        locale: 'zh_TW'
    });

    meta.data.classes.forEach(setdata => {
        classIDs.set(setdata.id, setdata.name);
    });

    meta.data.minionTypes.forEach(setdata => {
        typeIDs.set(setdata.id, setdata.name);
    });
    meta.data.spellSchools.forEach(setdata => {
        spellIDs.set(setdata.id, setdata.name);
    });
    meta.data.rarities.forEach(setdata => {
        rarityIDs.set(setdata.id, setdata.name);
    });

    meta.data.classes.forEach(async setdata => {


    // cardnames.forEach(async cardname =>{
    let result = await hsClient.cardSearch({
    origin: 'tw',
    locale: 'zh_TW',
    collectible: 1,
    set: 'murder-at-castle-nathria',
    class:setdata.slug,
    sort:'dateadded:desc'
    });
    cards = result.data.cards;

    console.log ('\n=============');

    console.log (setdata.name);

    console.log ('=============\n');

    cards.forEach(async card => {
        let state='';
        let type='';
        let rarity = rarityIDs.get(card.rarityId);

        if (card.cardTypeId=='5')
        {
            state = `${card.manaCost} 費 ${rarity} 法術`
            if ("spellSchoolId" in card)
            type =  spellIDs.get(card.spellSchoolId)

        }
        else if (card.cardTypeId=='3')
        {
            state = `${card.manaCost} 費 ${rarity} 英雄`

        }
        else if (card.cardTypeId=='4')
        {
            state = `${card.manaCost}/${card.attack}/${card.health} ${rarity} 手下`
            if ("minionTypeId" in card)
                type =  typeIDs.get(card.minionTypeId)

        }
        else if (card.cardTypeId=='7')
        {
            state = `${card.manaCost}/${card.attack}/${card.durability} ${rarity} 武器`
        }
        else {
            state = `${card.manaCost}/${card.health} ${rarity} 地點`
        }
        let cardclass = classIDs.get(card.classId);
        // console.log (`${cardclass} [${card.name}]`);
        console.log (`${state} ${type} [${card.name}]`);
        // console.log (`${state} ${type}`);
        // console.log (card.text.replace(/<[^>]+>/g, ''));
        console.log (card.flavorText.replace(/<[^>]+>/g, ''));
        console.log ('');

    });
    
    });
  
}

test();