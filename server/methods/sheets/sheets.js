const {
    google
} = require('googleapis');
const Match = require('../../models/match-model');
const logger = require('../../subroutines/sys-logging-subs');

// mongoose.connect(process.env.mongoURI, () => {
//     console.log('connected to mongodb');
// });


//const client = new google.auth.JWT(process.env.client_email, null, String(process.env.sheets_private_key), ['https://www.googleapis.com/auth/spreadsheets']);
function readInVods() {

    const privKey = process.env.sheets_private_key.replace(/\\n/g, '\n');

    const client = new google.auth.JWT(
        process.env.client_email, null, privKey, ['https://www.googleapis.com/auth/spreadsheets']
    );

    client.authorize((err, tokens) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('connected..');
            gsRun(client);
        }
    });

}



async function gsRun(client) {

    let returnStatus = true;

    let updateRequired = false;

    const gsapi = google.sheets({ version: 'v4', auth: client });

    const opts = {
        spreadsheetId: '1-dNFe8cJ7yZlb5aCDqKuKNlDNMll72RL3t_7rivVgk4',
        range: 'Form Responses 1!A2:Z100000'
    };

    let returned = await gsapi.spreadsheets.values.get(opts);

    let returnedData = returned.data.values;
    let x = 0;
    let newDataArray = returnedData.map((r) => {

        let obj = {
            timestamp: r[0],
            caster: r[1],
            additionalCasters: r[2],
            matchId: r[3],
            division: r[4],
            liveReplay: r[5],
            youtubeURL: r[6],
            vod1: r[7],
            vod2: r[8],
            issues: r[9],
            sysRead: r[10]
        }
        return obj;
    });

    // console.log('newDataArray ', newDataArray);

    for (var i = 0; i < newDataArray.length; i++) {
        let obj = newDataArray[i];

        // console.log('sysread ', obj.sysRead, ' readInRow ', readInRow(obj.sysRead));
        if (obj.matchId && (obj.youtubeURL || obj.vod1 || obj.vod2) && readInRow(obj.sysRead)) {
            updateRequired = true;
            x += 1;
            // console.log('I can work with this Caster: ', obj.caster, x);
            let match = await Match.findOne({
                matchId: obj.matchId
            }).then(res => {
                return res;
            }, err => {
                return null;
            });
            // console.log(match);
            if (match) {

                match.vodLinks = [];

                if (obj.youtubeURL) {
                    match.vodLinks.push(obj.youtubeURL);
                }
                if (obj.vod1) {
                    match.vodLinks.push(obj.vod1);
                }
                if (obj.vod2) {
                    match.vodLinks.push(obj.vod2);
                }

                let saveResult = await match.save().then(
                    saved => {
                        return saved;

                    },
                    err => {
                        return null;
                    }
                );

                if (saveResult) {
                    obj.sysRead = 'read';
                    let logObj = {};
                    logObj.actor = 'match-VOD-injestor';
                    logObj.action = 'update vod links';
                    logObj.target = saveResult.matchId;
                    logObj.logLevel = 'STD';
                    logObj.timeStamp = Date.now();
                    logger(logObj);
                }

            } else {
                //wrong match id
            }

            //update only if we read a row
            let objKeys = Object.keys(obj);

            objKeys.forEach((ele, ind) => {
                if (obj[ele]) {
                    returnedData[i][ind] = obj[ele];
                } else {
                    returnedData[i][ind] = '';
                }


            });

        } else {
            //nothing import was received here, move along
        }

    }

    //send a write to the sheet ONLY if we made read rows
    if (updateRequired) {
        // console.log('read some rows ... updating')
        const updateOpts = {
            spreadsheetId: '1-dNFe8cJ7yZlb5aCDqKuKNlDNMll72RL3t_7rivVgk4',
            range: 'Form Responses 1!A2:Z100000',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: returnedData
            }
        };

        let update = await gsapi.spreadsheets.values.update(updateOpts);
    }

    return returnStatus;
    // console.log(update);

}

function readInRow(val) {
    // console.log(' sysRead val ', val);
    if (val == undefined || val == null) {
        return true;
    } else {
        return !(val == 'read');
    }
}

module.exports = {
    readInVods: readInVods
};