const Outreach = require('../models/outreach-model');
const util = require('../utils');

function updateOutreachTeamname(oldteamName, newteamName) {
    Outreach.find({ teamName: oldteamName }).then((foundOutreach) => {
        if (foundOutreach && foundOutreach.length > 0) {
            foundOutreach.forEach(outreach => {
                if (outreach.teamName == oldteamName) {
                    outreach.teamName = newteamName;
                }
                foundOutreach.save().then((saved) => {
                    console.log('outreached saved');
                }, (err) => {
                    console.log('error saving outreach');
                })
            });
        }
    }, (err) => {
        console.log('error finding outreach')
    })
}

module.exports = {
    updateOutreachTeamname: updateOutreachTeamname
}