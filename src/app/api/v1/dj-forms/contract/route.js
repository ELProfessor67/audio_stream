import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import djFormsModels from "@/models/djForms";
import User from "@/models/user";
import { auth } from "@/middleswares/auth";

export const POST = connectDB(auth(async function (req) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isDJ) {
      return NextResponse.json(
        { success: false, message: "User is not a DJ" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const { contractorName, contractorSignatureUrl } = body;

    if (!contractorName || !contractorSignatureUrl) {
      return NextResponse.json(
        { success: false, message: "Contractor name and signature are required" },
        { status: 400 }
      );
    }

    // Create contract agreement
    const contractAgreement = await djFormsModels.ContractAgreement.create({
      user: userId,
      contractorName,
      contractorSignatureUrl
    });

    // Update user with contract agreement reference
    user.contractAgreement = contractAgreement._id;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Contract agreement submitted successfully",
        data: contractAgreement
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting contract agreement:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}));

// PUT - Resubmit contract agreement (after rejection)
export const PUT = connectDB(auth(async function (req) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user || !user.isDJ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { contractorName, contractorSignatureUrl } = body;

    if (!contractorName || !contractorSignatureUrl) {
      return NextResponse.json(
        { success: false, message: "Contractor name and signature are required" },
        { status: 400 }
      );
    }

    // Find existing contract agreement
    const existing = await djFormsModels.ContractAgreement.findOne({ user: userId });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "No existing contract found. Please submit a new one." },
        { status: 404 }
      );
    }

    // Update the contract agreement and reset status to pending
    existing.contractorName = contractorName;
    existing.contractorSignatureUrl = contractorSignatureUrl;
    existing.status = "pending";
    existing.rejectionReason = undefined;
    existing.signedDate = new Date();
    await existing.save();

    return NextResponse.json(
      {
        success: true,
        message: "Contract agreement resubmitted successfully",
        data: existing
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resubmitting contract agreement:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}));
