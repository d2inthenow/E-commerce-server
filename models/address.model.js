import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    address_type: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    pincode: {
      type: String,
    },
    country: {
      type: String,
    },
    mobile: {
      type: Number,
      default: null,
    },
    status: {
      type: Boolean,

      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: "",
    },
  },
  { timestamps: true, versionKey: false }
);

const AddressModel = mongoose.model("address", addressSchema);
export default AddressModel;
