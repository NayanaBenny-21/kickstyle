const calculateOfferPrice = (sellingPrice, offer) => {
    if(!offer) {
        return {
            finalPrice : sellingPrice,
            discount : 0
        };
    }
    let discount = 0;
    if(offer.discountType ===' percentage') {
        discount = (sellingPrice * offer.discountValue) /100;

    } else {
        discount = Math.min(offer.discountValue, sellingPrice);
    }
    return {
        finalPrice : Math.max(sellingPrice - discount, 0),
        discount
    };
}

module.exports = calculateOfferPrice;