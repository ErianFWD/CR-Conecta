require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('node:util');
Object.assign(global, { TextEncoder, TextDecoder });
if (typeof HTMLDialogElement !== 'undefined') HTMLDialogElement.prototype.showModal = function () { this.open = true; };
if (typeof HTMLDialogElement !== 'undefined') HTMLDialogElement.prototype.close = function () { this.open = false; };
if (typeof HTMLElement !== 'undefined') HTMLElement.prototype.scrollIntoView = function () {};
