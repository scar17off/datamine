const mineflayer = require("mineflayer");
const sleep = ms => new Promise(r => setTimeout(r, ms));

const networkName = "dexland";
const serverModes = ["Фортнокс", "Эфириум", "Кэнди", "Панкейк", "Зефир", "Эмеральд", "Баблгам", "Снежок"];

async function createBot(i) {
    return new Promise(async (resolve) => {
        const bot = mineflayer.createBot({
            host: "mc.dexland.org",
            port: "25565",
            username: `${config.username}_${i}`,
            version: "1.20"
        });

        bot.on("login", async () => {
            bot.chat("/register " + config.password + " " + config.password);
            bot.chat("/login " + config.password + " " + config.password);
            await sleep(2000);
            bot.chat("/servers");
            await sleep(2000);
            bot.chat("/spawn");
            resolve(bot);

            bot.on("playerJoined", player => {
                server.emit("join", {
                    server: {
                        name: networkName
                    },
                    username: player.username
                });
            });
            bot.on("playerLeft", player => {
                server.emit("left", {
                    server: {
                        name: networkName
                    },
                    username: player.username
                });
            });

            setInterval(async () => {
                bot.setControlState("jump", true);
                await sleep(1000);
                bot.setControlState("jump", false);
            }, 60000);
        });

        let chatType = ["ɢ", "ʟ"];

        bot.on("messagestr", (msg) => {
            if(msg.startsWith("АнтиЧит ▸ Игрок")) {

                const regex = /Игрок\s+(\S+)\s+кикнут/;

                const match = msg.match(regex);

                if(match && match[1])
                    server.emit("kick", {
                        server: {
                            name: networkName
                        },
                        username: match[1],
                        kicked_by: "АнтиЧит",
                        reason: "Подозрение в использовании читов"
                    });
            }
            else if(msg.startsWith(" » ")) {
                const regex = /» (\w+) (был забанен|был замучен|был кикнут) (донатером|модератором) (\w+)/;
                const match = msg.match(regex);
                if (!match) return;

                var action;
                switch (match[2]) {
                    case 'был забанен':
                        action = 'ban';
                        break;
                    case 'был замучен':
                        action = 'mute';
                        break;
                    case 'был кикнут':
                        action = 'kick';
                    default:
                        return;
                };

                if(action == "ban")
                    server.emit("ban", {
                        server: {
                            name: networkName
                        },
                        banned_by: match[4],
                        username: match[1]
                    });
                else if(action == "mute")
                    server.emit("mute", {
                        server: {
                            name: networkName
                        },
                        muted_by: match[4],
                        username: match[1]
                    });
                else if(action == "kick")
                    server.emit("kick", {
                        server: {
                            name: networkName
                        },
                        username: match[1],
                        kicked_by: match[4]
                    });
            }
            else if(chatType.indexOf(msg[1]) !== -1) {
                let splitted = msg.split("→");
                let text = splitted[1].trim();
                let player = splitted[0].split(" ");
                player.shift(); // убрать [g]
                player.pop(), player.pop(); // убрать пустые

                let nick = player[player.length - 1]; // последнее
                let donate = player[0];
                let clan = null;

                if(nick.includes("~")) {
                    nick = nick.replace('~', '');
                };

                if(nick.includes("←")) return;

                if(player.length === 3) { // есть клан
                    donate = player[1];
                    clan = player[0];
                };

                let data = {
                    server: {
                        name: networkName
                    },
                    message: new Message(donate, clan, nick, text)
                };

                server.emit("message", data);
            } else {
                // console.log("\n\n\"" + msg + "\"\n\n");
            };
        });

        bot.on("windowOpen", (window) => {
            if (window.title.includes("режим")) {
                const itemSlotInWindow = window.slots.findIndex(item => item && item.nbt.value.display.value.Name.value.includes(serverModes[i]));

                if (itemSlotInWindow !== -1) {
                    bot.clickWindow(itemSlotInWindow, 0, 0);
                };
            };
        });
    });
};

(async() => {
    for(let i in serverModes) {
        await createBot(i);
    };
})();

module.exports = serverModes.length;