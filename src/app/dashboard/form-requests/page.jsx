"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';

const FormRequests = () => {
    const [loading, setLoading] = useState(true);
    const [forms, setForms] = useState([]);
    const [filteredForms, setFilteredForms] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedForm, setSelectedForm] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDisapproveModal, setShowDisapproveModal] = useState(false);
    const [disapproveReason, setDisapproveReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const { isAuth, user } = useSelector(store => store.user);
    const router = useRouter();
    const dispatch = useDispatch();

    useEffect(() => {
        // if (!isAuth || !user) {
        //     router.push('/login');
        //     return;
        // }

        // if (user.isDJ) {
        //     router.push('/dashboard');
        //     return;
        // }

        fetchForms();
    }, [isAuth, user, router, currentPage, statusFilter]);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`/api/v1/dj-forms/all?page=${currentPage}&status=${statusFilter}`);
            setForms(data.data.forms);
            setFilteredForms(data.data.forms);
            setPagination(data.data.pagination);
        } catch (err) {
            await dispatch(showError(err.response?.data?.message || 'Failed to fetch forms'));
            await dispatch(clearError());
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId, userName) => {
        const confirmed = window.confirm(`Are you sure you want to approve ${userName}'s application?`);
        if (!confirmed) return;

        try {
            setActionLoading(true);
            await axios.post('/api/v1/dj-forms/approve', { userId });
            await dispatch(showMessage('Form approved successfully! Email sent to the user.'));
            await dispatch(clearMessage());
            fetchForms(); // Refresh the list
        } catch (err) {
            await dispatch(showError(err.response?.data?.message || 'Failed to approve form'));
            await dispatch(clearError());
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisapproveClick = (form) => {
        setSelectedForm(form);
        setDisapproveReason('');
        setShowDisapproveModal(true);
    };

    const handleDisapproveSubmit = async () => {
        if (!disapproveReason.trim()) {
            await dispatch(showError('Please provide a reason for disapproval'));
            await dispatch(clearError());
            return;
        }

        try {
            setActionLoading(true);
            await axios.post('/api/v1/dj-forms/disapprove', {
                userId: selectedForm.user._id,
                reason: disapproveReason
            });
            await dispatch(showMessage('Form rejected successfully! Email sent to the user.'));
            await dispatch(clearMessage());
            setShowDisapproveModal(false);
            setDisapproveReason('');
            fetchForms(); // Refresh the list
        } catch (err) {
            await dispatch(showError(err.response?.data?.message || 'Failed to disapprove form'));
            await dispatch(clearError());
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetails = (form) => {
        setSelectedForm(form);
        setShowDetailsModal(true);
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    if (loading && forms.length === 0) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Loading form requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 py-8'>
            <div className='container mx-auto px-4'>
                {/* Header */}
                <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-800 mb-2'>DJ Form Requests</h1>
                            <p className='text-gray-600'>Review and manage DJ applications</p>
                        </div>
                        <Image src="/images/logo.svg" width={100} height={100} className='w-20' alt="Logo" />
                    </div>
                </div>

                {/* Filters */}
                <div className='bg-white rounded-lg shadow-lg p-4 mb-6'>
                    <div className='flex items-center gap-4'>
                        <label className='text-gray-700 font-semibold'>Filter by Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        >
                            <option value='all'>All</option>
                            <option value='pending'>Pending</option>
                            <option value='approved'>Approved</option>
                            <option value='rejected'>Rejected</option>
                        </select>
                        <div className='ml-auto text-gray-600'>
                            Total: {pagination?.totalCount || 0} forms
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        DJ Name
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Email
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Submitted Date
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Status
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='bg-white divide-y divide-gray-200'>
                                {filteredForms.length === 0 ? (
                                    <tr>
                                        <td colSpan='5' className='px-6 py-8 text-center text-gray-500'>
                                            No forms found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredForms.map((form) => (
                                        <tr key={form._id} className='hover:bg-gray-50'>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='text-sm font-medium text-gray-900'>{form.user.name}</div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='text-sm text-gray-500'>{form.user.email}</div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='text-sm text-gray-500'>
                                                    {new Date(form.submittedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                {getStatusBadge(form.status)}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                                <div className='flex gap-2'>
                                                    <button
                                                        onClick={() => handleViewDetails(form)}
                                                        className='text-indigo-600 hover:text-indigo-900'
                                                    >
                                                        View
                                                    </button>
                                                    {form.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(form.user._id, form.user.name)}
                                                                disabled={actionLoading}
                                                                className='text-green-600 hover:text-green-900 disabled:opacity-50'
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleDisapproveClick(form)}
                                                                disabled={actionLoading}
                                                                className='text-red-600 hover:text-red-900 disabled:opacity-50'
                                                            >
                                                                Disapprove
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className='bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200'>
                            <div className='text-sm text-gray-700'>
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                    disabled={currentPage === pagination.totalPages}
                                    className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Modal */}
                {showDetailsModal && selectedForm && (
                    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm'>
                        <div className='bg-white rounded-none shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border-[12px] border-gray-200'>
                            <div className='p-8 md:p-12 text-gray-900 font-sans'>
                                {/* Formal Document Header */}
                                <div className='border-b-4 border-gray-900 pb-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6'>
                                    <div className='text-center md:text-left'>
                                        <h1 className='text-3xl font-black uppercase tracking-tighter mb-1'>HGC RADIO</h1>
                                        <p className='text-sm font-bold tracking-[0.2em] text-gray-600 uppercase italic'>Official Registration Department</p>
                                    </div>
                                    <div className='text-center md:text-right border-l-0 md:border-l-2 border-gray-300 pl-0 md:pl-6'>
                                        <h2 className='text-xl font-bold uppercase tracking-widest'>VOLUNTEER & DJ RECORD</h2>
                                        <p className='text-xs font-mono text-gray-500 uppercase mt-1'>Document ID: {selectedForm._id?.substring(0, 12).toUpperCase()}</p>
                                        <p className='text-xs font-mono text-gray-500 uppercase'>Entry Date: {new Date(selectedForm.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className='space-y-10'>
                                    {/* SECTION I */}
                                    <section>
                                        <h3 className='flex items-center gap-3 text-lg font-black uppercase tracking-widest bg-gray-900 text-white px-4 py-2 mb-6'>
                                            <span className='w-8 h-8 flex items-center justify-center bg-white text-gray-900 font-black rounded-sm text-sm'>I</span>
                                            BIOGRAPHICAL & CONTACT INFORMATION
                                        </h3>
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 px-4'>
                                            <div className='border-b border-gray-200 pb-1'>
                                                <p className='text-[10px] uppercase font-bold text-gray-500 mb-1'>FULL LEGAL NAME</p>
                                                <p className='text-lg font-semibold'>{selectedForm.user.name}</p>
                                            </div>
                                            <div className='border-b border-gray-200 pb-1'>
                                                <p className='text-[10px] uppercase font-bold text-gray-500 mb-1'>ELECTRONIC MAIL ADDRESS</p>
                                                <p className='text-lg font-semibold'>{selectedForm.user.email}</p>
                                            </div>
                                            <div className='border-b border-gray-200 pb-1'>
                                                <p className='text-[10px] uppercase font-bold text-gray-500 mb-1'>CONTACT TELEPHONE</p>
                                                <p className='text-lg font-semibold'>{selectedForm.executiveLegalForm?.phone || selectedForm.volunteerForm?.phone || 'NOT PROVIDED'}</p>
                                            </div>
                                            <div className='border-b border-gray-200 pb-1'>
                                                <p className='text-[10px] uppercase font-bold text-gray-500 mb-1'>RESIDENTIAL ADDRESS</p>
                                                <div className='text-md font-semibold leading-tight pt-1'>
                                                    {selectedForm.executiveLegalForm?.address?.street && <p>{selectedForm.executiveLegalForm.address.street}</p>}
                                                    <p>
                                                        {selectedForm.executiveLegalForm?.address?.city || 'N/A'}, {selectedForm.executiveLegalForm?.address?.state || 'N/A'} {selectedForm.executiveLegalForm?.address?.zipCode || ''}
                                                    </p>
                                                    <p className='uppercase text-xs text-gray-400'>{selectedForm.executiveLegalForm?.address?.country || 'USA'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* SECTION II */}
                                    <section>
                                        <h3 className='flex items-center gap-3 text-lg font-black uppercase tracking-widest bg-gray-900 text-white px-4 py-2 mb-6'>
                                            <span className='w-8 h-8 flex items-center justify-center bg-white text-gray-900 font-black rounded-sm text-sm'>II</span>
                                            ROLE & SKILLS ASSESSMENT
                                        </h3>
                                        <div className='space-y-6 px-4'>
                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                                                <div className='border-l-4 border-gray-200 pl-4 py-1'>
                                                    <p className='text-[10px] uppercase font-bold text-gray-500 mb-2'>POSITION(S) OF INTEREST</p>
                                                    <p className='text-md font-bold uppercase'>{selectedForm.volunteerForm?.roleInterestedIn || selectedForm.executiveLegalForm?.titleOrPosition || 'GENERAL DJ / VOLUNTEER'}</p>
                                                </div>
                                                <div className='border-l-4 border-gray-200 pl-4 py-1'>
                                                    <p className='text-[10px] uppercase font-bold text-gray-500 mb-2'>AVAILABILITY PROFILE</p>
                                                    <p className='text-md'>{selectedForm.volunteerForm?.availability || 'AS PER STATION REQUIREMENTS'}</p>
                                                </div>
                                            </div>
                                            {selectedForm.executiveLegalForm?.responsibilities && (
                                                <div className='border-l-4 border-gray-200 pl-4 py-1'>
                                                    <p className='text-[10px] uppercase font-bold text-gray-500 mb-2'>PRIMARY RESPONSIBILITIES</p>
                                                    <p className='text-md text-gray-700 italic'>{selectedForm.executiveLegalForm.responsibilities}</p>
                                                </div>
                                            )}
                                            <div className='bg-gray-50 p-4 border border-gray-200'>
                                                <p className='text-[10px] uppercase font-bold text-gray-500 mb-3'>TECHNICAL SKILLS & QUALIFICATIONS</p>
                                                <div className='flex flex-wrap gap-2'>
                                                    {selectedForm.volunteerForm?.skills?.length > 0 ? (
                                                        selectedForm.volunteerForm.skills.map((skill, idx) => (
                                                            <span key={idx} className='px-3 py-1 bg-white border border-gray-300 shadow-sm text-xs font-bold uppercase'>
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className='italic text-gray-400'>No specific skills documented</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* SECTION III */}
                                    <section>
                                        <h3 className='flex items-center gap-3 text-lg font-black uppercase tracking-widest bg-gray-900 text-white px-4 py-2 mb-6'>
                                            <span className='w-8 h-8 flex items-center justify-center bg-white text-gray-900 font-black rounded-sm text-sm'>III</span>
                                            LEGAL DECLARATIONS & AGREEMENTS
                                        </h3>
                                        <div className='px-4'>
                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-8'>
                                                {[
                                                    { label: 'Volunteer Agreement', key: 'volunteerAgreementAccepted' },
                                                    { label: 'NDA', key: 'ndaAccepted' },
                                                    { label: 'IP Assignment', key: 'ipAssignmentAccepted' },
                                                    { label: 'Liability Waiver', key: 'liabilityWaiverAccepted' },
                                                    { label: 'Non-Compete', key: 'nonCompeteAccepted' },
                                                    { label: 'Faith Acknowledgment', key: 'faithAcknowledgementAccepted' },
                                                    { label: 'Arbitration Agreement', key: 'arbitrationAccepted' },
                                                    { label: 'Non-Solicitation', key: 'nonSolicitationAccepted' },
                                                    { label: 'Profit Compensation', key: 'profitCompensationActivationAcknowledged' },
                                                    { label: 'DJ Quick Rules', key: 'djQuickRulesAccepted', highlight: true },
                                                ].map((item) => (
                                                    <div key={item.key} className={`flex items-center justify-between p-3 border ${item.highlight ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200'}`}>
                                                        <span className={`text-[11px] font-bold uppercase ${item.highlight ? 'text-indigo-800' : 'text-gray-600'}`}>{item.label}</span>
                                                        {selectedForm.executiveLegalForm?.[item.key] ? (
                                                            <div className='flex items-center gap-1.5'>
                                                                <span className='text-[10px] font-black text-green-700 bg-green-100 px-2 py-0.5 border border-green-700'>ACCEPTED</span>
                                                            </div>
                                                        ) : (
                                                            <span className='text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 border border-red-700'>DECLINED</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className='flex flex-col md:flex-row items-end justify-between gap-8 pt-8 border-t-2 border-gray-900 mb-6'>
                                                <div className='w-full md:w-2/3'>
                                                    <p className='text-[10px] uppercase font-bold text-gray-500 mb-10 italic'>Official Electronic Attestation & Signature</p>
                                                    <div className='border-b-2 border-gray-900 pb-2 relative'>
                                                        <p className='font-serif italic text-3xl text-gray-900 pl-4'>{selectedForm.executiveLegalForm?.digitalSignature || 'N/A'}</p>
                                                        <span className='absolute bottom-1 right-2 text-[8px] font-mono text-gray-400'>
                                                            SIGNED: {new Date(selectedForm.executiveLegalForm?.signatureDate || selectedForm.submittedAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className='text-[9px] font-bold text-gray-400 mt-2 uppercase'>Validated Electronic Identifier</p>
                                                </div>
                                                <div className='w-32 h-32 border-4 border-gray-900 items-center justify-center p-2 opacity-20 hidden md:flex text-center'>
                                                    <p className='text-[10px] font-black uppercase leading-tight'>OFFICIAL<br/>HGC RADIO<br/>SEAL</p>
                                                </div>
                                            </div>

                                            {/* Technical Metadata Bar */}
                                            <div className='flex flex-wrap gap-4 pt-4 border-t border-gray-200 text-[9px] font-mono text-gray-400 uppercase'>
                                                <p>Agreement Version: {selectedForm.executiveLegalForm?.agreementVersion || '1.0'}</p>
                                                <p>IP Address: {selectedForm.executiveLegalForm?.ipAddress || '0.0.0.0'}</p>
                                                <p>Origin: {selectedForm.executiveLegalForm?.signedAtLocation || 'Web Terminal'}</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {selectedForm.status === 'rejected' && selectedForm.rejectionReason && (
                                    <div className='mt-10 bg-red-50 border-4 border-red-200 p-6'>
                                        <h4 className='font-black text-red-800 uppercase tracking-widest mb-3 underline decoration-2'>ADMINISTRATIVE NOTES: REJECTION</h4>
                                        <p className='text-red-700 font-medium leading-relaxed'>{selectedForm.rejectionReason}</p>
                                    </div>
                                )}

                                {/* OFFICIAL USE ONLY - Action Footer */}
                                <div className='mt-12 pt-8 border-t-2 border-gray-300'>
                                    <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
                                        <div className='bg-gray-100 px-4 py-2 border-l-4 border-gray-400'>
                                            <p className='text-[10px] font-bold uppercase text-gray-500'>Station Status</p>
                                            <p className={`font-black uppercase ${selectedForm.status === 'approved' ? 'text-green-600' : selectedForm.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                {selectedForm.status}
                                            </p>
                                        </div>
                                        <div className='flex gap-4'>
                                            {selectedForm.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setShowDetailsModal(false);
                                                            handleApprove(selectedForm.user._id, selectedForm.user.name);
                                                        }}
                                                        disabled={actionLoading}
                                                        className='px-8 py-3 bg-gray-900 text-white font-black uppercase tracking-tighter hover:bg-green-600 transition-colors disabled:opacity-50'
                                                    >
                                                        Authorize Account
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowDetailsModal(false);
                                                            handleDisapproveClick(selectedForm);
                                                        }}
                                                        disabled={actionLoading}
                                                        className='px-8 py-3 bg-white border-2 border-gray-900 text-gray-900 font-black uppercase tracking-tighter hover:bg-red-600 hover:text-white transition-all disabled:opacity-50'
                                                    >
                                                        Reject Record
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setShowDetailsModal(false)}
                                                className='px-8 py-3 bg-gray-200 text-gray-600 font-black uppercase tracking-tighter hover:bg-gray-300 transition-colors'
                                            >
                                                Close File
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disapprove Modal */}
                {showDisapproveModal && selectedForm && (
                    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                        <div className='bg-white rounded-lg max-w-md w-full p-6'>
                            <h2 className='text-2xl font-bold text-gray-800 mb-4'>Disapprove Application</h2>
                            <p className='text-gray-600 mb-4'>
                                Please provide a reason for disapproving <strong>{selectedForm.user.name}</strong>'s application:
                            </p>
                            <textarea
                                value={disapproveReason}
                                onChange={(e) => setDisapproveReason(e.target.value)}
                                rows={4}
                                placeholder='Enter reason for disapproval...'
                                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                            />
                            <div className='mt-6 flex justify-end gap-3'>
                                <button
                                    onClick={() => {
                                        setShowDisapproveModal(false);
                                        setDisapproveReason('');
                                    }}
                                    className='px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDisapproveSubmit}
                                    disabled={actionLoading || !disapproveReason.trim()}
                                    className='px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50'
                                >
                                    {actionLoading ? 'Processing...' : 'Submit Disapproval'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormRequests;
