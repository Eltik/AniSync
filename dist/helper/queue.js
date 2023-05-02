"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@/src/helper/index");
class QueueExecutor {
    id;
    intervalId;
    intervalN;
    executorFunc;
    callbackFunc;
    errorFunc;
    runConditionFunc;
    queue = new Set();
    metaMap = new Map();
    paused = false;
    activeBySwitch = false;
    active = true;
    isExecuteAfterDone = false;
    running = false;
    isSelfRunning = false;
    constructor(id) {
        this.id = id;
    }
    selfRunning() {
        this.isSelfRunning = true;
        return this;
    }
    interval(n) {
        this.intervalN = n;
        return this;
    }
    executor(func) {
        this.executorFunc = func;
        return this;
    }
    callback(func) {
        this.callbackFunc = func;
        return this;
    }
    error(func) {
        this.errorFunc = func;
        return this;
    }
    add(arg, meta = undefined) {
        this.queue.add(arg);
        if (meta) {
            this.metaMap.set(arg, meta);
        }
    }
    executeAfterDone() {
        this.isExecuteAfterDone = true;
        return this;
    }
    runCondition(func) {
        this.runConditionFunc = func;
        return this;
    }
    deactivate() {
        this.active = false;
        return this;
    }
    activate() {
        this.active = true;
        return this;
    }
    activateBySwitch() {
        this.activeBySwitch = true;
        return this;
    }
    start() {
        if (!this.intervalN || !this.executorFunc)
            throw new Error("Both interval and executor function need to be supplied");
        this.intervalId = (0, index_1.setIntervalImmediately)(async () => {
            if (this.paused || (this.queue.size <= 0 && !this.activeBySwitch && !this.isSelfRunning))
                return;
            if (this.runConditionFunc && !this.runConditionFunc())
                return;
            if (this.isExecuteAfterDone && this.running)
                return;
            if (this.activeBySwitch) {
                if (this.active) {
                    this.running = true;
                    if (this.executorFunc)
                        this.executorFunc(true, undefined).then(_ => {
                            if (this.callbackFunc)
                                this.callbackFunc(true);
                            this.running = false;
                        }).catch(err => {
                            if (this.errorFunc)
                                this.errorFunc(err, true);
                            this.running = false;
                        });
                }
            }
            else {
                if (this.isSelfRunning) {
                    if (this.executorFunc)
                        this.executorFunc(undefined, undefined).then(_ => {
                            if (this.callbackFunc)
                                this.callbackFunc(undefined);
                            this.running = false;
                        }).catch(err => {
                            if (this.errorFunc)
                                this.errorFunc(err, undefined);
                            this.running = false;
                        });
                }
                else {
                    const value = this.queue.values().next().value;
                    if (value) {
                        const meta = this.metaMap.get(value);
                        this.queue.delete(value);
                        this.metaMap.delete(value);
                        this.running = true;
                        if (this.executorFunc)
                            this.executorFunc(value, meta).then(_ => {
                                if (this.callbackFunc)
                                    this.callbackFunc(value);
                                this.running = false;
                            }).catch(err => {
                                if (this.errorFunc)
                                    this.errorFunc(err, value);
                                this.running = false;
                            });
                    }
                }
            }
        }, this.intervalN);
        return this;
    }
    pause() {
        this.paused = true;
    }
    unpause() {
        this.paused = false;
    }
    destroy() {
        this.queue.clear();
        clearInterval(this.intervalId);
    }
}
exports.default = QueueExecutor;
