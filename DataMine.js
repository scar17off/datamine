class Message {
    constructor(donate, clan, nick, text) {
        this.text = text;
        this.author = { donate, clan, nick };
        this.creationDate = new Date();
        this.creationTime = Date.now();
        let displayTime = this.creationDate.toLocaleTimeString();
        let displayDate = this.creationDate.toISOString().slice(0, 10);
        this.creationDateString = `[${displayDate}] [${displayTime}]`;
    }
};

module.exports = Message;