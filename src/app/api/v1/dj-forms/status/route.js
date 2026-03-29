import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import djFormsModels from "@/models/djForms";
import { auth } from "@/middleswares/auth";

export const GET = connectDB(auth(async function (req) {
  try {
    const userId = req.user._id;

    // Fetch contract agreement (new form)
    const contractAgreement = await djFormsModels.ContractAgreement.findOne({ user: userId });

    // Fetch legacy forms
    const volunteerForm = await djFormsModels.VolunteerForm.findOne({ user: userId });
    const executiveForm = await djFormsModels.ExecutiveLegalForm.findOne({ user: userId });

    // If contract agreement exists, return it as primary
    if (contractAgreement) {
      return NextResponse.json(
        {
          success: true,
          data: {
            formType: 'contract',
            contractAgreement,
            overallStatus: contractAgreement.status || 'pending',
            rejectionReason: contractAgreement.rejectionReason || null
          }
        },
        { status: 200 }
      );
    }

    // Fallback to legacy forms
    if (volunteerForm || executiveForm) {
      const formStatus = executiveForm?.status || volunteerForm?.status || 'pending';
      return NextResponse.json(
        {
          success: true,
          data: {
            formType: 'legacy',
            volunteerForm: volunteerForm || null,
            executiveForm: executiveForm || null,
            overallStatus: formStatus,
            rejectionReason: executiveForm?.rejectionReason || volunteerForm?.rejectionReason || null
          }
        },
        { status: 200 }
      );
    }

    

    // No forms found
    return NextResponse.json(
      {
        success: false,
        message: "No forms found. Please submit your DJ application forms first."
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching form status:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}));
