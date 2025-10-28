const Address = require('../../models/addressSchema');
const loadAddAddressPage = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;

    if (!userId) {
      return res.redirect('/auth/login');
    }
    res.render('user/addAddress', { user: req.session.user });
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
    }const { name, mobile, pincode, locality, addressLine, city, state, landmark, addressType, isDefault } = req.body;
        if (!name || !mobile || !pincode || !locality || !addressLine || !city || !state) {
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
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
     res.json({ success: true, message: "Address saved successfully!" });
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

res.render("user/editAddress", { address, query: req.query });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

const updateAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) return res.redirect("/auth/login");

    const { name, mobile, pincode, locality, addressLine, city, state, landmark, addressType, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    await Address.findByIdAndUpdate(addressId, {
      name, mobile,
      pincode,locality,
      addressLine, city,
      state,landmark, addressType,
      isDefault: isDefault ? true : false
    },{ new: true });

    res.json({ success: true, message: "Address updated successfully!" });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ success: false, message: "Failed to update address" });
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


module.exports = { loadAddressPage,  loadAddAddressPage, addAddress, loadEditAddress, updateAddress, deleteAddress}