function chuaKyTuNguyHiem(str) {
    const format = /[<>'"`;\\]/;
    return format.test(str);
}

module.exports = {
    chuaKyTuNguyHiem
};