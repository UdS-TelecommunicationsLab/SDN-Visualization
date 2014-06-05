"use strict";

describe("objectDiff", function() {
    it("should consider newly created models as equal", function() {
        var d = new Date();
        var model1 = new ofviz.OFVM(d);
        var model2 = new ofviz.OFVM(d);
        var res = objectDiff.diff(model1, model2);
        expect(res[objectDiff.token.changed]).toBe(objectDiff.token.equal);
    });

    it("should detect date changes", function() {
        var model1 = new ofviz.OFVM();
        var model2 = new ofviz.OFVM();
        model2.latestUpdate = new Date((new Date()).getTime() + 1000);
        var res = objectDiff.diff(model1, model2);
        expect(res[objectDiff.token.value].latestUpdate[objectDiff.token.changed]).toBe(objectDiff.token.primitive);
    });

    it("should detect link array element changes", function() {
        var deviceA = new ofviz.Device(1, "A");
        var deviceB = new ofviz.Device(2, "B");

        var model1 = new ofviz.OFVM();
        var link1 = new ofviz.Link(deviceA, 1, deviceB, 2, "Ethernet");
        model1.links.push(link1);
        var model2 = new ofviz.OFVM();
        var link2 = new ofviz.Link(deviceA, 1, deviceB, 2, "Ethernet");
        link2.drTx = 1.0;
        model2.links.push(link2);

        var res = objectDiff.diff(model1, model2);
        expect(res[objectDiff.token.value].links[objectDiff.token.value][0][objectDiff.token.value].drTx[objectDiff.token.added]).toBe(1);
    });

    it("should apply changes correctly", function() {
        var deviceA = new ofviz.Device(1, "A");
        var deviceB = new ofviz.Device(2, "B");

        var date = new Date();
        var model1 = new ofviz.OFVM(date);
        var model2 = new ofviz.OFVM(date);
        var link1 = new ofviz.Link(deviceA, 1, deviceB, 2, "Ethernet");
        model2.links.push(link1);

        var diff = objectDiff.diff(model1, model2);

        objectDiff.applyChanges(model1, diff);

        var rest = objectDiff.diff(model1, model2);
        expect(rest[objectDiff.token.changed]).toBe(objectDiff.token.equal);
    });

    it("should detect array reordering", function() {
        var targetRate = 5;

        var deviceA = new ofviz.Device(1, "A");
        var deviceB = new ofviz.Device(2, "B");
        var deviceC = new ofviz.Device(3, "C");

        var date = new Date();

        var model1 = new ofviz.OFVM(date);
        var link1 = new ofviz.Link(deviceA, 1, deviceB, 2, "Ethernet");
        model1.links.push(link1);
        var model2 = new ofviz.OFVM(date);
        var link21 = new ofviz.Link(deviceA, 1, deviceC, 2, "Ethernet");
        var link22 = new ofviz.Link(deviceA, 1, deviceB, 2, "Ethernet");
        link22.drTx = targetRate;
        model2.links.push(link21);
        model2.links.push(link22);

        var res = objectDiff.diff(model1, model2)[objectDiff.token.value].links[objectDiff.token.value];
        expect(res[0][objectDiff.token.value].drTx[objectDiff.token.added]).toBe(targetRate);
        expect(res[1][objectDiff.token.changed]).toBe(objectDiff.token.added);
    });
});