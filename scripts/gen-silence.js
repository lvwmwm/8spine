#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "silence.wav");

const sampleRate = 8000;
const seconds = 1;
const numSamples = sampleRate * seconds;
const dataSize = numSamples * 2;

const buf = Buffer.alloc(44 + dataSize);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(sampleRate, 24);
buf.writeUInt32LE(sampleRate * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(dataSize, 40);
fs.writeFileSync(out, buf);
console.log("silence.wav gerado:", out, buf.length, "bytes");