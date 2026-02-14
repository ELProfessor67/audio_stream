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
                    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                        <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
                            <div className='p-6'>
                                <div className='flex justify-between items-center mb-6'>
                                    <h2 className='text-2xl font-bold text-gray-800'>Application Details</h2>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className='text-gray-500 hover:text-gray-700'
                                    >
                                        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                        </svg>
                                    </button>
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    {/* Volunteer Form */}
                                    <div className='border border-gray-200 rounded-lg p-4'>
                                        <h3 className='text-lg font-semibold text-gray-800 mb-4'>Volunteer Form</h3>
                                        <div className='space-y-3'>
                                            <div>
                                                <p className='text-sm text-gray-600'>Name</p>
                                                <p className='font-semibold'>{selectedForm.user.name}</p>
                                            </div>
                                            <div>
                                                <p className='text-sm text-gray-600'>Email</p>
                                                <p className='font-semibold'>{selectedForm.user.email}</p>
                                            </div>
                                            {selectedForm.volunteerForm?.roleInterestedIn && (
                                                <div>
                                                    <p className='text-sm text-gray-600'>Role</p>
                                                    <p className='font-semibold'>{selectedForm.volunteerForm.roleInterestedIn}</p>
                                                </div>
                                            )}
                                            {selectedForm.volunteerForm?.skills && selectedForm.volunteerForm.skills.length > 0 && (
                                                <div>
                                                    <p className='text-sm text-gray-600'>Skills</p>
                                                    <div className='flex flex-wrap gap-2 mt-1'>
                                                        {selectedForm.volunteerForm.skills.map((skill, idx) => (
                                                            <span key={idx} className='px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm'>
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedForm.volunteerForm?.availability && (
                                                <div>
                                                    <p className='text-sm text-gray-600'>Availability</p>
                                                    <p className='font-semibold'>{selectedForm.volunteerForm.availability}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Executive Form */}
                                    <div className='border border-gray-200 rounded-lg p-4'>
                                        <h3 className='text-lg font-semibold text-gray-800 mb-4'>Executive Legal Form</h3>
                                        <div className='space-y-3'>
                                            <div>
                                                <p className='text-sm text-gray-600'>Name</p>
                                                <p className='font-semibold'>{selectedForm.user.name}</p>
                                            </div>
                                            <div>
                                                <p className='text-sm text-gray-600'>Email</p>
                                                <p className='font-semibold'>{selectedForm.user.email}</p>
                                            </div>
                                            {selectedForm.executiveForm?.titleOrPosition && (
                                                <div>
                                                    <p className='text-sm text-gray-600'>Title/Position</p>
                                                    <p className='font-semibold'>{selectedForm.executiveForm.titleOrPosition}</p>
                                                </div>
                                            )}
                                            {selectedForm.executiveForm?.responsibilities && (
                                                <div>
                                                    <p className='text-sm text-gray-600'>Responsibilities</p>
                                                    <p className='font-semibold'>{selectedForm.executiveForm.responsibilities}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedForm.status === 'rejected' && selectedForm.rejectionReason && (
                                    <div className='mt-6 bg-red-50 border border-red-200 rounded-lg p-4'>
                                        <h4 className='font-semibold text-red-800 mb-2'>Rejection Reason:</h4>
                                        <p className='text-red-700'>{selectedForm.rejectionReason}</p>
                                    </div>
                                )}

                                <div className='mt-6 flex justify-end gap-3'>
                                    {selectedForm.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setShowDetailsModal(false);
                                                    handleApprove(selectedForm.user._id, selectedForm.user.name);
                                                }}
                                                disabled={actionLoading}
                                                className='px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50'
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowDetailsModal(false);
                                                    handleDisapproveClick(selectedForm);
                                                }}
                                                disabled={actionLoading}
                                                className='px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50'
                                            >
                                                Disapprove
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className='px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
                                    >
                                        Close
                                    </button>
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
