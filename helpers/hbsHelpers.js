const { options } = require("../app");

module.exports = {
    increment : (a, b = 1) => a + b,
    decrement : (a, b = 1) => a - b,
ifEquals: function (a, b, options) {
  if (!a || !b) return options.inverse(this);

  return a.toString() === b.toString()
    ? options.fn(this)
    : options.inverse(this);
}
,
    neq : (a, b) => a !== b,
    and: (a, b) => a && b,
    gt : (a, b) => a > b,
    gte : (a,b ) => a >= b,
    lt : (a, b) => a < b,
    lte : (a, b) => a <= b,
    eq: (a, b) => a === b,
    ne : (a, b) => a !== b,
    multiply: (a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return 0;
    return (numA * numB).toFixed(2); 
  },
  
  subtract :(a,b) => a-b,
  divide : (a, b) => a/b,
    json: (context) => JSON.stringify(context),
    range : (start, end) =>{
        let arr = [];
        for(let i = start ;i <= end; i++) {
            arr.push(i);
        }
        return arr;
    },
includes: function (array, value) {
  if (!Array.isArray(array) || !value) return false;

  const valueStr = value.toString();
  return array.some(item => item.toString() === valueStr);
},

  formatDate: function(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },
    json: (context) => JSON.stringify(context),

};