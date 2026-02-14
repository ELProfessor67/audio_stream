"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { useDispatch } from 'react-redux';

const DJFormsPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const { isAuth, user } = useSelector(store => store.user);
    const router = useRouter();
    const dispatch = useDispatch();

    // Volunteer Form State
    const [volunteerForm, setVolunteerForm] = useState({
        roleInterestedIn: '',
        skills: '',
        availability: '',
        fullName: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
        },
        volunteerAgreementAccepted: false,
        ndaAccepted: false,
        ipAssignmentAccepted: false,
        liabilityWaiverAccepted: false,
        nonCompeteAccepted: false,
        faithAcknowledgementAccepted: false,
        arbitrationAccepted: false,
        digitalSignature: ''
    });

    // Executive Legal Form State
    const [executiveForm, setExecutiveForm] = useState({
        titleOrPosition: '',
        responsibilities: '',
        profitCompensationActivationAcknowledged: false,
        nonSolicitationAccepted: false,
        fullName: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
        },
        volunteerAgreementAccepted: false,
        ndaAccepted: false,
        ipAssignmentAccepted: false,
        liabilityWaiverAccepted: false,
        nonCompeteAccepted: false,
        faithAcknowledgementAccepted: false,
        arbitrationAccepted: false,
        digitalSignature: ''
    });

    useEffect(() => {
        // Redirect if not authenticated or not a DJ
        if (!isAuth || !user) {
            router.push('/login');
        } else if (!user.isDJ) {
            router.push('/dashboard');
        } else if (user.volunteerForm && user.executiveLegalForm) {
            // Already filled forms
            router.push('/dashboard');
        }
    }, [isAuth, user, router]);

    const handleVolunteerFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setVolunteerForm(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setVolunteerForm(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleExecutiveFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setExecutiveForm(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setExecutiveForm(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const validateVolunteerForm = async () => {
        if (!volunteerForm.fullName || !volunteerForm.email || !volunteerForm.digitalSignature) {
            await dispatch(showError('Please fill all required fields'));
            await dispatch(clearError());
            return false;
        }
        if (!volunteerForm.volunteerAgreementAccepted || !volunteerForm.ndaAccepted ||
            !volunteerForm.ipAssignmentAccepted || !volunteerForm.liabilityWaiverAccepted ||
            !volunteerForm.arbitrationAccepted) {
            await dispatch(showError('Please accept all required agreements'));
            await dispatch(clearError());
            return false;
        }
        return true;
    };

    const validateExecutiveForm = async () => {
        if (!executiveForm.fullName || !executiveForm.email || !executiveForm.digitalSignature) {
            await dispatch(showError('Please fill all required fields'));
            await dispatch(clearError());
            return false;
        }
        if (!executiveForm.profitCompensationActivationAcknowledged || !executiveForm.nonSolicitationAccepted ||
            !executiveForm.volunteerAgreementAccepted || !executiveForm.ndaAccepted ||
            !executiveForm.ipAssignmentAccepted || !executiveForm.liabilityWaiverAccepted ||
            !executiveForm.arbitrationAccepted) {
            await dispatch(showError('Please accept all required agreements'));
            await dispatch(clearError());
            return false;
        }
        return true;
    };

    const handleNext = async () => {
        if (step === 1) {
            const isValid = await validateVolunteerForm();
            if (!isValid) return;
            setStep(2);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isValid = await validateExecutiveForm();
        if (!isValid) return;

        setLoading(true);
        try {
            // Submit both forms
            const volunteerData = {
                ...volunteerForm,
                skills: volunteerForm.skills.split(',').map(s => s.trim())
            };

            await axios.post('/api/v1/dj-forms/volunteer', volunteerData);
            await axios.post('/api/v1/dj-forms/executive', executiveForm);

            setShowSuccessPopup(true);

            // Redirect after 3 seconds
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } catch (error) {
            await dispatch(showError(error.response?.data?.message || 'Failed to submit forms'));
            await dispatch(clearError());
        }
        setLoading(false);
    };

    return (
        <section className='min-h-screen bg-gray-50 py-8'>
            <div className='container mx-auto px-4'>
                <div className='max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-8'>
                    <div className='flex justify-center mb-6'>
                        <Image src="/images/logo.svg" width={200} height={300} className='w-28' alt="Logo" />
                    </div>

                    <div className='mb-8'>
                        <h1 className='text-3xl font-bold text-center text-gray-800 mb-2'>
                            DJ Registration Forms
                        </h1>
                        <p className='text-center text-gray-600'>
                            Complete the following forms to activate your DJ account
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    <div className='flex items-center justify-center mb-8'>
                        <div className='flex items-center'>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                1
                            </div>
                            <div className={`w-24 h-1 ${step >= 2 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                2
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Volunteer Form */}
                    {step === 1 && (
                        <div className='space-y-6'>
                            <h2 className='text-2xl font-semibold text-gray-800 mb-4'>Volunteer Information</h2>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-gray-700 mb-2'>Full Name *</label>
                                    <input
                                        type='text'
                                        name='fullName'
                                        value={volunteerForm.fullName}
                                        onChange={handleVolunteerFormChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block text-gray-700 mb-2'>Email *</label>
                                    <input
                                        type='email'
                                        name='email'
                                        value={volunteerForm.email}
                                        onChange={handleVolunteerFormChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block text-gray-700 mb-2'>Phone</label>
                                    <input
                                        type='tel'
                                        name='phone'
                                        value={volunteerForm.phone}
                                        onChange={handleVolunteerFormChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-gray-700 mb-2'>Role Interested In</label>
                                    <input
                                        type='text'
                                        name='roleInterestedIn'
                                        value={volunteerForm.roleInterestedIn}
                                        onChange={handleVolunteerFormChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-gray-700 mb-2'>Skills (comma-separated)</label>
                                <input
                                    type='text'
                                    name='skills'
                                    value={volunteerForm.skills}
                                    onChange={handleVolunteerFormChange}
                                    placeholder='e.g., Music Mixing, Audio Engineering, Broadcasting'
                                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                />
                            </div>

                            <div>
                                <label className='block text-gray-700 mb-2'>Availability</label>
                                <textarea
                                    name='availability'
                                    value={volunteerForm.availability}
                                    onChange={handleVolunteerFormChange}
                                    rows={3}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                />
                            </div>

                            <div className='border-t pt-6'>
                                <h3 className='text-xl font-semibold text-gray-800 mb-4'>Address</h3>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div className='md:col-span-2'>
                                        <label className='block text-gray-700 mb-2'>Street</label>
                                        <input
                                            type='text'
                                            name='address.street'
                                            value={volunteerForm.address.street}
                                            onChange={handleVolunteerFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 mb-2'>City</label>
                                        <input
                                            type='text'
                                            name='address.city'
                                            value={volunteerForm.address.city}
                                            onChange={handleVolunteerFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 mb-2'>State</label>
                                        <input
                                            type='text'
                                            name='address.state'
                                            value={volunteerForm.address.state}
                                            onChange={handleVolunteerFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 mb-2'>Country</label>
                                        <input
                                            type='text'
                                            name='address.country'
                                            value={volunteerForm.address.country}
                                            onChange={handleVolunteerFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 mb-2'>Zip Code</label>
                                        <input
                                            type='text'
                                            name='address.zipCode'
                                            value={volunteerForm.address.zipCode}
                                            onChange={handleVolunteerFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='border-t pt-6'>
                                <h3 className='text-xl font-semibold text-gray-800 mb-4'>Legal Agreements *</h3>
                                <div className='space-y-3'>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='volunteerAgreementAccepted'
                                            checked={volunteerForm.volunteerAgreementAccepted}
                                            onChange={handleVolunteerFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Volunteer Agreement</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='ndaAccepted'
                                            checked={volunteerForm.ndaAccepted}
                                            onChange={handleVolunteerFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Non-Disclosure Agreement (NDA)</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='ipAssignmentAccepted'
                                            checked={volunteerForm.ipAssignmentAccepted}
                                            onChange={handleVolunteerFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Intellectual Property Assignment</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='liabilityWaiverAccepted'
                                            checked={volunteerForm.liabilityWaiverAccepted}
                                            onChange={handleVolunteerFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Liability Waiver</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='nonCompeteAccepted'
                                            checked={volunteerForm.nonCompeteAccepted}
                                            onChange={handleVolunteerFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Non-Compete Agreement (Optional)</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='faithAcknowledgementAccepted'
                                            checked={volunteerForm.faithAcknowledgementAccepted}
                                            onChange={handleVolunteerFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I acknowledge the Faith-Based Organization Statement (Optional)</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='arbitrationAccepted'
                                            checked={volunteerForm.arbitrationAccepted}
                                            onChange={handleVolunteerFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Arbitration Agreement</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className='block text-gray-700 mb-2'>Digital Signature (Type your full name) *</label>
                                <input
                                    type='text'
                                    name='digitalSignature'
                                    value={volunteerForm.digitalSignature}
                                    onChange={handleVolunteerFormChange}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    required
                                />
                            </div>

                            <div className='flex justify-end'>
                                <button
                                    type='button'
                                    onClick={handleNext}
                                    className='px-6 py-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all'
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Executive Legal Form */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className='space-y-6'>
                            <h2 className='text-2xl font-semibold text-gray-800 mb-4'>Executive Legal Information</h2>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-gray-700 mb-2'>Full Name *</label>
                                    <input
                                        type='text'
                                        name='fullName'
                                        value={executiveForm.fullName}
                                        onChange={handleExecutiveFormChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block text-gray-700 mb-2'>Email *</label>
                                    <input
                                        type='email'
                                        name='email'
                                        value={executiveForm.email}
                                        onChange={handleExecutiveFormChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block text-gray-700 mb-2'>Phone</label>
                                    <input
                                        type='tel'
                                        name='phone'
                                        value={executiveForm.phone}
                                        onChange={handleExecutiveFormChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-gray-700 mb-2'>Title/Position</label>
                                    <input
                                        type='text'
                                        name='titleOrPosition'
                                        value={executiveForm.titleOrPosition}
                                        onChange={handleExecutiveFormChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-gray-700 mb-2'>Responsibilities</label>
                                <textarea
                                    name='responsibilities'
                                    value={executiveForm.responsibilities}
                                    onChange={handleExecutiveFormChange}
                                    rows={3}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                />
                            </div>

                            <div className='border-t pt-6'>
                                <h3 className='text-xl font-semibold text-gray-800 mb-4'>Address</h3>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div className='md:col-span-2'>
                                        <label className='block text-gray-700 mb-2'>Street</label>
                                        <input
                                            type='text'
                                            name='address.street'
                                            value={executiveForm.address.street}
                                            onChange={handleExecutiveFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 mb-2'>City</label>
                                        <input
                                            type='text'
                                            name='address.city'
                                            value={executiveForm.address.city}
                                            onChange={handleExecutiveFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 mb-2'>State</label>
                                        <input
                                            type='text'
                                            name='address.state'
                                            value={executiveForm.address.state}
                                            onChange={handleExecutiveFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 mb-2'>Country</label>
                                        <input
                                            type='text'
                                            name='address.country'
                                            value={executiveForm.address.country}
                                            onChange={handleExecutiveFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 mb-2'>Zip Code</label>
                                        <input
                                            type='text'
                                            name='address.zipCode'
                                            value={executiveForm.address.zipCode}
                                            onChange={handleExecutiveFormChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='border-t pt-6'>
                                <h3 className='text-xl font-semibold text-gray-800 mb-4'>Legal Agreements *</h3>
                                <div className='space-y-3'>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='profitCompensationActivationAcknowledged'
                                            checked={executiveForm.profitCompensationActivationAcknowledged}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I acknowledge the Profit Compensation Activation terms</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='nonSolicitationAccepted'
                                            checked={executiveForm.nonSolicitationAccepted}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Non-Solicitation Agreement</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='volunteerAgreementAccepted'
                                            checked={executiveForm.volunteerAgreementAccepted}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Volunteer Agreement</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='ndaAccepted'
                                            checked={executiveForm.ndaAccepted}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Non-Disclosure Agreement (NDA)</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='ipAssignmentAccepted'
                                            checked={executiveForm.ipAssignmentAccepted}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Intellectual Property Assignment</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='liabilityWaiverAccepted'
                                            checked={executiveForm.liabilityWaiverAccepted}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Liability Waiver</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='nonCompeteAccepted'
                                            checked={executiveForm.nonCompeteAccepted}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Non-Compete Agreement (Optional)</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='faithAcknowledgementAccepted'
                                            checked={executiveForm.faithAcknowledgementAccepted}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I acknowledge the Faith-Based Organization Statement (Optional)</span>
                                    </label>
                                    <label className='flex items-start'>
                                        <input
                                            type='checkbox'
                                            name='arbitrationAccepted'
                                            checked={executiveForm.arbitrationAccepted}
                                            onChange={handleExecutiveFormChange}
                                            className='mt-1 mr-3'
                                        />
                                        <span className='text-gray-700'>I accept the Arbitration Agreement</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className='block text-gray-700 mb-2'>Digital Signature (Type your full name) *</label>
                                <input
                                    type='text'
                                    name='digitalSignature'
                                    value={executiveForm.digitalSignature}
                                    onChange={handleExecutiveFormChange}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    required
                                />
                            </div>

                            <div className='flex justify-between'>
                                <button
                                    type='button'
                                    onClick={() => setStep(1)}
                                    className='px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-all'
                                >
                                    Back
                                </button>
                                <button
                                    type='submit'
                                    className='px-6 py-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all'
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg p-8 max-w-md mx-4 text-center'>
                        <div className='mb-4'>
                            <svg className='w-16 h-16 text-green-500 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                            </svg>
                        </div>
                        <h3 className='text-2xl font-bold text-gray-800 mb-2'>Forms Submitted Successfully!</h3>
                        <p className='text-gray-600 mb-4'>
                            We will process your forms and activate your DJ account soon.
                        </p>
                        <p className='text-sm text-gray-500'>Redirecting to dashboard...</p>
                    </div>
                </div>
            )}
        </section>
    );
};

export default DJFormsPage;
