!function (e, t) {t(e.CryptoJS) }(window, function (e) { var t, r, o, s, n, l, i; return r = (t = e).lib, o = r.WordArray, s = r.Hasher, n = t.algo, l = [], i = n.SHA1 = s.extend({ _doReset: function () { this._hash = new o.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]) }, _doProcessBlock: function (e, t) { for (var r = this._hash.words, o = r[0], s = r[1], n = r[2], i = r[3], a = r[4], h = 0; h < 80; h++) { if (h < 16) l[h] = 0 | e[t + h]; else { var c = l[h - 3] ^ l[h - 8] ^ l[h - 14] ^ l[h - 16]; l[h] = c << 1 | c >>> 31 } var f = (o << 5 | o >>> 27) + a + l[h]; f += h < 20 ? 1518500249 + (s & n | ~s & i) : h < 40 ? 1859775393 + (s ^ n ^ i) : h < 60 ? (s & n | s & i | n & i) - 1894007588 : (s ^ n ^ i) - 899497514, a = i, i = n, n = s << 30 | s >>> 2, s = o, o = f } r[0] = r[0] + o | 0, r[1] = r[1] + s | 0, r[2] = r[2] + n | 0, r[3] = r[3] + i | 0, r[4] = r[4] + a | 0 }, _doFinalize: function () { var e = this._data, t = e.words, r = 8 * this._nDataBytes, o = 8 * e.sigBytes; return t[o >>> 5] |= 128 << 24 - o % 32, t[14 + (64 + o >>> 9 << 4)] = Math.floor(r / 4294967296), t[15 + (64 + o >>> 9 << 4)] = r, e.sigBytes = 4 * t.length, this._process(), this._hash }, clone: function () { var e = s.clone.call(this); return e._hash = this._hash.clone(), e } }), t.SHA1 = s._createHelper(i), t.HmacSHA1 = s._createHmacHelper(i), e.SHA1 });