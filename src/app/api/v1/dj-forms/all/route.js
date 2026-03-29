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

    // Build query for status filtering
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // ---- Fetch NEW contract agreements ----
    const contractAgreements = await djFormsModels.ContractAgreement.find(query)
      .populate('user', 'name email isDJ createdAt')
      .sort({ createdAt: -1 });

    const contractForms = contractAgreements.map((contract) => ({
      _id: contract._id,
      user: contract.user,
      formType: 'contract',
      status: contract.status || 'pending',
      submittedAt: contract.createdAt,
      rejectionReason: contract.rejectionReason,
      contractAgreement: {
        contractorName: contract.contractorName,
        contractorSignatureUrl: contract.contractorSignatureUrl,
        signedDate: contract.signedDate,
        agreementVersion: contract.agreementVersion
      }
    }));

    // ---- Fetch LEGACY volunteer forms ----
    const volunteerForms = await djFormsModels.VolunteerForm.find()
      .populate('user', 'name email isDJ createdAt')
      .sort({ createdAt: -1 });

    // Only include legacy forms for users who DON'T have a contract agreement
    const contractUserIds = contractAgreements.map(c => c.user?._id?.toString());

    const legacyFormsRaw = volunteerForms.filter(
      vf => !contractUserIds.includes(vf.user?._id?.toString())
    );

    const legacyForms = await Promise.all(
      legacyFormsRaw.map(async (volunteerForm) => {
        const executiveForm = await djFormsModels.ExecutiveLegalForm.findOne({
          user: volunteerForm.user._id
        });

        // Use executive form status if available, otherwise default to pending
        const formStatus = executiveForm?.status || 'pending';

        // If filtering by status and this one doesn't match, skip
        if (status && status !== 'all' && formStatus !== status) {
          return null;
        }

        return {
          _id: volunteerForm._id,
          user: volunteerForm.user,
          formType: 'legacy',
          volunteerFormId: volunteerForm._id,
          executiveFormId: executiveForm?._id,
          status: formStatus,
          submittedAt: volunteerForm.createdAt,
          rejectionReason: executiveForm?.rejectionReason,
          volunteerForm: {
            roleInterestedIn: volunteerForm.roleInterestedIn,
            skills: volunteerForm.skills,
            availability: volunteerForm.availability,
          },
          executiveLegalForm: executiveForm || null
        };
      })
    );

    // Filter out nulls (skipped due to status filter)
    const filteredLegacy = legacyForms.filter(Boolean);

    // Combine and sort by date
    const allForms = [...contractForms, ...filteredLegacy]
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Apply pagination
    const totalCount = allForms.length;
    const paginatedForms = allForms.slice(skip, skip + limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          forms: paginatedForms,
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
