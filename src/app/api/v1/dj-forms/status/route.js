import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import djFormsModels from "@/models/djForms";
import { auth } from "@/middleswares/auth";

export const GET = connectDB(auth(async function (req) {
  try {
    const userId = req.user._id;
    
    console.log('Fetching forms for user:', userId);

    // Fetch both volunteer and executive forms for the user
    const volunteerForm = await djFormsModels.VolunteerForm.findOne({ user: userId });
    const executiveForm = await djFormsModels.ExecutiveLegalForm.findOne({ user: userId });

    console.log('Volunteer form found:', !!volunteerForm);
    console.log('Executive form found:', !!executiveForm);

    // If neither form exists, return error
    if (!volunteerForm && !executiveForm) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No forms found. Please submit your DJ application forms first." 
        },
        { status: 404 }
      );
    }

    // If only one form exists, show what we have
    if (!volunteerForm || !executiveForm) {
      const missingForm = !volunteerForm ? 'Volunteer' : 'Executive Legal';
      console.warn(`${missingForm} form is missing for user ${userId}`);
      
      return NextResponse.json(
        {
          success: true,
          data: {
            volunteerForm: volunteerForm || null,
            executiveForm: executiveForm || null,
            overallStatus: (volunteerForm?.status || executiveForm?.status || 'pending'),
            warning: `${missingForm} form not found. Please complete all forms.`
          }
        },
        { status: 200 }
      );
    }

    // Both forms exist
    return NextResponse.json(
      {
        success: true,
        data: {
          volunteerForm,
          executiveForm,
          overallStatus: volunteerForm.status === executiveForm.status ? volunteerForm.status : 'pending'
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching form status:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}));
