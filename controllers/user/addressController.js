const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema'); 
const Product = require('../../models/productSchema'); 
const Variant = require('../../models/variantSchema');
const Cart = require('../../models/cartSchema');


const loadAddAddressPage = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;

    if (!userId) {
      return res.redirect('/auth/login');
    }
    const from = req.query.from || 'profile';
    res.render('user/addAddress', { user: req.session.user, from });
  } catch (error) {
    console.error('Error loading add address page:', error);
    res.status(500).send('Server Error');
  }
};

const addAddress = async (req, res) => {
    try {
            const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) {
      return res.redirect('/auth/login');
    }const { name, mobile, pincode, locality, addressLine, city, state, landmark, addressType, isDefault, from } = req.body;
    const nameRegex = /^[A-Za-z ]{3,}$/;
    const mobileRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^[1-9][0-9]{5}$/;

        if (!name || !mobile || !pincode || !locality || !addressLine || !city || !state) {
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
    }
        // Mobile validation
    if (!mobileRegex.test(mobile)) {
      return res.render("user/addAddress", {
        user: req.session.user,
        from,
        error: "Invalid Mobile Number. Enter a valid 10-digit mobile number starting with 6-9.",
      });
    }

    // Pincode validation
    if (!pincodeRegex.test(pincode)) {
      return res.render("user/addAddress", {
        user: req.session.user,
        from,
        error: "Invalid Pincode. Enter a valid 6-digit Indian pincode.",
      });
    }

        if (isDefault) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }
        const newAddress = new Address({
      userId, name, mobile,
      pincode, locality, addressLine,
      city, state, landmark,
      addressType: addressType || "home",
      isDefault: Boolean(isDefault),
    });
    await newAddress.save();
    if(from === 'checkout' ) {
      return res.redirect('/cart/select-address')
    } else {
      res.redirect('/address')
    }
    } catch (error) {
          console.error(" Error saving address:", error);
    res.status(500).json({ success: false, message: "Failed to save address" });
    }
}

const loadAddressPage = async (req, res) => {
  try {
                const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) return res.redirect('/auth/login');

    const addresses = await Address.find({ userId }).lean();
    const defaultAddress = addresses.find(addr => addr.isDefault);
    const otherAddresses = addresses.filter(addr => !addr.isDefault);

    res.render('user/address', {
      title: "Your Address",
      defaultAddress,
      otherAddresses,
      user: req.session.user
    });

  } catch (err) {
    console.error("Error loading address page:", err);
    res.status(500).render('error', { message: 'Failed to load address page' });
  }  
}

const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const address = await Address.findById(addressId).lean();
    if (!address) {
      return res.status(404).send("Address not found");
    }
const from = req.query.from || 'profile';
res.render("user/editAddress", { address, from, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

const updateAddress = async (req, res) => {
  try {
    const mobileRegex = /^[6-9]\d{9}$/; 
    const pincodeRegex = /^[1-9][0-9]{5}$/; 

    const addressId = req.params.id;
    const userId = req.user ? req.user.id : req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { 
      name, mobile, pincode, locality, addressLine, 
      city, state, landmark, addressType, isDefault, from 
    } = req.body;

    // Mobile validation
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Mobile Number. Enter a valid 10-digit mobile number starting with 6-9."
      });
    }

    // Pincode validation
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Pincode. Enter a valid 6-digit Indian pincode."
      });
    }

    if (isDefault) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    await Address.findByIdAndUpdate(
      addressId,
      {
        name, mobile, pincode, locality,
        addressLine, city, state, landmark, addressType,
        isDefault: Boolean(isDefault)
      },
      { new: true }
    );

    const redirectUrl = from === "checkout" ? "/cart/select-address" : "/address";

    return res.json({
      success: true,
      error: "Address updated successfully!",
      redirectUrl
    });

  } catch (error) {
    console.error("Error updating address:", error);
    return res.status(500).json({ success: false, message: "Failed to update address" });
  }
};


const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
const userId = req.user ? req.user.id : req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    await Address.deleteOne({ _id: addressId });

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ success: false, message: "Server error while deleting address" });
  }
};
const loadSelectAddressPage = async (req, res) => {
  try {
    const userId = req.user?._id || req.session.userId;
    if (!userId) return res.redirect('/auth/login');

    const addresses = await Address.find({ userId }).lean();

    const buyNow = req.query.buyNow === '1';


    let cartItems = [];
    let subTotal = 0;
    let shippingCharge = 0;
    const platformFee = 7;
let appliedCoupon = null; 
    if (buyNow) {
      // BUY NOW case → last item in cart
      const cart = await Cart.findOne({ user_id: userId })
        .populate('items.productId', 'product_name')
        .populate('items.variantId', 'size color')
        .lean();

      if (cart && cart.items.length > 0) {
        const item = cart.items[cart.items.length - 1];

        cartItems.push({
          productId: {
            _id: item.productId._id,
            product_name: item.productId.product_name
          },
          variantId: item.variantId ? {
            _id: item.variantId._id,
            size: item.variantId.size,
            color: item.variantId.color
          } : null,
          quantity: item.quantity,
          price: item.price,         // already best offer
          totalPrice: item.totalPrice
        });

        subTotal = item.totalPrice;
      }
    } else {
      // 🤝 FULL CART CHECKOUT
      const cart = await Cart.findOne({ user_id: userId })
        .populate('items.productId', 'product_name')
        .populate('items.variantId', 'size color')
        .lean();

      if (cart && cart.items.length > 0) {
        cart.items.forEach(item => {
          subTotal += item.totalPrice; // already best price
        });

        cartItems = cart.items.map(item => ({
          productId: {
            _id: item.productId._id,
            product_name: item.productId.product_name
          },
          variantId: item.variantId ? {
            _id: item.variantId._id,
            size: item.variantId.size,
            color: item.variantId.color
          } : null,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice
        }));
      }
    }

    // Shipping rule (common)
    shippingCharge = subTotal < 1000 ? 40 : 0;

    const total = subTotal + shippingCharge + platformFee;
    if (buyNow && req.session.coupon) {
      console.log("Clearing old coupon for Buy Now:", req.session.coupon);
      delete req.session.coupon;
    }

    return res.render('user/selectAddress', {
      addresses,
      cartItems,
      buyNow,
      subTotal,
      shippingCharge,
      platformFee,
      total,
      user: req.session.user
    });

  } catch (error) {
    console.error('Error loading the address page', error);
    return res.status(500).send('Server error');
  }
};

const selectAddress = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    const { addressId } = req.body;

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) return res.json({ success: false });

    req.session.selectedAddress = addressId;

    res.json({ success: true });
  } catch (error) {
    console.error('Error selecting address:', error);
    res.json({ success: false });
  }
};


module.exports = { loadAddressPage,  loadAddAddressPage, addAddress, loadEditAddress, updateAddress, deleteAddress,
 loadSelectAddressPage, selectAddress
}