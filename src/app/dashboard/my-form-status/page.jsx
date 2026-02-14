"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

const MyFormStatus = () => {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(null);
    const [error, setError] = useState(null);
    const { isAuth, user } = useSelector(store => store.user);
    const router = useRouter();
    const hasCheckedAuth = useRef(false);

    useEffect(() => {
        // Prevent multiple auth checks
        if (hasCheckedAuth.current) return;

        // Wait for user data to load
        if (!user) {
            setLoading(true);
            return;
        }

        hasCheckedAuth.current = true;

        // Check authentication
        if (!isAuth) {
            router.push('/login');
            return;
        }

        // Check if user is DJ
        if (user.isDJ !== true) {
            router.push('/dashboard');
            return;
        }

        // User is authenticated and is a DJ, fetch form status
        fetchFormStatus();
    }, [user, isAuth, router]);

    const fetchFormStatus = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/v1/dj-forms/status');
            setFormData(data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch form status');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <svg className='w-16 h-16 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                );
            case 'rejected':
                return (
                    <svg className='w-16 h-16 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                );
            case 'pending':
                return (
                    <svg className='w-16 h-16 text-yellow-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Loading form status...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <div className='bg-white p-8 rounded-lg shadow-lg max-w-md'>
                    <div className='text-center'>
                        <svg className='w-16 h-16 text-red-500 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <h2 className='text-2xl font-bold text-gray-800 mb-2'>Error</h2>
                        <p className='text-gray-600 mb-4'>{error}</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className='px-6 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600'
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const status = formData?.overallStatus || 'pending';

    return (
        <div className='min-h-screen bg-gray-50 py-8'>
            <div className='container mx-auto px-4 max-w-6xl'>
                {/* Header */}
                <div className='bg-white rounded-lg shadow-lg p-8 mb-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-800 mb-2'>DJ Application Status</h1>
                            <p className='text-gray-600'>Track the status of your DJ application</p>
                        </div>
                        <Image src="/images/logo.svg" width={100} height={100} className='w-20' alt="Logo" />
                    </div>
                </div>

                {/* Status Card */}
                <div className='bg-white rounded-lg shadow-lg p-8 mb-6'>
                    <div className='text-center mb-8'>
                        <div className='flex justify-center mb-4'>
                            {getStatusIcon(status)}
                        </div>
                        <h2 className='text-2xl font-bold text-gray-800 mb-2'>Application Status</h2>
                        <div className={`inline-block px-6 py-2 rounded-full border-2 ${getStatusColor(status)} font-semibold text-lg`}>
                            {status.toUpperCase()}
                        </div>
                        <p className='text-gray-600 mt-4'>
                            Submitted on {new Date(formData?.volunteerForm?.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Status Messages */}
                    {status === 'pending' && (
                        <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6'>
                            <div className='flex'>
                                <div className='flex-shrink-0'>
                                    <svg className='h-5 w-5 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div className='ml-3'>
                                    <p className='text-sm text-yellow-700'>
                                        Your application is currently under review. We'll notify you via email once a decision has been made.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'approved' && (
                        <div className='bg-green-50 border-l-4 border-green-400 p-4 mb-6'>
                            <div className='flex'>
                                <div className='flex-shrink-0'>
                                    <svg className='h-5 w-5 text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div className='ml-3'>
                                    <p className='text-sm text-green-700'>
                                        Congratulations! Your application has been approved. You now have full access to all DJ features.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'rejected' && formData?.volunteerForm?.rejectionReason && (
                        <div className='bg-red-50 border-l-4 border-red-400 p-4 mb-6'>
                            <div className='flex'>
                                <div className='flex-shrink-0'>
                                    <svg className='h-5 w-5 text-red-400' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div className='ml-3'>
                                    <h3 className='text-sm font-medium text-red-800'>Application Rejected</h3>
                                    <div className='mt-2 text-sm text-red-700'>
                                        <p className='font-semibold'>Reason:</p>
                                        <p className='mt-1'>{formData.volunteerForm.rejectionReason}</p>
                                    </div>
                                    <p className='mt-3 text-sm text-red-700'>
                                        You may address the concerns and reapply in the future.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Details */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Volunteer Form Details */}
                    <div className='bg-white rounded-lg shadow-lg p-6'>
                        <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center'>
                            <svg className='w-6 h-6 mr-2 text-indigo-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                            </svg>
                            Volunteer Form
                        </h3>
                        <div className='space-y-3'>
                            <div>
                                <p className='text-sm text-gray-600'>Full Name</p>
                                <p className='font-semibold text-gray-800'>{formData?.volunteerForm?.fullName}</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-600'>Email</p>
                                <p className='font-semibold text-gray-800'>{formData?.volunteerForm?.email}</p>
                            </div>
                            {formData?.volunteerForm?.roleInterestedIn && (
                                <div>
                                    <p className='text-sm text-gray-600'>Role Interested In</p>
                                    <p className='font-semibold text-gray-800'>{formData.volunteerForm.roleInterestedIn}</p>
                                </div>
                            )}
                            {formData?.volunteerForm?.skills && formData.volunteerForm.skills.length > 0 && (
                                <div>
                                    <p className='text-sm text-gray-600'>Skills</p>
                                    <div className='flex flex-wrap gap-2 mt-1'>
                                        {formData.volunteerForm.skills.map((skill, index) => (
                                            <span key={index} className='px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm'>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className='text-sm text-gray-600'>Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(formData?.volunteerForm?.status)}`}>
                                    {formData?.volunteerForm?.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Executive Form Details */}
                    <div className='bg-white rounded-lg shadow-lg p-6'>
                        <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center'>
                            <svg className='w-6 h-6 mr-2 text-indigo-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                            </svg>
                            Executive Legal Form
                        </h3>
                        <div className='space-y-3'>
                            <div>
                                <p className='text-sm text-gray-600'>Full Name</p>
                                <p className='font-semibold text-gray-800'>{formData?.executiveForm?.fullName}</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-600'>Email</p>
                                <p className='font-semibold text-gray-800'>{formData?.executiveForm?.email}</p>
                            </div>
                            {formData?.executiveForm?.titleOrPosition && (
                                <div>
                                    <p className='text-sm text-gray-600'>Title/Position</p>
                                    <p className='font-semibold text-gray-800'>{formData.executiveForm.titleOrPosition}</p>
                                </div>
                            )}
                            {formData?.executiveForm?.responsibilities && (
                                <div>
                                    <p className='text-sm text-gray-600'>Responsibilities</p>
                                    <p className='font-semibold text-gray-800'>{formData.executiveForm.responsibilities}</p>
                                </div>
                            )}
                            <div>
                                <p className='text-sm text-gray-600'>Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(formData?.executiveForm?.status)}`}>
                                    {formData?.executiveForm?.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back to Dashboard Button */}
                <div className='mt-6 text-center'>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className='px-6 py-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all'
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyFormStatus;
