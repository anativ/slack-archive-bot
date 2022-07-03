const fs = require('fs');
const { WebClient } = require('@slack/web-api');
const moment = require('moment');
// Read a token from the environment variables
const token = fs.readFileSync('.token').toString().trim();

// Initialize
const web = new WebClient(token);

const BOT_ID = "U03KUJHQ5GV";

async function joinAll() {
    do {
        let convs = await web.conversations.list({limit: 1000,
                                                cursor: convs?.response_metadata?.next_cursor,
                                                exclude_archived: true});
        for (let conv of convs.channels) {
            if (conv.is_private) {
                continue;
            }
            let res = await web.conversations.join({channel: conv.id});
        }
    } while (convs.response_metadata.next_cursor);
    console.log("done");
}

async function archiveAll(days=180) {
    console.log("starting archive all channels that are older than " + days + " days");
    let convs = null;
    try{
    do {
        convs = await web.conversations.list({limit: 1000,
                                                cursor: convs?.response_metadata?.next_cursor,
                                                exclude_archived: true});
        for (let conv of convs.channels) {
            if (conv.is_private) {
                continue;
            }
            let history = await web.conversations.history({channel: conv.id,include_num_members: true, limit: 2});
            let index = 0;
            if (history.messages[0].user == BOT_ID) {
                index = 1;
            }
            let ts = history.messages[index].ts;
            const d = moment(ts*1000).add(days,'days')
            if (d < moment()) {
                await web.conversations.archive({channel: conv.id});
                console.log("archived: ", `#${conv.name}`, moment(ts*1000).startOf('day').fromNow(), conv.id);
            } else {
                // console.log("skipped: ", conv.name);
            }
        }
    } while (convs.response_metadata.next_cursor);
    console.log("done");
    } catch (err) {
        console.error(err);
    }
}


if (process.argv[2] == "join") {
    joinAll();
}
else if (process.argv[2] == "archive") {
    archiveAll();
}
else {
    console.log("usage: node index.js join|archive");
}