const { card } = require("blizzard.js/dist/resources/hs");
var unirest = require("unirest");
const dataurl = "https://api.hearthstonejson.com/v1/latest/zhTW/cards.json";
let cardDB = [];
const mercdataurl = "https://api.hearthstonejson.com/v1/latest/zhTW/mercenaries.json";
let mercDB = [];
async function getdata() {
let req = unirest("GET", dataurl);
await req.then(function (res) {
    cardDB = res.body;
    console.log("cardDB");  

});
req = unirest("GET", mercdataurl);
await req.then(function (res) {
        mercDB = res.body;
        console.log("mercDB");  

    });
    console.log("return");  
return true;
}

function getcard(dbf_id) {

    let data = cardDB.find(card => card.dbfId == dbf_id);
    return data;
}


async function test() {

    await getdata();
    hero = mercDB.find(card => card.shortName == "賈拉克瑟斯");
    hero.specializations[0].abilities.forEach(abillity => {
        console.log(abillity.name);  
        dbdId=abillity.tiers[abillity.tiers.length-1].dbf_id;
        data = getcard(dbdId);
        console.log(data);  

    });  
    hero.equipment.forEach(equip => {
        console.log();  
        data = getcard(equip.tiers[equip.tiers.length-1].dbf_id);
        console.log(data); 
        }
    );
    
}

test();