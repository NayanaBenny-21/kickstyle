const { options } = require("../app");

module.exports = {
    increment : (a, b = 1) => a + b,
    decrement : (a, b = 1) => a - b,
    ifEquals : (a, b, options) => (a === b? options.fn(this) : options.inverse(this)),
    gt : (a, b) => a > b,
    lt : (a, b) => a < b,
    eq: (a, b) => a === b,
    range : (start, end) =>{
        let arr = [];
        for(let i = start ;i <= end; i++) {
            arr.push(i);
        }
        return arr;
    },
  includes: function (array, value) {
      console.log("includes helper input:", array);
  if (!Array.isArray(array)) return false;
  return array.includes(value);
  }
};