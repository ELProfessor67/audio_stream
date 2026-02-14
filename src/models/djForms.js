import mongoose from "mongoose";
import userSchme from "./user"
const { Schema } = mongoose;

/* =====================================================
   COMMON LEGAL ACCEPTANCE FIELDS (Reusable Structure)
===================================================== */

const legalAcceptanceFields = {
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },

  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  // Agreement Confirmations
  volunteerAgreementAccepted: { type: Boolean, required: true },
  ndaAccepted: { type: Boolean, required: true },
  ipAssignmentAccepted: { type: Boolean, required: true },
  liabilityWaiverAccepted: { type: Boolean, required: true },
  nonCompeteAccepted: { type: Boolean, default: false },

  faithAcknowledgementAccepted: { type: Boolean, default: false },
  arbitrationAccepted: { type: Boolean, required: true },

  // Digital Signature
  digitalSignature: { type: String, required: true },
  signatureDate: { type: Date, default: Date.now },

  // Agreement Metadata
  agreementVersion: { type: String, default: "v1.0" },
  ipAddress: { type: String },
  signedAtLocation: { type: String },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "terminated"],
    default: "pending"
  },

  // Rejection reason (for disapproved forms)
  rejectionReason: { type: String, default: undefined }
};

/* =====================================================
   VOLUNTEER FORM SCHEMA
===================================================== */

const volunteerFormSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: userSchme, required: true },

    roleInterestedIn: { type: String },
    skills: [String],
    availability: { type: String },

    ...legalAcceptanceFields
  },
  { timestamps: true }
);

/* =====================================================
   EXECUTIVE LEGAL FORM SCHEMA
===================================================== */

const executiveLegalFormSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: userSchme, required: true },

    titleOrPosition: { type: String },
    responsibilities: { type: String },

    profitCompensationActivationAcknowledged: {
      type: Boolean,
      required: true
    },

    nonSolicitationAccepted: {
      type: Boolean,
      required: true
    },

    ...legalAcceptanceFields
  },
  { timestamps: true }
);

// Prevent model recompilation in Next.js development
const VolunteerForm = mongoose.models.VolunteerForm || mongoose.model("VolunteerForm", volunteerFormSchema);
const ExecutiveLegalForm = mongoose.models.ExecutiveLegalForm || mongoose.model("ExecutiveLegalForm", executiveLegalFormSchema);

export default {
  VolunteerForm,
  ExecutiveLegalForm
};
