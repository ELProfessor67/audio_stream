import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import djFormsModels from "@/models/djForms";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";
import { sendApprovalEmail } from "@/utils/emailService";

export const POST = connectDB(auth(async function (req) {
  try {
    const currentUser = req.user;

    // Only non-DJ users (admins) can approve forms
    if (currentUser.isDJ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access only." },
        { status: 403 }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
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

    // Update both forms to approved status
    const volunteerForm = await djFormsModels.VolunteerForm.findOneAndUpdate(
      { user: userId },
      { status: "approved", rejectionReason: undefined },
      { new: true }
    );

    const executiveForm = await djFormsModels.ExecutiveLegalForm.findOneAndUpdate(
      { user: userId },
      { status: "approved", rejectionReason: undefined },
      { new: true }
    );

    if (!volunteerForm || !executiveForm) {
      return NextResponse.json(
        { success: false, message: "Forms not found for this user" },
        { status: 404 }
      );
    }

    // Send approval email
    try {
      await sendApprovalEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Forms approved successfully. Approval email sent to the user.",
        data: {
          volunteerForm,
          executiveForm
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving forms:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}));
