import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import djFormsModels from "@/models/djForms";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";

export const GET = connectDB(auth(async function (req) {
  try {
    const currentUser = req.user;

    // Only non-DJ users (admins) can access this endpoint
    if (currentUser.isDJ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access only." },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // pending, approved, rejected
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch all volunteer forms with user details
    const volunteerForms = await djFormsModels.VolunteerForm.find(query)
      .populate('user', 'name email isDJ createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await djFormsModels.VolunteerForm.countDocuments(query);

    // Fetch corresponding executive forms
    const formsWithDetails = await Promise.all(
      volunteerForms.map(async (volunteerForm) => {
        const executiveForm = await djFormsModels.ExecutiveLegalForm.findOne({ 
          user: volunteerForm.user._id 
        });

        return {
          _id: volunteerForm._id,
          user: volunteerForm.user,
          volunteerFormId: volunteerForm._id,
          executiveFormId: executiveForm?._id,
          status: volunteerForm.status,
          submittedAt: volunteerForm.createdAt,
          rejectionReason: volunteerForm.rejectionReason,
          volunteerForm: {
            roleInterestedIn: volunteerForm.roleInterestedIn,
            skills: volunteerForm.skills,
            availability: volunteerForm.availability,
          },
          executiveForm: executiveForm ? {
            titleOrPosition: executiveForm.titleOrPosition,
            responsibilities: executiveForm.responsibilities,
          } : null
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          forms: formsWithDetails,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            limit
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching all forms:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}));
