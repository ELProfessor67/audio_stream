import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import djFormsModels from "@/models/djForms";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";
import { sendDisapprovalEmail } from "@/utils/emailService";

export const POST = connectDB(auth(async function (req) {
  try {
    const currentUser = req.user;

    // Only non-DJ users (admins) can disapprove forms
    if (currentUser.isDJ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access only." },
        { status: 403 }
      );
    }

    const { userId, reason } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, message: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update both forms to rejected status with reason
    const volunteerForm = await djFormsModels.VolunteerForm.findOneAndUpdate(
      { user: userId },
      { status: "rejected", rejectionReason: reason },
      { new: true }
    );

    const executiveForm = await djFormsModels.ExecutiveLegalForm.findOneAndUpdate(
      { user: userId },
      { status: "rejected", rejectionReason: reason },
      { new: true }
    );

    if (!volunteerForm || !executiveForm) {
      return NextResponse.json(
        { success: false, message: "Forms not found for this user" },
        { status: 404 }
      );
    }

    // Send disapproval email with reason
    try {
      await sendDisapprovalEmail(user.email, user.name, reason);
    } catch (emailError) {
      console.error("Failed to send disapproval email:", emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Forms rejected successfully. Notification email sent to the user.",
        data: {
          volunteerForm,
          executiveForm
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error disapproving forms:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}));
