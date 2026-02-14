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


    console.log(user)

    if (!user.isDJ) {
      return NextResponse.json(
        { success: false, message: "User is not a DJ" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Create executive legal form
    const executiveForm = await djFormsModels.ExecutiveLegalForm.create({
      user: userId,
      ...body
    });

    // Update user with executive legal form reference
    user.executiveLegalForm = executiveForm._id;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Executive legal form submitted successfully",
        data: executiveForm
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting executive legal form:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}));
