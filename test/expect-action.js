
function ExpectAction() {
    this.reset();
}

ExpectAction.prototype.do = function (action) {
    this.actualEvents.push(action);
}

ExpectAction.prototype.count = function () {
    this.count++;
}

ExpectAction.prototype.expect = function (events) {
    this.expectEvents = events;
}

ExpectAction.prototype.reset = function () {
    var t = this;
    t.expectEvents = [];
    t.actualEvents = [];
    t.count = 0;
}

ExpectAction.prototype.check = function () {
    expect(this.actualEvents).to.eql(this.expectEvents);
}

export default ExpectAction;